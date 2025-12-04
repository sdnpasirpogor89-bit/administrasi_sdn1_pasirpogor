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
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Academic Year Management
      </h2>

      {/* Current Academic Year */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-blue-900">
            Tahun Ajaran Aktif
          </h3>
        </div>
        <p className="text-3xl font-bold text-blue-600 mb-2">
          {schoolStats.academic_year}
        </p>
        <p className="text-blue-700">
          {schoolStats.total_students} siswa aktif dalam{" "}
          {Object.keys(studentsByClass).length} kelas
        </p>
      </div>

      {/* Year Transition */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Transisi Tahun Ajaran
            </h3>
            <p className="text-gray-600 text-sm">
              Kelola perpindahan ke tahun ajaran berikutnya (termasuk siswa baru
              dari SPMB)
            </p>
          </div>

          {!yearTransition.preview && (
            <button
              onClick={generateYearTransitionPreview}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Eye size={16} />
              Preview Naik Kelas
            </button>
          )}
        </div>

        {/* Transition Preview */}
        {yearTransition.preview && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-600" size={20} />
              <h4 className="font-semibold text-gray-800">
                Preview Transisi: {yearTransition.preview.currentYear} →{" "}
                {yearTransition.preview.newYear}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Promotions */}
              <div>
                <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  Siswa Naik Kelas
                </h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(yearTransition.preview.promotions).map(
                    ([grade, students]) => (
                      <div key={grade} className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-600">
                            → Kelas {grade}
                          </span>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {students.length} siswa
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* NEW STUDENTS FROM SPMB */}
              <div>
                <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <UserPlus size={16} className="text-green-600" />
                  Siswa Baru (SPMB)
                </h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="bg-white p-3 rounded border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-600">
                        SPMB → Kelas 1
                      </span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        {yearTransition.preview.newStudents?.length || 0} siswa
                      </span>
                    </div>
                    {yearTransition.preview.newStudents?.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-600">Contoh nama:</p>
                        <ul className="text-xs text-gray-700 mt-1 space-y-0.5">
                          {yearTransition.preview.newStudents
                            .slice(0, 3)
                            .map((siswa, idx) => (
                              <li key={idx}>• {siswa.nama_lengkap}</li>
                            ))}
                          {yearTransition.preview.newStudents.length > 3 && (
                            <li className="text-gray-500">
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
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="text-xs text-yellow-700">
                        ℹ️ Tidak ada siswa baru yang diterima untuk tahun ajaran{" "}
                        {yearTransition.preview.newYear}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Graduating */}
              <div>
                <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  🎓 Siswa Lulus
                </h5>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-green-600">
                      Kelas 6 → Lulus
                    </span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      {yearTransition.preview.graduating.length} siswa
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* NISN CONFLICT WARNING */}
            {yearTransition.preview.conflictedNISN?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className="text-red-600 flex-shrink-0 mt-0.5"
                    size={16}
                  />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium mb-2">
                      ⚠️ Konflik NISN Terdeteksi!
                    </p>
                    <p className="text-red-700 text-sm mb-2">
                      {yearTransition.preview.conflictedNISN.length} siswa baru
                      memiliki NISN yang sudah terdaftar:
                    </p>
                    <ul className="text-red-700 text-sm space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                      {yearTransition.preview.conflictedNISN.map(
                        (item, idx) => (
                          <li key={idx}>
                            {item.nama} (NISN: {item.nisn})
                          </li>
                        )
                      )}
                    </ul>
                    <p className="text-red-600 text-xs mt-2 font-medium">
                      Siswa ini TIDAK akan dimasukkan ke sistem. Perbaiki NISN
                      di SPMB terlebih dahulu!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Statistics */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h5 className="font-medium text-blue-900 mb-3">
                📊 Ringkasan Transisi
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600">Siswa Naik Kelas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {
                      Object.values(yearTransition.preview.promotions).flat()
                        .length
                    }
                  </p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600">Siswa Baru</p>
                  <p className="text-2xl font-bold text-green-600">
                    {yearTransition.preview.newStudents?.length || 0}
                  </p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600">Siswa Lulus</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {yearTransition.preview.graduating.length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600">Total Aktif Baru</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Object.values(yearTransition.preview.promotions).flat()
                      .length +
                      (yearTransition.preview.newStudents?.length || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* 🆕 SIMULATION SECTION */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="text-purple-600" size={20} />
                  <h5 className="font-medium text-purple-900">
                    Testing & Validation
                  </h5>
                </div>
                <button
                  onClick={simulateYearTransition}
                  disabled={isSimulating || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {isSimulating ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <BarChart3 size={16} />
                      🔍 Simulate Transisi
                    </>
                  )}
                </button>
              </div>
              <p className="text-purple-700 text-sm mb-2">
                Jalankan simulasi untuk melihat detail lengkap hasil transisi
                tanpa mengubah database.
                <strong> Database tetap AMAN!</strong>
              </p>
              {!simulationResult && (
                <div className="bg-purple-100 rounded p-2 text-xs text-purple-800">
                  💡 <strong>Rekomendasi:</strong> Jalankan simulasi terlebih
                  dahulu sebelum execute untuk memastikan semua data valid!
                </div>
              )}
            </div>

            {/* 🆕 SIMULATION RESULTS */}
            {simulationResult && (
              <div className="bg-white border-2 border-purple-300 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="text-purple-600" size={20} />
                  <h5 className="font-semibold text-purple-900">
                    📊 Hasil Simulasi
                  </h5>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {new Date(simulationResult.timestamp).toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Naik Kelas</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {simulationResult.summary.totalPromoted}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 mb-1">Siswa Baru</p>
                    <p className="text-2xl font-bold text-green-700">
                      {simulationResult.summary.totalNewStudents}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1">Lulus</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {simulationResult.summary.totalGraduated}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                    <p
                      className="text-xs text
                    -orange-600 mb-1">
                      Aktif Sebelum
                    </p>
                    <p className="text-2xl font-bold text-orange-700">
                      {simulationResult.summary.totalActiveBefore}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-3 rounded-lg border border-cyan-200">
                    <p className="text-xs text-cyan-600 mb-1">Aktif Sesudah</p>
                    <p className="text-2xl font-bold text-cyan-700">
                      {simulationResult.summary.totalActiveAfter}
                    </p>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <h6 className="font-medium text-gray-800 mb-2 text-sm">
                    📋 Rincian Per Kelas (Setelah Transisi)
                  </h6>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {Object.entries(
                      simulationResult.detailedChanges.studentsByNewClass
                    )
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([kelas, students]) => (
                        <div
                          key={kelas}
                          className="bg-white p-2 rounded border text-center">
                          <p className="text-xs text-gray-600">Kelas {kelas}</p>
                          <p className="text-lg font-bold text-blue-600">
                            {students.length}
                          </p>
                          <p className="text-xs text-gray-500">siswa</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Warnings */}
                {simulationResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <h6 className="font-medium text-yellow-800 mb-2 text-sm flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Peringatan Deteksi
                    </h6>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {simulationResult.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validation Status */}
                <div
                  className={`rounded-lg p-3 ${
                    simulationResult.isValid
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}>
                  <div className="flex items-center gap-2">
                    {simulationResult.isValid ? (
                      <>
                        <CheckCircle className="text-green-600" size={16} />
                        <p className="text-sm font-medium text-green-800">
                          ✅ Simulasi Valid - Siap untuk Execute
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="text-red-600" size={16} />
                        <p className="text-sm font-medium text-red-800">
                          ❌ Ada masalah yang harus diperbaiki sebelum execute
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Info Footer */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 italic">
                    💡 Simulasi ini hanya menghitung dan menampilkan hasil.
                    Database tidak berubah sama sekali.
                  </p>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="text-yellow-600 flex-shrink-0 mt-0.5"
                  size={16}
                />
                <div className="flex-1">
                  <p className="text-yellow-800 font-medium mb-2">
                    Peringatan: Tindakan Permanen
                  </p>
                  <ul className="text-yellow-700 text-sm space-y-1 mb-4 list-disc list-inside">
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

                  <div className="flex gap-3">
                    <button
                      onClick={executeYearTransition}
                      disabled={loading || yearTransition.inProgress}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-all">
                      {yearTransition.inProgress ? (
                        <>
                          <RefreshCw
                            className="animate-spin inline mr-2"
                            size={16}
                          />
                          Memproses...
                        </>
                      ) : (
                        "🔥 Mulai Tahun Ajaran Baru"
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
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50">
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
