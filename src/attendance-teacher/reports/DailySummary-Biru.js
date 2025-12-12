// src/attendance-teacher/reports/DailySummary.js - DARK MODE COMPLETE
import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const DailySummary = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpa: 0,
    belumAbsen: 0,
    attendanceRate: 0,
  });
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailySummary();
  }, [refreshTrigger]);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      const { count: totalTeachers, error: teacherError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .in("role", ["guru_kelas", "guru_mapel"])
        .eq("is_active", true);

      if (teacherError) throw teacherError;

      const { data: attendances, error: attendanceError } = await supabase
        .from("teacher_attendance")
        .select("status")
        .eq("attendance_date", today);

      if (attendanceError) throw attendanceError;

      const hadir = attendances.filter((a) => a.status === "hadir").length;
      const izin = attendances.filter((a) => a.status === "izin").length;
      const sakit = attendances.filter((a) => a.status === "sakit").length;
      const alpa = attendances.filter((a) => a.status === "alpa").length;
      const belumAbsen = (totalTeachers || 0) - attendances.length;
      const attendanceRate =
        totalTeachers > 0 ? ((hadir / totalTeachers) * 100).toFixed(1) : 0;

      setStats({
        totalTeachers: totalTeachers || 0,
        hadir,
        izin,
        sakit,
        alpa,
        belumAbsen,
        attendanceRate,
      });

      const { data: attendanceListData, error: listError } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("attendance_date", today)
        .order("clock_in", { ascending: true });

      if (listError) {
        console.error("Error fetching attendance list:", listError);
      }

      const formattedList = (attendanceListData || []).map((att, index) => ({
        no: index + 1,
        name: att.full_name || "Unknown",
        time: att.clock_in ? formatTime(att.clock_in) : "-",
        status: att.status,
      }));

      setAttendanceList(formattedList);
    } catch (error) {
      console.error("Error fetching daily summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";

    try {
      if (
        typeof timeString === "string" &&
        timeString.match(/^\d{2}:\d{2}:\d{2}$/)
      ) {
        return timeString.substring(0, 5);
      }

      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return timeString;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "-";
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      hadir:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800",
      izin: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800",
      sakit:
        "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800",
      alpa: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
    };
    return (
      badges[status] ||
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-pulse dark:bg-gray-800 dark:shadow-xl">
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-3 sm:mb-4 dark:bg-gray-700"></div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Guru",
      value: stats.totalTeachers,
      icon: Users,
      gradient:
        "from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30",
      iconBg:
        "bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700",
      textColor: "text-blue-700 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      title: "Hadir",
      value: stats.hadir,
      icon: CheckCircle,
      gradient:
        "from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30",
      iconBg:
        "bg-gradient-to-br from-green-400 to-emerald-600 dark:from-green-500 dark:to-emerald-700",
      textColor: "text-green-700 dark:text-green-400",
      borderColor: "border-green-200 dark:border-green-800",
      subtitle: `${stats.attendanceRate}% kehadiran`,
    },
    {
      title: "Izin / Sakit",
      value: `${stats.izin} / ${stats.sakit}`,
      icon: AlertCircle,
      gradient:
        "from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30",
      iconBg:
        "bg-gradient-to-br from-yellow-400 to-amber-500 dark:from-yellow-500 dark:to-amber-600",
      textColor: "text-yellow-700 dark:text-yellow-400",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    {
      title: "Alpha / Belum Absen",
      value: `${stats.alpa} / ${stats.belumAbsen}`,
      icon: XCircle,
      gradient:
        "from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30",
      iconBg:
        "bg-gradient-to-br from-red-400 to-rose-600 dark:from-red-500 dark:to-rose-700",
      textColor: "text-red-700 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800",
    },
  ];

  return (
    <div className="space-y-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${card.gradient} rounded-xl shadow-lg border ${card.borderColor} p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 dark:shadow-xl`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 truncate dark:text-gray-400">
                    {card.title}
                  </p>
                  <h3
                    className={`text-2xl sm:text-3xl font-bold ${card.textColor} mb-1`}>
                    {card.value}
                  </h3>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 dark:text-gray-400">
                      <TrendingUp size={10} className="sm:w-3 sm:h-3" />
                      <span className="truncate">{card.subtitle}</span>
                    </p>
                  )}
                </div>
                <div
                  className={`${card.iconBg} p-2 sm:p-3 rounded-lg flex-shrink-0 shadow-md`}>
                  <Icon className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden dark:bg-gray-800 dark:shadow-xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4 dark:from-blue-800 dark:to-indigo-800">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users size={18} className="sm:w-5 sm:h-5" />
            Daftar Guru yang Sudah Presensi Hari Ini
          </h3>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 dark:text-blue-300">
            Total: {attendanceList.length} guru
          </p>
        </div>

        {attendanceList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    No.
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap dark:text-gray-300">
                    Nama Guru
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Clock size={14} />
                      Jam Presensi
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {attendanceList.map((item) => (
                  <tr
                    key={item.no}
                    className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700/50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      {item.no}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium dark:text-gray-100">
                      {item.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock
                          size={14}
                          className="text-gray-400 flex-shrink-0 dark:text-gray-500"
                        />
                        {item.time}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full border capitalize ${getStatusBadge(
                          item.status
                        )}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
            <Users
              size={40}
              className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4 dark:text-gray-600"
            />
            <p className="text-sm sm:text-base text-gray-500 font-medium dark:text-gray-400">
              Belum ada guru yang presensi hari ini
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 dark:text-gray-500">
              Data akan muncul setelah ada guru yang melakukan presensi
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailySummary;
