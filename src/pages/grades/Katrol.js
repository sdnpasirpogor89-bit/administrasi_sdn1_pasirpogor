import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  Calculator,
  Download,
  AlertCircle,
  CheckCircle,
  Loader,
  TrendingUp,
  Eye,
  Settings,
  Save,
} from "lucide-react";
import KatrolTable from "./KatrolTable";
import {
  groupDataByNISN,
  prosesKatrolSemua,
  hitungNilaiAkhir,
  exportToExcelMultiSheet,
} from "./Utils"; // 🔥 HAPUS exportLeger dari import

const Katrol = ({ userData: initialUserData }) => {
  const [userData, setUserData] = useState(initialUserData);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
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
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);

  // 🔥 BARU: State untuk deteksi kolom NH dinamis
  const [availableNH, setAvailableNH] = useState([
    "NH1",
    "NH2",
    "NH3",
    "NH4",
    "NH5",
  ]);

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
    "Pendidikan Agama dan Budi Pekerti (PABP)",
    "Pendidikan Jasmani Olahraga Kesehatan",
  ];

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
    const fetchActiveYear = async () => {
      try {
        const { data, error } = await supabase
          .from("academic_years")
          .select("*")
          .eq("is_active", true)
          .single();

        if (error) throw error;
        if (data) {
          setActiveAcademicYear(data);
          console.log("✅ Active academic year:", data.year, data.semester);
        }
      } catch (error) {
        console.error("❌ Error fetching academic year:", error);
        showMessage("Gagal memuat tahun ajaran aktif", "error");
      }
    };

    fetchActiveYear();
  }, []);

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
          console.error("Error fetching settings:", error);
          setKkm(70);
          setNilaiMaksimal(90);
          setOriginalKkm(70);
          setOriginalNilaiMaksimal(90);

          // 🔥 BARU: Reset string inputs
          setKkmInput("70");
          setNilaiMaksimalInput("90");
          return;
        }

        if (data) {
          setKkm(data.kkm);
          setNilaiMaksimal(data.nilai_maksimal);
          setOriginalKkm(data.kkm);
          setOriginalNilaiMaksimal(data.nilai_maksimal);
          setSettingsChanged(false);

          // 🔥 BARU: Sync string inputs untuk fix bug "075"
          setKkmInput(String(data.kkm));
          setNilaiMaksimalInput(String(data.nilai_maksimal));
        }
      } catch (error) {
        console.error("Error:", error);
        setKkm(70);
        setNilaiMaksimal(90);
        setOriginalKkm(70);
        setOriginalNilaiMaksimal(90);

        // 🔥 BARU: Reset string inputs
        setKkmInput("70");
        setNilaiMaksimalInput("90");
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchNilaiSettings();
  }, [selectedSubject, selectedClass]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleKkmChange = (value) => {
    // 🔥 PERBAIKAN: Simpan raw input sebagai string untuk fix bug "075"
    setKkmInput(value);

    // Parse jadi number untuk logic
    const numValue = value === "" ? 0 : parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setKkm(numValue);
      setSettingsChanged(
        numValue !== originalKkm || nilaiMaksimal !== originalNilaiMaksimal
      );
    }
  };

  const handleNilaiMaksimalChange = (value) => {
    // 🔥 PERBAIKAN: Simpan raw input sebagai string untuk fix bug "075"
    setNilaiMaksimalInput(value);

    // Parse jadi number untuk logic
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

  const fetchDataNilai = async () => {
    if (!selectedClass || !selectedSubject) {
      showMessage("Pilih kelas dan mata pelajaran terlebih dahulu", "error");
      return;
    }

    if (!activeAcademicYear) {
      showMessage("Tahun ajaran aktif tidak ditemukan", "error");
      return;
    }

    setLoading(true);
    try {
      console.log(
        `📄 Mengambil data untuk kelas ${selectedClass}, mapel ${selectedSubject}`
      );

      // 1️⃣ CEK DULU: Ada data katrol atau ngga?
      const { data: katrolData, error: katrolError } = await supabase
        .from("nilai_katrol")
        .select("*")
        .eq("kelas", selectedClass)
        .eq("mata_pelajaran", selectedSubject)
        .eq("semester", activeAcademicYear.semester)
        .eq("tahun_ajaran", activeAcademicYear.year);

      if (katrolError) {
        console.error("Error cek katrol:", katrolError);
      }

      // 2️⃣ KALAU ADA DATA KATROL, LOAD ITU!
      if (katrolData && katrolData.length > 0) {
        console.log(
          `✅ Ditemukan ${katrolData.length} data KATROL (sudah diproses)`
        );

        // 🔥 PERBAIKAN: Ambil juga nilai ASLI untuk perbandingan
        const { data: nilaiAsliData, error: nilaiAsliError } = await supabase
          .from("nilai")
          .select("*")
          .eq("kelas", selectedClass)
          .eq("mata_pelajaran", selectedSubject);

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
            NH4: null,
            NH5: null,
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
            if (nilaiItem.jenis_nilai === "NH4")
              nilaiAsli.NH4 = nilaiItem.nilai;
            if (nilaiItem.jenis_nilai === "NH5")
              nilaiAsli.NH5 = nilaiItem.nilai;
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
              NH4: item.nh4_katrol,
              NH5: item.nh5_katrol,
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

      const { data: nilaiData, error: nilaiError } = await supabase
        .from("nilai")
        .select("*")
        .eq("kelas", selectedClass)
        .eq("mata_pelajaran", selectedSubject);

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
        `✅ Berhasil memuat ${previewData.length} siswa (${nilaiCount} data nilai ORIGINAL - belum dikatrol)`,
        "success"
      );
    } catch (error) {
      console.error("❌ Error mengambil data:", error);
      showMessage(`Gagal memuat data: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const prosesKatrol = async () => {
    if (!selectedClass || !selectedSubject) {
      showMessage("Pilih kelas dan mata pelajaran terlebih dahulu", "error");
      return;
    }

    if (kkm > nilaiMaksimal) {
      showMessage("KKM tidak boleh lebih besar dari Nilai Maksimal!", "error");
      return;
    }

    setProcessing(true);
    try {
      console.log("📄 Memulai proses katrol...");

      const { data: siswaData, error: siswaError } = await supabase
        .from("students")
        .select("nisn, nama_siswa")
        .eq("kelas", selectedClass)
        .eq("is_active", true)
        .order("nama_siswa", { ascending: true });

      if (siswaError) throw siswaError;

      const { data: nilaiData, error: nilaiError } = await supabase
        .from("nilai")
        .select("*")
        .eq("kelas", selectedClass)
        .eq("mata_pelajaran", selectedSubject);

      if (nilaiError) throw nilaiError;

      // 🔥 BARU: Deteksi kolom NH untuk proses katrol juga
      const nhColumns = new Set();
      if (nilaiData && nilaiData.length > 0) {
        nilaiData.forEach((item) => {
          if (item.jenis_nilai?.startsWith("NH")) {
            nhColumns.add(item.jenis_nilai);
          }
        });
      }

      const detectedNH = Array.from(nhColumns).sort();
      setAvailableNH(
        detectedNH.length > 0 ? detectedNH : ["NH1", "NH2", "NH3", "NH4", "NH5"]
      );

      const previewData = siswaData.map((siswa) => {
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

      const katrol = prosesKatrolSemua(dataForGrouping, kkm, nilaiMaksimal);
      const hasil = hitungNilaiAkhir(katrol);

      const hasilDenganStatus = hasil.map((item) => ({
        ...item,
        status: item.nilai_akhir_katrol >= kkm ? "Tuntas" : "Belum Tuntas",
      }));

      hasilDenganStatus.sort((a, b) =>
        a.nama_siswa.localeCompare(b.nama_siswa)
      );

      setHasilKatrol(hasilDenganStatus);
      setShowPreview(false);
      showMessage(
        `✅ Berhasil memproses katrol untuk ${hasilDenganStatus.length} siswa`,
        "success"
      );
    } catch (error) {
      console.error("❌ Error processing katrol:", error);
      showMessage("Gagal memproses katrol", "error");
    } finally {
      setProcessing(false);
    }
  };

  const saveKatrolToDatabase = async () => {
    if (!hasilKatrol || hasilKatrol.length === 0) {
      showMessage("Tidak ada data katrol untuk disimpan", "error");
      return;
    }

    if (!activeAcademicYear) {
      showMessage("Tahun ajaran aktif tidak ditemukan", "error");
      return;
    }

    const confirmSave = window.confirm(
      `💾 SIMPAN NILAI KATROL?\n\n` +
        `Tahun Ajaran: ${activeAcademicYear.year}\n` +
        `Semester: ${activeAcademicYear.semester}\n` +
        `Kelas: ${selectedClass}\n` +
        `Mata Pelajaran: ${selectedSubject}\n` +
        `Total Siswa: ${hasilKatrol.length}\n\n` +
        `Nilai akan disimpan ke database.\n` +
        `Jika sudah ada, akan DITIMPA!\n\n` +
        `Lanjutkan?`
    );

    if (!confirmSave) return;

    setSaving(true);
    try {
      const recordsToSave = hasilKatrol.map((item) => {
        const nilaiArray = [
          item.nilai.NH1,
          item.nilai.NH2,
          item.nilai.NH3,
          item.nilai.NH4,
          item.nilai.NH5,
          item.nilai.UTS,
          item.nilai.UAS,
        ].filter((n) => n !== null && n !== undefined && !isNaN(n));

        const min = nilaiArray.length > 0 ? Math.min(...nilaiArray) : null;
        const max = nilaiArray.length > 0 ? Math.max(...nilaiArray) : null;

        return {
          nisn: item.nisn,
          nama_siswa: item.nama_siswa,
          kelas: selectedClass,
          mata_pelajaran: selectedSubject,
          semester: activeAcademicYear.semester,
          tahun_ajaran: activeAcademicYear.year,

          nh1_katrol: item.nilai_katrol?.NH1 || null,
          nh2_katrol: item.nilai_katrol?.NH2 || null,
          nh3_katrol: item.nilai_katrol?.NH3 || null,
          nh4_katrol: item.nilai_katrol?.NH4 || null,
          nh5_katrol: item.nilai_katrol?.NH5 || null,
          uts_katrol: item.nilai_katrol?.UTS || null,
          uas_katrol: item.nilai_katrol?.UAS || null,

          rata_nh_katrol: item.rata_NH_katrol || null,
          nilai_mentah: item.nilai_akhir_asli || null,
          nilai_akhir: item.nilai_akhir_katrol,

          status:
            item.status ||
            (item.nilai_akhir_katrol >= kkm ? "Tuntas" : "Belum Tuntas"),

          kkm: kkm,
          nilai_maksimal: nilaiMaksimal,

          min_nilai: min,
          max_nilai: max,

          processed_by: userData.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      console.log("💾 Menyimpan data katrol:", recordsToSave.length, "records");

      const { data, error } = await supabase
        .from("nilai_katrol")
        .upsert(recordsToSave, {
          onConflict: "nisn,mata_pelajaran,kelas,semester,tahun_ajaran",
        });

      if (error) throw error;

      showMessage(
        `✅ Berhasil menyimpan ${recordsToSave.length} nilai katrol ke database!`,
        "success"
      );
    } catch (error) {
      console.error("❌ Error saving katrol:", error);
      showMessage(`Gagal menyimpan nilai katrol: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!hasilKatrol || hasilKatrol.length === 0) {
      showMessage("Tidak ada data untuk di-export", "error");
      return;
    }

    setExporting(true);
    try {
      // ✅ PERBAIKAN: Urutan parameter yang BENAR sesuai Utils.js
      await exportToExcelMultiSheet(
        hasilKatrol, // data
        selectedSubject, // mapel
        selectedClass, // kelas
        availableNH, // ← availableNH di parameter ke-4 ✅
        userData // ← userData di parameter ke-5 ✅
      );
      showMessage("✅ Berhasil export Nilai Katrol", "success");
    } catch (error) {
      console.error("Error exporting:", error);
      showMessage("Gagal export data", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
        <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-950 dark:to-red-900 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Calculator className="w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Katrol Nilai
            </h1>
          </div>
          <p className="text-sm sm:text-base text-red-100 dark:text-red-200">
            {userData?.role === "guru_kelas"
              ? `Guru Kelas ${selectedClass || userData?.kelas}`
              : `Guru ${userData?.mata_pelajaran}`}
          </p>
        </div>
      </div>

      {/* Academic Year Info */}
      {activeAcademicYear && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
            <span className="text-red-800 dark:text-red-300 font-medium">
              📅 Tahun Ajaran Aktif: {activeAcademicYear.year} - Semester{" "}
              {activeAcademicYear.semester}
            </span>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 dark:text-gray-200">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-500" />
            Filter Data
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {/* Kelas */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Kelas
              </label>
              {userData?.role === "guru_kelas" ? (
                <div className="bg-gray-100 dark:bg-gray-700 px-3 sm:px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm sm:text-base dark:text-gray-200">
                  <span className="font-semibold">Kelas {selectedClass}</span>
                </div>
              ) : (
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setHasilKatrol([]);
                    setDataNilai([]);
                    setDataGrouped([]);
                    setShowPreview(false);
                  }}
                  className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors">
                  <option value="">Pilih Kelas</option>
                  {availableClasses.map((kelas) => (
                    <option key={kelas} value={kelas}>
                      Kelas {kelas}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Mata Pelajaran
              </label>
              {userData?.role === "guru_mapel" ? (
                <div className="bg-gray-100 dark:bg-gray-700 px-3 sm:px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm sm:text-base dark:text-gray-200">
                  <span className="font-semibold">{selectedSubject}</span>
                </div>
              ) : (
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setHasilKatrol([]);
                    setDataNilai([]);
                    setDataGrouped([]);
                    setShowPreview(false);
                  }}
                  className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors">
                  <option value="">Pilih Mata Pelajaran</option>
                  {availableSubjects.map((mapel) => (
                    <option key={mapel} value={mapel}>
                      {mapel}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* KKM */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                KKM
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={kkmInput}
                onChange={(e) => handleKkmChange(e.target.value)}
                disabled={!selectedSubject || loadingSettings}
                className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-800 transition-colors"
                placeholder="KKM"
              />
            </div>

            {/* Nilai Maksimal */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Nilai Maksimal
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={nilaiMaksimalInput}
                onChange={(e) => handleNilaiMaksimalChange(e.target.value)}
                disabled={!selectedSubject || loadingSettings}
                className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-800 transition-colors"
                placeholder="Nilai Max"
              />
            </div>
          </div>

          {/* Warning KKM > Nilai Maksimal */}
          {kkm > nilaiMaksimal && selectedSubject && (
            <div className="mb-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs sm:text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>KKM tidak boleh lebih besar dari Nilai Maksimal!</span>
            </div>
          )}

          {/* Status Settings */}
          {selectedClass && selectedSubject && (
            <div className="mb-4">
              {settingsChanged && (
                <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Pengaturan KKM/Nilai Maksimal Belum Tersimpan
                </span>
              )}
              {!settingsChanged && !loadingSettings && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Pengaturan KKM: {originalKkm} & Nilai Maksimal:{" "}
                  {originalNilaiMaksimal} Tersimpan
                </span>
              )}
            </div>
          )}

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            {/* Tombol Simpan Settings - SEKARANG PERTAMA */}
            {selectedClass && selectedSubject && (
              <button
                onClick={saveSettings}
                disabled={
                  savingSettings || kkm > nilaiMaksimal || !settingsChanged
                }
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-lg disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:cursor-not-allowed transition-colors active:scale-[0.98] min-h-[44px] sm:min-h-0">
                {savingSettings ? (
                  <>
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Simpan Pengaturan KKM</span>
                  </>
                )}
              </button>
            )}

            {/* Tombol Muat Data - SEKARANG KEDUA */}
            <button
              onClick={fetchDataNilai}
              disabled={
                !selectedClass ||
                !selectedSubject ||
                loading ||
                kkm > nilaiMaksimal
              }
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:cursor-not-allowed transition-colors active:scale-[0.98] min-h-[44px] sm:min-h-0">
              {loading ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Memuat Data...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Muat Data Nilai</span>
                </>
              )}
            </button>

            {/* Tombol Proses Katrol - SEKARANG KETIGA */}
            <button
              onClick={prosesKatrol}
              disabled={
                !selectedClass ||
                !selectedSubject ||
                processing ||
                kkm > nilaiMaksimal
              }
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:cursor-not-allowed transition-colors active:scale-[0.98] min-h-[44px] sm:min-h-0">
              {processing ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>
                    {hasilKatrol.length > 0
                      ? "Proses Ulang Katrol"
                      : "Proses Katrol"}
                  </span>
                </>
              )}
            </button>

            {/* Tombol Simpan Nilai Katrol */}
            {hasilKatrol.length > 0 && (
              <button
                onClick={saveKatrolToDatabase}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white rounded-lg disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:cursor-not-allowed transition-colors active:scale-[0.98] min-h-[44px] sm:min-h-0">
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Simpan Nilai Katrol</span>
                  </>
                )}
              </button>
            )}

            {/* Export Button */}
            {hasilKatrol.length > 0 && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white rounded-lg disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:cursor-not-allowed transition-colors active:scale-[0.98] min-h-[44px] sm:min-h-0">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Export Nilai Katrol</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
          <div
            className={`flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
              message.type === "success"
                ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800"
            }`}>
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Data Tables */}
      <div className="max-w-7xl mx-auto">
        {/* Preview Table */}
        {showPreview && dataGrouped.length > 0 && (
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6 mb-4">
              <h3 className="text-lg font-semibold mb-4 dark:text-gray-200 flex items-center gap-2">
                <Eye className="w-5 h-5 text-red-600 dark:text-red-500" />
                Preview Data Nilai ({dataGrouped.length} siswa)
              </h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            No
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            NISN
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Nama Siswa
                          </th>
                          {/* 🔥 BARU: Render kolom NH secara dinamis */}
                          {availableNH.map((nh) => (
                            <th
                              key={nh}
                              className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              {nh}
                            </th>
                          ))}
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            UTS
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            UAS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {dataGrouped.slice(0, 10).map((item, index) => (
                          <tr
                            key={item.nisn}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              {index + 1}
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                              {item.nisn}
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              {item.nama_siswa}
                            </td>
                            {/* 🔥 BARU: Render nilai NH secara dinamis */}
                            {availableNH.map((nh) => (
                              <td
                                key={nh}
                                className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                {item.nilai?.[nh] || "-"}
                              </td>
                            ))}
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              {item.nilai?.UTS || "-"}
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              {item.nilai?.UAS || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {dataGrouped.length > 10 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 px-2">
                  Menampilkan 10 dari {dataGrouped.length} siswa. Gunakan tombol
                  "Proses Katrol" untuk melihat hasil lengkap.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Table */}
        {hasilKatrol.length > 0 && (
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h3 className="text-lg font-semibold dark:text-gray-200 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-600 dark:text-green-500" />
                  Hasil Katrol Nilai ({hasilKatrol.length} siswa)
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-400">
                      Tuntas (
                      {hasilKatrol.filter((h) => h.status === "Tuntas").length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-400">
                      Belum Tuntas (
                      {
                        hasilKatrol.filter((h) => h.status === "Belum Tuntas")
                          .length
                      }
                      )
                    </span>
                  </div>
                </div>
              </div>

              {/* 🔥 CATATAN: KatrolTable akan menampilkan BOTH nilai asli dan nilai katrol */}
              <KatrolTable data={hasilKatrol} availableNH={availableNH} />

              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-1">
                  • KKM: <span className="font-semibold">{kkm}</span> | Nilai
                  Maksimal:{" "}
                  <span className="font-semibold">{nilaiMaksimal}</span>
                </p>
                <p className="font-mono text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  Nilai Akhir = KKM + ((Nilai Mentah - Min) / (Max - Min)) ×
                  (Nilai Maksimal - KKM)
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  💡 <strong>Nilai Asli</strong> ditampilkan untuk perbandingan
                  dengan <strong>Nilai Katrol</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!showPreview &&
          hasilKatrol.length === 0 &&
          dataGrouped.length === 0 &&
          selectedClass &&
          selectedSubject && (
            <div className="text-center py-12 sm:py-16">
              <div className="max-w-md mx-auto px-4">
                <Calculator className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
                  Belum Ada Data
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Pilih kelas dan mata pelajaran, lalu klik "Muat Data" untuk
                  memulai proses katrol.
                </p>
                <button
                  onClick={fetchDataNilai}
                  disabled={!selectedClass || !selectedSubject}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Muat Data Sekarang
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Katrol;
