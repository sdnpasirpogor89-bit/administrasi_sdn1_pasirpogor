// src/pages/AttendanceModal.js
import React, { useState, useEffect, useMemo } from "react";
import { X, RefreshCw, Calendar } from "lucide-react";

// Helper untuk extract semua tanggal unik dari data
const extractAllDatesFromData = (data) => {
  if (!data || data.length === 0) return [];

  const allDates = new Set();

  data.forEach((student) => {
    if (student.dailyStatus && typeof student.dailyStatus === "object") {
      Object.keys(student.dailyStatus).forEach((date) => {
        allDates.add(date);
      });
    }
  });

  const sortedDates = Array.from(allDates).sort();
  return sortedDates;
};

// Helper untuk get status berdasarkan date
const getStudentStatusByDate = (student, date) => {
  if (student.dailyStatus && student.dailyStatus[date]) {
    return student.dailyStatus[date];
  }
  return null;
};

// Helper untuk normalize status
const normalizeStatus = (status) => {
  if (!status) return status;
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

// Helper untuk status badge - OPTIMIZED DARK MODE
const getStatusBadge = (status, isDarkMode = false) => {
  if (!status)
    return <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>;

  const normalizedStatus = normalizeStatus(status);

  const statusMap = {
    hadir: {
      text: "H",
      color: "bg-green-500 text-white dark:bg-green-600",
      darkColor: "dark:bg-green-600 dark:text-white",
    },
    sakit: {
      text: "S",
      color: "bg-yellow-500 text-white dark:bg-yellow-600",
      darkColor: "dark:bg-yellow-600 dark:text-white",
    },
    izin: {
      text: "I",
      color: "bg-blue-500 text-white dark:bg-blue-600",
      darkColor: "dark:bg-blue-600 dark:text-white",
    },
    alpa: {
      text: "A",
      color: "bg-red-500 text-white dark:bg-red-600",
      darkColor: "dark:bg-red-600 dark:text-white",
    },
    Hadir: {
      text: "H",
      color: "bg-green-500 text-white dark:bg-green-600",
      darkColor: "dark:bg-green-600 dark:text-white",
    },
    Sakit: {
      text: "S",
      color: "bg-yellow-500 text-white dark:bg-yellow-600",
      darkColor: "dark:bg-yellow-600 dark:text-white",
    },
    Izin: {
      text: "I",
      color: "bg-blue-500 text-white dark:bg-blue-600",
      darkColor: "dark:bg-blue-600 dark:text-white",
    },
    Alpa: {
      text: "A",
      color: "bg-red-500 text-white dark:bg-red-600",
      darkColor: "dark:bg-red-600 dark:text-white",
    },
    H: {
      text: "H",
      color: "bg-green-500 text-white dark:bg-green-600",
      darkColor: "dark:bg-green-600 dark:text-white",
    },
    S: {
      text: "S",
      color: "bg-yellow-500 text-white dark:bg-yellow-600",
      darkColor: "dark:bg-yellow-600 dark:text-white",
    },
    I: {
      text: "I",
      color: "bg-blue-500 text-white dark:bg-blue-600",
      darkColor: "dark:bg-blue-600 dark:text-white",
    },
    A: {
      text: "A",
      color: "bg-red-500 text-white dark:bg-red-600",
      darkColor: "dark:bg-red-600 dark:text-white",
    },
  };

  const statusInfo = statusMap[status] ||
    statusMap[normalizedStatus] || {
      text: "-",
      color: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    };

  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-7 sm:h-7 rounded text-xs font-bold ${statusInfo.color} mx-auto touch-manipulation`}>
      {statusInfo.text}
    </span>
  );
};

// Helper untuk format tanggal
const formatDateHeader = (dateStr) => {
  try {
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  } catch (error) {
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length >= 2) {
        const day = parts[2] ? parts[2].substring(0, 2) : parts[0];
        const month = parts[1] ? parts[1].padStart(2, "0") : parts[0];
        return `${day}/${month}`;
      }
    }
    return dateStr;
  }
};

// Helper untuk get kategori kehadiran dengan tema merah-putih
const getAttendanceCategory = (percentage) => {
  if (percentage >= 90)
    return {
      text: "Sangat Baik",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      darkColor: "dark:bg-green-900/30 dark:text-green-300",
    };
  if (percentage >= 80)
    return {
      text: "Baik",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      darkColor: "dark:bg-blue-900/30 dark:text-blue-300",
    };
  if (percentage >= 70)
    return {
      text: "Cukup",
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      darkColor: "dark:bg-yellow-900/30 dark:text-yellow-300",
    };
  return {
    text: "Kurang",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    darkColor: "dark:bg-red-900/30 dark:text-red-300",
  };
};

// Komponen AttendanceModal dengan TEMA MERAH-PUTIH (Light Mode)
const AttendanceModal = ({
  show,
  onClose,
  data,
  title,
  subtitle,
  loading,
  onRefreshData,
  activeClass,
  isMobile = false,
  isTablet = false,
}) => {
  // State untuk view mode
  const [viewMode, setViewMode] = useState("monthly"); // "monthly" or "semester"

  // State untuk periode bulanan
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // State untuk periode semester
  const [selectedSemester, setSelectedSemester] = useState(
    new Date().getMonth() >= 6 ? "ganjil" : "genap"
  ); // ganjil or genap
  const [semesterYear, setSemesterYear] = useState(new Date().getFullYear());

  const [attendanceDates, setAttendanceDates] = useState([]);
  const [processedData, setProcessedData] = useState([]);

  // Array nama bulan
  const monthNames = [
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

  // Generate year options (2025-2030)
  const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030];

  // Process data
  useEffect(() => {
    if (data && data.length > 0) {
      const dates = extractAllDatesFromData(data);
      setAttendanceDates(dates);

      // ✅ Sort data by name untuk konsistensi urutan bulanan & semester
      const sortedData = [...data].sort((a, b) => {
        const nameA = (
          a.name ||
          a.full_name ||
          a.nama_siswa ||
          ""
        ).toLowerCase();
        const nameB = (
          b.name ||
          b.full_name ||
          b.nama_siswa ||
          ""
        ).toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setProcessedData(sortedData);
    } else {
      setAttendanceDates([]);
      setProcessedData([]);
    }
  }, [data]);

  // Reset to current period when modal opens
  useEffect(() => {
    if (show) {
      const now = new Date();
      setSelectedMonth(now.getMonth() + 1);
      setSelectedYear(now.getFullYear());
      setSemesterYear(now.getFullYear());
      setSelectedSemester(now.getMonth() >= 6 ? "ganjil" : "genap");
      setViewMode("monthly"); // ✅ Reset ke monthly saat modal dibuka
    }
  }, [show]);

  // ✅ Effect untuk auto-fetch data saat viewMode berubah
  useEffect(() => {
    if (!show) return; // Skip kalau modal ngga dibuka

    const fetchDataForCurrentView = async () => {
      if (viewMode === "monthly") {
        // Fetch data bulanan
        if (onRefreshData) {
          await onRefreshData({
            mode: "monthly",
            month: selectedMonth,
            year: selectedYear,
          });
        }
      } else if (viewMode === "semester") {
        // Fetch data semester
        const semesterType = selectedSemester === "ganjil" ? "Ganjil" : "Genap";
        const academicYear =
          semesterType === "Ganjil"
            ? `${semesterYear}/${semesterYear + 1}`
            : `${semesterYear - 1}/${semesterYear}`;

        if (onRefreshData) {
          await onRefreshData({
            mode: "semester",
            semester: semesterType,
            academicYear: academicYear,
            year: semesterYear,
          });
        }
      }
    };

    fetchDataForCurrentView();
  }, [viewMode, show]); // ✅ Trigger saat viewMode berubah

  // Handle period change untuk bulanan
  const handleMonthlyChange = async (month, year) => {
    if (month !== selectedMonth || year !== selectedYear) {
      setSelectedMonth(month);
      setSelectedYear(year);
      if (onRefreshData) {
        // Send as object for consistency
        await onRefreshData({
          mode: "monthly",
          month: month,
          year: year,
        });
      }
    }
  };

  // Handle period change untuk semester
  const handleSemesterChange = async (semester, year) => {
    if (semester !== selectedSemester || year !== semesterYear) {
      setSelectedSemester(semester);
      setSemesterYear(year);
      if (onRefreshData) {
        // Generate academic year based on semester
        const semesterType = semester === "ganjil" ? "Ganjil" : "Genap";
        const academicYear =
          semesterType === "Ganjil"
            ? `${year}/${year + 1}`
            : `${year - 1}/${year}`;

        // Send as object with all params
        await onRefreshData({
          mode: "semester",
          semester: semesterType,
          academicYear: academicYear,
          year: year,
        });
      }
    }
  };

  // Generate dynamic subtitle
  const getDynamicSubtitle = () => {
    if (viewMode === "monthly") {
      const monthName = monthNames[selectedMonth - 1];
      return `Laporan Kehadiran Siswa Bulan ${monthName} ${selectedYear}`;
    } else {
      const semesterName =
        selectedSemester === "ganjil"
          ? "Ganjil (Juli-Desember)"
          : "Genap (Januari-Juni)";
      return `Laporan Kehadiran Siswa Semester ${semesterName} ${semesterYear}`;
    }
  };

  // Filter dates untuk monthly view
  const filteredDates = useMemo(() => {
    if (viewMode !== "monthly") return [];
    return attendanceDates.filter((date) => {
      try {
        const dateObj = new Date(date + "T00:00:00");
        return (
          dateObj.getMonth() + 1 === selectedMonth &&
          dateObj.getFullYear() === selectedYear
        );
      } catch (error) {
        return true;
      }
    });
  }, [attendanceDates, selectedMonth, selectedYear, viewMode]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-1 xs:p-2 sm:p-4 transition-colors duration-300 touch-none">
      <div className="bg-white dark:bg-gray-900 rounded-lg xs:rounded-xl w-full max-w-[98vw] xs:max-w-7xl max-h-[98vh] xs:max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col transition-colors duration-300 mx-1 xs:mx-2">
        {/* Header dengan TEMA MERAH-PUTIH */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-gray-800 dark:to-gray-900 text-white p-3 xs:p-4 flex justify-between items-center flex-shrink-0 gap-2 xs:gap-3 border-b-4 border-white dark:border-gray-700">
          <h2 className="text-sm xs:text-base sm:text-lg font-bold flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg">📊</span>
            <span className="text-white">Rekap Presensi</span>
          </h2>

          <div className="flex items-center gap-1 xs:gap-2 sm:gap-3">
            {/* Tab Switcher */}
            <div className="flex bg-white/20 dark:bg-white/10 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-2 xs:px-3 py-1.5 xs:py-2 rounded text-xs font-medium transition-all duration-200 min-h-[36px] min-w-[60px] xs:min-w-[70px] touch-manipulation active:scale-95 ${
                  viewMode === "monthly"
                    ? "bg-white text-red-600 dark:bg-gray-700 dark:text-white shadow-md"
                    : "text-white hover:bg-white/20 dark:hover:bg-white/30"
                }`}>
                📅 {isMobile ? "" : "Bulan"}
              </button>
              <button
                onClick={() => setViewMode("semester")}
                className={`px-2 xs:px-3 py-1.5 xs:py-2 rounded text-xs font-medium transition-all duration-200 min-h-[36px] min-w-[60px] xs:min-w-[70px] touch-manipulation active:scale-95 ${
                  viewMode === "semester"
                    ? "bg-white text-red-600 dark:bg-gray-700 dark:text-white shadow-md"
                    : "text-white hover:bg-white/20 dark:hover:bg-white/30"
                }`}>
                📊 {isMobile ? "" : "Semester"}
              </button>
            </div>

            {/* Period Selector - Conditional based on viewMode */}
            <div className="flex items-center gap-1 xs:gap-2 bg-white/90 dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-white/30 dark:border-gray-700">
              <Calendar
                size={14}
                className="text-red-500 dark:text-gray-400 xs:size-4"
              />

              {viewMode === "monthly" ? (
                <>
                  {/* Bulan Selector */}
                  <select
                    value={selectedMonth}
                    onChange={(e) =>
                      handleMonthlyChange(
                        parseInt(e.target.value),
                        selectedYear
                      )
                    }
                    className="bg-transparent text-gray-800 dark:text-gray-300 text-xs xs:text-sm font-medium focus:outline-none cursor-pointer py-1 px-1 xs:px-2 border-r border-gray-300 dark:border-gray-700 min-w-[70px] xs:min-w-[80px] sm:min-w-[90px] touch-manipulation"
                    disabled={loading}>
                    {monthNames.map((month, index) => (
                      <option
                        key={index + 1}
                        value={index + 1}
                        className="text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-800">
                        {month}
                      </option>
                    ))}
                  </select>

                  {/* Tahun */}
                  <select
                    value={selectedYear}
                    onChange={(e) =>
                      handleMonthlyChange(
                        selectedMonth,
                        parseInt(e.target.value)
                      )
                    }
                    className="bg-transparent text-gray-800 dark:text-gray-300 text-xs xs:text-sm font-medium focus:outline-none cursor-pointer py-1 px-1 xs:px-2 min-w-[60px] xs:min-w-[70px] sm:min-w-[80px] touch-manipulation"
                    disabled={loading}>
                    {yearOptions.map((year) => (
                      <option
                        key={year}
                        value={year}
                        className="text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-800">
                        {year}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  {/* Semester Selector */}
                  <select
                    value={selectedSemester}
                    onChange={(e) =>
                      handleSemesterChange(e.target.value, semesterYear)
                    }
                    className="bg-transparent text-gray-800 dark:text-gray-300 text-xs xs:text-sm font-medium focus:outline-none cursor-pointer py-1 px-1 xs:px-2 border-r border-gray-300 dark:border-gray-700 min-w-[70px] xs:min-w-[80px] sm:min-w-[90px] touch-manipulation"
                    disabled={loading}>
                    <option
                      value="ganjil"
                      className="text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-800">
                      Ganjil
                    </option>
                    <option
                      value="genap"
                      className="text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-800">
                      Genap
                    </option>
                  </select>

                  {/* Tahun */}
                  <select
                    value={semesterYear}
                    onChange={(e) =>
                      handleSemesterChange(
                        selectedSemester,
                        parseInt(e.target.value)
                      )
                    }
                    className="bg-transparent text-gray-800 dark:text-gray-300 text-xs xs:text-sm font-medium focus:outline-none cursor-pointer py-1 px-1 xs:px-2 min-w-[60px] xs:min-w-[70px] sm:min-w-[80px] touch-manipulation"
                    disabled={loading}>
                    {yearOptions.map((year) => (
                      <option
                        key={year}
                        value={year}
                        className="text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-800">
                        {year}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 dark:hover:bg-white/30 p-1.5 xs:p-2 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px] xs:min-w-[44px] xs:min-h-[44px] flex items-center justify-center touch-manipulation active:scale-95 border border-white/30">
              <X size={16} className="xs:size-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-2 xs:p-3 sm:p-4 flex-1 flex flex-col overflow-hidden bg-red-50/30 dark:bg-gray-800 transition-colors duration-300">
          {/* Compact Header */}
          <div className="mb-2 xs:mb-3 text-center border border-red-200 dark:border-gray-700 rounded-lg p-2 xs:p-3 bg-white dark:bg-gray-900 flex-shrink-0 sticky top-0 z-30 shadow-sm transition-colors duration-300">
            <h3 className="text-sm xs:text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              {title || "REKAP PRESENSI"}{" "}
              {activeClass && (
                <span className="text-red-600 dark:text-red-400">
                  - KELAS {activeClass}
                </span>
              )}
            </h3>
            <p className="text-xs xs:text-sm text-gray-700 dark:text-gray-400 mt-1">
              {getDynamicSubtitle()}
            </p>
            {viewMode === "monthly" && filteredDates.length > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 xs:mt-2 font-medium">
                {filteredDates.length} hari aktif •{" "}
                {formatDateHeader(filteredDates[0])} -{" "}
                {formatDateHeader(filteredDates[filteredDates.length - 1])}
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center p-6 xs:p-8 text-gray-600 dark:text-gray-400 flex-1">
              <RefreshCw className="animate-spin mr-2 xs:mr-3 dark:text-gray-300 size-5 xs:size-6" />
              <span className="text-gray-700 dark:text-gray-300 text-sm xs:text-base">
                Memuat data rekap...
              </span>
            </div>
          ) : (
            <div className="border border-red-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm flex-1 flex flex-col transition-colors duration-300">
              {/* Conditional Table based on viewMode */}
              {viewMode === "monthly" ? (
                // MONTHLY VIEW - Existing table
                <>
                  {filteredDates.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 text-center text-xs text-red-700 dark:text-red-300 xs:hidden border-b border-red-200 dark:border-red-800 flex-shrink-0 flex items-center justify-center gap-2">
                      <span>👉 Geser untuk lihat semua hari</span>
                      <span className="bg-red-200 dark:bg-red-800 px-2 py-1 rounded text-red-800 dark:text-red-200 font-bold">
                        {filteredDates.length} hari
                      </span>
                    </div>
                  )}

                  <div className="overflow-auto flex-1 relative">
                    <div className="absolute right-0 top-0 bottom-0 w-3 xs:w-4 bg-gradient-to-l from-red-50 dark:from-red-900/20 to-transparent pointer-events-none xs:hidden z-10"></div>

                    <table className="w-full text-xs xs:text-sm border-collapse">
                      <thead className="bg-red-50 dark:bg-gray-800 sticky top-0 z-20">
                        <tr className="border-b-2 border-red-300 dark:border-gray-600">
                          <th className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-200 border-r-2 border-red-300 dark:border-gray-700 sticky left-0 bg-red-50 dark:bg-gray-800 z-30 min-w-[30px] xs:min-w-[40px]">
                            No.
                          </th>
                          <th className="p-1 xs:p-2 text-left font-bold text-gray-900 dark:text-gray-200 border-r-2 border-red-300 dark:border-gray-700 sticky left-[30px] xs:left-[40px] bg-red-50 dark:bg-gray-800 z-30 min-w-[120px] xs:min-w-[140px] sm:min-w-[200px]">
                            Nama Siswa
                          </th>

                          {filteredDates.map((date, index) => (
                            <th
                              key={date}
                              className={`p-0.5 xs:p-1 text-center font-bold text-gray-900 dark:text-gray-200 min-w-[36px] xs:min-w-[40px] sm:min-w-[45px] whitespace-nowrap ${
                                index < filteredDates.length - 1
                                  ? "border-r border-red-200 dark:border-gray-700"
                                  : "border-r-2 border-red-300 dark:border-gray-600"
                              }`}>
                              {formatDateHeader(date)}
                            </th>
                          ))}

                          <th className="p-1 xs:p-2 text-center font-bold text-green-700 dark:text-green-400 border-r border-red-200 dark:border-gray-700 min-w-[36px] xs:min-w-[40px] bg-green-50/50 dark:bg-green-900/20">
                            H
                          </th>
                          <th className="p-1 xs:p-2 text-center font-bold text-blue-700 dark:text-blue-400 border-r border-red-200 dark:border-gray-700 min-w-[36px] xs:min-w-[40px] bg-blue-50/50 dark:bg-blue-900/20">
                            I
                          </th>
                          <th className="p-1 xs:p-2 text-center font-bold text-yellow-700 dark:text-yellow-400 border-r border-red-200 dark:border-gray-700 min-w-[36px] xs:min-w-[40px] bg-yellow-50/50 dark:bg-yellow-900/20">
                            S
                          </th>
                          <th className="p-1 xs:p-2 text-center font-bold text-red-700 dark:text-red-400 border-r-2 border-red-300 dark:border-gray-600 min-w-[36px] xs:min-w-[40px] bg-red-50/50 dark:bg-red-900/20">
                            A
                          </th>
                          <th className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-200 dark:border-gray-700 min-w-[36px] xs:min-w-[40px]">
                            Total
                          </th>
                          <th className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-300 min-w-[44px] xs:min-w-[50px] sm:min-w-[60px]">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedData && processedData.length > 0 ? (
                          processedData.map((student, index) => (
                            <tr
                              key={student.nisn || student.id || index}
                              className="border-b border-red-100 dark:border-gray-700 hover:bg-red-50/50 dark:hover:bg-gray-800 transition-colors duration-150">
                              <td className="p-1 xs:p-2 text-center border-r-2 border-red-300 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-900 z-10 font-medium text-gray-900 dark:text-gray-300 shadow-right dark:shadow-gray-800 xs:shadow-none">
                                {index + 1}
                              </td>
                              <td className="p-1 xs:p-2 font-medium text-gray-900 dark:text-gray-200 border-r-2 border-red-300 dark:border-gray-700 sticky left-[30px] xs:left-[40px] bg-white dark:bg-gray-900 z-10 whitespace-nowrap text-xs xs:text-sm shadow-right dark:shadow-gray-800 xs:shadow-none">
                                {student.name ||
                                  student.full_name ||
                                  student.nama_siswa}
                              </td>

                              {filteredDates.map((date, index) => (
                                <td
                                  key={date}
                                  className={`p-0.5 xs:p-1 text-center ${
                                    index < filteredDates.length - 1
                                      ? "border-r border-red-100 dark:border-gray-700"
                                      : "border-r-2 border-red-300 dark:border-gray-600"
                                  }`}>
                                  <div className="flex justify-center">
                                    {getStatusBadge(
                                      getStudentStatusByDate(student, date),
                                      true
                                    )}
                                  </div>
                                </td>
                              ))}

                              <td className="p-1 xs:p-2 text-center text-green-700 dark:text-green-400 font-bold border-r border-red-100 dark:border-gray-700 bg-green-50/30 dark:bg-green-900/10">
                                {student.hadir || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center text-blue-700 dark:text-blue-400 font-bold border-r border-red-100 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-900/10">
                                {student.izin || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center text-yellow-700 dark:text-yellow-400 font-bold border-r border-red-100 dark:border-gray-700 bg-yellow-50/30 dark:bg-yellow-900/10">
                                {student.sakit || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center text-red-700 dark:text-red-400 font-bold border-r-2 border-red-300 dark:border-gray-600 bg-red-50/30 dark:bg-red-900/10">
                                {student.alpa || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-100 dark:border-gray-700">
                                {student.total || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-300">
                                <span
                                  className={`inline-flex items-center justify-center w-10 xs:w-12 sm:w-14 px-1 xs:px-2 py-0.5 xs:py-1 rounded-full text-xs font-semibold ${
                                    student.percentage >= 80
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                      : student.percentage >= 60
                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                  }`}>
                                  {student.percentage || 0}%
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={filteredDates.length + 8}
                              className="p-6 xs:p-8 text-center text-gray-600 dark:text-gray-400">
                              <div className="text-2xl xs:text-3xl sm:text-4xl mb-2 xs:mb-3 dark:text-gray-600">
                                📅
                              </div>
                              <h4 className="font-semibold mb-1 xs:mb-2 text-sm xs:text-base dark:text-gray-300">
                                Belum Ada Data
                              </h4>
                              <p className="text-xs xs:text-sm dark:text-gray-400">
                                Belum ada data presensi untuk bulan ini
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                // SEMESTER VIEW - Summary table
                <div className="overflow-auto flex-1">
                  <table className="w-full text-xs xs:text-sm border-collapse">
                    <thead className="bg-red-50 dark:bg-gray-800 sticky top-0 z-20">
                      <tr className="border-b-2 border-red-300 dark:border-gray-600">
                        <th className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-200 border-r border-red-200 dark:border-gray-700 min-w-[30px] xs:min-w-[40px]">
                          No
                        </th>
                        <th className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-200 border-r border-red-200 dark:border-gray-700 min-w-[80px] xs:min-w-[100px]">
                          NISN
                        </th>
                        <th className="p-1 xs:p-2 text-left font-bold text-gray-900 dark:text-gray-200 border-r border-red-200 dark:border-gray-700 min-w-[120px] xs:min-w-[150px] sm:min-w-[180px]">
                          Nama Siswa
                        </th>
                        <th className="p-1 xs:p-2 text-center font-bold text-green-700 dark:text-green-400 border-r border-red-200 dark:border-gray-700 min-w-[40px] xs:min-w-[50px] bg-green-50/50 dark:bg-green-900/20">
                          H
                        </th>
                        <th className="p-1 xs:p-2 text-center font-bold text-yellow-700 dark:text-yellow-400 border-r border-red-200 dark:border-gray-700 min-w-[40px] xs:min-w-[50px] bg-yellow-50/50 dark:bg-yellow-900/20">
                          S
                        </th>
                        <th className="p-1 xs:p-2 text-center font-bold text-blue-700 dark:text-blue-400 border-r border-red-200 dark:border-gray-700 min-w-[40px] xs:min-w-[50px] bg-blue-50/50 dark:bg-blue-900/20">
                          I
                        </th>
                        <th className="p-1 xs:p-2 text-center font-bold text-red-700 dark:text-red-400 border-r border-red-200 dark:border-gray-700 min-w-[40px] xs:min-w-[50px] bg-red-50/50 dark:bg-red-900/20">
                          A
                        </th>
                        <th className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-200 dark:border-gray-700 min-w-[40px] xs:min-w-[50px]">
                          Total
                        </th>
                        <th className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-200 dark:border-gray-700 min-w-[50px] xs:min-w-[60px]">
                          %
                        </th>
                        <th className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-300 min-w-[70px] xs:min-w-[80px]">
                          Kategori
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedData && processedData.length > 0 ? (
                        processedData.map((student, index) => {
                          const category = getAttendanceCategory(
                            student.percentage || 0
                          );
                          return (
                            <tr
                              key={student.nisn || student.id || index}
                              className="border-b border-red-100 dark:border-gray-700 hover:bg-red-50/50 dark:hover:bg-gray-800 transition-colors duration-150">
                              <td className="p-1 xs:p-2 text-center border-r border-red-100 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-300">
                                {index + 1}
                              </td>
                              <td className="p-1 xs:p-2 text-center border-r border-red-100 dark:border-gray-700 font-mono text-xs text-gray-800 dark:text-gray-400">
                                {student.nisn || "-"}
                              </td>
                              <td className="p-1 xs:p-2 border-r border-red-100 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-300 text-xs xs:text-sm">
                                {student.name ||
                                  student.full_name ||
                                  student.nama_siswa}
                              </td>
                              <td className="p-1 xs:p-2 text-center text-green-700 dark:text-green-400 font-bold border-r border-red-100 dark:border-gray-700 bg-green-50/30 dark:bg-green-900/10">
                                {student.hadir || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center text-yellow-700 dark:text-yellow-400 font-bold border-r border-red-100 dark:border-gray-700 bg-yellow-50/30 dark:bg-yellow-900/10">
                                {student.sakit || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center text-blue-700 dark:text-blue-400 font-bold border-r border-red-100 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-900/10">
                                {student.izin || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center text-red-700 dark:text-red-400 font-bold border-r border-red-100 dark:border-gray-700 bg-red-50/30 dark:bg-red-900/10">
                                {student.alpa || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-100 dark:border-gray-700">
                                {student.total || 0}
                              </td>
                              <td className="p-1 xs:p-2 text-center font-bold border-r border-red-100 dark:border-gray-700">
                                <span
                                  className={`inline-flex items-center justify-center px-1 xs:px-2 py-0.5 xs:py-1 rounded-full text-xs font-semibold ${
                                    student.percentage >= 90
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                      : student.percentage >= 80
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                      : student.percentage >= 70
                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                  }`}>
                                  {student.percentage || 0}%
                                </span>
                              </td>
                              <td className="p-1 xs:p-2 text-center">
                                <span
                                  className={`inline-flex items-center justify-center px-2 xs:px-3 py-0.5 xs:py-1 rounded-full text-xs font-semibold ${category.color}`}>
                                  {category.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={10}
                            className="p-6 xs:p-8 text-center text-gray-600 dark:text-gray-400">
                            <div className="text-2xl xs:text-3xl sm:text-4xl mb-2 xs:mb-3 dark:text-gray-600">
                              📊
                            </div>
                            <h4 className="font-semibold mb-1 xs:mb-2 text-sm xs:text-base dark:text-gray-300">
                              Belum Ada Data
                            </h4>
                            <p className="text-xs xs:text-sm dark:text-gray-400">
                              Belum ada data presensi untuk semester ini
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer dengan TEMA MERAH */}
        <div className="bg-red-50 dark:bg-gray-800 p-2 xs:p-3 sm:p-4 border-t border-red-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0 transition-colors duration-300">
          <div className="text-xs xs:text-sm text-gray-700 dark:text-gray-400">
            {processedData && processedData.length > 0 && (
              <span className="text-xs xs:text-sm">
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {processedData.length}
                </span>{" "}
                siswa •{" "}
                {viewMode === "monthly" ? (
                  <>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {filteredDates.length}
                    </span>{" "}
                    hari • {monthNames[selectedMonth - 1]} {selectedYear}
                  </>
                ) : (
                  <>
                    Semester{" "}
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {selectedSemester === "ganjil" ? "Ganjil" : "Genap"}
                    </span>{" "}
                    {semesterYear}
                  </>
                )}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 bg-red-600 hover:bg-red-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 text-xs xs:text-sm font-medium touch-manipulation active:scale-95 min-h-[36px] xs:min-h-[40px] min-w-[60px] xs:min-w-[80px] sm:min-w-[100px] border border-red-700 dark:border-gray-600">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
