// src/pages/RecapModal.js
import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Calendar } from 'lucide-react';

// Komponen RecapModal untuk display data rekap saja
const RecapModal = ({ show, onClose, data, title, subtitle, loading, onRefreshData, activeClass }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Array nama bulan dalam Bahasa Indonesia
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Generate year options (current year ± 2)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({length: 5}, (_, i) => currentYear - 2 + i);

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

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 border-b border-gray-200 gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{getDynamicSubtitle()}</p>
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <Calendar size={16} className="text-blue-600" />
            <select 
              value={selectedMonth} 
              onChange={(e) => handlePeriodChange(parseInt(e.target.value), selectedYear)}
              className="bg-transparent text-blue-700 text-sm font-medium focus:outline-none cursor-pointer"
              disabled={loading}
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => handlePeriodChange(selectedMonth, parseInt(e.target.value))}
              className="bg-transparent text-blue-700 text-sm font-medium focus:outline-none cursor-pointer ml-2"
              disabled={loading}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Close Button Only */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="max-h-[55vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin mr-3" size={20} />
              <span className="text-gray-600">Memuat data rekap...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">No.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">NISN</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Nama Siswa</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Hadir</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Sakit</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Izin</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Alpa</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar size={48} className="text-gray-300" />
                          <span>Tidak ada data rekap untuk periode ini</span>
                          <span className="text-sm">
                            {monthNames[selectedMonth - 1]} {selectedYear}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.map((student, index) => (
                      <tr key={student.nisn || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.nisn}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          <span className="text-green-600 font-medium">{student.hadir}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          <span className="text-yellow-600 font-medium">{student.sakit}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          <span className="text-blue-600 font-medium">{student.izin}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          <span className="text-red-600 font-medium">{student.alpa}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            student.percentage >= 80 
                              ? 'bg-green-100 text-green-700' 
                              : student.percentage >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {student.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {data.length > 0 && (
                <span>
                  Total {data.length} siswa • Periode {monthNames[selectedMonth - 1]} {selectedYear}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecapModal;