import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ExcelJS from 'exceljs';
import { 
  Search, 
  Save, 
  Download, 
  BookOpen,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';

const Nilai = ({ userData: initialUserData }) => {
  const [userData, setUserData] = useState(initialUserData);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [showRekap, setShowRekap] = useState(false);
  const [rekapData, setRekapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRekap, setLoadingRekap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch complete user data if kelas is missing
  useEffect(() => {
    const fetchCompleteUserData = async () => {
      console.log('=== INITIAL USER DATA ===');
      console.log('userData:', userData);
      console.log('userData.kelas:', userData?.kelas);
      console.log('========================');

      if (!userData?.kelas && userData?.username) {
        console.log('Kelas missing, fetching complete user data for:', userData.username);
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', userData.username)
            .single();

          if (error) throw error;
          
          if (data) {
            const completeUserData = {
              ...userData,
              ...data,
              name: data.full_name || userData.name
            };
            setUserData(completeUserData);
            console.log('Complete user data loaded:', completeUserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchCompleteUserData();
  }, [userData?.username]);

  // Auto-select class for guru_kelas
  useEffect(() => {
    if (userData?.role === 'guru_kelas' && userData?.kelas && !selectedClass) {
      setSelectedClass(String(userData.kelas));
    }
  }, [userData?.role, userData?.kelas]);

  // Konfigurasi mata pelajaran berdasarkan role
  const mataPelajaran = {
    guru_kelas: [
      'Pendidikan Pancasila',
      'Bahasa Indonesia', 
      'Matematika',
      'Bahasa Inggris',
      'IPAS',
      'Seni Budaya',
      'Bahasa Sunda'
    ],
    guru_mapel: {
      'acengmudrikah': ['Pendidikan Agama Islam'],
      'yosefedi': ['PJOK']
    }
  };

  // Jenis nilai
  const jenisNilai = [
    { value: 'NH1', label: 'NH1 - Nilai Harian 1' },
    { value: 'NH2', label: 'NH2 - Nilai Harian 2' },
    { value: 'NH3', label: 'NH3 - Nilai Harian 3' },
    { value: 'NH4', label: 'NH4 - Nilai Harian 4' },
    { value: 'NH5', label: 'NH5 - Nilai Harian 5' },
    { value: 'UTS', label: 'UTS - Ulangan Tengah Semester' },
    { value: 'UAS', label: 'UAS - Ulangan Akhir Semester' }
  ];

  // Kelas options - Dynamic based on user role
  const getAvailableClasses = () => {
    if (userData.role === 'admin') {
      // Admin can see all classes
      return ['1', '2', '3', '4', '5', '6'];
    } else if (userData.role === 'guru_kelas') {
      // Guru kelas only see their own class
      return [String(userData.kelas)];
    } else if (userData.role === 'guru_mapel') {
      // Guru mapel can see all classes
      return ['1', '2', '3', '4', '5', '6'];
    }
    return [];
  };

  // Get available subjects based on user role
  const getAvailableSubjects = () => {
    if (userData.role === 'admin') {
      return [
        ...mataPelajaran.guru_kelas,
        'Pendidikan Agama Islam',
        'PJOK'
      ];
    } else if (userData.role === 'guru_kelas') {
      return mataPelajaran.guru_kelas;
    } else if (userData.role === 'guru_mapel') {
      return mataPelajaran.guru_mapel[userData.username] || [];
    }
    return [];
  };

  // Check if user has access to selected class and subject
  const checkAccess = (kelas, mapel) => {
    console.log('=== CHECK ACCESS DEBUG ===');
    console.log('Full userData:', userData);
    console.log('userData.role:', userData.role);
    console.log('userData.kelas:', userData.kelas);
    console.log('userData.kelas type:', typeof userData.kelas);
    console.log('Selected kelas:', kelas);
    console.log('Selected kelas type:', typeof kelas);
    console.log('Selected mapel:', mapel);
    console.log('========================');

    if (userData.role === 'admin') return true;
    
    if (userData.role === 'guru_kelas') {
      // Convert both to string for comparison to avoid type issues
      const userKelas = String(userData.kelas);
      const selectedKelas = String(kelas);
      const hasClassAccess = userKelas === selectedKelas;
      const hasSubjectAccess = mataPelajaran.guru_kelas.includes(mapel);
      
      console.log('=== GURU KELAS ACCESS CHECK ===');
      console.log('userKelas (string):', userKelas);
      console.log('selectedKelas (string):', selectedKelas);
      console.log('Are they equal?', userKelas === selectedKelas);
      console.log('hasClassAccess:', hasClassAccess);
      console.log('Available subjects:', mataPelajaran.guru_kelas);
      console.log('Selected mapel:', mapel);
      console.log('hasSubjectAccess:', hasSubjectAccess);
      console.log('Final access:', hasClassAccess && hasSubjectAccess);
      console.log('==============================');
      
      return hasClassAccess && hasSubjectAccess;
    }
    
    if (userData.role === 'guru_mapel') {
      const allowedMapel = mataPelajaran.guru_mapel[userData.username] || [];
      const hasAccess = allowedMapel.includes(mapel);
      
      console.log('=== GURU MAPEL ACCESS CHECK ===');
      console.log('username:', userData.username);
      console.log('allowedMapel:', allowedMapel);
      console.log('mapel:', mapel);
      console.log('hasAccess:', hasAccess);
      console.log('==============================');
      
      return hasAccess;
    }
    
    console.log('=== ACCESS DENIED - No matching role ===');
    return false;
  };

  // Show message
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Load rekap all grades for preview
  const loadRekapNilai = async () => {
    if (!selectedClass || !selectedSubject) {
      showMessage('Pilih kelas dan mata pelajaran terlebih dahulu!', 'error');
      return;
    }

    if (!checkAccess(selectedClass, selectedSubject)) {
      showMessage('Anda Tidak Memiliki Akses Untuk Kelas dan Mata Pelajaran Pada Kelas ini!', 'error');
      return;
    }

    setLoadingRekap(true);
    try {
      // Load all students for selected class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('nisn, nama_siswa, kelas')
        .eq('kelas', parseInt(selectedClass))
        .eq('is_active', true)
        .order('nama_siswa');

      if (studentsError) throw studentsError;

      if (!studentsData || studentsData.length === 0) {
        showMessage('Tidak ada siswa di kelas ini', 'error');
        setRekapData([]);
        setShowRekap(false);
        return;
      }

      // Load all grades for selected class and subject
      const { data: allGrades, error: gradesError } = await supabase
        .from('nilai')
        .select('*')
        .eq('kelas', parseInt(selectedClass))
        .eq('mata_pelajaran', selectedSubject);

      if (gradesError) throw gradesError;

      // Grade types
      const gradeTypes = ['NH1', 'NH2', 'NH3', 'NH4', 'NH5', 'UTS', 'UAS'];
      
      // Process data for preview
      const processedData = studentsData.map((student, index) => {
        const studentGrades = {};
        const nhGrades = [];
        
        // Get grades for each type
        gradeTypes.forEach(type => {
          const grade = allGrades?.find(g => 
            g.nisn === student.nisn && 
            g.jenis_nilai === type
          );
          studentGrades[type] = grade ? grade.nilai : '';
          
          // Collect NH grades for average calculation
          if (type.startsWith('NH') && grade && grade.nilai) {
            nhGrades.push(parseFloat(grade.nilai));
          }
        });

        // Calculate final grade (Nilai Akhir)
        let nilaiAkhir = '';
        const utsGrade = studentGrades['UTS'] ? parseFloat(studentGrades['UTS']) : 0;
        const uasGrade = studentGrades['UAS'] ? parseFloat(studentGrades['UAS']) : 0;
        
        if (nhGrades.length > 0 || utsGrade > 0 || uasGrade > 0) {
          const avgNH = nhGrades.length > 0 ? nhGrades.reduce((a, b) => a + b, 0) / nhGrades.length : 0;
          nilaiAkhir = ((avgNH * 0.4) + (utsGrade * 0.3) + (uasGrade * 0.3)).toFixed(1);
        }

        return {
          no: index + 1,
          nisn: student.nisn,
          nama_siswa: student.nama_siswa,
          nh1: studentGrades['NH1'],
          nh2: studentGrades['NH2'],
          nh3: studentGrades['NH3'],
          nh4: studentGrades['NH4'],
          nh5: studentGrades['NH5'],
          uts: studentGrades['UTS'],
          uas: studentGrades['UAS'],
          nilai_akhir: nilaiAkhir
        };
      });

      setRekapData(processedData);
      setShowRekap(true);
      setStudents([]);
      showMessage(`Rekap nilai ${selectedSubject} kelas ${selectedClass} berhasil dimuat!`);

    } catch (error) {
      console.error('Error loading rekap:', error);
      showMessage('Error memuat rekap: ' + error.message, 'error');
    } finally {
      setLoadingRekap(false);
    }
  };

  // Load students data with optional notification
  const loadStudents = async (showNotification = true) => {
    if (!selectedClass || !selectedSubject || !selectedType) {
      if (showNotification) {
        showMessage('Pilih kelas, mata pelajaran, dan jenis nilai terlebih dahulu!', 'error');
      }
      return;
    }

    if (!checkAccess(selectedClass, selectedSubject)) {
      showMessage('Anda Tidak Memiliki Akses Untuk Kelas dan Mata Pelajaran Pada Kelas ini!', 'error');
      return;
    }

    setLoading(true);
    try {
      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('nisn, nama_siswa, kelas')
        .eq('kelas', parseInt(selectedClass))
        .eq('is_active', true)
        .order('nama_siswa');

      if (studentsError) throw studentsError;

      if (!studentsData || studentsData.length === 0) {
        if (showNotification) {
          showMessage('Tidak ada siswa di kelas ini', 'error');
        }
        setStudents([]);
        setGrades([]);
        return;
      }

      // Load existing grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('nilai')
        .select('*')
        .eq('kelas', parseInt(selectedClass))
        .eq('mata_pelajaran', selectedSubject)
        .eq('jenis_nilai', selectedType);

      if (gradesError) throw gradesError;

      // Combine student data with grades
      const combinedData = studentsData.map(student => {
        const existingGrade = gradesData?.find(grade => 
          grade.nisn === student.nisn && 
          grade.mata_pelajaran === selectedSubject && 
          grade.jenis_nilai === selectedType
        );

        return {
          ...student,
          nilai: existingGrade ? existingGrade.nilai : '',
          isExisting: !!existingGrade
        };
      });

      setStudents(combinedData);
      if (showNotification) {
        showMessage(`Data nilai ${selectedType} ${selectedSubject} kelas ${selectedClass} berhasil dimuat!`);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('Error memuat data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load data when all fields are selected
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedType) {
      loadStudents();
      setShowRekap(false);
    } else {
      setStudents([]);
      setShowRekap(false);
    }
  }, [selectedClass, selectedSubject, selectedType]);

  // Save grades with confirmation
  const saveGrades = async () => {
    if (students.length === 0) {
      showMessage('Tidak ada data untuk disimpan!', 'error');
      return;
    }

    const dataToSave = students.filter(student => {
      const nilai = student.nilai; 
      return nilai !== '' && !isNaN(nilai);
    });

    if (dataToSave.length === 0) {
      showMessage('Masukkan minimal satu nilai untuk disimpan!', 'error');
      return;
    }

    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menyimpan ${dataToSave.length} nilai siswa?\n\n` +
      `Kelas: ${selectedClass}\n` +
      `Mata Pelajaran: ${selectedSubject}\n` +
      `Jenis Nilai: ${selectedType}`
    );

    if (!isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      const finalData = dataToSave.map(student => {
        return {
          nisn: student.nisn,
          nama_siswa: student.nama_siswa,
          kelas: parseInt(selectedClass),
          mata_pelajaran: selectedSubject,
          jenis_nilai: selectedType,
          nilai: parseFloat(student.nilai),
          guru_input: userData.name || userData.username,
          tanggal: new Date().toISOString().split('T')[0]
        };
      });

      const { error } = await supabase
        .from('nilai')
        .upsert(finalData, {
          onConflict: 'nisn,mata_pelajaran,jenis_nilai'
        });

      if (error) throw error;

      showMessage(`${finalData.length} nilai berhasil disimpan dan diperbarui!`);
      
      await loadStudents(false);

    } catch (error) {
      console.error('Error saving grades:', error);
      showMessage('Error menyimpan data: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Export to Excel with all grade types - Menggunakan ExcelJS
  const exportToExcel = async () => {
    if (!selectedClass || !selectedSubject) {
        showMessage('Pilih kelas dan mata pelajaran terlebih dahulu!', 'error');
        return;
    }

    if (!checkAccess(selectedClass, selectedSubject)) {
        showMessage('Anda Tidak Memiliki Akses Untuk Kelas dan Mata Pelajaran Pada Kelas ini!', 'error');
        return;
    }

    setExporting(true);
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

    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showMessage('Error mengekspor data: ' + error.message, 'error');
    } finally {
        setExporting(false);
    }
  };

  // Handle input change
  const handleInputChange = (nisn, value) => {
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
        setStudents(prev => prev.map(student => 
            student.nisn === nisn ? { ...student, nilai: value } : student
        ));
    }
  };

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'error' 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'error' ? (
              <AlertCircle size={20} />
            ) : (
              <CheckCircle size={20} />
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {userData?.role === 'guru_kelas' ? 'Kelas Anda' : 'Pilih Kelas'}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={userData?.role === 'guru_kelas'}
            >
              <option value="">Pilih Kelas</option>
              {getAvailableClasses().map(kelas => (
                <option key={kelas} value={kelas}>
                  Kelas {kelas}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Pilih Mata Pelajaran</option>
              {getAvailableSubjects().map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Nilai
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Pilih Jenis Nilai</option>
              {jenisNilai.map(jenis => (
                <option key={jenis.value} value={jenis.value}>
                  {jenis.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadRekapNilai}
            disabled={loadingRekap || !selectedClass || !selectedSubject}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingRekap ? <Loader className="animate-spin" size={18} /> : <BookOpen size={18} />}
            {loadingRekap ? 'Memuat...' : 'Lihat Rekap'}
          </button>

          <button
            onClick={saveGrades}
            disabled={saving || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Menyimpan...' : 'Simpan Nilai'}
          </button>

          <button
            onClick={exportToExcel}
            disabled={exporting || !selectedClass || !selectedSubject}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader className="animate-spin" size={18} /> : <Download size={18} />}
            {exporting ? 'Mengekspor...' : 'Export Excel'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">
            {showRekap 
              ? `Rekap Nilai - ${selectedSubject} - Kelas ${selectedClass}`
              : selectedSubject && selectedType && selectedClass
              ? `Nilai ${selectedType} - ${selectedSubject} - Kelas ${selectedClass}`
              : 'Daftar Nilai Siswa'
            }
          </h3>
          <p className="text-sm text-gray-600">
            {loading || loadingRekap 
              ? 'Memuat data...' 
              : showRekap 
              ? `${rekapData.length} siswa ditemukan`
              : `${students.length} siswa ditemukan`
            }
          </p>
        </div>

        <div className="overflow-x-auto">
          {loading || loadingRekap ? (
            <div className="text-center py-12">
              <Loader className="animate-spin mx-auto mb-4" size={48} />
              <p className="text-gray-500">Memuat data siswa...</p>
            </div>
          ) : showRekap && rekapData.length > 0 ? (
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-blue-800 uppercase">No</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-blue-800 uppercase">NISN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase">Nama Siswa</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-blue-800 uppercase">NH-1</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-blue-800 uppercase">NH-2</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-blue-800 uppercase">NH-3</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-blue-800 uppercase">NH-4</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-blue-800 uppercase">NH-5</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-blue-800 uppercase">UTS</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-blue-800 uppercase">UAS</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-blue-800 uppercase">Nilai Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rekapData.map((student) => (
                  <tr key={student.nisn} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium">{student.no}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{student.nisn}</td>
                    <td className="px-6 py-3 text-sm font-medium">{student.nama_siswa}</td>
                    <td className="px-3 py-3 text-center text-sm">{student.nh1 || '-'}</td>
                    <td className="px-3 py-3 text-center text-sm">{student.nh2 || '-'}</td>
                    <td className="px-3 py-3 text-center text-sm">{student.nh3 || '-'}</td>
                    <td className="px-3 py-3 text-center text-sm">{student.nh4 || '-'}</td>
                    <td className="px-3 py-3 text-center text-sm">{student.nh5 || '-'}</td>
                    <td className="px-3 py-3 text-center text-sm">{student.uts || '-'}</td>
                    <td className="px-3 py-3 text-center text-sm">{student.uas || '-'}</td>
                    <td className="px-3 py-3 text-center text-sm font-semibold text-blue-600">
                      {student.nilai_akhir || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : students.length > 0 ? (
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">
                    NISN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">
                    Nama Siswa
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-blue-800 uppercase">
                    {selectedType || 'Nilai'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student.nisn} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.nisn}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {student.nama_siswa}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        data-nisn={student.nisn}
                        min="0"
                        max="100"
                        value={student.nilai}
                        onChange={(e) => handleInputChange(student.nisn, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Belum Ada Data</h3>
              <p>
                {showRekap 
                  ? 'Pilih kelas dan mata pelajaran untuk melihat rekap nilai'
                  : 'Pilih kelas, mata pelajaran, dan jenis nilai untuk memulai input'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nilai;