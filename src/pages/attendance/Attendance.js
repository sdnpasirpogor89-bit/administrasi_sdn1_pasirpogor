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
        loading={loading}
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
