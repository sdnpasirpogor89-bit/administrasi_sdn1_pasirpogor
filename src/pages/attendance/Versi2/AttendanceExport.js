// AttendanceExport.js - FIXED DUPLICATE FUNCTION
import ExcelJS from "exceljs";
import { supabase } from "../../supabaseClient";
import { filterBySemester } from "../../services/academicYearService";

// ========================================
// 🗓️ LIBUR NASIONAL 2025-2026
// ========================================
const nationalHolidays = {
  // 2025
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

  // 2026
  "2026-01-01": "Tahun Baru Masehi",
  "2026-01-16": "Isra Mi’raj Nabi Muhammad SAW",
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

// Helper: Check if date is national holiday
const isNationalHoliday = (dateStr) => {
  return nationalHolidays[dateStr] || null;
};

// Helper: Check if day is weekend (Saturday = 6, Sunday = 0)
const isWeekend = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

// 🔥 FIXED: Lowercase comparison for status
const getStatusLabel = (status) => {
  const normalizedStatus = status?.toLowerCase();

  const labels = {
    hadir: "H",
    izin: "I",
    sakit: "S",
    alpa: "A",
    alpha: "A",
  };

  return labels[normalizedStatus] || "-";
};

/**
 * Export attendance data to Excel with professional formatting (MONTHLY)
 * WITH GURU-STYLE DATE COLUMNS (weekend/holiday marked)
 */
export const exportAttendanceToExcel = async ({
  kelas,
  bulan,
  tahun,
  studentsData,
  attendanceRecords,
  namaSekolah = "SD NEGERI 1 PASIRPOGOR",
  supabase,
  namaGuru = "",
}) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Rekap Kelas ${kelas}`);

    const monthNames = [
      "",
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
    const monthName = monthNames[parseInt(bulan)];

    // Get days in month
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Build student matrix
    const studentMatrix = {};

    studentsData.forEach((student) => {
      studentMatrix[student.nisn] = {
        name: student.nama_siswa,
        dates: {},
        summary: { hadir: 0, sakit: 0, izin: 0, alpa: 0 },
      };
    });

    attendanceRecords.forEach((record) => {
      if (studentMatrix[record.nisn]) {
        const dateKey = record.tanggal.split("-").slice(1).reverse().join("-");

        let statusCode = "H";
        if (record.status === "Sakit") statusCode = "S";
        else if (record.status === "Izin") statusCode = "I";
        else if (record.status === "Alpa") statusCode = "A";

        studentMatrix[record.nisn].dates[dateKey] = statusCode;

        if (record.status === "Hadir")
          studentMatrix[record.nisn].summary.hadir++;
        else if (record.status === "Sakit")
          studentMatrix[record.nisn].summary.sakit++;
        else if (record.status === "Izin")
          studentMatrix[record.nisn].summary.izin++;
        else if (record.status === "Alpa")
          studentMatrix[record.nisn].summary.alpa++;
      }
    });

    const baseCols = 2;
    const dateCols = daysInMonth;
    const summaryCols = 6;
    const totalCols = baseCols + dateCols + summaryCols;

    // ===== HEADERS =====
    worksheet.mergeCells(1, 1, 1, totalCols);
    const schoolCell = worksheet.getCell(1, 1);
    schoolCell.value = namaSekolah;
    schoolCell.font = { name: "Arial", size: 14, bold: true };
    schoolCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 25;

    worksheet.mergeCells(2, 1, 2, totalCols);
    const titleCell = worksheet.getCell(2, 1);
    titleCell.value = `REKAP BULANAN DAFTAR HADIR SISWA KELAS ${kelas}`;
    titleCell.font = { name: "Arial", size: 12, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 20;

    worksheet.mergeCells(3, 1, 3, totalCols);
    const monthCell = worksheet.getCell(3, 1);
    monthCell.value = `BULAN : ${monthName} ${tahun}`;
    monthCell.font = { name: "Arial", size: 11, bold: true };
    monthCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(3).height = 20;

    worksheet.getRow(4).height = 15;
    worksheet.getRow(5).height = 15;

    // ===== TABLE HEADER (WITH GURU-STYLE DATE COLUMNS) =====
    const headerRow = 6;
    let colIndex = 1;

    worksheet.getCell(headerRow, colIndex++).value = "No.";
    worksheet.getCell(headerRow, colIndex++).value = "Nama Siswa";

    // DATE COLUMNS (1, 2, 3, ...) - SAME AS GURU
    const dateStartCol = colIndex;
    days.forEach((day) => {
      worksheet.getCell(headerRow, colIndex++).value = day;
    });

    worksheet.getCell(headerRow, colIndex++).value = "Hadir";
    worksheet.getCell(headerRow, colIndex++).value = "Izin";
    worksheet.getCell(headerRow, colIndex++).value = "Sakit";
    worksheet.getCell(headerRow, colIndex++).value = "Alpa";
    worksheet.getCell(headerRow, colIndex++).value = "Total";
    worksheet.getCell(headerRow, colIndex++).value = "Persentase";

    // STYLE HEADER ROW (WITH WEEKEND/HOLIDAY COLORS)
    const headerRowObj = worksheet.getRow(headerRow);
    headerRowObj.height = 25;

    for (let col = 1; col <= totalCols; col++) {
      const cell = worksheet.getCell(headerRow, col);
      cell.font = { name: "Arial", size: 10, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // DATE COLUMNS: Apply weekend/holiday colors
      if (col >= dateStartCol && col < dateStartCol + dateCols) {
        const day = col - dateStartCol + 1;
        const dateStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
        const weekend = isWeekend(tahun, bulan, day);
        const holiday = isNationalHoliday(dateStr);

        if (holiday) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFF6B6B" }, // Red for holiday
          };
          cell.font = { ...cell.font, color: { argb: "FFFFFFFF" } };
        } else if (weekend) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFB0B0B0" }, // Gray for weekend
          };
          cell.font = { ...cell.font, color: { argb: "FFFFFFFF" } };
        } else {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" }, // Blue for regular days
          };
          cell.font = { ...cell.font, color: { argb: "FFFFFFFF" } };
        }
      } else {
        // NON-DATE COLUMNS
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" }, // Blue
        };
        cell.font = { ...cell.font, color: { argb: "FFFFFFFF" } };
      }
    }

    // ===== DATA ROWS =====
    let rowIndex = headerRow + 1;
    studentsData.forEach((student, index) => {
      const studentData = studentMatrix[student.nisn];
      let colIndex = 1;

      worksheet.getCell(rowIndex, colIndex++).value = index + 1;
      worksheet.getCell(rowIndex, colIndex++).value = studentData.name;

      // DATE CELLS (with weekend/holiday detection)
      days.forEach((day) => {
        const dateKey = `${String(day).padStart(2, "0")}-${String(
          bulan
        ).padStart(2, "0")}`;
        const status = studentData.dates[dateKey] || "";

        const dateStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
        const weekend = isWeekend(tahun, bulan, day);
        const holiday = isNationalHoliday(dateStr);

        let displayStatus = status;
        if (weekend) displayStatus = "L";
        if (holiday) displayStatus = "🎉";

        worksheet.getCell(rowIndex, colIndex++).value = displayStatus;
      });

      // SUMMARY COLUMNS
      const summary = studentData.summary;
      worksheet.getCell(rowIndex, colIndex++).value = summary.hadir;
      worksheet.getCell(rowIndex, colIndex++).value = summary.izin;
      worksheet.getCell(rowIndex, colIndex++).value = summary.sakit;
      worksheet.getCell(rowIndex, colIndex++).value = summary.alpa;

      const total = summary.hadir + summary.izin + summary.sakit + summary.alpa;
      worksheet.getCell(rowIndex, colIndex++).value = total;

      const percentage =
        total > 0 ? Math.round((summary.hadir / total) * 100) : 100;
      worksheet.getCell(rowIndex, colIndex++).value = `${percentage}%`;

      // STYLE DATA ROW
      const rowObj = worksheet.getRow(rowIndex);
      rowObj.height = 20;

      for (let col = 1; col <= totalCols; col++) {
        const cell = worksheet.getCell(rowIndex, col);
        cell.font = { name: "Arial", size: 9 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (col === 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (col === 2) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else if (col >= dateStartCol && col < dateStartCol + dateCols) {
          cell.alignment = { horizontal: "center", vertical: "middle" };

          const day = col - dateStartCol + 1;
          const dateStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;
          const weekend = isWeekend(tahun, bulan, day);
          const holiday = isNationalHoliday(dateStr);
          const value = cell.value;

          // WEEKEND/HOLIDAY STYLING (SAME AS GURU)
          if (weekend) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFD3D3D3" }, // Light gray
            };
            cell.font = { bold: true, color: { argb: "FF666666" } };
          } else if (holiday) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFCCCC" }, // Light red/pink
            };
            cell.font = { bold: true, color: { argb: "FFCC0000" } };
          } else if (value === "H") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFC6EFCE" }, // HIJAU MUDA (soft green)
            };
            cell.font = { bold: true, color: { argb: "FF007F00" } }; // teks hijau tua
          } else if (value === "I") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFDDEBF7" }, // BIRU MUDA
            };
            cell.font = { bold: true, color: { argb: "FF2E75B5" } };
          } else if (value === "S") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFF2CC" }, // KUNING MUDA
            };
            cell.font = { bold: true, color: { argb: "FFBF9000" } };
          } else if (value === "A") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2DCDB" }, // MERAH MUDA
            };
            cell.font = { bold: true, color: { argb: "FFC00000" } };
          }
        } else {
          // KOLOM SUMMARY (Hadir, Izin, Sakit, Alpa, Total, Persentase)
          cell.alignment = { horizontal: "center", vertical: "middle" };

          // Bold untuk kolom summary
          if (col >= dateStartCol + dateCols) {
            cell.font = { bold: true };
          }
        }
      }

      rowIndex++;
    });

    // ===== LEGEND (SAME AS GURU) =====
    rowIndex += 2;
    worksheet.mergeCells(rowIndex, 1, rowIndex, 3);
    worksheet.getCell(rowIndex, 1).value = "Keterangan:";
    worksheet.getCell(rowIndex, 1).font = { bold: true };
    rowIndex++;

    const legends = [
      ["H", "Hadir"],
      ["I", "Izin"],
      ["S", "Sakit"],
      ["A", "Alpha"],
      ["-", "Belum Absen"],
      ["L", "Libur (Weekend)"],
      ["🎉", "Libur Nasional"],
    ];

    legends.forEach(([code, label]) => {
      worksheet.getCell(rowIndex, 1).value = code;
      worksheet.getCell(rowIndex, 2).value = label;
      worksheet.getCell(rowIndex, 1).alignment = { horizontal: "center" };
      worksheet.getCell(rowIndex, 1).font = { bold: true };
      rowIndex++;
    });

    // ===== FOOTER =====
    rowIndex += 2;
    const footerCol = totalCols - 2;

    worksheet.getCell(rowIndex, footerCol).value = "Mengetahui";
    worksheet.getCell(rowIndex, footerCol).font = { name: "Arial", size: 11 };
    worksheet.getCell(rowIndex, footerCol).alignment = { horizontal: "left" };

    worksheet.getCell(rowIndex + 1, footerCol).value = `Walikelas ${kelas}`;
    worksheet.getCell(rowIndex + 1, footerCol).font = {
      name: "Arial",
      size: 11,
    };
    worksheet.getCell(rowIndex + 1, footerCol).alignment = {
      horizontal: "left",
    };

    worksheet.getRow(rowIndex + 2).height = 25;

    if (namaGuru) {
      worksheet.getCell(rowIndex + 3, footerCol).value = namaGuru;
      worksheet.getCell(rowIndex + 3, footerCol).font = {
        name: "Arial",
        size: 11,
        bold: true,
      };
      worksheet.getCell(rowIndex + 3, footerCol).alignment = {
        horizontal: "left",
      };

      worksheet.getCell(rowIndex + 4, footerCol).value = "___________________";
      worksheet.getCell(rowIndex + 4, footerCol).font = {
        name: "Arial",
        size: 9,
      };
      worksheet.getCell(rowIndex + 4, footerCol).alignment = {
        horizontal: "left",
      };
    }

    // ===== COLUMN WIDTHS =====
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 35;

    for (let i = 0; i < dateCols; i++) {
      worksheet.getColumn(dateStartCol + i).width = 4; // Same as guru (narrow)
    }

    const summaryStartCol = dateStartCol + dateCols;
    worksheet.getColumn(summaryStartCol).width = 8;
    worksheet.getColumn(summaryStartCol + 1).width = 8;
    worksheet.getColumn(summaryStartCol + 2).width = 8;
    worksheet.getColumn(summaryStartCol + 3).width = 8;
    worksheet.getColumn(summaryStartCol + 4).width = 8;
    worksheet.getColumn(summaryStartCol + 5).width = 12;

    // ===== EXPORT =====
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Presensi_Kelas_${kelas}_${monthName}_${tahun}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "File Excel berhasil di-download!" };
  } catch (error) {
    console.error("Error creating Excel file:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
};

/**
 * Integration function for monthly export
 */
export const exportAttendanceFromComponent = async (
  supabase,
  activeClass,
  month,
  year,
  studentsData,
  currentUser = null
) => {
  try {
    const students = studentsData[activeClass] || [];

    if (students.length === 0) {
      return {
        success: false,
        message: "Tidak ada data siswa untuk kelas ini",
      };
    }

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = `${year}-${month.padStart(2, "0")}-${lastDayOfMonth
      .toString()
      .padStart(2, "0")}`;

    const { data: attendanceRecords, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("kelas", activeClass)
      .gte("tanggal", startDate)
      .lte("tanggal", endDate)
      .order("tanggal", { ascending: true });

    if (error) {
      throw error;
    }

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        success: false,
        message: "Tidak ada data kehadiran untuk periode yang dipilih",
      };
    }

    let namaGuru = "";
    if (currentUser && currentUser.full_name) {
      namaGuru = currentUser.full_name;
    } else if (currentUser && currentUser.username) {
      namaGuru = currentUser.username;
    } else if (attendanceRecords.length > 0) {
      namaGuru = attendanceRecords[0].guru_input || "";
    }

    const result = await exportAttendanceToExcel({
      kelas: activeClass,
      bulan: month,
      tahun: year,
      studentsData: students,
      attendanceRecords: attendanceRecords,
      supabase: supabase,
      namaGuru: namaGuru,
    });

    return result;
  } catch (error) {
    console.error("Error in exportAttendanceFromComponent:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
};

/**
 * Export semester attendance recap to Excel (SEMESTER) - UPDATED WITH SCHOOL NAME
 */
export const exportSemesterRecapToExcel = async ({
  kelas,
  semester,
  tahun,
  studentsData,
  attendanceRecords,
  namaSekolah = "SD NEGERI 1 PASIRPOGOR",
  namaGuru = "",
}) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      `Semester ${semester} Kelas ${kelas}`
    );

    const semesterText =
      semester === 1 ? "Ganjil (Juli-Desember)" : "Genap (Januari-Juni)";

    const studentMatrix = {};

    studentsData.forEach((student) => {
      studentMatrix[student.nisn] = {
        nisn: student.nisn,
        name: student.nama_siswa,
        summary: { hadir: 0, sakit: 0, izin: 0, alpa: 0 },
      };
    });

    attendanceRecords.forEach((record) => {
      if (studentMatrix[record.nisn]) {
        const summary = studentMatrix[record.nisn].summary;

        if (record.status === "Hadir") {
          summary.hadir++;
        } else if (record.status === "Sakit") {
          summary.sakit++;
        } else if (record.status === "Izin") {
          summary.izin++;
        } else if (record.status === "Alpa") {
          summary.alpa++;
        }
      }
    });

    const getCategory = (percentage) => {
      if (percentage >= 90) return "Sangat Baik";
      if (percentage >= 80) return "Baik";
      if (percentage >= 70) return "Cukup";
      return "Kurang";
    };

    const totalCols = 10;

    // SCHOOL NAME HEADER
    worksheet.mergeCells(1, 1, 1, totalCols);
    const schoolCell = worksheet.getCell(1, 1);
    schoolCell.value = namaSekolah;
    schoolCell.font = { name: "Arial", size: 14, bold: true };
    schoolCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 25;

    // Title row
    worksheet.mergeCells(2, 1, 2, totalCols);
    const titleCell = worksheet.getCell(2, 1);
    titleCell.value = `Rekap Presensi - Kelas ${kelas}`;
    titleCell.font = { name: "Arial", size: 12, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 20;

    // Subtitle row
    worksheet.mergeCells(3, 1, 3, totalCols);
    const subtitleCell = worksheet.getCell(3, 1);
    subtitleCell.value = `Laporan Kehadiran Siswa Semester ${semesterText} ${tahun}`;
    subtitleCell.font = { name: "Arial", size: 11 };
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(3).height = 20;

    worksheet.getRow(4).height = 15;

    // Header row
    const headerRow = 5;
    const headers = [
      "No",
      "NISN",
      "Nama Siswa",
      "Hadir",
      "Sakit",
      "Izin",
      "Alpa",
      "Total",
      "%",
      "Kategori",
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(headerRow, index + 1);
      cell.value = header;
      cell.font = {
        name: "Arial",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.getRow(headerRow).height = 25;

    let rowIndex = headerRow + 1;
    studentsData.forEach((student, index) => {
      const studentData = studentMatrix[student.nisn];
      const summary = studentData.summary;

      const total = summary.hadir + summary.sakit + summary.izin + summary.alpa;
      const percentage =
        total > 0 ? Math.round((summary.hadir / total) * 100) : 100;
      const category = getCategory(percentage);

      const rowData = [
        index + 1,
        studentData.nisn,
        studentData.name,
        summary.hadir,
        summary.sakit,
        summary.izin,
        summary.alpa,
        total,
        percentage,
        category,
      ];

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(rowIndex, colIndex + 1);
        cell.value = value;
        cell.font = { name: "Arial", size: 10 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colIndex === 0 || colIndex >= 3) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }

        if (colIndex === 9) {
          if (category === "Sangat Baik") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFC6EFCE" },
            };
          } else if (category === "Baik") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFF2CC" },
            };
          } else if (category === "Cukup") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFCE4D6" },
            };
          } else {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFC7CE" },
            };
          }
        }
      });

      worksheet.getRow(rowIndex).height = 20;
      rowIndex++;
    });

    rowIndex += 2;

    worksheet.getCell(rowIndex, 8).value = "Mengetahui";
    worksheet.getCell(rowIndex, 8).font = { name: "Arial", size: 11 };
    worksheet.getCell(rowIndex, 8).alignment = { horizontal: "left" };

    worksheet.getCell(rowIndex + 1, 8).value = `Walikelas ${kelas}`;
    worksheet.getCell(rowIndex + 1, 8).font = { name: "Arial", size: 11 };
    worksheet.getCell(rowIndex + 1, 8).alignment = { horizontal: "left" };

    worksheet.getRow(rowIndex + 2).height = 30;

    if (namaGuru) {
      worksheet.getCell(rowIndex + 3, 8).value = namaGuru;
      worksheet.getCell(rowIndex + 3, 8).font = {
        name: "Arial",
        size: 11,
        bold: true,
        underline: true,
      };
      worksheet.getCell(rowIndex + 3, 8).alignment = { horizontal: "left" };
    }

    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 35;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 10;
    worksheet.getColumn(6).width = 10;
    worksheet.getColumn(7).width = 10;
    worksheet.getColumn(8).width = 10;
    worksheet.getColumn(9).width = 8;
    worksheet.getColumn(10).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Presensi_Semester_${semester}_Kelas_${kelas}_${tahun}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "File Excel semester berhasil di-download!",
    };
  } catch (error) {
    console.error("Error creating semester Excel file:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
};

/**
 * Integration function for semester export - FIXED WITH PAGINATION
 */
export const exportSemesterRecapFromComponent = async (
  supabase,
  activeClass,
  semester,
  year,
  studentsData,
  currentUser = null,
  semesterId = null
) => {
  try {
    console.log("📋 exportSemesterRecapFromComponent called:", {
      activeClass,
      semester,
      year,
      semesterId,
    });

    const students = studentsData[activeClass] || [];

    if (students.length === 0) {
      return {
        success: false,
        message: "Tidak ada data siswa untuk kelas ini",
      };
    }

    const yearNum = parseInt(year);
    const semesterType = semester === 1 ? "Ganjil" : "Genap";
    const academicYear =
      semester === 1
        ? `${yearNum}/${yearNum + 1}`
        : `${yearNum - 1}/${yearNum}`;

    const months = semester === 1 ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];

    // ✅ CALCULATE DATE RANGE for semester
    let startDate, endDate;
    if (semester === 1) {
      // Semester Ganjil: Juli-Desember tahun PERTAMA
      startDate = `${yearNum}-07-01`;
      endDate = `${yearNum}-12-31`;
    } else {
      // Semester Genap: Januari-Juni tahun KEDUA
      startDate = `${yearNum + 1}-01-01`;
      endDate = `${yearNum + 1}-06-30`;
    }

    console.log("📅 Date range for semester:", startDate, "to", endDate);

    // Fetch with pagination
    let allRecords = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from("attendance")
        .select("*")
        .eq("kelas", activeClass)
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .order("tanggal", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // ✅ ADD FILTER BY SEMESTER
      if (semesterId) {
        query = filterBySemester(query, semesterId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        allRecords = [...allRecords, ...data];
        if (data.length < pageSize) hasMore = false;
        else page++;
      } else {
        hasMore = false;
      }
    }

    console.log("📦 Attendance records fetched:", allRecords.length);

    const attendanceData = allRecords;

    if (!attendanceData || attendanceData.length === 0) {
      return {
        success: false,
        message: "Tidak ada data kehadiran untuk semester yang dipilih",
      };
    }

    // Filter by month
    const filteredData = attendanceData.filter((r) => {
      const parts = r.tanggal.split("-");
      const month = parseInt(parts[1], 10);
      return months.includes(month);
    });

    if (filteredData.length === 0) {
      return {
        success: false,
        message: "Tidak ada data kehadiran untuk semester yang dipilih",
      };
    }

    // Get teacher name
    let namaGuru = "";
    if (currentUser && currentUser.full_name) {
      namaGuru = currentUser.full_name;
    } else if (currentUser && currentUser.username) {
      namaGuru = currentUser.username;
    } else if (attendanceData.length > 0) {
      namaGuru = attendanceData[0].guru_input || "";
    }

    // Export to Excel
    const result = await exportSemesterRecapToExcel({
      kelas: activeClass,
      semester: semester,
      tahun: yearNum,
      studentsData: students,
      attendanceRecords: filteredData,
      namaSekolah: "SD NEGERI 1 PASIRPOGOR",
      namaGuru: namaGuru,
    });

    return result;
  } catch (error) {
    console.error("Error in exportSemesterRecapFromComponent:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
};

// ========================================
// NEW WRAPPER FUNCTIONS FOR SD
// ========================================

/**
 * Export Monthly Attendance - Wrapper untuk SD
 * @param {Array} students - Array of student objects
 * @param {string} selectedClass - Class number
 * @param {string} title - Report title
 * @param {Date} date - Date object
 * @param {Object} summary - Summary object (not used)
 * @param {Object} config - Config object (not used)
 * @param {Function} showToast - Toast function
 * @param {string} yearMonth - Format: "YYYY-MM"
 * @param {string} teacherName - Teacher name
 * @param {string} selectedClassNum - Class number
 * @param {string} semesterId - Semester ID
 * @param {string} academicYear - Format: "2025/2026"
 * @param {number} semesterNum - Semester number (1 or 2)
 */
export const exportMonthlyAttendanceSD = async (
  students,
  selectedClass,
  title,
  date,
  summary,
  config,
  showToast,
  yearMonth,
  teacherName,
  selectedClassNum,
  semesterId,
  academicYear,
  semesterNum
) => {
  try {
    const [year, month] = yearMonth.split("-");

    // Import supabase
    const { supabase } = await import("../../supabaseClient");

    // Fetch students data
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("*")
      .eq("kelas", parseInt(selectedClass))
      .eq("is_active", true)
      .order("nama_siswa", { ascending: true });

    if (studentsError) throw studentsError;

    // Create studentsData object for legacy function
    const studentsDataObj = {
      [selectedClass]: studentsData || [],
    };

    // Call legacy function
    return await exportAttendanceFromComponent(
      supabase,
      selectedClass,
      month,
      year,
      studentsDataObj,
      teacherName
    );
  } catch (error) {
    console.error("Error in exportMonthlyAttendanceSD:", error);
    if (showToast) {
      showToast("Gagal export: " + error.message, "error");
    }
    return { success: false, message: error.message };
  }
};

/**
 * Export Semester Recap - Wrapper untuk SD
 * @param {Array} students - Array of student objects
 * @param {string} selectedClass - Class number
 * @param {string} title - Report title
 * @param {Function} showToast - Toast function
 * @param {string} teacherName - Teacher name
 * @param {string} semesterId - Semester ID
 * @param {string} academicYear - Format: "2025/2026"
 * @param {number} semesterNum - Semester number (1 or 2)
 */
export const exportSemesterRecapSD = async (
  students,
  selectedClass,
  title,
  showToast,
  teacherName,
  semesterId,
  academicYear,
  semesterNum
) => {
  try {
    console.log("🚀 exportSemesterRecapSD called with:", {
      selectedClass,
      academicYear,
      semesterNum,
      teacherName,
      semesterId,
    });

    // Import supabase
    const { supabase } = await import("../../supabaseClient");

    console.log("📦 Fetching students for class:", selectedClass);

    // Fetch students data
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("*")
      .eq("kelas", parseInt(selectedClass))
      .eq("is_active", true)
      .order("nama_siswa", { ascending: true });

    if (studentsError) throw studentsError;

    console.log("✅ Students fetched:", studentsData?.length);

    // Create studentsData object for legacy function
    const studentsDataObj = {
      [selectedClass]: studentsData || [],
    };

    // Extract year from academicYear
    const yearNum = parseInt(academicYear.split("/")[0]);

    console.log("📞 Calling exportSemesterRecapFromComponent with:", {
      selectedClass,
      semesterNum,
      yearNum,
      semesterId,
    });

    // Call legacy function with semesterId
    const result = await exportSemesterRecapFromComponent(
      supabase,
      selectedClass,
      semesterNum,
      yearNum,
      studentsDataObj,
      teacherName,
      semesterId
    );

    console.log("✅ Export result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error in exportSemesterRecapSD:", error);
    if (showToast) {
      showToast("Gagal export: " + error.message, "error");
    }
    return { success: false, message: error.message };
  }
};
