import React, { useState, useEffect } from "react";
import useReportData from "./useReportData";
import useAnalytics from "./useAnalytics";
import FilterBar from "./FilterBar";
import StatsCards from "./StatsCards";
import DataTable from "./DataTable";
import ExportButtons from "./ExportButtons";
import { TrendingUp, Calendar, Users } from "lucide-react";

const ReportTeacher = ({ user }) => {
  // State untuk filters
  const [filters, setFilters] = useState({
    type: "students",
    kelas: user.role === "guru_kelas" ? user.kelas : "",
    mapel: user.role === "guru_mapel" ? user.mata_pelajaran : "",
    periode: "semua",
    dateRange: {
      start: null,
      end: null,
    },
  });

  // Fetch data menggunakan custom hook
  const { data, loading, error, refetch } = useReportData(
    filters.type,
    filters,
    user
  );

  // Kalkulasi analytics
  const stats = useAnalytics(data, filters.type);

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        ...newFilters,
      };

      // Lock kelas untuk guru_kelas
      if (user.role === "guru_kelas") {
        updated.kelas = user.kelas;
      }

      // Lock mapel untuk guru_mapel HANYA di laporan nilai
      if (user.role === "guru_mapel" && updated.type === "grades") {
        updated.mapel = user.mata_pelajaran;
      }

      return updated;
    });
  };

  // Reset filters ketika type berubah
  const handleTypeChange = (newType) => {
    setFilters({
      type: newType,
      kelas: user.role === "guru_kelas" ? user.kelas : "",
      mapel: user.role === "guru_mapel" && newType === "grades" ? user.mata_pelajaran : "",
      periode: "semua",
      dateRange: { start: null, end: null },
    });
  };

  // Refetch saat filters berubah
  useEffect(() => {
    refetch();
  }, [filters]);

  // Menu cards untuk quick access
  const reportMenus = [
    {
      type: "students",
      title: "Laporan Siswa",
      description:
        user.role === "guru_kelas"
          ? `Data siswa kelas ${user.kelas}`
          : "Data siswa aktif",
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      type: "grades",
      title: "Laporan Nilai",
      description:
        user.role === "guru_mapel"
          ? `Nilai ${user.mata_pelajaran}`
          : user.role === "guru_kelas"
          ? `Nilai kelas ${user.kelas}`
          : "Nilai & analisis akademik",
      icon: TrendingUp,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      type: "attendance",
      title: "Laporan Presensi",
      description:
        user.role === "guru_kelas"
          ? `Presensi kelas ${user.kelas}`
          : "Kehadiran & absensi siswa",
      icon: Calendar,
      color: "orange",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200",
    },
  ];

  // Filter options berdasarkan tipe laporan
  const getFilterOptions = () => {
    switch (filters.type) {
      case "students":
        return {
          showKelas: user.role !== "guru_kelas", // Guru kelas tidak bisa ganti kelas
          showMapel: false,
          showPeriode: false,
          showDateRange: false,
          showStatus: false,
          kelasOptions: [1, 2, 3, 4, 5, 6],
          lockedFilters: {
            kelas: user.role === "guru_kelas",
          },
        };
      case "grades":
        return {
          showKelas: true, // Semua role bisa lihat filter kelas
          showMapel: true, // Semua role bisa lihat filter mapel
          showPeriode: true,
          showDateRange: false,
          showStatus: false,
          kelasOptions: [1, 2, 3, 4, 5, 6],
          mapelOptions: [
            "Matematika",
            "Bahasa Indonesia",
            "IPA",
            "IPS",
            "Bahasa Inggris",
            "PJOK",
            "Seni Budaya",
            "PKN",
            "Agama",
          ],
          periodeOptions: [
            { value: "semua", label: "Semua Periode" },
            { value: "harian", label: "Harian" },
            { value: "uts", label: "UTS" },
            { value: "uas", label: "UAS" },
            { value: "semester", label: "Semester" },
          ],
          lockedFilters: {
            kelas: user.role === "guru_kelas", // Kelas locked untuk guru_kelas
            mapel: user.role === "guru_mapel", // Mapel locked untuk guru_mapel
          },
        };
      case "attendance":
        return {
          showKelas: user.role !== "guru_kelas",
          showMapel: false,
          showPeriode: true,
          showDateRange: true,
          showStatus: true, // Tambahkan filter status (Hadir/Sakit/Izin/Alpa)
          kelasOptions: [1, 2, 3, 4, 5, 6],
          statusOptions: [
            { value: "semua", label: "Semua Status" },
            { value: "Hadir", label: "Hadir" },
            { value: "Sakit", label: "Sakit" },
            { value: "Izin", label: "Izin" },
            { value: "Alpa", label: "Alpa" },
          ],
          periodeOptions: [
            { value: "semua", label: "Semua Periode" },
            { value: "harian", label: "Hari Ini" },
            { value: "mingguan", label: "Minggu Ini" },
            { value: "bulanan", label: "Bulan Ini" },
            { value: "custom", label: "Rentang Tanggal" },
          ],
          lockedFilters: {
            kelas: user.role === "guru_kelas",
          },
        };
      default:
        return {
          showKelas: true,
          showMapel: true,
          showPeriode: true,
          showDateRange: true,
          showStatus: false,
          kelasOptions: [1, 2, 3, 4, 5, 6],
          lockedFilters: {},
        };
    }
  };

  const filterOptions = getFilterOptions();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Laporan & Analisis
          </h1>
          <p className="text-gray-600">
            Dashboard Laporan Untuk
            {user.role === "guru_kelas" && ` Kelas ${user.kelas}`}
            {user.role === "guru_mapel" && ` ${user.mata_pelajaran}`}
          </p>
        </div>

        {/* Access Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-blue-900 font-semibold text-sm mb-1">
                Akses Terbatas
              </h3>
              <p className="text-blue-800 text-sm">
                {user.role === "guru_kelas" &&
                  `Anda hanya dapat melihat data untuk kelas ${user.kelas}.`}
                {user.role === "guru_mapel" &&
                  `Untuk laporan nilai, Anda hanya dapat melihat mata pelajaran ${user.mata_pelajaran}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Report Type Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {reportMenus.map((menu) => {
            const Icon = menu.icon;
            const isActive = filters.type === menu.type;

            return (
              <button
                key={menu.type}
                onClick={() => handleTypeChange(menu.type)}
                className={`
                  p-6 rounded-xl border-2 text-left transition-all duration-200
                  ${
                    isActive
                      ? `${menu.bgColor} ${menu.borderColor} shadow-md scale-105`
                      : "bg-white border-gray-200 hover:shadow-md hover:scale-102"
                  }
                `}>
                <div
                  className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-4
                  ${isActive ? menu.bgColor : "bg-gray-100"}
                `}>
                  <Icon
                    className={`w-6 h-6 ${
                      isActive ? menu.iconColor : "text-gray-600"
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {menu.title}
                </h3>
                <p className="text-sm text-gray-600">{menu.description}</p>
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Filter Laporan {reportMenus.find((m) => m.type === filters.type)?.title}
          </h2>
          <FilterBar
            onFilterChange={handleFilterChange}
            userRole={user.role}
            userKelas={user.kelas}
            userMapel={user.mata_pelajaran}
            currentFilters={filters}
            filterOptions={filterOptions}
          />
        </div>

        {/* Statistics Cards */}
        {!loading && !error && data.length > 0 && (
          <div className="mb-6">
            <StatsCards type={filters.type} stats={stats} />
          </div>
        )}

        {/* Export Buttons */}
        {!loading && !error && data.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Export Laporan
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total {data.length} data ditemukan
                </p>
              </div>
              <ExportButtons
                data={data}
                type={filters.type}
                filters={filters}
                stats={stats}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
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
              </div>
              <div>
                <h3 className="text-red-800 font-semibold mb-1">
                  Terjadi Kesalahan
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Data {reportMenus.find((m) => m.type === filters.type)?.title}
            </h2>
          </div>

          <DataTable data={data} type={filters.type} loading={loading} />

          {/* Empty State */}
          {!loading && !error && data.length === 0 && (
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
              <p className="text-gray-600 mb-4">
                Tidak ada data yang sesuai dengan filter yang dipilih.
              </p>
              <button
                onClick={() => handleTypeChange(filters.type)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p className="text-sm text-gray-500">
            {user.role === "guru_kelas" && `Guru Kelas ${user.kelas}`}
            {user.role === "guru_mapel" && `Guru ${user.mata_pelajaran}`}
            {user.role === "admin" && "Administrator"}
            {" - "}
            <span className="font-semibold text-gray-700">
              {user.full_name}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportTeacher;