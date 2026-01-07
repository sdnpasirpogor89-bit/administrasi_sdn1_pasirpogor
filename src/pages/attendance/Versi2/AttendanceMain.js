// AttendanceMain.js - ROUTER UTAMA UNTUK SD (FIXED VERSION)
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  getActiveAcademicInfo,
  getAllSemestersInActiveYear,
  getSemesterById,
} from "../../services/academicYearService";
import Attendance from "./Attendance";
import AttendanceModal from "./AttendanceModal";
import {
  exportMonthlyAttendanceSD,
  exportSemesterRecapSD,
} from "./AttendanceExport";

const AttendanceMain = ({ user, onShowToast, darkMode }) => {
  const [activeTab, setActiveTab] = useState("input");
  const [fullUserData, setFullUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ SEMESTER STATES
  const [selectedSemester, setSelectedSemester] = useState("");
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [activeSemesterInfo, setActiveSemesterInfo] = useState(null);

  // ✅ PREVIEW STATES - BARU!
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewClass, setPreviewClass] = useState(
    user?.kelas || fullUserData?.kelas || ""
  );

  // ✅ EXPORT STATES
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState("bulanan");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedClass, setSelectedClass] = useState("");

  // ✅ NAVIGATION ITEMS
  const navigationItems = [
    {
      id: "input",
      icon: "✏️",
      title: "Input Presensi",
      subtitle: "Input kehadiran harian",
      badge: "Input",
    },
    {
      id: "preview",
      icon: "👁️",
      title: "Preview Presensi",
      subtitle: "Lihat rekap kehadiran",
      badge: "Preview",
    },
    {
      id: "export",
      icon: "📊",
      title: "Export Presensi",
      subtitle: "Unduh laporan Excel",
      badge: "Export",
    },
  ];

  // ✅ MONTHS DATA
  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  // ✅ HELPER: Show toast
  const showToast = (message, type = "info") => {
    if (onShowToast) {
      onShowToast(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  };

  // ✅ FUNGSI TRANSFORM DATA - BARU!
  const transformAttendanceData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];

    console.log("🔄 Transforming raw data:", rawData.length, "records");

    // Group by NISN
    const groupedByStudent = rawData.reduce((acc, record) => {
      const nisn = record.nisn;

      if (!acc[nisn]) {
        acc[nisn] = {
          nisn: record.nisn,
          name: record.nama_siswa,
          full_name: record.nama_siswa,
          nama_siswa: record.nama_siswa,
          kelas: record.kelas,
          dailyStatus: {},
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpa: 0,
          total: 0,
        };
      }

      // Add daily status
      const tanggal = record.tanggal; // format: YYYY-MM-DD
      const status = record.status; // Hadir, Sakit, Izin, Alpa

      acc[nisn].dailyStatus[tanggal] = status;

      // Count by status
      const statusLower = status.toLowerCase();
      if (statusLower === "hadir") acc[nisn].hadir++;
      else if (statusLower === "sakit") acc[nisn].sakit++;
      else if (statusLower === "izin") acc[nisn].izin++;
      else if (statusLower === "alpa") acc[nisn].alpa++;

      acc[nisn].total++;

      return acc;
    }, {});

    // Convert to array and calculate percentage
    const result = Object.values(groupedByStudent).map((student) => {
      const totalHari = student.total;
      const percentage =
        totalHari > 0 ? Math.round((student.hadir / totalHari) * 100) : 0;

      return {
        ...student,
        percentage,
      };
    });

    console.log("✅ Transformed data:", result.length, "students");
    return result;
  };

  // ✅ FUNGSI FETCH PREVIEW DATA - BARU!
  const fetchPreviewData = async ({
    mode,
    month,
    year,
    semester,
    academicYear,
  }) => {
    setPreviewLoading(true);

    try {
      if (!previewClass) {
        showToast("Pilih kelas terlebih dahulu", "error");
        setPreviewLoading(false);
        return;
      }

      if (!selectedSemester) {
        showToast("Semester tidak dipilih", "error");
        setPreviewLoading(false);
        return;
      }

      // ✅ GET SEMESTER DATA
      const semesterData = await getSemesterById(selectedSemester);
      if (!semesterData) {
        showToast("Semester tidak ditemukan", "error");
        setPreviewLoading(false);
        return;
      }

      console.log("🔍 Fetching preview data:", {
        mode,
        month,
        year,
        semester,
        academicYear,
        class: previewClass,
        semesterData,
      });

      let query = supabase
        .from("attendance")
        .select("*")
        .eq("kelas", previewClass)
        .eq("tahun_ajaran", semesterData.year) // ✅ Always filter by year
        .order("tanggal", { ascending: true });

      if (mode === "monthly" && month && year) {
        // ✅ USE USER-SELECTED YEAR DIRECTLY
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

        console.log("📅 Monthly filter:", startDate, "to", endDate);

        query = query.gte("tanggal", startDate).lte("tanggal", endDate);
      } else if (mode === "semester") {
        // ✅ SEMESTER MODE: Use semester date range
        console.log(
          "📚 Semester filter:",
          semesterData.year,
          semesterData.semester
        );

        query = query
          .gte("tanggal", semesterData.start_date)
          .lte("tanggal", semesterData.end_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log("📦 Raw data received:", data?.length || 0, "records");

      if (data && data.length > 0) {
        const transformedData = transformAttendanceData(data);
        setPreviewData(transformedData);
        console.log("✅ Preview data set:", transformedData.length, "students");
      } else {
        setPreviewData([]);
        console.log("⚠️ No data found for the selected period");
      }
    } catch (error) {
      console.error("❌ Error fetching preview data:", error);
      showToast("Gagal memuat data preview", "error");
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // ✅ FETCH FULL USER DATA
  useEffect(() => {
    const fetchFullUserData = async () => {
      if (!user) {
        console.error("❌ No user object found");
        setFullUserData(null);
        setLoading(false);
        return;
      }

      // ✅ If no username, try to use user object directly
      if (!user.username) {
        console.warn("⚠️ No username, using user object directly");
        setFullUserData(user);
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Fetching full user data for:", user.username);

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", user.username)
          .maybeSingle();

        if (error) {
          console.error("❌ Error fetching user data:", error);
          setFullUserData(user); // ✅ Fallback to passed user
          setLoading(false);
          return;
        }

        if (!data) {
          console.warn(
            "⚠️ User not found in database, using passed user object"
          );
          setFullUserData(user); // ✅ Fallback to passed user
          setLoading(false);
          return;
        }

        console.log("✅ Full user data loaded:", {
          username: data.username,
          role: data.role,
          kelas: data.kelas,
        });

        const userData = {
          ...user,
          ...data,
          name: data.full_name || user.name,
        };

        setFullUserData(userData);

        // Auto-set preview class jika user adalah guru kelas
        if (data.role === "guru_kelas" && data.kelas) {
          setPreviewClass(data.kelas);
          setSelectedClass(data.kelas); // Untuk tab export juga
        }
      } catch (error) {
        console.error("❌ Unexpected error:", error);
        setFullUserData(user);
      } finally {
        setLoading(false);
      }
    };

    fetchFullUserData();
  }, [user]);

  // ✅ FETCH SEMESTER
  useEffect(() => {
    const fetchActiveSemester = async () => {
      try {
        const academicInfo = await getActiveAcademicInfo();
        const allSemesters = await getAllSemestersInActiveYear();

        console.log(
          "✅ Active academic year:",
          academicInfo.year,
          academicInfo.activeSemester
        );

        setAvailableSemesters(allSemesters);
        setActiveSemesterInfo(academicInfo);

        // Auto-set semester aktif
        if (academicInfo.activeSemesterId) {
          setSelectedSemester(academicInfo.activeSemesterId);
        }
      } catch (error) {
        console.error("Error fetching active semester:", error);
        showToast("Gagal memuat semester aktif", "error");
      }
    };

    fetchActiveSemester();
  }, []);

  // ✅ AUTO-FETCH PREVIEW DATA - BARU!
  useEffect(() => {
    if (activeTab === "preview" && previewClass) {
      console.log("🔄 Tab preview opened, fetching data...");

      // Fetch data untuk bulan sekarang
      const now = new Date();
      fetchPreviewData({
        mode: "monthly",
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
    }
  }, [activeTab, previewClass]);

  // ✅ HANDLE EXPORT
  const handleDownloadExport = async () => {
    console.log("🚀 handleDownloadExport called!");
    setIsExporting(true);

    try {
      if (!selectedSemester) {
        showToast("Pilih semester terlebih dahulu", "error");
        return;
      }

      if (!selectedClass) {
        showToast("Pilih kelas terlebih dahulu", "error");
        return;
      }

      // ✅ GET SEMESTER DATA
      const semesterData = await getSemesterById(selectedSemester);
      if (!semesterData) {
        showToast("Semester tidak ditemukan", "error");
        return;
      }

      console.log("📅 Semester data:", semesterData);

      // Fetch students for selected class
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("kelas", selectedClass)
        .eq("is_active", true)
        .order("nama_siswa", { ascending: true });

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        showToast("Tidak ada siswa di kelas ini", "error");
        return;
      }

      // EXPORT BULANAN
      if (exportType === "bulanan") {
        const year =
          selectedMonth >= 7
            ? parseInt(semesterData.year.split("/")[0])
            : parseInt(semesterData.year.split("/")[1]);

        const yearMonth = `${year}-${String(selectedMonth).padStart(2, "0")}`;

        const result = await exportMonthlyAttendanceSD(
          students,
          selectedClass,
          "PRESENSI KELAS",
          new Date(),
          {},
          {},
          showToast,
          yearMonth,
          fullUserData.full_name || fullUserData.username,
          selectedClass,
          selectedSemester,
          semesterData.year,
          semesterData.semester
        );

        if (result && result.success) {
          const monthName = months.find(
            (m) => m.value === selectedMonth
          )?.label;
          showToast(
            `✅ Data Presensi ${monthName} ${year} berhasil diexport!`,
            "success"
          );
        }
      }
      // EXPORT SEMESTER
      else if (exportType === "semester") {
        const result = await exportSemesterRecapSD(
          students,
          selectedClass,
          "PRESENSI KELAS",
          showToast,
          fullUserData.full_name || fullUserData.username,
          selectedSemester,
          semesterData.year,
          semesterData.semester
        );

        if (result && result.success) {
          const semesterLabel =
            semesterData.semester === 1 ? "Ganjil" : "Genap";
          showToast(
            `✅ Rekap Semester ${semesterLabel} ${semesterData.year} berhasil diexport!`,
            "success"
          );
        }
      }
    } catch (error) {
      console.error("❌ Export error:", error);
      showToast(`Export gagal: ${error.message}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 to-gray-800"
            : "bg-gradient-to-br from-red-50 to-red-100"
        }`}>
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
              darkMode ? "border-red-400" : "border-red-600"
            }`}></div>
          <p
            className={`text-base font-medium ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}>
            Memuat data user...
          </p>
        </div>
      </div>
    );
  }

  // ✅ NO USER CHECK
  if (!fullUserData) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 to-gray-800"
            : "bg-gradient-to-br from-red-50 to-red-100"
        }`}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}>
            Data User Tidak Ditemukan
          </h2>
          <p
            className={`text-base ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}>
            Silakan login kembali atau hubungi administrator
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div>
          {/* HEADER */}
          <div className="mb-6 sm:mb-8 text-center px-2">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              📋 Sistem Presensi Siswa SD
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Kelola Presensi Siswa Dengan Mudah Dan Efisien
            </p>
          </div>

          {/* TABS NAVIGATION */}
          <div className="mb-4 sm:mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 sm:gap-3">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-300 flex-1 min-h-[60px] ${
                    activeTab === item.id
                      ? darkMode
                        ? "bg-red-600 text-white shadow-lg shadow-red-500/50"
                        : "bg-red-600 text-white shadow-lg shadow-red-500/30"
                      : darkMode
                      ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 active:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  }`}>
                  {/* Mobile: Icon + Badge */}
                  <div className="flex sm:hidden flex-col items-center justify-center gap-1">
                    <span className="text-2xl">{item.icon}</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        activeTab === item.id
                          ? darkMode
                            ? "bg-red-700"
                            : "bg-red-700"
                          : darkMode
                          ? "bg-gray-700"
                          : "bg-gray-100"
                      }`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Desktop: Icon + Text */}
                  <div className="hidden sm:flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{item.title}</div>
                      <div
                        className={`text-xs ${
                          activeTab === item.id
                            ? "text-red-100"
                            : darkMode
                            ? "text-gray-500"
                            : "text-gray-500"
                        }`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {activeTab === item.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-b-xl"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* TAB CONTENT */}
          <div
            className={`rounded-xl border shadow-lg p-3 sm:p-4 md:p-6 min-h-[400px] sm:min-h-[500px] ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}>
            <div className="animate-fadeIn">
              {/* TAB 1: INPUT PRESENSI */}
              {activeTab === "input" && (
                <Attendance
                  currentUser={fullUserData}
                  onShowToast={showToast}
                  darkMode={darkMode}
                  selectedSemester={selectedSemester}
                  availableSemesters={availableSemesters}
                  activeSemesterInfo={activeSemesterInfo}
                />
              )}

              {/* TAB 2: PREVIEW PRESENSI - FIXED! */}
              {activeTab === "preview" && (
                <div className="space-y-4">
                  {/* Selector Kelas */}
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                      Pilih Kelas untuk Preview
                    </label>
                    <select
                      value={previewClass}
                      onChange={(e) => setPreviewClass(e.target.value)}
                      disabled={
                        fullUserData?.role === "guru_kelas" &&
                        fullUserData?.kelas
                      }
                      className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        fullUserData?.role === "guru_kelas" &&
                        fullUserData?.kelas
                          ? darkMode
                            ? "bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                          : darkMode
                          ? "bg-gray-700 border-gray-600 text-white focus:border-red-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-red-500"
                      }`}>
                      <option value="">Pilih Kelas</option>
                      {[1, 2, 3, 4, 5, 6].map((kelas) => (
                        <option key={kelas} value={kelas}>
                          Kelas {kelas}
                        </option>
                      ))}
                    </select>
                    {fullUserData?.role === "guru_kelas" &&
                      fullUserData?.kelas && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          🔒 Kelas otomatis sesuai data guru
                        </p>
                      )}
                  </div>

                  {/* AttendanceModal dengan props yang benar */}
                  {previewClass ? (
                    <AttendanceModal
                      show={true}
                      onClose={() => {}}
                      data={previewData}
                      title="REKAP PRESENSI"
                      subtitle={`Kelas ${previewClass}`}
                      loading={previewLoading}
                      onRefreshData={fetchPreviewData}
                      activeClass={previewClass}
                      userData={fullUserData}
                      darkMode={darkMode}
                      isMobile={false}
                      isTablet={false}
                    />
                  ) : (
                    <div
                      className={`text-center py-12 rounded-lg border-2 border-dashed ${
                        darkMode
                          ? "text-gray-400 border-gray-700 bg-gray-900/30"
                          : "text-gray-500 border-gray-300 bg-gray-50"
                      }`}>
                      <div className="text-5xl mb-3">👆</div>
                      <p className="font-medium">
                        Pilih kelas untuk melihat preview presensi
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EXPORT EXCEL */}
              {activeTab === "export" && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-4">
                    {/* PILIH SEMESTER */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                        1. Pilih Semester
                      </label>
                      <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white focus:border-red-500"
                            : "bg-white border-gray-300 text-gray-900 focus:border-red-500"
                        }`}>
                        <option value="">Pilih Semester</option>
                        {availableSemesters.map((sem) => (
                          <option key={sem.id} value={sem.id}>
                            {sem.year} - Semester{" "}
                            {sem.semester === 1 ? "Ganjil" : "Genap"}
                            {sem.is_active ? " (Aktif)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* PILIH KELAS */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                        2. Pilih Kelas
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        disabled={fullUserData?.role === "guru_kelas"}
                        className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                          fullUserData?.role === "guru_kelas"
                            ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-75"
                            : darkMode
                            ? "bg-gray-700 border-gray-600 text-white focus:border-red-500"
                            : "bg-white border-gray-300 text-gray-900 focus:border-red-500"
                        }`}>
                        <option value="">Pilih Kelas</option>
                        {[1, 2, 3, 4, 5, 6].map((kelas) => (
                          <option key={kelas} value={kelas}>
                            Kelas {kelas}
                          </option>
                        ))}
                      </select>
                      {fullUserData?.role === "guru_kelas" && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          🔒 Kelas otomatis sesuai data guru
                        </p>
                      )}
                    </div>

                    {/* PILIH JENIS EXPORT */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                        3. Pilih Jenis Export
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setExportType("bulanan")}
                          className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
                            exportType === "bulanan"
                              ? darkMode
                                ? "bg-red-600 border-red-500 text-white shadow-lg"
                                : "bg-red-500 border-red-400 text-white shadow-lg"
                              : darkMode
                              ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-red-600"
                              : "bg-white border-gray-300 text-gray-700 hover:border-red-400"
                          }`}>
                          📅 Export Bulanan
                        </button>
                        <button
                          onClick={() => setExportType("semester")}
                          className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
                            exportType === "semester"
                              ? darkMode
                                ? "bg-red-600 border-red-500 text-white shadow-lg"
                                : "bg-red-500 border-red-400 text-white shadow-lg"
                              : darkMode
                              ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-red-600"
                              : "bg-white border-gray-300 text-gray-700 hover:border-red-400"
                          }`}>
                          📚 Export Semester
                        </button>
                      </div>
                    </div>

                    {/* PILIH BULAN (jika bulanan) */}
                    {exportType === "bulanan" && (
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}>
                          4. Pilih Bulan
                        </label>
                        <select
                          value={selectedMonth}
                          onChange={(e) =>
                            setSelectedMonth(parseInt(e.target.value))
                          }
                          className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white focus:border-red-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-red-500"
                          }`}>
                          {months.map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* BUTTON DOWNLOAD */}
                    <button
                      onClick={handleDownloadExport}
                      disabled={
                        isExporting || !selectedSemester || !selectedClass
                      }
                      className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${
                        isExporting || !selectedSemester || !selectedClass
                          ? "bg-gray-400 cursor-not-allowed"
                          : darkMode
                          ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                          : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      }`}>
                      {isExporting ? "⏳ Memproses..." : "📥 Download Excel"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMain;
