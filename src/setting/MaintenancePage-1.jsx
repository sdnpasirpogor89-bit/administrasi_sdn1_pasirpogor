import React from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

const MaintenancePage = ({ message }) => {
  const navigate = useNavigate();

  // ✅ Handle Refresh - Clear session & redirect to login
  const handleRefresh = () => {
    try {
      // Clear all session data
      localStorage.removeItem("user");
      localStorage.removeItem("userSession");
      localStorage.removeItem("rememberMe");

      console.log("🔄 Refreshing... Redirecting to login");

      // Redirect to login
      navigate("/", { replace: true });

      // Force reload untuk clear state
      window.location.reload();
    } catch (error) {
      console.error("❌ Refresh error:", error);
      // Force redirect anyway
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-xl w-full text-center dark:bg-gray-800 dark:shadow-gray-900/50">
        {/* Icon Animasi */}
        <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-4 sm:mb-5 md:mb-6 animate-bounce">
          🔧
        </div>

        {/* Judul */}
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 dark:text-white">
          Sedang Maintenance
        </h1>

        {/* Pesan */}
        <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-6 sm:mb-7 md:mb-8 leading-relaxed dark:text-gray-300">
          {message ||
            "Aplikasi sedang dalam maintenance. Kami akan kembali segera!"}
        </p>

        {/* Refresh Button - Single & Clean */}
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 md:px-8 py-3 min-h-[44px] min-w-[44px] bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg md:rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Refresh Halaman</span>
        </button>

        {/* Footer */}
        <p className="text-gray-500 text-xs sm:text-sm mt-6 sm:mt-7 md:mt-8 dark:text-gray-400">
          Mohon maaf atas ketidaknyamanannya 🙏
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
