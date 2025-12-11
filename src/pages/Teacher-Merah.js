import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Users,
  UserCheck,
  School,
  BookOpen,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";

// Compact Stats Card Component - DIPERBAIKI dengan tema merah
const StatsCard = ({ icon: Icon, number, label, color }) => {
  const colorClasses = {
    red: "border-l-red-950 bg-gradient-to-r from-red-50 to-white dark:from-red-950/40 dark:to-gray-800",
    green:
      "border-l-green-600 bg-gradient-to-r from-green-50 to-white dark:from-green-950/40 dark:to-gray-800",
    purple:
      "border-l-purple-600 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/40 dark:to-gray-800",
    orange:
      "border-l-orange-600 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/40 dark:to-gray-800",
  };

  const iconColorClasses = {
    red: "text-red-950 dark:text-red-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400",
    orange: "text-orange-600 dark:text-orange-400",
  };

  return (
    <div
      className={`
        rounded-lg shadow-sm border-l-4 p-3 sm:p-4 transition-all duration-300
        ${colorClasses[color]} 
        hover:shadow-md hover:scale-[1.02] active:scale-95
        dark:bg-gray-800 dark:border-gray-700
        min-h-[96px] flex flex-col justify-center
        touch-manipulation
      `}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-none mb-1">
            {number}
          </p>
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
            {label}
          </p>
        </div>
        <Icon
          size={24}
          className={`${iconColorClasses[color]} sm:w-7 sm:h-7 flex-shrink-0`}
        />
      </div>
    </div>
  );
};

// Status Badge Component - DIPERBAIKI
const StatusBadge = ({ isActive }) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border min-w-[70px] justify-center ${
        isActive
          ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700"
          : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700"
      }`}>
      {isActive ? "Aktif" : "Tidak Aktif"}
    </span>
  );
};

// Teacher Card Component untuk Mobile - DIPERBAIKI
const TeacherCard = ({ teacher, index }) => {
  const formatTeachingArea = (teacher) => {
    if (teacher.role === "admin" || teacher.role === "kepala_sekolah") {
      return "Kepala Sekolah";
    } else if (teacher.role === "guru_kelas") {
      return `Kelas ${teacher.kelas}`;
    } else if (teacher.role === "guru_mapel") {
      const subjectMap = {
        yosefedi: "Mapel PJOK",
        acengmudrikah: "Mapel PABP",
      };
      return subjectMap[teacher.username] || "Mapel Lainnya";
    }
    return "-";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 active:scale-[0.99] touch-manipulation">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-red-900/50">
              <span className="text-red-950 font-bold text-sm sm:text-base dark:text-red-300">
                {teacher.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate dark:text-white">
                {teacher.full_name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                #{index + 1}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium dark:text-gray-400">
                Tugas/Kelas
              </p>
              <p className="text-sm font-semibold text-gray-800 truncate dark:text-gray-200">
                {formatTeachingArea(teacher)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium dark:text-gray-400">
                Jumlah Siswa
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {teacher.studentCount} siswa
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <StatusBadge isActive={teacher.is_active} />
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 dark:hover:bg-gray-700"
              aria-label={`Menu untuk ${teacher.full_name}`}>
              <MoreVertical
                size={18}
                className="text-gray-500 dark:text-gray-400"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Teacher Component - DIPERBAIKI
const Teacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [stats, setStats] = useState({
    totalGuru: 0,
    guruAktif: 0,
    guruKelas: 0,
    guruMapel: 0,
  });

  // Fungsi untuk mengurutkan guru
  const sortTeachers = (teachersArray) => {
    return teachersArray.sort((a, b) => {
      if (
        (a.role === "admin" || a.role === "kepala_sekolah") &&
        b.role !== "admin" &&
        b.role !== "kepala_sekolah"
      )
        return -1;
      if (
        (b.role === "admin" || b.role === "kepala_sekolah") &&
        a.role !== "admin" &&
        a.role !== "kepala_sekolah"
      )
        return 1;

      if (a.role === "guru_kelas" && b.role === "guru_mapel") return -1;
      if (a.role === "guru_mapel" && b.role === "guru_kelas") return 1;

      if (a.role === "guru_kelas" && b.role === "guru_kelas") {
        const kelasA = parseInt(a.kelas) || 0;
        const kelasB = parseInt(b.kelas) || 0;
        return kelasA - kelasB;
      }

      if (a.role === "guru_mapel" && b.role === "guru_mapel") {
        return a.full_name.localeCompare(b.full_name);
      }

      return 0;
    });
  };

  // Filter teachers
  useEffect(() => {
    let result = teachers;

    if (searchTerm) {
      result = result.filter((teacher) =>
        teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((teacher) =>
        statusFilter === "active" ? teacher.is_active : !teacher.is_active
      );
    }

    setFilteredTeachers(result);
  }, [teachers, searchTerm, statusFilter]);

  // Fetch data guru dari database
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data: teachersData, error: teachersError } = await supabase
        .from("users")
        .select("*")
        .or(
          "role.in.(kepala_sekolah,guru_kelas,guru_mapel),username.eq.yayanhaedar"
        );

      if (teachersError) throw teachersError;

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("kelas, is_active")
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      const studentsByClass = studentsData.reduce((acc, student) => {
        acc[student.kelas] = (acc[student.kelas] || 0) + 1;
        return acc;
      }, {});

      const totalStudents = studentsData.length;

      const teachersWithStudentCount = teachersData.map((teacher) => {
        let studentCount = 0;

        if (teacher.role === "guru_kelas") {
          studentCount = studentsByClass[teacher.kelas] || 0;
        } else if (teacher.role === "guru_mapel") {
          studentCount = totalStudents;
        } else if (
          teacher.role === "kepala_sekolah" ||
          teacher.username === "yayanhaedar"
        ) {
          studentCount = totalStudents;
        }

        return {
          ...teacher,
          studentCount,
        };
      });

      const sortedTeachers = sortTeachers(teachersWithStudentCount);
      setTeachers(sortedTeachers);
      setFilteredTeachers(sortedTeachers);

      const activeTeachers = sortedTeachers.filter(
        (t) =>
          t.is_active && (t.role === "guru_kelas" || t.role === "guru_mapel")
      );
      const classTeachers = sortedTeachers.filter(
        (t) => t.role === "guru_kelas"
      );
      const subjectTeachers = sortedTeachers.filter(
        (t) => t.role === "guru_mapel"
      );

      setStats({
        totalGuru: classTeachers.length + subjectTeachers.length,
        guruAktif: activeTeachers.length,
        guruKelas: classTeachers.length,
        guruMapel: subjectTeachers.length,
      });
    } catch (error) {
      console.error("Error fetching teachers:", error);
      alert("Terjadi kesalahan saat mengambil data guru");
    } finally {
      setLoading(false);
    }
  };

  // Format tampilan tugas/kelas
  const formatTeachingArea = (teacher) => {
    if (teacher.role === "admin" || teacher.role === "kepala_sekolah") {
      return "Kepala Sekolah";
    } else if (teacher.role === "guru_kelas") {
      return `Kelas ${teacher.kelas}`;
    } else if (teacher.role === "guru_mapel") {
      const subjectMap = {
        yosefedi: "Mapel PJOK",
        acengmudrikah: "Mapel PABP",
      };
      return subjectMap[teacher.username] || "Mapel Lainnya";
    }
    return "-";
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full max-w-md bg-white rounded-xl shadow-sm p-8 dark:bg-gray-800">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-red-100 border-t-red-950 rounded-full animate-spin mb-4 dark:border-red-900/50 dark:border-t-red-400"></div>
          <p className="text-sm sm:text-base text-gray-600 font-medium dark:text-gray-300">
            Memuat data guru...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard
          icon={Users}
          number={stats.totalGuru}
          label="Total Guru"
          color="red"
        />
        <StatsCard
          icon={UserCheck}
          number={stats.guruAktif}
          label="Guru Aktif"
          color="green"
        />
        <StatsCard
          icon={School}
          number={stats.guruKelas}
          label="Guru Kelas"
          color="purple"
        />
        <StatsCard
          icon={BookOpen}
          number={stats.guruMapel}
          label="Guru Mapel"
          color="orange"
        />
      </div>

      {/* Filter Section - DIPERBAIKI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={18}
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Cari nama guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 lg:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm sm:text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 touch-manipulation"
              aria-label="Cari guru"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3 lg:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm sm:text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white touch-manipulation"
              aria-label="Filter status guru">
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Data Guru - DIPERBAIKI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                Daftar Guru
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 dark:text-gray-400">
                Menampilkan {filteredTeachers.length} dari {teachers.length}{" "}
                guru
              </p>
            </div>
          </div>
        </div>

        {/* Card View untuk Mobile/Tablet */}
        <div className="lg:hidden p-3 sm:p-4 space-y-3 sm:space-y-4">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher, index) => (
              <TeacherCard key={teacher.id} teacher={teacher} index={index} />
            ))
          ) : (
            <div className="text-center py-12 sm:py-16">
              <Users
                size={48}
                className="sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4 dark:text-gray-600"
                aria-hidden="true"
              />
              <p className="text-sm sm:text-base text-gray-500 font-medium dark:text-gray-400">
                Tidak ada data guru yang cocok
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300 min-w-[80px]">
                  No.
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300 min-w-[200px]">
                  Nama Guru
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300 min-w-[150px]">
                  Tugas/Kelas
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300 min-w-[120px]">
                  Jumlah Siswa
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300 min-w-[120px]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300 min-w-[80px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-red-900/50">
                          <span className="text-red-950 font-bold text-sm dark:text-red-300">
                            {teacher.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {teacher.full_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 font-medium dark:text-gray-300">
                        {formatTeachingArea(teacher)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {teacher.studentCount} siswa
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={teacher.is_active} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
                        aria-label={`Menu untuk ${teacher.full_name}`}>
                        <MoreVertical
                          size={18}
                          className="text-gray-500 dark:text-gray-400"
                        />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users
                        size={56}
                        className="text-gray-300 dark:text-gray-600"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-gray-500 font-medium dark:text-gray-400">
                          Tidak ada data guru yang cocok
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Coba ubah filter pencarian
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Teacher;
