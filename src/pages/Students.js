import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, 
  Search, 
  School,
  UserCheck,
  User
} from 'lucide-react';

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

// Main Students Component
const Students = ({ userData = { username: "admin", full_name: "ADMINISTRATOR", role: "admin", kelas: "3" } }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [stats, setStats] = useState({
    totalKelas: 0,
    totalSiswa: 0,
    lakiLaki: 0,
    perempuan: 0,
  });

  // Fetch students data from Supabase
  const fetchStudents = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('students')
        .select('*');

      // Role-based query filtering
      if (userData.role === 'guru_kelas') {
        query = query.eq('kelas', parseInt(userData.kelas));
      }

      // Order by class and name
      query = query.order('kelas', { ascending: true })
                  .order('nama_siswa', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      const studentsData = data || [];
      setStudents(studentsData);

      // Calculate statistics
      const uniqueClasses = [...new Set(studentsData.map(s => s.kelas))].length;
      const totalStudents = studentsData.length;
      const maleStudents = studentsData.filter(s => s.jenis_kelamin === 'Laki-laki').length;
      const femaleStudents = studentsData.filter(s => s.jenis_kelamin === 'Perempuan').length;

      setStats({
        totalKelas: uniqueClasses,
        totalSiswa: totalStudents,
        lakiLaki: maleStudents,
        perempuan: femaleStudents,
      });

    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Terjadi kesalahan saat mengambil data siswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [userData.role, userData.kelas]);

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    // Class filter (only for admin and guru_mapel)
    if ((userData.role === 'admin' || userData.role === 'guru_mapel') && selectedClass && student.kelas.toString() !== selectedClass) {
      return false;
    }

    // Search filter
    if (searchTerm && !student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !student.nisn.includes(searchTerm)) {
      return false;
    }

    // Gender filter
    if (genderFilter && student.jenis_kelamin !== genderFilter) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
          <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={School}
          number={stats.totalKelas}
          label="Total Kelas"
          color="blue"
        />
        <StatsCard
          icon={Users}
          number={stats.totalSiswa}
          label="Total Siswa"
          color="green"
        />
        <StatsCard
          icon={User}
          number={stats.lakiLaki}
          label="Laki-laki"
          color="purple"
        />
        <StatsCard
          icon={UserCheck}
          number={stats.perempuan}
          label="Perempuan"
          color="orange"
        />
      </div>

      {/* Clean Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Class Filter (only for admin and guru_mapel) */}
          {userData.role !== 'guru_kelas' ? (
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Pilihan Kelas</option>
              {[1, 2, 3, 4, 5, 6].map(kelas => (
                <option key={kelas} value={kelas}>Kelas {kelas}</option>
              ))}
            </select>
          ) : (
            <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              Kelas {userData.kelas}
            </div>
          )}
          
          {/* Gender Filter */}
          <select 
            value={genderFilter} 
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Jenis Kelamin</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
      </div>

      {/* Clean Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Daftar Siswa</h2>
          <p className="text-sm text-gray-500 mt-1">Menampilkan {filteredStudents.length} dari {students.length} siswa</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  NISN
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Jenis Kelamin
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={48} className="text-gray-300" />
                      <div>
                        <p className="text-gray-500 font-medium">
                          Tidak ada data siswa yang ditemukan
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Coba ubah kata kunci pencarian atau filter
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {student.nisn}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {student.nama_siswa}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 font-medium">
                        {student.jenis_kelamin}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 font-medium">
                        Kelas {student.kelas}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={student.is_active} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Students;