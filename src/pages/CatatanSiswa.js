import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  Edit,
  X,
  Loader2,
  ArrowLeft,
  WifiOff,
  RefreshCw,
  BookOpen,
  User,
  Filter,
  Calendar,
  School,
} from "lucide-react";
import ExportCatatanSiswa from "./ExportCatatanSiswa";

// ===== PWA OFFLINE IMPORTS =====
import {
  saveWithSync,
  syncPendingData,
  getDataWithFallback,
} from "../offlineSync";
import { useSyncStatus } from "../hooks/useSyncStatus";
import SyncStatusBadge from "../components/SyncStatusBadge";
// ===============================

const CatatanSiswa = ({ userData }) => {
  // ===== STATE MANAGEMENT =====
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [siswaList, setSiswaList] = useState([]);
  const [catatanList, setCatatanList] = useState([]);

  // Statistik dashboard
  const [stats, setStats] = useState({
    totalSiswa: 0,
    progressPositif: 0,
    perluPerhatian: 0,
    catatanBiasa: 0,
  });

  // Data form catatan
  const [formData, setFormData] = useState({
    student_id: "",
    category: "",
    label: "",
    note_content: "",
    action_taken: "",
  });

  const [editingNote, setEditingNote] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  // Settings akademik
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [semester, setSemester] = useState("Ganjil");
  const [message, setMessage] = useState({ text: "", type: "" });

  const kategoris = ["Akademik", "Perilaku", "Sosial", "Karakter", "Kesehatan"];

  // Cek role user
  const isAdmin =
    userData?.role === "admin" || userData?.role === "administrator";

  // ===== PWA: Sync Status Hook =====
  const { isOnline, pendingCount, isSyncing } = useSyncStatus();

  // ===== EFFECTS & LIFECYCLE =====
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingData()
        .then(() => {
          console.log("✅ Auto-sync completed");
          showMessage("Data berhasil disinkronkan!", "success");
        })
        .catch((err) => {
          console.error("❌ Auto-sync failed:", err);
        });
    }
  }, [isOnline, pendingCount]);

  useEffect(() => {
    if (userData?.id) {
      console.log("🔄 Loading settings...");
      initializeSettings();
    }
  }, [userData?.id]);

  useEffect(() => {
    if (userData?.id && academicYear && semester) {
      console.log("📚 Loading students with:", { academicYear, semester });
      loadStudents();
    }
  }, [userData?.id, academicYear, semester]);

  // ===== UTILITY FUNCTIONS =====
  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const initializeSettings = async () => {
    try {
      console.log("🔧 Initializing settings for user:", userData.username);

      const { data: tahunAjaranData, error: tahunError } = await supabase
        .from("school_settings")
        .select("setting_value")
        .eq("setting_key", "tahun_ajaran")
        .maybeSingle();

      const { data: semesterData, error: semesterError } = await supabase
        .from("school_settings")
        .select("setting_value")
        .eq("setting_key", "semester")
        .maybeSingle();

      if (!tahunError && tahunAjaranData?.setting_value) {
        console.log("📅 Tahun Ajaran:", tahunAjaranData.setting_value);
        setAcademicYear(tahunAjaranData.setting_value);
      } else {
        console.log("📅 Using default Tahun Ajaran: 2025/2026");
      }

      if (!semesterError && semesterData?.setting_value) {
        console.log("📅 Semester:", semesterData.setting_value);
        setSemester(semesterData.setting_value);
      } else {
        console.log("📅 Using default Semester: Ganjil");
      }
    } catch (error) {
      console.error("❌ Error initializing settings:", error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log("📚 Loading students...");
      console.log("👤 User role:", userData.role);
      console.log("🏫 User kelas:", userData.kelas);
      console.log("📅 Academic Year:", academicYear);
      console.log("📅 Semester:", semester);

      let query = supabase
        .from("students")
        .select("id, nisn, nama_siswa, kelas, is_active")
        .eq("is_active", true)
        .order("nama_siswa", { ascending: true });

      if (!isAdmin && userData.kelas) {
        const kelasArray = userData.kelas.split(",").map((k) => k.trim());
        query = query.in("kelas", kelasArray);
        console.log(`🔍 Filter kelas array:`, kelasArray);
      } else if (isAdmin) {
        console.log("👑 Admin mode - Load all students");
      }

      const { data: siswaData, error: siswaError } = await query;

      if (siswaError) {
        console.error("❌ Error loading students:", siswaError);
        throw siswaError;
      }

      console.log(`✅ Loaded ${siswaData?.length || 0} students`);

      if (siswaData && siswaData.length > 0) {
        console.log("📋 Available classes:", [
          ...new Set(siswaData.map((s) => s.kelas)),
        ]);

        const processedStudents = await Promise.all(
          siswaData.map(async (siswa) => {
            const catatanData = await getDataWithFallback(
              "student_notes",
              (query) =>
                query
                  .eq("student_id", siswa.id)
                  .eq("academic_year", academicYear)
                  .eq("semester", semester)
            );

            const positif =
              catatanData?.filter((c) => c.label === "positif").length || 0;
            const perhatian =
              catatanData?.filter((c) => c.label === "perhatian").length || 0;
            const netral =
              catatanData?.filter((c) => c.label === "netral").length || 0;

            const lastNote =
              catatanData?.length > 0
                ? catatanData.reduce((latest, current) =>
                    new Date(current.created_at) > new Date(latest.created_at)
                      ? current
                      : latest
                  )
                : null;

            return {
              id: siswa.id,
              nama: siswa.nama_siswa || "Nama Tidak Ada",
              nisn: siswa.nisn,
              kelas: siswa.kelas,
              positif,
              perhatian,
              netral,
              lastUpdate: lastNote
                ? formatRelativeTime(lastNote.created_at)
                : "Belum ada catatan",
            };
          })
        );

        setSiswaList(processedStudents);

        setStats({
          totalSiswa: processedStudents.length,
          progressPositif: processedStudents.reduce(
            (sum, s) => sum + s.positif,
            0
          ),
          perluPerhatian: processedStudents.reduce(
            (sum, s) => sum + s.perhatian,
            0
          ),
          catatanBiasa: processedStudents.reduce((sum, s) => sum + s.netral, 0),
        });
        console.log("✅ Students processed successfully");
      } else {
        console.warn("⚠️ No students found");
        setSiswaList([]);
        setStats({
          totalSiswa: 0,
          progressPositif: 0,
          perluPerhatian: 0,
          catatanBiasa: 0,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Error in loadStudents:", error);
      setLoading(false);
    }
  };

  const loadStudentNotes = async (studentId) => {
    try {
      setLoading(true);
      console.log("📖 Loading notes for student:", studentId);

      let filterFunc = (query) => {
        let q = query
          .eq("student_id", studentId)
          .eq("academic_year", academicYear)
          .eq("semester", semester)
          .order("created_at", { ascending: false });

        if (!isAdmin) {
          q = q.eq("teacher_id", userData.id);
        }

        return q;
      };

      const notesData = await getDataWithFallback("student_notes", filterFunc);

      const notesWithTeachers = await Promise.all(
        (notesData || []).map(async (note) => {
          if (note.teacher_id) {
            const { data: teacher } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", note.teacher_id)
              .single();
            return { ...note, teacher_name: teacher?.full_name || "Guru" };
          }
          return { ...note, teacher_name: "Guru" };
        })
      );

      setCatatanList(notesWithTeachers);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error loading notes:", error);
      setLoading(false);
    }
  };

  // ===== CRUD OPERATIONS =====
  const handleCreateNote = async (e) => {
    e.preventDefault();

    if (isAdmin) {
      showMessage("Admin tidak dapat membuat catatan", "error");
      return;
    }

    if (
      !formData.student_id ||
      !formData.category ||
      !formData.label ||
      !formData.note_content
    ) {
      showMessage("Harap lengkapi semua field yang wajib diisi", "error");
      return;
    }

    if (formData.note_content.length < 10) {
      showMessage("Isi catatan minimal 10 karakter", "error");
      return;
    }

    setLoading(true);
    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("kelas")
        .eq("id", formData.student_id)
        .single();

      if (studentError || !student) {
        throw new Error("Data siswa tidak ditemukan");
      }

      const noteData = {
        student_id: formData.student_id,
        teacher_id: userData.id,
        class_id: student.kelas,
        academic_year: academicYear,
        semester: semester,
        category: formData.category,
        label: formData.label,
        note_content: formData.note_content.trim(),
        action_taken: formData.action_taken?.trim() || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("📝 Data yang dikirim:", noteData);

      const result = await saveWithSync("student_notes", [noteData]);

      if (result.success) {
        if (result.synced) {
          showMessage("✅ Catatan berhasil disimpan!", "success");
        } else {
          showMessage(
            "💾 Catatan disimpan offline. Akan disinkronkan saat online.",
            "offline"
          );
        }

        setFormData({
          student_id: "",
          category: "",
          label: "",
          note_content: "",
          action_taken: "",
        });

        await loadStudents();
        setActiveView("dashboard");
      } else {
        throw new Error(result.error || "Gagal menyimpan catatan");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      showMessage("Gagal menyimpan: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();

    if (isAdmin) {
      showMessage("Admin tidak dapat mengedit catatan", "error");
      return;
    }

    setLoading(true);
    try {
      const updates = {
        id: editingNote.id,
        student_id: formData.student_id,
        teacher_id: userData.id,
        class_id: editingNote.class_id,
        academic_year: editingNote.academic_year,
        semester: editingNote.semester,
        category: formData.category,
        label: formData.label,
        note_content: formData.note_content.trim(),
        action_taken: formData.action_taken?.trim() || null,
        created_at: editingNote.created_at,
        updated_at: new Date().toISOString(),
      };

      const result = await saveWithSync("student_notes", [updates], {
        updateById: editingNote.id,
      });

      if (result.success) {
        if (result.synced) {
          showMessage("✅ Catatan berhasil diupdate!", "success");
        } else {
          showMessage(
            "💾 Perubahan disimpan offline. Akan disinkronkan saat online.",
            "offline"
          );
        }

        setEditingNote(null);
        setFormData({
          student_id: "",
          category: "",
          label: "",
          note_content: "",
          action_taken: "",
        });

        await loadStudentNotes(selectedSiswa.id);
        await loadStudents();
        setActiveView("detail");
      } else {
        throw new Error(result.error || "Gagal update catatan");
      }
    } catch (error) {
      console.error("❌ Error updating note:", error);
      showMessage("Gagal update catatan: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    setIsDeleteModalOpen(false);
    if (!noteToDelete) return;

    setLoading(true);
    try {
      const result = await saveWithSync("student_notes", [], {
        deleteById: noteToDelete,
      });

      if (result.success) {
        if (result.synced) {
          showMessage("✅ Catatan berhasil dihapus!", "success");
        } else {
          showMessage(
            "💾 Penghapusan disimpan offline. Akan disinkronkan saat online.",
            "offline"
          );
        }

        await loadStudentNotes(selectedSiswa.id);
        await loadStudents();
      } else {
        throw new Error(result.error || "Gagal menghapus catatan");
      }
    } catch (error) {
      console.error("❌ Error deleting note:", error);
      showMessage("Gagal menghapus catatan: " + error.message, "error");
    } finally {
      setLoading(false);
      setNoteToDelete(null);
    }
  };

  // ===== UI HELPER FUNCTIONS =====
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "1 hari lalu";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    return `${Math.floor(diffDays / 30)} bulan lalu`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLabelIcon = (label) => {
    switch (label) {
      case "positif":
        return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case "perhatian":
        return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Info className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const getLabelBadge = (label) => {
    switch (label) {
      case "positif":
        return "bg-green-100 text-green-800 border-green-200";
      case "perhatian":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      Akademik: "Perkembangan belajar, nilai, tugas, pemahaman materi",
      Perilaku: "Sikap, kedisiplinan, tanggung jawab, sopan santun",
      Sosial: "Interaksi dengan teman, kerja kelompok, komunikasi",
      Karakter: "Kejujuran, empati, leadership, resilience",
      Kesehatan: "Kondisi fisik, kehadiran, masalah kesehatan",
    };
    return descriptions[category] || "Catatan perkembangan siswa";
  };

  // ===== EVENT HANDLERS =====
  const handleAddNote = () => {
    if (isAdmin) {
      showMessage("Admin tidak dapat membuat catatan", "error");
      return;
    }
    if (siswaList.length === 0) {
      showMessage(
        "Tidak ada data siswa. Pastikan ada siswa di kelas Anda.",
        "error"
      );
      return;
    }
    setFormData({
      student_id: "",
      category: "",
      label: "",
      note_content: "",
      action_taken: "",
    });
    setEditingNote(null);
    setActiveView("form");
  };

  const handleViewDetail = async (siswa) => {
    setSelectedSiswa(siswa);
    setActiveView("detail");
    await loadStudentNotes(siswa.id);
  };

  const handleEditNote = (catatan) => {
    if (isAdmin) {
      showMessage("Admin tidak dapat mengedit catatan", "error");
      return;
    }
    setEditingNote(catatan);
    setFormData({
      student_id: catatan.student_id,
      category: catatan.category,
      label: catatan.label,
      note_content: catatan.note_content,
      action_taken: catatan.action_taken || "",
    });
    setActiveView("form");
  };

  const filteredSiswa = siswaList.filter(
    (siswa) =>
      siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siswa.nisn.includes(searchTerm) ||
      siswa.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== RENDER COMPONENTS =====
  const renderDeleteModal = () => {
    if (!isDeleteModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl">
          <div className="flex justify-between items-center mb-3 sm:mb-4 pb-2 sm:pb-3 border-b">
            <h3 className="text-base sm:text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Konfirmasi Hapus Catatan</span>
              <span className="sm:hidden">Hapus Catatan?</span>
            </h3>
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setNoteToDelete(null);
              }}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-700 mb-2 sm:mb-3">
              Anda yakin ingin menghapus catatan ini?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
              <p className="text-yellow-800 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setNoteToDelete(null);
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base">
              Batal
            </button>
            <button
              onClick={handleDeleteNote}
              disabled={loading || isSyncing}
              className="bg-red-600 text-white px-4 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm sm:text-base">
              {loading || isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Hapus Catatan
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-4 sm:space-y-6">
      <SyncStatusBadge />

      {message.text && (
        <div
          className={`p-3 sm:p-4 rounded-lg border text-sm sm:text-base ${
            message.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : message.type === "offline"
              ? "bg-orange-50 border-orange-200 text-orange-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}>
          <div className="flex items-center gap-2">
            {message.type === "error" ? (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            ) : message.type === "offline" ? (
              <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            )}
            <span className="break-words">{message.text}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">
              {isAdmin
                ? "Monitoring Catatan Siswa"
                : "Catatan Perkembangan Siswa"}
            </span>
            <span className="sm:hidden">Catatan Siswa</span>
          </h2>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
            <School className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate max-w-[120px] sm:max-w-none">
              {userData.kelas ? `Kelas ${userData.kelas}` : "Semua Kelas"}
            </span>
            <span>•</span>
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {academicYear} (Semester {semester})
            </span>
            <span className="sm:hidden">{semester}</span>
            {isAdmin && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                Admin
              </span>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <ExportCatatanSiswa
              siswaList={siswaList}
              catatanList={[]}
              selectedSiswa={null}
              academicYear={academicYear}
              semester={semester}
              userData={userData}
              currentView="dashboard"
            />
            <button
              onClick={handleAddNote}
              disabled={isSyncing}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base">
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className="hidden sm:inline">Tambah Catatan</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white p-3 sm:p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-600 text-xs sm:text-sm mb-1 flex items-center gap-1 sm:gap-2">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate">Total Siswa</span>
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">
            {stats.totalSiswa}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-600 text-xs sm:text-sm mb-1 flex items-center gap-1 sm:gap-2">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate hidden sm:inline">Catatan Positif</span>
            <span className="truncate sm:hidden">Positif</span>
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">
            {stats.progressPositif}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-xl shadow-sm border-l-4 border-red-500">
          <p className="text-gray-600 text-xs sm:text-sm mb-1 flex items-center gap-1 sm:gap-2">
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate hidden sm:inline">Perlu Perhatian</span>
            <span className="truncate sm:hidden">Perhatian</span>
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">
            {stats.perluPerhatian}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-xl shadow-sm border-l-4 border-gray-500">
          <p className="text-gray-600 text-xs sm:text-sm mb-1 flex items-center gap-1 sm:gap-2">
            <Info className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate hidden sm:inline">Catatan Biasa</span>
            <span className="truncate sm:hidden">Biasa</span>
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-600">
            {stats.catatanBiasa}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 sm:top-3 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari siswa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
            Memuat data siswa...
          </p>
        </div>
      ) : filteredSiswa.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-600 text-base sm:text-lg">
            {searchTerm
              ? "Tidak ada siswa yang sesuai dengan pencarian"
              : "Tidak ada data siswa"}
          </p>
          {!searchTerm && !isAdmin && (
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              Pastikan ada siswa di kelas {userData.kelas}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* MOBILE: Card View */}
          <div className="block lg:hidden divide-y divide-gray-200">
            {filteredSiswa.map((siswa) => (
              <div
                key={siswa.id}
                className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">
                      {siswa.nama}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {siswa.nisn} • {siswa.kelas}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDetail(siswa)}
                    className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-200 transition-colors text-xs ml-2 flex-shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                    Lihat
                  </button>
                </div>

                <div className="flex gap-2 text-xs">
                  {siswa.positif > 0 && (
                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      {siswa.positif}
                    </span>
                  )}
                  {siswa.perhatian > 0 && (
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-full">
                      <TrendingDown className="w-3 h-3" />
                      {siswa.perhatian}
                    </span>
                  )}
                  {siswa.netral > 0 && (
                    <span className="inline-flex items-center gap-1 text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded-full">
                      <Info className="w-3 h-3" />
                      {siswa.netral}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2">{siswa.lastUpdate}</p>
              </div>
            ))}
          </div>

          {/* DESKTOP: Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    NISN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Positif
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Perhatian
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Biasa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Update Terakhir
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSiswa.map((siswa) => (
                  <tr
                    key={siswa.id}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {siswa.nama}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{siswa.nisn}</td>
                    <td className="px-6 py-4 text-gray-600">{siswa.kelas}</td>
                    <td className="px-6 py-4 text-center">
                      {siswa.positif > 0 ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          {siswa.positif}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {siswa.perhatian > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-full">
                          <TrendingDown className="w-3 h-3" />
                          {siswa.perhatian}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {siswa.netral > 0 ? (
                        <span className="inline-flex items-center gap-1 text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded-full">
                          <Info className="w-3 h-3" />
                          {siswa.netral}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {siswa.lastUpdate}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewDetail(siswa)}
                        className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition-colors text-sm mx-auto">
                        <Eye className="w-4 h-4" />
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveView(editingNote ? "detail" : "dashboard")}
            className="bg-gray-100 text-gray-700 p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
              {editingNote ? "Edit Catatan" : "Tambah Catatan"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              {editingNote
                ? "Perbarui catatan perkembangan siswa"
                : "Buat catatan perkembangan siswa baru"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <form
          onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
          className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                Pilih Siswa <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
                required
                disabled={editingNote}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-colors text-sm sm:text-base">
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map((siswa) => (
                  <option key={siswa.id} value={siswa.id}>
                    {siswa.nama} - {siswa.kelas}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base">
                <option value="">-- Pilih Kategori --</option>
                {kategoris.map((kategori) => (
                  <option key={kategori} value={kategori}>
                    {kategori}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.category && (
            <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-700 flex items-start gap-2">
                <Info className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Kategori {formData.category}:</strong>{" "}
                  {getCategoryDescription(formData.category)}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Label Catatan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                {
                  value: "positif",
                  label: "Positif",
                  icon: CheckCircle,
                  color: "green",
                  desc: "Perkembangan baik & prestasi",
                },
                {
                  value: "perhatian",
                  label: "Perhatian",
                  icon: AlertCircle,
                  color: "red",
                  desc: "Perlu ditindaklanjuti",
                },
                {
                  value: "netral",
                  label: "Biasa",
                  icon: Info,
                  color: "gray",
                  desc: "Catatan rutin",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer rounded-lg border-2 p-3 sm:p-4 transition-all ${
                    formData.label === option.value
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}>
                  <input
                    type="radio"
                    name="label"
                    value={option.value}
                    checked={formData.label === option.value}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    className="sr-only"
                    required
                  />
                  <div className="flex items-center gap-2 sm:gap-3 w-full">
                    <div
                      className={`p-1.5 sm:p-2 rounded-full bg-${option.color}-100 flex-shrink-0`}>
                      <option.icon
                        className={`w-4 h-4 sm:w-5 sm:h-5 text-${option.color}-600`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {option.desc}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
              Isi Catatan <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-gray-500 ml-1">
                (Min. 10 karakter)
              </span>
            </label>
            <textarea
              value={formData.note_content}
              onChange={(e) =>
                setFormData({ ...formData, note_content: e.target.value })
              }
              required
              minLength="10"
              rows="5"
              placeholder="Tuliskan catatan perkembangan siswa..."
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
            />
            <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
              <span>Panjang: {formData.note_content.length}</span>
              {formData.note_content.length < 10 && (
                <span className="text-red-500">Minimal 10 karakter</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
              Tindakan <span className="text-gray-500">(Opsional)</span>
            </label>
            <textarea
              value={formData.action_taken}
              onChange={(e) =>
                setFormData({ ...formData, action_taken: e.target.value })
              }
              rows="3"
              placeholder="Tindakan yang sudah dilakukan..."
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
            <button
              type="button"
              onClick={() =>
                setActiveView(editingNote ? "detail" : "dashboard")
              }
              className="bg-gray-100 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isSyncing}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors flex-1 text-sm sm:text-base">
              {loading || isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  {isSyncing ? "Sync..." : "Menyimpan..."}
                </>
              ) : editingNote ? (
                "Update Catatan"
              ) : (
                "Simpan Catatan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDetail = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setActiveView("dashboard")}
            className="bg-gray-100 text-gray-700 p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">
              Catatan {selectedSiswa?.nama}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {selectedSiswa?.kelas} • {selectedSiswa?.nisn}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <ExportCatatanSiswa
            siswaList={siswaList}
            catatanList={catatanList}
            selectedSiswa={selectedSiswa}
            academicYear={academicYear}
            semester={semester}
            userData={userData}
            currentView="detail"
          />
          {!isAdmin && (
            <button
              onClick={handleAddNote}
              disabled={isSyncing}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Tambah Catatan</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="text-green-600 font-bold text-xl sm:text-2xl">
            {selectedSiswa?.positif || 0}
          </div>
          <div className="text-gray-600 text-xs sm:text-sm mt-1">
            <span className="hidden sm:inline">Catatan </span>Positif
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="text-red-600 font-bold text-xl sm:text-2xl">
            {selectedSiswa?.perhatian || 0}
          </div>
          <div className="text-gray-600 text-xs sm:text-sm mt-1">
            <span className="hidden sm:inline">Perlu </span>Perhatian
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="text-gray-600 font-bold text-xl sm:text-2xl">
            {selectedSiswa?.netral || 0}
          </div>
          <div className="text-gray-600 text-xs sm:text-sm mt-1">
            <span className="hidden sm:inline">Catatan </span>Biasa
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
            Memuat catatan...
          </p>
        </div>
      ) : catatanList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-600 text-base sm:text-lg">
            Belum ada catatan untuk siswa ini
          </p>
          {!isAdmin && (
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              Klik "Tambah Catatan" untuk membuat catatan pertama
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {catatanList.map((catatan) => (
            <div
              key={catatan.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getLabelBadge(
                        catatan.label
                      )}`}>
                      {getLabelIcon(catatan.label)}
                      <span className="hidden sm:inline">
                        {catatan.label === "positif"
                          ? "Positif"
                          : catatan.label === "perhatian"
                          ? "Perhatian"
                          : "Biasa"}
                      </span>
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      {catatan.category}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                    {formatDate(catatan.created_at)}
                    {catatan.teacher_name && (
                      <span className="ml-2">oleh {catatan.teacher_name}</span>
                    )}
                  </p>

                  <div className="prose max-w-none mb-3 sm:mb-4">
                    <p className="text-sm sm:text-base text-gray-800 whitespace-pre-line break-words">
                      {catatan.note_content}
                    </p>
                  </div>

                  {catatan.action_taken && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs sm:text-sm font-semibold text-blue-800 mb-1">
                        Tindakan:
                      </p>
                      <p className="text-xs sm:text-sm text-blue-700 whitespace-pre-line break-words">
                        {catatan.action_taken}
                      </p>
                    </div>
                  )}
                </div>

                {!isAdmin && (
                  <div className="flex lg:flex-col gap-2">
                    <button
                      onClick={() => handleEditNote(catatan)}
                      className="bg-yellow-100 text-yellow-700 p-2 rounded-lg hover:bg-yellow-200 transition-colors flex-1 lg:flex-none">
                      <Edit className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => {
                        setNoteToDelete(catatan.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors flex-1 lg:flex-none">
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {activeView === "dashboard" && renderDashboard()}
        {activeView === "form" && renderForm()}
        {activeView === "detail" && renderDetail()}
        {renderDeleteModal()}
      </div>
    </div>
  );
};

export default CatatanSiswa;
