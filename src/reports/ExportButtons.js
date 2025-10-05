import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ExportButtons = ({ data = [], type, filters = {}, stats = {}, loading = false }) => {
  const [exporting, setExporting] = useState(null);

  // Helper: Format tanggal
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper: Get report title
  const getReportTitle = () => {
    const titles = {
      students: 'Laporan Data Siswa',
      grades: 'Laporan Nilai Siswa',
      attendance: 'Laporan Presensi Siswa',
      teachers: 'Laporan Aktivitas Guru'
    };
    return titles[type] || 'Laporan';
  };

  // Helper: Get filter info text
  const getFilterInfo = () => {
    const info = [];
    if (filters.kelas) info.push(`Kelas: ${filters.kelas}`);
    if (filters.mapel) info.push(`Mapel: ${filters.mapel}`);
    if (filters.periode) info.push(`Periode: ${filters.periode}`);
    if (filters.dateRange?.start) {
      info.push(`Tanggal: ${formatDate(filters.dateRange.start)} - ${formatDate(filters.dateRange.end)}`);
    }
    return info.join(' | ');
  };

  // Helper: Get columns based on type
  const getColumns = () => {
    switch (type) {
      case 'students':
        return [
          { header: 'No', key: 'no' },
          { header: 'NISN', key: 'nisn' },
          { header: 'Nama Siswa', key: 'nama_siswa' },
          { header: 'Jenis Kelamin', key: 'jenis_kelamin' },
          { header: 'Kelas', key: 'kelas' },
          { header: 'Status', key: 'is_active' }
        ];
      case 'grades':
        return [
          { header: 'No', key: 'no' },
          { header: 'NISN', key: 'nisn' },
          { header: 'Nama Siswa', key: 'nama_siswa' },
          { header: 'Kelas', key: 'kelas' },
          { header: 'Mata Pelajaran', key: 'mata_pelajaran' },
          { header: 'Jenis Nilai', key: 'jenis_nilai' },
          { header: 'Nilai', key: 'nilai' }
        ];
      case 'attendance':
        return [
          { header: 'No', key: 'no' },
          { header: 'Tanggal', key: 'tanggal' },
          { header: 'NISN', key: 'nisn' },
          { header: 'Nama Siswa', key: 'nama_siswa' },
          { header: 'Kelas', key: 'kelas' },
          { header: 'Status', key: 'status' },
          { header: 'Keterangan', key: 'keterangan' }
        ];
      case 'teachers':
        return [
          { header: 'No', key: 'no' },
          { header: 'Nama Guru', key: 'full_name' },
          { header: 'Role', key: 'role' },
          { header: 'Kelas', key: 'kelas' },
          { header: 'Mata Pelajaran', key: 'mata_pelajaran' },
          { header: 'Total Input', key: 'total_input' }
        ];
      default:
        return [];
    }
  };

  // Helper: Format data for export
  const formatDataForExport = () => {
    const columns = getColumns();
    return data.map((row, index) => {
      const formatted = { no: index + 1 };
      columns.forEach(col => {
        if (col.key === 'no') return;
        
        let value = row[col.key];
        
        // Format khusus
        if (col.key === 'is_active') {
          value = value ? 'Aktif' : 'Tidak Aktif';
        } else if (col.key === 'tanggal') {
          value = formatDate(value);
        } else if (col.key === 'jenis_kelamin') {
          value = value === 'L' ? 'Laki-laki' : 'Perempuan';
        }
        
        formatted[col.key] = value || '-';
      });
      return formatted;
    });
  };

  // Export to PDF
  const exportToPDF = () => {
    setExporting('pdf');
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('SISTEM INFORMASI SEKOLAH', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(getReportTitle(), pageWidth / 2, 22, { align: 'center' });
      
      // Filter info
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const filterInfo = getFilterInfo();
      if (filterInfo) {
        doc.text(filterInfo, pageWidth / 2, 28, { align: 'center' });
      }
      
      // Tanggal cetak
      doc.text(`Dicetak: ${formatDate(new Date())}`, pageWidth / 2, 33, { align: 'center' });
      
      // Statistics (jika ada)
      let startY = 40;
      if (stats && Object.keys(stats).length > 0) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Statistik:', 14, startY);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        let statsY = startY + 5;
        
        Object.entries(stats).slice(0, 4).forEach(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          doc.text(`${label}: ${value}`, 14, statsY);
          statsY += 5;
        });
        
        startY = statsY + 5;
      }
      
      // Table
      const columns = getColumns();
      const formattedData = formatDataForExport();
      
      doc.autoTable({
        startY: startY,
        head: [columns.map(col => col.header)],
        body: formattedData.map(row => columns.map(col => row[col.key])),
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { left: 14, right: 14 }
      });
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Save
      const fileName = `laporan-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Gagal export PDF. Silakan coba lagi.');
    } finally {
      setExporting(null);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    setExporting('excel');
    try {
      const formattedData = formatDataForExport();
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Header info
      const headerData = [
        ['SISTEM INFORMASI SEKOLAH'],
        [getReportTitle()],
        [''],
        [`Dicetak: ${formatDate(new Date())}`]
      ];
      
      const filterInfo = getFilterInfo();
      if (filterInfo) {
        headerData.splice(3, 0, [filterInfo]);
      }
      
      // Statistics
      if (stats && Object.keys(stats).length > 0) {
        headerData.push(['']);
        headerData.push(['STATISTIK']);
        Object.entries(stats).slice(0, 4).forEach(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          headerData.push([`${label}:`, value]);
        });
      }
      
      headerData.push(['']);
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(headerData);
      
      // Add table data
      const columns = getColumns();
      XLSX.utils.sheet_add_json(ws, formattedData, {
        origin: -1,
        header: columns.map(col => col.key)
      });
      
      // Set column headers
      const headerRow = headerData.length;
      columns.forEach((col, idx) => {
        const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: idx });
        if (ws[cellRef]) {
          ws[cellRef].v = col.header;
        }
      });
      
      // Column widths
      const colWidths = columns.map(col => ({ wch: 15 }));
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
      
      // Save
      const fileName = `laporan-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Gagal export Excel. Silakan coba lagi.');
    } finally {
      setExporting(null);
    }
  };

  // Print
  const handlePrint = () => {
    setExporting('print');
    try {
      const printWindow = window.open('', '_blank');
      const columns = getColumns();
      const formattedData = formatDataForExport();
      
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
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h2 {
              margin: 5px 0;
            }
            .filter-info {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-bottom: 10px;
            }
            .stats {
              margin: 20px 0;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 4px;
            }
            .stats h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 11px;
            }
            th {
              background-color: #3b82f6;
              color: white;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 10px;
              color: #666;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SISTEM INFORMASI SEKOLAH</h2>
            <h3>${getReportTitle()}</h3>
            <div class="filter-info">
              ${filterInfo ? filterInfo : ''}
              <br>
              Dicetak: ${formatDate(new Date())}
            </div>
          </div>
          
          ${stats && Object.keys(stats).length > 0 ? `
            <div class="stats">
              <h3>Statistik</h3>
              <div class="stats-grid">
                ${Object.entries(stats).slice(0, 4).map(([key, value]) => {
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return `<div><strong>${label}:</strong> ${value}</div>`;
                }).join('')}
              </div>
            </div>
          ` : ''}
          
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${formattedData.map(row => `
                <tr>
                  ${columns.map(col => `<td>${row[col.key]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            Generated by Sistem Informasi Sekolah
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
      }, 250);
      
    } catch (error) {
      console.error('Error printing:', error);
      alert('Gagal print. Silakan coba lagi.');
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
          ${isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg'
          }
        `}
      >
        <FileDown className="w-4 h-4" />
        <span>{exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}</span>
      </button>

      {/* Export Excel Button */}
      <button
        onClick={exportToExcel}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
          }
        `}
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>{exporting === 'excel' ? 'Exporting...' : 'Export Excel'}</span>
      </button>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
          }
        `}
      >
        <Printer className="w-4 h-4" />
        <span>{exporting === 'print' ? 'Printing...' : 'Print'}</span>
      </button>
    </div>
  );
};

export default ExportButtons;