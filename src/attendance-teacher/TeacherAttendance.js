// src/attendance-teacher/TeacherAttendance.js - SD PASIRPOGOR VERSION (RESPONSIVE + DARK MODE + MERAH-PUTIH)
import React, { useState, useEffect } from "react";
import { Clock, Bell, X, Smartphone } from "lucide-react";
import { supabase } from "../supabaseClient";

// Teacher Components
import AttendanceTabs from "./AttendanceTabs";
import MyAttendanceStatus from "./MyAttendanceStatus";
import MyMonthlyHistory from "./MyMonthlyHistory";

// Admin Component
import AdminAttendanceView from "./AdminAttendanceView";

const TeacherAttendance = ({ userData }) => {
  const [activeView, setActiveView] = useState("presensi");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [darkMode, setDarkMode] = useState(false);

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      if (isMobile !== mobile) {
        setIsMobile(mobile);
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, [isMobile]);

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setDarkMode(isDark);
    };

    checkDarkMode();

    // Observer untuk perubahan dark mode
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // User data dan reminder check
  useEffect(() => {
    if (userData) {
      setLoading(false);
      // Check reminder only for teachers (not admin)
      if (userData.role !== "admin") {
        checkAttendanceReminder();
      }
    }
  }, [userData, refreshTrigger]);

  const checkAttendanceReminder = async () => {
    try {
      // Get Indonesia time (WIB/GMT+7)
      const nowIndonesia = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
      });
      const indonesiaDate = new Date(nowIndonesia);

      const currentHour = indonesiaDate.getHours();
      const currentMinute = indonesiaDate.getMinutes();

      // Get today's date
      const year = indonesiaDate.getFullYear();
      const month = String(indonesiaDate.getMonth() + 1).padStart(2, "0");
      const day = String(indonesiaDate.getDate()).padStart(2, "0");
      const todayLocal = `${year}-${month}-${day}`;

      // ⏰ Reminder only shows between 07:00 - 13:00
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const reminderStartTime = 7 * 60; // 07:00
      const reminderEndTime = 13 * 60; // 13:00

      if (
        currentTimeInMinutes < reminderStartTime ||
        currentTimeInMinutes >= reminderEndTime
      ) {
        setShowReminder(false);
        return;
      }

      // ✅ Check if already attended today using UUID
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("teacher_id", userData.id) // ✅ Pakai UUID dari users.id
        .eq("attendance_date", todayLocal);

      if (attendanceError) {
        console.error("❌ Error checking attendance:", attendanceError);
        setShowReminder(false);
        return;
      }

      const hasAttended = attendanceData && attendanceData.length > 0;

      // Show reminder if not attended yet
      if (!hasAttended) {
        setShowReminder(true);
      } else {
        setShowReminder(false);
      }
    } catch (error) {
      console.error("❌ Error checking reminder:", error);
      setShowReminder(false);
    }
  };

  const handleDismissReminder = () => {
    setShowReminder(false);
  };

  const handleGoToAttendance = () => {
    setShowReminder(false);
    setActiveView("presensi");
    // Scroll to attendance tabs
    setTimeout(() => {
      const element = document.getElementById("attendance-tabs");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleAttendanceSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setShowReminder(false); // Hide reminder after successful attendance
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-red-600 dark:border-red-500 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
            Memuat data presensi...
          </p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-gray-900">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <p className="text-red-600 dark:text-red-400 text-lg font-bold">
            Sesi login tidak ditemukan
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Silakan login kembali
          </p>
        </div>
      </div>
    );
  }

  // ✅ ROLE-BASED RENDERING
  const isAdmin = userData.role === "admin";

  // ========== ADMIN VIEW ==========
  if (isAdmin) {
    return <AdminAttendanceView currentUser={userData} />;
  }

  // ========== TEACHER VIEW ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Reminder Pop-up */}
      {showReminder && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full animate-bounce-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-t-xl sm:rounded-t-2xl p-4 sm:p-6 relative">
              <button
                onClick={handleDismissReminder}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white hover:bg-white/20 rounded-full p-1 transition-all"
                aria-label="Tutup pengingat">
                <X size={18} className="sm:size-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                  <Bell className="text-white" size={isMobile ? 24 : 32} />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-white">
                    ⚠️ Pengingat Presensi
                  </h3>
                  <p className="text-white text-xs sm:text-sm opacity-90">
                    Jangan lupa presensi hari ini!
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <p className="text-gray-700 dark:text-gray-300 text-center text-sm sm:text-lg font-medium mb-4 sm:mb-6">
                Anda Belum Melakukan Presensi Hari Ini. Silakan Lakukan Presensi
                Sekarang.
              </p>

              <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                <p className="text-red-800 dark:text-red-300 text-xs sm:text-sm">
                  <strong>📋 Info:</strong> Silakan lakukan presensi untuk
                  mencatat kehadiran Anda hari ini.
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 dark:border-amber-400 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                <p className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                  <strong>⏰ Batas Waktu:</strong> Input manual presensi
                  tersedia sampai jam 13:00. Pastikan Anda presensi sebelum
                  batas waktu!
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleDismissReminder}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all border border-gray-300 dark:border-gray-600 text-sm sm:text-base min-h-[44px]">
                  Nanti
                </button>
                <button
                  onClick={handleGoToAttendance}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 hover:from-red-700 hover:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700 text-white font-semibold rounded-lg transition-all shadow-lg text-sm sm:text-base min-h-[44px]">
                  Presensi Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - Mobile Optimized */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="px-3 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="bg-red-100 dark:bg-red-900/40 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Clock
                  className="text-red-600 dark:text-red-400"
                  size={isMobile ? 18 : 20}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white leading-tight truncate">
                  Presensi Guru
                </h1>
                <div className="flex items-center gap-1 sm:gap-2">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    SDN 1 Pasirpogor - Sistem Presensi Guru
                  </p>
                  {isMobile && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Smartphone size={10} />
                      <span>Mobile</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Info - Responsive */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-red-600 dark:bg-red-700 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {userData.full_name?.charAt(0) || "G"}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate max-w-[120px]">
                  {userData.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userData.role === "guru_kelas" && userData.kelas
                    ? `Guru Kelas ${userData.kelas}`
                    : userData.role?.replace("_", " ") || "Guru"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Badge - Fixed position */}
      {showReminder && (
        <div
          className={`fixed z-40 animate-pulse ${
            isMobile ? "top-16 right-3" : "top-20 right-4"
          }`}>
          <button
            onClick={() => setShowReminder(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1 sm:gap-2 hover:scale-105 transition-transform min-h-[32px] sm:min-h-[36px]"
            aria-label="Buka pengingat presensi">
            <Bell size={isMobile ? 14 : 16} />
            <span className="text-xs sm:text-sm font-semibold">
              Belum Presensi!
            </span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* View Tabs - Responsive */}
        <div className="mb-4 sm:mb-6 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveView("presensi")}
            className={`
              flex-1 sm:flex-none px-4 py-3 rounded-lg font-semibold 
              transition-all text-sm sm:text-base min-w-[120px] sm:min-w-[140px]
              touch-manipulation min-h-[44px]
              ${
                activeView === "presensi"
                  ? "bg-red-600 dark:bg-red-700 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }
            `}
            aria-label="Tab Presensi"
            aria-selected={activeView === "presensi"}>
            Presensi
          </button>
          <button
            onClick={() => setActiveView("history")}
            className={`
              flex-1 sm:flex-none px-4 py-3 rounded-lg font-semibold 
              transition-all text-sm sm:text-base min-w-[120px] sm:min-w-[140px]
              touch-manipulation min-h-[44px]
              ${
                activeView === "history"
                  ? "bg-red-600 dark:bg-red-700 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }
            `}
            aria-label="Tab Riwayat"
            aria-selected={activeView === "history"}>
            Riwayat Saya
          </button>
        </div>

        {/* Content */}
        {activeView === "presensi" ? (
          <div className="space-y-4 sm:space-y-6">
            {/* 1️⃣ Status Presensi Anda */}
            <MyAttendanceStatus
              currentUser={userData}
              refreshTrigger={refreshTrigger}
              isMobile={isMobile}
              darkMode={darkMode}
            />

            {/* 2️⃣ Attendance Tabs (QR Scanner / Manual Input) */}
            <div id="attendance-tabs">
              <AttendanceTabs
                currentUser={userData}
                onSuccess={handleAttendanceSuccess}
                isMobile={isMobile}
                darkMode={darkMode}
              />
            </div>
          </div>
        ) : (
          /* Monthly History */
          <MyMonthlyHistory
            currentUser={userData}
            isMobile={isMobile}
            darkMode={darkMode}
          />
        )}
      </div>

      {/* Mobile Device Indicator */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 z-30">
          <div className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Smartphone size={10} />
            <span>Mobile Mode</span>
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        
        /* Mobile scrollbar styling */
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            height: 4px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 2px;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 2px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherAttendance;
