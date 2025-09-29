import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  GraduationCap,
  UserCheck,
  Download,
  RefreshCw,
  FileText,
  BookOpen,
  AlertCircle,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  School,
} from "lucide-react";

const ReportTeacherMapel = ({ userData }) => {
  console.log("=== DEBUG ReportTeacherMapel ===");
  console.log("Full userData:", userData);
  console.log("mata_pelajaran:", userData?.mata_pelajaran);
  console.log("role:", userData?.role);
  console.log("username:", userData?.username);
  // State untuk data laporan - MOVED TO TOP LEVEL
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [nilai, setNilai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk filter dan UI - MOVED TO TOP LEVEL
  const [selectedPeriod, setSelectedPeriod] = useState("3months");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedJenisNilai, setSelectedJenisNilai] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Dynamic options from data - MOVED TO TOP LEVEL
  const [classList, setClassList] = useState([]);
  const [jenisNilaiList, setJenisNilaiList] = useState([]);

  // --- FIXED LOGIC: Handle mata_pelajaran as string ---
  const mataPelajaranDiampu = userData.mata_pelajaran || null;
  const userName = userData.full_name || "Guru Mapel";

  // Period options
  const periodOptions = [
    { value: "1month", label: "1 Bulan Terakhir" },
    { value: "3months", label: "3 Bulan Terakhir" },
    { value: "6months", label: "6 Bulan Terakhir" },
    { value: "1year", label: "1 Tahun Terakhir" },
  ];

  // Colors for charts
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
    "#06B6D4",
  ];

  // Get date range based on period
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();

    switch (selectedPeriod) {
      case "1month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 3);
    }

    return { startDate, endDate: now };
  };

  // --- FIXED FETCH DATA FUNCTION ---
  const fetchData = async () => {
    // Check if mata_pelajaran exists before proceeding
    if (!mataPelajaranDiampu) {
      setError(
        "Mata pelajaran belum ditentukan. Silakan hubungi admin untuk mengatur mata pelajaran yang diampu."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setRefreshing(true);
    setError(null);

    try {
      const { startDate } = getDateRange();

      // 1. Nilai query - FIXED: Use .eq() instead of .in() for single mata_pelajaran
      let nilaiQuery = supabase
        .from("nilai")
        .select("*")
        .eq("mata_pelajaran", mataPelajaranDiampu) // FIXED: Single mata pelajaran
        .gte("tanggal", startDate.toISOString().split("T")[0]);

      const { data: nilaiData, error: nilaiError } = await nilaiQuery;
      if (nilaiError) throw nilaiError;
      setNilai(nilaiData || []);

      // Extract unique metadata from Nilai data
      const uniqueNisns = [
        ...new Set(nilaiData?.map((n) => n.nisn) || []),
      ].filter(Boolean);
      const uniqueClasses = [
        ...new Set(nilaiData?.map((n) => n.kelas) || []),
      ].filter(Boolean);
      const uniqueJenisNilai = [
        ...new Set(nilaiData?.map((n) => n.jenis_nilai) || []),
      ].filter(Boolean);

      setClassList(uniqueClasses.sort());
      setJenisNilaiList(uniqueJenisNilai);

      // Reset selected class if it's no longer in the list
      if (selectedClass && !uniqueClasses.includes(selectedClass)) {
        setSelectedClass("");
      }

      // Only fetch students and attendance if we have nilai data
      if (uniqueNisns.length > 0) {
        // 2. Students query
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*")
          .in("nisn", uniqueNisns)
          .eq("is_active", true);

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // 3. Attendance query
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("*")
          .in("nisn", uniqueNisns)
          .gte("tanggal", startDate.toISOString().split("T")[0]);

        if (attendanceError) throw attendanceError;
        setAttendance(attendanceData || []);
      } else {
        setStudents([]);
        setAttendance([]);
      }
    } catch (err) {
      console.error("Error fetching subject teacher report data:", err);
      setError(
        `Gagal memuat data laporan mata pelajaran ${mataPelajaranDiampu}. ${err.message}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, mataPelajaranDiampu]);

  // Enhanced filtering by UI selection
  const getFilteredData = () => {
    let filteredStudents = students;
    let filteredAttendance = attendance;
    let filteredNilai = nilai;

    // Class filter
    if (selectedClass) {
      filteredNilai = filteredNilai.filter((n) => n.kelas === selectedClass);
      filteredStudents = filteredStudents.filter(
        (s) => s.kelas === selectedClass
      );
      filteredAttendance = filteredAttendance.filter(
        (a) => a.kelas === selectedClass
      );
    }

    // Jenis nilai filter
    if (selectedJenisNilai) {
      filteredNilai = filteredNilai.filter(
        (n) => n.jenis_nilai === selectedJenisNilai
      );
    }

    return {
      students: filteredStudents,
      attendance: filteredAttendance,
      nilai: filteredNilai,
    };
  };

  const {
    students: filteredStudents,
    attendance: filteredAttendance,
    nilai: filteredNilai,
  } = getFilteredData();

  // Early return AFTER hooks - Handle missing mata_pelajaran
  if (!mataPelajaranDiampu) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-red-600 font-medium text-lg">
          Mata Pelajaran Belum Ditentukan
        </p>
        <p className="text-gray-600 text-center mt-2 mb-4">
          Silakan hubungi admin untuk mengatur mata pelajaran yang diampu.
        </p>
      </div>
    );
  }

  // Calculate advanced insights
  const calculateAdvancedInsights = () => {
    // Attendance trends by month
    const monthlyAttendance = {};
    filteredAttendance.forEach((record) => {
      const monthKey = new Date(record.tanggal).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
      });
      if (!monthlyAttendance[monthKey]) {
        monthlyAttendance[monthKey] = {
          total: 0,
          hadir: 0,
          alpha: 0,
          izin: 0,
          sakit: 0,
        };
      }
      monthlyAttendance[monthKey].total++;

      switch (record.status.toLowerCase()) {
        case "hadir":
          monthlyAttendance[monthKey].hadir++;
          break;
        case "alpha":
          monthlyAttendance[monthKey].alpha++;
          break;
        case "izin":
          monthlyAttendance[monthKey].izin++;
          break;
        case "sakit":
          monthlyAttendance[monthKey].sakit++;
          break;
      }
    });

    const attendanceTrend = Object.entries(monthlyAttendance)
      .map(([month, data]) => ({
        month,
        Hadir: data.hadir,
        Alpha: data.alpha,
        Izin: data.izin,
        Sakit: data.sakit,
        percentage:
          data.total > 0 ? ((data.hadir / data.total) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));

    // Grade analysis - simplified since we only have one mata_pelajaran
    const mapelPerformance = [
      {
        mapel: mataPelajaranDiampu,
        average:
          filteredNilai.length > 0
            ? (
                filteredNilai.reduce((sum, grade) => sum + grade.nilai, 0) /
                filteredNilai.length
              ).toFixed(1)
            : 0,
        count: filteredNilai.length,
        highest:
          filteredNilai.length > 0
            ? Math.max(...filteredNilai.map((n) => n.nilai))
            : 0,
        lowest:
          filteredNilai.length > 0
            ? Math.min(...filteredNilai.map((n) => n.nilai))
            : 0,
      },
    ];

    // Grade trends by jenis nilai
    const gradesByJenis = {};
    filteredNilai.forEach((record) => {
      if (!gradesByJenis[record.jenis_nilai]) {
        gradesByJenis[record.jenis_nilai] = [];
      }
      gradesByJenis[record.jenis_nilai].push(record.nilai);
    });

    const jenisNilaiPerformance = Object.entries(gradesByJenis).map(
      ([jenis, grades]) => ({
        jenis,
        average: (
          grades.reduce((sum, grade) => sum + grade, 0) / grades.length
        ).toFixed(1),
        count: grades.length,
      })
    );

    // Student performance analysis
    const studentPerformance = filteredStudents.map((student) => {
      const studentGrades = filteredNilai.filter(
        (n) => n.nisn === student.nisn
      );
      const studentAttendance = filteredAttendance.filter(
        (a) => a.nisn === student.nisn
      );

      const totalMeetings = studentAttendance.length;
      const hadirCount = studentAttendance.filter(
        (a) => a.status.toLowerCase() === "hadir"
      ).length;
      const alphaCount = studentAttendance.filter(
        (a) => a.status.toLowerCase() === "alpha"
      ).length;
      const attendanceRate =
        totalMeetings > 0 ? (hadirCount / totalMeetings) * 100 : 0;

      const avgGrade =
        studentGrades.length > 0
          ? studentGrades.reduce((sum, g) => sum + g.nilai, 0) /
            studentGrades.length
          : 0;

      // Risk assessment
      let riskLevel = "low";
      let riskFactors = [];

      if (attendanceRate < 75 && totalMeetings > 5) {
        riskLevel = "high";
        riskFactors.push("Kehadiran rendah");
      } else if (attendanceRate < 85 && totalMeetings > 5) {
        if (riskLevel !== "high") riskLevel = "medium";
        riskFactors.push("Kehadiran perlu ditingkatkan");
      }

      if (avgGrade < 65 && studentGrades.length > 2) {
        riskLevel = "high";
        riskFactors.push("Nilai di bawah standar");
      } else if (avgGrade < 75 && studentGrades.length > 2) {
        if (riskLevel !== "high") riskLevel = "medium";
        riskFactors.push("Prestasi perlu ditingkatkan");
      }

      if (alphaCount >= 3) {
        riskLevel = "high";
        riskFactors.push("Sering alpha");
      }

      return {
        ...student,
        attendanceRate: attendanceRate.toFixed(1),
        avgGrade: avgGrade.toFixed(1),
        totalAssessments: studentGrades.length,
        totalMeetings,
        hadirCount,
        alphaCount,
        riskLevel,
        riskFactors,
      };
    });

    // Summary statistics
    const totalStudents = filteredStudents.length;
    const overallAttendanceRate =
      filteredAttendance.length > 0
        ? (
            (filteredAttendance.filter(
              (a) => a.status.toLowerCase() === "hadir"
            ).length /
              filteredAttendance.length) *
            100
          ).toFixed(1)
        : 0;

    const overallAvgGrade =
      filteredNilai.length > 0
        ? (
            filteredNilai.reduce((sum, n) => sum + n.nilai, 0) /
            filteredNilai.length
          ).toFixed(1)
        : 0;

    const highRiskStudents = studentPerformance.filter(
      (s) => s.riskLevel === "high"
    ).length;
    const mediumRiskStudents = studentPerformance.filter(
      (s) => s.riskLevel === "medium"
    ).length;
    const lowRiskStudents = studentPerformance.filter(
      (s) => s.riskLevel === "low"
    ).length;

    // Top performers
    const topPerformers = studentPerformance
      .filter((s) => s.totalAssessments > 0)
      .sort((a, b) => parseFloat(b.avgGrade) - parseFloat(a.avgGrade))
      .slice(0, 5);

    return {
      attendanceTrend,
      mapelPerformance,
      jenisNilaiPerformance,
      studentPerformance,
      topPerformers,
      summary: {
        totalStudents,
        overallAttendanceRate,
        overallAvgGrade,
        highRiskStudents,
        mediumRiskStudents,
        lowRiskStudents,
        totalAssessments: filteredNilai.length,
        totalMeetings: filteredAttendance.length,
      },
    };
  };

  const insights = calculateAdvancedInsights();

  // UI Components
  const InsightCard = ({
    icon: Icon,
    title,
    value,
    description,
    trend,
    color,
    alert,
  }) => (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-300 ${
        alert ? "border-l-4 border-l-red-500" : ""
      }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {alert && (
                <span className="text-xs text-red-600 font-medium">
                  Perlu Perhatian
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{description}</p>
            {trend && (
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  trend.positive ? "text-green-600" : "text-red-600"
                }`}>
                {trend.positive ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {trend.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const StudentPerformanceCard = ({ student }) => {
    const getRiskColor = (riskLevel) => {
      switch (riskLevel) {
        case "high":
          return "bg-red-50 border-red-200 text-red-800";
        case "medium":
          return "bg-yellow-50 border-yellow-200 text-yellow-800";
        default:
          return "bg-green-50 border-green-200 text-green-800";
      }
    };

    const getRiskLabel = (riskLevel) => {
      switch (riskLevel) {
        case "high":
          return "Perlu Perhatian";
        case "medium":
          return "Perlu Monitoring";
        default:
          return "Baik";
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {student.nama_siswa}
            </h3>
            <p className="text-sm text-gray-500">
              NISN: {student.nisn} • Kelas {student.kelas}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(
              student.riskLevel
            )}`}>
            {getRiskLabel(student.riskLevel)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">Kehadiran</p>
            <p className="text-lg font-semibold text-gray-900">
              {student.attendanceRate}%
            </p>
            <p className="text-xs text-gray-500">
              {student.hadirCount}/{student.totalMeetings}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">Rata-rata Nilai</p>
            <p className="text-lg font-semibold text-gray-900">
              {student.avgGrade}
            </p>
            <p className="text-xs text-gray-500">
              {student.totalAssessments} penilaian
            </p>
          </div>
        </div>

        {student.riskFactors.length > 0 && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-1">
              Faktor Risiko:
            </p>
            <ul className="text-xs text-gray-600">
              {student.riskFactors.map((factor, idx) => (
                <li key={idx}>• {factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Loading and error states
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-700 font-medium">
          Menganalisis data laporan {mataPelajaranDiampu}...
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Memproses{" "}
          {periodOptions
            .find((p) => p.value === selectedPeriod)
            ?.label.toLowerCase()}
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-red-600 font-medium text-lg">Gagal Memuat Laporan</p>
        <p className="text-gray-600 text-center mt-2 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Coba Lagi
        </button>
      </div>
    );

  const reportScopeLabel = selectedClass
    ? `Kelas ${selectedClass}`
    : `Semua Kelas untuk ${mataPelajaranDiampu}`;

  // Main render
  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-600 rounded-lg">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Laporan Mata Pelajaran: {mataPelajaranDiampu}
                </h1>
                <p className="text-sm text-gray-500">
                  Analisis performa siswa di {reportScopeLabel} •{" "}
                  {periodOptions.find((p) => p.value === selectedPeriod)?.label}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 text-sm transition-colors"
              onClick={fetchData}
              disabled={refreshing}>
              {refreshing ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periode Analisis
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}>
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Kelas
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Semua Kelas</option>
                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Nilai Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Nilai
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedJenisNilai}
                onChange={(e) => setSelectedJenisNilai(e.target.value)}>
                <option value="">Semua Jenis Nilai</option>
                {jenisNilaiList.map((jenis) => (
                  <option key={jenis} value={jenis}>
                    {jenis}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedClass || selectedJenisNilai) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Filter aktif:</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  Mapel: {mataPelajaranDiampu}
                </span>
                {selectedClass && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Kelas: {selectedClass}
                  </span>
                )}
                {selectedJenisNilai && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Jenis: {selectedJenisNilai}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedClass("");
                    setSelectedJenisNilai("");
                  }}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm hover:bg-red-200 transition-colors">
                  Hapus Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4 sm:px-6 overflow-x-auto">
            {[
              { id: "overview", label: "Ringkasan", icon: BarChart3 },
              {
                id: "performance",
                label: "Analisis Nilai",
                icon: GraduationCap,
              },
              { id: "students", label: "Analisis Siswa", icon: Users },
              { id: "insights", label: "Insight & Rekomendasi", icon: Target },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InsightCard
                  icon={Users}
                  title={`Total Siswa ${mataPelajaranDiampu}`}
                  value={insights.summary.totalStudents}
                  description={`di ${reportScopeLabel}`}
                  color="bg-purple-600"
                />
                <InsightCard
                  icon={UserCheck}
                  title="Tingkat Kehadiran"
                  value={`${insights.summary.overallAttendanceRate}%`}
                  description={`Rata-rata kehadiran`}
                  color="bg-green-600"
                  alert={insights.summary.overallAttendanceRate < 80}
                />
                <InsightCard
                  icon={GraduationCap}
                  title={`Rata-rata Nilai ${mataPelajaranDiampu}`}
                  value={insights.summary.overallAvgGrade}
                  description={`${insights.summary.totalAssessments} penilaian tercatat`}
                  color="bg-orange-600"
                  alert={insights.summary.overallAvgGrade < 75}
                />
                <InsightCard
                  icon={AlertTriangle}
                  title="Siswa Perlu Perhatian"
                  value={insights.summary.highRiskStudents}
                  description={`Siswa berisiko tinggi`}
                  color="bg-red-600"
                  alert={insights.summary.highRiskStudents > 0}
                />
              </div>

              {/* Trend Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tren Kehadiran Bulanan
                  </h3>
                  <div className="h-64">
                    {insights.attendanceTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={insights.attendanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="Hadir"
                            stackId="1"
                            stroke="#10B981"
                            fill="#10B981"
                          />
                          <Area
                            type="monotone"
                            dataKey="Sakit"
                            stackId="1"
                            stroke="#F59E0B"
                            fill="#F59E0B"
                          />
                          <Area
                            type="monotone"
                            dataKey="Izin"
                            stackId="1"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                          />
                          <Area
                            type="monotone"
                            dataKey="Alpha"
                            stackId="1"
                            stroke="#EF4444"
                            fill="#EF4444"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <UserCheck size={48} className="mb-4" />
                        <p className="font-medium">Tidak ada data kehadiran</p>
                        <p className="text-sm text-center">
                          Data akan muncul setelah ada record kehadiran
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Status Kehadiran Siswa
                  </h3>
                  <div className="h-64">
                    {filteredAttendance.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Hadir",
                                value: filteredAttendance.filter(
                                  (a) => a.status.toLowerCase() === "hadir"
                                ).length,
                                fill: "#10B981",
                              },
                              {
                                name: "Sakit",
                                value: filteredAttendance.filter(
                                  (a) => a.status.toLowerCase() === "sakit"
                                ).length,
                                fill: "#F59E0B",
                              },
                              {
                                name: "Izin",
                                value: filteredAttendance.filter(
                                  (a) => a.status.toLowerCase() === "izin"
                                ).length,
                                fill: "#3B82F6",
                              },
                              {
                                name: "Alpha",
                                value: filteredAttendance.filter(
                                  (a) => a.status.toLowerCase() === "alpha"
                                ).length,
                                fill: "#EF4444",
                              },
                            ].filter((item) => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }></Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Clock size={48} className="mb-4" />
                        <p className="font-medium">Tidak ada data kehadiran</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PERFORMANCE TAB */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Analisis Nilai {mataPelajaranDiampu}
                </h3>

                {insights.mapelPerformance.length > 0 &&
                insights.summary.totalAssessments > 0 ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-4">
                          Distribusi Jenis Penilaian
                        </h4>
                        <div className="h-64">
                          {insights.jenisNilaiPerformance.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={insights.jenisNilaiPerformance.map(
                                    (item, index) => ({
                                      ...item,
                                      fill: COLORS[index % COLORS.length],
                                    })
                                  )}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  dataKey="count"
                                  label={({ jenis, percent }) =>
                                    `${jenis} ${(percent * 100).toFixed(0)}%`
                                  }></Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                              <GraduationCap size={48} className="mb-4" />
                              <p className="font-medium">
                                Tidak ada data nilai
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-4">
                          Ringkasan {mataPelajaranDiampu}
                        </h4>
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                Rata-rata Nilai
                              </span>
                              <span className="text-2xl font-bold text-purple-600">
                                {insights.mapelPerformance[0]?.average || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>
                                Tertinggi:{" "}
                                {insights.mapelPerformance[0]?.highest || 0}
                              </span>
                              <span>
                                Terendah:{" "}
                                {insights.mapelPerformance[0]?.lowest || 0}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                Total Penilaian
                              </span>
                              <span className="text-2xl font-bold text-blue-600">
                                {insights.summary.totalAssessments}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Siswa dinilai: {insights.summary.totalStudents}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Jenis Nilai Performance Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {insights.jenisNilaiPerformance.map((jenis, index) => (
                        <div
                          key={jenis.jenis}
                          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {jenis.jenis}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {jenis.count} penilaian
                              </p>
                            </div>
                            <div
                              className={`w-3 h-3 rounded-full`}
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}></div>
                          </div>

                          <div className="text-center">
                            <p className="text-xs text-gray-500">Rata-rata</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {jenis.average}
                            </p>
                            <div
                              className={`mt-2 px-2 py-1 rounded-full text-xs ${
                                parseFloat(jenis.average) >= 80
                                  ? "bg-green-100 text-green-800"
                                  : parseFloat(jenis.average) >= 70
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                              {parseFloat(jenis.average) >= 80
                                ? "Sangat Baik"
                                : parseFloat(jenis.average) >= 70
                                ? "Baik"
                                : "Perlu Perbaikan"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <GraduationCap
                      size={48}
                      className="text-gray-300 mx-auto mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Belum ada data nilai {mataPelajaranDiampu}
                    </h3>
                    <p className="text-gray-500">
                      Data akan muncul setelah ada penilaian untuk mata
                      pelajaran ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Performa Individual Siswa
                  </h3>
                  <p className="text-sm text-gray-500">
                    Menampilkan {insights.studentPerformance.length} siswa
                    dengan analisis risiko di {reportScopeLabel}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>
                      Perlu Perhatian ({insights.summary.highRiskStudents})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>
                      Monitoring ({insights.summary.mediumRiskStudents})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Baik ({insights.summary.lowRiskStudents})</span>
                  </div>
                </div>
              </div>

              {insights.studentPerformance.length > 0 ? (
                <>
                  {/* Top Performers Section */}
                  {insights.topPerformers.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Award size={20} className="text-yellow-500" />
                        Top 5 Performer {mataPelajaranDiampu}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        {insights.topPerformers.map((student, index) => (
                          <div
                            key={student.id}
                            className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 text-center">
                            <div className="text-2xl mb-2">
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : "🏅"}
                            </div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {student.nama_siswa}
                            </p>
                            <p className="text-xs text-gray-600">
                              Kelas {student.kelas}
                            </p>
                            <p className="text-lg font-bold text-yellow-600 mt-1">
                              {student.avgGrade}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.attendanceRate}% Hadir
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Students Performance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insights.studentPerformance
                      .sort((a, b) => {
                        const riskOrder = { high: 0, medium: 1, low: 2 };
                        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
                      })
                      .map((student) => (
                        <StudentPerformanceCard
                          key={student.id}
                          student={student}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <Users size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada data siswa
                  </h3>
                  <p className="text-gray-500">
                    Pastikan ada data nilai untuk mata pelajaran{" "}
                    {mataPelajaranDiampu}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* INSIGHTS TAB */}
          {activeTab === "insights" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Insight & Rekomendasi untuk {mataPelajaranDiampu}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* High Priority Actions */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="text-red-600" size={20} />
                      <h4 className="font-semibold text-red-800">
                        Tindakan Segera
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {insights.summary.highRiskStudents > 0 && (
                        <div className="bg-white p-3 rounded-lg">
                          <p className="font-medium text-gray-900">
                            Siswa Berisiko Tinggi
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {insights.summary.highRiskStudents} siswa memerlukan
                            perhatian untuk mata pelajaran {mataPelajaranDiampu}
                          </p>
                          <button
                            onClick={() => setActiveTab("students")}
                            className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors">
                            Lihat Detail Siswa
                          </button>
                        </div>
                      )}

                      {insights.summary.overallAvgGrade < 75 && (
                        <div className="bg-white p-3 rounded-lg">
                          <p className="font-medium text-gray-900">
                            Prestasi Mapel Rendah
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Rata-rata nilai {mataPelajaranDiampu} (
                            {insights.summary.overallAvgGrade}) memerlukan
                            intervensi remedial
                          </p>
                        </div>
                      )}

                      {insights.summary.highRiskStudents === 0 &&
                        insights.summary.overallAvgGrade >= 75 && (
                          <div className="bg-white p-3 rounded-lg text-center">
                            <CheckCircle
                              className="text-green-600 mx-auto mb-2"
                              size={32}
                            />
                            <p className="font-medium text-gray-900">
                              Situasi Mapel Terkendali
                            </p>
                            <p className="text-sm text-gray-600">
                              Tidak ada tindakan segera yang diperlukan untuk{" "}
                              {mataPelajaranDiampu}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="text-blue-600" size={20} />
                      <h4 className="font-semibold text-blue-800">
                        Rekomendasi Strategis
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {insights.summary.overallAvgGrade < 75 && (
                        <div className="bg-white p-3 rounded-lg">
                          <p className="font-medium text-gray-900">
                            Review Metode Pengajaran
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Perlu evaluasi pendekatan mengajar untuk{" "}
                            {mataPelajaranDiampu}
                          </p>
                        </div>
                      )}

                      {insights.jenisNilaiPerformance.some(
                        (j) => parseFloat(j.average) < 70
                      ) && (
                        <div className="bg-white p-3 rounded-lg">
                          <p className="font-medium text-gray-900">
                            Fokus Penilaian
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Terdapat jenis penilaian dengan rata-rata rendah.
                            Fokuskan perbaikan di area tersebut.
                          </p>
                        </div>
                      )}

                      <div className="bg-white p-3 rounded-lg">
                        <p className="font-medium text-gray-900">
                          Kolaborasi Guru Kelas
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Diskusikan tantangan siswa di {mataPelajaranDiampu}{" "}
                          dengan guru kelas untuk strategi holistik.
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-lg">
                        <p className="font-medium text-gray-900">
                          Program Pengayaan
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Untuk siswa berprestasi tinggi, pertimbangkan program
                          pengayaan {mataPelajaranDiampu}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EXPORT SUMMARY */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              Laporan {mataPelajaranDiampu} Siap Export
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Data periode{" "}
              {periodOptions
                .find((p) => p.value === selectedPeriod)
                ?.label.toLowerCase()}{" "}
              •{insights.summary.totalStudents} siswa •
              {insights.summary.totalMeetings} record kehadiran •
              {insights.summary.totalAssessments} penilaian
              {selectedClass && ` • Kelas: ${selectedClass}`}
              {selectedJenisNilai && ` • Jenis Nilai: ${selectedJenisNilai}`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors">
              <FileText size={16} />
              Print Laporan
            </button>
            <button
              onClick={() =>
                alert(`Export data ${mataPelajaranDiampu} akan segera tersedia`)
              }
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm transition-colors">
              <Download size={16} />
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTeacherMapel;
