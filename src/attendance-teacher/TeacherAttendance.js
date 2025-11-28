// src/attendance-teacher/TeacherAttendance.js - SD PASIRPOGOR VERSION
import React, { useState, useEffect } from "react";
import { Clock, Bell, X } from "lucide-react";
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

      console.log(
        `🕐 Indonesia Time: ${currentHour}:${String(currentMinute).padStart(
          2,
          "0"
        )}`
      );
      console.log(`📅 Today: ${todayLocal}`);

      // ⏰ Reminder only shows between 07:00 - 14:00
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const reminderStartTime = 7 * 60; // 07:00
      const reminderEndTime = 14 * 60; // 14:00

      if (
        currentTimeInMinutes < reminderStartTime ||
        currentTimeInMinutes >= reminderEndTime
      ) {
        console.log(`⏰ Outside reminder window`);
        setShowReminder(false);
        return;
      }

      console.log(`🔔 Within reminder window`);

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

      console.log(`✅ Already attended? ${hasAttended}`);

      // Show reminder if not attended yet
      if (!hasAttended) {
        console.log("🔔 SHOWING REMINDER - Not attended yet!");
        setShowReminder(true);
      } else {
        console.log("✅ Already attended - No reminder");
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Sesi login tidak ditemukan</p>
          <p className="text-gray-600 mt-2">Silakan login kembali</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Reminder Pop-up */}
      {showReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-bounce-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-2xl p-6 relative">
              <button
                onClick={handleDismissReminder}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all">
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <Bell className="text-white" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    ⚠️ Reminder Presensi
                  </h3>
                  <p className="text-white text-sm opacity-90">
                    Jangan lupa presensi hari ini!
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-center text-lg font-medium mb-6">
                Anda Belum Melakukan Presensi Hari Ini. Silakan Lakukan Presensi
                Sekarang.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>📋 Info:</strong> Silakan lakukan presensi untuk
                  mencatat kehadiran Anda hari ini.
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>⏰ Batas Waktu:</strong> Input manual presensi
                  tersedia sampai jam 14:00. Pastikan Anda presensi sebelum
                  batas waktu!
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDismissReminder}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all border border-gray-300">
                  Nanti
                </button>
                <button
                  onClick={handleGoToAttendance}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg">
                  Presensi Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-3 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                <Clock className="text-blue-600" size={20} />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
                  Presensi Guru
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  SDN 1 Pasirpogor - Sistem Presensi Guru
                </p>
              </div>
            </div>

            {/* User Info - Responsive */}
            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {userData.full_name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">
                  {userData.full_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userData.role === "guru_kelas" && userData.kelas
                    ? `Guru Kelas ${userData.kelas}`
                    : userData.role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Badge - Fixed position */}
      {showReminder && (
        <div className="fixed top-20 right-4 z-40 animate-pulse">
          <button
            onClick={() => setShowReminder(true)}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
            <Bell size={16} />
            <span className="text-sm font-semibold">Belum Presensi!</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* View Tabs */}
        <div className="mb-4 sm:mb-6 flex gap-2">
          <button
            onClick={() => setActiveView("presensi")}
            className={`
              flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold 
              transition-all text-sm sm:text-base
              ${
                activeView === "presensi"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }
            `}>
            Presensi
          </button>
          <button
            onClick={() => setActiveView("history")}
            className={`
              flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold 
              transition-all text-sm sm:text-base
              ${
                activeView === "history"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }
            `}>
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
            />

            {/* 2️⃣ Attendance Tabs (QR Scanner / Manual Input) */}
            <div id="attendance-tabs">
              <AttendanceTabs
                currentUser={userData}
                onSuccess={handleAttendanceSuccess}
              />
            </div>
          </div>
        ) : (
          /* Monthly History */
          <MyMonthlyHistory currentUser={userData} />
        )}
      </div>

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
      `}</style>
    </div>
  );
};

export default TeacherAttendance;
