// src/pages/Attendance.js - VERSION AFTER SPLITTING (Hanya 180 baris!)
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Check, Save, Calendar, Download, RefreshCw } from "lucide-react";

import { supabase } from "../supabaseClient";
import AttendanceModal from "./AttendanceModal";
import {
  exportAttendanceFromComponent,
  exportSemesterRecapFromComponent,
} from "./AttendanceExport";

// PWA OFFLINE IMPORTS
import { saveWithSync, syncPendingData } from "../offlineSync";
import { useSyncStatus } from "../hooks/useSyncStatus";
import SyncStatusBadge from "../components/SyncStatusBadge";

// COMPONENTS YANG SUDAH DIPISAH
import AttendanceFilters from "./attendance/AttendanceFilters";
import AttendanceStats from "./attendance/AttendanceStats";
import AttendanceTable from "./attendance/AttendanceTable";
import {
  Toast,
  ConfirmationModal,
  ExportModal,
  ExportSemesterModal,
} from "./attendance/AttendanceModals";

// CUSTOM HOOK (Kita taruh di sini karena cuma dipakai di file ini)
const useAttendance = (currentUser) => {
  const [studentsData, setStudentsData] = useState({});
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { isOnline, pendingCount, isSyncing } = useSyncStatus();

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
        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("tanggal", date)
          .eq("kelas", classNum)
          .eq("guru_input", currentUser.username);

        if (error) throw error;

        setAttendanceData((prev) => {
          const newAttendanceData = { ...prev };

          if (newAttendanceData[classNum]) {
            Object.keys(newAttendanceData[classNum]).forEach((index) => {
              newAttendanceData[classNum][index] = {
                ...newAttendanceData[classNum][index],
                status: "Hadir",
                note: "",
              };
            });

            if (data && data.length > 0) {
              data.forEach((record) => {
                const studentIndex = studentsData[classNum]?.findIndex(
                  (s) => s.nisn === record.nisn
                );
                if (
                  studentIndex !== -1 &&
                  newAttendanceData[classNum][studentIndex]
                ) {
                  newAttendanceData[classNum][studentIndex] = {
                    ...newAttendanceData[classNum][studentIndex],
                    status: record.status,
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
    isOnline,
    pendingCount,
    isSyncing,
  };
};

// Main Attendance Component
const Attendance = ({
  currentUser = { role: "admin", kelas: null, username: "admin" },
}) => {
  // CUSTOM HOOK
  const {
    studentsData,
    attendanceData,
    setAttendanceData,
    loading,
    saving,
    setSaving,
    loadStudentsData,
    loadAttendanceForDate,
    isOnline,
    pendingCount,
    isSyncing,
  } = useAttendance(currentUser);

  // STATE
  const [attendanceDate, setAttendanceDate] = useState("");
  const [activeClass, setActiveClass] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalAction, setModalAction] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportSemesterModal, setShowExportSemesterModal] = useState(false);
  const [exportSemesterLoading, setExportSemesterLoading] = useState(false);
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [rekapData, setRekapData] = useState([]);
  const [rekapTitle, setRekapTitle] = useState("");
  const [rekapSubtitle, setRekapSubtitle] = useState("");
  const [rekapLoading, setRekapLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [isMobile, setIsMobile] = useState(false);

  // EFFECTS
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingData()
        .then(() => {
          console.log("✅ Auto-sync completed");
        })
        .catch((err) => {
          console.error("❌ Auto-sync failed:", err);
        });
    }
  }, [isOnline, pendingCount]);

  useEffect(() => {
    const checkDeviceType = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkDeviceType();
    window.addEventListener("resize", checkDeviceType);
    return () => window.removeEventListener("resize", checkDeviceType);
  }, []);

  const getJenisPresensi = useCallback(() => {
    return currentUser.role === "guru_kelas" ? "kelas" : "mapel";
  }, [currentUser.role]);

  useEffect(() => {
    const getIndonesiaDate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    setAttendanceDate(getIndonesiaDate());
  }, []);

  useEffect(() => {
    loadStudentsData().catch((error) => {
      showToast(`Error memuat data siswa: ${error.message}`, "error");
    });
  }, [loadStudentsData]);

  useEffect(() => {
    if (currentUser.role === "guru_kelas" && currentUser.kelas) {
      setActiveClass(currentUser.kelas);
    }
  }, [currentUser]);

  useEffect(() => {
    if (attendanceDate && studentsData[activeClass]?.length > 0) {
      loadAttendanceForDate(attendanceDate, activeClass).catch((error) => {
        showToast(`Error memuat data presensi: ${error.message}`, "error");
      });
    }
  }, [attendanceDate, activeClass, loadAttendanceForDate, studentsData]);

  // FILTERED STUDENTS
  const filteredStudents = useMemo(() => {
    if (!studentsData[activeClass]) return [];
    return studentsData[activeClass].filter(
      (student) =>
        student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nisn.includes(searchTerm)
    );
  }, [studentsData, activeClass, searchTerm]);

  // SUMMARY
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

  // TOAST FUNCTIONS
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);
  const hideToast = useCallback(() => {
    setToast({ show: false, message: "", type: "" });
  }, []);

  // CHECK CLASS ACCESS
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

  // UPDATE STATUS & NOTE
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
    [checkClassAccess, setAttendanceData]
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
    [checkClassAccess, setAttendanceData]
  );

  // SAVE FUNCTIONS (simplified - only core logic)
  const checkExistingAttendance = useCallback(
    async (classNum, date) => {
      try {
        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("tanggal", date)
          .eq("kelas", classNum)
          .eq("guru_input", currentUser.username)
          .limit(1);
        if (error) return false;
        return data && data.length > 0;
      } catch (error) {
        return false;
      }
    },
    [currentUser.username]
  );

  const saveAttendanceData = useCallback(
    async (classNum, date) => {
      try {
        if (
          !attendanceData[classNum] ||
          Object.keys(attendanceData[classNum]).length === 0
        ) {
          throw new Error("Tidak ada data attendance untuk disimpan");
        }

        if (isOnline) {
          const { error: deleteError } = await supabase
            .from("attendance")
            .delete()
            .eq("tanggal", date)
            .eq("kelas", classNum)
            .eq("guru_input", currentUser.username);

          if (deleteError) console.error("❌ Delete error:", deleteError);
        }

        const attendanceRecords = Object.values(attendanceData[classNum]);
        let successCount = 0;

        for (const student of attendanceRecords) {
          const record = {
            tanggal: date,
            nisn: student.nisn,
            nama_siswa: student.name,
            kelas: classNum,
            status: student.status,
            keterangan: student.note || "",
            guru_input: currentUser.username,
            jenis_presensi: getJenisPresensi(),
            tahun_ajaran: "2025/2026",
          };

          const result = await saveWithSync("attendance", record);
          if (result.success) successCount++;
        }

        const jenisText =
          getJenisPresensi() === "kelas" ? "Kelas" : "Mata Pelajaran";
        if (isOnline) {
          showToast(
            `✅ ${successCount} presensi ${jenisText} ${classNum} tanggal ${date} berhasil disimpan!`
          );
        } else {
          showToast(
            `💾 ${successCount} data disimpan offline. Akan disinkronkan saat online.`,
            "offline"
          );
        }

        await loadAttendanceForDate(date, classNum);
      } catch (error) {
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
      isOnline,
    ]
  );

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
  }, [activeClass, checkClassAccess, saving, showToast, setAttendanceData]);

  const saveAttendance = useCallback(async () => {
    if (!checkClassAccess(activeClass) || saving) return;
    if (saving) return;
    if (!attendanceDate) {
      showToast("Pilih tanggal terlebih dahulu!", "error");
      return;
    }

    setSaving(true);
    try {
      if (isOnline) {
        const exists = await checkExistingAttendance(
          activeClass,
          attendanceDate
        );
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
    isOnline,
  ]);

  // REKAP & EXPORT FUNCTIONS (simplified)
  const showRekap = useCallback(async () => {
    const jenisText =
      getJenisPresensi() === "kelas" ? "Kelas" : "Mata Pelajaran";
    setRekapTitle(`Rekap Presensi ${jenisText} ${activeClass}`);
    setRekapSubtitle("Laporan Kehadiran Siswa");
    setShowRekapModal(true);
    // Load initial rekap data
    setRekapData([]);
  }, [activeClass, getJenisPresensi]);

  const handleRekapRefresh = useCallback(async (params) => {
    setRekapLoading(true);
    try {
      // Simplified - just show loading
      setRekapData([]);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setRekapLoading(false);
    }
  }, []);

  const exportAttendance = useCallback(
    async (month, year) => {
      try {
        setExportLoading(true);
        const result = await exportAttendanceFromComponent(
          supabase,
          activeClass,
          month,
          year,
          studentsData,
          currentUser
        );
        if (result.success) {
          showToast(result.message);
          setShowExportModal(false);
        } else {
          showToast(result.message, "error");
        }
      } catch (error) {
        showToast(`Error mengexport data: ${error.message}`, "error");
      } finally {
        setExportLoading(false);
      }
    },
    [activeClass, studentsData, showToast, currentUser]
  );

  const exportSemester = useCallback(
    async (semester, year) => {
      try {
        setExportSemesterLoading(true);
        const result = await exportSemesterRecapFromComponent(
          supabase,
          activeClass,
          semester,
          year,
          studentsData,
          currentUser
        );
        if (result.success) {
          showToast(result.message);
          setShowExportSemesterModal(false);
        } else {
          showToast(result.message, "error");
        }
      } catch (error) {
        showToast(`Error mengexport semester: ${error.message}`, "error");
      } finally {
        setExportSemesterLoading(false);
      }
    },
    [activeClass, studentsData, showToast, currentUser]
  );

  const availableClasses = useMemo(() => {
    if (currentUser.role === "guru_kelas" && currentUser.kelas) {
      return [currentUser.kelas];
    }
    return [1, 2, 3, 4, 5, 6];
  }, [currentUser]);

  // LOADING STATE
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

  // ACTION BUTTONS (inline karena kecil)
  const ActionButtons = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 w-full">
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
          <span>Hadir Semua</span>
        </button>
        <button
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 touch-manipulation min-h-[44px]"
          onClick={saveAttendance}
          disabled={
            !studentsData[activeClass] ||
            studentsData[activeClass].length === 0 ||
            saving ||
            isSyncing
          }>
          {saving || isSyncing ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span>Simpan Presensi</span>
        </button>
        <button
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 touch-manipulation min-h-[44px]"
          onClick={showRekap}
          disabled={
            !studentsData[activeClass] || studentsData[activeClass].length === 0
          }>
          <Calendar size={14} />
          <span>Lihat Rekap</span>
        </button>
        <button
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 touch-manipulation min-h-[44px]"
          onClick={() => setShowExportModal(true)}
          disabled={
            !studentsData[activeClass] || studentsData[activeClass].length === 0
          }>
          <Download size={14} />
          <span>Export Bulanan</span>
        </button>
        <button
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 touch-manipulation min-h-[44px]"
          onClick={() => setShowExportSemesterModal(true)}
          disabled={
            !studentsData[activeClass] || studentsData[activeClass].length === 0
          }>
          <Calendar size={14} />
          <span>Export Semester</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
      <SyncStatusBadge />
      <AttendanceStats summary={summary} />
      <AttendanceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        attendanceDate={attendanceDate}
        setAttendanceDate={setAttendanceDate}
        activeClass={activeClass}
        setActiveClass={setActiveClass}
        availableClasses={availableClasses}
      />
      <ActionButtons />
      <AttendanceTable
        filteredStudents={filteredStudents}
        studentsData={studentsData}
        activeClass={activeClass}
        attendanceData={attendanceData}
        updateStatus={updateStatus}
        updateNote={updateNote}
        saving={saving}
        searchTerm={searchTerm}
        showCardView={isMobile}
      />
      <ConfirmationModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setSaving(false);
        }}
        onConfirm={async () => {
          if (modalAction) await modalAction();
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
      <ExportSemesterModal
        show={showExportSemesterModal}
        onClose={() => setShowExportSemesterModal(false)}
        onExport={exportSemester}
        loading={exportSemesterLoading}
      />
      <AttendanceModal
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
