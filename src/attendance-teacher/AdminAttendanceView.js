// src/attendance-teacher/AdminAttendanceView.js - SD PASIRPOGOR VERSION
// FULL DARK MODE + RESPONSIVE SUPPORT + MERAH-PUTIH THEME
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
          : "bg-gradient-to-br from-red-50 via-white to-gray-50"
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
                className={`text-xl sm:text-2xl font-bold flex items-center gap-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                <Users
                  className={`flex-shrink-0 ${
                    darkMode ? "text-red-400" : "text-red-600"
                  }`}
                  size={24}
                />
                <span className="truncate">Manajemen Presensi Guru</span>
              </h1>
              <p
                className={`text-xs sm:text-sm mt-1 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                SDN 1 Pasirpogor - Monitoring dan laporan presensi seluruh guru
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2.5 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                title={darkMode ? "Light Mode" : "Dark Mode"}
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* User Info */}
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border min-h-[44px] ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                    darkMode ? "bg-red-500" : "bg-red-600"
                  }`}>
                  {currentUser.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold truncate ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}>
                    {currentUser.full_name}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium inline-block ${
                      darkMode
                        ? "bg-red-900/30 text-red-300"
                        : "bg-red-100 text-red-800"
                    }`}>
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
            className={`flex-1 sm:flex-auto min-w-[calc(33.333%-0.5rem)] sm:min-w-0 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] ${
              activeView === "today"
                ? darkMode
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-red-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}>
            <Users size={18} className="sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">Hari Ini</span>
          </button>

          <button
            onClick={() => setActiveView("manage")}
            className={`flex-1 sm:flex-auto min-w-[calc(33.333%-0.5rem)] sm:min-w-0 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] ${
              activeView === "manage"
                ? darkMode
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-red-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}>
            <Settings size={18} className="sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">Kelola</span>
          </button>

          <button
            onClick={() => setActiveView("monthly")}
            className={`flex-1 sm:flex-auto min-w-[calc(33.333%-0.5rem)] sm:min-w-0 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] ${
              activeView === "monthly"
                ? darkMode
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-red-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}>
            <FileText size={18} className="sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">Laporan</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm border min-h-[44px] flex-1 sm:flex-auto ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300"
                : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
            }`}
            title="Refresh Data"
            aria-label="Refresh data">
            <RefreshCw size={18} className="sm:w-5 sm:h-5" />
            <span className="sm:inline">Refresh</span>
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
                className={`mt-4 sm:mt-6 rounded-lg p-4 sm:p-5 border ${
                  darkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-red-50 border-red-200"
                }`}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      darkMode ? "bg-gray-700" : "bg-red-100"
                    }`}>
                    <Users
                      className={darkMode ? "text-red-400" : "text-red-600"}
                      size={20}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold mb-1 sm:mb-2 text-base sm:text-lg ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}>
                      Statistik Presensi Hari Ini
                    </h3>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-700"
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
            <div className="space-y-4 sm:space-y-6">
              {/* Info Banner */}
              <div
                className={`rounded-lg p-4 sm:p-5 border ${
                  darkMode
                    ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600"
                    : "bg-gradient-to-r from-red-50 to-white border-red-200"
                }`}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      darkMode ? "bg-gray-700" : "bg-red-100"
                    }`}>
                    <Settings
                      className={darkMode ? "text-red-400" : "text-red-600"}
                      size={20}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold mb-1 sm:mb-2 text-base sm:text-lg ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}>
                      Kelola Presensi Guru
                    </h3>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-700"
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
