import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  RefreshCw,
  Smartphone,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

// Compact Stats Card Component
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

// Table: Guru Belum Input Absen
const GuruBelumInputTable = ({ guruData, isMobile }) => {
  if (guruData.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
        <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
            Monitoring Input Absensi
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Status input absensi hari ini
          </p>
        </div>
        <div className="text-center py-12">
          <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
          <p className="text-xl font-bold text-gray-900 mb-2">
            Semua guru sudah input absen! 🎉
          </p>
          <p className="text-sm text-gray-500">
            Kehadiran hari ini sudah tercatat lengkap
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
      <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              Guru Belum Input Absensi
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total: {guruData.length} guru
            </p>
          </div>
          <div className="bg-red-100 px-3 py-1.5 rounded-full">
            <span className="text-red-700 font-bold text-sm">
              {guruData.length}
            </span>
          </div>
        </div>
      </div>

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
                  Nama Guru
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                  Kelas
                </th>
                <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {guruData.map((guru, index) => (
                <tr
                  key={guru.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {guru.full_name
                          ? guru.full_name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {guru.full_name || "Nama tidak tersedia"}
                        </p>
                        <p className="text-xs text-gray-500">{guru.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        guru.role === "guru_kelas"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                      {guru.role === "guru_kelas" ? "Guru Kelas" : "Guru Mapel"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {guru.kelas
                      ? `Kelas ${guru.kelas}`
                      : guru.mata_pelajaran || "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-red-100 text-red-700 border-red-200">
                      <XCircle size={14} />
                      Belum Input
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Mobile Card Layout */
        <div className="space-y-3">
          {guruData.map((guru, index) => (
            <div
              key={guru.id}
              className="bg-gradient-to-r from-orange-50 to-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {guru.full_name
                    ? guru.full_name.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {guru.full_name || "Nama tidak tersedia"}
                      </h4>
                      <p className="text-xs text-gray-500">{guru.username}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      <XCircle size={12} />
                      Belum
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        guru.role === "guru_kelas"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                      {guru.role === "guru_kelas" ? "Guru Kelas" : "Guru Mapel"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {guru.kelas
                        ? `Kelas ${guru.kelas}`
                        : guru.mata_pelajaran || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Table: Siswa Bermasalah (Alpa > 3x bulan ini)
const SiswaBermasalahTable = ({ siswaData, isMobile }) => {
  if (siswaData.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
        <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
            Siswa Bermasalah
          </h3>
          <p className="text-sm text-gray-600 mt-1">Alpa {">"} 3x bulan ini</p>
        </div>
        <div className="text-center py-12">
          <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
          <p className="text-xl font-bold text-gray-900 mb-2">
            Tidak ada siswa bermasalah! 🎉
          </p>
          <p className="text-sm text-gray-500">Semua siswa kehadirannya baik</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
      <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              Siswa Bermasalah
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Alpa {">"} 3x bulan ini • Total: {siswaData.length} siswa
            </p>
          </div>
          <div className="bg-yellow-100 px-3 py-1.5 rounded-full">
            <span className="text-yellow-700 font-bold text-sm">
              {siswaData.length}
            </span>
          </div>
        </div>
      </div>

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
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                  Kelas
                </th>
                <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">
                  Total Alpa
                </th>
                <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">
                  Kehadiran
                </th>
              </tr>
            </thead>
            <tbody>
              {siswaData.map((siswa, index) => (
                <tr
                  key={siswa.nisn}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {siswa.nama_siswa
                          ? siswa.nama_siswa.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {siswa.nama_siswa || "Nama tidak tersedia"}
                        </p>
                        <p className="text-xs text-gray-500">
                          NISN: {siswa.nisn || "N/A"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      Kelas {siswa.kelas || "N/A"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-red-100 text-red-700 border-red-200">
                      {siswa.total_alpa}x Alpa
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        siswa.attendance_rate >= 80
                          ? "bg-green-100 text-green-700 border-green-200"
                          : siswa.attendance_rate >= 60
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }`}>
                      {siswa.attendance_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Mobile Card Layout */
        <div className="space-y-3">
          {siswaData.map((siswa, index) => (
            <div
              key={siswa.nisn}
              className="bg-gradient-to-r from-yellow-50 to-red-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {siswa.nama_siswa
                    ? siswa.nama_siswa.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {siswa.nama_siswa || "Nama tidak tersedia"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        NISN: {siswa.nisn || "N/A"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      {siswa.total_alpa}x
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      Kelas {siswa.kelas || "N/A"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        siswa.attendance_rate >= 80
                          ? "bg-green-100 text-green-700"
                          : siswa.attendance_rate >= 60
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                      {siswa.attendance_rate}% Hadir
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ userData }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [guruBelumInput, setGuruBelumInput] = useState([]);
  const [siswaBermasalah, setSiswaBermasalah] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    totalClasses: 0,
  });

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

  // Get first day of month
  const getFirstDayOfMonth = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  };

  // Navigation handler
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fetch Guru Belum Input Absen
  const fetchGuruBelumInput = async (today) => {
    try {
      const { data: allTeachers, error: teachersError } = await supabase
        .from("users")
        .select("id, username, full_name, role, kelas, mata_pelajaran")
        .in("role", ["guru_kelas", "guru_mapel"])
        .eq("is_active", true);

      if (teachersError) throw teachersError;

      const { data: todayAttendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("guru_input")
        .eq("tanggal", today);

      if (attendanceError) throw attendanceError;

      const teachersWhoInput = new Set(
        todayAttendance?.map((r) => r.guru_input).filter(Boolean) || []
      );
      const belumInput =
        allTeachers?.filter(
          (teacher) => !teachersWhoInput.has(teacher.username)
        ) || [];

      setGuruBelumInput(belumInput);
    } catch (error) {
      console.error("Error fetching guru belum input:", error);
      setGuruBelumInput([]);
    }
  };

  // Fetch Siswa Bermasalah (Alpa > 3x bulan ini)
  const fetchSiswaBermasalah = async (firstDayOfMonth, today) => {
    try {
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("nisn, nama_siswa, kelas")
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      const { data: monthAttendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("nisn, status, tanggal")
        .gte("tanggal", firstDayOfMonth)
        .lte("tanggal", today);

      if (attendanceError) throw attendanceError;

      const siswaStats = [];
      students?.forEach((student) => {
        const studentRecords =
          monthAttendance?.filter((r) => r.nisn === student.nisn) || [];
        const totalRecords = studentRecords.length;
        const alpaCount = studentRecords.filter(
          (r) => r.status.toLowerCase() === "alpa"
        ).length;
        const hadirCount = studentRecords.filter(
          (r) => r.status.toLowerCase() === "hadir"
        ).length;

        const attendanceRate =
          totalRecords > 0
            ? Math.round((hadirCount / totalRecords) * 100)
            : 100;

        if (alpaCount > 3) {
          siswaStats.push({
            nisn: student.nisn,
            nama_siswa: student.nama_siswa,
            kelas: student.kelas,
            total_alpa: alpaCount,
            attendance_rate: attendanceRate,
          });
        }
      });

      siswaStats.sort((a, b) => b.total_alpa - a.total_alpa);
      setSiswaBermasalah(siswaStats);
    } catch (error) {
      console.error("Error fetching siswa bermasalah:", error);
      setSiswaBermasalah([]);
    }
  };

  // Fetch Recent Activities (Simplified)
  const fetchRecentActivities = async (today) => {
    try {
      const { data: attendanceActivities, error } = await supabase
        .from("attendance")
        .select("kelas, guru_input, created_at, status")
        .eq("tanggal", today)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const activities = [];
      const grouped = {};

      attendanceActivities?.forEach((record) => {
        const key = `${record.kelas}-${record.guru_input}`;
        if (!grouped[key]) {
          grouped[key] = {
            kelas: record.kelas,
            guru: record.guru_input || "Unknown",
            created_at: record.created_at,
            count: 0,
          };
        }
        grouped[key].count++;
      });

      Object.values(grouped).forEach((group) => {
        activities.push({
          id: `${group.kelas}-${group.created_at}`,
          icon: "📊",
          message: `${group.guru} input ${group.count} siswa Kelas ${group.kelas}`,
          time: group.created_at,
        });
      });

      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      setRecentActivities([]);
    }
  };

  // Main fetch function
  const fetchAdminDashboardData = async () => {
    setRefreshing(true);
    try {
      const today = getTodayDate();
      const firstDayOfMonth = getFirstDayOfMonth();

      const [studentsRes, teachersRes, attendanceRes] = await Promise.all([
        supabase.from("students").select("nisn, kelas").eq("is_active", true),
        supabase
          .from("users")
          .select("id")
          .in("role", ["guru_kelas", "guru_mapel"])
          .eq("is_active", true),
        supabase.from("attendance").select("status").eq("tanggal", today),
      ]);

      const totalStudents = studentsRes.data?.length || 0;
      const totalTeachers = teachersRes.data?.length || 0;
      const todayPresentCount =
        attendanceRes.data?.filter((r) => r.status.toLowerCase() === "hadir")
          .length || 0;
      const attendanceRate =
        totalStudents > 0
          ? Math.round((todayPresentCount / totalStudents) * 100)
          : 0;
      const totalClasses = [
        ...new Set(studentsRes.data?.map((s) => s.kelas) || []),
      ].length;

      setDashboardData({
        totalStudents,
        totalTeachers,
        todayAttendance: todayPresentCount,
        attendanceRate,
        totalClasses,
      });

      await Promise.all([
        fetchGuruBelumInput(today),
        fetchSiswaBermasalah(firstDayOfMonth, today),
        fetchRecentActivities(today),
      ]);
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchAdminDashboardData();
    }

    const interval = setInterval(() => {
      if (userData) {
        fetchAdminDashboardData();
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [userData]);

  // EARLY RETURN - AFTER ALL HOOKS
  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Memuat data user...
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Memuat data dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3 sm:p-6 lg:p-8">
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
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
              refreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}>
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Memperbarui..." : "Refresh Data"}</span>
          </button>
        </div>

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
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
            title="Hadir Hari Ini"
            value={dashboardData.todayAttendance}
            subtitle={`${dashboardData.attendanceRate}% dari total`}
            icon={UserCheck}
            color="purple"
          />
          <StatsCard
            title="Total Kelas"
            value={dashboardData.totalClasses}
            subtitle="Kelas aktif"
            icon={BookOpen}
            color="orange"
          />
        </div>

        {/* Monitoring Tables - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Guru Belum Input */}
          <GuruBelumInputTable guruData={guruBelumInput} isMobile={isMobile} />

          {/* Siswa Bermasalah */}
          <SiswaBermasalahTable
            siswaData={siswaBermasalah}
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
              <span className="font-semibold text-center">
                Kelola Data Siswa
              </span>
            </button>
            <button
              onClick={() => handleNavigation("/teachers")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:text-white hover:border-green-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <GraduationCap
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">
                Kelola Data Guru
              </span>
            </button>
            <button
              onClick={() => handleNavigation("/settings")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-purple-600 hover:to-purple-700 hover:text-white hover:border-purple-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <Settings
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">Pengaturan</span>
            </button>
            <button
              onClick={() => handleNavigation("/system-health")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gradient-to-br hover:from-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <Activity
                size={isMobile ? 18 : 20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-center">System Health</span>
            </button>
          </div>
        </div>

        {/* Recent Activities - Simplified */}
        {recentActivities.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
              Aktivitas Terbaru
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm sm:text-base">
                      {activity.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-900 line-clamp-2 leading-relaxed">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      {new Date(activity.time).toLocaleString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile floating refresh button */}
        <div className="fixed bottom-20 right-4 sm:hidden z-40">
          <button
            onClick={fetchAdminDashboardData}
            disabled={refreshing}
            className={`w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center touch-manipulation ${
              refreshing ? "opacity-50" : "hover:bg-blue-700 active:scale-95"
            }`}>
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
