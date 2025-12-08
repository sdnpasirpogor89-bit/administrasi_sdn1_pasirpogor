// src/attendance-teacher/AdminAttendanceView.js - SD PASIRPOGOR VERSION
// FULL DARK MODE + RESPONSIVE SUPPORT
import React, { useState } from "react";
import { Users, FileText, RefreshCw, Settings, Moon, Sun } from "lucide-react";
import DailySummary from "./reports/DailySummary";
import MonthlyView from "./reports/MonthlyView";
import AttendanceTabs from "./AttendanceTabs";

const AdminAttendanceView = ({ currentUser }) => {
  const [activeView, setActiveView] = useState("today");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAttendanceSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-gray-50"
      }`}>
      {/* Header */}
      <div
        className={`border-b shadow-sm sticky top-0 z-10 transition-colors duration-300 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
        <div className="px-3 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1
                className={`text-xl sm:text-2xl font-bold flex items-center gap-2 transition-colors ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}>
                <Users className="text-blue-600 flex-shrink-0" size={24} />
                <span className="truncate">Manajemen Presensi Guru</span>
              </h1>
              <p
                className={`text-xs sm:text-sm mt-1 transition-colors ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                SDN 1 Pasirpogor - Monitoring dan laporan presensi seluruh guru
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title={darkMode ? "Light Mode" : "Dark Mode"}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* User Info */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 sm:flex-initial transition-colors ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {currentUser.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold truncate transition-colors ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}>
                    {currentUser.full_name}
                  </p>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium inline-block">
                    Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* View Tabs */}
        <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView("today")}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
              activeView === "today"
                ? "bg-blue-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}>
            <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Hari Ini</span>
          </button>

          <button
            onClick={() => setActiveView("manage")}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
              activeView === "manage"
                ? "bg-blue-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}>
            <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Kelola</span>
          </button>

          <button
            onClick={() => setActiveView("monthly")}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
              activeView === "monthly"
                ? "bg-blue-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}>
            <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Laporan</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm border ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
            }`}
            title="Refresh Data">
            <RefreshCw size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Content */}
        <div>
          {activeView === "today" ? (
            <>
              {/* Daily Summary Stats */}
              <DailySummary
                currentUser={currentUser}
                refreshTrigger={refreshTrigger}
                darkMode={darkMode}
              />

              {/* Info Card */}
              <div
                className={`mt-4 sm:mt-6 rounded-lg p-4 border transition-colors ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-blue-50 border-blue-200"
                }`}>
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      darkMode ? "bg-gray-700" : "bg-blue-100"
                    }`}>
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold mb-1 transition-colors ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}>
                      Statistik Presensi Hari Ini
                    </h3>
                    <p
                      className={`text-sm transition-colors ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Data presensi seluruh guru pada hari ini. Untuk melihat
                      detail per guru, silakan pilih tab "Laporan".
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : activeView === "monthly" ? (
            /* Monthly Report */
            <MonthlyView
              currentUser={currentUser}
              refreshTrigger={refreshTrigger}
              darkMode={darkMode}
            />
          ) : (
            /* Manage Tab */
            <div className="space-y-4">
              {/* Info Banner */}
              <div
                className={`rounded-lg p-4 border transition-colors ${
                  darkMode
                    ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600"
                    : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
                }`}>
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      darkMode ? "bg-gray-700" : "bg-blue-100"
                    }`}>
                    <Settings className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold mb-1 transition-colors ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}>
                      Kelola Presensi Guru
                    </h3>
                    <p
                      className={`text-sm transition-colors ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Generate QR Code untuk presensi hari ini, atau input
                      presensi guru secara manual.
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance Tabs (Scan QR / Manual / Generate QR) */}
              <AttendanceTabs
                currentUser={currentUser}
                onSuccess={handleAttendanceSuccess}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendanceView;
