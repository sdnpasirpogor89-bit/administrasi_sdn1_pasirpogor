import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Users, UserCheck, BookOpen, Edit3, Trash2, CheckSquare, X } from 'lucide-react';

const SchoolManagementTab = ({ user, loading, setLoading, showToast }) => {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [schoolStats, setSchoolStats] = useState({
    total_students: 0,
    total_teachers: 0,
    active_siswa_baru: 0
  });

  // MODAL STATES
  const [teacherModal, setTeacherModal] = useState({
    show: false,
    mode: 'add',
    data: null
  });

  const [studentModal, setStudentModal] = useState({
    show: false,
    mode: 'add', 
    data: null
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: '',
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

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      setLoading(true);
      
      // Load teachers from users table
      const { data: teachersData, error: teachersError } = await supabase
        .from('users')
        .select('id, username, full_name, role, kelas, is_active')
        .in('role', ['admin', 'guru_kelas', 'guru_mapel'])
        .order('full_name');
      
      if (teachersError) throw teachersError;
      
      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, nisn, nama_siswa, jenis_kelamin, kelas, is_active')
        .eq('is_active', true)
        .order('nama_siswa');
      
      if (studentsError) throw studentsError;
      
      // Load siswa baru (pending applications)
      const { data: siswaBaru, error: siswaBaruError } = await supabase
        .from('siswa_baru')
        .select('id, nama_lengkap, academic_year, status')
        .eq('status', 'pending')
        .eq('academic_year', '2025/2026');
      
      if (siswaBaruError) throw siswaBaruError;
      
      // Group students by class
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
      setSchoolStats({
        total_students: studentsData?.length || 0,
        total_teachers: teachersData?.filter(t => t.is_active).length || 0,
        active_siswa_baru: siswaBaru?.length || 0
      });
      
    } catch (error) {
      console.error('Error loading school data:', error);
      showToast('Error loading school data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // TEACHER FUNCTIONS
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
        password: ''
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

  // STUDENT FUNCTIONS
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

  // TEACHER MODAL COMPONENT
  const TeacherModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UserCheck size={24} />
            <div>
              <h2 className="text-xl font-bold">
                {teacherModal.mode === 'add' ? 'Tambah Guru' : 'Edit Guru'}
              </h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={teacherForm.full_name}
              onChange={(e) => setTeacherForm(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
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
  );

  // STUDENT MODAL COMPONENT
  const StudentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users size={24} />
            <div>
              <h2 className="text-xl font-bold">
                {studentModal.mode === 'add' ? 'Tambah Siswa' : 'Edit Siswa'}
              </h2>
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
  );

  // DELETE CONFIRMATION MODAL
  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-red-50 border-b border-red-200 p-6 rounded-t-xl">
          <div className="flex items-center gap-3">
            <X className="text-red-600" size={24} />
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
  );

  return (
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

      {/* MODALS */}
      {teacherModal.show && <TeacherModal />}
      {studentModal.show && <StudentModal />}
      {deleteConfirm.show && <DeleteConfirmModal />}
    </div>
  );
};

export default SchoolManagementTab;