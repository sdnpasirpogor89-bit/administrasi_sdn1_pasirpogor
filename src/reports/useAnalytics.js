// src/reports/useAnalytics.js
import { useMemo } from 'react';

/**
 * Custom Hook untuk kalkulasi statistik dari data laporan
 * 
 * @param {array} data - Array data dari useReportData
 * @param {string} reportType - Jenis laporan: 'students' | 'grades' | 'attendance' | 'teachers'
 * 
 * @returns {object} Statistics object (berbeda per reportType)
 */
export const useAnalytics = (data, reportType) => {
  return useMemo(() => {
    // Return empty jika tidak ada data
    if (!data || data.length === 0) {
      return getEmptyStats(reportType);
    }

    // Kalkulasi berdasarkan jenis laporan
    switch (reportType) {
      case 'students':
        return calculateStudentStats(data);

      case 'grades':
        return calculateGradeStats(data);

      case 'attendance':
        return calculateAttendanceStats(data);

      case 'teachers':
        return calculateTeacherStats(data);

      default:
        return {};
    }
  }, [data, reportType]);
};

// ========================================
// STUDENTS STATISTICS
// ========================================

/**
 * Kalkulasi statistik siswa
 * 
 * Returns:
 * - total: Total siswa
 * - aktif: Jumlah siswa aktif
 * - tidakAktif: Jumlah siswa tidak aktif
 * - lakiLaki: Jumlah siswa laki-laki
 * - perempuan: Jumlah siswa perempuan
 * - perKelas: Breakdown per kelas
 * - persentaseAktif: Persentase siswa aktif
 */
const calculateStudentStats = (data) => {
  const total = data.length;
  const aktif = data.filter(s => s.is_active === true).length;
  const tidakAktif = total - aktif;
  const lakiLaki = data.filter(s => s.jenis_kelamin === 'L').length;
  const perempuan = data.filter(s => s.jenis_kelamin === 'P').length;

  // Breakdown per kelas
  const perKelas = data.reduce((acc, student) => {
    const kelas = student.kelas;
    if (!acc[kelas]) {
      acc[kelas] = {
        total: 0,
        aktif: 0,
        lakiLaki: 0,
        perempuan: 0,
      };
    }
    acc[kelas].total++;
    if (student.is_active) acc[kelas].aktif++;
    if (student.jenis_kelamin === 'L') acc[kelas].lakiLaki++;
    if (student.jenis_kelamin === 'P') acc[kelas].perempuan++;
    return acc;
  }, {});

  // Persentase
  const persentaseAktif = total > 0 ? ((aktif / total) * 100).toFixed(1) : 0;
  const persentaseLakiLaki = total > 0 ? ((lakiLaki / total) * 100).toFixed(1) : 0;
  const persentasePerempuan = total > 0 ? ((perempuan / total) * 100).toFixed(1) : 0;

  return {
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
};

// ========================================
// GRADES STATISTICS
// ========================================

/**
 * Kalkulasi statistik nilai
 * 
 * Returns:
 * - total: Total data nilai
 * - rataRata: Rata-rata nilai keseluruhan
 * - tertinggi: Nilai tertinggi
 * - terendah: Nilai terendah
 * - median: Nilai median
 * - diAtas75: Jumlah nilai di atas 75 (KKM)
 * - diBawah75: Jumlah nilai di bawah 75
 * - persentaseLulus: Persentase yang lulus (≥75)
 * - perMapel: Breakdown per mata pelajaran
 * - perKelas: Breakdown per kelas
 * - perJenisNilai: Breakdown per jenis nilai (UTS, UAS, dll)
 */
const calculateGradeStats = (data) => {
  const total = data.length;
  const nilaiArray = data.map(d => d.nilai).filter(n => n !== null && n !== undefined);

  if (nilaiArray.length === 0) {
    return getEmptyStats('grades');
  }

  // Basic stats
  const sum = nilaiArray.reduce((acc, val) => acc + val, 0);
  const rataRata = (sum / nilaiArray.length).toFixed(2);
  const tertinggi = Math.max(...nilaiArray);
  const terendah = Math.min(...nilaiArray);

  // Median
  const sorted = [...nilaiArray].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2)
    : sorted[mid].toFixed(2);

  // KKM analysis (75 sebagai standar)
  const diAtas75 = nilaiArray.filter(n => n >= 75).length;
  const diBawah75 = nilaiArray.filter(n => n < 75).length;
  const persentaseLulus = total > 0 ? ((diAtas75 / total) * 100).toFixed(1) : 0;

  // Breakdown per mata pelajaran
  const perMapel = data.reduce((acc, item) => {
    const mapel = item.mata_pelajaran;
    if (!acc[mapel]) {
      acc[mapel] = {
        total: 0,
        rataRata: 0,
        nilaiArray: [],
      };
    }
    acc[mapel].total++;
    acc[mapel].nilaiArray.push(item.nilai);
    return acc;
  }, {});

  // Calculate rata-rata per mapel
  Object.keys(perMapel).forEach(mapel => {
    const values = perMapel[mapel].nilaiArray;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    perMapel[mapel].rataRata = parseFloat(avg.toFixed(2));
    delete perMapel[mapel].nilaiArray; // Remove array setelah kalkulasi
  });

  // Breakdown per kelas
  const perKelas = data.reduce((acc, item) => {
    const kelas = item.kelas;
    if (!acc[kelas]) {
      acc[kelas] = {
        total: 0,
        rataRata: 0,
        nilaiArray: [],
      };
    }
    acc[kelas].total++;
    acc[kelas].nilaiArray.push(item.nilai);
    return acc;
  }, {});

  // Calculate rata-rata per kelas
  Object.keys(perKelas).forEach(kelas => {
    const values = perKelas[kelas].nilaiArray;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    perKelas[kelas].rataRata = parseFloat(avg.toFixed(2));
    delete perKelas[kelas].nilaiArray;
  });

  // Breakdown per jenis nilai (UTS, UAS, Quiz, Tugas)
  const perJenisNilai = data.reduce((acc, item) => {
    const jenis = item.jenis_nilai;
    if (!acc[jenis]) {
      acc[jenis] = {
        total: 0,
        rataRata: 0,
        nilaiArray: [],
      };
    }
    acc[jenis].total++;
    acc[jenis].nilaiArray.push(item.nilai);
    return acc;
  }, {});

  // Calculate rata-rata per jenis nilai
  Object.keys(perJenisNilai).forEach(jenis => {
    const values = perJenisNilai[jenis].nilaiArray;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    perJenisNilai[jenis].rataRata = parseFloat(avg.toFixed(2));
    delete perJenisNilai[jenis].nilaiArray;
  });

  // Grade distribution (A, B, C, D, E)
  const gradeDistribution = {
    A: nilaiArray.filter(n => n >= 90).length,  // 90-100
    B: nilaiArray.filter(n => n >= 80 && n < 90).length,  // 80-89
    C: nilaiArray.filter(n => n >= 70 && n < 80).length,  // 70-79
    D: nilaiArray.filter(n => n >= 60 && n < 70).length,  // 60-69
    E: nilaiArray.filter(n => n < 60).length,   // <60
  };

  return {
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
};

// ========================================
// ATTENDANCE STATISTICS
// ========================================

/**
 * Kalkulasi statistik presensi
 * 
 * Returns:
 * - total: Total data presensi
 * - hadir: Jumlah hadir
 * - sakit: Jumlah sakit
 * - izin: Jumlah izin
 * - alpha: Jumlah alpha
 * - persentaseKehadiran: Persentase kehadiran
 * - perKelas: Breakdown per kelas
 * - perJenisPresensi: Breakdown per jenis presensi (Pagi/Siang)
 * - trendHarian: Trend kehadiran per hari (7 hari terakhir)
 */
const calculateAttendanceStats = (data) => {
  const total = data.length;
  const hadir = data.filter(a => a.status === 'Hadir').length;
  const sakit = data.filter(a => a.status === 'Sakit').length;
  const izin = data.filter(a => a.status === 'Izin').length;
  const alpha = data.filter(a => a.status === 'Alpha').length;

  // Persentase kehadiran
  const persentaseKehadiran = total > 0 ? ((hadir / total) * 100).toFixed(1) : 0;
  const persentaseSakit = total > 0 ? ((sakit / total) * 100).toFixed(1) : 0;
  const persentaseIzin = total > 0 ? ((izin / total) * 100).toFixed(1) : 0;
  const persentaseAlpha = total > 0 ? ((alpha / total) * 100).toFixed(1) : 0;

  // Breakdown per kelas
  const perKelas = data.reduce((acc, item) => {
    const kelas = item.kelas;
    if (!acc[kelas]) {
      acc[kelas] = {
        total: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0,
        persentaseKehadiran: 0,
      };
    }
    acc[kelas].total++;
    if (item.status === 'Hadir') acc[kelas].hadir++;
    if (item.status === 'Sakit') acc[kelas].sakit++;
    if (item.status === 'Izin') acc[kelas].izin++;
    if (item.status === 'Alpha') acc[kelas].alpha++;
    return acc;
  }, {});

  // Calculate persentase per kelas
  Object.keys(perKelas).forEach(kelas => {
    const kelasData = perKelas[kelas];
    kelasData.persentaseKehadiran = kelasData.total > 0
      ? parseFloat(((kelasData.hadir / kelasData.total) * 100).toFixed(1))
      : 0;
  });

  // Breakdown per jenis presensi (Pagi/Siang)
  const perJenisPresensi = data.reduce((acc, item) => {
    const jenis = item.jenis_presensi || 'Tidak Ditentukan';
    if (!acc[jenis]) {
      acc[jenis] = {
        total: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0,
      };
    }
    acc[jenis].total++;
    if (item.status === 'Hadir') acc[jenis].hadir++;
    if (item.status === 'Sakit') acc[jenis].sakit++;
    if (item.status === 'Izin') acc[jenis].izin++;
    if (item.status === 'Alpha') acc[jenis].alpha++;
    return acc;
  }, {});

  // Trend harian (7 hari terakhir)
  const trendHarian = data.reduce((acc, item) => {
    const tanggal = item.tanggal;
    if (!acc[tanggal]) {
      acc[tanggal] = {
        tanggal,
        total: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0,
      };
    }
    acc[tanggal].total++;
    if (item.status === 'Hadir') acc[tanggal].hadir++;
    if (item.status === 'Sakit') acc[tanggal].sakit++;
    if (item.status === 'Izin') acc[tanggal].izin++;
    if (item.status === 'Alpha') acc[tanggal].alpha++;
    return acc;
  }, {});

  // Convert to array dan sort by date
  const trendArray = Object.values(trendHarian)
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, 7); // Ambil 7 hari terakhir

  return {
    total,
    hadir,
    sakit,
    izin,
    alpha,
    persentaseKehadiran: parseFloat(persentaseKehadiran),
    persentaseSakit: parseFloat(persentaseSakit),
    persentaseIzin: parseFloat(persentaseIzin),
    persentaseAlpha: parseFloat(persentaseAlpha),
    perKelas,
    perJenisPresensi,
    trendHarian: trendArray,
  };
};

// ========================================
// TEACHERS STATISTICS
// ========================================

/**
 * Kalkulasi statistik guru (aktivitas input)
 * 
 * Returns:
 * - totalGuru: Total guru
 * - totalInputNilai: Total input nilai (semua guru)
 * - totalInputPresensi: Total input presensi (semua guru)
 * - totalInput: Total input keseluruhan
 * - rataRataInputPerGuru: Rata-rata input per guru
 * - guruTerbanyak: Guru dengan input terbanyak
 * - guruTersedikit: Guru dengan input tersedikit
 * - perRole: Breakdown per role (Guru Kelas vs Guru Mapel)
 */
const calculateTeacherStats = (data) => {
  const totalGuru = data.length;
  const totalInputNilai = data.reduce((sum, guru) => sum + (guru.totalInputNilai || 0), 0);
  const totalInputPresensi = data.reduce((sum, guru) => sum + (guru.totalInputPresensi || 0), 0);
  const totalInput = totalInputNilai + totalInputPresensi;

  // Rata-rata input per guru
  const rataRataInputPerGuru = totalGuru > 0
    ? (totalInput / totalGuru).toFixed(1)
    : 0;

  // Guru dengan input terbanyak & tersedikit
  const sortedByInput = [...data].sort((a, b) => b.totalInput - a.totalInput);
  const guruTerbanyak = sortedByInput[0] || null;
  const guruTersedikit = sortedByInput[sortedByInput.length - 1] || null;

  // Breakdown per role
  const perRole = data.reduce((acc, guru) => {
    const role = guru.role;
    if (!acc[role]) {
      acc[role] = {
        total: 0,
        totalInputNilai: 0,
        totalInputPresensi: 0,
        totalInput: 0,
      };
    }
    acc[role].total++;
    acc[role].totalInputNilai += guru.totalInputNilai || 0;
    acc[role].totalInputPresensi += guru.totalInputPresensi || 0;
    acc[role].totalInput += guru.totalInput || 0;
    return acc;
  }, {});

  // Guru yang belum input (dalam 7 hari terakhir)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const guruBelumInput = data.filter(guru => {
    if (!guru.terakhirInput) return true;
    const lastInputDate = new Date(guru.terakhirInput);
    return lastInputDate < sevenDaysAgo;
  }).length;

  return {
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
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Return empty stats structure berdasarkan reportType
 */
const getEmptyStats = (reportType) => {
  switch (reportType) {
    case 'students':
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

    case 'grades':
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

    case 'attendance':
      return {
        total: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0,
        persentaseKehadiran: 0,
        persentaseSakit: 0,
        persentaseIzin: 0,
        persentaseAlpha: 0,
        perKelas: {},
        perJenisPresensi: {},
        trendHarian: [],
      };

    case 'teachers':
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