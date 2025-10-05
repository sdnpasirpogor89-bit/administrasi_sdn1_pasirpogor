import React, { useState, useEffect } from 'react';
import useReportData from './useReportData';
import useAnalytics from './useAnalytics';
import FilterBar from './FilterBar';
import StatsCards from './StatsCards';
import DataTable from './DataTable';
import ExportButtons from './ExportButtons';
import { FileText, TrendingUp, Calendar, Users } from 'lucide-react';

const ReportAdmin = ({ user }) => {
  
  // State untuk filters
  const [filters, setFilters] = useState({
    type: 'students',
    kelas: '',
    mapel: '',
    periode: 'semua',
    dateRange: {
      start: null,
      end: null
    }
  });

  // Fetch data menggunakan custom hook
  const { data, loading, error, refetch } = useReportData(filters.type, filters, user);
  
  // Kalkulasi analytics
  const stats = useAnalytics(data, filters.type);

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Refetch saat filters berubah
  useEffect(() => {
    refetch();
  }, [filters]);

  // Menu cards untuk quick access
  const reportMenus = [
    {
      type: 'students',
      title: 'Laporan Siswa',
      description: 'Data lengkap siswa aktif',
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      type: 'grades',
      title: 'Laporan Nilai',
      description: 'Nilai & analisis akademik',
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      type: 'attendance',
      title: 'Laporan Presensi',
      description: 'Kehadiran & absensi siswa',
      icon: Calendar,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      type: 'teachers',
      title: 'Laporan Guru',
      description: 'Aktivitas & performa guru',
      icon: FileText,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Laporan & Analisis
          </h1>
          <p className="text-gray-600">
            Dashboard lengkap laporan sistem untuk administrator
          </p>
        </div>

        {/* Report Type Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {reportMenus.map((menu) => {
            const Icon = menu.icon;
            const isActive = filters.type === menu.type;
            
            return (
              <button
                key={menu.type}
                onClick={() => handleFilterChange({ type: menu.type })}
                className={`
                  p-6 rounded-xl border-2 text-left transition-all duration-200
                  ${isActive
                    ? `${menu.bgColor} ${menu.borderColor} shadow-md scale-105`
                    : 'bg-white border-gray-200 hover:shadow-md hover:scale-102'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-4
                  ${isActive ? menu.bgColor : 'bg-gray-100'}
                `}>
                  <Icon className={`w-6 h-6 ${isActive ? menu.iconColor : 'text-gray-600'}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {menu.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {menu.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Laporan</h2>
          <FilterBar
            onFilterChange={handleFilterChange}
            userRole={user.role}
            userKelas={user.kelas}
            userMapel={user.mata_pelajaran}
            currentFilters={filters}
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
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-semibold mb-1">Terjadi Kesalahan</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
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
              Data {reportMenus.find(m => m.type === filters.type)?.title}
            </h2>
          </div>
          
          <DataTable
            data={data}
            type={filters.type}
            loading={loading}
          />

          {/* Empty State */}
          {!loading && !error && data.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak Ada Data
              </h3>
              <p className="text-gray-600 mb-4">
                Tidak ada data yang sesuai dengan filter yang dipilih.
              </p>
              <button
                onClick={() => setFilters({
                  type: filters.type,
                  kelas: '',
                  mapel: '',
                  periode: 'semua',
                  dateRange: { start: null, end: null }
                })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Login sebagai: <span className="font-semibold text-gray-700">{user.full_name}</span> 
            {' '}({user.role})
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportAdmin;