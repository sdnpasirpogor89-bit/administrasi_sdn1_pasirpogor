//[file name]: Dashboard.js
import React, { useState, useEffect, useLayoutEffect } from "react"; // ✅ TAMBAH useLayoutEffect
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
  Monitor,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

// Helper hook untuk mendeteksi apakah dark mode aktif (Asumsi menggunakan class 'dark' di body/html)
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === "class" &&
          (document.documentElement.classList.contains("dark") ||
            document.body.classList.contains("dark"))
        ) {
          setIsDark(true);
        } else {
          setIsDark(false);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Initial check
    if (
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark")
    ) {
      setIsDark(true);
    }

    return () => observer.disconnect();
  }, []);
  return isDark;
};

const Dashboard = ({ userData }) => {
  // 🔥 FIX 1: Simplifikasi device detection - sama seperti TeacherDashboard.js
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // ✅ Flag initialization

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    classAttendance: [],
    weeklyTrend: [],
    totalClasses: 0,
  });

  const isDark = useDarkMode();
  const navigate = useNavigate();

  // 🔥 FIX 2: Gunakan useLayoutEffect untuk device detection yang konsisten
  useLayoutEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsInitialized(true); // ✅ Tandai sudah initialized
    };

    // Langsung eksekusi
    checkDevice();

    // Tambah listener untuk resize
    window.addEventListener("resize", checkDevice);

    // Cleanup
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // ✅ TAMBAH: Backup resize listener
  useEffect(() => {
    if (!isInitialized) return;

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        setIsMobile(mobile);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isInitialized, isMobile]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get week dates for trend analysis
  const getWeekDates = () => {
    const today = new Date();
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      week.push({
        date: date.toISOString().split("T")[0],
        day: date.toLocaleDateString("id-ID", { weekday: "short" }), // Short day for mobile
      });
    }
    return week;
  };

  // Fungsi untuk navigasi
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fetch dashboard data for ADMIN
  const fetchAdminDashboardData = async () => {
    try {
      const today = getTodayDate();
      const weekDates = getWeekDates();

      // 1. Total Students (active only)
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      // 2. Total Teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from("users")
        .select("*")
        .in("role", ["guru_kelas", "guru_mapel"]);

      if (teachersError) throw teachersError;

      // 3. Today's Attendance
      const { data: todayAttendanceData, error: todayError } = await supabase
        .from("attendance")
        .select("*")
        .eq("tanggal", today);

      if (todayError) throw todayError;

      // 4. Class-wise attendance for today
      const classAttendanceMap = {};
      const allClasses = [...new Set(studentsData.map((s) => s.kelas))].sort();

      // Initialize all classes
      allClasses.forEach((kelas) => {
        classAttendanceMap[kelas] = {
          kelas: `Kelas ${kelas}`,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpa: 0,
        };
      });

      // Count attendance by class and status
      todayAttendanceData.forEach((record) => {
        if (classAttendanceMap[record.kelas]) {
          const status = record.status.toLowerCase();
          if (status === "hadir") {
            classAttendanceMap[record.kelas].hadir++;
          } else if (status === "izin") {
            classAttendanceMap[record.kelas].izin++;
          } else if (status === "sakit") {
            classAttendanceMap[record.kelas].sakit++;
          } else if (status === "alpa") {
            classAttendanceMap[record.kelas].alpa++;
          }
        }
      });

      // For students not marked, consider as alpa
      const todayMarkedNisns = new Set(todayAttendanceData.map((r) => r.nisn));
      studentsData.forEach((student) => {
        if (!todayMarkedNisns.has(student.nisn)) {
          if (classAttendanceMap[student.kelas]) {
            classAttendanceMap[student.kelas].alpa++;
          }
        }
      });

      // 5. Weekly Trend
      const weeklyTrendPromises = weekDates.map(async ({ date, day }) => {
        const { data: dayAttendance } = await supabase
          .from("attendance")
          .select("*")
          .eq("tanggal", date)
          .eq("status", "Hadir");

        const attendanceCount = dayAttendance?.length || 0;
        const totalStudents = studentsData.length;
        const attendanceRate =
          totalStudents > 0
            ? Math.round((attendanceCount / totalStudents) * 100)
            : 0;

        return {
          day: day,
          attendance: attendanceRate,
          date: date,
        };
      });

      const weeklyTrend = await Promise.all(weeklyTrendPromises);

      // Calculate overall attendance rate
      const todayPresentCount = todayAttendanceData.filter(
        (r) => r.status.toLowerCase() === "hadir"
      ).length;
      const totalStudentsCount = studentsData.length;
      const attendanceRate =
        totalStudentsCount > 0
          ? Math.round((todayPresentCount / totalStudentsCount) * 100)
          : 0;

      // Update state
      setDashboardData({
        totalStudents: totalStudentsCount,
        totalTeachers: teachersData.length,
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate,
        classAttendance: Object.values(classAttendanceMap),
        weeklyTrend: weeklyTrend,
        totalClasses: allClasses.length,
      });
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
    }
  };

  // Fetch dashboard data for GURU KELAS
  const fetchGuruKelasDashboardData = async () => {
    try {
      const today = getTodayDate();
      const weekDates = getWeekDates();
      const userKelas = userData.kelas;

      // 1. Students in this class ONLY
      const { data: classStudents, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("kelas", userKelas)
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      if (!classStudents || classStudents.length === 0) {
        setDashboardData({
          totalStudents: 0,
          totalTeachers: 0,
          todayAttendance: 0,
          attendanceRate: 0,
          classAttendance: [
            {
              kelas: `Kelas ${userKelas}`,
              hadir: 0,
              izin: 0,
              sakit: 0,
              alpa: 0,
            },
          ],
          weeklyTrend: weekDates.map(({ date, day }) => ({
            day,
            attendance: 0,
            date,
          })),
          totalClasses: 1,
        });
        return;
      }

      // 2. Today's Attendance for this class ONLY
      const { data: todayAttendanceData, error: todayError } = await supabase
        .from("attendance")
        .select("*")
        .eq("tanggal", today)
        .eq("kelas", userKelas);

      if (todayError) throw todayError;

      // 3. Class attendance breakdown
      const classAttendance = {
        kelas: `Kelas ${userKelas}`,
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
      };

      // Count attendance by status
      todayAttendanceData.forEach((record) => {
        const status = record.status.toLowerCase();
        if (status === "hadir") {
          classAttendance.hadir++;
        } else if (status === "izin") {
          classAttendance.izin++;
        } else if (status === "sakit") {
          classAttendance.sakit++;
        } else if (status === "alpa") {
          classAttendance.alpa++;
        }
      });

      // For students not marked, consider as alpa
      const todayMarkedNisns = new Set(todayAttendanceData.map((r) => r.nisn));
      classStudents.forEach((student) => {
        if (!todayMarkedNisns.has(student.nisn)) {
          classAttendance.alpa++;
        }
      });

      // 4. Weekly Trend for this class ONLY
      const weeklyTrendPromises = weekDates.map(async ({ date, day }) => {
        const { data: dayAttendance } = await supabase
          .from("attendance")
          .select("*")
          .eq("tanggal", date)
          .eq("kelas", userKelas)
          .eq("status", "Hadir");

        const attendanceCount = dayAttendance?.length || 0;
        const totalStudents = classStudents.length;
        const attendanceRate =
          totalStudents > 0
            ? Math.round((attendanceCount / totalStudents) * 100)
            : 0;

        return {
          day: day,
          attendance: attendanceRate,
          date: date,
        };
      });

      const weeklyTrend = await Promise.all(weeklyTrendPromises);

      // Calculate class attendance rate
      const todayPresentCount = todayAttendanceData.filter(
        (r) => r.status.toLowerCase() === "hadir"
      ).length;

      const totalClassStudents = classStudents.length;
      const attendanceRate =
        totalClassStudents > 0
          ? Math.round((todayPresentCount / totalClassStudents) * 100)
          : 0;

      // Update state
      setDashboardData({
        totalStudents: totalClassStudents,
        totalTeachers: 0,
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate,
        classAttendance: [classAttendance],
        weeklyTrend: weeklyTrend,
        totalClasses: 1,
      });
    } catch (error) {
      console.error("Error fetching guru kelas dashboard data:", error);
    }
  };

  // Fetch dashboard data for GURU MAPEL
  const fetchGuruMapelDashboardData = async () => {
    try {
      const today = getTodayDate();
      const weekDates = getWeekDates();

      // 1. All Students (since guru mapel teaches all classes)
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      // 2. Today's Attendance for all classes
      const { data: todayAttendanceData, error: todayError } = await supabase
        .from("attendance")
        .select("*")
        .eq("tanggal", today);

      if (todayError) throw todayError;

      // 3. Class-wise attendance for today
      const classAttendanceMap = {};
      const allClasses = [...new Set(studentsData.map((s) => s.kelas))].sort();

      // Initialize all classes
      allClasses.forEach((kelas) => {
        classAttendanceMap[kelas] = {
          kelas: `Kelas ${kelas}`,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpa: 0,
        };
      });

      // Count attendance by class and status
      todayAttendanceData.forEach((record) => {
        if (classAttendanceMap[record.kelas]) {
          const status = record.status.toLowerCase();
          if (status === "hadir") {
            classAttendanceMap[record.kelas].hadir++;
          } else if (status === "izin") {
            classAttendanceMap[record.kelas].izin++;
          } else if (status === "sakit") {
            classAttendanceMap[record.kelas].sakit++;
          } else if (status === "alpa") {
            classAttendanceMap[record.kelas].alpa++;
          }
        }
      });

      // For students not marked, consider as alpa
      const todayMarkedNisns = new Set(todayAttendanceData.map((r) => r.nisn));
      studentsData.forEach((student) => {
        if (!todayMarkedNisns.has(student.nisn)) {
          if (classAttendanceMap[student.kelas]) {
            classAttendanceMap[student.kelas].alpa++;
          }
        }
      });

      // 4. Weekly Trend (all classes)
      const weeklyTrendPromises = weekDates.map(async ({ date, day }) => {
        const { data: dayAttendance } = await supabase
          .from("attendance")
          .select("*")
          .eq("tanggal", date)
          .eq("status", "Hadir");

        const attendanceCount = dayAttendance?.length || 0;
        const totalStudents = studentsData.length;
        const attendanceRate =
          totalStudents > 0
            ? Math.round((attendanceCount / totalStudents) * 100)
            : 0;

        return {
          day: day,
          attendance: attendanceRate,
          date: date,
        };
      });

      const weeklyTrend = await Promise.all(weeklyTrendPromises);

      // Calculate overall attendance rate
      const todayPresentCount = todayAttendanceData.filter(
        (r) => r.status.toLowerCase() === "hadir"
      ).length;
      const totalStudentsCount = studentsData.length;
      const attendanceRate =
        totalStudentsCount > 0
          ? Math.round((todayPresentCount / totalStudentsCount) * 100)
          : 0;

      // Update state
      setDashboardData({
        totalStudents: totalStudentsCount,
        totalTeachers: 0,
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate,
        classAttendance: Object.values(classAttendanceMap),
        weeklyTrend: weeklyTrend,
        totalClasses: allClasses.length,
      });
    } catch (error) {
      console.error("Error fetching guru mapel dashboard data:", error);
    }
  };

  // 🔥 FIX 3: Main fetch function yang lebih sederhana
  const fetchDashboardData = async () => {
    if (!isInitialized) return; // ✅ Jangan fetch jika belum initialized

    setRefreshing(true);
    try {
      if (userData.role === "admin") {
        await fetchAdminDashboardData();
      } else if (userData.role === "guru_kelas") {
        await fetchGuruKelasDashboardData();
      } else if (userData.role === "guru_mapel") {
        await fetchGuruMapelDashboardData();
      }
    } catch (error) {
      console.error("Error in fetchDashboardData:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // 🔥 FIX 4: Tunggu sampai device initialized baru fetch
    if (isInitialized) {
      fetchDashboardData();
    }

    // Auto refresh every 5 minutes (300000ms)
    const interval = setInterval(() => {
      if (isInitialized) {
        fetchDashboardData();
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [userData.role, userData.kelas, isInitialized]); // 🔥 FIX 5: Tambah isInitialized

  // Responsive Stats Card Component
  const StatsCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "blue",
    isLoading = false,
  }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-emerald-500 to-emerald-600",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
      red: "from-red-500 to-red-600",
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 relative overflow-hidden">
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]}`}></div>

        <div className="flex justify-between items-start mb-3">
          <div
            className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-2 rounded-lg`}>
            <Icon
              size={isMobile ? 20 : 24}
              className={`text-${color}-600 dark:text-${color}-400`}
            />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                trend > 0 ? "text-emerald-600" : "text-red-600"
              }`}>
              <TrendingUp size={12} className={trend > 0 ? "" : "rotate-180"} />
              <span>
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            </div>
          )}
        </div>

        <div>
          <h3
            className={`${
              isMobile ? "text-2xl" : "text-3xl"
            } font-bold text-gray-900 dark:text-white mb-1`}>
            {isLoading ? (
              <div className="bg-gray-200 dark:bg-gray-600 animate-pulse h-6 w-12 rounded"></div>
            ) : (
              value
            )}
          </h3>
          <p
            className={`${
              isMobile ? "text-sm" : "text-lg"
            } font-semibold text-gray-700 dark:text-gray-300 mb-1`}>
            {title}
          </p>
          {subtitle && (
            <p
              className={`${
                isMobile ? "text-xs" : "text-sm"
              } text-gray-500 dark:text-gray-400 font-medium`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Mobile Class Summary Card (REVISI DARK MODE DI SINI)
  const MobileClassCard = ({ kelas, hadir, izin, sakit, alpa }) => {
    const total = hadir + izin + sakit + alpa;
    const attendanceRate = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return (
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
        <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
          {kelas}
        </h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* Hadir */}
          <div className="bg-green-50 dark:bg-green-800/50 rounded p-2">
            <span className="block font-bold text-green-700 dark:text-green-300 text-sm">
              {hadir}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              Hadir
            </span>
          </div>
          {/* Izin */}
          <div className="bg-yellow-50 dark:bg-yellow-800/50 rounded p-2">
            <span className="block font-bold text-yellow-700 dark:text-yellow-300 text-sm">
              {izin}
            </span>
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              Izin
            </span>
          </div>
          {/* Sakit */}
          <div className="bg-blue-50 dark:bg-blue-800/50 rounded p-2">
            <span className="block font-bold text-blue-700 dark:text-blue-300 text-sm">
              {sakit}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Sakit
            </span>
          </div>
          {/* Alpa */}
          <div className="bg-red-50 dark:bg-red-800/50 rounded p-2">
            <span className="block font-bold text-red-700 dark:text-red-300 text-sm">
              {alpa}
            </span>
            <span className="text-xs text-red-600 dark:text-red-400">Alpa</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Kehadiran
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {attendanceRate}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  // 🔥 FIX 6: Loading state dengan isInitialized check
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Memuat data dashboard...
          </p>
        </div>
      </div>
    );
  }

  // RECHARTS Theme Configuration
  // Tentukan warna teks untuk Axis berdasarkan Dark Mode
  const chartTickColor = isDark ? "#A0AEC0" : "#4A5568"; // Tailwind gray-400 atau gray-700

  // Render dashboard content based on user role
  const renderDashboardByRole = () => {
    if (userData.role === "admin") {
      return (
        <div className="space-y-6">
          {/* Header dengan Device Indicator */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
              <span>Tampilan {isMobile ? "Mobile" : "Desktop"}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-[44px] ${
                refreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}>
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Memperbarui..." : "Refresh Data"}
            </button>
          </div>

          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Siswa"
              value={dashboardData.totalStudents}
              subtitle="Siswa aktif"
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Total Guru"
              value={dashboardData.totalTeachers}
              subtitle="Guru aktif"
              icon={GraduationCap}
              color="green"
            />
            <StatsCard
              title="Kehadiran Hari Ini"
              value={dashboardData.todayAttendance}
              subtitle={`${dashboardData.attendanceRate}% dari total`}
              icon={UserCheck}
              color="purple"
            />
            <StatsCard
              title="Total Kelas"
              value={dashboardData.totalClasses}
              subtitle="Kelas aktif"
              icon={GraduationCap}
              color="orange"
            />
          </div>

          {/* Charts Section */}
          <div className="space-y-6">
            {/* Class Attendance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Kehadiran Per Kelas Hari Ini
                </h3>
                <button className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-[44px] w-full sm:w-auto justify-center">
                  <Download size={16} />
                  Export
                </button>
              </div>
              <div className={isMobile ? "h-64" : "h-80"}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.classAttendance}
                    margin={
                      isMobile
                        ? { top: 20, right: 10, left: 10, bottom: 20 }
                        : { top: 20, right: 30, left: 20, bottom: 20 }
                    }>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="kelas"
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartTickColor,
                      }} // Revisi Tick Color
                    />
                    <YAxis
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartTickColor,
                      }} // Revisi Tick Color
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#4B5563" : "#fff",
                        border: isDark ? "1px solid #6B7280" : "1px solid #ccc",
                        color: isDark ? "#fff" : "#000",
                      }}
                    />
                    <Bar
                      dataKey="hadir"
                      fill="#10b981"
                      name="Hadir"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="izin"
                      fill="#f59e0b"
                      name="Izin"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="sakit"
                      fill="#3b82f6"
                      name="Sakit"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="alpa"
                      fill="#ef4444"
                      name="Alpa"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Trend Kehadiran 7 Hari Terakhir
                </h3>
                <button className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-[44px] w-full sm:w-auto justify-center">
                  <Download size={16} />
                  Export
                </button>
              </div>
              <div className={isMobile ? "h-64" : "h-80"}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardData.weeklyTrend}
                    margin={
                      isMobile
                        ? { top: 20, right: 10, left: 10, bottom: 20 }
                        : { top: 20, right: 30, left: 20, bottom: 20 }
                    }>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="day"
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartTickColor,
                      }} // Revisi Tick Color
                    />
                    <YAxis
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartTickColor,
                      }} // Revisi Tick Color
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#4B5563" : "#fff",
                        border: isDark ? "1px solid #6B7280" : "1px solid #ccc",
                        color: isDark ? "#fff" : "#000",
                      }}
                      formatter={(value) => [`${value}%`, "Tingkat Kehadiran"]}
                      labelFormatter={(label) => `Hari: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#2563eb"
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{ r: isMobile ? 4 : 6 }}
                      activeDot={{ r: isMobile ? 6 : 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleNavigation("/attendance")}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 min-h-[60px]">
                <ClipboardList size={isMobile ? 18 : 20} />
                <span className="text-sm sm:text-base">Input Kehadiran</span>
              </button>
              <button
                onClick={() => handleNavigation("/grades")}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 min-h-[60px]">
                <BarChart3 size={isMobile ? 18 : 20} />
                <span className="text-sm sm:text-base">Input Nilai</span>
              </button>
              <button
                onClick={() => handleNavigation("/students")}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 min-h-[60px]">
                <Users size={isMobile ? 18 : 20} />
                <span className="text-sm sm:text-base">Lihat Data Siswa</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (userData.role === "guru_kelas") {
      const kelasData = dashboardData.classAttendance[0] || {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
      };

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
              <span>
                Tampilan {isMobile ? "Mobile" : "Desktop"} - Kelas{" "}
                {userData.kelas}
              </span>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-[44px] ${
                refreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}>
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Memperbarui..." : "Refresh Data"}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Charts Section */}
          <div className="space-y-6">
            {/* Pie Chart for Class Attendance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Status Kehadiran - Kelas {userData.kelas}
                </h3>
                <button className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-[44px] w-full sm:w-auto justify-center">
                  <Download size={16} />
                  Export
                </button>
              </div>
              <div className={isMobile ? "h-64" : "h-80"}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Hadir",
                          value: kelasData.hadir,
                          fill: "#10b981",
                        },
                        {
                          name: "Izin",
                          value: kelasData.izin,
                          fill: "#f59e0b",
                        },
                        {
                          name: "Sakit",
                          value: kelasData.sakit,
                          fill: "#3b82f6",
                        },
                        {
                          name: "Alpa",
                          value: kelasData.alpa,
                          fill: "#ef4444",
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 80 : 100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}>
                      {[
                        kelasData.hadir,
                        kelasData.izin,
                        kelasData.sakit,
                        kelasData.alpa,
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#4B5563" : "#fff",
                        border: isDark ? "1px solid #6B7280" : "1px solid #ccc",
                        color: isDark ? "#fff" : "#000",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6">
                Trend Kehadiran Kelas {userData.kelas}
              </h3>
              <div className={isMobile ? "h-64" : "h-80"}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardData.weeklyTrend}
                    margin={
                      isMobile
                        ? { top: 20, right: 10, left: 10, bottom: 20 }
                        : { top: 20, right: 30, left: 20, bottom: 20 }
                    }>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="day"
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartTickColor,
                      }} // Revisi Tick Color
                    />
                    <YAxis
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartTickColor,
                      }} // Revisi Tick Color
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#4B5563" : "#fff",
                        border: isDark ? "1px solid #6B7280" : "1px solid #ccc",
                        color: isDark ? "#fff" : "#000",
                      }}
                      formatter={(value) => [`${value}%`, "Tingkat Kehadiran"]}
                      labelFormatter={(label) => `Hari: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#2563eb"
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{ r: isMobile ? 4 : 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleNavigation("/attendance")}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 min-h-[60px]">
                <ClipboardList size={isMobile ? 18 : 20} />
                <span className="text-sm sm:text-base">Input Kehadiran</span>
              </button>
              <button
                onClick={() => handleNavigation("/grades")}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 min-h-[60px]">
                <BarChart3 size={isMobile ? 18 : 20} />
                <span className="text-sm sm:text-base">Input Nilai</span>
              </button>
              <button
                onClick={() => handleNavigation("/students")}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 min-h-[60px]">
                <Users size={isMobile ? 18 : 20} />
                <span className="text-sm sm:text-base">Data Siswa</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (userData.role === "guru_mapel") {
      const bestClass =
        dashboardData.classAttendance.length > 0
          ? dashboardData.classAttendance.reduce((best, current) => {
              const currentTotal =
                current.hadir + current.izin + current.sakit + current.alpa;
              const bestTotal = best.hadir + best.izin + best.sakit + best.alpa;
              const currentRate =
                currentTotal > 0 ? (current.hadir / currentTotal) * 100 : 0;
              const bestRate =
                bestTotal > 0 ? (best.hadir / bestTotal) * 100 : 0;
              return currentRate > bestRate ? current : best;
            })
          : null;

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
              <span>
                Tampilan {isMobile ? "Mobile" : "Desktop"} - Guru Mapel
              </span>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-[44px] ${
                refreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}>
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Memperbarui..." : "Refresh Data"}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              title="Rata-rata Hadir"
              value={`${dashboardData.attendanceRate}%`}
              subtitle="Hari ini"
              icon={BarChart3}
              color="purple"
            />
            <StatsCard
              title="Kelas Terbaik"
              value={bestClass ? bestClass.kelas.replace("Kelas ", "") : "N/A"}
              subtitle="Kehadiran tertinggi"
              icon={TrendingUp}
              color="orange"
            />
          </div>

          {/* Class Comparison Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Perbandingan Kehadiran Antar Kelas
              </h3>
              <button className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-[44px] w-full sm:w-auto justify-center">
                <Download size={16} />
                Export
              </button>
            </div>
            <div className={isMobile ? "h-96" : "h-80"}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboardData.classAttendance}
                  margin={
                    isMobile
                      ? { top: 20, right: 10, left: 10, bottom: 40 }
                      : { top: 20, right: 30, left: 20, bottom: 20 }
                  }
                  layout={isMobile ? "vertical" : "horizontal"}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  {isMobile ? (
                    <>
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: chartTickColor }}
                      />
                      <YAxis
                        type="category"
                        dataKey="kelas"
                        tick={{ fontSize: 10, fill: chartTickColor }}
                        width={80}
                      />
                    </>
                  ) : (
                    <>
                      <XAxis
                        dataKey="kelas"
                        angle={-45}
                        textAnchor="end"
                        tick={{ fontSize: 10, fill: chartTickColor }}
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 10, fill: chartTickColor }} />
                    </>
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#4B5563" : "#fff",
                      border: isDark ? "1px solid #6B7280" : "1px solid #ccc",
                      color: isDark ? "#fff" : "#000",
                    }}
                  />
                  <Bar
                    dataKey="hadir"
                    fill="#10b981"
                    name="Hadir"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="izin"
                    fill="#f59e0b"
                    name="Izin"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="sakit"
                    fill="#3b82f6"
                    name="Sakit"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="alpa"
                    fill="#ef4444"
                    name="Alpa"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class Summary (Menggunakan MobileClassCard yang sudah direvisi) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6">
              Ringkasan Per Kelas
            </h3>
            <div
              className={`grid ${
                isMobile
                  ? "grid-cols-1"
                  : "grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              } gap-4`}>
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

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleNavigation("/attendance")}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 min-h-[60px]">
                <ClipboardList size={isMobile ? 18 : 20} />
                <span className="text-sm sm:text-base">Input Kehadiran</span>
              </button>
              <button
                onClick={() => handleNavigation("/grades")}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 min-h-[60px]">
                <BarChart3 size={isMobile ? 18 : 20} />
                <span className="text-sm sm:text-base">Input Nilai</span>
              </button>
              <button
                onClick={() => handleNavigation("/students")}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 min-h-[60px]">
                <Users size={isMobile ? 18 : 20} />
                <span className="text-sm sm:text-base">Data Siswa</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Dashboard content for {userData.role}
        </p>
      </div>
    );
  };

  return <div className="space-y-6 p-4 sm:p-6">{renderDashboardByRole()}</div>;
};

export default Dashboard;
