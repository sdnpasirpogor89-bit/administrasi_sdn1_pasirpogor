import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Check,
  Save,
  Calendar,
  FileText,
  Download,
  Users,
  UserCheck,
  Activity,
  AlertTriangle,
  X,
  Hospital,
  FileX,
  Clock,
  RefreshCw,
  Menu,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import RecapModal from "./RecapModal";
import { exportAttendanceFromComponent } from "./ExportExcel";

// Toast Component - Enhanced for mobile
const Toast = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 sm:max-w-md z-50 px-4 sm:px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      }`}>
      <div className="flex items-center gap-2">
        {type === "error" ? <AlertTriangle size={16} /> : <Check size={16} />}
        <span className="font-medium text-sm sm:text-base flex-1">
          {message}
        </span>
        <button
          onClick={onClose}
          className="ml-2 opacity-70 hover:opacity-100 p-1">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// Confirmation Modal Component - Enhanced for mobile
const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-orange-500 flex-shrink-0" size={20} />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {title}
          </h3>
        </div>
        <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base">
            Tidak
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base">
            Ya, Timpa Data
          </button>
        </div>
      </div>
    </div>
  );
};

// ExportModal Component - Enhanced for mobile
const ExportModal = ({ show, onClose, onExport, loading }) => {
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  const handleExport = () => {
    onExport(selectedMonth, selectedYear);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Download className="text-blue-500 flex-shrink-0" size={20} />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Export Data Presensi ke Excel
          </h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulan:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              disabled={loading}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString("id-ID", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tahun:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              disabled={loading}>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={2020 + i} value={2020 + i}>
                  {2020 + i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            disabled={loading}>
            Batal
          </button>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={loading}>
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Download size={14} />
                Export Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Status Button Component - FIXED with better mobile touch targets
const StatusButton = React.memo(
  ({ status, active, onClick, icon: Icon, label, disabled = false }) => {
    const getStatusClass = () => {
      const baseClass =
        "flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-[40px] touch-manipulation";

      if (status === "Hadir") {
        return active
          ? `${baseClass} bg-green-600 text-white border-green-600 shadow-sm`
          : `${baseClass} bg-green-50 text-green-700 border-green-200 hover:bg-green-100 active:bg-green-200`;
      } else if (status === "Sakit") {
        return active
          ? `${baseClass} bg-yellow-600 text-white border-yellow-600 shadow-sm`
          : `${baseClass} bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 active:bg-yellow-200`;
      } else if (status === "Izin") {
        return active
          ? `${baseClass} bg-blue-600 text-white border-blue-600 shadow-sm`
          : `${baseClass} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 active:bg-blue-200`;
      } else if (status === "Alpa") {
        return active
          ? `${baseClass} bg-red-600 text-white border-red-600 shadow-sm`
          : `${baseClass} bg-red-50 text-red-700 border-red-200 hover:bg-red-100 active:bg-red-200`;
      }
      return baseClass;
    };

    return (
      <button
        className={getStatusClass()}
        onClick={onClick}
        disabled={disabled}>
        <Icon size={14} className="flex-shrink-0" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden text-xs">{label.charAt(0)}</span>
      </button>
    );
  }
);

// Compact Stats Card Component - Enhanced for mobile
const StatsCard = React.memo(({ icon: Icon, number, label, color }) => {
  const getLeftBorderColor = () => {
    switch (color) {
      case "blue":
        return "border-l-blue-500";
      case "green":
        return "border-l-green-500";
      case "purple":
        return "border-l-purple-500";
      case "orange":
        return "border-l-orange-500";
      default:
        return "border-l-gray-500";
    }
  };

  const getIconColor = () => {
    switch (color) {
      case "blue":
        return "text-blue-500";
      case "green":
        return "text-green-500";
      case "purple":
        return "text-purple-500";
      case "orange":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-3 sm:p-4 border border-l-4 ${getLeftBorderColor()} border-gray-200 transition-all duration-200 hover:shadow-md hover:-translate-y-1 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl sm:text-2xl font-bold mb-1 text-gray-900">
            {number}
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-600">
            {label}
          </div>
        </div>
        <div className={`${getIconColor()}`}>
          <Icon size={20} className="sm:hidden" />
          <Icon size={24} className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
});

// Mobile Student Card Component - NEW
const StudentCard = ({
  student,
  originalIndex,
  attendance,
  activeClass,
  updateStatus,
  updateNote,
  saving,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {student.nama_siswa}
          </h3>
          <p className="text-xs text-gray-500">NISN: {student.nisn}</p>
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              student.jenis_kelamin === "Laki-laki"
                ? "bg-blue-100 text-blue-700"
                : "bg-pink-100 text-pink-700"
            }`}>
            {student.jenis_kelamin}
          </span>
        </div>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 text-gray-400 hover:text-gray-600 touch-manipulation">
          <Menu size={18} />
        </button>
      </div>

      {showActions && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <StatusButton
              status="Hadir"
              active={attendance.status === "Hadir"}
              onClick={() => updateStatus(activeClass, originalIndex, "Hadir")}
              icon={Check}
              label="Hadir"
              disabled={saving}
            />
            <StatusButton
              status="Sakit"
              active={attendance.status === "Sakit"}
              onClick={() => updateStatus(activeClass, originalIndex, "Sakit")}
              icon={Hospital}
              label="Sakit"
              disabled={saving}
            />
            <StatusButton
              status="Izin"
              active={attendance.status === "Izin"}
              onClick={() => updateStatus(activeClass, originalIndex, "Izin")}
              icon={FileText}
              label="Izin"
              disabled={saving}
            />
            <StatusButton
              status="Alpa"
              active={attendance.status === "Alpa"}
              onClick={() => updateStatus(activeClass, originalIndex, "Alpa")}
              icon={FileX}
              label="Alpa"
              disabled={saving}
            />
          </div>

          <input
            type="text"
            placeholder="Keterangan..."
            value={attendance.note || ""}
            onChange={(e) =>
              updateNote(activeClass, originalIndex, e.target.value)
            }
            disabled={saving}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}
    </div>
  );
};

// Custom hook for attendance logic - ORIGINAL COMPLETE
const useAttendance = (currentUser) => {
  const [studentsData, setStudentsData] = useState({});
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Memoized function to load students data
  const loadStudentsData = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("students")
        .select("*")
        .eq("is_active", true)
        .order("kelas", { ascending: true })
        .order("nama_siswa", { ascending: true });

      if (currentUser.role === "guru_kelas" && currentUser.kelas) {
        query = query.eq("kelas", currentUser.kelas);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group students by class
      const groupedStudents = {};
      for (let i = 1; i <= 6; i++) {
        groupedStudents[i] = [];
      }

      data.forEach((student) => {
        if (groupedStudents[student.kelas]) {
          groupedStudents[student.kelas].push(student);
        }
      });

      setStudentsData(groupedStudents);
      initializeAttendanceData(groupedStudents);
    } catch (error) {
      console.error("Error loading students:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const initializeAttendanceData = useCallback((students) => {
    const attendanceDataObj = {};
    for (let classNum = 1; classNum <= 6; classNum++) {
      attendanceDataObj[classNum] = {};
      if (students[classNum]) {
        students[classNum].forEach((student, index) => {
          attendanceDataObj[classNum][index] = {
            nisn: student.nisn,
            name: student.nama_siswa,
            status: "Hadir",
            note: "",
          };
        });
      }
    }
    setAttendanceData(attendanceDataObj);
  }, []);

  const loadAttendanceForDate = useCallback(
    async (date, classNum) => {
      try {
        // Modified query to include guru_input filter based on current user
        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("tanggal", date)
          .eq("kelas", classNum)
          .eq("guru_input", currentUser.username); // Filter by current user

        if (error) throw error;

        setAttendanceData((prev) => {
          const newAttendanceData = { ...prev };

          // Reset attendance for this class to default 'Hadir'
          if (newAttendanceData[classNum]) {
            Object.keys(newAttendanceData[classNum]).forEach((index) => {
              newAttendanceData[classNum][index] = {
                ...newAttendanceData[classNum][index],
                status: "Hadir",
                note: "",
              };
            });

            // Apply saved attendance data if exists
            if (data && data.length > 0) {
              data.forEach((record) => {
                // Find student index by NISN in the current students data
                const studentIndex = studentsData[classNum]?.findIndex(
                  (s) => s.nisn === record.nisn
                );
                if (
                  studentIndex !== -1 &&
                  newAttendanceData[classNum][studentIndex]
                ) {
                  // Handle both "Alfa" and "Alpa" for backward compatibility
                  let status = record.status;
                  if (status === "Alfa") status = "Alpa";

                  newAttendanceData[classNum][studentIndex] = {
                    ...newAttendanceData[classNum][studentIndex],
                    status: status,
                    note: record.keterangan || "",
                  };
                }
              });
            }
          }

          return newAttendanceData;
        });
      } catch (error) {
        console.error("Error loading attendance for date:", error);
        throw error;
      }
    },
    [studentsData, currentUser.username]
  );

  return {
    studentsData,
    attendanceData,
    setAttendanceData,
    loading,
    saving,
    setSaving,
    loadStudentsData,
    loadAttendanceForDate,
  };
};

// Main Attendance Component - ENHANCED FOR RESPONSIVENESS
const Attendance = ({
  currentUser = { role: "admin", kelas: null, username: "admin" },
}) => {
  const {
    studentsData,
    attendanceData,
    setAttendanceData,
    loading,
    saving,
    setSaving,
    loadStudentsData,
    loadAttendanceForDate,
  } = useAttendance(currentUser);

  const [attendanceDate, setAttendanceDate] = useState("");
  const [activeClass, setActiveClass] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalAction, setModalAction] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [rekapData, setRekapData] = useState([]);
  const [rekapTitle, setRekapTitle] = useState("");
  const [rekapSubtitle, setRekapSubtitle] = useState("");
  const [rekapLoading, setRekapLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [viewMode, setViewMode] = useState("table"); // NEW: Mobile view toggle

  // Helper function to determine jenis_presensi based on user role
  const getJenisPresensi = useCallback(() => {
    // Guru kelas return 'kelas', guru mapel return 'mapel'
    return currentUser.role === "guru_kelas" ? "kelas" : "mapel";
  }, [currentUser.role]);

  // Initialize date with Indonesia local date
  useEffect(() => {
    const getIndonesiaDate = () => {
      const now = new Date();
      const indonesiaOffset = 7 * 60;
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const indonesiaTime = new Date(utcTime + indonesiaOffset * 60000);
      return indonesiaTime.toISOString().split("T")[0];
    };

    setAttendanceDate(getIndonesiaDate());
  }, []);

  // Load students when component mounts
  useEffect(() => {
    loadStudentsData().catch((error) => {
      showToast(`Error memuat data siswa: ${error.message}`, "error");
    });
  }, [loadStudentsData]);

  // Set initial active class based on user role
  useEffect(() => {
    if (currentUser.role === "guru_kelas" && currentUser.kelas) {
      setActiveClass(currentUser.kelas);
    }
  }, [currentUser]);

  // Load attendance when date or class changes
  useEffect(() => {
    if (attendanceDate && studentsData[activeClass]?.length > 0) {
      loadAttendanceForDate(attendanceDate, activeClass).catch((error) => {
        showToast(`Error memuat data presensi: ${error.message}`, "error");
      });
    }
  }, [attendanceDate, activeClass, loadAttendanceForDate, studentsData]);

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    if (!studentsData[activeClass]) return [];

    return studentsData[activeClass].filter(
      (student) =>
        student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nisn.includes(searchTerm)
    );
  }, [studentsData, activeClass, searchTerm]);

  // Memoized summary calculation
  const summary = useMemo(() => {
    if (!attendanceData[activeClass]) {
      return { Hadir: 0, Alpa: 0, Sakit: 0, Izin: 0 };
    }

    const counts = { Hadir: 0, Alpa: 0, Sakit: 0, Izin: 0 };

    Object.values(attendanceData[activeClass]).forEach((student) => {
      if (counts.hasOwnProperty(student.status)) {
        counts[student.status]++;
      }
    });

    return counts;
  }, [attendanceData, activeClass]);

  // Show toast notification
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: "", type: "" });
  }, []);

  // Check class access
  const checkClassAccess = useCallback(
    (classNum) => {
      if (currentUser.role === "guru_kelas" && currentUser.kelas !== classNum) {
        showToast(
          "Akses ditolak! Anda hanya bisa mengakses kelas yang ditentukan.",
          "error"
        );
        return false;
      }
      return true;
    },
    [currentUser, showToast]
  );

  // Memoized update functions
  const updateStatus = useCallback(
    (classNum, studentIndex, status) => {
      if (!checkClassAccess(classNum)) return;

      setAttendanceData((prev) => {
        const newAttendanceData = { ...prev };
        if (
          newAttendanceData[classNum] &&
          newAttendanceData[classNum][studentIndex]
        ) {
          newAttendanceData[classNum][studentIndex] = {
            ...newAttendanceData[classNum][studentIndex],
            status,
          };
        }
        return newAttendanceData;
      });
    },
    [checkClassAccess]
  );

  const updateNote = useCallback(
    (classNum, studentIndex, note) => {
      if (!checkClassAccess(classNum)) return;

      setAttendanceData((prev) => {
        const newAttendanceData = { ...prev };
        if (
          newAttendanceData[classNum] &&
          newAttendanceData[classNum][studentIndex]
        ) {
          newAttendanceData[classNum][studentIndex] = {
            ...newAttendanceData[classNum][studentIndex],
            note,
          };
        }
        return newAttendanceData;
      });
    },
    [checkClassAccess]
  );

  // Check existing attendance - Modified to include guru_input check
  const checkExistingAttendance = useCallback(
    async (classNum, date) => {
      try {
        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("tanggal", date)
          .eq("kelas", classNum)
          .eq("guru_input", currentUser.username) // Check for current user's data
          .limit(1);

        if (error) {
          console.error("Error checking existing attendance:", error);
          return false;
        }
        return data && data.length > 0;
      } catch (error) {
        console.error("Error checking existing attendance:", error);
        return false;
      }
    },
    [currentUser.username]
  );

  // Save attendance data to database - Modified to include guru_input and jenis_presensi
  const saveAttendanceData = useCallback(
    async (classNum, date) => {
      try {
        if (
          !attendanceData[classNum] ||
          Object.keys(attendanceData[classNum]).length === 0
        ) {
          throw new Error("Tidak ada data attendance untuk disimpan");
        }

        // Prepare data for insertion with new fields
        const attendanceRecords = Object.values(attendanceData[classNum]).map(
          (student) => ({
            tanggal: date,
            nisn: student.nisn,
            nama_siswa: student.name,
            kelas: classNum,
            status: student.status,
            keterangan: student.note || "",
            guru_input: currentUser.username, // Add guru_input field
            jenis_presensi: getJenisPresensi(), // Add jenis_presensi field
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );

        // Delete existing records for this date, class, and guru_input (modified delete condition)
        const { error: deleteError } = await supabase
          .from("attendance")
          .delete()
          .eq("tanggal", date)
          .eq("kelas", classNum)
          .eq("guru_input", currentUser.username); // Only delete current user's records

        if (deleteError) {
          console.error("Delete error:", deleteError);
          throw deleteError;
        }

        // Insert new records
        const { error: insertError } = await supabase
          .from("attendance")
          .insert(attendanceRecords);

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }

        const jenisText =
          getJenisPresensi() === "kelas" ? "Kelas" : "Mata Pelajaran";
        showToast(
          `Presensi ${jenisText} ${classNum} tanggal ${date} berhasil disimpan!`
        );

        // Reload data from database to show saved state
        await loadAttendanceForDate(date, classNum);
      } catch (error) {
        console.error("Error saving attendance:", error);
        showToast(`Error menyimpan data presensi: ${error.message}`, "error");
        throw error;
      }
    },
    [
      attendanceData,
      showToast,
      loadAttendanceForDate,
      currentUser.username,
      getJenisPresensi,
    ]
  );

  // Mark all present with loading state
  const markAllPresent = useCallback(async () => {
    if (!checkClassAccess(activeClass) || saving) return;

    setSaving(true);
    try {
      setAttendanceData((prev) => {
        const newAttendanceData = { ...prev };
        if (newAttendanceData[activeClass]) {
          Object.keys(newAttendanceData[activeClass]).forEach((index) => {
            newAttendanceData[activeClass][index] = {
              ...newAttendanceData[activeClass][index],
              status: "Hadir",
              note: "",
            };
          });
        }
        return newAttendanceData;
      });
      showToast("Semua siswa telah ditandai hadir!");
    } finally {
      setSaving(false);
    }
  }, [activeClass, checkClassAccess, saving, showToast]);

  // Save attendance with loading state
  const saveAttendance = useCallback(async () => {
    if (!checkClassAccess(activeClass) || saving) return;

    if (!attendanceDate) {
      showToast("Pilih tanggal terlebih dahulu!", "error");
      return;
    }

    setSaving(true);
    try {
      // Check if data already exists for current user
      const exists = await checkExistingAttendance(activeClass, attendanceDate);

      if (exists) {
        const jenisText =
          getJenisPresensi() === "kelas" ? "Kelas" : "Mata Pelajaran";
        setModalMessage(
          `Data kehadiran untuk ${jenisText} ${activeClass} tanggal ${attendanceDate} sudah ada. Apakah Anda yakin ingin menimpa data yang sudah ada?`
        );
        setModalAction(
          () => () => saveAttendanceData(activeClass, attendanceDate)
        );
        setShowModal(true);
      } else {
        await saveAttendanceData(activeClass, attendanceDate);
      }
    } catch (error) {
      showToast(`Error menyimpan data presensi: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  }, [
    activeClass,
    attendanceDate,
    checkClassAccess,
    saving,
    showToast,
    checkExistingAttendance,
    saveAttendanceData,
    getJenisPresensi,
  ]);

  // Generate rekap data from database - FIXED VERSION
  const generateRekapData = useCallback(
    async (classNum, month, year) => {
      try {
        setRekapLoading(true);

        // Get all students for the class
        const students = studentsData[classNum] || [];

        if (students.length === 0) {
          return [];
        }

        // Get the last day of the month properly
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
          lastDayOfMonth
        ).padStart(2, "0")}`;

        console.log("📅 Fetching attendance for:", {
          startDate,
          endDate,
          classNum,
          username: currentUser.username,
        });

        // Modified query to filter by guru_input and order by date
        const { data: attendanceRecords, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("kelas", classNum)
          .eq("guru_input", currentUser.username) // Filter by current user
          .gte("tanggal", startDate)
          .lte("tanggal", endDate)
          .order("tanggal", { ascending: true });

        if (error) {
          throw error;
        }

        console.log(
          "📊 Attendance Records fetched:",
          attendanceRecords?.length || 0,
          "records"
        );

        // Calculate summary for each student
        const rekapData = students.map((student) => {
          const studentRecords = attendanceRecords.filter(
            (record) => record.nisn === student.nisn
          );

          // ✅ KEY FIX: BUILD dailyStatus object
          const dailyStatus = {};
          studentRecords.forEach((record) => {
            // Normalize status to lowercase for consistency with RecapModal
            dailyStatus[record.tanggal] = record.status.toLowerCase();
          });

          const counts = {
            hadir: studentRecords.filter((r) => r.status === "Hadir").length,
            sakit: studentRecords.filter((r) => r.status === "Sakit").length,
            izin: studentRecords.filter((r) => r.status === "Izin").length,
            // Handle both old "Alfa" and new "Alpa" format
            alpa: studentRecords.filter(
              (r) => r.status === "Alpa" || r.status === "Alfa"
            ).length,
          };

          const totalDays = studentRecords.length;
          const percentage =
            totalDays > 0 ? Math.round((counts.hadir / totalDays) * 100) : 100;

          return {
            nisn: student.nisn,
            name: student.nama_siswa,
            nama_siswa: student.nama_siswa, // Add alias for compatibility
            dailyStatus: dailyStatus, // ✅ KEY FIX - Add daily status object
            hadir: counts.hadir,
            sakit: counts.sakit,
            izin: counts.izin,
            alpa: counts.alpa,
            total: totalDays, // ✅ KEY FIX - Add total days
            percentage: percentage,
          };
        });

        console.log("📈 Generated Rekap Data sample:", rekapData[0]);

        return rekapData;
      } catch (error) {
        console.error("Error generating rekap:", error);
        showToast(`Error generating rekap: ${error.message}`, "error");
        return [];
      } finally {
        setRekapLoading(false);
      }
    },
    [studentsData, showToast, currentUser.username]
  );

  // Show rekap modal
  const showRekap = useCallback(async () => {
    const jenisText =
      getJenisPresensi() === "kelas" ? "Kelas" : "Mata Pelajaran";
    setRekapTitle(`Rekap Presensi ${jenisText} ${activeClass}`);
    setRekapSubtitle("Laporan Kehadiran Siswa");
    setShowRekapModal(true);

    // Load data untuk bulan sekarang sebagai default
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const rekapData = await generateRekapData(
      activeClass,
      currentMonth.toString(),
      currentYear.toString()
    );
    setRekapData(rekapData);
  }, [activeClass, generateRekapData, getJenisPresensi]);

  // Handle refresh data untuk RecapModal
  const handleRekapRefresh = useCallback(
    async (month, year) => {
      const rekapData = await generateRekapData(
        activeClass,
        month.toString(),
        year.toString()
      );
      setRekapData(rekapData);
    },
    [activeClass, generateRekapData]
  );

  // Export attendance function dengan ExcelJS
  const exportAttendance = useCallback(
    async (month, year) => {
      try {
        setExportLoading(true);

        const result = await exportAttendanceFromComponent(
          supabase,
          activeClass,
          month,
          year,
          studentsData
        );

        if (result.success) {
          showToast(result.message);
          setShowExportModal(false);
        } else {
          showToast(result.message, "error");
        }
      } catch (error) {
        console.error("Error exporting attendance:", error);
        showToast(`Error mengexport data: ${error.message}`, "error");
      } finally {
        setExportLoading(false);
      }
    },
    [activeClass, studentsData, showToast]
  );

  // Get available classes for tabs
  const availableClasses = useMemo(() => {
    if (currentUser.role === "guru_kelas" && currentUser.kelas) {
      return [currentUser.kelas];
    }
    return [1, 2, 3, 4, 5, 6];
  }, [currentUser]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin mr-3" size={24} />
          <span className="text-gray-600 text-base sm:text-lg">
            Memuat data siswa...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          icon={Check}
          number={summary.Hadir}
          label="Total Hadir"
          color="green"
        />
        <StatsCard
          icon={Hospital}
          number={summary.Sakit}
          label="Total Sakit"
          color="orange"
        />
        <StatsCard
          icon={FileText}
          number={summary.Izin}
          label="Total Izin"
          color="blue"
        />
        <StatsCard
          icon={FileX}
          number={summary.Alpa}
          label="Total Alpa"
          color="purple"
        />
      </div>

      {/* Search and Class Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
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

          <div className="flex gap-2 flex-wrap">
            {availableClasses.map((classNum) => (
              <button
                key={classNum}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 border-2 ${
                  activeClass === classNum
                    ? "bg-gradient-to-r from-blue-600 to-green-600 text-white border-transparent shadow-md"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:-translate-y-0.5"
                }`}
                onClick={() => setActiveClass(classNum)}>
                Kelas {classNum}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex sm:hidden gap-2 mt-4">
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "table"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Tabel
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "cards"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Kartu
          </button>
        </div>
      </div>

      {/* Attendance Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex items-center gap-3 lg:flex-shrink-0">
            <label className="font-semibold text-gray-700 whitespace-nowrap text-sm sm:text-base">
              Tanggal:
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium bg-white text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1 w-full">
            <button
              className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 touch-manipulation min-h-[44px]"
              onClick={markAllPresent}
              disabled={
                !studentsData[activeClass] ||
                studentsData[activeClass].length === 0 ||
                saving
              }>
              {saving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span className="hidden sm:inline">Hadir Semua</span>
              <span className="sm:hidden">Semua</span>
            </button>
            <button
              className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 touch-manipulation min-h-[44px]"
              onClick={saveAttendance}
              disabled={
                !studentsData[activeClass] ||
                studentsData[activeClass].length === 0 ||
                saving
              }>
              {saving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span className="hidden sm:inline">Simpan Presensi</span>
              <span className="sm:hidden">Simpan</span>
            </button>
            <button
              className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 touch-manipulation min-h-[44px]"
              onClick={showRekap}
              disabled={
                !studentsData[activeClass] ||
                studentsData[activeClass].length === 0
              }>
              <Calendar size={14} />
              <span className="hidden sm:inline">Lihat Rekap</span>
              <span className="sm:hidden">Rekap</span>
            </button>
            <button
              className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 touch-manipulation min-h-[44px]"
              onClick={() => setShowExportModal(true)}
              disabled={
                !studentsData[activeClass] ||
                studentsData[activeClass].length === 0
              }>
              <Download size={14} />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Students List - Responsive */}
      {viewMode === "cards" ? (
        // Mobile Card View
        <div className="sm:hidden space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <Users size={48} className="text-gray-300" />
                <div>
                  <p className="text-gray-500 font-medium text-sm">
                    {studentsData[activeClass]?.length === 0
                      ? "Tidak ada siswa di kelas ini"
                      : "Tidak ada siswa yang sesuai dengan pencarian"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {searchTerm
                      ? `Tidak ditemukan siswa dengan kata kunci "${searchTerm}"`
                      : "Kelas ini belum memiliki siswa terdaftar"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            filteredStudents.map((student, index) => {
              const originalIndex = studentsData[activeClass].indexOf(student);
              const attendance = attendanceData[activeClass]?.[
                originalIndex
              ] || { status: "Hadir", note: "" };

              return (
                <StudentCard
                  key={originalIndex}
                  student={student}
                  originalIndex={originalIndex}
                  attendance={attendance}
                  activeClass={activeClass}
                  updateStatus={updateStatus}
                  updateNote={updateNote}
                  saving={saving}
                />
              );
            })
          )}
        </div>
      ) : (
        // Table View - FIXED with better proportions
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 sm:w-14">
                    No
                  </th>
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 sm:w-28">
                    NISN
                  </th>
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell w-20">
                    L/P
                  </th>
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell w-56">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={48} className="text-gray-300" />
                        <div>
                          <p className="text-gray-500 font-medium text-sm sm:text-base">
                            {studentsData[activeClass]?.length === 0
                              ? "Tidak ada siswa di kelas ini"
                              : "Tidak ada siswa yang sesuai dengan pencarian"}
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm mt-1">
                            {searchTerm
                              ? `Tidak ditemukan siswa dengan kata kunci "${searchTerm}"`
                              : "Kelas ini belum memiliki siswa terdaftar"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => {
                    const originalIndex =
                      studentsData[activeClass].indexOf(student);
                    const attendance = attendanceData[activeClass]?.[
                      originalIndex
                    ] || { status: "Hadir", note: "" };

                    return (
                      <tr
                        key={originalIndex}
                        className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                          {student.nisn}
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                          <div>
                            <div className="line-clamp-2">{student.nama_siswa}</div>
                            <div className="lg:hidden mt-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                  student.jenis_kelamin === "Laki-laki"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-pink-100 text-pink-700"
                                }`}>
                                {student.jenis_kelamin === "Laki-laki"
                                  ? "L"
                                  : "P"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-center hidden lg:table-cell">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              student.jenis_kelamin === "Laki-laki"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-pink-100 text-pink-700"
                            }`}>
                            {student.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4">
                          <div className="flex gap-1 flex-wrap">
                            <StatusButton
                              status="Hadir"
                              active={attendance.status === "Hadir"}
                              onClick={() =>
                                updateStatus(
                                  activeClass,
                                  originalIndex,
                                  "Hadir"
                                )
                              }
                              icon={Check}
                              label="Hadir"
                              disabled={saving}
                            />
                            <StatusButton
                              status="Sakit"
                              active={attendance.status === "Sakit"}
                              onClick={() =>
                                updateStatus(
                                  activeClass,
                                  originalIndex,
                                  "Sakit"
                                )
                              }
                              icon={Hospital}
                              label="Sakit"
                              disabled={saving}
                            />
                            <StatusButton
                              status="Izin"
                              active={attendance.status === "Izin"}
                              onClick={() =>
                                updateStatus(activeClass, originalIndex, "Izin")
                              }
                              icon={FileText}
                              label="Izin"
                              disabled={saving}
                            />
                            <StatusButton
                              status="Alpa"
                              active={attendance.status === "Alpa"}
                              onClick={() =>
                                updateStatus(activeClass, originalIndex, "Alpa")
                              }
                              icon={FileX}
                              label="Alpa"
                              disabled={saving}
                            />
                          </div>
                          {/* Mobile Keterangan - show under buttons on small screens */}
                          <div className="xl:hidden mt-2">
                            <input
                              type="text"
                              placeholder="Keterangan..."
                              value={attendance.note || ""}
                              onChange={(e) =>
                                updateNote(
                                  activeClass,
                                  originalIndex,
                                  e.target.value
                                )
                              }
                              disabled={saving}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                            />
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 hidden xl:table-cell">
                          <input
                            type="text"
                            placeholder="Keterangan..."
                            value={attendance.note || ""}
                            onChange={(e) =>
                              updateNote(
                                activeClass,
                                originalIndex,
                                e.target.value
                              )
                            }
                            disabled={saving}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmationModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setSaving(false);
        }}
        onConfirm={async () => {
          if (modalAction) {
            try {
              await modalAction();
            } catch (error) {
              console.error("Error in modal action:", error);
            }
          }
          setShowModal(false);
          setSaving(false);
        }}
        title="Konfirmasi Penyimpanan"
        message={modalMessage}
      />

      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={exportAttendance}
        loading={exportLoading}
      />

      <RecapModal
        show={showRekapModal}
        onClose={() => setShowRekapModal(false)}
        data={rekapData}
        title={rekapTitle}
        subtitle={rekapSubtitle}
        loading={rekapLoading}
        onRefreshData={handleRekapRefresh}
        activeClass={activeClass}
      />
    </div>
  );
};

export default Attendance;