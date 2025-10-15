// src/reports/FilterBar.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * FilterBar Component - Dynamic Filters Based on Report Type
 * ✅ Fixed: Show different filters based on reportType
 * ✅ Optimized: Parallel fetching, debouncing
 * ✅ Better UX: Loading states, error handling
 */
const FilterBar = ({ 
  onFilterChange, 
  userRole = 'admin',
  userKelas = null,
  userMapel = null,
  currentFilters = {},
  reportType = 'students' // students | grades | attendance | teachers
}) => {
  // ✅ Initialize with default values
  const getDefaultFilters = useCallback(() => ({
    kelas: userRole === 'guru_kelas' ? userKelas : '',
    mapel: userRole === 'guru_mapel' && reportType === 'grades' ? userMapel : '',
    periode: 'semua',
    jenisNilai: 'all',
    status: 'all',
    jenisPresensi: 'all',
    jenisKelamin: 'all',
    dateRange: { start: null, end: null },
  }), [userRole, userKelas, userMapel, reportType]);

  // ✅ Merge currentFilters with defaults
  const initialFilters = useMemo(() => ({
    ...getDefaultFilters(),
    ...currentFilters
  }), []); // Only run once on mount

  const [filters, setFilters] = useState(initialFilters);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [jenisNilaiOptions, setJenisNilaiOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Debounce timer
  const debounceTimer = useRef(null);

  // ✅ Fetch all options in parallel (single useEffect)
  useEffect(() => {
    const fetchAllOptions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Parallel fetch dengan Promise.all
        const [kelasResult, mapelResult, jenisNilaiResult] = await Promise.all([
          // Fetch kelas
          supabase
            .from('students')
            .select('kelas')
            .eq('is_active', true),
          
          // Fetch mapel
          supabase
            .from('nilai')
            .select('mata_pelajaran'),
          
          // Fetch jenis nilai
          supabase
            .from('nilai')
            .select('jenis_nilai')
        ]);

        // Process kelas
        if (kelasResult.error) throw kelasResult.error;
        const uniqueKelas = [...new Set(
          kelasResult.data.map(s => s.kelas).filter(Boolean)
        )].sort((a, b) => a - b);
        setKelasOptions(uniqueKelas);

        // Process mapel
        if (mapelResult.error) throw mapelResult.error;
        const uniqueMapel = [...new Set(
          mapelResult.data.map(n => n.mata_pelajaran).filter(Boolean)
        )].sort();
        setMapelOptions(uniqueMapel);

        // Process jenis nilai
        if (jenisNilaiResult.error) throw jenisNilaiResult.error;
        const uniqueJenisNilai = [...new Set(
          jenisNilaiResult.data.map(n => n.jenis_nilai).filter(Boolean)
        )].sort();
        setJenisNilaiOptions(uniqueJenisNilai);

      } catch (err) {
        console.error('Error fetching filter options:', err);
        setError('Gagal memuat opsi filter');
        
        // Fallback values
        setKelasOptions([1, 2, 3, 4, 5, 6]);
        setMapelOptions([]);
        setJenisNilaiOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOptions();
  }, []); // Only run once on mount

  // ✅ Debounced filter change handler
  const handleChange = useCallback((key, value) => {
    // Update local state immediately (for responsive UI)
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Debounce the callback to parent
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        onFilterChange(newFilters);
      }, 300); // 300ms debounce

      return newFilters;
    });
  }, [onFilterChange]);

  // ✅ Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ✅ Reset handler
  const handleReset = useCallback(() => {
    const resetFilters = getDefaultFilters();
    setFilters(resetFilters);
    
    // Clear debounce dan trigger immediately
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onFilterChange(resetFilters);
  }, [getDefaultFilters, onFilterChange]);

  // ✅ Determine which filters to show based on reportType
  const shouldShowFilter = useMemo(() => {
    const filterConfig = {
      students: {
        kelas: userRole !== 'guru_kelas',
        status: true,
        jenisKelamin: true,
        mapel: false,
        periode: false,
        jenisNilai: false,
        statusKehadiran: false,
        jenisPresensi: false,
      },
      grades: {
        kelas: true, // Show but disabled for guru_kelas
        mapel: true, // Show but disabled for guru_mapel
        jenisNilai: true,
        periode: true,
        status: false,
        jenisKelamin: false,
        statusKehadiran: false,
        jenisPresensi: false,
      },
      attendance: {
        kelas: userRole !== 'guru_kelas',
        statusKehadiran: true,
        periode: true,
        jenisPresensi: true,
        status: false,
        jenisKelamin: false,
        mapel: false,
        jenisNilai: false,
      },
      teachers: {
        kelas: false,
        mapel: false,
        status: false,
        jenisKelamin: false,
        periode: false,
        jenisNilai: false,
        statusKehadiran: false,
        jenisPresensi: false,
      },
    };

    return filterConfig[reportType] || filterConfig.students;
  }, [reportType, userRole]);

  // ✅ Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 space-x-2">
        <Loader2 size={20} className="animate-spin text-blue-500" />
        <span className="text-gray-600">Memuat filter...</span>
      </div>
    );
  }

  // ✅ Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filter Laporan</h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw size={16} />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kelas Filter */}
        {shouldShowFilter.kelas && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas
              {userRole === 'guru_kelas' && (
                <span className="ml-2 text-xs text-gray-500">(Terkunci)</span>
              )}
            </label>
            <select
              value={filters.kelas}
              onChange={(e) => handleChange('kelas', e.target.value)}
              disabled={userRole === 'guru_kelas' || kelasOptions.length === 0}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                userRole === 'guru_kelas' || kelasOptions.length === 0
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : ''
              }`}
            >
              {userRole !== 'guru_kelas' && <option value="">Semua Kelas</option>}
              {kelasOptions.length > 0 ? (
                kelasOptions.map(k => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))
              ) : (
                <option value="">Tidak ada data</option>
              )}
            </select>
          </div>
        )}

        {/* Mata Pelajaran (grades only) */}
        {shouldShowFilter.mapel && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Pelajaran
              {userRole === 'guru_mapel' && reportType === 'grades' && (
                <span className="ml-2 text-xs text-gray-500">(Terkunci)</span>
              )}
            </label>
            <select
              value={filters.mapel}
              onChange={(e) => handleChange('mapel', e.target.value)}
              disabled={(userRole === 'guru_mapel' && reportType === 'grades') || mapelOptions.length === 0}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                (userRole === 'guru_mapel' && reportType === 'grades') || mapelOptions.length === 0
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : ''
              }`}
            >
              {!(userRole === 'guru_mapel' && reportType === 'grades') && (
                <option value="">Semua Mapel</option>
              )}
              {mapelOptions.length > 0 ? (
                mapelOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))
              ) : (
                <option value="">Tidak ada data</option>
              )}
            </select>
          </div>
        )}

        {/* Jenis Nilai (grades only) */}
        {shouldShowFilter.jenisNilai && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Nilai
            </label>
            <select
              value={filters.jenisNilai}
              onChange={(e) => handleChange('jenisNilai', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Jenis</option>
              {jenisNilaiOptions.map(jenis => (
                <option key={jenis} value={jenis}>{jenis}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status Siswa (students only) */}
        {shouldShowFilter.status && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Siswa
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="tidak-aktif">Tidak Aktif</option>
            </select>
          </div>
        )}

        {/* Jenis Kelamin (students only) */}
        {shouldShowFilter.jenisKelamin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Kelamin
            </label>
            <select
              value={filters.jenisKelamin}
              onChange={(e) => handleChange('jenisKelamin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        )}

        {/* Status Kehadiran (attendance only) */}
        {shouldShowFilter.statusKehadiran && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Kehadiran
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Sakit">Sakit</option>
              <option value="Izin">Izin</option>
              <option value="Alpa">Alpa</option>
            </select>
          </div>
        )}

        {/* Jenis Presensi (attendance only) */}
        {shouldShowFilter.jenisPresensi && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Presensi
            </label>
            <select
              value={filters.jenisPresensi}
              onChange={(e) => handleChange('jenisPresensi', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua</option>
              <option value="mapel">Per Mapel</option>
              <option value="kelas">Per Kelas</option>
            </select>
          </div>
        )}

        {/* Periode (grades & attendance) */}
        {shouldShowFilter.periode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <select
              value={filters.periode}
              onChange={(e) => handleChange('periode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="semua">Semua Periode</option>
              {reportType === 'grades' ? (
                <>
                  <option value="harian">Harian</option>
                  <option value="uts">UTS</option>
                  <option value="uas">UAS</option>
                  <option value="semester-1">Semester 1</option>
                  <option value="semester-2">Semester 2</option>
                </>
              ) : (
                <>
                  <option value="hari-ini">Hari Ini</option>
                  <option value="minggu-ini">Minggu Ini</option>
                  <option value="bulan-ini">Bulan Ini</option>
                  <option value="semester-1">Semester 1</option>
                  <option value="semester-2">Semester 2</option>
                </>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t">
        <span className="font-medium">Filter Aktif:</span>
        {filters.kelas && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Kelas {filters.kelas}</span>}
        {filters.mapel && <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{filters.mapel}</span>}
        {filters.jenisNilai && filters.jenisNilai !== 'all' && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">{filters.jenisNilai}</span>
        )}
        {filters.status && filters.status !== 'all' && (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">{filters.status}</span>
        )}
        {filters.periode && filters.periode !== 'semua' && (
          <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded">{filters.periode}</span>
        )}
      </div>
    </div>
  );
};

export default FilterBar;