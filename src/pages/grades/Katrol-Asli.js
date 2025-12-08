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
} from "lucide-react";
import KatrolTable from "./KatrolTable";
import {
  groupDataByNISN,
  prosesKatrolSemua,
  hitungNilaiAkhir,
  exportToExcel,
} from "./Utils";

const Katrol = ({ userData: initialUserData }) => {
  const [userData, setUserData] = useState(initialUserData);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  // Fetch KKM dan Nilai Maksimal dari database berdasarkan kelas + mapel
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

    if (kkm > nilaiMaksimal) {
      showMessage("KKM tidak boleh lebih besar dari Nilai Maksimal!", "error");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("nilai")
        .select("*")
        .eq("kelas", selectedClass)
        .eq("mata_pelajaran", selectedSubject)
        .order("nisn", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        showMessage("Tidak ada data nilai untuk kelas dan mapel ini", "error");
        setDataNilai([]);
        setDataGrouped([]);
        setHasilKatrol([]);
        setShowPreview(false);
        return;
      }

      setDataNilai(data);
      const grouped = groupDataByNISN(data);
      setDataGrouped(grouped);
      setShowPreview(true);
      setHasilKatrol([]);

      showMessage(
        `Berhasil memuat ${data.length} data nilai dari ${grouped.length} siswa`,
        "success"
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      showMessage("Gagal memuat data nilai", "error");
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
      const katrol = prosesKatrolSemua(dataGrouped, kkm, nilaiMaksimal);
      const hasil = hitungNilaiAkhir(katrol);
      hasil.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

      setHasilKatrol(hasil);
      setShowPreview(false);
      showMessage(
        `Berhasil memproses katrol untuk ${hasil.length} siswa`,
        "success"
      );
    } catch (error) {
      console.error("Error processing katrol:", error);
      showMessage("Gagal memproses katrol", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async (type) => {
    if (!hasilKatrol || hasilKatrol.length === 0) {
      showMessage("Tidak ada data untuk di-export", "error");
      return;
    }

    setExporting(true);
    try {
      // 🔥 Pass userData ke fungsi exportToExcel
      await exportToExcel(
        hasilKatrol,
        selectedSubject,
        selectedClass,
        type,
        userData // userData sudah ada dari props/state
      );
      showMessage(`Berhasil export format ${type}`, "success");
    } catch (error) {
      console.error("Error exporting:", error);
      showMessage("Gagal export data", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    // [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-900
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

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
        {/* [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-800 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 dark:text-gray-200">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Filter Data
          </h2>

          {/* Single Row Filter - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {/* Kelas */}
            <div>
              {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Kelas
              </label>
              {userData?.role === "guru_kelas" ? (
                // [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-700, dark:border-gray-600, dark:text-gray-200
                <div className="bg-gray-100 dark:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm sm:text-base dark:text-gray-200">
                  <span className="font-semibold">Kelas {selectedClass}</span>
                </div>
              ) : (
                // [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-700, dark:border-gray-600, dark:text-gray-200
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
              {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Mata Pelajaran
              </label>
              {userData?.role === "guru_mapel" ? (
                // [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-700, dark:border-gray-600, dark:text-gray-200
                <div className="bg-gray-100 dark:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm sm:text-base dark:text-gray-200">
                  <span className="font-semibold">{selectedSubject}</span>
                </div>
              ) : (
                // [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-700, dark:border-gray-600, dark:text-gray-200
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
              {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
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
                // [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-700, dark:border-gray-600, dark:text-gray-200, dan disabled:dark:bg-gray-800
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-800"
                placeholder="KKM"
              />
            </div>

            {/* Nilai Maksimal */}
            <div>
              {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
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
                // [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-700, dark:border-gray-600, dark:text-gray-200, dan disabled:dark:bg-gray-800
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-800"
                placeholder="Nilai Max"
              />
            </div>
          </div>

          {/* Warning KKM > Nilai Maksimal */}
          {kkm > nilaiMaksimal && selectedSubject && (
            // [MODIFIKASI DARK MODE] Tambahkan dark:bg-red-900/20 dan dark:text-red-400
            <div className="mb-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs sm:text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>KKM tidak boleh lebih besar dari Nilai Maksimal!</span>
            </div>
          )}

          {/* Status Settings */}
          {selectedClass && selectedSubject && (
            <div className="mb-4">
              {settingsChanged && (
                // [MODIFIKASI DARK MODE] Tambahkan dark:text-orange-400
                <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Pengaturan KKM/Nilai Maksimal Belum Tersimpan
                </span>
              )}
              {!settingsChanged && !loadingSettings && (
                // [MODIFIKASI DARK MODE] Tambahkan dark:text-green-400
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Pengaturan KKM: {originalKkm} & Nilai Maksimal:{" "}
                  {originalNilaiMaksimal} Tersimpan
                </span>
              )}
            </div>
          )}

          {/* Action Buttons: Muat Data - Proses Katrol - Simpan Pengaturan KKM - Export Buttons */}
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

            {/* Export Buttons - Dipindahkan ke sini */}
            {hasilKatrol.length > 0 && (
              <>
                <button
                  onClick={() => handleExport("lengkap")}
                  disabled={exporting}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Export Lengkap</span>
                </button>

                <button
                  onClick={() => handleExport("ringkas")}
                  disabled={exporting}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Export Ringkas</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
          <div
            // [MODIFIKASI DARK MODE] Tambahkan dark:bg-*-900/20 dan dark:text-*-400
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

      {/* Preview Data */}
      {showPreview && dataGrouped.length > 0 && (
        <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
          {/* [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-800 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h2 className="text-base sm:text-lg font-semibold dark:text-gray-200">
                Preview Data Nilai
              </h2>
              {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-400 */}
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                KKM: {kkm} | Max: {nilaiMaksimal} | Siswa: {dataGrouped.length}
              </span>
            </div>
            {/* [RESPONSIVENESS] Pastikan overflow-x-auto ada untuk table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                {/* [MODIFIKASI DARK MODE] Tambahkan dark:divide-gray-600 */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  {/* [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-700 */}
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 dan dark:bg-gray-700 untuk sticky */}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase sticky left-0 bg-gray-100 dark:bg-gray-700 z-10">
                        No
                      </th>
                      {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 dan dark:bg-gray-700 untuk sticky */}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase sticky left-8 sm:left-12 bg-gray-100 dark:bg-gray-700 z-10">
                        Nama
                      </th>
                      {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        NH1
                      </th>
                      {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        NH2
                      </th>
                      {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        NH3
                      </th>
                      {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        NH4
                      </th>
                      {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        NH5
                      </th>
                      {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        UTS
                      </th>
                      {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        UAS
                      </th>
                    </tr>
                  </thead>
                  {/* [MODIFIKASI DARK MODE] Tambahkan dark:divide-gray-600 */}
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {dataGrouped.map((siswa, idx) => (
                      // [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-800 dan dark:bg-gray-700 untuk alternating rows
                      <tr
                        key={siswa.nisn}
                        className={
                          idx % 2 === 0
                            ? "bg-white dark:bg-gray-800"
                            : "bg-gray-50 dark:bg-gray-700"
                        }>
                        {/* [MODIFIKASI DARK MODE] Sticky cell perlu warna latar belakang eksplisit dari row, dan text color */}
                        <td
                          className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm dark:text-gray-300 sticky left-0 z-10 ${
                            idx % 2 === 0
                              ? "bg-white dark:bg-gray-800"
                              : "bg-gray-50 dark:bg-gray-700"
                          }`}>
                          {idx + 1}
                        </td>
                        {/* [MODIFIKASI DARK MODE] Sticky cell perlu warna latar belakang eksplisit dari row, dan text color */}
                        <td
                          className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium sticky left-8 sm:left-12 z-10 whitespace-nowrap dark:text-gray-300 ${
                            idx % 2 === 0
                              ? "bg-white dark:bg-gray-800"
                              : "bg-gray-50 dark:bg-gray-700"
                          }`}>
                          {siswa.nama_siswa}
                        </td>
                        {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center dark:text-gray-300">
                          {siswa.nilai.NH1 || "-"}
                        </td>
                        {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center dark:text-gray-300">
                          {siswa.nilai.NH2 || "-"}
                        </td>
                        {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center dark:text-gray-300">
                          {siswa.nilai.NH3 || "-"}
                        </td>
                        {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center dark:text-gray-300">
                          {siswa.nilai.NH4 || "-"}
                        </td>
                        {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center dark:text-gray-300">
                          {siswa.nilai.NH5 || "-"}
                        </td>
                        {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center dark:text-gray-300">
                          {siswa.nilai.UTS || "-"}
                        </td>
                        {/* [MODIFIKASI DARK MODE] Tambahkan dark:text-gray-300 */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center dark:text-gray-300">
                          {siswa.nilai.UAS || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hasil Katrol */}
      {hasilKatrol.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
            {/* [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-800 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* [MODIFIKASI DARK MODE] Tambahkan dark:bg-blue-900/20 dan dark:text-gray-400 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                    KKM
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {kkm}
                  </p>
                </div>
                {/* [MODIFIKASI DARK MODE] Tambahkan dark:bg-green-900/20 dan dark:text-gray-400 */}
                <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Rentang Katrol
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {kkm} - {nilaiMaksimal}
                  </p>
                </div>
                {/* [MODIFIKASI DARK MODE] Tambahkan dark:bg-purple-900/20 dan dark:text-gray-400 */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total Siswa
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {hasilKatrol.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Hasil */}
          <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
            {/* [MODIFIKASI DARK MODE] Tambahkan dark:bg-gray-800 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-4 dark:text-gray-200">
                Hasil Katrol
              </h2>
              {/* Catatan: Komponen KatrolTable harus diupdate secara terpisah untuk dark mode */}
              <KatrolTable data={hasilKatrol} kkm={kkm} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Katrol;
