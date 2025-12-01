// pages/attendance/AttendanceFilters.js

import React from "react";
import { Search, Calendar, Save, Users, RefreshCw } from "lucide-react";

// Komponen Filter (Search, DatePicker, Class Buttons)
export const AttendanceFilters = React.memo(
  ({
    searchTerm,
    setSearchTerm,
    selectedDate,
    setSelectedDate,
    availableClasses,
    activeClass,
    setActiveClass,
    handleSave,
    isSaving,
    handleRefresh,
    isRefreshing,
  }) => {
    // Helper function untuk format tanggal ke YYYY-MM-DD
    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      let month = (d.getMonth() + 1).toString().padStart(2, "0");
      let day = d.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg space-y-4">
        {/* ROW 1: Search & Date Picker */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari Siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition duration-150"
            />
          </div>

          {/* Date Picker */}
          <div className="relative w-full sm:w-auto">
            <Calendar
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="date"
              value={formatDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full sm:w-56 pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base appearance-none transition duration-150"
            />
          </div>
        </div>

        {/* ROW 2: Class Buttons & Action Buttons (Save/Refresh) */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Class Buttons */}
          <div className="flex-1 overflow-x-auto whitespace-nowrap pb-1">
            <div className="inline-flex space-x-2">
              <span className="text-sm font-medium text-gray-600 self-center hidden sm:inline-flex items-center gap-1 pr-2">
                <Users size={16} /> Kelas:
              </span>
              {availableClasses.map((classItem) => (
                <button
                  key={classItem}
                  onClick={() => setActiveClass(classItem)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    activeClass === classItem
                      ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}>
                  {classItem}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons (Refresh & Save) */}
          <div className="flex flex-row gap-3 w-full md:w-auto">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isSaving}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 text-sm font-medium bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:bg-gray-400 transition-colors shadow-md">
              {isRefreshing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Mengambil...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Refresh
                </>
              )}
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || isRefreshing}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-md">
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Presensi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
