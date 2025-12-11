import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Settings,
  Users,
  Menu,
  User,
  ChevronDown,
  LogOut,
  X,
  Moon,
  Sun,
} from "lucide-react";
import Sidebar from "./Sidebar";

const Layout = ({
  children,
  userData,
  onLogout,
  darkMode,
  onToggleDarkMode,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNavigating, setIsNavigating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ✅ FIX: Initialize dengan nilai yang benar dari awal
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      return width >= 768 && width < 1024;
    }
    return false;
  });

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const navigationTimeoutRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // ✅ FIX: Enhanced device detection - sekarang cuma untuk resize
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;

      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile || tablet) {
        setSidebarCollapsed(false);
        setShowProfileDropdown(false);
      }
    };

    // Nggak perlu checkDeviceType() di sini karena udah di-initialize di useState
    window.addEventListener("resize", checkDeviceType);
    return () => window.removeEventListener("resize", checkDeviceType);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Close mobile sidebar and dropdown when route changes
  useEffect(() => {
    setShowMobileSidebar(false);
    setShowProfileDropdown(false);
  }, [location.pathname]);

  // Optimized clock update
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    const interval = isMobile ? 5000 : 1000;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(updateTime, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Reset navigation state when location changes
  useEffect(() => {
    setIsNavigating(false);
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, [location.pathname]);

  // Mobile-optimized date formatting
  const formatDate = (date) => {
    if (isMobile) {
      const day = date.toLocaleDateString("id-ID", { weekday: "short" });
      const dateStr = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      return `${day}, ${dateStr}/${month}`;
    } else if (isTablet) {
      return date.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } else {
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // Mobile-optimized time formatting
  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: isMobile ? undefined : "2-digit",
    });
  };

  // Get current page name from location
  const getCurrentPageName = () => {
    const pathMap = {
      "/dashboard": "Dashboard",
      "/students": "Data Siswa",
      "/classes": "Data Kelas",
      "/teachers": "Data Guru",
      "/attendance": "Presensi Siswa",
      "/teacher-attendance": "Presensi Guru",
      "/grades": "Nilai Siswa",
      "/catatan-siswa": "Catatan Siswa",
      "/schedule": "Jadwal Pelajaran",
      "/spmb": "SPMB",
      "/reports": "Laporan",
      "/settings": "Pengaturan",
      "/monitor-sistem": "Monitor Sistem",
    };
    return pathMap[location.pathname] || "Dashboard";
  };

  // Mobile-optimized page names
  const getMobilePageName = () => {
    const mobileNames = {
      "/dashboard": "Dashboard",
      "/students": "Siswa",
      "/classes": "Kelas",
      "/teachers": "Guru",
      "/attendance": "Presensi",
      "/teacher-attendance": "Presensi Guru",
      "/grades": "Nilai",
      "/catatan-siswa": "Catatan",
      "/schedule": "Jadwal",
      "/spmb": "SPMB",
      "/reports": "Laporan",
      "/settings": "Setting",
      "/monitor-sistem": "Monitor",
    };
    return mobileNames[location.pathname] || "Dashboard";
  };

  const currentPageName = isMobile ? getMobilePageName() : getCurrentPageName();

  // Simplified navigation
  const handleMenuClick = useCallback(
    (menuName) => {
      if (isNavigating) return;

      const pathMap = {
        Dashboard: "/dashboard",
        "Data Siswa": "/students",
        Siswa: "/students",
        "Data Kelas": "/classes",
        Kelas: "/classes",
        "Data Guru": "/teachers",
        Guru: "/teachers",
        "Presensi Siswa": "/attendance",
        "Presensi Guru": "/teacher-attendance",
        Presensi: "/attendance",
        "Nilai Siswa": "/grades",
        Nilai: "/grades",
        "Catatan Siswa": "/catatan-siswa",
        Catatan: "/catatan-siswa",
        "Jadwal Pelajaran": "/schedule",
        Jadwal: "/schedule",
        SPMB: "/spmb",
        Laporan: "/reports",
        Pengaturan: "/settings",
        Setting: "/settings",
        "Monitor Sistem": "/monitor-sistem",
        Monitor: "/monitor-sistem",
      };

      const path = pathMap[menuName];
      if (!path || location.pathname === path) return;

      setIsNavigating(true);

      try {
        navigate(path);
        // Using a short timeout to simulate a loading state or ensure navigation completes
        // This is generally not needed if navigation is synchronous, but kept for logic fidelity
        setTimeout(() => setIsNavigating(false), 100);
      } catch (error) {
        console.error("Navigation error:", error);
        setIsNavigating(false);
      }
    },
    [isNavigating, location.pathname, navigate]
  );

  // Toggle functions
  const handleToggleCollapse = () => {
    if (!isMobile && !isTablet) {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleToggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  const handleToggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Logout handlers
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShowProfileDropdown(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Get responsive sidebar margin
  const getSidebarMargin = () => {
    if (isMobile || isTablet) return "ml-0";
    return sidebarCollapsed ? "ml-20" : "ml-72";
  };

  // 櫨 COOL DARK MODE TOGGLE COMPONENT - Updated with red theme only for light mode
  const CoolDarkModeToggle = ({ size = "default" }) => {
    const sizes = {
      small: { container: "w-14 h-7", circle: "w-5 h-5", icon: 12 },
      default: { container: "w-16 h-8", circle: "w-6 h-6", icon: 14 },
      large: { container: "w-20 h-10", circle: "w-8 h-8", icon: 18 },
    };

    const currentSize = sizes[size];

    return (
      <button
        onClick={onToggleDarkMode}
        className={`relative ${
          currentSize.container
        } rounded-full transition-all duration-500 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
          darkMode
            ? "bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900" // Dark mode tetap slate
            : "bg-gradient-to-r from-red-500 via-red-400 to-red-300" // Light mode jadi merah
        }`}
        aria-label="Toggle Dark Mode"
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
        {/* Animated Background Stars (Dark Mode) */}
        {darkMode && (
          <>
            <span className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-pulse"></span>
            <span className="absolute top-2 right-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-100"></span>
            <span className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-200"></span>
          </>
        )}

        {/* Animated Sun Rays (Light Mode) */}
        {!darkMode && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-full h-full animate-spin-slow">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-1 bg-red-200 rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${i * 45}deg) translateY(-${
                      currentSize.container.includes("20")
                        ? "12"
                        : currentSize.container.includes("16")
                        ? "10"
                        : "8"
                    }px)`,
                    transformOrigin: "0 0",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Toggle Circle with Icon */}
        <div
          className={`absolute top-1 ${
            currentSize.circle
          } bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-500 ease-in-out transform ${
            darkMode ? `translate-x-[calc(100%-0.25rem)]` : "translate-x-0"
          }`}>
          {darkMode ? (
            <Moon
              size={currentSize.icon}
              className="text-slate-700 animate-spin-slow"
              fill="currentColor"
            />
          ) : (
            <Sun
              size={currentSize.icon}
              className="text-red-500 animate-pulse"
            />
          )}
        </div>
      </button>
    );
  };

  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-slate-900" // Dark mode: tetap slate
          : "bg-red-50" // Light mode: merah
      }`}>
      {/* Add custom animations */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 ${
              darkMode ? "bg-slate-800" : "bg-white"
            }`}>
            <div className="flex flex-col items-center px-6 pt-6 pb-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  darkMode ? "bg-blue-900/30" : "bg-blue-100"
                }`}>
                <LogOut
                  className={darkMode ? "text-blue-400" : "text-blue-600"}
                  size={32}
                />
              </div>
              <h3
                className={`text-xl font-bold text-center ${
                  darkMode ? "text-slate-100" : "text-gray-900"
                }`}>
                Keluar dari Sistem?
              </h3>
              <p
                className={`text-center mt-2 ${
                  darkMode ? "text-slate-300" : "text-gray-600"
                }`}>
                Anda harus login kembali untuk mengakses sistem
              </p>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleCancelLogout}
                className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-colors duration-150 ${
                  darkMode
                    ? "bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-200"
                    : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700"
                }`}>
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-colors duration-150 ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-500/30"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-500/30"
                }`}>
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && !isTablet && (
        <Sidebar
          userData={userData}
          currentPage={getCurrentPageName()}
          onMenuClick={handleMenuClick}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          mobile={false}
        />
      )}

      {/* Mobile/Tablet Sidebar */}
      {(isMobile || isTablet) && showMobileSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-all duration-300"
            onClick={() => setShowMobileSidebar(false)}
          />

          <Sidebar
            userData={userData}
            currentPage={getCurrentPageName()}
            onMenuClick={handleMenuClick}
            mobile={true}
            onClose={() => setShowMobileSidebar(false)}
          />
        </>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${getSidebarMargin()}`}>
        {/* Header */}
        <header
          className={`border-b sticky top-0 z-30 shadow-sm transition-colors duration-300 ${
            darkMode
              ? "bg-slate-800 border-slate-700" // Dark mode
              : "bg-white border-red-200" // Light mode: border merah
          }`}>
          {/* Mobile Header */}
          {isMobile && (
            <div className="px-4 py-2.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={handleToggleMobileSidebar}
                    className={`w-11 h-11 rounded-lg text-white transition-colors flex items-center justify-center touch-manipulation shadow-md ${
                      darkMode
                        ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800" // Dark mode: blue
                        : "bg-red-600 hover:bg-red-700 active:bg-red-800" // Light mode: red
                    }`}
                    aria-label="Menu">
                    <Menu size={20} strokeWidth={2} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <h1
                      className={`text-lg font-bold truncate ${
                        darkMode ? "text-slate-100" : "text-gray-900"
                      }`}>
                      {currentPageName}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* 櫨 COOL DARK MODE TOGGLE - MOBILE */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <CoolDarkModeToggle size="small" />
                  </div>

                  <div
                    className={`border rounded-lg px-2.5 py-1.5 min-w-0 ${
                      darkMode
                        ? "bg-slate-700 border-slate-600"
                        : "bg-red-50 border-red-200" // Light mode: merah
                    }`}>
                    <div className="text-center">
                      <div
                        className={`font-mono font-bold text-sm leading-none ${
                          darkMode ? "text-slate-100" : "text-gray-900"
                        }`}>
                        {formatTime(currentTime)}
                      </div>
                      <div
                        className={`text-xs font-medium mt-0.5 ${
                          darkMode ? "text-slate-400" : "text-gray-600"
                        }`}>
                        {formatDate(currentTime)}
                      </div>
                    </div>
                  </div>

                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={handleToggleProfileDropdown}
                      className={`w-11 h-11 rounded-lg text-white transition-colors flex items-center justify-center touch-manipulation shadow-md ${
                        darkMode
                          ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                          : "bg-red-600 hover:bg-red-700 active:bg-red-800" // Light mode: red
                      }`}
                      aria-label="Profile">
                      <User size={18} strokeWidth={2} />
                    </button>

                    {showProfileDropdown && (
                      <div
                        className={`absolute right-0 top-full mt-2 w-64 border rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2 duration-200 ${
                          darkMode
                            ? "bg-slate-800 border-slate-700"
                            : "bg-white border-red-200" // Light mode
                        }`}>
                        <div
                          className={`px-4 py-3 border-b ${
                            darkMode ? "border-slate-700" : "border-red-100"
                          }`}>
                          <p
                            className={`font-semibold text-sm truncate ${
                              darkMode ? "text-slate-100" : "text-gray-900"
                            }`}>
                            {userData.full_name || userData.username}
                          </p>
                          <p
                            className={`text-xs capitalize truncate ${
                              darkMode ? "text-blue-400" : "text-red-600" // Light mode: red
                            }`}>
                            {userData.role === "guru_kelas" && userData.kelas
                              ? `Guru Kelas ${userData.kelas}`
                              : userData.role.replace("_", " ")}
                          </p>
                        </div>

                        <div className="py-2">
                          <button
                            onClick={() => {
                              navigate("/settings");
                              setShowProfileDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors touch-manipulation ${
                              darkMode
                                ? "text-slate-300 hover:bg-slate-700 active:bg-slate-600"
                                : "text-gray-700 hover:bg-red-50 active:bg-red-100" // Light mode: red
                            }`}>
                            <Settings
                              size={18}
                              className={`flex-shrink-0 ${
                                darkMode ? "text-slate-400" : "text-gray-500"
                              }`}
                            />
                            <span className="font-medium">Profile</span>
                          </button>

                          <div
                            className={`border-t my-1 ${
                              darkMode ? "border-slate-700" : "border-red-100"
                            }`}></div>

                          <button
                            onClick={handleLogoutClick}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors touch-manipulation ${
                              darkMode
                                ? "text-red-400 hover:bg-red-900/20 active:bg-red-900/30"
                                : "text-red-600 hover:bg-red-50 active:bg-red-100" // Light mode: red
                            }`}>
                            <LogOut size={18} className="flex-shrink-0" />
                            <span className="font-medium">Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tablet Header */}
          {isTablet && (
            <div className="px-6 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <button
                    onClick={handleToggleMobileSidebar}
                    className={`w-10 h-10 rounded-lg text-white transition-colors flex items-center justify-center touch-manipulation ${
                      darkMode
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-red-600 hover:bg-red-700" // Light mode: red
                    }`}
                    aria-label="Menu">
                    <Menu size={20} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <h1
                      className={`text-xl font-bold truncate ${
                        darkMode ? "text-slate-100" : "text-gray-900"
                      }`}>
                      {currentPageName}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* 櫨 COOL DARK MODE TOGGLE - TABLET */}
                  <CoolDarkModeToggle size="default" />

                  <div
                    className={`border rounded-xl px-4 py-2.5 ${
                      darkMode
                        ? "bg-slate-700 border-slate-600"
                        : "bg-red-50 border-red-200" // Light mode: red
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <Clock
                            size={16}
                            className={
                              darkMode ? "text-blue-400" : "text-red-600"
                            } // Light mode: red
                          />
                          <span
                            className={`font-mono font-semibold text-base ${
                              darkMode ? "text-slate-100" : "text-gray-900"
                            }`}>
                            {formatTime(currentTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <Calendar
                            size={14}
                            className={
                              darkMode ? "text-blue-400" : "text-red-600"
                            } // Light mode: red
                          />
                          <span
                            className={
                              darkMode ? "text-slate-400" : "text-gray-600"
                            }>
                            {formatDate(currentTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={handleToggleProfileDropdown}
                      className={`px-4 py-2.5 rounded-xl text-white transition-colors flex items-center gap-2 touch-manipulation ${
                        darkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-red-600 hover:bg-red-700" // Light mode: red
                      }`}>
                      <User size={16} />
                      <span className="text-sm font-medium">Profile</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          showProfileDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showProfileDropdown && (
                      <div
                        className={`absolute right-0 top-full mt-2 w-64 border rounded-xl shadow-xl z-50 ${
                          darkMode
                            ? "bg-slate-800 border-slate-700"
                            : "bg-white border-red-200" // Light mode
                        }`}>
                        <div
                          className={`px-4 py-3 border-b ${
                            darkMode ? "border-slate-700" : "border-red-100"
                          }`}>
                          <p
                            className={`font-semibold text-sm truncate ${
                              darkMode ? "text-slate-100" : "text-gray-900"
                            }`}>
                            {userData.full_name || userData.username}
                          </p>
                          <p
                            className={`text-xs capitalize ${
                              darkMode ? "text-blue-400" : "text-red-600" // Light mode: red
                            }`}>
                            {userData.role === "guru_kelas" && userData.kelas
                              ? `Guru Kelas ${userData.kelas}`
                              : userData.role.replace("_", " ")}
                          </p>
                        </div>

                        <div className="py-2">
                          <button
                            onClick={() => {
                              navigate("/settings");
                              setShowProfileDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                              darkMode
                                ? "text-slate-300 hover:bg-slate-700"
                                : "text-gray-700 hover:bg-red-50" // Light mode: red
                            }`}>
                            <Settings size={16} />
                            <span className="font-medium">Profile</span>
                          </button>
                          <hr
                            className={`my-1 ${
                              darkMode ? "border-slate-700" : "border-red-100"
                            }`}
                          />
                          <button
                            onClick={handleLogoutClick}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                              darkMode
                                ? "text-red-400 hover:bg-red-900/20"
                                : "text-red-600 hover:bg-red-50" // Light mode: red
                            }`}>
                            <LogOut size={16} />
                            <span className="font-medium">Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Header */}
          {!isMobile && !isTablet && (
            <div className="px-8 py-5">
              <div className="flex justify-between items-center">
                <div className="flex flex-col min-w-0 flex-1">
                  <h1
                    className={`text-2xl font-bold truncate ${
                      darkMode ? "text-slate-100" : "text-gray-900"
                    }`}>
                    {currentPageName}
                    {isNavigating && (
                      <span
                        className={`ml-2 text-sm font-normal ${
                          darkMode ? "text-blue-400" : "text-red-600" // Light mode: red
                        }`}>
                        Loading...
                      </span>
                    )}
                  </h1>
                </div>

                <div className="flex items-center gap-6">
                  {/* 櫨 COOL DARK MODE TOGGLE - DESKTOP */}
                  <CoolDarkModeToggle size="large" />

                  <div
                    className={`border rounded-xl px-4 py-3 shadow-sm ${
                      darkMode
                        ? "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600"
                        : "bg-gradient-to-br from-red-50 to-red-100 border-red-300" // Light mode: red
                    }`}>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock
                          size={14}
                          className={`flex-shrink-0 ${
                            darkMode ? "text-blue-400" : "text-red-600" // Light mode: red
                          }`}
                        />
                        <span
                          className={`font-mono font-semibold text-base tracking-wide ${
                            darkMode ? "text-slate-100" : "text-gray-900"
                          }`}>
                          {formatTime(currentTime)}
                        </span>
                        <span
                          className={`text-white text-xs font-semibold px-1.5 py-0.5 rounded ${
                            darkMode ? "bg-blue-500" : "bg-red-500" // Light mode: red
                          }`}>
                          WIB
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar
                          size={14}
                          className={`flex-shrink-0 ${
                            darkMode ? "text-blue-400" : "text-red-600" // Light mode: red
                          }`}
                        />
                        <span
                          className={
                            darkMode ? "text-slate-400" : "text-gray-600"
                          }>
                          {formatDate(currentTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      className={`px-4 py-2 rounded-xl transition-colors duration-200 flex items-center justify-center ${
                        darkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-red-600 hover:bg-red-700" // Light mode: red
                      }`}>
                      <User size={16} className="mr-2" />
                      <span className="text-sm font-medium text-white">
                        Profile
                      </span>
                    </button>

                    <div
                      className={`absolute right-0 top-full mt-2 w-64 border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-200 z-50 ${
                        darkMode
                          ? "bg-slate-800 border-slate-700"
                          : "bg-white border-red-200" // Light mode
                      }`}>
                      <div
                        className={`px-4 py-3 border-b ${
                          darkMode ? "border-slate-700" : "border-red-100"
                        }`}>
                        <p
                          className={`font-semibold text-sm truncate ${
                            darkMode ? "text-slate-100" : "text-gray-900"
                          }`}>
                          {userData.full_name || userData.username}
                        </p>
                        <p
                          className={`text-xs capitalize ${
                            darkMode ? "text-slate-400" : "text-gray-600" // Light mode tetap gray untuk text kecil
                          }`}>
                          {userData.role === "guru_kelas" && userData.kelas
                            ? `Guru Kelas ${userData.kelas}`
                            : userData.role.replace("_", " ")}
                        </p>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => navigate("/settings")}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                            darkMode
                              ? "text-slate-300 hover:bg-slate-700 hover:text-blue-400"
                              : "text-gray-700 hover:bg-red-50 hover:text-red-700" // Light mode: red
                          }`}>
                          <Settings size={16} className="flex-shrink-0" />
                          <span className="font-medium">Profile</span>
                        </button>
                        <hr
                          className={`my-1 ${
                            darkMode ? "border-slate-700" : "border-red-100"
                          }`}
                        />
                        <button
                          onClick={handleLogoutClick}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                            darkMode
                              ? "text-slate-300 hover:bg-red-900/20 hover:text-red-400"
                              : "text-gray-700 hover:bg-red-50 hover:text-red-700" // Light mode: red
                          }`}>
                          <LogOut size={16} className="flex-shrink-0" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main
          className={`flex-1 overflow-y-auto transition-colors duration-300 ${
            isMobile ? "p-3" : isTablet ? "p-6" : "p-8"
          } ${
            darkMode ? "bg-slate-900" : "bg-red-50" // Light mode: merah
          }`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
