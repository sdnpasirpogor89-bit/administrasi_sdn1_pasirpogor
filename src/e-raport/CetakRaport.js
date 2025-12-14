import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Download, Printer } from "lucide-react";
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
              className="bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white px-4 md:px-6 py-3 rounded-lg hover:shadow-lg flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px] text-sm md:text-base font-semibold">
              <Download size={18} />
              <span className="hidden sm:inline">
                Download Semua Raport (1 PDF)
              </span>
              <span className="sm:hidden">Download Semua</span>
            </button>
          </div>
        )}

        {!loading && siswaList.length > 0 && periode && (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full border-collapse text-xs md:text-sm min-w-[768px]">
              <thead>
                <tr className="bg-red-700 dark:bg-red-900 text-white">
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-12 md:w-16 text-center">
                    No
                  </th>
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-32 md:w-40 text-center">
                    NISN
                  </th>
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 text-center">
                    Nama Siswa
                  </th>
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-20 md:w-24 text-center">
                    Kelas
                  </th>
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-48 md:w-56 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((siswa, idx) => (
                  <tr
                    key={siswa.id}
                    className={
                      idx % 2 === 0
                        ? "bg-red-50/30 dark:bg-gray-800/50"
                        : "bg-white dark:bg-gray-900"
                    }>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 md:p-3 text-center font-medium">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 md:p-3 text-center font-mono">
                      {siswa.nisn}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 md:p-3 font-medium">
                      {siswa.nama_siswa}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 md:p-3 text-center">
                      Kelas {kelas}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handlePrint(siswa)}
                          disabled={generating}
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-3 py-2 rounded-lg hover:shadow flex items-center gap-1 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px] text-xs font-medium"
                          title="Print">
                          <Printer size={14} />
                          <span className="hidden md:inline">Print</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(siswa)}
                          disabled={generating}
                          className="bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white px-3 py-2 rounded-lg hover:shadow flex items-center gap-1 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px] text-xs font-medium"
                          title="Download PDF">
                          <Download size={14} />
                          <span className="hidden md:inline">PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 md:py-12">
            <div className="inline-flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-red-200 dark:border-red-800/30 border-t-red-700 dark:border-t-red-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-3 md:mt-4 font-medium text-sm md:text-base">
                Memuat data...
              </p>
            </div>
          </div>
        )}

        {!loading && siswaList.length === 0 && kelas && periode && (
          <div className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm md:text-base">Tidak ada siswa aktif.</p>
          </div>
        )}

        {!loading && kelas && !periode && (
          <div className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm md:text-base">
              Silakan pilih periode terlebih dahulu.
            </p>
          </div>
        )}
      </div>

      {generating && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6">
                <div className="absolute inset-0 border-4 border-red-200 dark:border-red-800/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-red-700 dark:border-t-red-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {generateProgress.action === "print" && "Menyiapkan Print..."}
                {generateProgress.action === "download" && "Membuat PDF..."}
                {generateProgress.action === "all" &&
                  "Membuat PDF Semua Siswa..."}
              </h3>
              {generateProgress.action === "all" && (
                <>
                  <p className="text-gray-600 dark:text-gray-300 text-center text-sm md:text-base mb-4">
                    {generateProgress.current} dari {generateProgress.total}{" "}
                    siswa
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                    <div
                      className="bg-red-700 dark:bg-red-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          generateProgress.total > 0
                            ? (generateProgress.current /
                                generateProgress.total) *
                              100
                            : 0
                        }%`,
                      }}></div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-500 mt-2">
                    {generateProgress.total > 0
                      ? Math.round(
                          (generateProgress.current / generateProgress.total) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </>
              )}
              {(generateProgress.action === "print" ||
                generateProgress.action === "download") && (
                <p className="text-gray-600 dark:text-gray-300 text-center text-sm md:text-base">
                  Mohon tunggu sebentar...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CetakRaport;
