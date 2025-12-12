// src/reports/StatsCards.js
import React, { useState, useEffect } from "react";
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
  ChevronRight,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";

/**
 * Compact Stats Cards - Mobile First Responsive Design
 * ✅ Mobile-first responsive layout
 * ✅ Dark mode support
 * ✅ Touch-friendly cards
 * ✅ Auto adjust based on screen size
 */
const StatsCards = ({ type, stats, userRole, viewMode = "detail" }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Auto show all cards on larger screens
      if (width >= 768) {
        setShowAllCards(true);
      } else {
        setShowAllCards(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
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
        return renderStudentCards(stats, isMobile);
      case "attendance":
        if (viewMode === "recap") {
          return renderAttendanceRecapCards(stats, isMobile);
        }
        return renderAttendanceCards(stats, isMobile);
      case "grades":
        return renderGradeCards(stats, isMobile);
      case "notes":
        return renderNotesCards(stats, userRole, isMobile);
      default:
        return null;
    }
  };

  // Get cards array
  const cardsArray = renderCards();
  const totalCards = cardsArray ? cardsArray.length : 0;

  // Determine visible cards count based on screen size
  let visibleCardsCount = totalCards;
  if (!showAllCards) {
    if (isMobile) {
      visibleCardsCount = Math.min(2, totalCards); // Show only 2 cards on mobile by default
    } else if (isTablet) {
      visibleCardsCount = Math.min(3, totalCards); // Show 3 cards on tablet by default
    }
  }

  // Toggle show all cards on mobile
  const handleToggleCards = () => {
    setShowAllCards(!showAllCards);
  };

  return (
    <div className="mb-6">
      {/* Mobile Info Badge */}
      {isMobile && totalCards > 2 && (
        <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-700 dark:text-blue-300">
              Tampilkan: {visibleCardsCount} dari {totalCards} statistik
            </span>
          </div>
          <button
            onClick={handleToggleCards}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            {showAllCards ? "Tutup" : "Lihat Semua"}
            <ChevronRight
              className={`h-3 w-3 transition-transform ${
                showAllCards ? "rotate-90" : ""
              }`}
            />
          </button>
        </div>
      )}

      {/* Cards Grid - Mobile First */}
      <div
        className={`
        grid gap-3 sm:gap-4
        ${isMobile ? "grid-cols-2" : "grid-cols-2"}
        ${isTablet ? "md:grid-cols-3" : ""}
        ${!isMobile && !isTablet ? "lg:grid-cols-4" : ""}
      `}>
        {cardsArray &&
          cardsArray
            .slice(0, showAllCards ? totalCards : visibleCardsCount)
            .map((card, index) => (
              <div
                key={index}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}>
                {card}
              </div>
            ))}
      </div>

      {/* Load More Button for Mobile */}
      {isMobile && totalCards > 2 && !showAllCards && (
        <div className="mt-4 text-center">
          <button
            onClick={handleToggleCards}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <span>Tampilkan {totalCards - 2} statistik lainnya</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

// ========================================
// CARD COMPONENT - RESPONSIVE & DARK MODE
// ========================================

const Card = ({
  label,
  value,
  icon,
  color = "blue",
  subtitle,
  isMobile = false,
}) => {
  const colorClasses = {
    blue: {
      label: "text-blue-500 dark:text-blue-400",
      text: "text-blue-800 dark:text-blue-200",
      subtitle: "text-blue-500 dark:text-blue-400",
      icon: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
      bg: "bg-blue-50/80 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-700",
      shadow: "shadow-blue-100/50 dark:shadow-blue-900/20",
    },
    green: {
      label: "text-green-500 dark:text-green-400",
      text: "text-green-800 dark:text-green-200",
      subtitle: "text-green-500 dark:text-green-400",
      icon: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
      bg: "bg-green-50/80 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-700",
      shadow: "shadow-green-100/50 dark:shadow-green-900/20",
    },
    orange: {
      label: "text-orange-500 dark:text-orange-400",
      text: "text-orange-800 dark:text-orange-200",
      subtitle: "text-orange-500 dark:text-orange-400",
      icon: "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100",
      bg: "bg-orange-50/80 dark:bg-orange-900/30",
      border: "border-orange-200 dark:border-orange-700",
      shadow: "shadow-orange-100/50 dark:shadow-orange-900/20",
    },
    red: {
      label: "text-red-500 dark:text-red-400",
      text: "text-red-800 dark:text-red-200",
      subtitle: "text-red-500 dark:text-red-400",
      icon: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
      bg: "bg-red-50/80 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-700",
      shadow: "shadow-red-100/50 dark:shadow-red-900/20",
    },
    purple: {
      label: "text-purple-500 dark:text-purple-400",
      text: "text-purple-800 dark:text-purple-200",
      subtitle: "text-purple-500 dark:text-purple-400",
      icon: "bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100",
      bg: "bg-purple-50/80 dark:bg-purple-900/30",
      border: "border-purple-200 dark:border-purple-700",
      shadow: "shadow-purple-100/50 dark:shadow-purple-900/20",
    },
    gray: {
      label: "text-gray-500 dark:text-gray-400",
      text: "text-gray-800 dark:text-gray-200",
      subtitle: "text-gray-500 dark:text-gray-400",
      icon: "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-100",
      bg: "bg-gray-50/80 dark:bg-gray-800/50",
      border: "border-gray-200 dark:border-gray-600",
      shadow: "shadow-gray-100/50 dark:shadow-gray-900/20",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`
        flex items-center gap-3 p-3 sm:p-4 rounded-xl border ${colors.border} ${
        colors.bg
      }
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
        ${isMobile ? "shadow-sm" : "shadow-md"} ${colors.shadow}
        cursor-pointer
      `}
      onClick={() => console.log(`Card clicked: ${label}`)}>
      <div
        className={`
          p-2 rounded-lg ${colors.icon} flex-shrink-0
          ${isMobile ? "h-10 w-10" : "h-12 w-12"}
          flex items-center justify-center
        `}>
        <div className={isMobile ? "h-4 w-4" : "h-5 w-5"}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`
          font-medium truncate
          ${isMobile ? "text-xs" : "text-sm"}
          ${colors.label}
        `}>
          {label}
        </p>
        <p
          className={`
          font-bold truncate
          ${isMobile ? "text-lg" : "text-xl"}
          ${colors.text}
          mt-0.5
        `}>
          {formatValue(value)}
        </p>
        {subtitle && (
          <p
            className={`
            truncate mt-0.5
            ${isMobile ? "text-[10px]" : "text-xs"}
            ${colors.subtitle}
          `}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

// ========================================
// RENDER CARDS FUNCTIONS - RESPONSIVE
// ========================================

const renderStudentCards = (stats, isMobile) => [
  <Card
    key="total"
    label="Total Siswa"
    value={stats.total}
    icon={<Users size={isMobile ? 16 : 20} />}
    color="blue"
    subtitle={`Kelas: ${stats.kelas || "-"}`}
    isMobile={isMobile}
  />,
  <Card
    key="active"
    label="Siswa Aktif"
    value={stats.active}
    icon={<UserCheck size={isMobile ? 16 : 20} />}
    color="green"
    subtitle={`${stats.percentage || 0}% dari total`}
    isMobile={isMobile}
  />,
  <Card
    key="male"
    label="Siswa Laki-laki"
    value={stats.lakiLaki}
    icon={<UserCheck size={isMobile ? 16 : 20} />}
    color="purple"
    subtitle={`Perempuan: ${stats.perempuan || 0}`}
    isMobile={isMobile}
  />,
  <Card
    key="inactive"
    label="Siswa Tidak Aktif"
    value={stats.inactive}
    icon={<AlertCircle size={isMobile ? 16 : 20} />}
    color="red"
    subtitle="Perlu diverifikasi"
    isMobile={isMobile}
  />,
];

const renderAttendanceCards = (stats, isMobile) => [
  <Card
    key="totalDays"
    label="Total Hari"
    value={stats.totalDays}
    icon={<Calendar size={isMobile ? 16 : 20} />}
    color="blue"
    subtitle={`Tahun: ${stats.tahunAjaran || "-"}`}
    isMobile={isMobile}
  />,
  <Card
    key="present"
    label="Hadir"
    value={stats.H}
    icon={<CheckCircle size={isMobile ? 16 : 20} />}
    color="green"
    subtitle={`Rata-rata: ${stats.avgPercentage || 0}%`}
    isMobile={isMobile}
  />,
  <Card
    key="sick"
    label="Izin & Sakit"
    value={(stats.I || 0) + (stats.S || 0)}
    icon={<Heart size={isMobile ? 16 : 20} />}
    color="orange"
    subtitle={`Sakit: ${stats.S || 0}, Izin: ${stats.I || 0}`}
    isMobile={isMobile}
  />,
  <Card
    key="absent"
    label="Alpa"
    value={stats.A}
    icon={<XCircle size={isMobile ? 16 : 20} />}
    color="red"
    subtitle="Perlu Tindak Lanjut"
    isMobile={isMobile}
  />,
];

const renderAttendanceRecapCards = (stats, isMobile) => [
  <Card
    key="totalStudents"
    label="Total Siswa"
    value={stats.totalStudents}
    icon={<Users size={isMobile ? 16 : 20} />}
    color="blue"
    subtitle={`Kelas: ${stats.kelas || "-"}`}
    isMobile={isMobile}
  />,
  <Card
    key="avgAttendance"
    label="Rata-rata Kehadiran"
    value={`${stats.avgPercentage || "-"}%`}
    icon={<TrendingUp size={isMobile ? 16 : 20} />}
    color={parseFloat(stats.avgPercentage) >= 80 ? "green" : "orange"}
    subtitle={`Total Hari: ${stats.totalDays || 0}`}
    isMobile={isMobile}
  />,
  <Card
    key="goodAttendance"
    label="Kehadiran Baik"
    value={stats.goodAttendanceStudents || 0}
    icon={<CheckCircle size={isMobile ? 16 : 20} />}
    color="green"
    subtitle={`<70%: ${stats.lowAttendanceStudents || 0}`}
    isMobile={isMobile}
  />,
  <Card
    key="mostAbsent"
    label="Paling Sering Absen"
    value={
      stats.mostAbsentStudent
        ? truncateText(stats.mostAbsentStudent, isMobile ? 8 : 12)
        : "-"
    }
    icon={<TrendingDown size={isMobile ? 16 : 20} />}
    color="red"
    subtitle={`Alpa: ${stats.mostAbsentCount || 0}`}
    isMobile={isMobile}
  />,
];

const renderGradeCards = (stats, isMobile) => [
  <Card
    key="totalMapel"
    label="Mata Pelajaran"
    value={stats.totalMapel}
    icon={<BookOpen size={isMobile ? 16 : 20} />}
    color="purple"
    subtitle={`Kelas: ${stats.kelas || "-"}`}
    isMobile={isMobile}
  />,
  <Card
    key="avgGrade"
    label="Rata-rata Nilai"
    value={formatValue(stats.avgGrade)}
    icon={<BarChart3 size={isMobile ? 16 : 20} />}
    color={(stats.avgGrade || 0) >= 75 ? "green" : "orange"}
    subtitle={`KKM: ${stats.kkm || "75"}`}
    isMobile={isMobile}
  />,
  <Card
    key="passed"
    label="Lulus KKM"
    value={stats.passedStudents || 0}
    icon={<UserCheck size={isMobile ? 16 : 20} />}
    color="green"
    subtitle={`Gagal: ${stats.failedStudents || 0}`}
    isMobile={isMobile}
  />,
  <Card
    key="maxGrade"
    label="Nilai Tertinggi"
    value={formatValue(stats.maxGrade)}
    icon={<Award size={isMobile ? 16 : 20} />}
    color="blue"
    subtitle={`Terendah: ${formatValue(stats.minGrade)}`}
    isMobile={isMobile}
  />,
];

const renderNotesCards = (stats, userRole, isMobile) => [
  <Card
    key="totalNotes"
    label="Total Catatan"
    value={stats.totalNotes}
    icon={<FileText size={isMobile ? 16 : 20} />}
    color="blue"
    subtitle={
      userRole === "admin"
        ? `Kelas: ${stats.totalClasses || 0}`
        : `Siswa: ${stats.totalStudents || 0}`
    }
    isMobile={isMobile}
  />,
  <Card
    key="positive"
    label="Catatan Positif"
    value={stats.positiveNotes || 0}
    icon={<TrendingUp size={isMobile ? 16 : 20} />}
    color="green"
    subtitle={`${stats.positivePercentage || 0}%`}
    isMobile={isMobile}
  />,
  <Card
    key="negative"
    label="Catatan Perhatian"
    value={stats.negativeNotes || 0}
    icon={<AlertCircle size={isMobile ? 16 : 20} />}
    color="orange"
    subtitle={`Belum ditindak: ${stats.pendingActions || 0}`}
    isMobile={isMobile}
  />,
  <Card
    key="resolved"
    label="Terselesaikan"
    value={stats.resolvedNotes || 0}
    icon={<Shield size={isMobile ? 16 : 20} />}
    color="purple"
    subtitle={`Sisa: ${(stats.totalNotes || 0) - (stats.resolvedNotes || 0)}`}
    isMobile={isMobile}
  />,
];

// ========================================
// UTILITY FUNCTIONS
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

const truncateText = (text, maxLength = 10) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export default StatsCards;
