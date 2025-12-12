import React, { useMemo, useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  Users,
  TrendingUp,
  School,
  Clock,
  Calendar,
  UserCheck,
  Activity,
} from "lucide-react";

const Statistics = ({
  students,
  totalStudents,
  maleStudents,
  femaleStudents,
  getCurrentAcademicYear,
}) => {
  const [animatedCounts, setAnimatedCounts] = useState({
    total: 0,
    male: 0,
    female: 0,
  });

  // Animated counter effect
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = {
      total: totalStudents / steps,
      male: maleStudents / steps,
      female: femaleStudents / steps,
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setAnimatedCounts({
          total: Math.min(
            Math.floor(increment.total * currentStep),
            totalStudents
          ),
          male: Math.min(
            Math.floor(increment.male * currentStep),
            maleStudents
          ),
          female: Math.min(
            Math.floor(increment.female * currentStep),
            femaleStudents
          ),
        });
      } else {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalStudents, maleStudents, femaleStudents]);

  // Use real students data from database
  const workingStudents = students || [];

  // School statistics
  const getSchoolStats = useMemo(() => {
    const schoolCounts = {};
    workingStudents.forEach((student) => {
      const school = (
        student.asal_tk ||
        student.asal_sekolah ||
        "Tidak Diketahui"
      ).trim();
      schoolCounts[school] = (schoolCounts[school] || 0) + 1;
    });

    return Object.entries(schoolCounts)
      .map(([school, count]) => ({
        school,
        count,
        percentage: totalStudents > 0 ? (count / totalStudents) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [workingStudents, totalStudents]);

  // Monthly registration trend
  const monthlyTrend = useMemo(() => {
    const months = {};
    workingStudents.forEach((student) => {
      if (student.tanggal_daftar) {
        const date = new Date(student.tanggal_daftar);
        const monthKey = date.toLocaleDateString("id-ID", { month: "short" });
        months[monthKey] = (months[monthKey] || 0) + 1;
      }
    });

    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return monthOrder
      .filter((month) => months[month])
      .map((month) => ({ month, count: months[month] }));
  }, [workingStudents]);

  // Gender data for pie chart
  const genderData = [
    { name: "Laki-laki", value: maleStudents, color: "#3b82f6" },
    { name: "Perempuan", value: femaleStudents, color: "#ec4899" },
  ];

  // Top 5 schools for bar chart
  const topSchoolsData = getSchoolStats.slice(0, 5).map((stat) => ({
    name:
      stat.school.length > 20
        ? stat.school.substring(0, 20) + "..."
        : stat.school,
    fullName: stat.school,
    siswa: stat.count,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 px-3 md:px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs md:text-sm font-semibold text-gray-800 dark:text-white">
            {payload[0].payload.fullName || payload[0].name}
          </p>
          <p className="text-xs md:text-sm text-red-600 dark:text-red-400">
            {payload[0].value} siswa
          </p>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, delay }) => (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {subtitle}
          </p>
        </div>
        <div
          className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${color} flex-shrink-0 ml-2`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-red-50 dark:from-gray-900 dark:to-gray-800 p-3 md:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-8 shadow-sm border border-red-100 dark:border-gray-700 mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
              Dashboard Statistik SPMB
            </h1>
            <p className="text-xs md:text-base text-gray-600 dark:text-gray-400">
              SDN 1 Pasir Pogor • Tahun Ajaran {getCurrentAcademicYear()}
            </p>
          </div>
          <div className="text-center md:text-right">
            <div className="text-3xl md:text-4xl font-bold text-red-600 dark:text-red-400">
              {animatedCounts.total}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Total Pendaftar
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
        <StatCard
          icon={Users}
          title="Total Pendaftar"
          value={animatedCounts.total}
          subtitle="Seluruh calon siswa"
          color="bg-gradient-to-br from-red-500 to-red-600"
          delay={0}
        />
        <StatCard
          icon={UserCheck}
          title="Siswa Laki-laki"
          value={animatedCounts.male}
          subtitle={`${
            totalStudents > 0
              ? Math.round((maleStudents / totalStudents) * 100)
              : 0
          }% dari total`}
          color="bg-gradient-to-br from-orange-500 to-red-500"
          delay={100}
        />
        <StatCard
          icon={Activity}
          title="Siswa Perempuan"
          value={animatedCounts.female}
          subtitle={`${
            totalStudents > 0
              ? Math.round((femaleStudents / totalStudents) * 100)
              : 0
          }% dari total`}
          color="bg-gradient-to-br from-pink-500 to-rose-600"
          delay={200}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Gender Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-3 h-3 md:w-4 md:h-4 text-red-600 dark:text-red-400" />
            </div>
            Distribusi Jenis Kelamin
          </h3>

          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value">
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--tw-bg-opacity)",
                  border: "1px solid var(--tw-border-opacity)",
                  borderRadius: "0.5rem",
                  color: "var(--tw-text-opacity)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white text-xs md:text-sm truncate">
                  {maleStudents} Laki-laki
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {totalStudents > 0
                    ? Math.round((maleStudents / totalStudents) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <div className="w-3 h-3 bg-pink-500 dark:bg-pink-400 rounded-full flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white text-xs md:text-sm truncate">
                  {femaleStudents} Perempuan
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {totalStudents > 0
                    ? Math.round((femaleStudents / totalStudents) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Schools Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <School className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
            </div>
            Top 5 Asal TK/PAUD
          </h3>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topSchoolsData} layout="horizontal">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                strokeOpacity={0.3}
              />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={11}
                strokeOpacity={0.6}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                width={80}
                strokeOpacity={0.6}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="siswa" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyTrend.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-purple-600 dark:text-purple-400" />
            </div>
            Tren Pendaftaran Bulanan
          </h3>

          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                strokeOpacity={0.3}
              />
              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                fontSize={11}
                strokeOpacity={0.6}
              />
              <YAxis stroke="#94a3b8" fontSize={11} strokeOpacity={0.6} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--tw-bg-opacity)",
                  border: "1px solid var(--tw-border-opacity)",
                  borderRadius: "0.5rem",
                  color: "var(--tw-text-opacity)",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Registrations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 h-3 md:w-4 md:h-4 text-orange-600 dark:text-orange-400" />
          </div>
          Pendaftar Terbaru
        </h3>

        <div className="space-y-2 md:space-y-3">
          {!workingStudents || workingStudents.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Clock className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 md:mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Belum ada data pendaftar
              </p>
            </div>
          ) : (
            workingStudents.slice(0, 5).map((student, index) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[60px]">
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                      {index + 1}
                    </div>
                    <div
                      className={`absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                        student.jenis_kelamin === "Laki-laki"
                          ? "bg-blue-500 dark:bg-blue-400"
                          : "bg-pink-500 dark:bg-pink-400"
                      }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {student.nama_lengkap}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                      <School className="w-3 h-3 flex-shrink-0" />
                      {student.asal_tk ||
                        student.asal_sekolah ||
                        "Tidak ada data"}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                    {student.tanggal_daftar
                      ? new Date(student.tanggal_daftar).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "Baru"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
        <p>
          Statistik diperbarui secara real-time • SDN 1 Pasir Pogor ©{" "}
          {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Statistics;
