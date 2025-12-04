import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Table,
  FileText,
} from "lucide-react";

const SystemTab = ({ user, loading, setLoading, showToast }) => {
  const [schoolSettings, setSchoolSettings] = useState({
    academic_year: "2025/2026",
    school_name: "SD Negeri 1 Pasir Pogor",
  });
  const [schoolStats, setSchoolStats] = useState({
    total_students: 0,
    total_teachers: 0,
  });
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      setLoading(true);

      // Load school settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value");

      if (settingsError) throw settingsError;

      if (settingsData && settingsData.length > 0) {
        const settings = {};
        settingsData.forEach((item) => {
          settings[item.setting_key] = item.setting_value;
        });
        setSchoolSettings((prev) => ({ ...prev, ...settings }));
      }

      // Load stats
      const [teachersRes, studentsRes] = await Promise.all([
        supabase
          .from("users")
          .select("id")
          .in("role", ["admin", "guru_kelas", "guru_mapel"]),
        supabase.from("students").select("id").eq("is_active", true),
      ]);

      if (teachersRes.error) throw teachersRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setSchoolStats({
        total_students: studentsRes.data?.length || 0,
        total_teachers: teachersRes.data?.length || 0,
      });
    } catch (error) {
      console.error("Error loading school data:", error);
      showToast("Error loading school data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi konversi JSON ke CSV - FIXED NULL HANDLING
  const convertToCSV = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return "";
    }

    // Pastikan data tidak null dan ada properti
    const validData = data.filter(
      (item) => item !== null && typeof item === "object"
    );
    if (validData.length === 0) return "";

    const headers = Object.keys(validData[0]);
    const csvHeaders = headers.join(",");

    const csvRows = validData.map((row) => {
      return headers
        .map((header) => {
          // Handle nilai yang null, undefined, atau mengandung koma/quote
          let value = row[header];
          if (value === null || value === undefined) {
            value = "";
          }
          value = String(value);
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          ) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    return [csvHeaders, ...csvRows].join("\n");
  };

  // Export tabel individual ke CSV
  const exportTableToCSV = async (tableName, displayName) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.from(tableName).select("*");

      if (error) throw error;

      if (!data || data.length === 0) {
        showToast(`Tidak ada data di tabel ${displayName}`, "warning");
        return;
      }

      const csvContent = convertToCSV(data);
      if (!csvContent) {
        showToast(`Data ${displayName} tidak valid untuk di-export`, "error");
        return;
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${schoolSettings.school_name?.replace(
        /\s+/g,
        "_"
      )}_${tableName}_${schoolSettings.academic_year.replace("/", "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`${displayName} berhasil di-export ke CSV!`, "success");
    } catch (error) {
      console.error(`Error exporting ${tableName}:`, error);
      showToast(`Error exporting ${displayName}: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Export semua tabel ke CSV
  const exportAllTablesToCSV = async () => {
    try {
      setLoading(true);

      const tables = [
        { name: "users", display: "Pengguna" },
        { name: "students", display: "Siswa" },
        { name: "attendance", display: "Kehadiran" },
        { name: "nilai", display: "Nilai" },
        { name: "siswa_baru", display: "Siswa Baru" },
        { name: "school_settings", display: "Pengaturan Sekolah" },
        { name: "announcement", display: "Pengumuman" },
        { name: "catatan_siswa", display: "Catatan Siswa" },
        { name: "system_health_logs", display: "System Health Logs" },
        { name: "class_schedules", display: "Jadwal Kelas" },
        { name: "cleanup_history", display: "Riwayat Cleanup" },
        // Tabel baru yang ditambahkan
        { name: "classes", display: "Kelas" },
        { name: "nilai_settings", display: "Pengaturan Nilai" },
        { name: "teacher_attendance", display: "Kehadiran Guru" },
      ];

      let exportedCount = 0;

      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table.name).select("*");

          if (error) {
            console.error(`Error fetching ${table.name}:`, error);
            continue;
          }

          if (data && data.length > 0) {
            const csvContent = convertToCSV(data);
            if (csvContent) {
              const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${schoolSettings.school_name?.replace(
                /\s+/g,
                "_"
              )}_${table.name}_${schoolSettings.academic_year.replace(
                "/",
                "_"
              )}_${new Date().toISOString().split("T")[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              exportedCount++;

              // Tunggu sebentar antara setiap export
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        } catch (tableError) {
          console.error(`Error exporting ${table.name}:`, tableError);
        }
      }

      if (exportedCount > 0) {
        showToast(
          `${exportedCount} tabel berhasil di-export ke CSV!`,
          "success"
        );
      } else {
        showToast("Tidak ada data untuk di-export", "warning");
      }
    } catch (error) {
      console.error("Error exporting all tables:", error);
      showToast("Error exporting data", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportDatabaseBackup = async () => {
    try {
      setLoading(true);

      const [
        usersRes,
        studentsRes,
        attendanceRes,
        nilaiRes,
        siswaBaruRes,
        schoolSettingsRes,
        announcementRes,
        catatanSiswaRes,
        systemHealthLogsRes,
        classSchedulesRes,
        cleanupHistoryRes,
        // Tabel baru yang ditambahkan
        classesRes,
        nilaiSettingsRes,
        teacherAttendanceRes,
      ] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("students").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("nilai").select("*"),
        supabase.from("siswa_baru").select("*"),
        supabase.from("school_settings").select("*"),
        supabase.from("announcement").select("*"),
        supabase.from("catatan_siswa").select("*"),
        supabase.from("system_health_logs").select("*"),
        supabase.from("class_schedules").select("*"),
        supabase.from("cleanup_history").select("*"),
        // Tabel baru yang ditambahkan
        supabase.from("classes").select("*"),
        supabase.from("nilai_settings").select("*"),
        supabase.from("teacher_attendance").select("*"),
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        academic_year: schoolSettings.academic_year,
        school_info: schoolSettings,
        data: {
          users: usersRes.data,
          students: studentsRes.data,
          attendance: attendanceRes.data,
          nilai: nilaiRes.data,
          siswa_baru: siswaBaruRes.data,
          school_settings: schoolSettingsRes.data,
          announcement: announcementRes.data,
          catatan_siswa: catatanSiswaRes.data,
          system_health_logs: systemHealthLogsRes.data,
          class_schedules: classSchedulesRes.data,
          cleanup_history: cleanupHistoryRes.data,
          // Tabel baru yang ditambahkan
          classes: classesRes.data,
          nilai_settings: nilaiSettingsRes.data,
          teacher_attendance: teacherAttendanceRes.data,
        },
        stats: {
          total_users: usersRes.data?.length || 0,
          total_students: studentsRes.data?.length || 0,
          total_attendance_records: attendanceRes.data?.length || 0,
          total_nilai_records: nilaiRes.data?.length || 0,
          total_siswa_baru: siswaBaruRes.data?.length || 0,
          total_announcements: announcementRes.data?.length || 0,
          total_catatan_siswa: catatanSiswaRes.data?.length || 0,
          total_system_health_logs: systemHealthLogsRes.data?.length || 0,
          total_class_schedules: classSchedulesRes.data?.length || 0,
          total_cleanup_history: cleanupHistoryRes.data?.length || 0,
          // Tabel baru yang ditambahkan
          total_classes: classesRes.data?.length || 0,
          total_nilai_settings: nilaiSettingsRes.data?.length || 0,
          total_teacher_attendance: teacherAttendanceRes.data?.length || 0,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${schoolSettings.school_name?.replace(
        /\s+/g,
        "_"
      )}_backup_${schoolSettings.academic_year.replace("/", "_")}_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("Database backup downloaded successfully!", "success");
    } catch (error) {
      console.error("Error creating backup:", error);
      showToast("Error creating database backup", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setRestoreFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          setRestorePreview({
            timestamp: backupData.timestamp,
            academic_year: backupData.academic_year,
            school_info: backupData.school_info,
            stats: backupData.stats,
          });
        } catch (error) {
          showToast("Invalid backup file format", "error");
          setRestoreFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const executeRestore = async () => {
    if (!restoreFile) return;

    const confirmed = window.confirm(
      `PERINGATAN: Restore akan menimpa semua data yang ada!\n\n` +
        `Backup dari: ${restorePreview.timestamp}\n` +
        `Academic Year: ${restorePreview.academic_year}\n\n` +
        `Tindakan ini TIDAK DAPAT DIBATALKAN. Apakah Anda yakin?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);

          // Hapus semua data yang ada
          await supabase.from("attendance").delete().neq("id", 0);
          await supabase.from("nilai").delete().neq("id", 0);
          await supabase.from("siswa_baru").delete().neq("id", 0);
          await supabase.from("students").delete().neq("id", 0);
          await supabase.from("users").delete().neq("id", 0);
          await supabase.from("school_settings").delete().neq("id", 0);
          await supabase.from("announcement").delete().neq("id", 0);
          await supabase.from("catatan_siswa").delete().neq("id", 0);
          await supabase.from("system_health_logs").delete().neq("id", 0);
          await supabase.from("class_schedules").delete().neq("id", 0);
          await supabase.from("cleanup_history").delete().neq("id", 0);
          // Tabel baru yang ditambahkan
          await supabase.from("classes").delete().neq("id", 0);
          await supabase.from("nilai_settings").delete().neq("id", 0);
          await supabase.from("teacher_attendance").delete().neq("id", 0);

          // Insert data baru dari backup
          if (backupData.data.school_settings?.length > 0) {
            await supabase
              .from("school_settings")
              .insert(backupData.data.school_settings);
          }

          if (backupData.data.users?.length > 0) {
            await supabase.from("users").insert(backupData.data.users);
          }

          if (backupData.data.students?.length > 0) {
            await supabase.from("students").insert(backupData.data.students);
          }

          if (backupData.data.attendance?.length > 0) {
            await supabase
              .from("attendance")
              .insert(backupData.data.attendance);
          }

          if (backupData.data.nilai?.length > 0) {
            await supabase.from("nilai").insert(backupData.data.nilai);
          }

          if (backupData.data.siswa_baru?.length > 0) {
            await supabase
              .from("siswa_baru")
              .insert(backupData.data.siswa_baru);
          }

          if (backupData.data.announcement?.length > 0) {
            await supabase
              .from("announcement")
              .insert(backupData.data.announcement);
          }

          if (backupData.data.catatan_siswa?.length > 0) {
            await supabase
              .from("catatan_siswa")
              .insert(backupData.data.catatan_siswa);
          }

          if (backupData.data.system_health_logs?.length > 0) {
            await supabase
              .from("system_health_logs")
              .insert(backupData.data.system_health_logs);
          }

          if (backupData.data.class_schedules?.length > 0) {
            await supabase
              .from("class_schedules")
              .insert(backupData.data.class_schedules);
          }

          if (backupData.data.cleanup_history?.length > 0) {
            await supabase
              .from("cleanup_history")
              .insert(backupData.data.cleanup_history);
          }

          // Tabel baru yang ditambahkan
          if (backupData.data.classes?.length > 0) {
            await supabase.from("classes").insert(backupData.data.classes);
          }

          if (backupData.data.nilai_settings?.length > 0) {
            await supabase
              .from("nilai_settings")
              .insert(backupData.data.nilai_settings);
          }

          if (backupData.data.teacher_attendance?.length > 0) {
            await supabase
              .from("teacher_attendance")
              .insert(backupData.data.teacher_attendance);
          }

          showToast("Database restored successfully!", "success");
          setRestoreFile(null);
          setRestorePreview(null);

          await loadSchoolData();
        } catch (error) {
          console.error("Error restoring backup:", error);
          showToast("Error restoring database: " + error.message, "error");
        } finally {
          setLoading(false);
        }
      };

      reader.readAsText(restoreFile);
    } catch (error) {
      console.error("Error reading restore file:", error);
      showToast("Error reading backup file", "error");
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        System Management
      </h2>

      {/* Export Individual Tables to CSV */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Export Data ke CSV
        </h3>
        <p className="text-gray-600 mb-4">
          Export data per tabel ke format CSV untuk analisis atau backup
          selektif.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Baris 1 - 3 tombol */}
          <button
            onClick={() => exportTableToCSV("users", "Data Pengguna")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Users
          </button>

          <button
            onClick={() => exportTableToCSV("students", "Data Siswa")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Students
          </button>

          <button
            onClick={() => exportTableToCSV("attendance", "Data Kehadiran")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Attendance
          </button>

          {/* Baris 2 - 3 tombol */}
          <button
            onClick={() => exportTableToCSV("nilai", "Data Nilai")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Nilai
          </button>

          <button
            onClick={() => exportTableToCSV("siswa_baru", "Data Siswa Baru")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Siswa Baru
          </button>

          <button
            onClick={() =>
              exportTableToCSV("school_settings", "Pengaturan Sekolah")
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Settings
          </button>

          {/* Baris 3 - 3 tombol */}
          <button
            onClick={() => exportTableToCSV("announcement", "Pengumuman")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Pengumuman
          </button>

          <button
            onClick={() => exportTableToCSV("catatan_siswa", "Catatan Siswa")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Catatan Siswa
          </button>

          <button
            onClick={() =>
              exportTableToCSV("system_health_logs", "System Health Logs")
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export System Logs
          </button>

          {/* Baris 4 - 3 tombol */}
          <button
            onClick={() => exportTableToCSV("class_schedules", "Jadwal Kelas")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Jadwal Kelas
          </button>

          <button
            onClick={() =>
              exportTableToCSV("cleanup_history", "Riwayat Cleanup")
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Riwayat Cleanup
          </button>

          {/* Tabel baru yang ditambahkan - Baris 5 */}
          <button
            onClick={() => exportTableToCSV("classes", "Data Kelas")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Kelas
          </button>

          <button
            onClick={() =>
              exportTableToCSV("nilai_settings", "Pengaturan Nilai")
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Pengaturan Nilai
          </button>

          <button
            onClick={() =>
              exportTableToCSV("teacher_attendance", "Kehadiran Guru")
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 disabled:opacity-50 font-medium">
            <Table size={16} />
            Export Kehadiran Guru
          </button>

          {/* TOMBOL EXPORT SEMUA - BARIS TERPISAH */}
          <div className="col-span-full mt-4">
            <button
              onClick={exportAllTablesToCSV}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium text-base">
              <FileText size={20} />
              {loading
                ? "Exporting All Tables..."
                : "Export Semua Tabel (14 Tables)"}
            </button>
          </div>
        </div>
      </div>

      {/* Database Backup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Database Backup (JSON)
        </h3>
        <p className="text-gray-600 mb-4">
          Download backup lengkap database untuk keperluan keamanan dan migrasi
          data.
        </p>

        <button
          onClick={exportDatabaseBackup}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
          <Download size={18} />
          {loading ? "Membuat Backup..." : "Download Backup Database (JSON)"}
        </button>

        <div className="mt-4 text-xs text-gray-500">
          <p>Backup akan berisi semua data dari:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Data pengguna (users table)</li>
            <li>Data siswa (students table)</li>
            <li>Data kehadiran (attendance table)</li>
            <li>Data nilai (nilai table)</li>
            <li>Data siswa baru (siswa_baru table)</li>
            <li>Pengaturan sekolah (school_settings table)</li>
            <li>Pengumuman (announcement table)</li>
            <li>Catatan siswa (catatan_siswa table)</li>
            <li>System health logs (system_health_logs table)</li>
            <li>Jadwal kelas (class_schedules table)</li>
            <li>Riwayat cleanup (cleanup_history table)</li>
            <li>Data kelas (classes table)</li>
            <li>Pengaturan nilai (nilai_settings table)</li>
            <li>Kehadiran guru (teacher_attendance table)</li>
          </ul>
        </div>
      </div>

      {/* Database Restore */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Database Restore
        </h3>
        <p className="text-gray-600 mb-4">
          Upload dan restore backup database.{" "}
          <span className="text-red-600 font-medium">
            PERHATIAN: Ini akan menimpa semua data yang ada!
          </span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Backup File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {restorePreview && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle
                  className="text-yellow-600 flex-shrink-0 mt-0.5"
                  size={16}
                />
                <div>
                  <h4 className="font-medium text-yellow-800">
                    Backup File Preview
                  </h4>
                  <div className="text-sm text-yellow-700 mt-2 space-y-1">
                    <p>
                      <strong>Tanggal Backup:</strong>{" "}
                      {new Date(restorePreview.timestamp).toLocaleString()}
                    </p>
                    <p>
                      <strong>Academic Year:</strong>{" "}
                      {restorePreview.academic_year}
                    </p>
                    <p>
                      <strong>School:</strong>{" "}
                      {restorePreview.school_info?.school_name}
                    </p>
                    <p>
                      <strong>Data Records:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      <li>{restorePreview.stats?.total_users || 0} users</li>
                      <li>
                        {restorePreview.stats?.total_students || 0} students
                      </li>
                      <li>
                        {restorePreview.stats?.total_attendance_records || 0}{" "}
                        attendance records
                      </li>
                      <li>
                        {restorePreview.stats?.total_nilai_records || 0} nilai
                        records
                      </li>
                      <li>
                        {restorePreview.stats?.total_siswa_baru || 0} siswa baru
                        records
                      </li>
                      <li>
                        {restorePreview.stats?.total_announcements || 0}{" "}
                        pengumuman
                      </li>
                      <li>
                        {restorePreview.stats?.total_catatan_siswa || 0} catatan
                        siswa
                      </li>
                      <li>
                        {restorePreview.stats?.total_system_health_logs || 0}{" "}
                        system health logs
                      </li>
                      <li>
                        {restorePreview.stats?.total_class_schedules || 0}{" "}
                        jadwal kelas
                      </li>
                      <li>
                        {restorePreview.stats?.total_cleanup_history || 0}{" "}
                        riwayat cleanup
                      </li>
                      {/* Stats baru yang ditambahkan */}
                      <li>{restorePreview.stats?.total_classes || 0} kelas</li>
                      <li>
                        {restorePreview.stats?.total_nilai_settings || 0}{" "}
                        pengaturan nilai
                      </li>
                      <li>
                        {restorePreview.stats?.total_teacher_attendance || 0}{" "}
                        kehadiran guru
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={executeRestore}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
                  {loading ? (
                    <>
                      <RefreshCw
                        className="animate-spin inline mr-2"
                        size={16}
                      />
                      Restoring...
                    </>
                  ) : (
                    "Execute Restore"
                  )}
                </button>

                <button
                  onClick={() => {
                    setRestoreFile(null);
                    setRestorePreview(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Informasi Sistem
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Database
            </label>
            <p className="text-sm text-gray-600">Supabase PostgreSQL</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Records
            </label>
            <p className="text-sm text-gray-600">
              {schoolStats.total_students + schoolStats.total_teachers} users
              total
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <p className="text-sm text-gray-600">
              {schoolSettings.academic_year}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Name
            </label>
            <p className="text-sm text-gray-600">
              {schoolSettings.school_name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTab;
