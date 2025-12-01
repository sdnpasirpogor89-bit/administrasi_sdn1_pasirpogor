import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Users,
  UserCheck,
  School,
  BookOpen,
  Search,
  Filter, // unused, but kept for context
  MoreVertical,
} from "lucide-react";

// Compact Stats Card Component - RESPONSIVE (No changes needed)
const StatsCard = ({ icon: Icon, number, label, color }) => {
  const colorClasses = {
    blue: "border-l-blue-500 bg-gradient-to-r from-blue-50 to-white",
    green: "border-l-green-500 bg-gradient-to-r from-green-50 to-white",
    purple: "border-l-purple-500 bg-gradient-to-r from-purple-50 to-white",
    orange: "border-l-orange-500 bg-gradient-to-r from-orange-50 to-white",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-l-4 ${colorClasses[color]} p-3 sm:p-4 hover:shadow-md transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {number}
          </p>
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
            {label}
          </p>
        </div>
        <Icon
          size={24}
          className={`${iconColorClasses[color]} sm:w-7 sm:h-7`}
        />
      </div>
    </div>
  );
};

// Status Badge Component - RESPONSIVE (No changes needed)
const StatusBadge = ({ isActive }) => {
  return (
    <span
      className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
        isActive
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
      }`}>
      {isActive ? "Aktif" : "Tidak Aktif"}
    </span>
  );
};

// Teacher Card Component - FULLY RESPONSIVE (No changes needed)
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-xs sm:text-sm">
                {teacher.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                {teacher.full_name}
              </h3>
              <p className="text-xs text-gray-600">#{index + 1}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Tugas/Kelas</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                {formatTeachingArea(teacher)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Jumlah Siswa</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-800">
                {teacher.studentCount} siswa
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <StatusBadge isActive={teacher.is_active} />
            <button className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
              <MoreVertical
                size={16}
                className="sm:w-[18px] sm:h-[18px] text-gray-500"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Teacher Component - EFFICIENTLY RESPONSIVE
const Teacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // --- REVISI PRO: Hapus state isMobile dan logic useEffect terkait ---
  // const [isMobile, setIsMobile] = useState(false);
  // useEffect(() => {
  //   const checkDevice = () => {
  //     setIsMobile(window.innerWidth < 1024);
  //   };
  //   checkDevice();
  //   window.addEventListener("resize", checkDevice);
  //   return () => window.removeEventListener("resize", checkDevice);
  // }, []);
  // -------------------------------------------------------------------

  const [stats, setStats] = useState({
    totalGuru: 0,
    guruAktif: 0,
    guruKelas: 0,
    guruMapel: 0,
  });

  // Fungsi untuk mengurutkan guru (No changes)
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

  // Filter teachers (No changes)
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

  // Fetch data guru dari database (No changes)
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

  // Format tampilan tugas/kelas (No changes)
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
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64 sm:h-96 bg-white rounded-xl shadow-sm">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Memuat data guru...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* Compact Stats Cards - RESPONSIVE GRID (No changes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard
          icon={Users}
          number={stats.totalGuru}
          label="Total Guru"
          color="blue"
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

      {/* Filter Section - FULLY RESPONSIVE (No changes) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari nama guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base">
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Data Guru - RESPONSIVE LAYOUT - REVISI PRO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Daftar Guru
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Menampilkan {filteredTeachers.length} dari {teachers.length} guru
          </p>
        </div>

        {/* Card View (Mobile-First: Default, Sembunyikan di Large/Desktop) */}
        <div className="lg:hidden p-3 sm:p-4 space-y-3 sm:space-y-4">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher, index) => (
              <TeacherCard key={teacher.id} teacher={teacher} index={index} />
            ))
          ) : (
            <div className="text-center py-12 sm:py-16">
              <Users
                size={40}
                className="sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4"
              />
              <p className="text-sm sm:text-base text-gray-500 font-medium">
                Tidak ada data guru yang cocok
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table View (Sembunyikan di Mobile/Tablet, Tampilkan di Large/Desktop) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  No.
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Nama Guru
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Tugas/Kelas
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Jumlah Siswa
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {teacher.full_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 font-medium">
                        {formatTeachingArea(teacher)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {teacher.studentCount} siswa
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={teacher.is_active} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={48} className="text-gray-300" />
                      <div>
                        <p className="text-gray-500 font-medium">
                          Tidak ada data guru yang cocok
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
