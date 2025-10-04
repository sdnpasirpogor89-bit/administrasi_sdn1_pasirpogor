import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  UserCheck,
  BarChart3,
  TrendingUp,
  UserPlus,
  Download,
  RefreshCw,
  ClipboardList,
  Edit,
  Trash2,
  Key,
  Search,
  Filter,
  Eye,
  EyeOff,
  Save,
  X,
  AlertTriangle,
  Calendar,
  Database,
  FileDown,
  Upload,
  BookOpen,
  Settings,
  Smartphone,
  Monitor
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Confirmation Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${
              type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <AlertTriangle className={`h-5 w-5 sm:h-6 sm:w-6 ${
                type === 'danger' ? 'text-red-600' : 'text-yellow-600'
              }`} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h3>
          </div>
          
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base font-medium touch-manipulation"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base font-medium touch-manipulation ${
                type === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {type === 'danger' ? 'Hapus' : 'Konfirmasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stats Card Component with better mobile optimization
const StatsCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', isLoading = false }) => {
  const colorClasses = {
    blue: 'border-l-blue-500',
    green: 'border-l-emerald-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500',
    red: 'border-l-red-500'
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-emerald-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    red: 'text-red-500'
  };

  return (
    <div className={`bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border-l-4 ${colorClasses[color]} hover:shadow-md transition-all duration-200 touch-manipulation`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 leading-none">
            {isLoading ? (
              <div className="bg-gray-200 animate-pulse h-6 sm:h-10 w-10 sm:w-16 rounded"></div>
            ) : (
              <span className="block">{value}</span>
            )}
          </div>
          <div>
            <p className="text-xs sm:text-base font-semibold text-gray-700 truncate leading-tight">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <Icon size={20} className={`sm:size-6 lg:size-7 ${iconColorClasses[color]}`} />
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ userData }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Dashboard states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    classAttendance: [],
    weeklyTrend: [],
    totalClasses: 0
  });

  // Cek device type
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    if (userData) {
      fetchAdminDashboardData();
    }

    // Auto refresh every 5 minutes
    const interval = setInterval(() => {
      if (userData) {
        fetchAdminDashboardData();
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [userData]);

  // Check if userData is undefined - EARLY RETURN HARUS SETELAH SEMUA HOOKS
  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Memuat data user...</p>
        </div>
      </div>
    );
  }

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get week dates for trend analysis
  const getWeekDates = () => {
    const today = new Date();
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      week.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('id-ID', { weekday: isMobile ? 'narrow' : 'short' })
      });
    }
    return week;
  };

  // Navigation handler
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const today = getTodayDate();
      
      // Get recent attendance records with user info
      const { data: attendanceActivities, error: attendanceError } = await supabase
        .from('attendance')
        .select(`*, users!attendance_created_by_fkey(nama_lengkap)`)
        .eq('tanggal', today)
        .order('created_at', { ascending: false })
        .limit(10);

      if (attendanceError) throw attendanceError;

      const activities = [];

      // Process attendance activities
      if (attendanceActivities) {
        const groupedByClass = {};
        
        attendanceActivities.forEach(record => {
          const key = `${record.kelas}-${record.created_by}-${record.tanggal}`;
          if (!groupedByClass[key]) {
            groupedByClass[key] = {
              kelas: record.kelas,
              guru: record.users?.nama_lengkap || 'Unknown',
              created_at: record.created_at,
              count: 0,
              hadir: 0,
              izin: 0,
              sakit: 0,
              alpa: 0
            };
          }
          
          groupedByClass[key].count++;
          const status = record.status.toLowerCase();
          if (status === 'hadir') groupedByClass[key].hadir++;
          else if (status === 'izin') groupedByClass[key].izin++;
          else if (status === 'sakit') groupedByClass[key].sakit++;
          else if (status === 'alpa') groupedByClass[key].alpa++;
        });

        // Convert to activities
        Object.values(groupedByClass).forEach(group => {
          activities.push({
            id: `attendance-${group.kelas}-${group.created_at}`,
            type: 'attendance_input',
            icon: '📊',
            color: 'green',
            message: `${group.guru} input absen Kelas ${group.kelas} (${group.hadir}✓ ${group.izin}i ${group.sakit}s ${group.alpa}a)`,
            time: group.created_at
          });
        });
      }

      // Sort by time and limit
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivities(activities.slice(0, 8));

    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick Export function for dashboard
  const handleQuickExport = async (type) => {
    try {
      const today = getTodayDate();
      
      if (type === 'attendance') {
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select(`tanggal, nisn, nama_siswa, kelas, status, keterangan, created_at`)
          .eq('tanggal', today)
          .order('kelas', { ascending: true })
          .order('nama_siswa', { ascending: true });

        const csvContent = [
          ['Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Status', 'Keterangan', 'Input Time'].join(','),
          ...attendanceData.map(record => [
            record.tanggal,
            record.nisn,
            `"${record.nama_siswa}"`,
            record.kelas,
            record.status,
            record.keterangan || '',
            new Date(record.created_at).toLocaleString('id-ID')
          ].join(','))
        ].join('\n');

        downloadCSV(csvContent, `attendance_${today}.csv`);
      } else if (type === 'classAttendance') {
        const csvContent = [
          ['Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Total'].join(','),
          ...dashboardData.classAttendance.map(cls => [
            cls.kelas,
            cls.hadir,
            cls.izin,
            cls.sakit,
            cls.alpa,
            cls.hadir + cls.izin + cls.sakit + cls.alpa
          ].join(','))
        ].join('\n');

        downloadCSV(csvContent, `class_attendance_${today}.csv`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error saat export data');
    }
  };

  // Fetch dashboard data for ADMIN
  const fetchAdminDashboardData = async () => {
    setRefreshing(true);
    try {
      const today = getTodayDate();
      const weekDates = getWeekDates();

      // 1. Total Students (active only)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      // 2. Total Teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('users')
        .select('*')
        .in('role', ['guru_kelas', 'guru_mapel']);

      if (teachersError) throw teachersError;

      // 3. Today's Attendance
      const { data: todayAttendanceData, error: todayError } = await supabase
        .from('attendance')
        .select('*')
        .eq('tanggal', today);

      if (todayError) throw todayError;

      // 4. Class-wise attendance for today
      const classAttendanceMap = {};
      const allClasses = [...new Set(studentsData?.map(s => s.kelas) || [])].sort();

      // Initialize all classes
      allClasses.forEach(kelas => {
        classAttendanceMap[kelas] = {
          kelas: `Kelas ${kelas}`,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpa: 0
        };
      });

      // Count attendance by class and status
      todayAttendanceData?.forEach(record => {
        if (classAttendanceMap[record.kelas]) {
          const status = record.status.toLowerCase();
          if (status === 'hadir') {
            classAttendanceMap[record.kelas].hadir++;
          } else if (status === 'izin') {
            classAttendanceMap[record.kelas].izin++;
          } else if (status === 'sakit') {
            classAttendanceMap[record.kelas].sakit++;
          } else if (status === 'alpa') {
            classAttendanceMap[record.kelas].alpa++;
          }
        }
      });

      // For students not marked, consider as alpa
      const todayMarkedNisns = new Set(todayAttendanceData?.map(r => r.nisn) || []);
      studentsData?.forEach(student => {
        if (!todayMarkedNisns.has(student.nisn)) {
          if (classAttendanceMap[student.kelas]) {
            classAttendanceMap[student.kelas].alpa++;
          }
        }
      });

      // 5. Weekly Trend
      const weeklyTrendPromises = weekDates.map(async ({ date, day }) => {
        const { data: dayAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('tanggal', date)
          .eq('status', 'Hadir');

        const attendanceCount = dayAttendance?.length || 0;
        const totalStudents = studentsData?.length || 0;
        const attendanceRate = totalStudents > 0 
          ? Math.round((attendanceCount / totalStudents) * 100)
          : 0;

        return {
          day: day,
          attendance: attendanceRate,
          date: date
        };
      });

      const weeklyTrend = await Promise.all(weeklyTrendPromises);

      // Calculate overall attendance rate
      const todayPresentCount = todayAttendanceData?.filter(
        r => r.status.toLowerCase() === 'hadir'
      ).length || 0;
      const totalStudentsCount = studentsData?.length || 0;
      const attendanceRate = totalStudentsCount > 0 
        ? Math.round((todayPresentCount / totalStudentsCount) * 100)
        : 0;

      // Update state
      setDashboardData({
        totalStudents: totalStudentsCount,
        totalTeachers: teachersData?.length || 0,
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate,
        classAttendance: Object.values(classAttendanceMap),
        weeklyTrend: weeklyTrend,
        totalClasses: allClasses.length
      });

      // Fetch recent activities
      await fetchRecentActivities();

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      alert('Error mengambil data dashboard: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
      {/* Header with Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            Dashboard Admin
          </h1>
          <div className="flex items-center gap-1 text-xs text-gray-500 sm:hidden">
            <Smartphone size={12} />
            <span>Mobile</span>
          </div>
        </div>
        <button
          onClick={fetchAdminDashboardData}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base font-medium shadow-sm hover:shadow-md min-h-[44px] touch-manipulation w-full sm:w-auto justify-center ${
            refreshing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          <span>
            {refreshing ? 'Memperbarui...' : 'Refresh Data'}
          </span>
        </button>
      </div>

      {/* Stats Cards - Enhanced Mobile Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatsCard
          title="Total Siswa"
          value={dashboardData.totalStudents}
          subtitle="Siswa aktif terdaftar"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Total Guru"
          value={dashboardData.totalTeachers}
          subtitle="Guru aktif mengajar"
          icon={GraduationCap}
          color="green"
        />
        <StatsCard
          title="Hadir Hari Ini"
          value={dashboardData.todayAttendance}
          subtitle={`${dashboardData.attendanceRate}% dari total`}
          icon={UserCheck}
          color="purple"
        />
        <StatsCard
          title="Total Kelas"
          value={dashboardData.totalClasses}
          subtitle="Kelas aktif beroperasi"
          icon={BookOpen}
          color="orange"
        />
      </div>

      {/* Charts - Enhanced Mobile Responsiveness */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Class Attendance Chart */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              Kehadiran Per Kelas
            </h3>
          </div>
          <div className={isMobile ? "h-72" : "h-80"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dashboardData.classAttendance} 
                margin={isMobile ? { top: 10, right: 5, left: 5, bottom: 50 } : { top: 10, right: 10, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="kelas" 
                  fontSize={isMobile ? 10 : 12} 
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 60 : 50}
                  interval={0}
                />
                <YAxis fontSize={isMobile ? 10 : 12} />
                <Tooltip 
                  contentStyle={{
                    fontSize: isMobile ? '12px' : '14px',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    backgroundColor: 'white'
                  }}
                />
                <Bar dataKey="hadir" fill="#10b981" name="Hadir" radius={[2, 2, 0, 0]} />
                <Bar dataKey="izin" fill="#f59e0b" name="Izin" radius={[2, 2, 0, 0]} />
                <Bar dataKey="sakit" fill="#3b82f6" name="Sakit" radius={[2, 2, 0, 0]} />
                <Bar dataKey="alpa" fill="#ef4444" name="Alpa" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              Trend 7 Hari
            </h3>
          </div>
          <div className={isMobile ? "h-72" : "h-80"}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={dashboardData.weeklyTrend} 
                margin={isMobile ? { top: 10, right: 5, left: 5, bottom: 10 } : { top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" fontSize={isMobile ? 10 : 12} />
                <YAxis fontSize={isMobile ? 10 : 12} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Kehadiran']}
                  labelFormatter={(label) => `Hari: ${label}`}
                  contentStyle={{
                    fontSize: isMobile ? '12px' : '14px',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    backgroundColor: 'white'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#2563eb"
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{ r: isMobile ? 3 : 4, fill: '#2563eb' }}
                  activeDot={{ r: isMobile ? 5 : 6, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions for Admin - Enhanced Mobile */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
        <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
          Aksi Cepat
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <button 
            onClick={() => handleNavigation('/students')}
            className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
          >
            <Users size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="font-semibold text-center">Kelola Siswa</span>
          </button>
          <button 
            onClick={() => handleNavigation('/teachers')}
            className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:text-white hover:border-green-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
          >
            <GraduationCap size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="font-semibold text-center">Kelola Guru</span>
          </button>
          <button 
            onClick={() => handleQuickExport('attendance')}
            className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-purple-600 hover:to-purple-700 hover:text-white hover:border-purple-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
          >
            <Download size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="font-semibold text-center">Export Data</span>
          </button>
          <button 
            onClick={() => handleNavigation('/settings')}
            className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
          >
            <Settings size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="font-semibold text-center">Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Recent Activities Section - Mobile Optimized */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
            Aktivitas Terbaru
          </h3>
          <div className="space-y-2 sm:space-y-4">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 sm:gap-4 p-2 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors min-h-[50px] touch-manipulation">
                <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm sm:text-xl">{activity.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-base text-gray-900 line-clamp-2 leading-relaxed">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {new Date(activity.time).toLocaleString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {recentActivities.length > 5 && (
            <div className="mt-3 text-center">
              <button className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-base py-1.5 px-3 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation">
                Lihat Semua
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile-specific floating action button */}
      <div className="fixed bottom-20 right-4 sm:hidden z-40">
        <button
          onClick={fetchAdminDashboardData}
          disabled={refreshing}
          className={`w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center touch-manipulation ${
            refreshing ? 'opacity-50' : 'hover:bg-blue-700 active:scale-95'
          }`}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;