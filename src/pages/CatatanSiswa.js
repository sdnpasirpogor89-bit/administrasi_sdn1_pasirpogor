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

/**
 * MODUL CATATAN PERKEMBANGAN SISWA
 *
 * FITUR UTAMA:
 * 1. 📊 Dashboard monitoring perkembangan siswa
 * 2. ✏️ Input catatan perkembangan dengan berbagai kategori
 * 3. 📱 Support offline mode (PWA)
 * 4. 👥 Role-based access (Admin & Guru)
 * 5. 📅 Filter berdasarkan tahun ajaran & semester
 *
 * CARA PENGGUNAAN:
 * - GURU: Bisa membuat, edit, hapus catatan untuk siswa di kelasnya
 * - ADMIN: Hanya bisa melihat/monitoring, tidak bisa edit/hapus
 * - OFFLINE: Data tersimpan lokal dan sync otomatis saat online
 *
 * DOKUMENTASI KATEGORI CATATAN:
 * 📚 AKADEMIK   : Perkembangan belajar, nilai, tugas, pemahaman materi
 * 🎭 PERILAKU   : Sikap, kedisiplinan, tanggung jawab, sopan santun
 * 👥 SOSIAL     : Interaksi dengan teman, kerja kelompok, komunikasi
 * 💪 KARAKTER   : Kejujuran, empati, leadership, resilience
 * 🏥 KESEHATAN  : Kondisi fisik, kehadiran, masalah kesehatan
 *
 * DOKUMENTASI LABEL:
 * ✅ POSITIF    : Perkembangan baik, pencapaian, prestasi, improvement
 * ⚠️ PERHATIAN  : Masalah yang perlu ditindaklanjuti, kendala, penurunan
 * 📝 BIASA      : Catatan rutin, observasi netral, informasi umum
 */

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

  /**
   * KATEGORI CATATAN - PENJELASAN:
   * - Akademik  : Berkaitan dengan pembelajaran, nilai, tugas
   * - Perilaku  : Sikap dan tingkah laku di sekolah
   * - Sosial    : Hubungan dengan teman dan lingkungan
   * - Karakter  : Nilai-nilai moral dan kepribadian
   * - Kesehatan : Kondisi fisik dan kehadiran
   */
  const kategoris = ["Akademik", "Perilaku", "Sosial", "Karakter", "Kesehatan"];

  // Cek role user
  const isAdmin =
    userData?.role === "admin" || userData?.role === "administrator";

  // ===== PWA: Sync Status Hook =====
  const { isOnline, pendingCount, isSyncing } = useSyncStatus();

  // ===== EFFECTS & LIFECYCLE =====

  /**
   * AUTO-SYNC SAAT ONLINE
   * Fitur: Otomatis sync data pending ketika koneksi kembali
   */
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

  /**
   * INISIALISASI SETTINGS
   * Load tahun ajaran dan semester dari database
   */
  useEffect(() => {
    if (userData?.id) {
      console.log("📄 Loading settings...");
      initializeSettings();
    }
  }, [userData?.id]);

  /**
   * LOAD DATA SISWA
   * Trigger ketika settings atau user berubah
   */
  useEffect(() => {
    if (userData?.id && academicYear && semester) {
      console.log("📚 Loading students with:", { academicYear, semester });
      loadStudents();
    }
  }, [userData?.id, academicYear, semester]);

  // ===== UTILITY FUNCTIONS =====

  /**
   * MENAMPILKAN PESAN FEEDBACK
   * @param {string} text - Teks pesan
   * @param {string} type - Tipe pesan: success, error, offline
   */
  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  /**
   * INISIALISASI SETTINGS SEKOLAH
   * Load tahun ajaran dan semester aktif
   */
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

  /**
   * LOAD DATA SISWA
   * Filter berdasarkan:
   * - Role guru: hanya siswa di kelasnya
   * - Role admin: semua siswa aktif
   */
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

      // Filter untuk guru (hanya kelas sendiri)
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

        // Process each student dengan catatannya
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

            // Hitung statistik per label
            const positif =
              catatanData?.filter((c) => c.label === "positif").length || 0;
            const perhatian =
              catatanData?.filter((c) => c.label === "perhatian").length || 0;
            const netral =
              catatanData?.filter((c) => c.label === "netral").length || 0;

            // Cari catatan terbaru
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

        // Update statistik dashboard
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

  /**
   * LOAD CATATAN SISWA SPESIFIK
   * @param {string} studentId - ID siswa yang akan dilihat catatannya
   */
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

        // Filter untuk guru (hanya catatan sendiri)
        if (!isAdmin) {
          q = q.eq("teacher_id", userData.id);
        }

        return q;
      };

      const notesData = await getDataWithFallback("student_notes", filterFunc);

      // Tambahkan nama guru pembuat catatan
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

  /**
   * BUAT CATATAN BARU
   * Validasi:
   * - Admin tidak bisa buat catatan
   * - Semua field wajib diisi (kecuali tindakan)
   */
  const handleCreateNote = async (e) => {
    e.preventDefault();

    // Validasi role
    if (isAdmin) {
      showMessage("Admin tidak dapat membuat catatan", "error");
      return;
    }

    // Validasi field wajib
    if (
      !formData.student_id ||
      !formData.category ||
      !formData.label ||
      !formData.note_content
    ) {
      showMessage("Harap lengkapi semua field yang wajib diisi", "error");
      return;
    }

    // Validasi panjang konten
    if (formData.note_content.length < 10) {
      showMessage("Isi catatan minimal 10 karakter", "error");
      return;
    }

    setLoading(true);
    try {
      // Ambil data siswa untuk mendapatkan kelas
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("kelas")
        .eq("id", formData.student_id)
        .single();

      if (studentError || !student) {
        throw new Error("Data siswa tidak ditemukan");
      }

      // Struktur data catatan
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

      // Simpan dengan sync offline
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

        // Reset form
        setFormData({
          student_id: "",
          category: "",
          label: "",
          note_content: "",
          action_taken: "",
        });

        // Reload data
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

  /**
   * UPDATE CATATAN YANG SUDAH ADA
   * Hanya bisa dilakukan oleh guru yang membuat catatan tersebut
   */
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

  /**
   * HAPUS CATATAN
   * Konfirmasi modal akan muncul sebelum penghapusan
   */
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

  /**
   * FORMAT WAKTU RELATIF
   * Contoh: "Hari ini", "2 hari lalu", "1 minggu lalu"
   */
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

  /**
   * FORMAT TANGGAL LENGKAP
   * Contoh: "25 Januari 2024, 14:30"
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * GET ICON UNTUK LABEL
   */
  const getLabelIcon = (label) => {
    switch (label) {
      case "positif":
        return <CheckCircle className="w-4 h-4" />;
      case "perhatian":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  /**
   * GET BADGE STYLE UNTUK LABEL
   */
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

  /**
   * GET DESKRIPSI KATEGORI UNTUK TOOLTIP/GUIDANCE
   */
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

  // Filter siswa berdasarkan pencarian
  const filteredSiswa = siswaList.filter(
    (siswa) =>
      siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siswa.nisn.includes(searchTerm) ||
      siswa.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== RENDER COMPONENTS =====

  /**
   * MODAL KONFIRMASI HAPUS
   */
  const renderDeleteModal = () => {
    if (!isDeleteModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Konfirmasi Hapus Catatan
            </h3>
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setNoteToDelete(null);
              }}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-3">
              Anda yakin ingin menghapus catatan ini?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setNoteToDelete(null);
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Batal
            </button>
            <button
              onClick={handleDeleteNote}
              disabled={loading || isSyncing}
              className="bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 transition-colors">
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

  /**
   * DASHBOARD VIEW - Tampilan utama
   */
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Sync Status */}
      <SyncStatusBadge />

      {/* Message Alert */}
      {message.text && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : message.type === "offline"
              ? "bg-orange-50 border-orange-200 text-orange-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}>
          <div className="flex items-center gap-2">
            {message.type === "error" ? (
              <AlertCircle size={20} />
            ) : message.type === "offline" ? (
              <WifiOff size={20} />
            ) : (
              <CheckCircle size={20} />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            {isAdmin
              ? "Monitoring Catatan Siswa"
              : "Catatan Perkembangan Siswa"}
          </h2>
          <div className="flex items-center gap-2 mt-2 text-gray-600">
            <School className="w-4 h-4" />
            <span>
              {userData.kelas ? `Kelas ${userData.kelas}` : "Semua Kelas"}
            </span>
            <span>•</span>
            <Calendar className="w-4 h-4" />
            <span>
              {academicYear} (Semester {semester})
            </span>
            {isAdmin && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                Mode Admin
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isAdmin && (
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
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
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors justify-center">
              {isSyncing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Tambah Catatan
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-1 flex items-center gap-2">
            <User className="w-4 h-4" />
            Total Siswa
          </p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalSiswa}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Catatan Positif
          </p>
          <p className="text-3xl font-bold text-green-600">
            {stats.progressPositif}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
          <p className="text-gray-600 text-sm mb-1 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Perlu Perhatian
          </p>
          <p className="text-3xl font-bold text-red-600">
            {stats.perluPerhatian}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-gray-500">
          <p className="text-gray-600 text-sm mb-1 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Catatan Biasa
          </p>
          <p className="text-3xl font-bold text-gray-600">
            {stats.catatanBiasa}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari siswa berdasarkan nama, NISN, atau kelas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Memuat data siswa...</p>
        </div>
      ) : filteredSiswa.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm
              ? "Tidak ada siswa yang sesuai dengan pencarian"
              : "Tidak ada data siswa"}
          </p>
          {!searchTerm && !isAdmin && (
            <p className="text-gray-500 text-sm mt-2">
              Pastikan ada siswa di kelas {userData.kelas}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
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
                        className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition-colors text-sm">
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

  /**
   * FORM VIEW - Tambah/Edit Catatan
   */
  const renderForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView(editingNote ? "detail" : "dashboard")}
            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {editingNote ? "Edit Catatan" : "Tambah Catatan Baru"}
            </h2>
            <p className="text-gray-600">
              {editingNote
                ? "Perbarui catatan perkembangan siswa"
                : "Buat catatan perkembangan siswa baru"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form
          onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
          className="space-y-6">
          {/* Pilih Siswa & Kategori - SEJAJAR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pilih Siswa */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pilih Siswa <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
                required
                disabled={editingNote}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-colors">
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map((siswa) => (
                  <option key={siswa.id} value={siswa.id}>
                    {siswa.nama} - {siswa.kelas} ({siswa.nisn})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Pilih siswa yang akan diberi catatan
              </p>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kategori Catatan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                <option value="">-- Pilih Kategori --</option>
                {kategoris.map((kategori) => (
                  <option key={kategori} value={kategori}>
                    {kategori}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deskripsi Kategori (tetap di bawah) */}
          {formData.category && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <Info className="w-4 h-4" />
                <strong>Kategori {formData.category}:</strong>{" "}
                {getCategoryDescription(formData.category)}
              </p>
            </div>
          )}

          {/* LANJUTAN FORM YANG LAIN... */}

          {/* Label */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Label Catatan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  value: "positif",
                  label: "Positif",
                  icon: CheckCircle,
                  color: "green",
                },
                {
                  value: "perhatian",
                  label: "Perhatian",
                  icon: AlertCircle,
                  color: "red",
                },
                { value: "netral", label: "Biasa", icon: Info, color: "gray" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all ${
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
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-2 rounded-full bg-${option.color}-100`}>
                      <option.icon
                        className={`w-5 h-5 text-${option.color}-600`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {option.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {option.value === "positif" &&
                          "Perkembangan baik & prestasi"}
                        {option.value === "perhatian" &&
                          "Masalah yang perlu ditindaklanjuti"}
                        {option.value === "netral" &&
                          "Catatan rutin & observasi"}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Isi Catatan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Isi Catatan <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-gray-500 ml-1">
                (Minimal 10 karakter)
              </span>
            </label>
            <textarea
              value={formData.note_content}
              onChange={(e) =>
                setFormData({ ...formData, note_content: e.target.value })
              }
              required
              minLength="10"
              rows="6"
              placeholder="Tuliskan catatan perkembangan siswa secara detail dan jelas..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Panjang karakter: {formData.note_content.length}</span>
              {formData.note_content.length < 10 && (
                <span className="text-red-500">Minimal 10 karakter</span>
              )}
            </div>
          </div>

          {/* Tindakan yang Diambil */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tindakan yang Diambil{" "}
              <span className="text-gray-500">(Opsional)</span>
            </label>
            <textarea
              value={formData.action_taken}
              onChange={(e) =>
                setFormData({ ...formData, action_taken: e.target.value })
              }
              rows="3"
              placeholder="Tuliskan tindakan yang sudah dilakukan (jika ada)..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              Contoh: Diberikan motivasi, dikomunikasikan dengan orang tua, dll.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() =>
                setActiveView(editingNote ? "detail" : "dashboard")
              }
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isSyncing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors flex-1">
              {loading || isSyncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {isSyncing ? "Menyinkronkan..." : "Menyimpan..."}
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

  /**
   * DETAIL VIEW - Lihat Catatan Siswa Spesifik
   */
  const renderDetail = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView("dashboard")}
            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Catatan {selectedSiswa?.nama}
            </h2>
            <p className="text-gray-600">
              {selectedSiswa?.kelas} • {selectedSiswa?.nisn}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors justify-center">
              <Plus className="w-5 h-5" />
              Tambah Catatan
            </button>
          )}
        </div>
      </div>

      {/* Student Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="text-green-600 font-bold text-2xl">
            {selectedSiswa?.positif || 0}
          </div>
          <div className="text-gray-600 text-sm">Catatan Positif</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="text-red-600 font-bold text-2xl">
            {selectedSiswa?.perhatian || 0}
          </div>
          <div className="text-gray-600 text-sm">Perlu Perhatian</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="text-gray-600 font-bold text-2xl">
            {selectedSiswa?.netral || 0}
          </div>
          <div className="text-gray-600 text-sm">Catatan Biasa</div>
        </div>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Memuat catatan...</p>
        </div>
      ) : catatanList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            Belum ada catatan untuk siswa ini
          </p>
          {!isAdmin && (
            <p className="text-gray-500 text-sm mt-2">
              Klik "Tambah Catatan" untuk membuat catatan pertama
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {catatanList.map((catatan) => (
            <div
              key={catatan.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getLabelBadge(
                        catatan.label
                      )}`}>
                      {getLabelIcon(catatan.label)}
                      {catatan.label === "positif"
                        ? "Positif"
                        : catatan.label === "perhatian"
                        ? "Perhatian"
                        : "Biasa"}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      {catatan.category}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDate(catatan.created_at)}
                    </span>
                    {catatan.teacher_name && (
                      <span className="text-gray-500 text-sm">
                        oleh {catatan.teacher_name}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="prose max-w-none mb-4">
                    <p className="text-gray-800 whitespace-pre-line">
                      {catatan.note_content}
                    </p>
                  </div>

                  {/* Action Taken */}
                  {catatan.action_taken && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-800 mb-1">
                        Tindakan yang Diambil:
                      </p>
                      <p className="text-blue-700 whitespace-pre-line">
                        {catatan.action_taken}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isAdmin && (
                  <div className="flex gap-2 lg:flex-col">
                    <button
                      onClick={() => handleEditNote(catatan)}
                      className="bg-yellow-100 text-yellow-700 p-2 rounded-lg hover:bg-yellow-200 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setNoteToDelete(catatan.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors">
                      <Trash2 className="w-4 h-4" />
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

  // ===== MAIN RENDER =====
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
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
