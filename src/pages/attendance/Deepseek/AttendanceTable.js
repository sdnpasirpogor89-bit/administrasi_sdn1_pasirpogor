// src/pages/attendance/AttendanceTable.js
import React from "react";
import { Users, Check, Hospital, FileText, FileX } from "lucide-react";

// StatusButton Component (dimasukkan di sini karena cuma dipakai di file ini)
const StatusButton = React.memo(
  ({ status, active, onClick, icon: Icon, label, disabled = false }) => {
    const getStatusClass = () => {
      const baseClass =
        "flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-[40px] touch-manipulation";

      if (status === "Hadir") {
        return active
          ? `${baseClass} bg-green-600 text-white border-green-600 shadow-sm`
          : `${baseClass} bg-green-50 text-green-700 border-green-200 hover:bg-green-100 active:bg-green-200`;
      } else if (status === "Sakit") {
        return active
          ? `${baseClass} bg-yellow-600 text-white border-yellow-600 shadow-sm`
          : `${baseClass} bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 active:bg-yellow-200`;
      } else if (status === "Izin") {
        return active
          ? `${baseClass} bg-blue-600 text-white border-blue-600 shadow-sm`
          : `${baseClass} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 active:bg-blue-200`;
      } else if (status === "Alpa") {
        return active
          ? `${baseClass} bg-red-600 text-white border-red-600 shadow-sm`
          : `${baseClass} bg-red-50 text-red-700 border-red-200 hover:bg-red-100 active:bg-red-200`;
      }
      return baseClass;
    };

    return (
      <button
        className={getStatusClass()}
        onClick={onClick}
        disabled={disabled}>
        <Icon size={14} className="flex-shrink-0" />
        <span className="text-xs sm:text-sm">{label}</span>
      </button>
    );
  }
);

// Mobile Student Card Component
const StudentCard = ({
  student,
  originalIndex,
  attendance,
  activeClass,
  updateStatus,
  updateNote,
  saving,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {student.nama_siswa}
          </h3>
          <p className="text-xs text-gray-500">NISN: {student.nisn}</p>
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              student.jenis_kelamin === "Laki-laki"
                ? "bg-blue-100 text-blue-700"
                : "bg-pink-100 text-pink-700"
            }`}>
            {student.jenis_kelamin}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatusButton
          status="Hadir"
          active={attendance.status === "Hadir"}
          onClick={() => updateStatus(activeClass, originalIndex, "Hadir")}
          icon={Check}
          label="Hadir"
          disabled={saving}
        />
        <StatusButton
          status="Sakit"
          active={attendance.status === "Sakit"}
          onClick={() => updateStatus(activeClass, originalIndex, "Sakit")}
          icon={Hospital}
          label="Sakit"
          disabled={saving}
        />
        <StatusButton
          status="Izin"
          active={attendance.status === "Izin"}
          onClick={() => updateStatus(activeClass, originalIndex, "Izin")}
          icon={FileText}
          label="Izin"
          disabled={saving}
        />
        <StatusButton
          status="Alpa"
          active={attendance.status === "Alpa"}
          onClick={() => updateStatus(activeClass, originalIndex, "Alpa")}
          icon={FileX}
          label="Alpa"
          disabled={saving}
        />
      </div>

      <input
        type="text"
        placeholder="Keterangan..."
        value={attendance.note || ""}
        onChange={(e) => updateNote(activeClass, originalIndex, e.target.value)}
        disabled={saving}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
};

// Main AttendanceTable Component (includes both Table and Mobile Card views)
const AttendanceTable = ({
  filteredStudents,
  studentsData,
  activeClass,
  attendanceData,
  updateStatus,
  updateNote,
  saving,
  searchTerm,
  showCardView,
}) => {
  // MOBILE CARD VIEW
  if (showCardView) {
    return (
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Users size={48} className="text-gray-300" />
              <div>
                <p className="text-gray-500 font-medium text-sm">
                  {studentsData[activeClass]?.length === 0
                    ? "Tidak ada siswa di kelas ini"
                    : "Tidak ada siswa yang sesuai dengan pencarian"}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {searchTerm
                    ? `Tidak ditemukan siswa dengan kata kunci "${searchTerm}"`
                    : "Kelas ini belum memiliki siswa terdaftar"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredStudents.map((student, index) => {
            const originalIndex = studentsData[activeClass].indexOf(student);
            const attendance = attendanceData[activeClass]?.[originalIndex] || {
              status: "Hadir",
              note: "",
            };

            return (
              <StudentCard
                key={originalIndex}
                student={student}
                originalIndex={originalIndex}
                attendance={attendance}
                activeClass={activeClass}
                updateStatus={updateStatus}
                updateNote={updateNote}
                saving={saving}
              />
            );
          })
        )}
      </div>
    );
  }

  // DESKTOP TABLE VIEW
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider w-12 sm:w-14">
                No
              </th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider w-24 sm:w-28">
                NISN
              </th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                Nama Siswa
              </th>
              <th className="px-2 sm:px-3 py-3 sm-py:4 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell w-20">
                L/P
              </th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell w-64">
                Keterangan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Users size={48} className="text-gray-300" />
                    <div>
                      <p className="text-gray-500 font-medium text-sm sm:text-base">
                        {studentsData[activeClass]?.length === 0
                          ? "Tidak ada siswa di kelas ini"
                          : "Tidak ada siswa yang sesuai dengan pencarian"}
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">
                        {searchTerm
                          ? `Tidak ditemukan siswa dengan kata kunci "${searchTerm}"`
                          : "Kelas ini belum memiliki siswa terdaftar"}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => {
                const originalIndex =
                  studentsData[activeClass].indexOf(student);
                const attendance = attendanceData[activeClass]?.[
                  originalIndex
                ] || { status: "Hadir", note: "" };

                return (
                  <tr
                    key={originalIndex}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                      {student.nisn}
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                      <div>
                        <div className="line-clamp-2">{student.nama_siswa}</div>
                        <div className="lg:hidden mt-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              student.jenis_kelamin === "Laki-laki"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-pink-100 text-pink-700"
                            }`}>
                            {student.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-center hidden lg:table-cell">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          student.jenis_kelamin === "Laki-laki"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-pink-100 text-pink-700"
                        }`}>
                        {student.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4">
                      <div className="flex gap-1 flex-wrap">
                        <StatusButton
                          status="Hadir"
                          active={attendance.status === "Hadir"}
                          onClick={() =>
                            updateStatus(activeClass, originalIndex, "Hadir")
                          }
                          icon={Check}
                          label="Hadir"
                          disabled={saving}
                        />
                        <StatusButton
                          status="Sakit"
                          active={attendance.status === "Sakit"}
                          onClick={() =>
                            updateStatus(activeClass, originalIndex, "Sakit")
                          }
                          icon={Hospital}
                          label="Sakit"
                          disabled={saving}
                        />
                        <StatusButton
                          status="Izin"
                          active={attendance.status === "Izin"}
                          onClick={() =>
                            updateStatus(activeClass, originalIndex, "Izin")
                          }
                          icon={FileText}
                          label="Izin"
                          disabled={saving}
                        />
                        <StatusButton
                          status="Alpa"
                          active={attendance.status === "Alpa"}
                          onClick={() =>
                            updateStatus(activeClass, originalIndex, "Alpa")
                          }
                          icon={FileX}
                          label="Alpa"
                          disabled={saving}
                        />
                      </div>
                      <div className="xl:hidden mt-2">
                        <input
                          type="text"
                          placeholder="Keterangan..."
                          value={attendance.note || ""}
                          onChange={(e) =>
                            updateNote(
                              activeClass,
                              originalIndex,
                              e.target.value
                            )
                          }
                          disabled={saving}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        />
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 hidden xl:table-cell">
                      <input
                        type="text"
                        placeholder="Keterangan..."
                        value={attendance.note || ""}
                        onChange={(e) =>
                          updateNote(activeClass, originalIndex, e.target.value)
                        }
                        disabled={saving}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
