// src/reports/StatsCards.js
import React from "react";
import {
  Users,
  UserCheck,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Award,
  TrendingDown,
  BarChart3,
  BookOpen,
  Heart,
  Shield,
  Activity,
} from "lucide-react";

/**
 * Compact Stats Cards - Single Row Layout
 * ✅ Minimalis & Clean dengan Pastel Colors
 * ✅ Dynamic per Tab & View Mode
 * ✅ Support Attendance Recap View
 * ✅ FIXED: Notes Stats untuk Guru Kelas
 */
const StatsCards = ({ type, stats, userRole, viewMode = "detail" }) => {
  if (!stats || Object.keys(stats).length === 0) {
    return null;
  }

  // Render berdasarkan type
  const renderCards = () => {
    switch (type) {
      case "students":
        return renderStudentCards(stats);
      case "attendance":
        // Check view mode untuk attendance
        if (viewMode === "recap") {
          return renderAttendanceRecapCards(stats);
        }
        return renderAttendanceCards(stats);
      case "grades":
        return renderGradeCards(stats);
      case "notes":
        return renderNotesCards(stats, userRole);
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderCards()}
      </div>
    </div>
  );
};

// ========================================
// STUDENT STATS
// ========================================
const renderStudentCards = (stats) => {
  return (
    <>
      <MiniStatCard
        icon={<Users className="w-5 h-5" />}
        label="Total Siswa Aktif"
        value={stats.totalSiswaAktif || 0}
        color="blue"
      />
      <MiniStatCard
        icon={<Users className="w-5 h-5" />}
        label="Laki-laki"
        value={stats.siswaLaki || 0}
        color="indigo"
      />
      <MiniStatCard
        icon={<Users className="w-5 h-5" />}
        label="Perempuan"
        value={stats.siswaPerempuan || 0}
        color="pink"
      />
      <MiniStatCard
        icon={<XCircle className="w-5 h-5" />}
        label="Tidak Aktif"
        value={stats.siswaTidakAktif || 0}
        color={stats.siswaTidakAktif > 0 ? "red" : "green"}
      />
    </>
  );
};

// ========================================
// ATTENDANCE STATS (DETAIL VIEW)
// ========================================
const renderAttendanceCards = (stats) => {
  // Calculate Izin + Alpa (convert string to number first)
  const persenIzin = parseFloat(stats.persenIzin) || 0;
  const persenAlpa = parseFloat(stats.persenAlpa) || 0;
  const totalIzinAlpa = (persenIzin + persenAlpa).toFixed(1);

  return (
    <>
      <MiniStatCard
        icon={<Calendar className="w-5 h-5" />}
        label="Total Hari"
        value={stats.totalHari || 0}
        color="blue"
      />
      <MiniStatCard
        icon={<CheckCircle className="w-5 h-5" />}
        label="Hadir"
        value={`${stats.persenHadir || 0}%`}
        color="green"
      />
      <MiniStatCard
        icon={<AlertCircle className="w-5 h-5" />}
        label="Sakit"
        value={`${stats.persenSakit || 0}%`}
        color="yellow"
      />
      <MiniStatCard
        icon={<XCircle className="w-5 h-5" />}
        label="Izin & Alpa"
        value={`${totalIzinAlpa}%`}
        color="red"
      />
    </>
  );
};

// ========================================
// ATTENDANCE RECAP STATS
// ========================================
const renderAttendanceRecapCards = (stats) => {
  const rataRata = parseFloat(stats.rataRataKehadiran) || 0;

  // Determine color based on average attendance
  let avgColor = "red";
  if (rataRata >= 90) avgColor = "green";
  else if (rataRata >= 80) avgColor = "blue";
  else if (rataRata >= 70) avgColor = "yellow";

  return (
    <>
      {/* Card 1: Total Siswa */}
      <MiniStatCard
        icon={<Users className="w-5 h-5" />}
        label="Total Siswa"
        value={stats.totalSiswa || 0}
        subtitle={`${stats.totalHariEfektif || 0} hari efektif`}
        color="blue"
      />

      {/* Card 2: Rata-rata Kehadiran */}
      <MiniStatCard
        icon={<BarChart3 className="w-5 h-5" />}
        label="Rata-rata Kehadiran"
        value={`${stats.rataRataKehadiran || 0}%`}
        subtitle={
          rataRata >= 90
            ? "Sangat Baik"
            : rataRata >= 80
            ? "Baik"
            : rataRata >= 70
            ? "Cukup"
            : "Perlu Perhatian"
        }
        color={avgColor}
      />

      {/* Card 3: Siswa Sangat Baik (>=90%) */}
      <MiniStatCard
        icon={<Award className="w-5 h-5" />}
        label="Kehadiran ≥90%"
        value={stats.siswaSangatBaik || 0}
        subtitle={`Tertinggi: ${stats.tertinggi || 0}%`}
        color="green"
      />

      {/* Card 4: Siswa Bermasalah (<80%) */}
      <MiniStatCard
        icon={<AlertCircle className="w-5 h-5" />}
        label="Kehadiran <80%"
        value={stats.siswaRendah || 0}
        subtitle={`Terendah: ${stats.terendah || 0}%`}
        color={stats.siswaRendah > 0 ? "red" : "green"}
      />
    </>
  );
};

// ========================================
// GRADES STATS
// ========================================
const renderGradeCards = (stats) => {
  return (
    <>
      <MiniStatCard
        icon={<TrendingUp className="w-5 h-5" />}
        label="Rata-rata"
        value={stats.rataRata || 0}
        color="blue"
      />
      <MiniStatCard
        icon={<Award className="w-5 h-5" />}
        label="Tertinggi"
        value={stats.tertinggi || 0}
        color="green"
      />
      <MiniStatCard
        icon={<AlertCircle className="w-5 h-5" />}
        label="Terendah"
        value={stats.terendah || 0}
        color="orange"
      />
      <MiniStatCard
        icon={<CheckCircle className="w-5 h-5" />}
        label="Tuntas"
        value={`${stats.tuntas || 0}/${stats.totalSiswa || 0}`}
        color="emerald"
      />
    </>
  );
};

// ========================================
// ✅ NOTES STATS - FIXED UNTUK GURU KELAS
// ========================================
/**
 * Stats untuk Catatan Siswa
 * - Total Catatan
 * - Catatan Akademik
 * - Catatan Perilaku
 * - Catatan Karakter
 *
 * CATATAN: Semua data sudah pasti dari guru_kelas itu sendiri
 * karena di backend sudah difilter by teacher_id
 */
const renderNotesCards = (stats, userRole) => {
  return (
    <>
      {/* Card 1: Total Catatan */}
      <MiniStatCard
        icon={<FileText className="w-5 h-5" />}
        label="Total Catatan"
        value={stats.totalCatatan || 0}
        subtitle={userRole === "guru_kelas" ? "Catatan Anda" : undefined}
        color="blue"
      />

      {/* Card 2: Catatan Akademik */}
      <MiniStatCard
        icon={<BookOpen className="w-5 h-5" />}
        label="Akademik"
        value={stats.catatanAkademik || 0}
        subtitle={
          stats.totalCatatan > 0
            ? `${((stats.catatanAkademik / stats.totalCatatan) * 100).toFixed(
                0
              )}%`
            : undefined
        }
        color="green"
      />

      {/* Card 3: Catatan Perilaku */}
      <MiniStatCard
        icon={<Shield className="w-5 h-5" />}
        label="Perilaku"
        value={stats.catatanPerilaku || 0}
        subtitle={
          stats.totalCatatan > 0
            ? `${((stats.catatanPerilaku / stats.totalCatatan) * 100).toFixed(
                0
              )}%`
            : undefined
        }
        color="orange"
      />

      {/* Card 4: Catatan Karakter */}
      <MiniStatCard
        icon={<Heart className="w-5 h-5" />}
        label="Karakter"
        value={stats.catatanKarakter || 0}
        subtitle={
          stats.totalCatatan > 0
            ? `${((stats.catatanKarakter / stats.totalCatatan) * 100).toFixed(
                0
              )}%`
            : undefined
        }
        color="purple"
      />
    </>
  );
};

// ========================================
// MINI STAT CARD (COMPACT WITH PASTEL COLORS)
// ========================================
const MiniStatCard = ({ icon, label, value, subtitle, color = "blue" }) => {
  // Color mapping - Pastel backgrounds with matching icons and text
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      icon: "text-blue-600 bg-white/80",
      text: "text-blue-900",
      label: "text-blue-700",
      subtitle: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      icon: "text-green-600 bg-white/80",
      text: "text-green-900",
      label: "text-green-700",
      subtitle: "text-green-600",
      border: "border-green-200",
    },
    indigo: {
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      icon: "text-indigo-600 bg-white/80",
      text: "text-indigo-900",
      label: "text-indigo-700",
      subtitle: "text-indigo-600",
      border: "border-indigo-200",
    },
    pink: {
      bg: "bg-gradient-to-br from-pink-50 to-pink-100",
      icon: "text-pink-600 bg-white/80",
      text: "text-pink-900",
      label: "text-pink-700",
      subtitle: "text-pink-600",
      border: "border-pink-200",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      icon: "text-purple-600 bg-white/80",
      text: "text-purple-900",
      label: "text-purple-700",
      subtitle: "text-purple-600",
      border: "border-purple-200",
    },
    emerald: {
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      icon: "text-emerald-600 bg-white/80",
      text: "text-emerald-900",
      label: "text-emerald-700",
      subtitle: "text-emerald-600",
      border: "border-emerald-200",
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100",
      icon: "text-orange-600 bg-white/80",
      text: "text-orange-900",
      label: "text-orange-700",
      subtitle: "text-orange-600",
      border: "border-orange-200",
    },
    yellow: {
      bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      icon: "text-yellow-600 bg-white/80",
      text: "text-yellow-900",
      label: "text-yellow-700",
      subtitle: "text-yellow-600",
      border: "border-yellow-200",
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 to-red-100",
      icon: "text-red-600 bg-white/80",
      text: "text-red-900",
      label: "text-red-700",
      subtitle: "text-red-600",
      border: "border-red-200",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-md hover:scale-[1.02] transition-all duration-200`}>
      <div
        className={`p-2.5 rounded-lg ${colors.icon} shadow-sm flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${colors.label} truncate`}>
          {label}
        </p>
        <p className={`text-xl font-bold ${colors.text}`}>
          {formatValue(value)}
        </p>
        {subtitle && (
          <p
            className={`text-xs font-medium ${colors.subtitle} truncate mt-0.5`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

// ========================================
// UTILITY
// ========================================
const formatValue = (value) => {
  if (value === null || value === undefined) return "-";

  // Jika sudah string (misal: "95%", "28/32"), return as is
  if (typeof value === "string") return value;

  // Jika number dengan decimal, tampilkan 1 digit
  if (typeof value === "number" && !Number.isInteger(value)) {
    return value.toFixed(1);
  }

  // Jika integer
  if (typeof value === "number") {
    return value.toLocaleString("id-ID");
  }

  return value;
};

export default StatsCards;
