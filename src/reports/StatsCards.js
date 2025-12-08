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
    // 🆕 Dark Mode: Tambahkan bg-white/dark:bg-gray-900 ke container utama
    return (
      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl">
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Data statistik belum tersedia untuk filter ini.
        </p>
      </div>
    );
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

  // 2. REVISI UTAMA: MOBILE FIRST GRID WRAPPER
  return (
    // Gunakan grid yang responsive:
    // Mobile: grid-cols-2 (agar tidak terlalu panjang ke bawah)
    // Tablet (md): grid-cols-3
    // Laptop (lg): grid-cols-4
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      {renderCards()}
    </div>
  );
};

// ========================================
// CARD COMPONENT (DIREVISI untuk Dark Mode)
// ========================================

// 1. REVISI PALET WARNA UNTUK DARK MODE
const Card = ({ label, value, icon, color = "blue", subtitle }) => {
  const colorClasses = {
    // BLUE (General / Total)
    blue: {
      label: "text-blue-500 dark:text-blue-400",
      text: "text-blue-800 dark:text-blue-200",
      subtitle: "text-blue-500 dark:text-blue-400",
      icon: "bg-blue-200 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
      bg: "bg-blue-50 dark:bg-blue-900/40",
      border: "border-blue-200 dark:border-blue-700",
    },
    // GREEN (Success / Positif)
    green: {
      label: "text-green-500 dark:text-green-400",
      text: "text-green-800 dark:text-green-200",
      subtitle: "text-green-500 dark:text-green-400",
      icon: "bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-100",
      bg: "bg-green-50 dark:bg-green-900/40",
      border: "border-green-200 dark:border-green-700",
    },
    // YELLOW/ORANGE (Warning / Perhatian)
    orange: {
      label: "text-orange-500 dark:text-orange-400",
      text: "text-orange-800 dark:text-orange-200",
      subtitle: "text-orange-500 dark:text-orange-400",
      icon: "bg-orange-200 text-orange-700 dark:bg-orange-700 dark:text-orange-100",
      bg: "bg-orange-50 dark:bg-orange-900/40",
      border: "border-orange-200 dark:border-orange-700",
    },
    // RED (Negatif / Masalah)
    red: {
      label: "text-red-500 dark:text-red-400",
      text: "text-red-800 dark:text-red-200",
      subtitle: "text-red-500 dark:text-red-400",
      icon: "bg-red-200 text-red-700 dark:bg-red-700 dark:text-red-100",
      bg: "bg-red-50 dark:bg-red-900/40",
      border: "border-red-200 dark:border-red-700",
    },
    // PURPLE (Unik / Notes)
    purple: {
      label: "text-purple-500 dark:text-purple-400",
      text: "text-purple-800 dark:text-purple-200",
      subtitle: "text-purple-500 dark:text-purple-400",
      icon: "bg-purple-200 text-purple-700 dark:bg-purple-700 dark:text-purple-100",
      bg: "bg-purple-50 dark:bg-purple-900/40",
      border: "border-purple-200 dark:border-purple-700",
    },
    // GRAY (Neutral)
    gray: {
      label: "text-gray-500 dark:text-gray-400",
      text: "text-gray-800 dark:text-gray-200",
      subtitle: "text-gray-500 dark:text-gray-400",
      icon: "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100",
      bg: "bg-gray-50 dark:bg-gray-700",
      border: "border-gray-200 dark:border-gray-600",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  // 3. REVISI: Tambahkan dark:shadow-lg untuk shadow yang lebih baik di Dark Mode
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 dark:hover:shadow-xl dark:shadow-gray-900/50`}>
      <div
        className={`p-2.5 rounded-lg ${colors.icon} shadow-sm flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${colors.label} truncate`}>
          {label}
        </p>
        {/* Font size text-xl sudah pas untuk mobile/desktop */}
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
// RENDER CARDS LOGIC (TIDAK DIUBAH LOGICNYA, HANYA MEMANGGIL CARD BARU)
// ========================================

const renderStudentCards = (stats) => (
  <>
    <Card
      label="Total Siswa"
      value={stats.total}
      icon={<Users size={20} />}
      color="blue"
      subtitle={`Kelas: ${stats.kelas || "-"}`}
    />
    <Card
      label="Siswa Aktif"
      value={stats.active}
      icon={<UserCheck size={20} />}
      color="green"
      subtitle={`${stats.percentage}% dari total`}
    />
    <Card
      label="Siswa Laki-laki"
      value={stats.lakiLaki}
      icon={<UserCheck size={20} />}
      color="purple"
      subtitle={`Perempuan: ${stats.perempuan}`}
    />
    {/* Kartu Tambahan: Misal Siswa Tidak Aktif */}
    <Card
      label="Siswa Tidak Aktif"
      value={stats.inactive}
      icon={<AlertCircle size={20} />}
      color="red"
      subtitle="Perlu diverifikasi"
    />
  </>
);

const renderAttendanceCards = (stats) => (
  <>
    <Card
      label="Total Hari Sekolah"
      value={stats.totalDays}
      icon={<Calendar size={20} />}
      color="blue"
      subtitle={`Tahun Ajaran: ${stats.tahunAjaran || "-"}`}
    />
    <Card
      label="Total Hadir"
      value={stats.H}
      icon={<CheckCircle size={20} />}
      color="green"
      subtitle={`Rata-rata: ${stats.avgPercentage}%`}
    />
    <Card
      label="Total Izin/Sakit"
      value={stats.I + stats.S}
      icon={<Heart size={20} />}
      color="orange"
      subtitle={`Sakit: ${stats.S}, Izin: ${stats.I}`}
    />
    <Card
      label="Total Alpa"
      value={stats.A}
      icon={<XCircle size={20} />}
      color="red"
      subtitle="Perlu Tindak Lanjut"
    />
  </>
);

// REVISI: Kartu untuk Recap View
const renderAttendanceRecapCards = (stats) => (
  <>
    <Card
      label="Total Siswa"
      value={stats.totalStudents}
      icon={<Users size={20} />}
      color="blue"
      subtitle={`Kelas: ${stats.kelas || "-"}`}
    />
    <Card
      label="Rata-rata Kehadiran"
      value={`${stats.avgPercentage || "-"}%`}
      icon={<TrendingUp size={20} />}
      color={parseFloat(stats.avgPercentage) >= 80 ? "green" : "orange"}
      subtitle={`Total Hari: ${stats.totalDays}`}
    />
    <Card
      label="Siswa Kehadiran Baik (≥80%)"
      value={stats.goodAttendanceStudents}
      icon={<CheckCircle size={20} />}
      color="green"
      subtitle={`${stats.lowAttendanceStudents} siswa di bawah 70%`}
    />
    <Card
      label="Paling Sering Absen"
      value={stats.mostAbsentStudent || "-"}
      icon={<TrendingDown size={20} />}
      color="red"
      subtitle={`Alpa: ${stats.mostAbsentCount || 0}`}
    />
  </>
);

const renderGradeCards = (stats) => (
  <>
    <Card
      label="Jumlah Mata Pelajaran"
      value={stats.totalMapel}
      icon={<BookOpen size={20} />}
      color="purple"
      subtitle={`Kelas: ${stats.kelas || "-"}`}
    />
    <Card
      label="Rata-rata Nilai Kelas"
      value={formatValue(stats.avgGrade)}
      icon={<BarChart3 size={20} />}
      color={stats.avgGrade >= 75 ? "green" : "orange"}
      subtitle={`KKM: ${stats.kkm || "75"}`}
    />
    <Card
      label="Siswa Lulus KKM"
      value={stats.passedStudents}
      icon={<UserCheck size={20} />}
      color="green"
      subtitle={`Gagal KKM: ${stats.failedStudents}`}
    />
    <Card
      label="Nilai Tertinggi"
      value={formatValue(stats.maxGrade)}
      icon={<Award size={20} />}
      color="blue"
      subtitle={`Nilai Terendah: ${formatValue(stats.minGrade)}`}
    />
  </>
);

const renderNotesCards = (stats, userRole) => (
  <>
    <Card
      label="Total Catatan"
      value={stats.totalNotes}
      icon={<FileText size={20} />}
      color="blue"
      subtitle={
        userRole === "admin"
          ? `Kelas: ${stats.totalClasses}`
          : `Total Siswa: ${stats.totalStudents}`
      }
    />
    <Card
      label="Catatan Positif"
      value={stats.positiveNotes}
      icon={<TrendingUp size={20} />}
      color="green"
      subtitle={`Persentase: ${stats.positivePercentage}%`}
    />
    <Card
      label="Catatan Negatif/Perhatian"
      value={stats.negativeNotes}
      icon={<AlertCircle size={20} />}
      color="orange"
      subtitle={`Belum ditindak: ${stats.pendingActions}`}
    />
    <Card
      label="Catatan Tindak Lanjut"
      value={stats.resolvedNotes}
      icon={<Shield size={20} />}
      color="purple"
      subtitle={`Sisa: ${stats.totalNotes - stats.resolvedNotes}`}
    />
  </>
);

// ========================================
// UTILITY (TIDAK DIUBAH LOGICNYA)
// ========================================

const formatValue = (value) => {
  if (value === null || value === undefined) return "-";

  if (typeof value === "string") {
    // Check if it looks like a number string
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      value = parseFloat(value);
    } else {
      return value;
    }
  }

  // Formatting numbers
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return value.toLocaleString("id-ID");
    }
    return value.toFixed(1).toLocaleString("id-ID");
  }

  return String(value);
};

export default StatsCards;
