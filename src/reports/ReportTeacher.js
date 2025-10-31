// src/reports/ReportTeacher.js

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

const ReportTeacher = ({ user = {} }) => {
  const [activeTab, setActiveTab] = useState("students");
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  // STATE UNTUK ATTENDANCE VIEW MODE
  const [attendanceViewMode, setAttendanceViewMode] = useState("detail"); // "detail" atau "recap"

  const [filters, setFilters] = useState({
    kelas: user.role === "guru_kelas" ? user.kelas : "",
    status: "aktif",
    jenisKelamin: "semua",
    bulan: new Date().getMonth() + 1, // Default: bulan ini (1-12)
    tahun: new Date().getFullYear(),
    statusPresensi: "semua",
    jenisPresensi: "semua",
    mapel: user.role === "guru_mapel" ? user.mata_pelajaran : "",
    semester: "semua",
    siswa: "",
    kategori: "semua",
    periode: "bulan_ini",
    // ✅ HAPUS "dibuatOleh" - tidak perlu untuk guru_kelas
  });

  // Determine report type based on activeTab and viewMode
  const getReportType = () => {
    if (activeTab === "grades" && viewMode === "grid") {
      return "grades-grid";
    }
    // HANDLE ATTENDANCE RECAP
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
    console.group("🔍 Debug Report Data");
    console.log("Active Tab:", activeTab);
    console.log("View Mode:", viewMode);
    console.log("Attendance View Mode:", attendanceViewMode);
    console.log("Report Type:", getReportType());
    console.log("Filters:", filters);
    console.log("🔐 User Info:");
    console.log("  - ID:", user.id);
    console.log("  - Role:", user.role);
    console.log("  - Kelas:", user.kelas, "(type:", typeof user.kelas, ")");
    console.log("Loading:", loading);
    console.log("Error:", error);
    console.log("Data Count:", data?.length);
    console.log("Data Sample:", data?.[0]);
    console.groupEnd();
  }, [activeTab, viewMode, attendanceViewMode, loading, data, error, user]);

  // Tabs configuration
  const tabs = [
    { id: "students", label: "Laporan Siswa", icon: Users },
    { id: "attendance", label: "Presensi", icon: Calendar },
    { id: "grades", label: "Nilai", icon: TrendingUp },
    { id: "notes", label: "Catatan Siswa", icon: FileText },
  ];

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setViewMode("list");
    // Reset attendance view mode ke "detail" saat pindah tab
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

  // Handle attendance view mode toggle
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
          locked: { kelas: user.role === "guru_kelas" },
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
          // Ubah fields berdasarkan view mode
          fields:
            attendanceViewMode === "recap"
              ? ["kelas", "bulan", "tahun", "jenisPresensi"] // Rekap: tanpa filter status
              : ["kelas", "bulan", "tahun", "statusPresensi", "jenisPresensi"], // Detail: dengan filter status
          locked: { kelas: user.role === "guru_kelas" },
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
              ? user.role === "guru_kelas"
                ? ["kelas", "semester"]
                : ["semester"]
              : ["kelas", "mapel", "semester"],
          locked: {
            kelas: user.role === "guru_kelas",
            mapel: user.role === "guru_mapel",
          },
          semesterOptions: [
            { value: "semua", label: "Semua Semester" },
            { value: "ganjil", label: "Semester Ganjil" },
            { value: "genap", label: "Semester Genap" },
          ],
        };

      case "notes":
        // ✅ PERBAIKAN: Hapus filter "dibuatOleh" untuk guru_kelas
        // Catatan siswa = hanya catatan yang dibuat oleh guru_kelas itu sendiri
        return {
          ...baseConfig,
          fields: ["siswa", "kategori", "periode"], // ✅ Hapus "dibuatOleh"
          kategoriOptions: [
            { value: "semua", label: "Semua Kategori" },
            { value: "akademik", label: "Akademik" },
            { value: "perilaku", label: "Perilaku" },
            { value: "sosial", label: "Sosial" },
            { value: "karakter", label: "Karakter" },
            { value: "kesehatan", label: "Kesehatan" },
          ],
          periodeOptions: [
            { value: "minggu_ini", label: "Minggu Ini" },
            { value: "bulan_ini", label: "Bulan Ini" },
            { value: "semester", label: "Semester Ini" },
            { value: "semua", label: "Semua Periode" },
          ],
          // ✅ HAPUS dibuatOlehOptions - tidak perlu
        };

      default:
        return baseConfig;
    }
  };

  const filterConfig = getFilterConfig();

  // Safety check: tampilkan pesan error jika user.role tidak tersedia
  if (!user.role) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            User Tidak Ditemukan
          </h3>
          <p className="text-gray-600">
            Silakan login kembali atau tunggu data user dimuat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Laporan & Analisis
          </h1>
          <p className="text-gray-600">
            {user.role === "guru_kelas" && `Guru Kelas ${user.kelas}`}
            {user.role === "guru_mapel" && `Guru ${user.mata_pelajaran}`}
            {" - "}
            <span className="font-medium">{user.full_name}</span>
          </p>
        </div>

        {/* Access Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-blue-800 text-sm">
            {user.role === "guru_kelas" &&
              `Akses terbatas untuk kelas ${user.kelas}`}
            {user.role === "guru_mapel" &&
              `Akses untuk mata pelajaran ${user.mata_pelajaran} (Kelas 1-6)`}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors
                      ${
                        isActive
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}>
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => setFilterCollapsed(!filterCollapsed)}
              className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-600"
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
                <span className="font-medium text-gray-900">
                  Filter Laporan
                </span>
              </div>
              {filterCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {!filterCollapsed && (
              <div className="px-6 pb-4">
                <FilterBar
                  activeTab={activeTab}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  filterConfig={filterConfig}
                  userRole={user.role}
                  userKelas={user.kelas}
                  userMapel={user.mata_pelajaran}
                />
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {!loading && !error && data && data.length > 0 && (
          <div className="mb-6">
            <StatsCards
              type={activeTab}
              stats={stats}
              userRole={user.role}
              viewMode={attendanceViewMode} // Pass attendance view mode
            />
          </div>
        )}

        {/* Export Bar with View Mode Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              {loading ? (
                <span>Memuat data...</span>
              ) : (
                <>
                  Total{" "}
                  <span className="font-semibold text-gray-900">
                    {data?.length || 0}
                  </span>{" "}
                  {attendanceViewMode === "recap" && activeTab === "attendance"
                    ? "siswa"
                    : "data"}{" "}
                  ditemukan
                </>
              )}
            </p>

            {/* View Mode Toggle - ATTENDANCE (Detail vs Rekap) */}
            {activeTab === "attendance" && (
              <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                <span className="text-xs text-gray-500 font-medium">
                  Tampilan:
                </span>
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => handleAttendanceViewModeToggle("detail")}
                    disabled={loading}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-l-lg border transition-colors
                      ${
                        attendanceViewMode === "detail"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                    <FileSpreadsheet className="w-4 h-4 inline-block mr-1" />
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAttendanceViewModeToggle("recap")}
                    disabled={loading}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-r-lg border-t border-r border-b transition-colors
                      ${
                        attendanceViewMode === "recap"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                    <BarChart3 className="w-4 h-4 inline-block mr-1" />
                    Rekap
                  </button>
                </div>
              </div>
            )}

            {/* View Mode Toggle - GRADES (List vs Grid) */}
            {activeTab === "grades" && (
              <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                <span className="text-xs text-gray-500 font-medium">
                  Tampilan:
                </span>
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => handleViewModeToggle("list")}
                    disabled={loading}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-l-lg border transition-colors
                      ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                    <List className="w-4 h-4 inline-block mr-1" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeToggle("grid")}
                    disabled={loading}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-r-lg border-t border-r border-b transition-colors
                      ${
                        viewMode === "grid"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                    <Grid3x3 className="w-4 h-4 inline-block mr-1" />
                    Grid
                  </button>
                </div>
              </div>
            )}
          </div>

          <ExportButtons
            data={data || []}
            type={activeTab}
            filters={filters}
            stats={stats}
            loading={loading}
            viewMode={attendanceViewMode} // Pass view mode for attendance
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
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
                <h3 className="text-red-800 font-semibold text-sm mb-1">
                  Terjadi Kesalahan
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak Ada Data
              </h3>
              <p className="text-gray-600 mb-1">
                {activeTab === "notes"
                  ? "Belum ada catatan siswa yang dibuat untuk kelas ini"
                  : "Tidak ada data yang sesuai dengan filter yang dipilih"}
              </p>
              {activeTab === "grades" && viewMode === "grid" && (
                <p className="text-sm text-gray-500">
                  Pastikan backend mengirim data untuk endpoint "grades-grid"
                </p>
              )}
              {activeTab === "attendance" && attendanceViewMode === "recap" && (
                <p className="text-sm text-gray-500">
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

export default ReportTeacher;
