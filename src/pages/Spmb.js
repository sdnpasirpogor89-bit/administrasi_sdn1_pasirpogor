import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  ClipboardList,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  UserCheck,
  Phone,
  School,
  CreditCard,
  FileText,
  BarChart3,
  RefreshCw,
} from "lucide-react";

const SPMB = ({ userData }) => {
  // State management
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState("form");
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "" });
  const [connectionError, setConnectionError] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    jenis_kelamin: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat: "",
    nama_ortu: "",
    hp_ortu: "",
    asal_sekolah: "",
  });

  const rowsPerPage = 15;

  // Toast notification function
  const displayToast = (message, type = "success") => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Check Supabase connection
  const checkConnection = async () => {
    try {
      // Test connection with a simple query
      const { error } = await supabase
        .from("siswa_baru")
        .select("count", { count: "exact", head: true })
        .limit(1);
      
      if (error) {
        console.error("Connection test failed:", error);
        setConnectionError(true);
        displayToast("Koneksi ke database gagal: " + error.message, "error");
        return false;
      }
      
      setConnectionError(false);
      return true;
    } catch (error) {
      console.error("Connection test error:", error);
      setConnectionError(true);
      displayToast("Gagal terhubung ke server database", "error");
      return false;
    }
  };

  // Load students from Supabase with retry logic
  const loadStudents = async (retryCount = 0) => {
    setIsLoading(true);
    try {
      // Check connection first
      const isConnected = await checkConnection();
      if (!isConnected && retryCount === 0) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("siswa_baru")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading students:", error);
        
        // Handle specific error types
        if (error.message?.includes('401') || error.code === 'PGRST301') {
          displayToast("Sesi autentikasi berakhir. Silakan refresh halaman.", "error");
        } else if (error.message?.includes('relation') || error.code === 'PGRST116') {
          displayToast("Tabel siswa_baru tidak ditemukan di database", "error");
        } else {
          displayToast("Gagal memuat data: " + error.message, "error");
        }
        
        setConnectionError(true);
        return;
      }

      setStudents(data || []);
      setConnectionError(false);
    } catch (error) {
      console.error("Failed to load students:", error);
      
      if (retryCount < 2) {
        // Retry up to 2 times
        setTimeout(() => loadStudents(retryCount + 1), 2000);
        displayToast(`Mencoba ulang... (${retryCount + 1}/2)`, "info");
      } else {
        setConnectionError(true);
        displayToast("Gagal memuat data setelah beberapa percobaan", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  const saveStudent = async (student) => {
    try {
      // Check connection before saving
      const isConnected = await checkConnection();
      if (!isConnected) {
        return false;
      }

      if (editingStudent) {
        const { error } = await supabase
          .from("siswa_baru")
          .update(student)
          .eq("id", editingStudent.id);

        if (error) {
          console.error("Error updating student:", error);
          
          if (error.message?.includes('401') || error.code === 'PGRST301') {
            displayToast("Sesi autentikasi berakhir. Silakan refresh halaman.", "error");
          } else {
            displayToast("Gagal memperbarui data: " + error.message, "error");
          }
          return false;
        }
        displayToast("Data berhasil diperbarui!", "success");
      } else {
        const { error } = await supabase.from("siswa_baru").insert([student]);

        if (error) {
          console.error("Error inserting student:", error);
          
          if (error.message?.includes('401') || error.code === 'PGRST301') {
            displayToast("Sesi autentikasi berakhir. Silakan refresh halaman.", "error");
          } else if (error.message?.includes('duplicate') || error.code === '23505') {
            displayToast("Data siswa sudah ada di sistem", "error");
          } else {
            displayToast("Gagal menyimpan data: " + error.message, "error");
          }
          return false;
        }
        displayToast("Pendaftaran berhasil!", "success");
      }

      await loadStudents();
      return true;
    } catch (error) {
      console.error("Failed to save student:", error);
      displayToast("Gagal menyimpan data: " + error.message, "error");
      return false;
    }
  };

  // Format date input
  const formatDateInput = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2 && value.length <= 4) {
      value = value.substring(0, 2) + "-" + value.substring(2);
    } else if (value.length > 4) {
      value = value.substring(0, 2) + "-" + value.substring(2, 4) + "-" + value.substring(4, 8);
    }
    e.target.value = value;
    setFormData((prev) => ({ ...prev, tanggal_lahir: value }));
  };

  // Validate date format
  const validateDateFormat = (dateString) => {
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(dateString)) return false;
    
    const [day, month, year] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  // Validate student input
  const validateStudentInput = (student) => {
    const errors = [];
    
    // Name validation
    const nameWords = student.nama.trim().split(" ").filter((word) => word.length > 0);
    if (nameWords.length < 2) {
      errors.push("Nama harus terdiri dari minimal 2 kata");
    }

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(student.nama)) {
      errors.push("Nama hanya boleh mengandung huruf dan spasi");
    }

    // Date validation
    if (!validateDateFormat(student.tanggal_lahir)) {
      errors.push("Format tanggal lahir tidak valid (DD-MM-YYYY)");
      return errors;
    }

    // Age validation
    const [day, month, year] = student.tanggal_lahir.split("-").map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    
    if (birthDate > today) {
      errors.push("Tanggal lahir tidak boleh di masa depan");
      return errors;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (adjustedAge < 5 || adjustedAge > 8) {
      errors.push("Usia siswa harus antara 5-8 tahun untuk SD");
    }

    // Phone validation
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    const cleanPhone = student.hp_ortu.replace(/\s+/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      errors.push("Format nomor HP tidak valid (contoh: 081234567890)");
    }

    // NISN validation (optional) - Removed since PAUD students don't have NISN yet

    return errors;
  };

  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();

    // Check for empty required fields
    const requiredFields = {
      nama: "Nama lengkap",
      jenis_kelamin: "Jenis kelamin",
      tempat_lahir: "Tempat lahir",
      tanggal_lahir: "Tanggal lahir",
      alamat: "Alamat",
      nama_ortu: "Nama orang tua",
      hp_ortu: "HP orang tua",
      asal_sekolah: "Asal sekolah"
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]?.trim()) {
        displayToast(`${label} harus diisi`, "error");
        return;
      }
    }

    const student = {
      nama: formData.nama.trim(),
      jenis_kelamin: formData.jenis_kelamin,
      tempat_lahir: formData.tempat_lahir.trim(),
      tanggal_lahir: formData.tanggal_lahir,
      alamat: formData.alamat.trim(),
      nama_ortu: formData.nama_ortu.trim(),
      hp_ortu: formData.hp_ortu.trim(),
      asal_sekolah: formData.asal_sekolah.trim(),
      tanggal_daftar: editingStudent
        ? editingStudent.tanggal_daftar
        : new Date().toLocaleDateString("en-GB").split("/").join("-"),
    };

    const validationErrors = validateStudentInput(student);
    if (validationErrors.length > 0) {
      displayToast(validationErrors[0], "error");
      return;
    }

    const success = await saveStudent(student);
    if (success) {
      resetForm();
    }
  };

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({
      nama: "",
      jenis_kelamin: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      alamat: "",
      nama_ortu: "",
      hp_ortu: "",
      asal_sekolah: "",
    });
  };

  const editStudent = (id) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;
    setEditingStudent(student);
    setFormData({
      nama: student.nama,
      jenis_kelamin: student.jenis_kelamin,
      tempat_lahir: student.tempat_lahir,
      tanggal_lahir: student.tanggal_lahir,
      alamat: student.alamat,
      nama_ortu: student.nama_ortu,
      hp_ortu: student.hp_ortu,
      asal_sekolah: student.asal_sekolah,
    });
    setCurrentPage("form");
  };

  const deleteStudent = async (id) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;

    if (window.confirm(`Yakin ingin menghapus data ${student.nama}?\n\nTindakan ini tidak dapat dibatalkan!`)) {
      setIsLoading(true);
      try {
        const { error } = await supabase.from("siswa_baru").delete().eq("id", id);
        if (error) {
          displayToast(`Gagal menghapus data: ${error.message}`, "error");
          return;
        }
        await loadStudents();
        displayToast(`Data ${student.nama} berhasil dihapus!`, "success");
      } catch (error) {
        displayToast(`Error tidak terduga: ${error.message}`, "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    if (currentMonth >= 6) {
      return `${currentYear}/${currentYear + 1}`;
    } else {
      return `${currentYear - 1}/${currentYear}`;
    }
  };

  // Retry connection function
  const retryConnection = () => {
    setConnectionError(false);
    loadStudents();
  };

  // Pagination and filtering
  const filteredStudents = students.filter(
    (s) =>
      s.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.asal_sekolah?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPageNum - 1) * rowsPerPage,
    currentPageNum * rowsPerPage
  );

  // Statistics calculations
  const maleStudents = filteredStudents.filter((s) => s.jenis_kelamin === "Laki-laki").length;
  const femaleStudents = filteredStudents.filter((s) => s.jenis_kelamin === "Perempuan").length;
  const totalStudents = filteredStudents.length;

  const schoolStats = {};
  filteredStudents.forEach((s) => {
    const school = s.asal_sekolah || "Tidak Diketahui";
    schoolStats[school] = (schoolStats[school] || 0) + 1;
  });
  const sortedSchools = Object.entries(schoolStats).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Toast Notification */}
      {showToast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          showToast.type === "success" ? "bg-green-500" : 
          showToast.type === "error" ? "bg-red-500" : "bg-blue-500"
        } text-white`}>
          <div className="flex items-center space-x-2">
            {showToast.type === "success" && <CheckCircle size={20} />}
            {showToast.type === "error" && <AlertCircle size={20} />}
            {showToast.type === "info" && <Info size={20} />}
            <span>{showToast.message}</span>
          </div>
        </div>
      )}

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Koneksi ke database bermasalah. Periksa konfigurasi Supabase Anda.
                </p>
              </div>
            </div>
            <button
              onClick={retryConnection}
              className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              <RefreshCw size={14} className="mr-1" />
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-t-lg">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full">
            <FileText size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Sistem Informasi PMB SDN 1 PASIRPOGOR
          </h1>
          <p className="text-blue-100 mb-1">Tahun Ajaran {getCurrentAcademicYear()}</p>
          <p className="text-sm opacity-90">
            {userData?.role === 'admin' ? 'Kelola semua data SPMB' : 'Lihat data SPMB'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setCurrentPage("form")}
          className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
            currentPage === "form"
              ? "border-b-2 border-blue-600 text-blue-600 bg-white"
              : "text-gray-600 hover:text-blue-600"
          }`}
          disabled={userData?.role !== 'admin' && userData?.role !== 'guru_kelas'}
        >
          <Plus size={16} className="inline mr-2" />
          Pendaftaran
        </button>
        <button
          onClick={() => setCurrentPage("list")}
          className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
            currentPage === "list"
              ? "border-b-2 border-blue-600 text-blue-600 bg-white"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <ClipboardList size={16} className="inline mr-2" />
          Daftar Siswa
        </button>
        <button
          onClick={() => setCurrentPage("stats")}
          className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
            currentPage === "stats"
              ? "border-b-2 border-blue-600 text-blue-600 bg-white"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <BarChart3 size={16} className="inline mr-2" />
          Statistik
        </button>
      </nav>

      {/* Content */}
      <div className="p-6">
        {currentPage === "form" && (userData?.role === 'admin' || userData?.role === 'guru_kelas') && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingStudent ? "Edit Data Siswa" : "Formulir Pendaftaran Siswa Baru"}
            </h3>
            <form onSubmit={handleStudentFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-2" />
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap Siswa (min. 2 kata)"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserCheck size={16} className="inline mr-2" />
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Tempat Lahir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-2" />
                    Tempat Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Kota/Kabupaten Kelahiran"
                    value={formData.tempat_lahir}
                    onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY (contoh: 15-08-2018)"
                    value={formData.tanggal_lahir}
                    onChange={formatDateInput}
                    required
                    maxLength="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Nama Orang Tua */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-2" />
                    Nama Orang Tua/Wali <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap Orang Tua/Wali"
                    value={formData.nama_ortu}
                    onChange={(e) => setFormData({ ...formData, nama_ortu: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* HP Orang Tua */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Nomor HP Orang Tua <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="081234567890 atau 0271234567"
                    value={formData.hp_ortu}
                    onChange={(e) => setFormData({ ...formData, hp_ortu: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Asal Sekolah */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <School size={16} className="inline mr-2" />
                    Asal TK/PAUD <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama TK/PAUD Asal"
                    value={formData.asal_sekolah}
                    onChange={(e) => setFormData({ ...formData, asal_sekolah: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>


              </div>

              {/* Alamat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Alamat lengkap tempat tinggal (RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten)"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={connectionError || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={16} className="inline mr-2" />
                  {editingStudent ? "Update Data" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        )}

        {currentPage === "form" && userData?.role !== 'admin' && userData?.role !== 'guru_kelas' && (
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Terbatas</h3>
            <p className="text-gray-600">Anda tidak memiliki akses untuk menambah data siswa baru.</p>
          </div>
        )}

        {currentPage === "list" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Daftar Siswa Terdaftar ({totalStudents})
              </h3>
              <button
                onClick={loadStudents}
                disabled={isLoading}
                className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau asal sekolah..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPageNum(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Siswa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenis Kelamin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asal TK/PAUD
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Daftar
                    </th>
                    {(userData?.role === 'admin' || userData?.role === 'guru_kelas') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <RefreshCw size={20} className="animate-spin mr-2" />
                          Memuat data...
                        </div>
                      </td>
                    </tr>
                  ) : connectionError ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-red-500">
                        <AlertCircle size={24} className="mx-auto mb-2" />
                        <div>Gagal memuat data dari server</div>
                        <button
                          onClick={retryConnection}
                          className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Coba Lagi
                        </button>
                      </td>
                    </tr>
                  ) : paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student, index) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(currentPageNum - 1) * rowsPerPage + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.nama}</div>
                          <div className="text-sm text-gray-500">{student.tempat_lahir}, {student.tanggal_lahir}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.jenis_kelamin === 'Laki-laki' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {student.jenis_kelamin}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.asal_sekolah}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.tanggal_daftar}
                        </td>
                        {(userData?.role === 'admin' || userData?.role === 'guru_kelas') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => editStudent(student.id)}
                                className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <Edit size={14} className="mr-1" />
                                Edit
                              </button>
                              {userData?.role === 'admin' && (
                                <button
                                  onClick={() => deleteStudent(student.id)}
                                  className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 size={14} className="mr-1" />
                                  Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <ClipboardList size={48} className="text-gray-300 mb-2" />
                          <div className="text-lg font-medium mb-1">Belum ada data siswa</div>
                          <div className="text-sm">
                            {searchTerm ? 'Tidak ditemukan hasil pencarian' : 'Mulai tambahkan data siswa baru'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Menampilkan <span className="font-medium">{(currentPageNum - 1) * rowsPerPage + 1}</span> - 
                    <span className="font-medium">{Math.min(currentPageNum * rowsPerPage, totalStudents)}</span> dari 
                    <span className="font-medium"> {totalStudents}</span> data
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPageNum(Math.max(1, currentPageNum - 1))}
                    disabled={currentPageNum === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      if (totalPages <= 5) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPageNum(pageNum)}
                            className={`px-3 py-2 text-sm rounded-md ${
                              currentPageNum === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    })}
                    {totalPages > 5 && (
                      <span className="px-3 py-2 text-sm text-gray-500">
                        Halaman {currentPageNum} dari {totalPages}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setCurrentPageNum(Math.min(totalPages, currentPageNum + 1))}
                    disabled={currentPageNum === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === "stats" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Statistik Pendaftaran
              </h3>
              <div className="text-sm text-gray-500">
                Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Students */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User size={32} className="text-blue-100" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Total Siswa</h4>
                    <p className="text-3xl font-bold">{totalStudents}</p>
                    <p className="text-sm text-blue-100">Siswa terdaftar</p>
                  </div>
                </div>
              </div>

              {/* Gender Statistics */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserCheck size={32} className="text-green-100" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Rasio Gender</h4>
                    <div className="text-sm text-green-100 space-y-1">
                      <div className="flex justify-between">
                        <span>Laki-laki:</span>
                        <span>{maleStudents} ({totalStudents > 0 ? ((maleStudents / totalStudents) * 100).toFixed(1) : 0}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Perempuan:</span>
                        <span>{femaleStudents} ({totalStudents > 0 ? ((femaleStudents / totalStudents) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Year */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar size={32} className="text-purple-100" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Tahun Ajaran</h4>
                    <p className="text-2xl font-bold">{getCurrentAcademicYear()}</p>
                    <p className="text-sm text-purple-100">Periode aktif</p>
                  </div>
                </div>
              </div>
            </div>

            {/* School Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <School size={20} className="mr-2 text-yellow-600" />
                  Asal TK/PAUD Teratas
                </h4>
                <div className="space-y-3">
                  {sortedSchools.length > 0 ? (
                    sortedSchools.slice(0, 5).map(([school, count], index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900 truncate">{school}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-bold text-gray-700 mr-2">{count}</span>
                          <span className="text-xs text-gray-500">
                            ({totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <School size={48} className="mx-auto text-gray-300 mb-2" />
                      <p>Belum ada data asal sekolah</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 size={20} className="mr-2 text-indigo-600" />
                  Ringkasan Data
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">Siswa dengan NISN</span>
                    <span className="font-bold text-blue-600">
                      {filteredStudents.filter(s => s.nisn && s.nisn !== "-").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Pendaftar Hari Ini</span>
                    <span className="font-bold text-green-600">
                      {filteredStudents.filter(s => {
                        const today = new Date().toLocaleDateString("en-GB").split("/").join("-");
                        return s.tanggal_daftar === today;
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-700">Total Asal Sekolah</span>
                    <span className="font-bold text-yellow-600">
                      {Object.keys(schoolStats).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-700">Status Pendaftaran</span>
                    <span className={`font-bold ${totalStudents > 0 ? 'text-purple-600' : 'text-gray-500'}`}>
                      {totalStudents > 0 ? 'Aktif' : 'Belum Dimulai'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                📊 Informasi Pendaftaran Tahun Ajaran {getCurrentAcademicYear()}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="font-semibold text-gray-700">Total Pendaftar</div>
                  <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
                  <div className="text-gray-500">Siswa baru</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="font-semibold text-gray-700">Usia Rata-rata</div>
                  <div className="text-2xl font-bold text-green-600">
                    {totalStudents > 0 ? (
                      (() => {
                        const ages = filteredStudents.map(s => {
                          const [day, month, year] = s.tanggal_lahir.split("-").map(Number);
                          const birthDate = new Date(year, month - 1, day);
                          const today = new Date();
                          let age = today.getFullYear() - birthDate.getFullYear();
                          const monthDiff = today.getMonth() - birthDate.getMonth();
                          const dayDiff = today.getDate() - birthDate.getDate();
                          return monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
                        });
                        return (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1);
                      })()
                    ) : '0'}
                  </div>
                  <div className="text-gray-500">Tahun</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="font-semibold text-gray-700">TK/PAUD Terbanyak</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {sortedSchools.length > 0 ? sortedSchools[0][1] : 0}
                  </div>
                  <div className="text-gray-500">Siswa</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="font-semibold text-gray-700">Status Sistem</div>
                  <div className={`text-2xl font-bold ${connectionError ? 'text-red-600' : 'text-green-600'}`}>
                    {connectionError ? 'Offline' : 'Online'}
                  </div>
                  <div className="text-gray-500">Database</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SPMB;