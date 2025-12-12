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
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].payload.fullName || payload[0].name}
          </p>
          <p className="text-sm text-blue-600">{payload[0].value} siswa</p>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, delay }) => (
    <div
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Statistik SPMB
            </h1>
            <p className="text-gray-600">
              SDN 1 Pasir Pogor • Tahun Ajaran {getCurrentAcademicYear()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">
              {animatedCounts.total}
            </div>
            <p className="text-sm text-gray-500">Total Pendaftar</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          icon={Users}
          title="Total Pendaftar"
          value={animatedCounts.total}
          subtitle="Seluruh calon siswa"
          color="bg-gradient-to-br from-blue-500 to-blue-600"
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
          color="bg-gradient-to-br from-cyan-500 to-blue-500"
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
          color="bg-gradient-to-br from-pink-500 to-rose-500"
          delay={200}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            Distribusi Jenis Kelamin
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value">
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {maleStudents} Laki-laki
                </div>
                <div className="text-xs text-gray-600">
                  {totalStudents > 0
                    ? Math.round((maleStudents / totalStudents) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {femaleStudents} Perempuan
                </div>
                <div className="text-xs text-gray-600">
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <School className="w-4 h-4 text-green-600" />
            </div>
            Top 5 Asal TK/PAUD
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topSchoolsData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="siswa" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyTrend.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            Tren Pendaftaran Bulanan
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Registrations */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          Pendaftar Terbaru
        </h3>

        <div className="space-y-3">
          {!workingStudents || workingStudents.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada data pendaftar</p>
            </div>
          ) : (
            workingStudents.slice(0, 5).map((student, index) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        student.jenis_kelamin === "Laki-laki"
                          ? "bg-blue-500"
                          : "bg-pink-500"
                      }`}></div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {student.nama_lengkap}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <School className="w-3 h-3" />
                      {student.asal_tk ||
                        student.asal_sekolah ||
                        "Tidak ada data"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-blue-600">
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
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Statistik diperbarui secara real-time • SDN 1 Pasir Pogor ©{" "}
          {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Statistics;
