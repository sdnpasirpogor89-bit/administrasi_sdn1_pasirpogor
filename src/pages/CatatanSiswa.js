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
} from "lucide-react";
import ExportCatatanSiswa from "./ExportCatatanSiswa";

const CatatanSiswa = ({ userData }) => {
  console.log("🚀 CatatanSiswa mounted with userData:", userData);

  const [activeView, setActiveView] = useState("dashboard");
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [siswaList, setSiswaList] = useState([]);
  const [catatanList, setCatatanList] = useState([]);
  const [stats, setStats] = useState({
    totalSiswa: 0,
    progressPositif: 0,
    perluPerhatian: 0,
    catatanBiasa: 0,
  });

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

  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("Ganjil");

  const kategoris = ["Akademik", "Perilaku", "Sosial", "Karakter", "Kesehatan"];

  const isAdmin =
    userData?.role === "admin" || userData?.role === "administrator";

  useEffect(() => {
    console.log("📌 useEffect triggered");
    if (userData?.id) {
      initializeData();
    }
  }, [userData?.id]);

  const initializeData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Initializing data for user:", userData.username);

      // Get academic settings with better error handling
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
        console.log("📅 Using default Tahun Ajaran: 2024/2025");
      }

      if (!semesterError && semesterData?.setting_value) {
        console.log("📅 Semester:", semesterData.setting_value);
        setSemester(semesterData.setting_value);
      } else {
        console.log("📅 Using default Semester: Ganjil");
      }

      await loadStudents();
    } catch (error) {
      console.error("❌ Error initializing:", error);
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      console.log("📚 Loading students...");
      console.log("👤 User role:", userData.role);
      console.log("🏫 User kelas:", userData.kelas);

      let query = supabase
        .from("students")
        .select("id, nisn, nama_siswa, kelas, is_active")
        .eq("is_active", true)
        .order("nama_siswa", { ascending: true });

      if (!isAdmin && userData.kelas) {
        // ✅ SPLIT kelas jadi array untuk Guru Mapel
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
            const { data: catatanData } = await supabase
              .from("catatan_siswa")
              .select("label, created_at")
              .eq("student_id", siswa.id)
              .eq("academic_year", academicYear)
              .eq("semester", semester);

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
          progressPositif: processedStudents.filter((s) => s.positif > 0)
            .length,
          perluPerhatian: processedStudents.filter((s) => s.perhatian > 0)
            .length,
          catatanBiasa: processedStudents.filter((s) => s.netral > 0).length,
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

      let query = supabase
        .from("catatan_siswa")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_year", academicYear)
        .eq("semester", semester)
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("teacher_id", userData.id);
      }

      const { data: notesData, error: notesError } = await query;

      if (notesError) throw notesError;

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

  const handleCreateNote = async (e) => {
    e.preventDefault();

    if (isAdmin) {
      alert("Admin tidak dapat membuat catatan");
      return;
    }

    if (
      !formData.student_id ||
      !formData.category ||
      !formData.label ||
      !formData.note_content
    ) {
      alert("Harap lengkapi semua field yang wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const { data: student } = await supabase
        .from("students")
        .select("kelas")
        .eq("id", formData.student_id)
        .single();

      const noteData = {
        student_id: formData.student_id,
        teacher_id: userData.id,
        class_id: student?.kelas || userData.kelas,
        academic_year: academicYear,
        semester: semester,
        category: formData.category,
        label: formData.label,
        note_content: formData.note_content,
        action_taken: formData.action_taken || null,
      };

      console.log("📝 Inserting note:", noteData);

      const { data, error } = await supabase
        .from("catatan_siswa")
        .insert([noteData])
        .select();

      if (error) {
        console.error("❌ Supabase error:", error);
        throw error;
      }

      console.log("✅ Note created:", data);
      alert("✅ Catatan berhasil disimpan!");
      setFormData({
        student_id: "",
        category: "",
        label: "",
        note_content: "",
        action_taken: "",
      });
      await loadStudents();
      setActiveView("dashboard");
    } catch (error) {
      console.error("❌ Error creating note:", error);
      alert(
        "Gagal menyimpan catatan: " + (error.message || JSON.stringify(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();

    if (isAdmin) {
      alert("Admin tidak dapat mengedit catatan");
      return;
    }

    setLoading(true);
    try {
      const updates = {
        category: formData.category,
        label: formData.label,
        note_content: formData.note_content,
        action_taken: formData.action_taken || null,
      };

      const { error } = await supabase
        .from("catatan_siswa")
        .update(updates)
        .eq("id", editingNote.id);

      if (error) throw error;

      alert("✅ Catatan berhasil diupdate!");
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
    } catch (error) {
      console.error("❌ Error updating note:", error);
      alert("Gagal update catatan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    setIsDeleteModalOpen(false);
    if (!noteToDelete) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("catatan_siswa")
        .delete()
        .eq("id", noteToDelete);

      if (error) throw error;

      alert("✅ Catatan berhasil dihapus!");
      await loadStudentNotes(selectedSiswa.id);
      await loadStudents();
    } catch (error) {
      console.error("❌ Error deleting note:", error);
      alert("Gagal menghapus catatan: " + error.message);
    } finally {
      setLoading(false);
      setNoteToDelete(null);
    }
  };

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
        return <CheckCircle className="w-4 h-4" />;
      case "perhatian":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getLabelBadge = (label) => {
    switch (label) {
      case "positif":
        return "bg-green-100 text-green-800";
      case "perhatian":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddNote = () => {
    if (isAdmin) {
      alert("Admin tidak dapat membuat catatan");
      return;
    }
    if (siswaList.length === 0) {
      alert("Tidak ada data siswa. Pastikan ada siswa di kelas Anda.");
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
      alert("Admin tidak dapat mengedit catatan");
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

  const renderDeleteModal = () => {
    if (!isDeleteModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Konfirmasi Hapus
            </h3>
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setNoteToDelete(null);
              }}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-700 mb-6">
            Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat
            dibatalkan.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setNoteToDelete(null);
              }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300">
              Batal
            </button>
            <button
              onClick={handleDeleteNote}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isAdmin
              ? "Monitoring Catatan Siswa"
              : "Catatan Perkembangan Siswa"}
          </h2>
          <p className="text-gray-600">
            {userData.kelas ? `Kelas ${userData.kelas}` : "Semua Kelas"} -{" "}
            {academicYear} (Semester {semester})
            {isAdmin && (
              <span className="ml-2 text-blue-600 font-semibold">
                (Mode Admin)
              </span>
            )}
          </p>
        </div>
        {!isAdmin && (
          <div className="flex gap-3">
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Plus className="w-5 h-5" />
              Tambah Catatan
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-1">Total Siswa</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalSiswa}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-1">Progress Positif</p>
          <p className="text-3xl font-bold text-green-600">
            {stats.progressPositif}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-500">
          <p className="text-gray-600 text-sm mb-1">Perlu Perhatian</p>
          <p className="text-3xl font-bold text-red-600">
            {stats.perluPerhatian}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-gray-500">
          <p className="text-gray-600 text-sm mb-1">Catatan Biasa</p>
          <p className="text-3xl font-bold text-gray-600">
            {stats.catatanBiasa}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari siswa berdasarkan nama, NISN, atau kelas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Memuat data siswa...</p>
        </div>
      ) : filteredSiswa.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nama Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  NISN
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Kelas
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Positif
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Perhatian
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Biasa
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Update Terakhir
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSiswa.map((siswa) => (
                <tr key={siswa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {siswa.nama}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{siswa.nisn}</td>
                  <td className="px-6 py-4 text-gray-600">{siswa.kelas}</td>
                  <td className="px-6 py-4 text-center">
                    {siswa.positif > 0 ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        {siswa.positif}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {siswa.perhatian > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        <TrendingDown className="w-4 h-4" />
                        {siswa.perhatian}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {siswa.netral > 0 ? (
                      <span className="inline-flex items-center gap-1 text-gray-600 font-semibold">
                        <Info className="w-4 h-4" />
                        {siswa.netral}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {siswa.lastUpdate}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewDetail(siswa)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto font-medium">
                      <Eye className="w-4 h-4" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingNote ? "Edit Catatan" : "Tambah Catatan Baru"}
          </h2>
          <button
            onClick={() => setActiveView(editingNote ? "detail" : "dashboard")}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>

        <form
          onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
          className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Siswa <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.student_id}
              onChange={(e) =>
                setFormData({ ...formData, student_id: e.target.value })
              }
              disabled={editingNote}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              required>
              <option value="">Pilih Siswa</option>
              {siswaList.map((siswa) => (
                <option key={siswa.id} value={siswa.id}>
                  {siswa.nama} - {siswa.kelas} (NISN: {siswa.nisn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required>
                <option value="">Pilih Kategori</option>
                {kategoris.map((kategori) => (
                  <option key={kategori} value={kategori}>
                    {kategori}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Label <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {["positif", "perhatian", "netral"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFormData({ ...formData, label })}
                    className={`flex-1 px-3 py-2.5 rounded-lg border font-medium ${
                      formData.label === label
                        ? label === "positif"
                          ? "bg-green-100 border-green-500 text-green-800"
                          : label === "perhatian"
                          ? "bg-red-100 border-red-500 text-red-800"
                          : "bg-gray-100 border-gray-500 text-gray-800"
                        : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}>
                    {label === "positif"
                      ? "👍 Positif"
                      : label === "perhatian"
                      ? "⚠️ Perhatian"
                      : "📝 Biasa"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Isi Catatan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.note_content}
              onChange={(e) =>
                setFormData({ ...formData, note_content: e.target.value })
              }
              rows={6}
              placeholder="Tuliskan catatan perkembangan siswa..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tindakan yang Diambil
            </label>
            <textarea
              value={formData.action_taken}
              onChange={(e) =>
                setFormData({ ...formData, action_taken: e.target.value })
              }
              rows={3}
              placeholder="Tuliskan tindakan yang sudah atau akan dilakukan..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingNote ? "Menyimpan..." : "Membuat..."}
                </>
              ) : editingNote ? (
                "Update Catatan"
              ) : (
                "Buat Catatan"
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveView(editingNote ? "detail" : "dashboard")
              }
              className="bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg border font-semibold hover:bg-gray-100">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDetail = () => (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => setActiveView("dashboard")}
        className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border mb-6">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedSiswa?.nama}
            </h2>
            <p className="text-gray-600">NISN: {selectedSiswa?.nisn}</p>
            <p className="text-gray-600">Kelas: {selectedSiswa?.kelas}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Catatan Positif</p>
              <p className="text-3xl font-bold text-green-600">
                {selectedSiswa?.positif}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Perlu Perhatian</p>
              <p className="text-3xl font-bold text-red-600">
                {selectedSiswa?.perhatian}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Catatan Biasa</p>
              <p className="text-3xl font-bold text-gray-600">
                {selectedSiswa?.netral}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Timeline Catatan</h3>
        {!isAdmin && (
          <div className="flex gap-3">
            <ExportCatatanSiswa
              siswaList={siswaList}
              catatanList={catatanList}
              selectedSiswa={selectedSiswa}
              academicYear={academicYear}
              semester={semester}
              userData={userData}
              currentView="detail"
            />
            <button
              onClick={() => {
                setFormData({
                  student_id: selectedSiswa.id,
                  category: "",
                  label: "",
                  note_content: "",
                  action_taken: "",
                });
                setEditingNote(null);
                setActiveView("form");
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Tambah Catatan
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Memuat catatan...</p>
        </div>
      ) : catatanList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg mb-2">Belum ada catatan untuk siswa ini</p>
          {!isAdmin && (
            <p className="text-sm">
              Klik "Tambah Catatan" untuk membuat catatan pertama
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {catatanList.map((catatan) => (
            <div
              key={catatan.id}
              className="bg-white rounded-lg shadow-sm p-6 border-l-4"
              style={{
                borderLeftColor:
                  catatan.label === "positif"
                    ? "#10b981"
                    : catatan.label === "perhatian"
                    ? "#ef4444"
                    : "#6b7280",
              }}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${getLabelBadge(
                      catatan.label
                    )}`}>
                    {getLabelIcon(catatan.label)}
                    {catatan.label === "positif"
                      ? "Positif"
                      : catatan.label === "perhatian"
                      ? "Perlu Perhatian"
                      : "Catatan Biasa"}
                  </span>
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {catatan.category}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">
                    {formatDate(catatan.created_at)}
                  </span>
                </div>
                {!isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditNote(catatan)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setNoteToDelete(catatan.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-800 leading-relaxed mb-2 whitespace-pre-line">
                {catatan.note_content}
              </p>
              {catatan.action_taken && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Tindakan:</span>{" "}
                    {catatan.action_taken}
                  </p>
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                Oleh: {catatan.teacher_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {loading && !siswaList.length ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600 text-lg">Memuat data...</p>
          </div>
        </div>
      ) : (
        <>
          {activeView === "dashboard" && renderDashboard()}
          {activeView === "form" && renderForm()}
          {activeView === "detail" && renderDetail()}
        </>
      )}

      {renderDeleteModal()}
    </div>
  );
};

export default CatatanSiswa;
