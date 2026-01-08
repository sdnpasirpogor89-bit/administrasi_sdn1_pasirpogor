import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  Save,
  Users,
  BookOpen,
  Calculator,
  GraduationCap,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader,
  Search,
  WifiOff,
  Calendar,
} from "lucide-react";
import { ImportModal, exportToExcel } from "./GradeExport";
import {
  saveWithSync,
  syncPendingData,
  getDataWithFallback,
} from "../../offlineSync";
import { useSyncStatus } from "../../hooks/useSyncStatus";
import SyncStatusBadge from "../../components/SyncStatusBadge";
import { useGradeAutoSave } from "../../hooks/useGradeAutoSave";
// ✅ IMPORT ACADEMIC YEAR SERVICE
import {
  getActiveAcademicInfo,
  getAllSemestersInActiveYear,
  getSemesterById,
} from "../../services/academicYearService";

const Grade = ({ userData: initialUserData }) => {
  // ===== PWA: Sync Status Hook =====
  const { isOnline, pendingCount, isSyncing } = useSyncStatus();

  // ===== PWA: Auto-sync saat online =====
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

  // States
  const [userData, setUserData] = useState(initialUserData);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(""); // ✅ SEMESTER STATE
  const [availableSemesters, setAvailableSemesters] = useState([]); // ✅ SEMESTER OPTIONS
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  // ===== AUTO-SAVE HOOK =====
  const { hasDraft, draftInfo, lastSaved, saveDraft, loadDraft, clearDraft } =
    useGradeAutoSave(selectedClass, selectedSubject);

  const [showDraftModal, setShowDraftModal] = useState(false);

  // Assignment types untuk SD - HANYA 3 NH
  const assignmentTypes = ["NH1", "NH2", "NH3", "UTS", "UAS"];
  const assignmentLabels = {
    NH1: "NH1",
    NH2: "NH2",
    NH3: "NH3",
    UTS: "UTS",
    UAS: "UAS",
  };

  // Mata pelajaran
  const mataPelajaran = {
    guru_kelas: [
      "Bahasa Indonesia",
      "Bahasa Inggris",
      "Bahasa Sunda",
      "Matematika",
      "IPAS",
      "Pendidikan Pancasila",
      "Seni Budaya",
    ],
    guru_mapel: {
      acengmudrikah: ["PABP"],
      yosefedi: ["PJOK"],
    },
  };

  // ✅ FETCH ACTIVE SEMESTER ON MOUNT
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

        // Auto-set semester aktif
        if (academicInfo.activeSemesterId) {
          setSelectedSemester(academicInfo.activeSemesterId);
        }
      } catch (error) {
        console.error("Error fetching active semester:", error);
        showMessage("Gagal memuat semester aktif", "error");
      }
    };

    fetchActiveSemester();
  }, []);

  // Fetch user data lengkap
  useEffect(() => {
    const fetchCompleteUserData = async () => {
      if (!userData?.kelas && userData?.username) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", userData.username)
            .single();

          if (error) throw error;

          if (data) {
            const completeUserData = {
              ...userData,
              ...data,
              name: data.full_name || userData.name,
            };
            setUserData(completeUserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchCompleteUserData();
  }, [userData?.username]);

  // Auto-set kelas untuk guru_kelas
  useEffect(() => {
    if (userData?.role === "guru_kelas" && userData?.kelas && !selectedClass) {
      setSelectedClass(String(userData.kelas));
    }
  }, [userData?.role, userData?.kelas]);

  // Helper functions
  const getAvailableClasses = () => {
    if (userData.role === "admin") {
      return ["1", "2", "3", "4", "5", "6"];
    } else if (userData.role === "guru_kelas") {
      return [String(userData.kelas)];
    } else if (userData.role === "guru_mapel") {
      return ["1", "2", "3", "4", "5", "6"];
    }
    return [];
  };

  const getAvailableSubjects = () => {
    if (userData.role === "admin") {
      return [...mataPelajaran.guru_kelas, "PABP", "PJOK"];
    } else if (userData.role === "guru_kelas") {
      return mataPelajaran.guru_kelas;
    } else if (userData.role === "guru_mapel") {
      return mataPelajaran.guru_mapel[userData.username] || [];
    }
    return [];
  };

  const checkAccess = (kelas, mapel) => {
    if (userData.role === "admin") return true;

    if (userData.role === "guru_kelas") {
      const userKelas = String(userData.kelas);
      const selectedKelas = String(kelas);
      const hasClassAccess = userKelas === selectedKelas;
      const hasSubjectAccess = mataPelajaran.guru_kelas.includes(mapel);

      return hasClassAccess && hasSubjectAccess;
    }

    if (userData.role === "guru_mapel") {
      const allowedMapel = mataPelajaran.guru_mapel[userData.username] || [];
      return allowedMapel.includes(mapel);
    }

    return false;
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  // ===== ✅ UPDATED: Load grades dengan semester filter =====
  const loadAllGrades = async () => {
    if (!selectedClass || !selectedSubject || !selectedSemester) {
      showMessage(
        "Pilih semester, kelas, dan mata pelajaran terlebih dahulu!",
        "error"
      );
      return;
    }

    if (!checkAccess(selectedClass, selectedSubject)) {
      showMessage(
        "Anda Tidak Memiliki Akses Untuk Kelas dan Mata Pelajaran Pada Kelas ini!",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Get semester info
      const semesterData = await getSemesterById(selectedSemester);
      if (!semesterData) {
        showMessage("Semester tidak ditemukan!", "error");
        setLoading(false);
        return;
      }

      console.log(
        "📅 Loading data for semester:",
        semesterData.semester,
        semesterData.year
      );

      // 2. Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("nisn, nama_siswa, kelas")
        .eq("kelas", parseInt(selectedClass))
        .eq("is_active", true)
        .order("nama_siswa");

      if (studentsError) throw studentsError;

      if (!studentsData || studentsData.length === 0) {
        showMessage("Tidak ada siswa di kelas ini", "error");
        setStudents([]);
        return;
      }

      // 3. Fetch nilai untuk semester yang dipilih
      const { data: allGrades, error: gradesError } = await supabase
        .from("nilai")
        .select("*")
        .eq("kelas", parseInt(selectedClass))
        .eq("mata_pelajaran", selectedSubject)
        .eq("semester", semesterData.semester)
        .eq("tahun_ajaran", semesterData.year);

      if (gradesError) throw gradesError;

      console.log("📊 Students loaded:", studentsData.length);
      console.log("📊 Nilai loaded:", allGrades?.length || 0);

      // 4. Process data
      const processedStudents = studentsData.map((student, index) => {
        const grades = {};
        const nhGrades = [];

        assignmentTypes.forEach((type) => {
          const grade = allGrades?.find(
            (g) => g.nisn === student.nisn && g.jenis_nilai === type
          );

          if (grade && grade.nilai !== null && grade.nilai !== undefined) {
            grades[type] = grade.nilai.toString();
            grades[`${type}_id`] = grade.id || null;

            if (type.startsWith("NH")) {
              const numValue = parseFloat(grade.nilai);
              if (!isNaN(numValue)) {
                nhGrades.push(numValue);
              }
            }
          } else {
            grades[type] = "";
            grades[`${type}_id`] = null;
          }
        });

        // Hitung NA
        let na = "";
        const utsValue = grades["UTS"] ? parseFloat(grades["UTS"]) : 0;
        const uasValue = grades["UAS"] ? parseFloat(grades["UAS"]) : 0;

        if (nhGrades.length > 0 || utsValue > 0 || uasValue > 0) {
          const avgNH =
            nhGrades.length > 0
              ? nhGrades.reduce((a, b) => a + b, 0) / nhGrades.length
              : 0;
          na = (avgNH * 0.4 + utsValue * 0.3 + uasValue * 0.3).toFixed(1);
        }

        let hasAnyGrade = false;
        for (const type of assignmentTypes) {
          if (grades[type] && grades[type] !== "") {
            hasAnyGrade = true;
            break;
          }
        }

        return {
          no: index + 1,
          nisn: student.nisn,
          nama_siswa: student.nama_siswa,
          grades: grades,
          na: na,
          hasAnyGrade: hasAnyGrade,
        };
      });

      setStudents(processedStudents);
      showMessage(
        `Data nilai ${selectedSubject} kelas ${selectedClass} berhasil dimuat!`
      );
    } catch (error) {
      console.error("Error loading all grades:", error);
      showMessage("Error memuat data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ===== FUNGSI BARU: Update grade di state =====
  const updateGrade = (nisn, type, value) => {
    if (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setStudents((prev) =>
        prev.map((student) => {
          if (student.nisn === nisn) {
            const updatedGrades = { ...student.grades, [type]: value };

            // Recalculate NA
            const nhGrades = [];
            assignmentTypes.forEach((t) => {
              if (
                t.startsWith("NH") &&
                updatedGrades[t] &&
                !isNaN(parseFloat(updatedGrades[t]))
              ) {
                nhGrades.push(parseFloat(updatedGrades[t]));
              }
            });

            const utsGrade =
              updatedGrades["UTS"] && !isNaN(parseFloat(updatedGrades["UTS"]))
                ? parseFloat(updatedGrades["UTS"])
                : 0;
            const uasGrade =
              updatedGrades["UAS"] && !isNaN(parseFloat(updatedGrades["UAS"]))
                ? parseFloat(updatedGrades["UAS"])
                : 0;

            let newNA = "";
            if (nhGrades.length > 0 || utsGrade > 0 || uasGrade > 0) {
              const avgNH =
                nhGrades.length > 0
                  ? nhGrades.reduce((a, b) => a + b, 0) / nhGrades.length
                  : 0;
              newNA = (avgNH * 0.4 + utsGrade * 0.3 + uasGrade * 0.3).toFixed(
                1
              );
            }

            let hasAnyGrade = false;
            for (const t of assignmentTypes) {
              if (updatedGrades[t] && updatedGrades[t] !== "") {
                hasAnyGrade = true;
                break;
              }
            }

            return {
              ...student,
              grades: updatedGrades,
              na: newNA,
              hasAnyGrade: hasAnyGrade,
            };
          }
          return student;
        })
      );
    }
  };

  // ===== ✅ UPDATED: Save grades dengan semester info =====
  const saveAllGrades = async () => {
    if (students.length === 0) {
      showMessage("Tidak ada data untuk disimpan!", "error");
      return;
    }

    if (!selectedSemester) {
      showMessage("Pilih semester terlebih dahulu!", "error");
      return;
    }

    // Get semester info
    const semesterData = await getSemesterById(selectedSemester);
    if (!semesterData) {
      showMessage("Semester tidak ditemukan!", "error");
      return;
    }

    console.log(
      "💾 Saving to semester:",
      semesterData.semester,
      semesterData.year
    );

    // Collect semua data yang ada nilai
    const allDataToSave = [];
    students.forEach((student) => {
      assignmentTypes.forEach((type) => {
        const nilai = student.grades[type];
        if (nilai !== "" && !isNaN(parseFloat(nilai))) {
          allDataToSave.push({
            nisn: student.nisn,
            nama_siswa: student.nama_siswa,
            kelas: parseInt(selectedClass),
            mata_pelajaran: selectedSubject,
            jenis_nilai: type,
            nilai: parseFloat(nilai),
            semester: semesterData.semester, // ✅ DARI SEMESTER DATA
            tahun_ajaran: semesterData.year, // ✅ DARI SEMESTER DATA
            guru_input: userData.name || userData.username,
            tanggal: new Date().toISOString().split("T")[0],
          });
        }
      });
    });

    if (allDataToSave.length === 0) {
      showMessage("Masukkan minimal satu nilai untuk disimpan!", "error");
      return;
    }

    // Confirmation
    if (isOnline) {
      const semesterLabel = semesterData.semester === 1 ? "Ganjil" : "Genap";
      const isConfirmed = window.confirm(
        `Apakah Anda yakin ingin menyimpan ${allDataToSave.length} nilai siswa?\n\n` +
          `Kelas: ${selectedClass}\n` +
          `Mata Pelajaran: ${selectedSubject}\n` +
          `Semester: ${semesterLabel}`
      );

      if (!isConfirmed) return;
    }

    setSaving(true);
    try {
      console.log(
        `💾 Menyimpan ${allDataToSave.length} nilai dengan BATCH UPSERT...`
      );

      const { data, error } = await supabase
        .from("nilai")
        .upsert(allDataToSave, {
          onConflict: "nisn,mata_pelajaran,jenis_nilai,semester,tahun_ajaran",
        })
        .select();

      if (error) {
        console.error("❌ Upsert error:", error);
        const syncResult = await saveWithSync("nilai", allDataToSave);
        if (syncResult.success) {
          showMessage(
            `✅ ${
              syncResult.syncedCount || allDataToSave.length
            } nilai berhasil disimpan!`,
            "success"
          );
          clearDraft();
        } else {
          showMessage("❌ Gagal menyimpan data!", "error");
        }
      } else {
        const successCount = data?.length || allDataToSave.length;
        showMessage(`✅ ${successCount} nilai berhasil disimpan!`, "success");
        clearDraft();
      }

      await loadAllGrades();
    } catch (error) {
      console.error("❌ Error saving grades:", error);
      showMessage("Error menyimpan data: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    if (students.length === 0) {
      showMessage("Tidak ada data untuk diekspor!", "error");
      return;
    }

    setExporting(true);
    try {
      await exportToExcel({
        students,
        selectedClass,
        selectedSubject,
        userData,
        showMessage,
        checkAccess,
      });
      showMessage("Data berhasil diekspor ke Excel!", "success");
    } catch (error) {
      console.error("Error exporting:", error);
      showMessage("Gagal mengekspor data: " + error.message, "error");
    } finally {
      setExporting(false);
    }
  };

  // Filter students berdasarkan search
  const filteredStudents = students.filter((student) =>
    student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Message Alert */}
        {message.text && (
          <div
            className={`p-4 rounded-lg flex items-center space-x-2 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
            }`}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Filter Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ✅ SEMESTER SELECTOR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setStudents([]); // Reset students saat ganti semester
                }}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">Pilih Semester</option>
                {availableSemesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    Semester {sem.semester === 1 ? "Ganjil" : "Genap"}
                    {sem.is_active ? " (Aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <GraduationCap className="w-4 h-4 inline mr-2" />
                Kelas
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setStudents([]);
                }}
                disabled={userData.role === "guru_kelas"}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed">
                <option value="">Pilih Kelas</option>
                {getAvailableClasses().map((kelas) => (
                  <option key={kelas} value={kelas}>
                    Kelas {kelas}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Mata Pelajaran
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setStudents([]);
                }}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">Pilih Mata Pelajaran</option>
                {getAvailableSubjects().map((mapel) => (
                  <option key={mapel} value={mapel}>
                    {mapel}
                  </option>
                ))}
              </select>
            </div>

            {/* Load Button */}
            <div className="flex items-end">
              <button
                onClick={loadAllGrades}
                disabled={
                  !selectedClass ||
                  !selectedSubject ||
                  !selectedSemester ||
                  loading
                }
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    <span>Muat Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {students.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Table Header Actions */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Cari nama siswa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Import</span>
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    {exporting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={saveAllGrades}
                    disabled={saving || students.length === 0}
                    className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    {saving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Semua</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="p-12 text-center">
                <Loader className="w-12 h-12 text-red-600 dark:text-red-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Memuat data nilai...
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Nama Siswa
                        </th>
                        {assignmentTypes.map((type) => (
                          <th
                            key={type}
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {assignmentLabels[type]}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          NA
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr
                            key={student.nisn}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {student.no}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              <div className="font-medium">
                                {student.nama_siswa}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                NISN: {student.nisn}
                              </div>
                            </td>

                            {/* Input Fields */}
                            {assignmentTypes.map((type) => (
                              <td key={type} className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={student.grades[type] || ""}
                                  onChange={(e) =>
                                    updateGrade(
                                      student.nisn,
                                      type,
                                      e.target.value
                                    )
                                  }
                                  className="w-20 p-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  placeholder="0"
                                  disabled={saving}
                                />
                              </td>
                            ))}

                            {/* Nilai Akhir */}
                            <td className="px-4 py-3">
                              <div className="text-center font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded px-3 py-2">
                                {student.na || "0.0"}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="px-4 py-8 text-center">
                            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                              {searchTerm
                                ? "Tidak ada siswa yang cocok dengan pencarian"
                                : "Tidak ada siswa di kelas ini"}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards - IMPROVED FOR SMALL SCREENS */}
                <div className="block lg:hidden">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <div
                        key={student.nisn}
                        className="border-b border-gray-100 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="mb-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-base mb-1">
                            {student.no}. {student.nama_siswa}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            NISN: {student.nisn}
                          </div>
                        </div>

                        {/* Grid input untuk mobile - 3 NH + UTS + UAS */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Row 1: NH1 & NH2 */}
                          {["NH1", "NH2"].map((type) => (
                            <div key={type} className="space-y-1">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                {assignmentLabels[type]}
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={student.grades[type] || ""}
                                onChange={(e) =>
                                  updateGrade(
                                    student.nisn,
                                    type,
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 touch-manipulation min-h-[44px]"
                                placeholder="0"
                                disabled={saving}
                              />
                            </div>
                          ))}

                          {/* Row 2: NH3 & UTS */}
                          {["NH3", "UTS"].map((type) => (
                            <div key={type} className="space-y-1">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                {assignmentLabels[type]}
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={student.grades[type] || ""}
                                onChange={(e) =>
                                  updateGrade(
                                    student.nisn,
                                    type,
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 touch-manipulation min-h-[44px]"
                                placeholder="0"
                                disabled={saving}
                              />
                            </div>
                          ))}

                          {/* Row 3: UAS & NA */}
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                              UAS
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={student.grades["UAS"] || ""}
                              onChange={(e) =>
                                updateGrade(student.nisn, "UAS", e.target.value)
                              }
                              className="w-full p-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 touch-manipulation min-h-[44px]"
                              placeholder="0"
                              disabled={saving}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Nilai Akhir (NA)
                            </label>
                            <div className="w-full p-2 text-sm text-center font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg min-h-[44px] flex items-center justify-center">
                              {student.na || "0.0"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm
                          ? "Tidak ada siswa yang cocok dengan pencarian"
                          : "Tidak ada siswa di kelas ini"}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {(!selectedClass || !selectedSubject || !selectedSemester) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
            <Calculator className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              Pilih Filter
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              Silakan pilih semester, kelas, dan mata pelajaran untuk mulai
              input nilai
            </p>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        selectedClass={selectedClass}
        selectedSubject={selectedSubject}
        selectedSemester={selectedSemester}
        userData={userData}
        onImportSuccess={() => {
          loadAllGrades();
        }}
      />
    </div>
  );
};

export default Grade;
