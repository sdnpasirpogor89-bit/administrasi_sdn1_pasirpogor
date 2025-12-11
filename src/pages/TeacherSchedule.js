import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import TeacherScheduleExcel from "./TeacherScheduleExcel";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  LayoutGrid,
  List,
} from "lucide-react";

const JAM_SCHEDULE = {
  Senin: {
    1: { start: "06:30", end: "07:00", pelajaran: "UPACARA" },
    2: { start: "07:00", end: "07:35" },
    3: { start: "07:35", end: "08:10" },
    4: { start: "08:10", end: "08:45" },
    5: { start: "08:45", end: "09:20" },
    6: { start: "09:50", end: "10:25" },
    7: { start: "10:25", end: "11:00" },
    8: { start: "11:00", end: "11:35" },
    9: { start: "11:35", end: "12:10" },
  },
  Selasa: {
    1: { start: "06:30", end: "07:00", pelajaran: "PEMBIASAAN (NUMERASI)" },
    2: { start: "07:00", end: "07:35" },
    3: { start: "07:35", end: "08:10" },
    4: { start: "08:10", end: "08:45" },
    5: { start: "08:45", end: "09:20" },
    6: { start: "09:50", end: "10:25" },
    7: { start: "10:25", end: "11:00" },
    8: { start: "11:00", end: "11:35" },
    9: { start: "11:35", end: "12:10" },
  },
  Rabu: {
    1: { start: "06:30", end: "07:00", pelajaran: "SENAM INDONESIA SEHAT" },
    2: { start: "07:00", end: "07:35" },
    3: { start: "07:35", end: "08:10" },
    4: { start: "08:10", end: "08:45" },
    5: { start: "08:45", end: "09:20" },
    6: { start: "09:50", end: "10:25" },
    7: { start: "10:25", end: "11:00" },
    8: { start: "11:00", end: "11:35" },
    9: { start: "11:35", end: "12:10" },
  },
  Kamis: {
    1: { start: "06:30", end: "07:00", pelajaran: "PEMBIASAAN (LITERASI)" },
    2: { start: "07:00", end: "07:35" },
    3: { start: "07:35", end: "08:10" },
    4: { start: "08:10", end: "08:45" },
    5: { start: "08:45", end: "09:20" },
    6: { start: "09:50", end: "10:25" },
    7: { start: "10:25", end: "11:00" },
    8: { start: "11:00", end: "11:35" },
    9: { start: "11:35", end: "12:10" },
  },
  Jumat: {
    1: { start: "06:30", end: "07:00", pelajaran: "SOLAT DHUHA" },
    2: { start: "07:00", end: "07:35" },
    3: { start: "07:35", end: "08:10" },
    4: { start: "08:10", end: "08:45" },
    5: { start: "08:45", end: "09:20" },
    6: { start: "09:50", end: "10:25" },
    7: { start: "10:25", end: "11:00" },
  },
};

const SUBJECTS = [
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Bahasa Sunda",
  "Matematika",
  "IPAS",
  "Pendidikan Pancasila",
  "Seni Budaya",
  "PABP",
  "PJOK",
];

const TeacherSchedule = ({ user }) => {
  const currentUser = user || {};
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const classId = currentUser?.kelas || "5";
  const [formData, setFormData] = useState({
    day: "Senin",
    start_period: "1",
    end_period: "1",
    subject: "",
    class_id: classId,
  });

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  useEffect(() => {
    if (currentUser?.kelas) {
      fetchSchedules();
    }
  }, [currentUser?.kelas]);

  const fetchSchedules = async () => {
    if (!currentUser || !currentUser.kelas) {
      setError("User belum login atau tidak memiliki kelas");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("class_schedules")
        .select("*")
        .eq("class_id", currentUser.kelas)
        .order("day")
        .order("start_time");
      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      setError("Gagal memuat jadwal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
  };

  const generateScheduleGrid = () => {
    const grid = {};
    const rendered = {};

    days.forEach((day) => {
      grid[day] = {};
      rendered[day] = {};
      const daySchedule = JAM_SCHEDULE[day];
      if (daySchedule) {
        Object.keys(daySchedule).forEach((period) => {
          grid[day][period] = null;
          rendered[day][period] = false;
        });
      }
    });

    schedules.forEach((schedule) => {
      const day = schedule.day;
      const periods = findPeriodsByTimeRange(
        day,
        schedule.start_time,
        schedule.end_time
      );

      if (periods.length > 0 && !rendered[day][periods[0]]) {
        grid[day][periods[0]] = {
          ...schedule,
          colspan: periods.length,
        };

        periods.forEach((p, idx) => {
          rendered[day][p] = true;
          if (idx > 0) {
            grid[day][p] = { skip: true };
          }
        });
      }
    });

    return grid;
  };

  const findPeriodsByTimeRange = (day, startTime, endTime) => {
    const daySchedule = JAM_SCHEDULE[day];
    if (!daySchedule) return [];

    const periods = [];
    const targetStart = timeToMinutes(startTime);
    const targetEnd = timeToMinutes(endTime);

    for (const [period, timeRange] of Object.entries(daySchedule)) {
      const periodStart = timeToMinutes(timeRange.start);
      const periodEnd = timeToMinutes(timeRange.end);

      if (periodStart >= targetStart && periodEnd <= targetEnd) {
        periods.push(period);
      }
    }

    return periods.sort((a, b) => parseInt(a) - parseInt(b));
  };

  const timeToMinutes = (timeStr) => {
    const cleanTime = timeStr.substring(0, 5);
    const [hours, minutes] = cleanTime.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const getPeriodFromTime = (day, startTime, endTime) => {
    const periods = findPeriodsByTimeRange(day, startTime, endTime);
    return {
      startPeriod: periods[0] || "1",
      endPeriod: periods[periods.length - 1] || "1",
    };
  };

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingId(schedule.id);
      const { startPeriod, endPeriod } = getPeriodFromTime(
        schedule.day,
        schedule.start_time,
        schedule.end_time
      );
      setFormData({
        day: schedule.day,
        start_period: startPeriod,
        end_period: endPeriod,
        subject: schedule.subject,
        class_id: schedule.class_id,
      });
    } else {
      setEditingId(null);
      setFormData({
        day: "Senin",
        start_period: "1",
        end_period: "1",
        subject: "",
        class_id: classId,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.subject) {
      setError("Mata pelajaran harus dipilih");
      return;
    }
    if (!currentUser?.kelas || !currentUser?.id) {
      setError("Data user tidak lengkap");
      return;
    }
    setLoading(true);
    try {
      const daySchedule = JAM_SCHEDULE[formData.day];
      const startTime = daySchedule[formData.start_period].start;
      const endTime = daySchedule[formData.end_period].end;

      const scheduleData = {
        day: formData.day,
        start_time: startTime,
        end_time: endTime,
        subject: formData.subject,
        class_id: currentUser.kelas,
        teacher_id: currentUser.id,
      };

      let result;
      if (editingId) {
        result = await supabase
          .from("class_schedules")
          .update(scheduleData)
          .eq("id", editingId)
          .select();
      } else {
        result = await supabase
          .from("class_schedules")
          .insert([scheduleData])
          .select();
      }

      if (result.error) throw result.error;
      setSuccess(`Jadwal berhasil ${editingId ? "diupdate" : "ditambahkan"}`);
      await fetchSchedules();
      handleCloseModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Gagal menyimpan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("class_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setSuccess("Jadwal berhasil dihapus");
      fetchSchedules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Gagal menghapus jadwal");
    } finally {
      setLoading(false);
    }
  };

  const getAvailablePeriods = () => {
    return Object.keys(JAM_SCHEDULE[formData.day] || {});
  };

  const getPagiActivity = (day, period) => {
    if (period === "1") {
      const daySchedule = JAM_SCHEDULE[day];
      if (daySchedule && daySchedule[1] && daySchedule[1].pelajaran) {
        return daySchedule[1].pelajaran;
      }
    }
    return null;
  };

  const scheduleGrid = generateScheduleGrid();

  const renderScheduleContent = () => {
    if (loading && schedules.length === 0) {
      return (
        <div className="p-8 text-center text-slate-600 dark:text-slate-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 dark:border-red-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Memuat jadwal...</p>
        </div>
      );
    }

    if (schedules.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
          <p className="text-xl font-semibold mb-2 dark:text-slate-300">
            Belum ada jadwal
          </p>
          <p className="text-base dark:text-slate-500">
            Klik "Tambah Jadwal" untuk memulai
          </p>
        </div>
      );
    }

    return viewMode === "grid" ? renderGridView() : renderListView();
  };

  const renderGridView = () => {
    const periods = Object.keys(JAM_SCHEDULE.Senin || {});

    return (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[800px] sm:min-w-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-red-950 to-red-900 dark:from-gray-900 dark:to-gray-800">
                <th className="px-3 py-3 sm:px-4 sm:py-4 border border-red-800 dark:border-gray-700 text-center font-bold text-white dark:text-gray-200 text-sm sm:text-base">
                  JAM KE
                </th>
                <th className="px-3 py-3 sm:px-4 sm:py-4 border border-red-800 dark:border-gray-700 text-center font-bold text-white dark:text-gray-200 text-sm sm:text-base">
                  WAKTU
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="px-3 py-3 sm:px-4 sm:py-4 border border-red-800 dark:border-gray-700 text-center font-bold text-white dark:text-gray-200 text-sm sm:text-base">
                    {day.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => {
                const time = JAM_SCHEDULE.Senin[period];
                const showIstirahat = period === "5";

                return (
                  <React.Fragment key={period}>
                    <tr className="hover:bg-red-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-3 sm:px-4 sm:py-4 border border-red-100 dark:border-gray-700 text-center font-bold text-red-900 dark:text-red-300 text-sm">
                        {period}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 border border-red-100 dark:border-gray-700 text-center text-red-800 dark:text-red-400 text-xs sm:text-sm">
                        {time.start} - {time.end}
                      </td>
                      {days.map((day) => {
                        const cellData = scheduleGrid[day]?.[period];
                        const pagiActivity = getPagiActivity(day, period);

                        if (cellData?.skip) {
                          return null;
                        }

                        return (
                          <td
                            key={`${day}-${period}`}
                            colSpan={cellData?.colspan || 1}
                            className="px-3 py-3 sm:px-4 sm:py-4 border border-red-100 dark:border-gray-700 text-center relative group min-w-[120px]">
                            {cellData && !cellData.skip ? (
                              <div className="relative">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm inline-block py-1 px-2 rounded bg-red-50 dark:bg-gray-800/50">
                                  {cellData.subject}
                                </span>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity z-10">
                                  <button
                                    onClick={() => handleOpenModal(cellData)}
                                    className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-red-200 dark:border-gray-700"
                                    aria-label="Edit jadwal">
                                    <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(cellData.id)}
                                    className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-red-200 dark:border-gray-700"
                                    aria-label="Hapus jadwal">
                                    <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                  </button>
                                </div>
                              </div>
                            ) : pagiActivity ? (
                              <span className="font-semibold text-red-700 dark:text-red-400 text-xs px-2 py-1 bg-red-50/50 dark:bg-red-950/30 rounded inline-block">
                                {pagiActivity}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {showIstirahat && (
                      <tr className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
                        <td className="px-3 py-3 sm:px-4 sm:py-4 border border-amber-200 dark:border-amber-800/50 text-center font-bold text-amber-800 dark:text-amber-400">
                          -
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4 border border-amber-200 dark:border-amber-800/50 text-center text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
                          09:20 - 09:50
                        </td>
                        <td
                          colSpan={5}
                          className="px-3 py-3 sm:px-4 sm:py-4 border border-amber-200 dark:border-amber-800/50 text-center font-extrabold text-amber-900 dark:text-amber-300 text-sm sm:text-base">
                          ⏰ ISTIRAHAT
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <div className="p-4 sm:p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 border-t border-red-200 dark:border-gray-700">
            <p className="text-sm sm:text-base text-red-900 dark:text-red-300 text-center font-semibold">
              📝 NB: Jadwal ini sebagai contoh perhitungan jumlah JP setiap mata
              pelajarannya setiap minggunya. Silahkan sesuaikan dengan Kelasnya
              masing-masing.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[600px] sm:min-w-0">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-950 to-red-900 dark:from-gray-900 dark:to-gray-800">
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm sm:text-base font-bold text-white dark:text-gray-200 border-b border-red-800 dark:border-gray-700">
                  Hari
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm sm:text-base font-bold text-white dark:text-gray-200 border-b border-red-800 dark:border-gray-700">
                  Jam Ke
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm sm:text-base font-bold text-white dark:text-gray-200 border-b border-red-800 dark:border-gray-700">
                  Waktu
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm sm:text-base font-bold text-white dark:text-gray-200 border-b border-red-800 dark:border-gray-700">
                  Mata Pelajaran
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm sm:text-base font-bold text-white dark:text-gray-200 border-b border-red-800 dark:border-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const daySchedules = schedules.filter((s) => s.day === day);

                if (daySchedules.length === 0) {
                  return (
                    <tr
                      key={day}
                      className="border-b border-red-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-4 sm:px-6 sm:py-5 font-bold text-red-900 dark:text-red-300 text-sm sm:text-base">
                        {day}
                      </td>
                      <td
                        colSpan={4}
                        className="px-4 py-4 sm:px-6 sm:py-5 text-red-700 dark:text-red-400 text-center">
                        Tidak ada jadwal
                      </td>
                    </tr>
                  );
                }

                return daySchedules.map((schedule, idx) => {
                  const periods = findPeriodsByTimeRange(
                    day,
                    schedule.start_time,
                    schedule.end_time
                  );
                  const jamKe =
                    periods.length > 0
                      ? `${periods[0]}${
                          periods.length > 1
                            ? `-${periods[periods.length - 1]}`
                            : ""
                        }`
                      : "?";

                  return (
                    <tr
                      key={schedule.id}
                      className="border-b border-red-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-800/30 transition-colors">
                      {idx === 0 && (
                        <td
                          className="px-4 py-4 sm:px-6 sm:py-5 font-bold text-red-900 dark:text-red-300 text-sm sm:text-base align-top"
                          rowSpan={daySchedules.length}>
                          {day}
                        </td>
                      )}
                      <td className="px-4 py-4 sm:px-6 sm:py-5 text-red-800 dark:text-red-300 font-semibold text-sm sm:text-base">
                        JP {jamKe}
                      </td>
                      <td className="px-4 py-4 sm:px-6 sm:py-5 text-red-700 dark:text-red-400 text-sm sm:text-base">
                        {formatTime(schedule.start_time)} -{" "}
                        {formatTime(schedule.end_time)}
                      </td>
                      <td className="px-4 py-4 sm:px-6 sm:py-5 font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                        {schedule.subject}
                      </td>
                      <td className="px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={() => handleOpenModal(schedule)}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-colors min-h-[36px]"
                            aria-label="Edit jadwal">
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-colors min-h-[36px]"
                            aria-label="Hapus jadwal">
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-gray-950 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-red-950 to-red-900 dark:from-gray-900 dark:to-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-red-900 dark:border-gray-700 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 dark:bg-gray-700/50 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-1 sm:mb-2">
                JADWAL PELAJARAN KELAS {currentUser?.kelas || "-"}
              </h1>
              <p className="text-red-200 dark:text-gray-300 font-semibold text-sm sm:text-base md:text-lg">
                TAHUN AJARAN 2025/2026 - SEMESTER GANJIL
              </p>
              <p className="text-red-300/90 dark:text-gray-400 text-xs sm:text-sm mt-2">
                Guru: {currentUser?.full_name || "Tidak diketahui"}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-100 dark:border-gray-700 p-3 sm:p-4 md:p-5">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* View Mode Buttons */}
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 flex-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex-1 min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 justify-center border-2 transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-red-700 to-red-600 dark:from-red-800 dark:to-red-700 text-white border-red-800 dark:border-red-700"
                    : "bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border-red-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-gray-700"
                }`}
                aria-label="Tampilan Grid">
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 justify-center border-2 transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-red-700 to-red-600 dark:from-red-800 dark:to-red-700 text-white border-red-800 dark:border-red-700"
                    : "bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border-red-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-gray-700"
                }`}
                aria-label="Tampilan List">
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">List</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 flex-1">
              <button
                onClick={() => handleOpenModal()}
                className="flex-1 min-h-[44px] sm:min-h-[48px] bg-gradient-to-r from-red-950 to-red-900 dark:from-red-900 dark:to-red-800 hover:from-red-900 hover:to-red-800 dark:hover:from-red-800 dark:hover:to-red-700 text-white px-3 sm:px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 justify-center border-2 border-red-900 dark:border-red-800 transition-all duration-200 active:scale-95"
                aria-label="Tambah Jadwal">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Tambah Jadwal</span>
              </button>
              <div className="flex-1">
                <TeacherScheduleExcel
                  schedules={schedules}
                  user={currentUser}
                  onRefresh={fetchSchedules}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-200 dark:border-green-800 text-green-900 dark:text-green-300 px-4 py-3 sm:px-5 sm:py-4 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">
                {success}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-2 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300 px-4 py-3 sm:px-5 sm:py-4 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-100 dark:border-gray-700 overflow-hidden">
          {renderScheduleContent()}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-red-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-red-100 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-red-900 dark:text-white">
                {editingId ? "✏️ Edit Jadwal" : "➕ Tambah Jadwal"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-red-500 dark:text-gray-400 hover:text-red-700 dark:hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700"
                aria-label="Tutup modal">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-red-900 dark:text-gray-300 mb-2">
                  Hari
                </label>
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-red-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600 bg-white dark:bg-gray-700 text-red-900 dark:text-white text-sm sm:text-base transition-all duration-200">
                  {days.map((day) => (
                    <option key={day} value={day} className="py-2">
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-red-900 dark:text-gray-300 mb-2">
                    Dari Jam Ke
                  </label>
                  <select
                    name="start_period"
                    value={formData.start_period}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-red-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600 bg-white dark:bg-gray-700 text-red-900 dark:text-white text-sm sm:text-base transition-all duration-200">
                    {getAvailablePeriods().map((jam) => (
                      <option key={jam} value={jam} className="py-2">
                        Jam {jam}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-red-900 dark:text-gray-300 mb-2">
                    Sampai Jam Ke
                  </label>
                  <select
                    name="end_period"
                    value={formData.end_period}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-red-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600 bg-white dark:bg-gray-700 text-red-900 dark:text-white text-sm sm:text-base transition-all duration-200">
                    {getAvailablePeriods().map((jam) => (
                      <option
                        key={jam}
                        value={jam}
                        disabled={
                          parseInt(jam) < parseInt(formData.start_period)
                        }
                        className="py-2">
                        Jam {jam}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-semibold text-red-900 dark:text-gray-300 mb-2">
                  Mata Pelajaran
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-red-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600 bg-white dark:bg-gray-700 text-red-900 dark:text-white text-sm sm:text-base transition-all duration-200">
                  <option value="" className="py-2">
                    Pilih Mata Pelajaran
                  </option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject} className="py-2">
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4">
                <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-center gap-2.5 text-red-900 dark:text-red-300 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold text-sm sm:text-base">
                      Info Waktu:
                    </span>
                  </div>
                  <p className="text-red-800 dark:text-red-400 font-semibold text-sm sm:text-base">
                    {formData.day}:{" "}
                    {JAM_SCHEDULE[formData.day]?.[formData.start_period]?.start}{" "}
                    - {JAM_SCHEDULE[formData.day]?.[formData.end_period]?.end}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="flex-1 min-h-[44px] sm:min-h-[48px] px-4 py-2.5 sm:py-3 bg-red-100 dark:bg-gray-700 hover:bg-red-200 dark:hover:bg-gray-600 disabled:bg-red-50 dark:disabled:bg-gray-800 text-red-700 dark:text-gray-300 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 active:scale-95">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-h-[44px] sm:min-h-[48px] bg-gradient-to-r from-red-950 to-red-900 dark:from-red-800 dark:to-red-700 hover:from-red-900 hover:to-red-800 dark:hover:from-red-700 dark:hover:to-red-600 disabled:from-red-400 dark:disabled:from-red-900 text-white rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : editingId ? (
                    "Update Jadwal"
                  ) : (
                    "Simpan Jadwal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;
