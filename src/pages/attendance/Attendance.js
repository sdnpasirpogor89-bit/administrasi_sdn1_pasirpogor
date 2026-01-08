// Attendance.js - COMPONENT INPUT PRESENSI SD (MOBILE RESPONSIVE)
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { getSemesterById } from "../../services/academicYearService";

const Attendance = ({
  currentUser,
  onShowToast,
  darkMode,
  selectedSemester,
  availableSemesters,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ FILTER STUDENTS BY SEARCH
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      student.nama_siswa?.toLowerCase().includes(search) ||
      student.nisn?.toString().includes(search)
    );
  });

  // ✅ AUTO-SELECT CLASS FOR GURU KELAS
  useEffect(() => {
    if (currentUser?.role === "guru_kelas" && currentUser?.kelas) {
      setSelectedClass(currentUser.kelas.toString());
    }
  }, [currentUser]);

  // ✅ LOAD STUDENTS WHEN CLASS SELECTED
  useEffect(() => {
    if (selectedClass && selectedSemester) {
      loadStudents();
    }
  }, [selectedClass, selectedSemester, selectedDate]);

  // ✅ LOAD STUDENTS
  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading students for class:", selectedClass);

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("kelas", parseInt(selectedClass))
        .eq("is_active", true)
        .order("nama_siswa", { ascending: true });

      if (error) throw error;

      console.log("✅ Students loaded:", data?.length || 0);
      setStudents(data || []);

      // Load existing attendance for selected date
      await loadExistingAttendance(data || []);
    } catch (error) {
      console.error("❌ Error loading students:", error);
      showToast("Gagal memuat data siswa: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOAD EXISTING ATTENDANCE - DENGAN SEMESTER
  const loadExistingAttendance = async (studentsList) => {
    try {
      const semesterData = await getSemesterById(selectedSemester);
      if (!semesterData) return;

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("kelas", parseInt(selectedClass))
        .eq("tanggal", selectedDate)
        .eq("tahun_ajaran", semesterData.year)
        .eq("semester", semesterData.semester);

      if (error) throw error;

      // Map existing attendance to state
      const attendanceMap = {};
      data?.forEach((record) => {
        attendanceMap[record.nisn] = {
          status: record.status,
          keterangan: record.keterangan || "",
        };
      });

      // Initialize attendance data for all students
      const initialData = {};
      studentsList.forEach((student) => {
        initialData[student.nisn] = attendanceMap[student.nisn] || {
          status: "Hadir",
          keterangan: "",
        };
      });

      setAttendanceData(initialData);
      console.log("✅ Existing attendance loaded");
    } catch (error) {
      console.error("❌ Error loading existing attendance:", error);
    }
  };

  // ✅ UPDATE STATUS
  const updateStatus = (nisn, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [nisn]: {
        ...prev[nisn],
        status,
      },
    }));
  };

  // ✅ UPDATE KETERANGAN
  const updateKeterangan = (nisn, keterangan) => {
    setAttendanceData((prev) => ({
      ...prev,
      [nisn]: {
        ...prev[nisn],
        keterangan,
      },
    }));
  };

  // ✅ MARK ALL PRESENT
  const markAllPresent = () => {
    const newData = {};
    students.forEach((student) => {
      newData[student.nisn] = {
        status: "Hadir",
        keterangan: "",
      };
    });
    setAttendanceData(newData);
    showToast("✅ Semua siswa ditandai HADIR", "success");
  };

  // ✅ SAVE ATTENDANCE - FIXED DUPLICATE PREVENTION
  const saveAttendance = async () => {
    // ✅ PREVENT DOUBLE CLICK
    if (saving) {
      console.log("⚠️ Save already in progress, ignoring click");
      return;
    }

    try {
      setSaving(true);

      if (!selectedSemester || !selectedClass || !selectedDate) {
        showToast("⚠️ Lengkapi semester, kelas, dan tanggal", "error");
        return;
      }

      const semesterData = await getSemesterById(selectedSemester);
      if (!semesterData) {
        showToast("⚠️ Semester tidak ditemukan", "error");
        return;
      }

      console.log("💾 Saving attendance...");

      // ✅ CEK APAKAH SUDAH ADA DATA SEBELUMNYA
      const { data: existingData, error: checkError } = await supabase
        .from("attendance")
        .select("id, nisn")
        .eq("tanggal", selectedDate)
        .eq("kelas", parseInt(selectedClass))
        .eq("semester", semesterData.semester)
        .eq("tahun_ajaran", semesterData.year)
        .eq("jenis_presensi", "kelas"); // ✅ TAMBAH INI!

      if (checkError) throw checkError;

      const isUpdate = existingData && existingData.length > 0;

      // ✅ KONFIRMASI JIKA DATA SUDAH ADA
      if (isUpdate) {
        const confirmUpdate = window.confirm(
          `⚠️ Presensi untuk tanggal ${selectedDate} sudah ada!\n\n` +
            `Ditemukan ${existingData.length} data presensi.\n\n` +
            `Apakah Anda yakin ingin MEMPERBARUI data presensi?`
        );

        if (!confirmUpdate) {
          showToast("❌ Penyimpanan dibatalkan", "info");
          return;
        }

        // ✅ DELETE OLD DATA FIRST (prevent duplicates)
        const { error: deleteError } = await supabase
          .from("attendance")
          .delete()
          .eq("tanggal", selectedDate)
          .eq("kelas", parseInt(selectedClass))
          .eq("semester", semesterData.semester)
          .eq("tahun_ajaran", semesterData.year)
          .eq("jenis_presensi", "kelas");

        if (deleteError) throw deleteError;
        console.log("🗑️ Old attendance data deleted");
      }

      // ✅ Prepare data
      const dataToSave = students.map((student) => ({
        tanggal: selectedDate,
        nisn: student.nisn,
        nama_siswa: student.nama_siswa,
        kelas: parseInt(selectedClass),
        status: attendanceData[student.nisn]?.status || "Hadir",
        keterangan: attendanceData[student.nisn]?.keterangan || "",
        guru_input: currentUser?.username || "system",
        jenis_presensi: "kelas",
        tahun_ajaran: semesterData.year,
        semester: semesterData.semester,
        created_at: new Date().toISOString(),
      }));

      // ✅ INSERT NEW DATA (not upsert!)
      const { error: insertError } = await supabase
        .from("attendance")
        .insert(dataToSave);

      if (insertError) throw insertError;

      // ✅ NOTIFIKASI BERBEDA UNTUK INSERT vs UPDATE
      if (isUpdate) {
        showToast(
          `✅ Presensi ${students.length} siswa berhasil DIPERBARUI untuk tanggal ${selectedDate}!`,
          "success"
        );
        console.log("✅ Attendance UPDATED successfully");
      } else {
        showToast(
          `✅ Presensi ${students.length} siswa berhasil DISIMPAN untuk tanggal ${selectedDate}!`,
          "success"
        );
        console.log("✅ Attendance SAVED successfully");
      }

      // ✅ RELOAD DATA SETELAH SIMPAN
      await loadExistingAttendance(students);
    } catch (error) {
      console.error("❌ Error saving attendance:", error);
      showToast("❌ Gagal menyimpan presensi: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ✅ HELPER: Show toast
  const showToast = (message, type = "info") => {
    if (onShowToast) {
      onShowToast(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  };

  // ✅ STATUS OPTIONS
  const statusOptions = [
    { value: "Hadir", label: "Hadir", color: "green" },
    { value: "Sakit", label: "Sakit", color: "yellow" },
    { value: "Izin", label: "Izin", color: "blue" },
    { value: "Alpa", label: "Alpa", color: "red" },
  ];

  return (
    <div className="space-y-4">
      {/* FILTER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Semester */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}>
            Semester
          </label>
          <select
            value={selectedSemester}
            disabled
            className={`w-full px-4 py-3 rounded-lg border-2 font-medium ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-gray-100 border-gray-300 text-gray-700"
            } cursor-not-allowed`}>
            {availableSemesters?.map((sem) => (
              <option key={sem.id} value={sem.id}>
                Semester {sem.semester === 1 ? "Ganjil" : "Genap"}
              </option>
            ))}
          </select>
        </div>

        {/* Kelas */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}>
            Kelas
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={currentUser?.role === "guru_kelas"}
            className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white focus:border-red-500"
                : "bg-white border-gray-300 text-gray-900 focus:border-red-500"
            } ${
              currentUser?.role === "guru_kelas"
                ? "cursor-not-allowed opacity-75"
                : ""
            }`}>
            <option value="">Pilih Kelas</option>
            {[1, 2, 3, 4, 5, 6].map((kelas) => (
              <option key={kelas} value={kelas}>
                Kelas {kelas}
              </option>
            ))}
          </select>
        </div>

        {/* Tanggal */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}>
            Tanggal
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white focus:border-red-500"
                : "bg-white border-gray-300 text-gray-900 focus:border-red-500"
            }`}
          />
        </div>
      </div>

      {/* STATS CARDS */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-lg ${
              darkMode
                ? "bg-green-900/30 border border-green-800"
                : "bg-green-50 border border-green-200"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-medium ${
                    darkMode ? "text-green-300" : "text-green-600"
                  }`}>
                  Hadir
                </p>
                <p
                  className={`text-2xl font-bold ${
                    darkMode ? "text-green-400" : "text-green-700"
                  }`}>
                  {
                    Object.values(attendanceData).filter(
                      (a) => a?.status === "Hadir"
                    ).length
                  }
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${
              darkMode
                ? "bg-yellow-900/30 border border-yellow-800"
                : "bg-yellow-50 border border-yellow-200"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-medium ${
                    darkMode ? "text-yellow-300" : "text-yellow-600"
                  }`}>
                  Sakit
                </p>
                <p
                  className={`text-2xl font-bold ${
                    darkMode ? "text-yellow-400" : "text-yellow-700"
                  }`}>
                  {
                    Object.values(attendanceData).filter(
                      (a) => a?.status === "Sakit"
                    ).length
                  }
                </p>
              </div>
              <div className="text-3xl">🤒</div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${
              darkMode
                ? "bg-blue-900/30 border border-blue-800"
                : "bg-blue-50 border border-blue-200"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-medium ${
                    darkMode ? "text-blue-300" : "text-blue-600"
                  }`}>
                  Izin
                </p>
                <p
                  className={`text-2xl font-bold ${
                    darkMode ? "text-blue-400" : "text-blue-700"
                  }`}>
                  {
                    Object.values(attendanceData).filter(
                      (a) => a?.status === "Izin"
                    ).length
                  }
                </p>
              </div>
              <div className="text-3xl">📝</div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${
              darkMode
                ? "bg-red-900/30 border border-red-800"
                : "bg-red-50 border border-red-200"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-medium ${
                    darkMode ? "text-red-300" : "text-red-600"
                  }`}>
                  Alpa
                </p>
                <p
                  className={`text-2xl font-bold ${
                    darkMode ? "text-red-400" : "text-red-700"
                  }`}>
                  {
                    Object.values(attendanceData).filter(
                      (a) => a?.status === "Alpa"
                    ).length
                  }
                </p>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH & ACTION BUTTONS */}
      {students.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Cari siswa..."
              className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-red-500"
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={markAllPresent}
              disabled={saving || loading}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}>
              ✅ Hadir Semua
            </button>
            <button
              onClick={saveAttendance}
              disabled={saving || loading}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                darkMode
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}>
              {saving ? "⏳ Menyimpan..." : "💾 Simpan Presensi"}
            </button>
          </div>
        </div>
      )}

      {/* STUDENTS LIST */}
      {loading ? (
        <div className="text-center py-12">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
              darkMode ? "border-red-400" : "border-red-600"
            }`}></div>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Memuat data siswa...
          </p>
        </div>
      ) : students.length === 0 ? (
        <div
          className={`text-center py-12 rounded-lg border-2 border-dashed ${
            darkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-300 bg-gray-50"
          }`}>
          <div className="text-6xl mb-4">📋</div>
          <h3
            className={`text-lg font-semibold mb-2 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}>
            {!selectedClass
              ? "Pilih kelas untuk memuat data siswa"
              : "Tidak ada siswa di kelas ini"}
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <table
              className={`min-w-full ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}>
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    NISN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  darkMode ? "divide-gray-700" : "divide-gray-200"
                }`}>
                {filteredStudents.map((student, index) => (
                  <tr
                    key={student.nisn}
                    className={
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                      {student.nisn}
                    </td>
                    <td className="px-4 py-3 text-sm">{student.nama_siswa}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              updateStatus(student.nisn, option.value)
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              attendanceData[student.nisn]?.status ===
                              option.value
                                ? option.color === "green"
                                  ? "bg-green-500 text-white"
                                  : option.color === "yellow"
                                  ? "bg-yellow-500 text-white"
                                  : option.color === "blue"
                                  ? "bg-blue-500 text-white"
                                  : "bg-red-500 text-white"
                                : darkMode
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={attendanceData[student.nisn]?.keterangan || ""}
                        onChange={(e) =>
                          updateKeterangan(student.nisn, e.target.value)
                        }
                        placeholder="Keterangan (opsional)"
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Only on Mobile */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((student, index) => (
              <div
                key={student.nisn}
                className={`p-4 rounded-lg border-2 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                        #{index + 1}
                      </span>
                      <span
                        className={`text-xs font-mono ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                        {student.nisn}
                      </span>
                    </div>
                    <h4
                      className={`font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}>
                      {student.nama_siswa}
                    </h4>
                  </div>
                </div>

                {/* Status Buttons - 2x2 Grid */}
                <div className="mb-3">
                  <label
                    className={`block text-xs font-medium mb-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Status Kehadiran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateStatus(student.nisn, option.value)}
                        className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                          attendanceData[student.nisn]?.status === option.value
                            ? option.color === "green"
                              ? "bg-green-500 text-white shadow-lg"
                              : option.color === "yellow"
                              ? "bg-yellow-500 text-white shadow-lg"
                              : option.color === "blue"
                              ? "bg-blue-500 text-white shadow-lg"
                              : "bg-red-500 text-white shadow-lg"
                            : darkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keterangan */}
                <div>
                  <label
                    className={`block text-xs font-medium mb-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={attendanceData[student.nisn]?.keterangan || ""}
                    onChange={(e) =>
                      updateKeterangan(student.nisn, e.target.value)
                    }
                    placeholder="Tambahkan keterangan..."
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
