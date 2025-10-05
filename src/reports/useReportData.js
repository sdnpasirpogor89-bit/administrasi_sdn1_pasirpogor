// src/reports/useReportData.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom Hook untuk fetch data laporan dari Supabase
 */
export const useReportData = (reportType, filters = {}, user) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user || !user.role) {
      setError('User tidak ditemukan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;

      switch (reportType) {
        case 'students':
          result = await fetchStudentsData(filters, user);
          break;

        case 'grades':
          result = await fetchGradesData(filters, user);
          break;

        case 'attendance':
          result = await fetchAttendanceData(filters, user);
          break;

        case 'teachers':
          // Only admin can access teacher reports
          if (user.role === 'admin') {
            result = await fetchTeachersData(filters);
          } else {
            throw new Error('Akses ditolak. Hanya Admin yang bisa melihat laporan guru.');
          }
          break;

        default:
          throw new Error(`Report type tidak valid: ${reportType}`);
      }

      setData(result || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'Gagal memuat data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, filters, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};

/**
 * Fetch data siswa berdasarkan role & filters
 */
const fetchStudentsData = async (filters, user) => {
  let query = supabase
    .from('students')
    .select('*')
    .order('nama_siswa', { ascending: true });

  // Role-based filtering
  if (user.role === 'guru_kelas') {
    query = query.eq('kelas', user.kelas);
  }
  // guru_mapel & admin: no restriction

  // Apply filters
  if (filters.kelas && filters.kelas !== 'all') {
    query = query.eq('kelas', filters.kelas);
  }

  if (filters.status && filters.status !== 'all') {
    const isActive = filters.status === 'aktif';
    query = query.eq('is_active', isActive);
  }

  if (filters.jenisKelamin && filters.jenisKelamin !== 'all') {
    query = query.eq('jenis_kelamin', filters.jenisKelamin);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

/**
 * Fetch data nilai berdasarkan role & filters
 */
const fetchGradesData = async (filters, user) => {
  let query = supabase
    .from('nilai')
    .select('*')
    .order('tanggal', { ascending: false });

  // Role-based filtering
  if (user.role === 'guru_kelas') {
    query = query.eq('kelas', user.kelas);
  } else if (user.role === 'guru_mapel') {
    query = query.eq('mata_pelajaran', user.mata_pelajaran);
  }
  // admin: no restriction

  // Apply filters
  if (filters.kelas && filters.kelas !== 'all') {
    query = query.eq('kelas', filters.kelas);
  }

  if (filters.mapel && filters.mapel !== 'all') {
    query = query.eq('mata_pelajaran', filters.mapel);
  }

  if (filters.jenisNilai && filters.jenisNilai !== 'all') {
    query = query.eq('jenis_nilai', filters.jenisNilai);
  }

  // Date range filter
  if (filters.tanggalMulai) {
    query = query.gte('tanggal', filters.tanggalMulai);
  }

  if (filters.tanggalAkhir) {
    query = query.lte('tanggal', filters.tanggalAkhir);
  }

  // Periode filter
  if (filters.periode && filters.periode !== 'semua') {
    const dateRange = getDateRangeFromPeriode(filters.periode);
    if (dateRange) {
      query = query.gte('tanggal', dateRange.start);
      if (dateRange.end) {
        query = query.lte('tanggal', dateRange.end);
      }
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

/**
 * Fetch data presensi berdasarkan role & filters
 */
const fetchAttendanceData = async (filters, user) => {
  let query = supabase
    .from('attendance')
    .select('*')
    .order('tanggal', { ascending: false });

  // Role-based filtering
  if (user.role === 'guru_kelas') {
    query = query.eq('kelas', user.kelas);
  }
  // guru_mapel & admin: no restriction

  // Apply filters
  if (filters.kelas && filters.kelas !== 'all') {
    query = query.eq('kelas', filters.kelas);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.jenisPresensi && filters.jenisPresensi !== 'all') {
    query = query.eq('jenis_presensi', filters.jenisPresensi);
  }

  // Date range filter
  if (filters.tanggalMulai) {
    query = query.gte('tanggal', filters.tanggalMulai);
  }

  if (filters.tanggalAkhir) {
    query = query.lte('tanggal', filters.tanggalAkhir);
  }

  // Periode filter
  if (filters.periode && filters.periode !== 'semua') {
    const dateRange = getDateRangeFromPeriode(filters.periode);
    if (dateRange) {
      query = query.gte('tanggal', dateRange.start);
      if (dateRange.end) {
        query = query.lte('tanggal', dateRange.end);
      }
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

/**
 * Fetch laporan aktivitas guru (Admin only)
 */
const fetchTeachersData = async (filters) => {
  try {
    // Get all guru
    const { data: guruData, error: guruError } = await supabase
      .from('users')
      .select('id, username, full_name, role, kelas, mata_pelajaran')
      .in('role', ['guru_kelas', 'guru_mapel'])
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (guruError) throw guruError;

    // Get aktivitas input nilai
    let nilaiQuery = supabase
      .from('nilai')
      .select('guru_input, created_at');

    if (filters.tanggalMulai) {
      nilaiQuery = nilaiQuery.gte('created_at', filters.tanggalMulai);
    }

    if (filters.tanggalAkhir) {
      nilaiQuery = nilaiQuery.lte('created_at', filters.tanggalAkhir);
    }

    const { data: nilaiData, error: nilaiError } = await nilaiQuery;
    if (nilaiError) throw nilaiError;

    // Get aktivitas input presensi
    let presensiQuery = supabase
      .from('attendance')
      .select('guru_input, created_at');

    if (filters.tanggalMulai) {
      presensiQuery = presensiQuery.gte('created_at', filters.tanggalMulai);
    }

    if (filters.tanggalAkhir) {
      presensiQuery = presensiQuery.lte('created_at', filters.tanggalAkhir);
    }

    const { data: presensiData, error: presensiError } = await presensiQuery;
    if (presensiError) throw presensiError;

    // Aggregate data per guru
    const teacherStats = guruData.map(guru => {
      const totalNilai = nilaiData.filter(
        n => n.guru_input === guru.username
      ).length;

      const totalPresensi = presensiData.filter(
        p => p.guru_input === guru.username
      ).length;

      const nilaiDates = nilaiData
        .filter(n => n.guru_input === guru.username)
        .map(n => new Date(n.created_at));
      
      const presensiDates = presensiData
        .filter(p => p.guru_input === guru.username)
        .map(p => new Date(p.created_at));

      const allDates = [...nilaiDates, ...presensiDates];
      const lastInput = allDates.length > 0 
        ? new Date(Math.max(...allDates))
        : null;

      return {
        ...guru,
        totalInputNilai: totalNilai,
        totalInputPresensi: totalPresensi,
        total_input: totalNilai + totalPresensi,
        terakhirInput: lastInput,
      };
    });

    return teacherStats;
  } catch (error) {
    console.error('Error fetching teachers data:', error);
    throw error;
  }
};

/**
 * Convert periode preset ke date range
 */
const getDateRangeFromPeriode = (periode) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  switch (periode) {
    case 'hari-ini':
      return {
        start: new Date(year, month, date).toISOString().split('T')[0],
        end: new Date(year, month, date).toISOString().split('T')[0],
      };

    case 'minggu-ini':
      const firstDayOfWeek = date - today.getDay();
      return {
        start: new Date(year, month, firstDayOfWeek).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      };

    case 'bulan-ini':
      return {
        start: new Date(year, month, 1).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      };

    case 'semester-1':
      return {
        start: `${year}-07-01`,
        end: `${year}-12-31`,
      };

    case 'semester-2':
      return {
        start: `${year}-01-01`,
        end: `${year}-06-30`,
      };

    case 'tahun-ini':
      return {
        start: `${year}-01-01`,
        end: `${year}-12-31`,
      };

    default:
      return null;
  }
};

export default useReportData;