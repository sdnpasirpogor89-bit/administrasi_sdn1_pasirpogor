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
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// WAJIB: Import komponen action dari StudentsExcel.js
import { StudentsExcelActions } from "./StudentsExcel";

// Compact Stats Card Component (Tema Merah)
const StatsCard = ({ icon: Icon, number, label, color }) => {
  const colorClasses = {
    red: "border-l-red-600 bg-gradient-to-r from-red-50 to-white dark:to-slate-800 dark:from-red-900/40",
    orange:
      "border-l-orange-600 bg-gradient-to-r from-orange-50 to-white dark:to-slate-800 dark:from-orange-900/40",
    amber:
      "border-l-amber-600 bg-gradient-to-r from-amber-50 to-white dark:to-slate-800 dark:from-amber-900/40",
    rose: "border-l-rose-600 bg-gradient-to-r from-rose-50 to-white dark:to-slate-800 dark:from-rose-900/40",
  };

  const iconColorClasses = {
    red: "text-red-600 dark:text-red-400",
    orange: "text-orange-600 dark:text-orange-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 ${colorClasses[color]} p-3 sm:p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95 touch-manipulation`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900 dark:text-slate-100">
            {number}
          </p>
          <p className="text-xs sm:text-sm font-medium text-red-700 dark:text-slate-400 mt-0.5 sm:mt-1">
            {label}
          </p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 p-2 sm:p-2.5 rounded-lg">
          <Icon
            size={20}
            className={`${iconColorClasses[color]} sm:w-6 sm:h-6`}
          />
        </div>
      </div>
    </div>
  );
};

// Status Badge Component (Tema Merah)
const StatusBadge = ({ isActive }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
          : "bg-red-100 text-red-800 border border-red-200 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
      }`}>
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
};

// Action Button Component (Tema Merah)
const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "primary",
  disabled = false,
}) => {
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    secondary:
      "bg-white dark:bg-slate-700 text-red-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-slate-600 border border-red-300 dark:border-slate-600 shadow-sm",
    danger: "bg-red-700 text-white hover:bg-red-800",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation min-h-[44px] ${variants[variant]}`}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
};

// Toast Notification Component (Tema Merah)
const Toast = ({ message, type = "success", onClose }) => {
  const bgColor =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700"
      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700";
  const textColor =
    type === "success"
      ? "text-emerald-800 dark:text-emerald-300"
      : "text-red-800 dark:text-red-300";
  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div
      className={`fixed top-4 right-4 z-50 border rounded-xl p-4 shadow-lg ${bgColor} animate-in slide-in-from-right-5 duration-300`}>
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

// Mobile Student Card Component (Tema Merah)
const StudentCard = ({ student, index, onEdit, onDelete }) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-slate-700 rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow active:scale-[0.995] touch-manipulation">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-red-500 dark:text-slate-400">
              #{index + 1}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-red-900 dark:text-slate-100 truncate">
              {student.nama_siswa}
            </h3>
          </div>
          <p className="text-xs text-red-600 dark:text-slate-400 font-mono">
            NISN: {student.nisn}
          </p>
        </div>
        <StatusBadge isActive={student.is_active} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
          <School size={14} className="text-red-500 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300 font-medium">
            Kelas {student.kelas}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
          <User size={14} className="text-amber-500 dark:text-amber-400" />
          <span className="text-amber-700 dark:text-amber-300 font-medium">
            {student.jenis_kelamin}
          </span>
        </div>
      </div>

      {/* Action Buttons for Mobile */}
      <div className="flex gap-2 pt-3 border-t border-red-100 dark:border-slate-700">
        <button
          onClick={() => onEdit(student)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-95 touch-manipulation">
          <Edit size={14} />
          Edit
        </button>
        <button
          onClick={() => onDelete(student)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors active:scale-95 touch-manipulation">
          <Trash2 size={14} />
          Hapus
        </button>
      </div>
    </div>
  );
};

// Student Form Modal Component (Tema Merah)
const StudentFormModal = ({ show, onClose, student, onSave }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-slate-100">
            {student ? "Edit Siswa" : "Tambah Siswa Baru"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-red-900 dark:text-slate-100 active:scale-95">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-red-700 dark:text-slate-300 mb-2">
              NISN *
            </label>
            <input
              type="text"
              required
              value={formData.nisn}
              onChange={(e) =>
                setFormData({ ...formData, nisn: e.target.value })
              }
              className="w-full px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-red-900 dark:text-slate-100"
              placeholder="Masukkan NISN"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 dark:text-slate-300 mb-2">
              Nama Siswa *
            </label>
            <input
              type="text"
              required
              value={formData.nama_siswa}
              onChange={(e) =>
                setFormData({ ...formData, nama_siswa: e.target.value })
              }
              className="w-full px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-red-900 dark:text-slate-100"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-red-700 dark:text-slate-300 mb-2">
                Kelas *
              </label>
              <select
                required
                value={formData.kelas}
                onChange={(e) =>
                  setFormData({ ...formData, kelas: e.target.value })
                }
                className="w-full px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-red-900 dark:text-slate-100">
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
              <label className="block text-sm font-medium text-red-700 dark:text-slate-300 mb-2">
                Jenis Kelamin *
              </label>
              <select
                required
                value={formData.jenis_kelamin}
                onChange={(e) =>
                  setFormData({ ...formData, jenis_kelamin: e.target.value })
                }
                className="w-full px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-red-900 dark:text-slate-100">
                <option value="Laki-laki" className="dark:bg-slate-800">
                  Laki-laki
                </option>
                <option value="Perempuan" className="dark:bg-slate-800">
                  Perempuan
                </option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="rounded border-red-300 dark:border-slate-600 text-red-600 focus:ring-red-500 dark:bg-slate-900 w-5 h-5"
            />
            <label
              htmlFor="is_active"
              className="text-sm text-red-700 dark:text-slate-300 font-medium">
              Siswa Aktif
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-red-300 dark:border-slate-600 text-red-700 dark:text-slate-300 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm active:scale-95 touch-manipulation">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 active:scale-95 touch-manipulation">
              {loading ? "Menyimpan..." : student ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal (Tema Merah)
const DeleteModal = ({ show, onClose, student, onConfirm }) => {
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
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2.5 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Trash2 size={24} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-slate-100">
              Hapus Siswa
            </h3>
            <p className="text-sm text-red-600 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus siswa ini?
            </p>
          </div>
        </div>

        {student && (
          <div className="bg-red-50 dark:bg-slate-700 rounded-lg p-4 mb-4 sm:mb-6">
            <p className="font-medium text-red-900 dark:text-slate-100 text-sm sm:text-base">
              {student.nama_siswa}
            </p>
            <p className="text-xs sm:text-sm text-red-600 dark:text-slate-400 mt-1">
              NISN: {student.nisn}
            </p>
            <p className="text-xs sm:text-sm text-red-600 dark:text-slate-400">
              Kelas: {student.kelas}
            </p>
          </div>
        )}

        <p className="text-xs sm:text-sm text-red-600 dark:text-slate-400 mb-4 sm:mb-6">
          Data Yang Dihapus Permanen Dan Tidak Dapat Dikembalikan.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-red-300 dark:border-slate-600 text-red-700 dark:text-slate-300 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm active:scale-95 touch-manipulation">
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 active:scale-95 touch-manipulation">
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile Filter Modal (Tema Merah)
const FilterModal = ({
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
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-slate-100">
            Filter Siswa
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-red-900 dark:text-slate-100 active:scale-95">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-red-700 dark:text-slate-300 mb-2">
              Kelas
            </label>
            {userData.role !== "guru_kelas" ? (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-red-900 dark:text-slate-100">
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
              <div className="px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg bg-red-50 dark:bg-slate-700 text-red-500 dark:text-slate-400 text-sm">
                Kelas {userData.kelas}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 dark:text-slate-300 mb-2">
              Jenis Kelamin
            </label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-red-900 dark:text-slate-100">
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
            className="flex-1 px-4 py-3 border border-red-300 dark:border-slate-600 text-red-700 dark:text-slate-300 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm active:scale-95 touch-manipulation">
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm active:scale-95 touch-manipulation">
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Students Component (Tema Merah)
const Students = ({ userData }) => {
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

  // Auto hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch students data from Supabase
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

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Save student (create or update)
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

  // Delete student (hard delete)
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

  // Open edit modal
  const handleEdit = (student) => {
    setSelectedStudent(student);
    setShowFormModal(true);
  };

  // Open delete modal
  const handleDelete = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Open add modal
  const handleAdd = () => {
    setSelectedStudent(null);
    setShowFormModal(true);
  };

  // Validation after hooks
  if (!userData) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-red-100 dark:border-red-900/20 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <p className="text-red-600 dark:text-red-400 font-medium text-sm sm:text-base">
            Error: Data user tidak tersedia
          </p>
          <p className="text-xs sm:text-sm text-red-500 dark:text-slate-500 mt-2">
            Silakan login kembali
          </p>
        </div>
      </div>
    );
  }

  if (!userData.role || !userData.username) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <p className="text-red-600 dark:text-red-400 font-medium text-sm sm:text-base">
            Error: Data user tidak lengkap
          </p>
          <p className="text-xs sm:text-sm text-red-500 dark:text-slate-500 mt-2">
            Hubungi administrator sistem
          </p>
        </div>
      </div>
    );
  }

  // Filter students based on search and filters
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

  // Active filters count for badge
  const activeFiltersCount = [selectedClass, genderFilter].filter(
    Boolean
  ).length;

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-slate-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 border-3 border-red-100 dark:border-red-900/20 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-red-700 dark:text-slate-300 font-medium text-sm sm:text-base">
              Memuat data siswa...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 dark:bg-slate-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Header */}
        <div className="mb-2 sm:mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900 dark:text-slate-100">
            Data Siswa
          </h1>
          <p className="text-sm sm:text-base text-red-700 dark:text-slate-300 mt-1">
            Tahun Ajaran 2025/2026
          </p>
        </div>

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            icon={School}
            number={stats.totalKelas}
            label="Total Kelas"
            color="red"
          />
          <StatsCard
            icon={Users}
            number={stats.totalSiswa}
            label="Total Siswa"
            color="orange"
          />
          <StatsCard
            icon={User}
            number={stats.lakiLaki}
            label="Laki-laki"
            color="amber"
          />
          <StatsCard
            icon={UserCheck}
            number={stats.perempuan}
            label="Perempuan"
            color="rose"
          />
        </div>

        {/* Filter & Action Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-red-400 dark:text-slate-500"
              />
              <input
                type="text"
                placeholder="Cari nama siswa atau NISN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 border border-red-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-slate-900 text-red-900 dark:text-slate-100 min-h-[44px]"
              />
            </div>

            {/* Mobile Layout */}
            <div className="flex gap-2 lg:hidden">
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-red-300 dark:border-slate-600 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium min-h-[44px] flex-1 text-red-700 dark:text-slate-300 active:scale-95 touch-manipulation">
                <Filter size={16} />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="relative flex-1">
                <StudentsExcelActions
                  students={students}
                  showToast={showToast}
                  fetchStudents={fetchStudents}
                  onAdd={handleAdd}
                  isMobile={true}
                  userData={userData}
                />
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex gap-3 flex-1 sm:flex-initial">
              <div className="flex gap-3 flex-1">
                {/* Class Filter */}
                {userData.role !== "guru_kelas" ? (
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="flex-1 px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm min-h-[44px] bg-white dark:bg-slate-900 text-red-900 dark:text-slate-100">
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
                  <div className="flex-1 px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg bg-red-50 dark:bg-slate-700 text-red-500 dark:text-slate-400 text-sm min-h-[44px] flex items-center">
                    Kelas {userData.kelas}
                  </div>
                )}

                {/* Gender Filter */}
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="flex-1 px-3 py-3 border border-red-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm min-h-[44px] bg-white dark:bg-slate-900 text-red-900 dark:text-slate-100">
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

              <StudentsExcelActions
                students={students}
                showToast={showToast}
                fetchStudents={fetchStudents}
                onAdd={handleAdd}
                isMobile={false}
                userData={userData}
              />
            </div>
          </div>

          {/* Active Filters Indicator */}
          {(selectedClass || genderFilter) && (
            <div className="flex items-center gap-2 mt-3 sm:mt-4 flex-wrap">
              <span className="text-xs text-red-500 dark:text-slate-400">
                Filter aktif:
              </span>
              {selectedClass && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 font-medium">
                  Kelas {selectedClass}
                  <button
                    onClick={() => setSelectedClass("")}
                    className="ml-1.5 hover:text-red-600">
                    <X size={12} />
                  </button>
                </span>
              )}
              {genderFilter && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 font-medium">
                  {genderFilter}
                  <button
                    onClick={() => setGenderFilter("")}
                    className="ml-1.5 hover:text-amber-600">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-slate-100">
                Daftar Siswa
              </h2>
              <p className="text-sm text-red-700 dark:text-slate-400 mt-1">
                Menampilkan {filteredStudents.length} dari {students.length}{" "}
                siswa
              </p>
            </div>
            {(selectedClass || genderFilter) && (
              <button
                onClick={() => {
                  setSelectedClass("");
                  setGenderFilter("");
                }}
                className="mt-2 sm:mt-0 px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium lg:hidden">
                Hapus Filter
              </button>
            )}
          </div>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="space-y-3 sm:space-y-4 lg:hidden">
          {filteredStudents.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-slate-700 p-6 sm:p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <Users size={48} className="text-red-300 dark:text-slate-600" />
                <div>
                  <p className="text-red-500 dark:text-slate-400 font-medium text-sm sm:text-base">
                    Tidak ada data siswa yang ditemukan
                  </p>
                  <p className="text-red-400 dark:text-slate-500 text-xs sm:text-sm mt-1">
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

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-50 dark:bg-slate-700 border-b border-red-200 dark:border-slate-600">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-red-900 dark:text-slate-300 uppercase tracking-wider w-12">
                    No.
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-red-900 dark:text-slate-300 uppercase tracking-wider w-24">
                    NISN
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-red-900 dark:text-slate-300 uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-red-900 dark:text-slate-300 uppercase tracking-wider">
                    Jenis Kelamin
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-red-900 dark:text-slate-300 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-red-900 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-red-900 dark:text-slate-300 uppercase tracking-wider w-28">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 dark:divide-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users
                          size={48}
                          className="text-red-300 dark:text-slate-600"
                        />
                        <div>
                          <p className="text-red-500 dark:text-slate-400 font-medium">
                            Tidak ada data siswa yang ditemukan
                          </p>
                          <p className="text-red-400 dark:text-slate-500 text-sm mt-1">
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
                      className="hover:bg-red-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-sm text-red-900 dark:text-slate-100 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-mono text-red-600 dark:text-slate-400">
                        {student.nisn}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-semibold text-red-900 dark:text-slate-100">
                          {student.nama_siswa}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-sm text-red-700 dark:text-slate-300 font-medium">
                          {student.jenis_kelamin}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                          <School size={12} />
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
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
                            title="Edit">
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors active:scale-95"
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

        {/* Footer Info */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-red-200 dark:border-slate-700">
          <div className="text-center">
            <p className="text-sm sm:text-base text-red-700 dark:text-slate-400">
              Total{" "}
              <span className="font-bold text-red-900 dark:text-slate-100">
                {students.length}
              </span>{" "}
              siswa • {stats.totalKelas} kelas aktif
            </p>
            <p className="text-xs text-red-500 dark:text-slate-500 mt-1">
              Tahun Ajaran 2025/2026 • Terakhir diperbarui:{" "}
              {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>

        {/* Modals */}
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
    </div>
  );
};

export default Students;
