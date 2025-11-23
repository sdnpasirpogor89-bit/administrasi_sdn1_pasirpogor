// AttendanceExport.js - COMPLETE FILE WITH SEMESTER EXPORT ✅
import ExcelJS from "exceljs";

/**
 * Export attendance data to Excel with professional formatting (MONTHLY)
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

    const uniqueDates = [
      ...new Set(attendanceRecords.map((record) => record.tanggal)),
    ]
      .sort()
      .map((date) => {
        const [year, month, day] = date.split("-");
        return `${day}-${month}`;
      });

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
    const dateCols = uniqueDates.length;
    const summaryCols = 6;
    const totalCols = baseCols + dateCols + summaryCols;

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

    const headerRow = 6;
    let colIndex = 1;

    worksheet.getCell(headerRow, colIndex++).value = "No.";
    worksheet.getCell(headerRow, colIndex++).value = "Nama Siswa";

    const dateStartCol = colIndex;
    uniqueDates.forEach((date) => {
      worksheet.getCell(headerRow, colIndex++).value = date;
    });

    worksheet.getCell(headerRow, colIndex++).value = "Hadir";
    worksheet.getCell(headerRow, colIndex++).value = "Izin";
    worksheet.getCell(headerRow, colIndex++).value = "Sakit";
    worksheet.getCell(headerRow, colIndex++).value = "Alpa";
    worksheet.getCell(headerRow, colIndex++).value = "Total";
    worksheet.getCell(headerRow, colIndex++).value = "Persentase";

    const headerRowObj = worksheet.getRow(headerRow);
    headerRowObj.height = 25;
    for (let col = 1; col <= totalCols; col++) {
      const cell = worksheet.getCell(headerRow, col);
      cell.font = { name: "Arial", size: 10, bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6E6" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }

    let rowIndex = headerRow + 1;
    studentsData.forEach((student, index) => {
      const studentData = studentMatrix[student.nisn];
      let colIndex = 1;

      worksheet.getCell(rowIndex, colIndex++).value = index + 1;
      worksheet.getCell(rowIndex, colIndex++).value = studentData.name;

      uniqueDates.forEach((date) => {
        const status = studentData.dates[date] || "";
        worksheet.getCell(rowIndex, colIndex++).value = status;
      });

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
          if (cell.value === "H") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFD4F1D4" },
            };
          } else if (cell.value === "S") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFF4CD" },
            };
          } else if (cell.value === "I") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFCDE4FF" },
            };
          } else if (cell.value === "A") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFD4D4" },
            };
          }
        } else {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      }

      rowIndex++;
    });

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

    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 35;

    for (let i = 0; i < dateCols; i++) {
      worksheet.getColumn(dateStartCol + i).width = 6;
    }

    const summaryStartCol = dateStartCol + dateCols;
    worksheet.getColumn(summaryStartCol).width = 8;
    worksheet.getColumn(summaryStartCol + 1).width = 8;
    worksheet.getColumn(summaryStartCol + 2).width = 8;
    worksheet.getColumn(summaryStartCol + 3).width = 8;
    worksheet.getColumn(summaryStartCol + 4).width = 8;
    worksheet.getColumn(summaryStartCol + 5).width = 12;

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
  namaSekolah = "SD NEGERI 1 PASIRPOGOR", // ✅ DEFAULT VALUE
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

    // ✅ ADD: SCHOOL NAME HEADER (sama seperti bulanan)
    worksheet.mergeCells(1, 1, 1, totalCols);
    const schoolCell = worksheet.getCell(1, 1);
    schoolCell.value = namaSekolah;
    schoolCell.font = { name: "Arial", size: 14, bold: true };
    schoolCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 25;

    // ✅ UPDATE: Title row menjadi row 2
    worksheet.mergeCells(2, 1, 2, totalCols);
    const titleCell = worksheet.getCell(2, 1);
    titleCell.value = `Rekap Presensi - Kelas ${kelas}`;
    titleCell.font = { name: "Arial", size: 12, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 20;

    // ✅ UPDATE: Subtitle row menjadi row 3
    worksheet.mergeCells(3, 1, 3, totalCols);
    const subtitleCell = worksheet.getCell(3, 1);
    subtitleCell.value = `Laporan Kehadiran Siswa Semester ${semesterText} ${tahun}`;
    subtitleCell.font = { name: "Arial", size: 11 };
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(3).height = 20;

    worksheet.getRow(4).height = 15;

    // ✅ UPDATE: Header row menjadi row 5
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
 * REPLACE function exportSemesterRecapFromComponent di AttendanceExport.js
 */
export const exportSemesterRecapFromComponent = async (
  supabase,
  activeClass,
  semester,
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

    // Convert year to number
    const yearNum = parseInt(year);
    const semesterType = semester === 1 ? "Ganjil" : "Genap";
    const academicYear =
      semester === 1
        ? `${yearNum}/${yearNum + 1}`
        : `${yearNum - 1}/${yearNum}`;

    const months = semester === 1 ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];

    console.log("=== EXPORT SEMESTER DATA ===");
    console.log(
      "Kelas:",
      activeClass,
      "Academic Year:",
      academicYear,
      "Semester:",
      semesterType,
      "Months:",
      months
    );

    // ✅ FIX: FETCH DENGAN PAGINATION (sama seperti di handleRekapRefresh)
    console.log("🔍 Fetching semester data with pagination for export...");

    let allRecords = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("kelas", activeClass)
        .eq("tahun_ajaran", academicYear)
        .order("tanggal", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error("❌ Query error on page", page + 1, ":", error);
        throw error;
      }

      if (data && data.length > 0) {
        allRecords = [...allRecords, ...data];
        console.log(
          `📄 Export Page ${page + 1}: ${data.length} records (Total so far: ${
            allRecords.length
          })`
        );

        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    const attendanceData = allRecords;
    console.log("✅ Total data fetched for export:", attendanceData.length);

    if (!attendanceData || attendanceData.length === 0) {
      return {
        success: false,
        message: "Tidak ada data kehadiran untuk semester yang dipilih",
      };
    }

    // Filter by month
    console.log("=== FILTER BULAN ===");
    const filteredData = attendanceData.filter((r) => {
      const parts = r.tanggal.split("-");
      const month = parseInt(parts[1], 10);
      return months.includes(month);
    });

    console.log("Data setelah filter bulan:", filteredData.length);

    // Hitung hari efektif
    const uniqueDates = [...new Set(filteredData.map((r) => r.tanggal))];
    const totalHariEfektif = uniqueDates.length;
    console.log("🎯 HARI EFEKTIF untuk export:", totalHariEfektif);

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
