// pages/attendance/AttendanceModals.js

import React, { useState, useEffect } from "react";
import {
  Check,
  Download,
  Calendar,
  AlertTriangle,
  X,
  RefreshCw,
  WifiOff,
} from "lucide-react";

// Toast Component - Enhanced for mobile + OFFLINE STATUS
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
    if (type === "error") return "bg-red-600";
    if (type === "offline") return "bg-orange-600";
    return "bg-green-600";
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

// Confirmation Modal Component
export const ConfirmationModal = ({
  show,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-orange-500 flex-shrink-0" size={20} />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {title}
          </h3>
        </div>
        <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base">
            Tidak
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base">
            Ya, Timpa Data
          </button>
        </div>
      </div>
    </div>
  );
};

// ExportModal Component - MONTHLY
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Download className="text-blue-500 flex-shrink-0" size={20} />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Export Data Presensi Bulanan
          </h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulan:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tahun:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            disabled={loading}>
            Batal
          </button>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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

// ExportSemesterModal Component - SEMESTER
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-purple-500 flex-shrink-0" size={20} />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Export Rekap Semester
          </h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester:
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              disabled={loading}>
              <option value={1}>Semester 1 (Ganjil - Juli-Desember)</option>
              <option value={2}>Semester 2 (Genap - Januari-Juni)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tahun:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              disabled={loading}>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={2020 + i} value={2020 + i}>
                  {2020 + i}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
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
            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            disabled={loading}>
            Batal
          </button>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
