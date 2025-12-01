// GradesExport.js
import ExcelJS from 'exceljs';
import { supabase } from '../supabaseClient';
import { Download, Upload, Loader, FileSpreadsheet, AlertTriangle, CheckCircle, AlertCircle, X } from 'lucide-react';
import React, { useState } from 'react';

// Export Modal Component
export const ImportModal = ({ 
  isOpen, 
  onClose, 
  selectedClass, 
  selectedSubject, 
  userData,
  onImportSuccess 
}) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [validData, setValidData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState('upload');

  const resetModal = () => {
    setFile(null);
    setParsing(false);
    setImporting(false);
    setPreviewData([]);
    setValidData([]);
    setErrors([]);
    setStep('upload');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Download Template Excel
  const downloadTemplate = async () => {
    try {
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('nisn, nama_siswa')
        .eq('kelas', parseInt(selectedClass))
        .eq('is_active', true)
        .order('nama_siswa');

      if (error) throw error;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template Nilai');
      const numColumns = 11;

      worksheet.columns = [
        { key: 'No', width: 5 },
        { key: 'NISN', width: 12 },
        { key: 'Nama Siswa', width: 40 },
        { key: 'NH-1', width: 8 },
        { key: 'NH-2', width: 8 },
        { key: 'NH-3', width: 8 },
        { key: 'NH-4', width: 8 },
        { key: 'NH-5', width: 8 },
        { key: 'UTS', width: 8 },
        { key: 'UAS', width: 8 },
        { key: 'Nilai Akhir', width: 12 }
      ];

      const headerData = [
        ['SDN 1 PASIRPOGOR'],
        [`REKAPITULASI NILAI MATA PELAJARAN - ${selectedSubject.toUpperCase()}`],
        [`KELAS ${selectedClass}`],
        ['Tahun Ajaran: 2025/2026'],
        ['']
      ];

      let currentRow = 1;
      headerData.forEach(row => {
        const newRow = worksheet.getRow(currentRow++);
        newRow.getCell(1).value = row[0];
        worksheet.mergeCells(`A${currentRow - 1}:${String.fromCharCode(65 + numColumns - 1)}${currentRow - 1}`);
        newRow.getCell(1).font = { bold: true, size: currentRow <= 3 ? 14 : 11 };
        newRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      });

      const tableHeaders = ['No', 'NISN', 'Nama Siswa', 'NH-1', 'NH-2', 'NH-3', 'NH-4', 'NH-5', 'UTS', 'UAS', 'Nilai Akhir'];
      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = tableHeaders;
      headerRow.height = 30;

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9E1F2' }
        };
        cell.font = { bold: true, size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      currentRow++;

      studentsData.forEach((student, index) => {
        const row = worksheet.addRow({
          No: index + 1,
          NISN: student.nisn,
          'Nama Siswa': student.nama_siswa,
          'NH-1': '',
          'NH-2': '',
          'NH-3': '',
          'NH-4': '',
          'NH-5': '',
          UTS: '',
          UAS: '',
          'Nilai Akhir': ''
        });

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          if (colNumber >= 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Template_Nilai_${selectedSubject.replace(/\s+/g, '_')}_Kelas_${selectedClass}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error mengunduh template: ' + error.message);
    }
  };

  // Parse Excel File
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setParsing(true);
    setErrors([]);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) throw new Error('Worksheet tidak ditemukan');

      const { data: dbStudents, error: dbError } = await supabase
        .from('students')
        .select('nisn, nama_siswa')
        .eq('kelas', parseInt(selectedClass))
        .eq('is_active', true);

      if (dbError) throw dbError;

      const nisnMap = {};
      dbStudents.forEach(s => {
        nisnMap[s.nisn] = s.nama_siswa;
      });

      const gradeTypes = ['NH-1', 'NH-2', 'NH-3', 'NH-4', 'NH-5', 'UTS', 'UAS'];
      const parsedData = [];
      const errorList = [];
      const validList = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 6) return;

        const nisn = row.getCell(2).value?.toString().trim();
        if (!nisn) return;

        if (!nisnMap[nisn]) {
          errorList.push({
            row: rowNumber,
            nisn: nisn,
            error: 'NISN tidak ditemukan di kelas ini'
          });
          return;
        }

        const rowData = {
          rowNumber,
          nisn: nisn,
          nama_siswa: nisnMap[nisn],
          grades: {}
        };

        let hasValidGrade = false;
        let hasError = false;

        gradeTypes.forEach((type, index) => {
          const cellValue = row.getCell(4 + index).value;
          
          if (cellValue !== null && cellValue !== '' && cellValue !== undefined) {
            const nilai = parseFloat(cellValue);
            
            if (isNaN(nilai)) {
              errorList.push({
                row: rowNumber,
                nisn: nisn,
                error: `${type}: Nilai tidak valid (${cellValue})`
              });
              hasError = true;
            } else if (nilai < 0 || nilai > 100) {
              errorList.push({
                row: rowNumber,
                nisn: nisn,
                error: `${type}: Nilai harus 0-100 (${nilai})`
              });
              hasError = true;
            } else {
              rowData.grades[type] = nilai;
              hasValidGrade = true;
            }
          }
        });

        if (hasValidGrade && !hasError) {
          validList.push(rowData);
        }

        parsedData.push(rowData);
      });

      setPreviewData(parsedData.slice(0, 10));
      setValidData(validList);
      setErrors(errorList);
      setStep('preview');

    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error membaca file: ' + error.message);
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  // Import to Database
  const handleImport = async () => {
    if (validData.length === 0) {
      alert('Tidak ada data valid untuk diimport!');
      return;
    }

    const confirmed = window.confirm(
      `Import ${validData.length} data nilai?\n\n` +
      `Kelas: ${selectedClass}\n` +
      `Mata Pelajaran: ${selectedSubject}\n\n` +
      `Data yang sudah ada akan di-update.`
    );

    if (!confirmed) return;

    setImporting(true);

    try {
      const dataToImport = [];
      const gradeTypeMap = {
        'NH-1': 'NH1',
        'NH-2': 'NH2',
        'NH-3': 'NH3',
        'NH-4': 'NH4',
        'NH-5': 'NH5',
        'UTS': 'UTS',
        'UAS': 'UAS'
      };

      validData.forEach(student => {
        Object.entries(student.grades).forEach(([type, nilai]) => {
          dataToImport.push({
            nisn: student.nisn,
            nama_siswa: student.nama_siswa,
            kelas: parseInt(selectedClass),
            mata_pelajaran: selectedSubject,
            jenis_nilai: gradeTypeMap[type],
            nilai: parseFloat(nilai),
            guru_input: userData.name || userData.username,
            tanggal: new Date().toISOString().split('T')[0]
          });
        });
      });

      const { error } = await supabase
        .from('nilai')
        .upsert(dataToImport, {
          onConflict: 'nisn,mata_pelajaran,jenis_nilai'
        });

      if (error) throw error;

      alert(`✓ Berhasil import ${validData.length} data siswa!\nTotal nilai: ${dataToImport.length}`);
      handleClose();
      onImportSuccess();

    } catch (error) {
      console.error('Error importing:', error);
      alert('Error import data: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload size={28} />
              <div>
                <h2 className="text-2xl font-bold">Import Nilai</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {selectedSubject} - Kelas {selectedClass}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
              disabled={importing}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {step === 'upload' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <FileSpreadsheet size={40} className="text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      1. Download Template
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Download template Excel yang sudah berisi daftar siswa. Isi nilai pada kolom yang tersedia (NH-1 s/d UAS).
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Download size={18} />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Upload size={40} className="text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      2. Upload File Excel
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Setelah mengisi nilai, upload file Excel yang sudah diisi.
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={parsing}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:bg-green-600 file:text-white file:font-medium hover:file:bg-green-700 disabled:opacity-50"
                      />
                      {parsing && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                          <Loader className="animate-spin text-green-600" size={24} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2">Catatan Penting:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Format file harus .xlsx (Excel)</li>
                      <li>NISN harus sesuai dengan data siswa</li>
                      <li>Nilai harus antara 0-100</li>
                      <li>Kolom nilai boleh kosong (tidak wajib diisi semua)</li>
                      <li>Nilai Akhir akan dihitung otomatis</li>
                      <li>Data yang sudah ada akan di-update</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={24} className="text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-700">{validData.length}</p>
                      <p className="text-sm text-gray-600">Data Valid</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={24} className="text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-700">{errors.length}</p>
                      <p className="text-sm text-gray-600">Error</p>
                    </div>
                  </div>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Error ({errors.length})
                  </h4>
                  <div className="space-y-1 text-sm text-red-700">
                    {errors.map((err, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="font-mono">Row {err.row}:</span>
                        <span>NISN {err.nisn} - {err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-900 mb-3">Preview Data (10 baris pertama)</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Row</th>
                          <th className="px-3 py-2 text-left font-semibold">NISN</th>
                          <th className="px-3 py-2 text-left font-semibold">Nama</th>
                          <th className="px-3 py-2 text-center font-semibold">NH-1</th>
                          <th className="px-3 py-2 text-center font-semibold">NH-2</th>
                          <th className="px-3 py-2 text-center font-semibold">NH-3</th>
                          <th className="px-3 py-2 text-center font-semibold">UTS</th>
                          <th className="px-3 py-2 text-center font-semibold">UAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-600">{row.rowNumber}</td>
                            <td className="px-3 py-2 font-mono text-xs">{row.nisn}</td>
                            <td className="px-3 py-2">{row.nama_siswa}</td>
                            <td className="px-3 py-2 text-center">{row.grades['NH-1'] || '-'}</td>
                            <td className="px-3 py-2 text-center">{row.grades['NH-2'] || '-'}</td>
                            <td className="px-3 py-2 text-center">{row.grades['NH-3'] || '-'}</td>
                            <td className="px-3 py-2 text-center">{row.grades['UTS'] || '-'}</td>
                            <td className="px-3 py-2 text-center">{row.grades['UAS'] || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            {step === 'preview' ? (
              <>
                <button
                  onClick={() => setStep('upload')}
                  disabled={importing}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || validData.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {importing ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Mengimport...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Import Sekarang ({validData.length})
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div></div>
                <button
                  onClick={handleClose}
                  disabled={parsing}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  Tutup
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export to Excel Function
export const exportToExcel = async ({ 
  selectedClass, 
  selectedSubject, 
  userData, 
  showMessage,
  checkAccess 
}) => {
  if (!selectedClass || !selectedSubject) {
    showMessage('Pilih kelas dan mata pelajaran terlebih dahulu!', 'error');
    return;
  }

  if (!checkAccess(selectedClass, selectedSubject)) {
    showMessage('Anda Tidak Memiliki Akses Untuk Kelas dan Mata Pelajaran Pada Kelas ini!', 'error');
    return;
  }

  try {
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('nisn, nama_siswa, kelas')
      .eq('kelas', parseInt(selectedClass))
      .eq('is_active', true)
      .order('nama_siswa');

    if (studentsError) throw studentsError;

    if (!studentsData || studentsData.length === 0) {
      showMessage('Tidak ada siswa di kelas ini', 'error');
      return;
    }

    const { data: allGrades, error: gradesError } = await supabase
      .from('nilai')
      .select('*')
      .eq('kelas', parseInt(selectedClass))
      .eq('mata_pelajaran', selectedSubject);

    if (gradesError) throw gradesError;

    const gradeTypes = ['NH1', 'NH2', 'NH3', 'NH4', 'NH5', 'UTS', 'UAS'];
    
    const excelData = studentsData.map((student, index) => {
      const studentGrades = {};
      const nhGrades = [];
      
      gradeTypes.forEach(type => {
        const grade = allGrades?.find(g => 
          g.nisn === student.nisn && 
          g.jenis_nilai === type
        );
        studentGrades[type] = grade ? grade.nilai : '';
        
        if (type.startsWith('NH') && grade && grade.nilai) {
          nhGrades.push(parseFloat(grade.nilai));
        }
      });

      let nilaiAkhir = '';
      const utsGrade = studentGrades['UTS'] ? parseFloat(studentGrades['UTS']) : 0;
      const uasGrade = studentGrades['UAS'] ? parseFloat(studentGrades['UAS']) : 0;
      
      if (nhGrades.length > 0 || utsGrade > 0 || uasGrade > 0) {
        const avgNH = nhGrades.length > 0 ? nhGrades.reduce((a, b) => a + b, 0) / nhGrades.length : 0;
        nilaiAkhir = ((avgNH * 0.4) + (utsGrade * 0.3) + (uasGrade * 0.3)).toFixed(1);
      }

      return {
        No: index + 1,
        NISN: student.nisn,
        'Nama Siswa': student.nama_siswa,
        'NH-1': studentGrades['NH1'],
        'NH-2': studentGrades['NH2'],
        'NH-3': studentGrades['NH3'],
        'NH-4': studentGrades['NH4'],
        'NH-5': studentGrades['NH5'],
        UTS: studentGrades['UTS'],
        UAS: studentGrades['UAS'],
        'Nilai Akhir': nilaiAkhir
      };
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = userData.name || userData.username;
    workbook.lastModifiedBy = userData.name || userData.username;
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Nilai Siswa');
    const numColumns = 11;

    worksheet.columns = [
      { key: 'No', width: 5 },
      { key: 'NISN', width: 12 },
      { key: 'Nama Siswa', width: 40 }, 
      { key: 'NH-1', width: 8 },
      { key: 'NH-2', width: 8 },
      { key: 'NH-3', width: 8 },
      { key: 'NH-4', width: 8 },
      { key: 'NH-5', width: 8 },
      { key: 'UTS', width: 8 },
      { key: 'UAS', width: 8 },
      { key: 'Nilai Akhir', width: 12 }
    ];

    const headerData = [
      ['SDN 1 PASIRPOGOR'], 
      [`REKAPITULASI NILAI MATA PELAJARAN - ${selectedSubject.toUpperCase()}`], 
      [`KELAS ${selectedClass}`], 
      ['Tahun Ajaran: 2025/2026'], 
      ['']
    ];

    let currentRow = 1;
    headerData.forEach(row => {
      const newRow = worksheet.getRow(currentRow++);
      newRow.getCell(1).value = row[0];
      
      worksheet.mergeCells(`A${currentRow - 1}:${String.fromCharCode(65 + numColumns - 1)}${currentRow - 1}`);
      
      newRow.getCell(1).font = { bold: true, size: currentRow <= 3 ? 14 : 11, name: 'Calibri' };
      newRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const tableHeaders = ['No', 'NISN', 'Nama Siswa', 'NH-1', 'NH-2', 'NH-3', 'NH-4', 'NH-5', 'UTS', 'UAS', 'Nilai Akhir'];
    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = tableHeaders;
    headerRow.height = 30; 
    
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      cell.font = {
        bold: true,
        size: 10
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    
    currentRow++; 

    excelData.forEach((item, index) => {
      const row = worksheet.addRow(Object.values(item));
      
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        if (colNumber >= 4) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.numFmt = '0';
          if (colNumber === numColumns) {
            cell.font = { bold: true };
          }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        if (index % 2 !== 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      });
      currentRow++;
    });

    currentRow += 2;
    const startCol = 8;
    
    const signRow1 = worksheet.getRow(currentRow + 0);
    signRow1.getCell(startCol).value = 'Mengetahui,';
    signRow1.getCell(startCol).font = { bold: true };

    const signRow2 = worksheet.getRow(currentRow + 1);
    signRow2.getCell(startCol).value = userData.role === 'guru_kelas' ? 'Wali Kelas' : 'Guru Mata Pelajaran';
    signRow2.getCell(startCol).font = { bold: true };

    const signRow3 = worksheet.getRow(currentRow + 4);
    signRow3.getCell(startCol).value = userData.name || userData.username;
    signRow3.getCell(startCol).font = { bold: true, underline: true };
    
    [signRow1, signRow2, signRow3].forEach(row => {
      row.getCell(startCol).alignment = { horizontal: 'center' };
    });

    const filename = `Nilai_${selectedSubject.replace(/\s+/g, '_')}_Kelas_${selectedClass}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    showMessage(`Data nilai ${selectedSubject} kelas ${selectedClass} berhasil diekspor!`);
    return true;

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    showMessage('Error mengekspor data: ' + error.message, 'error');
    return false;
  }
};