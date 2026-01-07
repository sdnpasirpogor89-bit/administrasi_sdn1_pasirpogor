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
  const [isDesktop, setIsDesktop] = useState(false);

  // Enhanced device detection with Tailwind breakpoints
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640); // Tailwind 'sm' breakpoint
      setIsTablet(width >= 640 && width < 1024); // Tailwind 'md' and 'lg'
      setIsDesktop(width >= 1024); // Tailwind 'lg' and above
    };

    checkDevice();

    // Debounced resize handler
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkDevice, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
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

  // Enhanced loading screen with responsive design and Red-950 theme
  if ((loading && !deviceDetected) || (loading && !studentsData[activeClass])) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-slate-950 flex items-center justify-center p-3 sm:p-4 md:p-6 transition-colors duration-300">
        <div className="text-center max-w-xs xs:max-w-sm sm:max-w-md w-full">
          <div className="relative mb-5 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-red-200 dark:border-red-800 rounded-full mx-auto"></div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-red-700 dark:border-red-500 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>

            {/* Device icon based on detection */}
            <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 bg-white dark:bg-gray-800 p-1.5 sm:p-2 rounded-lg shadow-md border border-red-100 dark:border-gray-700">
              {isMobile ? (
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              ) : isTablet ? (
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
          </div>

          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-red-900 dark:text-slate-100 mb-2 sm:mb-3 px-4">
            {!deviceDetected
              ? "Mendeteksi Perangkat..."
              : "Memuat Data Presensi"}
          </h2>

          <p className="text-red-700 dark:text-slate-300 text-sm sm:text-base mb-4 sm:mb-6 px-4">
            {!deviceDetected
              ? "Mengoptimalkan untuk perangkat Anda..."
              : "Mengambil data siswa dan presensi..."}
          </p>

          {/* Responsive loading indicator with Red-950 theme */}
          <div className="flex flex-col xs:flex-row items-center justify-center gap-2.5 sm:gap-3 md:gap-4 mb-6">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-600 dark:bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-red-800 dark:text-red-300 font-medium">
                {isMobile ? "HP" : isTablet ? "Tablet" : "Desktop"} terdeteksi
              </span>
            </div>

            <div className="hidden xs:block text-red-300 dark:text-slate-600 text-lg">
              •
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-pulse delay-150"></div>
              <span className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                Mode {isMobile ? "Touch" : "Klik"} diaktifkan
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-red-100 dark:bg-red-900/30 h-1.5 sm:h-2 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 animate-pulse rounded-full w-3/4"></div>
          </div>

          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
            Mengoptimalkan pengalaman untuk perangkat Anda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
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
        // Enhanced device info
        deviceDetected={deviceDetected}
        isMobile={isMobile}
        isTablet={isTablet}
        isDesktop={isDesktop}
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
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={exportAttendance}
        loading={exportLoading}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <ExportSemesterModal
        show={showExportSemesterModal}
        onClose={() => setShowExportSemesterModal(false)}
        onExport={exportSemester}
        loading={exportSemesterLoading}
        isMobile={isMobile}
        isTablet={isTablet}
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
        isMobile={isMobile}
        isTablet={isTablet}
        isDesktop={isDesktop}
      />
    </div>
  );
};

export default Attendance;
