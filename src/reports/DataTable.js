// src/reports/DataTable.js
import React from "react";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

/**
 * Component tabel untuk display data laporan
 * ✅ Support: students, grades, grades-grid, attendance, attendance-recap, notes, teachers
 */
const DataTable = ({
  data = [],
  type,
  loading = false,
  userRole,
  viewMode = "list",
}) => {
  // Loading state (DIUPDATE untuk Dark Mode)
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-900 rounded-lg">
        <Loader2
          className="animate-spin text-blue-600 dark:text-blue-400 mr-2"
          size={24}
        />
        <span className="text-gray-600 dark:text-gray-300">Memuat data...</span>
      </div>
    );
  }

  // Empty state handled by parent
  if (!data || data.length === 0) {
    return null;
  }

  // Grid view untuk grades
  if (type === "grades" && viewMode === "grid") {
    return renderGridView(data);
  }

  // 🆕 RECAP VIEW UNTUK ATTENDANCE
  if (type === "attendance" && viewMode === "recap") {
    return renderAttendanceRecap(data);
  }

  // List view (default)
  return (
    // Kontainer utama untuk Responsiveness (overflow-x-auto sudah bagus)
    <div className="overflow-x-auto shadow-md rounded-lg">
      <div className="align-middle inline-block min-w-full">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {/* Header diupdate untuk Dark Mode */}
          <thead className="bg-gray-50 dark:bg-gray-800">
            {renderTableHeader(type, userRole)}
          </thead>
          {/* Body diupdate untuk Dark Mode */}
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {renderTableBody(data, type)}
          </tbody>
        </table>
      </div>

      {/* Footer info diupdate untuk Dark Mode */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Menampilkan <span className="font-semibold">{data.length}</span> data
        </p>
      </div>
    </div>
  );
};

// ========================================
// 🆕 ATTENDANCE RECAP VIEW (REKAPITULASI BULANAN)
// ========================================

const renderAttendanceRecap = (data) => {
  // Helper function untuk menghitung persentase (TIDAK DIUBAH)
  const calculatePercentage = (hadir, total) => {
    if (!total || total === 0) return 0;
    return ((hadir / total) * 100).toFixed(1);
  };

  // Helper function untuk warna badge persentase (DIUPDATE untuk Dark Mode)
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

  // Helper function untuk icon persentase (TIDAK DIUBAH)
  const getPercentageIcon = (percentage) => {
    const pct = parseFloat(percentage);
    if (pct >= 90) return <TrendingUp className="w-3 h-3" />;
    if (pct >= 80) return <TrendingUp className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  // REVISI: Tambahkan div agar tabel bisa di-scroll horizontal di HP
  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {/* Header (DIUPDATE untuk Dark Mode) */}
        <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900/70">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 dark:text-gray-300 dark:border-gray-700">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 dark:text-gray-300 dark:border-gray-700">
              NISN
            </th>
            {/* Nama Siswa dibuat sedikit lebih lebar di mobile dengan min-w-max */}
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 dark:text-gray-300 dark:border-gray-700 min-w-[150px]">
              Nama Siswa
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 dark:text-gray-300 dark:border-gray-700">
              Kelas
            </th>
            {/* Header Hitungan Presensi (DIUPDATE untuk Dark Mode) */}
            <th className="px-4 py-3 text-center text-xs font-bold text-green-700 uppercase tracking-wider bg-green-50 dark:bg-green-900/30">
              H
              <div className="text-[10px] font-normal text-gray-500 normal-case dark:text-gray-400">
                Hadir
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-yellow-700 uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/30">
              S
              <div className="text-[10px] font-normal text-gray-500 normal-case dark:text-gray-400">
                Sakit
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30">
              I
              <div className="text-[10px] font-normal text-gray-500 normal-case dark:text-gray-400">
                Izin
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-red-700 uppercase tracking-wider bg-red-50 dark:bg-red-900/30">
              A
              <div className="text-[10px] font-normal text-gray-500 normal-case dark:text-gray-400">
                Alpa
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100 border-l border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
              Total Hari
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30">
              Persentase
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
              Status
            </th>
          </tr>
        </thead>
        {/* Body (DIUPDATE untuk Dark Mode) */}
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
                {/* No */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium border-r border-gray-200 dark:text-gray-200 dark:border-gray-700">
                  {index + 1}
                </td>

                {/* NISN */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 dark:text-gray-200 dark:border-gray-700">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-300">
                    {row.nisn}
                  </span>
                </td>

                {/* Nama Siswa */}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-200 dark:text-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    {isLowAttendance && (
                      <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                    )}
                    {row.nama_siswa}
                  </div>
                </td>

                {/* Kelas */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 dark:text-gray-200 dark:border-gray-700">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium dark:bg-blue-900/50 dark:text-blue-300">
                    {row.kelas}
                  </span>
                </td>

                {/* Hadir */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-green-50 dark:bg-green-900/30">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-green-800 bg-green-200 rounded-lg dark:bg-green-700 dark:text-green-100">
                    {hadir}
                  </span>
                </td>

                {/* Sakit */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-yellow-50 dark:bg-yellow-900/30">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-yellow-800 bg-yellow-200 rounded-lg dark:bg-yellow-700 dark:text-yellow-100">
                    {sakit}
                  </span>
                </td>

                {/* Izin */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-blue-50 dark:bg-blue-900/30">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-blue-800 bg-blue-200 rounded-lg dark:bg-blue-700 dark:text-blue-100">
                    {izin}
                  </span>
                </td>

                {/* Alpa */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-red-50 dark:bg-red-900/30">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-red-800 bg-red-200 rounded-lg dark:bg-red-700 dark:text-red-100">
                    {alpa}
                  </span>
                </td>

                {/* Total Hari */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-gray-100 border-l border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-gray-800 bg-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100">
                    {totalHari}
                  </span>
                </td>

                {/* Persentase */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-indigo-50 dark:bg-indigo-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <div className="dark:text-white">
                      {getPercentageIcon(persentase)}
                    </div>
                    <span
                      className={`px-3 py-1.5 inline-flex text-sm font-bold rounded-lg border-2 ${getPercentageColor(
                        persentase
                      )}`}>
                      {persentase}%
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-4 whitespace-nowrap text-center">
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
              </tr>
            );
          })}
        </tbody>

        {/* Footer Summary (DIUPDATE untuk Dark Mode) */}
        <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold dark:from-gray-700 dark:to-gray-800">
          <tr>
            <td
              colSpan="4"
              className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-300 dark:text-gray-200 dark:border-gray-700">
              TOTAL / RATA-RATA:
            </td>
            <td className="px-4 py-3 text-center text-sm text-green-900 bg-green-100 dark:bg-green-900/70 dark:text-green-200">
              {data.reduce((sum, row) => sum + (parseInt(row.hadir) || 0), 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-yellow-900 bg-yellow-100 dark:bg-yellow-900/70 dark:text-yellow-200">
              {data.reduce((sum, row) => sum + (parseInt(row.sakit) || 0), 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-blue-900 bg-blue-100 dark:bg-blue-900/70 dark:text-blue-200">
              {data.reduce((sum, row) => sum + (parseInt(row.izin) || 0), 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-red-900 bg-red-100 dark:bg-red-900/70 dark:text-red-200">
              {data.reduce((sum, row) => sum + (parseInt(row.alpa) || 0), 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-gray-900 bg-gray-200 border-l border-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-700">
              {data.reduce((sum, row) => {
                const h = parseInt(row.hadir) || 0;
                const s = parseInt(row.sakit) || 0;
                const i = parseInt(row.izin) || 0;
                const a = parseInt(row.alpa) || 0;
                return sum + h + s + i + a;
              }, 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-indigo-900 bg-indigo-100 dark:bg-indigo-900/70 dark:text-indigo-200">
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
            <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-200">
              {data.length} Siswa
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer Legend (DIUPDATE untuk Dark Mode) */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <p className="text-sm text-gray-700 font-semibold mb-2 dark:text-gray-300">
              📊 Rekapitulasi Presensi - Menampilkan{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {data.length}
              </span>{" "}
              siswa
            </p>
            {/* Responsiveness: flex-wrap untuk legend */}
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>H =
                Hadir
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>S =
                Sakit
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>I =
                Izin
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>A =
                Alpa (Tanpa Keterangan)
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Status Kehadiran:
            </p>
            {/* Responsiveness: flex-wrap untuk status */}
            <div className="flex items-center gap-2 mt-1 text-xs flex-wrap justify-start sm:justify-end">
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
        </div>
      </div>
    </div>
  );
};

// ========================================
// GRID VIEW (NILAI AKHIR PER SISWA)
// ========================================

const renderGridView = (data) => {
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
    "Bahasa Indonesia": "B.Indo",
    "Bahasa Inggris": "B.Ing",
    "Bahasa Sunda": "B.Sunda",
    Matematika: "MTK",
    IPAS: "IPAS",
    "Pendidikan Pancasila": "Pend. Pacasila",
    "Seni Budaya": "Senbud",
    PABP: "PABP",
    PJOK: "PJOK",
  };

  // REVISI: Kontainer utama untuk Responsiveness (overflow-x-auto) & Dark Mode
  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {/* Header Sticky (DIUPDATE untuk Dark Mode) */}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-12 bg-gray-50 z-20 border-r border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
              NISN
            </th>
            {/* Tambah lebar dan z-index agar sticky berfungsi baik */}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-32 bg-gray-50 z-20 border-r border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 min-w-[150px]">
              Nama Siswa
            </th>
            {/* Kolom Nilai (DIUPDATE untuk Dark Mode) */}
            {MAPEL_LIST.map((mapel) => (
              <th
                key={mapel}
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 dark:text-gray-300"
                title={mapel}>
                {MAPEL_SHORT[mapel]}
              </th>
            ))}
            {/* Kolom Jumlah (DIUPDATE untuk Dark Mode) */}
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 border-l border-gray-300 dark:bg-yellow-900/30 dark:text-gray-300 dark:border-gray-700">
              Jumlah
            </th>
            {/* Kolom Rata-rata (DIUPDATE untuk Dark Mode) */}
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 dark:bg-green-900/30 dark:text-gray-300">
              Rata-rata
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {data.map((row, index) => (
            <tr
              key={row.id || `grid-row-${index}`}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              {/* Body Sticky (DIUPDATE untuk Dark Mode) */}
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-white border-r border-gray-200 z-10 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700">
                {index + 1}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-12 bg-white border-r border-gray-200 z-10 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700">
                {row.nisn}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-32 bg-white border-r border-gray-200 z-10 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 min-w-[150px]">
                {row.nama_siswa}
              </td>
              {/* Kolom Nilai */}
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
                    className="px-4 py-4 whitespace-nowrap text-center">
                    {isNA ? (
                      <span className="text-xs text-gray-400 italic">-</span>
                    ) : (
                      <span
                        className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${
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
              {/* Kolom Jumlah (DIUPDATE untuk Dark Mode) */}
              <td className="px-4 py-4 whitespace-nowrap text-center bg-yellow-50/50 border-l border-gray-200 dark:bg-yellow-900/10 dark:border-gray-700">
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-bold text-yellow-800 dark:text-yellow-300">
                  {row.jumlah || "-"}
                </span>
              </td>
              {/* Kolom Rata-rata (DIUPDATE untuk Dark Mode) */}
              <td className="px-4 py-4 whitespace-nowrap text-center bg-green-50/50 dark:bg-green-900/10">
                {row.rata_rata && row.rata_rata !== "-" ? (
                  <span
                    className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${
                      parseFloat(row.rata_rata) >= 75
                        ? "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200"
                    }`}>
                    {row.rata_rata}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 italic">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer info (DIUPDATE untuk Dark Mode) */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Menampilkan <span className="font-semibold">{data.length}</span> siswa
        </p>
      </div>
    </div>
  );
};

// ========================================
// TABLE HEADERS (DIUPDATE untuk Dark Mode)
// ========================================

const renderTableHeader = (type, userRole) => {
  // Base class header yang diupdate untuk Dark Mode
  const baseHeaderClass =
    "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300";

  switch (type) {
    case "students":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          <th className={baseHeaderClass}>NISN</th>
          <th className={baseHeaderClass}>Nama Siswa</th>
          <th className={baseHeaderClass}>Kelas</th>
          <th className={baseHeaderClass}>Jenis Kelamin</th>
          <th className={baseHeaderClass}>Status</th>
        </tr>
      );
    // ... (Case lainnya menggunakan baseHeaderClass yang sudah diupdate)
    case "grades":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          <th className={baseHeaderClass}>NISN</th>
          <th className={baseHeaderClass}>Nama Siswa</th>
          <th className={baseHeaderClass}>Mata Pelajaran</th>
          <th className={baseHeaderClass}>Nilai</th>
        </tr>
      );

    case "attendance":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          <th className={baseHeaderClass}>Tanggal</th>
          <th className={baseHeaderClass}>Nama Siswa</th>
          <th className={baseHeaderClass}>Kelas</th>
          <th className={baseHeaderClass}>Status</th>
          <th className={baseHeaderClass}>Jenis</th>
          <th className={baseHeaderClass}>Keterangan</th>
        </tr>
      );

    case "notes":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          <th className={baseHeaderClass}>Tanggal</th>
          {userRole === "guru_mapel" && (
            <th className={baseHeaderClass}>Kelas</th>
          )}
          <th className={baseHeaderClass}>Nama Siswa</th>
          <th className={baseHeaderClass}>Kategori</th>
          <th className={baseHeaderClass}>Label</th>
          <th className={baseHeaderClass}>Catatan</th>
          <th className={baseHeaderClass}>Tindak Lanjut</th>
          {userRole === "guru_kelas" && (
            <th className={baseHeaderClass}>Dibuat Oleh</th>
          )}
        </tr>
      );

    case "teachers":
      return (
        <tr>
          <th className={baseHeaderClass}>No</th>
          <th className={baseHeaderClass}>Nama Lengkap</th>
          <th className={baseHeaderClass}>Username</th>
          <th className={baseHeaderClass}>Role</th>
          <th className={baseHeaderClass}>Kelas/Mapel</th>
          <th className={baseHeaderClass}>Tahun Ajaran</th>
          <th className={baseHeaderClass}>Status</th>
        </tr>
      );

    default:
      return null;
  }
};

// ========================================
// TABLE BODY (DIUPDATE untuk Dark Mode)
// ========================================

const renderTableBody = (data, type) => {
  // Base class untuk td yang diupdate untuk Dark Mode
  const baseTdClass =
    "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200";
  const baseNameTdClass =
    "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200";

  switch (type) {
    case "students":
      return data.map((row, index) => (
        <tr
          key={row.id}
          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <td className={baseTdClass}>{index + 1}</td>
          <td className={baseTdClass}>{row.nisn}</td>
          <td className={baseNameTdClass}>{row.nama_siswa}</td>
          <td className={baseTdClass}>{row.kelas}</td>
          <td className={baseTdClass}>{row.jenis_kelamin}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                row.is_active
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              }`}>
              {row.is_active ? "Aktif" : "Tidak Aktif"}
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
          <td className={baseTdClass}>{row.nisn}</td>
          <td className={baseNameTdClass}>{row.nama_siswa}</td>
          <td className={baseTdClass}>{row.mata_pelajaran}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${
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
          <td className={baseTdClass}>{formatDate(row.tanggal)}</td>
          <td className={baseNameTdClass}>{row.nama_siswa}</td>
          <td className={baseTdClass}>{row.kelas}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                row.status
              )}`}>
              {row.status}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                row.jenis_presensi === "kelas"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
              }`}>
              {row.jenis_presensi || "-"}
            </span>
          </td>
          {/* Keterangan: text-gray-900 diubah ke baseTdClass */}
          <td className={`${baseTdClass} max-w-xs`}>{row.keterangan || "-"}</td>
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
            <td className={baseTdClass}>{formatDate(row.created_at)}</td>
            {showKelas && <td className={baseTdClass}>Kelas {row.class_id}</td>}
            <td className={baseNameTdClass}>{row.student_name || "-"}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(
                  row.category
                )}`}>
                {row.category || "-"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLabelColor(
                  row.label
                )}`}>
                {row.label || "-"}
              </span>
            </td>
            {/* Catatan: text-gray-900 diubah ke baseTdClass */}
            <td className={`${baseTdClass} max-w-xs`}>
              {/* Tambahkan line-clamp-2 untuk mobile readability */}
              <div className="line-clamp-2" title={row.note_content}>
                {row.note_content || "-"}
              </div>
            </td>
            {/* Tindak Lanjut: text-gray-900 diubah ke baseTdClass */}
            <td className={baseTdClass}>
              {row.action_taken && row.action_taken.trim() !== "" ? (
                <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sudah
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Belum
                </span>
              )}
            </td>
            {showTeacher && (
              <td className={baseTdClass}>{row.teacher_name || "-"}</td>
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
          <td className={baseNameTdClass}>{row.full_name}</td>
          <td className={baseTdClass}>{row.username}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
              : row.mata_pelajaran || "-"}
          </td>
          <td className={baseTdClass}>{row.tahun_ajaran || "-"}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                row.is_active
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              }`}>
              {row.is_active ? "Aktif" : "Tidak Aktif"}
            </span>
          </td>
        </tr>
      ));

    default:
      return null;
  }
};

// ========================================
// UTILITY FUNCTIONS (DIUPDATE untuk Dark Mode)
// ========================================

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
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

export default DataTable;
