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

// Helper untuk status badge
const getStatusBadge = (status) => {
  if (!status) return <span className="text-gray-400">-</span>;

  const normalizedStatus = normalizeStatus(status);

  const statusMap = {
    hadir: { text: "H", color: "bg-green-500 text-white" },
    sakit: { text: "S", color: "bg-yellow-500 text-white" },
    izin: { text: "I", color: "bg-blue-500 text-white" },
    alpa: { text: "A", color: "bg-red-500 text-white" },
    Hadir: { text: "H", color: "bg-green-500 text-white" },
    Sakit: { text: "S", color: "bg-yellow-500 text-white" },
    Izin: { text: "I", color: "bg-blue-500 text-white" },
    Alpa: { text: "A", color: "bg-red-500 text-white" },
    H: { text: "H", color: "bg-green-500 text-white" },
    S: { text: "S", color: "bg-yellow-500 text-white" },
    I: { text: "I", color: "bg-blue-500 text-white" },
    A: { text: "A", color: "bg-red-500 text-white" },
  };

  const statusInfo = statusMap[status] ||
    statusMap[normalizedStatus] || {
      text: "-",
      color: "bg-gray-200 text-gray-500",
    };

  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${statusInfo.color} mx-auto`}>
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
    return `${day}-${month}`;
  } catch (error) {
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length >= 2) {
        const day = parts[2] ? parts[2].substring(0, 2) : parts[0];
        const month = parts[1] ? parts[1].padStart(2, "0") : parts[0];
        return `${day}-${month}`;
      }
    }
    return dateStr;
  }
};

// Helper untuk get kategori kehadiran
const getAttendanceCategory = (percentage) => {
  if (percentage >= 90)
    return { text: "Sangat Baik", color: "bg-green-100 text-green-700" };
  if (percentage >= 80)
    return { text: "Baik", color: "bg-blue-100 text-blue-700" };
  if (percentage >= 70)
    return { text: "Cukup", color: "bg-yellow-100 text-yellow-700" };
  return { text: "Kurang", color: "bg-red-100 text-red-700" };
};

// Komponen AttendanceModal
const AttendanceModal = ({
  show,
  onClose,
  data,
  title,
  subtitle,
  loading,
  onRefreshData,
  activeClass,
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

      // ✅ NEW: Sort data by name untuk konsistensi urutan bulanan & semester
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

  // ✅ NEW: Effect untuk auto-fetch data saat viewMode berubah
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-3 sm:p-4 flex justify-between items-center flex-shrink-0 gap-3">
          <h2 className="text-sm sm:text-lg font-bold">📊 Rekap Presensi</h2>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tab Switcher */}
            <div className="flex bg-white/20 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition ${
                  viewMode === "monthly"
                    ? "bg-white text-blue-600 shadow"
                    : "text-white hover:bg-white/10"
                }`}>
                📅 Bulanan
              </button>
              <button
                onClick={() => setViewMode("semester")}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition ${
                  viewMode === "semester"
                    ? "bg-white text-blue-600 shadow"
                    : "text-white hover:bg-white/10"
                }`}>
                📊 Semester
              </button>
            </div>

            {/* Period Selector - Conditional based on viewMode */}
            <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg p-1 shadow-sm">
              <Calendar size={16} className="text-blue-500" />

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
                    className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 border-r border-gray-200 min-w-[80px]"
                    disabled={loading}>
                    {monthNames.map((month, index) => (
                      <option
                        key={index + 1}
                        value={index + 1}
                        className="text-gray-700">
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
                    className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 min-w-[70px]"
                    disabled={loading}>
                    {yearOptions.map((year) => (
                      <option key={year} value={year} className="text-gray-700">
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
                    className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 border-r border-gray-200 min-w-[80px]"
                    disabled={loading}>
                    <option value="ganjil" className="text-gray-700">
                      Ganjil
                    </option>
                    <option value="genap" className="text-gray-700">
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
                    className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 min-w-[70px]"
                    disabled={loading}>
                    {yearOptions.map((year) => (
                      <option key={year} value={year} className="text-gray-700">
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
              className="text-white hover:bg-white/20 p-2 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col overflow-hidden">
          {/* Compact Header */}
          <div className="mb-2 text-center border border-gray-200 rounded-lg p-2 bg-white flex-shrink-0 sticky top-0 z-30 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-gray-800">
              {title || "REKAP PRESENSI"}{" "}
              {activeClass && `- KELAS ${activeClass}`}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {getDynamicSubtitle()}
            </p>
            {viewMode === "monthly" && filteredDates.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {filteredDates.length} hari aktif •{" "}
                {formatDateHeader(filteredDates[0])} -{" "}
                {formatDateHeader(filteredDates[filteredDates.length - 1])}
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center p-8 text-gray-500 flex-1">
              <RefreshCw className="animate-spin mr-3" size={20} />
              <span className="text-gray-600">Memuat data rekap...</span>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex-1 flex flex-col">
              {/* Conditional Table based on viewMode */}
              {viewMode === "monthly" ? (
                // MONTHLY VIEW - Existing table
                <>
                  {filteredDates.length > 0 && (
                    <div className="bg-blue-50 p-2 text-center text-xs text-blue-700 sm:hidden border-b border-blue-200 flex-shrink-0 flex items-center justify-center gap-2">
                      <span>👉 Geser untuk melihat semua hari</span>
                      <span className="bg-blue-200 px-2 py-1 rounded text-blue-800 font-bold">
                        {filteredDates.length} hari
                      </span>
                    </div>
                  )}

                  <div className="overflow-auto flex-1 relative">
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none sm:hidden z-10"></div>

                    <table className="w-full text-xs sm:text-sm border-collapse">
                      <thead className="bg-gray-100 sticky top-0 z-20">
                        <tr className="border-b-2 border-gray-400">
                          <th className="p-2 text-center font-bold text-gray-800 border-r-2 border-gray-300 sticky left-0 bg-gray-100 z-30 min-w-[40px] sm:min-w-[50px]">
                            No.
                          </th>
                          <th className="p-2 text-left font-bold text-gray-800 border-r-2 border-gray-300 sticky left-[40px] sm:left-[50px] bg-gray-100 z-30 min-w-[140px] sm:min-w-[200px]">
                            Nama Siswa
                          </th>

                          {filteredDates.map((date, index) => (
                            <th
                              key={date}
                              className={`p-1 text-center font-bold text-gray-800 min-w-[40px] sm:min-w-[45px] whitespace-nowrap ${
                                index < filteredDates.length - 1
                                  ? "border-r border-gray-300"
                                  : "border-r-2 border-gray-400"
                              }`}>
                              {formatDateHeader(date)}
                            </th>
                          ))}

                          <th className="p-2 text-center font-bold text-green-700 border-r border-gray-300 min-w-[40px] sm:min-w-[45px] bg-green-50">
                            Hadir
                          </th>
                          <th className="p-2 text-center font-bold text-blue-700 border-r border-gray-300 min-w-[40px] sm:min-w-[45px] bg-blue-50">
                            Izin
                          </th>
                          <th className="p-2 text-center font-bold text-yellow-700 border-r border-gray-300 min-w-[40px] sm:min-w-[45px] bg-yellow-50">
                            Sakit
                          </th>
                          <th className="p-2 text-center font-bold text-red-700 border-r-2 border-gray-400 min-w-[40px] sm:min-w-[45px] bg-red-50">
                            Alpa
                          </th>
                          <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[40px] sm:min-w-[45px]">
                            Total
                          </th>
                          <th className="p-2 text-center font-bold text-gray-800 min-w-[50px] sm:min-w-[60px]">
                            Persentase
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedData && processedData.length > 0 ? (
                          processedData.map((student, index) => (
                            <tr
                              key={student.nisn || student.id || index}
                              className="border-b border-gray-200 hover:bg-blue-50 transition">
                              <td className="p-2 text-center border-r-2 border-gray-300 sticky left-0 bg-white z-10 font-medium shadow-right sm:shadow-none">
                                {index + 1}
                              </td>
                              <td className="p-2 font-medium text-gray-800 border-r-2 border-gray-300 sticky left-[40px] sm:left-[50px] bg-white z-10 whitespace-nowrap shadow-right sm:shadow-none">
                                {student.name ||
                                  student.full_name ||
                                  student.nama_siswa}
                              </td>

                              {filteredDates.map((date, index) => (
                                <td
                                  key={date}
                                  className={`p-1 text-center ${
                                    index < filteredDates.length - 1
                                      ? "border-r border-gray-200"
                                      : "border-r-2 border-gray-400"
                                  }`}>
                                  <div className="flex justify-center">
                                    {getStatusBadge(
                                      getStudentStatusByDate(student, date)
                                    )}
                                  </div>
                                </td>
                              ))}

                              <td className="p-2 text-center text-green-700 font-bold border-r border-gray-200 bg-green-50/50">
                                {student.hadir || 0}
                              </td>
                              <td className="p-2 text-center text-blue-700 font-bold border-r border-gray-200 bg-blue-50/50">
                                {student.izin || 0}
                              </td>
                              <td className="p-2 text-center text-yellow-700 font-bold border-r border-gray-200 bg-yellow-50/50">
                                {student.sakit || 0}
                              </td>
                              <td className="p-2 text-center text-red-700 font-bold border-r-2 border-gray-400 bg-red-50/50">
                                {student.alpa || 0}
                              </td>
                              <td className="p-2 text-center font-bold text-gray-800 border-r border-gray-200">
                                {student.total || 0}
                              </td>
                              <td className="p-2 text-center font-bold text-gray-800">
                                <span
                                  className={`inline-flex items-center justify-center w-12 px-2 py-1 rounded-full text-xs font-semibold ${
                                    student.percentage >= 80
                                      ? "bg-green-100 text-green-700"
                                      : student.percentage >= 60
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
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
                              className="p-8 text-center text-gray-500">
                              <div className="text-3xl sm:text-4xl mb-3">
                                📅
                              </div>
                              <h4 className="font-semibold mb-2 text-sm sm:text-base">
                                Belum Ada Data
                              </h4>
                              <p className="text-xs sm:text-sm">
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
                // SEMESTER VIEW - New summary table
                <div className="overflow-auto flex-1">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-20">
                      <tr className="border-b-2 border-gray-400">
                        <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[40px]">
                          No
                        </th>
                        <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[120px]">
                          NISN
                        </th>
                        <th className="p-2 text-left font-bold text-gray-800 border-r border-gray-300 min-w-[180px]">
                          Nama Siswa
                        </th>
                        <th className="p-2 text-center font-bold text-green-700 border-r border-gray-300 min-w-[60px] bg-green-50">
                          Hadir
                        </th>
                        <th className="p-2 text-center font-bold text-yellow-700 border-r border-gray-300 min-w-[60px] bg-yellow-50">
                          Sakit
                        </th>
                        <th className="p-2 text-center font-bold text-blue-700 border-r border-gray-300 min-w-[60px] bg-blue-50">
                          Izin
                        </th>
                        <th className="p-2 text-center font-bold text-red-700 border-r border-gray-300 min-w-[60px] bg-red-50">
                          Alpa
                        </th>
                        <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[60px]">
                          Total
                        </th>
                        <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[70px]">
                          %
                        </th>
                        <th className="p-2 text-center font-bold text-gray-800 min-w-[100px]">
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
                              className="border-b border-gray-200 hover:bg-blue-50 transition">
                              <td className="p-2 text-center border-r border-gray-200 font-medium">
                                {index + 1}
                              </td>
                              <td className="p-2 text-center border-r border-gray-200 font-mono text-xs">
                                {student.nisn || "-"}
                              </td>
                              <td className="p-2 border-r border-gray-200 font-medium text-gray-800">
                                {student.name ||
                                  student.full_name ||
                                  student.nama_siswa}
                              </td>
                              <td className="p-2 text-center text-green-700 font-bold border-r border-gray-200 bg-green-50/30">
                                {student.hadir || 0}
                              </td>
                              <td className="p-2 text-center text-yellow-700 font-bold border-r border-gray-200 bg-yellow-50/30">
                                {student.sakit || 0}
                              </td>
                              <td className="p-2 text-center text-blue-700 font-bold border-r border-gray-200 bg-blue-50/30">
                                {student.izin || 0}
                              </td>
                              <td className="p-2 text-center text-red-700 font-bold border-r border-gray-200 bg-red-50/30">
                                {student.alpa || 0}
                              </td>
                              <td className="p-2 text-center font-bold text-gray-800 border-r border-gray-200">
                                {student.total || 0}
                              </td>
                              <td className="p-2 text-center font-bold border-r border-gray-200">
                                <span
                                  className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold ${
                                    student.percentage >= 90
                                      ? "bg-green-100 text-green-700"
                                      : student.percentage >= 80
                                      ? "bg-blue-100 text-blue-700"
                                      : student.percentage >= 70
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
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
                            colSpan={10}
                            className="p-8 text-center text-gray-500">
                            <div className="text-3xl sm:text-4xl mb-3">📊</div>
                            <h4 className="font-semibold mb-2 text-sm sm:text-base">
                              Belum Ada Data
                            </h4>
                            <p className="text-xs sm:text-sm">
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

        {/* Footer */}
        <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {processedData && processedData.length > 0 && (
              <span>
                Total {processedData.length} siswa •{" "}
                {viewMode === "monthly" ? (
                  <>
                    {filteredDates.length} hari aktif • Periode{" "}
                    {monthNames[selectedMonth - 1]} {selectedYear}
                  </>
                ) : (
                  <>
                    Semester{" "}
                    {selectedSemester === "ganjil" ? "Ganjil" : "Genap"}{" "}
                    {semesterYear}
                  </>
                )}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm sm:text-base font-medium">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
