import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Link } from "react-router-dom";
import {
  Save,
  Users,
  BookOpen,
  Calculator,
  Eye,
  BarChart3,
  Calendar,
  GraduationCap,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader,
  Search,
  WifiOff,
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

  // Assignment types untuk SD - SEMUA SEKALIGUS
  const assignmentTypes = ["NH1", "NH2", "NH3", "NH4", "NH5", "UTS", "UAS"];
  const assignmentLabels = {
    NH1: "NH1",
    NH2: "NH2",
    NH3: "NH3",
    NH4: "NH4",
    NH5: "NH5",
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

  // ===== FUNGSI REVISI: Load SEMUA nilai sekaligus TANPA DRAFT SUPPORT =====
  const loadAllGrades = async () => {
    if (!selectedClass || !selectedSubject) {
      showMessage("Pilih kelas dan mata pelajaran terlebih dahulu!", "error");
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
      // 1. Fetch students
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

      // 2. Fetch SEMUA nilai untuk mapel ini
      const allGrades = await getDataWithFallback("nilai", (query) =>
        query
          .eq("kelas", parseInt(selectedClass))
          .eq("mata_pelajaran", selectedSubject)
      );

      console.log("📊 Students loaded:", studentsData.length);
      console.log("📊 Nilai loaded:", allGrades?.length || 0);

      // 3. Process data
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

  // ===== FUNGSI BARU: Save ALL grades =====
  const saveAllGrades = async () => {
    if (students.length === 0) {
      showMessage("Tidak ada data untuk disimpan!", "error");
      return;
    }

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
      const isConfirmed = window.confirm(
        `Apakah Anda yakin ingin menyimpan ${allDataToSave.length} nilai siswa?\n\n` +
          `Kelas: ${selectedClass}\n` +
          `Mata Pelajaran: ${selectedSubject}`
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
          onConflict: "nisn,kelas,mata_pelajaran,jenis_nilai",
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
          // ✅ HAPUS DRAFT SETELAH BERHASIL SYNC
          clearDraft();
        } else {
          showMessage("❌ Gagal menyimpan data!", "error");
        }
      } else {
        const successCount = data?.length || allDataToSave.length;
        showMessage(`✅ ${successCount} nilai berhasil disimpan!`, "success");
        // ✅ HAPUS DRAFT SETELAH BERHASIL SAVE
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

  const handleExportToExcel = async () => {
    if (students.length === 0) {
      showMessage("Tidak ada data siswa untuk diexport!", "error");
      return;
    }

    const hasAnyGrade = students.some((student) =>
      assignmentTypes.some(
        (type) =>
          student.grades[type] &&
          student.grades[type] !== "" &&
          student.grades[type] !== null
      )
    );

    if (!hasAnyGrade) {
      showMessage(
        "Data nilai masih kosong, silakan input nilai terlebih dahulu!",
        "error"
      );
      return;
    }

    setExporting(true);
    try {
      await exportToExcel({
        selectedClass,
        selectedSubject,
        userData,
        showMessage,
        checkAccess,
        students,
        assignmentTypes,
      });
    } catch (error) {
      console.error("Export error:", error);
      showMessage("Error mengekspor data: " + error.message, "error");
    } finally {
      setExporting(false);
    }
  };

  // ===== AUTO-SAVE setiap kali students berubah =====
  useEffect(() => {
    if (students.length > 0 && selectedClass && selectedSubject) {
      const timeoutId = setTimeout(() => {
        saveDraft(students);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [students, selectedClass, selectedSubject, saveDraft]);

  // Auto load ketika filter berubah
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadAllGrades();
    } else {
      setStudents([]);
    }
  }, [selectedClass, selectedSubject]);

  // Calculate stats
  const getGradeStats = () => {
    const total = students.length;
    const completed = students.filter((s) => s.hasAnyGrade === true).length;

    const naValues = students
      .filter((s) => s.na && s.na !== "" && !isNaN(parseFloat(s.na)))
      .map((s) => parseFloat(s.na));

    const average =
      naValues.length > 0
        ? (naValues.reduce((a, b) => a + b, 0) / naValues.length).toFixed(2)
        : "0.00";

    const tuntas = students.filter(
      (s) => s.na && !isNaN(parseFloat(s.na)) && parseFloat(s.na) >= 70
    ).length;

    const remedial = students.filter(
      (s) => s.na && !isNaN(parseFloat(s.na)) && parseFloat(s.na) < 70
    ).length;

    return { total, completed, average, tuntas, remedial };
  };

  const stats = getGradeStats();
  const filteredStudents = students.filter(
    (student) =>
      student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nisn.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Sync Status Badge */}
        <SyncStatusBadge />

        {/* Message */}
        {message.text && (
          <div
            className={`mb-3 sm:mb-4 p-3 rounded-lg text-sm sm:text-base ${
              message.type === "error"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800"
                : message.type === "warning" || message.type === "offline"
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800"
            }`}>
            <div className="flex items-center gap-2">
              {message.type === "error" ? (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : message.type === "warning" || message.type === "offline" ? (
                <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Header - RED THEME */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-3 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Calculator className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-400" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Input Nilai Siswa SD
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Kelola Nilai Siswa Untuk Mata Pelajaran
              </p>
            </div>
          </div>

          {/* Filters - 2 KOLOM SAJA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
            {/* Kelas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                {userData?.role === "guru_kelas" ? "Kelas Anda" : "Kelas"}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors touch-manipulation min-h-[44px]"
                disabled={userData?.role === "guru_kelas" || loading}>
                <option value="">Pilih Kelas</option>
                {getAvailableClasses().map((kelas) => (
                  <option key={kelas} value={kelas}>
                    Kelas {kelas}
                  </option>
                ))}
              </select>
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Mata Pelajaran
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors touch-manipulation min-h-[44px]"
                disabled={loading}>
                <option value="">Pilih Mata Pelajaran</option>
                {getAvailableSubjects().map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          {students.length > 0 && (
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Cari nama siswa atau NISN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base transition-colors touch-manipulation min-h-[44px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards - RED THEME */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-2.5 sm:p-3 rounded-lg">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.total}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Total Siswa
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-2.5 sm:p-3 rounded-lg">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.completed}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Sudah Dinilai
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 sm:p-3 rounded-lg">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.average}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Rata-rata NA
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabel Nilai - RED THEME */}
        {selectedClass && selectedSubject && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Daftar Nilai - Kelas {selectedClass}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedSubject} • NA = Rata-rata NH (40%) + UTS (30%) +
                    UAS (30%)
                  </p>
                </div>

                {/* Action Buttons - RESPONSIVE */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={saveAllGrades}
                    disabled={saving || isSyncing || students.length === 0}
                    className="w-full sm:w-auto bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base touch-manipulation min-h-[44px] active:scale-[0.98]"
                    style={{ minWidth: "120px" }}>
                    {saving || isSyncing ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving || isSyncing ? "Menyimpan..." : "Simpan Nilai"}
                  </button>

                  <button
                    onClick={handleExportToExcel}
                    disabled={
                      exporting ||
                      students.length === 0 ||
                      !students.some((student) =>
                        assignmentTypes.some(
                          (type) =>
                            student.grades[type] &&
                            student.grades[type] !== "" &&
                            student.grades[type] !== null
                        )
                      )
                    }
                    className="w-full sm:w-auto bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base touch-manipulation min-h-[44px] active:scale-[0.98]"
                    style={{ minWidth: "120px" }}>
                    {exporting ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {exporting ? "Mengekspor..." : "Export Excel"}
                  </button>

                  <button
                    onClick={() => setShowImportModal(true)}
                    disabled={!selectedClass || !selectedSubject}
                    className="w-full sm:w-auto bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base touch-manipulation min-h-[44px] active:scale-[0.98]"
                    style={{ minWidth: "120px" }}>
                    <Upload className="w-4 h-4" />
                    Import Excel
                  </button>

                  {/* ❌ TOMBOL "KATROL NILAI" DIHAPUS dari sini */}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 sm:p-12 text-center">
                <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Memuat data nilai...
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table - 9 KOLOM */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          NISN
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
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-red-50 dark:bg-red-900/30">
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
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {student.no}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {student.nisn}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.nama_siswa}
                            </td>

                            {/* Input fields untuk setiap jenis nilai */}
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
                                  className="w-20 p-2 text-center text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors touch-manipulation min-h-[44px]"
                                  placeholder="0-100"
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

                        {/* Grid input untuk mobile - DIBUAT 2 KOLOM SEMUA */}
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

                          {/* Row 2: NH3 & NH4 */}
                          {["NH3", "NH4"].map((type) => (
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

                          {/* Row 3: NH5 & UTS */}
                          {["NH5", "UTS"].map((type) => (
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

                          {/* Row 4: UAS & NA */}
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
        {(!selectedClass || !selectedSubject) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
            <Calculator className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              Pilih Filter
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              Silakan pilih kelas dan mata pelajaran untuk mulai input nilai
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
        userData={userData}
        onImportSuccess={() => {
          loadAllGrades();
        }}
      />
    </div>
  );
};

export default Grade;
