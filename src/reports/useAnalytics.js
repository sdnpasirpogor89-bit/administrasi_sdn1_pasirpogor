// src/reports/useAnalytics.js
import { useMemo } from 'react';

/**
 * Custom Hook untuk kalkulasi statistik dari data laporan
 * ✅ Support: students, attendance, attendance-recap, grades, notes
 */
const useAnalytics = (data = [], type, userRole, attendanceViewMode = 'detail') => {
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {};
    }

    switch (type) {
      case 'students':
        return calculateStudentStats(data);
      
      case 'attendance':
        // 🆕 Cek view mode untuk attendance
        if (attendanceViewMode === 'recap') {
          return calculateAttendanceRecapStats(data);
        }
        return calculateAttendanceStats(data);
      
      case 'grades':
        return calculateGradeStats(data);
      
      case 'notes':
        return calculateNotesStats(data, userRole);
      
      default:
        return {};
    }
  }, [data, type, userRole, attendanceViewMode]);

  return stats;
};

/**
 * ========================================
 * STUDENT STATISTICS
 * ========================================
 */
const calculateStudentStats = (data) => {
  const total = data.length;
  const aktif = data.filter(s => s.is_active).length;
  
  // ✅ FIX: Sesuaikan dengan database yang pakai 'Laki-laki' dan 'Perempuan'
  const lakiLaki = data.filter(s => s.jenis_kelamin === 'Laki-laki').length;
  const perempuan = data.filter(s => s.jenis_kelamin === 'Perempuan').length;

  return {
    total,
    aktif,
    'Laki-laki': lakiLaki,
    'Perempuan': perempuan,
    lakiLaki,
    perempuan,
    persentaseAktif: total > 0 ? ((aktif / total) * 100).toFixed(1) : 0,
    persentaseLakiLaki: total > 0 ? ((lakiLaki / total) * 100).toFixed(1) : 0,
    persentasePerempuan: total > 0 ? ((perempuan / total) * 100).toFixed(1) : 0,
  };
};

/**
 * ========================================
 * ATTENDANCE STATISTICS (DETAIL VIEW)
 * ========================================
 */
const calculateAttendanceStats = (data) => {
  const total = data.length;
  
  if (total === 0) {
    return {
      totalHari: 0,
      persenHadir: 0,
      persenSakit: 0,
      persenIzin: 0,
      persenAlpa: 0,
    };
  }

  // Count by status
  const hadir = data.filter(a => a.status === 'Hadir').length;
  const sakit = data.filter(a => a.status === 'Sakit').length;
  const izin = data.filter(a => a.status === 'Izin').length;
  const alpa = data.filter(a => a.status === 'Alpa').length;

  // Get unique dates (total hari)
  const uniqueDates = [...new Set(data.map(a => a.tanggal))];
  const totalHari = uniqueDates.length;

  return {
    totalHari,
    persenHadir: ((hadir / total) * 100).toFixed(1),
    persenSakit: ((sakit / total) * 100).toFixed(1),
    persenIzin: ((izin / total) * 100).toFixed(1),
    persenAlpa: ((alpa / total) * 100).toFixed(1),
  };
};

/**
 * ========================================
 * 🆕 ATTENDANCE RECAP STATISTICS
 * ========================================
 */
const calculateAttendanceRecapStats = (data) => {
  const totalSiswa = data.length;
  
  if (totalSiswa === 0) {
    return {
      totalSiswa: 0,
      rataRataKehadiran: 0,
      siswaRendah: 0,
      siswaSangatBaik: 0,
      tertinggi: 0,
      terendah: 0,
      totalHariEfektif: 0,
    };
  }

  // Hitung persentase kehadiran untuk setiap siswa
  const persentaseArray = data.map(student => {
    const hadir = parseInt(student.hadir) || 0;
    const sakit = parseInt(student.sakit) || 0;
    const izin = parseInt(student.izin) || 0;
    const alpa = parseInt(student.alpa) || 0;
    const totalHari = hadir + sakit + izin + alpa;
    
    return totalHari > 0 ? (hadir / totalHari) * 100 : 0;
  });

  // Rata-rata kehadiran seluruh siswa
  const rataRataKehadiran = persentaseArray.reduce((sum, p) => sum + p, 0) / totalSiswa;

  // Siswa dengan kehadiran < 80%
  const siswaRendah = persentaseArray.filter(p => p < 80).length;

  // Siswa dengan kehadiran >= 90% (Sangat Baik)
  const siswaSangatBaik = persentaseArray.filter(p => p >= 90).length;

  // Persentase tertinggi & terendah
  const tertinggi = Math.max(...persentaseArray);
  const terendah = Math.min(...persentaseArray);

  // Hitung total hari efektif (dari siswa dengan data terbanyak)
  const totalHariEfektif = Math.max(...data.map(s => {
    const h = parseInt(s.hadir) || 0;
    const sa = parseInt(s.sakit) || 0;
    const i = parseInt(s.izin) || 0;
    const a = parseInt(s.alpa) || 0;
    return h + sa + i + a;
  }));

  // Total kehadiran semua siswa
  const totalHadirAll = data.reduce((sum, s) => sum + (parseInt(s.hadir) || 0), 0);
  const totalSakitAll = data.reduce((sum, s) => sum + (parseInt(s.sakit) || 0), 0);
  const totalIzinAll = data.reduce((sum, s) => sum + (parseInt(s.izin) || 0), 0);
  const totalAlpaAll = data.reduce((sum, s) => sum + (parseInt(s.alpa) || 0), 0);

  return {
    totalSiswa,
    rataRataKehadiran: rataRataKehadiran.toFixed(1),
    siswaRendah, // Kehadiran < 80%
    siswaSangatBaik, // Kehadiran >= 90%
    tertinggi: tertinggi.toFixed(1),
    terendah: terendah.toFixed(1),
    totalHariEfektif,
    // Breakdown total untuk summary
    totalHadir: totalHadirAll,
    totalSakit: totalSakitAll,
    totalIzin: totalIzinAll,
    totalAlpa: totalAlpaAll,
  };
};

/**
 * ========================================
 * GRADES STATISTICS
 * ========================================
 */
const calculateGradeStats = (data) => {
  const total = data.length;
  
  if (total === 0) {
    return {
      total: 0,
      rataRata: 0,
      tertinggi: 0,
      terendah: 0,
      tuntas: 0,
      totalSiswa: 0,
    };
  }

  // Get all nilai values
  const nilaiArray = data.map(d => parseFloat(d.nilai) || 0);
  
  // Calculate stats
  const rataRata = nilaiArray.reduce((sum, n) => sum + n, 0) / total;
  const tertinggi = Math.max(...nilaiArray);
  const terendah = Math.min(...nilaiArray);
  const tuntas = data.filter(d => parseFloat(d.nilai) >= 75).length;

  // Get unique students
  const uniqueStudents = [...new Set(data.map(d => d.nisn))];
  const totalSiswa = uniqueStudents.length;

  return {
    total,
    rataRata: rataRata.toFixed(1),
    tertinggi,
    terendah,
    tuntas,
    totalSiswa,
  };
};

/**
 * ========================================
 * NOTES STATISTICS
 * ========================================
 */
const calculateNotesStats = (data, userRole) => {
  const total = data.length;
  
  if (total === 0) {
    return userRole === 'guru_kelas' 
      ? { total: 0, dariSaya: 0, dariGuruLain: 0, butuhTindakLanjut: 0 }
      : { total: 0, perKelas: {}, butuhTindakLanjut: 0 };
  }

  // Count action_taken (butuh tindak lanjut = belum ada action)
  const butuhTindakLanjut = data.filter(n => !n.action_taken || n.action_taken.trim() === '').length;

  if (userRole === 'guru_kelas') {
    // For guru_kelas: count by creator
    const dariSaya = data.filter(n => n.isOwnNote).length;
    const dariGuruLain = total - dariSaya;

    return {
      total,
      dariSaya,
      dariGuruLain,
      butuhTindakLanjut,
    };
  } else {
    // For guru_mapel: count by class
    const perKelas = {};
    data.forEach(note => {
      const kelas = note.class_id;
      if (kelas) {
        perKelas[kelas] = (perKelas[kelas] || 0) + 1;
      }
    });

    return {
      total,
      perKelas,
      butuhTindakLanjut,
    };
  }
};

export default useAnalytics;