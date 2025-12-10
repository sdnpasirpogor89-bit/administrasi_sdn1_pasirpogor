// src/components/Attendance/Attendance.js
// MAIN ENTRY POINT - CONNECTS ALL COMPONENTS

import React, { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Deteksi perangkat saat mount dan resize
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

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
    deviceDetected,

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

  // Enhanced loading screen with responsive design
  if ((loading && !deviceDetected) || (loading && !studentsData[activeClass])) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="text-center max-w-sm w-full">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full mx-auto mb-4"></div>
            <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">
            {!deviceDetected
              ? "Mendeteksi Perangkat..."
              : "Memuat Data Presensi"}
          </h2>

          <p className="text-gray-600 dark:text-slate-300 text-sm sm:text-base mb-6">
            {!deviceDetected
              ? "Mengoptimalkan untuk perangkat Anda..."
              : "Mengambil data siswa dan presensi..."}
          </p>

          {/* Responsive loading indicator */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                {isMobile ? "HP" : isTablet ? "Tablet" : "Desktop"} terdeteksi
              </span>
            </div>

            <div className="hidden sm:block text-gray-300 dark:text-slate-600">
              •
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse delay-150"></div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                Mode {isMobile ? "Touch" : "Klik"} diaktifkan
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Global Components - Pindah DarkModeToggle ke App.js jika sudah ada */}
      {/* <DarkModeToggle /> */}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Main UI - Pass device info untuk responsive */}
      <AttendanceUI
        // State
        loading={loading && deviceDetected}
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
        // Modal states
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
        // Device info - TAMBAHKAN INI
        deviceDetected={deviceDetected}
        isMobile={isMobile}
        isTablet={isTablet}
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
        isMobile={isMobile} // Pass device info untuk modal responsive
      />

      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={exportAttendance}
        loading={exportLoading}
        isMobile={isMobile} // Pass device info
      />

      <ExportSemesterModal
        show={showExportSemesterModal}
        onClose={() => setShowExportSemesterModal(false)}
        onExport={exportSemester}
        loading={exportSemesterLoading}
        isMobile={isMobile} // Pass device info
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
        isMobile={isMobile} // Pass device info
        isTablet={isTablet} // Pass device info
      />
    </div>
  );
};

export default Attendance;
