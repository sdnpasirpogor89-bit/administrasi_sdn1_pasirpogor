import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

// Mapping nama mapel ke format raport
const mapelToRaportName = (mapelDB) => {
  const mapping = {
    PAIBP: "Pendidikan Agama Islam dan Budi Pekerti",
    "Pendidikan Pancasila": "Pendidikan Pancasila dan Kewarganegaraan",
    "Bahasa Indonesia": "Bahasa Indonesia",
    Matematika: "Matematika (Umum)",
    IPAS: "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
    PJOK: "Pendidikan Jasmani, Olahraga, dan Kesehatan",
    "Seni Budaya": "Seni Budaya",
    "Bahasa Sunda": "Muatan Lokal Bahasa Daerah",
    "Bahasa Inggris": "Bahasa Inggris",
  };
  return mapping[mapelDB] || mapelDB;
};

const CekNilai = () => {
  const [kelas, setKelas] = useState("");
  const [periode, setPeriode] = useState("");
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [academicYear, setAcademicYear] = useState(null);

  useEffect(() => {
    loadUserData();
    loadActiveAcademicYear();
  }, []);

  useEffect(() => {
    if (kelas && academicYear && periode) {
      loadStatusPenilaian();
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

  const loadStatusPenilaian = async () => {
    setLoading(true);
    setStatusData([]);

    try {
      console.log("📊 Loading status untuk kelas:", kelas, "periode:", periode);

      // 1. Hitung total siswa dan ambil ID mereka (pakai field kelas, bukan class_id)
      const { data: siswaData } = await supabase
        .from("students")
        .select("id")
        .eq("kelas", kelas) // ← PAKAI kelas (angka)
        .eq("is_active", true);

      const jumlahSiswa = siswaData?.length || 0;
      const siswaIds = siswaData?.map((s) => s.id) || [];
      setTotalSiswa(jumlahSiswa);
      console.log("👥 Total siswa:", jumlahSiswa);
      console.log("👥 Siswa IDs:", siswaIds);

      if (jumlahSiswa === 0) {
        console.error("❌ No students found for kelas:", kelas);
        setLoading(false);
        return;
      }

      // 2. Get daftar mapel yang unique dari nilai_eraport
      const { data: nilaiData } = await supabase
        .from("nilai_eraport")
        .select("mata_pelajaran, student_id")
        .eq("semester", academicYear?.semester)
        .eq("periode", periode)
        .eq("tahun_ajaran_id", academicYear?.id);

      console.log("🔍 Query result:", nilaiData?.length, "records");

      // Filter by student_id
      const nilaiForKelas = nilaiData?.filter((item) =>
        siswaIds.includes(item.student_id)
      );

      console.log("🔍 Nilai filtered:", nilaiForKelas?.length, "records");

      // Get unique mata pelajaran
      const uniqueMapel = [
        ...new Set(nilaiForKelas?.map((item) => item.mata_pelajaran) || []),
      ];
      console.log("📚 Mata pelajaran ditemukan:", uniqueMapel);

      // 3. Process setiap mapel
      const statusPromises = uniqueMapel.map(async (mapel, index) => {
        return await getMapelStatus(mapel, index, jumlahSiswa);
      });

      const hasil = await Promise.all(statusPromises);

      // Sort berdasarkan urutan mapel
      const urutanMapel = {
        PAIBP: 1,
        "Pendidikan Pancasila": 2,
        "Bahasa Indonesia": 3,
        Matematika: 4,
        IPAS: 5,
        PJOK: 6,
        "Seni Budaya": 7,
        "Bahasa Sunda": 8,
        "Bahasa Inggris": 9,
      };

      const sorted = hasil
        .filter((item) => item !== null)
        .sort((a, b) => {
          const urutanA = urutanMapel[a.nama_mapel_db] || 999;
          const urutanB = urutanMapel[b.nama_mapel_db] || 999;
          return urutanA - urutanB;
        })
        .map((item, idx) => ({ ...item, no: idx + 1 }));

      setStatusData(sorted);
    } catch (error) {
      console.error("Error loading status penilaian:", error);
      alert("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMapelStatus = async (mapel, index, jumlahSiswa) => {
    try {
      // Query nilai untuk mapel ini
      // PERBAIKAN: pakai semester, dan filter manual by kelas
      const { data: nilaiData } = await supabase
        .from("nilai_eraport")
        .select("id, student_id, nilai_akhir, nilai_eraport_detail(status)")
        .eq("mata_pelajaran", mapel)
        .eq("tahun_ajaran_id", academicYear?.id)
        .eq("semester", academicYear?.semester) // ← Ganjil/Genap
        .eq("periode", periode); // ← mid_ganjil/mid_genap

      // Filter by students yang di kelas ini
      const { data: siswaKelas } = await supabase
        .from("students")
        .select("id")
        .eq("kelas", kelas)
        .eq("is_active", true);

      const siswaIds = siswaKelas?.map((s) => s.id) || [];

      // Filter nilai yang studentnya di kelas ini
      const nilaiFiltered =
        nilaiData?.filter((n) => siswaIds.includes(n.student_id)) || [];

      // Hitung jumlah nilai (yang > 0)
      const siswaDenganNilai = nilaiFiltered.filter((item) => {
        if (!item.nilai_akhir) return false;
        const nilai = parseFloat(item.nilai_akhir);
        return nilai > 0;
      });

      const jumlahNilai = siswaDenganNilai.length;

      // Hitung jumlah yang punya detail TP (capaian kompetensi)
      const jumlahDeskripsi = siswaDenganNilai.filter((item) => {
        return (
          item.nilai_eraport_detail && item.nilai_eraport_detail.length > 0
        );
      }).length;

      return {
        no: index + 1,
        nama_mapel_db: mapel,
        nama_mapel: mapelToRaportName(mapel),
        kelas: `Kelas ${kelas}`,
        jumlah_nilai: jumlahNilai,
        jumlah_deskripsi: jumlahDeskripsi,
        total_siswa: jumlahSiswa,
      };
    } catch (error) {
      console.error("Error get mapel status:", error);
      return null;
    }
  };

  const formatStatusNilai = (jumlah, total) => {
    if (total === 0) return "0 Data";
    if (jumlah === 0) return "0 Data";
    if (jumlah === total) return `${jumlah} Data`;
    return `${jumlah}/${total} Data`;
  };

  const getTextColor = (jumlah, total) => {
    if (jumlah === 0) return "text-red-600 dark:text-red-400";
    if (jumlah === total) return "text-green-700 dark:text-green-400";
    return "text-amber-600 dark:text-amber-400";
  };

  const getPeriodeText = () => {
    return periode === "mid_ganjil"
      ? "Mid Semester Ganjil"
      : "Mid Semester Genap";
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
          CEK KELENGKAPAN NILAI
        </h2>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
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
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium focus:ring-2 focus:ring-red-500">
              <option value="">-- Pilih Periode --</option>
              <option value="mid_ganjil">Mid Semester Ganjil</option>
              <option value="mid_genap">Mid Semester Genap</option>
            </select>
          </div>
        </div>

        {/* Info */}
        {kelas && periode && totalSiswa > 0 && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Siswa Kelas {kelas}
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {totalSiswa} Siswa
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Periode
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getPeriodeText()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-red-200 dark:border-red-800/30 border-t-red-700 dark:border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Memuat data...</p>
          </div>
        ) : !kelas || !periode ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>Silakan pilih periode untuk melihat data</p>
          </div>
        ) : statusData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>Belum ada data nilai untuk periode ini</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full border-collapse text-xs md:text-sm min-w-[768px]">
                <thead>
                  <tr className="bg-red-700 dark:bg-red-900 text-white">
                    <th className="border border-red-600 dark:border-red-800 p-3 w-16 text-center">
                      No
                    </th>
                    <th className="border border-red-600 dark:border-red-800 p-3 text-left">
                      Mata Pelajaran
                    </th>
                    <th className="border border-red-600 dark:border-red-800 p-3 w-32 text-center">
                      Kelas
                    </th>
                    <th
                      className="border border-red-600 dark:border-red-800 p-3 text-center"
                      colSpan="2">
                      <div className="font-bold mb-2">Status Kelengkapan</div>
                      <div className="flex border-t border-red-600 dark:border-red-800">
                        <div className="flex-1 py-2 border-r border-red-600 dark:border-red-800">
                          Nilai Akhir
                        </div>
                        <div className="flex-1 py-2">Capaian Kompetensi</div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statusData.map((item, index) => (
                    <tr
                      key={item.no}
                      className={
                        index % 2 === 0
                          ? "bg-red-50/30 dark:bg-gray-800/50"
                          : "bg-white dark:bg-gray-900"
                      }>
                      <td className="border border-gray-300 dark:border-gray-700 p-3 text-center font-medium">
                        {item.no}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-3">
                        {item.nama_mapel}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-3 text-center">
                        {item.kelas}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-3 text-center bg-gray-100 dark:bg-gray-700/50">
                        <span
                          className={`font-semibold ${getTextColor(
                            item.jumlah_nilai,
                            item.total_siswa
                          )}`}>
                          {formatStatusNilai(
                            item.jumlah_nilai,
                            item.total_siswa
                          )}
                        </span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-3 text-center bg-gray-100 dark:bg-gray-700/50">
                        <span
                          className={`font-semibold ${getTextColor(
                            item.jumlah_deskripsi,
                            item.total_siswa
                          )}`}>
                          {formatStatusNilai(
                            item.jumlah_deskripsi,
                            item.total_siswa
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                Keterangan Status:
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-700 dark:bg-green-500 rounded"></span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Lengkap (semua siswa sudah dinilai)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-amber-600 dark:bg-amber-500 rounded"></span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Sebagian (belum semua siswa dinilai)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-600 dark:bg-red-500 rounded"></span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Kosong (belum ada yang dinilai)
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CekNilai;
