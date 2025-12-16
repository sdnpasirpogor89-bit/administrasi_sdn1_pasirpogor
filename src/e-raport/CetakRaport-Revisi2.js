import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Download, Printer, Edit } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

function CetakRaport() {
  const [kelas, setKelas] = useState("");
  const [periode, setPeriode] = useState(""); // mid_ganjil atau mid_genap
  const [siswaList, setSiswaList] = useState([]);
  const [academicYear, setAcademicYear] = useState(null);
  const [schoolSettings, setSchoolSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState({
    current: 0,
    total: 0,
    action: "",
  });

  // STATE UNTUK MODAL INPUT DETAIL
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [nilaiDetailList, setNilaiDetailList] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);
  const [expandedMapel, setExpandedMapel] = useState({});

  useEffect(() => {
    loadUserData();
    loadActiveAcademicYear();
    loadSchoolSettings();
  }, []);

  useEffect(() => {
    if (kelas && academicYear && periode) {
      loadSiswa();
    }
  }, [kelas, academicYear, periode]);

  const loadUserData = () => {
    const sessionData = localStorage.getItem("userSession");
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData);
        if (userData.kelas) {
          setKelas(userData.kelas);
        }
      } catch (error) {
        console.error("Error parsing session:", error);
      }
    }
  };

  const loadActiveAcademicYear = async () => {
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .eq("is_active", true)
      .single();
    setAcademicYear(data);
  };

  const loadSchoolSettings = async () => {
    const { data } = await supabase.from("school_settings").select("*");
    const settings = {};
    data?.forEach((item) => {
      settings[item.setting_key] = item.setting_value;
    });
    setSchoolSettings(settings);
  };

  const loadSiswa = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("kelas", kelas)
      .eq("is_active", true)
      .order("nama_siswa");
    setSiswaList(data || []);
    setLoading(false);
  };

  const getFase = (kelasNum) => {
    if (kelasNum <= 2) return "A";
    if (kelasNum <= 4) return "B";
    return "C";
  };

  const getPeriodeText = () => {
    return periode === "mid_ganjil"
      ? "Mid Semester Ganjil"
      : "Mid Semester Genap";
  };

  const generateCapaianKompetensi = (nilaiData) => {
    const tercapai = [];
    const peningkatan = [];

    nilaiData.forEach((item) => {
      item.nilai_eraport_detail?.forEach((detail) => {
        if (detail.status === "sudah_menguasai" && detail.tujuan_pembelajaran) {
          tercapai.push(detail.tujuan_pembelajaran.deskripsi_tp);
        } else if (
          detail.status === "perlu_perbaikan" &&
          detail.tujuan_pembelajaran
        ) {
          peningkatan.push(detail.tujuan_pembelajaran.deskripsi_tp);
        }
      });
    });

    let text = "";
    if (tercapai.length > 0) {
      text += `Mencapai kompetensi dengan baik dalam hal ${tercapai.join(
        ", "
      )}.`;
    }
    if (peningkatan.length > 0) {
      if (text) text += " ";
      text += `Perlu peningkatan dalam hal ${peningkatan.join(", ")}.`;
    }
    return text || "-";
  };

  // ========== FUNGSI MODAL INPUT DETAIL ==========
  const openDetailModal = async (siswa) => {
    setSelectedSiswa(siswa);
    setShowDetailModal(true);
    setLoadingDetail(true);

    try {
      // Load nilai dengan detail dan tujuan pembelajaran
      const { data: nilaiData } = await supabase
        .from("nilai_eraport")
        .select(
          `
          *,
          nilai_eraport_detail(
            *,
            tujuan_pembelajaran(*)
          )
        `
        )
        .eq("student_id", siswa.id)
        .eq("semester", academicYear?.semester)
        .eq("tahun_ajaran_id", academicYear?.id)
        .eq("periode", periode)
        .order("mata_pelajaran");

      // Load semua tujuan pembelajaran
      const { data: tpData } = await supabase
        .from("tujuan_pembelajaran")
        .select("*")
        .eq("class_id", siswa.kelas)
        .eq("semester", academicYear?.semester)
        .eq("tahun_ajaran", academicYear?.year)
        .order("mata_pelajaran")
        .order("urutan");

      // Gabungkan data
      const enrichedData =
        nilaiData?.map((nilai) => {
          const tpForMapel =
            tpData?.filter(
              (tp) => tp.mata_pelajaran === nilai.mata_pelajaran
            ) || [];

          const detailsMap = {};
          nilai.nilai_eraport_detail?.forEach((detail) => {
            detailsMap[detail.tujuan_pembelajaran_id] = detail.status;
          });

          const tpWithStatus = tpForMapel.map((tp) => ({
            ...tp,
            status: detailsMap[tp.id] || "belum_dinilai",
            detail_id: nilai.nilai_eraport_detail?.find(
              (d) => d.tujuan_pembelajaran_id === tp.id
            )?.id,
          }));

          return {
            ...nilai,
            tujuan_pembelajaran_list: tpWithStatus,
          };
        }) || [];

      setNilaiDetailList(enrichedData);
    } catch (error) {
      console.error("Error loading detail:", error);
      alert("Gagal memuat detail: " + error.message);
    }

    setLoadingDetail(false);
  };

  const handleStatusChange = (nilaiIndex, tpIndex, newStatus) => {
    const updated = [...nilaiDetailList];
    updated[nilaiIndex].tujuan_pembelajaran_list[tpIndex].status = newStatus;
    setNilaiDetailList(updated);
  };

  const toggleExpand = (mapelIndex) => {
    setExpandedMapel((prev) => ({
      ...prev,
      [mapelIndex]: !prev[mapelIndex],
    }));
  };

  const handleSimpanDetail = async () => {
    setSavingDetail(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const nilai of nilaiDetailList) {
        for (const tp of nilai.tujuan_pembelajaran_list) {
          if (tp.status === "belum_dinilai") continue;

          if (tp.detail_id) {
            // Update existing
            const { error } = await supabase
              .from("nilai_eraport_detail")
              .update({ status: tp.status })
              .eq("id", tp.detail_id);

            if (error) {
              console.error("Error update:", error);
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            // Insert new
            const { error } = await supabase
              .from("nilai_eraport_detail")
              .insert({
                nilai_eraport_id: nilai.id,
                tujuan_pembelajaran_id: tp.id,
                status: tp.status,
              });

            if (error) {
              console.error("Error insert:", error);
              errorCount++;
            } else {
              successCount++;
            }
          }
        }
      }

      if (errorCount > 0) {
        alert(`Tersimpan ${successCount} item, ${errorCount} gagal.`);
      } else {
        alert(`Berhasil menyimpan ${successCount} detail capaian!`);
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Gagal menyimpan: " + error.message);
    }

    setSavingDetail(false);
  };

  // Generate halaman raport untuk 1 siswa
  const addStudentPages = async (doc, siswa, isFirstStudent) => {
    try {
      // 1. Load data nilai
      const { data: nilaiData, error: nilaiError } = await supabase
        .from("nilai_eraport")
        .select(
          `
          *,
          nilai_eraport_detail(
            *,
            tujuan_pembelajaran(*)
          )
        `
        )
        .eq("student_id", siswa.id)
        .eq("semester", academicYear?.semester)
        .eq("tahun_ajaran_id", academicYear?.id)
        .eq("periode", periode)
        .order("mata_pelajaran");

      if (nilaiError) throw nilaiError;

      // 2. Load kehadiran
      const { data: kehadiranData } = await supabase
        .from("attendance")
        .select("*")
        .eq("nisn", siswa.nisn)
        .eq("tahun_ajaran", academicYear?.year);

      const sakit =
        kehadiranData?.filter((k) => k.status === "Sakit").length || 0;
      const izin =
        kehadiranData?.filter((k) => k.status === "Izin").length || 0;
      const alpha =
        kehadiranData?.filter((k) => k.status === "Alpha").length || 0;

      // 3. Load catatan
      const { data: catatanData } = await supabase
        .from("catatan_eraport")
        .select("*")
        .eq("student_id", siswa.id)
        .eq("academic_year_id", academicYear?.id)
        .eq("semester", academicYear?.semester)
        .single();

      // 4. Load wali kelas
      const { data: waliKelas } = await supabase
        .from("users")
        .select("full_name")
        .eq("kelas", kelas)
        .eq("role", "guru_kelas")
        .single();

      // Tambah halaman baru kalau bukan siswa pertama
      if (!isFirstStudent) {
        doc.addPage();
      }

      // === HALAMAN 1 ===
      let yPos = 15;

      // Header atas (Format 2 kolom)
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      // Kolom Kiri
      doc.text("Nama", 15, yPos);
      doc.text(`: ${siswa.nama_siswa.toUpperCase()}`, 45, yPos);

      // Kolom Kanan
      doc.text("Kelas", 130, yPos);
      doc.text(`: Kelas ${kelas}`, 160, yPos);
      yPos += 5;

      doc.text("NIS/NISN", 15, yPos);
      doc.text(`: ${siswa.nisn}`, 45, yPos);
      doc.text("Fase", 130, yPos);
      doc.text(`: ${getFase(parseInt(kelas))}`, 160, yPos);
      yPos += 5;

      doc.text("Nama Sekolah", 15, yPos);
      doc.text(
        `: ${schoolSettings.school_name || "SD NEGERI 1 PASIRPOGOR"}`,
        45,
        yPos
      );
      doc.text("Periode", 130, yPos);
      doc.text(`: ${getPeriodeText()}`, 160, yPos);
      yPos += 5;

      doc.text("Alamat", 15, yPos);
      doc.text(
        `: ${schoolSettings.school_address || "Kp. Bojongloa"}`,
        45,
        yPos
      );
      doc.text("Tahun Pelajaran", 130, yPos);
      doc.text(`: ${academicYear?.year}`, 160, yPos);
      yPos += 10;

      // Judul
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("LAPORAN HASIL BELAJAR", 105, yPos, { align: "center" });
      yPos += 8;

      // Tabel mata pelajaran (Halaman 1 - muat lebih banyak)
      const subjectsPage1 = nilaiData?.slice(0, 11) || [];
      const tableData1 = subjectsPage1.map((nilai, idx) => {
        const capaian = generateCapaianKompetensi([nilai]);
        return [
          idx + 1,
          nilai.mata_pelajaran,
          nilai.nilai_akhir || "-",
          capaian,
        ];
      });

      doc.autoTable({
        startY: yPos,
        head: [["No", "Mata Pelajaran", "Nilai Akhir", "Capaian Kompetensi"]],
        body: tableData1,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 45 },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 110, valign: "top" },
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
          // Footer halaman
          doc.setFontSize(8);
          doc.setFont("helvetica", "italic");
          doc.text(
            `Kelas ${kelas} | ${siswa.nama_siswa.toUpperCase()} | ${
              siswa.nisn
            }`,
            15,
            285
          );
          doc.text(`Halaman : 1`, 180, 285);
        },
      });

      // === HALAMAN 2 ===
      doc.addPage();
      yPos = 15;

      // Header Halaman 2 (sama dengan halaman 1)
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      // Kolom Kiri
      doc.text("Nama", 15, yPos);
      doc.text(`: ${siswa.nama_siswa.toUpperCase()}`, 45, yPos);

      // Kolom Kanan
      doc.text("Kelas", 130, yPos);
      doc.text(`: Kelas ${kelas}`, 160, yPos);
      yPos += 5;

      doc.text("NIS/NISN", 15, yPos);
      doc.text(`: ${siswa.nisn}`, 45, yPos);
      doc.text("Fase", 130, yPos);
      doc.text(`: ${getFase(parseInt(kelas))}`, 160, yPos);
      yPos += 5;

      doc.text("Nama Sekolah", 15, yPos);
      doc.text(
        `: ${schoolSettings.school_name || "SD NEGERI 1 PASIRPOGOR"}`,
        45,
        yPos
      );
      doc.text("Periode", 130, yPos);
      doc.text(`: ${getPeriodeText()}`, 160, yPos);
      yPos += 5;

      doc.text("Alamat", 15, yPos);
      doc.text(
        `: ${schoolSettings.school_address || "Kp. Bojongloa"}`,
        45,
        yPos
      );
      doc.text("Tahun Pelajaran", 130, yPos);
      doc.text(`: ${academicYear?.year}`, 160, yPos);
      yPos += 10;

      // Lanjutan tabel (jika ada lebih dari 11 mata pelajaran)
      const subjectsPage2 = nilaiData?.slice(11) || [];
      if (subjectsPage2.length > 0) {
        const tableData2 = subjectsPage2.map((nilai, idx) => {
          const capaian = generateCapaianKompetensi([nilai]);
          return [
            12 + idx,
            nilai.mata_pelajaran,
            nilai.nilai_akhir || "-",
            capaian,
          ];
        });

        doc.autoTable({
          startY: yPos,
          head: [["No", "Mata Pelajaran", "Nilai Akhir", "Capaian Kompetensi"]],
          body: tableData2,
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            cellWidth: "wrap",
          },
          headStyles: {
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 45 },
            2: { cellWidth: 20, halign: "center" },
            3: { cellWidth: 110, valign: "top" },
          },
          margin: { left: 15, right: 15 },
        });

        yPos = doc.lastAutoTable.finalY + 8;
      }

      // Ekstrakurikuler
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Kegiatan Ekstrakurikuler", 15, yPos);
      yPos += 5;

      doc.autoTable({
        startY: yPos,
        head: [["No", "Kegiatan Ekstrakurikuler", "Predikat", "Keterangan"]],
        body: [["1", "", "", ""]],
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 75 },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: 75 },
        },
        margin: { left: 15, right: 15 },
      });

      yPos = doc.lastAutoTable.finalY + 8;

      // Grid Layout: Ketidakhadiran (kiri) & Catatan Wali Kelas (kanan)
      const boxStartY = yPos;
      const boxHeight = 25;

      // Box Ketidakhadiran (kiri)
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.rect(15, boxStartY, 85, boxHeight); // Border
      doc.text("Sakit", 18, boxStartY + 6);
      doc.text(`: ${sakit} hari`, 45, boxStartY + 6);
      doc.text("Izin", 18, boxStartY + 12);
      doc.text(`: ${izin} hari`, 45, boxStartY + 12);
      doc.text("Tanpa Keterangan", 18, boxStartY + 18);
      doc.text(`: ${alpha} hari`, 45, boxStartY + 18);

      // Box Catatan Wali Kelas (kanan)
      doc.rect(105, boxStartY, 90, boxHeight); // Border
      doc.setFont("helvetica", "bold");
      doc.text("Catatan Wali Kelas", 108, boxStartY + 6);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      const catatan = catatanData?.catatan_wali_kelas || "Belum ada catatan.";
      const wrappedCatatan = doc.splitTextToSize(catatan, 82);
      doc.text(wrappedCatatan, 108, boxStartY + 12);

      yPos = boxStartY + boxHeight + 10;

      // TTD (3 Kolom: Orang Tua, Wali Kelas, Kepala Sekolah)
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      const location = schoolSettings.school_location || "Bandung Barat";
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const ttdY = yPos;

      // Kolom 1: Orang Tua/Wali (Kiri)
      doc.text("Mengetahui", 30, ttdY, { align: "center" });
      doc.text("Orang Tua/Wali,", 30, ttdY + 5, { align: "center" });
      doc.line(18, ttdY + 20, 42, ttdY + 20); // Garis TTD
      doc.text(".........................", 30, ttdY + 23, { align: "center" });

      // Kolom 2: Wali Kelas (Tengah)
      doc.text(`${location}, ${formattedDate}`, 105, ttdY, { align: "center" });
      doc.text("Wali Kelas,", 105, ttdY + 5, { align: "center" });
      doc.line(93, ttdY + 20, 117, ttdY + 20); // Garis TTD
      doc.setFont("helvetica", "bold");
      doc.text(waliKelas?.full_name || "Nama Wali Kelas", 105, ttdY + 23, {
        align: "center",
      });
      doc.setFont("helvetica", "normal");
      doc.text("NIP. -", 105, ttdY + 27, { align: "center" });

      // Kolom 3: Kepala Sekolah (Kanan)
      doc.text("Mengetahui", 170, ttdY, { align: "center" });
      doc.text("Kepala Sekolah", 170, ttdY + 5, { align: "center" });
      doc.line(158, ttdY + 20, 182, ttdY + 20); // Garis TTD
      doc.setFont("helvetica", "bold");
      doc.text(
        schoolSettings.principal_name || "Nama Kepala Sekolah",
        170,
        ttdY + 23,
        { align: "center" }
      );
      doc.setFont("helvetica", "normal");
      doc.text(`NIP. ${schoolSettings.principal_nip || "-"}`, 170, ttdY + 27, {
        align: "center",
      });

      // Footer halaman 2
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Kelas ${kelas} | ${siswa.nama_siswa.toUpperCase()} | ${siswa.nisn}`,
        15,
        285
      );
      doc.text(`Halaman : 2`, 180, 285);

      return doc;
    } catch (error) {
      console.error("Error adding student pages:", error);
      throw error;
    }
  };

  // Print langsung ke printer (1 siswa)
  const handlePrint = async (siswa) => {
    setGenerating(true);
    setGenerateProgress({ current: 1, total: 1, action: "print" });

    try {
      const doc = new jsPDF();
      await addStudentPages(doc, siswa, true);

      // Buka di tab baru untuk print
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal print: " + error.message);
    }

    setGenerating(false);
    setGenerateProgress({ current: 0, total: 0, action: "" });
  };

  // Download PDF per siswa
  const handleDownloadPDF = async (siswa) => {
    setGenerating(true);
    setGenerateProgress({ current: 1, total: 1, action: "download" });

    try {
      const doc = new jsPDF();
      await addStudentPages(doc, siswa, true);
      doc.save(
        `RAPOR_${siswa.nama_siswa}_Kelas${kelas}_${getPeriodeText()}_${
          academicYear?.year
        }.pdf`
      );
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal download: " + error.message);
    }

    setGenerating(false);
    setGenerateProgress({ current: 0, total: 0, action: "" });
  };

  // Download SEMUA siswa dalam 1 PDF
  const handleDownloadAllPDF = async () => {
    if (siswaList.length === 0) {
      alert("Tidak ada siswa!");
      return;
    }

    if (!periode) {
      alert("Pilih periode terlebih dahulu!");
      return;
    }

    setGenerating(true);
    setGenerateProgress({ current: 0, total: siswaList.length, action: "all" });

    try {
      const doc = new jsPDF();

      for (let i = 0; i < siswaList.length; i++) {
        const siswa = siswaList[i];

        setGenerateProgress({
          current: i + 1,
          total: siswaList.length,
          action: "all",
        });

        await addStudentPages(doc, siswa, i === 0);

        // Delay biar nggak overload
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Save 1 PDF dengan semua siswa
      doc.save(
        `RAPOR_Kelas${kelas}_${getPeriodeText()}_${academicYear?.year}.pdf`
      );

      alert("Berhasil! File PDF telah didownload.");
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal download: " + error.message);
    }

    setGenerating(false);
    setGenerateProgress({ current: 0, total: 0, action: "" });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
          CETAK RAPORT
        </h2>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6 bg-gray-50 dark:bg-gray-800 p-3 md:p-4 rounded-lg">
          <div>
            <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Kelas
            </label>
            <input
              type="text"
              value={kelas ? `Kelas ${kelas}` : ""}
              disabled
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-red-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Periode
            </label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400">
              <option value="">-- Pilih Periode --</option>
              <option value="mid_ganjil">Mid Semester Ganjil</option>
              <option value="mid_genap">Mid Semester Genap</option>
            </select>
          </div>
        </div>

        {/* Tombol Download Semua - DI KANAN */}
        {!loading && siswaList.length > 0 && periode && (
          <div className="flex justify-end mb-4 md:mb-6">
            <button
              onClick={handleDownloadAllPDF}
              disabled={generating}
              className="bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white px-4 py-3 rounded-lg hover:shadow flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px] font-medium">
              <Download size={18} />
              <span className="hidden md:inline">Download Semua PDF</span>
              <span className="md:hidden">All PDF</span>
            </button>
          </div>
        )}

        {/* Progress Indicator */}
        {generating && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                {generateProgress.action === "all"
                  ? "Membuat PDF untuk semua siswa..."
                  : generateProgress.action === "print"
                  ? "Menyiapkan print..."
                  : "Menyiapkan download..."}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {generateProgress.current} / {generateProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    generateProgress.total > 0
                      ? (generateProgress.current / generateProgress.total) *
                        100
                      : 0
                  }%`,
                }}></div>
            </div>
          </div>
        )}

        {/* Tabel Siswa */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Memuat data siswa...
            </p>
          </div>
        ) : siswaList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
              <thead>
                <tr className="bg-red-600 dark:bg-red-800 text-white">
                  <th className="p-3 border border-gray-300 dark:border-gray-700">
                    No
                  </th>
                  <th className="p-3 border border-gray-300 dark:border-gray-700">
                    NISN
                  </th>
                  <th className="p-3 border border-gray-300 dark:border-gray-700">
                    Nama Siswa
                  </th>
                  <th className="p-3 border border-gray-300 dark:border-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((siswa, index) => (
                  <tr
                    key={siswa.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3 border border-gray-300 dark:border-gray-700 text-center">
                      {index + 1}
                    </td>
                    <td className="p-3 border border-gray-300 dark:border-gray-700">
                      {siswa.nisn}
                    </td>
                    <td className="p-3 border border-gray-300 dark:border-gray-700">
                      {siswa.nama_siswa}
                    </td>
                    <td className="p-3 border border-gray-300 dark:border-gray-700">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handlePrint(siswa)}
                          disabled={generating}
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-3 py-2 rounded-lg hover:shadow flex items-center gap-1 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px] text-xs font-medium"
                          title="Print Raport">
                          <Printer size={14} />
                          <span className="hidden md:inline">Print</span>
                        </button>

                        <button
                          onClick={() => handleDownloadPDF(siswa)}
                          disabled={generating}
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-3 py-2 rounded-lg hover:shadow flex items-center gap-1 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px] text-xs font-medium"
                          title="Download PDF">
                          <Download size={14} />
                          <span className="hidden md:inline">PDF</span>
                        </button>

                        {/* TOMBOL "EDIT DETAIL" */}
                        <button
                          onClick={() => openDetailModal(siswa)}
                          disabled={generating}
                          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white px-3 py-2 rounded-lg hover:shadow flex items-center gap-1 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px] text-xs font-medium"
                          title="Edit Detail Capaian">
                          <Edit size={14} />
                          <span className="hidden md:inline">Detail</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              {periode
                ? "Tidak ada data siswa untuk kelas ini."
                : "Pilih periode terlebih dahulu."}
            </p>
          </div>
        )}

        {/* MODAL INPUT DETAIL CAPAIAN */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header Modal */}
              <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-xl flex justify-between items-center z-10">
                <div>
                  <h3 className="text-2xl font-bold">
                    Input Detail Capaian Kompetensi
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">
                    {selectedSiswa?.nama_siswa} - {selectedSiswa?.nisn}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg font-medium">
                  Tutup
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6">
                {loadingDetail ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Memuat data...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nilaiDetailList.map((nilai, nilaiIndex) => (
                      <div
                        key={nilai.id}
                        className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Header Mata Pelajaran */}
                        <div
                          onClick={() => toggleExpand(nilaiIndex)}
                          className="bg-blue-600 text-white p-4 cursor-pointer hover:bg-blue-700 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-lg">
                              {nilai.mata_pelajaran}
                            </h4>
                            <p className="text-sm text-blue-100">
                              Nilai: {nilai.nilai_akhir || "-"}
                            </p>
                          </div>
                          <span className="text-sm bg-blue-500 px-3 py-1 rounded-full">
                            {nilai.tujuan_pembelajaran_list?.length || 0} TP
                          </span>
                        </div>

                        {/* Detail TP */}
                        {expandedMapel[nilaiIndex] && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 space-y-3">
                            {nilai.tujuan_pembelajaran_list?.map(
                              (tp, tpIndex) => (
                                <div
                                  key={tp.id}
                                  className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                                      {tp.urutan || tpIndex + 1}
                                    </div>
                                    <div className="flex-grow">
                                      <p className="text-gray-800 dark:text-gray-200 mb-2">
                                        {tp.deskripsi_tp}
                                      </p>
                                      <div className="flex gap-2 flex-wrap">
                                        <button
                                          onClick={() =>
                                            handleStatusChange(
                                              nilaiIndex,
                                              tpIndex,
                                              "sudah_menguasai"
                                            )
                                          }
                                          className={`px-4 py-2 rounded-lg font-medium ${
                                            tp.status === "sudah_menguasai"
                                              ? "bg-green-600 text-white"
                                              : "bg-green-100 text-green-700 hover:bg-green-200"
                                          }`}>
                                          ✓ Sudah Menguasai
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleStatusChange(
                                              nilaiIndex,
                                              tpIndex,
                                              "perlu_perbaikan"
                                            )
                                          }
                                          className={`px-4 py-2 rounded-lg font-medium ${
                                            tp.status === "perlu_perbaikan"
                                              ? "bg-yellow-600 text-white"
                                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                          }`}>
                                          ⚠ Perlu Perbaikan
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleStatusChange(
                                              nilaiIndex,
                                              tpIndex,
                                              "belum_dinilai"
                                            )
                                          }
                                          className={`px-4 py-2 rounded-lg font-medium ${
                                            tp.status === "belum_dinilai"
                                              ? "bg-gray-600 text-white"
                                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                          }`}>
                                          Reset
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Tombol Simpan */}
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSimpanDetail}
                        disabled={savingDetail}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {savingDetail ? "Menyimpan..." : "Simpan Semua"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CetakRaport;
