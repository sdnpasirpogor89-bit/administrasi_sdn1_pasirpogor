// pages/attendance/AttendanceTable.js

import React from "react";
import {
  UserCheck,
  Activity,
  AlertTriangle,
  X,
  Hospital,
  FileText,
  FileX,
  Clock,
  RefreshCw,
} from "lucide-react";

// Helper function untuk mendapatkan status ikon dan warna
const getStatusIcon = (status) => {
  switch (status) {
    case "Hadir":
      return { Icon: UserCheck, color: "text-green-600", bg: "bg-green-100" };
    case "Sakit":
      return { Icon: Hospital, color: "text-orange-600", bg: "bg-orange-100" };
    case "Izin":
      return { Icon: FileText, color: "text-blue-600", bg: "bg-blue-100" };
    case "Alpa":
      return { Icon: FileX, color: "text-red-600", bg: "bg-red-100" };
    default:
      return { Icon: Clock, color: "text-gray-600", bg: "bg-gray-100" }; // Status "Pending"
  }
};

// Component untuk Tampilan Card (Mobile/Small Screen)
export const AttendanceCard = React.memo(
  ({ student, handleStatusChange, handleShowRekap, selectedDate }) => {
    const { Icon, color, bg } = getStatusIcon(student.status);

    return (
      <div className="bg-white rounded-xl shadow-md p-4 space-y-3 border border-gray-200 hover:shadow-lg transition duration-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">
              {student.kelas} - {student.nis}
            </div>
            <h3 className="text-base font-bold text-gray-900 line-clamp-2">
              {student.nama}
            </h3>
          </div>
          <button
            onClick={() => handleShowRekap(student, selectedDate)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition duration-150 p-1 flex items-center gap-1 flex-shrink-0">
            <Activity size={16} /> Rekap
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${color} ${bg}`}>
            <Icon size={14} />
            <span>{student.status}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {["Hadir", "Sakit", "Izin", "Alpa"].map((status) => {
            const { Icon: StatusIcon } = getStatusIcon(status);
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(student.nis, status)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                  student.status === status
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                <StatusIcon size={12} />
                {status}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

// Component untuk Tampilan Tabel (Desktop/Large Screen)
export const AttendanceTable = React.memo(
  ({
    filteredAttendance,
    handleStatusChange,
    handleShowRekap,
    selectedDate,
    loading,
    error,
  }) => {
    // Tampilan Loading/Error/Empty
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-lg mt-6">
          <RefreshCw size={24} className="text-blue-500 animate-spin" />
          <p className="ml-3 text-lg font-medium text-gray-600">
            Mengambil data presensi...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-64 bg-red-50 rounded-xl shadow-lg mt-6 p-4">
          <AlertTriangle size={30} className="text-red-600 mb-3" />
          <p className="text-lg font-medium text-red-700">Terjadi Kesalahan</p>
          <p className="text-sm text-red-500 text-center mt-1">
            Gagal memuat data presensi. Coba refresh halaman.
          </p>
        </div>
      );
    }

    if (filteredAttendance.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-64 bg-gray-50 rounded-xl shadow-lg mt-6 p-4">
          <X size={30} className="text-gray-400 mb-3" />
          <p className="text-lg font-medium text-gray-600">
            Data Tidak Ditemukan
          </p>
          <p className="text-sm text-gray-500 text-center mt-1">
            Tidak ada siswa dalam kelas ini atau kata kunci pencarian tidak
            cocok.
          </p>
        </div>
      );
    }

    // Tampilan Tabel Utama
    return (
      <div className="mt-6 hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-1/12">
                  No.
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-3/12">
                  Nama Siswa
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-2/12">
                  NIS
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-3/12">
                  Status Presensi
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-1/12">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttendance.map((student, index) => {
                const { Icon, color, bg } = getStatusIcon(student.status);

                return (
                  <tr
                    key={student.nis}
                    className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.nama}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                      {student.nis}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {["Hadir", "Sakit", "Izin", "Alpa"].map((status) => {
                          const { Icon: StatusIcon } = getStatusIcon(status);

                          return (
                            <button
                              key={status}
                              onClick={() =>
                                handleStatusChange(student.nis, status)
                              }
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                                student.status === status
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                              }`}>
                              <StatusIcon size={12} />
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleShowRekap(student, selectedDate)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition duration-150">
                        Rekap <Activity size={14} className="inline ml-1" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);
