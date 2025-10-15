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
import * as XLSX from "xlsx";

// Compact Stats Card Component
const StatsCard = ({ icon: Icon, number, label, color }) => {
  const colorClasses = {
    blue: "border-l-blue-500 bg-gradient-to-r from-blue-50 to-white",
    green: "border-l-green-500 bg-gradient-to-r from-green-50 to-white",
    purple: "border-l-purple-500 bg-gradient-to-r from-purple-50 to-white",
    orange: "border-l-orange-500 bg-gradient-to-r from-orange-50 to-white",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-l-4 ${colorClasses[color]} p-3 sm:p-4 hover:shadow-md transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {number}
          </p>
          <p className="text-xs sm:text-sm font-medium text-gray-600">
            {label}
          </p>
        </div>
        <Icon
          size={24}
          className={`${iconColorClasses[color]} hidden sm:block`}
        />
        <Icon size={20} className={`${iconColorClasses[color]} sm:hidden`} />
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ isActive }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
      }`}>
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
};

// Action Button Component
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
      "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm",
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

// Toast Notification Component
const Toast = ({ message, type = "success", onClose }) => {
  const bgColor =
    type === "success"
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
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

// Mobile Student Card Component
const StudentCard = ({ student, index, onEdit, onDelete }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-500">
              #{index + 1}
            </span>
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {student.nama_siswa}
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-mono">
            NISN: {student.nisn}
          </p>
        </div>
        <StatusBadge isActive={student.is_active} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <School size={14} className="text-gray-400" />
          <span className="text-gray-700">Kelas {student.kelas}</span>
        </div>
        <div className="flex items-center gap-1">
          <User size={14} className="text-gray-400" />
          <span className="text-gray-700">{student.jenis_kelamin}</span>
        </div>
      </div>

      {/* Action Buttons for Mobile */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onEdit(student)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
          <Edit size={14} />
          Edit
        </button>
        <button
          onClick={() => onDelete(student)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
          <Trash2 size={14} />
          Hapus
        </button>
      </div>
    </div>
  );
};

// Student Form Modal Component
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
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {student ? "Edit Siswa" : "Tambah Siswa Baru"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NISN *
            </label>
            <input
              type="text"
              required
              value={formData.nisn}
              onChange={(e) =>
                setFormData({ ...formData, nisn: e.target.value })
              }
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Masukkan NISN"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Siswa *
            </label>
            <input
              type="text"
              required
              value={formData.nama_siswa}
              onChange={(e) =>
                setFormData({ ...formData, nama_siswa: e.target.value })
              }
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas *
              </label>
              <select
                required
                value={formData.kelas}
                onChange={(e) =>
                  setFormData({ ...formData, kelas: e.target.value })
                }
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                <option value="">Pilih Kelas</option>
                {[1, 2, 3, 4, 5, 6].map((kelas) => (
                  <option key={kelas} value={kelas}>
                    Kelas {kelas}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kelamin *
              </label>
              <select
                required
                value={formData.jenis_kelamin}
                onChange={(e) =>
                  setFormData({ ...formData, jenis_kelamin: e.target.value })
                }
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
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
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Siswa Aktif
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
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

// Import Modal Component
const ImportModal = ({ show, onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith(".xlsx") &&
      !selectedFile.name.endsWith(".xls")
    ) {
      setError("Hanya file Excel (.xlsx, .xls) yang didukung");
      return;
    }

    setFile(selectedFile);
    setError("");

    // Read and preview the Excel file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          setError("File Excel kosong");
          return;
        }

        setPreviewData(jsonData.slice(0, 5)); // Show first 5 rows as preview
      } catch (err) {
        setError("Gagal membaca file Excel");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        await onImport(jsonData);
        onClose();
        resetForm();
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError("Gagal mengimport data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData([]);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Import Data Siswa dari Excel
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Drag & drop file Excel di sini atau klik untuk memilih
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Format yang didukung: .xlsx, .xls
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-medium">
              Pilih File
            </label>
            {file && (
              <p className="text-sm text-gray-700 mt-2">
                File terpilih: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle size={16} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Preview Data (5 baris pertama):
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewData[0]).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-3 py-2 text-gray-700">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
              Batal
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50">
              {loading ? "Mengimport..." : "Import Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
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
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hapus Siswa</h3>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus siswa ini?
            </p>
          </div>
        </div>

        {student && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="font-medium text-gray-900">{student.nama_siswa}</p>
            <p className="text-sm text-gray-600">NISN: {student.nisn}</p>
            <p className="text-sm text-gray-600">Kelas: {student.kelas}</p>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Data Yang Dihapus Permanen Dan Tidak Dapat Dikembalikan.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
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

// Mobile Filter Modal
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
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filter Siswa</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas
            </label>
            {userData.role !== "guru_kelas" ? (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                <option value="">Semua Kelas</option>
                {[1, 2, 3, 4, 5, 6].map((kelas) => (
                  <option key={kelas} value={kelas}>
                    Kelas {kelas}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                Kelas {userData.kelas}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Kelamin
            </label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
              <option value="">Semua</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setSelectedClass("");
              setGenderFilter("");
            }}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
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

// Main Students Component - PRODUCTION READY
const Students = ({ userData }) => {
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
  const [isMobile, setIsMobile] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

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

  // Export to Excel
  const handleExport = () => {
    try {
      const dataToExport = filteredStudents.map((student) => ({
        NISN: student.nisn,
        "Nama Siswa": student.nama_siswa,
        Kelas: student.kelas,
        "Jenis Kelamin": student.jenis_kelamin,
        Status: student.is_active ? "Aktif" : "Nonaktif",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `data-siswa-${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
      showToast("Data berhasil diexport ke Excel");
    } catch (error) {
      console.error("Error exporting data:", error);
      showToast("Gagal mengexport data", "error");
    }
  };

  // Import from Excel
  const handleImport = async (importData) => {
    try {
      setLoading(true);

      // Validate and transform import data
      const transformedData = importData
        .map((row) => ({
          nisn: String(row.NISN || row.nisn || ""),
          nama_siswa: String(row["Nama Siswa"] || row.nama_siswa || ""),
          kelas: parseInt(row.Kelas || row.kelas || "1"),
          jenis_kelamin: String(
            row["Jenis Kelamin"] || row.jenis_kelamin || "Laki-laki"
          ),
          is_active: true,
        }))
        .filter((row) => row.nisn && row.nama_siswa); // Filter out incomplete rows

      if (transformedData.length === 0) {
        showToast("Tidak ada data valid untuk diimport", "error");
        return;
      }

      // Insert data to Supabase
      const { error } = await supabase
        .from("students")
        .upsert(transformedData, { onConflict: "nisn" });

      if (error) throw error;

      showToast(`Berhasil mengimport ${transformedData.length} data siswa`);
      fetchStudents(); // Refresh data
    } catch (error) {
      console.error("Error importing data:", error);
      showToast("Gagal mengimport data", "error");
    } finally {
      setLoading(false);
    }
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
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
          <div className="w-10 h-10 border-3 border-red-100 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <p className="text-red-600 font-medium">
            Error: Data user tidak tersedia
          </p>
          <p className="text-sm text-gray-400 mt-2">Silakan login kembali</p>
        </div>
      </div>
    );
  }

  if (!userData.role || !userData.username) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
          <p className="text-red-600 font-medium">
            Error: Data user tidak lengkap
          </p>
          <p className="text-sm text-gray-400 mt-2">
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
          <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
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

      {/* Optimized Filter & Action Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input - Full width on mobile */}
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          {/* Mobile Layout */}
          {isMobile ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium min-h-[44px] flex-1">
                <Filter size={16} />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Mobile Action Menu */}
              <div className="relative">
                <select
                  onChange={(e) => {
                    const action = e.target.value;
                    if (action === "add") handleAdd();
                    if (action === "export") handleExport();
                    if (action === "import") setShowImportModal(true);
                    e.target.value = "";
                  }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white min-w-[120px]">
                  <option value="">Action...</option>
                  <option value="add">Tambah Siswa</option>
                  <option value="export">Export</option>
                  <option value="import">Import</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
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
          ) : (
            /* Desktop Layout: Search | Filter | Action Buttons */
            <div className="flex gap-3 flex-1 sm:flex-initial">
              {/* Desktop Filters */}
              <div className="flex gap-3 flex-1">
                {/* Class Filter */}
                {userData.role !== "guru_kelas" ? (
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm min-h-[44px]">
                    <option value="">Semua Kelas</option>
                    {[1, 2, 3, 4, 5, 6].map((kelas) => (
                      <option key={kelas} value={kelas}>
                        Kelas {kelas}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex-1 px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm min-h-[44px] flex items-center">
                    Kelas {userData.kelas}
                  </div>
                )}

                {/* Gender Filter */}
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm min-h-[44px]">
                  <option value="">Semua Gender</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* Action Buttons for Desktop - Paling Kanan */}
              <div className="flex gap-2">
                <ActionButton
                  icon={Plus}
                  label="Tambah Siswa"
                  onClick={handleAdd}
                  variant="primary"
                />
                <ActionButton
                  icon={Download}
                  label="Export"
                  onClick={handleExport}
                  variant="secondary"
                />
                <ActionButton
                  icon={Upload}
                  label="Import"
                  onClick={() => setShowImportModal(true)}
                  variant="secondary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Indicator */}
        {(selectedClass || genderFilter) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-500">Filter aktif:</span>
            {selectedClass && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Kelas {selectedClass}
                <button
                  onClick={() => setSelectedClass("")}
                  className="ml-1 hover:text-blue-600">
                  <X size={12} />
                </button>
              </span>
            )}
            {genderFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
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

      {/* Results Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Daftar Siswa
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Menampilkan {filteredStudents.length} dari {students.length} siswa
            </p>
          </div>
          {isMobile && (selectedClass || genderFilter) && (
            <button
              onClick={() => {
                setSelectedClass("");
                setGenderFilter("");
              }}
              className="mt-2 sm:mt-0 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
              Hapus Filter
            </button>
          )}
        </div>
      </div>

      {/* Students List - Responsive View */}
      {isMobile ? (
        // MOBILE CARD VIEW
        <div className="space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <Users size={48} className="text-gray-300" />
                <div>
                  <p className="text-gray-500 font-medium text-sm">
                    Tidak ada data siswa yang ditemukan
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
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
      ) : (
        // DESKTOP TABLE VIEW
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider w-12">
                    No.
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider w-24">
                    NISN
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                    Jenis Kelamin
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider w-20">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={48} className="text-gray-300" />
                        <div>
                          <p className="text-gray-500 font-medium">
                            Tidak ada data siswa yang ditemukan
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
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
                      className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-mono text-gray-600">
                        {student.nisn}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {student.nama_siswa}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-700 font-medium">
                          {student.jenis_kelamin}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-sm text-gray-700 font-medium">
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
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit">
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      )}

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

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
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
