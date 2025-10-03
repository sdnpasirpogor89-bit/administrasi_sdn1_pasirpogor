import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { 
  Users, 
  UserCheck, 
  School, 
  BookOpen
} from "lucide-react";

// Compact Stats Card Component
const StatsCard = ({ icon: Icon, number, label, color }) => {
  const colorClasses = {
    blue: "border-l-blue-500 bg-gradient-to-r from-blue-50 to-white",
    green: "border-l-green-500 bg-gradient-to-r from-green-50 to-white", 
    purple: "border-l-purple-500 bg-gradient-to-r from-purple-50 to-white",
    orange: "border-l-orange-500 bg-gradient-to-r from-orange-50 to-white"
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600", 
    orange: "text-orange-600"
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${colorClasses[color]} p-4 hover:shadow-md transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{number}</p>
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
        <Icon size={28} className={iconColorClasses[color]} />
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ isActive }) => {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
      isActive 
        ? "bg-green-100 text-green-800 border border-green-200" 
        : "bg-red-100 text-red-800 border border-red-200"
    }`}>
      {isActive ? "Aktif" : "Tidak Aktif"}
    </span>
  );
};

// Main Teacher Component
const Teacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGuru: 0,
    guruAktif: 0,
    guruKelas: 0,
    guruMapel: 0,
  });

  // Fungsi untuk mengurutkan guru
  const sortTeachers = (teachersArray) => {
    return teachersArray.sort((a, b) => {
      // Kepala sekolah/admin di paling atas
      if ((a.role === "admin" || a.role === "kepala_sekolah") && 
          (b.role !== "admin" && b.role !== "kepala_sekolah")) return -1;
      if ((b.role === "admin" || b.role === "kepala_sekolah") && 
          (a.role !== "admin" && a.role !== "kepala_sekolah")) return 1;
      
      // Guru kelas di atas guru mapel
      if (a.role === "guru_kelas" && b.role === "guru_mapel") return -1;
      if (a.role === "guru_mapel" && b.role === "guru_kelas") return 1;
      
      // Jika sama-sama guru kelas, urutkan berdasarkan nomor kelas
      if (a.role === "guru_kelas" && b.role === "guru_kelas") {
        const kelasA = parseInt(a.kelas) || 0;
        const kelasB = parseInt(b.kelas) || 0;
        return kelasA - kelasB;
      }
      
      // Jika sama-sama guru mapel, urutkan berdasarkan nama
      if (a.role === "guru_mapel" && b.role === "guru_mapel") {
        return a.full_name.localeCompare(b.full_name);
      }
      
      return 0;
    });
  };

  // Fetch data guru dari database
  const fetchTeachers = async () => {
    try {
      setLoading(true);

      // Query untuk mengambil semua user (termasuk admin/kepala sekolah)
      const { data: teachersData, error: teachersError } = await supabase
        .from("users")
        .select("*")
        .in("role", ["admin", "kepala_sekolah", "guru_kelas", "guru_mapel"]);

      if (teachersError) throw teachersError;

      // Query untuk menghitung jumlah siswa per kelas
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("kelas, is_active")
        .eq("is_active", true);

      if (studentsError) throw studentsError;

      // Hitung jumlah siswa per kelas
      const studentsByClass = studentsData.reduce((acc, student) => {
        acc[student.kelas] = (acc[student.kelas] || 0) + 1;
        return acc;
      }, {});

      const totalStudents = studentsData.length;

      // Gabungkan data guru dengan jumlah siswa
      const teachersWithStudentCount = teachersData.map((teacher) => {
        let studentCount = 0;

        if (teacher.role === "guru_kelas") {
          studentCount = studentsByClass[teacher.kelas] || 0;
        } else if (teacher.role === "guru_mapel") {
          studentCount = totalStudents; // Guru mapel mengajar semua siswa
        } else if (teacher.role === "admin" || teacher.role === "kepala_sekolah") {
          studentCount = totalStudents; // Kepala sekolah membawahi semua siswa
        }

        return {
          ...teacher,
          studentCount,
        };
      });

      // Urutkan: kepala sekolah, guru kelas, guru mapel
      const sortedTeachers = sortTeachers(teachersWithStudentCount);
      setTeachers(sortedTeachers);

      // Hitung statistik (tanpa admin/kepala sekolah)
      const activeTeachers = sortedTeachers.filter(
        (t) => t.is_active && (t.role === "guru_kelas" || t.role === "guru_mapel")
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
      // Mapping username ke nama mata pelajaran
      const subjectMap = {
        yosefedi: "Mapel PJOK",
        acengmudrikah: "Mapel PAI",
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
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
          <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data guru...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Tabel Data Guru */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Daftar Guru</h2>
          <p className="text-sm text-gray-500 mt-1">Menampilkan {teachers.length} guru</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama Guru
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tugas/Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Jumlah Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.length > 0 ? (
                teachers.map((teacher, index) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
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
                          Tidak ada data guru
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