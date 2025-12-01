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

  const groupSchedule = (scheduleData) => {
    if (!scheduleData || scheduleData.length === 0) return [];

    const sorted = [...scheduleData].sort((a, b) => {
      const timeA = (a.start_time || a.jam_mulai || "00:00:00").toString();
      const timeB = (b.start_time || b.jam_mulai || "00:00:00").toString();
      return timeA.localeCompare(timeB);
    });

    const grouped = [];
    let sessionNumber = 1;

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const mapel = current.subject || current.mata_pelajaran || current.mapel;
      const kelas = current.class_id || current.class_name || current.kelas;
      const startTime = (
        current.start_time ||
        current.jam_mulai ||
        ""
      ).toString();
      const endTime = (
        current.end_time ||
        current.jam_selesai ||
        ""
      ).toString();

      let sessions = [current];
      let finalEndTime = endTime;
      let j = i + 1;

      while (j < sorted.length) {
        const next = sorted[j];
        const nextMapel = next.subject || next.mata_pelajaran || next.mapel;
        const nextKelas = next.class_id || next.class_name || next.kelas;
        const nextStart = (next.start_time || next.jam_mulai || "").toString();
        const nextEnd = (next.end_time || next.jam_selesai || "").toString();

        if (
          nextMapel === mapel &&
          nextKelas === kelas &&
          finalEndTime === nextStart
        ) {
          sessions.push(next);
          finalEndTime = nextEnd;
          j++;
        } else {
          break;
        }
      }

      const sessionCount = sessions.length;
      const endSession = sessionNumber + sessionCount - 1;

      grouped.push({
        mapel: mapel,
        kelas: kelas,
        jam_mulai: startTime,
        jam_selesai: finalEndTime,
        startSession: sessionNumber,
        endSession: endSession,
        sessionCount: sessionCount,
        sessions: sessions,
      });

      i = j - 1;
      sessionNumber = endSession + 1;
    }

    return grouped;
  };

  const todayDay = getDayName();
  const isWeekend = todayDay === "Sabtu" || todayDay === "Minggu";

  const groupedSchedule = groupSchedule(schedule);

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
        {groupedSchedule.map((group, index) => {
          const sessionLabel =
            group.sessionCount === 1
              ? `Jam ke-${group.startSession}`
              : `Jam ke-${group.startSession}-${group.endSession}`;

          return (
            <div
              key={`grouped-${index}-${group.mapel}-${group.startSession}`}
              className="flex items-center gap-3 sm:gap-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg hover:shadow-md transition-all duration-200">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                  {group.mapel}
                </h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <BookOpen size={10} />
                    Kelas {group.kelas}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    📚 {sessionLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <Clock size={10} />
                    {group.jam_mulai.substring(0, 5)} -{" "}
                    {group.jam_selesai.substring(0, 5)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Absent Students Table Component - FIXED VERSION
const AbsentStudentsTable = ({
  absentStudents,
  isMobile,
  isGuruMapel,
  allClasses,
  selectedKelas,
  onKelasChange,
  todayAttendance,
  totalAttendanceRecords,
  attendanceByClass = {},
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

      {totalAttendanceRecords === 0 ? (
        <div className="text-center py-12">
          <UserCheck size={64} className="mx-auto text-yellow-400 mb-4" />
          <p className="text-xl font-bold text-gray-900 mb-2">
            Anda Belum Melakukan Presensi Siswa Hari Ini! 📝
          </p>
          <p className="text-sm text-gray-500">
            Silakan input presensi siswa terlebih dahulu
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck size={64} className="mx-auto text-green-400 mb-4" />
          <p className="text-xl font-bold text-gray-900 mb-2">
            Semua Siswa Hadir Hari Ini! 🎉
          </p>
          <p className="text-sm text-gray-500">Kehadiran 100% - Luar biasa!</p>
        </div>
      ) : (
        <>
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

// Quick Actions Component untuk Mobile
const QuickActionsMobile = ({ isGuruKelas, isGuruMapel, handleNavigation }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Aksi Cepat</h2>

      {/* Baris 1 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => handleNavigation("/attendance")}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👨‍🎓</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Presensi Siswa
          </span>
        </button>

        <button
          onClick={() => handleNavigation("/teacher-attendance")}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👨‍🏫</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Presensi Guru
          </span>
        </button>

        <button
          onClick={() => handleNavigation("/grades")}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📊</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Nilai Siswa
          </span>
        </button>
      </div>

      {/* Baris 2 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => handleNavigation("/teachers")}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👥</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Data Guru
          </span>
        </button>

        <button
          onClick={() => handleNavigation("/classes")}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">🏫</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Data Kelas
          </span>
        </button>

        <button
          onClick={() => handleNavigation("/students")}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👤</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Data Siswa
          </span>
        </button>
      </div>

      {/* Baris 3 */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleNavigation("/catatan-siswa")}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📝</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Catatan Siswa
          </span>
        </button>

        <button
          onClick={() => handleNavigation("/schedule")}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📅</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Jadwal Saya
          </span>
        </button>

        <button
          onClick={() => handleNavigation("/reports")}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📄</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Laporan
          </span>
        </button>
      </div>
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
    totalAttendanceRecords: 0,
    attendanceRate: 0,
    totalClasses: 0,
    tidakHadir: 0,
    todaySchedule: [],
    absentStudents: [],
    allClasses: [],
    attendanceByClass: {},
  });

  const navigate = useNavigate();
  const isGuruKelas = userData.role === "guru_kelas";
  const isGuruMapel = userData.role === "guru_mapel";

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const getTodayDate = () => {
    // Get local date in YYYY-MM-DD format (Indonesia timezone)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

  // 🔧 Fetch today's schedule
  const fetchTodaySchedule = async () => {
    try {
      const todayDay = getTodayDayName();

      if (todayDay === "Sabtu" || todayDay === "Minggu") {
        return [];
      }

      const { data: scheduleData, error: scheduleError } = await supabase
        .from("class_schedules")
        .select(
          `
          *,
          class_id,
          day,
          start_time,
          end_time,
          subject,
          teacher_id
        `
        )
        .eq("day", todayDay)
        .order("start_time", { ascending: true });

      if (scheduleError) {
        console.error("❌ Schedule fetch error:", scheduleError);
        throw scheduleError;
      }

      let filteredSchedule = scheduleData || [];

      if (isGuruKelas && userData.kelas) {
        filteredSchedule = scheduleData.filter(
          (item) => item.class_id === userData.kelas
        );
      } else if (isGuruMapel && userData.id) {
        filteredSchedule = scheduleData.filter(
          (item) => item.teacher_id === userData.id
        );
      }

      const transformedSchedule = filteredSchedule.map((item) => ({
        kelas: item.class_id,
        class_name: item.class_id,
        mapel: item.subject,
        mata_pelajaran: item.subject,
        jam_mulai: item.start_time,
        start_time: item.start_time,
        jam_selesai: item.end_time,
        end_time: item.end_time,
        hari: item.day,
        teacher_id: item.teacher_id,
      }));

      return transformedSchedule;
    } catch (error) {
      console.error("❌ Error fetching today schedule:", error);
      return [];
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  // 🔥 FIXED: Fetch data untuk Guru Kelas
  const fetchGuruKelasDashboardData = async () => {
    try {
      const today = getTodayDate();
      const userKelas = userData.kelas;

      const todaySchedule = await fetchTodaySchedule();

      const { data: classStudents, error: studentsError } = await supabase
        .from("students")
        .select("nisn, nama_siswa, jenis_kelamin, kelas, is_active")
        .eq("kelas", userKelas)
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      if (!classStudents || classStudents.length === 0) {
        setDashboardData((prev) => ({
          ...prev,
          totalStudents: 0,
          todayAttendance: 0,
          totalAttendanceRecords: 0,
          attendanceRate: 0,
          totalClasses: 1,
          tidakHadir: 0,
          todaySchedule: todaySchedule,
          absentStudents: [],
          allClasses: [],
        }));
        return;
      }

      // ✅ FIX: FILTER BY GURU_INPUT!
      const { data: todayAttendanceData, error: todayError } = await supabase
        .from("attendance")
        .select("nisn, nama_siswa, kelas, status, tanggal, guru_input")
        .eq("tanggal", today)
        .eq("kelas", userKelas)
        .eq("guru_input", userData.username);

      if (todayError) throw todayError;

      const totalClassStudents = classStudents.length;
      const totalAttendanceRecords = todayAttendanceData?.length || 0;

      const hadirCount =
        todayAttendanceData?.filter(
          (record) => record.status.toLowerCase() === "hadir"
        ).length || 0;

      const absentStudents =
        todayAttendanceData?.filter(
          (record) => record.status.toLowerCase() !== "hadir"
        ) || [];

      const attendanceRate =
        totalClassStudents > 0
          ? Math.round((hadirCount / totalClassStudents) * 100)
          : 0;

      const transformedAbsentStudents = absentStudents.map((record) => ({
        nisn: record.nisn,
        nama_siswa: record.nama_siswa,
        kelas: String(record.kelas), // ✅ CONVERT KE STRING
        status: record.status,
      }));

      setDashboardData((prev) => ({
        ...prev,
        totalStudents: totalClassStudents,
        todayAttendance: hadirCount,
        totalAttendanceRecords: totalAttendanceRecords,
        attendanceRate: attendanceRate,
        totalClasses: 1,
        tidakHadir: absentStudents.length,
        todaySchedule: todaySchedule,
        absentStudents: transformedAbsentStudents,
        allClasses: [],
      }));
    } catch (error) {
      console.error("Error fetching guru kelas dashboard data:", error);
    }
  };

  const fetchGuruMapelDashboardData = async () => {
    try {
      const today = getTodayDate();
      const todaySchedule = await fetchTodaySchedule();

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("nisn, nama_siswa, jenis_kelamin, kelas, is_active")
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      const { data: todayAttendanceData, error: todayError } = await supabase
        .from("attendance")
        .select("nisn, nama_siswa, kelas, status, tanggal, guru_input")
        .eq("tanggal", today)
        .eq("guru_input", userData.username);

      if (todayError) throw todayError;

      const allClasses = [...new Set(studentsData.map((s) => s.kelas))].sort();

      const currentSelectedKelas =
        selectedKelas || (allClasses.length > 0 ? allClasses[0] : "");

      if (!selectedKelas && allClasses.length > 0) {
        setSelectedKelas(allClasses[0]);
      }

      const totalStudentsCount = studentsData.length;
      const totalAttendanceRecords = todayAttendanceData?.length || 0;

      const hadirCount =
        todayAttendanceData?.filter(
          (record) => record.status.toLowerCase() === "hadir"
        ).length || 0;

      const absentStudents =
        todayAttendanceData?.filter(
          (record) => record.status.toLowerCase() !== "hadir"
        ) || [];

      const attendanceRate =
        totalStudentsCount > 0
          ? Math.round((hadirCount / totalStudentsCount) * 100)
          : 0;

      const tidakHadirCount = absentStudents.length;

      const calculateBestClass = () => {
        if (!todayAttendanceData || todayAttendanceData.length === 0)
          return "Belum ada presensi";

        const classStats = {};

        allClasses.forEach((kelas) => {
          const kelasRecords = todayAttendanceData.filter(
            (record) => record.kelas === kelas
          );
          if (kelasRecords.length > 0) {
            const hadirCount = kelasRecords.filter(
              (r) => r.status.toLowerCase() === "hadir"
            ).length;
            const attendanceRate = Math.round(
              (hadirCount / kelasRecords.length) * 100
            );
            classStats[kelas] = attendanceRate;
          }
        });

        if (Object.keys(classStats).length === 0) {
          return "Tidak ada data";
        }

        return Object.keys(classStats).reduce((best, current) =>
          classStats[current] > classStats[best] ? current : best
        );
      };

      const bestClass = calculateBestClass();

      const transformedAbsentStudents = absentStudents.map((record) => ({
        nisn: record.nisn,
        nama_siswa: record.nama_siswa,
        kelas: String(record.kelas),
        status: record.status,
      }));

      const attendanceByClass = {};
      allClasses.forEach((kelas) => {
        const count =
          todayAttendanceData?.filter((r) => String(r.kelas) === kelas)
            .length || 0;
        attendanceByClass[kelas] = count;
      });

      setDashboardData((prev) => ({
        ...prev,
        totalStudents: totalStudentsCount,
        todayAttendance: hadirCount,
        totalAttendanceRecords: totalAttendanceRecords,
        attendanceRate: attendanceRate,
        totalClasses: allClasses.length,
        tidakHadir: tidakHadirCount,
        todaySchedule: todaySchedule,
        absentStudents: transformedAbsentStudents,
        allClasses: allClasses,
        bestClass: bestClass,
        attendanceByClass: attendanceByClass,
      }));
    } catch (error) {
      console.error("Error fetching guru mapel dashboard data:", error);
    }
  };

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

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000);

    return () => clearInterval(interval);
  }, [userData.role, userData.kelas]);

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

  const renderGuruKelasDashboard = () => {
    return (
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
        {/* 🎯 HEADER SELAMAT DATANG */}
        <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6 lg:p-8">
          <div>
            <div className="sm:whitespace-nowrap">
              <span className="text-xl font-semibold text-slate-800 block sm:inline-block">
                Selamat Datang,
              </span>{" "}
              <span className="text-lg sm:text-xl font-bold text-slate-900 block sm:inline-block mt-0 sm:mt-0 break-words">
                {userData?.full_name || userData?.username}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3">
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-100/80 text-blue-700 border border-blue-200/50">
                Guru Kelas {userData.kelas}
              </span>
            </div>
          </div>
        </div>

        {/* HEADER JUDUL DASHBOARD */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
            Dashboard Guru Kelas {userData.kelas}
          </h1>
          <div className="flex items-center gap-1 text-xs text-gray-500 sm:hidden">
            <Smartphone size={12} />
            <span>Mobile</span>
          </div>
        </div>

        {/* AKSI CEPAT MOBILE */}
        {isMobile && (
          <QuickActionsMobile
            isGuruKelas={isGuruKelas}
            isGuruMapel={isGuruMapel}
            handleNavigation={handleNavigation}
          />
        )}

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
            subtitle={`${dashboardData.totalAttendanceRecords} siswa sudah dipresensi`}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <AbsentStudentsTable
            absentStudents={dashboardData.absentStudents}
            isMobile={isMobile}
            isGuruMapel={true}
            allClasses={dashboardData.allClasses}
            selectedKelas={selectedKelas}
            onKelasChange={setSelectedKelas}
            todayAttendance={dashboardData.todayAttendance}
            totalAttendanceRecords={dashboardData.totalAttendanceRecords}
            attendanceByClass={dashboardData.attendanceByClass}
          />
          <TodayScheduleCard
            schedule={dashboardData.todaySchedule}
            isMobile={isMobile}
          />
        </div>

        {/* Aksi Cepat Desktop */}
        {!isMobile && (
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
                <span className="font-semibold text-center">
                  Presensi Siswa
                </span>
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
        )}

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

  const renderGuruMapelDashboard = () => {
    return (
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
        {/* 🎯 HEADER SELAMAT DATANG */}
        <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6 lg:p-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <h1 className="text-xl font-semibold text-slate-800">
                Selamat Datang,
              </h1>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 sm:mt-0 break-words">
                {userData?.full_name || userData?.username}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3">
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-100/80 text-blue-700 border border-blue-200/50">
                Guru Mapel
              </span>
            </div>
          </div>
        </div>

        {/* HEADER JUDUL DASHBOARD */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
            Dashboard Guru Mapel
          </h1>
          <div className="flex items-center gap-1 text-xs text-gray-500 sm:hidden">
            <Smartphone size={12} />
            <span>Mobile</span>
          </div>
        </div>

        {/* AKSI CEPAT MOBILE */}
        {isMobile && (
          <QuickActionsMobile
            isGuruKelas={isGuruKelas}
            isGuruMapel={isGuruMapel}
            handleNavigation={handleNavigation}
          />
        )}

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
            value={dashboardData.bestClass || "N/A"}
            subtitle="Kehadiran tertinggi"
            icon={TrendingUp}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <AbsentStudentsTable
            absentStudents={dashboardData.absentStudents}
            isMobile={isMobile}
            isGuruMapel={true}
            allClasses={dashboardData.allClasses}
            selectedKelas={selectedKelas}
            onKelasChange={setSelectedKelas}
            todayAttendance={dashboardData.todayAttendance} // ✅ FIX!
            totalAttendanceRecords={dashboardData.totalAttendanceRecords}
          />
          <TodayScheduleCard
            schedule={dashboardData.todaySchedule}
            isMobile={isMobile}
          />
        </div>

        {/* Aksi Cepat Desktop */}
        {!isMobile && (
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
                <span className="font-semibold text-center">
                  Presensi Siswa
                </span>
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
        )}

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
