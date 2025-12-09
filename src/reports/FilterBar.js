// src/reports/FilterBar.js
import React, { useState, useEffect } from "react";
import { Filter, ChevronDown, ChevronUp, Search, X } from "lucide-react";

/**
 * FilterBar Component - Dynamic Filters Based on Active Tab
 * ✅ Mobile-first responsive design
 * ✅ Dark mode support
 * ✅ Accordion/dropdown for mobile
 * ✅ Touch-friendly UI
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
  // State untuk mobile accordion
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(true);
        setIsExpanded(false);
      } else {
        setShowFilters(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle filter change
  const handleChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters = {};
    filterConfig.fields?.forEach((field) => {
      switch (field) {
        case "kelas":
          clearedFilters.kelas = filterConfig.locked?.kelas
            ? userKelas
            : "semua";
          break;
        case "mataPelajaran":
          clearedFilters.mataPelajaran = filterConfig.locked?.mapel
            ? userMapel
            : "semua";
          break;
        case "tahunAjaran":
          clearedFilters.tahunAjaran = "current";
          break;
        case "search":
          clearedFilters.search = "";
          break;
        case "viewMode":
          clearedFilters.viewMode = "list";
          break;
        case "periode":
          clearedFilters.periode = "bulan_ini";
          break;
        case "dibuatOleh":
          clearedFilters.dibuatOleh = "semua";
          break;
        case "category":
          clearedFilters.category = "semua";
          break;
        case "status":
          clearedFilters.status = "aktif";
          break;
        case "role":
          clearedFilters.role = "semua";
          break;
      }
    });
    onFilterChange(clearedFilters);
  };

  // Toggle filter visibility on mobile
  const toggleFilters = () => {
    if (isMobile) {
      setShowFilters(!showFilters);
      setIsExpanded(!isExpanded);
    }
  };

  // Shared classes for label and input/select, adjusted for Mobile + Dark Mode
  const labelClass =
    "block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 dark:text-gray-300";

  const inputClass =
    "w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 transition-colors duration-200";

  // Mobile First Grid Class
  const filterCount = filterConfig.fields?.length || 4;
  let gridClass = "grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4";

  if (filterCount === 5) {
    gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4";
  } else if (filterCount >= 3) {
    gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4";
  }

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter((key) => {
    if (!filters[key] || filters[key] === "" || filters[key] === "semua")
      return false;

    // Check for default values
    switch (key) {
      case "tahunAjaran":
        return filters[key] !== "current";
      case "viewMode":
        return filters[key] !== "list";
      case "periode":
        return filters[key] !== "bulan_ini";
      case "status":
        return filters[key] !== "aktif";
      default:
        return true;
    }
  }).length;

  // Render filter component
  const renderFilterComponent = (field) => {
    switch (field) {
      case "kelas":
        return (
          <div className="space-y-1">
            <label className={labelClass}>
              Kelas
              {filterConfig.locked?.kelas && (
                <span className="ml-1 text-xs text-red-500 dark:text-red-400 font-normal">
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
              disabled={filterConfig.locked?.kelas}
              className={inputClass}>
              {filterConfig.kelasOptions?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "tahunAjaran":
        return (
          <div className="space-y-1">
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
        );

      case "mataPelajaran":
        return (
          <div className="space-y-1">
            <label className={labelClass}>
              Mata Pelajaran
              {filterConfig.locked?.mapel && (
                <span className="ml-1 text-xs text-red-500 dark:text-red-400 font-normal">
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
              disabled={filterConfig.locked?.mapel}
              className={inputClass}>
              {filterConfig.mapelOptions?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "search":
        return (
          <div className="space-y-1">
            <label className={labelClass}>
              Cari Nama {activeTab === "teachers" ? "Guru" : "Siswa"}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search || ""}
                onChange={(e) => handleChange("search", e.target.value)}
                placeholder="Ketik nama..."
                className={`${inputClass} pl-10`}
              />
              {filters.search && (
                <button
                  onClick={() => handleChange("search", "")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );

      case "viewMode":
        return (
          <div className="space-y-1">
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
        );

      case "periode":
        return (
          <div className="space-y-1">
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
        );

      case "dibuatOleh":
        return (
          <div className="space-y-1">
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
        );

      case "category":
        return (
          <div className="space-y-1">
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
        );

      case "status":
        return (
          <div className="space-y-1">
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
        );

      case "role":
        return (
          <div className="space-y-1">
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="mb-6">
      {/* Mobile Header - Toggle Button */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <button
            onClick={toggleFilters}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Filter className="h-4 w-4" />
            Filter ({activeFilterCount} aktif)
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </button>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs px-2 py-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                Hapus Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Content */}
      <div
        className={`transition-all duration-300 ${
          isMobile && !showFilters ? "hidden" : "block"
        }`}>
        <div
          className={`${gridClass} p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm transition-colors duration-300`}>
          {filterConfig.fields?.map((field) => (
            <div key={field} className="animate-fadeIn">
              {renderFilterComponent(field)}
            </div>
          ))}
        </div>

        {/* Desktop Clear Button */}
        {!isMobile && activeFilterCount > 0 && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleClearFilters}
              className="text-sm px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-2">
              <X className="h-4 w-4" />
              Hapus Semua Filter ({activeFilterCount})
            </button>
          </div>
        )}

        {/* Mobile Active Filters Badge */}
        {isMobile && showFilters && activeFilterCount > 0 && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ⚡ {activeFilterCount} filter aktif. Scroll untuk lihat semua
              filter.
            </p>
          </div>
        )}
      </div>

      {/* CSS for fadeIn animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FilterBar;
