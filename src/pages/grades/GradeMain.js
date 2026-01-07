import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Grade from "./Grade";
import Katrol from "./Katrol";
import RekapNilai from "./RekapNilai";

const GradeMain = ({ user, onShowToast, darkMode }) => {
  const [activeTab, setActiveTab] = useState("asli");
  const [fullUserData, setFullUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch full user data
  useEffect(() => {
    const fetchFullUserData = async () => {
      if (!user?.id) {
        console.error("❌ No user ID found");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, username, full_name, role, kelas")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("❌ Error fetching user data:", error);
          setFullUserData(user);
          setLoading(false);
          return;
        }

        if (!data) {
          console.warn("⚠️ User not found in database");
          setFullUserData(user);
          setLoading(false);
          return;
        }

        setFullUserData(data);
      } catch (error) {
        console.error("❌ Unexpected error:", error);
        setFullUserData(user);
      } finally {
        setLoading(false);
      }
    };

    fetchFullUserData();
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300 bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-red-600 dark:border-red-400"></div>
          <p className="text-base font-medium text-gray-600 dark:text-gray-300">
            Memuat data user...
          </p>
        </div>
      </div>
    );
  }

  // No user check
  if (!fullUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300 bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Data User Tidak Ditemukan
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Silakan login kembali atau hubungi administrator
          </p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      id: "asli",
      icon: "📝",
      title: "Nilai Asli",
      subtitle: "Input & Kelola Nilai",
      badge: "Asli",
    },
    {
      id: "katrol",
      icon: "🎯",
      title: "Nilai Katrol",
      subtitle: "Perbaikan Nilai Siswa",
      badge: "Katrol",
    },
    {
      id: "rekap",
      icon: "📊",
      title: "Rekap Nilai",
      subtitle: "Lihat Rekapitulasi",
      badge: "Rekap",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div>
          <div className="mb-6 sm:mb-8 text-center px-2">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              📋 Sistem Nilai Siswa SD
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Kelola Nilai Siswa Dengan Mudah Dan Efisien
            </p>
          </div>

          <div className="mb-4 sm:mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 sm:gap-3">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-300 flex-1 min-h-[60px] ${
                    activeTab === item.id
                      ? darkMode
                        ? "bg-red-600 text-white shadow-lg shadow-red-500/50"
                        : "bg-red-600 text-white shadow-lg shadow-red-500/30"
                      : darkMode
                      ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 active:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  }`}>
                  {/* Mobile: Icon + Badge */}
                  <div className="flex sm:hidden flex-col items-center justify-center gap-1">
                    <span className="text-2xl">{item.icon}</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        activeTab === item.id
                          ? darkMode
                            ? "bg-red-700"
                            : "bg-red-700"
                          : darkMode
                          ? "bg-gray-700"
                          : "bg-gray-100"
                      }`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Tablet/Desktop: Icon + Text */}
                  <div className="hidden sm:flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{item.title}</div>
                      <div
                        className={`text-xs ${
                          activeTab === item.id
                            ? "text-red-100"
                            : darkMode
                            ? "text-gray-500"
                            : "text-gray-500"
                        }`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {activeTab === item.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-600 rounded-b-xl"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`rounded-xl border shadow-lg min-h-[400px] sm:min-h-[500px] ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}>
            <div className="animate-fadeIn">
              {activeTab === "asli" && (
                <Grade
                  userData={fullUserData}
                  onShowToast={onShowToast}
                  darkMode={darkMode}
                />
              )}
              {activeTab === "katrol" && (
                <Katrol
                  userData={fullUserData}
                  onShowToast={onShowToast}
                  darkMode={darkMode}
                />
              )}
              {activeTab === "rekap" && (
                <RekapNilai
                  userData={fullUserData}
                  onShowToast={onShowToast}
                  darkMode={darkMode}
                />
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 sm:mt-6 bg-red-50 dark:bg-gray-800 rounded-xl border border-red-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">💡</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Informasi Penting
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {activeTab === "asli" &&
                    "Pastikan data nilai yang diinput sudah sesuai dengan KKM dan ketentuan sekolah."}
                  {activeTab === "katrol" &&
                    "Nilai Katrol Hanya Bisa Dilakukan Setelah Semua Nilai Asli Diinput Dan Diverifikasi."}
                  {activeTab === "rekap" &&
                    "Rekap Nilai Menampilkan Data Lengkap Dari Semua Siswa Untuk Analisis Dan Pelaporan."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeMain;
