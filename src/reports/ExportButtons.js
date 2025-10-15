import React, { useState } from "react";
import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";

// Import autoTable separately untuk menghindari issue
let autoTable;
try {
  autoTable = require("jspdf-autotable");
} catch (error) {
  console.warn("jspdf-autotable not available, using fallback");
}

const ExportButtons = ({
  data = [],
  type,
  filters = {},
  stats = {},
  loading = false,
}) => {
  const [exporting, setExporting] = useState(null);

  // School information
  const schoolInfo = {
    name: "SDN 1 PASIRPOGOR",
    fullName: "Sekolah Dasar Negeri 1 Pasirpogor",
    address: "Kp. Bojongloa RT 03 RW 02 Ds. Pasirpogor",
    district: "Kec. Sindangkerta Kab. Bandung Barat 40563",
    logoPath: "/logo_sekolah.png",
  };

  // Helper: Format tanggal
  const formatDate = (date) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return date || "";
    }
  };

  // Helper: Get report title
  const getReportTitle = () => {
    const titles = {
      students: "LAPORAN DATA SISWA",
      grades: "LAPORAN NILAI SISWA",
      attendance: "LAPORAN PRESENSI SISWA",
      teachers: "LAPORAN AKTIVITAS GURU",
    };
    return titles[type] || "LAPORAN";
  };

  // Helper: Get filter info text
  const getFilterInfo = () => {
    const info = [];
    if (filters.kelas) info.push(`Kelas: ${filters.kelas}`);
    if (filters.mapel) info.push(`Mata Pelajaran: ${filters.mapel}`);
    if (filters.periode) info.push(`Periode: ${filters.periode}`);
    if (filters.dateRange?.start) {
      info.push(
        `Tanggal: ${formatDate(filters.dateRange.start)} - ${formatDate(
          filters.dateRange.end
        )}`
      );
    }
    return info.join(" | ");
  };

  // Helper: Get columns based on type
  const getColumns = () => {
    switch (type) {
      case "students":
        return [
          { header: "No", key: "no", width: 6, align: "center" },
          { header: "NISN", key: "nisn", width: 13, align: "center" },
          { header: "Nama Siswa", key: "nama_siswa", width: 35, align: "left" },
          {
            header: "Jenis Kelamin",
            key: "jenis_kelamin",
            width: 18,
            align: "center",
          },
          { header: "Kelas", key: "kelas", width: 10, align: "center" },
          { header: "Status", key: "is_active", width: 12, align: "center" },
        ];
      case "grades":
        return [
          { header: "No", key: "no", width: 6, align: "center" },
          { header: "NISN", key: "nisn", width: 13, align: "center" },
          { header: "Nama Siswa", key: "nama_siswa", width: 35, align: "left" },
          { header: "Kelas", key: "kelas", width: 10, align: "center" },
          {
            header: "Mata Pelajaran",
            key: "mata_pelajaran",
            width: 20,
            align: "left",
          },
          {
            header: "Jenis Nilai",
            key: "jenis_nilai",
            width: 15,
            align: "center",
          },
          { header: "Nilai", key: "nilai", width: 8, align: "center" },
        ];
      case "attendance":
        return [
          { header: "No", key: "no", width: 6, align: "center" },
          { header: "Tanggal", key: "tanggal", width: 12, align: "center" },
          { header: "NISN", key: "nisn", width: 13, align: "center" },
          { header: "Nama Siswa", key: "nama_siswa", width: 35, align: "left" },
          { header: "Kelas", key: "kelas", width: 10, align: "center" },
          { header: "Status", key: "status", width: 12, align: "center" },
          { header: "Keterangan", key: "keterangan", width: 20, align: "left" },
        ];
      case "teachers":
        return [
          { header: "No", key: "no", width: 6, align: "center" },
          { header: "Nama Guru", key: "full_name", width: 20, align: "left" },
          { header: "Role", key: "role", width: 15, align: "center" },
          { header: "Kelas", key: "kelas", width: 8, align: "center" },
          {
            header: "Mata Pelajaran",
            key: "mata_pelajaran",
            width: 20,
            align: "left",
          },
          {
            header: "Total Input",
            key: "total_input",
            width: 12,
            align: "center",
          },
        ];
      default:
        return [];
    }
  };

  // Helper: Format data for export
  const formatDataForExport = () => {
    const columns = getColumns();

    // Validasi data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((row, index) => {
      const formatted = { no: index + 1 };
      columns.forEach((col) => {
        if (col.key === "no") return;

        let value = row[col.key];

        // Format khusus
        if (col.key === "is_active") {
          value = value ? "Aktif" : "Tidak Aktif";
        } else if (col.key === "tanggal") {
          value = formatDate(value);
        } else if (col.key === "jenis_kelamin") {
          // PERBAIKAN: Cek semua kemungkinan format
          if (value === "L" || value === "Laki-laki" || value === "laki-laki") {
            value = "Laki-laki";
          } else if (
            value === "P" ||
            value === "Perempuan" ||
            value === "perempuan"
          ) {
            value = "Perempuan";
          } else {
            value = value || "-";
          }
        } else if (col.key === "status") {
          value = value === "Alfa" ? "Alpa" : value;
        } else if (col.key === "nilai") {
          value = value ? parseFloat(value).toFixed(1) : "-";
        }

        formatted[col.key] = value || "-";
      });
      return formatted;
    });
  };

  // **ENHANCED: Export to PDF dengan Template Professional**
  const exportToPDF = async () => {
    setExporting("pdf");

    try {
      // Validasi data dulu
      const formattedData = formatDataForExport();
      if (!formattedData || formattedData.length === 0) {
        alert("Tidak ada data untuk di-export");
        setExporting(null);
        return;
      }

      const columns = getColumns();

      // Create PDF document - Portrait untuk format laporan
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // **PROFESSIONAL TEMPLATE DENGAN LOGO**
      let currentY = 20;

      // Try to add logo
      try {
        const img = new Image();
        img.src = schoolInfo.logoPath;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Add logo (50x50px)
        doc.addImage(img, "PNG", 20, currentY, 15, 15);
        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text(schoolInfo.name, 40, currentY + 8);

        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(schoolInfo.fullName, 40, currentY + 14);
        doc.text(schoolInfo.address, 40, currentY + 19);
        doc.text(schoolInfo.district, 40, currentY + 24);

        currentY += 35;
      } catch (error) {
        console.warn("Logo tidak bisa dimuat, menggunakan fallback text");
        // Fallback tanpa logo
        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text(schoolInfo.name, pageWidth / 2, currentY, { align: "center" });

        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(schoolInfo.fullName, pageWidth / 2, currentY + 6, {
          align: "center",
        });
        doc.text(schoolInfo.address, pageWidth / 2, currentY + 11, {
          align: "center",
        });
        doc.text(schoolInfo.district, pageWidth / 2, currentY + 16, {
          align: "center",
        });

        currentY += 25;
      }

      // Garis pemisah
      doc.setDrawColor(200, 200, 200);
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 10;

      // Judul Laporan
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(getReportTitle(), pageWidth / 2, currentY, { align: "center" });
      currentY += 7;

      // Filter Info
      const filterInfo = getFilterInfo();
      if (filterInfo) {
        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.text(filterInfo, pageWidth / 2, currentY, { align: "center" });
        currentY += 5;
      }

      // Tanggal cetak
      doc.text(`Dicetak: ${formatDate(new Date())}`, pageWidth / 2, currentY, {
        align: "center",
      });
      currentY += 10;

      // **STATISTICS BOX - PROFESSIONAL**
      if (stats && Object.keys(stats).length > 0) {
        const statsWidth = 80;
        const statsX = (pageWidth - statsWidth) / 2;

        // Box background
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(statsX, currentY, statsWidth, 25, 3, 3, "F");

        // Box border
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.roundedRect(statsX, currentY, statsWidth, 25, 3, 3);

        // Title
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.text("STATISTIK", pageWidth / 2, currentY + 6, { align: "center" });

        // Stats content
        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        let statsY = currentY + 12;

        Object.entries(stats)
          .slice(0, 3)
          .forEach(([key, value]) => {
            const label = key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
            doc.text(`${label}:`, statsX + 5, statsY);
            doc.text(value.toString(), statsX + statsWidth - 15, statsY, {
              align: "right",
            });
            statsY += 4;
          });

        currentY += 35;
      } else {
        currentY += 5;
      }

      // **FIXED: PROFESSIONAL TABLE DENGAN AUTOTABLE - IMPROVED COLUMN WIDTHS**
      if (autoTable && typeof autoTable === "function") {
        // Calculate better column widths based on content
        const calculateColumnWidths = () => {
          const availableWidth = pageWidth - 40; // 20mm margin each side
          const totalWeight = columns.reduce(
            (sum, col) => sum + (col.width || 15),
            0
          );

          return columns.map((col) => {
            const weight = col.width || 15;
            return (weight / totalWeight) * availableWidth;
          });
        };

        const columnStyles = {};
        const columnWidths = calculateColumnWidths();

        columns.forEach((col, index) => {
          columnStyles[index] = {
            cellWidth: columnWidths[index],
            minCellHeight: 8,
            fontStyle: index === 0 ? "bold" : "normal",
            halign: col.align || "left",
            valign: "middle",
          };
        });

        autoTable(doc, {
          startY: currentY,
          head: [columns.map((col) => col.header)],
          body: formattedData.map((row) =>
            columns.map((col) => row[col.key] || "")
          ),
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: "bold",
            lineWidth: 0.1,
            halign: "center",
            valign: "middle",
          },
          bodyStyles: {
            lineWidth: 0.1,
            valign: "middle",
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250],
          },
          columnStyles: columnStyles,
          margin: { left: 20, right: 20 },
          tableLineColor: [0, 0, 0],
          tableLineWidth: 0.1,
          didDrawPage: function (data) {
            // Header will be automatically drawn by autoTable
          },
        });
      } else {
        // **FIXED: FALLBACK MANUAL TABLE - IMPROVED LAYOUT**
        doc.setFontSize(8);

        // Calculate dynamic column widths based on content
        const calculateColumnWidths = () => {
          const availableWidth = pageWidth - 40;
          const totalWeight = columns.reduce(
            (sum, col) => sum + (col.width || 15),
            0
          );

          return columns.map((col) => {
            const weight = col.width || 15;
            return (weight / totalWeight) * availableWidth;
          });
        };

        const colWidths = calculateColumnWidths();
        let xPosition = 20;

        // **FIXED: TABLE HEADER - PASTI KELUAR**
        doc.setFillColor(59, 130, 246);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, "bold");

        // Draw header background
        doc.rect(20, currentY, pageWidth - 40, 8, "F");

        // Draw header text for each column
        columns.forEach((col, index) => {
          const textX = xPosition + colWidths[index] / 2;
          doc.text(col.header, textX, currentY + 5, { align: "center" });
          xPosition += colWidths[index];
        });

        currentY += 8;
        xPosition = 20;

        // **FIXED: TABLE DATA - BETTER COLUMN WIDTHS**
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, "normal");

        formattedData.forEach((row, rowIndex) => {
          // Check if need new page
          if (currentY > pageHeight - 20) {
            doc.addPage();
            currentY = 20;

            // Redraw header on new page
            doc.setFillColor(59, 130, 246);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, "bold");
            doc.rect(20, currentY, pageWidth - 40, 8, "F");

            let headerX = 20;
            columns.forEach((col, index) => {
              const textX = headerX + colWidths[index] / 2;
              doc.text(col.header, textX, currentY + 5, { align: "center" });
              headerX += colWidths[index];
            });

            currentY += 8;
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, "normal");
          }

          // Alternate row color
          if (rowIndex % 2 === 0) {
            doc.setFillColor(245, 247, 250);
            doc.rect(20, currentY, pageWidth - 40, 8, "F");
          }

          // Draw row data
          columns.forEach((col, colIndex) => {
            const value = String(row[col.key] || "");
            const align =
              col.align === "center"
                ? "center"
                : col.align === "right"
                ? "right"
                : "left";

            let textX;
            if (align === "center") {
              textX = xPosition + colWidths[colIndex] / 2;
            } else if (align === "right") {
              textX = xPosition + colWidths[colIndex] - 2;
            } else {
              textX = xPosition + 2;
            }

            doc.text(value, textX, currentY + 5, { align: align });
            xPosition += colWidths[colIndex];
          });

          currentY += 8;
          xPosition = 20;
        });
      }

      // Footer dengan page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `Laporan_${getReportTitle().replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Export PDF gagal. Silakan coba lagi.");
    } finally {
      setExporting(null);
    }
  };

  // **ENHANCED: Export to Excel dengan ExcelJS & Professional Styling**
  const exportToExcel = async () => {
    setExporting("excel");
    try {
      const formattedData = formatDataForExport();

      if (!formattedData || formattedData.length === 0) {
        alert("Tidak ada data untuk di-export");
        setExporting(null);
        return;
      }

      const columns = getColumns();

      // Create workbook dengan ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Sistem Informasi Sekolah";
      workbook.lastModifiedBy = "Sistem Informasi Sekolah";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Create worksheet
      const worksheet = workbook.addWorksheet("Laporan");
      let currentRow = 1; // DEFINE currentRow di sini

      // School Header - Merged Cells
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const schoolTitleRow = worksheet.getRow(currentRow);
      schoolTitleRow.getCell(1).value = "SEKOLAH DASAR NEGERI 1 PASIRPOGOR";
      schoolTitleRow.getCell(1).font = {
        name: "Arial",
        size: 16,
        bold: true,
        color: { argb: "FF2D3748" },
      };
      schoolTitleRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      schoolTitleRow.height = 25;
      currentRow++;

      // **PERUBAHAN 1: ALAMAT SATU BARIS**
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const addressRow = worksheet.getRow(currentRow);
      addressRow.getCell(1).value =
        "Kp. Bojongloa RT 03 RW 02 Ds. Pasirpogor Kec. Sindangkerta Kab. Bandung Barat 40563";
      addressRow.getCell(1).font = {
        name: "Arial",
        size: 12,
        color: { argb: "FF718096" },
      };
      addressRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      currentRow += 2;

      // Report Title - Merged Cells
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const reportTitleRow = worksheet.getRow(currentRow);
      reportTitleRow.getCell(1).value = "LAPORAN DATA SISWA KELAS 5";
      reportTitleRow.getCell(1).font = {
        name: "Arial",
        size: 14,
        bold: true,
        color: { argb: "FF2B6CB0" },
      };
      reportTitleRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      reportTitleRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEBF8FF" },
      };
      reportTitleRow.getCell(1).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      reportTitleRow.height = 30;
      currentRow++;

      // Filter Info
      const filterInfo = getFilterInfo();
      if (filterInfo) {
        worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
        const filterRow = worksheet.getRow(currentRow);
        filterRow.getCell(1).value = filterInfo;
        filterRow.getCell(1).font = {
          name: "Arial",
          size: 9,
          italic: true,
          color: { argb: "FF718096" },
        };
        filterRow.getCell(1).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        currentRow++;
      }

      // Print Date
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const dateRow = worksheet.getRow(currentRow);
      dateRow.getCell(1).value = `Dicetak: ${formatDate(new Date())}`;
      dateRow.getCell(1).font = {
        name: "Arial",
        size: 9,
        color: { argb: "FF718096" },
      };
      dateRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      currentRow += 2;

      // **PROFESSIONAL TABLE HEADER**
      const headerRow = worksheet.getRow(currentRow);
      columns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = col.header;
        cell.font = {
          name: "Arial",
          size: 10,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2B6CB0" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: col.align || "left",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF2D3748" } },
          left: { style: "thin", color: { argb: "FF2D3748" } },
          bottom: { style: "thin", color: { argb: "FF2D3748" } },
          right: { style: "thin", color: { argb: "FF2D3748" } },
        };
      });
      headerRow.height = 25;
      currentRow++;

      // **TABLE DATA**
      formattedData.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(currentRow);

        columns.forEach((col, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          cell.value = row[col.key];

          // Styling untuk data
          cell.font = {
            name: "Arial",
            size: 9,
            color: { argb: "FF2D3748" },
          };

          // Alternating row colors
          if (rowIndex % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF7FAFC" },
            };
          }

          cell.alignment = {
            vertical: "middle",
            horizontal: col.align || "left",
            wrapText: true,
          };

          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };

          // Number formatting untuk nilai
          if (col.key === "nilai" && row[col.key] !== "-") {
            cell.numFmt = "0.0";
          }

          // Text format untuk NISN (biar 10 digit tetap utuh)
          if (col.key === "nisn") {
            cell.numFmt = "@";
          }
        });

        dataRow.height = 20;
        currentRow++;
      });

      // Set column widths
      worksheet.columns = columns.map((col) => ({
        width: col.width || 15,
      }));

      currentRow += 2;

      // **PERUBAHAN 3: STATISTIK FORMAT SEDERHANA**
      const totalSiswa = formattedData.length;
      const lakiLaki = formattedData.filter(
        (s) => s.jenis_kelamin === "Laki-laki"
      ).length;
      const perempuan = formattedData.filter(
        (s) => s.jenis_kelamin === "Perempuan"
      ).length;
      const persentaseLakiLaki =
        totalSiswa > 0
          ? ((lakiLaki / totalSiswa) * 100).toFixed(1).replace(".", ",")
          : "0";
      const persentasePerempuan =
        totalSiswa > 0
          ? ((perempuan / totalSiswa) * 100).toFixed(1).replace(".", ",")
          : "0";

      // Statistics Data Sederhana
      const statsData = [
        ["Jumlah Siswa", totalSiswa],
        ["Laki Laki", lakiLaki],
        ["Perempuan", perempuan],
        ["PersentaseLakiLaki", persentaseLakiLaki],
        ["PersentasePerempuan", persentasePerempuan],
      ];

      statsData.forEach(([label, value], index) => {
        const labelCell = worksheet.getCell(`A${currentRow}`);
        labelCell.value = label;
        labelCell.font = {
          name: "Arial",
          size: 9,
          color: { argb: "FF4A5568" },
        };

        const valueCell = worksheet.getCell(`B${currentRow}`);
        valueCell.value = value;
        valueCell.font = {
          name: "Arial",
          size: 9,
          bold: true,
          color: { argb: "FF2B6CB0" },
        };

        currentRow++;
      });

      // Save Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Data_Siswa_Kelas_5_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Gagal export Excel. Silakan coba lagi.");
    } finally {
      setExporting(null);
    }
  };

  // Print - Tetap sama (sudah cukup baik)
  const handlePrint = () => {
    setExporting("print");
    try {
      const printWindow = window.open("", "_blank");
      const columns = getColumns();
      const formattedData = formatDataForExport();

      if (!formattedData || formattedData.length === 0) {
        alert("Tidak ada data untuk di-print");
        setExporting(null);
        return;
      }

      const filterInfo = getFilterInfo();

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${getReportTitle()}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 10px;
            }
            .header h2 {
              margin: 5px 0;
              color: #1f2937;
            }
            .header h3 {
              margin: 5px 0;
              color: #374151;
            }
            .filter-info {
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 10px;
            }
            .stats {
              margin: 20px 0;
              padding: 15px;
              background: #f8fafc;
              border-radius: 6px;
              border-left: 4px solid #3b82f6;
            }
            .stats h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #1f2937;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 10px;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px 6px;
              text-align: left;
            }
            th {
              background-color: #3b82f6;
              color: white;
              font-weight: bold;
              text-align: center;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            td:first-child {
              text-align: center;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 10px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
            }
            @media print {
              body {
                padding: 15px;
              }
              .no-print {
                display: none;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SISTEM INFORMASI SEKOLAH</h2>
            <h3>${getReportTitle()}</h3>
            <div class="filter-info">
              ${filterInfo ? filterInfo : ""}
              <br>
              Dicetak: ${formatDate(new Date())}
            </div>
          </div>
          
          ${
            stats && Object.keys(stats).length > 0
              ? `
            <div class="stats">
              <h3>Statistik</h3>
              <div class="stats-grid">
                ${Object.entries(stats)
                  .map(([key, value]) => {
                    const label = key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase());
                    return `<div><strong>${label}:</strong> ${value}</div>`;
                  })
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
          
          <table>
            <thead>
              <tr>
                ${columns.map((col) => `<th>${col.header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${formattedData
                .map(
                  (row) => `
                <tr>
                  ${columns.map((col) => `<td>${row[col.key]}</td>`).join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="footer">
            Generated by Sistem Informasi Sekolah • ${formatDate(new Date())}
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (error) {
      console.error("Error printing:", error);
      alert("Gagal print. Silakan coba lagi.");
    } finally {
      setExporting(null);
    }
  };

  // Disable saat loading atau exporting
  const isDisabled = loading || exporting || !data || data.length === 0;

  return (
    <div className="flex gap-2">
      {/* Export PDF Button */}
      <button
        onClick={exportToPDF}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${
            isDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg"
          }
        `}>
        <FileDown className="w-4 h-4" />
        <span>{exporting === "pdf" ? "Exporting..." : "Export PDF"}</span>
      </button>

      {/* Export Excel Button */}
      <button
        onClick={exportToExcel}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${
            isDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg"
          }
        `}>
        <FileSpreadsheet className="w-4 h-4" />
        <span>{exporting === "excel" ? "Exporting..." : "Export Excel"}</span>
      </button>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${
            isDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
          }
        `}>
        <Printer className="w-4 h-4" />
        <span>{exporting === "print" ? "Printing..." : "Print"}</span>
      </button>
    </div>
  );
};

export default ExportButtons;