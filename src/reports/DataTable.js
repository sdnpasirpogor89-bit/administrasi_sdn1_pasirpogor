// src/reports/DataTable.js
import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Component tabel untuk display data laporan
 * 
 * @param {array} data - Array data dari useReportData
 * @param {string} type - Report type: 'students' | 'grades' | 'attendance' | 'teachers'
 * @param {boolean} loading - Loading state
 */
const DataTable = ({ data = [], type, loading = false }) => {
  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
          <span className="text-gray-600">Memuat data...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">Tidak ada data</p>
          <p className="text-sm">Silakan ubah filter untuk melihat data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {renderTableHeader(type)}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {renderTableBody(data, type)}
          </tbody>
        </table>
      </div>
      
      {/* Footer info */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold">{data.length}</span> data
        </p>
      </div>
    </div>
  );
};

// ========================================
// TABLE HEADERS
// ========================================

const renderTableHeader = (type) => {
  switch (type) {
    case 'students':
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NISN</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Kelamin</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        </tr>
      );

    case 'grades':
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Nilai</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
        </tr>
      );

    case 'attendance':
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Presensi</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
        </tr>
      );

    case 'teachers':
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Guru</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas/Mapel</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Nilai</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Presensi</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Input</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terakhir Input</th>
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
    case 'students':
      return data.map((row, index) => (
        <tr key={row.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.nisn}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.nama_siswa}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.kelas}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              row.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {row.is_active ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </td>
        </tr>
      ));

    case 'grades':
      return data.map((row, index) => (
        <tr key={row.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.nama_siswa}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.kelas}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.mata_pelajaran}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.jenis_nilai}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              row.nilai >= 75 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {row.nilai}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {formatDate(row.tanggal)}
          </td>
        </tr>
      ));

    case 'attendance':
      return data.map((row, index) => (
        <tr key={row.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {formatDate(row.tanggal)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.nama_siswa}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.kelas}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
              {row.status}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.jenis_presensi || '-'}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{row.keterangan || '-'}</td>
        </tr>
      ));

    case 'teachers':
      return data.map((row, index) => (
        <tr key={row.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.full_name}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.role}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.role === 'Guru Kelas' ? row.kelas : row.mata_pelajaran}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalInputNilai || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalInputPresensi || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{row.totalInput || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {row.terakhirInput ? formatDateTime(row.terakhirInput) : 'Belum pernah'}
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
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Hadir':
      return 'bg-green-100 text-green-800';
    case 'Sakit':
      return 'bg-yellow-100 text-yellow-800';
    case 'Izin':
      return 'bg-blue-100 text-blue-800';
    case 'Alpha':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default DataTable;