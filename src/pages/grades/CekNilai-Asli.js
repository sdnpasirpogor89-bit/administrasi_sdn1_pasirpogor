// CekNilai.js - Component (Mobile First + Dark Mode + Tema MERAH)
import React, { useState, useEffect } from "react";
import { exportLeger } from "./Utils";
import { supabase } from "../../supabaseClient";

const CekNilai = ({ userData: initialUserData }) => {
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(initialUserData);

  // ✅ FIX: Tambah state untuk tahun ajaran dan semester
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("2024/2025");
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [academicYears, setAcademicYears] = useState([]);

  // Fetch user data lengkap
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
        }
      }
    };

    fetchCompleteUserData();
  }, [userData?.username]);

  // Fetch academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const { data, error } = await supabase
          .from("academic_years")
          .select("*")
          .order("year", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setAcademicYears(data);
          // Set tahun ajaran aktif
          const activeYear = data.find((y) => y.is_active) || data[0];
          setSelectedTahunAjaran(activeYear.year);
          setSelectedSemester(activeYear.semester);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }
    };

    fetchAcademicYears();
  }, []);

  // Fetch kelas yang tersedia berdasarkan role
  useEffect(() => {
    fetchKelasList();
  }, [userData]);

  const fetchKelasList = async () => {
    try {
      const availableClasses = getAvailableClasses();

      if (availableClasses.length > 0) {
        setKelasList(availableClasses);
        setSelectedKelas(availableClasses[0]);
      }
    } catch (err) {
      console.error("Error fetching kelas:", err);
      const fallback =
        userData?.role === "guru_kelas"
          ? [String(userData.kelas)]
          : ["1", "2", "3", "4", "5", "6"];
      setKelasList(fallback);
      if (fallback.length > 0) setSelectedKelas(fallback[0]);
    }
  };

  const getAvailableClasses = () => {
    if (!userData?.role) return [];

    if (userData.role === "admin") {
      return ["1", "2", "3", "4", "5", "6"];
    } else if (userData.role === "guru_kelas") {
      return userData.kelas ? [String(userData.kelas)] : [];
    } else if (userData.role === "guru_mapel") {
      return ["1", "2", "3", "4", "5", "6"];
    }
    return [];
  };

  const checkAccess = (kelas) => {
    if (!userData?.role) return false;

    if (userData.role === "admin") return true;

    if (userData.role === "guru_kelas") {
      const userKelas = String(userData.kelas);
      const selectedKelas = String(kelas);
      return userKelas === selectedKelas;
    }

    if (userData.role === "guru_mapel") {
      return true;
    }

    return false;
  };

  const fetchData = async () => {
    if (!selectedKelas) {
      setError("Pilih kelas terlebih dahulu");
      return;
    }

    if (!checkAccess(selectedKelas)) {
      setError("Anda tidak memiliki akses untuk melihat kelas ini!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let query = supabase
        .from("nilai_katrol")
        .select("*")
        .eq("kelas", selectedKelas)
        .eq("tahun_ajaran", selectedTahunAjaran)
        .eq("semester", selectedSemester)
        .order("nama_siswa");

      const { data: rawData, error } = await query;

      if (error) throw error;

      const transformedData = transformToLegerFormat(rawData);
      setData(transformedData);
    } catch (err) {
      setError("Gagal mengambil data: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const transformToLegerFormat = (rawData) => {
    const siswaMap = new Map();

    rawData.forEach((item) => {
      if (!siswaMap.has(item.nisn)) {
        siswaMap.set(item.nisn, {
          nisn: item.nisn,
          nama_siswa: item.nama_siswa,
          bindo: "-",
          bing: "-",
          bsunda: "-",
          mtk: "-",
          ipas: "-",
          pancasila: "-",
          senbud: "-",
          pabp: "-",
          pjok: "-",
        });
      }

      const siswa = siswaMap.get(item.nisn);
      const mapel = item.mata_pelajaran.toLowerCase();

      if (mapel.includes("indo")) siswa.bindo = item.nilai_akhir;
      else if (mapel.includes("ing")) siswa.bing = item.nilai_akhir;
      else if (mapel.includes("sunda")) siswa.bsunda = item.nilai_akhir;
      else if (mapel.includes("mtk") || mapel.includes("matematika"))
        siswa.mtk = item.nilai_akhir;
      else if (mapel.includes("ipas")) siswa.ipas = item.nilai_akhir;
      else if (mapel.includes("pancasila")) siswa.pancasila = item.nilai_akhir;
      else if (mapel.includes("senbud") || mapel.includes("seni"))
        siswa.senbud = item.nilai_akhir;
      else if (mapel.includes("pabp") || mapel.includes("agama"))
        siswa.pabp = item.nilai_akhir;
      else if (mapel.includes("pjok") || mapel.includes("jasmani"))
        siswa.pjok = item.nilai_akhir;
    });

    const result = Array.from(siswaMap.values()).map((siswa, index) => {
      const nilaiArray = [
        siswa.bindo,
        siswa.bing,
        siswa.bsunda,
        siswa.mtk,
        siswa.ipas,
        siswa.pancasila,
        siswa.senbud,
        siswa.pabp,
        siswa.pjok,
      ].filter((n) => n !== "-" && !isNaN(parseInt(n)));

      const jumlah = nilaiArray.reduce((sum, n) => sum + parseInt(n), 0);
      const rataRata =
        nilaiArray.length > 0 ? Math.round(jumlah / nilaiArray.length) : "-";

      return {
        no: index + 1,
        ...siswa,
        jumlah: nilaiArray.length > 0 ? jumlah : "-",
        rata_rata: rataRata,
      };
    });

    return result;
  };

  const handleExport = async () => {
    try {
      await exportLeger(
        selectedKelas,
        supabase,
        selectedTahunAjaran,
        selectedSemester,
        "jumlah"
      );
    } catch (err) {
      setError("Gagal export: " + err.message);
    }
  };

  // Auto fetch data ketika kelas dipilih
  useEffect(() => {
    if (
      selectedKelas &&
      checkAccess(selectedKelas) &&
      selectedTahunAjaran &&
      selectedSemester
    ) {
      fetchData();
    } else {
      setData([]);
    }
  }, [selectedKelas, selectedTahunAjaran, selectedSemester]);

  // Icons SVG dengan tema merah
  const DownloadIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  const FilterIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );

  const BookIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-800 dark:text-red-300 mb-2">
          SEKOLAH DASAR NEGERI 1 PASIRPOGOR
        </h1>
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-red-700 dark:text-red-200 mb-2">
          REKAPITULASI NILAI SISWA - KELAS {selectedKelas || "_"}
        </h2>
        <p className="text-sm sm:text-base text-red-600 dark:text-red-400 mb-1">
          {/* ✅ FIXED: Variabel sekarang udah didefinisikan */}
          TAHUN AJARAN {selectedTahunAjaran} - SEMESTER {selectedSemester}
        </p>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-red-100 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="mb-4 pb-3 border-b border-red-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FilterIcon />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">
                Filter Data Nilai Katrol
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Pilih kelas, tahun ajaran, dan semester
              </p>
            </div>
          </div>
        </div>

        {/* FILTER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Kelas Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center gap-1">
                <BookIcon />
                Pilih Kelas
              </span>
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-4 py-3 border border-red-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600
                transition-all duration-200 min-h-[44px] text-base
                hover:border-red-400 dark:hover:border-red-500"
              disabled={kelasList.length === 0}>
              {kelasList.map((kelas) => (
                <option
                  key={kelas}
                  value={kelas}
                  className="dark:bg-gray-700 py-2">
                  Kelas {kelas}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun Ajaran & Semester */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tahun Ajaran
              </label>
              <select
                value={selectedTahunAjaran}
                onChange={(e) => setSelectedTahunAjaran(e.target.value)}
                className="w-full px-4 py-3 border border-red-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-red-500 focus:border-red-500
                  transition-all duration-200 min-h-[44px] text-base">
                {academicYears.map((year) => (
                  <option
                    key={year.id}
                    value={year.year}
                    className="dark:bg-gray-700">
                    {year.year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-4 py-3 border border-red-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-red-500 focus:border-red-500
                  transition-all duration-200 min-h-[44px] text-base">
                <option value="1" className="dark:bg-gray-700">
                  Semester 1
                </option>
                <option value="2" className="dark:bg-gray-700">
                  Semester 2
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={fetchData}
            disabled={loading || !selectedKelas || !checkAccess(selectedKelas)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 
              hover:from-red-700 hover:to-red-800 
              dark:from-red-700 dark:to-red-800 
              dark:hover:from-red-800 dark:hover:to-red-900
              text-white font-medium rounded-lg transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 min-h-[44px] text-base
              shadow-lg hover:shadow-xl active:scale-[0.98]">
            <FilterIcon />
            {loading ? "Memuat..." : "Tampilkan Data"}
          </button>

          <button
            onClick={handleExport}
            disabled={data.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600
              hover:from-emerald-600 hover:to-emerald-700
              dark:from-emerald-600 dark:to-emerald-700
              dark:hover:from-emerald-700 dark:hover:to-emerald-800
              text-white font-medium rounded-lg transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 min-h-[44px] text-base
              shadow-lg hover:shadow-xl active:scale-[0.98] min-w-[160px]">
            <DownloadIcon />
            Export Excel
          </button>
        </div>

        {/* Status Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-red-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                data.length > 0 ? "bg-green-500" : "bg-red-500"
              }`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {data.length > 0
                ? `Data tersedia: ${data.length} siswa`
                : "Belum ada data ditampilkan"}
            </span>
          </div>

          {!checkAccess(selectedKelas) && selectedKelas && (
            <div className="text-sm text-red-600 dark:text-red-400">
              ⚠️ Anda tidak memiliki akses untuk melihat kelas ini
            </div>
          )}
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div
          className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 
          rounded-lg text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* TABLE CONTAINER */}
      {data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-red-100 dark:border-gray-700 overflow-hidden">
          {/* TABLE INFO BAR */}
          <div
            className="px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 
            dark:from-gray-700 dark:to-gray-800 border-b border-red-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                  <span className="text-red-700 dark:text-red-300">📋</span>
                </div>
                <div>
                  <div className="font-bold text-red-800 dark:text-red-300">
                    Rekapitulasi Nilai Kelas {selectedKelas}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    • Tahun Ajaran {selectedTahunAjaran} • Semester{" "}
                    {selectedSemester}
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg border border-red-200 dark:border-gray-600">
                <div className="text-sm font-medium text-red-700 dark:text-red-300">
                  Total: <span className="font-bold">{data.length}</span> Siswa
                </div>
              </div>
            </div>
          </div>

          {/* RESPONSIVE TABLE */}
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <table className="w-full">
                <thead className="bg-red-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-3 text-left font-bold text-red-800 dark:text-red-300 text-sm w-12">
                      No
                    </th>
                    <th className="py-3 px-3 text-left font-bold text-red-800 dark:text-red-300 text-sm w-24">
                      NISN
                    </th>
                    <th className="py-3 px-3 text-left font-bold text-red-800 dark:text-red-300 text-sm min-w-[160px]">
                      Nama Siswa
                    </th>
                    {[
                      "B.Indo",
                      "B.Ing",
                      "B.Sunda",
                      "MTK",
                      "IPAS",
                      "Pancasila",
                      "Senbud",
                      "PABP",
                      "PJOK",
                    ].map((mapel) => (
                      <th
                        key={mapel}
                        className="py-3 px-3 text-center font-bold text-red-800 dark:text-red-300 text-sm w-20">
                        {mapel}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center font-bold text-red-800 dark:text-red-300 text-sm w-20">
                      Jumlah
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-red-800 dark:text-red-300 text-sm w-24">
                      Rata-rata
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((row) => (
                    <tr
                      key={row.nisn}
                      className="hover:bg-red-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">
                        {row.no}
                      </td>
                      <td className="py-3 px-3 font-mono text-red-600 dark:text-red-400 text-sm">
                        {row.nisn}
                      </td>
                      <td className="py-3 px-3 text-gray-800 dark:text-gray-200 font-medium">
                        {row.nama_siswa}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {row.bindo}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {row.bing}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {row.bsunda}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {row.mtk}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {row.ipas}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {row.pancasila}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {row.senbud}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {row.pabp}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {row.pjok}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-red-700 dark:text-red-300 text-lg">
                        {row.jumlah}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                        {row.rata_rata}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE FOOTER */}
          <div className="px-4 py-3 bg-red-50 dark:bg-gray-700 border-t border-red-100 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-sm text-red-600 dark:text-red-400">
                ⬅️ Scroll horizontal untuk melihat semua nilai
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300">
                  📊 {data.length} Data
                </div>
                <div className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-700 dark:text-emerald-300">
                  ✅ Siap Export
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 dark:border-red-400"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <span className="mt-4 text-red-600 dark:text-red-400 font-medium">
            Memuat data nilai katrol...
          </span>
          <span className="text-sm text-red-500 dark:text-red-500 mt-1">
            Silakan tunggu sebentar
          </span>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && data.length === 0 && selectedKelas && (
        <div
          className="bg-gradient-to-br from-red-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 
          border-2 border-dashed border-red-200 dark:border-gray-700 
          rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="text-6xl mb-4 text-red-300 dark:text-red-600">
              📊
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-red-700 dark:text-red-300 mb-3">
              Belum Ada Data Nilai Katrol
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm sm:text-base mb-6">
              Data nilai katrol untuk kelas {selectedKelas} belum tersedia atau
              sedang diproses
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <span className="text-red-700 dark:text-red-300">💡</span>
              <span className="text-sm text-red-600 dark:text-red-400">
                Data akan muncul setelah proses katrol nilai selesai
              </span>
            </div>
          </div>
        </div>
      )}

      {/* INITIAL STATE */}
      {!selectedKelas && (
        <div
          className="bg-gradient-to-br from-red-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 
          border-2 border-dashed border-red-200 dark:border-gray-700 
          rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="text-6xl mb-4 text-red-300 dark:text-red-600">
              📚
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-red-700 dark:text-red-300 mb-3">
              Pilih Kelas Untuk Melihat Nilai Katrol
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm sm:text-base mb-6">
              Silakan pilih kelas dari dropdown untuk melihat data nilai katrol
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <span className="text-red-700 dark:text-red-300">👨‍🏫</span>
              <span className="text-sm text-red-600 dark:text-red-400">
                {userData?.role === "guru_kelas"
                  ? "Anda hanya dapat melihat kelas Anda sendiri"
                  : "Pilih salah satu kelas yang tersedia"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CekNilai;
