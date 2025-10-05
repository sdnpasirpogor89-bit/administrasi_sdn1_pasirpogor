// src/reports/FilterBar.js
import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const FilterBar = ({ 
  onFilterChange, 
  userRole = 'admin',
  userKelas = null,
  userMapel = null,
  currentFilters = {}
}) => {
  const [filters, setFilters] = useState({
    kelas: currentFilters.kelas || (userRole === 'guru_kelas' ? userKelas : ''),
    mapel: currentFilters.mapel || (userRole === 'guru_mapel' ? userMapel : ''),
    periode: currentFilters.periode || 'semua',
    jenisNilai: currentFilters.jenisNilai || 'all',
    status: currentFilters.status || 'all',
    jenisPresensi: currentFilters.jenisPresensi || 'all',
    jenisKelamin: currentFilters.jenisKelamin || 'all',
  });

  const [kelasOptions, setKelasOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [jenisNilaiOptions, setJenisNilaiOptions] = useState([]);

  // Fetch kelas dari database
  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('kelas')
          .eq('is_active', true);

        if (error) throw error;

        const uniqueKelas = [...new Set(data.map(s => s.kelas))].sort();
        setKelasOptions(uniqueKelas);
      } catch (error) {
        console.error('Error fetching kelas:', error);
        setKelasOptions(['1', '2', '3', '4', '5', '6']);
      }
    };

    fetchKelas();
  }, []);

  // Fetch mapel dari database
  useEffect(() => {
    const fetchMapel = async () => {
      try {
        const { data, error } = await supabase
          .from('nilai')
          .select('mata_pelajaran');

        if (error) throw error;

        const uniqueMapel = [...new Set(data.map(n => n.mata_pelajaran))].filter(Boolean).sort();
        setMapelOptions(uniqueMapel);
      } catch (error) {
        console.error('Error fetching mapel:', error);
        setMapelOptions(['Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'PKn', 'PAI', 'PJOK']);
      }
    };

    fetchMapel();
  }, []);

  // Fetch jenis nilai dari database
  useEffect(() => {
    const fetchJenisNilai = async () => {
      try {
        const { data, error } = await supabase
          .from('nilai')
          .select('jenis_nilai');

        if (error) throw error;

        const uniqueJenisNilai = [...new Set(data.map(n => n.jenis_nilai))].filter(Boolean).sort();
        setJenisNilaiOptions(uniqueJenisNilai);
      } catch (error) {
        console.error('Error fetching jenis nilai:', error);
        setJenisNilaiOptions(['NH-1', 'NH-2', 'NH-3', 'NH-4', 'NH-5', 'UTS', 'UAS', 'Nilai Akhir']);
      }
    };

    fetchJenisNilai();
  }, []);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      kelas: userRole === 'guru_kelas' ? userKelas : '',
      mapel: userRole === 'guru_mapel' ? userMapel : '',
      periode: 'semua',
      jenisNilai: 'all',
      status: 'all',
      jenisPresensi: 'all',
      jenisKelamin: 'all',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const reportType = currentFilters.type || 'students';

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
        {/* Kelas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kelas
          </label>
          <select
            value={filters.kelas}
            onChange={(e) => handleChange('kelas', e.target.value)}
            disabled={userRole === 'guru_kelas'}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              userRole === 'guru_kelas' ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            {userRole !== 'guru_kelas' && <option value="">Semua Kelas</option>}
            {kelasOptions.map(k => (
              <option key={k} value={k}>Kelas {k}</option>
            ))}
          </select>
        </div>

        {/* Mata Pelajaran (hanya untuk laporan nilai) */}
        {reportType === 'grades' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Pelajaran
            </label>
            <select
              value={filters.mapel}
              onChange={(e) => handleChange('mapel', e.target.value)}
              disabled={userRole === 'guru_mapel'}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                userRole === 'guru_mapel' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              {userRole !== 'guru_mapel' && <option value="">Semua Mapel</option>}
              {mapelOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* Jenis Nilai (hanya untuk laporan nilai) */}
        {reportType === 'grades' && (
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

        {/* Status (untuk laporan siswa) */}
        {reportType === 'students' && (
          <>
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
          </>
        )}

        {/* Status Presensi (untuk laporan presensi) */}
        {reportType === 'attendance' && (
          <>
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
                <option value="Alpha">Alpha</option>
              </select>
            </div>
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
                <option value="Pagi">Pagi</option>
                <option value="Siang">Siang</option>
              </select>
            </div>
          </>
        )}

        {/* Periode (untuk laporan kecuali siswa & guru) */}
        {reportType !== 'students' && reportType !== 'teachers' && (
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
              <option value="hari-ini">Hari Ini</option>
              <option value="minggu-ini">Minggu Ini</option>
              <option value="bulan-ini">Bulan Ini</option>
              <option value="semester-1">Semester 1</option>
              <option value="semester-2">Semester 2</option>
              <option value="tahun-ini">Tahun Ini</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;