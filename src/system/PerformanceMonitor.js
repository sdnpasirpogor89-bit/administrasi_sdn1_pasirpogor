import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  Award,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    queries: [],
    summary: {
      avgQueryTime: 0,
      slowestQuery: null,
      fastestQuery: null,
      totalQueries: 0,
      performanceScore: 100,
    },
    pagePerformance: {
      loadTime: 0,
      renderTime: 0,
    },
    history: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [previousAvg, setPreviousAvg] = useState(null);

  // 🔧 FIX #1: Performance Score Calculator yang BENAR
  const calculatePerformanceScore = (avgTime) => {
    if (avgTime < 80) return Math.round(Math.max(80, 100 - avgTime * 0.25));
    if (avgTime < 100)
      return Math.round(Math.max(60, 80 - (avgTime - 80) * 1.0));
    if (avgTime < 150)
      return Math.round(Math.max(20, 60 - (avgTime - 100) * 0.8));
    return Math.round(Math.max(0, 20 - (avgTime - 150) * 0.4));
  };

  const testQueryPerformance = async () => {
    setIsRunning(true);
    const results = [];
    const testStartTime = performance.now();
    const tables = [
      { name: "students", description: "Data Siswa" },
      { name: "attendances", description: "Data Presensi" },
      { name: "grades", description: "Data Nilai" },
      { name: "teachers", description: "Data Guru" },
      { name: "system_health_logs", description: "Health Logs" },
      { name: "konseling", description: "Data Konseling" },
      { name: "siswa_baru", description: "Pendaftaran Siswa Baru" },
    ];

    try {
      for (const table of tables) {
        const startTime = performance.now();

        // 🔧 OPTIMIZED: Skip count untuk performance test
        const { data, error } = await supabase
          .from(table.name)
          .select("*")
          .limit(20) // ✅ Kurangi dari 100 ke 20
          .range(0, 19); // ✅ Pagination

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Get count from actual data
        const count = data?.length || 0;

        let status = "fast";
        if (duration >= 150) status = "critical";
        else if (duration >= 100) status = "warning";
        else if (duration >= 80) status = "medium";

        results.push({
          table: table.name,
          description: table.description,
          duration: duration.toFixed(2),
          recordCount: count || 0,
          status: status,
          error: error?.message || null,
          timestamp: new Date().toLocaleTimeString(),
        });

        // 🔧 FIX #3: Hapus artificial delay
      }

      const testEndTime = performance.now();
      const totalTestTime = testEndTime - testStartTime;

      const durations = results.map((r) => parseFloat(r.duration));
      const avgQueryTime = (
        durations.reduce((a, b) => a + b, 0) / durations.length
      ).toFixed(2);

      const sortedByDuration = [...results].sort(
        (a, b) => parseFloat(b.duration) - parseFloat(a.duration)
      );

      // 🔧 FIX #4: Gunakan formula yang BENAR
      const performanceScore = calculatePerformanceScore(
        parseFloat(avgQueryTime)
      );

      if (metrics.summary.avgQueryTime > 0) {
        setPreviousAvg(parseFloat(metrics.summary.avgQueryTime));
      }

      const newHistory = [
        ...metrics.history,
        {
          timestamp: new Date().toLocaleTimeString(),
          avgQueryTime: parseFloat(avgQueryTime),
          performanceScore: performanceScore,
        },
      ].slice(-10);

      setMetrics({
        queries: results,
        summary: {
          avgQueryTime,
          slowestQuery: sortedByDuration[0],
          fastestQuery: sortedByDuration[sortedByDuration.length - 1],
          totalQueries: results.length,
          performanceScore: performanceScore,
          totalTestTime: totalTestTime.toFixed(2),
        },
        pagePerformance: {
          loadTime: performance.now().toFixed(2),
          renderTime: (performance.now() - performance.timeOrigin).toFixed(2),
        },
        history: newHistory,
      });
    } catch (error) {
      console.error("Performance test error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "fast":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "fast":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "medium":
        return <Activity className="w-5 h-5 text-blue-600" />;
      case "warning":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRecommendation = (query) => {
    const duration = parseFloat(query.duration);
    const records = query.recordCount;

    if (duration >= 150) {
      if (records > 5000) {
        return "🚨 CRITICAL: Implementasikan pagination & indexing ASAP!";
      } else if (records === 0) {
        return "🚨 CRITICAL: Query lambat tanpa data! Check index & connection.";
      }
      return "🚨 CRITICAL: Query sangat lambat! Urgent optimization needed.";
    }

    if (duration >= 100) {
      if (records > 1000) {
        return "⚠️ WARNING: Consider pagination untuk records > 1000";
      } else if (records === 0) {
        return "⚠️ WARNING: Slow query dengan 0 records. Check index!";
      }
      return "⚠️ WARNING: Bisa dioptimasi dengan indexing.";
    }

    if (duration >= 80) {
      return "💡 GOOD: Performance bagus, minor optimization possible.";
    }

    return "✅ EXCELLENT: Performance optimal!";
  };

  const getTrendIndicator = () => {
    if (!previousAvg || !metrics.summary.avgQueryTime) return null;

    const current = parseFloat(metrics.summary.avgQueryTime);
    const previous = previousAvg;
    const diff = ((current - previous) / previous) * 100;

    if (Math.abs(diff) < 5) {
      return {
        icon: <Minus className="w-5 h-5 text-gray-600" />,
        text: "Stabil",
        color: "text-gray-600",
        change: diff.toFixed(1),
      };
    }

    if (diff < 0) {
      return {
        icon: <TrendingDown className="w-5 h-5 text-green-600" />,
        text: "Membaik",
        color: "text-green-600",
        change: Math.abs(diff).toFixed(1),
      };
    }

    return {
      icon: <TrendingUp className="w-5 h-5 text-red-600" />,
      text: "Menurun",
      color: "text-red-600",
      change: diff.toFixed(1),
    };
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: metrics.summary,
      queries: metrics.queries,
      recommendations: metrics.queries.map((q) => ({
        table: q.table,
        recommendation: getRecommendation(q),
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
  };

  const trend = getTrendIndicator();
  const chartData = metrics.queries.map((q) => ({
    name: q.table,
    duration: parseFloat(q.duration),
    records: q.recordCount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="w-7 h-7 text-yellow-500" />
            Performance Monitor
          </h2>
          <p className="text-gray-600 mt-1">
            Real-time performance tracking & optimization insights
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
          <button
            onClick={testQueryPerformance}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
            {isRunning ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Activity className="w-5 h-5" />
            )}
            {isRunning ? "Testing..." : "Run Test"}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg shadow-md border-2 border-yellow-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <Award className="w-10 h-10 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Performance Score
              </p>
              <p
                className={`text-5xl font-bold ${getScoreColor(
                  metrics.summary.performanceScore
                )}`}>
                {metrics.summary.performanceScore}
                <span className="text-2xl text-gray-500">/100</span>
              </p>
            </div>
          </div>

          {trend && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                {trend.icon}
                <span className={`font-semibold ${trend.color}`}>
                  {trend.text}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {trend.change}% dari test sebelumnya
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Query Time</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {metrics.summary.avgQueryTime}
                <span className="text-lg text-gray-500">ms</span>
              </p>
              {trend && (
                <p className={`text-xs mt-1 ${trend.color} font-medium`}>
                  {trend.change}% {trend.text.toLowerCase()}
                </p>
              )}
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Tables</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {metrics.summary.totalQueries}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {
                  metrics.queries.filter(
                    (q) => q.status === "fast" || q.status === "medium"
                  ).length
                }{" "}
                optimal
              </p>
            </div>
            <Database className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Slowest Query</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {metrics.summary.slowestQuery?.duration || 0}
                <span className="text-lg text-gray-500">ms</span>
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {metrics.summary.slowestQuery?.table || "-"}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Fastest Query</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {metrics.summary.fastestQuery?.duration || 0}
                <span className="text-lg text-gray-500">ms</span>
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {metrics.summary.fastestQuery?.table || "-"}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
      </div>

      {metrics.history.length >= 3 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics.history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgQueryTime"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Avg Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Query Duration Comparison
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="duration" fill="#fbbf24" name="Duration (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Detailed Query Analysis
        </h3>

        <div className="space-y-3">
          {metrics.queries
            .sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration))
            .map((query, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${getStatusColor(
                  query.status
                )} transition-all hover:shadow-md`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(query.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800">
                          {query.table}
                        </h4>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {query.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">
                      {query.duration}
                      <span className="text-sm text-gray-600">ms</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {query.recordCount.toLocaleString()} records
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {query.timestamp}
                    </p>
                  </div>
                </div>

                <div className="relative w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      query.status === "fast"
                        ? "bg-green-500"
                        : query.status === "medium"
                        ? "bg-blue-500"
                        : query.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (parseFloat(query.duration) / 200) * 100,
                        100
                      )}%`,
                    }}></div>
                </div>

                <div className="flex items-start gap-2 mt-2">
                  <span className="text-sm font-medium text-gray-700">
                    {getRecommendation(query)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              Performance Thresholds:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-blue-700">
                  <strong>Excellent:</strong> &lt; 80ms
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">
                  <strong>Good:</strong> 80-100ms
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-blue-700">
                  <strong>Warning:</strong> 100-150ms
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-blue-700">
                  <strong>Critical:</strong> &gt; 150ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {metrics.queries.filter((q) => q.status === "critical").length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded animate-pulse">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">
                🚨 CRITICAL: Immediate Action Required!
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Ditemukan{" "}
                <strong>
                  {
                    metrics.queries.filter((q) => q.status === "critical")
                      .length
                  }{" "}
                  table
                </strong>{" "}
                dengan performance kritis yang dapat mempengaruhi user
                experience!
              </p>
              <div className="space-y-1">
                {metrics.queries
                  .filter((q) => q.status === "critical")
                  .map((q, idx) => (
                    <p key={idx} className="text-sm text-red-700">
                      • <strong>{q.table}</strong>: {q.duration}ms (
                      {q.recordCount} records)
                    </p>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {metrics.queries.filter((q) => q.status === "warning").length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">
                ⚠️ Performance Warning
              </h4>
              <p className="text-sm text-yellow-700">
                Ada{" "}
                <strong>
                  {metrics.queries.filter((q) => q.status === "warning").length}{" "}
                  table
                </strong>{" "}
                yang perlu dioptimasi untuk mencegah degradasi performance.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Smart Optimization Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Database Level
            </h4>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Tambahkan <strong>composite index</strong> untuk queries
                  dengan multiple conditions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Gunakan <strong>EXPLAIN ANALYZE</strong> untuk identify
                  bottlenecks
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Setup <strong>vacuuming schedule</strong> untuk maintain
                  performance
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Query Optimization
            </h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Implement <strong>pagination</strong> dengan limit 50-100
                  records per page
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Gunakan <strong>select()</strong> hanya untuk columns yang
                  diperlukan
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Tambahkan <strong>date filters</strong> untuk batasi data
                  fetch
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Application Level
            </h4>
            <ul className="space-y-2 text-sm text-purple-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Implement <strong>React Query</strong> atau SWR untuk caching
                  & auto-refresh
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Gunakan <strong>debouncing</strong> untuk search/filter
                  operations
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Add <strong>loading states</strong> untuk improve perceived
                  performance
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Data Management
            </h4>
            <ul className="space-y-2 text-sm text-orange-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Archive data lama via <strong>Database Cleanup</strong> tab
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Setup <strong>retention policies</strong> untuk auto-cleanup
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Monitor table sizes & growth trends regularly</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {metrics.summary.totalTestTime && (
        <div className="bg-gray-50 border border-gray-200 p-3 rounded text-center">
          <p className="text-sm text-gray-600">
            Test completed in <strong>{metrics.summary.totalTestTime}ms</strong>{" "}
            • Last run: <strong>{new Date().toLocaleString("id-ID")}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
