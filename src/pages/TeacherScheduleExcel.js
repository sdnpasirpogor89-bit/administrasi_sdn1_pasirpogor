import React from 'react'; // <-- PENTING: Import React
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";

// HARI dan JAM_SCHEDULE di-define di TeacherSchedule.js, tapi 
// karena ini adalah file terpisah, kita harus memastikan definisi
// ini ada di sini atau di-import. Karena Anda tidak meng-export
// JAM_SCHEDULE dari TeacherSchedule.js, saya ulangi definisinya 
// di sini agar fungsi createWorkbook bekerja.

const JAM_SCHEDULE = {
  Senin: {
    1: { start: "07:00", end: "08:00" },
    2: { start: "08:00", end: "08:40" },
    3: { start: "08:40", end: "09:20" },
    4: { start: "09:20", end: "10:00" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Selasa: {
    1: { start: "07:00", end: "08:00" },
    2: { start: "08:00", end: "08:40" },
    3: { start: "08:40", end: "09:20" },
    4: { start: "09:20", end: "10:00" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Rabu: {
    1: { start: "07:00", end: "08:00" },
    2: { start: "08:00", end: "08:40" },
    3: { start: "08:40", end: "09:20" },
    4: { start: "09:20", end: "10:00" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Kamis: {
    1: { start: "07:00", end: "08:00" },
    2: { start: "08:00", end: "08:40" },
    3: { start: "08:40", end: "09:20" },
    4: { start: "09:20", end: "10:00" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Jumat: {
    1: { start: "07:00", end: "08:00" },
    2: { start: "08:00", end: "08:40" },
    3: { start: "08:40", end: "09:20" },
    4: { start: "09:20", end: "10:00" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
  },
};
const HARI = Object.keys(JAM_SCHEDULE);
const JAM_KE = Object.keys(JAM_SCHEDULE.Senin);

// Fungsi utilitas di TeacherScheduleExcel:
const _getTeacherName = (id, teachers) => {
    const teacher = teachers.find((t) => t.id === id);
    return teacher ? teacher.full_name : "N/A";
};

// Fungsi inti untuk membuat Excel
const createWorkbook = async (schedules, teachers, classes) => {
  const workbook = new ExcelJS.Workbook();

  // Sort kelas secara numerik (Kelas 1, Kelas 2, ...)
  const sortedClasses = [...classes].sort((a, b) => parseInt(a.id) - parseInt(b.id));

  for (const cls of sortedClasses) {
    const classId = cls.id;
    const className = cls.name;
    const worksheet = workbook.addWorksheet(`Kelas ${classId}`);

    // Header 1: Jadwal Pelajaran Kelas X
    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = `JADWAL PELAJARAN ${className}`;
    worksheet.getCell('A1').style = { 
        font: { name: 'Arial', bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } } // Indigo-900
    };
    worksheet.getRow(1).height = 30;

    // Header 2: Hari dan Jam
    const headerRow = worksheet.getRow(2);
    headerRow.height = 40;
    headerRow.values = ['JAM KE', 'WAKTU', ...HARI];
    
    // Styling Header
    headerRow.eachCell((cell, colNumber) => {
        cell.style = {
            font: { name: 'Arial', bold: true, size: 10 },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } } // Blue-100
        };
    });

    // Lebar Kolom
    worksheet.columns = [
      { key: 'jam_ke', width: 10 }, // JAM KE
      { key: 'waktu', width: 15 }, // WAKTU
      ...HARI.map(() => ({ width: 25 })) // Kolom Hari
    ];


    // Data Baris
    let rowIndex = 3;
    JAM_KE.forEach((hour) => {
      const daySchedule = JAM_SCHEDULE.Senin; // Asumsi Jam di hari Senin mewakili semua hari
      const jamInfo = daySchedule[hour];
      
      const isBreak = hour === '4' && jamInfo.end === '10:00'; // Asumsi Istirahat setelah jam 4
      const isJumatEmpty = (hour === '7' || hour === '8' || hour === '9') && JAM_SCHEDULE.Jumat[hour] === undefined;
      
      const rowData = [
          hour, 
          `${jamInfo.start}-${jamInfo.end}`, 
      ];
      
      // Merge Cell untuk Istirahat
      if (isBreak) {
          const startCell = worksheet.getCell(`C${rowIndex}`);
          const endCell = worksheet.getCell(`J${rowIndex}`);
          worksheet.mergeCells(startCell.row, startCell.col, endCell.row, endCell.col);
          startCell.value = "ISTIRAHAT";
          startCell.style = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { bold: true, color: { argb: 'FF9A3412' } }, // Amber-800
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEA' } } // Amber-100
          };
          
          // Apply border ke semua cell yang di merge
          for (let j = 3; j <= 9; j++) {
              worksheet.getCell(rowIndex, j).border = { 
                  top: { style: 'thin' }, left: { style: 'thin' }, 
                  bottom: { style: 'thin' }, right: { style: 'thin' } 
              };
          }

          worksheet.getRow(rowIndex).values = rowData;
          rowIndex++;
          return; // Lanjut ke jam berikutnya
      }

      HARI.forEach((day, dayIndex) => {
        // Cek apakah hari dan jam tersebut ada jadwalnya untuk kelas ini
        const item = schedules.find(
          (s) => s.day === day && s.hour === hour && s.class_id.toString() === classId.toString()
        );

        if (isJumatEmpty && day === 'Jumat') {
            rowData.push('PULANG / KOSONG');
        } else if (item) {
          const teacherName = _getTeacherName(item.teacher_id, teachers);
          rowData.push(`${item.subject}\n(${teacherName})`);
        } else {
          rowData.push('KOSONG');
        }
      });
      
      worksheet.getRow(rowIndex).values = rowData;
      
      // Styling cell data
      worksheet.getRow(rowIndex).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.style = {
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
        };
        // Styling kolom pertama (JAM KE)
        if (colNumber === 1) {
             cell.style.fill.fgColor.argb = 'FFE0F2F1'; // Teal-50
             cell.font = { bold: true };
        }
        // Styling kolom kedua (WAKTU)
        if (colNumber === 2) {
             cell.style.fill.fgColor.argb = 'FFE0F7FA'; // Cyan-50
        }
        // Styling KOSONG
        if (cell.value === 'KOSONG' || cell.value === 'PULANG / KOSONG') {
            cell.style.fill.fgColor.argb = 'FFF3F4F6'; // Gray-100
            cell.font = { color: { argb: 'FF9CA3AF' } }; // Gray-400
        }
      });
      
      worksheet.getRow(rowIndex).height = 50;
      rowIndex++;
    });
  }

  // Buat Buffer dan Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Jadwal_Pelajaran_Semua_Kelas_${new Date().toLocaleDateString('id-ID').replace(/\//g, '_')}.xlsx`);
};

// ==========================================================
// INI ADALAH KOMPONEN REACT YANG BENAR
// ==========================================================

const TeacherScheduleExcel = ({ scheduleData, teachers, classes }) => {
  const [loading, setLoading] = React.useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await createWorkbook(scheduleData, teachers, classes);
    } catch (error) {
      console.error("Gagal membuat atau mengunduh Excel:", error);
      alert("Gagal mengunduh file Excel.");
    } finally {
      setLoading(false);
    }
  };

  // Komponen harus mengembalikan JSX (tombol)
  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:bg-blue-400"
      title="Download Jadwal">
      {loading ? (
          <>
            <Download size={20} className="animate-pulse" />
            <span className="hidden sm:inline">Membuat...</span>
          </>
      ) : (
          <>
            <Download size={20} />
            <span className="hidden sm:inline">Export Excel</span>
          </>
      )}
    </button>
  );
};

// Pastikan ini adalah default export agar import di TeacherSchedule.js berhasil
export default TeacherScheduleExcel;