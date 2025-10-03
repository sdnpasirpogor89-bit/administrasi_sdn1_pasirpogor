import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Eye, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const AcademicYearTab = ({ user, loading, setLoading, showToast }) => {
  const [schoolStats, setSchoolStats] = useState({
    academic_year: '2025/2026',
    total_students: 0
  });
  const [studentsByClass, setStudentsByClass] = useState({});
  const [yearTransition, setYearTransition] = useState({
    preview: null,
    newYear: '',
    inProgress: false
  });

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      setLoading(true);
      
      // Load school settings for academic year
      const { data: settingsData, error: settingsError } = await supabase
        .from('school_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'academic_year');
      
      if (settingsError) throw settingsError;

      const academicYear = settingsData?.[0]?.setting_value || '2025/2026';
      
      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, nisn, nama_siswa, jenis_kelamin, kelas, is_active')
        .eq('is_active', true)
        .order('nama_siswa');
      
      if (studentsError) throw studentsError;
      
      // Group students by class
      const studentsByClass = {};
      studentsData?.forEach(student => {
        const kelas = student.kelas || 'unassigned';
        if (!studentsByClass[kelas]) {
          studentsByClass[kelas] = [];
        }
        studentsByClass[kelas].push(student);
      });
      
      setStudentsByClass(studentsByClass);
      setSchoolStats({
        academic_year: academicYear,
        total_students: studentsData?.length || 0
      });
      
    } catch (error) {
      console.error('Error loading school data:', error);
      showToast('Error loading school data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateYearTransitionPreview = () => {
    const currentYear = schoolStats.academic_year;
    const [startYear] = currentYear.split('/');
    const newYear = `${parseInt(startYear) + 1}/${parseInt(startYear) + 2}`;
    
    const promotionPlan = {};
    const graduatingStudents = [];
    
    Object.entries(studentsByClass).forEach(([kelas, students]) => {
      const grade = parseInt(kelas);
      
      if (grade === 6) {
        graduatingStudents.push(...students);
      } else if (grade >= 1 && grade <= 5) {
        const nextGrade = grade + 1;
        if (!promotionPlan[nextGrade]) {
          promotionPlan[nextGrade] = [];
        }
        promotionPlan[nextGrade].push(...students);
      }
    });
    
    setYearTransition({
      preview: {
        currentYear,
        newYear,
        promotions: promotionPlan,
        graduating: graduatingStudents
      },
      newYear,
      inProgress: false
    });
  };

  const executeYearTransition = async () => {
    const confirmed = window.confirm(
      `PERINGATAN: Tindakan ini akan:\n\n` +
      `1. Menaikkan semua siswa ke kelas berikutnya\n` +
      `2. Mengubah tahun ajaran menjadi ${yearTransition.newYear}\n` +
      `3. Meluluskan siswa kelas 6\n\n` +
      `Tindakan ini TIDAK DAPAT DIBATALKAN. Apakah Anda yakin?`
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      setYearTransition(prev => ({ ...prev, inProgress: true }));
      
      const { preview } = yearTransition;
      
      if (preview.graduating.length > 0) {
        const graduatingIds = preview.graduating.map(s => s.id);
        
        const { error: graduateError } = await supabase
          .from('students')
          .update({ is_active: false, kelas: 'lulus' })
          .in('id', graduatingIds);
        
        if (graduateError) throw graduateError;
      }
      
      for (const [newGrade, students] of Object.entries(preview.promotions)) {
        const studentIds = students.map(s => s.id);
        
        const { error: promoteError } = await supabase
          .from('students')
          .update({ kelas: newGrade })
          .in('id', studentIds);
        
        if (promoteError) throw promoteError;
      }
      
      const { error: teacherResetError } = await supabase
        .from('users')
        .update({ kelas: null })
        .in('role', ['guru_kelas', 'guru_mapel']);
      
      if (teacherResetError) throw teacherResetError;
      
      const { error: settingError } = await supabase
        .from('school_settings')
        .update({ setting_value: yearTransition.newYear })
        .eq('setting_key', 'academic_year');
      
      if (settingError) throw settingError;
      
      setSchoolStats(prev => ({ ...prev, academic_year: yearTransition.newYear }));
      
      showToast(`Academic year ${yearTransition.newYear} started successfully! Please reassign teachers to classes.`, 'success');
      
      await loadSchoolData();
      setYearTransition({ preview: null, newYear: '', inProgress: false });
      
    } catch (error) {
      console.error('Error executing year transition:', error);
      showToast('Error starting new academic year: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setYearTransition(prev => ({ ...prev, inProgress: false }));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Academic Year Management</h2>
      
      {/* Current Academic Year */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-blue-900">Tahun Ajaran Aktif</h3>
        </div>
        <p className="text-3xl font-bold text-blue-600 mb-2">{schoolStats.academic_year}</p>
        <p className="text-blue-700">
          {schoolStats.total_students} siswa aktif dalam {Object.keys(studentsByClass).length} kelas
        </p>
      </div>

      {/* Year Transition */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Transisi Tahun Ajaran</h3>
            <p className="text-gray-600 text-sm">
              Kelola perpindahan ke tahun ajaran berikutnya
            </p>
          </div>
          
          {!yearTransition.preview && (
            <button
              onClick={generateYearTransitionPreview}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Eye size={16} />
              Preview Naik Kelas
            </button>
          )}
        </div>
        
        {/* Transition Preview */}
        {yearTransition.preview && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-600" size={20} />
              <h4 className="font-semibold text-gray-800">
                Preview Transisi: {yearTransition.preview.currentYear} → {yearTransition.preview.newYear}
              </h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Promotions */}
              <div>
                <h5 className="font-medium text-gray-800 mb-3">Siswa Naik Kelas</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(yearTransition.preview.promotions).map(([grade, students]) => (
                    <div key={grade} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-600">→ Kelas {grade}</span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {students.length} siswa
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Graduating */}
              <div>
                <h5 className="font-medium text-gray-800 mb-3">Siswa Lulus</h5>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-green-600">Kelas 6 → Lulus</span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      {yearTransition.preview.graduating.length} siswa
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Execute Button */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-yellow-800 font-medium mb-2">Peringatan: Tindakan Permanen</p>
                  <ul className="text-yellow-700 text-sm space-y-1 mb-4 list-disc list-inside">
                    <li>Semua siswa akan naik kelas</li>
                    <li>Siswa kelas 6 akan diluluskan</li>
                    <li>Assignment guru akan direset</li>
                    <li>Tahun ajaran berubah ke {yearTransition.preview.newYear}</li>
                  </ul>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={executeYearTransition}
                      disabled={loading || yearTransition.inProgress}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      {yearTransition.inProgress ? (
                        <>
                          <RefreshCw className="animate-spin inline mr-2" size={16} />
                          Memproses...
                        </>
                      ) : 'Mulai Tahun Ajaran Baru'}
                    </button>
                    
                    <button
                      onClick={() => setYearTransition({ preview: null, newYear: '', inProgress: false })}
                      disabled={yearTransition.inProgress}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicYearTab;