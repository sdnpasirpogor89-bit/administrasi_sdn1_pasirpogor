// src/pages/AttendanceModal.js - FIXED VERSION
import React, { useState, useEffect, useMemo } from "react";
import { RefreshCw, Calendar } from "lucide-react";

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

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

// Helper untuk status badge
const getStatusBadge = (status, isDarkMode = false) => {
  if (!status)
    return <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>;

  const normalizedStatus = normalizeStatus(status);

  const statusMap = {
    hadir: {
      text: "H",
      color: "bg-green-500 text-white dark:bg-green-600",
    },
    sakit: {
      text: "S",
      color: "bg-yellow-500 text-white dark:bg-yellow-600",
    },
    izin: {
      text: "I",
      color: "bg-blue-500 text-white dark:bg-blue-600",
    },
    alpa: {
      text: "A",
      color: "bg-red-500 text-white dark:bg-red-600",
    },
    Hadir: {
      text: "H",
      color: "bg-green-500 text-white dark:bg-green-600",
    },
    Sakit: {
      text: "S",
      color: "bg-yellow-500 text-white dark:bg-yellow-600",
    },
    Izin: {
      text: "I",
      color: "bg-blue-500 text-white dark:bg-blue-600",
    },
    Alpa: {
      text: "A",
      color: "bg-red-500 text-white dark:bg-red-600",
    },
    H: {
      text: "H",
      color: "bg-green-500 text-white dark:bg-green-600",
    },
    S: {
      text: "S",
      color: "bg-yellow-500 text-white dark:bg-yellow-600",
    },
    I: {
      text: "I",
      color: "bg-blue-500 text-white dark:bg-blue-600",
    },
    A: {
      text: "A",
      color: "bg-red-500 text-white dark:bg-red-600",
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

// Helper untuk get kategori kehadiran
const getAttendanceCategory = (percentage) => {
  if (percentage >= 90)
    return {
      text: "Sangat Baik",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    };
  if (percentage >= 80)
    return {
      text: "Baik",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    };
  if (percentage >= 70)
    return {
      text: "Cukup",
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
  return {
    text: "Kurang",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
};

// ==============================================
// ATTENDANCE MODAL COMPONENT (Full Page)
// ==============================================

const AttendanceModal = ({
  show,
  onClose,
  data,
  title,
  subtitle,
  loading,
  onRefreshData,
  activeClass,
  userData, // ✅ ADD
  darkMode = false, // ✅ ADD
  isMobile = false,
  isTablet = false,
}) => {
  // State untuk view mode
  const [viewMode, setViewMode] = useState("monthly");

  // State untuk periode bulanan
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // State untuk periode semester
  const [selectedSemester, setSelectedSemester] = useState(
    new Date().getMonth() >= 6 ? "ganjil" : "genap"
  );
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
      console.log("📦 Modal received data:", data.length, "students");
      console.log("📦 First student sample:", data[0]);
      console.log("📦 Has dailyStatus?", !!data[0]?.dailyStatus);

      const dates = extractAllDatesFromData(data);
      console.log("📅 Extracted dates:", dates.length, "days");
      setAttendanceDates(dates);

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
      setViewMode("monthly");
    }
  }, [show]);

  // Effect untuk auto-fetch data saat viewMode berubah
  useEffect(() => {
    if (!show) return;

    const fetchDataForCurrentView = async () => {
      if (viewMode === "monthly") {
        if (onRefreshData) {
          await onRefreshData({
            mode: "monthly",
            month: selectedMonth,
            year: selectedYear,
          });
        }
      } else if (viewMode === "semester") {
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
  }, [viewMode, show]);

  // Handle period change untuk bulanan
  const handleMonthlyChange = async (month, year) => {
    if (month !== selectedMonth || year !== selectedYear) {
      setSelectedMonth(month);
      setSelectedYear(year);
      if (onRefreshData) {
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
        const semesterType = semester === "ganjil" ? "Ganjil" : "Genap";
        const academicYear =
          semesterType === "Ganjil"
            ? `${year}/${year + 1}`
            : `${year - 1}/${year}`;

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
    <div className="w-full min-h-screen bg-red-50/30 dark:bg-gray-900 p-3 md:p-4 transition-colors duration-300">
      {/* FILTER SECTION - REDESIGNED */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-3 p-3 border border-red-200 dark:border-gray-700 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* View Mode Buttons */}
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tampilan
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("monthly")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "monthly"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                📅 Bulanan
              </button>
              <button
                onClick={() => setViewMode("semester")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "semester"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                📊 Semester
              </button>
            </div>
          </div>

          {/* Period Selectors */}
          {viewMode === "monthly" ? (
            <>
              {/* Bulan Dropdown */}
              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) =>
                    handleMonthlyChange(parseInt(e.target.value), selectedYear)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  disabled={loading}>
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tahun Dropdown */}
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    handleMonthlyChange(selectedMonth, parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  disabled={loading}>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Semester Dropdown */}
              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) =>
                    handleSemesterChange(e.target.value, semesterYear)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  disabled={loading}>
                  <option value="ganjil">Semester Ganjil</option>
                  <option value="genap">Semester Genap</option>
                </select>
              </div>

              {/* Tahun Dropdown */}
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun
                </label>
                <select
                  value={semesterYear}
                  onChange={(e) =>
                    handleSemesterChange(
                      selectedSemester,
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  disabled={loading}>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <RefreshCw className="animate-spin w-4 h-4" />
            <span>Memuat data...</span>
          </div>
        )}
      </div>

      {/* DATA TABLE SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-red-200 dark:border-gray-700 transition-colors duration-300">
        {/* Table Header - Info Sekolah */}
        {processedData && processedData.length > 0 && (
          <div className="p-3 border-b border-red-200 dark:border-gray-700 bg-red-50 dark:bg-gray-900">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
              {title || "REKAP PRESENSI"}{" "}
              {activeClass && (
                <span className="text-red-600 dark:text-red-400">
                  - KELAS {activeClass}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-400">
              {getDynamicSubtitle()}
            </p>
            {viewMode === "monthly" && filteredDates.length > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                {filteredDates.length} hari aktif •{" "}
                {formatDateHeader(filteredDates[0])} -{" "}
                {formatDateHeader(filteredDates[filteredDates.length - 1])}
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center p-8 text-gray-600 dark:text-gray-400">
            <RefreshCw className="animate-spin mr-3 dark:text-gray-300 size-6" />
            <span className="text-gray-700 dark:text-gray-300 text-base">
              Memuat data rekap...
            </span>
          </div>
        ) : (
          <>
            {/* Conditional Table based on viewMode */}
            {viewMode === "monthly" ? (
              // MONTHLY VIEW
              <>
                {filteredDates.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 text-center text-xs text-red-700 dark:text-red-300 md:hidden border-b border-red-200 dark:border-red-800 flex items-center justify-center gap-2">
                    <span>👉 Geser untuk lihat semua hari</span>
                    <span className="bg-red-200 dark:bg-red-800 px-2 py-1 rounded text-red-800 dark:text-red-200 font-bold">
                      {filteredDates.length} hari
                    </span>
                  </div>
                )}

                <div className="overflow-auto">
                  <table className="w-full text-xs md:text-sm border-collapse">
                    <thead className="bg-red-50 dark:bg-gray-800 sticky top-0 z-20">
                      <tr className="border-b-2 border-red-300 dark:border-gray-600">
                        <th className="p-2 text-center font-bold text-gray-900 dark:text-white border-r-2 border-red-300 dark:border-gray-700 sticky left-0 bg-red-50 dark:bg-gray-800 z-30 min-w-[40px]">
                          No.
                        </th>
                        <th className="p-2 text-left font-bold text-gray-900 dark:text-white border-r-2 border-red-300 dark:border-gray-700 sticky left-[40px] bg-red-50 dark:bg-gray-800 z-30 min-w-[140px] sm:min-w-[200px]">
                          Nama Siswa
                        </th>

                        {filteredDates.map((date, index) => (
                          <th
                            key={date}
                            className={`p-1 text-center font-bold text-gray-900 dark:text-white min-w-[40px] sm:min-w-[45px] whitespace-nowrap ${
                              index < filteredDates.length - 1
                                ? "border-r border-red-200 dark:border-gray-700"
                                : "border-r-2 border-red-300 dark:border-gray-600"
                            }`}>
                            {formatDateHeader(date)}
                          </th>
                        ))}

                        <th className="p-2 text-center font-bold text-green-700 dark:text-green-400 border-r border-red-200 dark:border-gray-700 min-w-[40px] bg-green-50/50 dark:bg-green-900/20">
                          H
                        </th>
                        <th className="p-2 text-center font-bold text-blue-700 dark:text-blue-400 border-r border-red-200 dark:border-gray-700 min-w-[40px] bg-blue-50/50 dark:bg-blue-900/20">
                          I
                        </th>
                        <th className="p-2 text-center font-bold text-yellow-700 dark:text-yellow-400 border-r border-red-200 dark:border-gray-700 min-w-[40px] bg-yellow-50/50 dark:bg-yellow-900/20">
                          S
                        </th>
                        <th className="p-2 text-center font-bold text-red-700 dark:text-red-400 border-r-2 border-red-300 dark:border-gray-600 min-w-[40px] bg-red-50/50 dark:bg-red-900/20">
                          A
                        </th>
                        <th className="p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-200 dark:border-gray-700 min-w-[40px]">
                          Total
                        </th>
                        <th className="p-2 text-center font-bold text-gray-900 dark:text-gray-300 min-w-[50px] sm:min-w-[60px]">
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
                            <td className="p-2 text-center border-r-2 border-red-300 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-900 z-10 font-medium text-gray-900 dark:text-gray-300">
                              {index + 1}
                            </td>
                            <td className="p-2 font-medium text-gray-900 dark:text-gray-200 border-r-2 border-red-300 dark:border-gray-700 sticky left-[40px] bg-white dark:bg-gray-900 z-10 whitespace-nowrap text-xs sm:text-sm">
                              {student.name ||
                                student.full_name ||
                                student.nama_siswa}
                            </td>

                            {filteredDates.map((date, index) => (
                              <td
                                key={date}
                                className={`p-1 text-center ${
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

                            <td className="p-2 text-center text-green-700 dark:text-green-400 font-bold border-r border-red-100 dark:border-gray-700 bg-green-50/30 dark:bg-green-900/10">
                              {student.hadir || 0}
                            </td>
                            <td className="p-2 text-center text-blue-700 dark:text-blue-400 font-bold border-r border-red-100 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-900/10">
                              {student.izin || 0}
                            </td>
                            <td className="p-2 text-center text-yellow-700 dark:text-yellow-400 font-bold border-r border-red-100 dark:border-gray-700 bg-yellow-50/30 dark:bg-yellow-900/10">
                              {student.sakit || 0}
                            </td>
                            <td className="p-2 text-center text-red-700 dark:text-red-400 font-bold border-r-2 border-red-300 dark:border-gray-600 bg-red-50/30 dark:bg-red-900/10">
                              {student.alpa || 0}
                            </td>
                            <td className="p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-100 dark:border-gray-700">
                              {student.total || 0}
                            </td>
                            <td className="p-2 text-center font-bold text-gray-900 dark:text-gray-300">
                              <span
                                className={`inline-flex items-center justify-center w-12 sm:w-14 px-2 py-1 rounded-full text-xs font-semibold ${
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
                            className="p-8 text-center text-gray-600 dark:text-gray-400">
                            <div className="text-4xl mb-3 dark:text-gray-600">
                              📅
                            </div>
                            <h4 className="font-semibold mb-2 text-base dark:text-gray-300">
                              Belum Ada Data
                            </h4>
                            <p className="text-sm dark:text-gray-400">
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
              // SEMESTER VIEW
              <div className="overflow-auto">
                <table className="w-full text-xs md:text-sm border-collapse">
                  <thead className="bg-red-50 dark:bg-gray-800 sticky top-0 z-20">
                    <tr className="border-b-2 border-red-300 dark:border-gray-600">
                      <th className="p-2 text-center font-bold text-gray-900 dark:text-white border-r border-red-200 dark:border-gray-700 min-w-[60px]">
                        No.
                      </th>
                      <th className="p-2 text-left font-bold text-gray-900 dark:text-white border-r border-red-200 dark:border-gray-700 min-w-[150px] sm:min-w-[180px]">
                        Nama Siswa
                      </th>
                      <th className="p-2 text-center font-bold text-green-700 dark:text-green-400 border-r border-red-200 dark:border-gray-700 min-w-[50px] bg-green-50/50 dark:bg-green-900/20">
                        H
                      </th>
                      <th className="p-2 text-center font-bold text-yellow-700 dark:text-yellow-400 border-r border-red-200 dark:border-gray-700 min-w-[50px] bg-yellow-50/50 dark:bg-yellow-900/20">
                        S
                      </th>
                      <th className="p-2 text-center font-bold text-blue-700 dark:text-blue-400 border-r border-red-200 dark:border-gray-700 min-w-[50px] bg-blue-50/50 dark:bg-blue-900/20">
                        I
                      </th>
                      <th className="p-2 text-center font-bold text-red-700 dark:text-red-400 border-r border-red-200 dark:border-gray-700 min-w-[50px] bg-red-50/50 dark:bg-red-900/20">
                        A
                      </th>
                      <th className="p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-200 dark:border-gray-700 min-w-[50px]">
                        Total
                      </th>
                      <th className="p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-200 dark:border-gray-700 min-w-[60px]">
                        %
                      </th>
                      <th className="p-2 text-center font-bold text-gray-900 dark:text-gray-300 min-w-[80px]">
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
                            <td className="p-2 text-center border-r-2 border-red-300 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-300">
                              {index + 1}
                            </td>
                            <td className="p-2 font-medium text-gray-900 dark:text-gray-300 border-r-2 border-red-300 dark:border-gray-700 text-xs sm:text-sm">
                              {student.name ||
                                student.full_name ||
                                student.nama_siswa}
                            </td>
                            <td className="p-2 text-center text-green-700 dark:text-green-400 font-bold border-r border-red-100 dark:border-gray-700 bg-green-50/30 dark:bg-green-900/10">
                              {student.hadir || 0}
                            </td>
                            <td className="p-2 text-center text-yellow-700 dark:text-yellow-400 font-bold border-r border-red-100 dark:border-gray-700 bg-yellow-50/30 dark:bg-yellow-900/10">
                              {student.sakit || 0}
                            </td>
                            <td className="p-2 text-center text-blue-700 dark:text-blue-400 font-bold border-r border-red-100 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-900/10">
                              {student.izin || 0}
                            </td>
                            <td className="p-2 text-center text-red-700 dark:text-red-400 font-bold border-r-2 border-red-300 dark:border-gray-600 bg-red-50/30 dark:bg-red-900/10">
                              {student.alpa || 0}
                            </td>
                            <td className="p-2 text-center font-bold text-gray-900 dark:text-gray-300 border-r border-red-100 dark:border-gray-700">
                              {student.total || 0}
                            </td>
                            <td className="p-2 text-center font-bold border-r border-red-100 dark:border-gray-700">
                              <span
                                className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold ${
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
                            <td className="p-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${category.color}`}>
                                {category.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-8 text-center text-gray-600 dark:text-gray-400">
                          <div className="text-4xl mb-3 dark:text-gray-600">
                            📊
                          </div>
                          <h4 className="font-semibold mb-2 text-base dark:text-gray-300">
                            Belum Ada Data
                          </h4>
                          <p className="text-sm dark:text-gray-400">
                            Belum ada data presensi untuk semester ini
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {processedData.length === 0 && !loading && (
              <div className="p-8">
                <div className="text-center text-5xl text-gray-200 dark:text-gray-700">
                  📊
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Stats */}
      {processedData && processedData.length > 0 && (
        <div className="mt-3 text-sm text-gray-700 dark:text-gray-400">
          <p>
            📊{" "}
            <span className="font-semibold text-red-600 dark:text-red-400">
              {processedData.length}
            </span>{" "}
            siswa
            {viewMode === "monthly" ? (
              <>
                {" • "}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {filteredDates.length}
                </span>{" "}
                hari • {monthNames[selectedMonth - 1]} {selectedYear}
              </>
            ) : (
              <>
                {" • "}
                Semester{" "}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {selectedSemester === "ganjil" ? "Ganjil" : "Genap"}
                </span>{" "}
                {semesterYear}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceModal;
