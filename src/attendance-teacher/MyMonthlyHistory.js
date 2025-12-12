// src/attendance-teacher/MyMonthlyHistory.js - FULL DARK MODE + RESPONSIVE + RED-WHITE THEME
import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  List,
  Grid3x3,
  Clock,
} from "lucide-react";
import { supabase } from "../supabaseClient";

// 🔥 HELPER: Format status untuk display UI (hadir -> Hadir) (No changes)
const formatStatusDisplay = (status) => {
  if (!status) return "-";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const MyMonthlyHistory = ({ currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // list | calendar

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  // ========================================
  // 🗓️ LIBUR NASIONAL 2025 (No changes)
  // ========================================
  const nationalHolidays2025 = {
    "2025-01-01": "Tahun Baru Masehi",
    "2025-01-25": "Tahun Baru Imlek 2576",
    "2025-03-02": "Isra Miraj Nabi Muhammad SAW",
    "2025-03-12": "Hari Raya Nyepi (Tahun Baru Saka 1947)",
    "2025-03-31": "Idul Fitri 1446 H",
    "2025-04-01": "Idul Fitri 1446 H",
    "2025-04-18": "Wafat Yesus Kristus (Jumat Agung)",
    "2025-05-01": "Hari Buruh Internasional",
    "2025-05-29": "Kenaikan Yesus Kristus",
    "2025-06-07": "Idul Adha 1446 H",
    "2025-06-28": "Tahun Baru Islam 1447 H",
    "2025-08-17": "Hari Kemerdekaan RI",
    "2025-09-05": "Maulid Nabi Muhammad SAW",
    "2025-12-25": "Hari Raya Natal",
  };

  // ========================================
  // 🔧 HELPER FUNCTIONS (No changes unless related to style output)
  // ========================================

  // Format metode check-in jadi lebih readable (No changes)
  const formatCheckInMethod = (method) => {
    const methodMap = {
      qr_scan: "Scan QR",
      qr: "Scan QR",
      manual: "Manual",
      nfc: "NFC",
      admin_qr: "Admin QR",
      admin_manual: "Admin Manual",
    };
    return methodMap[method] || method || "-";
  };

  // Helper: Check if date is national holiday (No changes)
  const isNationalHoliday = (dateStr) => {
    return nationalHolidays2025[dateStr] || null;
  };

  // Helper: Check if day is weekend (Saturday = 6, Sunday = 0) (No changes)
  const isWeekend = (year, month, day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchMyMonthlyData();
    }
  }, [selectedMonth, selectedYear, currentUser]);

  // Fetch data (No changes)
  const fetchMyMonthlyData = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
        2,
        "0"
      )}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
        2,
        "0"
      )}-${lastDay}`;

      const { data, error } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("teacher_id", currentUser.id)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate)
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      setAttendances(data || []);
    } catch (error) {
      console.error("Error fetching my monthly data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Utility functions (No changes)
  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(selectedYear, selectedMonth, 1).getDay();
  };

  const getAttendanceForDate = (day) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    return attendances.find((att) => att.attendance_date === dateStr);
  };

  // 🔥 FIXED: Case-insensitive comparison (No changes)
  const calculateStats = () => {
    return {
      hadir: attendances.filter((a) => a.status?.toLowerCase() === "hadir")
        .length,
      izin: attendances.filter((a) => a.status?.toLowerCase() === "izin")
        .length,
      sakit: attendances.filter((a) => a.status?.toLowerCase() === "sakit")
        .length,
      alpa: attendances.filter(
        (a) =>
          a.status?.toLowerCase() === "alpa" ||
          a.status?.toLowerCase() === "alpha"
      ).length,
      total: attendances.length,
    };
  };

  // 🎨 PERBAIKAN: getStatusColor untuk tema MERAH-PUTIH + Dark Mode
  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();

    const colors = {
      // Light Mode: Skema merah-putih untuk hadir
      // Dark Mode: Tetap konsisten dengan warna asli
      hadir:
        "bg-red-600 hover:bg-red-700 dark:bg-green-600 dark:hover:bg-green-700 text-white",
      izin: "bg-amber-500 hover:bg-amber-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white",
      sakit:
        "bg-orange-500 hover:bg-orange-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white",
      alpa: "bg-red-700 hover:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 text-white",
      alpha:
        "bg-red-700 hover:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 text-white",
    };

    return (
      colors[normalizedStatus] ||
      "bg-gray-200 hover:bg-gray-300 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
    );
  };

  // 🔥 FIXED: Lowercase switch cases (No changes)
  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();

    switch (normalizedStatus) {
      case "hadir":
        return <CheckCircle size={16} />;
      case "izin":
        return <AlertCircle size={16} />;
      case "sakit":
        return <AlertCircle size={16} />;
      case "alpa":
      case "alpha":
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  // Format Time (No changes)
  const formatTime = (timeString) => {
    if (!timeString) return "-";
    if (
      typeof timeString === "string" &&
      timeString.match(/^\d{2}:\d{2}:\d{2}$/)
    ) {
      return timeString.substring(0, 5);
    }
    return timeString;
  };

  // Format Date (No changes)
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Handle Month Changes (No changes)
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const stats = calculateStats();
  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const attendanceRate =
    daysInMonth > 0 ? ((stats.hadir / daysInMonth) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header & Stats - FULL DARK MODE + RED-WHITE THEME */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6 dark:bg-gray-800 dark:shadow-xl">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Calendar
            className="text-red-600 dark:text-red-400"
            size={20}
            className="w-5 h-5 sm:w-6 sm:h-6"
          />
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
            Riwayat Saya
          </h2>
        </div>

        {/* Stats Summary - RESPONSIVE GRID + THEME */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {/* Hadir - RED THEME FOR LIGHT MODE */}
          <div className="bg-red-50 hover:bg-red-100 rounded-lg p-2 sm:p-3 border border-red-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:border-green-800 transition-colors">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <CheckCircle
                className="text-red-600 dark:text-green-400"
                size={14}
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <p className="text-xs text-red-700 font-medium dark:text-green-300">
                Hadir
              </p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-green-400">
              {stats.hadir}
            </p>
          </div>

          {/* Izin - AMBER THEME FOR LIGHT MODE */}
          <div className="bg-amber-50 hover:bg-amber-100 rounded-lg p-2 sm:p-3 border border-amber-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:border-blue-800 transition-colors">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <AlertCircle
                className="text-amber-600 dark:text-blue-400"
                size={14}
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <p className="text-xs text-amber-700 font-medium dark:text-blue-300">
                Izin
              </p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-blue-400">
              {stats.izin}
            </p>
          </div>

          {/* Sakit - ORANGE THEME FOR LIGHT MODE */}
          <div className="bg-orange-50 hover:bg-orange-100 rounded-lg p-2 sm:p-3 border border-orange-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:border-yellow-800 transition-colors">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <AlertCircle
                className="text-orange-600 dark:text-yellow-400"
                size={14}
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <p className="text-xs text-orange-700 font-medium dark:text-yellow-300">
                Sakit
              </p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-yellow-400">
              {stats.sakit}
            </p>
          </div>

          {/* Alpha - RED THEME FOR LIGHT MODE */}
          <div className="bg-red-50 hover:bg-red-100 rounded-lg p-2 sm:p-3 border border-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:border-red-800 transition-colors">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <XCircle
                className="text-red-700 dark:text-red-400"
                size={14}
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <p className="text-xs text-red-800 font-medium dark:text-red-300">
                Alpha
              </p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-400">
              {stats.alpa}
            </p>
          </div>

          {/* Rate - RED THEME FOR LIGHT MODE */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-lg p-2 sm:p-3 border border-red-200 col-span-2 sm:col-span-1 dark:from-blue-900/40 dark:to-blue-900/60 dark:hover:from-blue-900/60 dark:hover:to-blue-900/80 dark:border-blue-800 transition-all">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <TrendingUp
                className="text-red-600 dark:text-blue-400"
                size={14}
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <p className="text-xs text-red-700 font-medium dark:text-blue-300">
                Rate
              </p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-blue-400">
              {attendanceRate}%
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher - MOBILE FRIENDLY */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("list")}
          className={`
            flex-1 sm:flex-none sm:px-4 sm:px-6 py-2.5 sm:py-2 
            rounded-lg font-semibold transition-all 
            flex items-center justify-center gap-2 text-sm
            min-h-[44px] sm:min-h-0
            ${
              viewMode === "list"
                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg dark:bg-red-500 dark:hover:bg-red-600"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }
          `}>
          <List size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">List</span>
          <span className="sm:hidden">List View</span>
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`
            flex-1 sm:flex-none sm:px-4 sm:px-6 py-2.5 sm:py-2 
            rounded-lg font-semibold transition-all 
            flex items-center justify-center gap-2 text-sm
            min-h-[44px] sm:min-h-0
            ${
              viewMode === "calendar"
                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg dark:bg-red-500 dark:hover:bg-red-600"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }
          `}>
          <Grid3x3 size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Calendar</span>
          <span className="sm:hidden">Calendar View</span>
        </button>
      </div>

      {/* Content - FULL DARK MODE + RED-WHITE GRADIENT */}
      <div className="bg-gradient-to-br from-red-50 via-white to-red-50 rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-red-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 dark:border-gray-700">
        {loading ? (
          // Loading State - RESPONSIVE
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-red-600 mx-auto dark:border-red-400"></div>
            <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base dark:text-gray-300">
              Memuat data...
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* List View - RESPONSIVE TABLE */
          <div className="space-y-2">
            {attendances.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                Belum ada data presensi bulan ini
              </div>
            ) : (
              attendances.map((att) => (
                <div
                  key={att.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-xl">
                  <div className="flex-1 mb-2 sm:mb-0">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base dark:text-white">
                      {formatDate(att.attendance_date)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Clock
                        size={14}
                        className="text-gray-500 dark:text-gray-400 w-3 h-3 sm:w-4 sm:h-4"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {formatTime(att.clock_in)}
                      </p>
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        •
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {formatCheckInMethod(att.check_in_method)}
                      </p>
                    </div>
                    {att.notes && (
                      <p className="text-xs text-gray-500 italic mt-1 dark:text-gray-400 break-words">
                        {att.notes}
                      </p>
                    )}
                  </div>
                  <div
                    className={`
                      px-3 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm
                      ${getStatusColor(att.status)}
                      min-w-[120px] justify-center sm:justify-start
                    `}>
                    {getStatusIcon(att.status)}
                    <span className="text-xs sm:text-sm">
                      {formatStatusDisplay(att.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Calendar View - RESPONSIVE CALENDAR */
          <>
            <div className="max-w-full sm:max-w-md mx-auto bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:shadow-xl">
              {/* Month & Year Selector - MOBILE FRIENDLY */}
              <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-red-50 rounded-lg transition-all dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <ChevronLeft
                    size={20}
                    className="text-gray-700 dark:text-gray-300"
                  />
                </button>
                <span className="px-3 sm:px-4 py-1 sm:py-2 font-bold text-gray-800 text-base sm:text-lg dark:text-white">
                  {months[selectedMonth]} {selectedYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-red-50 rounded-lg transition-all dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <ChevronRight
                    size={20}
                    className="text-gray-700 dark:text-gray-300"
                  />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Day Headers - RESPONSIVE TEXT */}
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                  (day, idx) => (
                    <div
                      key={idx}
                      className="text-center font-bold text-gray-700 text-xs py-1 sm:py-2 bg-gradient-to-b from-red-50 to-red-100 rounded border border-red-200 dark:from-blue-900/50 dark:to-blue-900 dark:border-blue-700 dark:text-blue-300">
                      {day}
                    </div>
                  )
                )}

                {/* Empty cells */}
                {Array.from({ length: firstDay }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square"></div>
                ))}

                {/* Date cells - RESPONSIVE + RED-WHITE THEME */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const attendance = getAttendanceForDate(day);
                  const dateStr = `${selectedYear}-${String(
                    selectedMonth + 1
                  ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                  const now = new Date();
                  const isToday =
                    day === now.getDate() &&
                    selectedMonth === now.getMonth() &&
                    selectedYear === now.getFullYear();

                  const weekend = isWeekend(selectedYear, selectedMonth, day);
                  const holiday = isNationalHoliday(dateStr);

                  // TEMA MERAH-PUTIH untuk light mode
                  let dayClasses =
                    "bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border border-gray-200 dark:from-gray-700 dark:to-gray-700/50 dark:hover:from-gray-600 dark:border-gray-700";
                  let textClasses = "text-gray-700 dark:text-gray-300";

                  if (attendance) {
                    dayClasses =
                      getStatusColor(attendance.status) + " shadow-md";
                    textClasses = "text-white";
                  } else if (isToday) {
                    dayClasses =
                      "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg border-2 border-red-300 dark:from-blue-700 dark:to-blue-600 dark:border-blue-500";
                    textClasses = "text-white";
                  } else if (holiday) {
                    dayClasses =
                      "bg-gradient-to-br from-red-100 to-pink-100 border-2 border-red-300 dark:from-red-900/50 dark:to-pink-900/50 dark:border-red-800";
                    textClasses = "text-red-700 dark:text-red-300";
                  } else if (weekend) {
                    dayClasses =
                      "bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 dark:from-gray-600 dark:to-gray-700 dark:border-gray-600";
                    textClasses = "text-gray-600 dark:text-gray-400";
                  }

                  // Pastikan teks putih untuk status (kecuali hari libur/weekend)
                  if (attendance || isToday) {
                    textClasses = "text-white";
                  }

                  return (
                    <div
                      key={day}
                      className={`
                        relative aspect-square rounded-lg flex items-center justify-center
                        transition-all cursor-pointer hover:scale-105 hover:shadow-lg
                        ${dayClasses}
                        text-xs sm:text-sm
                      `}
                      title={
                        attendance
                          ? `${formatStatusDisplay(
                              attendance.status
                            )} - ${formatTime(attendance.clock_in)}`
                          : holiday
                          ? `🎉 ${holiday}`
                          : weekend
                          ? "🏠 Weekend (Libur)"
                          : isToday
                          ? "Hari ini"
                          : ""
                      }>
                      <span className={`font-bold ${textClasses}`}>{day}</span>

                      {/* Status Dot - RESPONSIVE SIZE */}
                      {attendance && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full border border-current shadow-sm dark:bg-gray-900"></div>
                      )}

                      {/* Today Dot - RESPONSIVE POSITION */}
                      {isToday && !attendance && (
                        <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full dark:bg-gray-900"></div>
                      )}

                      {/* Holiday Icon - RESPONSIVE SIZE */}
                      {holiday && !attendance && (
                        <div className="absolute -top-1 -right-1 text-[10px] sm:text-xs">
                          🎉
                        </div>
                      )}

                      {/* Weekend Icon - RESPONSIVE SIZE */}
                      {weekend && !holiday && !attendance && (
                        <div className="absolute -top-1 -right-1 text-[10px] sm:text-xs dark:text-gray-300">
                          🏠
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend - RESPONSIVE LAYOUT */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-2 sm:space-y-3 dark:border-gray-700">
                {/* Status Legend - RED THEME FOR LIGHT MODE */}
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-gradient-to-br from-red-600 to-red-700 w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-md flex items-center justify-center dark:from-green-700 dark:to-green-600">
                      <CheckCircle
                        size={10}
                        className="w-2 h-2 sm:w-3 sm:h-3 text-white"
                      />
                    </div>
                    <span className="text-gray-700 text-xs font-medium dark:text-gray-300">
                      Hadir
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-md flex items-center justify-center dark:from-blue-700 dark:to-blue-600">
                      <AlertCircle
                        size={10}
                        className="w-2 h-2 sm:w-3 sm:h-3 text-white"
                      />
                    </div>
                    <span className="text-gray-700 text-xs font-medium dark:text-gray-300">
                      Izin
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-md flex items-center justify-center dark:from-yellow-700 dark:to-yellow-600">
                      <AlertCircle
                        size={10}
                        className="w-2 h-2 sm:w-3 sm:h-3 text-white"
                      />
                    </div>
                    <span className="text-gray-700 text-xs font-medium dark:text-gray-300">
                      Sakit
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-gradient-to-br from-red-700 to-red-800 w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-md flex items-center justify-center dark:from-red-700 dark:to-red-600">
                      <XCircle
                        size={10}
                        className="w-2 h-2 sm:w-3 sm:h-3 text-white"
                      />
                    </div>
                    <span className="text-gray-700 text-xs font-medium dark:text-gray-300">
                      Alpha
                    </span>
                  </div>
                </div>

                {/* Non-Working Days Legend */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-5 h-5 sm:w-6 sm:h-6 rounded border border-gray-300 flex items-center justify-center dark:from-gray-600 dark:to-gray-700 dark:border-gray-600">
                      <span className="text-[10px] sm:text-xs dark:text-gray-300">
                        🏠
                      </span>
                    </div>
                    <span className="text-gray-600 text-xs font-medium dark:text-gray-400">
                      Weekend
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="bg-gradient-to-br from-red-100 to-pink-100 w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-red-300 flex items-center justify-center dark:from-red-900/50 dark:to-pink-900/50 dark:border-red-800">
                      <span className="text-[10px] sm:text-xs">🎉</span>
                    </div>
                    <span className="text-gray-600 text-xs font-medium dark:text-gray-400">
                      Libur Nasional
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyMonthlyHistory;
