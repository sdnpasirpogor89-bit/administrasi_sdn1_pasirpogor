// src/pages/RecapModal.js
import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, Calendar } from 'lucide-react';

// Helper untuk extract semua tanggal unik dari data
const extractAllDatesFromData = (data) => {
  if (!data || data.length === 0) return [];
  
  const allDates = new Set();
  
  // Loop melalui semua siswa
  data.forEach(student => {
    // Cek jika student punya dailyStatus (format baru)
    if (student.dailyStatus && typeof student.dailyStatus === 'object') {
      Object.keys(student.dailyStatus).forEach(date => {
        allDates.add(date);
      });
    }
  });
  
  // Convert ke array dan sort secara ascending
  const sortedDates = Array.from(allDates).sort();
  return sortedDates;
};

// Helper untuk get status berdasarkan date
const getStudentStatusByDate = (student, date) => {
  // Format 1: dailyStatus object { "2024-09-22": "hadir", ... }
  if (student.dailyStatus && student.dailyStatus[date]) {
    return student.dailyStatus[date];
  }
  
  // Format 2: fallback ke data lama atau format alternatif
  return null;
};

// Helper untuk normalize status (handle both uppercase and lowercase)
const normalizeStatus = (status) => {
  if (!status) return status;
  // Convert to lowercase first, then capitalize first letter
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

// Helper untuk status badge - DIPERBAIKI: center alignment
const getStatusBadge = (status) => {
  if (!status) return <span className="text-gray-400">-</span>;
  
  // Normalize status to handle lowercase from database
  const normalizedStatus = normalizeStatus(status);
  
  const statusMap = {
    hadir: { text: "H", color: "bg-green-500 text-white" },
    sakit: { text: "S", color: "bg-yellow-500 text-white" },
    izin: { text: "I", color: "bg-blue-500 text-white" },
    alpa: { text: "A", color: "bg-red-500 text-white" },
    // Handle uppercase
    Hadir: { text: "H", color: "bg-green-500 text-white" },
    Sakit: { text: "S", color: "bg-yellow-500 text-white" },
    Izin: { text: "I", color: "bg-blue-500 text-white" },
    Alpa: { text: "A", color: "bg-red-500 text-white" },
    H: { text: "H", color: "bg-green-500 text-white" },
    S: { text: "S", color: "bg-yellow-500 text-white" },
    I: { text: "I", color: "bg-blue-500 text-white" },
    A: { text: "A", color: "bg-red-500 text-white" },
  };

  const statusInfo = statusMap[status] || statusMap[normalizedStatus] || { 
    text: "-", 
    color: "bg-gray-200 text-gray-500" 
  };
  
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${statusInfo.color} mx-auto`}>
      {statusInfo.text}
    </span>
  );
};

// Helper function untuk format tanggal seperti "15-09"
const formatDateHeader = (dateStr) => {
  try {
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}-${month}`;
  } catch (error) {
    // Fallback: coba extract dari string langsung
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const day = parts[2] ? parts[2].substring(0, 2) : parts[0];
        const month = parts[1] ? parts[1].padStart(2, '0') : parts[0];
        return `${day}-${month}`;
      }
    }
    return dateStr;
  }
};

// Komponen RecapModal untuk display data rekap saja
const RecapModal = ({ show, onClose, data, title, subtitle, loading, onRefreshData, activeClass }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceDates, setAttendanceDates] = useState([]);
  const [processedData, setProcessedData] = useState([]);

  // Array nama bulan dalam Bahasa Indonesia
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Generate year options (from current year to 2030)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 2030 - currentYear + 1 }, 
    (_, i) => currentYear + i
  );

  // Process data ketika data berubah
  useEffect(() => {
    if (data && data.length > 0) {
      console.log("📊 Data diterima di RecapModal:", data);
      console.log("📊 Sample dailyStatus:", data[0]?.dailyStatus);
      
      // Extract semua tanggal unik
      const dates = extractAllDatesFromData(data);
      setAttendanceDates(dates);
      
      // Process data untuk memastikan format konsisten
      const processed = data.map(student => {
        return student; // Gunakan data langsung karena sudah di-process di parent
      });
      
      setProcessedData(processed);
      console.log("📅 Tanggal yang ditemukan:", dates);
      console.log("📊 Total tanggal:", dates.length);
    } else {
      console.log("⚠️ Data kosong atau tidak valid");
      setAttendanceDates([]);
      setProcessedData([]);
    }
  }, [data]);

  // Reset to current month/year when modal opens
  useEffect(() => {
    if (show) {
      const now = new Date();
      setSelectedMonth(now.getMonth() + 1);
      setSelectedYear(now.getFullYear());
    }
  }, [show]);

  // Handle period change
  const handlePeriodChange = async (month, year) => {
    if (month !== selectedMonth || year !== selectedYear) {
      setSelectedMonth(month);
      setSelectedYear(year);
      
      if (onRefreshData) {
        await onRefreshData(month, year);
      }
    }
  };

  // Generate dynamic subtitle with selected period
  const getDynamicSubtitle = () => {
    const monthName = monthNames[selectedMonth - 1];
    return `Laporan Kehadiran Siswa Bulan ${monthName} ${selectedYear}`;
  };

  // Optimasi performance dengan useMemo
  const filteredDates = useMemo(() => {
    return attendanceDates.filter(date => {
      try {
        const dateObj = new Date(date + "T00:00:00");
        return dateObj.getMonth() + 1 === selectedMonth && 
               dateObj.getFullYear() === selectedYear;
      } catch (error) {
        return true;
      }
    });
  }, [attendanceDates, selectedMonth, selectedYear]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header - Horizontal Layout */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-3 sm:p-4 flex justify-between items-center flex-shrink-0 gap-3">
          <h2 className="text-sm sm:text-lg font-bold">📊 Rekap Presensi</h2>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Period Selector - FIXED: Background putih, text hitam, dropdown terpisah */}
            <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg p-1 shadow-sm">
              {/* Bulan */}
              <div className="flex items-center gap-1">
                <Calendar size={16} className="text-blue-500" />
                <select 
                  value={selectedMonth} 
                  onChange={(e) => handlePeriodChange(parseInt(e.target.value), selectedYear)}
                  className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 border-r border-gray-200 min-w-[80px]"
                  disabled={loading}
                >
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1} className="text-gray-700">
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Tahun */}
              <select 
                value={selectedYear} 
                onChange={(e) => handlePeriodChange(selectedMonth, parseInt(e.target.value))}
                className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 min-w-[70px]"
                disabled={loading}
              >
                {yearOptions.map(year => (
                  <option key={year} value={year} className="text-gray-700">
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col overflow-hidden">
          {/* Compact Header - STICKY */}
          <div className="mb-2 text-center border border-gray-200 rounded-lg p-2 bg-white flex-shrink-0 sticky top-0 z-30 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-gray-800">
              {title || "REKAP PRESENSI"} {activeClass && `- KELAS ${activeClass}`}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {getDynamicSubtitle()}
            </p>
            {filteredDates.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {filteredDates.length} hari aktif • {formatDateHeader(filteredDates[0])} - {formatDateHeader(filteredDates[filteredDates.length - 1])}
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center p-8 text-gray-500 flex-1">
              <RefreshCw className="animate-spin mr-3" size={20} />
              <span className="text-gray-600">Memuat data rekap...</span>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex-1 flex flex-col">
              {/* Mobile: Swipe instruction dengan visual indicator */}
              {filteredDates.length > 0 && (
                <div className="bg-blue-50 p-2 text-center text-xs text-blue-700 sm:hidden border-b border-blue-200 flex-shrink-0 flex items-center justify-center gap-2">
                  <span>👉 Geser untuk melihat semua hari</span>
                  <span className="bg-blue-200 px-2 py-1 rounded text-blue-800 font-bold">
                    {filteredDates.length} hari
                  </span>
                </div>
              )}
              
              <div className="overflow-auto flex-1 relative">
                {/* Scroll indicator untuk mobile */}
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none sm:hidden z-10"></div>
                
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead className="bg-gray-100 sticky top-0 z-20">
                    <tr className="border-b-2 border-gray-400">
                      {/* Fixed columns */}
                      <th className="p-2 text-center font-bold text-gray-800 border-r-2 border-gray-300 sticky left-0 bg-gray-100 z-30 min-w-[40px] sm:min-w-[50px]">
                        No.
                      </th>
                      <th className="p-2 text-left font-bold text-gray-800 border-r-2 border-gray-300 sticky left-[40px] sm:left-[50px] bg-gray-100 z-30 min-w-[140px] sm:min-w-[200px]">
                        Nama Siswa
                      </th>
                      
                      {/* Dynamic date columns */}
                      {filteredDates.map((date, index) => (
                        <th
                          key={date}
                          className={`p-1 text-center font-bold text-gray-800 min-w-[40px] sm:min-w-[45px] whitespace-nowrap ${
                            index < filteredDates.length - 1 ? 'border-r border-gray-300' : 'border-r-2 border-gray-400'
                          }`}>
                          {formatDateHeader(date)}
                        </th>
                      ))}
                      
                      {/* Summary columns - DIPERBAIKI: "Alpa" bukan "Alfa" */}
                      <th className="p-2 text-center font-bold text-green-700 border-r border-gray-300 min-w-[40px] sm:min-w-[45px] bg-green-50">
                        Hadir
                      </th>
                      <th className="p-2 text-center font-bold text-blue-700 border-r border-gray-300 min-w-[40px] sm:min-w-[45px] bg-blue-50">
                        Izin
                      </th>
                      <th className="p-2 text-center font-bold text-yellow-700 border-r border-gray-300 min-w-[40px] sm:min-w-[45px] bg-yellow-50">
                        Sakit
                      </th>
                      <th className="p-2 text-center font-bold text-red-700 border-r-2 border-gray-400 min-w-[40px] sm:min-w-[45px] bg-red-50">
                        Alpa
                      </th>
                      <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[40px] sm:min-w-[45px]">
                        Total
                      </th>
                      <th className="p-2 text-center font-bold text-gray-800 min-w-[50px] sm:min-w-[60px]">
                        Persentase
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData && processedData.length > 0 ? (
                      processedData.map((student, index) => (
                        <tr
                          key={student.nisn || student.id || index}
                          className="border-b border-gray-200 hover:bg-blue-50 transition">
                          {/* Fixed columns dengan shadow untuk mobile */}
                          <td className="p-2 text-center border-r-2 border-gray-300 sticky left-0 bg-white z-10 font-medium shadow-right sm:shadow-none">
                            {index + 1}
                          </td>
                          <td className="p-2 font-medium text-gray-800 border-r-2 border-gray-300 sticky left-[40px] sm:left-[50px] bg-white z-10 whitespace-nowrap shadow-right sm:shadow-none">
                            {student.name || student.full_name || student.nama_siswa}
                          </td>
                          
                          {/* Daily status - DIPERBAIKI: Center alignment */}
                          {filteredDates.map((date, index) => (
                            <td
                              key={date}
                              className={`p-1 text-center ${
                                index < filteredDates.length - 1 ? 'border-r border-gray-200' : 'border-r-2 border-gray-400'
                              }`}>
                              <div className="flex justify-center">
                                {getStatusBadge(getStudentStatusByDate(student, date))}
                              </div>
                            </td>
                          ))}
                          
                          {/* Summary - DIPERBAIKI: "Alpa" bukan "Alfa" */}
                          <td className="p-2 text-center text-green-700 font-bold border-r border-gray-200 bg-green-50/50">
                            {student.hadir || 0}
                          </td>
                          <td className="p-2 text-center text-blue-700 font-bold border-r border-gray-200 bg-blue-50/50">
                            {student.izin || 0}
                          </td>
                          <td className="p-2 text-center text-yellow-700 font-bold border-r border-gray-200 bg-yellow-50/50">
                            {student.sakit || 0}
                          </td>
                          <td className="p-2 text-center text-red-700 font-bold border-r-2 border-gray-400 bg-red-50/50">
                            {student.alpa || 0}
                          </td>
                          <td className="p-2 text-center font-bold text-gray-800 border-r border-gray-200">
                            {student.total || 0}
                          </td>
                          <td className="p-2 text-center font-bold text-gray-800">
                            <span className={`inline-flex items-center justify-center w-12 px-2 py-1 rounded-full text-xs font-semibold ${
                              student.percentage >= 80 
                                ? 'bg-green-100 text-green-700' 
                                : student.percentage >= 60
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {student.percentage || 0}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={filteredDates.length + 8}
                          className="p-8 text-center text-gray-500">
                          <div className="text-3xl sm:text-4xl mb-3">📅</div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">Belum Ada Data</h4>
                          <p className="text-xs sm:text-sm">Belum ada data presensi untuk bulan ini</p>
                          <span className="text-xs text-gray-400 mt-1">
                            {monthNames[selectedMonth - 1]} {selectedYear}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {processedData && processedData.length > 0 && (
              <span>
                Total {processedData.length} siswa • {filteredDates.length} hari aktif • Periode {monthNames[selectedMonth - 1]} {selectedYear}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm sm:text-base font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecapModal;