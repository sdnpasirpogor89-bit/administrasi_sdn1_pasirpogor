import React, { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Users, School, TrendingUp, User, UserCheck } from "lucide-react";

// Initialize Supabase client from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch classes data
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .eq("is_active", true)
        .eq("academic_year", "2025/2026")
        .order("grade", { ascending: true });

      if (classesError) throw classesError;

      // Fetch students data
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("kelas, jenis_kelamin, is_active")
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      // Fetch wali kelas from users table
      const { data: teachersData, error: teachersError } = await supabase
        .from("users")
        .select("kelas, full_name")
        .eq("role", "guru_kelas")
        .eq("is_active", true);

      if (teachersError) throw teachersError;

      // Process data
      const processedClasses = classesData.map((cls) => {
        // Extract number from grade (e.g., "Kelas 1" -> "1")
        const kelasNumber = cls.grade.replace("Kelas ", "");

        const classStudents = studentsData.filter(
          (s) => s.kelas === kelasNumber
        );
        const waliKelas = teachersData.find((t) => t.kelas === kelasNumber);

        const jumlahLaki = classStudents.filter(
          (s) => s.jenis_kelamin === "Laki-laki"
        ).length;
        const jumlahPerempuan = classStudents.filter(
          (s) => s.jenis_kelamin === "Perempuan"
        ).length;

        return {
          ...cls,
          waliKelas: waliKelas?.full_name || "-",
          jumlahSiswa: classStudents.length,
          jumlahLaki,
          jumlahPerempuan,
        };
      });

      setClasses(processedClasses);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-slate-900 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[50vh] py-8 sm:py-12">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 border-t-2 border-b-2 border-red-600 dark:border-red-400"></div>
            <p className="mt-4 text-sm sm:text-base md:text-lg text-red-800 dark:text-slate-300 font-medium">
              Memuat data kelas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-slate-900 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4 sm:p-5 md:p-6 mt-4 sm:mt-6">
            <div className="flex items-start gap-3">
              <div className="bg-red-200 dark:bg-red-800 p-2 rounded-lg">
                <School className="w-5 h-5 sm:w-6 sm:h-6 text-red-700 dark:text-red-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base md:text-lg text-red-800 dark:text-red-200 font-semibold">
                  Error: {error}
                </p>
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-300 mt-2">
                  Pastikan Supabase URL dan Key sudah diisi dengan benar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 dark:bg-slate-900 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900 dark:text-slate-100">
            Data Kelas
          </h1>
          <p className="text-sm sm:text-base text-red-700 dark:text-slate-300 mt-1">
            Tahun Ajaran 2025/2026
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/40 rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 border border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">
                  Total Kelas
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-800 dark:text-red-200 mt-1 sm:mt-2">
                  {classes.length}
                </div>
              </div>
              <div className="bg-red-200 dark:bg-red-800 p-2.5 sm:p-3 rounded-lg">
                <School className="w-5 h-5 sm:w-6 sm:h-6 text-red-700 dark:text-red-300" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/40 rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 border border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">
                  Total Siswa
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-800 dark:text-red-200 mt-1 sm:mt-2">
                  {classes.reduce((sum, cls) => sum + cls.jumlahSiswa, 0)}
                </div>
              </div>
              <div className="bg-red-200 dark:bg-red-800 p-2.5 sm:p-3 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-red-700 dark:text-red-300" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/40 rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 border border-red-200 dark:border-red-700 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">
                  Rata-rata Siswa/Kelas
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-800 dark:text-red-200 mt-1 sm:mt-2">
                  {classes.length > 0
                    ? Math.round(
                        classes.reduce((sum, cls) => sum + cls.jumlahSiswa, 0) /
                          classes.length
                      )
                    : 0}
                </div>
              </div>
              <div className="bg-red-200 dark:bg-red-800 p-2.5 sm:p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-700 dark:text-red-300" />
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE: Card View */}
        <div className="block lg:hidden space-y-3 sm:space-y-4">
          {classes.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 sm:p-8 text-center">
              <School className="w-14 h-14 sm:w-16 sm:h-16 text-red-300 dark:text-slate-500 mx-auto mb-4" />
              <p className="text-red-500 dark:text-slate-400 text-base sm:text-lg font-medium">
                Tidak ada data kelas
              </p>
              <p className="text-sm text-red-400 dark:text-slate-500 mt-2">
                Silakan tambahkan data kelas terlebih dahulu
              </p>
            </div>
          ) : (
            classes.map((cls, index) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow active:scale-[0.995] touch-manipulation"
                role="button"
                tabIndex={0}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs sm:text-sm text-red-500 dark:text-slate-400 font-medium">
                        #{index + 1}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-red-900 dark:text-slate-100 truncate">
                        {cls.grade}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-slate-400">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">{cls.waliKelas}</span>
                    </div>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 flex-shrink-0 ml-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm sm:text-base font-bold">
                      {cls.jumlahSiswa}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-red-100 dark:border-slate-700">
                  <div className="flex-1 bg-red-50 dark:bg-red-900/30 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium mb-1">
                      Laki-laki
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-red-800 dark:text-red-200">
                      {cls.jumlahLaki}
                    </div>
                  </div>
                  <div className="flex-1 bg-rose-50 dark:bg-rose-900/30 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium mb-1">
                      Perempuan
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-rose-800 dark:text-rose-200">
                      {cls.jumlahPerempuan}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP: Table View */}
        <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-red-200 dark:divide-slate-700">
              <thead className="bg-red-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-red-900 dark:text-slate-100 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-red-900 dark:text-slate-100 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-red-900 dark:text-slate-100 uppercase tracking-wider">
                    Wali Kelas
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-red-900 dark:text-slate-100 uppercase tracking-wider">
                    Jumlah Siswa
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-red-900 dark:text-slate-100 uppercase tracking-wider">
                    Laki-laki
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-red-900 dark:text-slate-100 uppercase tracking-wider">
                    Perempuan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-red-100 dark:divide-slate-700">
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <School className="w-16 h-16 text-red-300 dark:text-slate-500 mx-auto mb-4" />
                      <p className="text-red-500 dark:text-slate-400 text-lg font-medium">
                        Tidak ada data kelas
                      </p>
                      <p className="text-sm text-red-400 dark:text-slate-500 mt-1">
                        Silakan tambahkan data kelas terlebih dahulu
                      </p>
                    </td>
                  </tr>
                ) : (
                  classes.map((cls, index) => (
                    <tr
                      key={cls.id}
                      className="hover:bg-red-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-900 dark:text-slate-100">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg">
                            <School className="w-5 h-5 text-red-700 dark:text-red-300" />
                          </div>
                          <span className="text-base font-medium text-red-900 dark:text-slate-100">
                            {cls.grade}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg">
                            <User className="w-5 h-5 text-red-700 dark:text-red-300" />
                          </div>
                          <span className="text-base text-red-900 dark:text-slate-100">
                            {cls.waliKelas}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-bold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                          <Users className="w-5 h-5" />
                          {cls.jumlahSiswa}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-bold bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                          <UserCheck className="w-5 h-5" />
                          {cls.jumlahLaki}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-bold bg-rose-50 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300">
                          <UserCheck className="w-5 h-5" />
                          {cls.jumlahPerempuan}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 border-t border-red-200 dark:border-slate-700">
          <div className="text-center">
            <p className="text-sm sm:text-base text-red-700 dark:text-slate-400">
              Total{" "}
              <span className="font-bold text-red-900 dark:text-slate-100">
                {classes.length}
              </span>{" "}
              kelas aktif • Tahun Ajaran 2025/2026
            </p>
            <p className="text-xs text-red-500 dark:text-slate-500 mt-1">
              Terakhir diperbarui: {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
