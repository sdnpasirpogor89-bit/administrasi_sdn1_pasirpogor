// src/reports/FilterBar.js
import React from 'react';

/**
 * FilterBar Component - Dynamic Filters Based on Active Tab
 * ✅ Simplified: No debouncing, immediate updates
 * ✅ Props-driven: All config from parent (ReportTeacher)
 */
const FilterBar = ({ 
  activeTab,
  filters,
  onFilterChange,
  filterConfig,
  userRole,
  userKelas,
  userMapel,
}) => {
  // Handle filter change
  const handleChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  // Determine grid columns based on number of filters
  const filterCount = filterConfig.fields?.length || 4;
  const gridClass = filterCount === 5 
    ? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";

  // Render filters based on activeTab and filterConfig
  return (
    <div className={gridClass}>
      {/* KELAS - For students, attendance, grades, notes */}
      {filterConfig.fields?.includes('kelas') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kelas
            {filterConfig.locked?.kelas && (
              <span className="ml-2 text-xs text-gray-500">(Terkunci)</span>
            )}
          </label>
          <select
            value={filters.kelas || ''}
            onChange={(e) => handleChange('kelas', e.target.value)}
            disabled={filterConfig.locked?.kelas}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              filterConfig.locked?.kelas ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            {!filterConfig.locked?.kelas && <option value="">Semua Kelas</option>}
            {filterConfig.kelasOptions?.map(k => (
              <option key={k} value={k}>Kelas {k}</option>
            ))}
          </select>
        </div>
      )}

      {/* STATUS - For students */}
      {filterConfig.fields?.includes('status') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Siswa
          </label>
          <select
            value={filters.status || 'aktif'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.statusOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* JENIS KELAMIN - For students */}
      {filterConfig.fields?.includes('jenisKelamin') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jenis Kelamin
          </label>
          <select
            value={filters.jenisKelamin || 'semua'}
            onChange={(e) => handleChange('jenisKelamin', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.jenisKelaminOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* BULAN - For attendance */}
      {filterConfig.fields?.includes('bulan') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bulan
          </label>
          <select
            value={filters.bulan !== undefined ? filters.bulan : 0}
            onChange={(e) => handleChange('bulan', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.bulanOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* TAHUN - For attendance */}
      {filterConfig.fields?.includes('tahun') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tahun
          </label>
          <select
            value={filters.tahun || new Date().getFullYear()}
            onChange={(e) => handleChange('tahun', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.tahunOptions?.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      )}

      {/* STATUS PRESENSI - For attendance */}
      {filterConfig.fields?.includes('statusPresensi') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Kehadiran
          </label>
          <select
            value={filters.statusPresensi || 'semua'}
            onChange={(e) => handleChange('statusPresensi', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.statusPresensiOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* JENIS PRESENSI - For attendance */}
      {filterConfig.fields?.includes('jenisPresensi') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jenis Presensi
          </label>
          <select
            value={filters.jenisPresensi || 'semua'}
            onChange={(e) => handleChange('jenisPresensi', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.jenisPresensiOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* MATA PELAJARAN - For grades */}
      {filterConfig.fields?.includes('mapel') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mata Pelajaran
            {filterConfig.locked?.mapel && (
              <span className="ml-2 text-xs text-gray-500">(Terkunci)</span>
            )}
          </label>
          <select
            value={filters.mapel || ''}
            onChange={(e) => handleChange('mapel', e.target.value)}
            disabled={filterConfig.locked?.mapel}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              filterConfig.locked?.mapel ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            {!filterConfig.locked?.mapel && <option value="">Semua Mapel</option>}
            {filterConfig.mapelOptions?.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* SEMESTER - For grades */}
      {filterConfig.fields?.includes('semester') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Semester
          </label>
          <select
            value={filters.semester || 'semua'}
            onChange={(e) => handleChange('semester', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.semesterOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* SISWA - For notes */}
      {filterConfig.fields?.includes('siswa') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Siswa
          </label>
          <select
            value={filters.siswa || ''}
            onChange={(e) => handleChange('siswa', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Siswa</option>
            {/* TODO: Populate from students data */}
          </select>
        </div>
      )}

      {/* KATEGORI - For notes */}
      {filterConfig.fields?.includes('kategori') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori
          </label>
          <select
            value={filters.kategori || 'semua'}
            onChange={(e) => handleChange('kategori', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.kategoriOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* PERIODE - For notes */}
      {filterConfig.fields?.includes('periode') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Periode
          </label>
          <select
            value={filters.periode || 'bulan_ini'}
            onChange={(e) => handleChange('periode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.periodeOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* DIBUAT OLEH - For notes (guru_kelas only) */}
      {filterConfig.fields?.includes('dibuatOleh') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dibuat Oleh
          </label>
          <select
            value={filters.dibuatOleh || 'semua'}
            onChange={(e) => handleChange('dibuatOleh', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterConfig.dibuatOlehOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default FilterBar;