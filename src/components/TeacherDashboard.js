import React, { useState, useEffect } from "react";
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
  Clock,
  BookOpen,
  UserX,
  FileText,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

// Enhanced Stats Card Component
const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  isLoading = false,
}) => {
  const colorClasses = {
    blue: "border-l-blue-500",
    green: "border-l-emerald-500",
    purple: "border-l-purple-500",
    orange: "border-l-orange-500",
    red: "border-l-red-500",
  };

  const iconColorClasses = {
    blue: "text-blue-500",
    green: "text-emerald-500",
    purple: "text-purple-500",
    orange: "text-orange-500",
    red: "text-red-500",
  };

  return (
    <div
      className={`bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-4 shadow-sm border-l-4 ${colorClasses[color]} hover:shadow-md transition-all duration-200 touch-manipulation`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1 leading-none">
            {isLoading ? (
              <div className="bg-gray-200 animate-pulse h-5 sm:h-8 w-8 sm:w-14 rounded"></div>
            ) : (
              <span className="block">{value}</span>
            )}
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight line-clamp-1">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <Icon
            size={18}
            className={`sm:size-5 lg:size-6 ${iconColorClasses[color]}`}
          />
        </div>
      </div>
    </div>
  );
};

// Today's Schedule Card Component
const TodayScheduleCard = ({ schedule, isMobile }) => {
  const getDayName = () => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    return days[new Date().getDay()];
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const todayDay = getDayName();
  const isWeekend = todayDay === "Sabtu" || todayDay === "Minggu";

  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
        <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              Jadwal Hari Ini
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>{getCurrentTime()}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {todayDay}, {new Date().toLocaleDateString("id-ID")}
          </p>
        </div>
        <div className="text-center py-8">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {isWeekend
              ? "Hari libur - Tidak ada jadwal"
              : "Tidak ada jadwal untuk hari ini"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {isWeekend ? "Selamat beristirahat!" : "Silakan cek hari lainnya"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
      <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
            Jadwal Hari Ini
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>{getCurrentTime()}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {todayDay}, {new Date().toLocaleDateString("id-ID")}
        </p>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {schedule.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg hover:shadow-md transition-all duration-200">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                {item.mapel}
              </h4>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <BookOpen size={10} />
                  {item.kelas}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <Clock size={10} />
                  {item.jam_mulai} - {item.jam_selesai}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// NEW: Absent Students Table Component
const AbsentStudentsTable = ({
  absentStudents,
  isMobile,
  isGuruMapel,
  allClasses,
  selectedKelas,
  onKelasChange,
}) => {
  const getStatusBadge = (status) => {
    const badges = {
      izin: {
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: "🟡",
        label: "Izin",
      },
      sakit: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: "🔵",
        label: "Sakit",
      },
      alpa: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: "🔴",
        label: "Alpa",
      },
    };
    const badge = badges[status.toLowerCase()] || badges.alpa;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${badge.color}`}>
        <span>{badge.icon}</span>
        <span>{badge.label}</span>
      </span>
    );
  };

  const filteredStudents =
    isGuruMapel && selectedKelas
      ? absentStudents.filter((s) => s.kelas === selectedKelas)
      : absentStudents;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
      <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              Siswa Tidak Hadir Hari Ini
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total: {filteredStudents.length} siswa
            </p>
          </div>

          {/* Dropdown Filter Kelas untuk Guru Mapel */}
          {isGuruMapel && allClasses.length > 0 && (
            <select
              value={selectedKelas}
              onChange={(e) => onKelasChange(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[44px] touch-manipulation">
              {allClasses.map((kelas) => (
                <option key={kelas} value={kelas}>
                  Kelas {kelas}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck size={64} className="mx-auto text-green-400 mb-4" />
          <p className="text-xl font-bold text-gray-900 mb-2">
            Semua siswa hadir hari ini! 🎉
          </p>
          <p className="text-sm text-gray-500">Kehadiran 100% - Luar biasa!</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          {!isMobile ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                      No
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                      Nama Siswa
                    </th>
                    {isGuruMapel && (
                      <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                        Kelas
                      </th>
                    )}
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">
                      Status Kehadiran
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student.nisn}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {student.nama_siswa
                              ? student.nama_siswa.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {student.nama_siswa || "Nama tidak tersedia"}
                            </p>
                            <p className="text-xs text-gray-500">
                              NISN: {student.nisn || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      {isGuruMapel && (
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Kelas {student.kelas}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(student.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Mobile Card Layout */
            <div className="space-y-3">
              {filteredStudents.map((student, index) => (
                <div
                  key={student.nisn}
                  className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {student.nama_siswa
                        ? student.nama_siswa.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {student.nama_siswa || "Nama tidak tersedia"}
                          </h4>
                          <p className="text-xs text-gray-500">
                            NISN: {student.nisn || "N/A"}
                          </p>
                        </div>
                        {getStatusBadge(student.status)}
                      </div>
                      {isGuruMapel && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Kelas {student.kelas || "N/A"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TeacherDashboard = ({ userData }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    totalClasses: 0,
    tidakHadir: 0,
    todaySchedule: [],
    absentStudents: [],
    allClasses: [],
  });

  const navigate = useNavigate();
  const isGuruKelas = userData.role === "guru_kelas";
  const isGuruMapel = userData.role === "guru_mapel";

  // Check device type
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Get today's date
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get day name
  const getTodayDayName = () => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    return days[new Date().getDay()];
  };

  // Fetch today's schedule
  const fetchTodaySchedule = async () => {
    try {
      const todayDay = getTodayDayName();

      if (todayDay === "Sabtu" || todayDay === "Minggu") {
        return [];
      }

      const { data: scheduleData, error: scheduleError } = await supabase
        .from("teacher_schedules")
        .select("*")
        .eq("hari", todayDay)
        .order("jam_mulai", { ascending: true });

      if (scheduleError) throw scheduleError;

      return scheduleData || [];
    } catch (error) {
      console.error("Error fetching today schedule:", error);
      return [];
    }
  };

  // Navigation handler
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fetch dashboard data for GURU KELAS
  const fetchGuruKelasDashboardData = async () => {
    try {
      const today = getTodayDate();
      const userKelas = userData.kelas;

      const todaySchedule = await fetchTodaySchedule();

      // 1. Students in this class
      const { data: classStudents, error: studentsError } = await supabase
        .from("students")
        .select("nisn, nama_siswa, jenis_kelamin, kelas, is_active")
        .eq("kelas", userKelas)
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      console.log("📊 Class Students:", classStudents); // DEBUG

      if (!classStudents || classStudents.length === 0) {
        setDashboardData((prev) => ({
          ...prev,
          totalStudents: 0,
          todayAttendance: 0,
          attendanceRate: 0,
          totalClasses: 1,
          tidakHadir: 0,
          todaySchedule: todaySchedule,
          absentStudents: [],
          allClasses: [],
        }));
        return;
      }

      // 2. Today's Attendance
      const { data: todayAttendanceData, error: todayError } = await supabase
        .from("attendance")
        .select("*")
        .eq("tanggal", today)
        .eq("kelas", userKelas);

      if (todayError) throw todayError;

      // 3. Calculate stats
      const todayPresentCount = todayAttendanceData.filter(
        (r) => r.status.toLowerCase() === "hadir"
      ).length;

      const totalClassStudents = classStudents.length;
      const attendanceRate =
        totalClassStudents > 0
          ? Math.round((todayPresentCount / totalClassStudents) * 100)
          : 0;

      // 4. Get absent students
      const absentStudents = [];
      const todayMarkedMap = new Map(
        todayAttendanceData.map((r) => [r.nisn, r.status])
      );

      classStudents.forEach((student) => {
        const status = todayMarkedMap.get(student.nisn);
        if (!status) {
          // Not marked = Alpa
          absentStudents.push({
            nisn: student.nisn,
            nama_siswa: student.nama_siswa,
            kelas: student.kelas,
            status: "Alpa",
          });
        } else if (status.toLowerCase() !== "hadir") {
          // Marked as Izin/Sakit/Alpa
          absentStudents.push({
            nisn: student.nisn,
            nama_siswa: student.nama_siswa,
            kelas: student.kelas,
            status: status,
          });
        }
      });

      const tidakHadirCount = absentStudents.length;

      // Update state
      setDashboardData((prev) => ({
        ...prev,
        totalStudents: totalClassStudents,
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate,
        totalClasses: 1,
        tidakHadir: tidakHadirCount,
        todaySchedule: todaySchedule,
        absentStudents: absentStudents,
        allClasses: [],
      }));
    } catch (error) {
      console.error("Error fetching guru kelas dashboard data:", error);
    }
  };

  // Fetch dashboard data for GURU MAPEL
  const fetchGuruMapelDashboardData = async () => {
    try {
      const today = getTodayDate();

      const todaySchedule = await fetchTodaySchedule();

      // 1. All Students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      // 2. Today's Attendance
      const { data: todayAttendanceData, error: todayError } = await supabase
        .from("attendance")
        .select("*")
        .eq("tanggal", today);

      if (todayError) throw todayError;

      // 3. Get all classes
      const allClasses = [...new Set(studentsData.map((s) => s.kelas))].sort();

      // Set default selected kelas
      if (!selectedKelas && allClasses.length > 0) {
        setSelectedKelas(allClasses[0]);
      }

      // 4. Calculate stats
      const todayPresentCount = todayAttendanceData.filter(
        (r) => r.status.toLowerCase() === "hadir"
      ).length;
      const totalStudentsCount = studentsData.length;
      const attendanceRate =
        totalStudentsCount > 0
          ? Math.round((todayPresentCount / totalStudentsCount) * 100)
          : 0;

      // 5. Get absent students
      const absentStudents = [];
      const todayMarkedMap = new Map(
        todayAttendanceData.map((r) => [r.nisn, r.status])
      );

      studentsData.forEach((student) => {
        const status = todayMarkedMap.get(student.nisn);
        if (!status) {
          absentStudents.push({
            nisn: student.nisn,
            nama_siswa: student.nama_siswa,
            kelas: student.kelas,
            status: "Alpa",
          });
        } else if (status.toLowerCase() !== "hadir") {
          absentStudents.push({
            nisn: student.nisn,
            nama_siswa: student.nama_siswa,
            kelas: student.kelas,
            status: status,
          });
        }
      });

      const tidakHadirCount = absentStudents.length;

      // Update state
      setDashboardData((prev) => ({
        ...prev,
        totalStudents: totalStudentsCount,
        todayAttendance: todayPresentCount,
        attendanceRate: attendanceRate,
        totalClasses: allClasses.length,
        tidakHadir: tidakHadirCount,
        todaySchedule: todaySchedule,
        absentStudents: absentStudents,
        allClasses: allClasses,
      }));
    } catch (error) {
      console.error("Error fetching guru mapel dashboard data:", error);
    }
  };

  // Main fetch function
  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      if (isGuruKelas) {
        await fetchGuruKelasDashboardData();
      } else if (isGuruMapel) {
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
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Memuat data dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Render Guru Kelas Dashboard
  const renderGuruKelasDashboard = () => {
    return (
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
        {/* Header with Refresh Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
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
              refreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}>
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Memperbarui..." : "Refresh Data"}</span>
          </button>
        </div>

        {/* Stats Cards */}
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
            icon={UserX}
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

        {/* Main Content Grid - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Absent Students Table */}
          <AbsentStudentsTable
            absentStudents={dashboardData.absentStudents}
            isMobile={isMobile}
            isGuruMapel={false}
            allClasses={[]}
            selectedKelas=""
            onKelasChange={() => {}}
          />

          {/* Today's Schedule */}
          <TodayScheduleCard
            schedule={dashboardData.todaySchedule}
            isMobile={isMobile}
          />
        </div>

        {/* Quick Actions - 4 Buttons */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
            Aksi Cepat
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <button
              onClick={() => handleNavigation("/students")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <Users
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">Data Siswa</span>
            </button>
            <button
              onClick={() => handleNavigation("/attendance")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <ClipboardList
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">Presensi Siswa</span>
            </button>
            <button
              onClick={() => handleNavigation("/grades")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <BarChart3
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">Nilai Siswa</span>
            </button>
            <button
              onClick={() => handleNavigation("/reports")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <FileText
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">Laporan</span>
            </button>
          </div>
        </div>

        {/* Mobile floating refresh button */}
        <div className="fixed bottom-20 right-4 sm:hidden z-40">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className={`w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center touch-manipulation ${
              refreshing ? "opacity-50" : "hover:bg-blue-700 active:scale-95"
            }`}>
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    );
  };

  // Render Guru Mapel Dashboard
  const renderGuruMapelDashboard = () => {
    const bestClass =
      dashboardData.allClasses.length > 0
        ? dashboardData.allClasses.reduce(
            (best, kelas) => {
              const kelasStudents = dashboardData.absentStudents.filter(
                (s) => s.kelas === kelas
              );
              return kelasStudents.length < best.count
                ? { kelas, count: kelasStudents.length }
                : best;
            },
            { kelas: dashboardData.allClasses[0], count: Infinity }
          )
        : null;

    return (
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
        {/* Header with Refresh Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
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
              refreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}>
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Memperbarui..." : "Refresh Data"}</span>
          </button>
        </div>

        {/* Stats Cards */}
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
            icon={UserX}
            color="red"
          />
          <StatsCard
            title="Kelas Terbaik"
            value={bestClass ? bestClass.kelas : "N/A"}
            subtitle="Kehadiran tertinggi"
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Main Content Grid - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Absent Students Table with Dropdown Filter */}
          <AbsentStudentsTable
            absentStudents={dashboardData.absentStudents}
            isMobile={isMobile}
            isGuruMapel={true}
            allClasses={dashboardData.allClasses}
            selectedKelas={selectedKelas}
            onKelasChange={setSelectedKelas}
          />

          {/* Today's Schedule */}
          <TodayScheduleCard
            schedule={dashboardData.todaySchedule}
            isMobile={isMobile}
          />
        </div>

        {/* Quick Actions - 4 Buttons */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
            Aksi Cepat
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <button
              onClick={() => handleNavigation("/students")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <Users
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">Data Siswa</span>
            </button>
            <button
              onClick={() => handleNavigation("/attendance")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <ClipboardList
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">Presensi Siswa</span>
            </button>
            <button
              onClick={() => handleNavigation("/grades")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <BarChart3
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">Nilai Siswa</span>
            </button>
            <button
              onClick={() => handleNavigation("/reports")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <FileText
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">Laporan</span>
            </button>
          </div>
        </div>

        {/* Mobile floating refresh button */}
        <div className="fixed bottom-20 right-4 sm:hidden z-40">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className={`w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center touch-manipulation ${
              refreshing ? "opacity-50" : "hover:bg-blue-700 active:scale-95"
            }`}>
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3 sm:p-6 lg:p-8">
      {isGuruKelas ? renderGuruKelasDashboard() : renderGuruMapelDashboard()}
    </div>
  );
};

export default TeacherDashboard;
