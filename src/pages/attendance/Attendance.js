// src/components/Attendance/Attendance.js
// MAIN ENTRY POINT - CONNECTS ALL COMPONENTS

import React from "react";
import { useAttendanceLogic } from "./AttendanceMain";
import AttendanceUI from "./AttendanceUI";
import {
  DarkModeToggle,
  Toast,
  ConfirmationModal,
  ExportModal,
  ExportSemesterModal,
} from "./AttendanceComponents";
import AttendanceModal from "./AttendanceModal";

// ============================================
// MAIN ATTENDANCE COMPONENT
// ============================================
const Attendance = ({
  currentUser = { role: "admin", kelas: null, username: "admin" },
}) => {
  // Get all logic and state from custom hook
  const {
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
    deviceDetected, // <-- ADD THIS

    // Modal states
    showModal,
    setShowModal,
    modalMessage,
    modalAction,
    showExportModal,
    setShowExportModal,
    exportLoading,
    showExportSemesterModal,
    setShowExportSemesterModal,
    exportSemesterLoading,
    showRekapModal,
    setShowRekapModal,
    rekapData,
    rekapTitle,
    rekapSubtitle,
    rekapLoading,

    // Toast
    toast,
    hideToast,

    // Handlers
    updateStatus,
    updateNote,
    markAllPresent,
    saveAttendance,
    showRekap,
    handleRekapRefresh,
    exportAttendance,
    exportSemester,
  } = useAttendanceLogic(currentUser);

  // FIX: Show loading until device is detected AND data is loaded
  if ((loading && !deviceDetected) || (loading && !studentsData[activeClass])) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {!deviceDetected
              ? "Mendeteksi perangkat..."
              : "Memuat data siswa..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global Components */}
      <DarkModeToggle />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Main UI */}
      <AttendanceUI
        // State
        loading={loading && deviceDetected} // Pass loading only after device detected
        summary={summary}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        attendanceDate={attendanceDate}
        setAttendanceDate={setAttendanceDate}
        activeClass={activeClass}
        setActiveClass={setActiveClass}
        showCardView={showCardView}
        filteredStudents={filteredStudents}
        studentsData={studentsData}
        attendanceData={attendanceData}
        saving={saving}
        isSyncing={isSyncing}
        availableClasses={availableClasses}
        // Handlers
        updateStatus={updateStatus}
        updateNote={updateNote}
        markAllPresent={markAllPresent}
        saveAttendance={saveAttendance}
        showRekap={showRekap}
        setShowExportModal={setShowExportModal}
        setShowExportSemesterModal={setShowExportSemesterModal}
        // Modal states (passed but not rendered here)
        showModal={showModal}
        setShowModal={setShowModal}
        modalMessage={modalMessage}
        modalAction={modalAction}
        showExportModal={showExportModal}
        exportLoading={exportLoading}
        showExportSemesterModal={showExportSemesterModal}
        exportSemesterLoading={exportSemesterLoading}
        showRekapModal={showRekapModal}
        setShowRekapModal={setShowRekapModal}
        rekapData={rekapData}
        rekapTitle={rekapTitle}
        rekapSubtitle={rekapSubtitle}
        rekapLoading={rekapLoading}
        handleRekapRefresh={handleRekapRefresh}
        // Toast
        toast={toast}
        hideToast={hideToast}
        // Export handlers
        exportAttendance={exportAttendance}
        exportSemester={exportSemester}
        // Device info
        deviceDetected={deviceDetected} // <-- Pass to UI
      />

      {/* Modals */}
      <ConfirmationModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
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
    </>
  );
};

export default Attendance;
