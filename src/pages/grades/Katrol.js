import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  Calculator,
  Download,
  AlertCircle,
  CheckCircle,
  Loader,
  TrendingUp,
  Settings,
  Save,
  Calendar,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import KatrolTable from "./KatrolTable";
import {
  groupDataByNISN,
  prosesKatrolSemua,
  hitungNilaiAkhir,
  exportToExcelMultiSheet,
} from "./Utils";
// ✅ IMPORT ACADEMIC YEAR SERVICE
import {
  getActiveAcademicInfo,
  getAllSemestersInActiveYear,
  getSemesterById,
} from "../../services/academicYearService";

const Katrol = ({ userData: initialUserData }) => {
  const [userData, setUserData] = useState(initialUserData);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(""); // ✅ SEMESTER STATE
  const [availableSemesters, setAvailableSemesters] = useState([]); // ✅ SEMESTER OPTIONS
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataNilai, setDataNilai] = useState([]);
  const [dataGrouped, setDataGrouped] = useState([]);
  const [hasilKatrol, setHasilKatrol] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [kkm, setKkm] = useState(70);
  const [nilaiMaksimal, setNilaiMaksimal] = useState(90);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [originalKkm, setOriginalKkm] = useState(70);
  const [originalNilaiMaksimal, setOriginalNilaiMaksimal] = useState(90);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // 🔥 BARU: State untuk deteksi kolom NH dinamis - DEFAULT 3 NH
  const [availableNH, setAvailableNH] = useState(["NH1", "NH2", "NH3"]);

  // 🔥 BARU: State untuk fix bug input KKM (problem "075")
  const [kkmInput, setKkmInput] = useState("70");
  const [nilaiMaksimalInput, setNilaiMaksimalInput] = useState("90");

  const mataPelajaranGuruKelas = [
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "Bahasa Sunda",
    "Matematika",
    "IPAS",
    "Pendidikan Pancasila",
    "Seni Budaya",
    "Pendidikan Agama dan Budi Pekerti (PAIBP)",
    "Pendidikan Jasmani Olahraga Kesehatan",
  ];

  // ✅ FETCH ACTIVE SEMESTER ON MOUNT
  useEffect(() => {
    const fetchActiveSemester = async () => {
      try {
        const academicInfo = await getActiveAcademicInfo();
        const allSemesters = await getAllSemestersInActiveYear();

        console.log(
          "✅ Active academic year:",
          academicInfo.year,
          academicInfo.activeSemester
        );

        setAvailableSemesters(allSemesters);

        // Auto-set semester aktif
        if (academicInfo.activeSemesterId) {
          setSelectedSemester(academicInfo.activeSemesterId);
        }
      } catch (error) {
        console.error("Error fetching active semester:", error);
        showMessage("Gagal memuat semester aktif", "error");
      }
    };

    fetchActiveSemester();
  }, []);

  useEffect(() => {
    const fetchCompleteUserData = async () => {
      if (!userData?.kelas && userData?.username) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", userData.username)
            .single();

          if (error) throw error;

          if (data) {
            const completeUserData = {
              ...userData,
              ...data,
              name: data.full_name || userData.name,
            };
            setUserData(completeUserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          showMessage("Gagal memuat data user", "error");
        }
      }
    };

    fetchCompleteUserData();
  }, [userData?.username]);

  useEffect(() => {
    if (!userData?.role) return;

    if (userData.role === "guru_kelas") {
      setAvailableClasses([userData.kelas]);
      setSelectedClass(userData.kelas);
      setAvailableSubjects(mataPelajaranGuruKelas);
    } else if (userData.role === "guru_mapel") {
      const kelasList = userData.kelas?.split(",").map((k) => k.trim()) || [];
      setAvailableClasses(kelasList);
      setAvailableSubjects([userData.mata_pelajaran]);
      setSelectedSubject(userData.mata_pelajaran);
    }
  }, [userData]);

  useEffect(() => {
    const fetchNilaiSettings = async () => {
      if (!selectedSubject || !selectedClass) return;

      setLoadingSettings(true);
      try {
        const { data, error } = await supabase
          .from("nilai_settings")
          .select("kkm, nilai_maksimal")
          .eq("kelas", selectedClass)
          .eq("mata_pelajaran", selectedSubject)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            console.log("Settings belum ada, pakai default");
            setKkm(70);
            setNilaiMaksimal(90);
            setKkmInput("70");
            setNilaiMaksimalInput("90");
            setOriginalKkm(70);
            setOriginalNilaiMaksimal(90);
          } else {
            throw error;
          }
        } else if (data) {
          setKkm(data.kkm);
          setNilaiMaksimal(data.nilai_maksimal);
          setKkmInput(String(data.kkm));
          setNilaiMaksimalInput(String(data.nilai_maksimal));
          setOriginalKkm(data.kkm);
          setOriginalNilaiMaksimal(data.nilai_maksimal);
          console.log("✅ Settings loaded:", data);
        }
        setSettingsChanged(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchNilaiSettings();
  }, [selectedClass, selectedSubject]);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleKkmChange = (value) => {
    setKkmInput(value);

    const numValue = value === "" ? 0 : parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setKkm(numValue);
      setSettingsChanged(
        numValue !== originalKkm || nilaiMaksimal !== originalNilaiMaksimal
      );
    }
  };

  const handleNilaiMaksimalChange = (value) => {
    setNilaiMaksimalInput(value);

    const numValue = value === "" ? 0 : parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setNilaiMaksimal(numValue);
      setSettingsChanged(
        kkm !== originalKkm || numValue !== originalNilaiMaksimal
      );
    }
  };

  const saveSettings = async () => {
    if (!selectedClass || !selectedSubject) {
      showMessage("Pilih kelas dan mata pelajaran terlebih dahulu", "error");
      return;
    }

    if (kkm > nilaiMaksimal) {
      showMessage("KKM tidak boleh lebih besar dari Nilai Maksimal!", "error");
      return;
    }

    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from("nilai_settings")
        .update({
          kkm: kkm,
          nilai_maksimal: nilaiMaksimal,
          updated_at: new Date().toISOString(),
        })
        .eq("kelas", selectedClass)
        .eq("mata_pelajaran", selectedSubject);

      if (error) throw error;

      setOriginalKkm(kkm);
      setOriginalNilaiMaksimal(nilaiMaksimal);
      setSettingsChanged(false);
      showMessage("Pengaturan berhasil disimpan!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("Gagal menyimpan pengaturan", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // ✅ UPDATED: fetchDataNilai dengan semester filter
  const fetchDataNilai = async () => {
    if (!selectedClass || !selectedSubject || !selectedSemester) {
      showMessage(
        "Pilih semester, kelas dan mata pelajaran terlebih dahulu",
        "error"
      );
      return;
    }

    // Get semester info
    const semesterData = await getSemesterById(selectedSemester);
    if (!semesterData) {
      showMessage("Semester tidak ditemukan", "error");
      return;
    }

    console.log(
      "📅 Loading katrol for semester:",
      semesterData.semester,
      semesterData.year
    );

    setLoading(true);
    try {
      console.log(
        `📄 Mengambil data untuk kelas ${selectedClass}, mapel ${selectedSubject}`
      );

      // 1️⃣ CEK DULU: Ada data katrol atau ngga? (FILTERED BY SEMESTER)
      const { data: katrolData, error: katrolError } = await supabase
        .from("nilai_katrol")
        .select("*")
        .eq("kelas", selectedClass)
        .eq("mata_pelajaran", selectedSubject)
        .eq("semester", semesterData.semester)
        .eq("tahun_ajaran", semesterData.year);

      if (katrolError) {
        console.error("Error cek katrol:", katrolError);
      }

      // 2️⃣ KALAU ADA DATA KATROL, LOAD ITU!
      if (katrolData && katrolData.length > 0) {
        console.log(
          `✅ Ditemukan ${katrolData.length} data KATROL (sudah diproses)`
        );

        // 🔥 PERBAIKAN: Ambil juga nilai ASLI untuk perbandingan (FILTERED BY SEMESTER)
        const { data: nilaiAsliData, error: nilaiAsliError } = await supabase
          .from("nilai")
          .select("*")
          .eq("kelas", selectedClass)
          .eq("mata_pelajaran", selectedSubject)
          .eq("semester", semesterData.semester)
          .eq("tahun_ajaran", semesterData.year);

        if (nilaiAsliError) {
          console.error("Error mengambil nilai asli:", nilaiAsliError);
        }

        // Format data katrol DENGAN NILAI ASLI
        const formattedKatrol = katrolData.map((item) => {
          // Cari nilai asli untuk siswa ini
          const nilaiAsliSiswa =
            nilaiAsliData?.filter((n) => n.nisn === item.nisn) || [];

          // Inisialisasi nilai asli
          const nilaiAsli = {
            NH1: null,
            NH2: null,
            NH3: null,
            // ❌ NH4 & NH5 DIHAPUS
            UTS: null,
            UAS: null,
          };

          // Isi nilai asli dari database
          nilaiAsliSiswa.forEach((nilaiItem) => {
            if (nilaiItem.jenis_nilai === "NH1")
              nilaiAsli.NH1 = nilaiItem.nilai;
            if (nilaiItem.jenis_nilai === "NH2")
              nilaiAsli.NH2 = nilaiItem.nilai;
            if (nilaiItem.jenis_nilai === "NH3")
              nilaiAsli.NH3 = nilaiItem.nilai;
            // ❌ NH4 & NH5 DIHAPUS
            if (nilaiItem.jenis_nilai === "UTS")
              nilaiAsli.UTS = nilaiItem.nilai;
            if (nilaiItem.jenis_nilai === "UAS")
              nilaiAsli.UAS = nilaiItem.nilai;
          });

          return {
            nisn: item.nisn,
            nama_siswa: item.nama_siswa,
            nilai: nilaiAsli, // ✅ NILAI ASLI DIPERTAHANKAN
            nilai_katrol: {
              NH1: item.nh1_katrol,
              NH2: item.nh2_katrol,
              NH3: item.nh3_katrol,
              // ❌ NH4 & NH5 DIHAPUS
              UTS: item.uts_katrol,
              UAS: item.uas_katrol,
            },
            rata_NH_katrol: item.rata_nh_katrol,
            nilai_akhir_asli: item.nilai_mentah,
            nilai_akhir_katrol: item.nilai_akhir,
            status: item.status,
          };
        });

        formattedKatrol.sort((a, b) =>
          a.nama_siswa.localeCompare(b.nama_siswa)
        );

        setHasilKatrol(formattedKatrol);
        setShowPreview(false);
        setDataNilai([]);
        setDataGrouped([]);

        showMessage(
          `✅ Berhasil memuat ${formattedKatrol.length} data nilai KATROL (sudah diproses sebelumnya) + NILAI ASLI`,
          "success"
        );
        return; // STOP DI SINI, jangan load nilai original
      }

      // 3️⃣ KALAU BELUM ADA DATA KATROL, BARU LOAD NILAI ORIGINAL
      console.log(`ℹ️ Tidak ada data katrol, memuat nilai ORIGINAL...`);

      const { data: siswaData, error: siswaError } = await supabase
        .from("students")
        .select("nisn, nama_siswa")
        .eq("kelas", selectedClass)
        .eq("is_active", true)
        .order("nama_siswa", { ascending: true });

      if (siswaError) throw siswaError;

      if (!siswaData || siswaData.length === 0) {
        showMessage(`Tidak ada siswa di kelas ${selectedClass}`, "error");
        setDataNilai([]);
        setDataGrouped([]);
        setHasilKatrol([]);
        setShowPreview(false);
        return;
      }

      console.log(`✅ Ditemukan ${siswaData.length} siswa`);

      // ✅ FILTER NILAI BY SEMESTER
      const { data: nilaiData, error: nilaiError } = await supabase
        .from("nilai")
        .select("*")
        .eq("kelas", selectedClass)
        .eq("mata_pelajaran", selectedSubject)
        .eq("semester", semesterData.semester)
        .eq("tahun_ajaran", semesterData.year);

      if (nilaiError) throw nilaiError;

      console.log(`✅ Ditemukan ${nilaiData?.length || 0} data nilai`);

      // 🔥 BARU: Deteksi kolom NH yang ada datanya
      const nhColumns = new Set();
      if (nilaiData && nilaiData.length > 0) {
        nilaiData.forEach((item) => {
          if (item.jenis_nilai?.startsWith("NH")) {
            nhColumns.add(item.jenis_nilai);
          }
        });
      }

      // Sort NH columns (NH1, NH2, NH3, dst)
      const detectedNH = Array.from(nhColumns).sort();

      // Set available NH, default ke semua kalau ga ada data
      setAvailableNH(
        detectedNH.length > 0 ? detectedNH : ["NH1", "NH2", "NH3", "NH4", "NH5"]
      );

      console.log(
        `📊 Kolom NH terdeteksi:`,
        detectedNH.length > 0 ? detectedNH : "Semua (NH1-NH5)"
      );

      const previewData = siswaData.map((siswa) => {
        const nilaiSiswa =
          nilaiData?.filter((n) => n.nisn === siswa.nisn) || [];

        return {
          nisn: siswa.nisn,
          nama_siswa: siswa.nama_siswa,
          kelas: selectedClass,
          mata_pelajaran: selectedSubject,
          nh1: null,
          nh2: null,
          nh3: null,
          nh4: null,
          nh5: null,
          uts: null,
          uas: null,
        };
      });

      if (nilaiData && nilaiData.length > 0) {
        nilaiData.forEach((item) => {
          const siswaIndex = previewData.findIndex((s) => s.nisn === item.nisn);
          if (siswaIndex !== -1) {
            if (item.jenis_nilai === "NH1")
              previewData[siswaIndex].nh1 = item.nilai;
            if (item.jenis_nilai === "NH2")
              previewData[siswaIndex].nh2 = item.nilai;
            if (item.jenis_nilai === "NH3")
              previewData[siswaIndex].nh3 = item.nilai;
            if (item.jenis_nilai === "NH4")
              previewData[siswaIndex].nh4 = item.nilai;
            if (item.jenis_nilai === "NH5")
              previewData[siswaIndex].nh5 = item.nilai;
            if (item.jenis_nilai === "UTS")
              previewData[siswaIndex].uts = item.nilai;
            if (item.jenis_nilai === "UAS")
              previewData[siswaIndex].uas = item.nilai;
          }
        });
      }

      setDataNilai(previewData);

      const dataForGrouping = previewData.map((item) => ({
        nisn: item.nisn,
        nama_siswa: item.nama_siswa,
        nilai: {
          NH1: item.nh1,
          NH2: item.nh2,
          NH3: item.nh3,
          NH4: item.nh4,
          NH5: item.nh5,
          UTS: item.uts,
          UAS: item.uas,
        },
        nilai_katrol: {},
      }));

      setDataGrouped(dataForGrouping);
      setShowPreview(true);
      setHasilKatrol([]);

      const nilaiCount = nilaiData?.length || 0;
      showMessage(
        `✅ Berhasil memuat ${siswaData.length} siswa dengan ${nilaiCount} data nilai ORIGINAL (belum dikatrol)`,
        "success"
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      showMessage("Gagal memuat data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const prosesKatrol = () => {
    // Cek apakah ada data untuk diproses
    const dataToProse = dataGrouped.length > 0 ? dataGrouped : hasilKatrol;

    if (dataToProse.length === 0) {
      showMessage("Tidak ada data untuk diproses!", "error");
      return;
    }

    setProcessing(true);
    try {
      const hasil = prosesKatrolSemua(
        dataToProse,
        kkm,
        nilaiMaksimal,
        availableNH
      );
      console.log("🔍 Hasil katrol:", hasil); // ✅ DEBUG
      setHasilKatrol(hasil);
      setShowPreview(false);
      showMessage(
        `✅ Berhasil memproses ${hasil.length} data nilai! Silakan review hasil katrol.`,
        "success"
      );
    } catch (error) {
      console.error("Error processing katrol:", error);
      showMessage("Gagal memproses katrol: " + error.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  // ✅ UPDATED: saveHasilKatrol dengan semester info
  const saveHasilKatrol = async () => {
    if (hasilKatrol.length === 0) {
      showMessage("Tidak ada hasil katrol untuk disimpan!", "error");
      return;
    }

    if (!selectedSemester) {
      showMessage("Pilih semester terlebih dahulu!", "error");
      return;
    }

    // Get semester info
    const semesterData = await getSemesterById(selectedSemester);
    if (!semesterData) {
      showMessage("Semester tidak ditemukan!", "error");
      return;
    }

    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menyimpan ${hasilKatrol.length} hasil katrol?\n\n` +
        `Kelas: ${selectedClass}\n` +
        `Mata Pelajaran: ${selectedSubject}\n` +
        `Semester: ${semesterData.semester === 1 ? "Ganjil" : "Genap"}\n\n` +
        `Data yang sudah ada akan di-update.`
    );

    if (!isConfirmed) return;

    setSaving(true);
    try {
      const dataToSave = hasilKatrol.map((item) => ({
        nisn: item.nisn,
        nama_siswa: item.nama_siswa,
        kelas: parseInt(selectedClass),
        mata_pelajaran: selectedSubject,
        semester: semesterData.semester,
        tahun_ajaran: semesterData.year,
        nh1_katrol: item.nilai_katrol.NH1 || null,
        nh2_katrol: item.nilai_katrol.NH2 || null,
        nh3_katrol: item.nilai_katrol.NH3 || null,
        // ❌ NH4 & NH5 DIHAPUS - kolom udah ga ada di database
        uts_katrol: item.nilai_katrol.UTS || null,
        uas_katrol: item.nilai_katrol.UAS || null,
        rata_nh_katrol: item.rata_NH_katrol || 0,
        nilai_mentah: item.nilai_akhir_asli || 0,
        nilai_akhir: item.nilai_akhir_katrol || 0,
        status: item.status || "Belum Diproses",
        kkm: kkm,
        nilai_maksimal: nilaiMaksimal,
        min_nilai:
          Math.min(...Object.values(item.nilai).filter((v) => v !== null)) || 0,
        max_nilai:
          Math.max(...Object.values(item.nilai).filter((v) => v !== null)) || 0,
        processed_by: userData.username || "system",
        processed_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("nilai_katrol")
        .upsert(dataToSave, {
          onConflict: "nisn,kelas,mata_pelajaran,semester,tahun_ajaran",
        })
        .select();

      if (error) throw error;

      const successCount = data?.length || hasilKatrol.length;

      // ✅ ALERT SUCCESS
      alert(
        `✅ BERHASIL!\n\n${successCount} hasil katrol berhasil disimpan ke database!`
      );

      showMessage(
        `✅ ${successCount} hasil katrol berhasil disimpan ke database!`,
        "success"
      );

      // Refresh data setelah save
      await fetchDataNilai();
    } catch (error) {
      console.error("Error saving katrol:", error);
      showMessage("Gagal menyimpan hasil katrol: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (hasilKatrol.length === 0) {
      showMessage("Tidak ada data untuk diekspor!", "error");
      return;
    }

    setExporting(true);
    try {
      await exportToExcelMultiSheet(
        hasilKatrol,
        selectedClass,
        selectedSubject,
        kkm,
        nilaiMaksimal,
        availableNH
      );
      showMessage("Data berhasil diekspor ke Excel!", "success");
    } catch (error) {
      console.error("Error exporting:", error);
      showMessage("Gagal mengekspor data: " + error.message, "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Message Alert */}
        {message.text && (
          <div
            className={`p-4 rounded-lg flex items-center space-x-2 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
            }`}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Filter Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ✅ SEMESTER SELECTOR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setDataNilai([]);
                  setDataGrouped([]);
                  setHasilKatrol([]);
                  setShowPreview(false);
                }}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">Pilih Semester</option>
                {availableSemesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    Semester {sem.semester === 1 ? "Ganjil" : "Genap"}
                    {sem.is_active ? " (Aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <GraduationCap className="w-4 h-4 inline mr-2" />
                Kelas
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setDataNilai([]);
                  setDataGrouped([]);
                  setHasilKatrol([]);
                  setShowPreview(false);
                }}
                disabled={userData.role === "guru_kelas"}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed">
                <option value="">Pilih Kelas</option>
                {availableClasses.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    Kelas {kelas}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Mata Pelajaran
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setDataNilai([]);
                  setDataGrouped([]);
                  setHasilKatrol([]);
                  setShowPreview(false);
                }}
                disabled={userData.role === "guru_mapel"}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed">
                <option value="">Pilih Mata Pelajaran</option>
                {availableSubjects.map((mapel) => (
                  <option key={mapel} value={mapel}>
                    {mapel}
                  </option>
                ))}
              </select>
            </div>

            {/* Load Button */}
            <div className="flex items-end">
              <button
                onClick={fetchDataNilai}
                disabled={
                  !selectedClass ||
                  !selectedSubject ||
                  !selectedSemester ||
                  loading
                }
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    <span>Muat Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        {selectedClass && selectedSubject && selectedSemester && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              {settingsChanged && (
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2">
                  {savingSettings ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  KKM
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={kkmInput}
                  onChange={(e) => handleKkmChange(e.target.value)}
                  disabled={loadingSettings}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nilai Maksimal Katrol
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={nilaiMaksimalInput}
                  onChange={(e) => handleNilaiMaksimalChange(e.target.value)}
                  disabled={loadingSettings}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="90"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(showPreview || hasilKatrol.length > 0) && (
          <div className="flex flex-wrap gap-3">
            {showPreview && (
              <button
                onClick={prosesKatrol}
                disabled={processing || dataGrouped.length === 0}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2">
                {processing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    <span>Proses Katrol</span>
                  </>
                )}
              </button>
            )}

            {hasilKatrol.length > 0 && (
              <>
                <button
                  onClick={prosesKatrol}
                  disabled={processing}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2">
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" />
                      <span>Proses Katrol Ulang</span>
                    </>
                  )}
                </button>

                <button
                  onClick={saveHasilKatrol}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2">
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Simpan ke Database</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2">
                  {exporting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Export Excel</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Table */}
        {(showPreview || hasilKatrol.length > 0) && (
          <KatrolTable
            data={showPreview ? dataGrouped : hasilKatrol}
            isPreview={showPreview}
            kkm={kkm}
            nilaiMaksimal={nilaiMaksimal}
            availableNH={availableNH}
          />
        )}

        {/* Empty State */}
        {!selectedClass || !selectedSubject || !selectedSemester ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
            <Calculator className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              Pilih Filter
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              Silakan pilih semester, kelas, dan mata pelajaran untuk memulai
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Katrol;
