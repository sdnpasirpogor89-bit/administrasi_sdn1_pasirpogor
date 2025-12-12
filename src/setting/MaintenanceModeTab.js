import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Power,
  Check,
  Trash2,
  Users,
  UserPlus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const MaintenanceModeTab = ({ showToast }) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [customMessage, setCustomMessage] = useState(
    "Aplikasi sedang dalam maintenance. Kami akan kembali nanti !"
  );
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ✅ WHITELIST STATE
  const [allUsers, setAllUsers] = useState([]);
  const [whitelistUsers, setWhitelistUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showWhitelistDetails, setShowWhitelistDetails] = useState(false);

  // ✅ Load maintenance settings
  useEffect(() => {
    loadMaintenanceSettings();
  }, []);

  // ✅ Load all users
  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadMaintenanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "maintenance_mode",
          "maintenance_message",
          "maintenance_whitelist",
        ]);

      if (error) throw error;

      const settings = {};
      data?.forEach((item) => {
        settings[item.setting_key] = item.setting_value;
      });

      setMaintenanceMode(
        settings.maintenance_mode === "true" ||
          settings.maintenance_mode === true
      );
      setCustomMessage(
        settings.maintenance_message ||
          "Aplikasi sedang dalam maintenance. Kami akan kembali segera!"
      );

      // Parse whitelist
      if (settings.maintenance_whitelist) {
        try {
          const parsed = JSON.parse(settings.maintenance_whitelist);
          setWhitelistUsers(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setWhitelistUsers([]);
        }
      }
    } catch (error) {
      console.error("Error loading maintenance settings:", error);
      showToast?.("Gagal memuat pengaturan maintenance", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIX: Load users TANPA admin
  const loadAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, username, full_name, role, is_active")
        .eq("is_active", true)
        .neq("role", "admin")
        .order("full_name", { ascending: true });

      if (error) throw error;

      setAllUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      showToast?.("Gagal memuat daftar user", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  // ✅ Toggle maintenance mode
  const handleToggle = async () => {
    setIsSaving(true);
    try {
      const newState = !maintenanceMode;

      const { error } = await supabase.from("school_settings").upsert(
        {
          setting_key: "maintenance_mode",
          setting_value: newState ? "true" : "false",
        },
        {
          onConflict: "setting_key",
        }
      );

      if (error) throw error;

      setMaintenanceMode(newState);
      showToast?.(
        newState ? "🔴 Maintenance Mode AKTIF" : "🟢 Aplikasi AKTIF",
        "success"
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      showToast?.("Gagal mengubah mode maintenance", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Update custom message
  const handleMessageChange = async (e) => {
    const msg = e.target.value;
    setCustomMessage(msg);

    try {
      const { error } = await supabase.from("school_settings").upsert(
        {
          setting_key: "maintenance_message",
          setting_value: msg,
        },
        {
          onConflict: "setting_key",
        }
      );

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error updating message:", error);
      showToast?.("Gagal menyimpan pesan", "error");
    }
  };

  // ✅ Add user to whitelist dari dropdown
  const handleAddUserFromDropdown = async () => {
    if (!selectedUserId) {
      showToast?.("Pilih user terlebih dahulu", "warning");
      return;
    }

    const user = allUsers.find((u) => u.id === selectedUserId);
    if (!user) return;

    // Cek apakah user sudah ada di whitelist
    if (whitelistUsers.some((u) => u.id === user.id)) {
      showToast?.(`${user.full_name} sudah ada di whitelist`, "info");
      setSelectedUserId("");
      return;
    }

    const newWhitelist = [
      ...whitelistUsers,
      {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
      },
    ];

    await saveWhitelist(newWhitelist);
    setSelectedUserId("");
  };

  // ✅ Remove user from whitelist
  const handleRemoveUser = async (userId) => {
    const newWhitelist = whitelistUsers.filter((u) => u.id !== userId);
    await saveWhitelist(newWhitelist);
  };

  // ✅ Save whitelist ke database
  const saveWhitelist = async (whitelist) => {
    try {
      const { error } = await supabase.from("school_settings").upsert(
        {
          setting_key: "maintenance_whitelist",
          setting_value: JSON.stringify(whitelist),
        },
        {
          onConflict: "setting_key",
        }
      );

      if (error) throw error;

      setWhitelistUsers(whitelist);
      showToast?.("✅ Whitelist berhasil diperbarui", "success");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving whitelist:", error);
      showToast?.("Gagal menyimpan whitelist", "error");
    }
  };

  // ✅ Filter users yang belum ada di whitelist untuk dropdown
  const availableUsers = allUsers.filter(
    (user) => !whitelistUsers.some((u) => u.id === user.id)
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-3 sm:border-4 border-red-100 dark:border-gray-700 border-t-red-600 dark:border-t-red-500 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm text-gray-600 dark:text-gray-300">
            Memuat pengaturan maintenance...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="p-2 sm:p-2.5 rounded-lg bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Mode Maintenance
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-1.5">
            Kelola akses aplikasi dan tampilkan pesan maintenance
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900 border border-red-100 dark:border-gray-700">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
          Status Aplikasi:
        </p>
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
              maintenanceMode
                ? "bg-red-500 dark:bg-red-400 animate-pulse"
                : "bg-green-500 dark:bg-green-400"
            }`}></div>
          <span
            className={`font-bold text-base sm:text-lg ${
              maintenanceMode
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}>
            {maintenanceMode ? "🔴 MAINTENANCE" : "🟢 AKTIF"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {maintenanceMode
              ? `${whitelistUsers.length} user bisa akses`
              : "Semua user bisa akses"}
          </span>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex-1">
            <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
              Aktifkan Mode Maintenance
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
              Ketika diaktifkan, hanya user di whitelist + admin yang bisa akses
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isSaving}
            className={`relative w-14 h-8 sm:w-16 sm:h-9 rounded-full transition-all flex-shrink-0 ${
              maintenanceMode
                ? "bg-red-500 dark:bg-red-600"
                : "bg-gray-300 dark:bg-gray-700"
            } ${
              isSaving
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:shadow-lg"
            }`}>
            <div
              className={`absolute top-1 left-1 sm:top-1.5 sm:left-1.5 w-6 h-6 bg-white dark:bg-gray-200 rounded-full transition-all flex items-center justify-center shadow-md ${
                maintenanceMode ? "translate-x-6 sm:translate-x-7" : ""
              }`}>
              <Power className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-700 dark:text-gray-800" />
            </div>
          </button>
        </div>
      </div>

      {/* Custom Message - hanya saat maintenance aktif */}
      {maintenanceMode && (
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-white dark:from-gray-800 dark:to-gray-900 border border-yellow-200 dark:border-gray-700">
          <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
            📝 Pesan Maintenance
          </label>
          <textarea
            value={customMessage}
            onChange={handleMessageChange}
            rows="3"
            maxLength={500}
            className="w-full p-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 resize-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            placeholder="Tulis pesan untuk user yang melihat halaman maintenance..."
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {customMessage.length}/500 karakter
            </p>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Auto-save
            </span>
          </div>
        </div>
      )}

      {/* WHITELIST SECTION - hanya saat maintenance aktif */}
      {maintenanceMode && (
        <div className="space-y-4 sm:space-y-5">
          {/* Add User Section dengan DROPDOWN */}
          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 border border-purple-200 dark:border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
                Whitelist User
              </h3>
              <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                {whitelistUsers.length} user
              </span>
            </div>

            {/* Dropdown + Button */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loadingUsers}
                className="flex-1 px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[44px]">
                <option value="" className="text-gray-500 dark:text-gray-400">
                  {loadingUsers ? "Loading..." : "-- Pilih User --"}
                </option>
                {availableUsers.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                    className="text-gray-800 dark:text-white">
                    {user.full_name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddUserFromDropdown}
                disabled={!selectedUserId || loadingUsers}
                className="px-4 py-2.5 sm:py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium min-h-[44px]">
                <UserPlus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>

            {availableUsers.length === 0 && !loadingUsers && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                ✅ Semua user sudah ada di whitelist
              </p>
            )}
          </div>

          {/* Whitelisted Users - COLLAPSIBLE */}
          {whitelistUsers.length > 0 && (
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-green-50 to-white dark:from-gray-800 dark:to-gray-900 border border-green-200 dark:border-gray-700">
              <button
                onClick={() => setShowWhitelistDetails(!showWhitelistDetails)}
                className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-green-100 dark:hover:bg-gray-700 rounded-lg transition min-h-[44px]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
                    ✅ User yang Diwhitelist
                  </h3>
                  <span className="text-xs bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                    {whitelistUsers.length} user
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  {showWhitelistDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {/* Detail List - Show/Hide */}
              {showWhitelistDetails && (
                <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                  {whitelistUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-white text-sm sm:text-base truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          @{user.username}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400 ml-2 flex-shrink-0"
                        aria-label={`Remove ${user.full_name}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {maintenanceMode && (
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 border border-purple-200 dark:border-gray-700">
          <p className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
            🖼️ Preview Halaman Maintenance:
          </p>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm text-center border border-gray-200 dark:border-gray-700">
            <div className="text-4xl sm:text-6xl mb-3">🔧</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
              Sedang Maintenance
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed px-2">
              {customMessage}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-3 sm:mt-4">
              Mohon maaf atas ketidaknyamanannya 🙏
            </p>
          </div>
        </div>
      )}

      {/* Save Indicator */}
      {saved && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border border-green-300 dark:border-green-700 rounded-lg shadow-lg flex items-center gap-2 animate-pulse z-50">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300 font-semibold text-xs sm:text-sm">
            ✅ Pengaturan disimpan
          </span>
        </div>
      )}
    </div>
  );
};

export default MaintenanceModeTab;
