// src/components/Attendance/AttendanceComponents.js
// REUSABLE COMPONENTS FOR ATTENDANCE SYSTEM

import React, { useState, useEffect } from "react";
import {
  Search,
  Check,
  Save,
  Calendar,
  FileText,
  Download,
  Users,
  UserCheck,
  Activity,
  AlertTriangle,
  X,
  Hospital,
  FileX,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  Moon,
  Sun,
} from "lucide-react";

// ============================================
// DARK MODE TOGGLE COMPONENT
// ============================================
export const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("darkMode") === "true" ||
        (!("darkMode" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="fixed bottom-4 right-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
      {darkMode ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
};

// ============================================
// TOAST COMPONENT - Enhanced for mobile + OFFLINE STATUS + DARK MODE
// ============================================
export const Toast = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const getIcon = () => {
    if (type === "error") return <AlertTriangle size={16} />;
    if (type === "offline") return <WifiOff size={16} />;
    return <Check size={16} />;
  };

  const getBgColor = () => {
    if (type === "error") return "bg-red-600 dark:bg-red-700";
    if (type === "offline") return "bg-orange-600 dark:bg-orange-700";
    return "bg-green-600 dark:bg-green-700";
  };

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 sm:max-w-md z-50 px-4 sm:px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${getBgColor()} text-white`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="font-medium text-sm sm:text-base flex-1">
          {message}
        </span>
        <button
          onClick={onClose}
          className="ml-2 opacity-70 hover:opacity-100 p-1">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// ============================================
// CONFIRMATION MODAL COMPONENT with Dark Mode
// ============================================
export const ConfirmationModal = ({
  show,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle
            className="text-orange-500 dark:text-orange-400 flex-shrink-0"
            size={20}
          />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-sm sm:text-base">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base">
            Tidak
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium text-sm sm:text-base">
            Ya, Timpa Data
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXPORT MODAL COMPONENT - MONTHLY with Dark Mode
// ============================================
export const ExportModal = ({ show, onClose, onExport, loading }) => {
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  const handleExport = () => {
    onExport(selectedMonth, selectedYear);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Download
            className="text-blue-500 dark:text-blue-400 flex-shrink-0"
            size={20}
          />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            Export Data Presensi Bulanan
          </h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bulan:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
              disabled={loading}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString("id-ID", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tahun:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
              disabled={loading}>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={2020 + i} value={2020 + i}>
                  {2020 + i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
            disabled={loading}>
            Batal
          </button>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={loading}>
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Download size={14} />
                Export Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXPORT SEMESTER MODAL COMPONENT - SEMESTER with Dark Mode
// ============================================
export const ExportSemesterModal = ({ show, onClose, onExport, loading }) => {
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  const handleExport = () => {
    onExport(selectedSemester, selectedYear);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Calendar
            className="text-purple-500 dark:text-purple-400 flex-shrink-0"
            size={20}
          />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            Export Rekap Semester
          </h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Semester:
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
              disabled={loading}>
              <option value={1}>Semester 1 (Ganjil - Juli-Desember)</option>
              <option value={2}>Semester 2 (Genap - Januari-Juni)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tahun:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
              disabled={loading}>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={2020 + i} value={2020 + i}>
                  {2020 + i}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>Info:</strong> Export semester akan menghasilkan rekap
              total kehadiran untuk periode{" "}
              {selectedSemester === 1 ? "Juli-Desember" : "Januari-Juni"}{" "}
              {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
            disabled={loading}>
            Batal
          </button>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={loading}>
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Download size={14} />
                Export Semester
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STATUS BUTTON COMPONENT with Dark Mode
// ============================================
export const StatusButton = React.memo(
  ({ status, active, onClick, icon: Icon, label, disabled = false }) => {
    const getStatusClass = () => {
      const baseClass =
        "flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-[40px] touch-manipulation";

      if (status === "Hadir") {
        return active
          ? `${baseClass} bg-green-600 dark:bg-green-700 text-white border-green-600 dark:border-green-700 shadow-sm`
          : `${baseClass} bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-800/50 active:bg-green-200 dark:active:bg-green-700/50`;
      } else if (status === "Sakit") {
        return active
          ? `${baseClass} bg-yellow-600 dark:bg-yellow-700 text-white border-yellow-600 dark:border-yellow-700 shadow-sm`
          : `${baseClass} bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-800/50 active:bg-yellow-200 dark:active:bg-yellow-700/50`;
      } else if (status === "Izin") {
        return active
          ? `${baseClass} bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700 shadow-sm`
          : `${baseClass} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800/50 active:bg-blue-200 dark:active:bg-blue-700/50`;
      } else if (status === "Alpa") {
        return active
          ? `${baseClass} bg-red-600 dark:bg-red-700 text-white border-red-600 dark:border-red-700 shadow-sm`
          : `${baseClass} bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-800/50 active:bg-red-200 dark:active:bg-red-700/50`;
      }
      return baseClass;
    };

    return (
      <button
        className={getStatusClass()}
        onClick={onClick}
        disabled={disabled}>
        <Icon size={14} className="flex-shrink-0" />
        <span className="text-xs sm:text-sm">{label}</span>
      </button>
    );
  }
);

// ============================================
// COMPACT STATS CARD COMPONENT with Dark Mode
// ============================================
export const StatsCard = React.memo(({ icon: Icon, number, label, color }) => {
  const getLeftBorderColor = () => {
    switch (color) {
      case "blue":
        return "border-l-blue-500 dark:border-l-blue-400";
      case "green":
        return "border-l-green-500 dark:border-l-green-400";
      case "purple":
        return "border-l-purple-500 dark:border-l-purple-400";
      case "orange":
        return "border-l-orange-500 dark:border-l-orange-400";
      default:
        return "border-l-gray-500 dark:border-l-gray-400";
    }
  };

  const getIconColor = () => {
    switch (color) {
      case "blue":
        return "text-blue-500 dark:text-blue-400";
      case "green":
        return "text-green-500 dark:text-green-400";
      case "purple":
        return "text-purple-500 dark:text-purple-400";
      case "orange":
        return "text-orange-500 dark:text-orange-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-l-4 ${getLeftBorderColor()} border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md hover:-translate-y-1 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl sm:text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">
            {number}
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </div>
        </div>
        <div className={`${getIconColor()}`}>
          <Icon size={20} className="sm:hidden" />
          <Icon size={24} className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
});

// ============================================
// MOBILE STUDENT CARD COMPONENT with Dark Mode
// ============================================
export const StudentCard = ({
  student,
  originalIndex,
  attendance,
  activeClass,
  updateStatus,
  updateNote,
  saving,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
            {student.nama_siswa}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            NISN: {student.nisn}
          </p>
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              student.jenis_kelamin === "Laki-laki"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
            }`}>
            {student.jenis_kelamin}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatusButton
          status="Hadir"
          active={attendance.status === "Hadir"}
          onClick={() => updateStatus(activeClass, originalIndex, "Hadir")}
          icon={Check}
          label="Hadir"
          disabled={saving}
        />
        <StatusButton
          status="Sakit"
          active={attendance.status === "Sakit"}
          onClick={() => updateStatus(activeClass, originalIndex, "Sakit")}
          icon={Hospital}
          label="Sakit"
          disabled={saving}
        />
        <StatusButton
          status="Izin"
          active={attendance.status === "Izin"}
          onClick={() => updateStatus(activeClass, originalIndex, "Izin")}
          icon={FileText}
          label="Izin"
          disabled={saving}
        />
        <StatusButton
          status="Alpa"
          active={attendance.status === "Alpa"}
          onClick={() => updateStatus(activeClass, originalIndex, "Alpa")}
          icon={FileX}
          label="Alpa"
          disabled={saving}
        />
      </div>

      <input
        type="text"
        placeholder="Keterangan..."
        value={attendance.note || ""}
        onChange={(e) => updateNote(activeClass, originalIndex, e.target.value)}
        disabled={saving}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
};
