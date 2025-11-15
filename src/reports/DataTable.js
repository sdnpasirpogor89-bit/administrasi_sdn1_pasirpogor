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
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span className="text-gray-600">Memuat data...</span>
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {renderTableHeader(type, userRole)}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {renderTableBody(data, type)}
        </tbody>
      </table>

      {/* Footer info */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
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
  // Helper function untuk menghitung persentase
  const calculatePercentage = (hadir, total) => {
    if (!total || total === 0) return 0;
    return ((hadir / total) * 100).toFixed(1);
  };

  // Helper function untuk warna badge persentase
  const getPercentageColor = (percentage) => {
    const pct = parseFloat(percentage);
    if (pct >= 90) return "bg-green-100 text-green-800 border-green-300";
    if (pct >= 80) return "bg-blue-100 text-blue-800 border-blue-300";
    if (pct >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  // Helper function untuk icon persentase
  const getPercentageIcon = (percentage) => {
    const pct = parseFloat(percentage);
    if (pct >= 90) return <TrendingUp className="w-3 h-3" />;
    if (pct >= 80) return <TrendingUp className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
              NISN
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
              Nama Siswa
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
              Kelas
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-green-700 uppercase tracking-wider bg-green-50">
              H
              <div className="text-[10px] font-normal text-gray-500 normal-case">
                Hadir
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-yellow-700 uppercase tracking-wider bg-yellow-50">
              S
              <div className="text-[10px] font-normal text-gray-500 normal-case">
                Sakit
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50">
              I
              <div className="text-[10px] font-normal text-gray-500 normal-case">
                Izin
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-red-700 uppercase tracking-wider bg-red-50">
              A
              <div className="text-[10px] font-normal text-gray-500 normal-case">
                Alpa
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100 border-l border-gray-300">
              Total Hari
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50">
              Persentase
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
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
                className={`hover:bg-gray-50 transition ${
                  isLowAttendance ? "bg-red-50/30" : ""
                }`}>
                {/* No */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium border-r border-gray-200">
                  {index + 1}
                </td>

                {/* NISN */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {row.nisn}
                  </span>
                </td>

                {/* Nama Siswa */}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    {isLowAttendance && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    {row.nama_siswa}
                  </div>
                </td>

                {/* Kelas */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {row.kelas}
                  </span>
                </td>

                {/* Hadir */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-green-50">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-green-800 bg-green-200 rounded-lg">
                    {hadir}
                  </span>
                </td>

                {/* Sakit */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-yellow-50">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-yellow-800 bg-yellow-200 rounded-lg">
                    {sakit}
                  </span>
                </td>

                {/* Izin */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-blue-50">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-blue-800 bg-blue-200 rounded-lg">
                    {izin}
                  </span>
                </td>

                {/* Alpa */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-red-50">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-red-800 bg-red-200 rounded-lg">
                    {alpa}
                  </span>
                </td>

                {/* Total Hari */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-gray-100 border-l border-gray-200">
                  <span className="px-3 py-1.5 inline-flex text-sm font-bold text-gray-800 bg-gray-200 rounded-lg">
                    {totalHari}
                  </span>
                </td>

                {/* Persentase */}
                <td className="px-4 py-4 whitespace-nowrap text-center bg-indigo-50">
                  <div className="flex items-center justify-center gap-1">
                    {getPercentageIcon(persentase)}
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
                    <span className="px-3 py-1.5 inline-flex text-xs font-bold bg-green-100 text-green-800 rounded-full border border-green-300">
                      ✓ Sangat Baik
                    </span>
                  ) : parseFloat(persentase) >= 80 ? (
                    <span className="px-3 py-1.5 inline-flex text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                      ✓ Baik
                    </span>
                  ) : parseFloat(persentase) >= 70 ? (
                    <span className="px-3 py-1.5 inline-flex text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">
                      ⚠ Cukup
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 inline-flex text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-300">
                      ✗ Kurang
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Footer Summary */}
        <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold">
          <tr>
            <td
              colSpan="4"
              className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-300">
              TOTAL / RATA-RATA:
            </td>
            <td className="px-4 py-3 text-center text-sm text-green-900 bg-green-100">
              {data.reduce((sum, row) => sum + (parseInt(row.hadir) || 0), 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-yellow-900 bg-yellow-100">
              {data.reduce((sum, row) => sum + (parseInt(row.sakit) || 0), 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-blue-900 bg-blue-100">
              {data.reduce((sum, row) => sum + (parseInt(row.izin) || 0), 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-red-900 bg-red-100">
              {data.reduce((sum, row) => sum + (parseInt(row.alpa) || 0), 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-gray-900 bg-gray-200 border-l border-gray-300">
              {data.reduce((sum, row) => {
                const h = parseInt(row.hadir) || 0;
                const s = parseInt(row.sakit) || 0;
                const i = parseInt(row.izin) || 0;
                const a = parseInt(row.alpa) || 0;
                return sum + h + s + i + a;
              }, 0)}
            </td>
            <td className="px-4 py-3 text-center text-sm text-indigo-900 bg-indigo-100">
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
            <td className="px-4 py-3 text-center text-sm text-gray-900">
              {data.length} Siswa
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer Legend */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-700 font-semibold mb-2">
              📊 Rekapitulasi Presensi - Menampilkan{" "}
              <span className="text-blue-600">{data.length}</span> siswa
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
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
          <div className="text-right">
            <p className="text-xs text-gray-600">Status Kehadiran:</p>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-green-600">≥90% = Sangat Baik</span>
              <span className="text-blue-600">≥80% = Baik</span>
              <span className="text-yellow-600">≥70% = Cukup</span>
              <span className="text-red-600">&lt;70% = Kurang</span>
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-300">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-12 bg-gray-50 z-10 border-r border-gray-300">
              NISN
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-32 bg-gray-50 z-10 border-r border-gray-300">
              Nama Siswa
            </th>
            {/* 🔥 HAPUS KOLOM KELAS DARI HEADER */}
            {MAPEL_LIST.map((mapel) => (
              <th
                key={mapel}
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50"
                title={mapel}>
                {MAPEL_SHORT[mapel]}
              </th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 border-l border-gray-300">
              Jumlah
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
              Rata-rata
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr
              key={row.id || `grid-row-${index}`}
              className="hover:bg-gray-50 transition">
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-white border-r border-gray-200">
                {index + 1}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-12 bg-white border-r border-gray-200">
                {row.nisn}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-32 bg-white border-r border-gray-200">
                {row.nama_siswa}
              </td>
              {/* 🔥 HAPUS KOLOM KELAS DARI BODY */}
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
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {nilai}
                      </span>
                    )}
                  </td>
                );
              })}
              {/* Kolom Jumlah */}
              <td className="px-4 py-4 whitespace-nowrap text-center bg-yellow-50 border-l border-gray-200">
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-bold text-yellow-800">
                  {row.jumlah || "-"}
                </span>
              </td>
              {/* Kolom Rata-rata */}
              <td className="px-4 py-4 whitespace-nowrap text-center bg-green-50">
                {row.rata_rata && row.rata_rata !== "-" ? (
                  <span
                    className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${
                      parseFloat(row.rata_rata) >= 75
                        ? "bg-green-200 text-green-900"
                        : "bg-red-200 text-red-900"
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

      {/* Footer info */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold">{data.length}</span> siswa
        </p>
      </div>
    </div>
  );
};

// ========================================
// TABLE HEADERS
// ========================================

const renderTableHeader = (type, userRole) => {
  switch (type) {
    case "students":
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            No
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            NISN
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Nama Siswa
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Kelas
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Jenis Kelamin
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
        </tr>
      );

    case "grades":
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            No
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            NISN
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Nama Siswa
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Mata Pelajaran
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Nilai
          </th>
        </tr>
      );

    case "attendance":
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            No
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tanggal
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Nama Siswa
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Kelas
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Jenis
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Keterangan
          </th>
        </tr>
      );

    case "notes":
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            No
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tanggal
          </th>
          {userRole === "guru_mapel" && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kelas
            </th>
          )}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Nama Siswa
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Kategori
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Label
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Catatan
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tindak Lanjut
          </th>
          {userRole === "guru_kelas" && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dibuat Oleh
            </th>
          )}
        </tr>
      );

    case "teachers":
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            No
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Nama Lengkap
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Username
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Role
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Kelas/Mapel
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tahun Ajaran
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
        </tr>
      );

    default:
      return null;
  }
};

// ========================================
// TABLE BODY
// ========================================

const renderTableBody = (data, type) => {
  switch (type) {
    case "students":
      return data.map((row, index) => (
        <tr key={row.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {index + 1}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.nisn}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {row.nama_siswa}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.kelas}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.jenis_kelamin}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                row.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
              {row.is_active ? "Aktif" : "Tidak Aktif"}
            </span>
          </td>
        </tr>
      ));

    case "grades":
      return data.map((row, index) => (
        <tr key={row.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {index + 1}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.nisn}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {row.nama_siswa}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.mata_pelajaran}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${
                row.nilai >= 75
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
              {row.nilai}
            </span>
          </td>
        </tr>
      ));

    case "attendance":
      return data.map((row, index) => (
        <tr key={row.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {index + 1}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {formatDate(row.tanggal)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {row.nama_siswa}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.kelas}
          </td>
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
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}>
              {row.jenis_presensi || "-"}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {row.keterangan || "-"}
          </td>
        </tr>
      ));

    case "notes":
      return data.map((row, index) => {
        const showKelas = row.showKelas;
        const showTeacher = row.showTeacher;

        return (
          <tr key={row.id} className="hover:bg-gray-50 transition">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {index + 1}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatDate(row.created_at)}
            </td>
            {showKelas && (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Kelas {row.class_id}
              </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {row.student_name || "-"}
            </td>
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
            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
              <div className="line-clamp-2" title={row.note_content}>
                {row.note_content || "-"}
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
              {row.action_taken && row.action_taken.trim() !== "" ? (
                <span className="inline-flex items-center gap-1 text-green-700">
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
                <span className="inline-flex items-center gap-1 text-gray-500">
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {row.teacher_name || "-"}
              </td>
            )}
          </tr>
        );
      });

    case "teachers":
      return data.map((row, index) => (
        <tr key={row.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {index + 1}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {row.full_name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.username}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                row.role === "guru_kelas"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800"
              }`}>
              {row.role === "guru_kelas" ? "Guru Kelas" : "Guru Mapel"}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.role === "guru_kelas"
              ? `Kelas ${row.kelas || "-"}`
              : row.mata_pelajaran || "-"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.tahun_ajaran || "-"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                row.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
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
// UTILITY FUNCTIONS
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
      return "bg-green-100 text-green-800";
    case "Sakit":
      return "bg-yellow-100 text-yellow-800";
    case "Izin":
      return "bg-blue-100 text-blue-800";
    case "Alpa":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case "akademik":
      return "bg-blue-100 text-blue-800";
    case "perilaku":
      return "bg-orange-100 text-orange-800";
    case "prestasi":
      return "bg-green-100 text-green-800";
    case "kesehatan":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getLabelColor = (label) => {
  const lowerLabel = label?.toLowerCase() || "";

  if (
    lowerLabel.includes("positif") ||
    lowerLabel.includes("baik") ||
    lowerLabel.includes("prestasi")
  ) {
    return "bg-green-100 text-green-800";
  }

  if (
    lowerLabel.includes("perhatian") ||
    lowerLabel.includes("peringatan") ||
    lowerLabel.includes("bimbingan")
  ) {
    return "bg-yellow-100 text-yellow-800";
  }

  if (
    lowerLabel.includes("urgent") ||
    lowerLabel.includes("serius") ||
    lowerLabel.includes("masalah")
  ) {
    return "bg-red-100 text-red-800";
  }

  return "bg-gray-100 text-gray-800";
};

export default DataTable;
