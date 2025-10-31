import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Upload,
  LayoutGrid,
  List,
} from "lucide-react";
import ExcelJS from "exceljs";

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
  const fileInputRef = useRef(null);

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [importMessage, setImportMessage] = useState({ type: "", text: "" });
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
      console.error("Fetch error:", err);
      setError("Gagal memuat jadwal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === FUNGSI EXPORT EXCEL ===
  const handleExportExcel = async () => {
    if (schedules.length === 0) {
      setError("Tidak ada data jadwal untuk di-export");
      return;
    }

    setLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Jadwal Kelas ${classId}`);

      // Header
      worksheet.mergeCells("A1:H1");
      worksheet.getCell("A1").value = "SDN 1 PASIRPOGOR";
      worksheet.getCell("A1").style = {
        font: { bold: true, size: 16 },
        alignment: { horizontal: "center" },
      };

      worksheet.mergeCells("A2:H2");
      worksheet.getCell("A2").value = `JADWAL PELAJARAN KELAS ${classId}`;
      worksheet.getCell("A2").style = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: "center" },
      };

      worksheet.mergeCells("A3:H3");
      worksheet.getCell("A3").value = `Guru: ${currentUser.full_name}`;
      worksheet.getCell("A3").style = {
        alignment: { horizontal: "center" },
      };

      // Kosong 2 baris
      worksheet.getRow(4).height = 10;
      worksheet.getRow(5).height = 10;

      // Header tabel
      const headerRow = worksheet.getRow(6);
      headerRow.values = ["JAM KE", "WAKTU", ...days];
      headerRow.eachCell((cell) => {
        cell.style = {
          font: { bold: true, color: { argb: "FFFFFFFF" } },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF22C55E" },
          },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
          alignment: { horizontal: "center", vertical: "middle" },
        };
      });

      // Lebar kolom
      worksheet.columns = [
        { width: 10 },
        { width: 15 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
      ];

      // Data
      const scheduleGrid = generateScheduleGrid();
      let rowIndex = 7;

      Object.keys(JAM_SCHEDULE.Senin).forEach((period) => {
        const time = JAM_SCHEDULE.Senin[period];
        const row = worksheet.getRow(rowIndex);
        const rowData = [period, `${time.start} - ${time.end}`];

        days.forEach((day) => {
          const schedule = scheduleGrid[day] && scheduleGrid[day][period];
          const pagiActivity = JAM_SCHEDULE[day]?.[period]?.pelajaran;
          rowData.push(schedule ? schedule.subject : pagiActivity || "");
        });

        row.values = rowData;
        row.eachCell((cell, colNumber) => {
          cell.style = {
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
            alignment: { horizontal: "center", vertical: "middle" },
          };
          if (colNumber <= 2) {
            cell.style.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF9FAFB" },
            };
          }
        });
        row.height = 25;
        rowIndex++;

        // Tambah istirahat
        if (period === "5") {
          const istirahatRow = worksheet.getRow(rowIndex);
          worksheet.mergeCells(`C${rowIndex}:H${rowIndex}`);
          const istirahatCell = worksheet.getCell(`C${rowIndex}`);
          istirahatCell.value = "ISTIRAHAT (09:20 - 09:50)";
          istirahatCell.style = {
            font: { bold: true, color: { argb: "FF92400E" } },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFFBEB" },
            },
            alignment: { horizontal: "center" },
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
          };
          rowIndex++;
        }
      });

      // Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Jadwal_Kelas_${classId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess("File Excel berhasil diunduh");
    } catch (err) {
      setError("Gagal export Excel: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === FUNGSI IMPORT EXCEL ===
  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setImportMessage({
        type: "error",
        text: "Hanya file Excel (.xlsx, .xls) yang didukung",
      });
      return;
    }

    setImportLoading(true);
    setImportMessage({ type: "", text: "" });

    try {
      const data = await readExcelFile(file);
      await processExcelData(data);

      setImportMessage({
        type: "success",
        text: `Berhasil import ${data.length} jadwal`,
      });
      fetchSchedules();
      event.target.value = "";
    } catch (error) {
      setImportMessage({
        type: "error",
        text: error.message || "Gagal import file",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = new ExcelJS.Workbook();
          workbook.xlsx.load(data).then((workbook) => {
            const worksheet = workbook.getWorksheet(1);
            const jsonData = [];

            worksheet.eachRow((row, rowNumber) => {
              if (rowNumber >= 6) {
                // Skip header
                const rowData = {
                  period: row.getCell(1).value,
                  time: row.getCell(2).value,
                  senin: row.getCell(3).value,
                  selasa: row.getCell(4).value,
                  rabu: row.getCell(5).value,
                  kamis: row.getCell(6).value,
                  jumat: row.getCell(7).value,
                };
                if (rowData.period && rowData.time) {
                  jsonData.push(rowData);
                }
              }
            });
            resolve(jsonData);
          });
        } catch (err) {
          reject(new Error("Format file Excel tidak valid"));
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const processExcelData = async (excelData) => {
    const schedulesToInsert = [];

    // Hapus semua jadwal lama
    const { error: deleteError } = await supabase
      .from("class_schedules")
      .delete()
      .eq("class_id", classId);

    if (deleteError) throw deleteError;

    // Process each row
    for (const row of excelData) {
      const period = row.period.toString();
      const timeRange = JAM_SCHEDULE.Senin[period];
      if (!timeRange) continue;

      days.forEach((day, index) => {
        const subject = row[day.toLowerCase()];
        if (subject && SUBJECTS.includes(subject)) {
          schedulesToInsert.push({
            day: day,
            start_time: timeRange.start,
            end_time: timeRange.end,
            subject: subject,
            class_id: classId,
            teacher_id: currentUser.id,
          });
        }
      });
    }

    // Insert ke database
    if (schedulesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("class_schedules")
        .insert(schedulesToInsert);

      if (insertError) throw insertError;
    }

    return schedulesToInsert;
  };

  // === FUNGSI LAINNYA ===
  const generateScheduleGrid = () => {
    const grid = {};
    days.forEach((day) => {
      grid[day] = {};
      const daySchedule = JAM_SCHEDULE[day];
      if (daySchedule) {
        Object.keys(daySchedule).forEach((period) => {
          grid[day][period] = null;
        });
      }
      schedules
        .filter((schedule) => schedule.day === day)
        .forEach((schedule) => {
          const periods = findPeriodsByTimeRange(
            day,
            schedule.start_time,
            schedule.end_time
          );
          periods.forEach((period) => {
            grid[day][period] = schedule;
          });
        });
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
    return periods;
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      setSuccess(
        `Jadwal ${formData.subject} berhasil ${
          editingId ? "diperbarui" : "ditambahkan"
        }`
      );
      handleCloseModal();
      fetchSchedules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Gagal menyimpan jadwal: ${err.message}`);
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

  // === JSX ===
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-7 h-7 text-indigo-600" />
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

        {/* Action Buttons */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 min-w-[140px] px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border transition-all ${
                viewMode === "grid"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}>
              <LayoutGrid className="w-5 h-5" />
              Tampilan Grid
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 min-w-[140px] px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border transition-all ${
                viewMode === "list"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}>
              <List className="w-5 h-5" />
              Tampilan List
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="flex-1 min-w-[140px] bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border border-indigo-700 transition-all">
              <Plus className="w-5 h-5" />
              Tambah Jadwal
            </button>

            {/* TOMBOL EXPORT */}
            <button
              onClick={handleExportExcel}
              disabled={loading || schedules.length === 0}
              className="flex-1 min-w-[140px] bg-slate-100 hover:bg-slate-200 disabled:bg-gray-100 disabled:text-gray-400 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border border-slate-300 transition-all">
              <Download className="w-5 h-5" />
              {loading ? "Exporting..." : "Export Excel"}
            </button>

            {/* TOMBOL IMPORT */}
            <label className="flex-1 min-w-[140px] bg-slate-100 hover:bg-slate-200 cursor-pointer text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border border-slate-300 transition-all">
              <Upload className="w-5 h-5" />
              {importLoading ? "Importing..." : "Import Excel"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportExcel}
                disabled={importLoading}
              />
            </label>
          </div>

          {/* Import Message */}
          {importMessage.text && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                importMessage.type === "error"
                  ? "bg-red-50 border border-red-200 text-red-800"
                  : "bg-green-50 border border-green-200 text-green-800"
              }`}>
              <div className="flex items-center gap-2">
                {importMessage.type === "error" ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{importMessage.text}</span>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
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

        {/* Schedule View - GRID */}
        {viewMode === "grid" ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                Jadwal Pelajaran Kelas {currentUser?.kelas || "-"} (Tampilan
                Grid)
              </h2>
            </div>

            {loading && schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                Memuat jadwal...
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="mb-2">Belum ada jadwal</p>
                <p className="text-sm">Klik "Tambah Jadwal" untuk memulai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-red-600 text-white">
                      <th className="p-4 border border-slate-600 text-center font-semibold">
                        JAM KE
                      </th>
                      <th className="p-4 border border-slate-600 text-center font-semibold">
                        WAKTU
                      </th>
                      {days.map((day) => (
                        <th
                          key={day}
                          className="p-4 border border-slate-600 text-center font-semibold">
                          {day.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(JAM_SCHEDULE.Senin || {}).map(
                      ([period, time]) => (
                        <tr key={period} className="hover:bg-slate-50">
                          <td className="p-3 border border-slate-300 text-center font-semibold bg-slate-100">
                            {period}
                          </td>
                          <td className="p-3 border border-slate-300 text-center text-sm bg-slate-100">
                            {time.start} - {time.end}
                          </td>
                          {days.map((day) => {
                            const pagiActivity = getPagiActivity(day, period);
                            return (
                              <td
                                key={day}
                                className="p-3 border border-slate-300 text-center">
                                {scheduleGrid[day] &&
                                scheduleGrid[day][period] ? (
                                  <div className="relative group">
                                    <span className="font-bold text-slate-800 text-sm">
                                      {scheduleGrid[day][period].subject}
                                    </span>
                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex gap-1">
                                      <button
                                        onClick={() =>
                                          handleOpenModal(
                                            scheduleGrid[day][period]
                                          )
                                        }
                                        className="text-blue-600 hover:text-blue-700 p-1">
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDelete(
                                            scheduleGrid[day][period].id
                                          )
                                        }
                                        className="text-red-600 hover:text-red-700 p-1">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : pagiActivity ? (
                                  <span className="font-bold text-slate-800 italic text-xs">
                                    {pagiActivity}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <p className="text-sm md:text-base text-slate-600 text-center font-bold">
                    NB: Jadwal ini sebagai contoh perhitungan jumlah JP setiap
                    mata pelajarannya setiap minggunya. Silahkan sesuaikan
                    dengan sekolah masing-masing.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Schedule View - LIST */
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                Jadwal Pelajaran Kelas {currentUser?.kelas || "-"} (Tampilan
                List)
              </h2>
            </div>

            {loading && schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                Memuat jadwal...
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="mb-2">Belum ada jadwal</p>
                <p className="text-sm">Klik "Tambah Jadwal" untuk memulai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Hari
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Jam Ke
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Waktu
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Mata Pelajaran
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => {
                      const daySchedules = schedules.filter(
                        (s) => s.day === day
                      );
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
                            className="border-b border-slate-200 hover:bg-slate-50">
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
                              {schedule.start_time} - {schedule.end_time}
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
            )}
          </div>
        )}

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
                  className="text-slate-400 hover:text-slate-600">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Pilih Mata Pelajaran</option>
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Info Waktu:</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      {formData.day}:{" "}
                      {
                        JAM_SCHEDULE[formData.day]?.[formData.start_period]
                          ?.start
                      }{" "}
                      - {JAM_SCHEDULE[formData.day]?.[formData.end_period]?.end}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 rounded-lg font-medium">
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium flex items-center justify-center gap-2">
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
    </div>
  );
};

export default TeacherSchedule;
