// src/attendance-teacher/MyAttendanceStatus.js - FULL DARK MODE + RESPONSIVE
import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { supabase } from "../supabaseClient";

// Helper function untuk format metode check-in (No changes)
const formatCheckInMethod = (method) => {
  const methodMap = {
    qr_scan: "Scan QR",
    qr: "Scan QR",
    manual: "Manual",
    nfc: "NFC",
    admin_qr: "Admin QR",
    admin_manual: "Admin Manual",
  };
  return methodMap[method] || method;
};

const MyAttendanceStatus = ({ currentUser, refreshTrigger }) => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.id) {
      fetchMyAttendance();
    }
  }, [currentUser, refreshTrigger]);

  const fetchMyAttendance = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      const { data, error } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("teacher_id", currentUser.id)
        .eq("attendance_date", today)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      setTodayAttendance(data);
    } catch (error) {
      console.error("Error fetching my attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-pulse dark:bg-gray-800 dark:shadow-xl">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 mb-3 sm:mb-4 dark:bg-gray-700"></div>
        <div className="h-8 sm:h-10 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
      </div>
    );
  }

  // ✅ PERBAIKAN: getStatusConfig dengan tema MERAH-PUTIH untuk light mode
  const getStatusConfig = () => {
    if (!todayAttendance) {
      return {
        icon: Clock,
        color: "bg-gray-500",
        textColor: "text-gray-600 dark:text-gray-400",
        bgLight: "bg-gray-50 dark:bg-gray-900/40",
        borderColor: "border-l-red-200 dark:border-l-gray-700",
        bgHeader: "bg-white dark:bg-gray-800",
        title: "Belum Absen",
        message: "Anda belum melakukan presensi hari ini",
        detail: "Silakan scan QR Code atau input manual",
      };
    }

    const normalizedStatus = todayAttendance.status?.toLowerCase();

    const statusMap = {
      hadir: {
        icon: CheckCircle,
        color: "bg-red-600 dark:bg-green-500", // ✅ Merah untuk light mode
        textColor: "text-red-700 dark:text-green-400",
        bgLight: "bg-red-50 dark:bg-green-900/30",
        borderColor: "border-l-red-300 dark:border-l-green-700",
        bgHeader: "bg-white dark:bg-gray-800",
        title: "Hadir",
        message: "Anda sudah absen hari ini",
      },
      izin: {
        icon: AlertCircle,
        color: "bg-amber-500 dark:bg-yellow-500",
        textColor: "text-amber-700 dark:text-yellow-400",
        bgLight: "bg-amber-50 dark:bg-yellow-900/30",
        borderColor: "border-l-amber-300 dark:border-l-yellow-700",
        bgHeader: "bg-white dark:bg-gray-800",
        title: "Izin",
        message: "Status presensi: Izin",
      },
      sakit: {
        icon: AlertCircle,
        color: "bg-orange-500",
        textColor: "text-orange-700 dark:text-orange-400",
        bgLight: "bg-orange-50 dark:bg-orange-900/30",
        borderColor: "border-l-orange-300 dark:border-l-orange-700",
        bgHeader: "bg-white dark:bg-gray-800",
        title: "Sakit",
        message: "Status presensi: Sakit",
      },
      alpa: {
        icon: XCircle,
        color: "bg-red-700 dark:bg-red-500",
        textColor: "text-red-800 dark:text-red-400",
        bgLight: "bg-red-50 dark:bg-red-900/30",
        borderColor: "border-l-red-400 dark:border-l-red-700",
        bgHeader: "bg-white dark:bg-gray-800",
        title: "Alpha",
        message: "Status presensi: Alpha",
      },
      alpha: {
        icon: XCircle,
        color: "bg-red-700 dark:bg-red-500",
        textColor: "text-red-800 dark:text-red-400",
        bgLight: "bg-red-50 dark:bg-red-900/30",
        borderColor: "border-l-red-400 dark:border-l-red-700",
        bgHeader: "bg-white dark:bg-gray-800",
        title: "Alpha",
        message: "Status presensi: Alpha",
      },
    };

    return statusMap[normalizedStatus] || statusMap.hadir;
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatTime = (timeString) => {
    if (!timeString) return "-";

    try {
      if (
        typeof timeString === "string" &&
        timeString.match(/^\d{2}:\d{2}:\d{2}$/)
      ) {
        return timeString.substring(0, 5).replace(":", ".") + " WIB";
      }

      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        const time = date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return time.replace(":", ".") + " WIB";
      }

      return timeString;
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeString || "-";
    }
  };

  return (
    <div
      className={`
        rounded-xl shadow-lg overflow-hidden border
        ${config.borderColor}
        bg-white dark:bg-gray-800
        dark:shadow-xl
      `}>
      {/* Header dengan gradient merah untuk light mode */}
      <div className={`${config.bgHeader} p-4 sm:p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 dark:text-white">
              Status Presensi Anda
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {/* Icon Status - Mobile friendly sizing */}
          <div
            className={`
              ${config.bgLight} p-2 sm:p-3 rounded-lg 
              flex items-center justify-center
              min-w-[44px] min-h-[44px] sm:min-w-[56px] sm:min-h-[56px]
            `}>
            <Icon
              className={config.textColor}
              size={24}
              className="w-6 h-6 sm:w-7 sm:h-7"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className={`text-xl sm:text-2xl font-bold ${config.textColor}`}>
              {config.title}
            </p>
            <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">
              {config.message}
            </p>
          </div>

          {todayAttendance ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 dark:text-gray-300">
                  Jam Masuk
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white">
                  {formatTime(todayAttendance.clock_in)}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 dark:text-gray-300">
                  Metode
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white">
                  {formatCheckInMethod(todayAttendance.check_in_method) || "-"}
                </p>
              </div>
              {todayAttendance.notes && (
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 dark:text-gray-300">
                    Catatan
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 italic dark:text-gray-300 break-words">
                    {todayAttendance.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {config.detail}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer dengan subtle red gradient untuk light mode */}
      <div className="bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900 p-3 sm:p-4">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${config.color}`}></div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Status diperbarui secara real-time
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyAttendanceStatus;
