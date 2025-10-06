// src/reports/useReportData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom Hook untuk fetch data laporan dari Supabase
 * ✅ Optimized dengan JOIN, caching, dan better error handling
 * ✅ FIXED: PostgreSQL boolean handling
 */
export const useReportData = (reportType, filters = {}, user) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache untuk prevent redundant fetches
  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  // Serialize filters untuk stable dependency
  const filtersKey = JSON.stringify(filters);
  const userKey = user ? `${user.id}-${user.role}` : null;

  const fetchData = useCallback(async () => {
    if (!user || !user.role) {
      setError({ type: 'auth', message: 'User tidak ditemukan' });
      return;
    }

    // Check cache (5 menit)
    const cacheKey = `${reportType}-${filtersKey}-${userKey}`;
    const cached = cacheRef.current[cacheKey];
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < 300000)) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

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
          if (user.role !== 'admin') {
            throw { 
              type: 'permission', 
              message: 'Akses ditolak. Hanya Admin yang bisa melihat laporan guru.' 
            };
          }
          result = await fetchTeachersData(filters);
          break;

        default:
          throw { 
            type: 'validation', 
            message: `Report type tidak valid: ${reportType}` 
          };
      }

      // Update cache
      cacheRef.current[cacheKey] = {
        data: result || [],
        timestamp: now
      };

      setData(result || []);
    } catch (err) {
      if (err.name === 'AbortError') return;

      console.error('Error fetching report data:', err);
      
      const errorObj = {
        type: err.type || 'unknown',
        message: err.message || 'Gagal memuat data',
        details: err.details || null,
        code: err.code || null
      };

      setError(errorObj);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, filtersKey, userKey]);

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
 * ✅ FIXED: PostgreSQL boolean = true/false, bukan 1/0
 * ✅ FIXED: Default show active students only
 */
const fetchStudentsData = async (filters, user) => {
  let query = supabase
    .from('students')
    .select('id, nisn, nama_siswa, jenis_kelamin, kelas, is_active, created_at')
    .eq('is_active', true) // DEFAULT: only active students
    .order('nama_siswa', { ascending: true });

  // Role-based filtering
  if (user.role === 'guru_kelas') {
    query = query.eq('kelas', user.kelas);
  }

  // Apply filters
  if (filters.kelas && filters.kelas !== 'all' && filters.kelas !== '') {
    query = query.eq('kelas', filters.kelas);
  }

  // Override default if status filter explicitly set
  if (filters.status && filters.status !== 'all') {
    const isActive = filters.status === 'aktif';
    query = query.eq('is_active', isActive);
  }

  if (filters.jenisKelamin && filters.jenisKelamin !== 'all') {
    query = query.eq('jenis_kelamin', filters.jenisKelamin);
  }

  const { data, error } = await query;

  if (error) {
    throw { 
      type: 'database', 
      message: 'Gagal memuat data siswa', 
      details: error.message,
      code: error.code 
    };
  }
  
  return data;
};

/**
 * Fetch data nilai dengan JOIN ke students
 */
const fetchGradesData = async (filters, user) => {
  let query = supabase
    .from('nilai')
    .select(`
      id,
      nisn,
      nama_siswa,
      kelas,
      mata_pelajaran,
      jenis_nilai,
      nilai,
      guru_input,
      tanggal,
      created_at,
      students!inner(is_active, jenis_kelamin)
    `)
    .order('tanggal', { ascending: false });

  // Role-based filtering
  if (user.role === 'guru_kelas') {
    query = query.eq('kelas', user.kelas);
  } else if (user.role === 'guru_mapel') {
    query = query.eq('mata_pelajaran', user.mata_pelajaran);
  }

  // Apply filters
  if (filters.kelas && filters.kelas !== 'all' && filters.kelas !== '') {
    query = query.eq('kelas', filters.kelas);
  }

  if (filters.mapel && filters.mapel !== 'all' && filters.mapel !== '') {
    query = query.eq('mata_pelajaran', filters.mapel);
  }

  if (filters.jenisNilai && filters.jenisNilai !== 'all') {
    query = query.eq('jenis_nilai', filters.jenisNilai);
  }

  // Date range filter
  const dateRange = getDateRangeFromFilters(filters);
  if (dateRange.start) {
    query = query.gte('tanggal', dateRange.start);
  }
  if (dateRange.end) {
    query = query.lte('tanggal', dateRange.end);
  }

  const { data, error } = await query;

  if (error) {
    throw { 
      type: 'database', 
      message: 'Gagal memuat data nilai', 
      details: error.message,
      code: error.code 
    };
  }

  // Flatten joined data
  return data?.map(item => ({
    ...item,
    is_active: item.students?.is_active,
    jenis_kelamin: item.students?.jenis_kelamin,
  })) || [];
};

/**
 * Fetch data presensi dengan JOIN ke students
 */
const fetchAttendanceData = async (filters, user) => {
  let query = supabase
    .from('attendance')
    .select(`
      id,
      tanggal,
      nisn,
      nama_siswa,
      kelas,
      status,
      jenis_presensi,
      keterangan,
      guru_input,
      created_at,
      students!inner(is_active, jenis_kelamin)
    `)
    .order('tanggal', { ascending: false });

  // Role-based filtering
  if (user.role === 'guru_kelas') {
    query = query.eq('kelas', user.kelas);
  }

  // Apply filters
  if (filters.kelas && filters.kelas !== 'all' && filters.kelas !== '') {
    query = query.eq('kelas', filters.kelas);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.jenisPresensi && filters.jenisPresensi !== 'all') {
    query = query.eq('jenis_presensi', filters.jenisPresensi);
  }

  // Date range filter
  const dateRange = getDateRangeFromFilters(filters);
  if (dateRange.start) {
    query = query.gte('tanggal', dateRange.start);
  }
  if (dateRange.end) {
    query = query.lte('tanggal', dateRange.end);
  }

  const { data, error } = await query;

  if (error) {
    throw { 
      type: 'database', 
      message: 'Gagal memuat data presensi', 
      details: error.message,
      code: error.code 
    };
  }

  // Flatten joined data
  return data?.map(item => ({
    ...item,
    is_active: item.students?.is_active,
    jenis_kelamin: item.students?.jenis_kelamin,
  })) || [];
};

/**
 * Fetch laporan aktivitas guru (Admin only)
 */
const fetchTeachersData = async (filters) => {
  try {
    const dateRange = getDateRangeFromFilters(filters);

    const [guruResponse, nilaiResponse, presensiResponse] = await Promise.all([
      supabase
        .from('users')
        .select('id, username, full_name, role, kelas, mata_pelajaran')
        .in('role', ['guru_kelas', 'guru_mapel'])
        .eq('is_active', true)
        .order('full_name', { ascending: true }),

      supabase
        .from('nilai')
        .select('guru_input, created_at', { count: 'exact' })
        .gte('created_at', dateRange.start || '2020-01-01')
        .lte('created_at', dateRange.end || new Date().toISOString()),

      supabase
        .from('attendance')
        .select('guru_input, created_at', { count: 'exact' })
        .gte('created_at', dateRange.start || '2020-01-01')
        .lte('created_at', dateRange.end || new Date().toISOString())
    ]);

    if (guruResponse.error) throw guruResponse.error;
    if (nilaiResponse.error) throw nilaiResponse.error;
    if (presensiResponse.error) throw presensiResponse.error;

    const guruData = guruResponse.data;
    const nilaiData = nilaiResponse.data;
    const presensiData = presensiResponse.data;

    const nilaiMap = new Map();
    const presensiMap = new Map();
    const lastInputMap = new Map();

    nilaiData.forEach(n => {
      nilaiMap.set(n.guru_input, (nilaiMap.get(n.guru_input) || 0) + 1);
      
      const currentLast = lastInputMap.get(n.guru_input);
      const thisDate = new Date(n.created_at);
      if (!currentLast || thisDate > currentLast) {
        lastInputMap.set(n.guru_input, thisDate);
      }
    });

    presensiData.forEach(p => {
      presensiMap.set(p.guru_input, (presensiMap.get(p.guru_input) || 0) + 1);
      
      const currentLast = lastInputMap.get(p.guru_input);
      const thisDate = new Date(p.created_at);
      if (!currentLast || thisDate > currentLast) {
        lastInputMap.set(p.guru_input, thisDate);
      }
    });

    const teacherStats = guruData.map(guru => {
      const totalNilai = nilaiMap.get(guru.username) || 0;
      const totalPresensi = presensiMap.get(guru.username) || 0;
      const lastInput = lastInputMap.get(guru.username) || null;

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
    throw { 
      type: 'database', 
      message: 'Gagal memuat data guru', 
      details: error.message,
      code: error.code 
    };
  }
};

const getDateRangeFromFilters = (filters) => {
  if (filters.tanggalMulai || filters.tanggalAkhir) {
    return {
      start: filters.tanggalMulai || null,
      end: filters.tanggalAkhir || null,
    };
  }

  if (filters.periode && filters.periode !== 'semua') {
    return getDateRangeFromPeriode(filters.periode);
  }

  return { start: null, end: null };
};

const getDateRangeFromPeriode = (periode) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  const toISODate = (d) => d.toISOString().split('T')[0];

  switch (periode) {
    case 'hari-ini':
      return {
        start: toISODate(new Date(year, month, date)),
        end: toISODate(new Date(year, month, date)),
      };

    case 'minggu-ini':
      const firstDayOfWeek = date - today.getDay();
      return {
        start: toISODate(new Date(year, month, firstDayOfWeek)),
        end: toISODate(today),
      };

    case 'bulan-ini':
      return {
        start: toISODate(new Date(year, month, 1)),
        end: toISODate(today),
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
      return { start: null, end: null };
  }
};

export default useReportData;