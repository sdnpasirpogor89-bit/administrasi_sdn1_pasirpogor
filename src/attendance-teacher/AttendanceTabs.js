// src/attendance-teacher/AttendanceTabs.js - REVISI DARK MODE + RESPONSIVE
import React, { useState } from "react";
import { QrCode, Edit3, Sparkles, Smartphone } from "lucide-react";
import QRScanner from "./QRScanner";
import ManualCheckIn from "./ManualCheckIn";
import QRCodeGenerator from "./QRCodeGenerator";

const AttendanceTabs = ({ currentUser, onSuccess, isMobile, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState("qr");

  // Conditional tabs based on role
  const isAdmin = currentUser?.role === "admin";

  // Responsive container class
  const containerClass = `rounded-xl shadow-sm border ${
    isMobile ? "rounded-lg" : "rounded-xl"
  } ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;

  // Tab button class generator
  const getTabButtonClass = (tabName) => {
    const isActive = activeTab === tabName;
    const baseClass = `
      flex-1 py-3 font-semibold transition-all 
      flex items-center justify-center gap-1.5 sm:gap-2
      whitespace-nowrap touch-manipulation
      ${isMobile ? "px-3 text-xs" : "px-4 text-sm"}
    `;

    if (isActive) {
      return `
        ${baseClass}
        ${
          isDarkMode
            ? "text-blue-400 border-b-2 border-blue-400 bg-blue-900/30"
            : "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
        }
      `;
    } else {
      return `
        ${baseClass}
        ${
          isDarkMode
            ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        }
      `;
    }
  };

  // Content container padding
  const contentPadding = isMobile ? "p-3" : "p-4 sm:p-6";

  return (
    <div className={containerClass}>
      {/* Mobile Indicator */}
      {isMobile && (
        <div className="flex items-center justify-center py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            <Smartphone
              size={12}
              className="text-gray-500 dark:text-gray-400"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Mode Mobile
            </span>
          </div>
        </div>
      )}

      {/* Tab Header - Mobile Responsive */}
      <div
        className={`
        flex gap-1 sm:gap-2 border-b overflow-x-auto scrollbar-hide
        ${isDarkMode ? "border-gray-700" : "border-gray-200"}
        ${isMobile ? "p-1" : "p-2"}
      `}>
        {/* TAB 1: SCAN QR */}
        <button
          onClick={() => setActiveTab("qr")}
          className={getTabButtonClass("qr")}
          aria-label="Scan QR Code">
          <QrCode size={isMobile ? 14 : 16} className="flex-shrink-0" />
          <span>Scan QR</span>
        </button>

        {/* TAB 2: INPUT MANUAL */}
        <button
          onClick={() => setActiveTab("manual")}
          className={getTabButtonClass("manual")}
          aria-label="Input Manual">
          <Edit3 size={isMobile ? 14 : 16} className="flex-shrink-0" />
          <span>Input Manual</span>
        </button>

        {/* TAB 3: GENERATE QR (ADMIN ONLY) */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab("generate")}
            className={getTabButtonClass("generate")}
            aria-label="Generate QR Code">
            <Sparkles size={isMobile ? 14 : 16} className="flex-shrink-0" />
            <span>Generate QR</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className={contentPadding}>
        {activeTab === "qr" && (
          <QRScanner
            currentUser={currentUser}
            onSuccess={onSuccess}
            isMobile={isMobile}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === "manual" && (
          <ManualCheckIn
            currentUser={currentUser}
            onSuccess={onSuccess}
            isMobile={isMobile}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === "generate" && (
          <QRCodeGenerator isMobile={isMobile} isDarkMode={isDarkMode} />
        )}
      </div>
    </div>
  );
};

export default AttendanceTabs;
