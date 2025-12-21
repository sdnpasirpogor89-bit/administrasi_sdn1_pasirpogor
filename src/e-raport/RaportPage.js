import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import PreviewRaport from "./PreviewRaport";
import CetakRaport from "./CetakRaport";

function RaportPage() {
  const [activeTab, setActiveTab] = useState("preview");
  const [kelas, setKelas] = useState("");
  const [periode, setPeriode] = useState("");
  const [academicYear, setAcademicYear] = useState(null);
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadActiveAcademicYear();
  }, []);

  const loadUserData = async () => {
    try {
      setInitialLoading(true);
      setErrorMessage("");

      const sessionData = localStorage.getItem("userSession");

      if (!sessionData) {
        throw new Error("Session tidak ditemukan. Silakan login ulang.");
      }

      const user = JSON.parse(sessionData);

      // Validasi role
      if (user.role !== "guru_kelas" && user.role !== "admin") {
        throw new Error(
          "Hanya Guru Kelas dan Admin yang dapat mengakses fitur ini."
        );
      }

      // Untuk guru kelas, validasi kelas harus ada
      if (user.role === "guru_kelas" && !user.kelas) {
        throw new Error(
          "Data kelas tidak ditemukan. Pastikan Anda sudah ditugaskan sebagai wali kelas."
        );
      }

      // Set user data dan kelas
      setUserData(user);
      if (user.role === "guru_kelas") {
        setKelas(String(user.kelas));
      }
      // Jika admin, kelas bisa dipilih nanti di dropdown

      setInitialLoading(false);
    } catch (error) {
      console.error("Error:", error.message);
      setErrorMessage(error.message || "Terjadi kesalahan saat memuat data.");
      setInitialLoading(false);
    }
  };

  const loadActiveAcademicYear = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) {
        // Jika tidak ada yang aktif, ambil yang terbaru
        const { data: latestData, error: latestError } = await supabase
          .from("academic_years")
          .select("*")
          .order("year", { ascending: false })
          .limit(1)
          .single();

        if (!latestError && latestData) {
          setAcademicYear(latestData);
        }
      } else if (data) {
        setAcademicYear(data);
      }
    } catch (err) {
      console.error("Error fetching academic year:", err);
    }
  };

  // RENDER LOADING
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 dark:border-red-400 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">
            Memuat data...
          </p>
        </div>
      </div>
    );
  }

  // RENDER ERROR
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
            Akses Dibatasi
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-6">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-medium transition-all">
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  // RENDER MAIN CONTENT
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-red-100 dark:border-gray-700">
        {/* HEADER INFO */}
        <div className="p-4 md:p-6 border-b border-red-100 dark:border-gray-700 bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-red-800 dark:text-red-300">
                    E-RAPORT
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Sistem Pelaporan Hasil Belajar
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Nama:</span>{" "}
                  {userData?.full_name || userData?.name || "-"}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Role:</span>{" "}
                  {userData?.role === "guru_kelas"
                    ? "Guru Kelas"
                    : "Administrator"}
                </p>
                {kelas && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Kelas : </span>
                    {kelas}
                  </p>
                )}
                {academicYear && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Tahun Ajaran:</span>{" "}
                    {academicYear.year} - Semester{" "}
                    {academicYear.semester?.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-full text-sm font-medium whitespace-nowrap text-center">
                {userData?.role === "guru_kelas" ? "Guru Kelas" : "Admin"}
              </div>
              {kelas && (
                <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium whitespace-nowrap text-center">
                  Kelas {kelas}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="border-b border-red-100 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-200 ${
                activeTab === "preview"
                  ? "text-red-700 dark:text-red-400 border-b-4 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-gray-800"
              }`}>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">📊</span>
                <span className="text-sm md:text-base">Preview Nilai</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("cetak")}
              className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-200 ${
                activeTab === "cetak"
                  ? "text-red-700 dark:text-red-400 border-b-4 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-gray-800"
              }`}>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🖨️</span>
                <span className="text-sm md:text-base">Cetak Raport</span>
              </div>
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div>
          {activeTab === "preview" && (
            <PreviewRaport
              kelas={kelas}
              periode={periode}
              setPeriode={setPeriode}
              academicYear={academicYear}
              userData={userData}
            />
          )}

          {activeTab === "cetak" && <CetakRaport />}
        </div>
      </div>
    </div>
  );
}

export default RaportPage;
