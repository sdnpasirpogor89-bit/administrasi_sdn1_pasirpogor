//[file name]: Dashboard.js - DARK MODE + RESPONSIVE + THEMA MERAH GELAP
import React, { useState, useEffect, useLayoutEffect } from "react";
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

// 🔥 Warna untuk chart yang konsisten dengan tema merah gelap
const CHART_COLORS = {
  hadir: { light: "#059669", dark: "#059669" }, // emerald-600
  izin: { light: "#d97706", dark: "#d97706" }, // amber-600
  sakit: { light: "#2563eb", dark: "#2563eb" }, // blue-600
  alpa: { light: "#dc2626", dark: "#dc2626" }, // red-600
  line: { light: "#dc2626", dark: "#ef4444" }, // red-600 -> red-500
  grid: { light: "#fecaca", dark: "#4b5563" }, // red-200 -> gray-600
  tooltip: {
    bgLight: "#ffffff",
    bgDark: "#374151", // gray-700
    borderLight: "#fca5a5", // red-300
    borderDark: "#6b7280", // gray-500
  },
};

// Helper hook untuk mendeteksi dark mode
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

// Hook device detection yang lebih sederhana
const useDeviceDetection = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useLayoutEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      setDevice({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    updateDevice();
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  return device;
};

const Dashboard = ({ userData }) => {
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
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();
  const navigate = useNavigate();

  // Function untuk responsive text sizing
  const getTextSize = (size = "base") => {
    const sizes = {
      xs: isMobile ? "xs" : "sm",
      sm: isMobile ? "sm" : "base",
      base: isMobile ? "base" : "lg",
      lg: isMobile ? "lg" : "xl",
      xl: isMobile ? "xl" : "2xl",
      "2xl": isMobile ? "2xl" : "3xl",
      "3xl": isMobile ? "3xl" : "4xl",
    };
    return sizes[size] || size;
  };

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
        day: date.toLocaleDateString("id-ID", { weekday: "short" }),
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

  const fetchDashboardData = async () => {
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
    fetchDashboardData();

    // Auto refresh every 5 minutes (300000ms)
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000);

    return () => clearInterval(interval);
  }, [userData.role, userData.kelas]);

  // 🔥 Stats Card Component dengan tema merah gelap
  const StatsCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "red",
    isLoading = false,
  }) => {
    const colorClasses = {
      red: {
        bg: "from-red-600 to-red-700",
        icon: "text-red-600 dark:text-red-400",
        border: "border-red-200 dark:border-red-900",
      },
      crimson: {
        bg: "from-[#dc143c] to-[#b01030]",
        icon: "text-[#dc143c] dark:text-red-300",
        border: "border-red-300 dark:border-red-900",
      },
      rose: {
        bg: "from-rose-600 to-rose-700",
        icon: "text-rose-600 dark:text-rose-400",
        border: "border-rose-200 dark:border-rose-900",
      },
      amber: {
        bg: "from-amber-500 to-amber-600",
        icon: "text-amber-600 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-900",
      },
      orange: {
        bg: "from-orange-500 to-orange-600",
        icon: "text-orange-600 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-900",
      },
    };

    const colorSet = colorClasses[color] || colorClasses.red;

    return (
      <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-5 shadow-sm border border-red-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 relative overflow-hidden h-full">
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorSet.bg}`}></div>

        <div className="flex justify-between items-start mb-3">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 p-2 sm:p-3 rounded-lg">
            <Icon
              size={isMobile ? 20 : isTablet ? 22 : 24}
              className={colorSet.icon}
            />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                trend > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
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
              isMobile ? "text-2xl" : isTablet ? "text-3xl" : "text-4xl"
            } font-bold text-red-950 dark:text-white mb-1`}>
            {isLoading ? (
              <div className="bg-red-200 dark:bg-gray-600 animate-pulse h-8 w-16 rounded"></div>
            ) : (
              value
            )}
          </h3>
          <p
            className={`${getTextSize(
              "base"
            )} font-semibold text-red-800 dark:text-gray-300 mb-1 truncate`}>
            {title}
          </p>
          {subtitle && (
            <p
              className={`${getTextSize(
                "sm"
              )} text-red-600 dark:text-gray-400 font-medium truncate`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Mobile Class Card dengan tema merah gelap
  const MobileClassCard = ({ kelas, hadir, izin, sakit, alpa }) => {
    const total = hadir + izin + sakit + alpa;
    const attendanceRate = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return (
      <div className="bg-red-950/5 dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-red-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
        <h4 className="font-bold text-red-950 dark:text-white mb-3 text-sm truncate">
          {kelas}
        </h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* Hadir */}
          <div className="bg-emerald-50 dark:bg-emerald-900/30 dark:border dark:border-emerald-800 rounded p-2">
            <span className="block font-bold text-emerald-700 dark:text-emerald-300 text-sm">
              {hadir}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Hadir
            </span>
          </div>
          {/* Izin */}
          <div className="bg-amber-50 dark:bg-amber-900/30 dark:border dark:border-amber-800 rounded p-2">
            <span className="block font-bold text-amber-700 dark:text-amber-300 text-sm">
              {izin}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Izin
            </span>
          </div>
          {/* Sakit */}
          <div className="bg-blue-50 dark:bg-blue-900/30 dark:border dark:border-blue-800 rounded p-2">
            <span className="block font-bold text-blue-700 dark:text-blue-300 text-sm">
              {sakit}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Sakit
            </span>
          </div>
          {/* Alpa */}
          <div className="bg-red-50 dark:bg-red-900/30 dark:border dark:border-red-800 rounded p-2">
            <span className="block font-bold text-red-700 dark:text-red-300 text-sm">
              {alpa}
            </span>
            <span className="text-xs text-red-600 dark:text-red-400">Alpa</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-red-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-600 dark:text-gray-300">
              Kehadiran
            </span>
            <span className="font-bold text-red-950 dark:text-white">
              {attendanceRate}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-red-400 mx-auto mb-4"></div>
          <p className="text-red-700 dark:text-gray-400 font-medium">
            Memuat data dashboard...
          </p>
        </div>
      </div>
    );
  }

  // 🔥 Chart configuration yang konsisten dengan tema merah gelap
  const getChartStyles = () => {
    return {
      cartesianGrid: {
        stroke: isDark ? CHART_COLORS.grid.dark : CHART_COLORS.grid.light,
        strokeOpacity: 0.3,
      },
      tooltip: {
        backgroundColor: isDark
          ? CHART_COLORS.tooltip.bgDark
          : CHART_COLORS.tooltip.bgLight,
        borderColor: isDark
          ? CHART_COLORS.tooltip.borderDark
          : CHART_COLORS.tooltip.borderLight,
        textColor: isDark ? "#f3f4f6" : "#111827",
      },
      text: {
        fill: isDark ? "#9ca3af" : "#7f1d1d", // gray-400 / red-900
      },
    };
  };

  const chartStyles = getChartStyles();

  // Render dashboard content based on user role
  const renderDashboardByRole = () => {
    if (userData.role === "admin") {
      return (
        <div className="space-y-4 sm:space-y-6">
          {/* Header dengan Device Indicator */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-gray-400">
              {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
              <span>
                Tampilan {isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop"}
              </span>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className={`flex items-center justify-center gap-2 px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors duration-200 min-h-[44px] w-full sm:w-auto ${
                refreshing ? "opacity-70 cursor-not-allowed" : ""
              }`}
              aria-label="Refresh data dashboard">
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Memperbarui..." : "Refresh Data"}
            </button>
          </div>

          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard
              title="Total Siswa"
              value={dashboardData.totalStudents}
              subtitle="Siswa aktif"
              icon={Users}
              color="red"
            />
            <StatsCard
              title="Total Guru"
              value={dashboardData.totalTeachers}
              subtitle="Guru aktif"
              icon={GraduationCap}
              color="crimson"
            />
            <StatsCard
              title="Kehadiran Hari Ini"
              value={dashboardData.todayAttendance}
              subtitle={`${dashboardData.attendanceRate}% dari total`}
              icon={UserCheck}
              color="rose"
            />
            <StatsCard
              title="Total Kelas"
              value={dashboardData.totalClasses}
              subtitle="Kelas aktif"
              icon={GraduationCap}
              color="amber"
            />
          </div>

          {/* Charts Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* Class Attendance Chart */}
            <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-red-950 dark:text-white">
                  Kehadiran Per Kelas Hari Ini
                </h3>
                <button
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 dark:bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors duration-200 min-h-[44px] w-full sm:w-auto"
                  aria-label="Export data kehadiran">
                  <Download size={16} />
                  Export
                </button>
              </div>
              <div className={isMobile ? "h-72" : isTablet ? "h-80" : "h-96"}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.classAttendance}
                    margin={
                      isMobile
                        ? { top: 10, right: 5, left: 5, bottom: 40 }
                        : { top: 20, right: 30, left: 20, bottom: 20 }
                    }>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartStyles.cartesianGrid.stroke}
                      opacity={chartStyles.cartesianGrid.strokeOpacity}
                    />
                    <XAxis
                      dataKey="kelas"
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartStyles.text.fill,
                      }}
                      height={isMobile ? 60 : 40}
                    />
                    <YAxis
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartStyles.text.fill,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartStyles.tooltip.backgroundColor,
                        borderColor: chartStyles.tooltip.borderColor,
                        color: chartStyles.tooltip.textColor,
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                    />
                    <Bar
                      dataKey="hadir"
                      fill={
                        isDark
                          ? CHART_COLORS.hadir.dark
                          : CHART_COLORS.hadir.light
                      }
                      name="Hadir"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="izin"
                      fill={
                        isDark
                          ? CHART_COLORS.izin.dark
                          : CHART_COLORS.izin.light
                      }
                      name="Izin"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="sakit"
                      fill={
                        isDark
                          ? CHART_COLORS.sakit.dark
                          : CHART_COLORS.sakit.light
                      }
                      name="Sakit"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="alpa"
                      fill={
                        isDark
                          ? CHART_COLORS.alpa.dark
                          : CHART_COLORS.alpa.light
                      }
                      name="Alpa"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Trend Chart */}
            <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-red-950 dark:text-white">
                  Trend Kehadiran 7 Hari Terakhir
                </h3>
                <button
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 dark:bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors duration-200 min-h-[44px] w-full sm:w-auto"
                  aria-label="Export data trend">
                  <Download size={16} />
                  Export
                </button>
              </div>
              <div className={isMobile ? "h-72" : isTablet ? "h-80" : "h-96"}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardData.weeklyTrend}
                    margin={
                      isMobile
                        ? { top: 10, right: 5, left: 5, bottom: 20 }
                        : { top: 20, right: 30, left: 20, bottom: 20 }
                    }>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartStyles.cartesianGrid.stroke}
                      opacity={chartStyles.cartesianGrid.strokeOpacity}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartStyles.text.fill,
                      }}
                    />
                    <YAxis
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartStyles.text.fill,
                      }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartStyles.tooltip.backgroundColor,
                        borderColor: chartStyles.tooltip.borderColor,
                        color: chartStyles.tooltip.textColor,
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                      formatter={(value) => [`${value}%`, "Tingkat Kehadiran"]}
                      labelFormatter={(label) => `Hari: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke={
                        isDark
                          ? CHART_COLORS.line.dark
                          : CHART_COLORS.line.light
                      }
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
          <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-200 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-red-950 dark:text-white mb-4 sm:mb-6">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={() => handleNavigation("/attendance")}
                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 border border-red-200 dark:border-gray-600 rounded-xl text-red-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 min-h-[60px] w-full text-sm sm:text-base"
                aria-label="Input kehadiran siswa">
                <ClipboardList size={isMobile ? 18 : 20} />
                <span>Input Kehadiran</span>
              </button>
              <button
                onClick={() => handleNavigation("/grades")}
                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 border border-red-200 dark:border-gray-600 rounded-xl text-red-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 min-h-[60px] w-full text-sm sm:text-base"
                aria-label="Input nilai siswa">
                <BarChart3 size={isMobile ? 18 : 20} />
                <span>Input Nilai</span>
              </button>
              <button
                onClick={() => handleNavigation("/students")}
                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 border border-red-200 dark:border-gray-600 rounded-xl text-red-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 min-h-[60px] w-full text-sm sm:text-base"
                aria-label="Lihat data siswa">
                <Users size={isMobile ? 18 : 20} />
                <span>Lihat Data Siswa</span>
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
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-gray-400">
              {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
              <span>
                Tampilan {isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop"}{" "}
                - Kelas {userData.kelas}
              </span>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className={`flex items-center justify-center gap-2 px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors duration-200 min-h-[44px] w-full sm:w-auto ${
                refreshing ? "opacity-70 cursor-not-allowed" : ""
              }`}
              aria-label="Refresh data dashboard">
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Memperbarui..." : "Refresh Data"}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard
              title={`Siswa Kelas ${userData.kelas}`}
              value={dashboardData.totalStudents}
              subtitle="Siswa aktif"
              icon={Users}
              color="red"
            />
            <StatsCard
              title="Hadir Hari Ini"
              value={dashboardData.todayAttendance}
              subtitle={`Dari ${dashboardData.totalStudents} siswa`}
              icon={UserCheck}
              color="crimson"
            />
            <StatsCard
              title="Tingkat Kehadiran"
              value={`${dashboardData.attendanceRate}%`}
              subtitle="Hari ini"
              icon={BarChart3}
              color="rose"
            />
            <StatsCard
              title="Siswa Alpa"
              value={kelasData.alpa}
              subtitle="Perlu perhatian"
              icon={Calendar}
              color="amber"
            />
          </div>

          {/* Charts Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* Pie Chart for Class Attendance */}
            <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-red-950 dark:text-white">
                  Status Kehadiran - Kelas {userData.kelas}
                </h3>
                <button
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 dark:bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors duration-200 min-h-[44px] w-full sm:w-auto"
                  aria-label="Export data kehadiran">
                  <Download size={16} />
                  Export
                </button>
              </div>
              <div className={isMobile ? "h-72" : isTablet ? "h-80" : "h-96"}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Hadir",
                          value: kelasData.hadir,
                          fill: isDark
                            ? CHART_COLORS.hadir.dark
                            : CHART_COLORS.hadir.light,
                        },
                        {
                          name: "Izin",
                          value: kelasData.izin,
                          fill: isDark
                            ? CHART_COLORS.izin.dark
                            : CHART_COLORS.izin.light,
                        },
                        {
                          name: "Sakit",
                          value: kelasData.sakit,
                          fill: isDark
                            ? CHART_COLORS.sakit.dark
                            : CHART_COLORS.sakit.light,
                        },
                        {
                          name: "Alpa",
                          value: kelasData.alpa,
                          fill: isDark
                            ? CHART_COLORS.alpa.dark
                            : CHART_COLORS.alpa.light,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 80 : isTablet ? 90 : 100}
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
                        backgroundColor: chartStyles.tooltip.backgroundColor,
                        borderColor: chartStyles.tooltip.borderColor,
                        color: chartStyles.tooltip.textColor,
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-200 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-bold text-red-950 dark:text-white mb-4 sm:mb-6">
                Trend Kehadiran Kelas {userData.kelas}
              </h3>
              <div className={isMobile ? "h-72" : isTablet ? "h-80" : "h-96"}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardData.weeklyTrend}
                    margin={
                      isMobile
                        ? { top: 10, right: 5, left: 5, bottom: 20 }
                        : { top: 20, right: 30, left: 20, bottom: 20 }
                    }>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartStyles.cartesianGrid.stroke}
                      opacity={chartStyles.cartesianGrid.strokeOpacity}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartStyles.text.fill,
                      }}
                    />
                    <YAxis
                      tick={{
                        fontSize: isMobile ? 10 : 12,
                        fill: chartStyles.text.fill,
                      }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartStyles.tooltip.backgroundColor,
                        borderColor: chartStyles.tooltip.borderColor,
                        color: chartStyles.tooltip.textColor,
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                      formatter={(value) => [`${value}%`, "Tingkat Kehadiran"]}
                      labelFormatter={(label) => `Hari: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke={
                        isDark
                          ? CHART_COLORS.line.dark
                          : CHART_COLORS.line.light
                      }
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
          <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-200 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-red-950 dark:text-white mb-4 sm:mb-6">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={() => handleNavigation("/attendance")}
                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 border border-red-200 dark:border-gray-600 rounded-xl text-red-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 min-h-[60px] w-full text-sm sm:text-base"
                aria-label="Input kehadiran siswa">
                <ClipboardList size={isMobile ? 18 : 20} />
                <span>Input Kehadiran</span>
              </button>
              <button
                onClick={() => handleNavigation("/grades")}
                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 border border-red-200 dark:border-gray-600 rounded-xl text-red-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 min-h-[60px] w-full text-sm sm:text-base"
                aria-label="Input nilai siswa">
                <BarChart3 size={isMobile ? 18 : 20} />
                <span>Input Nilai</span>
              </button>
              <button
                onClick={() => handleNavigation("/students")}
                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 border border-red-200 dark:border-gray-600 rounded-xl text-red-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 min-h-[60px] w-full text-sm sm:text-base"
                aria-label="Lihat data siswa">
                <Users size={isMobile ? 18 : 20} />
                <span>Data Siswa</span>
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
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-gray-400">
              {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
              <span>
                Tampilan {isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop"}{" "}
                - Guru Mapel
              </span>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className={`flex items-center justify-center gap-2 px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors duration-200 min-h-[44px] w-full sm:w-auto ${
                refreshing ? "opacity-70 cursor-not-allowed" : ""
              }`}
              aria-label="Refresh data dashboard">
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Memperbarui..." : "Refresh Data"}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard
              title="Total Kelas"
              value={dashboardData.totalClasses}
              subtitle={`Kelas 1 - ${dashboardData.totalClasses}`}
              icon={GraduationCap}
              color="red"
            />
            <StatsCard
              title="Total Siswa"
              value={dashboardData.totalStudents}
              subtitle="Semua kelas"
              icon={Users}
              color="crimson"
            />
            <StatsCard
              title="Rata-rata Hadir"
              value={`${dashboardData.attendanceRate}%`}
              subtitle="Hari ini"
              icon={BarChart3}
              color="rose"
            />
            <StatsCard
              title="Kelas Terbaik"
              value={bestClass ? bestClass.kelas.replace("Kelas ", "") : "N/A"}
              subtitle="Kehadiran tertinggi"
              icon={TrendingUp}
              color="amber"
            />
          </div>

          {/* Class Comparison Chart */}
          <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
              <h3 className="text-lg sm:text-xl font-bold text-red-950 dark:text-white">
                Perbandingan Kehadiran Antar Kelas
              </h3>
              <button
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 dark:bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors duration-200 min-h-[44px] w-full sm:w-auto"
                aria-label="Export data perbandingan">
                <Download size={16} />
                Export
              </button>
            </div>
            <div
              className={isMobile ? "h-80" : isTablet ? "h-96" : "h-[500px]"}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboardData.classAttendance}
                  margin={
                    isMobile
                      ? { top: 10, right: 5, left: 5, bottom: 60 }
                      : { top: 20, right: 30, left: 20, bottom: 40 }
                  }
                  layout={isMobile ? "vertical" : "horizontal"}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartStyles.cartesianGrid.stroke}
                    opacity={chartStyles.cartesianGrid.strokeOpacity}
                  />
                  {isMobile ? (
                    <>
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 10,
                          fill: chartStyles.text.fill,
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="kelas"
                        tick={{
                          fontSize: 10,
                          fill: chartStyles.text.fill,
                        }}
                        width={70}
                      />
                    </>
                  ) : (
                    <>
                      <XAxis
                        dataKey="kelas"
                        angle={-45}
                        textAnchor="end"
                        tick={{
                          fontSize: 10,
                          fill: chartStyles.text.fill,
                        }}
                        height={60}
                      />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: chartStyles.text.fill,
                        }}
                      />
                    </>
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartStyles.tooltip.backgroundColor,
                      borderColor: chartStyles.tooltip.borderColor,
                      color: chartStyles.tooltip.textColor,
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                  />
                  <Bar
                    dataKey="hadir"
                    fill={
                      isDark
                        ? CHART_COLORS.hadir.dark
                        : CHART_COLORS.hadir.light
                    }
                    name="Hadir"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="izin"
                    fill={
                      isDark ? CHART_COLORS.izin.dark : CHART_COLORS.izin.light
                    }
                    name="Izin"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="sakit"
                    fill={
                      isDark
                        ? CHART_COLORS.sakit.dark
                        : CHART_COLORS.sakit.light
                    }
                    name="Sakit"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="alpa"
                    fill={
                      isDark ? CHART_COLORS.alpa.dark : CHART_COLORS.alpa.light
                    }
                    name="Alpa"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class Summary */}
          <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-200 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-red-950 dark:text-white mb-4 sm:mb-6">
              Ringkasan Per Kelas
            </h3>
            <div
              className={`grid ${
                isMobile
                  ? "grid-cols-1"
                  : isTablet
                  ? "grid-cols-2"
                  : "grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              } gap-3 sm:gap-4`}>
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
          <div className="bg-red-950/5 dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-200 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-red-950 dark:text-white mb-4 sm:mb-6">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={() => handleNavigation("/attendance")}
                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 border border-red-200 dark:border-gray-600 rounded-xl text-red-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 min-h-[60px] w-full text-sm sm:text-base"
                aria-label="Input kehadiran siswa">
                <ClipboardList size={isMobile ? 18 : 20} />
                <span>Input Kehadiran</span>
              </button>
              <button
                onClick={() => handleNavigation("/grades")}
                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 border border-red-200 dark:border-gray-600 rounded-xl text-red-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 min-h-[60px] w-full text-sm sm:text-base"
                aria-label="Input nilai siswa">
                <BarChart3 size={isMobile ? 18 : 20} />
                <span>Input Nilai</span>
              </button>
              <button
                onClick={() => handleNavigation("/students")}
                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 border border-red-200 dark:border-gray-600 rounded-xl text-red-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 min-h-[60px] w-full text-sm sm:text-base"
                aria-label="Lihat data siswa">
                <Users size={isMobile ? 18 : 20} />
                <span>Data Siswa</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-12 px-4">
        <p className="text-red-700 dark:text-gray-400">
          Dashboard content for {userData.role}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 bg-gradient-to-b from-red-50/50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {renderDashboardByRole()}
    </div>
  );
};

export default Dashboard;
