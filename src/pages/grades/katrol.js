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
} from "lucide-react";
import KatrolTable from "./KatrolTable";
import {
  getKKM,
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
  const [kkm, setKkm] = useState(null);
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

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const fetchDataNilai = async () => {
    if (!selectedClass || !selectedSubject) {
      showMessage("Pilih kelas dan mata pelajaran terlebih dahulu", "error");
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

      // Group by NISN untuk preview
      const grouped = groupDataByNISN(data);
      setDataGrouped(grouped);
      setShowPreview(true);
      setHasilKatrol([]);

      // Set KKM
      const kkmValue = getKKM(selectedSubject);
      setKkm(kkmValue);

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

    setProcessing(true);
    try {
      const katrol = prosesKatrolSemua(dataGrouped, kkm);
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
      await exportToExcel(hasilKatrol, selectedSubject, selectedClass, type);
      showMessage(`Berhasil export format ${type}`, "success");
    } catch (error) {
      console.error("Error exporting:", error);
      showMessage("Gagal export data", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8" />
            <h1 className="text-2xl md:text-3xl font-bold">Katrol Nilai</h1>
          </div>
          <p className="text-blue-100">
            {userData?.role === "guru_kelas"
              ? `Guru Kelas ${selectedClass || userData?.kelas}`
              : `Guru ${userData?.mata_pelajaran}`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Filter Data
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas
              </label>
              {userData?.role === "guru_kelas" ? (
                <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Kelas</option>
                  {availableClasses.map((kelas) => (
                    <option key={kelas} value={kelas}>
                      Kelas {kelas}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mata Pelajaran
              </label>
              {userData?.role === "guru_mapel" ? (
                <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Mata Pelajaran</option>
                  {availableSubjects.map((mapel) => (
                    <option key={mapel} value={mapel}>
                      {mapel}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchDataNilai}
              disabled={!selectedClass || !selectedSubject || loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Memuat Data...</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  <span>Muat Data</span>
                </>
              )}
            </button>

            <button
              onClick={prosesKatrol}
              disabled={dataGrouped.length === 0 || processing}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              {processing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  <span>Proses Katrol</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {message.text && (
        <div className="max-w-7xl mx-auto mb-6">
          <div
            className={`flex items-center gap-3 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {showPreview && dataGrouped.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Preview Data Nilai</h2>
              <span className="text-sm text-gray-600">
                KKM: {kkm} | Total: {dataGrouped.length} siswa
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      NISN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      NH1
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      NH2
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      NH3
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      NH4
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      NH5
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      UTS
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      UAS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dataGrouped.map((siswa, idx) => (
                    <tr
                      key={siswa.nisn}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm">{siswa.nisn}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {siswa.nama_siswa}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {siswa.nilai.NH1 || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {siswa.nilai.NH2 || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {siswa.nilai.NH3 || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {siswa.nilai.NH4 || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {siswa.nilai.NH5 || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {siswa.nilai.UTS || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {siswa.nilai.UAS || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {hasilKatrol.length > 0 && (
        <>
          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">KKM</p>
                  <p className="text-2xl font-bold text-blue-600">{kkm}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Rentang Katrol</p>
                  <p className="text-2xl font-bold text-green-600">
                    {kkm} - 90
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Siswa</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {hasilKatrol.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Hasil Katrol</h2>
              <KatrolTable data={hasilKatrol} kkm={kkm} />
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Export Data</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleExport("lengkap")}
                  disabled={exporting}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  <Download className="w-5 h-5" />
                  <span>Export Lengkap (21 Kolom)</span>
                </button>

                <button
                  onClick={() => handleExport("ringkas")}
                  disabled={exporting}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  <Download className="w-5 h-5" />
                  <span>Export Ringkas (11 Kolom)</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Katrol;
