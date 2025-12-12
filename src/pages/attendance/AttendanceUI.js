// src/components/Attendance/AttendanceUI.js
// UI RENDERING FOR ATTENDANCE SYSTEM - RED-WHITE THEME

import React from "react";
import { Search, Users, RefreshCw } from "lucide-react";
import SyncStatusBadge from "../../components/SyncStatusBadge";
import AttendanceModal from "./AttendanceModal";
import { StatusButton, StatsCard, StudentCard } from "./AttendanceComponents";

// Import icon langsung dari lucide-react
import {
  Check,
  Hospital,
  FileText,
  FileX,
  Calendar,
  Download,
  Save,
} from "lucide-react";

// ============================================
// LOADING COMPONENT - RED THEME
// ============================================
export const LoadingState = () => (
  <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
    <div className="flex items-center justify-center py-12">
      <RefreshCw
        className="animate-spin mr-3 text-red-600 dark:text-red-400"
        size={24}
      />
      <span className="text-gray-700 dark:text-gray-300 text-base sm:text-lg font-medium">
        Memuat data siswa...
      </span>
    </div>
  </div>
);

// ============================================
// DEVICE DETECTION LOADING - RED THEME
// ============================================
export const DeviceDetectionLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-red-600 dark:border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-700 dark:text-gray-300 font-medium">
        Mendeteksi perangkat...
      </p>
    </div>
  </div>
);

// ============================================
// STATS GRID COMPONENT - RED THEME
// ============================================
export const StatsGrid = ({ summary }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    <StatsCard
      icon={Check}
      number={summary.Hadir}
      label="Total Hadir"
      color="red"
    />
    <StatsCard
      icon={Hospital}
      number={summary.Sakit}
      label="Total Sakit"
      color="amber"
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
      color="rose"
    />
  </div>
);

// ============================================
// CONTROLS SECTION (Search, Date, Class Selector) - RED THEME
// ============================================
export const ControlsSection = ({
  searchTerm,
  setSearchTerm,
  attendanceDate,
  setAttendanceDate,
  activeClass,
  setActiveClass,
  availableClasses,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4 transition-colors duration-300">
    <div className="relative w-full">
      <Search
        size={18}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
      />
      <input
        type="text"
        placeholder="Cari nama siswa atau NISN..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors font-medium text-sm sm:text-base touch-manipulation min-h-[44px]"
      />
    </div>

    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center lg:justify-start">
      <div className="flex items-center gap-3 w-full lg:w-auto flex-shrink-0">
        <label className="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap text-sm sm:text-base">
          Tanggal:
        </label>
        <input
          type="date"
          value={attendanceDate}
          onChange={(e) => setAttendanceDate(e.target.value)}
          className="w-full lg:w-64 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base touch-manipulation min-h-[44px]"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-2 w-full lg:flex-1">
        <div className="flex gap-2 justify-center lg:justify-start w-full flex-wrap">
          {availableClasses.map((classNum) => (
            <button
              key={classNum}
              onClick={() => setActiveClass(classNum)}
              className={`px-3 sm:px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 border-2 flex-1 text-center min-w-[80px] touch-manipulation active:scale-[0.98] min-h-[44px] ${
                activeClass === classNum
                  ? "bg-red-600 dark:bg-red-700 text-white border-red-600 dark:border-red-700 shadow-md"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-400 hover:text-red-600 dark:hover:text-red-400"
              }`}
              aria-label={`Pilih Kelas ${classNum}`}>
              Kelas {classNum}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// ACTION BUTTONS GRID - RED THEME
// ============================================
export const ActionButtons = ({
  studentsData,
  activeClass,
  saving,
  isSyncing,
  markAllPresent,
  saveAttendance,
  showRekap,
  setShowExportModal,
  setShowExportSemesterModal,
}) => {
  const isDisabled =
    !studentsData[activeClass] || studentsData[activeClass].length === 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-300">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 w-full">
        <button
          onClick={markAllPresent}
          disabled={isDisabled || saving}
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-800/40 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98] text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation min-h-[44px]"
          aria-label="Tandai semua siswa hadir">
          {saving ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          <span>Hadir Semua</span>
        </button>

        <button
          onClick={saveAttendance}
          disabled={isDisabled || saving || isSyncing}
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-800/40 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98] text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation min-h-[44px]"
          aria-label="Simpan presensi">
          {saving || isSyncing ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span>Simpan Presensi</span>
        </button>

        <button
          onClick={showRekap}
          disabled={isDisabled}
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98] text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation min-h-[44px]"
          aria-label="Lihat rekap presensi">
          <Calendar size={14} />
          <span>Lihat Rekap</span>
        </button>

        <button
          onClick={() => setShowExportModal(true)}
          disabled={isDisabled}
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98] text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation min-h-[44px]"
          aria-label="Export data bulanan">
          <Download size={14} />
          <span>Export Bulanan</span>
        </button>

        <button
          onClick={() => setShowExportSemesterModal(true)}
          disabled={isDisabled}
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98] text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation min-h-[44px]"
          aria-label="Export data semester">
          <Calendar size={14} />
          <span>Export Semester</span>
        </button>
      </div>
    </div>
  );
};

// ============================================
// MOBILE CARD VIEW - RED THEME
// ============================================
export const MobileCardView = ({
  filteredStudents,
  studentsData,
  activeClass,
  attendanceData,
  saving,
  updateStatus,
  updateNote,
}) => (
  <div className="space-y-3 sm:space-y-4">
    {filteredStudents.length === 0 ? (
      <EmptyState
        studentsData={studentsData}
        activeClass={activeClass}
        searchTerm={""}
      />
    ) : (
      filteredStudents.map((student, index) => {
        const originalIndex = studentsData[activeClass].indexOf(student);
        const attendance = attendanceData[activeClass]?.[originalIndex] || {
          status: "Hadir",
          note: "",
        };

        return (
          <StudentCard
            key={student.nisn || originalIndex}
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
);

// ============================================
// DESKTOP TABLE VIEW - RED THEME
// ============================================
export const DesktopTableView = ({
  filteredStudents,
  studentsData,
  activeClass,
  attendanceData,
  saving,
  updateStatus,
  updateNote,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-12 sm:w-14">
              No
            </th>
            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24 sm:w-28">
              NISN
            </th>
            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Nama Siswa
            </th>
            <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell w-20">
              L/P
            </th>
            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell w-64">
              Keterangan
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {filteredStudents.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-16 text-center">
                <EmptyState
                  studentsData={studentsData}
                  activeClass={activeClass}
                  searchTerm={""}
                />
              </td>
            </tr>
          ) : (
            filteredStudents.map((student, index) => {
              const originalIndex = studentsData[activeClass].indexOf(student);
              const attendance = attendanceData[activeClass]?.[
                originalIndex
              ] || { status: "Hadir", note: "" };

              return (
                <tr
                  key={student.nisn || originalIndex}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 text-center">
                    {index + 1}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                    {student.nisn}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                    <div>
                      <div className="line-clamp-2">{student.nama_siswa}</div>
                      <div className="lg:hidden mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            student.jenis_kelamin === "Laki-laki"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                          }`}>
                          {student.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-center hidden lg:table-cell">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        student.jenis_kelamin === "Laki-laki"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                      }`}>
                      {student.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex gap-1.5 flex-wrap">
                      <StatusButton
                        status="Hadir"
                        active={attendance.status === "Hadir"}
                        onClick={() =>
                          updateStatus(activeClass, originalIndex, "Hadir")
                        }
                        icon={Check}
                        label="Hadir"
                        disabled={saving}
                      />
                      <StatusButton
                        status="Sakit"
                        active={attendance.status === "Sakit"}
                        onClick={() =>
                          updateStatus(activeClass, originalIndex, "Sakit")
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
                    <div className="xl:hidden mt-3">
                      <input
                        type="text"
                        placeholder="Keterangan..."
                        value={attendance.note || ""}
                        onChange={(e) =>
                          updateNote(activeClass, originalIndex, e.target.value)
                        }
                        disabled={saving}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                      />
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 hidden xl:table-cell">
                    <input
                      type="text"
                      placeholder="Keterangan..."
                      value={attendance.note || ""}
                      onChange={(e) =>
                        updateNote(activeClass, originalIndex, e.target.value)
                      }
                      disabled={saving}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
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
);

// ============================================
// EMPTY STATE COMPONENT - RED THEME
// ============================================
export const EmptyState = ({ studentsData, activeClass, searchTerm }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
    <div className="flex flex-col items-center gap-4 text-center">
      <Users size={48} className="text-gray-300 dark:text-gray-600" />
      <div>
        <p className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base mb-1">
          {studentsData[activeClass]?.length === 0
            ? "Tidak ada siswa di kelas ini"
            : "Tidak ada siswa yang sesuai dengan pencarian"}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
          {searchTerm
            ? `Tidak ditemukan siswa dengan kata kunci "${searchTerm}"`
            : "Kelas ini belum memiliki siswa terdaftar"}
        </p>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN UI LAYOUT COMPONENT - RED THEME
// ============================================
const AttendanceUI = ({
  // State
  loading,
  summary,
  searchTerm,
  setSearchTerm,
  attendanceDate,
  setAttendanceDate,
  activeClass,
  setActiveClass,
  showCardView,
  filteredStudents,
  studentsData,
  attendanceData,
  saving,
  isSyncing,
  availableClasses,
  deviceDetected,

  // Handlers
  updateStatus,
  updateNote,
  markAllPresent,
  saveAttendance,
  showRekap,
  setShowExportModal,
  setShowExportSemesterModal,

  // Modal states
  showModal,
  setShowModal,
  modalMessage,
  modalAction,
  showExportModal,
  exportLoading,
  showExportSemesterModal,
  exportSemesterLoading,
  showRekapModal,
  setShowRekapModal,
  rekapData,
  rekapTitle,
  rekapSubtitle,
  rekapLoading,
  handleRekapRefresh,

  // Toast
  toast,
  hideToast,

  // Export handlers
  exportAttendance,
  exportSemester,
}) => {
  // FIX: Don't render anything until device is detected
  if (!deviceDetected) {
    return <DeviceDetectionLoading />;
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <SyncStatusBadge />

      <StatsGrid summary={summary} />

      <ControlsSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        attendanceDate={attendanceDate}
        setAttendanceDate={setAttendanceDate}
        activeClass={activeClass}
        setActiveClass={setActiveClass}
        availableClasses={availableClasses}
      />

      <ActionButtons
        studentsData={studentsData}
        activeClass={activeClass}
        saving={saving}
        isSyncing={isSyncing}
        markAllPresent={markAllPresent}
        saveAttendance={saveAttendance}
        showRekap={showRekap}
        setShowExportModal={setShowExportModal}
        setShowExportSemesterModal={setShowExportSemesterModal}
      />

      {showCardView ? (
        <MobileCardView
          filteredStudents={filteredStudents}
          studentsData={studentsData}
          activeClass={activeClass}
          attendanceData={attendanceData}
          saving={saving}
          updateStatus={updateStatus}
          updateNote={updateNote}
        />
      ) : (
        <DesktopTableView
          filteredStudents={filteredStudents}
          studentsData={studentsData}
          activeClass={activeClass}
          attendanceData={attendanceData}
          saving={saving}
          updateStatus={updateStatus}
          updateNote={updateNote}
        />
      )}

      {/* Modals are handled in main Attendance.js */}
    </div>
  );
};

export default AttendanceUI;
