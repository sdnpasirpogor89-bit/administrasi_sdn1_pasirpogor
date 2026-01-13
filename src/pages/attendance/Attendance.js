// Attendance.js - WITH CUSTOM CONFIRM DIALOG
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { getSemesterById } from "../../services/academicYearService";

// ✅ CUSTOM CONFIRM DIALOG COMPONENT
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  date,
  count,
  darkMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in zoom-in duration-200`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
            <svg
              className="w-6 h-6"
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
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Perbarui Presensi?
              </h3>
              <p className="text-white/90 text-sm mt-1">
                Data sudah ada untuk tanggal ini
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div
            className={`${
              darkMode ? "bg-gray-700/50" : "bg-gray-50"
            } rounded-xl p-4 space-y-3`}>
            <div className="flex items-center gap-3">
              <div
                className={`${
                  darkMode ? "bg-blue-900/50" : "bg-blue-100"
                } p-2 rounded-lg`}>
                <svg
                  className={`w-5 h-5 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p
                  className={`text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                  Tanggal
                </p>
                <p
                  className={`font-semibold ${
                    darkMode ? "text-gray-200" : "text-gray-700"
                  }`}>
                  {date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`${
                  darkMode ? "bg-purple-900/50" : "bg-purple-100"
                } p-2 rounded-lg`}>
                <svg
                  className={`w-5 h-5 ${
                    darkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <p
                  className={`text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                  Data Ditemukan
                </p>
                <p
                  className={`font-semibold ${
                    darkMode ? "text-gray-200" : "text-gray-700"
                  }`}>
                  {count} presensi
                </p>
              </div>
            </div>
          </div>

          <p
            className={`text-sm leading-relaxed ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}>
            Memperbarui akan mengganti semua data presensi yang sudah tersimpan
            dengan data baru.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-3 ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } font-semibold rounded-xl transition-colors`}>
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/30">
            Perbarui Data
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [semesterCache, setSemesterCache] = useState(null);

  // ✅ STATE UNTUK CONFIRM DIALOG
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  // ✅ FILTER STUDENTS (MEMOIZED)
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const search = searchTerm.toLowerCase();
    return students.filter(
      (student) =>
        student.nama_siswa?.toLowerCase().includes(search) ||
        student.nisn?.toString().includes(search)
    );
  }, [students, searchTerm]);

  // ✅ LOAD EXISTING ATTENDANCE
  const loadExistingAttendance = useCallback(async () => {
    if (!semesterCache || students.length === 0) return;

    try {
      console.log("📋 Loading attendance for:", selectedDate);

      const { data, error } = await supabase
        .from("attendance")
        .select("nisn, status, keterangan")
        .eq("kelas", parseInt(selectedClass))
        .eq("tanggal", selectedDate)
        .eq("tahun_ajaran", semesterCache.year)
        .eq("semester", semesterCache.semester);

      if (error) throw error;

      const attendanceMap = {};
      data?.forEach((record) => {
        attendanceMap[record.nisn] = {
          status: record.status,
          keterangan: record.keterangan || "",
        };
      });

      const initialData = {};
      students.forEach((student) => {
        initialData[student.nisn] = attendanceMap[student.nisn] || {
          status: "Hadir",
          keterangan: "",
        };
      });

      setAttendanceData(initialData);
      console.log("✅ Attendance loaded:", data?.length || 0, "records");
    } catch (error) {
      console.error("❌ Error loading attendance:", error);
      showToast("Gagal memuat data presensi: " + error.message, "error");
    }
  }, [semesterCache, students, selectedClass, selectedDate]);

  // ✅ AUTO-SELECT CLASS FOR GURU KELAS
  useEffect(() => {
    if (currentUser?.role === "guru_kelas" && currentUser?.kelas) {
      setSelectedClass(currentUser.kelas.toString());
    }
  }, [currentUser]);

  // ✅ CACHE SEMESTER DATA
  useEffect(() => {
    if (selectedSemester) {
      getSemesterById(selectedSemester).then((data) => {
        setSemesterCache(data);
      });
    }
  }, [selectedSemester]);

  // ✅ LOAD STUDENTS
  useEffect(() => {
    if (selectedClass && selectedSemester) {
      loadStudents();
    } else {
      setStudents([]);
      setAttendanceData({});
    }
  }, [selectedClass, selectedSemester]);

  // ✅ LOAD ATTENDANCE
  useEffect(() => {
    if (students.length > 0 && selectedDate) {
      loadExistingAttendance();
    }
  }, [selectedDate, students.length, loadExistingAttendance]);

  // ✅ LOAD STUDENTS
  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log("📚 Loading students for class:", selectedClass);

      const { data, error } = await supabase
        .from("students")
        .select("nisn, nama_siswa, kelas")
        .eq("kelas", parseInt(selectedClass))
        .eq("is_active", true)
        .order("nama_siswa", { ascending: true });

      if (error) throw error;

      console.log("✅ Students loaded:", data?.length || 0);
      setStudents(data || []);
    } catch (error) {
      console.error("❌ Error loading students:", error);
      showToast("Gagal memuat data siswa: " + error.message, "error");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATE STATUS
  const updateStatus = useCallback((nisn, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [nisn]: {
        ...prev[nisn],
        status,
      },
    }));
  }, []);

  // ✅ UPDATE KETERANGAN
  const updateKeterangan = useCallback((nisn, keterangan) => {
    setAttendanceData((prev) => ({
      ...prev,
      [nisn]: {
        ...prev[nisn],
        keterangan,
      },
    }));
  }, []);

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

  // ✅ HANDLE CONFIRM UPDATE (DARI DIALOG)
  const handleConfirmUpdate = async () => {
    setShowConfirmDialog(false);
    if (pendingUpdate) {
      await performSave(pendingUpdate);
      setPendingUpdate(null);
    }
  };

  // ✅ HANDLE CANCEL UPDATE
  const handleCancelUpdate = () => {
    setShowConfirmDialog(false);
    setPendingUpdate(null);
    showToast("Penyimpanan dibatalkan", "info");
  };

  // ✅ PERFORM ACTUAL SAVE
  const performSave = async (updateInfo) => {
    try {
      const { isUpdate, existingData } = updateInfo;

      // DELETE OLD DATA IF UPDATE
      if (isUpdate) {
        const { error: deleteError } = await supabase
          .from("attendance")
          .delete()
          .eq("tanggal", selectedDate)
          .eq("kelas", parseInt(selectedClass))
          .eq("semester", semesterCache.semester)
          .eq("tahun_ajaran", semesterCache.year)
          .eq("jenis_presensi", "kelas");

        if (deleteError) throw deleteError;
        console.log("🗑️ Old data deleted");
      }

      // PREPARE DATA
      const dataToSave = students.map((student) => ({
        tanggal: selectedDate,
        nisn: student.nisn,
        nama_siswa: student.nama_siswa,
        kelas: parseInt(selectedClass),
        status: attendanceData[student.nisn]?.status || "Hadir",
        keterangan: attendanceData[student.nisn]?.keterangan || "",
        guru_input: currentUser?.username || "system",
        jenis_presensi: "kelas",
        tahun_ajaran: semesterCache.year,
        semester: semesterCache.semester,
        created_at: new Date().toISOString(),
      }));

      // INSERT NEW DATA
      const { error: insertError } = await supabase
        .from("attendance")
        .insert(dataToSave);

      if (insertError) throw insertError;

      showToast(
        `✅ Presensi ${students.length} siswa berhasil ${
          isUpdate ? "DIPERBARUI" : "DISIMPAN"
        }!`,
        "success"
      );

      console.log(`✅ Attendance ${isUpdate ? "UPDATED" : "SAVED"}`);
    } catch (error) {
      console.error("❌ Error saving:", error);
      showToast("❌ Gagal menyimpan: " + error.message, "error");
    }
  };

  // ✅ SAVE ATTENDANCE (DENGAN CUSTOM DIALOG)
  const saveAttendance = async () => {
    if (saving) {
      console.log("⚠️ Save already in progress");
      return;
    }

    if (!semesterCache) {
      showToast("⚠️ Data semester belum dimuat", "error");
      return;
    }

    try {
      setSaving(true);

      if (!selectedSemester || !selectedClass || !selectedDate) {
        showToast("⚠️ Lengkapi semester, kelas, dan tanggal", "error");
        return;
      }

      console.log("💾 Saving attendance...");

      // CHECK EXISTING DATA
      const { data: existingData, error: checkError } = await supabase
        .from("attendance")
        .select("id")
        .eq("tanggal", selectedDate)
        .eq("kelas", parseInt(selectedClass))
        .eq("semester", semesterCache.semester)
        .eq("tahun_ajaran", semesterCache.year)
        .eq("jenis_presensi", "kelas");

      if (checkError) throw checkError;

      const isUpdate = existingData && existingData.length > 0;

      // ✅ TAMPILKAN CUSTOM DIALOG KALAU UPDATE
      if (isUpdate) {
        setPendingUpdate({ isUpdate, existingData });
        setShowConfirmDialog(true);
        return; // Stop di sini, tunggu user action
      }

      // KALAU BUKAN UPDATE, LANGSUNG SIMPAN
      await performSave({ isUpdate: false, existingData: null });
    } catch (error) {
      console.error("❌ Error saving:", error);
      showToast("❌ Gagal menyimpan: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ✅ HELPER
  const showToast = (message, type = "info") => {
    if (onShowToast) {
      onShowToast(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  };

  const statusOptions = [
    { value: "Hadir", label: "Hadir", color: "green" },
    { value: "Sakit", label: "Sakit", color: "yellow" },
    { value: "Izin", label: "Izin", color: "blue" },
    { value: "Alpa", label: "Alpa", color: "red" },
  ];

  // ✅ STATS (MEMOIZED)
  const stats = useMemo(() => {
    return {
      hadir: Object.values(attendanceData).filter((a) => a?.status === "Hadir")
        .length,
      sakit: Object.values(attendanceData).filter((a) => a?.status === "Sakit")
        .length,
      izin: Object.values(attendanceData).filter((a) => a?.status === "Izin")
        .length,
      alpa: Object.values(attendanceData).filter((a) => a?.status === "Alpa")
        .length,
    };
  }, [attendanceData]);

  return (
    <div className="space-y-4">
      {/* ✅ CUSTOM CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelUpdate}
        onConfirm={handleConfirmUpdate}
        date={selectedDate}
        count={pendingUpdate?.existingData?.length || 0}
        darkMode={darkMode}
      />

      {/* FILTER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {stats.hadir}
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
                  {stats.sakit}
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
                  {stats.izin}
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
                  {stats.alpa}
                </p>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH & ACTIONS */}
      {students.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
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

      {/* LOADING STATE */}
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
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <table
              className={`min-w-full ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}>
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                    NISN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
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
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {student.nisn}
                    </td>
                    <td className="px-4 py-3 text-sm">{student.nama_siswa}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() =>
                              updateStatus(student.nisn, opt.value)
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              attendanceData[student.nisn]?.status === opt.value
                                ? opt.color === "green"
                                  ? "bg-green-500 text-white"
                                  : opt.color === "yellow"
                                  ? "bg-yellow-500 text-white"
                                  : opt.color === "blue"
                                  ? "bg-blue-500 text-white"
                                  : "bg-red-500 text-white"
                                : darkMode
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}>
                            {opt.label}
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
                        placeholder="Keterangan"
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((student, index) => (
              <div
                key={student.nisn}
                className={`p-4 rounded-lg border-2 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}>
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

                <div className="mb-3">
                  <label
                    className={`block text-xs font-medium mb-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateStatus(student.nisn, opt.value)}
                        className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                          attendanceData[student.nisn]?.status === opt.value
                            ? opt.color === "green"
                              ? "bg-green-500 text-white shadow-lg"
                              : opt.color === "yellow"
                              ? "bg-yellow-500 text-white shadow-lg"
                              : opt.color === "blue"
                              ? "bg-blue-500 text-white shadow-lg"
                              : "bg-red-500 text-white shadow-lg"
                            : darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

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
