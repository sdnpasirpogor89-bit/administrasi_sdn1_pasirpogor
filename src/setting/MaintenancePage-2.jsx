import React from "react";
import { Settings, RotateCcw } from "lucide-react";

const MaintenancePage = ({ message }) => {
  // Handle Refresh - Reload the page
  const handleRefresh = () => {
    try {
      console.log("🔄 Refreshing page...");
      window.location.reload();
    } catch (error) {
      console.error("❌ Refresh error:", error);
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 sm:p-10 md:p-12 rounded-2xl shadow-2xl max-w-xs sm:max-w-md md:max-w-2xl w-full text-center border border-gray-700">
        {/* Icon Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Settings
            className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 animate-spin"
            style={{ animationDuration: "3s" }}
          />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-400">
            Whoops !!!
          </h1>
          <Settings
            className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 animate-spin"
            style={{ animationDuration: "3s" }}
          />
        </div>

        {/* Main Title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 mb-6">
          Aplikasi Tidak Dapat Berjalan Normal
        </h2>

        {/* Message */}
        <p className="text-gray-300 text-base sm:text-lg mb-4 leading-relaxed">
          Mohon maaf atas ketidaknyamanannya.
        </p>

        <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed">
          {message ||
            "Silahkan Login Ulang Aplikasi Anda atau Klik Tombol Coba Lagi"}
        </p>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 min-h-[50px] bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-800">
          <RotateCcw className="w-5 h-5" />
          <span className="text-base sm:text-lg">Coba Lagi</span>
        </button>
      </div>
    </div>
  );
};

export default MaintenancePage;
