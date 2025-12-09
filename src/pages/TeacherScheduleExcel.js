//[file name]: TeacherScheduleExcel.js
import React, { useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { Download, Upload, AlertCircle, CheckCircle } from "lucide-react";
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
  "PABP",
  "PJOK",
];

const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

// 🔥 REVISI: Component sekarang return DIV dengan dua button sejajar
const TeacherScheduleExcel = ({ schedules, className, user, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const currentUser = user || {};
  const classId = currentUser?.kelas || "5";

  // Helper functions
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
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

  // Export Excel
  const handleExportExcel = async () => {
    if (schedules.length === 0) {
      setMessage({
        type: "error",
        text: "Tidak ada data jadwal untuk di-export",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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

      setMessage({ type: "success", text: "File Excel berhasil diunduh" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Gagal export Excel: " + err.message });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Import Excel
  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setMessage({
        type: "error",
        text: "Hanya file Excel (.xlsx, .xls) yang didukung",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

    setImportLoading(true);
    try {
      const data = await readExcelFile(file);
      await processExcelData(data);

      setMessage({
        type: "success",
        text: `Berhasil import ${data.length} jadwal`,
      });

      if (onRefresh) onRefresh();
      event.target.value = "";
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Gagal import file",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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
              if (rowNumber >= 7) {
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
    const skipped = [];

    // 🔥 Subject mapping untuk handle berbagai format
    const subjectMap = {
      PJOK: "PJOK",
      MATEMATIKA: "Matematika",
      IPAS: "IPAS",
      "PEND. PANCASILA": "Pendidikan Pancasila",
      "PENDIDIKAN PANCASILA": "Pendidikan Pancasila",
      "BAHASA INDONESIA": "Bahasa Indonesia",
      "BAHASA INGGRIS": "Bahasa Inggris",
      "BAHASA SUNDA": "Bahasa Sunda",
      "SENI BUDAYA": "Seni Budaya",
      "PENDIDIKAN AGAMA ISLAM": "Pendidikan Agama Islam",
      PAI: "Pendidikan Agama Islam",
      PAPB: "Pendidikan Agama Islam", // Asumsi PAPB = PAI
    };

    // Normalize subject name
    const normalizeSubject = (rawSubject) => {
      if (!rawSubject) return null;

      const normalized = rawSubject.toString().trim().toUpperCase();

      // Cek exact match di map
      if (subjectMap[normalized]) {
        return subjectMap[normalized];
      }

      // Cek case-insensitive match di SUBJECTS
      const found = SUBJECTS.find((s) => s.toUpperCase() === normalized);

      return found || null;
    };

    const { error: deleteError } = await supabase
      .from("class_schedules")
      .delete()
      .eq("class_id", classId);

    if (deleteError) throw deleteError;

    for (const row of excelData) {
      const period = row.period.toString();
      const timeRange = JAM_SCHEDULE.Senin[period];
      if (!timeRange) {
        console.warn(`⚠️ Period ${period} tidak ditemukan di JAM_SCHEDULE`);
        continue;
      }

      days.forEach((day) => {
        const rawSubject = row[day.toLowerCase()];
        const normalizedSubject = normalizeSubject(rawSubject);

        if (normalizedSubject) {
          schedulesToInsert.push({
            day: day,
            start_time: timeRange.start,
            end_time: timeRange.end,
            subject: normalizedSubject,
            class_id: classId,
            teacher_id: currentUser.id,
          });
        } else if (rawSubject && rawSubject.toString().trim()) {
          // Ada subject tapi ga recognized
          skipped.push({
            day,
            period,
            subject: rawSubject,
          });
        }
      });
    }

    // Log skipped items
    if (skipped.length > 0) {
      console.warn("⚠️ Data yang di-skip (subject tidak dikenali):", skipped);
    }

    if (schedulesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("class_schedules")
        .insert(schedulesToInsert);

      if (insertError) throw insertError;
    }

    console.log(`✅ Berhasil import ${schedulesToInsert.length} jadwal`);
    if (skipped.length > 0) {
      console.warn(`⚠️ ${skipped.length} jadwal di-skip`);
    }

    return schedulesToInsert;
  };

  // 🔥 REVISI RENDER: Kembalikan DIV dengan dua button dalam flex row
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Export Button */}
      <button
        onClick={handleExportExcel}
        disabled={loading || schedules.length === 0}
        className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border border-green-700 dark:border-green-600 transition-all text-sm sm:text-base">
        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">
          {loading ? "Exporting..." : "Export Excel"}
        </span>
        <span className="sm:hidden">{loading ? "..." : "Export"}</span>
      </button>

      {/* Import Button */}
      <label className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer text-white px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center border border-blue-700 dark:border-blue-600 transition-all text-sm sm:text-base">
        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">
          {importLoading ? "Importing..." : "Import Excel"}
        </span>
        <span className="sm:hidden">{importLoading ? "..." : "Import"}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImportExcel}
          disabled={importLoading}
        />
      </label>

      {/* Message Toast */}
      {message.text && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              message.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
                : "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300"
            }`}>
            <div className="flex items-center gap-2">
              {message.type === "error" ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherScheduleExcel;
