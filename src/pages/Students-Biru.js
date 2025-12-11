import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Users,
  Search,
  School,
  UserCheck,
  User,
  Filter,
  X,
  Download, // DIPERLUKAN UNTUK StudentsExcelActions
  Upload, // DIPERLUKAN UNTUK StudentsExcelActions
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// WAJIB: Import komponen action dari StudentsExcel.js
import { StudentsExcelActions } from "./StudentsExcel"; // <--- SUDAH DIAKTIFKAN

// Compact Stats Card Component (Dark Mode Added)
const StatsCard = ({ icon: Icon, number, label, color }) => {
  // ... (Kode StatsCard)
  const colorClasses = {
    blue: "border-l-blue-500 bg-gradient-to-r from-blue-50 to-white dark:to-slate-800 dark:from-blue-900/40",
    green:
      "border-l-green-500 bg-gradient-to-r from-green-50 to-white dark:to-slate-800 dark:from-green-900/40",
    purple:
      "border-l-purple-500 bg-gradient-to-r from-purple-50 to-white dark:to-slate-800 dark:from-purple-900/40",
    orange:
      "border-l-orange-500 bg-gradient-to-r from-orange-50 to-white dark:to-slate-800 dark:from-orange-900/40",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 ${colorClasses[color]} p-3 sm:p-4 hover:shadow-md transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
            {number}
          </p>
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400">
            {label}
          </p>
        </div>
        {/* Responsive icon display */}
        <Icon
          size={24}
          className={`${iconColorClasses[color]} hidden sm:block`}
        />
        <Icon size={20} className={`${iconColorClasses[color]} sm:hidden`} />
      </div>
    </div>
  );
};

// Status Badge Component (Dark Mode Added)
const StatusBadge = ({ isActive }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? "bg-green-100 text-green-800 border border-green-200 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
          : "bg-red-100 text-red-800 border border-red-200 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
      }`}>
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
};

// Action Button Component (Dark Mode Added - Secondary variant)
const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "primary",
  disabled = false,
}) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary:
      "bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
};

// Toast Notification Component (Dark Mode Added)
const Toast = ({ message, type = "success", onClose }) => {
  const bgColor =
    type === "success"
      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700"
      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700";
  const textColor =
    type === "success"
      ? "text-green-800 dark:text-green-300"
      : "text-red-800 dark:text-red-300";
  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div
      className={`fixed top-4 right-4 z-50 border rounded-lg p-4 shadow-lg ${bgColor} animate-in slide-in-from-right-5 duration-300`}>
      <div className="flex items-center gap-3">
        <Icon size={20} className={textColor} />
        <p className={`font-medium ${textColor}`}>{message}</p>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X size={16} className={textColor} />
        </button>
      </div>
    </div>
  );
};

// Mobile Student Card Component (Dark Mode Added)
const StudentCard = ({ student, index, onEdit, onDelete }) => {
  // ... (Kode StudentCard)
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              #{index + 1}
            </span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
              {student.nama_siswa}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">
            NISN: {student.nisn}
          </p>
        </div>
        <StatusBadge isActive={student.is_active} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <School size={14} className="text-gray-400 dark:text-slate-500" />
          <span className="text-gray-700 dark:text-slate-300">
            Kelas {student.kelas}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <User size={14} className="text-gray-400 dark:text-slate-500" />
          <span className="text-gray-700 dark:text-slate-300">
            {student.jenis_kelamin}
          </span>
        </div>
      </div>

      {/* Action Buttons for Mobile */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
        <button
          onClick={() => onEdit(student)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
          <Edit size={14} />
          Edit
        </button>
        <button
          onClick={() => onDelete(student)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
          <Trash2 size={14} />
          Hapus
        </button>
      </div>
    </div>
  );
};

// Student Form Modal Component (Dark Mode Added)
const StudentFormModal = ({ show, onClose, student, onSave }) => {
  // ... (Kode StudentFormModal)
  const [formData, setFormData] = useState({
    nisn: "",
    nama_siswa: "",
    kelas: "",
    jenis_kelamin: "Laki-laki",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        nisn: student.nisn || "",
        nama_siswa: student.nama_siswa || "",
        kelas: student.kelas?.toString() || "",
        jenis_kelamin: student.jenis_kelamin || "Laki-laki",
        is_active: student.is_active !== undefined ? student.is_active : true,
      });
    } else {
      setFormData({
        nisn: "",
        nama_siswa: "",
        kelas: "",
        jenis_kelamin: "Laki-laki",
        is_active: true,
      });
    }
  }, [student, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        ...formData,
        kelas: parseInt(formData.kelas),
        id: student?.id,
      });
      onClose();
    } catch (error) {
      console.error("Error saving student:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    // Responsive modal sizing (Max-w-md on all screens)
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {student ? "Edit Siswa" : "Tambah Siswa Baru"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-900 dark:text-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              NISN *
            </label>
            <input
              type="text"
              required
              value={formData.nisn}
              onChange={(e) =>
                setFormData({ ...formData, nisn: e.target.value })
              }
              className="w-full px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              placeholder="Masukkan NISN"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Nama Siswa *
            </label>
            <input
              type="text"
              required
              value={formData.nama_siswa}
              onChange={(e) =>
                setFormData({ ...formData, nama_siswa: e.target.value })
              }
              className="w-full px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          {/* Responsive form grid (2 cols on all sizes, good for mobile) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Kelas *
              </label>
              <select
                required
                value={formData.kelas}
                onChange={(e) =>
                  setFormData({ ...formData, kelas: e.target.value })
                }
                className="w-full px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                <option value="" className="dark:bg-slate-800">
                  Pilih Kelas
                </option>
                {[1, 2, 3, 4, 5, 6].map((kelas) => (
                  <option
                    key={kelas}
                    value={kelas}
                    className="dark:bg-slate-800">
                    Kelas {kelas}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Jenis Kelamin *
              </label>
              <select
                required
                value={formData.jenis_kelamin}
                onChange={(e) =>
                  setFormData({ ...formData, jenis_kelamin: e.target.value })
                }
                className="w-full px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                <option value="Laki-laki" className="dark:bg-slate-800">
                  Laki-laki
                </option>
                <option value="Perempuan" className="dark:bg-slate-800">
                  Perempuan
                </option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-900"
            />
            <label
              htmlFor="is_active"
              className="text-sm text-gray-700 dark:text-slate-300">
              Siswa Aktif
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50">
              {loading ? "Menyimpan..." : student ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal (Dark Mode Added)
const DeleteModal = ({ show, onClose, student, onConfirm }) => {
  // ... (Kode DeleteModal)
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(student);
      onClose();
    } catch (error) {
      console.error("Error deleting student:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Trash2 size={24} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Hapus Siswa
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus siswa ini?
            </p>
          </div>
        </div>

        {student && (
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
            <p className="font-medium text-gray-900 dark:text-slate-100">
              {student.nama_siswa}
            </p>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              NISN: {student.nisn}
            </p>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Kelas: {student.kelas}
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
          Data Yang Dihapus Permanen Dan Tidak Dapat Dikembalikan.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm">
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50">
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile Filter Modal (Dark Mode Added)
const FilterModal = ({
  // ... (Kode FilterModal)
  show,
  onClose,
  selectedClass,
  setSelectedClass,
  genderFilter,
  setGenderFilter,
  userData,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Filter Siswa
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-900 dark:text-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Kelas
            </label>
            {userData.role !== "guru_kelas" ? (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                <option value="" className="dark:bg-slate-800">
                  Semua Kelas
                </option>
                {[1, 2, 3, 4, 5, 6].map((kelas) => (
                  <option
                    key={kelas}
                    value={kelas}
                    className="dark:bg-slate-800">
                    Kelas {kelas}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-sm">
                Kelas {userData.kelas}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Jenis Kelamin
            </label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
              <option value="" className="dark:bg-slate-800">
                Semua
              </option>
              <option value="Laki-laki" className="dark:bg-slate-800">
                Laki-laki
              </option>
              <option value="Perempuan" className="dark:bg-slate-800">
                Perempuan
              </option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setSelectedClass("");
              setGenderFilter("");
            }}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm">
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Students Component - PRODUCTION READY (Dark Mode Added)
const Students = ({ userData }) => {
  // ... (Kode Students setup)
  // All hooks must be called first
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [stats, setStats] = useState({
    totalKelas: 0,
    totalSiswa: 0,
    lakiLaki: 0,
    perempuan: 0,
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);

  // Auto hide toast (No changes)
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch students data from Supabase (No changes)
  const fetchStudents = async () => {
    try {
      setLoading(true);

      let query = supabase.from("students").select("*");

      // Role-based query filtering
      if (userData.role === "guru_kelas") {
        query = query.eq("kelas", parseInt(userData.kelas));
      }

      // Order by class and name
      query = query
        .order("kelas", { ascending: true })
        .order("nama_siswa", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      const studentsData = data || [];
      setStudents(studentsData);

      // Calculate statistics
      const uniqueClasses = [...new Set(studentsData.map((s) => s.kelas))]
        .length;
      const totalStudents = studentsData.length;
      const maleStudents = studentsData.filter(
        (s) => s.jenis_kelamin === "Laki-laki"
      ).length;
      const femaleStudents = studentsData.filter(
        (s) => s.jenis_kelamin === "Perempuan"
      ).length;

      setStats({
        totalKelas: uniqueClasses,
        totalSiswa: totalStudents,
        lakiLaki: maleStudents,
        perempuan: femaleStudents,
      });
    } catch (error) {
      console.error("Error fetching students:", error);
      showToast("Terjadi kesalahan saat mengambil data siswa", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchStudents();
    }
  }, [userData]);

  // Show toast notification (No changes)
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Hapus Fungsi handleImport - Dipindah ke StudentsExcel.js

  // Save student (create or update) (No changes)
  const handleSaveStudent = async (studentData) => {
    try {
      if (studentData.id) {
        // Update existing student
        const { error } = await supabase
          .from("students")
          .update({
            nisn: studentData.nisn,
            nama_siswa: studentData.nama_siswa,
            kelas: studentData.kelas,
            jenis_kelamin: studentData.jenis_kelamin,
            is_active: studentData.is_active,
          })
          .eq("id", studentData.id);

        if (error) throw error;
        showToast("Data siswa berhasil diupdate");
      } else {
        // Create new student
        const { error } = await supabase.from("students").insert([
          {
            nisn: studentData.nisn,
            nama_siswa: studentData.nama_siswa,
            kelas: studentData.kelas,
            jenis_kelamin: studentData.jenis_kelamin,
            is_active: studentData.is_active,
          },
        ]);

        if (error) throw error;
        showToast("Siswa baru berhasil ditambahkan");
      }

      fetchStudents(); // Refresh data
    } catch (error) {
      console.error("Error saving student:", error);
      showToast("Gagal menyimpan data siswa", "error");
      throw error;
    }
  };

  // Delete student (hard delete) (No changes)
  const handleDeleteStudent = async (student) => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id);

      if (error) throw error;

      showToast("Siswa berhasil dihapus permanen");
      fetchStudents(); // Refresh data
    } catch (error) {
      console.error("Error deleting student:", error);
      showToast("Gagal menghapus siswa", "error");
      throw error;
    }
  };

  // Open edit modal (No changes)
  const handleEdit = (student) => {
    setSelectedStudent(student);
    setShowFormModal(true);
  };

  // Open delete modal (No changes)
  const handleDelete = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Open add modal (No changes)
  const handleAdd = () => {
    setSelectedStudent(null);
    setShowFormModal(true);
  };

  // Validation after hooks (Dark Mode Added)
  if (!userData) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <div className="w-10 h-10 border-3 border-red-100 dark:border-red-900/20 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <p className="text-red-600 font-medium">
            Error: Data user tidak tersedia
          </p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
            Silakan login kembali
          </p>
        </div>
      </div>
    );
  }

  if (!userData.role || !userData.username) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <p className="text-red-600 font-medium">
            Error: Data user tidak lengkap
          </p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
            Hubungi administrator sistem
          </p>
        </div>
      </div>
    );
  }

  // Filter students based on search and filters (No changes)
  const filteredStudents = students.filter((student) => {
    if (
      (userData.role === "admin" || userData.role === "guru_mapel") &&
      selectedClass &&
      student.kelas.toString() !== selectedClass
    ) {
      return false;
    }

    if (
      searchTerm &&
      !student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !student.nisn.includes(searchTerm)
    ) {
      return false;
    }

    if (genderFilter && student.jenis_kelamin !== genderFilter) {
      return false;
    }

    return true;
  });

  // Active filters count for badge (No changes)
  const activeFiltersCount = [selectedClass, genderFilter].filter(
    Boolean
  ).length;

  if (loading && students.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <div className="w-10 h-10 border-3 border-blue-100 dark:border-blue-900/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300 font-medium">
            Memuat data siswa...
          </p>
        </div>
      </div>
    );
  }

  // =================================================================
  // !!! PENTING: KODE PLACEHOLDER StudentsExcelActions DI SINI DIHAPUS !!!
  // =================================================================

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          icon={School}
          number={stats.totalKelas}
          label="Total Kelas"
          color="blue"
        />
        <StatsCard
          icon={Users}
          number={stats.totalSiswa}
          label="Total Siswa"
          color="green"
        />
        <StatsCard
          icon={User}
          number={stats.lakiLaki}
          label="Laki-laki"
          color="purple"
        />
        <StatsCard
          icon={UserCheck}
          number={stats.perempuan}
          label="Perempuan"
          color="orange"
        />
      </div>

      {/* Optimized Filter & Action Section - Dark Mode Added */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input - Full width on mobile */}
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
            />
          </div>

          {/* Mobile Layout: Filter Button + Action Menu (Hidden on Large screens) */}
          <div className="flex gap-2 lg:hidden">
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium min-h-[44px] flex-1 text-gray-700 dark:text-slate-300">
              <Filter size={16} />
              Filter
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Mobile Action Menu (memanggil StudentsExcelActions dari file terpisah) */}
            <div className="relative flex-1">
              <StudentsExcelActions
                students={students}
                showToast={showToast}
                fetchStudents={fetchStudents}
                onAdd={handleAdd}
                isMobile={true}
                userData={userData} // <--- PASTIKAN ADA
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-slate-300">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Desktop Layout: Filters + Action Buttons (Hidden on Mobile/Tablet, displayed on Large screens) - Dark Mode Added */}
          <div className="hidden lg:flex gap-3 flex-1 sm:flex-initial">
            {/* Desktop Filters */}
            <div className="flex gap-3 flex-1">
              {/* Class Filter */}
              {userData.role !== "guru_kelas" ? (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="flex-1 px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm min-h-[44px] bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                  <option value="" className="dark:bg-slate-800">
                    Semua Kelas
                  </option>
                  {[1, 2, 3, 4, 5, 6].map((kelas) => (
                    <option
                      key={kelas}
                      value={kelas}
                      className="dark:bg-slate-800">
                      Kelas {kelas}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex-1 px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-sm min-h-[44px] flex items-center">
                  Kelas {userData.kelas}
                </div>
              )}

              {/* Gender Filter */}
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="flex-1 px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm min-h-[44px] bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                <option value="" className="dark:bg-slate-800">
                  Semua Jenis Kelamin
                </option>
                <option value="Laki-laki" className="dark:bg-slate-800">
                  Laki-laki
                </option>
                <option value="Perempuan" className="dark:bg-slate-800">
                  Perempuan
                </option>
              </select>
            </div>

            {/* Action Buttons for Desktop - Memanggil StudentsExcelActions dari file terpisah */}
            <StudentsExcelActions
              students={students}
              showToast={showToast}
              fetchStudents={fetchStudents}
              onAdd={handleAdd}
              isMobile={false}
              userData={userData} // <--- PASTIKAN ADA
            />
          </div>
        </div>

        {/* Active Filters Indicator (Dark Mode Added) */}
        {(selectedClass || genderFilter) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Filter aktif:
            </span>
            {selectedClass && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                Kelas {selectedClass}
                <button
                  onClick={() => setSelectedClass("")}
                  className="ml-1 hover:text-blue-600">
                  <X size={12} />
                </button>
              </span>
            )}
            {genderFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                {genderFilter}
                <button
                  onClick={() => setGenderFilter("")}
                  className="ml-1 hover:text-green-600">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Header (Dark Mode Added) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100">
              Daftar Siswa
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Menampilkan {filteredStudents.length} dari {students.length} siswa
            </p>
          </div>
          {/* Show clear filter button on mobile if filters are active */}
          {(selectedClass || genderFilter) && (
            <button
              onClick={() => {
                setSelectedClass("");
                setGenderFilter("");
              }}
              className="mt-2 sm:mt-0 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium lg:hidden">
              Hapus Filter
            </button>
          )}
        </div>
      </div>

      {/* Students List - Responsive View - Dark Mode Added */}

      {/* MOBILE CARD VIEW (Default, Hidden on Large screens) */}
      <div className="space-y-3 lg:hidden">
        {filteredStudents.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Users size={48} className="text-gray-300 dark:text-slate-600" />
              <div>
                <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">
                  Tidak ada data siswa yang ditemukan
                </p>
                <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">
                  Coba ubah kata kunci pencarian atau filter
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredStudents.map((student, index) => (
            <StudentCard
              key={student.id}
              student={student}
              index={index}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Hidden by default, displayed on Large screens) - Dark Mode Added */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider w-12">
                  No.
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider w-24">
                  NISN
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Nama Siswa
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">
                  Jenis Kelamin
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider w-20">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users
                        size={48}
                        className="text-gray-300 dark:text-slate-600"
                      />
                      <div>
                        <p className="text-gray-500 dark:text-slate-400 font-medium">
                          Tidak ada data siswa yang ditemukan
                        </p>
                        <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
                          Coba ubah kata kunci pencarian atau filter
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-slate-100 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-mono text-gray-600 dark:text-slate-400">
                      {student.nisn}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {student.nama_siswa}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">
                        {student.jenis_kelamin}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">
                        Kelas {student.kelas}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <StatusBadge isActive={student.is_active} />
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals (No changes - Already updated to support dark mode) */}
      <FilterModal
        show={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        userData={userData}
      />

      <StudentFormModal
        show={showFormModal}
        onClose={() => setShowFormModal(false)}
        student={selectedStudent}
        onSave={handleSaveStudent}
      />

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        student={selectedStudent}
        onConfirm={handleDeleteStudent}
      />
    </div>
  );
};

export default Students;
