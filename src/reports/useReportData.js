// src/reports/useReportData.js - ESLINT FIXED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom Hook untuk fetch data laporan dari Supabase
 * ✅ ESLINT FIXED: Proper error objects, exhaustive dependencies
 */
export const useReportData = (reportType, filters = {}, user) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!user || !user.role) {
      setError(new Error('User tidak ditemukan'));
      return;
    }

    // Serialize filters untuk cache key
    const filtersKey = JSON.stringify(filters);
    const userKey = user ? `${user.id}-${user.role}` : null;
    const cacheKey = `${reportType}-${filtersKey}-${userKey}`;
    
    const cached = cacheRef.current[cacheKey];
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < 300000)) {
      setData(cached.data);
      setLoading(false);
      return;
    }

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
            const error = new Error('Akses ditolak. Hanya Admin yang bisa melihat laporan guru.');
            error.type = 'permission';
            throw error;
          }
          result = await fetchTeachersData(filters);
          break;

        default:
          const validationError = new Error(`Report type tidak valid: ${reportType}`);
          validationError.type = 'validation';
          throw validationError;
      }

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
  }, [reportType, filters, user]); // ✅ FIXED: Include all dependencies

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
 * Fetch data siswa - ✅ FIXED: No JOIN, proper error handling
 */
const fetchStudentsData = async (filters, user) => {
  try {
    let query = supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('nama_siswa', { ascending: true });

    if (user.role === 'guru_kelas') {
      query = query.eq('kelas', user.kelas);
    }

    if (filters.kelas && filters.kelas !== 'all' && filters.kelas !== '') {
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

    if (error) {
      const dbError = new Error('Gagal memuat data siswa');
      dbError.type = 'database';
      dbError.details = error.message;
      dbError.code = error.code;
      throw dbError;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch data nilai - ✅ FIXED: No JOIN, proper error handling
 */
const fetchGradesData = async (filters, user) => {
  try {
    let query = supabase
      .from('nilai')
      .select('*')
      .order('tanggal', { ascending: false });

    if (user.role === 'guru_kelas') {
      query = query.eq('kelas', user.kelas);
    } else if (user.role === 'guru_mapel') {
      query = query.eq('mata_pelajaran', user.mata_pelajaran);
    }

    if (filters.kelas && filters.kelas !== 'all' && filters.kelas !== '') {
      query = query.eq('kelas', filters.kelas);
    }

    if (filters.mapel && filters.mapel !== 'all' && filters.mapel !== '') {
      query = query.eq('mata_pelajaran', filters.mapel);
    }

    if (filters.jenisNilai && filters.jenisNilai !== 'all') {
      query = query.eq('jenis_nilai', filters.jenisNilai);
    }

    const dateRange = getDateRangeFromFilters(filters);
    if (dateRange.start) {
      query = query.gte('tanggal', dateRange.start);
    }
    if (dateRange.end) {
      query = query.lte('tanggal', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      const dbError = new Error('Gagal memuat data nilai');
      dbError.type = 'database';
      dbError.details = error.message;
      dbError.code = error.code;
      throw dbError;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch data presensi - ✅ FIXED: No JOIN, proper error handling
 */
const fetchAttendanceData = async (filters, user) => {
  try {
    let query = supabase
      .from('attendance')
      .select('*')
      .order('tanggal', { ascending: false });

    if (user.role === 'guru_kelas') {
      query = query.eq('kelas', user.kelas);
    }

    if (filters.kelas && filters.kelas !== 'all' && filters.kelas !== '') {
      query = query.eq('kelas', filters.kelas);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.jenisPresensi && filters.jenisPresensi !== 'all') {
      query = query.eq('jenis_presensi', filters.jenisPresensi);
    }

    const dateRange = getDateRangeFromFilters(filters);
    if (dateRange.start) {
      query = query.gte('tanggal', dateRange.start);
    }
    if (dateRange.end) {
      query = query.lte('tanggal', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      const dbError = new Error('Gagal memuat data presensi');
      dbError.type = 'database';
      dbError.details = error.message;
      dbError.code = error.code;
      throw dbError;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch laporan guru - ✅ FIXED: Proper error handling
 */
const fetchTeachersData = async (filters) => {
  try {
    const dateRange = getDateRangeFromFilters(filters);

    const [usersResponse, nilaiResponse, presensiResponse] = await Promise.all([
      supabase
        .from('users')
        .select('*')
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

    if (usersResponse.error) throw usersResponse.error;
    if (nilaiResponse.error) throw nilaiResponse.error;
    if (presensiResponse.error) throw presensiResponse.error;

    const usersData = usersResponse.data;
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

    const teacherStats = usersData.map(user => {
      const totalNilai = nilaiMap.get(user.username) || 0;
      const totalPresensi = presensiMap.get(user.username) || 0;
      const lastInput = lastInputMap.get(user.username) || null;

      return {
        ...user,
        totalInputNilai: totalNilai,
        totalInputPresensi: totalPresensi,
        total_input: totalNilai + totalPresensi,
        terakhirInput: lastInput,
      };
    });

    return teacherStats;
  } catch (error) {
    const dbError = new Error('Gagal memuat data guru');
    dbError.type = 'database';
    dbError.details = error.message;
    dbError.code = error.code;
    throw dbError;
  }
};

/**
 * Date range helper - ✅ FIXED: Use dateRange from filters
 */
const getDateRangeFromFilters = (filters) => {
  if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
    return {
      start: filters.dateRange.start || null,
      end: filters.dateRange.end || null,
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