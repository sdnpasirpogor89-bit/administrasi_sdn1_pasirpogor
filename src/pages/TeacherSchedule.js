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
  Upload,
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
  "Pendidikan Agama Islam",
  "PJOK",
];

const TeacherSchedule = ({ user }) => {
  const currentUser =
    user || JSON.parse(localStorage.getItem("userSession")) || {};
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
    if (currentUser && currentUser.kelas) {
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

  // FIXED: Simplified render function
  const renderScheduleContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center text-slate-600">Memuat jadwal...</div>
      );
    }

    if (schedules.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="mb-2">Belum ada jadwal</p>
          <p className="text-sm">Klik "Tambah Jadwal" untuk memulai</p>
        </div>
      );
    }

    return viewMode === "grid" ? renderGridView() : renderListView();
  };

  const renderGridView = () => {
    const periods = Object.keys(JAM_SCHEDULE.Senin || {});

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-50">
              <th className="p-4 border border-green-200 text-center font-semibold text-green-800">
                JAM KE
              </th>
              <th className="p-4 border border-green-200 text-center font-semibold text-green-800">
                WAKTU
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="p-4 border border-green-200 text-center font-semibold text-green-800">
                  {day.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => {
              const time = JAM_SCHEDULE.Senin[period];
              return (
                <tr
                  key={period}
                  className="hover:bg-green-50 transition-colors">
                  <td className="p-3 border border-green-100 text-center font-semibold bg-green-50 text-green-900">
                    {period}
                  </td>
                  <td className="p-3 border border-green-100 text-center text-sm bg-green-50 text-green-800">
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
                        className="p-3 border border-green-100 text-center">
                        {cellData && !cellData.skip ? (
                          <div className="relative group">
                            <span className="font-bold text-slate-800 text-sm">
                              {cellData.subject}
                            </span>
                            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                              <button
                                onClick={() => handleOpenModal(cellData)}
                                className="text-blue-600 hover:text-blue-700 p-1 bg-white rounded shadow-sm">
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(cellData.id)}
                                className="text-red-600 hover:text-red-700 p-1 bg-white rounded shadow-sm">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : pagiActivity ? (
                          <span className="font-bold text-green-700 italic text-xs">
                            {pagiActivity}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4 bg-green-50 border-t border-green-200">
          <p className="text-sm md:text-base text-green-800 text-center font-bold">
            NB: Jadwal ini sebagai contoh perhitungan jumlah JP setiap mata
            pelajarannya setiap minggunya. Silahkan sesuaikan dengan sekolah
            masing-masing.
          </p>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-green-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-green-800 border-b border-green-200">
                Hari
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-green-800 border-b border-green-200">
                Jam Ke
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-green-800 border-b border-green-200">
                Waktu
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-green-800 border-b border-green-200">
                Mata Pelajaran
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-green-800 border-b border-green-200">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const daySchedules = schedules.filter((s) => s.day === day);

              if (daySchedules.length === 0) {
                return (
                  <tr key={day} className="border-b border-slate-200">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {day}
                    </td>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-slate-500 text-center">
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
                    className="border-b border-slate-200 hover:bg-green-50 transition-colors">
                    {idx === 0 && (
                      <td
                        className="px-6 py-4 font-semibold text-slate-800"
                        rowSpan={daySchedules.length}>
                        {day}
                      </td>
                    )}
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      JP {jamKe}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatTime(schedule.start_time)} -{" "}
                      {formatTime(schedule.end_time)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {schedule.subject}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(schedule)}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm">
                          <Trash2 className="w-4 h-4" />
                          Hapus
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
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - HANYA SATU */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                JADWAL PELAJARAN KELAS {currentUser?.kelas || "-"}
              </h1>
              <p className="text-slate-600 font-semibold">
                {currentUser?.full_name || "Loading..."} - TAHUN AJARAN
                2025/2026 SEMESTER GANJIL
              </p>
            </div>
          </div>
        </div>

        {/* Controls - HANYA SATU */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 min-w-[140px] px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border transition-all ${
                viewMode === "grid"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}>
              <LayoutGrid className="w-5 h-5" />
              Tampilan Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 min-w-[140px] px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border transition-all ${
                viewMode === "list"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}>
              <List className="w-5 h-5" />
              Tampilan List
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border border-green-700 transition-all">
              <Plus className="w-5 h-5" />
              Tambah Jadwal
            </button>
            <TeacherScheduleExcel
              schedules={schedules}
              className={`Kelas ${currentUser?.kelas}`}
              user={currentUser}
            />
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Main Content - HANYA SATU */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {renderScheduleContent()}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Jadwal" : "Tambah Jadwal"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hari
                </label>
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dari Jam Ke
                  </label>
                  <select
                    name="start_period"
                    value={formData.start_period}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    {getAvailablePeriods().map((jam) => (
                      <option key={jam} value={jam}>
                        Jam {jam}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sampai Jam Ke
                  </label>
                  <select
                    name="end_period"
                    value={formData.end_period}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    {getAvailablePeriods().map((jam) => (
                      <option
                        key={jam}
                        value={jam}
                        disabled={
                          parseInt(jam) < parseInt(formData.start_period)
                        }>
                        Jam {jam}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mata Pelajaran
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option value="">Pilih Mata Pelajaran</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Info Waktu:</span>
                  </div>
                  <p className="text-green-700 text-sm">
                    {formData.day}:{" "}
                    {JAM_SCHEDULE[formData.day]?.[formData.start_period]?.start}{" "}
                    - {JAM_SCHEDULE[formData.day]?.[formData.end_period]?.end}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
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
