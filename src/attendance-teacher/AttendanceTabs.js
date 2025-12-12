// src/attendance-teacher/AttendanceTabs.js - REVISI DARK MODE + RESPONSIVE + MERAH-PUTIH
import React, { useState } from "react";
import { QrCode, Edit3, Sparkles, Smartphone } from "lucide-react";
import QRScanner from "./QRScanner";
import ManualCheckIn from "./ManualCheckIn";
import QRCodeGenerator from "./QRCodeGenerator";

const AttendanceTabs = ({ currentUser, onSuccess, isMobile, darkMode }) => {
  const [activeTab, setActiveTab] = useState("qr");

  // Conditional tabs based on role
  const isAdmin = currentUser?.role === "admin";

  // Responsive container class
  const containerClass = `rounded-lg sm:rounded-xl shadow-sm border ${
    isMobile ? "rounded-lg" : "sm:rounded-xl"
  } bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700`;

  // Tab button class generator
  const getTabButtonClass = (tabName) => {
    const isActive = activeTab === tabName;
    const baseClass = `
      flex-1 py-3 sm:py-3.5 font-semibold transition-all 
      flex items-center justify-center gap-1.5 sm:gap-2
      whitespace-nowrap touch-manipulation min-h-[44px]
      ${isMobile ? "px-3 text-xs" : "px-4 text-sm sm:text-base"}
    `;

    if (isActive) {
      return `
        ${baseClass}
        text-red-600 border-b-2 border-red-600 bg-red-50
        dark:text-red-400 dark:border-red-400 dark:bg-red-900/30
      `;
    } else {
      return `
        ${baseClass}
        text-gray-500 hover:text-gray-700 hover:bg-gray-50
        dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700
      `;
    }
  };

  // Content container padding
  const contentPadding = isMobile ? "p-3 sm:p-4" : "p-4 sm:p-6";

  return (
    <div className={containerClass}>
      {/* Mobile Indicator */}
      {isMobile && (
        <div className="flex items-center justify-center py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
            <Smartphone
              size={14}
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
        border-gray-200 dark:border-gray-700
        ${isMobile ? "p-1 sm:p-2" : "p-2"}
      `}>
        {/* TAB 1: SCAN QR */}
        <button
          onClick={() => setActiveTab("qr")}
          className={getTabButtonClass("qr")}
          aria-label="Scan QR Code"
          role="tab"
          aria-selected={activeTab === "qr"}>
          <QrCode size={isMobile ? 16 : 18} className="flex-shrink-0" />
          <span className="whitespace-nowrap">Scan QR</span>
        </button>

        {/* TAB 2: INPUT MANUAL */}
        <button
          onClick={() => setActiveTab("manual")}
          className={getTabButtonClass("manual")}
          aria-label="Input Manual"
          role="tab"
          aria-selected={activeTab === "manual"}>
          <Edit3 size={isMobile ? 16 : 18} className="flex-shrink-0" />
          <span className="whitespace-nowrap">Input Manual</span>
        </button>

        {/* TAB 3: GENERATE QR (ADMIN ONLY) */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab("generate")}
            className={getTabButtonClass("generate")}
            aria-label="Generate QR Code"
            role="tab"
            aria-selected={activeTab === "generate"}>
            <Sparkles size={isMobile ? 16 : 18} className="flex-shrink-0" />
            <span className="whitespace-nowrap">Generate QR</span>
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
            darkMode={darkMode}
          />
        )}
        {activeTab === "manual" && (
          <ManualCheckIn
            currentUser={currentUser}
            onSuccess={onSuccess}
            isMobile={isMobile}
            darkMode={darkMode}
          />
        )}
        {activeTab === "generate" && (
          <QRCodeGenerator isMobile={isMobile} darkMode={darkMode} />
        )}
      </div>
    </div>
  );
};

export default AttendanceTabs;
