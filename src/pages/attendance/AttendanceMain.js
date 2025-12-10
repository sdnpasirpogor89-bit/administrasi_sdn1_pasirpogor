// src/components/Attendance/AttendanceMain.js

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [deviceDetected, setDeviceDetected] = useState(false);

  const { isOnline, pendingCount, isSyncing } = useSyncStatus();

  // Device detection
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const isMobileNow = width < 768;
      const isTabletNow = width >= 768 && width < 1024;

      if (isMobile !== isMobileNow || isTablet !== isTabletNow) {
        setIsMobile(isMobileNow);
        setIsTablet(isTabletNow);
      }
      setDeviceDetected(true);
    };

    checkDeviceType();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkDeviceType, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isMobile, isTablet]);

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
    isMobile,
    isTablet,
    deviceDetected,
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
    isMobile,
    isTablet,
    deviceDetected,
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

  const showCardView = useMemo(() => {
    if (!deviceDetected) return false;
    return isMobile;
  }, [isMobile, deviceDetected]);

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

  const filteredStudents = useMemo(() => {
    if (!studentsData[activeClass]) return [];
    return studentsData[activeClass].filter(
      (student) =>
        student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nisn.includes(searchTerm)
    );
  }, [studentsData, activeClass, searchTerm]);

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

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: "", type: "" });
  }, []);

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
          if (result.success) successCount++;
          else {
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

  const generateRekapData = useCallback(
    async (classNum, month, year) => {
      try {
        setRekapLoading(true);
        const students = studentsData[classNum] || [];
        if (students.length === 0) return [];
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
        if (error) throw error;
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

  const handleRekapRefresh = useCallback(
    async (params) => {
      try {
        setRekapLoading(true);
        console.log("handleRekapRefresh called with:", params);
        const mode = params?.mode || "monthly";
        if (mode === "monthly") {
          const month = params.month;
          const year = params.year;
          console.log("Fetching MONTHLY data:", { month, year });
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
          console.log("Fetching SEMESTER data:", {
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
          console.log("Date range:", { startDate, endDate });
          const students = studentsData[activeClass] || [];
          if (students.length === 0) {
            console.log("No students found for class", activeClass);
            setRekapData([]);
            return;
          }
          console.log("Fetching semester data with pagination...");
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
              console.error("Query error on page", page + 1, ":", error);
              throw error;
            }
            if (data && data.length > 0) {
              allRecords = [...allRecords, ...data];
              console.log(
                `Page ${page + 1}: ${data.length} records (Total so far: ${
                  allRecords.length
                })`
              );
              if (data.length < pageSize) hasMore = false;
              else page++;
            } else hasMore = false;
          }
          const attendanceRecords = allRecords;
          console.log(
            "Total attendance records fetched:",
            attendanceRecords.length
          );
          if (attendanceRecords.length === 0) {
            console.log("No attendance data found");
            setRekapData([]);
            return;
          }
          const uniqueDates = [
            ...new Set(attendanceRecords.map((r) => r.tanggal)),
          ];
          const totalHariEfektif = uniqueDates.length;
          console.log("Total hari efektif:", totalHariEfektif);
          console.log("Unique dates:", uniqueDates.slice(0, 5), "...");
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
            if (!recordsByDate[key]) recordsByDate[key] = record;
            else {
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
          console.log("Total records (raw):", attendanceRecords.length);
          console.log("Unique records (after dedup):", uniqueRecords.length);
          console.log(
            "Dedup removed:",
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
          console.log("Processed data:", processedData.length, "students");
          console.log("Sample student:", processedData[0]);
          setRekapData(processedData);
        }
      } catch (error) {
        console.error("Error in handleRekapRefresh:", error);
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
        } else showToast(result.message, "error");
      } catch (error) {
        console.error("Error exporting attendance:", error);
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
        } else showToast(result.message, "error");
      } catch (error) {
        console.error("Error exporting semester:", error);
        showToast(`Error mengexport semester: ${error.message}`, "error");
      } finally {
        setExportSemesterLoading(false);
      }
    },
    [activeClass, studentsData, showToast, currentUser]
  );

  const availableClasses = useMemo(() => {
    if (currentUser.role === "guru_kelas" && currentUser.kelas)
      return [currentUser.kelas];
    return [1, 2, 3, 4, 5, 6];
  }, [currentUser]);

  return {
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
    toast,
    showToast,
    hideToast,
    updateStatus,
    updateNote,
    markAllPresent,
    saveAttendance,
    showRekap,
    handleRekapRefresh,
    exportAttendance,
    exportSemester,
    availableClasses,
    getJenisPresensi,
    isOnline,
    pendingCount,
    isSyncing,
    isMobile,
    isTablet,
    deviceDetected,
  };
};

// ============================================
// RESPONSIVE & DARK MODE COMPONENTS
// ============================================

export const AttendanceLayout = ({ children, isMobile, isTablet }) => {
  return (
    <div
      className={`
      min-h-screen
      bg-gray-50 dark:bg-gray-900
      transition-colors duration-200
      ${isMobile ? "p-2" : isTablet ? "p-4" : "p-6"}
    `}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
};

export const HeaderSection = ({ title, subtitle, isMobile }) => {
  return (
    <div
      className={`
      mb-4 sm:mb-6 md:mb-8
      bg-white dark:bg-gray-800
      rounded-lg sm:rounded-xl
      shadow-sm dark:shadow-gray-900/50
      ${isMobile ? "p-3" : "p-4 sm:p-6"}
      border border-gray-200 dark:border-gray-700
    `}>
      <h1
        className={`
        font-bold
        text-gray-900 dark:text-white
        ${isMobile ? "text-lg sm:text-xl" : "text-xl sm:text-2xl md:text-3xl"}
        mb-1 sm:mb-2
      `}>
        {title}
      </h1>
      {subtitle && (
        <p
          className={`
          text-gray-600 dark:text-gray-300
          ${isMobile ? "text-xs sm:text-sm" : "text-sm sm:text-base"}
        `}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export const ClassSelector = ({
  activeClass,
  setActiveClass,
  availableClasses,
  isMobile,
  isTablet,
}) => {
  return (
    <div className="mb-4 sm:mb-6">
      <label
        className={`
        block
        text-gray-700 dark:text-gray-300
        ${isMobile ? "text-sm mb-2" : "text-base mb-3"}
        font-medium
      `}>
        Pilih Kelas:
      </label>
      <div
        className={`
        grid gap-2 sm:gap-3
        ${isMobile ? "grid-cols-3" : isTablet ? "grid-cols-4" : "grid-cols-6"}
      `}>
        {availableClasses.map((classNum) => (
          <button
            key={classNum}
            onClick={() => setActiveClass(classNum)}
            className={`
              py-2 sm:py-3
              rounded-lg sm:rounded-xl
              font-medium
              transition-all duration-200
              ${
                activeClass === classNum
                  ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
              }
              ${isMobile ? "text-sm" : "text-base"}
              min-h-[44px] sm:min-h-[48px]
            `}>
            Kelas {classNum}
          </button>
        ))}
      </div>
    </div>
  );
};

export const DatePicker = ({ date, setDate, isMobile }) => {
  return (
    <div className="mb-4 sm:mb-6">
      <label
        className={`
        block
        text-gray-700 dark:text-gray-300
        ${isMobile ? "text-sm mb-2" : "text-base mb-3"}
        font-medium
      `}>
        Tanggal Presensi:
      </label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className={`
          w-full
          ${isMobile ? "p-2.5 text-sm" : "p-3 text-base"}
          rounded-lg sm:rounded-xl
          border
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
          focus:border-blue-500 dark:focus:border-blue-400
          outline-none
          transition-all duration-200
        `}
      />
    </div>
  );
};

export const SearchBar = ({ searchTerm, setSearchTerm, isMobile }) => {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400 dark:text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari siswa (nama atau NISN)..."
          className={`
            w-full
            ${
              isMobile
                ? "pl-10 pr-4 py-2.5 text-sm"
                : "pl-12 pr-4 py-3 text-base"
            }
            rounded-lg sm:rounded-xl
            border
            bg-white dark:bg-gray-800
            border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            focus:border-blue-500 dark:focus:border-blue-400
            outline-none
            transition-all duration-200
          `}
        />
      </div>
    </div>
  );
};

export const SummaryCards = ({ summary, isMobile }) => {
  const statusConfig = {
    Hadir: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-800 dark:text-green-300",
      border: "border-green-200 dark:border-green-800",
    },
    Sakit: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-800 dark:text-yellow-300",
      border: "border-yellow-200 dark:border-yellow-800",
    },
    Izin: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-800 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800",
    },
    Alpa: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-800 dark:text-red-300",
      border: "border-red-200 dark:border-red-800",
    },
  };

  return (
    <div
      className={`
      grid gap-3 sm:gap-4 mb-4 sm:mb-6
      ${isMobile ? "grid-cols-2" : "grid-cols-4"}
    `}>
      {Object.entries(summary).map(([status, count]) => (
        <div
          key={status}
          className={`
            ${statusConfig[status].bg}
            ${statusConfig[status].border}
            rounded-lg sm:rounded-xl
            border
            p-3 sm:p-4
            transition-all duration-200
            hover:shadow-md
          `}>
          <div
            className={`
            font-semibold
            ${statusConfig[status].text}
            ${isMobile ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}
            mb-1
          `}>
            {count}
          </div>
          <div
            className={`
            ${statusConfig[status].text}
            ${isMobile ? "text-xs sm:text-sm" : "text-sm"}
            font-medium
          `}>
            {status}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ActionButtons = ({
  onMarkAllPresent,
  onSave,
  onShowRekap,
  saving,
  isMobile,
  isOnline,
  pendingCount,
}) => {
  return (
    <div
      className={`
      flex flex-wrap gap-2 sm:gap-3
      mb-4 sm:mb-6
      ${isMobile ? "flex-col" : "flex-row"}
    `}>
      <button
        onClick={onMarkAllPresent}
        disabled={saving}
        className={`
          flex-1
          ${isMobile ? "min-h-[44px]" : "min-h-[48px]"}
          px-4 py-2.5 sm:py-3
          rounded-lg sm:rounded-xl
          bg-yellow-500 hover:bg-yellow-600
          dark:bg-yellow-600 dark:hover:bg-yellow-700
          text-white
          font-medium
          ${isMobile ? "text-sm" : "text-base"}
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
        `}>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        Tandai Semua Hadir
      </button>

      <button
        onClick={onSave}
        disabled={saving}
        className={`
          flex-1
          ${isMobile ? "min-h-[44px]" : "min-h-[48px]"}
          px-4 py-2.5 sm:py-3
          rounded-lg sm:rounded-xl
          bg-blue-600 hover:bg-blue-700
          dark:bg-blue-500 dark:hover:bg-blue-600
          text-white
          font-medium
          ${isMobile ? "text-sm" : "text-base"}
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
        `}>
        {saving ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Menyimpan...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Simpan Presensi
          </>
        )}
      </button>

      <button
        onClick={onShowRekap}
        className={`
          flex-1
          ${isMobile ? "min-h-[44px]" : "min-h-[48px]"}
          px-4 py-2.5 sm:py-3
          rounded-lg sm:rounded-xl
          bg-green-600 hover:bg-green-700
          dark:bg-green-500 dark:hover:bg-green-600
          text-white
          font-medium
          ${isMobile ? "text-sm" : "text-base"}
          transition-all duration-200
          flex items-center justify-center gap-2
        `}>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Lihat Rekap
      </button>

      {!isOnline && pendingCount > 0 && (
        <div
          className={`
          w-full
          ${isMobile ? "p-2.5 text-sm" : "p-3 text-base"}
          rounded-lg sm:rounded-xl
          bg-yellow-100 dark:bg-yellow-900/30
          text-yellow-800 dark:text-yellow-300
          border border-yellow-200 dark:border-yellow-800
          flex items-center justify-center gap-2
        `}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          {pendingCount} data offline menunggu sinkronisasi
        </div>
      )}
    </div>
  );
};

export const StudentCard = ({
  student,
  index,
  attendance,
  onUpdateStatus,
  onUpdateNote,
  isMobile,
}) => {
  const statusOptions = ["Hadir", "Sakit", "Izin", "Alpa"];
  const statusColors = {
    Hadir:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
    Sakit:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    Izin: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Alpa: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800",
  };

  return (
    <div
      className={`
      bg-white dark:bg-gray-800
      rounded-lg sm:rounded-xl
      border border-gray-200 dark:border-gray-700
      ${isMobile ? "p-3 mb-3" : "p-4 mb-4"}
      shadow-sm dark:shadow-gray-900/30
      transition-all duration-200
      hover:shadow-md dark:hover:shadow-gray-900/50
    `}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Student Info */}
        <div className="flex-1">
          <div className="flex items-start gap-2 sm:gap-3">
            <div
              className={`
              flex-shrink-0
              ${isMobile ? "w-8 h-8" : "w-10 h-10"}
              rounded-full
              bg-blue-100 dark:bg-blue-900/30
              flex items-center justify-center
            `}>
              <span
                className={`
                font-semibold
                text-blue-600 dark:text-blue-400
                ${isMobile ? "text-sm" : "text-base"}
              `}>
                {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={`
                font-semibold
                text-gray-900 dark:text-white
                ${isMobile ? "text-sm sm:text-base" : "text-base"}
                mb-0.5 sm:mb-1
                truncate
              `}>
                {student.nama_siswa}
              </h3>
              <p
                className={`
                text-gray-600 dark:text-gray-400
                ${isMobile ? "text-xs" : "text-sm"}
                font-mono
              `}>
                NISN: {student.nisn}
              </p>
            </div>
          </div>
        </div>

        {/* Status Selector */}
        <div
          className={`
          ${isMobile ? "w-full" : "w-auto"}
        `}>
          <div
            className={`
            grid grid-cols-4 gap-1 sm:gap-2
            ${isMobile ? "mb-3" : ""}
          `}>
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => onUpdateStatus(student.kelas, index, status)}
                className={`
                  ${isMobile ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"}
                  rounded-lg
                  font-medium
                  transition-all duration-200
                  ${
                    attendance?.status === status
                      ? statusColors[status] + " font-semibold shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }
                  min-h-[36px] sm:min-h-[40px]
                  flex items-center justify-center
                `}>
                {isMobile ? status.charAt(0) : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Note Input */}
      <div className="mt-3 sm:mt-4">
        <textarea
          value={attendance?.note || ""}
          onChange={(e) => onUpdateNote(student.kelas, index, e.target.value)}
          placeholder="Keterangan (opsional)..."
          rows={2}
          className={`
            w-full
            ${isMobile ? "p-2.5 text-sm" : "p-3 text-base"}
            rounded-lg
            border
            bg-gray-50 dark:bg-gray-900
            border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            focus:border-blue-500 dark:focus:border-blue-400
            outline-none
            resize-none
            transition-all duration-200
          `}
        />
      </div>

      {/* Current Status Badge */}
      <div className="mt-2 flex justify-end">
        <span
          className={`
          ${statusColors[attendance?.status || "Hadir"]}
          ${isMobile ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}
          rounded-full
          font-medium
        `}>
          Status: {attendance?.status || "Hadir"}
        </span>
      </div>
    </div>
  );
};

export const LoadingSpinner = ({ isMobile }) => {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div
          className={`
          animate-spin rounded-full
          border-4 border-blue-600 dark:border-blue-500
          border-t-transparent
          ${isMobile ? "w-12 h-12" : "w-16 h-16"}
          mx-auto mb-4
        `}
        />
        <p
          className={`
          text-gray-700 dark:text-gray-300
          ${isMobile ? "text-sm" : "text-base"}
        `}>
          Memuat data siswa...
        </p>
      </div>
    </div>
  );
};

export const NoStudentsMessage = ({ isMobile }) => {
  return (
    <div className="text-center py-8 sm:py-12">
      <div
        className={`
        mx-auto mb-4
        ${isMobile ? "w-16 h-16" : "w-20 h-20"}
        text-gray-400 dark:text-gray-600
      `}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      </div>
      <h3
        className={`
        font-semibold
        text-gray-700 dark:text-gray-300
        ${isMobile ? "text-lg mb-2" : "text-xl mb-3"}
      `}>
        Tidak ada siswa ditemukan
      </h3>
      <p
        className={`
        text-gray-600 dark:text-gray-400
        ${isMobile ? "text-sm" : "text-base"}
      `}>
        Tidak ada data siswa untuk kelas ini atau filter pencarian tidak cocok.
      </p>
    </div>
  );
};

export const Toast = ({ toast, onHide }) => {
  if (!toast.show) return null;

  const toastConfig = {
    success: {
      bg: "bg-green-50 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-800 dark:text-green-300",
      icon: "✅",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-300",
      icon: "❌",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/30",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-800 dark:text-yellow-300",
      icon: "⚠️",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-300",
      icon: "ℹ️",
    },
    offline: {
      bg: "bg-gray-100 dark:bg-gray-800",
      border: "border-gray-300 dark:border-gray-700",
      text: "text-gray-800 dark:text-gray-300",
      icon: "📴",
    },
  };

  const config = toastConfig[toast.type] || toastConfig.success;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-fade-in-down">
      <div
        className={`
        ${config.bg}
        ${config.border}
        rounded-lg sm:rounded-xl
        border
        p-4
        shadow-lg dark:shadow-gray-900/50
        flex items-start gap-3
      `}>
        <span className="text-lg flex-shrink-0">{config.icon}</span>
        <div className="flex-1">
          <p className={`${config.text} text-sm sm:text-base`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={onHide}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const ConfirmationModal = ({
  show,
  message,
  onConfirm,
  onCancel,
  isMobile,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 animate-fade-in">
      <div
        className={`
        bg-white dark:bg-gray-800
        rounded-lg sm:rounded-xl
        shadow-xl dark:shadow-gray-900/50
        w-full max-w-md
        ${isMobile ? "p-4" : "p-6"}
        animate-scale-in
      `}>
        <div className="mb-4">
          <h3
            className={`
            font-semibold
            text-gray-900 dark:text-white
            ${isMobile ? "text-lg mb-2" : "text-xl mb-3"}
          `}>
            Konfirmasi
          </h3>
          <p
            className={`
            text-gray-700 dark:text-gray-300
            ${isMobile ? "text-sm" : "text-base"}
          `}>
            {message}
          </p>
        </div>
        <div
          className={`
          flex gap-2 sm:gap-3
          ${isMobile ? "flex-col" : "flex-row justify-end"}
        `}>
          <button
            onClick={onCancel}
            className={`
              flex-1
              ${isMobile ? "min-h-[44px]" : "min-h-[48px]"}
              px-4 py-2.5
              rounded-lg
              bg-gray-200 hover:bg-gray-300
              dark:bg-gray-700 dark:hover:bg-gray-600
              text-gray-800 dark:text-white
              font-medium
              ${isMobile ? "text-sm" : "text-base"}
              transition-all duration-200
            `}>
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`
              flex-1
              ${isMobile ? "min-h-[44px]" : "min-h-[48px]"}
              px-4 py-2.5
              rounded-lg
              bg-blue-600 hover:bg-blue-700
              dark:bg-blue-500 dark:hover:bg-blue-600
              text-white
              font-medium
              ${isMobile ? "text-sm" : "text-base"}
              transition-all duration-200
            `}>
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AttendanceMain = ({ currentUser }) => {
  const {
    // State
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

    // Modal states
    showModal,
    setShowModal,
    modalMessage,
    modalAction,

    // Toast
    toast,
    hideToast,

    // Handlers
    updateStatus,
    updateNote,
    markAllPresent,
    saveAttendance,
    showRekap,

    // User info
    availableClasses,

    // Sync status
    isOnline,
    pendingCount,

    // Device info
    isMobile,
    isTablet,
    deviceDetected,
  } = useAttendanceLogic(currentUser);

  // Wait for device detection
  if (!deviceDetected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 dark:border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (modalAction) modalAction();
    setShowModal(false);
  };

  return (
    <>
      <AttendanceLayout isMobile={isMobile} isTablet={isTablet}>
        <HeaderSection
          title="Presensi Siswa"
          subtitle="Input dan kelola kehadiran siswa harian"
          isMobile={isMobile}
        />

        <ClassSelector
          activeClass={activeClass}
          setActiveClass={setActiveClass}
          availableClasses={availableClasses}
          isMobile={isMobile}
          isTablet={isTablet}
        />

        <DatePicker
          date={attendanceDate}
          setDate={setAttendanceDate}
          isMobile={isMobile}
        />

        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isMobile={isMobile}
        />

        <SummaryCards summary={summary} isMobile={isMobile} />

        <ActionButtons
          onMarkAllPresent={markAllPresent}
          onSave={saveAttendance}
          onShowRekap={showRekap}
          saving={saving}
          isMobile={isMobile}
          isOnline={isOnline}
          pendingCount={pendingCount}
        />

        {loading ? (
          <LoadingSpinner isMobile={isMobile} />
        ) : filteredStudents.length === 0 ? (
          <NoStudentsMessage isMobile={isMobile} />
        ) : (
          <div>
            <div
              className={`
              mb-3 sm:mb-4
              text-gray-700 dark:text-gray-300
              ${isMobile ? "text-sm" : "text-base"}
            `}>
              Menampilkan {filteredStudents.length} siswa
            </div>

            <div
              className={
                showCardView
                  ? "space-y-3"
                  : "grid grid-cols-1 lg:grid-cols-2 gap-4"
              }>
              {filteredStudents.map((student, index) => (
                <StudentCard
                  key={student.nisn}
                  student={student}
                  index={index}
                  attendance={student.attendance}
                  onUpdateStatus={updateStatus}
                  onUpdateNote={updateNote}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        )}
      </AttendanceLayout>

      <Toast toast={toast} onHide={hideToast} />

      <ConfirmationModal
        show={showModal}
        message={modalMessage}
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
        isMobile={isMobile}
      />
    </>
  );
};

export default AttendanceMain;
