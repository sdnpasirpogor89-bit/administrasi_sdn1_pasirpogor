import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, Settings, Users, Menu, User, ChevronDown } from "lucide-react";
import Sidebar from "./Sidebar";

const Layout = ({ children, userData, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNavigating, setIsNavigating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const navigationTimeoutRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Enhanced device detection
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const mobile = width < 768; // Better mobile breakpoint
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      if (mobile || tablet) {
        setSidebarCollapsed(false);
        setShowProfileDropdown(false); // Close dropdown on resize
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Close mobile sidebar and dropdown when route changes
  useEffect(() => {
    setShowMobileSidebar(false);
    setShowProfileDropdown(false);
  }, [location.pathname]);

  // Optimized clock update - less frequent on mobile for better performance
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    const interval = isMobile ? 5000 : 1000; // 5s on mobile, 1s on desktop

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
    setIsNavigating(false); // Always reset navigation state
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, [location.pathname]);

  // Mobile-optimized date formatting
  const formatDate = (date) => {
    if (isMobile) {
      // Ultra compact for mobile: "Sen, 28/09"
      const day = date.toLocaleDateString("id-ID", { weekday: "short" });
      const dateStr = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}, ${dateStr}/${month}`;
    } else if (isTablet) {
      return date.toLocaleDateString("id-ID", { 
        weekday: "short", 
        day: "numeric", 
        month: "short" 
      });
    } else {
      return date.toLocaleDateString("id-ID", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
    }
  };

  // Mobile-optimized time formatting
  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", { 
      hour: '2-digit', 
      minute: '2-digit',
      second: isMobile ? undefined : '2-digit' // No seconds on mobile
    });
  };

  // Get current page name from location
  const getCurrentPageName = () => {
    const pathMap = {
      "/dashboard": "Dashboard",
      "/students": "Data Siswa",
      "/teachers": "Data Guru",
      "/attendance": "Kehadiran",
      "/grades": "Nilai Akademik",
      "/spmb": "SPMB",
      "/reports": "Laporan",
      "/settings": "Pengaturan",
    };
    return pathMap[location.pathname] || "Dashboard";
  };

  // Mobile-optimized page names
  const getMobilePageName = () => {
    const mobileNames = {
      "/dashboard": "Dashboard",
      "/students": "Siswa",
      "/teachers": "Guru", 
      "/attendance": "Presensi", // Shorter for mobile
      "/grades": "Nilai",
      "/spmb": "SPMB",
      "/reports": "Laporan",
      "/settings": "Setting",
    };
    return mobileNames[location.pathname] || "Dashboard";
  };

  const currentPageName = isMobile ? getMobilePageName() : getCurrentPageName();

  // Simplified navigation - no loading states for better UX
  const handleMenuClick = useCallback(
    (menuName) => {
      if (isNavigating) return; // Prevent double clicks

      const pathMap = {
        Dashboard: "/dashboard",
        "Data Siswa": "/students",
        Siswa: "/students", // Mobile version
        "Data Guru": "/teachers",
        Guru: "/teachers", // Mobile version
        Kehadiran: "/attendance",
        Presensi: "/attendance", // Mobile version
        "Nilai Akademik": "/grades",
        Nilai: "/grades", // Mobile version
        SPMB: "/spmb",
        Laporan: "/reports",
        Pengaturan: "/settings",
        Setting: "/settings", // Mobile version
      };

      const path = pathMap[menuName];
      if (!path || location.pathname === path) return;

      // Brief loading state for feedback, but don't block UI
      setIsNavigating(true);
      
      try {
        navigate(path);
        // Quick reset - don't wait for timeout
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

  // Get responsive sidebar margin
  const getSidebarMargin = () => {
    if (isMobile || isTablet) return "ml-0";
    return sidebarCollapsed ? "ml-20" : "ml-72";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
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
          {/* Enhanced Overlay */}
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
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${getSidebarMargin()}`}>
        
        {/* Ultra Mobile-Optimized Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          {/* Mobile Header - Compact */}
          {isMobile && (
            <div className="px-4 py-2.5">
              <div className="flex justify-between items-center">
                {/* Left: Menu + Page Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Large Touch-Friendly Menu Button */}
                  <button
                    onClick={handleToggleMobileSidebar}
                    className="w-11 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors flex items-center justify-center touch-manipulation shadow-md"
                    aria-label="Menu"
                  >
                    <Menu size={20} strokeWidth={2} />
                  </button>
                  
                  {/* Compact Page Title */}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-gray-900 truncate">
                      {currentPageName}
                    </h1>
                  </div>
                </div>

                {/* Right: Compact Clock + Profile */}
                <div className="flex items-center gap-2">
                  {/* Ultra Compact Clock */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 min-w-0">
                    <div className="text-center">
                      <div className="font-mono font-bold text-gray-900 text-sm leading-none">
                        {formatTime(currentTime)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium mt-0.5">
                        {formatDate(currentTime)}
                      </div>
                    </div>
                  </div>

                  {/* Large Touch-Friendly Profile Button */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button 
                      onClick={handleToggleProfileDropdown}
                      className="w-11 h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg text-white transition-colors flex items-center justify-center touch-manipulation shadow-md"
                      aria-label="Profile"
                    >
                      <User size={18} strokeWidth={2} />
                    </button>
                    
                    {/* Mobile-Optimized Dropdown */}
                    {showProfileDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {userData.full_name || userData.username}
                          </p>
                          <p className="text-xs text-blue-600 capitalize truncate">
                            {userData.role === 'guru_kelas' && userData.kelas ? 
                              `Guru Kelas ${userData.kelas}` : 
                              userData.role.replace("_", " ")
                            }
                          </p>
                        </div>
                        
                        {/* Menu Items - Large Touch Targets */}
                        <div className="py-2">
                          <button
                            onClick={() => {
                              handleMenuClick("Setting");
                              setShowProfileDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-blue-50 active:bg-blue-100 transition-colors touch-manipulation"
                          >
                            <Settings size={18} className="flex-shrink-0 text-gray-500" />
                            <span className="font-medium">Pengaturan</span>
                          </button>
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          <button
                            onClick={() => {
                              onLogout();
                              setShowProfileDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation"
                          >
                            <Users size={18} className="flex-shrink-0" />
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
                    aria-label="Menu"
                  >
                    <Menu size={20} />
                  </button>
                  
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-bold text-gray-900 truncate">
                      {currentPageName}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-600" />
                          <span className="font-mono font-semibold text-gray-900 text-base">
                            {formatTime(currentTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                          <Calendar size={14} className="text-blue-600" />
                          <span>{formatDate(currentTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative" ref={profileDropdownRef}>
                    <button 
                      onClick={handleToggleProfileDropdown}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-colors flex items-center gap-2 touch-manipulation"
                    >
                      <User size={16} />
                      <span className="text-sm font-medium">Profile</span>
                      <ChevronDown size={14} className={`transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showProfileDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {userData.full_name || userData.username}
                          </p>
                          <p className="text-xs text-blue-600 capitalize">
                            {userData.role === 'guru_kelas' && userData.kelas ? 
                              `Guru Kelas ${userData.kelas}` : 
                              userData.role.replace("_", " ")
                            }
                          </p>
                        </div>
                        
                        <div className="py-2">
                          <button
                            onClick={() => {
                              handleMenuClick("Pengaturan");
                              setShowProfileDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          >
                            <Settings size={16} />
                            <span className="font-medium">Pengaturan</span>
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => {
                              onLogout();
                              setShowProfileDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Users size={16} />
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

          {/* Desktop Header - Original */}
          {!isMobile && !isTablet && (
            <div className="px-8 py-5">
              <div className="flex justify-between items-center">
                <div className="flex flex-col min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {currentPageName}
                    {isNavigating && (
                      <span className="ml-2 text-sm text-blue-600 font-normal">
                        Loading...
                      </span>
                    )}
                  </h1>
                </div>

                <div className="flex items-center gap-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-600 flex-shrink-0" />
                        <span className="font-mono font-semibold text-gray-900 text-base tracking-wide">
                          {formatTime(currentTime)}
                        </span>
                        <span className="bg-emerald-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                          WIB
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                        <Calendar size={14} className="text-blue-600 flex-shrink-0" />
                        <span>{formatDate(currentTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors duration-200 bg-blue-600 flex items-center justify-center">
                      <User size={16} className="mr-2" />
                      <span className="text-sm font-medium text-white">Profile</span>
                    </button>
                    
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-200 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {userData.full_name || userData.username}
                        </p>
                        <p className="text-xs text-gray-600 capitalize">
                          {userData.role === 'guru_kelas' && userData.kelas ? 
                            `Guru Kelas ${userData.kelas}` : 
                            userData.role.replace("_", " ")
                          }
                        </p>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => handleMenuClick("Pengaturan")}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                        >
                          <Settings size={16} className="flex-shrink-0" />
                          <span className="font-medium">Pengaturan</span>
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={onLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                        >
                          <Users size={16} className="flex-shrink-0" />
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
        <main className={`flex-1 overflow-y-auto ${
          isMobile ? 'p-3' : isTablet ? 'p-6' : 'p-8'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;