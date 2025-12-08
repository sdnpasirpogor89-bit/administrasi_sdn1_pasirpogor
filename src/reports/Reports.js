import React, { useState, useEffect } from "react";
import ReportAdmin from "./ReportAdmin";
import ReportTeacher from "./ReportTeacher";

// Import ikon untuk Dark/Light Mode (Anggap saja ini ada)
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const Report = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // 1. Tambahkan state untuk Dark Mode (default: Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Logic otentikasi yang sudah ada (TIDAK DIUBAH)
    try {
      const userSession = localStorage.getItem("userSession");
      if (userSession) {
        const userData = JSON.parse(userSession);
        setUser(userData);
      }
    } catch (error) {
      console.error("Error reading user session:", error);
    } finally {
      setLoading(false);
    }

    // Ambil preferensi dark mode dari localStorage jika ada
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      setIsDarkMode(savedMode === "true");
    }
  }, []);

  // Update localStorage dan class "dark" pada body saat isDarkMode berubah
  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // --- Komponen Pengecekan Loading / No User ---

  // NOTE: Styling di bagian ini juga diupdate agar mendukung dark mode

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // No user session
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center p-6 rounded-lg shadow-lg dark:bg-gray-800">
          <p className="text-red-600 font-semibold mb-4 dark:text-red-400">
            Sesi login tidak ditemukan
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  // --- Konten Utama Laporan ---

  // 2. Wrap konten utama dengan container yang responsive dan support dark mode
  return (
    // Mobile First: Gunakan padding dan layout yang cocok untuk HP (p-4)
    // Dark Mode: Terapkan background/text default untuk Dark Mode
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      {/* 3. Tombol Toggle Dark Mode (Fixed di pojok atas) */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 z-50 shadow-md transition-colors duration-200 hover:opacity-80"
        aria-label="Toggle dark mode">
        {isDarkMode ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* 4. Konten utama di dalam container responsive (padding) */}
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
        {/* Route berdasarkan role (TIDAK DIUBAH) */}
        {user.role === "admin" ? (
          <ReportAdmin user={user} />
        ) : (
          <ReportTeacher user={user} />
        )}
      </div>
    </div>
  );
};

export default Report;
