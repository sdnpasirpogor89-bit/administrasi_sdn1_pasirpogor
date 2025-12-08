// src/reports/useReportData.js
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";

/**
 * Custom Hook untuk fetch data laporan dari Supabase
 * ✅ Support: students, attendance, attendance-recap, grades, notes, teachers, grades-grid
 * 🔥 REVISI: Nilai Akhir menggunakan RUMUS KATROL
 */
const useReportData = (reportType, filters = {}, user) => {
  const safeUser = user || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    // Safety Check: Hentikan fetch jika user belum terload
    if (!user || !user.role) {
      setError("User tidak ditemukan");
      return;
    }

    // Cache management
    const filtersKey = JSON.stringify(filters);
    const userKey = `${user.id}-${user.role}`;
    const cacheKey = `${reportType}-${filtersKey}-${userKey}`;

    const cached = cacheRef.current[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < 300000) {
      // 5 minutes cache
      setData(cached.data);
      setLoading(false);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      let result;

      switch (reportType) {
        case "students":
          result = await fetchStudentsData(filters, user);
          break;

        case "grades":
          result = await fetchGradesData(filters, user);
          break;

        case "grades-grid":
          result = await fetchGradesGridData(filters, user);
          break;

        case "attendance":
          result = await fetchAttendanceData(filters, user);
          break;

        case "attendance-recap":
          result = await fetchAttendanceRecapData(filters, user);
          break;

        case "notes":
          result = await fetchNotesData(filters, user);
          break;

        case "teachers":
          result = await fetchTeachersData(filters, user);
          break;

        default:
          throw new Error(`Report type tidak valid: ${reportType}`);
      }

      // Cache result
      cacheRef.current[cacheKey] = {
        data: result || [],
        timestamp: now,
      };

      setData(result || []);
    } catch (err) {
      if (err.name === "AbortError") return;

      console.error("Error fetching report data:", err);
      setError(err.message || "Gagal memuat data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, filters, user]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache,
  };
};

/**
 * ========================================
 * FETCH STUDENTS DATA
 * ========================================
 */
const fetchStudentsData = async (filters, user) => {
  try {
    let query = supabase
      .from("students")
      .select("*")
      .order("nama_siswa", { ascending: true });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
    }

    // Filter by kelas
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
    }

    // Filter by status
    if (filters.status && filters.status !== "semua") {
      const isActive = filters.status === "aktif";
      query = query.eq("is_active", isActive);
    }

    // Filter by jenis kelamin
    if (filters.jenisKelamin && filters.jenisKelamin !== "semua") {
      query = query.eq("jenis_kelamin", filters.jenisKelamin);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw new Error(`Gagal memuat data siswa: ${error.message}`);
  }
};

/**
 * ========================================
 * FETCH GRADES DATA - NILAI TERAKHIR (LIST VIEW)
 * ========================================
 */
const fetchGradesData = async (filters, user) => {
  try {
    let query = supabase
      .from("nilai")
      .select("*")
      .order("nama_siswa", { ascending: true });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
    } else if (user.role === "guru_mapel") {
      query = query.eq("mata_pelajaran", user.mata_pelajaran);
    }

    // Filter by kelas
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
    }

    // Filter by mapel
    if (filters.mapel && filters.mapel !== "") {
      query = query.eq("mata_pelajaran", filters.mapel);
    }

    // Filter by semester
    if (filters.semester && filters.semester !== "semua") {
      if (filters.semester === "ganjil") {
        const year = new Date().getFullYear();
        query = query
          .gte("tanggal", `${year}-07-01`)
          .lte("tanggal", `${year}-12-31`);
      } else if (filters.semester === "genap") {
        const year = new Date().getFullYear();
        query = query
          .gte("tanggal", `${year}-01-01`)
          .lte("tanggal", `${year}-06-30`);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    // Fetch settings untuk KKM
    const { data: settingsData } = await supabase
      .from("nilai_settings")
      .select("*");

    // Process data dengan katrol
    const rawGrades = calculateRawGrades(data || []);
    const katrolGrades = applyKatrol(rawGrades, settingsData || []);

    return katrolGrades;
  } catch (error) {
    throw new Error(`Gagal memuat data nilai: ${error.message}`);
  }
};

/**
 * ========================================
 * 🔥 FETCH GRADES GRID DATA - DENGAN KATROL
 * ========================================
 */
const fetchGradesGridData = async (filters, user) => {
  try {
    console.log("🔍 fetchGradesGridData called with filters:", filters);

    // Fetch semua nilai
    let query = supabase
      .from("nilai")
      .select("*")
      .order("nama_siswa", { ascending: true });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
      console.log("👨‍🏫 Guru Kelas filter: kelas =", user.kelas);
    }

    // Filter by kelas (jika ada di filter)
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
      console.log("🏫 Kelas filter:", filters.kelas);
    }

    // Filter by semester
    if (filters.semester && filters.semester !== "semua") {
      const year = new Date().getFullYear();
      if (filters.semester === "ganjil") {
        query = query
          .gte("tanggal", `${year}-07-01`)
          .lte("tanggal", `${year}-12-31`);
        console.log("📅 Semester Ganjil:", `${year}-07-01 to ${year}-12-31`);
      } else if (filters.semester === "genap") {
        query = query
          .gte("tanggal", `${year}-01-01`)
          .lte("tanggal", `${year}-06-30`);
        console.log("📅 Semester Genap:", `${year}-01-01 to ${year}-06-30`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Raw data from Supabase:", data?.length, "records");

    if (!data || data.length === 0) {
      console.warn("⚠️ No data found for grades-grid");
      return [];
    }

    // ✅ FETCH NILAI SETTINGS (KKM & Nilai Maksimal)
    let settingsQuery = supabase.from("nilai_settings").select("*");

    if (filters.kelas && filters.kelas !== "") {
      settingsQuery = settingsQuery.eq("kelas", filters.kelas);
    }

    const { data: settingsData, error: settingsError } = await settingsQuery;
    if (settingsError) throw settingsError;

    console.log("✅ Settings data:", settingsData?.length, "records");

    // 🧮 STEP 1: Hitung nilai mentah (NH + PTS + PAS)
    const rawGrades = calculateRawGrades(data);
    console.log("📊 Raw grades:", rawGrades.length, "records");

    // DEBUG: Tampilkan 5 raw grades pertama
    console.log("🔍 DEBUG Raw grades (5 pertama):");
    rawGrades.slice(0, 5).forEach((g) => {
      console.log(`  ${g.nama_siswa} - ${g.mata_pelajaran}: ${g.nilai_mentah}`);
    });

    // 🔥 STEP 2: Apply katrol
    const katrolGrades = applyKatrol(rawGrades, settingsData || []);
    console.log("🎯 Katrol grades:", katrolGrades.length, "records");

    // DEBUG: Tampilkan 5 hasil katrol pertama
    console.log("🔍 DEBUG Katrol results (5 pertama):");
    katrolGrades.slice(0, 5).forEach((g) => {
      console.log(`  ${g.nama_siswa} - ${g.mata_pelajaran}:`);
      console.log(`    Nilai Mentah: ${g.nilai_mentah}`);
      console.log(`    Nilai Akhir: ${g.nilai}`);
      console.log(`    KKM: ${g.kkm}, Status: ${g.status}`);
    });

    // 📋 STEP 3: Transform ke grid format
    const gridData = transformToGridFormat(katrolGrades);
    console.log("🎯 Grid data:", gridData.length, "students");

    // DEBUG: Tampilkan 3 grid data pertama
    console.log("🔍 DEBUG Grid data (3 pertama):");
    gridData.slice(0, 3).forEach((g) => {
      console.log(`  ${g.nama_siswa}:`);
      console.log(`    B.Indo: ${g["Bahasa Indonesia"]}`);
      console.log(`    B.Ing: ${g["Bahasa Inggris"]}`);
      console.log(`    MTK: ${g["Matematika"]}`);
    });

    return gridData;
  } catch (error) {
    console.error("❌ Error in fetchGradesGridData:", error);
    throw new Error(`Gagal memuat data nilai grid: ${error.message}`);
  }
};

/**
 * ========================================
 * 🧮 HITUNG NILAI MENTAH (Sebelum Katrol)
 * Formula: (NH × 30%) + (PTS × 35%) + (PAS × 35%)
 * ========================================
 */
const calculateRawGrades = (allGrades) => {
  const grouped = {};

  allGrades.forEach((grade) => {
    const key = `${grade.nisn}-${grade.mata_pelajaran}`;

    if (!grouped[key]) {
      grouped[key] = {
        nisn: grade.nisn,
        nama_siswa: grade.nama_siswa,
        kelas: grade.kelas,
        mata_pelajaran: grade.mata_pelajaran,
        nh: [],
        pts: null,
        pas: null,
      };
    }

    const jenis = grade.jenis_nilai.toUpperCase();
    const nilai = parseFloat(grade.nilai);

    // Collect nilai sesuai jenis
    if (jenis.startsWith("NH")) {
      // NH1, NH2, NH3, NH4
      grouped[key].nh.push(nilai);
    } else if (jenis === "PTS" || jenis === "UTS") {
      grouped[key].pts = nilai;
    } else if (jenis === "PAS" || jenis === "UAS") {
      grouped[key].pas = nilai;
    }
  });

  // Hitung nilai mentah
  const result = Object.values(grouped).map((data) => {
    // Rata-rata NH
    const rataNH =
      data.nh.length > 0
        ? data.nh.reduce((sum, n) => sum + n, 0) / data.nh.length
        : 0;

    const pts = data.pts || 0;
    const pas = data.pas || 0;

    // 📐 Nilai mentah (sebelum katrol)
    // Formula: NH (30%) + PTS (35%) + PAS (35%)
    const nilaiMentah = rataNH * 0.3 + pts * 0.35 + pas * 0.35;

    return {
      nisn: data.nisn,
      nama_siswa: data.nama_siswa,
      kelas: data.kelas,
      mata_pelajaran: data.mata_pelajaran,
      nilai_mentah: nilaiMentah,
      detail: {
        rataNH: rataNH.toFixed(2),
        pts: pts,
        pas: pas,
        jumlahNH: data.nh.length,
      },
    };
  });

  return result;
};

/**
 * ========================================
 * 🔥 APPLY KATROL (RUMUS NORMALISASI)
 * ========================================
 * Formula:
 * Nilai Akhir = KKM + ((Nilai Mentah - Min) / (Max - Min)) × (Maks Diinginkan - KKM)
 *
 * Keterangan:
 * - Nilai Mentah: Hasil kalkulasi NH + PTS + PAS
 * - Min: Nilai terendah di kelas untuk mapel tersebut
 * - Max: Nilai tertinggi di kelas untuk mapel tersebut
 * - KKM: Dari tabel nilai_settings
 * - Maks Diinginkan: nilai_maksimal dari tabel nilai_settings
 */
const applyKatrol = (rawGrades, settings) => {
  console.log("🔥 APPLY KATROL - Mulai proses");

  // Group by mata_pelajaran + kelas untuk cari min/max
  const groupedByMapel = {};

  rawGrades.forEach((grade) => {
    const key = `${grade.mata_pelajaran}-${grade.kelas}`;

    if (!groupedByMapel[key]) {
      groupedByMapel[key] = {
        mata_pelajaran: grade.mata_pelajaran,
        kelas: grade.kelas,
        nilai_list: [],
      };
    }

    // Hanya masukkan nilai > 0 untuk perhitungan min/max
    if (grade.nilai_mentah > 0) {
      groupedByMapel[key].nilai_list.push(grade.nilai_mentah);
    }
  });

  // 📊 Hitung min/max per mapel per kelas
  const minMaxMap = {};
  Object.entries(groupedByMapel).forEach(([key, data]) => {
    const nilaiList = data.nilai_list;

    if (nilaiList.length > 0) {
      minMaxMap[key] = {
        min: Math.min(...nilaiList),
        max: Math.max(...nilaiList),
      };
    } else {
      // Default jika tidak ada nilai
      minMaxMap[key] = {
        min: 0,
        max: 100,
      };
    }
  });

  console.log("📊 Min/Max per mapel:", minMaxMap);

  // 🔥 Apply katrol ke setiap siswa
  const result = rawGrades.map((grade) => {
    const key = `${grade.mata_pelajaran}-${grade.kelas}`;
    const minMax = minMaxMap[key];

    // Cari setting untuk mapel & kelas ini
    const setting = settings.find(
      (s) =>
        s.mata_pelajaran === grade.mata_pelajaran && s.kelas === grade.kelas
    );

    const kkm = setting?.kkm || 70;
    const nilaiMaksimal = setting?.nilai_maksimal || 90;

    let nilaiAkhir = 0;

    // ✅ RUMUS KATROL
    if (grade.nilai_mentah > 0 && minMax.max > minMax.min) {
      // Normalisasi nilai
      const normalized =
        (grade.nilai_mentah - minMax.min) / (minMax.max - minMax.min);

      // Apply ke range [KKM, Nilai Maksimal]
      nilaiAkhir = kkm + normalized * (nilaiMaksimal - kkm);

      // Pembulatan ke integer
      nilaiAkhir = Math.round(nilaiAkhir);

      // Pastikan tidak melebihi nilai maksimal
      nilaiAkhir = Math.min(nilaiAkhir, nilaiMaksimal);

      // Pastikan minimal KKM jika nilai mentah > 0
      nilaiAkhir = Math.max(nilaiAkhir, kkm);
    } else if (grade.nilai_mentah > 0 && minMax.max === minMax.min) {
      // Jika semua siswa dapat nilai sama
      nilaiAkhir = nilaiMaksimal;
    } else {
      // Jika nilai mentah = 0 (belum ada nilai)
      nilaiAkhir = 0;
    }

    // DEBUG SETIAP SISWA
    console.log(`📝 ${grade.nama_siswa} - ${grade.mata_pelajaran}:`);
    console.log(`   Nilai Mentah: ${grade.nilai_mentah.toFixed(2)}`);
    console.log(
      `   Min/Max Kelas: ${minMax.min.toFixed(2)}/${minMax.max.toFixed(2)}`
    );
    console.log(`   KKM: ${kkm}, Maksimal: ${nilaiMaksimal}`);
    console.log(`   Hasil Katrol: ${nilaiAkhir}`);
    console.log(`   ---`);

    return {
      nisn: grade.nisn,
      nama_siswa: grade.nama_siswa,
      kelas: grade.kelas,
      mata_pelajaran: grade.mata_pelajaran,
      nilai: nilaiAkhir, // ✅ INI YANG AKAN DITAMPILKAN
      nilai_mentah: grade.nilai_mentah.toFixed(2),
      kkm: kkm,
      status: nilaiAkhir >= kkm ? "Tuntas" : "Belum Tuntas",
      detail: {
        ...grade.detail,
        min: minMax.min.toFixed(2),
        max: minMax.max.toFixed(2),
        nilaiMaksimal: nilaiMaksimal,
      },
    };
  });

  return result;
};

/**
 * ========================================
 * Transform nilai data ke grid format (1 siswa = 1 row)
 * ========================================
 */
const transformToGridFormat = (gradesData) => {
  console.log("🔄 Transform to grid - Input:", gradesData.length, "records");

  // 9 Mata Pelajaran
  const MAPEL_LIST = [
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "Bahasa Sunda",
    "Matematika",
    "IPAS",
    "Pendidikan Pancasila",
    "Seni Budaya",
    "Pendidikan Agama Islam",
    "PJOK",
  ];

  // Group by nisn
  const grouped = {};

  gradesData.forEach((grade) => {
    const key = grade.nisn;

    if (!grouped[key]) {
      grouped[key] = {
        nisn: grade.nisn,
        nama_siswa: grade.nama_siswa,
        kelas: grade.kelas,
        grades: {},
      };
    }

    // Assign nilai per mapel (nilai setelah katrol)
    // ✅ DEBUG: Pastikan ini nilai setelah katrol
    console.log(
      `   Assign: ${grade.nama_siswa} - ${grade.mata_pelajaran} = ${grade.nilai}`
    );
    grouped[key].grades[grade.mata_pelajaran] = grade.nilai;
  });

  // Convert to array with all mapel columns
  const result = Object.values(grouped).map((student) => {
    const row = {
      nisn: student.nisn,
      nama_siswa: student.nama_siswa,
      kelas: student.kelas,
    };

    let total = 0;
    let count = 0;

    // Add all 9 mapel columns + hitung jumlah & rata-rata
    MAPEL_LIST.forEach((mapel) => {
      const nilai = student.grades[mapel];
      if (nilai !== undefined && nilai !== null && nilai !== 0) {
        row[mapel] = nilai;
        total += parseFloat(nilai);
        count++;
      } else {
        row[mapel] = "-";
      }
    });

    // Calculate jumlah dan rata-rata OTOMATIS
    row.jumlah = count > 0 ? Math.round(total) : "-";
    row.rata_rata = count > 0 ? (total / count).toFixed(2) : "-";

    return row;
  });

  // SORT BY NAMA SISWA (A-Z)
  result.sort((a, b) => {
    const nameA = a.nama_siswa.toLowerCase();
    const nameB = b.nama_siswa.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // DEBUG: Tampilkan hasil akhir
  console.log("✅ Transform result (3 pertama):");
  result.slice(0, 3).forEach((r) => {
    console.log(`  ${r.nama_siswa}: B.Indo = ${r["Bahasa Indonesia"]}`);
  });

  return result;
};

/**
 * ========================================
 * FETCH ATTENDANCE DATA (DETAIL HARIAN)
 * ========================================
 */
const fetchAttendanceData = async (filters, user) => {
  try {
    let query = supabase
      .from("attendance")
      .select("*")
      .order("tanggal", { ascending: false });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
    }

    // Filter by kelas
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
    }

    // Filter by bulan & tahun
    if (filters.bulan && filters.bulan !== 0 && filters.tahun) {
      const startDate = `${filters.tahun}-${String(filters.bulan).padStart(
        2,
        "0"
      )}-01`;
      const endDate = new Date(filters.tahun, filters.bulan, 0)
        .toISOString()
        .split("T")[0];
      query = query.gte("tanggal", startDate).lte("tanggal", endDate);
    }

    // Filter by status
    if (filters.statusPresensi && filters.statusPresensi !== "semua") {
      query = query.eq("status", filters.statusPresensi);
    }

    // Filter by jenis presensi (kelas/mapel)
    if (filters.jenisPresensi && filters.jenisPresensi !== "semua") {
      query = query.eq("jenis_presensi", filters.jenisPresensi);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw new Error(`Gagal memuat data presensi: ${error.message}`);
  }
};

/**
 * ========================================
 * FETCH ATTENDANCE RECAP DATA (REKAPITULASI BULANAN)
 * ========================================
 */
const fetchAttendanceRecapData = async (filters, user) => {
  try {
    console.log("📊 fetchAttendanceRecapData called with filters:", filters);

    // STEP 1: Fetch semua data presensi sesuai filter
    let query = supabase
      .from("attendance")
      .select("*")
      .order("nisn", { ascending: true });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
      console.log("👨‍🏫 Guru Kelas filter: kelas =", user.kelas);
    }

    // Filter by kelas
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
      console.log("🏫 Kelas filter:", filters.kelas);
    }

    // ⚠️ WAJIB: Filter by bulan & tahun untuk rekap bulanan
    if (!filters.bulan || filters.bulan === 0 || !filters.tahun) {
      console.warn("⚠️ Bulan/Tahun tidak dipilih, gunakan bulan ini");
      const today = new Date();
      filters.bulan = today.getMonth() + 1;
      filters.tahun = today.getFullYear();
    }

    const startDate = `${filters.tahun}-${String(filters.bulan).padStart(
      2,
      "0"
    )}-01`;
    const lastDay = new Date(filters.tahun, filters.bulan, 0).getDate();
    const endDate = `${filters.tahun}-${String(filters.bulan).padStart(
      2,
      "0"
    )}-${String(lastDay).padStart(2, "0")}`;

    query = query.gte("tanggal", startDate).lte("tanggal", endDate);
    console.log("📅 Date range:", startDate, "to", endDate);

    // Filter by jenis presensi (optional)
    if (filters.jenisPresensi && filters.jenisPresensi !== "semua") {
      query = query.eq("jenis_presensi", filters.jenisPresensi);
    }

    const { data: attendanceData, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Raw attendance data:", attendanceData?.length, "records");

    if (!attendanceData || attendanceData.length === 0) {
      console.warn("⚠️ No attendance data found for recap");
      return [];
    }

    // STEP 2: Fetch daftar siswa untuk kelas yang dipilih
    let studentsQuery = supabase
      .from("students")
      .select("nisn, nama_siswa, kelas")
      .eq("is_active", true);

    if (user.role === "guru_kelas") {
      studentsQuery = studentsQuery.eq("kelas", user.kelas);
    } else if (filters.kelas && filters.kelas !== "") {
      studentsQuery = studentsQuery.eq("kelas", filters.kelas);
    }

    const { data: studentsData, error: studentsError } = await studentsQuery;

    if (studentsError) throw studentsError;

    console.log("👥 Students data:", studentsData?.length, "students");

    // STEP 3: Transform ke format rekap
    const recapData = transformToRecapFormat(attendanceData, studentsData);
    console.log("🎯 Recap data:", recapData.length, "students");

    return recapData;
  } catch (error) {
    console.error("❌ Error in fetchAttendanceRecapData:", error);
    throw new Error(`Gagal memuat rekapitulasi presensi: ${error.message}`);
  }
};

/**
 * Transform attendance data ke format rekapitulasi
 * Output: { nisn, nama_siswa, kelas, hadir, sakit, izin, alpa }
 */
const transformToRecapFormat = (attendanceData, studentsData) => {
  // Buat map siswa untuk lookup cepat
  const studentsMap = new Map(studentsData.map((s) => [s.nisn, s]));

  // Group attendance by NISN
  const grouped = {};

  attendanceData.forEach((record) => {
    const nisn = record.nisn;

    if (!grouped[nisn]) {
      const student = studentsMap.get(nisn);
      grouped[nisn] = {
        id: record.id,
        nisn: nisn,
        nama_siswa:
          student?.nama_siswa || record.nama_siswa || "Tidak Diketahui",
        kelas: student?.kelas || record.kelas || "-",
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
      };
    }

    // Count status
    const status = record.status;
    if (status === "Hadir") {
      grouped[nisn].hadir++;
    } else if (status === "Sakit") {
      grouped[nisn].sakit++;
    } else if (status === "Izin") {
      grouped[nisn].izin++;
    } else if (status === "Alpa") {
      grouped[nisn].alpa++;
    }
  });

  // Convert to array
  let result = Object.values(grouped);

  // Tambahkan siswa yang tidak punya record presensi sama sekali
  studentsData.forEach((student) => {
    if (!grouped[student.nisn]) {
      result.push({
        id: `student-${student.nisn}`,
        nisn: student.nisn,
        nama_siswa: student.nama_siswa,
        kelas: student.kelas,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
      });
    }
  });

  // Sort by nama siswa
  result.sort((a, b) => {
    const nameA = a.nama_siswa.toLowerCase();
    const nameB = b.nama_siswa.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  console.log("📊 Recap summary:", {
    totalStudents: result.length,
    totalHadir: result.reduce((sum, r) => sum + r.hadir, 0),
    totalSakit: result.reduce((sum, r) => sum + r.sakit, 0),
    totalIzin: result.reduce((sum, r) => sum + r.izin, 0),
    totalAlpa: result.reduce((sum, r) => sum + r.alpa, 0),
  });

  return result;
};

/**
 * ========================================
 * FETCH NOTES DATA (CATATAN SISWA)
 * ========================================
 */
const fetchNotesData = async (filters, user) => {
  try {
    console.log("🔍 fetchNotesData called with filters:", filters);
    console.log("👤 User:", user.role, user.id, user.kelas);

    let query = supabase
      .from("catatan_siswa")
      .select("*")
      .order("created_at", { ascending: false });

    // ROLE-BASED FILTERING
    if (user.role === "guru_kelas") {
      query = query.eq("teacher_id", user.id).eq("class_id", user.kelas);

      console.log(
        "👨‍🏫 Guru Kelas filter: teacher_id =",
        user.id,
        ", class_id =",
        user.kelas
      );
    } else if (user.role === "guru_mapel") {
      query = query.eq("teacher_id", user.id);
      console.log("📚 Guru Mapel filter: teacher_id =", user.id);
    }

    // FILTER BY KELAS
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("class_id", filters.kelas);
      console.log("🏫 Kelas filter:", filters.kelas);
    }

    // FILTER BY SISWA (NISN)
    if (filters.nisn && filters.nisn !== "") {
      query = query.eq("nisn", filters.nisn);
      console.log("👤 Siswa filter (NISN):", filters.nisn);
    }

    // FILTER BY TANGGAL (RANGE)
    if (filters.startDate && filters.endDate) {
      query = query
        .gte("created_at", `${filters.startDate}T00:00:00Z`)
        .lte("created_at", `${filters.endDate}T23:59:59Z`);
      console.log("📅 Date range:", filters.startDate, "to", filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Notes data:", data?.length, "records");

    return data || [];
  } catch (error) {
    console.error("❌ Error in fetchNotesData:", error);
    throw new Error(`Gagal memuat data catatan: ${error.message}`);
  }
};

/**
 * ========================================
 * FETCH TEACHERS DATA (DATA GURU)
 * ========================================
 */
const fetchTeachersData = async (filters, user) => {
  try {
    console.log("🔍 fetchTeachersData called with filters:", filters);

    let query = supabase
      .from("teachers")
      .select("*")
      .order("nama_guru", { ascending: true });

    // ROLE-BASED FILTERING (Admin bisa lihat semua)
    if (user.role === "guru_kelas") {
      // Guru kelas hanya bisa lihat guru di sekolahnya (asumsi ada kolom school_id)
      query = query.eq("school_id", user.school_id);
    } else if (user.role === "guru_mapel") {
      // Guru mapel juga hanya bisa lihat guru di sekolahnya
      query = query.eq("school_id", user.school_id);
    }
    // Admin bisa lihat semua tanpa filter school_id

    // FILTER BY STATUS
    if (filters.status && filters.status !== "semua") {
      const isActive = filters.status === "aktif";
      query = query.eq("is_active", isActive);
    }

    // FILTER BY ROLE (jika ada)
    if (filters.role && filters.role !== "semua") {
      query = query.eq("role", filters.role);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Teachers data:", data?.length, "records");

    return data || [];
  } catch (error) {
    console.error("❌ Error in fetchTeachersData:", error);
    throw new Error(`Gagal memuat data guru: ${error.message}`);
  }
};

export default useReportData;
