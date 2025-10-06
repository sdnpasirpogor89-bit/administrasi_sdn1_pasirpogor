// src/reports/useAnalytics.js
import { useMemo } from "react";

/**
 * Custom Hook untuk kalkulasi statistik dari data laporan
 * ✅ FIXED: Added data flattening for JOIN queries
 * ✅ Optimized: Single-pass iterations, better null handling, consistent naming
 *
 * @param {array} data - Array data dari useReportData
 * @param {string} reportType - Jenis laporan: 'students' | 'grades' | 'attendance' | 'teachers'
 *
 * @returns {object} Statistics object (berbeda per reportType)
 */
const useAnalytics = (data, reportType) => {
  return useMemo(() => {
    console.log('🧮 useAnalytics INPUT:', { 
      reportType, 
      hasData: !!data, 
      dataLength: data?.length || 0,
      firstItem: data?.[0]
    });

    // FLATTEN DATA DULU SEBELUM PROCESS - FIX untuk JOIN queries
    const flattenedData = flattenData(data, reportType);
    console.log('📊 Flattened data first item:', flattenedData?.[0]);
    console.log('📊 Flattened data keys:', flattenedData?.[0] ? Object.keys(flattenedData[0]) : 'No data');

    // Return empty jika tidak ada data
    if (!flattenedData || flattenedData.length === 0) {
      const emptyStats = getEmptyStats(reportType);
      console.log('⚠️ useAnalytics: Returning empty stats', emptyStats);
      return emptyStats;
    }

    // Kalkulasi berdasarkan jenis laporan
    let result;
    switch (reportType) {
      case "students":
        result = calculateStudentStats(flattenedData);
        break;

      case "grades":
        result = calculateGradeStats(flattenedData);
        break;

      case "attendance":
        result = calculateAttendanceStats(flattenedData);
        break;

      case "teachers":
        result = calculateTeacherStats(flattenedData);
        break;

      default:
        result = getEmptyStats(reportType);
    }

    console.log('✅ useAnalytics OUTPUT:', { reportType, result });
    return result;
  }, [data, reportType]);
};

// ========================================
// DATA FLATTENING UTILITY
// ========================================

/**
 * Flatten data structure dari JOIN queries
 * ✅ FIXED: Handle nested students object dari Supabase JOIN
 */
const flattenData = (data, reportType) => {
  if (!data || !Array.isArray(data)) return data;
  
  return data.map(item => {
    // Jika ada nested students object, flatten it
    if (item.students && typeof item.students === 'object') {
      const flattened = {
        ...item,
        ...item.students,
        // Prioritize data dari nested students object
        nama_siswa: item.students.nama_siswa || item.nama_siswa,
        is_active: item.students.is_active !== undefined ? item.students.is_active : item.is_active,
        jenis_kelamin: item.students.jenis_kelamin || item.jenis_kelamin,
        kelas: item.students.kelas || item.kelas
      };
      
      // Remove the nested students object to avoid duplication
      delete flattened.students;
      return flattened;
    }
    
    return item;
  });
};

// ========================================
// STUDENTS STATISTICS
// ========================================

/**
 * Kalkulasi statistik siswa
 * ✅ Optimized: Single-pass iteration
 */
const calculateStudentStats = (data) => {
  const total = data.length;
  
  // Single-pass iteration untuk semua counting
  let aktif = 0;
  let lakiLaki = 0;
  let perempuan = 0;
  const perKelas = {};

  data.forEach((student) => {
    // Count aktif - handle various boolean representations
    const isActive = student.is_active === true || student.is_active === 'true' || student.is_active === 1;
    if (isActive) aktif++;

    // Count gender
    if (student.jenis_kelamin === "Laki-laki") lakiLaki++;
    if (student.jenis_kelamin === "Perempuan") perempuan++;

    // Breakdown per kelas
    const kelas = student.kelas || 'Tidak Diketahui';
    if (!perKelas[kelas]) {
      perKelas[kelas] = {
        total: 0,
        aktif: 0,
        lakiLaki: 0,
        perempuan: 0,
      };
    }
    perKelas[kelas].total++;
    if (isActive) perKelas[kelas].aktif++;
    if (student.jenis_kelamin === "Laki-laki") perKelas[kelas].lakiLaki++;
    if (student.jenis_kelamin === "Perempuan") perKelas[kelas].perempuan++;
  });

  const tidakAktif = total - aktif;

  // Persentase dengan safe division
  const persentaseAktif = total > 0 ? ((aktif / total) * 100).toFixed(1) : "0.0";
  const persentaseLakiLaki = total > 0 ? ((lakiLaki / total) * 100).toFixed(1) : "0.0";
  const persentasePerempuan = total > 0 ? ((perempuan / total) * 100).toFixed(1) : "0.0";

  const result = {
    total,
    aktif,
    tidakAktif,
    lakiLaki,
    perempuan,
    perKelas,
    persentaseAktif: parseFloat(persentaseAktif),
    persentaseLakiLaki: parseFloat(persentaseLakiLaki),
    persentasePerempuan: parseFloat(persentasePerempuan),
  };

  console.log('✅ calculateStudentStats RESULT:', result);
  return result;
};

// ========================================
// GRADES STATISTICS
// ========================================

/**
 * Kalkulasi statistik nilai
 * ✅ Fixed: Better null handling, safe division
 */
const calculateGradeStats = (data) => {
  const total = data.length;
  
  // Filter valid nilai dulu
  const nilaiArray = data
    .map((d) => d.nilai)
    .filter((n) => n !== null && n !== undefined && typeof n === 'number' && !isNaN(n));

  if (nilaiArray.length === 0) {
    console.log('⚠️ calculateGradeStats: No valid nilai data');
    return getEmptyStats("grades");
  }

  // Basic stats
  const sum = nilaiArray.reduce((acc, val) => acc + val, 0);
  const rataRata = (sum / nilaiArray.length).toFixed(2);
  const tertinggi = Math.max(...nilaiArray);
  const terendah = Math.min(...nilaiArray);

  // Median
  const sorted = [...nilaiArray].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2)
      : sorted[mid].toFixed(2);

  // KKM analysis (75 sebagai standar)
  let diAtas75 = 0;
  let diBawah75 = 0;
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  nilaiArray.forEach((n) => {
    if (n >= 75) diAtas75++;
    else diBawah75++;

    // Grade distribution
    if (n >= 90) gradeDistribution.A++;
    else if (n >= 80) gradeDistribution.B++;
    else if (n >= 70) gradeDistribution.C++;
    else if (n >= 60) gradeDistribution.D++;
    else gradeDistribution.E++;
  });

  const persentaseLulus = total > 0 ? ((diAtas75 / total) * 100).toFixed(1) : "0.0";

  // Breakdown per mata pelajaran (with null filtering)
  const perMapel = {};
  data.forEach((item) => {
    // Skip kalau nilai null/undefined
    if (item.nilai === null || item.nilai === undefined || typeof item.nilai !== 'number' || isNaN(item.nilai)) {
      return;
    }

    const mapel = item.mata_pelajaran || 'Tidak Diketahui';
    if (!perMapel[mapel]) {
      perMapel[mapel] = {
        total: 0,
        sum: 0,
        rataRata: 0,
      };
    }
    perMapel[mapel].total++;
    perMapel[mapel].sum += item.nilai;
  });

  // Calculate rata-rata per mapel dengan safe division
  Object.keys(perMapel).forEach((mapel) => {
    const mapelData = perMapel[mapel];
    mapelData.rataRata = mapelData.total > 0 
      ? parseFloat((mapelData.sum / mapelData.total).toFixed(2))
      : 0;
    delete mapelData.sum; // Remove sum setelah kalkulasi
  });

  // Breakdown per kelas (with null filtering)
  const perKelas = {};
  data.forEach((item) => {
    if (item.nilai === null || item.nilai === undefined || typeof item.nilai !== 'number' || isNaN(item.nilai)) {
      return;
    }

    const kelas = item.kelas || 'Tidak Diketahui';
    if (!perKelas[kelas]) {
      perKelas[kelas] = {
        total: 0,
        sum: 0,
        rataRata: 0,
      };
    }
    perKelas[kelas].total++;
    perKelas[kelas].sum += item.nilai;
  });

  // Calculate rata-rata per kelas
  Object.keys(perKelas).forEach((kelas) => {
    const kelasData = perKelas[kelas];
    kelasData.rataRata = kelasData.total > 0
      ? parseFloat((kelasData.sum / kelasData.total).toFixed(2))
      : 0;
    delete kelasData.sum;
  });

  // Breakdown per jenis nilai (with null filtering)
  const perJenisNilai = {};
  data.forEach((item) => {
    if (item.nilai === null || item.nilai === undefined || typeof item.nilai !== 'number' || isNaN(item.nilai)) {
      return;
    }

    const jenis = item.jenis_nilai || 'Tidak Diketahui';
    if (!perJenisNilai[jenis]) {
      perJenisNilai[jenis] = {
        total: 0,
        sum: 0,
        rataRata: 0,
      };
    }
    perJenisNilai[jenis].total++;
    perJenisNilai[jenis].sum += item.nilai;
  });

  // Calculate rata-rata per jenis nilai
  Object.keys(perJenisNilai).forEach((jenis) => {
    const jenisData = perJenisNilai[jenis];
    jenisData.rataRata = jenisData.total > 0
      ? parseFloat((jenisData.sum / jenisData.total).toFixed(2))
      : 0;
    delete jenisData.sum;
  });

  const result = {
    total,
    rataRata: parseFloat(rataRata),
    tertinggi,
    terendah,
    median: parseFloat(median),
    diAtas75,
    diBawah75,
    persentaseLulus: parseFloat(persentaseLulus),
    perMapel,
    perKelas,
    perJenisNilai,
    gradeDistribution,
  };

  console.log('✅ calculateGradeStats RESULT:', result);
  return result;
};

// ========================================
// ATTENDANCE STATISTICS
// ========================================

/**
 * Kalkulasi statistik presensi
 * ✅ Fixed: Consistent naming (lowercase), single-pass iteration
 */
const calculateAttendanceStats = (data) => {
  const total = data.length;

  // Single-pass iteration untuk semua counting
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;
  const perKelas = {};
  const perJenisPresensi = {};
  const trendHarian = {};

  data.forEach((item) => {
    const status = item.status || 'Tidak Diketahui';

    // Count status
    if (status === "Hadir") hadir++;
    else if (status === "Sakit") sakit++;
    else if (status === "Izin") izin++;
    else if (status === "Alpa") alpa++;

    // Breakdown per kelas
    const kelas = item.kelas || 'Tidak Diketahui';
    if (!perKelas[kelas]) {
      perKelas[kelas] = {
        total: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        persentaseKehadiran: 0,
      };
    }
    perKelas[kelas].total++;
    if (status === "Hadir") perKelas[kelas].hadir++;
    else if (status === "Sakit") perKelas[kelas].sakit++;
    else if (status === "Izin") perKelas[kelas].izin++;
    else if (status === "Alpa") perKelas[kelas].alpa++;

    // Breakdown per jenis presensi
    const jenis = item.jenis_presensi || "Tidak Ditentukan";
    if (!perJenisPresensi[jenis]) {
      perJenisPresensi[jenis] = {
        total: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
      };
    }
    perJenisPresensi[jenis].total++;
    if (status === "Hadir") perJenisPresensi[jenis].hadir++;
    else if (status === "Sakit") perJenisPresensi[jenis].sakit++;
    else if (status === "Izin") perJenisPresensi[jenis].izin++;
    else if (status === "Alpa") perJenisPresensi[jenis].alpa++;

    // Trend harian
    const tanggal = item.tanggal;
    if (tanggal) {
      if (!trendHarian[tanggal]) {
        trendHarian[tanggal] = {
          tanggal,
          total: 0,
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpa: 0,
        };
      }
      trendHarian[tanggal].total++;
      if (status === "Hadir") trendHarian[tanggal].hadir++;
      else if (status === "Sakit") trendHarian[tanggal].sakit++;
      else if (status === "Izin") trendHarian[tanggal].izin++;
      else if (status === "Alpa") trendHarian[tanggal].alpa++;
    }
  });

  // Persentase kehadiran dengan safe division
  const persentaseKehadiran = total > 0 ? ((hadir / total) * 100).toFixed(1) : "0.0";
  const persentaseSakit = total > 0 ? ((sakit / total) * 100).toFixed(1) : "0.0";
  const persentaseIzin = total > 0 ? ((izin / total) * 100).toFixed(1) : "0.0";
  const persentaseAlpa = total > 0 ? ((alpa / total) * 100).toFixed(1) : "0.0";

  // Calculate persentase per kelas
  Object.keys(perKelas).forEach((kelas) => {
    const kelasData = perKelas[kelas];
    kelasData.persentaseKehadiran =
      kelasData.total > 0
        ? parseFloat(((kelasData.hadir / kelasData.total) * 100).toFixed(1))
        : 0;
  });

  // Convert trend to array dan sort by date
  const trendArray = Object.values(trendHarian)
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, 7); // Ambil 7 hari terakhir

  const result = {
    total,
    hadir,
    sakit,
    izin,
    alpa,
    persentaseKehadiran: parseFloat(persentaseKehadiran),
    persentaseSakit: parseFloat(persentaseSakit),
    persentaseIzin: parseFloat(persentaseIzin),
    persentaseAlpa: parseFloat(persentaseAlpa),
    perKelas,
    perJenisPresensi,
    trendHarian: trendArray,
  };

  console.log('✅ calculateAttendanceStats RESULT:', result);
  return result;
};

// ========================================
// TEACHERS STATISTICS
// ========================================

/**
 * Kalkulasi statistik guru (aktivitas input)
 * ✅ Improved: Better null handling, safe division
 */
const calculateTeacherStats = (data) => {
  const totalGuru = data.length;

  // Single-pass untuk total counts
  let totalInputNilai = 0;
  let totalInputPresensi = 0;
  const perRole = {};

  data.forEach((guru) => {
    totalInputNilai += guru.totalInputNilai || 0;
    totalInputPresensi += guru.totalInputPresensi || 0;

    // Breakdown per role
    const role = guru.role || 'Tidak Diketahui';
    if (!perRole[role]) {
      perRole[role] = {
        total: 0,
        totalInputNilai: 0,
        totalInputPresensi: 0,
        totalInput: 0,
      };
    }
    perRole[role].total++;
    perRole[role].totalInputNilai += guru.totalInputNilai || 0;
    perRole[role].totalInputPresensi += guru.totalInputPresensi || 0;
    perRole[role].totalInput += guru.total_input || 0;
  });

  const totalInput = totalInputNilai + totalInputPresensi;

  // Rata-rata input per guru dengan safe division
  const rataRataInputPerGuru =
    totalGuru > 0 ? (totalInput / totalGuru).toFixed(1) : "0.0";

  // Guru dengan input terbanyak & tersedikit
  const sortedByInput = [...data].sort(
    (a, b) => (b.total_input || 0) - (a.total_input || 0)
  );
  const guruTerbanyak = sortedByInput[0] || null;
  const guruTersedikit = sortedByInput[sortedByInput.length - 1] || null;

  // Guru yang belum input (dalam 7 hari terakhir)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const guruBelumInput = data.filter((guru) => {
    if (!guru.terakhirInput) return true;
    try {
      const lastInputDate = new Date(guru.terakhirInput);
      // Check if date is valid
      if (isNaN(lastInputDate.getTime())) return true;
      return lastInputDate < sevenDaysAgo;
    } catch (e) {
      return true; // If error parsing date, consider as not input
    }
  }).length;

  const result = {
    totalGuru,
    totalInputNilai,
    totalInputPresensi,
    totalInput,
    rataRataInputPerGuru: parseFloat(rataRataInputPerGuru),
    guruTerbanyak,
    guruTersedikit,
    perRole,
    guruBelumInput,
  };

  console.log('✅ calculateTeacherStats RESULT:', result);
  return result;
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Return empty stats structure berdasarkan reportType
 * ✅ Fixed: Consistent naming
 */
const getEmptyStats = (reportType) => {
  switch (reportType) {
    case "students":
      return {
        total: 0,
        aktif: 0,
        tidakAktif: 0,
        lakiLaki: 0,
        perempuan: 0,
        perKelas: {},
        persentaseAktif: 0,
        persentaseLakiLaki: 0,
        persentasePerempuan: 0,
      };

    case "grades":
      return {
        total: 0,
        rataRata: 0,
        tertinggi: 0,
        terendah: 0,
        median: 0,
        diAtas75: 0,
        diBawah75: 0,
        persentaseLulus: 0,
        perMapel: {},
        perKelas: {},
        perJenisNilai: {},
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0 },
      };

    case "attendance":
      return {
        total: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        persentaseKehadiran: 0,
        persentaseSakit: 0,
        persentaseIzin: 0,
        persentaseAlpa: 0,
        perKelas: {},
        perJenisPresensi: {},
        trendHarian: [],
      };

    case "teachers":
      return {
        totalGuru: 0,
        totalInputNilai: 0,
        totalInputPresensi: 0,
        totalInput: 0,
        rataRataInputPerGuru: 0,
        guruTerbanyak: null,
        guruTersedikit: null,
        perRole: {},
        guruBelumInput: 0,
      };

    default:
      return {};
  }
};

export default useAnalytics;