// pages/attendance/Attendance.js (NEW & SLIM)

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Download } from "lucide-react"; // Hanya tersisa icon untuk tombol Export

import { supabase } from "../supabaseClient";
import AttendanceModal from "./AttendanceModal"; // Modal Rekap (asumsi ini komponen terpisah)
import {
  exportAttendanceFromComponent,
  exportSemesterRecapFromComponent,
} from "./AttendanceExport"; // Asumsi ini file logic export terpisah
import { getSemesterData } from "../services/semesterService";

// ===== PWA OFFLINE IMPORTS =====
import {
  saveWithSync,
  syncPendingData,
  getDataWithFallback,
} from "../offlineSync";
import { useSyncStatus } from "../hooks/useSyncStatus";
import SyncStatusBadge from "../components/SyncStatusBadge";
// ===============================

// ======= IMPORT COMPONENTS YANG SUDAH KITA SPLIT =======
import {
  Toast,
  ConfirmationModal,
  ExportModal,
  ExportSemesterModal,
} from "./AttendanceModals";
import { AttendanceStats } from "./AttendanceStats";
import { AttendanceFilters } from "./AttendanceFilters";
import { AttendanceTable, AttendanceCard } from "./AttendanceTable";
// =======================================================

// Data dummy untuk kelas (asumsi ini adalah sumber tunggal dari data kelas)
const AVAILABLE_CLASSES = ["10-A", "10-B", "11-A", "11-B", "12-A", "12-B"];

const Attendance = () => {
  // State Utama
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableClasses, setAvailableClasses] = useState(AVAILABLE_CLASSES); // Menggunakan dummy

  // State Filter
  const [activeClass, setActiveClass] = useState("10-A");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  // State Aksi
  const [isSaving, setSaving] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  // State Modal & Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportSemesterModal, setShowExportSemesterModal] = useState(false);

  // State Export
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSemesterLoading, setExportSemesterLoading] = useState(false);

  // State Rekap Modal
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [rekapData, setRekapData] = useState([]);
  const [rekapTitle, setRekapTitle] = useState("");
  const [rekapSubtitle, setRekapSubtitle] = useState("");
  const [rekapLoading, setRekapLoading] = useState(false);

  // Hooks PWA/Offline
  const { isOnline, isSyncing, pendingCount } = useSyncStatus();

  // Helper: Format tanggal ke YYYY-MM-DD
  const formatDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // -----------------------------------------------------------
  // 1. DATA FETCHING LOGIC
  // -----------------------------------------------------------

  const fetchData = useCallback(
    async (manual = false) => {
      setLoading(!manual); // Hanya tampilkan loading spinner di awal atau saat ganti filter, bukan saat refresh data
      setError(null);
      setRefreshing(manual);

      const dateKey = formatDateKey(selectedDate);

      try {
        const { data: attendanceData, localChanges } =
          await getDataWithFallback("attendance", {
            date: dateKey,
            class: activeClass,
          });

        setAttendance(attendanceData || []);
        setPendingChanges(localChanges || {});
        // Update kelas yang tersedia, hanya jika data asli (Supabase) berhasil diambil
        if (attendanceData && attendanceData.length > 0 && !manual) {
          const uniqueClasses = [
            ...new Set(attendanceData.map((s) => s.kelas)),
          ];
          setAvailableClasses(
            AVAILABLE_CLASSES.filter((c) => uniqueClasses.includes(c))
          );
        }
      } catch (err) {
        console.error("Fetch Data Error:", err);
        setError("Gagal memuat data presensi.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeClass, selectedDate]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Sync Pending Data
  const handleSync = useCallback(async () => {
    if (!isOnline) {
      setToastMessage(
        "Anda sedang offline. Tidak bisa melakukan sinkronisasi."
      );
      setToastType("offline");
      setShowToast(true);
      return;
    }
    await syncPendingData();
    // Setelah sync, refresh data untuk mengambil status terbaru dari server
    fetchData(true);
  }, [isOnline, fetchData]);

  // -----------------------------------------------------------
  // 2. STATUS CHANGE LOGIC
  // -----------------------------------------------------------

  const handleStatusChange = useCallback(
    (nis, newStatus) => {
      setAttendance((prevAttendance) => {
        const dateKey = formatDateKey(selectedDate);
        let updated = false;

        const newState = prevAttendance.map((student) => {
          if (student.nis === nis) {
            // Cek apakah status berubah
            if (student.status !== newStatus) {
              updated = true;
              // Catat perubahan untuk disinkronisasi
              setPendingChanges((prev) => ({
                ...prev,
                [dateKey]: {
                  ...(prev[dateKey] || {}),
                  [nis]: newStatus,
                },
              }));
              return { ...student, status: newStatus };
            }
          }
          return student;
        });

        // Tampilkan pesan perubahan jika berhasil diubah
        if (updated) {
          setToastMessage(`Presensi ${nis} diubah menjadi ${newStatus}.`);
          setToastType("success");
          setShowToast(true);
        }

        return newState;
      });
    },
    [selectedDate]
  );

  // -----------------------------------------------------------
  // 3. SAVE / PERSIST LOGIC
  // -----------------------------------------------------------

  const persistAttendance = useCallback(async () => {
    setSaving(true);
    const dateKey = formatDateKey(selectedDate);

    // Filter perubahan yang hanya relevan dengan kelas dan tanggal saat ini
    const changesToSave = attendance
      .filter((student) => {
        const pendingStatus = pendingChanges[dateKey]?.[student.nis];
        return pendingStatus && pendingStatus !== student.status_original; // status_original adalah status awal dari DB
      })
      .map((student) => ({
        nis: student.nis,
        kelas: student.kelas,
        status: student.status,
        tanggal: dateKey,
        is_synced: false,
      }));

    try {
      if (changesToSave.length === 0) {
        setToastMessage("Tidak ada perubahan yang perlu disimpan.");
        setToastType("error");
        setShowToast(true);
        setSaving(false);
        return;
      }

      await saveWithSync("attendance", dateKey, changesToSave);

      setToastMessage("Perubahan presensi berhasil disimpan (lokal/sync).");
      setToastType("success");
      setShowToast(true);

      // Setelah simpan, reset pending changes untuk tanggal ini
      setPendingChanges((prev) => {
        const newState = { ...prev };
        delete newState[dateKey];
        return newState;
      });

      // Refresh data jika online untuk memastikan sinkronisasi segera terjadi
      if (isOnline) {
        await handleSync();
      }
    } catch (err) {
      console.error("Save Error:", err);
      setToastMessage(
        `Gagal menyimpan: ${err.message || "Kesalahan jaringan."}`
      );
      setToastType("error");
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  }, [attendance, selectedDate, isOnline, handleSync, pendingChanges]);

  const handleSave = useCallback(() => {
    const dateKey = formatDateKey(selectedDate);
    const changes = pendingChanges[dateKey];

    if (changes && Object.keys(changes).length > 0) {
      setModalMessage(
        `Anda memiliki ${
          Object.keys(changes).length
        } perubahan presensi yang belum tersimpan untuk tanggal ${dateKey}. Apakah Anda yakin ingin menyimpan dan menimpa data yang ada?`
      );
      setModalAction(() => persistAttendance);
      setShowModal(true);
    } else {
      setToastMessage("Tidak ada perubahan yang perlu disimpan.");
      setToastType("error");
      setShowToast(true);
    }
  }, [selectedDate, pendingChanges, persistAttendance]);

  // -----------------------------------------------------------
  // 4. REKAP MODAL LOGIC
  // -----------------------------------------------------------

  const fetchRekapData = useCallback(async (student, date) => {
    setRekapLoading(true);
    setRekapTitle(`Rekap Presensi: ${student.nama}`);
    setRekapSubtitle(`NIS: ${student.nis}`);
    try {
      const { data } = await supabase
        .from("attendance_recap")
        .select("tanggal, status")
        .eq("nis", student.nis)
        .gte(
          "tanggal",
          formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1))
        )
        .lte("tanggal", formatDateKey(date))
        .order("tanggal", { ascending: false });

      setRekapData(data || []);
    } catch (err) {
      console.error("Fetch Rekap Error:", err);
      setRekapData([{ status: "Error loading data" }]);
    } finally {
      setRekapLoading(false);
    }
  }, []);

  const handleShowRekap = useCallback(
    (student) => {
      setShowRekapModal(true);
      fetchRekapData(student, selectedDate);
    },
    [fetchRekapData, selectedDate]
  );

  const handleRekapRefresh = useCallback(
    (student) => {
      fetchRekapData(student, selectedDate);
    },
    [fetchRekapData, selectedDate]
  );

  // -----------------------------------------------------------
  // 5. EXPORT LOGIC
  // -----------------------------------------------------------

  const exportAttendance = async (month, year) => {
    setExportLoading(true);
    try {
      await exportAttendanceFromComponent(month, year);
      setToastMessage("Export data bulanan berhasil dimulai.");
      setToastType("success");
      setShowToast(true);
    } catch (error) {
      console.error("Export Error:", error);
      setToastMessage("Gagal melakukan export data bulanan.");
      setToastType("error");
      setShowToast(true);
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const exportSemester = async (semester, year) => {
    setExportSemesterLoading(true);
    try {
      const semesterData = await getSemesterData(semester, year);

      await exportSemesterRecapFromComponent(semesterData, semester, year);

      setToastMessage("Export rekap semester berhasil dimulai.");
      setToastType("success");
      setShowToast(true);
    } catch (error) {
      console.error("Export Semester Error:", error);
      setToastMessage("Gagal melakukan export rekap semester.");
      setToastType("error");
      setShowToast(true);
    } finally {
      setExportSemesterLoading(false);
      setShowExportSemesterModal(false);
    }
  };

  // -----------------------------------------------------------
  // 6. FILTERING & SUMMARY LOGIC (useMemo)
  // -----------------------------------------------------------

  // Logic Filtering (untuk AttendanceTable)
  const filteredAttendance = useMemo(() => {
    if (!searchTerm) return attendance;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return attendance.filter(
      (student) =>
        student.nama.toLowerCase().includes(lowerSearchTerm) ||
        student.nis.toLowerCase().includes(lowerSearchTerm)
    );
  }, [attendance, searchTerm]);

  // Logic Summary (untuk AttendanceStats)
  const summary = useMemo(() => {
    return attendance.reduce(
      (acc, student) => {
        const statusKey = student.status;
        if (acc[statusKey] !== undefined) {
          acc[statusKey] += 1;
        }
        return acc;
      },
      { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 }
    );
  }, [attendance]);

  // -----------------------------------------------------------
  // 7. RENDER
  // -----------------------------------------------------------

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Dashboard Presensi
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors flex items-center gap-2 ${
              isSyncing
                ? "bg-gray-200 text-gray-600"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
            disabled={!isOnline || isSyncing}
            title="Sinkronisasi data tertunda">
            {isSyncing ? "Syncing..." : "Sync Now"}
            <SyncStatusBadge
              isOnline={isOnline}
              isSyncing={isSyncing}
              pendingCount={pendingCount}
            />
          </button>
          <div className="relative group">
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium">
              <Download size={18} /> Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300 z-10 hidden group-hover:block">
              <button
                onClick={() => setShowExportModal(true)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Export Bulanan
              </button>
              <button
                onClick={() => setShowExportSemesterModal(true)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Export Semester
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. FILTER SECTION (Menggunakan Komponen Baru) */}
      <AttendanceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        availableClasses={availableClasses}
        activeClass={activeClass}
        setActiveClass={setActiveClass}
        handleSave={handleSave}
        isSaving={isSaving}
        handleRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
      />

      {/* 2. STATS SECTION (Menggunakan Komponen Baru) */}
      <div className="my-6">
        <AttendanceStats summary={summary} />
      </div>

      {/* 3. TABLE/CARD SECTION (Menggunakan Komponen Baru) */}
      {/* Desktop Table */}
      <AttendanceTable
        filteredAttendance={filteredAttendance}
        handleStatusChange={handleStatusChange}
        handleShowRekap={handleShowRekap}
        selectedDate={selectedDate}
        loading={loading}
        error={error}
      />

      {/* Mobile Card List */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {loading || error || filteredAttendance.length === 0 ? (
          // Jika loading/error/empty, gunakan tampilan dari AttendanceTable (yang sudah kita cek di atas)
          <div className="col-span-full">
            <AttendanceTable
              loading={loading}
              error={error}
              filteredAttendance={filteredAttendance}
            />
          </div>
        ) : (
          // Render Cards
          filteredAttendance.map((student) => (
            <AttendanceCard
              key={student.nis}
              student={student}
              handleStatusChange={handleStatusChange}
              handleShowRekap={handleShowRekap}
              selectedDate={selectedDate}
            />
          ))
        )}
      </div>

      {/* MODALS SECTION (Menggunakan Komponen Baru) */}
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

      <ExportSemesterModal
        show={showExportSemesterModal}
        onClose={() => setShowExportSemesterModal(false)}
        onExport={exportSemester}
        loading={exportSemesterLoading}
      />

      {/* Asumsi AttendanceModal (rekap per siswa) adalah komponen terpisah yang sudah ada */}
      <AttendanceModal
        show={showRekapModal}
        onClose={() => setShowRekapModal(false)}
        data={rekapData}
        title={rekapTitle}
        subtitle={rekapSubtitle}
        loading={rekapLoading}
        onRefreshData={() =>
          handleRekapRefresh(rekapData[0] || { nis: null, nama: "..." })
        }
        // HANYA jika data rekap ada, kita panggil refresh handler
        rekapStudentData={
          rekapData.length > 0
            ? {
                nis: rekapSubtitle.split(": ")[1],
                nama: rekapTitle.split(": ")[1],
              }
            : null
        }
      />

      {/* TOAST (Menggunakan Komponen Baru) */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default Attendance;
