import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Calendar,
  Eye,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  Users,
  Zap,
  BarChart3,
} from "lucide-react";

const AcademicYearTab = ({ user, loading, setLoading, showToast }) => {
  const [schoolStats, setSchoolStats] = useState({
    academic_year: "2025/2026",
    total_students: 0,
  });
  const [studentsByClass, setStudentsByClass] = useState({});
  const [yearTransition, setYearTransition] = useState({
    preview: null,
    newYear: "",
    inProgress: false,
  });
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      setLoading(true);

      const { data: settingsData, error: settingsError } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value")
        .eq("setting_key", "academic_year");

      if (settingsError) throw settingsError;

      const academicYear = settingsData?.[0]?.setting_value || "2025/2026";

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, nisn, nama_siswa, jenis_kelamin, kelas, is_active")
        .eq("is_active", true)
        .order("nama_siswa");

      if (studentsError) throw studentsError;

      const studentsByClass = {};
      studentsData?.forEach((student) => {
        const kelas = student.kelas || "unassigned";
        if (!studentsByClass[kelas]) {
          studentsByClass[kelas] = [];
        }
        studentsByClass[kelas].push(student);
      });

      setStudentsByClass(studentsByClass);
      setSchoolStats({
        academic_year: academicYear,
        total_students: studentsData?.length || 0,
      });
    } catch (error) {
      console.error("Error loading school data:", error);
      showToast("Error loading school data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateYearTransitionPreview = async () => {
    try {
      setLoading(true);

      const currentYear = schoolStats.academic_year;
      const [startYear] = currentYear.split("/");
      const newYear = `${parseInt(startYear) + 1}/${parseInt(startYear) + 2}`;

      const promotionPlan = {};
      const graduatingStudents = [];

      Object.entries(studentsByClass).forEach(([kelas, students]) => {
        const grade = parseInt(kelas);

        if (grade === 6) {
          graduatingStudents.push(...students);
        } else if (grade >= 1 && grade <= 5) {
          const nextGrade = grade + 1;
          if (!promotionPlan[nextGrade]) {
            promotionPlan[nextGrade] = [];
          }
          promotionPlan[nextGrade].push(...students);
        }
      });

      const { data: siswaBaruData, error: siswaBaruError } = await supabase
        .from("siswa_baru")
        .select("*")
        .eq("is_accepted", true)
        .eq("sudah_masuk", false)
        .eq("academic_year", newYear);

      if (siswaBaruError) {
        console.warn("Error loading siswa baru:", siswaBaruError);
      }

      const { data: existingStudents } = await supabase
        .from("students")
        .select("nisn");

      const existingNISN = new Set(existingStudents?.map((s) => s.nisn) || []);

      const validNewStudents = [];
      const conflictedNISN = [];

      siswaBaruData?.forEach((siswa) => {
        if (siswa.nisn && existingNISN.has(siswa.nisn)) {
          conflictedNISN.push({
            nama: siswa.nama_lengkap,
            nisn: siswa.nisn,
          });
        } else {
          validNewStudents.push(siswa);
        }
      });

      setYearTransition({
        preview: {
          currentYear,
          newYear,
          promotions: promotionPlan,
          graduating: graduatingStudents,
          newStudents: validNewStudents,
          conflictedNISN: conflictedNISN,
        },
        newYear,
        inProgress: false,
      });

      // Reset simulation when new preview is generated
      setSimulationResult(null);

      if (conflictedNISN.length > 0) {
        showToast(
          `⚠️ ${conflictedNISN.length} siswa baru memiliki NISN yang sudah terdaftar!`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      showToast("Error generating preview: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 SIMULATION FUNCTION - READ ONLY, NO DATABASE CHANGES!
  const simulateYearTransition = async () => {
    if (!yearTransition.preview) {
      showToast("Generate preview terlebih dahulu!", "error");
      return;
    }

    try {
      setIsSimulating(true);
      const { preview } = yearTransition;

      // Simulate data yang akan masuk ke students table
      const simulatedStudentsAfterTransition = [];

      // 1️⃣ Siswa existing yang naik kelas
      for (const [newGrade, students] of Object.entries(preview.promotions)) {
        students.forEach((student) => {
          simulatedStudentsAfterTransition.push({
            ...student,
            kelas: newGrade,
            status: "promoted",
            oldKelas: student.kelas,
          });
        });
      }

      // 2️⃣ Siswa baru yang akan masuk kelas 1
      const simulatedNewStudents = preview.newStudents.map((siswa) => ({
        nisn: siswa.nisn,
        nama_siswa: siswa.nama_lengkap,
        jenis_kelamin: siswa.jenis_kelamin,
        kelas: "1",
        is_active: true,
        status: "new_student",
        source: "SPMB",
      }));

      // 3️⃣ Siswa yang lulus
      const simulatedGraduates = preview.graduating.map((student) => ({
        ...student,
        status: "graduated",
        oldKelas: student.kelas,
        newKelas: "lulus",
        is_active: false,
      }));

      // Hitung statistik
      const totalPromoted = Object.values(preview.promotions).flat().length;
      const totalNewStudents = preview.newStudents.length;
      const totalGraduated = preview.graduating.length;
      const totalActiveAfter = totalPromoted + totalNewStudents;

      // Group students by new class
      const studentsByNewClass = {};
      simulatedStudentsAfterTransition.forEach((s) => {
        if (!studentsByNewClass[s.kelas]) {
          studentsByNewClass[s.kelas] = [];
        }
        studentsByNewClass[s.kelas].push(s);
      });

      // Add new students to class 1
      if (!studentsByNewClass["1"]) {
        studentsByNewClass["1"] = [];
      }
      studentsByNewClass["1"].push(...simulatedNewStudents);

      // Validasi potential issues
      const warnings = [];

      // Check if any class will be too large
      Object.entries(studentsByNewClass).forEach(([kelas, students]) => {
        if (students.length > 50) {
          warnings.push(
            `⚠️ Kelas ${kelas} akan memiliki ${students.length} siswa (melebihi kapasitas ideal 50)`
          );
        }
      });

      // Check if any class will be too small
      Object.entries(studentsByNewClass).forEach(([kelas, students]) => {
        if (students.length < 20) {
          warnings.push(
            `⚠️ Kelas ${kelas} hanya akan memiliki ${students.length} siswa (di bawah ideal 20)`
          );
        }
      });

      const simulationData = {
        timestamp: new Date().toISOString(),
        summary: {
          totalPromoted,
          totalNewStudents,
          totalGraduated,
          totalActiveBefore: schoolStats.total_students,
          totalActiveAfter,
          netChange: totalActiveAfter - schoolStats.total_students,
        },
        detailedChanges: {
          promotions: preview.promotions,
          newStudents: simulatedNewStudents,
          graduates: simulatedGraduates,
          studentsByNewClass,
        },
        warnings,
        isValid:
          warnings.length === 0 || warnings.every((w) => !w.includes("NISN")),
        academicYearChange: {
          from: preview.currentYear,
          to: preview.newYear,
        },
      };

      setSimulationResult(simulationData);

      showToast(
        `✅ Simulasi selesai! ${totalPromoted} naik kelas, ${totalNewStudents} siswa baru, ${totalGraduated} lulus`,
        "success"
      );
    } catch (error) {
      console.error("Error simulating transition:", error);
      showToast("Error saat simulasi: " + error.message, "error");
    } finally {
      setIsSimulating(false);
    }
  };

  const executeYearTransition = async () => {
    const { preview } = yearTransition;

    // Extra validation if simulation hasn't been run
    if (!simulationResult) {
      const runSimulationFirst = window.confirm(
        "⚠️ REKOMENDASI: Jalankan SIMULASI terlebih dahulu sebelum execute!\n\n" +
          "Simulasi akan menampilkan detail lengkap perubahan tanpa mengubah database.\n\n" +
          "Apakah Anda yakin ingin langsung execute tanpa simulasi?"
      );

      if (!runSimulationFirst) return;
    }

    const confirmed = window.confirm(
      `🚨 PERINGATAN FINAL: Tindakan ini PERMANENT dan TIDAK DAPAT DIBATALKAN!\n\n` +
        `Perubahan yang akan terjadi:\n\n` +
        `1. ✅ ${
          Object.values(preview.promotions).flat().length
        } siswa naik kelas\n` +
        `2. 🎓 ${preview.graduating.length} siswa kelas 6 lulus\n` +
        `3. 🆕 ${preview.newStudents.length} siswa baru masuk kelas 1\n` +
        `4. 📅 Tahun ajaran: ${yearTransition.preview.currentYear} → ${yearTransition.newYear}\n` +
        `5. 👨‍🏫 Reset assignment guru\n\n` +
        `${
          simulationResult
            ? "✅ Simulasi telah dijalankan dan valid\n\n"
            : "⚠️ Simulasi belum dijalankan!\n\n"
        }` +
        `Ketik "EXECUTE" untuk melanjutkan:`
    );

    if (!confirmed) return;

    // Double confirmation
    const finalConfirm = prompt(
      'Ketik "EXECUTE" (huruf besar semua) untuk konfirmasi:'
    );
    if (finalConfirm !== "EXECUTE") {
      showToast("Transisi dibatalkan", "info");
      return;
    }

    try {
      setLoading(true);
      setYearTransition((prev) => ({ ...prev, inProgress: true }));

      // 1️⃣ GRADUATE SISWA KELAS 6
      if (preview.graduating.length > 0) {
        const graduatingIds = preview.graduating.map((s) => s.id);

        const { error: graduateError } = await supabase
          .from("students")
          .update({ is_active: false, kelas: "lulus" })
          .in("id", graduatingIds);

        if (graduateError) throw graduateError;
      }

      // 2️⃣ PROMOTE SISWA EXISTING
      for (const [newGrade, students] of Object.entries(preview.promotions)) {
        const studentIds = students.map((s) => s.id);

        const { error: promoteError } = await supabase
          .from("students")
          .update({ kelas: newGrade })
          .in("id", studentIds);

        if (promoteError) throw promoteError;
      }

      // 3️⃣ TRANSFER SISWA BARU KE STUDENTS (KELAS 1)
      if (preview.newStudents.length > 0) {
        const newStudentsData = preview.newStudents.map((siswa) => ({
          nisn: siswa.nisn,
          nama_siswa: siswa.nama_lengkap,
          jenis_kelamin: siswa.jenis_kelamin,
          kelas: "1",
          is_active: true,
        }));

        const { error: insertError } = await supabase
          .from("students")
          .insert(newStudentsData);

        if (insertError) throw insertError;

        // 4️⃣ UPDATE FLAG SUDAH_MASUK DI SISWA_BARU
        const siswaBaruIds = preview.newStudents.map((s) => s.id);

        const { error: updateSiswaBaruError } = await supabase
          .from("siswa_baru")
          .update({
            sudah_masuk: true,
            keterangan: `Masuk kelas 1 tahun ajaran ${yearTransition.newYear}`,
          })
          .in("id", siswaBaruIds);

        if (updateSiswaBaruError) throw updateSiswaBaruError;
      }

      // 5️⃣ RESET GURU ASSIGNMENT
      const { error: teacherResetError } = await supabase
        .from("users")
        .update({ kelas: null })
        .in("role", ["guru_kelas", "guru_mapel"]);

      if (teacherResetError) throw teacherResetError;

      // 6️⃣ UPDATE TAHUN AJARAN
      const { error: settingError } = await supabase
        .from("school_settings")
        .update({ setting_value: yearTransition.newYear })
        .eq("setting_key", "academic_year");

      if (settingError) throw settingError;

      setSchoolStats((prev) => ({
        ...prev,
        academic_year: yearTransition.newYear,
      }));

      showToast(
        `✅ Tahun ajaran ${yearTransition.newYear} berhasil dimulai!\n` +
          `📊 ${preview.newStudents.length} siswa baru masuk kelas 1\n` +
          `⬆️ ${
            Object.values(preview.promotions).flat().length
          } siswa naik kelas\n` +
          `🎓 ${preview.graduating.length} siswa lulus\n` +
          `👨‍🏫 Silakan assign ulang guru ke kelas!`,
        "success"
      );

      await loadSchoolData();
      setYearTransition({ preview: null, newYear: "", inProgress: false });
      setSimulationResult(null);
    } catch (error) {
      console.error("Error executing year transition:", error);
      showToast("Error starting new academic year: " + error.message, "error");
    } finally {
      setLoading(false);
      setYearTransition((prev) => ({ ...prev, inProgress: false }));
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* HEADER */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        Academic Year Management
      </h2>

      {/* CURRENT ACADEMIC YEAR CARD */}
      <div className="bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 md:p-6 rounded-lg mb-6 md:mb-8 border border-red-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="text-red-600 dark:text-red-400" size={24} />
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-white">
            Tahun Ajaran Aktif
          </h3>
        </div>
        <p className="text-3xl md:text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
          {schoolStats.academic_year}
        </p>
        <p className="text-red-700 dark:text-red-300">
          {schoolStats.total_students} siswa aktif dalam{" "}
          {Object.keys(studentsByClass).length} kelas
        </p>
      </div>

      {/* YEAR TRANSITION SECTION */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
              Transisi Tahun Ajaran
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              Kelola perpindahan ke tahun ajaran berikutnya (termasuk siswa baru
              dari SPMB)
            </p>
          </div>

          {!yearTransition.preview && (
            <button
              onClick={generateYearTransitionPreview}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto">
              <Eye size={18} />
              <span>Preview Naik Kelas</span>
            </button>
          )}
        </div>

        {/* TRANSITION PREVIEW */}
        {yearTransition.preview && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-6 rounded-lg">
            {/* PREVIEW HEADER */}
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle
                className="text-green-600 dark:text-green-400"
                size={20}
              />
              <h4 className="font-semibold text-gray-800 dark:text-white">
                Preview Transisi: {yearTransition.preview.currentYear} →{" "}
                {yearTransition.preview.newYear}
              </h4>
            </div>

            {/* PREVIEW CARDS - GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
              {/* PROMOTIONS CARD */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h5 className="font-medium text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-red-600 dark:text-red-400" />
                  Siswa Naik Kelas
                </h5>
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                  {Object.entries(yearTransition.preview.promotions).map(
                    ([grade, students]) => (
                      <div
                        key={grade}
                        className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-red-600 dark:text-red-400">
                            → Kelas {grade}
                          </span>
                          <span className="text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded">
                            {students.length} siswa
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* NEW STUDENTS CARD */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h5 className="font-medium text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <UserPlus
                    size={18}
                    className="text-green-600 dark:text-green-400"
                  />
                  Siswa Baru (SPMB)
                </h5>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-green-700 dark:text-green-400">
                        SPMB → Kelas 1
                      </span>
                      <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded">
                        {yearTransition.preview.newStudents?.length || 0} siswa
                      </span>
                    </div>
                    {yearTransition.preview.newStudents?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Contoh nama:
                        </p>
                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          {yearTransition.preview.newStudents
                            .slice(0, 3)
                            .map((siswa, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-green-600 dark:text-green-400 mr-1">
                                  •
                                </span>
                                {siswa.nama_lengkap}
                              </li>
                            ))}
                          {yearTransition.preview.newStudents.length > 3 && (
                            <li className="text-gray-500 dark:text-gray-400 pt-1">
                              ... dan{" "}
                              {yearTransition.preview.newStudents.length - 3}{" "}
                              lainnya
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {(!yearTransition.preview.newStudents ||
                    yearTransition.preview.newStudents.length === 0) && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        ℹ️ Tidak ada siswa baru yang diterima untuk tahun ajaran{" "}
                        {yearTransition.preview.newYear}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* GRADUATING CARD */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h5 className="font-medium text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400">
                    🎓
                  </span>
                  Siswa Lulus
                </h5>
                <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-300 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      Kelas 6 → Lulus
                    </span>
                    <span className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded">
                      {yearTransition.preview.graduating.length} siswa
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* NISN CONFLICT WARNING */}
            {yearTransition.preview.conflictedNISN?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle
                    className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                    size={20}
                  />
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-300 font-medium mb-3">
                      ⚠️ Konflik NISN Terdeteksi!
                    </p>
                    <p className="text-red-700 dark:text-red-400 text-sm mb-3">
                      {yearTransition.preview.conflictedNISN.length} siswa baru
                      memiliki NISN yang sudah terdaftar:
                    </p>
                    <ul className="text-red-700 dark:text-red-400 text-sm space-y-2 list-disc list-inside max-h-[140px] overflow-y-auto pl-2">
                      {yearTransition.preview.conflictedNISN.map(
                        (item, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{item.nama}</span>{" "}
                            (NISN: {item.nisn})
                          </li>
                        )
                      )}
                    </ul>
                    <p className="text-red-600 dark:text-red-400 text-xs mt-3 font-medium">
                      Siswa ini TIDAK akan dimasukkan ke sistem. Perbaiki NISN
                      di SPMB terlebih dahulu!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY STATISTICS */}
            <div className="bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900 border border-red-100 dark:border-gray-700 rounded-lg p-4 md:p-6 mb-6">
              <h5 className="font-medium text-red-900 dark:text-white mb-4">
                📊 Ringkasan Transisi
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  {
                    label: "Siswa Naik Kelas",
                    value: Object.values(
                      yearTransition.preview.promotions
                    ).flat().length,
                    color: "red",
                  },
                  {
                    label: "Siswa Baru",
                    value: yearTransition.preview.newStudents?.length || 0,
                    color: "green",
                  },
                  {
                    label: "Siswa Lulus",
                    value: yearTransition.preview.graduating.length,
                    color: "purple",
                  },
                  {
                    label: "Total Aktif Baru",
                    value:
                      Object.values(yearTransition.preview.promotions).flat()
                        .length +
                      (yearTransition.preview.newStudents?.length || 0),
                    color: "orange",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm mb-1">
                      {stat.label}
                    </p>
                    <p
                      className={`text-2xl md:text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SIMULATION SECTION */}
            <div className="bg-gradient-to-r from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 border border-purple-100 dark:border-gray-700 rounded-lg p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Zap
                    className="text-purple-600 dark:text-purple-400"
                    size={22}
                  />
                  <div>
                    <h5 className="font-medium text-purple-900 dark:text-white">
                      Testing & Validation
                    </h5>
                    <p className="text-purple-700 dark:text-purple-300 text-sm">
                      Simulasi detail tanpa mengubah database
                    </p>
                  </div>
                </div>
                <button
                  onClick={simulateYearTransition}
                  disabled={isSimulating || loading}
                  className="flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto">
                  {isSimulating ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      <span>Simulating...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 size={18} />
                      <span>🔍 Simulate Transisi</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                <p className="text-purple-800 dark:text-purple-300 text-sm">
                  💡 <strong>Rekomendasi:</strong> Jalankan simulasi terlebih
                  dahulu sebelum execute untuk memastikan semua data valid!
                </p>
              </div>
            </div>

            {/* SIMULATION RESULTS */}
            {simulationResult && (
              <div className="bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 md:p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle
                      className="text-purple-600 dark:text-purple-400"
                      size={22}
                    />
                    <h5 className="font-semibold text-purple-900 dark:text-white">
                      📊 Hasil Simulasi
                    </h5>
                  </div>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded inline-block md:ml-auto">
                    {new Date(simulationResult.timestamp).toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {[
                    {
                      label: "Naik Kelas",
                      value: simulationResult.summary.totalPromoted,
                      color: "blue",
                    },
                    {
                      label: "Siswa Baru",
                      value: simulationResult.summary.totalNewStudents,
                      color: "green",
                    },
                    {
                      label: "Lulus",
                      value: simulationResult.summary.totalGraduated,
                      color: "purple",
                    },
                    {
                      label: "Total Aktif",
                      value: simulationResult.summary.totalActiveAfter,
                      subtext: `${
                        simulationResult.summary.netChange > 0 ? "+" : ""
                      }${simulationResult.summary.netChange} dari sebelumnya`,
                      color: "orange",
                    },
                    {
                      label: "Status",
                      value: simulationResult.isValid ? "VALID" : "PERHATIAN",
                      isStatus: true,
                      color: simulationResult.isValid ? "green" : "red",
                    },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-300 text-xs mb-1">
                        {stat.label}
                      </p>
                      <p
                        className={`text-xl md:text-2xl font-bold ${
                          stat.isStatus
                            ? simulationResult.isValid
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                            : `text-${stat.color}-600 dark:text-${stat.color}-400`
                        }`}>
                        {stat.value}
                      </p>
                      {stat.subtext && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {stat.subtext}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* DISTRIBUTION BY CLASS */}
                <div className="mb-6">
                  <h6 className="font-medium text-gray-800 dark:text-white mb-4">
                    📈 Distribusi per Kelas Setelah Transisi:
                  </h6>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {Object.entries(
                      simulationResult.detailedChanges.studentsByNewClass
                    )
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([kelas, students]) => (
                        <div
                          key={kelas}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                          <p className="font-bold text-red-600 dark:text-red-400 text-sm mb-1">
                            Kelas {kelas}
                          </p>
                          <p className="text-2xl font-bold text-gray-800 dark:text-white">
                            {students.length}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            siswa
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* WARNINGS */}
                {simulationResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle
                        className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                        size={20}
                      />
                      <div className="flex-1">
                        <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-3">
                          ⚠️ Peringatan dari Sistem:
                        </p>
                        <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-2 list-disc list-inside pl-2">
                          {simulationResult.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIMULATION STATUS */}
                <div
                  className={`rounded-lg p-4 mb-4 ${
                    simulationResult.isValid
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}>
                  <div className="flex items-center gap-3">
                    {simulationResult.isValid ? (
                      <CheckCircle
                        className="text-green-600 dark:text-green-400"
                        size={20}
                      />
                    ) : (
                      <AlertTriangle
                        className="text-red-600 dark:text-red-400"
                        size={20}
                      />
                    )}
                    <p
                      className={`font-medium ${
                        simulationResult.isValid
                          ? "text-green-800 dark:text-green-300"
                          : "text-red-800 dark:text-red-300"
                      }`}>
                      {simulationResult.isValid
                        ? "✅ Simulasi menunjukkan transisi dapat dilakukan dengan aman."
                        : "⚠️ Ada masalah yang perlu diperhatikan sebelum execute!"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* EXECUTE SECTION */}
            <div className="bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900 border border-red-200 dark:border-gray-700 rounded-lg p-4 md:p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle
                  className="text-red-600 dark:text-red-400 flex-shrink-0 mt-1"
                  size={22}
                />
                <div className="flex-1">
                  <p className="text-red-800 dark:text-red-300 font-medium mb-4">
                    Peringatan: Tindakan Permanen
                  </p>
                  <ul className="text-red-700 dark:text-red-400 text-sm space-y-2 mb-6 list-disc list-inside pl-2">
                    <li>Semua siswa akan naik kelas</li>
                    <li>Siswa kelas 6 akan diluluskan</li>
                    <li>
                      {yearTransition.preview.newStudents?.length || 0} siswa
                      baru masuk kelas 1
                    </li>
                    <li>Assignment guru akan direset</li>
                    <li>
                      Tahun ajaran berubah ke {yearTransition.preview.newYear}
                    </li>
                  </ul>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={executeYearTransition}
                      disabled={loading || yearTransition.inProgress}
                      className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full sm:w-auto">
                      {yearTransition.inProgress ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        "Mulai Tahun Ajaran Baru"
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setYearTransition({
                          preview: null,
                          newYear: "",
                          inProgress: false,
                        });
                        setSimulationResult(null);
                      }}
                      disabled={yearTransition.inProgress}
                      className="px-5 py-3 min-h-[44px] bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto">
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicYearTab;
