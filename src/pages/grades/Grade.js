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

  // States - DIUBAH: hapus selectedType
  const [userData, setUserData] = useState(initialUserData);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState([]); // Format baru: { nisn, nama_siswa, grades: { NH1: "", NH2: "", ... }, na }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

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

  // ===== FUNGSI BARU: Load SEMUA nilai sekaligus =====
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

      // 2. Fetch SEMUA nilai untuk mapel ini - ⚠️ GUNAKAN "nilai" bukan "grades"
      const allGrades = await getDataWithFallback("nilai", (query) =>
        query
          .eq("kelas", parseInt(selectedClass))
          .eq("mata_pelajaran", selectedSubject)
      );

      console.log("📊 Students loaded:", studentsData.length);
      console.log("📊 Nilai loaded:", allGrades?.length || 0);
      console.log("🔍 Sample grade record:", allGrades?.[0]);

      // 3. Process data: gabung student dengan semua jenis nilai
      const processedStudents = studentsData.map((student, index) => {
        // Default grades object
        const grades = {};
        const nhGrades = [];

        // Isi grades dari data yang ada
        assignmentTypes.forEach((type) => {
          const grade = allGrades?.find(
            (g) => g.nisn === student.nisn && g.jenis_nilai === type
          );

          // Pastikan nilai ada dan valid
          if (grade && grade.nilai !== null && grade.nilai !== undefined) {
            console.log(`✅ Found ${type} for ${student.nisn}:`, grade);
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

        // Hitung NA hanya jika ada nilai
        let na = "";

        // Parse UTS dan UAS values
        const utsValue = grades["UTS"] ? parseFloat(grades["UTS"]) : 0;
        const uasValue = grades["UAS"] ? parseFloat(grades["UAS"]) : 0;

        if (nhGrades.length > 0 || utsValue > 0 || uasValue > 0) {
          const avgNH =
            nhGrades.length > 0
              ? nhGrades.reduce((a, b) => a + b, 0) / nhGrades.length
              : 0;
          na = (avgNH * 0.4 + utsValue * 0.3 + uasValue * 0.3).toFixed(1);
        }

        // Check if has any grade (exclude the _id fields)
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
    // Validate input
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

            // Check if has any grade
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
            existingId: student.grades[`${type}_id`],
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
      // Pisahkan data baru vs update
      const newData = [];
      const updateData = [];

      allDataToSave.forEach((data) => {
        if (
          data.existingId &&
          data.existingId !== null &&
          data.existingId !== undefined &&
          data.existingId !== ""
        ) {
          updateData.push(data);
        } else {
          const { existingId, ...newRecord } = data;
          newData.push(newRecord);
        }
      });

      console.log(`📊 New: ${newData.length}, Update: ${updateData.length}`);

      let successCount = 0;
      let failCount = 0;

      // INSERT new data - ⚠️ GUNAKAN "nilai"
      if (newData.length > 0) {
        try {
          const { data: inserted, error } = await supabase
            .from("nilai")
            .insert(newData)
            .select();

          if (error) {
            console.error("Insert error:", error);
            // Fallback ke offlineSync
            const insertResult = await saveWithSync("nilai", newData);
            if (insertResult.success) {
              successCount += insertResult.syncedCount || newData.length;
            } else {
              failCount += newData.length;
            }
          } else {
            successCount += inserted?.length || newData.length;
          }
        } catch (insertError) {
          console.error("Insert failed:", insertError);
          failCount += newData.length;
        }
      }

      // UPDATE existing data - ⚠️ GUNAKAN "nilai"
      if (updateData.length > 0) {
        for (const data of updateData) {
          try {
            // Coba update dengan composite key
            const { data: updated, error } = await supabase
              .from("nilai")
              .update({
                nilai: data.nilai,
                guru_input: data.guru_input,
                tanggal: data.tanggal,
                updated_at: new Date().toISOString(),
              })
              .match({
                nisn: data.nisn,
                kelas: data.kelas,
                mata_pelajaran: data.mata_pelajaran,
                jenis_nilai: data.jenis_nilai,
              })
              .select();

            if (error) {
              console.error(
                `Update error for ${data.nisn} - ${data.jenis_nilai}:`,
                error
              );

              // Fallback: coba pake existingId
              if (data.existingId) {
                const { data: updated2, error: error2 } = await supabase
                  .from("nilai")
                  .update({
                    nilai: data.nilai,
                    guru_input: data.guru_input,
                    tanggal: data.tanggal,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", data.existingId)
                  .select();

                if (error2) {
                  throw error2;
                }
                if (updated2 && updated2.length > 0) {
                  successCount++;
                } else {
                  failCount++;
                }
              } else {
                failCount++;
              }
            } else if (updated && updated.length > 0) {
              successCount++;
            } else {
              // Jika update ga nemu data, insert baru
              console.warn(
                `⚠️ No record found for update, trying insert: ${data.nama_siswa} - ${data.jenis_nilai}`
              );

              const { data: inserted, error: insertError } = await supabase
                .from("nilai")
                .insert([
                  {
                    nisn: data.nisn,
                    nama_siswa: data.nama_siswa,
                    kelas: data.kelas,
                    mata_pelajaran: data.mata_pelajaran,
                    jenis_nilai: data.jenis_nilai,
                    nilai: data.nilai,
                    guru_input: data.guru_input,
                    tanggal: data.tanggal,
                  },
                ])
                .select();

              if (insertError) {
                failCount++;
              } else {
                successCount++;
              }
            }
          } catch (error) {
            console.error(
              `Update failed for ${data.nama_siswa} - ${data.jenis_nilai}:`,
              error
            );
            failCount++;
          }
        }
      }

      // Show result
      if (successCount > 0 && failCount === 0) {
        showMessage(`✅ ${successCount} nilai berhasil disimpan!`, "success");
      } else if (successCount > 0 && failCount > 0) {
        showMessage(
          `⚠️ ${successCount} berhasil, ${failCount} gagal disimpan!`,
          "warning"
        );
      } else {
        showMessage(`❌ Gagal menyimpan ${failCount} nilai!`, "error");
      }

      // Refresh data
      await loadAllGrades();
    } catch (error) {
      console.error("Error saving grades:", error);
      showMessage("Error menyimpan data: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExportToExcel = async () => {
    // ⚠️ STRICT VALIDATION: Hanya export jika ada data nilai
    if (students.length === 0) {
      showMessage("Tidak ada data siswa untuk diexport!", "error");
      return;
    }

    // Cek apakah ada minimal satu nilai yang sudah diisi
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
      // Panggil fungsi export dengan data yang ada
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
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Sync Status Badge */}
        <SyncStatusBadge />

        {/* Message */}
        {message.text && (
          <div
            className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
              message.type === "error"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800"
                : message.type === "warning" || message.type === "offline"
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800"
                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800"
            }`}>
            <div className="flex items-center gap-2">
              {message.type === "error" ? (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : message.type === "warning" || message.type === "offline" ? (
                <WifiOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Header - SAMA KAYAK SMP */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100">
                  Input Nilai Siswa SD
                </h1>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
                Kelola Nilai Siswa Untuk Mata Pelajaran
              </p>
            </div>
          </div>

          {/* Filters - 2 KOLOM SAJA (GAK ADA JENIS NILAI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
            {/* Kelas */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                {userData?.role === "guru_kelas" ? "Kelas Anda" : "Kelas"}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={userData?.role === "guru_kelas" || loading}
                style={{ minHeight: "44px" }}>
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
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                Mata Pelajaran
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={loading}
                style={{ minHeight: "44px" }}>
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
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards - SAMA KAYAK SMP */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 sm:p-3 rounded-lg">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100">
                    {stats.total}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                    Total Siswa
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-2.5 sm:p-3 rounded-lg">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100">
                    {stats.completed}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                    Sudah Dinilai
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 sm:p-3 rounded-lg">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100">
                    {stats.average}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                    Rata-rata NA
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabel Nilai - SAMA KAYAK SMP TAPI DENGAN 9 KOLOM */}
        {selectedClass && selectedSubject && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-gray-100">
                    Daftar Nilai - Kelas {selectedClass}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1">
                    {selectedSubject} • NA = Rata-rata NH (40%) + UTS (30%) +
                    UAS (30%)
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={saveAllGrades}
                    disabled={saving || isSyncing || students.length === 0}
                    className="w-full sm:w-auto bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                    style={{ minHeight: "44px" }}>
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
                    className="w-full sm:w-auto bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                    style={{ minHeight: "44px" }}
                    title={
                      students.length === 0
                        ? "Tidak ada data siswa"
                        : !students.some((student) =>
                            assignmentTypes.some(
                              (type) =>
                                student.grades[type] &&
                                student.grades[type] !== "" &&
                                student.grades[type] !== null
                            )
                          )
                        ? "Data nilai masih kosong"
                        : "Export data nilai ke Excel"
                    }>
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
                    className="w-full sm:w-auto bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                    style={{ minHeight: "44px" }}>
                    <Upload className="w-4 h-4" />
                    Import Excel
                  </button>

                  {/* Katrol Nilai tetap ada */}
                  <Link
                    to="/grades/katrol"
                    state={{
                      userData,
                      selectedClass:
                        selectedClass ||
                        (userData?.role === "guru_kelas"
                          ? String(userData.kelas)
                          : ""),
                      selectedSubject: selectedSubject || "",
                    }}
                    className="w-full sm:w-auto bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-center text-sm sm:text-base"
                    style={{ minHeight: "44px" }}>
                    <Calculator className="w-4 h-4" />
                    Katrol Nilai
                  </Link>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-600 dark:text-gray-400 text-sm sm:text-base">
                  Memuat data nilai...
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table - 9 KOLOM */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          NISN
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          Nama Siswa
                        </th>
                        {assignmentTypes.map((type) => (
                          <th
                            key={type}
                            className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                            {assignmentLabels[type]}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30">
                          NA
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-slate-200 dark:divide-gray-700">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr
                            key={student.nisn}
                            className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-gray-100">
                              {student.no}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-gray-100 whitespace-nowrap">
                              {student.nisn}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-gray-100">
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
                                  className="w-20 p-2 text-center text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  placeholder="0-100"
                                  disabled={saving}
                                />
                              </td>
                            ))}

                            {/* Nilai Akhir */}
                            <td className="px-4 py-3">
                              <div className="text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded px-3 py-2">
                                {student.na || "0.0"}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="px-4 py-8 text-center">
                            <Users className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-gray-400">
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

                {/* Mobile Cards (REVISI TAMPILAN HP DI SINI) */}
                <div className="block lg:hidden">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <div
                        key={student.nisn}
                        className="border-b border-slate-100 dark:border-gray-700 p-4">
                        <div className="mb-4">
                          <div className="font-medium text-slate-900 dark:text-gray-100 text-base">
                            {student.no}. {student.nama_siswa}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-gray-400">
                            NISN: {student.nisn}
                          </div>
                        </div>

                        {/* Grid input untuk mobile - DIBUAT 2 KOLOM SEMUA */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* NH1 dan NH2 */}
                          {[
                            { type: "NH1", label: "NH1" },
                            { type: "NH2", label: "NH2" },
                          ].map(({ type, label }) => (
                            <div key={type}>
                              <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                                {label}
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
                                className="w-full p-2.5 text-base text-center border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="0"
                                disabled={saving}
                              />
                            </div>
                          ))}

                          {/* NH3 dan NH4 */}
                          {[
                            { type: "NH3", label: "NH3" },
                            { type: "NH4", label: "NH4" },
                          ].map(({ type, label }) => (
                            <div key={type}>
                              <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                                {label}
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
                                className="w-full p-2.5 text-base text-center border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="0"
                                disabled={saving}
                              />
                            </div>
                          ))}

                          {/* NH5 dan UTS */}
                          {[
                            { type: "NH5", label: "NH5" },
                            { type: "UTS", label: "UTS" },
                          ].map(({ type, label }) => (
                            <div key={type}>
                              <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                                {label}
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
                                className="w-full p-2.5 text-base text-center border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="0"
                                disabled={saving}
                              />
                            </div>
                          ))}

                          {/* UAS dan Nilai Akhir (NA) */}
                          <div key="UAS">
                            <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
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
                              className="w-full p-2.5 text-base text-center border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              placeholder="0"
                              disabled={saving}
                            />
                          </div>
                          <div key="NA">
                            <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                              Nilai Akhir (NA)
                            </label>
                            <div className="w-full p-2.5 text-base text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                              {student.na || "0.0"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Users className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-12 text-center">
            <Calculator className="w-16 h-16 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-500 dark:text-gray-400 mb-2">
              Pilih Filter
            </h3>
            <p className="text-slate-400 dark:text-gray-500">
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
