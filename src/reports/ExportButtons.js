import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Import autoTable separately untuk menghindari issue
let autoTable;
try {
  autoTable = require('jspdf-autotable');
} catch (error) {
  console.warn('jspdf-autotable not available, using fallback');
}

const ExportButtons = ({ data = [], type, filters = {}, stats = {}, loading = false }) => {
  const [exporting, setExporting] = useState(null);

  // Helper: Format tanggal
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return date || '';
    }
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
          { header: 'No', key: 'no', width: 6 },
          { header: 'NISN', key: 'nisn', width: 12 },
          { header: 'Nama Siswa', key: 'nama_siswa', width: 25 },
          { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 12 },
          { header: 'Kelas', key: 'kelas', width: 8 },
          { header: 'Status', key: 'is_active', width: 10 }
        ];
      case 'grades':
        return [
          { header: 'No', key: 'no', width: 6 },
          { header: 'NISN', key: 'nisn', width: 12 },
          { header: 'Nama Siswa', key: 'nama_siswa', width: 20 },
          { header: 'Kelas', key: 'kelas', width: 8 },
          { header: 'Mata Pelajaran', key: 'mata_pelajaran', width: 20 },
          { header: 'Jenis Nilai', key: 'jenis_nilai', width: 15 },
          { header: 'Nilai', key: 'nilai', width: 8 }
        ];
      case 'attendance':
        return [
          { header: 'No', key: 'no', width: 6 },
          { header: 'Tanggal', key: 'tanggal', width: 12 },
          { header: 'NISN', key: 'nisn', width: 12 },
          { header: 'Nama Siswa', key: 'nama_siswa', width: 20 },
          { header: 'Kelas', key: 'kelas', width: 8 },
          { header: 'Status', key: 'status', width: 10 },
          { header: 'Keterangan', key: 'keterangan', width: 20 }
        ];
      case 'teachers':
        return [
          { header: 'No', key: 'no', width: 6 },
          { header: 'Nama Guru', key: 'full_name', width: 20 },
          { header: 'Role', key: 'role', width: 15 },
          { header: 'Kelas', key: 'kelas', width: 8 },
          { header: 'Mata Pelajaran', key: 'mata_pelajaran', width: 20 },
          { header: 'Total Input', key: 'total_input', width: 12 }
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
        } else if (col.key === 'status') {
          value = value === 'Alfa' ? 'Alpa' : value;
        }
        
        formatted[col.key] = value || '-';
      });
      return formatted;
    });
  };

  // **FIXED: Export to PDF dengan fallback**
  const exportToPDF = () => {
    setExporting('pdf');
    
    try {
      // Validasi data dulu
      const formattedData = formatDataForExport();
      if (!formattedData || formattedData.length === 0) {
        alert('Tidak ada data untuk di-export');
        setExporting(null);
        return;
      }

      const columns = getColumns();
      
      // Create PDF document
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // **SOLUSI 1: Coba pakai autoTable jika available**
      if (autoTable && typeof autoTable === 'function') {
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
        
        let startY = 40;
        
        // Statistics (jika ada)
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
        
        // Table dengan autoTable
        autoTable(doc, {
          startY: startY,
          head: [columns.map(col => col.header)],
          body: formattedData.map(row => columns.map(col => row[col.key] || '')),
          styles: {
            fontSize: 8,
            cellPadding: 2,
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
        
      } else {
        // **SOLUSI 2: FALLBACK - Manual table tanpa autoTable**
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('SISTEM INFORMASI SEKOLAH', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(getReportTitle(), pageWidth / 2, 30, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Dicetak: ${formatDate(new Date())}`, pageWidth / 2, 40, { align: 'center' });
        
        const filterInfo = getFilterInfo();
        if (filterInfo) {
          doc.text(filterInfo, pageWidth / 2, 47, { align: 'center' });
        }
        
        // Simple manual table
        let yPosition = 60;
        const rowHeight = 8;
        const colWidth = pageWidth / columns.length;
        
        // Table header
        doc.setFillColor(59, 130, 246);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        
        columns.forEach((col, index) => {
          doc.rect(index * colWidth, yPosition, colWidth, rowHeight, 'F');
          doc.text(col.header, index * colWidth + 2, yPosition + 5);
        });
        
        yPosition += rowHeight;
        
        // Table data
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        formattedData.forEach((row, rowIndex) => {
          // Alternate row color
          if (rowIndex % 2 === 0) {
            doc.setFillColor(245, 247, 250);
            doc.rect(0, yPosition, pageWidth, rowHeight, 'F');
          }
          
          columns.forEach((col, colIndex) => {
            const value = String(row[col.key] || '');
            doc.text(value, colIndex * colWidth + 2, yPosition + 5);
          });
          
          yPosition += rowHeight;
          
          // Page break jika diperlukan
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
        });
      }
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      // Save PDF
      const fileName = `laporan-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      
      // **SOLUSI 3: Fallback ke Print jika PDF gagal**
      console.log('PDF export failed, falling back to print...');
      alert('Export PDF gagal. Membuka versi print sebagai alternatif...');
      handlePrint();
      
    } finally {
      setExporting(null);
    }
  };

  // Export to Excel - Tetap sama seperti sebelumnya
  const exportToExcel = () => {
    setExporting('excel');
    try {
      const formattedData = formatDataForExport();
      
      if (!formattedData || formattedData.length === 0) {
        alert('Tidak ada data untuk di-export');
        setExporting(null);
        return;
      }

      const columns = getColumns();
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Header info
      const headerData = [
        ['SISTEM INFORMASI SEKOLAH'],
        [getReportTitle()],
        [''],
        [`Dicetak: ${formatDate(new Date())}`],
        ['']
      ];
      
      const filterInfo = getFilterInfo();
      if (filterInfo) {
        headerData.splice(3, 0, [filterInfo]);
      }
      
      // Statistics
      if (stats && Object.keys(stats).length > 0) {
        headerData.push(['STATISTIK']);
        Object.entries(stats).forEach(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          headerData.push([`${label}:`, value]);
        });
        headerData.push(['']);
      }
      
      // Add table headers
      const tableHeaders = [columns.map(col => col.header)];
      
      // Combine all data
      const allData = [
        ...headerData,
        tableHeaders,
        ...formattedData.map(row => columns.map(col => row[col.key]))
      ];
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(allData);
      
      // Set column widths
      const colWidths = columns.map(col => ({ 
        wch: col.width || 15
      }));
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

  // Print - Tetap sama
  const handlePrint = () => {
    setExporting('print');
    try {
      const printWindow = window.open('', '_blank');
      const columns = getColumns();
      const formattedData = formatDataForExport();
      
      if (!formattedData || formattedData.length === 0) {
        alert('Tidak ada data untuk di-print');
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
              ${filterInfo ? filterInfo : ''}
              <br>
              Dicetak: ${formatDate(new Date())}
            </div>
          </div>
          
          ${stats && Object.keys(stats).length > 0 ? `
            <div class="stats">
              <h3>Statistik</h3>
              <div class="stats-grid">
                ${Object.entries(stats).map(([key, value]) => {
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