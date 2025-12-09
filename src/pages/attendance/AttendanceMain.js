// src/components/Attendance/AttendanceMain.js
// LOGIC & STATE MANAGEMENT FOR ATTENDANCE SYSTEM

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import {
  exportAttendanceFromComponent,
  exportSemesterRecapFromComponent,
} from "./AttendanceExport";
import { getSemesterData } from "../../services/semesterService";
import { saveWithSync, syncPendingData } from "../../offlineSync";
import { useSyncStatus } from "../../hooks/useSyncStatus";

// ============================================
// CUSTOM HOOK FOR ATTENDANCE LOGIC
// ============================================
export const useAttendance = (currentUser) => {
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

// ============================================
// MAIN ATTENDANCE LOGIC HOOK
// ============================================
export const useAttendanceLogic = (
  currentUser = {
    role: "admin",
    kelas: null,
    username: "admin",
  }
) => {
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
  const [isTablet, setIsTablet] = useState(false);

  // Auto-sync when online
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

  // Device detection
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDeviceType();
    window.addEventListener("resize", checkDeviceType);
    return () => window.removeEventListener("resize", checkDeviceType);
  }, []);

  const showCardView = isMobile;

  const getJenisPresensi = useCallback(() => {
    return currentUser.role === "guru_kelas" ? "kelas" : "mapel";
  }, [currentUser.role]);

  // Initialize date
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

  // Load students data
  useEffect(() => {
    loadStudentsData().catch((error) => {
      showToast(`Error memuat data siswa: ${error.message}`, "error");
    });
  }, [loadStudentsData]);

  // Set active class based on user role
  useEffect(() => {
    if (currentUser.role === "guru_kelas" && currentUser.kelas) {
      setActiveClass(currentUser.kelas);
    }
  }, [currentUser]);

  // Load attendance for selected date and class
  useEffect(() => {
    if (attendanceDate && studentsData[activeClass]?.length > 0) {
      loadAttendanceForDate(attendanceDate, activeClass).catch((error) => {
        showToast(`Error memuat data presensi: ${error.message}`, "error");
      });
    }
  }, [attendanceDate, activeClass, loadAttendanceForDate, studentsData]);

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!studentsData[activeClass]) return [];

    return studentsData[activeClass].filter(
      (student) =>
        student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nisn.includes(searchTerm)
    );
  }, [studentsData, activeClass, searchTerm]);

  // Calculate attendance summary
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

  // Toast utilities
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: "", type: "" });
  }, []);

  // Class access control
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

  // Update student status
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

  // Update student note
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

  // Check if attendance already exists for date
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

  // Save attendance data to database
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
          try {
            const { error: deleteError } = await supabase
              .from("attendance")
              .delete()
              .eq("tanggal", date)
              .eq("kelas", classNum)
              .eq("guru_input", currentUser.username);

            if (deleteError) {
              console.warn("Warning delete old data:", deleteError);
            }
          } catch (err) {
            console.warn("Warning delete old data:", err);
          }
        }

        const attendanceRecords = Object.values(attendanceData[classNum]);
        let successCount = 0;
        let errorCount = 0;

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

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error("Failed to save:", student.name, result.error);
          }
        }

        const jenisText =
          getJenisPresensi() === "kelas" ? "Kelas" : "Mata Pelajaran";

        if (errorCount === 0) {
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
        } else {
          showToast(
            `⚠️ ${successCount} berhasil, ${errorCount} gagal disimpan`,
            "error"
          );
        }

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
      isOnline,
    ]
  );

  // Mark all students as present
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

  // Save attendance with confirmation modal
  const saveAttendance = useCallback(async () => {
    if (!checkClassAccess(activeClass) || saving) return;

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

  // Generate rekap data for a specific month
  const generateRekapData = useCallback(
    async (classNum, month, year) => {
      try {
        setRekapLoading(true);

        const students = studentsData[classNum] || [];

        if (students.length === 0) {
          return [];
        }

        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
          lastDayOfMonth
        ).padStart(2, "0")}`;

        const { data: attendanceRecords, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("kelas", classNum)
          .eq("guru_input", currentUser.username)
          .gte("tanggal", startDate)
          .lte("tanggal", endDate)
          .order("tanggal", { ascending: true });

        if (error) {
          throw error;
        }

        const rekapData = students.map((student) => {
          const studentRecords = attendanceRecords.filter(
            (record) => record.nisn === student.nisn
          );

          const dailyStatus = {};
          studentRecords.forEach((record) => {
            dailyStatus[record.tanggal] = record.status.toLowerCase();
          });

          const counts = {
            hadir: studentRecords.filter((r) => r.status === "Hadir").length,
            sakit: studentRecords.filter((r) => r.status === "Sakit").length,
            izin: studentRecords.filter((r) => r.status === "Izin").length,
            alpa: studentRecords.filter((r) => r.status === "Alpa").length,
          };

          const totalDays = studentRecords.length;
          const percentage =
            totalDays > 0 ? Math.round((counts.hadir / totalDays) * 100) : 100;

          return {
            nisn: student.nisn,
            name: student.nama_siswa,
            nama_siswa: student.nama_siswa,
            dailyStatus: dailyStatus,
            hadir: counts.hadir,
            sakit: counts.sakit,
            izin: counts.izin,
            alpa: counts.alpa,
            total: totalDays,
            percentage: percentage,
          };
        });

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

  // Handle rekap refresh (monthly or semester)
  const handleRekapRefresh = useCallback(
    async (params) => {
      try {
        setRekapLoading(true);

        console.log("🔥 handleRekapRefresh called with:", params);

        const mode = params?.mode || "monthly";

        if (mode === "monthly") {
          const month = params.month;
          const year = params.year;

          console.log("📅 Fetching MONTHLY data:", { month, year });

          const rekapData = await generateRekapData(
            activeClass,
            month.toString(),
            year.toString()
          );

          setRekapData(rekapData);
        } else if (mode === "semester") {
          const semester = params.semester;
          const academicYear = params.academicYear;
          const year = params.year;

          console.log("📊 Fetching SEMESTER data:", {
            semester,
            academicYear,
            year,
          });

          const [startYear, endYear] = academicYear.split("/").map(Number);
          let startDate, endDate;

          if (semester === "Ganjil") {
            startDate = `${startYear}-07-01`;
            endDate = `${startYear}-12-31`;
          } else {
            startDate = `${endYear}-01-01`;
            endDate = `${endYear}-06-30`;
          }

          console.log("📅 Date range:", { startDate, endDate });

          const students = studentsData[activeClass] || [];

          if (students.length === 0) {
            console.log("⚠️ No students found for class", activeClass);
            setRekapData([]);
            return;
          }

          console.log("🔍 Fetching semester data with pagination...");

          let allRecords = [];
          let page = 0;
          const pageSize = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data, error } = await supabase
              .from("attendance")
              .select("*")
              .eq("kelas", activeClass)
              .gte("tanggal", startDate)
              .lte("tanggal", endDate)
              .order("tanggal", { ascending: true })
              .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
              console.error("❌ Query error on page", page + 1, ":", error);
              throw error;
            }

            if (data && data.length > 0) {
              allRecords = [...allRecords, ...data];
              console.log(
                `📄 Page ${page + 1}: ${data.length} records (Total so far: ${
                  allRecords.length
                })`
              );

              if (data.length < pageSize) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              hasMore = false;
            }
          }

          const attendanceRecords = allRecords;
          console.log(
            "✅ Total attendance records fetched:",
            attendanceRecords.length
          );

          if (attendanceRecords.length === 0) {
            console.log("⚠️ No attendance data found");
            setRekapData([]);
            return;
          }

          const uniqueDates = [
            ...new Set(attendanceRecords.map((r) => r.tanggal)),
          ];
          const totalHariEfektif = uniqueDates.length;

          console.log("📊 Total hari efektif:", totalHariEfektif);
          console.log("📅 Unique dates:", uniqueDates.slice(0, 5), "...");

          const grouped = {};
          students.forEach((student) => {
            grouped[student.nisn] = {
              nisn: student.nisn,
              nama_siswa: student.nama_siswa,
              name: student.nama_siswa,
              hadir: 0,
              sakit: 0,
              izin: 0,
              alpa: 0,
              dailyStatus: {},
            };
          });

          const recordsByDate = {};

          attendanceRecords.forEach((record) => {
            const key = `${record.nisn}_${record.tanggal}`;

            if (!recordsByDate[key]) {
              recordsByDate[key] = record;
            } else {
              const existing = recordsByDate[key];

              if (
                record.jenis_presensi === "kelas" &&
                existing.jenis_presensi === "mapel"
              ) {
                recordsByDate[key] = record;
              } else if (record.jenis_presensi === existing.jenis_presensi) {
                recordsByDate[key] = record;
              }
            }
          });

          const uniqueRecords = Object.values(recordsByDate);

          console.log("📊 Total records (raw):", attendanceRecords.length);
          console.log("✅ Unique records (after dedup):", uniqueRecords.length);
          console.log(
            "🔍 Dedup removed:",
            attendanceRecords.length - uniqueRecords.length,
            "duplicates"
          );

          uniqueRecords.forEach((record) => {
            if (grouped[record.nisn]) {
              const status = record.status.toLowerCase();

              if (status === "hadir") grouped[record.nisn].hadir++;
              else if (status === "sakit") grouped[record.nisn].sakit++;
              else if (status === "izin") grouped[record.nisn].izin++;
              else if (status === "alpa") grouped[record.nisn].alpa++;

              grouped[record.nisn].dailyStatus[record.tanggal] = status;
            }
          });

          const processedData = Object.values(grouped).map((student) => {
            const totalRecords =
              student.hadir + student.sakit + student.izin + student.alpa;

            const percentage =
              totalHariEfektif > 0
                ? Math.round((student.hadir / totalHariEfektif) * 100)
                : 0;

            return {
              ...student,
              total: totalHariEfektif,
              totalRecords: totalRecords,
              percentage,
            };
          });

          console.log("✅ Processed data:", processedData.length, "students");
          console.log("📊 Sample student:", processedData[0]);

          setRekapData(processedData);
        }
      } catch (error) {
        console.error("❌ Error in handleRekapRefresh:", error);
        showToast(`Error memuat rekap: ${error.message}`, "error");
        setRekapData([]);
      } finally {
        setRekapLoading(false);
      }
    },
    [
      activeClass,
      generateRekapData,
      studentsData,
      showToast,
      currentUser.username,
    ]
  );

  // Export attendance to Excel
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
        console.error("Error exporting attendance:", error);
        showToast(`Error mengexport data: ${error.message}`, "error");
      } finally {
        setExportLoading(false);
      }
    },
    [activeClass, studentsData, showToast, currentUser]
  );

  // Export semester recap
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
        console.error("Error exporting semester:", error);
        showToast(`Error mengexport semester: ${error.message}`, "error");
      } finally {
        setExportSemesterLoading(false);
      }
    },
    [activeClass, studentsData, showToast, currentUser]
  );

  // Available classes based on user role
  const availableClasses = useMemo(() => {
    if (currentUser.role === "guru_kelas" && currentUser.kelas) {
      return [currentUser.kelas];
    }
    return [1, 2, 3, 4, 5, 6];
  }, [currentUser]);

  return {
    // State
    studentsData,
    attendanceData,
    loading,
    saving,
    attendanceDate,
    setAttendanceDate,
    activeClass,
    setActiveClass,
    searchTerm,
    setSearchTerm,
    showCardView,
    filteredStudents,
    summary,

    // Modals state
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
    showToast,
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

    // User info
    availableClasses,
    getJenisPresensi,

    // Sync status
    isOnline,
    pendingCount,
    isSyncing,
  };
};
