import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  UserCheck,
  BarChart3,
  TrendingUp,
  Download,
  RefreshCw,
  ClipboardList,
  Calendar,
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
  PieChart,
  Pie,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Enhanced Stats Card Component for Mobile
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

// Mobile Class Summary Card
const MobileClassCard = ({ kelas, hadir, izin, sakit, alpa }) => {
  const total = hadir + izin + sakit + alpa;
  const tidakHadir = izin + sakit + alpa; // FIX: Yang tidak hadir = izin + sakit + alpa
  const attendanceRate = total > 0 ? Math.round((hadir / total) * 100) : 0;

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
      <h4 className="font-bold text-gray-900 mb-2 text-sm">{kelas}</h4>
      <div className="grid grid-cols-4 gap-1 text-center">
        <div className="bg-green-50 rounded p-1">
          <span className="block font-bold text-green-700 text-xs">{hadir}</span>
          <span className="text-xs text-green-600">Hadir</span>
        </div>
        <div className="bg-yellow-50 rounded p-1">
          <span className="block font-bold text-yellow-700 text-xs">{izin}</span>
          <span className="text-xs text-yellow-600">Izin</span>
        </div>
        <div className="bg-blue-50 rounded p-1">
          <span className="block font-bold text-blue-700 text-xs">{sakit}</span>
          <span className="text-xs text-blue-600">Sakit</span>
        </div>
        <div className="bg-red-50 rounded p-1">
          <span className="block font-bold text-red-700 text-xs">{alpa}</span>
          <span className="text-xs text-red-600">Alpa</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Tidak Hadir</span>
          <span className="font-bold text-gray-900 text-sm">{tidakHadir}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-600">Kehadiran</span>
          <span className="font-bold text-gray-900 text-sm">{attendanceRate}%</span>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = ({ userData }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    classAttendance: [],
    weeklyTrend: [],
    totalClasses: 0,
    tidakHadir: 0 // FIX: Tambah state untuk tidak hadir
  });

  const navigate = useNavigate();
  const isGuruKelas = userData.role === 'guru_kelas';
  const isGuruMapel = userData.role === 'guru_mapel';

  // Cek device type
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

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

  // Fetch dashboard data for GURU KELAS
  const fetchGuruKelasDashboardData = async () => {
    try {
      const today = getTodayDate();
      const weekDates = getWeekDates();
      const userKelas = userData.kelas;

      // 1. Students in this class ONLY
      const { data: classStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('kelas', userKelas)
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      if (!classStudents || classStudents.length === 0) {
        setDashboardData({
          totalStudents: 0,
          todayAttendance: 0,
          attendanceRate: 0,
          classAttendance: [{
            kelas: `Kelas ${userKelas}`,
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpa: 0
          }],
          weeklyTrend: weekDates.map(({ date, day }) => ({ day, attendance: 0, date })),
          totalClasses: 1,
          tidakHadir: 0
        });
        return;
      }

      // 2. Today's Attendance for this class ONLY
      const { data: todayAttendanceData, error: todayError } = await supabase
        .from('attendance')
        .select('*')
        .eq('tanggal', today)
        .eq('kelas', userKelas);

      if (todayError) throw todayError;

      // 3. Class attendance breakdown
      const classAttendance = {
        kelas: `Kelas ${userKelas}`,
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0
      };

      // Count attendance by status
      todayAttendanceData.forEach(record => {
        const status = record.status.toLowerCase();
        if (status === 'hadir') {
          classAttendance.hadir++;
        } else if (status === 'izin') {
          classAttendance.izin++;
        } else if (status === 'sakit') {
          classAttendance.sakit++;
        } else if (status === 'alpa') {
          classAttendance.alpa++;
        }
      });

      // For students not marked, consider as alpa
      const todayMarkedNisns = new Set(todayAttendanceData.map(r => r.nisn));
      classStudents.forEach(student => {
        if (!todayMarkedNisns.has(student.nisn)) {
          classAttendance.alpa++;
        }
      });

      // 4. Weekly Trend for this class ONLY
      const weeklyTrendPromises = weekDates.map(async ({ date, day }) => {
        const { data: dayAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('tanggal', date)
          .eq('kelas', userKelas)
          .eq('status', 'Hadir');

        const attendanceCount = dayAttendance?.length || 0;
        const totalStudents = classStudents.length;
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

      // FIX: Calculate class attendance rate - YANG HADIR HANYA STATUS "HADIR"
      const todayPresentCount = todayAttendanceData.filter(
        r => r.status.toLowerCase() === 'hadir'
      ).length;
      
      const totalClassStudents = classStudents.length;
      const attendanceRate = totalClassStudents > 0 
        ? Math.round((todayPresentCount / totalClassStudents) * 100)
        : 0;

      // FIX: Hitung yang tidak hadir (izin + sakit + alpa)
      const tidakHadirCount = classAttendance.izin + classAttendance.sakit + classAttendance.alpa;

      // Update state
      setDashboardData({
        totalStudents: totalClassStudents,
        todayAttendance: todayPresentCount, // Hanya yang status "Hadir"
        attendanceRate: attendanceRate,
        classAttendance: [classAttendance],
        weeklyTrend: weeklyTrend,
        totalClasses: 1,
        tidakHadir: tidakHadirCount // Tambah data tidak hadir
      });
    } catch (error) {
      console.error('Error fetching guru kelas dashboard data:', error);
    }
  };

  // Fetch dashboard data for GURU MAPEL
  const fetchGuruMapelDashboardData = async () => {
    try {
      const today = getTodayDate();
      const weekDates = getWeekDates();

      // 1. All Students (since guru mapel teaches all classes)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      // 2. Today's Attendance for all classes
      const { data: todayAttendanceData, error: todayError } = await supabase
        .from('attendance')
        .select('*')
        .eq('tanggal', today);

      if (todayError) throw todayError;

      // 3. Class-wise attendance for today
      const classAttendanceMap = {};
      const allClasses = [...new Set(studentsData.map(s => s.kelas))].sort();

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
      todayAttendanceData.forEach(record => {
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
      const todayMarkedNisns = new Set(todayAttendanceData.map(r => r.nisn));
      studentsData.forEach(student => {
        if (!todayMarkedNisns.has(student.nisn)) {
          if (classAttendanceMap[student.kelas]) {
            classAttendanceMap[student.kelas].alpa++;
          }
        }
      });

      // 4. Weekly Trend (all classes)
      const weeklyTrendPromises = weekDates.map(async ({ date, day }) => {
        const { data: dayAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('tanggal', date)
          .eq('status', 'Hadir');

        const attendanceCount = dayAttendance?.length || 0;
        const totalStudents = studentsData.length;
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

      // FIX: Calculate overall attendance rate - HANYA STATUS "HADIR"
      const todayPresentCount = todayAttendanceData.filter(
        r => r.status.toLowerCase() === 'hadir'
      ).length;
      const totalStudentsCount = studentsData.length;
      const attendanceRate = totalStudentsCount > 0 
        ? Math.round((todayPresentCount / totalStudentsCount) * 100)
        : 0;

      // Update state
      setDashboardData({
        totalStudents: totalStudentsCount,
        todayAttendance: todayPresentCount, // Hanya yang status "Hadir"
        attendanceRate: attendanceRate,
        classAttendance: Object.values(classAttendanceMap),
        weeklyTrend: weeklyTrend,
        totalClasses: allClasses.length,
        tidakHadir: totalStudentsCount - todayPresentCount // Hitung tidak hadir
      });

    } catch (error) {
      console.error('Error fetching guru mapel dashboard data:', error);
    }
  };

  // Main fetch function that routes to role-specific functions
  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      if (isGuruKelas) {
        await fetchGuruKelasDashboardData();
      } else if (isGuruMapel) {
        await fetchGuruMapelDashboardData();
      }
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000);

    return () => clearInterval(interval);
  }, [userData.role, userData.kelas]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // Render Guru Kelas Dashboard
  const renderGuruKelasDashboard = () => {
    const kelasData = dashboardData.classAttendance[0] || { hadir: 0, izin: 0, sakit: 0, alpa: 0 };

    return (
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
        {/* Header with Refresh Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              Dashboard Guru Kelas {userData.kelas}
            </h1>
            <div className="flex items-center gap-1 text-xs text-gray-500 sm:hidden">
              <Smartphone size={12} />
              <span>Mobile</span>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base font-medium shadow-sm hover:shadow-md min-h-[44px] touch-manipulation w-full sm:w-auto justify-center ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Memperbarui...' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* Stats Cards for Guru Kelas */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatsCard
            title={`Siswa Kelas ${userData.kelas}`}
            value={dashboardData.totalStudents}
            subtitle="Siswa aktif"
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Hadir Hari Ini"
            value={dashboardData.todayAttendance}
            subtitle={`Dari ${dashboardData.totalStudents} siswa`}
            icon={UserCheck}
            color="green"
          />
          <StatsCard
            title="Tidak Hadir"
            value={dashboardData.tidakHadir}
            subtitle="Izin + Sakit + Alpa"
            icon={Calendar}
            color="red"
          />
          <StatsCard
            title="Tingkat Kehadiran"
            value={`${dashboardData.attendanceRate}%`}
            subtitle="Hari ini"
            icon={BarChart3}
            color="purple"
          />
        </div>

        {/* Charts for Guru Kelas - FIX: Grid layout untuk desktop */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Pie Chart - Status Kehadiran */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
            <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
              <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                Status Kehadiran - Kelas {userData.kelas}
              </h3>
            </div>
            <div className={isMobile ? "h-72" : "h-80"}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Hadir', value: kelasData.hadir, fill: '#10b981' },
                      { name: 'Izin', value: kelasData.izin, fill: '#f59e0b' },
                      { name: 'Sakit', value: kelasData.sakit, fill: '#3b82f6' },
                      { name: 'Alpa', value: kelasData.alpa, fill: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 80 : 100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart - Weekly Trend */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
            <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
              <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                Trend Kehadiran
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
                    dot={{ r: isMobile ? 3 : 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions - FIX: 3 tombol sejajar di HP */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
            Aksi Cepat
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <button 
              onClick={() => handleNavigation('/attendance')}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
            >
              <ClipboardList size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-center">Input Kehadiran</span>
            </button>
            <button 
              onClick={() => handleNavigation('/grades')}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
            >
              <BarChart3 size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-center">Input Nilai</span>
            </button>
            <button 
              onClick={() => handleNavigation('/students')}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
            >
              <Users size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-center">Data Siswa</span>
            </button>
          </div>
        </div>

        {/* Mobile floating refresh button */}
        <div className="fixed bottom-20 right-4 sm:hidden z-40">
          <button
            onClick={fetchDashboardData}
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

  // Render Guru Mapel Dashboard
  const renderGuruMapelDashboard = () => {
    const bestClass = dashboardData.classAttendance.length > 0
      ? dashboardData.classAttendance.reduce((best, current) => {
          const currentTotal = current.hadir + current.izin + current.sakit + current.alpa;
          const bestTotal = best.hadir + best.izin + best.sakit + best.alpa;
          const currentRate = currentTotal > 0 ? (current.hadir / currentTotal) * 100 : 0;
          const bestRate = bestTotal > 0 ? (best.hadir / bestTotal) * 100 : 0;
          return currentRate > bestRate ? current : best;
        })
      : null;

    return (
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
        {/* Header with Refresh Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              Dashboard Guru Mapel
            </h1>
            <div className="flex items-center gap-1 text-xs text-gray-500 sm:hidden">
              <Smartphone size={12} />
              <span>Mobile</span>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base font-medium shadow-sm hover:shadow-md min-h-[44px] touch-manipulation w-full sm:w-auto justify-center ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Memperbarui...' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* Stats Cards for Guru Mapel */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatsCard
            title="Total Kelas"
            value={dashboardData.totalClasses}
            subtitle={`Kelas 1 - ${dashboardData.totalClasses}`}
            icon={GraduationCap}
            color="blue"
          />
          <StatsCard
            title="Total Siswa"
            value={dashboardData.totalStudents}
            subtitle="Semua kelas"
            icon={Users}
            color="green"
          />
          <StatsCard
            title="Tidak Hadir"
            value={dashboardData.tidakHadir}
            subtitle="Izin + Sakit + Alpa"
            icon={Calendar}
            color="red"
          />
          <StatsCard
            title="Kelas Terbaik"
            value={bestClass ? bestClass.kelas.replace('Kelas ', '') : 'N/A'}
            subtitle="Kehadiran tertinggi"
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Main Bar Chart - Perbandingan Antar Kelas */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-4">
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              Perbandingan Kehadiran Antar Kelas
            </h3>
            <button className="flex items-center gap-2 px-4 py-2.5 sm:py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-[44px] w-full sm:w-auto justify-center">
              <Download size={16} />
              Export
            </button>
          </div>
          <div className={isMobile ? "h-96" : "h-80"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dashboardData.classAttendance}
                margin={isMobile ? { top: 20, right: 10, left: 10, bottom: 40 } : { top: 20, right: 30, left: 20, bottom: 20 }}
                layout={isMobile ? "vertical" : "horizontal"}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                {isMobile ? (
                  <>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis 
                      type="category" 
                      dataKey="kelas" 
                      tick={{ fontSize: 10 }}
                      width={80}
                    />
                  </>
                ) : (
                  <>
                    <XAxis 
                      dataKey="kelas" 
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 10 }}
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                  </>
                )}
                <Tooltip />
                <Bar dataKey="hadir" fill="#10b981" name="Hadir" radius={[2, 2, 0, 0]} />
                <Bar dataKey="izin" fill="#f59e0b" name="Izin" radius={[2, 2, 0, 0]} />
                <Bar dataKey="sakit" fill="#3b82f6" name="Sakit" radius={[2, 2, 0, 0]} />
                <Bar dataKey="alpa" fill="#ef4444" name="Alpa" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Summary Cards */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
            Ringkasan Per Kelas
          </h3>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'} gap-3 sm:gap-4`}>
            {dashboardData.classAttendance.map((kelas, index) => (
              <MobileClassCard
                key={index}
                kelas={kelas.kelas}
                hadir={kelas.hadir}
                izin={kelas.izin}
                sakit={kelas.sakit}
                alpa={kelas.alpa}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions - FIX: 3 tombol sejajar di HP */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
            Aksi Cepat
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <button 
              onClick={() => handleNavigation('/attendance')}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
            >
              <ClipboardList size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-center">Input Kehadiran</span>
            </button>
            <button 
              onClick={() => handleNavigation('/grades')}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
            >
              <BarChart3 size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-center">Input Nilai</span>
            </button>
            <button 
              onClick={() => handleNavigation('/students')}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation"
            >
              <Users size={isMobile ? 18 : 20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-center">Data Siswa</span>
            </button>
          </div>
        </div>

        {/* Mobile floating refresh button */}
        <div className="fixed bottom-20 right-4 sm:hidden z-40">
          <button
            onClick={fetchDashboardData}
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

  // Main render function
  if (isGuruKelas) {
    return renderGuruKelasDashboard();
  } else if (isGuruMapel) {
    return renderGuruMapelDashboard();
  } else {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Dashboard content for {userData.role}</p>
      </div>
    );
  }
};

export default TeacherDashboard;