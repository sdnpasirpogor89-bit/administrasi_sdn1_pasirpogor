// pages/attendance/AttendanceStats.js

import React from "react";
import { Check, Hospital, FileText, FileX } from "lucide-react";

// Compact Stats Card Component (Komponen internal)
const StatsCard = React.memo(({ icon: Icon, number, label, color }) => {
  const getLeftBorderColor = () => {
    switch (color) {
      case "blue":
        return "border-l-blue-500";
      case "green":
        return "border-l-green-500";
      case "purple":
        return "border-l-purple-500";
      case "orange":
        return "border-l-orange-500";
      default:
        return "border-l-gray-500";
    }
  };

  const getIconColor = () => {
    switch (color) {
      case "blue":
        return "text-blue-500";
      case "green":
        return "text-green-500";
      case "purple":
        return "text-purple-500";
      case "orange":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-3 sm:p-4 border border-l-4 ${getLeftBorderColor()} border-gray-200 transition-all duration-200 hover:shadow-md hover:-translate-y-1 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl sm:text-2xl font-bold mb-1 text-gray-900">
            {number}
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-600">
            {label}
          </div>
        </div>
        <div className={`${getIconColor()}`}>
          <Icon size={20} className="sm:hidden" />
          <Icon size={24} className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
});

// AttendanceStats Wrapper Component
// Mengambil objek 'summary' (Hadir, Sakit, Izin, Alpa) sebagai props
export const AttendanceStats = React.memo(({ summary }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatsCard
        icon={Check}
        number={summary.Hadir}
        label="Total Hadir"
        color="green"
      />
      <StatsCard
        icon={Hospital}
        number={summary.Sakit}
        label="Total Sakit"
        color="orange"
      />
      <StatsCard
        icon={FileText}
        number={summary.Izin}
        label="Total Izin"
        color="blue"
      />
      <StatsCard
        icon={FileX}
        number={summary.Alpa}
        label="Total Alpa"
        color="purple"
      />
    </div>
  );
});
