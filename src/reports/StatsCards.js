// src/reports/StatsCards.js
import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  TrendingDown,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  BarChart3
} from 'lucide-react';

/**
 * Component untuk display statistics dalam bentuk cards
 * 
 * @param {object} stats - Stats object dari useAnalytics
 * @param {string} type - Report type: 'students' | 'grades' | 'attendance' | 'teachers'
 */
const StatsCards = ({ stats, type }) => {
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 text-sm">
          Tidak ada data statistik untuk ditampilkan.
        </p>
      </div>
    );
  }

  // Render berdasarkan type
  const renderCards = () => {
    switch (type) {
      case 'students':
        return renderStudentCards(stats);
      case 'grades':
        return renderGradeCards(stats);
      case 'attendance':
        return renderAttendanceCards(stats);
      case 'teachers':
        return renderTeacherCards(stats);
      default:
        return null;
    }
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderCards()}
      </div>
    </div>
  );
};

// ========================================
// STUDENT CARDS
// ========================================

const renderStudentCards = (stats) => {
  return (
    <>
      <StatCard
        icon={<Users className="text-blue-600" size={24} />}
        label="Total Siswa"
        value={stats.total}
        color="blue"
      />
      <StatCard
        icon={<UserCheck className="text-green-600" size={24} />}
        label="Siswa Aktif"
        value={stats.aktif}
        subtitle={`${stats.persentaseAktif}% dari total`}
        color="green"
      />
      <StatCard
        icon={<Users className="text-indigo-600" size={24} />}
        label="Laki-laki"
        value={stats.lakiLaki}
        subtitle={`${stats.persentaseLakiLaki}%`}
        color="indigo"
      />
      <StatCard
        icon={<Users className="text-pink-600" size={24} />}
        label="Perempuan"
        value={stats.perempuan}
        subtitle={`${stats.persentasePerempuan}%`}
        color="pink"
      />
    </>
  );
};

// ========================================
// GRADE CARDS
// ========================================

const renderGradeCards = (stats) => {
  return (
    <>
      <StatCard
        icon={<FileText className="text-blue-600" size={24} />}
        label="Total Data Nilai"
        value={stats.total}
        color="blue"
      />
      <StatCard
        icon={<TrendingUp className="text-green-600" size={24} />}
        label="Rata-rata Nilai"
        value={stats.rataRata}
        subtitle={`Tertinggi: ${stats.tertinggi} | Terendah: ${stats.terendah}`}
        color="green"
      />
      <StatCard
        icon={<Award className="text-emerald-600" size={24} />}
        label="Lulus (≥75)"
        value={stats.diAtas75}
        subtitle={`${stats.persentaseLulus}% lulus`}
        color="emerald"
      />
      <StatCard
        icon={<AlertCircle className="text-orange-600" size={24} />}
        label="Belum Lulus (<75)"
        value={stats.diBawah75}
        subtitle={`${(100 - stats.persentaseLulus).toFixed(1)}% belum lulus`}
        color="orange"
      />
    </>
  );
};

// ========================================
// ATTENDANCE CARDS
// ========================================

const renderAttendanceCards = (stats) => {
  return (
    <>
      <StatCard
        icon={<FileText className="text-blue-600" size={24} />}
        label="Total Data Presensi"
        value={stats.total}
        color="blue"
      />
      <StatCard
        icon={<CheckCircle className="text-green-600" size={24} />}
        label="Hadir"
        value={stats.hadir}
        subtitle={`${stats.persentaseKehadiran}% kehadiran`}
        color="green"
      />
      <StatCard
        icon={<AlertCircle className="text-yellow-600" size={24} />}
        label="Sakit"
        value={stats.sakit}
        subtitle={`${stats.persentaseSakit}%`}
        color="yellow"
      />
      <StatCard
        icon={<XCircle className="text-red-600" size={24} />}
        label="Izin & Alpa"
        value={stats.izin + stats.alpa}
        subtitle={`Izin: ${stats.izin} | Alpa: ${stats.alpa}`}
        color="red"
      />
    </>
  );
};

// ========================================
// TEACHER CARDS
// ========================================

const renderTeacherCards = (stats) => {
  return (
    <>
      <StatCard
        icon={<Users className="text-blue-600" size={24} />}
        label="Total Guru"
        value={stats.totalGuru}
        color="blue"
      />
      <StatCard
        icon={<BarChart3 className="text-green-600" size={24} />}
        label="Total Input"
        value={stats.totalInput}
        subtitle={`Rata-rata: ${stats.rataRataInputPerGuru} per guru`}
        color="green"
      />
      <StatCard
        icon={<FileText className="text-indigo-600" size={24} />}
        label="Input Nilai"
        value={stats.totalInputNilai}
        color="indigo"
      />
      <StatCard
        icon={<Clock className="text-orange-600" size={24} />}
        label="Belum Input (7 Hari)"
        value={stats.guruBelumInput}
        subtitle={`${stats.totalGuru - stats.guruBelumInput} guru aktif`}
        color="orange"
      />
    </>
  );
};

// ========================================
// STAT CARD COMPONENT (REUSABLE)
// ========================================

const StatCard = ({ icon, label, value, subtitle, color = 'blue' }) => {
  // Color mapping
  const colorClasses = {
    blue: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-900',
    },
    green: {
      border: 'border-l-green-500',
      bg: 'bg-green-50',
      text: 'text-green-900',
    },
    indigo: {
      border: 'border-l-indigo-500',
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
    },
    pink: {
      border: 'border-l-pink-500',
      bg: 'bg-pink-50',
      text: 'text-pink-900',
    },
    emerald: {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
    },
    orange: {
      border: 'border-l-orange-500',
      bg: 'bg-orange-50',
      text: 'text-orange-900',
    },
    yellow: {
      border: 'border-l-yellow-500',
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
    },
    red: {
      border: 'border-l-red-500',
      bg: 'bg-red-50',
      text: 'text-red-900',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm border-l-4 ${colors.border}
        p-4 hover:shadow-md transition-shadow duration-200
      `}
    >
      {/* Icon & Label */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
        </div>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className={`text-3xl font-bold ${colors.text} mb-1`}>
        {formatValue(value)}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format value untuk display
 */
const formatValue = (value) => {
  if (value === null || value === undefined) return '-';
  
  // Jika number dengan decimal, tampilkan 2 digit
  if (typeof value === 'number' && !Number.isInteger(value)) {
    return value.toFixed(2);
  }
  
  // Jika integer, tampilkan biasa
  if (typeof value === 'number') {
    return value.toLocaleString('id-ID');
  }
  
  return value;
};

export default StatsCards;