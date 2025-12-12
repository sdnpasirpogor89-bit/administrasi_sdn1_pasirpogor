// src/attendance-teacher/reports/MonthlyView.js - DARK MODE COMPLETE
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import ExportExcel from "./ExportExcel";

const MonthlyView = ({ currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendances, setAttendances] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExport, setShowExport] = useState(false);

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

  const nationalHolidays = {
    // ===== 2025 =====
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

    // ===== 2026 =====
    "2026-01-01": "Tahun Baru Masehi",
    "2026-01-16": "Isra Mi'raj Nabi Muhammad SAW",
    "2026-02-17": "Tahun Baru Imlek 2577",
    "2026-03-19": "Hari Suci Nyepi (Tahun Baru Saka 1948)",
    "2026-03-21": "Idul Fitri 1447 H",
    "2026-03-22": "Idul Fitri 1447 H",
    "2026-04-03": "Wafat Yesus Kristus (Jumat Agung)",
    "2026-04-05": "Hari Paskah",
    "2026-05-01": "Hari Buruh Internasional",
    "2026-05-14": "Kenaikan Yesus Kristus",
    "2026-05-27": "Idul Adha 1447 H",
    "2026-05-31": "Hari Raya Waisak 2570 BE",
    "2026-06-01": "Hari Lahir Pancasila",
    "2026-06-16": "Tahun Baru Islam 1448 H",
    "2026-08-17": "Hari Kemerdekaan RI",
    "2026-08-25": "Maulid Nabi Muhammad SAW",
    "2026-12-25": "Hari Raya Natal",
  };

  const isNationalHoliday = (dateStr) => {
    return nationalHolidays[dateStr] || null;
  };

  const isWeekend = (year, month, day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const year = selectedYear;
      const month = String(selectedMonth + 1).padStart(2, "0");
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

      const { data: teachersData, error: teachersError } = await supabase
        .from("users")
        .select("id, full_name, role")
        .in("role", ["guru_kelas", "guru_mapel"])
        .eq("is_active", true)
        .order("full_name");

      const { data: attendancesData, error: attendancesError } = await supabase
        .from("teacher_attendance")
        .select("*")
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate);

      if (teachersError) throw teachersError;
      if (attendancesError) throw attendancesError;

      setTeachers(teachersData || []);
      setAttendances(attendancesData || []);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  const getAttendanceForDay = (teacherId, day) => {
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayStr}`;

    return attendances.find(
      (att) => att.teacher_id === teacherId && att.attendance_date === dateStr
    );
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase();

    const badges = {
      hadir: {
        bg: "bg-green-500 dark:bg-green-600",
        text: "H",
        title: "Hadir",
      },
      izin: { bg: "bg-blue-500 dark:bg-blue-600", text: "I", title: "Izin" },
      sakit: {
        bg: "bg-yellow-500 dark:bg-yellow-600",
        text: "S",
        title: "Sakit",
      },
      alpa: { bg: "bg-red-500 dark:bg-red-600", text: "A", title: "Alpha" },
      alpha: { bg: "bg-red-500 dark:bg-red-600", text: "A", title: "Alpha" },
    };

    return (
      badges[normalizedStatus] || {
        bg: "bg-gray-300 dark:bg-gray-700",
        text: "-",
        title: "Tidak ada data",
      }
    );
  };

  const calculateTeacherStats = (teacherId) => {
    const teacherAttendances = attendances.filter(
      (att) => att.teacher_id === teacherId
    );

    return {
      hadir: teacherAttendances.filter(
        (a) => a.status?.toLowerCase() === "hadir"
      ).length,
      izin: teacherAttendances.filter((a) => a.status?.toLowerCase() === "izin")
        .length,
      sakit: teacherAttendances.filter(
        (a) => a.status?.toLowerCase() === "sakit"
      ).length,
      alpa: teacherAttendances.filter(
        (a) =>
          a.status?.toLowerCase() === "alpa" ||
          a.status?.toLowerCase() === "alpha"
      ).length,
      total: teacherAttendances.length,
    };
  };

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

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const daysInMonth = getDaysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 dark:bg-gray-800 dark:shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Laporan Bulanan
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Navigation */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white rounded transition-all dark:hover:bg-gray-600">
              <ChevronLeft size={20} className="dark:text-gray-300" />
            </button>
            <span className="px-4 font-semibold text-gray-800 min-w-[180px] text-center dark:text-white">
              {months[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white rounded transition-all dark:hover:bg-gray-600">
              <ChevronRight size={20} className="dark:text-gray-300" />
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 dark:bg-green-700 dark:hover:bg-green-800">
            <Download size={20} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari nama guru..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto dark:border-blue-400"></div>
          <p className="text-gray-600 mt-4 dark:text-gray-300">
            Memuat data...
          </p>
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-900">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10 min-w-[200px] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  Nama Guru
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="border border-gray-300 px-2 py-3 text-center font-semibold text-gray-700 min-w-[40px] dark:border-gray-600 dark:text-gray-300">
                    {day}
                  </th>
                ))}
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[80px] dark:border-gray-600 dark:text-gray-300">
                  H/I/S/A
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={daysInMonth + 2}
                    className="border border-gray-300 px-4 py-8 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
                    Tidak ada data guru
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => {
                  const stats = calculateTeacherStats(teacher.id);
                  return (
                    <tr
                      key={teacher.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white z-10 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                        {teacher.full_name}
                      </td>
                      {days.map((day) => {
                        const attendance = getAttendanceForDay(teacher.id, day);

                        const year = selectedYear;
                        const month = String(selectedMonth + 1).padStart(
                          2,
                          "0"
                        );
                        const dayStr = String(day).padStart(2, "0");
                        const dateStr = `${year}-${month}-${dayStr}`;

                        const weekend = isWeekend(
                          selectedYear,
                          selectedMonth,
                          day
                        );
                        const holiday = isNationalHoliday(dateStr);

                        const badge = attendance
                          ? getStatusBadge(attendance.status)
                          : {
                              bg:
                                weekend || holiday
                                  ? "bg-gray-300 dark:bg-gray-700"
                                  : "bg-gray-200 dark:bg-gray-800",
                              text: "-",
                              title: holiday
                                ? `🎉 ${holiday}`
                                : weekend
                                ? "🏠 Weekend (Libur)"
                                : "Belum absen",
                            };

                        return (
                          <td
                            key={day}
                            className={`border border-gray-300 px-2 py-3 text-center ${
                              weekend || holiday
                                ? "bg-red-100 dark:bg-red-900/30"
                                : ""
                            } dark:border-gray-600`}>
                            <span
                              className={`${badge.bg} text-white font-bold text-xs px-2 py-1 rounded inline-block min-w-[24px]`}
                              title={badge.title}>
                              {badge.text}
                            </span>
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm dark:border-gray-600">
                        <span className="text-green-600 dark:text-green-400">
                          {stats.hadir}
                        </span>
                        /
                        <span className="text-blue-600 dark:text-blue-400">
                          {stats.izin}
                        </span>
                        /
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {stats.sakit}
                        </span>
                        /
                        <span className="text-red-600 dark:text-red-400">
                          {stats.alpa}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="bg-green-500 dark:bg-green-600 text-white font-bold text-xs px-2 py-1 rounded">
            H
          </span>
          <span className="text-gray-600 dark:text-gray-300">Hadir</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-500 dark:bg-blue-600 text-white font-bold text-xs px-2 py-1 rounded">
            I
          </span>
          <span className="text-gray-600 dark:text-gray-300">Izin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-yellow-500 dark:bg-yellow-600 text-white font-bold text-xs px-2 py-1 rounded">
            S
          </span>
          <span className="text-gray-600 dark:text-gray-300">Sakit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-red-500 dark:bg-red-600 text-white font-bold text-xs px-2 py-1 rounded">
            A
          </span>
          <span className="text-gray-600 dark:text-gray-300">Alpha</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs px-2 py-1 rounded">
            -
          </span>
          <span className="text-gray-600 dark:text-gray-300">Belum Absen</span>
        </div>
        <div className="flex items-center gap-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
          <span className="bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs px-2 py-1 rounded">
            🏠
          </span>
          <span className="text-gray-600 dark:text-gray-300">
            Weekend / Libur Nasional
          </span>
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <ExportExcel
          attendances={attendances}
          teachers={teachers}
          month={selectedMonth}
          year={selectedYear}
          monthName={months[selectedMonth]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default MonthlyView;
