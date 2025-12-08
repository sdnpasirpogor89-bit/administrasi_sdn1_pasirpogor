import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  Smartphone,
  Settings,
  FileText,
  ClipboardList,
  UserCog,
  StickyNote,
  BarChart3,
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
      className={`bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-2.5 sm:p-4 shadow-sm border-l-4 ${colorClasses[color]} hover:shadow-md transition-all duration-200 touch-manipulation`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-0.5 sm:mb-1 leading-none">
            {isLoading ? (
              <div className="bg-gray-200 dark:bg-slate-700 animate-pulse h-5 sm:h-8 w-8 sm:w-14 rounded"></div>
            ) : (
              <span className="block">{value}</span>
            )}
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300 leading-tight line-clamp-1">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-tight">
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

// Table: Guru Belum Input Presensi GURU
const GuruBelumInputTable = ({ guruData, isMobile }) => {
  const belumInputCount = guruData.filter((guru) => !guru.sudah_input).length;
  const sudahInputCount = guruData.filter((guru) => guru.sudah_input).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 dark:border-slate-700">
      <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100 leading-tight">
              Monitoring Presensi Guru
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Total: {guruData.length} guru ({belumInputCount} belum,{" "}
              {sudahInputCount} sudah)
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-full">
              <span className="text-red-700 dark:text-red-300 font-bold text-sm">
                {belumInputCount}
              </span>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
              <span className="text-green-700 dark:text-green-300 font-bold text-sm">
                {sudahInputCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      {!isMobile ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  No
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  Nama Guru
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  Kelas/Mapel
                </th>
                <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {guruData.map((guru, index) => (
                <tr
                  key={guru.id}
                  className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                    guru.sudah_input
                      ? "bg-green-50/30 dark:bg-green-900/10"
                      : ""
                  }`}>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          guru.sudah_input
                            ? "bg-gradient-to-br from-green-500 to-green-600"
                            : "bg-gradient-to-br from-orange-500 to-orange-600"
                        }`}>
                        {guru.full_name
                          ? guru.full_name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                          {guru.full_name || "Nama tidak tersedia"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {guru.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        guru.role === "guru_kelas"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      }`}>
                      {guru.role === "guru_kelas" ? "Guru Kelas" : "Guru Mapel"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">
                    {guru.kelas
                      ? `Kelas ${guru.kelas}`
                      : guru.mata_pelajaran || "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        guru.sudah_input
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                      }`}>
                      {guru.sudah_input ? "✅ Sudah Input" : "❌ Belum Input"}
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
              className={`border rounded-lg p-4 ${
                guru.sudah_input
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700"
                  : "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-red-200 dark:border-red-700"
              }`}>
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                    guru.sudah_input
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : "bg-gradient-to-br from-orange-500 to-orange-600"
                  }`}>
                  {guru.full_name
                    ? guru.full_name.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">
                        {guru.full_name || "Nama tidak tersedia"}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {guru.username}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                        guru.sudah_input
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                      }`}>
                      {guru.sudah_input ? "✅ Sudah" : "❌ Belum"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        guru.role === "guru_kelas"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      }`}>
                      {guru.role === "guru_kelas" ? "Guru Kelas" : "Guru Mapel"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full text-xs font-medium">
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

// Table: Monitoring Presensi SISWA
const MonitoringPresensiSiswaTable = ({ guruData, isMobile }) => {
  const belumInputCount = guruData.filter((guru) => !guru.sudah_input).length;
  const sudahInputCount = guruData.filter((guru) => guru.sudah_input).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 dark:border-slate-700">
      <div className="mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100 leading-tight">
              Monitoring Presensi Siswa
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Total: {guruData.length} guru ({belumInputCount} belum,{" "}
              {sudahInputCount} sudah)
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold text-sm">
                {belumInputCount}
              </span>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
              <span className="text-green-700 dark:text-green-300 font-bold text-sm">
                {sudahInputCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      {!isMobile ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  No
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  Nama Guru
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  Kelas/Mapel
                </th>
                <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {guruData.map((guru, index) => (
                <tr
                  key={guru.id}
                  className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                    guru.sudah_input
                      ? "bg-green-50/30 dark:bg-green-900/10"
                      : ""
                  }`}>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          guru.sudah_input
                            ? "bg-gradient-to-br from-green-500 to-green-600"
                            : "bg-gradient-to-br from-yellow-500 to-yellow-600"
                        }`}>
                        {guru.full_name
                          ? guru.full_name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                          {guru.full_name || "Nama tidak tersedia"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {guru.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        guru.role === "guru_kelas"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      }`}>
                      {guru.role === "guru_kelas" ? "Guru Kelas" : "Guru Mapel"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">
                    {guru.kelas
                      ? `Kelas ${guru.kelas}`
                      : guru.mata_pelajaran || "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        guru.sudah_input
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
                      }`}>
                      {guru.sudah_input ? "✅ Sudah Input" : "⚠️ Belum Input"}
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
              className={`border rounded-lg p-4 ${
                guru.sudah_input
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700"
                  : "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700"
              }`}>
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                    guru.sudah_input
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : "bg-gradient-to-br from-yellow-500 to-yellow-600"
                  }`}>
                  {guru.full_name
                    ? guru.full_name.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">
                        {guru.full_name || "Nama tidak tersedia"}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {guru.username}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                        guru.sudah_input
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
                      }`}>
                      {guru.sudah_input ? "✅ Sudah" : "⚠️ Belum"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        guru.role === "guru_kelas"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      }`}>
                      {guru.role === "guru_kelas" ? "Guru Kelas" : "Guru Mapel"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full text-xs font-medium">
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

const AdminDashboard = ({ userData }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guruBelumInputPresensiGuru, setGuruBelumInputPresensiGuru] = useState(
    []
  );
  const [guruBelumInputPresensiSiswa, setGuruBelumInputPresensiSiswa] =
    useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    totalClasses: 0,
  });

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const fetchGuruBelumInputPresensiGuru = async (today) => {
    try {
      const { data: allTeachers, error: teachersError } = await supabase
        .from("users")
        .select("id, username, full_name, role, kelas, mata_pelajaran")
        .in("role", ["guru_kelas", "guru_mapel"])
        .eq("is_active", true);

      if (teachersError) throw teachersError;

      const { data: todayTeacherAttendance, error: attendanceError } =
        await supabase
          .from("teacher_attendance")
          .select("teacher_id")
          .eq("attendance_date", today);

      if (attendanceError) throw attendanceError;

      const teachersWhoInput = new Set(
        todayTeacherAttendance?.map((r) => r.teacher_id) || []
      );

      const allTeachersWithStatus =
        allTeachers?.map((teacher) => ({
          ...teacher,
          sudah_input: teachersWhoInput.has(teacher.id),
        })) || [];

      const sortedTeachers = allTeachersWithStatus.sort((a, b) => {
        if (a.role === "guru_kelas" && b.role === "guru_kelas") {
          return parseInt(a.kelas) - parseInt(b.kelas);
        }
        if (a.role === "guru_kelas") return -1;
        if (b.role === "guru_kelas") return 1;
        return (a.mata_pelajaran || "").localeCompare(b.mata_pelajaran || "");
      });

      setGuruBelumInputPresensiGuru(sortedTeachers);
    } catch (error) {
      console.error("Error fetching guru belum input presensi guru:", error);
      setGuruBelumInputPresensiGuru([]);
    }
  };

  const fetchGuruBelumInputPresensiSiswa = async (today) => {
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

      const allTeachersWithStatus =
        allTeachers?.map((teacher) => ({
          ...teacher,
          sudah_input: teachersWhoInput.has(teacher.username),
        })) || [];

      const sortedTeachers = allTeachersWithStatus.sort((a, b) => {
        if (a.role === "guru_kelas" && b.role === "guru_kelas") {
          return parseInt(a.kelas) - parseInt(b.kelas);
        }
        if (a.role === "guru_kelas") return -1;
        if (b.role === "guru_kelas") return 1;
        return (a.mata_pelajaran || "").localeCompare(b.mata_pelajaran || "");
      });

      setGuruBelumInputPresensiSiswa(sortedTeachers);
    } catch (error) {
      console.error("Error fetching guru belum input presensi siswa:", error);
      setGuruBelumInputPresensiSiswa([]);
    }
  };

  const fetchAdminDashboardData = async () => {
    setLoading(true);
    try {
      const today = getTodayDate();

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
        fetchGuruBelumInputPresensiGuru(today),
        fetchGuruBelumInputPresensiSiswa(today),
      ]);
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
    } finally {
      setLoading(false);
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

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 font-medium">
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
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 font-medium">
            Memuat data dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 p-3 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 leading-tight">
              Dashboard Admin
            </h1>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 sm:hidden">
              <Smartphone size={12} />
              <span>Mobile</span>
            </div>
          </div>
        </div>

        {/* AKSI CEPAT */}
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 dark:border-slate-700">
          <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-3 sm:mb-6 leading-tight">
            Aksi Cepat
          </h3>

          {/* Baris 1: 4 tombol */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-4">
            <button
              onClick={() => handleNavigation("/teacher-attendance")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
                <span className="text-white text-lg">👨‍🏫</span>
              </div>
              <span className="font-semibold text-center">Presensi Guru</span>
            </button>

            <button
              onClick={() => handleNavigation("/attendance")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
                <span className="text-white text-lg">👨‍🎓</span>
              </div>
              <span className="font-semibold text-center">Presensi Siswa</span>
            </button>

            <button
              onClick={() => handleNavigation("/teachers")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
                <span className="text-white text-lg">👥</span>
              </div>
              <span className="font-semibold text-center">Data Guru</span>
            </button>

            <button
              onClick={() => handleNavigation("/students")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
                <span className="text-white text-lg">👤</span>
              </div>
              <span className="font-semibold text-center">Data Siswa</span>
            </button>
          </div>

          {/* Baris 2: 4 tombol */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <button
              onClick={() => handleNavigation("/grades")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
                <span className="text-white text-lg">📊</span>
              </div>
              <span className="font-semibold text-center">Nilai Siswa</span>
            </button>

            <button
              onClick={() => handleNavigation("/catatan-siswa")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
                <span className="text-white text-lg">📝</span>
              </div>
              <span className="font-semibold text-center">Catatan Siswa</span>
            </button>

            <button
              onClick={() => handleNavigation("/reports")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
                <span className="text-white text-lg">📄</span>
              </div>
              <span className="font-semibold text-center">Laporan</span>
            </button>

            <button
              onClick={() => handleNavigation("/settings")}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm min-h-[80px] touch-manipulation">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
                <span className="text-white text-lg">⚙️</span>
              </div>
              <span className="font-semibold text-center">Pengaturan</span>
            </button>
          </div>
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

        {/* Monitoring Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <GuruBelumInputTable
            guruData={guruBelumInputPresensiGuru}
            isMobile={isMobile}
          />

          <MonitoringPresensiSiswaTable
            guruData={guruBelumInputPresensiSiswa}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
