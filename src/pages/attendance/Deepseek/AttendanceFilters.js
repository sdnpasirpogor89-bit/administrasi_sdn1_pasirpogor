// src/pages/attendance/AttendanceFilters.js
import React from "react";
import { Search, Calendar } from "lucide-react";

const AttendanceFilters = ({
  searchTerm,
  setSearchTerm,
  attendanceDate,
  setAttendanceDate,
  activeClass,
  setActiveClass,
  availableClasses,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Cari nama siswa atau NISN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-medium text-sm sm:text-base"
        />
      </div>

      {/* Date & Class Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center lg:justify-start">
        {/* Date Filter */}
        <div className="flex items-center gap-3 w-full lg:w-auto flex-shrink-0">
          <label className="font-semibold text-gray-700 whitespace-nowrap text-sm sm:text-base">
            Tanggal:
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full lg:w-72 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium bg-white text-sm sm:text-base"
          />
        </div>

        {/* Class Buttons */}
        <div className="flex flex-col lg:flex-row gap-2 w-full lg:flex-1">
          {/* Row 1 (Classes 1-3) */}
          <div className="flex gap-2 justify-center lg:justify-start w-full">
            {availableClasses.slice(0, 3).map((classNum) => (
              <button
                key={classNum}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 border-2 flex-1 text-center min-w-[80px] ${
                  activeClass === classNum
                    ? "bg-gradient-to-r from-blue-600 to-green-600 text-white border-transparent shadow-md"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:-translate-y-0.5"
                }`}
                onClick={() => setActiveClass(classNum)}>
                Kelas {classNum}
              </button>
            ))}
          </div>

          {/* Row 2 (Classes 4-6) - jika ada */}
          {availableClasses.length > 3 && (
            <div className="flex gap-2 justify-center lg:justify-start w-full">
              {availableClasses.slice(3, 6).map((classNum) => (
                <button
                  key={classNum}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 border-2 flex-1 text-center min-w-[80px] ${
                    activeClass === classNum
                      ? "bg-gradient-to-r from-blue-600 to-green-600 text-white border-transparent shadow-md"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:-translate-y-0.5"
                  }`}
                  onClick={() => setActiveClass(classNum)}>
                  Kelas {classNum}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceFilters;
