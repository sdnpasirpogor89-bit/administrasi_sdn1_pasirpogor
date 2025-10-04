import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, 
  Search, 
  School,
  UserCheck,
  User,
  Filter,
  X
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
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${colorClasses[color]} p-3 sm:p-4 hover:shadow-md transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{number}</p>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{label}</p>
        </div>
        <Icon size={24} className={`${iconColorClasses[color]} hidden sm:block`} />
        <Icon size={20} className={`${iconColorClasses[color]} sm:hidden`} />
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ isActive }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
      isActive 
        ? "bg-green-100 text-green-800 border border-green-200" 
        : "bg-red-100 text-red-800 border border-red-200"
    }`}>
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
};

// Mobile Student Card Component
const StudentCard = ({ student, index }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {student.nama_siswa}
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-mono">NISN: {student.nisn}</p>
        </div>
        <StatusBadge isActive={student.is_active} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <School size={14} className="text-gray-400" />
          <span className="text-gray-700">Kelas {student.kelas}</span>
        </div>
        <div className="flex items-center gap-1">
          <User size={14} className="text-gray-400" />
          <span className="text-gray-700">{student.jenis_kelamin}</span>
        </div>
      </div>
    </div>
  );
};

// Mobile Filter Modal
const FilterModal = ({ show, onClose, selectedClass, setSelectedClass, genderFilter, setGenderFilter, userData }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filter Siswa</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas
            </label>
            {userData.role !== 'guru_kelas' ? (
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Semua Kelas</option>
                {[1, 2, 3, 4, 5, 6].map(kelas => (
                  <option key={kelas} value={kelas}>Kelas {kelas}</option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                Kelas {userData.kelas}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Kelamin
            </label>
            <select 
              value={genderFilter} 
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Semua</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setSelectedClass('');
              setGenderFilter('');
            }}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Students Component - PRODUCTION READY
const Students = ({ userData }) => {
  // All hooks must be called first
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
  const [isMobile, setIsMobile] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

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
    if (userData) {
      fetchStudents();
    }
  }, [userData]);

  // Validation after hooks
  if (!userData) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
          <div className="w-10 h-10 border-3 border-red-100 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <p className="text-red-600 font-medium">Error: Data user tidak tersedia</p>
          <p className="text-sm text-gray-400 mt-2">Silakan login kembali</p>
        </div>
      </div>
    );
  }

  if (!userData.role || !userData.username) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
          <p className="text-red-600 font-medium">Error: Data user tidak lengkap</p>
          <p className="text-sm text-gray-400 mt-2">Hubungi administrator sistem</p>
        </div>
      </div>
    );
  }

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    if ((userData.role === 'admin' || userData.role === 'guru_mapel') && selectedClass && student.kelas.toString() !== selectedClass) {
      return false;
    }

    if (searchTerm && !student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !student.nisn.includes(searchTerm)) {
      return false;
    }

    if (genderFilter && student.jenis_kelamin !== genderFilter) {
      return false;
    }

    return true;
  });

  // Active filters count for badge
  const activeFiltersCount = [selectedClass, genderFilter].filter(Boolean).length;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
          <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* Optimized Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input - Full width on mobile */}
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          {/* Filter Button for Mobile */}
          {isMobile ? (
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium min-h-[44px]"
            >
              <Filter size={16} />
              Filter
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          ) : (
            /* Desktop Filters */
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Class Filter */}
              {userData.role !== 'guru_kelas' ? (
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="">Semua Kelas</option>
                  {[1, 2, 3, 4, 5, 6].map(kelas => (
                    <option key={kelas} value={kelas}>Kelas {kelas}</option>
                  ))}
                </select>
              ) : (
                <div className="flex-1 px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm sm:text-base min-h-[44px] flex items-center">
                  Kelas {userData.kelas}
                </div>
              )}
              
              {/* Gender Filter */}
              <select 
                value={genderFilter} 
                onChange={(e) => setGenderFilter(e.target.value)}
                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base min-h-[44px]"
              >
                <option value="">Semua Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          )}
        </div>

        {/* Active Filters Indicator */}
        {(selectedClass || genderFilter) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-500">Filter aktif:</span>
            {selectedClass && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Kelas {selectedClass}
                <button 
                  onClick={() => setSelectedClass('')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {genderFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                {genderFilter}
                <button 
                  onClick={() => setGenderFilter('')}
                  className="ml-1 hover:text-green-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Daftar Siswa</h2>
            <p className="text-sm text-gray-500 mt-1">
              Menampilkan {filteredStudents.length} dari {students.length} siswa
            </p>
          </div>
          {isMobile && (selectedClass || genderFilter) && (
            <button
              onClick={() => {
                setSelectedClass('');
                setGenderFilter('');
              }}
              className="mt-2 sm:mt-0 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Hapus Filter
            </button>
          )}
        </div>
      </div>

      {/* Students List - Responsive View */}
      {isMobile ? (
        // MOBILE CARD VIEW
        <div className="space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <Users size={48} className="text-gray-300" />
                <div>
                  <p className="text-gray-500 font-medium text-sm">
                    Tidak ada data siswa yang ditemukan
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Coba ubah kata kunci pencarian atau filter
                  </p>
                </div>
              </div>
            </div>
          ) : (
            filteredStudents.map((student, index) => (
              <StudentCard 
                key={student.id} 
                student={student} 
                index={index} 
              />
            ))
          )}
        </div>
      ) : (
        // DESKTOP TABLE VIEW
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider w-12">
                    No.
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider w-24">
                    NISN
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                    Jenis Kelamin
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
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
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-mono text-gray-600">
                        {student.nisn}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {student.nama_siswa}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-700 font-medium">
                          {student.jenis_kelamin}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-sm text-gray-700 font-medium">
                          Kelas {student.kelas}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <StatusBadge isActive={student.is_active} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Modal for Mobile */}
      <FilterModal
        show={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        userData={userData}
      />
    </div>
  );
};

export default Students;