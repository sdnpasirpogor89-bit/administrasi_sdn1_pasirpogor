import React, { useState } from "react";
import { 
  FileDown, 
  X, 
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  Users,
  UserCheck
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

const ExportCatatanSiswa = ({ 
  siswaList, 
  catatanList, 
  selectedSiswa,
  academicYear,
  semester,
  userData,
  currentView
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ringkasan");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterLabel, setFilterLabel] = useState("all");

  const availableKelas = [...new Set(siswaList.map(s => s.kelas))].sort();

  // ============ PDF GENERATOR ============
  const generatePDFRingkasan = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("SDN 1 PASIRPOGOR", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text(`TAHUN AJARAN ${academicYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`CATATAN SISWA KELAS ${userData.kelas || "SEMUA"}`, pageWidth / 2, 36, { align: "center" });

    const tableData = siswaList.map(siswa => [
      siswa.nama,
      siswa.nisn,
      siswa.kelas,
      siswa.positif,
      siswa.perhatian,
      siswa.catatanbiasa,
      siswa.lastUpdate
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Nama Siswa", "NISN", "Kelas", "Positif", "Perhatian", "Catatan Biasa", "Update Terakhir"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 15, halign: "center" },
        5: { cellWidth: 15, halign: "center" },
        6: { cellWidth: 30 }
      }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 150;
    doc.setFontSize(10);
    doc.text("Mengetahui,", 140, finalY);
    doc.text(`Guru Kelas ${userData.kelas || ""}`, 140, finalY + 6);
    doc.text(userData.full_name || userData.username, 140, finalY + 26);

    doc.save(`Ringkasan_Catatan_Kelas_${userData.kelas}_${academicYear}.pdf`);
  };

  const generatePDFDetail = () => {
    if (!selectedSiswa) {
      alert("Pilih siswa terlebih dahulu");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("SDN 1 PASIRPOGOR", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text(`TAHUN AJARAN ${academicYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`CATATAN SISWA KELAS ${selectedSiswa.kelas}`, pageWidth / 2, 36, { align: "center" });

    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text(`Nama: ${selectedSiswa.nama}`, 14, 50);
    doc.text(`NISN: ${selectedSiswa.nisn}`, 14, 56);
    doc.text(`Kelas: ${selectedSiswa.kelas}`, 14, 62);

    const tableData = catatanList.map(catatan => [
      new Date(catatan.created_at).toLocaleDateString("id-ID"),
      catatan.category,
      catatan.label === "positif" ? "Positif" : catatan.label === "perhatian" ? "Perhatian" : "Catatan Biasa",
      catatan.note_content,
      catatan.action_taken || "-"
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["Tanggal", "Kategori", "Label", "Catatan", "Tindakan"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 60 },
        4: { cellWidth: 50 }
      }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 150;
    doc.setFontSize(10);
    doc.text("Mengetahui,", 140, finalY);
    doc.text(`Guru Kelas ${selectedSiswa.kelas}`, 140, finalY + 6);
    doc.text(userData.full_name || userData.username, 140, finalY + 26);

    doc.save(`Detail_Catatan_${selectedSiswa.nama}_${academicYear}.pdf`);
  };

  const generatePDFCustom = () => {
    let filteredData = siswaList;
    if (filterKelas !== "all") {
      filteredData = filteredData.filter(s => s.kelas === filterKelas);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("SDN 1 PASIRPOGOR", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text(`TAHUN AJARAN ${academicYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`CATATAN SISWA (CUSTOM FILTER)`, pageWidth / 2, 36, { align: "center" });

    const tableData = filteredData.map(siswa => [
      siswa.nama,
      siswa.nisn,
      siswa.kelas,
      siswa.positif,
      siswa.perhatian,
      siswa.catatanbiasa
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Nama Siswa", "NISN", "Kelas", "Positif", "Perhatian", "Catatan Biasa"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      styles: { fontSize: 8 }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 150;
    doc.setFontSize(10);
    doc.text("Mengetahui,", 140, finalY);
    doc.text(`Guru Kelas ${userData.kelas || ""}`, 140, finalY + 6);
    doc.text(userData.full_name || userData.username, 140, finalY + 26);

    doc.save(`Custom_Export_${academicYear}.pdf`);
  };

  // ============ EXCEL GENERATOR ============
  const generateExcelRingkasan = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ringkasan");

    worksheet.mergeCells('A1:G1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = 'SDN 1 PASIRPOGOR';
    titleRow.font = { name: 'Arial', size: 16, bold: true };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    worksheet.mergeCells('A2:G2');
    const yearRow = worksheet.getCell('A2');
    yearRow.value = `TAHUN AJARAN ${academicYear}`;
    yearRow.font = { name: 'Arial', size: 12, bold: true };
    yearRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    worksheet.mergeCells('A3:G3');
    const classRow = worksheet.getCell('A3');
    classRow.value = `CATATAN SISWA KELAS ${userData.kelas || "SEMUA"}`;
    classRow.font = { name: 'Arial', size: 12, bold: true };
    classRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(3).height = 20;

    worksheet.addRow([]);
    
    const headerRow = worksheet.addRow(["Nama Siswa", "NISN", "Kelas", "Positif", "Perhatian", "Catatan Biasa", "Update Terakhir"]);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    siswaList.forEach((siswa, index) => {
      const row = worksheet.addRow([
        siswa.nama,
        siswa.nisn,
        siswa.kelas,
        siswa.positif,
        siswa.perhatian,
        siswa.catatanbiasa,
        siswa.lastUpdate
      ]);
      
      row.font = { name: 'Arial', size: 10 };
      row.alignment = { vertical: 'middle' };
      row.height = 20;
      
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
          };
        });
      }
      
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
      
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
    });

    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 12;
    worksheet.getColumn(4).width = 12;
    worksheet.getColumn(5).width = 12;
    worksheet.getColumn(6).width = 12;
    worksheet.getColumn(7).width = 18;

    const footerStartRow = worksheet.lastRow.number + 3;
    
    const mengetahuiCell = worksheet.getCell(`E${footerStartRow}`);
    mengetahuiCell.value = 'Mengetahui,';
    mengetahuiCell.font = { name: 'Arial', size: 10 };
    mengetahuiCell.alignment = { horizontal: 'center' };
    
    const guruKelasCell = worksheet.getCell(`E${footerStartRow + 1}`);
    guruKelasCell.value = `Guru Kelas ${userData.kelas || ""}`;
    guruKelasCell.font = { name: 'Arial', size: 10 };
    guruKelasCell.alignment = { horizontal: 'center' };
    
    const namaGuruCell = worksheet.getCell(`E${footerStartRow + 5}`);
    namaGuruCell.value = userData.full_name || userData.username;
    namaGuruCell.font = { name: 'Arial', size: 10, bold: true, underline: true };
    namaGuruCell.alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ringkasan_Catatan_Kelas_${userData.kelas}_${academicYear}.xlsx`;
    link.click();
  };

  const generateExcelDetail = async () => {
    if (!selectedSiswa) {
      alert("Pilih siswa terlebih dahulu");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Detail Siswa");

    worksheet.mergeCells('A1:E1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = 'SDN 1 PASIRPOGOR';
    titleRow.font = { name: 'Arial', size: 16, bold: true };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    worksheet.mergeCells('A2:E2');
    const yearRow = worksheet.getCell('A2');
    yearRow.value = `TAHUN AJARAN ${academicYear}`;
    yearRow.font = { name: 'Arial', size: 12, bold: true };
    yearRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    worksheet.mergeCells('A3:E3');
    const classRow = worksheet.getCell('A3');
    classRow.value = `CATATAN SISWA KELAS ${selectedSiswa.kelas}`;
    classRow.font = { name: 'Arial', size: 12, bold: true };
    classRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(3).height = 20;

    worksheet.addRow([]);

    const namaInfoRow = worksheet.addRow([`Nama: ${selectedSiswa.nama}`]);
    namaInfoRow.font = { name: 'Arial', size: 10, bold: true };
    namaInfoRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' }
    };
    namaInfoRow.getCell(1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    worksheet.mergeCells(`A${namaInfoRow.number}:E${namaInfoRow.number}`);

    const nisnInfoRow = worksheet.addRow([`NISN: ${selectedSiswa.nisn}`]);
    nisnInfoRow.font = { name: 'Arial', size: 10, bold: true };
    nisnInfoRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' }
    };
    nisnInfoRow.getCell(1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    worksheet.mergeCells(`A${nisnInfoRow.number}:E${nisnInfoRow.number}`);

    const kelasInfoRow = worksheet.addRow([`Kelas: ${selectedSiswa.kelas}`]);
    kelasInfoRow.font = { name: 'Arial', size: 10, bold: true };
    kelasInfoRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' }
    };
    kelasInfoRow.getCell(1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    worksheet.mergeCells(`A${kelasInfoRow.number}:E${kelasInfoRow.number}`);

    worksheet.addRow([]);
    
    const headerRow = worksheet.addRow(["Tanggal", "Kategori", "Label", "Catatan", "Tindakan"]);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    catatanList.forEach((catatan, index) => {
      const row = worksheet.addRow([
        new Date(catatan.created_at).toLocaleDateString("id-ID"),
        catatan.category,
        catatan.label === "positif" ? "Positif" : catatan.label === "perhatian" ? "Perhatian" : "Catatan Biasa",
        catatan.note_content,
        catatan.action_taken || "-"
      ]);
      
      row.font = { name: 'Arial', size: 10 };
      row.alignment = { vertical: 'middle', wrapText: true };
      row.height = 30;
      
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
          };
        });
      }
      
      const labelCell = row.getCell(3);
      if (catatan.label === "positif") {
        labelCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF059669' } };
      } else if (catatan.label === "perhatian") {
        labelCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFDC2626' } };
      }
      
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
    });

    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 45;
    worksheet.getColumn(5).width = 35;

    const footerStartRow = worksheet.lastRow.number + 3;
    
    const mengetahuiCell = worksheet.getCell(`E${footerStartRow}`);
    mengetahuiCell.value = 'Mengetahui,';
    mengetahuiCell.font = { name: 'Arial', size: 10 };
    mengetahuiCell.alignment = { horizontal: 'center' };
    
    const guruKelasCell = worksheet.getCell(`E${footerStartRow + 1}`);
    guruKelasCell.value = `Guru Kelas ${selectedSiswa.kelas}`;
    guruKelasCell.font = { name: 'Arial', size: 10 };
    guruKelasCell.alignment = { horizontal: 'center' };
    
    const namaGuruCell = worksheet.getCell(`E${footerStartRow + 5}`);
    namaGuruCell.value = userData.full_name || userData.username;
    namaGuruCell.font = { name: 'Arial', size: 10, bold: true, underline: true };
    namaGuruCell.alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Detail_Catatan_${selectedSiswa.nama}_${academicYear}.xlsx`;
    link.click();
  };

  const generateExcelCustom = async () => {
    let filteredData = siswaList;
    if (filterKelas !== "all") {
      filteredData = filteredData.filter(s => s.kelas === filterKelas);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Custom Export");

    worksheet.mergeCells('A1:F1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = 'SDN 1 PASIRPOGOR';
    titleRow.font = { name: 'Arial', size: 16, bold: true };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    worksheet.mergeCells('A2:F2');
    const yearRow = worksheet.getCell('A2');
    yearRow.value = `TAHUN AJARAN ${academicYear}`;
    yearRow.font = { name: 'Arial', size: 12, bold: true };
    yearRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    worksheet.mergeCells('A3:F3');
    const classRow = worksheet.getCell('A3');
    classRow.value = 'CATATAN SISWA (CUSTOM FILTER)';
    classRow.font = { name: 'Arial', size: 12, bold: true };
    classRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(3).height = 20;

    worksheet.addRow([]);
    
    const headerRow = worksheet.addRow(["Nama Siswa", "NISN", "Kelas", "Positif", "Perhatian", "Catatan Biasa"]);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    filteredData.forEach((siswa, index) => {
      const row = worksheet.addRow([
        siswa.nama,
        siswa.nisn,
        siswa.kelas,
        siswa.positif,
        siswa.perhatian,
        siswa.catatanbiasa
      ]);
      
      row.font = { name: 'Arial', size: 10 };
      row.alignment = { vertical: 'middle' };
      row.height = 20;
      
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
          };
        });
      }
      
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
      
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
    });

    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 12;
    worksheet.getColumn(4).width = 12;
    worksheet.getColumn(5).width = 12;
    worksheet.getColumn(6).width = 12;

    const footerStartRow = worksheet.lastRow.number + 3;
    
    const mengetahuiCell = worksheet.getCell(`E${footerStartRow}`);
    mengetahuiCell.value = 'Mengetahui,';
    mengetahuiCell.font = { name: 'Arial', size: 10 };
    mengetahuiCell.alignment = { horizontal: 'center' };
    
    const guruKelasCell = worksheet.getCell(`E${footerStartRow + 1}`);
    guruKelasCell.value = `Guru Kelas ${userData.kelas || ""}`;
    guruKelasCell.font = { name: 'Arial', size: 10 };
    guruKelasCell.alignment = { horizontal: 'center' };
    
    const namaGuruCell = worksheet.getCell(`E${footerStartRow + 5}`);
    namaGuruCell.value = userData.full_name || userData.username;
    namaGuruCell.font = { name: 'Arial', size: 10, bold: true, underline: true };
    namaGuruCell.alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Custom_Export_${academicYear}.xlsx`;
    link.click();
  };

  const handleExport = () => {
    if (exportFormat === "pdf") {
      if (activeTab === "ringkasan") generatePDFRingkasan();
      else if (activeTab === "detail") generatePDFDetail();
      else if (activeTab === "custom") generatePDFCustom();
    } else {
      if (activeTab === "ringkasan") generateExcelRingkasan();
      else if (activeTab === "detail") generateExcelDetail();
      else if (activeTab === "custom") generateExcelCustom();
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
      >
        <FileDown className="w-5 h-5" />
        Export Laporan
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-800">Export Laporan Catatan</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b bg-gray-50 px-6">
              <button
                onClick={() => setActiveTab("ringkasan")}
                className={`px-6 py-3 font-semibold flex items-center gap-2 ${
                  activeTab === "ringkasan"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Users className="w-4 h-4" />
                Ringkasan Kelas
              </button>
              <button
                onClick={() => setActiveTab("detail")}
                className={`px-6 py-3 font-semibold flex items-center gap-2 ${
                  activeTab === "detail"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Detail Siswa
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`px-6 py-3 font-semibold flex items-center gap-2 ${
                  activeTab === "custom"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Filter className="w-4 h-4" />
                Custom Filter
              </button>
            </div>

            <div className="p-6 space-y-6">
              {activeTab === "ringkasan" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Export Ringkasan Kelas</h3>
                  <p className="text-gray-600 mb-4">
                    Export daftar semua siswa dengan ringkasan jumlah catatan (Positif, Perhatian, Catatan Biasa)
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Data yang akan di-export:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Total {siswaList.length} siswa</li>
                      <li>• Kelas: {userData.kelas || "Semua Kelas"}</li>
                      <li>• Tahun Ajaran: {academicYear}</li>
                      <li>• Semester: {semester}</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "detail" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Export Detail Siswa</h3>
                  <p className="text-gray-600 mb-4">
                    Export timeline lengkap catatan untuk 1 siswa tertentu
                  </p>
                  {currentView === "detail" && selectedSiswa ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800">
                        <strong>Siswa terpilih:</strong>
                      </p>
                      <ul className="text-sm text-green-700 mt-2 space-y-1">
                        <li>• Nama: {selectedSiswa.nama}</li>
                        <li>• NISN: {selectedSiswa.nisn}</li>
                        <li>• Kelas: {selectedSiswa.kelas}</li>
                        <li>• Total Catatan: {catatanList.length}</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Silakan pilih siswa terlebih dahulu dari halaman detail
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "custom" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Export dengan Filter</h3>
                  <p className="text-gray-600 mb-4">
                    Pilih filter untuk export data yang lebih spesifik
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Filter Kelas
                      </label>
                      <select
                        value={filterKelas}
                        onChange={(e) => setFilterKelas(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="all">Semua Kelas</option>
                        {availableKelas.map(kelas => (
                          <option key={kelas} value={kelas}>{kelas}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Filter Label
                      </label>
                      <select
                        value={filterLabel}
                        onChange={(e) => setFilterLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="all">Semua Label</option>
                        <option value="positif">Positif</option>
                        <option value="perhatian">Perlu Perhatian</option>
                        <option value="catatanbiasa">Catatan Biasa</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-700">
                      <strong>Preview hasil filter:</strong> {
                        siswaList.filter(s => 
                          (filterKelas === "all" || s.kelas === filterKelas)
                        ).length
                      } siswa
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Format Export
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportFormat("pdf")}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 ${
                      exportFormat === "pdf"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <FileText className={`w-6 h-6 ${exportFormat === "pdf" ? "text-red-600" : "text-gray-600"}`} />
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">PDF</p>
                      <p className="text-xs text-gray-600">Format laporan formal</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportFormat("excel")}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 ${
                      exportFormat === "excel"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <FileSpreadsheet className={`w-6 h-6 ${exportFormat === "excel" ? "text-green-600" : "text-gray-600"}`} />
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">Excel</p>
                      <p className="text-xs text-gray-600">Untuk analisis data</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleExport}
                disabled={activeTab === "detail" && !selectedSiswa}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportCatatanSiswa;