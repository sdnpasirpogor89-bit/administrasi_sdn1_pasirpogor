import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import StudentForm from './StudentForm';
import StudentList from './StudentList';
import Statistics from './Statistics';

const SPMB = ({ userData }) => {
  // State untuk tab navigation
  const [activeTab, setActiveTab] = useState('form');
  
  // State untuk data siswa
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const rowsPerPage = 20;
  
  // State untuk editing
  const [editingStudent, setEditingStudent] = useState(null);
  
  // State untuk toast/notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Helper function untuk academic year
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    if (currentMonth >= 5) { // Juni-Desember (bulan 5-11)
      return `${currentYear + 1}/${currentYear + 2}`;
    } else { // Januari-Mei (bulan 0-4)  
      return `${currentYear}/${currentYear + 1}`;
    }
  };

  // Load students data
  const loadStudents = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('siswa_baru')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (search.trim()) {
        query = query.or(`nama_lengkap.ilike.%${search}%,asal_tk.ilike.%${search}%,nama_ayah.ilike.%${search}%,nama_ibu.ilike.%${search}%`);
      }

      // Get total count first
      const { count } = await query;
      setTotalStudents(count || 0);
      setTotalPages(Math.ceil((count || 0) / rowsPerPage));

      // Get paginated data
      const startIndex = (page - 1) * rowsPerPage;
      const { data, error } = await query
        .range(startIndex, startIndex + rowsPerPage - 1);

      if (error) throw error;

      setStudents(data || []);
      setCurrentPage(page);

      // Load all students for export and statistics (without pagination)
      if (!search.trim()) {
        const { data: allData } = await supabase
          .from('siswa_baru')
          .select('*')
          .order('created_at', { ascending: false });
        
        setAllStudents(allData || []);
      } else {
        setAllStudents(data || []);
      }

    } catch (error) {
      console.error('Error loading students:', error);
      showToast('Gagal memuat data siswa', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Save student (create or update)
  const saveStudent = async ({ studentData, parentData, isEdit }) => {
    setIsLoading(true);
    try {
      // Helper function untuk convert date format
      const convertDateFormat = (dateString) => {
        if (!dateString) return null;
        
        // Jika sudah format YYYY-MM-DD, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }
        
        // Jika format DD-MM-YYYY atau DD/MM/YYYY, convert ke YYYY-MM-DD
        if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateString)) {
          const parts = dateString.split(/[-/]/);
          const day = parts[0];
          const month = parts[1]; 
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
        
        // Fallback: coba parse dengan Date object
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return null;
          return date.toISOString().split('T')[0]; // YYYY-MM-DD
        } catch (e) {
          console.warn('Cannot parse date:', dateString);
          return null;
        }
      };

      // Combine student and parent data
      const combinedData = {
        nama_lengkap: studentData.nama,
        jenis_kelamin: studentData.jenis_kelamin,
        tempat_lahir: studentData.tempat_lahir,
        tanggal_lahir: convertDateFormat(studentData.tanggal_lahir),
        asal_tk: studentData.asal_sekolah,
        nisn: studentData.nisn,
        academic_year: getCurrentAcademicYear(),
        status: 'Aktif',
        tanggal_daftar: convertDateFormat(studentData.tanggal_daftar),
        nama_ayah: parentData.nama_ayah,
        pekerjaan_ayah: parentData.pekerjaan_ayah,
        pendidikan_ayah: parentData.pendidikan_ayah,
        nama_ibu: parentData.nama_ibu,
        pekerjaan_ibu: parentData.pekerjaan_ibu,
        pendidikan_ibu: parentData.pendidikan_ibu,
        no_hp: parentData.no_hp,
        alamat: parentData.alamat,
        user_id: userData?.id || null,
      };

      let result;
      if (isEdit && editingStudent) {
        // Update existing student
        result = await supabase
          .from('siswa_baru')
          .update(combinedData)
          .eq('id', editingStudent.id);
      } else {
        // Create new student
        result = await supabase
          .from('siswa_baru')
          .insert([combinedData]);
      }

      if (result.error) {
        console.error('Detailed Supabase error:', result.error);
        throw result.error;
      }

      showToast(
        `Data siswa berhasil ${isEdit ? 'diupdate' : 'didaftarkan dan diterima'}!`,
        'success'
      );
      
      // Reload data
      await loadStudents(currentPage, searchTerm);
      
      return true;
    } catch (error) {
      console.error('Error saving student:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      showToast(
        `Gagal ${isEdit ? 'mengupdate' : 'menyimpan'} data: ${error.message}`,
        'error'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete student
  const deleteStudent = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('siswa_baru')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Data siswa berhasil dihapus!', 'success');
      await loadStudents(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deleting student:', error);
      showToast('Gagal menghapus data: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toast notification
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  // Search handler
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    loadStudents(1, value);
  };

  // Page change handler
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      loadStudents(page, searchTerm);
    }
  };

  // Edit student handler
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setActiveTab('form');
  };

  // Load initial data
  useEffect(() => {
    loadStudents();
  }, []);

  // Calculate statistics
  const maleStudents = allStudents.filter(s => s.jenis_kelamin === 'Laki-laki').length;
  const femaleStudents = allStudents.filter(s => s.jenis_kelamin === 'Perempuan').length;
  const startIndex = (currentPage - 1) * rowsPerPage;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 animate-slide-down ${
          toast.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
          'bg-blue-50 border-blue-400 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            <i className={`fas ${
              toast.type === 'success' ? 'fa-check-circle' :
              toast.type === 'error' ? 'fa-exclamation-circle' :
              'fa-info-circle'
            }`}></i>
            {toast.message}
          </div>
        </div>
      )}

      {/* Page Header - Subtle Color Background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 shadow-sm border border-blue-100">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-light text-gray-800 tracking-wide">
            Sistem Penerimaan Murid Baru (SPMB)
          </h1>
          <div className="w-20 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 mx-auto"></div>
          <p className="text-gray-700 text-lg">SDN 1 PASIR POGOR</p>
          <p className="text-blue-600 font-medium bg-white/60 px-4 py-2 rounded-full inline-block">
            Pendaftaran TA {getCurrentAcademicYear()}
          </p>
        </div>
      </div>

      {/* Navigation Tabs - Clean White */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 p-4 font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'form'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-file-alt"></i>
            <span className="hidden sm:inline">Form Pendaftaran</span>
            <span className="sm:hidden">Form</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 p-4 font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'list'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-list"></i>
            <span className="hidden sm:inline">Data Siswa</span>
            <span className="sm:hidden">Data</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 p-4 font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-chart-bar"></i>
            <span className="hidden sm:inline">Statistik</span>
            <span className="sm:hidden">Stats</span>
          </button>
        </div>
      </div>

      {/* Tab Content - Clean White */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'form' && (
          <StudentForm
            editingStudent={editingStudent}
            setEditingStudent={setEditingStudent}
            students={allStudents}
            onSaveStudent={saveStudent}
            onLoadStudents={() => loadStudents(currentPage, searchTerm)}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'list' && (
          <StudentList
            students={students}
            allStudents={allStudents}
            totalStudents={totalStudents}
            currentPageNum={currentPage}
            totalPages={totalPages}
            searchTerm={searchTerm}
            onSearch={handleSearch}
            onEditStudent={handleEditStudent}
            onDeleteStudent={deleteStudent}
            onLoadStudents={() => loadStudents(currentPage, searchTerm)}
            onPageChange={handlePageChange}
            onSetCurrentPage={setActiveTab}
            isLoading={isLoading}
            startIndex={startIndex}
            rowsPerPage={rowsPerPage}
            showToast={showToast}
          />
        )}

        {activeTab === 'stats' && (
          <Statistics
            students={allStudents}
            totalStudents={totalStudents}
            maleStudents={maleStudents}
            femaleStudents={femaleStudents}
            getCurrentAcademicYear={getCurrentAcademicYear}
          />
        )}
      </div>
    </div>
  </div>
  );
};

export default SPMB;