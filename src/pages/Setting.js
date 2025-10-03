import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  User,
  School,
  Calendar,
  Database,
  Users,
  BookOpen,
  Settings as SettingsIcon,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  Save,
  Trash2,
  Plus,
  Edit3,
  UserCheck,
  MapPin,
  Phone,
  Image,
  Building2,
  CheckSquare,
  X,
  AlertCircle,
  Mail,
  Key,
  GraduationCap
} from 'lucide-react';

const Setting = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  // Profile State
  const [profile, setProfile] = useState({
    username: '', full_name: '', role: '', kelas: ''
  });
  
  // School Settings State
  const [schoolSettings, setSchoolSettings] = useState({
    academic_year: '2025/2026',
    school_name: 'SD Negeri 1 Pasir Pogor',
    school_address: 'Jl. Raya Pasir Pogor No. 22 Cipongkor',
    school_phone: '022-1234567',
    school_logo: null
  });
  const [editingSchoolSettings, setEditingSchoolSettings] = useState(false);
  const [tempSchoolSettings, setTempSchoolSettings] = useState({});
  
  // School Stats
  const [schoolStats, setSchoolStats] = useState({
    academic_year: '2025/2026',
    total_students: 0,
    total_teachers: 0,
    total_classes: 6,
    active_siswa_baru: 0
  });
  
  // Teachers Management
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState({});
  
  // Year Transition
  const [yearTransition, setYearTransition] = useState({
    preview: null,
    newYear: '',
    inProgress: false
  });

  // Backup Restore
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);

  // MODAL STATES
  const [teacherModal, setTeacherModal] = useState({
    show: false,
    mode: 'add', // 'add' or 'edit'
    data: null
  });

  const [studentModal, setStudentModal] = useState({
    show: false,
    mode: 'add', // 'add' or 'edit' 
    data: null
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: '', // 'teacher' or 'student'
    data: null
  });

  // FORM STATES
  const [teacherForm, setTeacherForm] = useState({
    username: '',
    full_name: '',
    role: 'guru_mapel',
    kelas: '',
    password: ''
  });

  const [studentForm, setStudentForm] = useState({
    nisn: '',
    nama_siswa: '',
    jenis_kelamin: 'L',
    kelas: '',
    is_active: true
  });

  // Toast helper
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 5000);
  };

  useEffect(() => {
    loadUserProfile();
    if (activeTab === 'school' || activeTab === 'academic' || activeTab === 'system' || activeTab === 'settings') {
      loadSchoolData();
    }
    if (activeTab === 'settings') {
      loadSchoolSettings();
    }
  }, [activeTab]);

  const loadUserProfile = () => {
    try {
      const userSession = JSON.parse(localStorage.getItem('userSession'));
      if (userSession) {
        setUser(userSession);
        setProfile({
          username: userSession.username || '',
          full_name: userSession.full_name || '',
          role: userSession.role || '',
          kelas: userSession.kelas || ''
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      showToast('Error loading user profile', 'error');
    }
  };

  const loadSchoolSettings = async () => {
    try {
      setLoading(true);
      
      const { data: settingsData, error } = await supabase
        .from('school_settings')
        .select('setting_key, setting_value');
      
      if (error) throw error;
      
      if (settingsData && settingsData.length > 0) {
        const settings = {};
        settingsData.forEach(item => {
          settings[item.setting_key] = item.setting_value;
        });
        setSchoolSettings(prev => ({ ...prev, ...settings }));
        setSchoolStats(prev => ({ ...prev, academic_year: settings.academic_year || '2025/2026' }));
      }
      
    } catch (error) {
      console.error('Error loading school settings:', error);
      showToast('Error loading school settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // LOAD SCHOOL DATA - FIXED QUERIES
  const loadSchoolData = async () => {
    try {
      setLoading(true);
      
      // Load teachers from users table - FIXED
      const { data: teachersData, error: teachersError } = await supabase
        .from('users')
        .select('id, username, full_name, role, kelas, is_active')
        .in('role', ['admin', 'guru_kelas', 'guru_mapel'])
        .order('full_name');
      
      if (teachersError) throw teachersError;
      
      // Load students - FIXED (gunakan nisn dan nama_siswa)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, nisn, nama_siswa, jenis_kelamin, kelas, is_active')
        .eq('is_active', true)
        .order('nama_siswa');
      
      if (studentsError) throw studentsError;
      
      // Load siswa baru (pending applications) - FIXED
      const { data: siswaBaru, error: siswaBaruError } = await supabase
        .from('siswa_baru')
        .select('id, nama_lengkap, academic_year, status')
        .eq('status', 'pending')
        .eq('academic_year', schoolStats.academic_year);
      
      if (siswaBaruError) throw siswaBaruError;
      
      // Group students by class - FIXED (gunakan 'kelas' bukan 'class_id')
      const studentsByClass = {};
      studentsData?.forEach(student => {
        const kelas = student.kelas || 'unassigned';
        if (!studentsByClass[kelas]) {
          studentsByClass[kelas] = [];
        }
        studentsByClass[kelas].push(student);
      });
      
      setTeachers(teachersData || []);
      setStudents(studentsData || []);
      setStudentsByClass(studentsByClass);
      setSchoolStats(prev => ({
        ...prev,
        total_students: studentsData?.length || 0,
        total_teachers: teachersData?.filter(t => t.is_active).length || 0,
        active_siswa_baru: siswaBaru?.length || 0
      }));
      
    } catch (error) {
      console.error('Error loading school data:', error);
      showToast('Error loading school data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // TEACHER FUNCTIONS - FIXED
  const toggleTeacherStatus = async (teacherId, currentStatus) => {
    try {
      setLoading(true);
      
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', teacherId);
      
      if (error) throw error;
      
      showToast(`Teacher ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
      await loadSchoolData();
      
    } catch (error) {
      console.error('Error updating teacher status:', error);
      showToast('Error updating teacher status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateTeacherClass = async (teacherId, newKelas) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .update({ kelas: newKelas })
        .eq('id', teacherId);
      
      if (error) throw error;
      
      showToast('Teacher class assignment updated!', 'success');
      await loadSchoolData();
      
    } catch (error) {
      console.error('Error updating teacher class:', error);
      showToast('Error updating teacher class', 'error');
    } finally {
      setLoading(false);
    }
  };

  // NEW FUNCTION: Update Student Class
  const updateStudentClass = async (studentId, newKelas) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('students')
        .update({ kelas: newKelas })
        .eq('id', studentId);
      
      if (error) throw error;
      
      showToast('Student class updated successfully!', 'success');
      await loadSchoolData();
      
    } catch (error) {
      console.error('Error updating student class:', error);
      showToast('Error updating student class', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openTeacherModal = (mode = 'add', teacherData = null) => {
    if (mode === 'edit' && teacherData) {
      setTeacherForm({
        username: teacherData.username,
        full_name: teacherData.full_name,
        role: teacherData.role,
        kelas: teacherData.kelas || '',
        password: '' // Don't show existing password
      });
    } else {
      setTeacherForm({
        username: '',
        full_name: '',
        role: 'guru_mapel',
        kelas: '',
        password: ''
      });
    }
    
    setTeacherModal({
      show: true,
      mode,
      data: teacherData
    });
  };

  const handleAddTeacher = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .insert([{
          username: teacherForm.username,
          full_name: teacherForm.full_name,
          role: teacherForm.role,
          kelas: teacherForm.kelas || null,
          password: teacherForm.password,
          is_active: true
        }]);
      
      if (error) throw error;
      
      showToast('Teacher added successfully!', 'success');
      setTeacherModal({ show: false, mode: 'add', data: null });
      await loadSchoolData();
      
    } catch (error) {
      console.error('Error adding teacher:', error);
      showToast('Error adding teacher: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        username: teacherForm.username,
        full_name: teacherForm.full_name,
        role: teacherForm.role,
        kelas: teacherForm.kelas || null
      };
      
      // Only update password if provided
      if (teacherForm.password) {
        updateData.password = teacherForm.password;
      }
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', teacherModal.data.id);
      
      if (error) throw error;
      
      showToast('Teacher updated successfully!', 'success');
      setTeacherModal({ show: false, mode: 'add', data: null });
      await loadSchoolData();
      
    } catch (error) {
      console.error('Error updating teacher:', error);
      showToast('Error updating teacher: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', teacherId);
      
      if (error) throw error;
      
      showToast('Teacher deleted successfully!', 'success');
      setDeleteConfirm({ show: false, type: '', data: null });
      await loadSchoolData();
      
    } catch (error) {
      console.error('Error deleting teacher:', error);
      showToast('Error deleting teacher: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // STUDENT FUNCTIONS - FIXED (gunakan nisn dan nama_siswa)
  const openStudentModal = (mode = 'add', studentData = null) => {
    if (mode === 'edit' && studentData) {
      setStudentForm({
        nisn: studentData.nisn,
        nama_siswa: studentData.nama_siswa,
        jenis_kelamin: studentData.jenis_kelamin,
        kelas: studentData.kelas || '',
        is_active: studentData.is_active
      });
    } else {
      setStudentForm({
        nisn: '',
        nama_siswa: '',
        jenis_kelamin: 'L',
        kelas: '',
        is_active: true
      });
    }
    
    setStudentModal({
      show: true,
      mode,
      data: studentData
    });
  };

  const handleAddStudent = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('students')
        .insert([{
          nisn: studentForm.nisn,
          nama_siswa: studentForm.nama_siswa,
          jenis_kelamin: studentForm.jenis_kelamin,
          kelas: studentForm.kelas || null,
          is_active: studentForm.is_active
        }]);
      
      if (error) throw error;
      
      showToast('Student added successfully!', 'success');
      setStudentModal({ show: false, mode: 'add', data: null });
      await loadSchoolData();
      
    } catch (error) {
      console.error('Error adding student:', error);
      showToast('Error adding student: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('students')
        .update({
          nisn: studentForm.nisn,
          nama_siswa: studentForm.nama_siswa,
          jenis_kelamin: studentForm.jenis_kelamin,
          kelas: studentForm.kelas || null,
          is_active: studentForm.is_active
        })
        .eq('id', studentModal.data.id);
      
      if (error) throw error;
      
      showToast('Student updated successfully!', 'success');
      setStudentModal({ show: false, mode: 'add', data: null });
      await loadSchoolData();
      
    } catch (error) {
      console.error('Error updating student:', error);
      showToast('Error updating student: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);
      
      if (error) throw error;
      
      showToast('Student deleted successfully!', 'success');
      setDeleteConfirm({ show: false, type: '', data: null });
      await loadSchoolData();
      
    } catch (error) {
      console.error('Error deleting student:', error);
      showToast('Error deleting student: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSchoolSettings = async () => {
    try {
      setLoading(true);
      
      const updatePromises = Object.entries(tempSchoolSettings).map(([key, value]) => 
        supabase
          .from('school_settings')
          .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' })
      );
      
      const results = await Promise.all(updatePromises);
      const hasError = results.some(result => result.error);
      
      if (hasError) {
        throw new Error('Failed to update some settings');
      }
      
      setSchoolSettings(prev => ({ ...prev, ...tempSchoolSettings }));
      setEditingSchoolSettings(false);
      setTempSchoolSettings({});
      showToast('School settings updated successfully!', 'success');
      
      if (tempSchoolSettings.academic_year) {
        setSchoolStats(prev => ({ ...prev, academic_year: tempSchoolSettings.academic_year }));
      }
      
    } catch (error) {
      console.error('Error updating school settings:', error);
      showToast('Error updating school settings', 'error');
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
      setSchoolSettings(prev => ({ ...prev, academic_year: yearTransition.newYear }));
      
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

  const exportDatabaseBackup = async () => {
    try {
      setLoading(true);
      
      // FIXED: Gunakan table 'attendance' bukan 'attendances'
      const [usersRes, studentsRes, attendanceRes, nilaiRes, siswaBaruRes, schoolSettingsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('students').select('*'),
        supabase.from('attendance').select('*').limit(1000),
        supabase.from('nilai').select('*').limit(1000),
        supabase.from('siswa_baru').select('*'),
        supabase.from('school_settings').select('*')
      ]);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        academic_year: schoolStats.academic_year,
        school_info: schoolSettings,
        data: {
          users: usersRes.data,
          students: studentsRes.data,
          attendance: attendanceRes.data,
          nilai: nilaiRes.data,
          siswa_baru: siswaBaruRes.data,
          school_settings: schoolSettingsRes.data
        },
        stats: {
          total_users: usersRes.data?.length,
          total_students: studentsRes.data?.length,
          total_attendance_records: attendanceRes.data?.length,
          total_nilai_records: nilaiRes.data?.length,
          total_siswa_baru: siswaBaruRes.data?.length
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${schoolSettings.school_name?.replace(/\s+/g, '_')}_backup_${schoolStats.academic_year.replace('/', '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Database backup downloaded successfully!', 'success');
      
    } catch (error) {
      console.error('Error creating backup:', error);
      showToast('Error creating database backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setRestoreFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          setRestorePreview({
            timestamp: backupData.timestamp,
            academic_year: backupData.academic_year,
            school_info: backupData.school_info,
            stats: backupData.stats
          });
        } catch (error) {
          showToast('Invalid backup file format', 'error');
          setRestoreFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const executeRestore = async () => {
    if (!restoreFile) return;
    
    const confirmed = window.confirm(
      `PERINGATAN: Restore akan menimpa semua data yang ada!\n\n` +
      `Backup dari: ${restorePreview.timestamp}\n` +
      `Academic Year: ${restorePreview.academic_year}\n\n` +
      `Tindakan ini TIDAK DAPAT DIBATALKAN. Apakah Anda yakin?`
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          
          // FIXED: Gunakan table 'attendance' bukan 'attendances'
          await supabase.from('attendance').delete().neq('id', 0);
          await supabase.from('nilai').delete().neq('id', 0);
          await supabase.from('siswa_baru').delete().neq('id', 0);
          await supabase.from('students').delete().neq('id', 0);
          await supabase.from('users').delete().neq('id', 0);
          await supabase.from('school_settings').delete().neq('id', 0);
          
          if (backupData.data.school_settings?.length > 0) {
            await supabase.from('school_settings').insert(backupData.data.school_settings);
          }
          
          if (backupData.data.users?.length > 0) {
            await supabase.from('users').insert(backupData.data.users);
          }
          
          if (backupData.data.students?.length > 0) {
            await supabase.from('students').insert(backupData.data.students);
          }
          
          if (backupData.data.attendance?.length > 0) {
            await supabase.from('attendance').insert(backupData.data.attendance);
          }
          
          if (backupData.data.nilai?.length > 0) {
            await supabase.from('nilai').insert(backupData.data.nilai);
          }
          
          if (backupData.data.siswa_baru?.length > 0) {
            await supabase.from('siswa_baru').insert(backupData.data.siswa_baru);
          }
          
          showToast('Database restored successfully!', 'success');
          setRestoreFile(null);
          setRestorePreview(null);
          
          await loadSchoolData();
          await loadSchoolSettings();
          
        } catch (error) {
          console.error('Error restoring backup:', error);
          showToast('Error restoring database: ' + error.message, 'error');
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsText(restoreFile);
      
    } catch (error) {
      console.error('Error reading restore file:', error);
      showToast('Error reading backup file', 'error');
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    ...(user?.role === 'admin' ? [
      { id: 'school', label: 'School Management', icon: School },
      { id: 'academic', label: 'Academic Year', icon: Calendar },
      { id: 'settings', label: 'School Settings', icon: Building2 },
      { id: 'system', label: 'System', icon: Database }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="text-blue-600" size={28} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Pengaturan Sistem</h1>
        </div>
        
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
            toast.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-red-100 border border-red-200 text-red-800' :
            'bg-blue-100 border border-blue-200 text-blue-800'
          }`}>
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <AlertCircle size={20} />}
            <span>{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })}>
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
          <div className="flex min-w-max space-x-1">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 font-medium text-sm transition-colors ${
                    activeTab === tab.id 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Informasi Profile</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={profile.username}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={profile.role.replace('_', ' ')}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kelas Diampu</label>
                  <input
                    type="text"
                    value={profile.kelas || 'Belum ditugaskan'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SCHOOL MANAGEMENT TAB */}
          {activeTab === 'school' && user?.role === 'admin' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">School Management</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => openTeacherModal('add')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Tambah Guru
                  </button>
                  <button
                    onClick={() => openStudentModal('add')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus size={16} />
                    Tambah Siswa
                  </button>
                </div>
              </div>
              
              {/* School Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-blue-600" size={20} />
                    <span className="text-blue-900 font-medium">Total Siswa</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{schoolStats.total_students}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="text-green-600" size={20} />
                    <span className="text-green-900 font-medium">Total Guru</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{schoolStats.total_teachers}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="text-purple-600" size={20} />
                    <span className="text-purple-900 font-medium">Kelas</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{Object.keys(studentsByClass).length}</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="text-orange-600" size={20} />
                    <span className="text-orange-900 font-medium">Siswa Baru</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{schoolStats.active_siswa_baru}</p>
                </div>
              </div>

              {/* Teacher Management */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Management Guru</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nama Guru</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Username</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Kelas</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teachers.map(teacher => (
                        <tr key={teacher.id} className={`hover:bg-gray-50 ${!teacher.is_active ? 'opacity-50 bg-gray-100' : ''}`}>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleTeacherStatus(teacher.id, teacher.is_active)}
                              disabled={loading}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                teacher.is_active 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {teacher.is_active ? <CheckSquare size={12} /> : <X size={12} />}
                              {teacher.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{teacher.full_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">@{teacher.username}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded capitalize">
                              {teacher.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <select
                              value={teacher.kelas || ''}
                              onChange={(e) => updateTeacherClass(teacher.id, e.target.value || null)}
                              disabled={loading || !teacher.is_active}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              <option value="">Pilih Kelas</option>
                              <option value="1">Kelas 1</option>
                              <option value="2">Kelas 2</option>
                              <option value="3">Kelas 3</option>
                              <option value="4">Kelas 4</option>
                              <option value="5">Kelas 5</option>
                              <option value="6">Kelas 6</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openTeacherModal('edit', teacher)}
                                disabled={loading}
                                className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                title="Edit Guru"
                              >
                                <Edit3 size={14} />
                              </button>
                              
                              <button
                                onClick={() => setDeleteConfirm({ 
                                  show: true, 
                                  type: 'teacher', 
                                  data: teacher 
                                })}
                                disabled={loading}
                                className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Hapus Guru"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Management */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Management Siswa</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">NISN</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nama Siswa</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Jenis Kelamin</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Kelas</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map(student => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.nisn}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">{student.nama_siswa}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <select
                              value={student.kelas || ''}
                              onChange={(e) => updateStudentClass(student.id, e.target.value || null)}
                              disabled={loading}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              <option value="">Pilih Kelas</option>
                              <option value="1">Kelas 1</option>
                              <option value="2">Kelas 2</option>
                              <option value="3">Kelas 3</option>
                              <option value="4">Kelas 4</option>
                              <option value="5">Kelas 5</option>
                              <option value="6">Kelas 6</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 text-xs rounded ${
                              student.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.is_active ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openStudentModal('edit', student)}
                                disabled={loading}
                                className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                title="Edit Siswa"
                              >
                                <Edit3 size={14} />
                              </button>
                              
                              <button
                                onClick={() => setDeleteConfirm({ 
                                  show: true, 
                                  type: 'student', 
                                  data: student 
                                })}
                                disabled={loading}
                                className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Hapus Siswa"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Distribution by Class */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Siswa per Kelas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(studentsByClass).map(([kelas, students]) => (
                    <div key={kelas} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">Kelas {kelas}</h4>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {students.length} siswa
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                        {students.slice(0, 5).map(s => s.nama_siswa).join(', ')}
                        {students.length > 5 && ` +${students.length - 5} lainnya`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACADEMIC YEAR TAB */}
          {activeTab === 'academic' && user?.role === 'admin' && (
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
                              {yearTransition.inProgress ? 'Memproses...' : 'Mulai Tahun Ajaran Baru'}
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
          )}

          {/* SCHOOL SETTINGS TAB */}
          {activeTab === 'settings' && user?.role === 'admin' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">School Settings</h2>
                {!editingSchoolSettings && (
                  <button
                    onClick={() => {
                      setEditingSchoolSettings(true);
                      setTempSchoolSettings({ ...schoolSettings });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit3 size={16} />
                    Edit Settings
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* School Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 size={16} className="inline mr-1" />
                      Nama Sekolah
                    </label>
                    {editingSchoolSettings ? (
                      <input
                        type="text"
                        value={tempSchoolSettings.school_name || ''}
                        onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {schoolSettings.school_name}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      Alamat Sekolah
                    </label>
                    {editingSchoolSettings ? (
                      <textarea
                        value={tempSchoolSettings.school_address || ''}
                        onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_address: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    ) : (
                      <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg min-h-[76px]">
                        {schoolSettings.school_address}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone size={16} className="inline mr-1" />
                      Nomor Telepon
                    </label>
                    {editingSchoolSettings ? (
                      <input
                        type="text"
                        value={tempSchoolSettings.school_phone || ''}
                        onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_phone: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {schoolSettings.school_phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Year and Logo */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Tahun Ajaran Aktif
                    </label>
                    {editingSchoolSettings ? (
                      <input
                        type="text"
                        value={tempSchoolSettings.academic_year || ''}
                        onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, academic_year: e.target.value }))}
                        placeholder="2025/2026"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg font-semibold text-blue-800">
                        {schoolSettings.academic_year}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Image size={16} className="inline mr-1" />
                      Logo Sekolah
                    </label>
                    {editingSchoolSettings ? (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={tempSchoolSettings.school_logo || ''}
                          onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_logo: e.target.value }))}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500">URL logo sekolah (opsional)</p>
                      </div>
                    ) : (
                      <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {schoolSettings.school_logo ? (
                          <div className="flex items-center gap-3">
                            <img src={schoolSettings.school_logo} alt="School Logo" className="h-12 w-12 object-contain" />
                            <span className="text-sm text-gray-600">Logo terpasang</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Logo belum diset</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              {editingSchoolSettings && (
                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={updateSchoolSettings}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingSchoolSettings(false);
                      setTempSchoolSettings({});
                    }}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && user?.role === 'admin' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">System Management</h2>
              
              {/* Database Backup */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Database Backup</h3>
                <p className="text-gray-600 mb-4">
                  Download backup lengkap database untuk keperluan keamanan dan migrasi data.
                </p>
                
                <button
                  onClick={exportDatabaseBackup}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  <Download size={18} />
                  {loading ? 'Membuat Backup...' : 'Download Backup Database'}
                </button>
                
                <div className="mt-4 text-xs text-gray-500">
                  <p>Backup akan berisi:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Data pengguna (users table)</li>
                    <li>Data siswa (students table)</li>
                    <li>Data kehadiran terbaru (attendance table - 1000 records terakhir)</li>
                    <li>Data nilai terbaru (nilai table - 1000 records terakhir)</li>
                    <li>Data siswa baru (siswa_baru table)</li>
                    <li>Pengaturan sekolah (school_settings table)</li>
                  </ul>
                </div>
              </div>
              
              {/* Database Restore */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Database Restore</h3>
                <p className="text-gray-600 mb-4">
                  Upload dan restore backup database. <span className="text-red-600 font-medium">PERHATIAN: Ini akan menimpa semua data yang ada!</span>
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Backup File</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFile}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  
                  {restorePreview && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                        <div>
                          <h4 className="font-medium text-yellow-800">Backup File Preview</h4>
                          <div className="text-sm text-yellow-700 mt-2 space-y-1">
                            <p><strong>Tanggal Backup:</strong> {new Date(restorePreview.timestamp).toLocaleString()}</p>
                            <p><strong>Academic Year:</strong> {restorePreview.academic_year}</p>
                            <p><strong>School:</strong> {restorePreview.school_info?.school_name}</p>
                            <p><strong>Data Records:</strong></p>
                            <ul className="list-disc list-inside ml-4">
                              <li>{restorePreview.stats?.total_users || 0} users</li>
                              <li>{restorePreview.stats?.total_students || 0} students</li>
                              <li>{restorePreview.stats?.total_attendance_records || 0} attendance records</li>
                              <li>{restorePreview.stats?.total_nilai_records || 0} nilai records</li>
                              <li>{restorePreview.stats?.total_siswa_baru || 0} siswa baru records</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={executeRestore}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                        >
                          {loading ? 'Restoring...' : 'Execute Restore'}
                        </button>
                        
                        <button
                          onClick={() => {
                            setRestoreFile(null);
                            setRestorePreview(null);
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* System Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Sistem</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                    <p className="text-sm text-gray-600">Supabase PostgreSQL</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Records</label>
                    <p className="text-sm text-gray-600">
                      {schoolStats.total_students + schoolStats.total_teachers} users total
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                    <p className="text-sm text-gray-600">{schoolStats.academic_year}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <p className="text-sm text-gray-600">{schoolSettings.school_name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TEACHER MODAL */}
      {teacherModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserCheck size={24} />
                <div>
                  <h2 className="text-xl font-bold">
                    {teacherModal.mode === 'add' ? 'Tambah Guru' : 'Edit Guru'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {teacherModal.mode === 'add' ? 'Tambahkan data guru baru' : 'Edit data guru'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTeacherModal({ show: false, mode: 'add', data: null })}
                className="p-2 hover:bg-blue-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-1" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={teacherForm.full_name}
                  onChange={(e) => setTeacherForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-1" />
                  Username
                </label>
                <input
                  type="text"
                  value={teacherForm.username}
                  onChange={(e) => setTeacherForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan username"
                />
              </div>

              {teacherModal.mode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Key size={16} className="inline mr-1" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan password"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={teacherForm.role}
                  onChange={(e) => setTeacherForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="guru_mapel">Guru Mata Pelajaran</option>
                  <option value="guru_kelas">Guru Kelas</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kelas Diampu</label>
                <select
                  value={teacherForm.kelas}
                  onChange={(e) => setTeacherForm(prev => ({ ...prev, kelas: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Kelas (Opsional)</option>
                  <option value="1">Kelas 1</option>
                  <option value="2">Kelas 2</option>
                  <option value="3">Kelas 3</option>
                  <option value="4">Kelas 4</option>
                  <option value="5">Kelas 5</option>
                  <option value="6">Kelas 6</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={teacherModal.mode === 'add' ? handleAddTeacher : handleEditTeacher}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Menyimpan...' : (teacherModal.mode === 'add' ? 'Tambah Guru' : 'Update Guru')}
                </button>
                <button
                  onClick={() => setTeacherModal({ show: false, mode: 'add', data: null })}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT MODAL - DENGAN PILIHAN KELAS */}
      {studentModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <GraduationCap size={24} />
                <div>
                  <h2 className="text-xl font-bold">
                    {studentModal.mode === 'add' ? 'Tambah Siswa' : 'Edit Siswa'}
                  </h2>
                  <p className="text-green-100 text-sm">
                    {studentModal.mode === 'add' ? 'Tambahkan data siswa baru' : 'Edit data siswa'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStudentModal({ show: false, mode: 'add', data: null })}
                className="p-2 hover:bg-green-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NISN</label>
                <input
                  type="text"
                  value={studentForm.nisn}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, nisn: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan NISN siswa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Siswa</label>
                <input
                  type="text"
                  value={studentForm.nama_siswa}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, nama_siswa: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan nama lengkap siswa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
                <select
                  value={studentForm.jenis_kelamin}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, jenis_kelamin: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              {/* PILIHAN KELAS - INI YANG DITAMBAHIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
                <select
                  value={studentForm.kelas}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, kelas: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Pilih Kelas</option>
                  <option value="1">Kelas 1</option>
                  <option value="2">Kelas 2</option>
                  <option value="3">Kelas 3</option>
                  <option value="4">Kelas 4</option>
                  <option value="5">Kelas 5</option>
                  <option value="6">Kelas 6</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={studentForm.is_active}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Siswa Aktif</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={studentModal.mode === 'add' ? handleAddStudent : handleEditStudent}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Menyimpan...' : (studentModal.mode === 'add' ? 'Tambah Siswa' : 'Update Siswa')}
                </button>
                <button
                  onClick={() => setStudentModal({ show: false, mode: 'add', data: null })}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-red-50 border-b border-red-200 p-6 rounded-t-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-600" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-red-800">Konfirmasi Hapus</h2>
                  <p className="text-red-600 text-sm">
                    {deleteConfirm.type === 'teacher' ? 'Data guru' : 'Data siswa'} akan dihapus permanen
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Apakah Anda yakin ingin menghapus {deleteConfirm.type === 'teacher' ? 'guru' : 'siswa'} {' '}
                <strong>{deleteConfirm.data?.full_name || deleteConfirm.data?.nama_siswa}</strong>?
              </p>
              <p className="text-sm text-red-600 mb-6">
                Tindakan ini tidak dapat dibatalkan!
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (deleteConfirm.type === 'teacher') {
                      handleDeleteTeacher(deleteConfirm.data.id);
                    } else {
                      handleDeleteStudent(deleteConfirm.data.id);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
                <button
                  onClick={() => setDeleteConfirm({ show: false, type: '', data: null })}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3">
            <RefreshCw className="animate-spin text-blue-600" size={24} />
            <span className="text-gray-800">Memproses...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setting;