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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800 max-w-xs sm:max-w-sm w-full mx-4">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-4 text-sm sm:text-base">
            Sesi login tidak ditemukan
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-sm sm:text-base w-full transition-colors duration-200">
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* HAPUS dark mode toggle button - udah ada di Layout.js */}
      <div className="pt-4 pb-6 px-4 sm:px-6 md:px-8 lg:px-10 max-w-7xl mx-auto">
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
