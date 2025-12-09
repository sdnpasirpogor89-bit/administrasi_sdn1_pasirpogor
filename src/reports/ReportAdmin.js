// src/reports/ReportAdmin.js
import React, { useState, useEffect } from "react";
import useReportData from "./useReportData";
import useAnalytics from "./useAnalytics";
import FilterBar from "./FilterBar";
import StatsCards from "./StatsCards";
import DataTable from "./DataTable";
import ExportButtons from "./ExportButtons";
import {
  Users,
  Calendar,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  List,
  Grid3x3,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";

const ReportAdmin = ({ user = {} }) => {
  const [activeTab, setActiveTab] = useState("students");
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  // 🆕 STATE UNTUK ATTENDANCE VIEW MODE
  const [attendanceViewMode, setAttendanceViewMode] = useState("detail"); // "detail" atau "recap"

  const [filters, setFilters] = useState({
    kelas: "",
    status: "aktif",
    jenisKelamin: "semua",
    bulan: new Date().getMonth() + 1, // 🔄 Default: bulan ini (1-12)
    tahun: new Date().getFullYear(),
    statusPresensi: "semua",
    jenisPresensi: "semua",
    mapel: "",
    semester: "semua",
    statusGuru: "semua",
    roleGuru: "semua",
  });

  // Determine report type based on activeTab and viewMode
  const getReportType = () => {
    if (activeTab === "grades" && viewMode === "grid") {
      return "grades-grid";
    }
    // 🆕 HANDLE ATTENDANCE RECAP
    if (activeTab === "attendance" && attendanceViewMode === "recap") {
      return "attendance-recap";
    }
    return activeTab;
  };

  // Fetch data menggunakan custom hook
  const { data, loading, error, refetch } = useReportData(
    getReportType(),
    filters,
    user
  );

  // Kalkulasi analytics (pass attendanceViewMode untuk rekap)
  const stats = useAnalytics(data, activeTab, user.role, attendanceViewMode);

  // Debug logger
  useEffect(() => {
    console.group("🔍 Debug Report Data (Admin)");
    console.log("Active Tab:", activeTab);
    console.log("View Mode:", viewMode);
    console.log("Attendance View Mode:", attendanceViewMode);
    console.log("Report Type:", getReportType());
    console.log("Filters:", filters);
    console.log("Loading:", loading);
    console.log("Error:", error);
    console.log("Data Count:", data?.length);
    console.log("Data Sample:", data?.[0]);
    console.groupEnd();
  }, [activeTab, viewMode, attendanceViewMode, loading, data, error]);

  // Tabs configuration
  const tabs = [
    { id: "students", label: "Laporan Siswa", icon: Users },
    { id: "attendance", label: "Presensi", icon: Calendar },
    { id: "grades", label: "Nilai", icon: TrendingUp },
    { id: "teachers", label: "Guru", icon: FileText },
  ];

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setViewMode("list");
    // 🔄 Reset attendance view mode ke "detail" saat pindah tab
    if (tabId !== "attendance") {
      setAttendanceViewMode("detail");
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Handle view mode toggle (untuk grades)
  const handleViewModeToggle = (mode) => {
    setViewMode(mode);
  };

  // 🆕 Handle attendance view mode toggle
  const handleAttendanceViewModeToggle = (mode) => {
    setAttendanceViewMode(mode);
  };

  // Refetch saat filters, activeTab, viewMode, atau attendanceViewMode berubah
  useEffect(() => {
    if (user.role) {
      refetch();
    }
  }, [filters, activeTab, viewMode, attendanceViewMode, refetch, user.role]);

  // Get filter config for current tab
  const getFilterConfig = () => {
    const baseConfig = {
      kelasOptions: [1, 2, 3, 4, 5, 6],
      mapelOptions: [
        "Bahasa Indonesia",
        "Bahasa Inggris",
        "Bahasa Sunda",
        "Matematika",
        "IPAS",
        "Pendidikan Pancasila",
        "Seni Budaya",
        "Pendidikan Agama Islam",
        "PJOK",
      ],
    };

    if (!user.role) {
      return baseConfig;
    }

    switch (activeTab) {
      case "students":
        return {
          ...baseConfig,
          fields: ["kelas", "status", "jenisKelamin"],
          statusOptions: [
            { value: "semua", label: "Semua Status" },
            { value: "aktif", label: "Aktif" },
            { value: "tidak_aktif", label: "Tidak Aktif" },
          ],
          jenisKelaminOptions: [
            { value: "semua", label: "Semua" },
            { value: "L", label: "Laki-laki" },
            { value: "P", label: "Perempuan" },
          ],
        };

      case "attendance":
        return {
          ...baseConfig,
          // 🔄 Ubah fields berdasarkan view mode
          fields:
            attendanceViewMode === "recap"
              ? ["kelas", "bulan", "tahun", "jenisPresensi"] // Rekap: tanpa filter status
              : ["kelas", "bulan", "tahun", "statusPresensi", "jenisPresensi"], // Detail: dengan filter status
          bulanOptions: [
            { value: 1, label: "Januari" },
            { value: 2, label: "Februari" },
            { value: 3, label: "Maret" },
            { value: 4, label: "April" },
            { value: 5, label: "Mei" },
            { value: 6, label: "Juni" },
            { value: 7, label: "Juli" },
            { value: 8, label: "Agustus" },
            { value: 9, label: "September" },
            { value: 10, label: "Oktober" },
            { value: 11, label: "November" },
            { value: 12, label: "Desember" },
          ],
          tahunOptions: [2024, 2025, 2026, 2027, 2028, 2029, 2030],
          statusPresensiOptions: [
            { value: "semua", label: "Semua Status" },
            { value: "Hadir", label: "Hadir" },
            { value: "Sakit", label: "Sakit" },
            { value: "Izin", label: "Izin" },
            { value: "Alpa", label: "Alpa" },
          ],
          jenisPresensiOptions: [
            { value: "semua", label: "Semua Jenis" },
            { value: "kelas", label: "Presensi Kelas" },
            { value: "mapel", label: "Presensi Mapel" },
          ],
        };

      case "grades":
        return {
          ...baseConfig,
          fields:
            viewMode === "grid"
              ? ["kelas", "semester"]
              : ["kelas", "mapel", "semester"],
          semesterOptions: [
            { value: "semua", label: "Semua Semester" },
            { value: "ganjil", label: "Semester Ganjil" },
            { value: "genap", label: "Semester Genap" },
          ],
        };

      case "teachers":
        return {
          ...baseConfig,
          fields: ["statusGuru", "roleGuru"],
          statusGuruOptions: [
            { value: "semua", label: "Semua Status" },
            { value: "aktif", label: "Aktif" },
            { value: "tidak_aktif", label: "Tidak Aktif" },
          ],
          roleGuruOptions: [
            { value: "semua", label: "Semua Role" },
            { value: "guru_kelas", label: "Guru Kelas" },
            { value: "guru_mapel", label: "Guru Mapel" },
          ],
        };

      default:
        return baseConfig;
    }
  };

  const filterConfig = getFilterConfig();

  // Safety check
  if (!user.role) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <svg
              className="w-6 h-6 md:w-8 md:h-8 text-red-600 dark:text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            User Tidak Ditemukan
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Silakan login kembali atau tunggu data user dimuat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Laporan & Analisis
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Dashboard Lengkap Laporan Sistem - Administrator
            {" - "}
            <span className="font-medium dark:text-gray-300">
              {user.full_name}
            </span>
          </p>
        </div>

        {/* Access Info Alert */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 md:mb-6 flex items-start md:items-center gap-3">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 md:mt-0"
            fill="currentColor"
            viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            Akses penuh untuk semua data siswa, guru, presensi, dan nilai
          </p>
        </div>

        {/* Tabs - Responsive dengan scroll horizontal di mobile */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4 md:mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto md:overflow-visible md:space-x-8 px-4 md:px-6 scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      flex items-center gap-2 py-3 md:py-4 px-2 md:px-0 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                      ${
                        isActive
                          ? "border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }
                    `}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs md:text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Section */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFilterCollapsed(!filterCollapsed)}
              className="w-full px-4 md:px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base">
                  Filter Laporan
                </span>
              </div>
              {filterCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>

            {!filterCollapsed && (
              <div className="px-4 md:px-6 pb-4">
                <FilterBar
                  activeTab={activeTab}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  filterConfig={filterConfig}
                  userRole={user.role}
                />
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {!loading && !error && data && data.length > 0 && (
          <div className="mb-4 md:mb-6">
            <StatsCards
              type={activeTab}
              stats={stats}
              userRole={user.role}
              viewMode={attendanceViewMode} // Pass attendance view mode
            />
          </div>
        )}

        {/* Export Bar with View Mode Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 md:p-4 mb-4 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? (
                <span>Memuat data...</span>
              ) : (
                <>
                  Total{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {data?.length || 0}
                  </span>{" "}
                  {attendanceViewMode === "recap" && activeTab === "attendance"
                    ? "siswa"
                    : "data"}{" "}
                  ditemukan
                </>
              )}
            </p>

            {/* 🆕 View Mode Toggle - ATTENDANCE (Detail vs Rekap) */}
            {activeTab === "attendance" && (
              <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 border-t md:border-l border-gray-300 dark:border-gray-700 pt-2 md:pt-0 md:pl-4">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Tampilan:
                </span>
                <div
                  className="inline-flex rounded-md shadow-sm w-full xs:w-auto"
                  role="group">
                  <button
                    type="button"
                    onClick={() => handleAttendanceViewModeToggle("detail")}
                    disabled={loading}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-l-lg border transition-colors flex-1 xs:flex-none text-center
                      ${
                        attendanceViewMode === "detail"
                          ? "bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700"
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                    <FileSpreadsheet className="w-3 h-3 md:w-4 md:h-4 inline-block mr-1" />
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAttendanceViewModeToggle("recap")}
                    disabled={loading}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-r-lg border transition-colors flex-1 xs:flex-none text-center
                      ${
                        attendanceViewMode === "recap"
                          ? "bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700"
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                    <BarChart3 className="w-3 h-3 md:w-4 md:h-4 inline-block mr-1" />
                    Rekap
                  </button>
                </div>
              </div>
            )}

            {/* View Mode Toggle - GRADES (List vs Grid) */}
            {activeTab === "grades" && (
              <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 border-t md:border-l border-gray-300 dark:border-gray-700 pt-2 md:pt-0 md:pl-4">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Tampilan:
                </span>
                <div
                  className="inline-flex rounded-md shadow-sm w-full xs:w-auto"
                  role="group">
                  <button
                    type="button"
                    onClick={() => handleViewModeToggle("list")}
                    disabled={loading}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-l-lg border transition-colors flex-1 xs:flex-none text-center
                      ${
                        viewMode === "list"
                          ? "bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700"
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                    <List className="w-3 h-3 md:w-4 md:h-4 inline-block mr-1" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeToggle("grid")}
                    disabled={loading}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-r-lg border transition-colors flex-1 xs:flex-none text-center
                      ${
                        viewMode === "grid"
                          ? "bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700"
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                    <Grid3x3 className="w-3 h-3 md:w-4 md:h-4 inline-block mr-1" />
                    Grid
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 md:mt-0">
            <ExportButtons
              data={data || []}
              type={activeTab}
              filters={filters}
              stats={stats}
              loading={loading}
              viewMode={attendanceViewMode} // Pass view mode for attendance
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-red-800 dark:text-red-400 font-semibold text-sm mb-1">
                  Terjadi Kesalahan
                </h3>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  {error}
                </p>
                <button
                  onClick={refetch}
                  className="mt-2 px-3 py-1.5 bg-red-600 dark:bg-red-700 text-white rounded text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors">
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto -mx-4 md:mx-0">
          <DataTable
            data={data || []}
            type={activeTab}
            loading={loading}
            userRole={user.role}
            viewMode={
              activeTab === "attendance" ? attendanceViewMode : viewMode
            }
          />

          {/* Empty State */}
          {!loading && !error && (!data || data.length === 0) && (
            <div className="p-6 md:p-12 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <svg
                  className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Tidak Ada Data
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Tidak ada data yang sesuai dengan filter yang dipilih.
              </p>
              {activeTab === "grades" && viewMode === "grid" && (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500">
                  Pastikan backend mengirim data untuk endpoint "grades-grid"
                </p>
              )}
              {activeTab === "attendance" && attendanceViewMode === "recap" && (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500">
                  Pilih bulan & tahun untuk melihat rekapitulasi presensi
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportAdmin;
