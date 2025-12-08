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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const navigationTimeoutRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Enhanced device detection
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

    checkDeviceType();
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

  // 🔥 COOL DARK MODE TOGGLE COMPONENT
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
            ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
            : "bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400"
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
                  className="absolute w-0.5 h-1 bg-yellow-200 rounded-full"
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
              className="text-indigo-600 animate-spin-slow"
              fill="currentColor"
            />
          ) : (
            <Sun
              size={currentSize.icon}
              className="text-orange-500 animate-pulse"
            />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center px-6 pt-6 pb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <LogOut
                  className="text-blue-600 dark:text-blue-400"
                  size={32}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 text-center">
                Keluar dari Sistem?
              </h3>
              <p className="text-gray-600 dark:text-slate-300 text-center mt-2">
                Anda harus login kembali untuk mengakses sistem
              </p>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleCancelLogout}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 active:bg-gray-300 dark:active:bg-slate-500 text-gray-700 dark:text-slate-200 font-semibold rounded-xl transition-colors duration-150">
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-colors duration-150 shadow-lg shadow-blue-500/30">
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
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm transition-colors duration-300">
          {/* Mobile Header */}
          {isMobile && (
            <div className="px-4 py-2.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={handleToggleMobileSidebar}
                    className="w-11 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors flex items-center justify-center touch-manipulation shadow-md"
                    aria-label="Menu">
                    <Menu size={20} strokeWidth={2} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">
                      {currentPageName}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* 🔥 COOL DARK MODE TOGGLE - MOBILE */}
                  <CoolDarkModeToggle size="small" />

                  <div className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 min-w-0">
                    <div className="text-center">
                      <div className="font-mono font-bold text-gray-900 dark:text-slate-100 text-sm leading-none">
                        {formatTime(currentTime)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400 font-medium mt-0.5">
                        {formatDate(currentTime)}
                      </div>
                    </div>
                  </div>

                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={handleToggleProfileDropdown}
                      className="w-11 h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg text-white transition-colors flex items-center justify-center touch-manipulation shadow-md"
                      aria-label="Profile">
                      <User size={18} strokeWidth={2} />
                    </button>

                    {showProfileDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                          <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">
                            {userData.full_name || userData.username}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 capitalize truncate">
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
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 active:bg-blue-100 dark:active:bg-slate-600 transition-colors touch-manipulation">
                            <Settings
                              size={18}
                              className="flex-shrink-0 text-gray-500 dark:text-slate-400"
                            />
                            <span className="font-medium">Profile</span>
                          </button>

                          <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>

                          <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors touch-manipulation">
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
                    className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center touch-manipulation"
                    aria-label="Menu">
                    <Menu size={20} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 truncate">
                      {currentPageName}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* 🔥 COOL DARK MODE TOGGLE - TABLET */}
                  <CoolDarkModeToggle size="default" />

                  <div className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <Clock
                            size={16}
                            className="text-blue-600 dark:text-blue-400"
                          />
                          <span className="font-mono font-semibold text-gray-900 dark:text-slate-100 text-base">
                            {formatTime(currentTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400 text-sm mt-1">
                          <Calendar
                            size={14}
                            className="text-blue-600 dark:text-blue-400"
                          />
                          <span>{formatDate(currentTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={handleToggleProfileDropdown}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-colors flex items-center gap-2 touch-manipulation">
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
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                          <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">
                            {userData.full_name || userData.username}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 capitalize">
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
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                            <Settings size={16} />
                            <span className="font-medium">Profile</span>
                          </button>
                          <hr className="my-1 border-gray-100 dark:border-slate-700" />
                          <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 truncate">
                    {currentPageName}
                    {isNavigating && (
                      <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-normal">
                        Loading...
                      </span>
                    )}
                  </h1>
                </div>

                <div className="flex items-center gap-6">
                  {/* 🔥 COOL DARK MODE TOGGLE - DESKTOP */}
                  <CoolDarkModeToggle size="large" />

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock
                          size={14}
                          className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                        />
                        <span className="font-mono font-semibold text-gray-900 dark:text-slate-100 text-base tracking-wide">
                          {formatTime(currentTime)}
                        </span>
                        <span className="bg-emerald-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                          WIB
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400 text-sm font-medium">
                        <Calendar
                          size={14}
                          className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                        />
                        <span>{formatDate(currentTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors duration-200 bg-blue-600 flex items-center justify-center">
                      <User size={16} className="mr-2" />
                      <span className="text-sm font-medium text-white">
                        Profile
                      </span>
                    </button>

                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-200 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                        <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">
                          {userData.full_name || userData.username}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-400 capitalize">
                          {userData.role === "guru_kelas" && userData.kelas
                            ? `Guru Kelas ${userData.kelas}`
                            : userData.role.replace("_", " ")}
                        </p>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => navigate("/settings")}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-400 transition-colors duration-150">
                          <Settings size={16} className="flex-shrink-0" />
                          <span className="font-medium">Profile</span>
                        </button>
                        <hr className="my-1 border-gray-100 dark:border-slate-700" />
                        <button
                          onClick={handleLogoutClick}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-colors duration-150">
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
          className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 transition-colors duration-300 ${
            isMobile ? "p-3" : isTablet ? "p-6" : "p-8"
          }`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
