import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Save, 
  Download, 
  BookOpen,
  AlertCircle,
  CheckCircle,
  Loader,
  Users,
  FileText,
  Calculator,
  Search,
  Upload
} from 'lucide-react';
import { ImportModal, exportToExcel } from './GradesExport';

// Compact Stats Card Component
const StatsCard = ({ icon: Icon, number, label, color }) => {
  const colorClasses = {
    blue: "border-l-blue-500 bg-gradient-to-r from-blue-50 to-white",
    green: "border-l-green-500 bg-gradient-to-r from-green-50 to-white", 
    purple: "border-l-purple-500 bg-gradient-to-r from-purple-50 to-white",
    orange: "border-l-orange-500 bg-gradient-to-r from-orange-50 to-white"
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600", 
    orange: "text-orange-600"
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${colorClasses[color]} p-4 hover:shadow-md transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{number}</p>
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
        <Icon size={28} className={iconColorClasses[color]} />
      </div>
    </div>
  );
};

// Mobile Student Card Component untuk Input Nilai
const StudentGradeCard = ({ student, index, selectedType, value, onChange, disabled }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">
                {index + 1}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">{student.nama_siswa}</h3>
              <p className="text-sm text-gray-600">NISN: {student.nisn}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Nilai {selectedType}
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(student.nisn, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0-100"
          />
        </div>
        
        {student.isExisting && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <p className="text-green-700 text-xs font-medium text-center">
              ✓ Nilai sudah tersimpan
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Mobile Rekap Card Component
const RekapGradeCard = ({ student, index }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">
                {index + 1}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">{student.nama_siswa}</h3>
              <p className="text-sm text-gray-600">NISN: {student.nisn}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">NH-1</p>
          <p className="font-bold text-gray-900">{student.nh1 || '-'}</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">NH-2</p>
          <p className="font-bold text-gray-900">{student.nh2 || '-'}</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">NH-3</p>
          <p className="font-bold text-gray-900">{student.nh3 || '-'}</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">NH-4</p>
          <p className="font-bold text-gray-900">{student.nh4 || '-'}</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">NH-5</p>
          <p className="font-bold text-gray-900">{student.nh5 || '-'}</p>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <p className="text-xs text-gray-600">UTS</p>
          <p className="font-bold text-gray-900">{student.uts || '-'}</p>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <p className="text-xs text-gray-600">UAS</p>
          <p className="font-bold text-gray-900">{student.uas || '-'}</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg col-span-2">
          <p className="text-xs text-gray-600">Nilai Akhir</p>
          <p className="font-bold text-green-700 text-lg">{student.nilai_akhir || '-'}</p>
        </div>
      </div>
    </div>
  );
};

const Grades = ({ userData: initialUserData }) => {
  const [showImportModal, setShowImportModal] = useState(false);
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
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    const fetchCompleteUserData = async () => {
      if (!userData?.kelas && userData?.username) {
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
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchCompleteUserData();
  }, [userData?.username]);

  useEffect(() => {
    if (userData?.role === 'guru_kelas' && userData?.kelas && !selectedClass) {
      setSelectedClass(String(userData.kelas));
    }
  }, [userData?.role, userData?.kelas]);

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

  const jenisNilai = [
    { value: 'NH1', label: 'NH1 - Nilai Harian 1' },
    { value: 'NH2', label: 'NH2 - Nilai Harian 2' },
    { value: 'NH3', label: 'NH3 - Nilai Harian 3' },
    { value: 'NH4', label: 'NH4 - Nilai Harian 4' },
    { value: 'NH5', label: 'NH5 - Nilai Harian 5' },
    { value: 'UTS', label: 'UTS - Ulangan Tengah Semester' },
    { value: 'UAS', label: 'UAS - Ulangan Akhir Semester' }
  ];

  const getAvailableClasses = () => {
    if (userData.role === 'admin') {
      return ['1', '2', '3', '4', '5', '6'];
    } else if (userData.role === 'guru_kelas') {
      return [String(userData.kelas)];
    } else if (userData.role === 'guru_mapel') {
      return ['1', '2', '3', '4', '5', '6'];
    }
    return [];
  };

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

  const checkAccess = (kelas, mapel) => {
    if (userData.role === 'admin') return true;
    
    if (userData.role === 'guru_kelas') {
      const userKelas = String(userData.kelas);
      const selectedKelas = String(kelas);
      const hasClassAccess = userKelas === selectedKelas;
      const hasSubjectAccess = mataPelajaran.guru_kelas.includes(mapel);
      
      return hasClassAccess && hasSubjectAccess;
    }
    
    if (userData.role === 'guru_mapel') {
      const allowedMapel = mataPelajaran.guru_mapel[userData.username] || [];
      return allowedMapel.includes(mapel);
    }
    
    return false;
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const filteredStudents = students.filter(student =>
    student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nisn.includes(searchTerm)
  );

  const filteredRekapData = rekapData.filter(student =>
    student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nisn.includes(searchTerm)
  );

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

      const { data: allGrades, error: gradesError } = await supabase
        .from('nilai')
        .select('*')
        .eq('kelas', parseInt(selectedClass))
        .eq('mata_pelajaran', selectedSubject);

      if (gradesError) throw gradesError;

      const gradeTypes = ['NH1', 'NH2', 'NH3', 'NH4', 'NH5', 'UTS', 'UAS'];
      
      const processedData = studentsData.map((student, index) => {
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

      const { data: gradesData, error: gradesError } = await supabase
        .from('nilai')
        .select('*')
        .eq('kelas', parseInt(selectedClass))
        .eq('mata_pelajaran', selectedSubject)
        .eq('jenis_nilai', selectedType);

      if (gradesError) throw gradesError;

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

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedType) {
      loadStudents();
      setShowRekap(false);
    } else {
      setStudents([]);
      setShowRekap(false);
    }
  }, [selectedClass, selectedSubject, selectedType]);

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

  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      await exportToExcel({
        selectedClass,
        selectedSubject, 
        userData,
        showMessage,
        checkAccess
      });
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleInputChange = (nisn, value) => {
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
        setStudents(prev => prev.map(student => 
            student.nisn === nisn ? { ...student, nilai: value } : student
        ));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
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

      {showRekap && rekapData.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={Users}
            number={rekapData.length}
            label="Total Siswa"
            color="blue"
          />
          <StatsCard
            icon={FileText}
            number={rekapData.filter(s => s.nilai_akhir && s.nilai_akhir > 0).length}
            label="Nilai Terisi"
            color="green"
          />
          <StatsCard
            icon={Calculator}
            number={rekapData.filter(s => s.nilai_akhir && s.nilai_akhir >= 70).length}
            label="Tuntas"
            color="purple"
          />
          <StatsCard
            icon={BookOpen}
            number={rekapData.filter(s => s.nilai_akhir && s.nilai_akhir < 70).length}
            label="Remedial"
            color="orange"
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {userData?.role === 'guru_kelas' ? 'Kelas Anda' : 'Pilih Kelas'}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="">Pilih Jenis Nilai</option>
              {jenisNilai.map(jenis => (
                <option key={jenis.value} value={jenis.value}>
                  {jenis.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(students.length > 0 || rekapData.length > 0) && (
          <div className="mb-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cari nama siswa atau NISN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-medium text-sm sm:text-base"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={loadRekapNilai}
            disabled={loadingRekap || !selectedClass || !selectedSubject}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base"
          >
            {loadingRekap ? <Loader className="animate-spin" size={18} /> : <BookOpen size={18} />}
            {loadingRekap ? 'Memuat...' : 'Lihat Rekap'}
          </button>

          <button
            onClick={saveGrades}
            disabled={saving || students.length === 0 || showRekap}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base"
            title={showRekap ? "Pilih jenis nilai untuk input & simpan" : students.length === 0 ? "Pilih kelas, mata pelajaran, dan jenis nilai" : "Simpan nilai siswa"}
          >
            {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Menyimpan...' : 'Simpan Nilai'}
          </button>

          <button
            onClick={handleExportToExcel}
            disabled={exporting || !selectedClass || !selectedSubject}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base"
          >
            {exporting ? <Loader className="animate-spin" size={18} /> : <Download size={18} />}
            {exporting ? 'Mengekspor...' : 'Export Excel'}
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            disabled={!selectedClass || !selectedSubject}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base"
          >
            <Upload size={18} />
            Import Nilai
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {showRekap 
              ? `Rekap Nilai - ${selectedSubject} - Kelas ${selectedClass}`
              : selectedSubject && selectedType && selectedClass
              ? `Nilai ${selectedType} - ${selectedSubject} - Kelas ${selectedClass}`
              : 'Daftar Nilai Siswa'
            }
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading || loadingRekap 
              ? 'Memuat data...' 
              : showRekap 
              ? `Menampilkan ${filteredRekapData.length} dari ${rekapData.length} siswa`
              : `Menampilkan ${filteredStudents.length} dari ${students.length} siswa`
            }
          </p>
        </div>

        {loading || loadingRekap ? (
          <div className="text-center py-12">
            <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-500 font-medium">Memuat data nilai...</p>
          </div>
        ) : isMobile ? (
          <div className="p-4 space-y-4">
            {showRekap ? (
              filteredRekapData.length > 0 ? (
                filteredRekapData.map((student, index) => (
                  <RekapGradeCard 
                    key={student.nisn} 
                    student={student} 
                    index={index} 
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Tidak ada data rekap nilai'}
                  </p>
                </div>
              )
            ) : (
              filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <StudentGradeCard
                    key={student.nisn}
                    student={student}
                    index={index}
                    selectedType={selectedType}
                    value={student.nilai}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Users size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    {searchTerm 
                      ? 'Tidak ada siswa yang cocok dengan pencarian'
                      : selectedClass && selectedSubject && selectedType
                      ? "Tidak ada siswa di kelas ini"
                      : "Pilih kelas, mata pelajaran, dan jenis nilai"
                    }
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {showRekap ? (
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">NISN</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Siswa</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">NH-1</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">NH-2</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">NH-3</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">NH-4</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">NH-5</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">UTS</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">UAS</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Nilai Akhir</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">NISN</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Siswa</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">{selectedType || 'Nilai'}</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {showRekap ? (
                  filteredRekapData.length > 0 ? (
                    filteredRekapData.map((student) => (
                      <tr key={student.nisn} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{student.no}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.nisn}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{student.nama_siswa}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium">{student.nh1 || '-'}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium">{student.nh2 || '-'}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium">{student.nh3 || '-'}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium">{student.nh4 || '-'}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium">{student.nh5 || '-'}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium">{student.uts || '-'}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium">{student.uas || '-'}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-blue-600">{student.nilai_akhir || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <BookOpen size={48} className="text-gray-300" />
                          <div>
                            <p className="text-gray-500 font-medium">
                              {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Tidak ada data rekap nilai'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                ) : (
                  filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                      <tr key={student.nisn} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.nisn}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{student.nama_siswa}</td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={student.nilai}
                            onChange={(e) => handleInputChange(student.nisn, e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                            placeholder="0-100"
                            disabled={saving}
                          />
                          {student.isExisting && (
                            <div className="mt-1">
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                tersimpan
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users size={48} className="text-gray-300" />
                          <div>
                            <p className="text-gray-500 font-medium">
                              {searchTerm 
                                ? 'Tidak ada siswa yang cocok dengan pencarian'
                                : selectedClass && selectedSubject && selectedType
                                ? "Tidak ada siswa di kelas ini"
                                : "Pilih kelas, mata pelajaran, dan jenis nilai"
                              }
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        selectedClass={selectedClass}
        selectedSubject={selectedSubject}
        userData={userData}
        onImportSuccess={() => {
          if (showRekap) {
            loadRekapNilai();
          } else if (selectedType) {
            loadStudents(false);
          }
        }}
      />
    </div>
  );
};

export default Grades;