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
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">
              Memuat data kelas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm sm:text-base text-red-800 font-semibold">
              Error: {error}
            </p>
            <p className="text-xs sm:text-sm text-red-600 mt-2">
              Pastikan Supabase URL dan Key sudah diisi dengan benar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <School className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
            Daftar Kelas
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Tahun Ajaran 2025/2026
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-4 sm:p-5 lg:p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-blue-700 font-medium">
                  Total Kelas
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">
                  {classes.length}
                </div>
              </div>
              <div className="bg-blue-200 p-2 sm:p-3 rounded-lg">
                <School className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-4 sm:p-5 lg:p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-green-700 font-medium">
                  Total Siswa
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
                  {classes.reduce((sum, cls) => sum + cls.jumlahSiswa, 0)}
                </div>
              </div>
              <div className="bg-green-200 p-2 sm:p-3 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-4 sm:p-5 lg:p-6 border border-purple-200 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-purple-700 font-medium">
                  Rata-rata Siswa/Kelas
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1 sm:mt-2">
                  {classes.length > 0
                    ? Math.round(
                        classes.reduce((sum, cls) => sum + cls.jumlahSiswa, 0) /
                          classes.length
                      )
                    : 0}
                </div>
              </div>
              <div className="bg-purple-200 p-2 sm:p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE: Card View */}
        <div className="block lg:hidden space-y-3 sm:space-y-4">
          {classes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <School className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm sm:text-base">
                Tidak ada data kelas
              </p>
            </div>
          ) : (
            classes.map((cls, index) => (
              <div
                key={cls.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs sm:text-sm text-gray-500">
                        #{index + 1}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        {cls.grade}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="truncate">{cls.waliKelas}</span>
                    </div>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-sm font-semibold">
                      {cls.jumlahSiswa}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <div className="flex-1 bg-green-50 rounded-lg p-2.5 text-center">
                    <div className="text-xs text-green-700 font-medium mb-1">
                      Laki-laki
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-green-600">
                      {cls.jumlahLaki}
                    </div>
                  </div>
                  <div className="flex-1 bg-pink-50 rounded-lg p-2.5 text-center">
                    <div className="text-xs text-pink-700 font-medium mb-1">
                      Perempuan
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-pink-600">
                      {cls.jumlahPerempuan}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP: Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Wali Kelas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Jumlah Siswa
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Laki-laki
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Perempuan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-500">
                      <School className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p>Tidak ada data kelas</p>
                    </td>
                  </tr>
                ) : (
                  classes.map((cls, index) => (
                    <tr
                      key={cls.id}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {cls.grade}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {cls.waliKelas}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          <Users className="w-3.5 h-3.5" />
                          {cls.jumlahSiswa}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <UserCheck className="w-3.5 h-3.5" />
                          {cls.jumlahLaki}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">
                          <UserCheck className="w-3.5 h-3.5" />
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
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 text-center">
          Total {classes.length} kelas aktif • Tahun Ajaran 2025/2026
        </div>
      </div>
    </div>
  );
}
