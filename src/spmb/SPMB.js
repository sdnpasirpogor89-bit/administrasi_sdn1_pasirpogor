import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import StudentForm from './StudentForm';
import StudentList from './StudentList';
import Statistics from './Statistics';

// Custom hook untuk toast notifications
const useToast = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3000);
  }, []);

  return { toast, showToast };
};

// Custom hook untuk academic year
const useAcademicYear = () => {
  const getCurrentAcademicYear = useCallback(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    if (currentMonth >= 7) {
      return `${currentYear + 1}/${currentYear + 2}`;
    } else {
      return `${currentYear}/${currentYear + 1}`;
    }
  }, []);

  return { getCurrentAcademicYear };
};

// Custom hook untuk date conversion
const useDateFormatter = () => {
  const convertDateFormat = useCallback((dateString) => {
    if (!dateString) return null;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateString)) {
      const parts = dateString.split(/[-/]/);
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.warn('Cannot parse date:', dateString);
      return null;
    }
  }, []);

  return { convertDateFormat };
};

// Custom hook untuk students data management - FIXED PAGINATION
const useStudentsData = (userData, showToast) => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { getCurrentAcademicYear } = useAcademicYear();
  const { convertDateFormat } = useDateFormatter();

  // ✅ FIXED: Load students data dengan PAGINATION yang benar
  const loadStudents = useCallback(async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      const rowsPerPage = 20;
      const from = (page - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;

      console.log('🔍 Loading students:', { page, from, to, search });

      let query = supabase
        .from('siswa_baru')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to); // ✅ FIX: Tambah range untuk pagination

      if (search.trim()) {
        query = query.or(`nama_lengkap.ilike.%${search}%,asal_tk.ilike.%${search}%,nama_ayah.ilike.%${search}%,nama_ibu.ilike.%${search}%`);
      }

      const { data, count, error } = await query;
      
      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      const calculatedTotalPages = Math.ceil((count || 0) / rowsPerPage);
      
      console.log('📊 DEBUG PAGINATION SPMB:', {
        dataLength: data?.length,
        count: count,
        from: from,
        to: to,
        rowsPerPage: rowsPerPage,
        calculatedTotalPages: calculatedTotalPages,
        currentPage: page
      });

      setTotalStudents(count || 0);
      setStudents(data || []);

      // Load all students hanya jika tidak ada search dan data belum ada
      if (!search.trim() && allStudents.length === 0) {
        console.log('📥 Loading all students for statistics...');
        const { data: allData } = await supabase
          .from('siswa_baru')
          .select('*')
          .order('created_at', { ascending: false });
        setAllStudents(allData || []);
      } else if (search.trim()) {
        setAllStudents(data || []);
      }

      return { 
        data: data || [], 
        totalPages: calculatedTotalPages,
        totalStudents: count || 0
      };
    } catch (error) {
      console.error('Error loading students:', error);
      showToast('Gagal memuat data siswa', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [allStudents.length, showToast]);

  // Save student dengan optimasi
  const saveStudent = useCallback(async ({ studentData, parentData, isEdit, editingStudent }) => {
    setIsLoading(true);
    try {
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
        result = await supabase
          .from('siswa_baru')
          .update(combinedData)
          .eq('id', editingStudent.id);
      } else {
        result = await supabase
          .from('siswa_baru')
          .insert([combinedData]);
      }

      if (result.error) throw result.error;

      showToast(
        `Data siswa berhasil ${isEdit ? 'diupdate' : 'didaftarkan dan diterima'}!`,
        'success'
      );
      
      return true;
    } catch (error) {
      console.error('Error saving student:', error);
      showToast(
        `Gagal ${isEdit ? 'mengupdate' : 'menyimpan'} data: ${error.message}`,
        'error'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [convertDateFormat, getCurrentAcademicYear, showToast, userData]);

  // Delete student
  const deleteStudent = useCallback(async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('siswa_baru')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Data siswa berhasil dihapus!', 'success');
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      showToast('Gagal menghapus data: ' + error.message, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  return {
    students,
    allStudents,
    totalStudents,
    isLoading,
    loadStudents,
    saveStudent,
    deleteStudent,
    setIsLoading
  };
};

// Main SPMB Component - FIXED PAGINATION
const SPMB = ({ userData }) => {
  const [activeTab, setActiveTab] = useState('form');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);

  const { toast, showToast } = useToast();
  const { getCurrentAcademicYear } = useAcademicYear();
  const {
    students,
    allStudents,
    totalStudents,
    isLoading,
    loadStudents,
    saveStudent,
    deleteStudent
  } = useStudentsData(userData, showToast);

  // ✅ FIXED: Initial load students
  useEffect(() => {
    const initializeData = async () => {
      const result = await loadStudents(1, '');
      if (result && result.totalPages) {
        setTotalPages(result.totalPages);
      }
    };
    
    initializeData();
  }, [loadStudents]);

  // Handle search dengan debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('🔍 Searching:', searchTerm);
      loadStudents(1, searchTerm).then(result => {
        if (result && result.totalPages) {
          setTotalPages(result.totalPages);
          setCurrentPage(1); // Reset ke page 1 saat search
        }
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadStudents]);

  // ✅ FIXED: Handle page change
  const handlePageChange = useCallback(async (page) => {
    console.log('🔄 Changing to page:', page);
    setCurrentPage(page);
    const result = await loadStudents(page, searchTerm);
    if (result && result.totalPages) {
      setTotalPages(result.totalPages);
    }
  }, [searchTerm, loadStudents]);

  // Handle edit student
  const handleEditStudent = useCallback((student) => {
    setEditingStudent(student);
    setActiveTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle form submission
  const handleSaveStudent = useCallback(async (formData) => {
    const success = await saveStudent({
      ...formData,
      editingStudent
    });
    
    if (success) {
      setEditingStudent(null);
      const result = await loadStudents(currentPage, searchTerm);
      if (result && result.totalPages) {
        setTotalPages(result.totalPages);
      }
    }
    
    return success;
  }, [saveStudent, editingStudent, loadStudents, currentPage, searchTerm]);

  // Handle delete student
  const handleDeleteStudent = useCallback(async (id) => {
    const success = await deleteStudent(id);
    if (success) {
      const result = await loadStudents(currentPage, searchTerm);
      if (result && result.totalPages) {
        setTotalPages(result.totalPages);
      }
    }
  }, [deleteStudent, loadStudents, currentPage, searchTerm]);

  // Handle refresh data
  const handleRefreshData = useCallback(async () => {
    console.log('🔄 Refreshing data...');
    const result = await loadStudents(currentPage, searchTerm);
    if (result && result.totalPages) {
      setTotalPages(result.totalPages);
    }
  }, [loadStudents, currentPage, searchTerm]);

  // Calculate statistics
  const maleStudents = allStudents.filter(s => s.jenis_kelamin === 'Laki-laki').length;
  const femaleStudents = allStudents.filter(s => s.jenis_kelamin === 'Perempuan').length;

  // Mobile bottom navigation items
  const navItems = [
    { key: 'form', icon: 'fa-file-alt', label: 'Form', fullLabel: 'Form Pendaftaran' },
    { key: 'list', icon: 'fa-list', label: 'Data', fullLabel: 'Data Siswa' },
    { key: 'stats', icon: 'fa-chart-bar', label: 'Stats', fullLabel: 'Statistik' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-6">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 animate-slide-down max-w-sm ${
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
              <span className="text-sm">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 shadow-sm border border-blue-100">
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-light text-gray-800 tracking-wide">
              Sistem Penerimaan Murid Baru (SPMB)
            </h1>
            <div className="w-20 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 mx-auto"></div>
            <p className="text-gray-700 text-base sm:text-lg">SDN 1 PASIR POGOR</p>
            <p className="text-blue-600 font-medium bg-white/60 px-4 py-2 rounded-full inline-block text-sm sm:text-base">
              Pendaftaran Siswa Baru Tahun Ajaran {getCurrentAcademicYear()}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex-1 p-4 font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === item.key
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.fullLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {activeTab === 'form' && (
            <StudentForm
              editingStudent={editingStudent}
              setEditingStudent={setEditingStudent}
              students={allStudents}
              onSaveStudent={handleSaveStudent}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'list' && (
            <StudentList
              students={students}
              allStudents={allStudents}
              totalStudents={totalStudents}
              currentPageNum={currentPage} // ✅ FIX: Ganti jadi currentPageNum
              totalPages={totalPages}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onLoadStudents={handleRefreshData} // ✅ FIX: Ganti jadi handleRefreshData
              onPageChange={handlePageChange}
              isLoading={isLoading}
              rowsPerPage={20}
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

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-40">
        <div className="flex">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex-1 p-3 font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                activeTab === item.key
                  ? 'text-blue-500 bg-blue-50'
                  : 'text-gray-600'
              }`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SPMB;