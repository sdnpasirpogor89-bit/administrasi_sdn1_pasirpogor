// src/reports/DataTable.js
import React from "react";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";

/**
 * Component tabel untuk display data laporan
 * ✅ Support: students, grades, grades-grid, attendance, attendance-recap, notes, teachers
 * ✅ Mobile-first responsive design
 * ✅ Dark mode support
 */
const DataTable = ({
  data = [],
  type,
  loading = false,
  userRole,
  viewMode = "list",
  // Props baru untuk responsive behavior
  compactView = false,
  showColumnCount = 5, // Default kolom yang ditampilkan di mobile
}) => {
  // State untuk device detection
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Loading state (DIUPDATE untuk mobile)
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12 bg-white dark:bg-gray-900 rounded-lg">
        <Loader2
          className="animate-spin text-blue-600 dark:text-blue-400 mr-2 h-5 w-5 sm:h-6 sm:w-6"
          size={isMobile ? 20 : 24}
        />
        <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Memuat data...
        </span>
      </div>
    );
  }

  // Empty state handled by parent
  if (!data || data.length === 0) {
    return null;
  }

  // Grid view untuk grades
  if (type === "grades" && viewMode === "grid") {
    return renderGridView(data, isMobile, compactView);
  }

  // 🆕 RECAP VIEW UNTUK ATTENDANCE
  if (type === "attendance" && viewMode === "recap") {
    return renderAttendanceRecap(data, isMobile);
  }

  // List view (default) - RESPONSIVE MOBILE FIRST
  return (
    // Kontainer utama dengan shadow sesuai device
    <div
      className={`overflow-x-auto rounded-lg shadow-sm sm:shadow-md ${
        isMobile ? "-mx-4" : ""
      }`}>
      <div className="inline-block min-w-full align-middle">
        {/* Mobile: kurangi padding, smaller font */}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm sm:text-base">
          {/* Header dengan sticky di mobile */}
          <thead
            className={`bg-gray-50 dark:bg-gray-800 ${
              isMobile ? "sticky top-0 z-10" : ""
            }`}>
            {renderTableHeader(type, userRole, isMobile, compactView)}
          </thead>
          {/* Body dengan alternating colors */}
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {renderTableBody(data, type, userRole, isMobile, compactView)}
          </tbody>
        </table>
      </div>

      {/* Footer info - responsive layout */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Menampilkan <span className="font-semibold">{data.length}</span>{" "}
            data
          </p>
          {/* Device indicator - hanya untuk development */}
          {process.env.NODE_ENV === "development" && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {isMobile ? (
                <>
                  <Smartphone className="h-3 w-3" /> Mobile
                </>
              ) : window.innerWidth < 1024 ? (
                <>
                  <Tablet className="h-3 w-3" /> Tablet
                </>
              ) : (
                <>
                  <Monitor className="h-3 w-3" /> Desktop
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ========================================
// 🆕 ATTENDANCE RECAP VIEW (REKAPITULASI BULANAN) - RESPONSIVE
// ========================================

const renderAttendanceRecap = (data, isMobile) => {
  const calculatePercentage = (hadir, total) => {
    if (!total || total === 0) return 0;
    return ((hadir / total) * 100).toFixed(1);
  };

  const getPercentageColor = (percentage) => {
    const pct = parseFloat(percentage);
    if (pct >= 90)
      return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600";
    if (pct >= 80)
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600";
    if (pct >= 70)
      return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-600";
    return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-600";
  };

  const getPercentageIcon = (percentage) => {
    const pct = parseFloat(percentage);
    if (pct >= 90) return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />;
    if (pct >= 80) return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />;
    return <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />;
  };

  // MOBILE: Tampilkan kolom penting saja
  const showMobileView = isMobile && data.length > 3;

  return (
    <div className="overflow-x-auto shadow-sm sm:shadow-md rounded-lg">
      <table
        className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${
          showMobileView ? "text-xs" : "text-sm sm:text-base"
        }`}>
        <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900/70">
          <tr>
            <th
              className={`px-3 py-2 sm:px-4 sm:py-3 text-left font-bold uppercase tracking-wider border-r border-gray-300 dark:text-gray-300 dark:border-gray-700 ${
                showMobileView ? "sticky left-0 bg-inherit z-10" : ""
              }`}>
              No
            </th>

            {/* MOBILE: Sembunyikan NISN jika terlalu penuh */}
            {!showMobileView && (
              <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-bold uppercase tracking-wider border-r border-gray-300 dark:text-gray-300 dark:border-gray-700">
                NISN
              </th>
            )}

            <th
              className={`px-3 py-2 sm:px-4 sm:py-3 text-left font-bold uppercase tracking-wider border-r border-gray-300 dark:text-gray-300 dark:border-gray-700 ${
                showMobileView
                  ? "min-w-[120px] sticky left-8 bg-inherit z-10"
                  : "min-w-[150px]"
              }`}>
              Nama Siswa
            </th>

            {/* MOBILE: Sembunyikan kelas jika perlu */}
            {!showMobileView && (
              <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-bold uppercase tracking-wider border-r border-gray-300 dark:text-gray-300 dark:border-gray-700">
                Kelas
              </th>
            )}

            {/* Header Presensi - responsive */}
            <th
              className={`px-2 py-2 sm:px-4 sm:py-3 text-center font-bold uppercase tracking-wider ${
                showMobileView ? "text-[10px]" : "text-xs"
              } bg-green-50 dark:bg-green-900/30`}>
              {showMobileView ? (
                "H"
              ) : (
                <>
                  H
                  <div className="text-[10px] font-normal text-gray-500 normal-case dark:text-gray-400">
                    Hadir
                  </div>
                </>
              )}
            </th>

            <th
              className={`px-2 py-2 sm:px-4 sm:py-3 text-center font-bold uppercase tracking-wider ${
                showMobileView ? "text-[10px]" : "text-xs"
              } bg-yellow-50 dark:bg-yellow-900/30`}>
              {showMobileView ? (
                "S"
              ) : (
                <>
                  S
                  <div className="text-[10px] font-normal text-gray-500 normal-case dark:text-gray-400">
                    Sakit
                  </div>
                </>
              )}
            </th>

            {/* MOBILE: Sembunyikan izin dan alpa jika perlu, atau ganti dengan ... */}
            {!showMobileView ? (
              <>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-bold uppercase tracking-wider text-xs bg-blue-50 dark:bg-blue-900/30">
                  I
                  <div className="text-[10px] font-normal text-gray-500 normal-case dark:text-gray-400">
                    Izin
                  </div>
                </th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-bold uppercase tracking-wider text-xs bg-red-50 dark:bg-red-900/30">
                  A
                  <div className="text-[10px] font-normal text-gray-500 normal-case dark:text-gray-400">
                    Alpa
                  </div>
                </th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-center font-bold uppercase tracking-wider text-xs bg-gray-100 border-l border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                  Total
                </th>
              </>
            ) : (
              <th className="px-2 py-2 text-center font-bold uppercase tracking-wider text-[10px]">
                Lain
              </th>
            )}

            <th
              className={`px-2 py-2 sm:px-4 sm:py-3 text-center font-bold uppercase tracking-wider ${
                showMobileView ? "text-[10px]" : "text-xs"
              } bg-indigo-50 dark:bg-indigo-900/30`}>
              {showMobileView ? "%" : "Persentase"}
            </th>

            {/* MOBILE: Sembunyikan status jika perlu */}
            {!showMobileView && (
              <th className="px-3 py-2 sm:px-4 sm:py-3 text-center font-bold uppercase tracking-wider text-xs dark:text-gray-300">
                Status
              </th>
            )}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {data.map((row, index) => {
            const hadir = parseInt(row.hadir) || 0;
            const sakit = parseInt(row.sakit) || 0;
            const izin = parseInt(row.izin) || 0;
            const alpa = parseInt(row.alpa) || 0;
            const totalHari = hadir + sakit + izin + alpa;
            const persentase = calculatePercentage(hadir, totalHari);
            const isLowAttendance = parseFloat(persentase) < 80;

            return (
              <tr
                key={row.id || `recap-${index}`}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                  isLowAttendance ? "bg-red-50/30 dark:bg-red-900/10" : ""
                }`}>
                {/* No - sticky di mobile */}
                <td
                  className={`px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap font-medium border-r border-gray-200 dark:text-gray-200 dark:border-gray-700 ${
                    showMobileView
                      ? "sticky left-0 bg-white dark:bg-gray-900 z-5"
                      : ""
                  }`}>
                  {index + 1}
                </td>

                {/* NISN - sembunyi di mobile */}
                {!showMobileView && (
                  <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap border-r border-gray-200 dark:text-gray-200 dark:border-gray-700">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-300">
                      {row.nisn}
                    </span>
                  </td>
                )}

                {/* Nama Siswa - sticky di mobile */}
                <td
                  className={`px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap font-semibold border-r border-gray-200 dark:text-gray-200 dark:border-gray-700 ${
                    showMobileView
                      ? "sticky left-8 bg-white dark:bg-gray-900 z-5 min-w-[120px]"
                      : ""
                  }`}>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {isLowAttendance && (
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 dark:text-red-400" />
                    )}
                    <span
                      className={
                        showMobileView ? "truncate max-w-[100px]" : ""
                      }>
                      {row.nama_siswa}
                    </span>
                  </div>
                </td>

                {/* Kelas - sembunyi di mobile */}
                {!showMobileView && (
                  <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap border-r border-gray-200 dark:text-gray-200 dark:border-gray-700">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium dark:bg-blue-900/50 dark:text-blue-300">
                      {row.kelas}
                    </span>
                  </td>
                )}

                {/* Hadir */}
                <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center bg-green-50 dark:bg-green-900/30">
                  <span
                    className={`inline-flex font-bold rounded-lg ${
                      showMobileView
                        ? "px-2 py-1 text-xs"
                        : "px-3 py-1.5 text-sm"
                    } bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100`}>
                    {hadir}
                  </span>
                </td>

                {/* Sakit */}
                <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center bg-yellow-50 dark:bg-yellow-900/30">
                  <span
                    className={`inline-flex font-bold rounded-lg ${
                      showMobileView
                        ? "px-2 py-1 text-xs"
                        : "px-3 py-1.5 text-sm"
                    } bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100`}>
                    {sakit}
                  </span>
                </td>

                {/* Izin & Alpa - sembunyi atau gabung di mobile */}
                {!showMobileView ? (
                  <>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center bg-blue-50 dark:bg-blue-900/30">
                      <span className="px-3 py-1.5 inline-flex text-sm font-bold text-blue-800 bg-blue-200 rounded-lg dark:bg-blue-700 dark:text-blue-100">
                        {izin}
                      </span>
                    </td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center bg-red-50 dark:bg-red-900/30">
                      <span className="px-3 py-1.5 inline-flex text-sm font-bold text-red-800 bg-red-200 rounded-lg dark:bg-red-700 dark:text-red-100">
                        {alpa}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center bg-gray-100 border-l border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                      <span className="px-3 py-1.5 inline-flex text-sm font-bold text-gray-800 bg-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100">
                        {totalHari}
                      </span>
                    </td>
                  </>
                ) : (
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <span className="px-2 py-1 inline-flex text-xs font-bold text-gray-600 bg-gray-100 rounded dark:bg-gray-700 dark:text-gray-300">
                      +{izin + alpa}
                    </span>
                  </td>
                )}

                {/* Persentase */}
                <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center bg-indigo-50 dark:bg-indigo-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <div className="dark:text-white">
                      {getPercentageIcon(persentase)}
                    </div>
                    <span
                      className={`inline-flex font-bold rounded-lg border-2 ${getPercentageColor(
                        persentase
                      )} ${
                        showMobileView
                          ? "px-2 py-1 text-xs"
                          : "px-3 py-1.5 text-sm"
                      }`}>
                      {persentase}%
                    </span>
                  </div>
                </td>

                {/* Status - sembunyi di mobile */}
                {!showMobileView && (
                  <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center">
                    {parseFloat(persentase) >= 90 ? (
                      <span className="px-3 py-1.5 inline-flex text-xs font-bold bg-green-100 text-green-800 rounded-full border border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600">
                        ✓ Sangat Baik
                      </span>
                    ) : parseFloat(persentase) >= 80 ? (
                      <span className="px-3 py-1.5 inline-flex text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600">
                        ✓ Baik
                      </span>
                    ) : parseFloat(persentase) >= 70 ? (
                      <span className="px-3 py-1.5 inline-flex text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-600">
                        ⚠ Cukup
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 inline-flex text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-600">
                        ✗ Kurang
                      </span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>

        {/* Footer Summary - responsive */}
        <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold dark:from-gray-700 dark:to-gray-800">
          <tr className={showMobileView ? "text-xs" : "text-sm"}>
            <td
              colSpan={showMobileView ? 3 : 4}
              className="px-3 py-2 sm:px-4 sm:py-3 text-right border-r border-gray-300 dark:text-gray-200 dark:border-gray-700">
              TOTAL:
            </td>
            <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-green-900 bg-green-100 dark:bg-green-900/70 dark:text-green-200">
              {data.reduce((sum, row) => sum + (parseInt(row.hadir) || 0), 0)}
            </td>
            <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-yellow-900 bg-yellow-100 dark:bg-yellow-900/70 dark:text-yellow-200">
              {data.reduce((sum, row) => sum + (parseInt(row.sakit) || 0), 0)}
            </td>

            {!showMobileView ? (
              <>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-blue-900 bg-blue-100 dark:bg-blue-900/70 dark:text-blue-200">
                  {data.reduce(
                    (sum, row) => sum + (parseInt(row.izin) || 0),
                    0
                  )}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-red-900 bg-red-100 dark:bg-red-900/70 dark:text-red-200">
                  {data.reduce(
                    (sum, row) => sum + (parseInt(row.alpa) || 0),
                    0
                  )}
                </td>
                <td className="px-3 py-2 sm:px-4 sm:py-3 text-center text-gray-900 bg-gray-200 border-l border-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-700">
                  {data.reduce((sum, row) => {
                    const h = parseInt(row.hadir) || 0;
                    const s = parseInt(row.sakit) || 0;
                    const i = parseInt(row.izin) || 0;
                    const a = parseInt(row.alpa) || 0;
                    return sum + h + s + i + a;
                  }, 0)}
                </td>
              </>
            ) : (
              <td className="px-2 py-2 text-center text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                {data.reduce((sum, row) => {
                  const i = parseInt(row.izin) || 0;
                  const a = parseInt(row.alpa) || 0;
                  return sum + i + a;
                }, 0)}
              </td>
            )}

            <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-indigo-900 bg-indigo-100 dark:bg-indigo-900/70 dark:text-indigo-200">
              {(() => {
                const totalHadir = data.reduce(
                  (sum, row) => sum + (parseInt(row.hadir) || 0),
                  0
                );
                const totalAll = data.reduce((sum, row) => {
                  const h = parseInt(row.hadir) || 0;
                  const s = parseInt(row.sakit) || 0;
                  const i = parseInt(row.izin) || 0;
                  const a = parseInt(row.alpa) || 0;
                  return sum + h + s + i + a;
                }, 0);
                return calculatePercentage(totalHadir, totalAll);
              })()}
              %
            </td>

            {!showMobileView && (
              <td className="px-3 py-2 sm:px-4 sm:py-3 text-center dark:text-gray-200">
                {data.length} Siswa
              </td>
            )}
          </tr>
        </tfoot>
      </table>

      {/* Footer Legend - responsive layout */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <p
              className={`font-semibold mb-2 dark:text-gray-300 ${
                showMobileView ? "text-xs" : "text-sm"
              }`}>
              📊 Rekapitulasi Presensi -{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {data.length}
              </span>{" "}
              siswa
            </p>

            {/* Responsive legend - wrap di mobile */}
            <div
              className={`flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-400 ${
                showMobileView ? "text-[10px] gap-1" : "text-xs gap-4"
              }`}>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></span>
                H = Hadir
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></span>
                S = Sakit
              </span>
              {!showMobileView && (
                <>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></span>
                    I = Izin
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
                    A = Alpa
                  </span>
                </>
              )}
            </div>
          </div>

          {!showMobileView && (
            <div className="text-left">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Status Kehadiran:
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-green-600 dark:text-green-400">
                  ≥90% = Sangat Baik
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  ≥80% = Baik
                </span>
                <span className="text-yellow-600 dark:text-yellow-400">
                  ≥70% = Cukup
                </span>
                <span className="text-red-600 dark:text-red-400">
                  &lt;70% = Kurang
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile hint */}
        {showMobileView && (
          <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              ⚡ Scroll horizontal untuk data lengkap
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// GRID VIEW (NILAI AKHIR PER SISWA) - RESPONSIVE FIXED V2
// ========================================

const renderGridView = (data, isMobile, compactView) => {
  const MAPEL_LIST = [
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "Bahasa Sunda",
    "Matematika",
    "IPAS",
    "Pendidikan Pancasila",
    "Seni Budaya",
    "PABP",
    "PJOK",
  ];

  const MAPEL_SHORT = {
    "Bahasa Indonesia": isMobile ? "B.Indo" : "B. Indonesia",
    "Bahasa Inggris": isMobile ? "B.Ing" : "B. Inggris",
    "Bahasa Sunda": isMobile ? "B.Sunda" : "B. Sunda",
    Matematika: "MTK",
    IPAS: "IPAS",
    "Pendidikan Pancasila": isMobile ? "PPKN" : "Pend. Pancasila",
    "Seni Budaya": isMobile ? "Senbud" : "Seni Budaya",
    PABP: "PABP",
    PJOK: "PJOK",
  };

  return (
    // 🔥 FIX: Full width container tanpa nested div yang bikin masalah
    <div className="w-full overflow-x-auto shadow-sm sm:shadow-md rounded-lg">
      <table
        className={`w-full border-collapse divide-y divide-gray-200 dark:divide-gray-700 ${
          isMobile ? "text-xs" : "text-sm"
        }`}>
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {/* 🔥 FIX: Sticky columns dengan width yang lebih besar */}
            <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-300 dark:border-gray-700 dark:text-gray-300 w-20 min-w-[80px]">
              No
            </th>
            <th className="sticky left-20 z-20 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-300 dark:border-gray-700 dark:text-gray-300 w-40 min-w-[160px]">
              NISN
            </th>
            <th className="sticky left-60 z-20 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-300 dark:border-gray-700 dark:text-gray-300 min-w-[250px]">
              Nama Siswa
            </th>

            {/* 🔥 FIX: Kolom Nilai dengan min-width lebih besar */}
            {MAPEL_LIST.map((mapel) => (
              <th
                key={mapel}
                className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 dark:text-gray-300 min-w-[140px] whitespace-nowrap"
                title={mapel}>
                <div className="flex flex-col items-center gap-1">
                  <span>{MAPEL_SHORT[mapel]}</span>
                </div>
              </th>
            ))}

            {/* Kolom Summary */}
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider bg-yellow-50 border-l border-gray-300 dark:bg-yellow-900/30 dark:text-gray-300 dark:border-gray-700 min-w-[110px]">
              Jumlah
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider bg-green-50 dark:bg-green-900/30 dark:text-gray-300 min-w-[130px]">
              Rata-rata
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {data.map((row, index) => (
            <tr
              key={row.id || `grid-row-${index}`}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              {/* 🔥 FIX: Sticky cells dengan width yang SAMA dengan header */}
              <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-4 py-4 whitespace-nowrap text-sm font-medium border-r border-gray-200 dark:border-gray-700 dark:text-gray-200 w-20 min-w-[80px]">
                {index + 1}
              </td>
              <td className="sticky left-20 z-10 bg-white dark:bg-gray-900 px-4 py-4 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-700 w-40 min-w-[160px]">
                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded dark:text-gray-300">
                  {row.nisn}
                </span>
              </td>
              <td className="sticky left-60 z-10 bg-white dark:bg-gray-900 px-4 py-4 whitespace-nowrap text-sm font-semibold border-r border-gray-200 dark:border-gray-700 dark:text-gray-200 min-w-[250px]">
                {row.nama_siswa}
              </td>

              {/* 🔥 FIX: Kolom Nilai dengan padding lebih besar */}
              {MAPEL_LIST.map((mapel) => {
                const nilai = row[mapel];
                const isNA =
                  nilai === "-" ||
                  nilai === "N/A" ||
                  nilai === null ||
                  nilai === undefined;

                return (
                  <td
                    key={mapel}
                    className="px-4 py-4 whitespace-nowrap text-center min-w-[140px]">
                    {isNA ? (
                      <span className="text-gray-400 dark:text-gray-500 italic text-sm">
                        -
                      </span>
                    ) : (
                      <span
                        className={`inline-flex font-bold rounded-full px-4 py-2 text-sm ${
                          parseFloat(nilai) >= 75
                            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                        }`}>
                        {nilai}
                      </span>
                    )}
                  </td>
                );
              })}

              {/* Kolom Summary */}
              <td className="px-4 py-4 whitespace-nowrap text-center bg-yellow-50/50 border-l border-gray-200 dark:bg-yellow-900/10 dark:border-gray-700 text-sm font-bold min-w-[110px]">
                <span className="text-yellow-800 dark:text-yellow-300">
                  {row.jumlah || "-"}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-center bg-green-50/50 dark:bg-green-900/10 text-sm min-w-[130px]">
                {row.rata_rata && row.rata_rata !== "-" ? (
                  <span
                    className={`inline-flex font-bold rounded-full px-4 py-2 text-sm ${
                      parseFloat(row.rata_rata) >= 75
                        ? "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200"
                    }`}>
                    {row.rata_rata}
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 italic text-sm">
                    -
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer info dengan hint scroll */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-200">
              {data.length}
            </span>{" "}
            siswa ×{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-200">
              {MAPEL_LIST.length}
            </span>{" "}
            mata pelajaran
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              ⬅️ Geser horizontal untuk melihat semua nilai ➡️
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// TABLE HEADERS - RESPONSIVE
// ========================================

const renderTableHeader = (type, userRole, isMobile, compactView) => {
  const baseHeaderClass = `px-4 py-3 text-left font-medium uppercase tracking-wider dark:text-gray-300 ${
    isMobile ? "text-[10px] px-3 py-2" : "text-xs"
  }`;

  switch (type) {
    case "students":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          {!compactView && <th className={baseHeaderClass}>NISN</th>}
          <th className={baseHeaderClass}>Nama Siswa</th>
          <th className={baseHeaderClass}>Kelas</th>
          {!compactView && <th className={baseHeaderClass}>JK</th>}
          <th className={baseHeaderClass}>Status</th>
        </tr>
      );

    case "grades":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          {!compactView && <th className={baseHeaderClass}>NISN</th>}
          <th className={baseHeaderClass}>Nama Siswa</th>
          <th className={baseHeaderClass}>Mapel</th>
          <th className={baseHeaderClass}>Nilai</th>
        </tr>
      );

    case "attendance":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          <th className={baseHeaderClass}>Tanggal</th>
          <th className={baseHeaderClass}>Nama Siswa</th>
          {!compactView && <th className={baseHeaderClass}>Kelas</th>}
          <th className={baseHeaderClass}>Status</th>
          {!compactView && <th className={baseHeaderClass}>Jenis</th>}
          <th className={baseHeaderClass}>Keterangan</th>
        </tr>
      );

    case "notes":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          <th className={baseHeaderClass}>Tanggal</th>
          {userRole === "guru_mapel" && !compactView && (
            <th className={baseHeaderClass}>Kelas</th>
          )}
          <th className={baseHeaderClass}>Nama Siswa</th>
          <th className={baseHeaderClass}>Kategori</th>
          {!compactView && <th className={baseHeaderClass}>Label</th>}
          <th className={baseHeaderClass}>Catatan</th>
          <th className={baseHeaderClass}>Tindak Lanjut</th>
          {userRole === "guru_kelas" && !compactView && (
            <th className={baseHeaderClass}>Dibuat Oleh</th>
          )}
        </tr>
      );

    case "teachers":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          <th className={baseHeaderClass}>Nama</th>
          {!compactView && <th className={baseHeaderClass}>Username</th>}
          <th className={baseHeaderClass}>Role</th>
          <th className={baseHeaderClass}>Kelas/Mapel</th>
          {!compactView && <th className={baseHeaderClass}>Tahun Ajaran</th>}
          <th className={baseHeaderClass}>Status</th>
        </tr>
      );

    default:
      return null;
  }
};

// ========================================
// TABLE BODY - RESPONSIVE
// ========================================

const renderTableBody = (data, type, userRole, isMobile, compactView) => {
  const baseTdClass = `whitespace-nowrap text-gray-900 dark:text-gray-200 ${
    isMobile ? "px-3 py-3 text-xs" : "px-4 py-4 text-sm"
  }`;
  const baseNameTdClass = `whitespace-nowrap font-medium text-gray-900 dark:text-gray-200 ${
    isMobile ? "px-3 py-3 text-xs truncate max-w-[120px]" : "px-4 py-4 text-sm"
  }`;

  // Helper untuk truncate text di mobile
  const truncateText = (text, maxLength = 20) => {
    if (!isMobile || !text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  switch (type) {
    case "students":
      return data.map((row, index) => (
        <tr
          key={row.id}
          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <td className={baseTdClass}>{index + 1}</td>
          {!compactView && <td className={baseTdClass}>{row.nisn}</td>}
          <td className={baseNameTdClass} title={row.nama_siswa}>
            {isMobile ? truncateText(row.nama_siswa, 15) : row.nama_siswa}
          </td>
          <td className={baseTdClass}>{row.kelas}</td>
          {!compactView && (
            <td className={baseTdClass}>
              {row.jenis_kelamin === "L"
                ? "Laki"
                : row.jenis_kelamin === "P"
                ? "Perempuan"
                : row.jenis_kelamin}
            </td>
          )}
          <td
            className={`${
              isMobile ? "px-3 py-3" : "px-4 py-4"
            } whitespace-nowrap`}>
            <span
              className={`inline-flex text-xs leading-5 font-semibold rounded-full ${
                isMobile ? "px-1.5 py-0.5" : "px-2 py-1"
              } ${
                row.is_active
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              }`}>
              {row.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </td>
        </tr>
      ));

    case "grades":
      return data.map((row, index) => (
        <tr
          key={row.id}
          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <td className={baseTdClass}>{index + 1}</td>
          {!compactView && <td className={baseTdClass}>{row.nisn}</td>}
          <td className={baseNameTdClass} title={row.nama_siswa}>
            {isMobile ? truncateText(row.nama_siswa, 15) : row.nama_siswa}
          </td>
          <td className={baseTdClass}>
            {isMobile
              ? truncateText(row.mata_pelajaran, 12)
              : row.mata_pelajaran}
          </td>
          <td
            className={`${
              isMobile ? "px-3 py-3" : "px-4 py-4"
            } whitespace-nowrap`}>
            <span
              className={`inline-flex text-xs leading-5 font-bold rounded-full ${
                isMobile ? "px-2 py-1" : "px-3 py-1"
              } ${
                row.nilai >= 75
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              }`}>
              {row.nilai}
            </span>
          </td>
        </tr>
      ));

    case "attendance":
      return data.map((row, index) => (
        <tr
          key={row.id}
          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <td className={baseTdClass}>{index + 1}</td>
          <td className={baseTdClass}>{formatDate(row.tanggal, isMobile)}</td>
          <td className={baseNameTdClass} title={row.nama_siswa}>
            {isMobile ? truncateText(row.nama_siswa, 12) : row.nama_siswa}
          </td>
          {!compactView && <td className={baseTdClass}>{row.kelas}</td>}
          <td
            className={`${
              isMobile ? "px-3 py-3" : "px-4 py-4"
            } whitespace-nowrap`}>
            <span
              className={`inline-flex text-xs leading-5 font-semibold rounded-full ${
                isMobile ? "px-1.5 py-0.5" : "px-2 py-1"
              } ${getStatusColor(row.status)}`}>
              {row.status}
            </span>
          </td>
          {!compactView && (
            <td
              className={`${
                isMobile ? "px-3 py-3" : "px-4 py-4"
              } whitespace-nowrap`}>
              <span
                className={`inline-flex text-xs leading-5 font-semibold rounded ${
                  isMobile ? "px-1.5 py-0.5" : "px-2 py-1"
                } ${
                  row.jenis_presensi === "kelas"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                }`}>
                {row.jenis_presensi || "-"}
              </span>
            </td>
          )}
          <td className={`${baseTdClass} max-w-xs`}>
            <div
              className={`line-clamp-${isMobile ? "1" : "2"}`}
              title={row.keterangan}>
              {row.keterangan || "-"}
            </div>
          </td>
        </tr>
      ));

    case "notes":
      return data.map((row, index) => {
        const showKelas = row.showKelas;
        const showTeacher = row.showTeacher;

        return (
          <tr
            key={row.id}
            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <td className={baseTdClass}>{index + 1}</td>
            <td className={baseTdClass}>
              {formatDate(row.created_at, isMobile)}
            </td>
            {showKelas && !compactView && (
              <td className={baseTdClass}>Kelas {row.class_id}</td>
            )}
            <td className={baseNameTdClass} title={row.student_name || "-"}>
              {isMobile
                ? truncateText(row.student_name, 12)
                : row.student_name || "-"}
            </td>
            <td
              className={`${
                isMobile ? "px-3 py-3" : "px-4 py-4"
              } whitespace-nowrap`}>
              <span
                className={`inline-flex text-xs leading-5 font-semibold rounded-full ${
                  isMobile ? "px-1.5 py-0.5" : "px-2 py-1"
                } ${getCategoryColor(row.category)}`}>
                {row.category || "-"}
              </span>
            </td>
            {!compactView && (
              <td
                className={`${
                  isMobile ? "px-3 py-3" : "px-4 py-4"
                } whitespace-nowrap`}>
                <span
                  className={`inline-flex text-xs leading-5 font-semibold rounded-full ${
                    isMobile ? "px-1.5 py-0.5" : "px-2 py-1"
                  } ${getLabelColor(row.label)}`}>
                  {row.label || "-"}
                </span>
              </td>
            )}
            <td className={`${baseTdClass} max-w-xs`}>
              <div
                className={`line-clamp-${isMobile ? "1" : "2"}`}
                title={row.note_content}>
                {row.note_content || "-"}
              </div>
            </td>
            <td className={baseTdClass}>
              {row.action_taken && row.action_taken.trim() !== "" ? (
                <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 text-xs">
                  <svg
                    className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {isMobile ? "Sudah" : "Sudah"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                  <svg
                    className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {isMobile ? "Belum" : "Belum"}
                </span>
              )}
            </td>
            {showTeacher && !compactView && (
              <td className={baseTdClass}>
                {isMobile
                  ? truncateText(row.teacher_name, 10)
                  : row.teacher_name || "-"}
              </td>
            )}
          </tr>
        );
      });

    case "teachers":
      return data.map((row, index) => (
        <tr
          key={row.id}
          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <td className={baseTdClass}>{index + 1}</td>
          <td className={baseNameTdClass} title={row.full_name}>
            {isMobile ? truncateText(row.full_name, 15) : row.full_name}
          </td>
          {!compactView && <td className={baseTdClass}>{row.username}</td>}
          <td
            className={`${
              isMobile ? "px-3 py-3" : "px-4 py-4"
            } whitespace-nowrap`}>
            <span
              className={`inline-flex text-xs leading-5 font-semibold rounded-full ${
                isMobile ? "px-1.5 py-0.5" : "px-2 py-1"
              } ${
                row.role === "guru_kelas"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
              }`}>
              {row.role === "guru_kelas" ? "Guru Kelas" : "Guru Mapel"}
            </span>
          </td>
          <td className={baseTdClass}>
            {row.role === "guru_kelas"
              ? `Kelas ${row.kelas || "-"}`
              : isMobile
              ? truncateText(row.mata_pelajaran, 10)
              : row.mata_pelajaran || "-"}
          </td>
          {!compactView && (
            <td className={baseTdClass}>{row.tahun_ajaran || "-"}</td>
          )}
          <td
            className={`${
              isMobile ? "px-3 py-3" : "px-4 py-4"
            } whitespace-nowrap`}>
            <span
              className={`inline-flex text-xs leading-5 font-semibold rounded-full ${
                isMobile ? "px-1.5 py-0.5" : "px-2 py-1"
              } ${
                row.is_active
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              }`}>
              {row.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </td>
        </tr>
      ));

    default:
      return null;
  }
};

// ========================================
// UTILITY FUNCTIONS - RESPONSIVE
// ========================================

const formatDate = (dateString, isMobile = false) => {
  if (!dateString) return "-";
  const date = new Date(dateString);

  if (isMobile) {
    // Format singkat untuk mobile: DD/MM/YY
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  // Format panjang untuk desktop
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case "Hadir":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case "Sakit":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    case "Izin":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    case "Alpa":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

const getCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case "akademik":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    case "perilaku":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
    case "prestasi":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case "kesehatan":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

const getLabelColor = (label) => {
  const lowerLabel = label?.toLowerCase() || "";

  if (
    lowerLabel.includes("positif") ||
    lowerLabel.includes("baik") ||
    lowerLabel.includes("prestasi")
  ) {
    return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
  }

  if (
    lowerLabel.includes("perhatian") ||
    lowerLabel.includes("peringatan") ||
    lowerLabel.includes("bimbingan")
  ) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
  }

  if (
    lowerLabel.includes("urgent") ||
    lowerLabel.includes("serius") ||
    lowerLabel.includes("masalah")
  ) {
    return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  }

  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
};

// Responsive utility untuk menentukan jumlah kolom
const getVisibleColumnCount = (isMobile, type) => {
  if (!isMobile) return 10; // Tampilkan semua di desktop

  switch (type) {
    case "students":
      return 4; // No, Nama, Kelas, Status
    case "grades":
      return 4; // No, Nama, Mapel, Nilai
    case "attendance":
      return 5; // No, Tanggal, Nama, Status, Keterangan
    case "notes":
      return 5; // No, Tanggal, Nama, Kategori, Catatan
    case "teachers":
      return 4; // No, Nama, Role, Status
    default:
      return 3;
  }
};

export default DataTable;
