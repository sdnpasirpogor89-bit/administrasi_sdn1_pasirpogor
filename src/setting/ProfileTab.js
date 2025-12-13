import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  User,
  Shield,
  BookOpen,
  School,
  Calendar,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  Search,
  Eye,
  Edit2,
  Trash2,
  Plus,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

const ProfileTab = ({ userId, user, showToast, loading, setLoading }) => {
  const [profileData, setProfileData] = useState(null);
  const [targetUserId, setTargetUserId] = useState(userId);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalClasses: 0,
    loading: true,
  });

  const [showUserList, setShowUserList] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    password: "",
    role: "guru_kelas",
    kelas: "",
    mata_pelajaran: "",
    tahun_ajaran: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isInitialLoad = useRef(true);

  const searchUsers = useCallback(
    async (query) => {
      try {
        setSearching(true);

        let queryBuilder = supabase
          .from("users")
          .select(
            "id, username, full_name, role, kelas, mata_pelajaran, tahun_ajaran, is_active, created_at"
          )
          .neq("role", "admin")
          .order("full_name", { ascending: true });

        if (query.trim()) {
          queryBuilder = queryBuilder.or(
            `full_name.ilike.%${query}%,username.ilike.%${query}%,kelas.ilike.%${query}%`
          );
        }

        queryBuilder = queryBuilder.limit(100);
        const { data, error } = await queryBuilder;

        if (error) {
          console.error("Error searching users:", error);
          showToast("Gagal memuat daftar pengguna", "error");
          return;
        }

        setUserSearchResults(data || []);
      } catch (err) {
        console.error("Error in searchUsers:", err);
        showToast("Terjadi kesalahan saat memuat pengguna", "error");
      } finally {
        setSearching(false);
      }
    },
    [showToast]
  );

  const loadUserProfile = useCallback(
    async (uid) => {
      try {
        console.log("🔍 Loading profile for userId:", uid);

        if (!uid) {
          console.error("❌ User ID is missing");
          showToast("ID pengguna tidak ditemukan", "error");
          setLoading(false);
          return;
        }

        setLoading(true);

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", uid)
          .maybeSingle();

        if (userError) {
          console.error("❌ Error loading user:", userError);
          showToast(`Error: ${userError.message}`, "error");
          setLoading(false);
          return;
        }

        if (!userData) {
          console.error("❌ User data is null");
          showToast("Pengguna tidak ditemukan", "error");
          setLoading(false);
          return;
        }

        console.log("✅ Profile loaded successfully");
        setProfileData(userData);

        if (userData.role === "guru_kelas" || userData.role === "guru_mapel") {
          await loadTeacherStatistics(userData);
        }

        setLoading(false);
      } catch (err) {
        console.error("💥 Unexpected error loading profile:", err);
        showToast(`Terjadi kesalahan: ${err.message}`, "error");
        setLoading(false);
      }
    },
    [] // Hapus dependency untuk mencegah infinite loop
  );

  const loadTeacherStatistics = useCallback(async (userData) => {
    try {
      setStatistics((prev) => ({ ...prev, loading: true }));

      if (userData.kelas) {
        const kelasArray = userData.kelas.split(",").map((k) => k.trim());

        const { data: studentsData, error } = await supabase
          .from("students")
          .select("id, kelas")
          .in("kelas", kelasArray)
          .eq("is_active", true);

        if (error) {
          console.error("Error loading students:", error);
        }

        setStatistics({
          totalStudents: studentsData?.length || 0,
          totalClasses: kelasArray.length,
          loading: false,
        });
      } else {
        setStatistics({ totalStudents: 0, totalClasses: 0, loading: false });
      }
    } catch (err) {
      console.error("Error loading statistics:", err);
      setStatistics({ totalStudents: 0, totalClasses: 0, loading: false });
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim() && !showUserList) {
      setShowUserList(true);
    }
  }, [searchQuery, showUserList]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = userSearchResults.filter(
        (u) =>
          u.full_name.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          u.kelas?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(userSearchResults);
    }
  }, [searchQuery, userSearchResults]);

  useEffect(() => {
    if (user?.role === "admin" && userSearchResults.length === 0) {
      searchUsers("");
    }
  }, [user?.role, userSearchResults.length, searchUsers]);

  // ✅ FIX INFINITE LOOP - Load profile hanya sekali
  useEffect(() => {
    if (targetUserId && isInitialLoad.current) {
      console.log("🔄 Initial load for targetUserId:", targetUserId);
      isInitialLoad.current = false;
      loadUserProfile(targetUserId);
    }
  }, [targetUserId, loadUserProfile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === "admin") {
        searchUsers(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers, user?.role]);

  const handleViewProfile = (selectedUser) => {
    setTargetUserId(selectedUser.id);
    setShowUserList(false);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingUser(null);
    setFormData({
      username: "",
      full_name: "",
      password: "",
      role: "guru_kelas",
      kelas: "",
      mata_pelajaran: "",
      tahun_ajaran: "",
      is_active: true,
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setEditingUser(user);
    setFormData({
      username: user.username,
      full_name: user.full_name,
      password: "",
      role: user.role,
      kelas: user.kelas || "",
      mata_pelajaran: user.mata_pelajaran || "",
      tahun_ajaran: user.tahun_ajaran || "",
      is_active: user.is_active,
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) errors.username = "Username wajib diisi";
    if (!formData.full_name.trim())
      errors.full_name = "Nama lengkap wajib diisi";
    if (modalMode === "add" && !formData.password)
      errors.password = "Password wajib diisi";
    if (
      modalMode === "add" &&
      formData.password &&
      formData.password.length < 6
    )
      errors.password = "Password minimal 6 karakter";
    if (
      (formData.role === "guru_kelas" || formData.role === "guru_mapel") &&
      !formData.kelas.trim()
    )
      errors.kelas = "Kelas wajib diisi untuk guru";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast("Mohon lengkapi semua field yang wajib diisi", "error");
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === "add") {
        const { error: insertError } = await supabase.from("users").insert([
          {
            username: formData.username,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            kelas:
              formData.role === "guru_kelas" || formData.role === "guru_mapel"
                ? formData.kelas
                : null,
            mata_pelajaran: formData.mata_pelajaran || null,
            tahun_ajaran: formData.tahun_ajaran || null,
            is_active: formData.is_active,
          },
        ]);

        if (insertError) {
          showToast(
            `Gagal menyimpan data user: ${insertError.message}`,
            "error"
          );
          setSubmitting(false);
          return;
        }

        showToast("User berhasil ditambahkan!", "success");
        searchUsers("");
        setShowUserModal(false);
      } else if (modalMode === "edit") {
        const updateData = {
          username: formData.username,
          full_name: formData.full_name,
          role: formData.role,
          kelas:
            formData.role === "guru_kelas" || formData.role === "guru_mapel"
              ? formData.kelas
              : null,
          mata_pelajaran: formData.mata_pelajaran || null,
          tahun_ajaran: formData.tahun_ajaran || null,
          is_active: formData.is_active,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        const { error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", editingUser.id);

        if (updateError) {
          showToast(`Gagal mengupdate user: ${updateError.message}`, "error");
          setSubmitting(false);
          return;
        }

        showToast("User berhasil diupdate!", "success");
        searchUsers("");

        if (targetUserId === editingUser.id) {
          loadUserProfile(targetUserId);
        }

        setShowUserModal(false);
      }

      setSubmitting(false);
    } catch (err) {
      console.error("Error submitting form:", err);
      showToast("Terjadi kesalahan saat menyimpan data", "error");
      setSubmitting(false);
    }
  };

  const handleDelete = async (deleteUser) => {
    if (deleteUser.id === userId) {
      showToast("Anda tidak bisa menghapus akun sendiri!", "error");
      return;
    }

    if (
      !window.confirm(
        `Yakin ingin menghapus user "${deleteUser.full_name}"? Tindakan ini tidak bisa dibatalkan!`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", deleteUser.id);

      if (deleteError) {
        showToast(`Gagal menghapus user: ${deleteError.message}`, "error");
        setLoading(false);
        return;
      }

      showToast("User berhasil dihapus!", "success");
      searchUsers("");

      if (targetUserId === deleteUser.id) {
        setTargetUserId(userId);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("Terjadi kesalahan saat menghapus user", "error");
      setLoading(false);
    }
  };

  const isViewingOtherProfile = targetUserId !== userId;
  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-100 border-t-red-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">
            Memuat profil...
          </p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
          <User size={56} className="text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-xl font-semibold mb-2">
          Data profil tidak tersedia
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
          Terjadi kesalahan saat memuat profil
        </p>
        <button
          onClick={() => {
            isInitialLoad.current = true;
            loadUserProfile(targetUserId);
          }}
          className="px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition font-medium min-h-[44px]">
          Coba Lagi
        </button>
      </div>
    );
  }

  const accountAge = Math.floor(
    (new Date() - new Date(profileData.created_at)) / (1000 * 60 * 60 * 24)
  );
  const totalUsers = userSearchResults.length;
  const displayCount = searchQuery ? filteredUsers.length : totalUsers;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-red-100 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  {modalMode === "add" ? (
                    <Plus
                      size={20}
                      className="text-red-600 dark:text-red-400"
                    />
                  ) : (
                    <Edit2
                      size={20}
                      className="text-red-600 dark:text-red-400"
                    />
                  )}
                  {modalMode === "add" ? "Tambah User Baru" : "Edit User"}
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition min-h-[40px] min-w-[40px]">
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600 dark:focus:border-red-600 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formErrors.username
                      ? "border-red-500 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Masukkan username"
                  disabled={modalMode === "edit"}
                />
                {formErrors.username && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600 dark:focus:border-red-600 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formErrors.full_name
                      ? "border-red-500 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Masukkan nama lengkap"
                />
                {formErrors.full_name && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.full_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password{" "}
                  {modalMode === "add" && (
                    <span className="text-red-500">*</span>
                  )}
                  {modalMode === "edit" && (
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">
                      (Kosongkan jika tidak ingin mengubah)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600 dark:focus:border-red-600 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formErrors.password
                      ? "border-red-500 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder={
                    modalMode === "add"
                      ? "Masukkan password"
                      : "Kosongkan jika tidak ingin mengubah"
                  }
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600 dark:focus:border-red-600 dark:bg-gray-700 dark:text-white">
                  <option value="guru_kelas">Guru Kelas</option>
                  <option value="guru_mapel">Guru Mapel</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {(formData.role === "guru_kelas" ||
                formData.role === "guru_mapel") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Kelas <span className="text-red-500">*</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-2">
                      (Pisahkan dengan koma jika lebih dari 1, contoh: 1,2,3)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.kelas}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        kelas: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600 dark:focus:border-red-600 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                      formErrors.kelas
                        ? "border-red-500 dark:border-red-600"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Contoh: 5 atau 1,2,3"
                  />
                  {formErrors.kelas && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formErrors.kelas}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={formData.mata_pelajaran}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mata_pelajaran: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600 dark:focus:border-red-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Contoh: Matematika, IPA"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={formData.tahun_ajaran}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tahun_ajaran: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600 dark:focus:border-red-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Contoh: 2025/2026"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-red-600 dark:text-red-500 rounded focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Akun Aktif
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 sm:px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition min-h-[44px]"
                  disabled={submitting}>
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 sm:px-6 py-2.5 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]">
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isViewingOtherProfile && (
        <div className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Melihat Profil User Lain
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {profileData.full_name} ({profileData.role})
                </p>
              </div>
            </div>
            <button
              onClick={() => setTargetUserId(userId)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm font-medium text-gray-700 dark:text-gray-300 min-h-[44px] w-full sm:w-auto">
              Kembali ke Profil Saya
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                  <span className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {profileData.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-4 border-white dark:border-gray-800 ${
                    profileData.is_active
                      ? "bg-green-500 dark:bg-green-400"
                      : "bg-gray-400 dark:bg-gray-600"
                  }`}></div>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {profileData.full_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
                  @{profileData.username}
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${
                      profileData.role === "admin"
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}>
                    <Shield size={12} />
                    {profileData.role === "admin"
                      ? "Administrator"
                      : profileData.role === "guru_kelas"
                      ? "Guru Kelas"
                      : "Guru Mapel"}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        profileData.is_active
                          ? "bg-green-500 dark:bg-green-400"
                          : "bg-gray-400 dark:bg-gray-600"
                      }`}></span>
                    {profileData.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {profileData.kelas && (
                    <div className="flex items-center gap-1.5">
                      <School size={12} className="flex-shrink-0" />
                      <span>Kelas {profileData.kelas}</span>
                    </div>
                  )}

                  {profileData.mata_pelajaran && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={12} className="flex-shrink-0" />
                      <span>{profileData.mata_pelajaran}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
              {profileData.tahun_ajaran && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">
                    Tahun Ajaran
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {profileData.tahun_ajaran}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && !isViewingOtherProfile && (
        <div className="mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-red-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari pengguna berdasarkan nama, username, atau kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600 dark:focus:border-red-600 dark:bg-gray-700 dark:text-white"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 dark:border-red-400 border-t-transparent"></div>
                  </div>
                )}
              </div>

              <button
                onClick={openAddModal}
                className="px-4 sm:px-5 py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition font-semibold flex items-center gap-2 whitespace-nowrap justify-center min-h-[44px]">
                <Plus size={18} />
                <span className="hidden sm:inline">Tambah User</span>
                <span className="inline sm:hidden">Tambah</span>
              </button>
            </div>

            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Menampilkan {displayCount} dari {totalUsers} pengguna
              </div>
            )}
          </div>
        </div>
      )}

      {isAdmin && !isViewingOtherProfile && (
        <div className="mb-4 sm:mb-6">
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all ${
              showUserList
                ? "border-red-300 dark:border-red-600"
                : "border-red-100 dark:border-gray-700"
            }`}>
            <div
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer min-h-[64px]"
              onClick={() => setShowUserList(!showUserList)}>
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    showUserList
                      ? "bg-red-600 dark:bg-red-700"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}>
                  <Users
                    size={18}
                    className={
                      showUserList
                        ? "text-white"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Semua Pengguna
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {displayCount} {searchQuery ? "hasil" : "pengguna"}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserList(!showUserList);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-sm font-medium min-h-[40px]">
                {showUserList ? (
                  <ChevronUp
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                ) : (
                  <ChevronDown
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                )}
              </button>
            </div>

            {showUserList && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="max-h-[400px] overflow-y-auto p-4">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users
                        size={40}
                        className="text-gray-300 dark:text-gray-600 mx-auto mb-3"
                      />
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery
                          ? "Tidak ada pengguna yang ditemukan"
                          : "Belum ada pengguna"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredUsers.map((listUser) => (
                        <div
                          key={listUser.id}
                          className="group flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold flex-shrink-0 text-sm">
                              {listUser.full_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                                {listUser.full_name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                @{listUser.username}
                              </p>
                            </div>
                          </div>

                          <div className="hidden md:block px-3">
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {listUser.kelas || "-"}
                            </span>
                          </div>

                          <div className="hidden sm:block px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                                listUser.is_active
                                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  listUser.is_active
                                    ? "bg-green-500 dark:bg-green-400"
                                    : "bg-gray-400 dark:bg-gray-600"
                                }`}></span>
                              {listUser.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewProfile(listUser)}
                              className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition min-h-[36px] min-w-[36px]"
                              title="Lihat Profil">
                              <Eye size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(listUser)}
                              className="p-1.5 sm:p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition min-h-[36px] min-w-[36px]"
                              title="Edit User">
                              <Edit2 size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(listUser)}
                              className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-50 min-h-[36px] min-w-[36px]"
                              title="Hapus User"
                              disabled={listUser.id === userId}>
                              <Trash2 size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(profileData.role === "guru_kelas" ||
        profileData.role === "guru_mapel") &&
        profileData.kelas && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-2">
                  <School
                    size={18}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalClasses}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Kelas Diampu
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2">
                  <Users
                    size={18}
                    className="text-green-600 dark:text-green-400"
                  />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.loading ? "..." : statistics.totalStudents}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Total Siswa
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-2">
                  <BookOpen
                    size={18}
                    className="text-orange-600 dark:text-orange-400"
                  />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {profileData.mata_pelajaran ? "1" : "7"}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Mata Pelajaran
              </p>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-red-600 dark:text-red-400" />
              Informasi Akun
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                  Username
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {profileData.username}
                </p>
              </div>

              {profileData.kelas && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Kelas
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    Guru Kelas {profileData.kelas}
                  </p>
                </div>
              )}

              {profileData.mata_pelajaran && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Mata Pelajaran
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {profileData.mata_pelajaran}
                  </p>
                </div>
              )}

              {profileData.tahun_ajaran && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Tahun Ajaran
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {profileData.tahun_ajaran}
                  </p>
                </div>
              )}

              {profileData.role === "admin" && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">
                    Hak Akses
                  </p>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <p className="font-semibold text-purple-900 dark:text-purple-400 text-sm">
                      Administrator Sistem
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                      Akses penuh ke semua fitur
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {profileData.role === "admin" ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 shadow-sm border border-red-100 dark:border-gray-700 text-center">
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-full p-4 w-fit mx-auto mb-4">
                <Shield
                  size={40}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Administrator System
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isViewingOtherProfile
                  ? `Anda sedang melihat profil ${profileData.full_name} sebagai Administrator`
                  : "Anda memiliki akses penuh untuk mengelola semua data dan pengguna dalam sistem"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">
                    Hak Akses:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Kelola semua user & role</li>
                    <li>• Akses data lengkap sistem</li>
                    <li>• Konfigurasi akademik</li>
                    <li>• Monitoring aktivitas</li>
                  </ul>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">
                    Fitur Khusus:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Lihat profil semua user</li>
                    <li>• Edit & hapus user</li>
                    <li>• Generate laporan</li>
                    <li>• Backup & restore data</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              {profileData.kelas ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-red-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen
                      size={20}
                      className="text-red-600 dark:text-red-400"
                    />
                    Informasi Mengajar
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400 font-semibold mb-2">
                        Kelas yang Diampu
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profileData.kelas.split(",").map((kelas, index) => (
                          <span
                            key={index}
                            className="bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-3 py-1 rounded-lg font-medium text-sm">
                            Kelas {kelas.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {profileData.mata_pelajaran && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-600 dark:text-green-400 font-semibold mb-2">
                          Mata Pelajaran
                        </p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {profileData.mata_pelajaran}
                        </p>
                      </div>
                    )}

                    {profileData.tahun_ajaran && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold mb-2">
                          Tahun Ajaran Aktif
                        </p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {profileData.tahun_ajaran}
                        </p>
                      </div>
                    )}

                    {!statistics.loading && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-2">
                          Statistik
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                              {statistics.totalStudents}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Total Siswa
                            </p>
                          </div>
                          <div>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                              {statistics.totalClasses}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Kelas Diampu
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 sm:p-12 shadow-sm border border-red-100 dark:border-gray-700 text-center">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 w-fit mx-auto mb-4">
                    <BookOpen
                      size={40}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Belum Ada Informasi Mengajar
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {isViewingOtherProfile ? "User ini" : "Anda"} belum memiliki
                    data kelas atau mata pelajaran.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
