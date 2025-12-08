// src/reports/FilterBar.js
import React from "react";

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

  // 1. REVISI: Penentuan grid columns diubah menjadi Mobile First
  // Default Mobile: 1 kolom (grid-cols-1)
  // Tablet (md): 2 kolom
  // Laptop (lg): 4 atau 5 kolom (tergantung jumlah filter)
  const filterCount = filterConfig.fields?.length || 4;

  // Mobile First Grid Class
  let gridClass = "grid grid-cols-1 md:grid-cols-2 gap-4";

  if (filterCount === 5) {
    gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4";
  } else if (filterCount >= 3) {
    gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";
  }
  // Jika filterCount 1 atau 2, biarkan tetap grid-cols-1 md:grid-cols-2

  // Shared classes for label and input/select, adjusted for Dark Mode
  const labelClass =
    "block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300";
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 transition-colors duration-200";

  // Render filters based on activeTab and filterConfig
  return (
    // 2. Terapkan gridClass yang sudah Mobile First
    <div
      className={`${gridClass} p-4 bg-gray-50 rounded-xl shadow-sm dark:bg-gray-800 transition-colors duration-300 mb-6`}>
      {/* KELAS - For students, attendance, grades, notes */}
      {filterConfig.fields?.includes("kelas") && (
        <div>
          <label className={labelClass}>
            Kelas
            {filterConfig.locked?.kelas && (
              <span className="ml-2 text-xs text-red-500 dark:text-red-400 font-normal">
                (Terkunci)
              </span>
            )}
          </label>
          <select
            value={
              filters.kelas ||
              (filterConfig.locked?.kelas ? userKelas : "semua")
            }
            onChange={(e) => handleChange("kelas", e.target.value)}
            disabled={filterConfig.locked?.kelas} // Jangan ubah logic ini
            className={inputClass}>
            {filterConfig.kelasOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* TAHUN AJARAN - For all reports (except notes) */}
      {filterConfig.fields?.includes("tahunAjaran") && (
        <div>
          <label className={labelClass}>Tahun Ajaran</label>
          <select
            value={filters.tahunAjaran || "current"}
            onChange={(e) => handleChange("tahunAjaran", e.target.value)}
            className={inputClass}>
            {filterConfig.tahunAjaranOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* MATA PELAJARAN - For grades (guru_mapel only) */}
      {filterConfig.fields?.includes("mataPelajaran") && (
        <div>
          <label className={labelClass}>
            Mata Pelajaran
            {filterConfig.locked?.mapel && (
              <span className="ml-2 text-xs text-red-500 dark:text-red-400 font-normal">
                (Terkunci)
              </span>
            )}
          </label>
          <select
            value={
              filters.mataPelajaran ||
              (filterConfig.locked?.mapel ? userMapel : "semua")
            }
            onChange={(e) => handleChange("mataPelajaran", e.target.value)}
            disabled={filterConfig.locked?.mapel} // Jangan ubah logic ini
            className={inputClass}>
            {filterConfig.mapelOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* NAMA SISWA/GURU (Search Input) - For students, teachers, notes */}
      {filterConfig.fields?.includes("search") && (
        <div>
          <label className={labelClass}>
            Cari Nama {activeTab === "teachers" ? "Guru" : "Siswa"}
          </label>
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => handleChange("search", e.target.value)}
            placeholder="Ketik nama..."
            className={inputClass}
          />
        </div>
      )}

      {/* VIEW MODE - For grades, attendance */}
      {filterConfig.fields?.includes("viewMode") && (
        <div>
          <label className={labelClass}>Tampilan</label>
          <select
            value={filters.viewMode || "list"}
            onChange={(e) => handleChange("viewMode", e.target.value)}
            className={inputClass}>
            {filterConfig.viewModeOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* PERIODE - For notes */}
      {filterConfig.fields?.includes("periode") && (
        <div>
          <label className={labelClass}>Periode</label>
          <select
            value={filters.periode || "bulan_ini"}
            onChange={(e) => handleChange("periode", e.target.value)}
            className={inputClass}>
            {filterConfig.periodeOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* DIBUAT OLEH - For notes (guru_kelas only) */}
      {filterConfig.fields?.includes("dibuatOleh") && (
        <div>
          <label className={labelClass}>Dibuat Oleh</label>
          <select
            value={filters.dibuatOleh || "semua"}
            onChange={(e) => handleChange("dibuatOleh", e.target.value)}
            className={inputClass}>
            {filterConfig.dibuatOlehOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* KATEGORI - For notes */}
      {filterConfig.fields?.includes("category") && (
        <div>
          <label className={labelClass}>Kategori</label>
          <select
            value={filters.category || "semua"}
            onChange={(e) => handleChange("category", e.target.value)}
            className={inputClass}>
            {filterConfig.categoryOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* STATUS KEAKTIFAN - For students, teachers */}
      {filterConfig.fields?.includes("status") && (
        <div>
          <label className={labelClass}>
            Status {activeTab === "teachers" ? "Guru" : "Siswa"}
          </label>
          <select
            value={filters.status || "aktif"}
            onChange={(e) => handleChange("status", e.target.value)}
            className={inputClass}>
            {filterConfig.statusOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ROLE GURU - For teachers */}
      {filterConfig.fields?.includes("role") && (
        <div>
          <label className={labelClass}>Role Guru</label>
          <select
            value={filters.role || "semua"}
            onChange={(e) => handleChange("role", e.target.value)}
            className={inputClass}>
            {filterConfig.roleOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
