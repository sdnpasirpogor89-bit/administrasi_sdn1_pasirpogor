import React, { useState, useEffect } from "react";
import ReportAdmin from "./ReportAdmin";
import ReportTeacher from "./ReportTeacher";

const Report = ({ user: propUser }) => {
  // ← terima user dari props
  const [user, setUser] = useState(propUser || null);
  const [loading, setLoading] = useState(!propUser);

  useEffect(() => {
    // Kalau ga ada user dari props, baru cek localStorage
    if (!propUser) {
      try {
        const userSession = localStorage.getItem("user"); // ← ganti ke "user" sesuai App.js
        if (userSession) {
          const userData = JSON.parse(userSession);
          setUser(userData);
        }
      } catch (error) {
        console.error("Error reading user session:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [propUser]);

  // ❌ HAPUS SEMUA DARK MODE LOGIC
  // ❌ HAPUS isDarkMode state
  // ❌ HAPUS toggleDarkMode function
  // ❌ HAPUS useEffect yang ngurus dark mode

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-red-600 dark:border-red-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 px-4">
        <div className="text-center p-6 rounded-xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-xs sm:max-w-sm w-full mx-4">
          <div className="mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-3xl mb-3"></i>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-2 text-sm sm:text-base">
              Sesi login tidak ditemukan
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              Silakan login kembali untuk mengakses laporan
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 dark:hover:bg-red-800 text-sm sm:text-base w-full transition-all duration-200 font-semibold min-h-[44px]">
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* HAPUS dark mode toggle button - udah ada di Layout.js */}
      <div className="pt-4 pb-6 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 max-w-7xl mx-auto">
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
