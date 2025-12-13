import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { FileText, Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

function CetakRaport() {
  const [kelas, setKelas] = useState("");
  const [siswaList, setSiswaList] = useState([]);
  const [academicYear, setAcademicYear] = useState(null);
  const [schoolSettings, setSchoolSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState({
    current: 0,
    total: 0,
  });

  useEffect(() => {
    loadUserData();
    loadActiveAcademicYear();
    loadSchoolSettings();
  }, []);

  useEffect(() => {
    if (kelas && academicYear) {
      loadSiswa();
    }
  }, [kelas, academicYear]);

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

  const generateCapaianKompetensi = (nilaiData) => {
    const tercapai = [];
    const peningkatan = [];

    nilaiData.forEach((item) => {
      item.mini_erapor_detail?.forEach((detail) => {
        if (detail.status === "tercapai" && detail.tujuan_pembelajaran) {
          tercapai.push(detail.tujuan_pembelajaran.deskripsi_tp);
        } else if (
          detail.status === "perlu_peningkatan" &&
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

  const generatePDF = async (siswa) => {
    setGenerating(true);
    setGenerateProgress({ current: 1, total: 1 });

    try {
      // 1. Load data nilai
      const { data: nilaiData } = await supabase
        .from("mini_erapor")
        .select(`*, mini_erapor_detail(*, tujuan_pembelajaran(*))`)
        .eq("student_id", siswa.id)
        .eq("semester", academicYear?.semester)
        .eq("tahun_ajaran_id", academicYear?.id);

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

      // 5. Buat PDF
      const doc = new jsPDF();

      // === HALAMAN 1 ===
      let yPos = 20;

      // Header atas (3 baris)
      doc.setFontSize(10);
      doc.text("NIS/NISN", 20, yPos);
      doc.text(`: ${siswa.nisn}`, 50, yPos);
      doc.text("Fase", 140, yPos);
      doc.text(`: ${getFase(parseInt(kelas))}`, 165, yPos);
      yPos += 7;

      doc.text("Nama Sekolah", 20, yPos);
      doc.text(
        `: ${schoolSettings.school_name || "SD NEGERI 1 PASIRPOGOR"}`,
        50,
        yPos
      );
      doc.text("Semester", 140, yPos);
      doc.text(`: ${academicYear?.semester}`, 165, yPos);
      yPos += 7;

      doc.text("Alamat", 20, yPos);
      doc.text(
        `: ${schoolSettings.school_address || "Kp. Bojongloa"}`,
        50,
        yPos
      );
      doc.text("Tahun Pelajaran", 140, yPos);
      doc.text(`: ${academicYear?.year}`, 165, yPos);
      yPos += 15;

      // Judul
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("LAPORAN HASIL BELAJAR", 105, yPos, { align: "center" });
      yPos += 10;

      // Tabel mata pelajaran (10 pertama)
      const subjectsPage1 = nilaiData?.slice(0, 10) || [];
      const tableData1 = subjectsPage1.map((nilai, idx) => {
        const capaian = generateCapaianKompetensi([nilai]);
        const wrappedCapaian = doc.splitTextToSize(capaian, 90);
        return [
          idx + 1,
          nilai.mata_pelajaran,
          nilai.nilai_akhir || "-",
          wrappedCapaian,
        ];
      });

      doc.autoTable({
        startY: yPos,
        head: [["No", "Mata Pelajaran", "Nilai Akhir", "Capaian Kompetensi"]],
        body: tableData1,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 40 },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 90, valign: "top" },
        },
        margin: { left: 20, right: 20 },
      });

      // === HALAMAN 2 ===
      doc.addPage();
      yPos = 20;

      // Data siswa format vertikal
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Nama", 20, yPos);
      doc.text("NIS/NISN", 20, yPos + 7);
      doc.text("Nama Sekolah", 20, yPos + 14);
      doc.text("Alamat", 20, yPos + 21);

      doc.setFont("helvetica", "normal");
      doc.text(`: ${siswa.nama_siswa.toUpperCase()}`, 60, yPos);
      doc.text(`: ${siswa.nisn}`, 60, yPos + 7);
      doc.text(
        `: ${schoolSettings.school_name || "SD NEGERI 1 PASIRPOGOR"}`,
        60,
        yPos + 14
      );
      doc.text(
        `: ${schoolSettings.school_address || "Kp. Bojongloa"}`,
        60,
        yPos + 21
      );

      doc.setFont("helvetica", "bold");
      doc.text("Kelas", 140, yPos);
      doc.text("Fase", 140, yPos + 7);
      doc.text("Semester", 140, yPos + 14);
      doc.text("Tahun Pelajaran", 140, yPos + 21);

      doc.setFont("helvetica", "normal");
      doc.text(`: Kelas ${kelas}`, 180, yPos);
      doc.text(`: ${getFase(parseInt(kelas))}`, 180, yPos + 7);
      doc.text(`: ${academicYear?.semester}`, 180, yPos + 14);
      doc.text(`: ${academicYear?.year}`, 180, yPos + 21);

      yPos += 35;

      // Lanjutan tabel (jika ada >10 mata pelajaran)
      const subjectsPage2 = nilaiData?.slice(10) || [];
      if (subjectsPage2.length > 0) {
        const tableData2 = subjectsPage2.map((nilai, idx) => {
          const capaian = generateCapaianKompetensi([nilai]);
          const wrappedCapaian = doc.splitTextToSize(capaian, 90);
          return [
            11 + idx,
            nilai.mata_pelajaran,
            nilai.nilai_akhir || "-",
            wrappedCapaian,
          ];
        });

        doc.autoTable({
          startY: yPos,
          head: [["No", "Mata Pelajaran", "Nilai Akhir", "Capaian Kompetensi"]],
          body: tableData2,
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 40 },
            2: { cellWidth: 20, halign: "center" },
            3: { cellWidth: 90, valign: "top" },
          },
          margin: { left: 20, right: 20 },
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // Ekstrakurikuler
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Kegiatan Ekstrakurikuler", 20, yPos);
      yPos += 7;

      doc.autoTable({
        startY: yPos,
        head: [["No", "Kegiatan Ekstrakurikuler", "Predikat", "Keterangan"]],
        body: [
          ["1", "", "", ""],
          ["2", "", "", ""],
        ],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 70 },
          2: { cellWidth: 30, halign: "center" },
          3: { cellWidth: 60 },
        },
        margin: { left: 20, right: 20 },
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // Ketidakhadiran
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Sakit", 25, yPos + 7);
      doc.text(`: ${sakit} hari`, 50, yPos + 7);
      doc.text("Izin", 25, yPos + 12);
      doc.text(`: ${izin} hari`, 50, yPos + 12);
      doc.text("Tanpa Keterangan", 25, yPos + 17);
      doc.text(`: ${alpha} hari`, 50, yPos + 17);
      doc.rect(20, yPos, 85, 18);

      // Catatan wali kelas
      doc.setFont("helvetica", "bold");
      doc.text("Catatan Wali Kelas", 120, yPos);
      yPos += 7;

      doc.setFont("helvetica", "italic");
      const catatan = catatanData?.catatan_wali_kelas || "Belum ada catatan.";
      const wrappedCatatan = doc.splitTextToSize(catatan, 85);
      doc.text(wrappedCatatan, 120, yPos);

      yPos += Math.max(wrappedCatatan.length * 5, 25);

      // TTD
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const location = schoolSettings.school_location || "Bandung Barat";
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Kolom 1: Orang Tua
      doc.text("Mengetahui", 30, yPos);
      doc.text("Orang Tua/Wali,", 30, yPos + 15);
      doc.line(25, yPos + 25, 65, yPos + 25);

      // Kolom 2: Wali Kelas
      doc.text(`${location}, ${formattedDate}`, 105, yPos, { align: "center" });
      doc.text("Wali Kelas,", 105, yPos + 15, { align: "center" });
      doc.line(95, yPos + 25, 115, yPos + 25);
      doc.text(waliKelas?.full_name || "Nama Wali Kelas", 105, yPos + 35, {
        align: "center",
      });
      doc.text("NIP.", 105, yPos + 40, { align: "center" });

      // Kolom 3: Kepala Sekolah
      doc.text("Mengetahui", 170, yPos);
      doc.text("Kepala Sekolah", 170, yPos + 15);
      doc.line(160, yPos + 25, 180, yPos + 25);
      doc.text(
        schoolSettings.principal_name || "Nama Kepala Sekolah",
        170,
        yPos + 35,
        { align: "center" }
      );
      doc.text(`NIP. ${schoolSettings.principal_nip || ""}`, 170, yPos + 40, {
        align: "center",
      });

      // Save
      doc.save(
        `RAPOR_${siswa.nama_siswa}_Kelas${kelas}_${academicYear?.semester}_${academicYear?.year}.pdf`
      );
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal: " + error.message);
    }

    setGenerating(false);
    setGenerateProgress({ current: 0, total: 0 });
  };

  const generateBulkPDF = async () => {
    if (siswaList.length === 0) {
      alert("Tidak ada siswa!");
      return;
    }

    setGenerating(true);
    setGenerateProgress({ current: 0, total: siswaList.length });

    for (let i = 0; i < siswaList.length; i++) {
      await generatePDF(siswaList[i]);
      setGenerateProgress({ current: i + 1, total: siswaList.length });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setGenerating(false);
    setGenerateProgress({ current: 0, total: 0 });
    alert("Selesai!");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
          CETAK RAPORT
        </h2>

        <div className="mb-4 md:mb-6 bg-gray-50 dark:bg-gray-800 p-3 md:p-4 rounded-lg">
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

        <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6">
          <button
            onClick={generateBulkPDF}
            disabled={loading || siswaList.length === 0 || generating}
            className="bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white px-4 md:px-6 py-3 rounded-lg hover:shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px] text-sm md:text-base font-semibold">
            <Download size={18} />
            <span className="hidden sm:inline">Cetak Semua Raport</span>
            <span className="sm:hidden">Cetak Semua</span>
          </button>
        </div>

        {!loading && siswaList.length > 0 && (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full border-collapse text-xs md:text-sm min-w-[640px]">
              <thead>
                <tr className="bg-red-700 dark:bg-red-900 text-white">
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-12 md:w-16 text-center">
                    No
                  </th>
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-40 md:w-48 text-center">
                    NISN
                  </th>
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 text-center">
                    Nama Siswa
                  </th>
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-24 md:w-32 text-center">
                    Kelas
                  </th>
                  <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-32 md:w-40 text-center">
                    Cetak
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
                    <td className="border border-gray-300 dark:border-gray-700 p-1 md:p-2 text-center">
                      <button
                        onClick={() => generatePDF(siswa)}
                        disabled={generating}
                        className="bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white px-3 md:px-4 py-2 rounded-lg hover:shadow flex items-center justify-center gap-2 mx-auto disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px] text-xs md:text-sm font-medium w-full max-w-[120px]">
                        <Printer size={14} />
                        <span className="hidden xs:inline">Cetak</span>
                        <span className="xs:hidden">PDF</span>
                      </button>
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

        {!loading && siswaList.length === 0 && kelas && (
          <div className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm md:text-base">Tidak ada siswa aktif.</p>
          </div>
        )}
      </div>

      {generating && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6">
                <div className="absolute inset-0 border-4 border-red-200 dark:border-red-800/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-red-700 dark:border-t-red-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                Mencetak Raport
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm md:text-base mb-4">
                {generateProgress.current} dari {generateProgress.total} siswa
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className="bg-red-700 dark:bg-red-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      generateProgress.total > 0
                        ? (generateProgress.current / generateProgress.total) *
                          100
                        : 0
                    }%`,
                  }}></div>
              </div>
              <p className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-500 mt-2">
                {generateProgress.total > 0
                  ? Math.round(
                      (generateProgress.current / generateProgress.total) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CetakRaport;
