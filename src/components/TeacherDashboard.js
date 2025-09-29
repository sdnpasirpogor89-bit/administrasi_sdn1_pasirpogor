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
  Calendar
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

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', isLoading = false }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl">
          <Icon size={24} className={`text-${color}-600`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendingUp size={14} className={trend > 0 ? '' : 'rotate-180'} />
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-2">
          {isLoading ? (
            <div className="bg-gray-200 animate-pulse h-8 w-16 rounded"></div>
          ) : (
            value
          )}
        </h3>
        <p className="text-lg font-semibold text-gray-700 mb-1">{title}</p>
        {subtitle && <p className="text-sm text-gray-500 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

const TeacherDashboard = ({ userData }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    classAttendance: [],
    weeklyTrend: [],
    totalClasses: 0
  });

  const navigate = useNavigate();
  const isGuruKelas = userData.role === 'guru_kelas';
  const isGuruMapel = userData.role === 'guru_mapel';

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
        day: date.toLocaleDateString('id-ID', { weekday: 'long' })
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

      console.log('Fetching data for Guru Kelas:', userKelas);

      // 1. Students in this class ONLY
      const { data: classStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('kelas', userKelas)
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      if (!classStudents || classStudents.length === 0) {
        console.warn('Tidak ada siswa aktif di kelas:', userKelas);
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
          totalClasses: 1
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

      // Calculate class attendance rate
      const todayPresentCount = todayAttendanceData.filter(
        r => r.status.toLowerCase() === 'hadir'
      ).length;
      
      const totalClassStudents = classStudents.length;
      const attendanceRate = totalClassStudents > 0 
        ? Math.round((todayPresentCount / totalClassStudents) * 100)
        : 0;

      console.log('Guru Kelas Data:', {
        totalStudents: totalClassStudents,
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate,
        classAttendance: classAttendance
      });

      // Update state
      setDashboardData({
        totalStudents: totalClassStudents,
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate,
        classAttendance: [classAttendance],
        weeklyTrend: weeklyTrend,
        totalClasses: 1
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

      // Calculate overall attendance rate
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
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate,
        classAttendance: Object.values(classAttendanceMap),
        weeklyTrend: weeklyTrend,
        totalClasses: allClasses.length
      });

      console.log('Guru Mapel Data:', {
        totalStudents: totalStudentsCount,
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate
      });

    } catch (error) {
      console.error('Error fetching guru mapel dashboard data:', error);
    }
  };

  // Main fetch function that routes to role-specific functions
  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      console.log('Fetching dashboard data for role:', userData.role);

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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // Render Guru Kelas Dashboard
  const renderGuruKelasDashboard = () => {
    const kelasData = dashboardData.classAttendance[0] || { hadir: 0, izin: 0, sakit: 0, alpa: 0 };

    return (
      <div className="space-y-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Memperbarui...' : 'Refresh Data'}
          </button>
        </div>

        {/* Stats Cards for Guru Kelas */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatsCard
            title={`Total Siswa Kelas ${userData.kelas}`}
            value={dashboardData.totalStudents}
            subtitle="Siswa aktif di kelas ini"
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
            title="Tingkat Kehadiran"
            value={`${dashboardData.attendanceRate}%`}
            subtitle="Hari ini"
            icon={BarChart3}
            color="purple"
          />
          <StatsCard
            title="Siswa Alpa"
            value={kelasData.alpa}
            subtitle="Perlu perhatian"
            icon={Calendar}
            color="red"
          />
        </div>

        {/* Charts for Guru Kelas */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Pie Chart - Status Kehadiran */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Status Kehadiran Hari Ini - Kelas {userData.kelas}</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
                <Download size={16} />
                Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
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
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart - Weekly Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Trend Kehadiran Kelas {userData.kelas}</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Tingkat Kehadiran']}
                  labelFormatter={(label) => `Hari: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Aksi Cepat</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => handleNavigation('/attendance')}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <ClipboardList size={20} />
              <span>Input Kehadiran</span>
            </button>
            <button 
              onClick={() => handleNavigation('/grades')}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <BarChart3 size={20} />
              <span>Input Nilai</span>
            </button>
            <button 
              onClick={() => handleNavigation('/students')}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <Users size={20} />
              <span>Lihat Data Siswa</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Guru Mapel Dashboard
  const renderGuruMapelDashboard = () => {
    // Find the best class
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
      <div className="space-y-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Memperbarui...' : 'Refresh Data'}
          </button>
        </div>

        {/* Stats Cards for Guru Mapel */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatsCard
            title="Total Kelas Diampu"
            value={dashboardData.totalClasses}
            subtitle={`Kelas 1 - ${dashboardData.totalClasses}`}
            icon={GraduationCap}
            color="blue"
          />
          <StatsCard
            title="Siswa Keseluruhan"
            value={dashboardData.totalStudents}
            subtitle="Semua kelas yang diampu"
            icon={Users}
            color="green"
          />
          <StatsCard
            title="Rata-rata Kehadiran"
            value={`${dashboardData.attendanceRate}%`}
            subtitle="Semua kelas hari ini"
            icon={BarChart3}
            color="purple"
          />
          <StatsCard
            title="Kelas Terbaik"
            value={bestClass ? bestClass.kelas : 'N/A'}
            subtitle="Kehadiran tertinggi"
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Main Bar Chart - Perbandingan Antar Kelas */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Perbandingan Kehadiran Antar Kelas - Hari Ini</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <Download size={16} />
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dashboardData.classAttendance}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="kelas" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hadir" fill="#10b981" name="Hadir" />
              <Bar dataKey="izin" fill="#f59e0b" name="Izin" />
              <Bar dataKey="sakit" fill="#3b82f6" name="Sakit" />
              <Bar dataKey="alpa" fill="#ef4444" name="Alpa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Class Summary Cards */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Ringkasan Per Kelas - Hari Ini</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {dashboardData.classAttendance.map((kelas, index) => {
              const total = kelas.hadir + kelas.izin + kelas.sakit + kelas.alpa;
              const attendanceRate = total > 0 ? Math.round((kelas.hadir / total) * 100) : 0;
              
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
                  <h4 className="text-lg font-bold mb-4 text-gray-900 group-hover:text-white">{kelas.kelas}</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="block text-xl font-bold text-gray-900 group-hover:text-white">{total}</span>
                      <span className="text-xs opacity-80 font-medium">Total Siswa</span>
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 group-hover:text-white">{attendanceRate}%</span>
                      <span className="text-xs opacity-80 font-medium">Kehadiran</span>
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 group-hover:text-white">{kelas.alpa}</span>
                      <span className="text-xs opacity-80 font-medium">Alpa</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Aksi Cepat</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => handleNavigation('/attendance')}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <ClipboardList size={20} />
              <span>Input Kehadiran</span>
            </button>
            <button 
              onClick={() => handleNavigation('/grades')}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <BarChart3 size={20} />
              <span>Input Nilai</span>
            </button>
            <button 
              onClick={() => handleNavigation('/students')}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <Users size={20} />
              <span>Lihat Data Siswa</span>
            </button>
          </div>
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