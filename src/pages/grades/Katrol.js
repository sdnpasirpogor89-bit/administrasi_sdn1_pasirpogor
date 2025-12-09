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
  exportLeger,
} from "./Utils";

const Katrol = ({ userData: initialUserData }) => {
  const [userData, setUserData] = useState(initialUserData);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingLeger, setExportingLeger] = useState(false);
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
          return;
        }

        if (data) {
          setKkm(data.kkm);
          setNilaiMaksimal(data.nilai_maksimal);
          setOriginalKkm(data.kkm);
          setOriginalNilaiMaksimal(data.nilai_maksimal);
          setSettingsChanged(false);
        }
      } catch (error) {
        console.error("Error:", error);
        setKkm(70);
        setNilaiMaksimal(90);
        setOriginalKkm(70);
        setOriginalNilaiMaksimal(90);
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
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= 100) {
      setKkm(numValue);
      setSettingsChanged(
        numValue !== originalKkm || nilaiMaksimal !== originalNilaiMaksimal
      );
    }
  };

  const handleNilaiMaksimalChange = (value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= 100) {
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

    setLoading(true);
    try {
      console.log(
        `📄 Mengambil data untuk kelas ${selectedClass}, mapel ${selectedSubject}`
      );

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
        `✅ Berhasil memuat ${previewData.length} siswa (${nilaiCount} data nilai)`,
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
    if (!dataGrouped || dataGrouped.length === 0) {
      showMessage("Tidak ada data untuk diproses", "error");
      return;
    }

    if (kkm > nilaiMaksimal) {
      showMessage("KKM tidak boleh lebih besar dari Nilai Maksimal!", "error");
      return;
    }

    setProcessing(true);
    try {
      console.log("📄 Memulai proses katrol...");
      const katrol = prosesKatrolSemua(dataGrouped, kkm, nilaiMaksimal);
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
      await exportToExcelMultiSheet(
        hasilKatrol,
        selectedSubject,
        selectedClass,
        userData
      );
      showMessage("✅ Berhasil export Nilai Katrol", "success");
    } catch (error) {
      console.error("Error exporting:", error);
      showMessage("Gagal export data", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleExportLeger = async () => {
    if (!selectedClass) {
      showMessage("Pilih kelas terlebih dahulu", "error");
      return;
    }

    if (!activeAcademicYear) {
      showMessage("Tahun ajaran aktif tidak ditemukan", "error");
      return;
    }

    setExportingLeger(true);
    try {
      const result = await exportLeger(
        selectedClass,
        supabase,
        activeAcademicYear.year,
        activeAcademicYear.semester
      );

      showMessage(
        `✅ Berhasil export Leger Nilai (${result.count} siswa)`,
        "success"
      );
    } catch (error) {
      console.error("Error exporting leger:", error);
      showMessage(`Gagal export leger: ${error.message}`, "error");
    } finally {
      setExportingLeger(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Calculator className="w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Katrol Nilai
            </h1>
          </div>
          <p className="text-sm sm:text-base text-blue-100">
            {userData?.role === "guru_kelas"
              ? `Guru Kelas ${selectedClass || userData?.kelas}`
              : `Guru ${userData?.mata_pelajaran}`}
          </p>
        </div>
      </div>

      {/* Academic Year Info */}
      {activeAcademicYear && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <span className="text-blue-800 dark:text-blue-300 font-medium">
              📅 Tahun Ajaran Aktif: {activeAcademicYear.year} - Semester{" "}
              {activeAcademicYear.semester}
            </span>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 dark:text-gray-200">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Filter Data
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {/* Kelas */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Kelas
              </label>
              {userData?.role === "guru_kelas" ? (
                <div className="bg-gray-100 dark:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm sm:text-base dark:text-gray-200">
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
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200">
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
                <div className="bg-gray-100 dark:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm sm:text-base dark:text-gray-200">
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
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200">
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
                value={kkm}
                onChange={(e) => handleKkmChange(e.target.value)}
                disabled={!selectedSubject || loadingSettings}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-800"
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
                value={nilaiMaksimal}
                onChange={(e) => handleNilaiMaksimalChange(e.target.value)}
                disabled={!selectedSubject || loadingSettings}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-800"
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            {/* Tombol Muat Data */}
            <button
              onClick={fetchDataNilai}
              disabled={
                !selectedClass ||
                !selectedSubject ||
                loading ||
                kkm > nilaiMaksimal
              }
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              {loading ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Memuat Data...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Muat Data</span>
                </>
              )}
            </button>

            {/* Tombol Proses Katrol */}
            <button
              onClick={prosesKatrol}
              disabled={
                dataGrouped.length === 0 || processing || kkm > nilaiMaksimal
              }
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              {processing ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Proses Katrol</span>
                </>
              )}
            </button>

            {/* Tombol Simpan Nilai Katrol */}
            {hasilKatrol.length > 0 && (
              <button
                onClick={saveKatrolToDatabase}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
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

            {/* Tombol Simpan Settings */}
            {selectedClass && selectedSubject && (
              <button
                onClick={saveSettings}
                disabled={
                  savingSettings || kkm > nilaiMaksimal || !settingsChanged
                }
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
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

            {/* Export Buttons */}
            {hasilKatrol.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Export Nilai Katrol</span>
                </button>
              </>
            )}

            {/* Tombol Export Leger */}
            {selectedClass && (
              <button
                onClick={handleExportLeger}
                disabled={exportingLeger}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                {exportingLeger ? (
                  <>
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Export Leger</span>
                  </>
                )}
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
                ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-4">
              <h3 className="text-lg font-semibold mb-4 dark:text-gray-200 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Preview Data Nilai ({dataGrouped.length} siswa)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        NISN
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Nama Siswa
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        NH1
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        NH2
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        NH3
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        NH4
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        NH5
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        UTS
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        UAS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {dataGrouped.slice(0, 10).map((item, index) => (
                      <tr
                        key={item.nisn}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                          {item.nisn}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {item.nama_siswa}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {item.nilai?.NH1 || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {item.nilai?.NH2 || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {item.nilai?.NH3 || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {item.nilai?.NH4 || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {item.nilai?.NH5 || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {item.nilai?.UTS || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {item.nilai?.UAS || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {dataGrouped.length > 10 && (
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h3 className="text-lg font-semibold dark:text-gray-200 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-600" />
                  Hasil Katrol Nilai ({hasilKatrol.length} siswa)
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Tuntas (
                      {hasilKatrol.filter((h) => h.status === "Tuntas").length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">
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

              <KatrolTable data={hasilKatrol} />

              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  • KKM: {kkm} | Nilai Maksimal: {nilaiMaksimal}
                </p>
                <p>
                  • Proses katrol menggunakan rumus:{" "}
                  <span className="font-mono">
                    Nilai Akhir = KKM + ((Nilai Mentah - Min) / (Max - Min)) ×
                    (Nilai Maksimal - KKM)
                  </span>
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
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
                  Belum Ada Data
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Pilih kelas dan mata pelajaran, lalu klik "Muat Data" untuk
                  memulai proses katrol.
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Katrol;
