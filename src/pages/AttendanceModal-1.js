// src/pages/AttendanceModal.js
import React, { useState, useEffect, useMemo } from "react";
import { X, RefreshCw, Calendar, School, BookOpen } from "lucide-react";
import { getSemesterData } from "../services/semesterService";

const getAttendanceCategory = (percentage) => {
  if (percentage >= 90)
    return { text: "Sangat Baik", color: "bg-green-100 text-green-700" };
  if (percentage >= 80)
    return { text: "Baik", color: "bg-blue-100 text-blue-700" };
  if (percentage >= 70)
    return { text: "Cukup", color: "bg-yellow-100 text-yellow-700" };
  return { text: "Kurang", color: "bg-red-100 text-red-700" };
};

const RecapModal = ({ show, onClose, activeClass }) => {
  const [filterMode, setFilterMode] = useState("semester");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedSemester, setSelectedSemester] = useState("Ganjil");
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const academicYears = [
    { value: 2025, label: "2025/2026" },
    { value: 2026, label: "2026/2027" },
    { value: 2027, label: "2027/2028" },
  ];

  const getAcademicYearLabel = (year) => {
    return (
      academicYears.find((y) => y.value === year)?.label ||
      `${year}/${year + 1}`
    );
  };

  const fetchData = async () => {
    if (!activeClass) return;
    setIsLoading(true);
    try {
      const month = filterMode === "month" ? selectedMonth : 0;
      const result = await getSemesterData(
        selectedSemester,
        getAcademicYearLabel(selectedYear),
        activeClass,
        month
      );
      setData(result || []);
    } catch (error) {
      console.error("Error:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (show && activeClass) {
      fetchData();
    }
  }, [
    show,
    activeClass,
    selectedSemester,
    selectedYear,
    filterMode,
    selectedMonth,
  ]);

  const summary = useMemo(() => {
    if (!data.length) return null;
    const totalStudents = data.length;
    const avgPercentage = (
      data.reduce((sum, s) => sum + s.percentage, 0) / totalStudents
    ).toFixed(1);
    const goodAttendance = data.filter((s) => s.percentage >= 80).length;
    const highAlpa = data.filter((s) => s.alpa > 3).length;
    const totalHariEfektif = data[0]?.total_hari_efektif || 0;
    return {
      totalStudents,
      avgPercentage,
      goodAttendance,
      highAlpa,
      totalHariEfektif,
    };
  }, [data]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen size={24} />
              Rekap Presensi - Kelas {activeClass}
            </h2>
            <p className="text-sm opacity-90 mt-1">
              {selectedSemester} {getAcademicYearLabel(selectedYear)}
              {filterMode === "month" && ` • ${monthNames[selectedMonth - 1]}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              title="Refresh">
              <RefreshCw
                size={20}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
              <button
                onClick={() => setFilterMode("semester")}
                className={`px-4 py-2 rounded text-sm font-medium transition ${
                  filterMode === "semester"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}>
                <School size={16} className="inline mr-1" />
                Per Semester
              </button>
              <button
                onClick={() => setFilterMode("month")}
                className={`px-4 py-2 rounded text-sm font-medium transition ${
                  filterMode === "month"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}>
                <Calendar size={16} className="inline mr-1" />
                Per Bulan
              </button>
            </div>

            {/* Year */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Tahun:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                disabled={isLoading}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                {academicYears.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Semester:
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                disabled={isLoading}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            {/* Month */}
            {filterMode === "month" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Bulan:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  {monthNames.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY */}
        {summary && (
          <div className="px-6 py-4 bg-white border-b border-gray-200 shrink-0">
            <div className="grid grid-cols-5 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.totalStudents}
                </div>
                <div className="text-xs text-blue-700 font-medium">
                  Total Siswa
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.totalHariEfektif}
                </div>
                <div className="text-xs text-purple-700 font-medium">
                  Hari Efektif
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {summary.avgPercentage}%
                </div>
                <div className="text-xs text-green-700 font-medium">
                  Rata-rata
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {summary.goodAttendance}
                </div>
                <div className="text-xs text-orange-700 font-medium">
                  Kehadiran ≥80%
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {summary.highAlpa}
                </div>
                <div className="text-xs text-red-700 font-medium">Alpa >3</div>
              </div>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="flex-1 px-6 py-4 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <RefreshCw className="animate-spin mb-3" size={32} />
              <p className="text-sm">Memuat data...</p>
            </div>
          ) : data.length > 0 ? (
            <div className="h-full border border-gray-200 rounded-lg overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-center border-r border-gray-200 font-semibold">
                      No
                    </th>
                    <th className="px-3 py-3 text-center border-r border-gray-200 font-semibold">
                      NISN
                    </th>
                    <th className="px-4 py-3 text-left border-r border-gray-200 font-semibold">
                      Nama Siswa
                    </th>
                    <th className="px-3 py-3 text-center border-r border-gray-200 bg-green-50 text-green-700 font-semibold">
                      Hadir
                    </th>
                    <th className="px-3 py-3 text-center border-r border-gray-200 bg-yellow-50 text-yellow-700 font-semibold">
                      Sakit
                    </th>
                    <th className="px-3 py-3 text-center border-r border-gray-200 bg-blue-50 text-blue-700 font-semibold">
                      Izin
                    </th>
                    <th className="px-3 py-3 text-center border-r border-gray-200 bg-red-50 text-red-700 font-semibold">
                      Alpa
                    </th>
                    <th className="px-3 py-3 text-center border-r border-gray-200 font-semibold">
                      Total
                    </th>
                    <th className="px-3 py-3 text-center border-r border-gray-200 font-semibold">
                      %
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      Kategori
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((s, i) => (
                    <tr
                      key={s.nisn}
                      className="border-b border-gray-200 hover:bg-blue-50 transition">
                      <td className="px-3 py-3 text-center border-r border-gray-200 font-medium">
                        {i + 1}
                      </td>
                      <td className="px-3 py-3 text-center border-r border-gray-200 font-mono text-xs bg-gray-50">
                        {s.nisn}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200 font-medium">
                        {s.nama_siswa}
                      </td>
                      <td className="px-3 py-3 text-center border-r border-gray-200 text-green-600 font-bold">
                        {s.hadir}
                      </td>
                      <td className="px-3 py-3 text-center border-r border-gray-200 text-yellow-600 font-bold">
                        {s.sakit}
                      </td>
                      <td className="px-3 py-3 text-center border-r border-gray-200 text-blue-600 font-bold">
                        {s.izin}
                      </td>
                      <td className="px-3 py-3 text-center border-r border-gray-200 text-red-600 font-bold">
                        {s.alpa}
                      </td>
                      <td className="px-3 py-3 text-center border-r border-gray-200 font-bold bg-gray-50">
                        {s.total}
                      </td>
                      <td className="px-3 py-3 text-center border-r border-gray-200">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            s.percentage >= 90
                              ? "bg-green-100 text-green-700"
                              : s.percentage >= 80
                              ? "bg-blue-100 text-blue-700"
                              : s.percentage >= 70
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                          {s.percentage}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            getAttendanceCategory(s.percentage).color
                          }`}>
                          {getAttendanceCategory(s.percentage).text}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg font-medium">Tidak ada data</p>
              <p className="text-sm mt-2">Coba ubah filter</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-gray-50 px-6 py-3 border-t shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecapModal;
