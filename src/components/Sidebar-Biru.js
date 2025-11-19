import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  UserCheck,
  UserPlus,
  ClipboardList,
  BarChart3,
  FileText,
  Settings,
  GraduationCap,
  Menu,
  X,
  School,
  Monitor,
  BookOpen,
  CalendarDays,
} from "lucide-react";

const Sidebar = ({
  userData,
  currentPage,
  onMenuClick,
  collapsed = false,
  onToggleCollapse,
  mobile = false,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    if (!mobile) {
      setIsCollapsed(collapsed);
    }
  }, [collapsed, mobile]);

  const menuConfig = {
    admin: [
      {
        category: "MENU UTAMA",
        items: [{ name: "Dashboard", icon: Home }],
      },
      {
        category: "MASTER DATA",
        items: [
          { name: "Data Guru", icon: GraduationCap },
          { name: "Data Siswa", icon: Users },
          { name: "Data Kelas", icon: School },
        ],
      },
      {
        category: "AKADEMIK",
        items: [
          { name: "Presensi Siswa", icon: UserCheck },
          { name: "Nilai Siswa", icon: BarChart3 },
          { name: "Catatan Siswa", icon: BookOpen },
          { name: "Jadwal Pelajaran", icon: CalendarDays },
          { name: "Laporan", icon: FileText },
        ],
      },
      {
        category: "SISTEM",
        items: [
          { name: "SPMB", icon: UserPlus },
          { name: "Pengaturan", icon: Settings },
          { name: "Monitor Sistem", icon: Monitor },
        ],
      },
    ],
    guru_kelas: [
      {
        category: "MENU UTAMA",
        items: [{ name: "Dashboard", icon: Home }],
      },
      {
        category: "MASTER DATA",
        items: [
          { name: "Data Guru", icon: GraduationCap },
          { name: "Data Siswa", icon: Users },
          { name: "Data Kelas", icon: School },
        ],
      },
      {
        category: "AKADEMIK",
        items: [
          { name: "Presensi Siswa", icon: UserCheck },
          { name: "Nilai Siswa", icon: BarChart3 },
          { name: "Catatan Siswa", icon: BookOpen },
          { name: "Jadwal Pelajaran", icon: CalendarDays },
          { name: "Laporan", icon: FileText },
        ],
      },
    ],
    guru_mapel: [
      {
        category: "MENU UTAMA",
        items: [{ name: "Dashboard", icon: Home }],
      },
      {
        category: "MASTER DATA",
        items: [
          { name: "Data Guru", icon: GraduationCap },
          { name: "Data Siswa", icon: Users },
          { name: "Data Kelas", icon: School },
        ],
      },
      {
        category: "AKADEMIK",
        items: [
          { name: "Presensi Siswa", icon: UserCheck },
          { name: "Nilai Siswa", icon: BarChart3 },
          { name: "Catatan Siswa", icon: BookOpen },
          { name: "Jadwal Pelajaran", icon: CalendarDays },
          { name: "Laporan", icon: FileText },
        ],
      },
    ],
  };

  const menuSections = menuConfig[userData.role] || [];

  const handleMenuClick = (menuName) => {
    if (onMenuClick) {
      onMenuClick(menuName);
    }
    if (mobile && onClose) {
      onClose();
    }
  };

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);

    if (!mobile && onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const showCollapsed = mobile ? false : isCollapsed;

  return (
    <aside
      className={`
      ${showCollapsed ? "w-20" : "w-72"} 
      bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white flex flex-col 
      ${mobile ? "fixed" : "fixed"} 
      left-0 top-0 h-screen shadow-2xl z-50 
      transition-all duration-300
      ${
        mobile
          ? "overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400/20 scrollbar-track-transparent"
          : "overflow-y-auto"
      }
      scroll-smooth border-r border-blue-700/30
    `}>
      <div className="p-3 sm:p-4 border-b border-blue-700/30">
        <div className="flex items-center justify-between">
          {!showCollapsed && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-xl sm:text-2xl bg-blue-500/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl backdrop-blur-sm border border-blue-400/40">
                🏫
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight tracking-wide">
                SDN 1 PASIRPOGOR
              </h2>
            </div>
          )}

          {showCollapsed && (
            <div className="w-full flex justify-center">
              <div className="text-2xl bg-blue-500/20 p-2 rounded-xl backdrop-blur-sm border border-blue-400/40">
                🏫
              </div>
            </div>
          )}

          {!mobile && (
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg bg-blue-700/40 hover:bg-blue-600/40 transition-all duration-300 border border-blue-600/30 ${
                showCollapsed ? "ml-0" : "ml-auto"
              }`}
              title={showCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <Menu size={16} className="transition-transform duration-300" />
            </button>
          )}

          {mobile && (
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-lg bg-blue-700/40 hover:bg-blue-600/40 active:bg-blue-500/40 transition-all duration-200 ml-auto touch-manipulation border border-blue-600/30"
              title="Close menu">
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 py-2 sm:py-2">
        <div className="px-2 sm:px-3">
          {menuSections.map((section, sectionIndex) => (
            <div
              key={section.category}
              className={sectionIndex > 0 ? "mt-2 sm:mt-3" : ""}>
              {!showCollapsed && (
                <div className="px-2 sm:px-3 mb-1 sm:mb-1.5">
                  <h3 className="text-xs sm:text-sm font-semibold text-blue-300/70 uppercase tracking-wider">
                    {section.category}
                  </h3>
                </div>
              )}

              {showCollapsed && sectionIndex > 0 && (
                <div className="w-full h-px bg-blue-700/30 mb-1.5"></div>
              )}

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = currentPage === item.name;

                  return (
                    <li key={item.name} className="relative group">
                      <button
                        onClick={() => handleMenuClick(item.name)}
                        className={`
                          w-full flex items-center gap-3 sm:gap-3 px-3 sm:px-3 py-2 sm:py-2 rounded-lg text-left
                          transition-all duration-200 touch-manipulation
                          ${
                            mobile
                              ? "min-h-[42px] active:scale-[0.98]"
                              : "min-h-[38px]"
                          }
                          ${
                            isActive
                              ? "bg-blue-500/30 text-white font-semibold border-l-4 border-cyan-400 shadow-lg"
                              : "text-blue-100/90 hover:bg-blue-700/30 hover:text-white active:bg-blue-600/40"
                          }
                          ${showCollapsed ? "justify-center" : ""}
                        `}
                        title={showCollapsed ? item.name : ""}>
                        <IconComponent
                          size={mobile ? 20 : 18}
                          className={`flex-shrink-0 ${
                            isActive ? "text-cyan-300" : ""
                          }`}
                        />
                        {!showCollapsed && (
                          <span className="text-sm sm:text-base font-medium leading-tight">
                            {item.name}
                          </span>
                        )}

                        {mobile && isActive && (
                          <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full shadow-sm"></div>
                        )}
                      </button>

                      {showCollapsed && !mobile && (
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-blue-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-blue-600/50">
                          {item.name}
                          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-800 rotate-45"></div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="p-3 sm:p-4 border-t border-blue-700/30 bg-blue-800/30">
        {!showCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm border-2 border-blue-400/50 shadow-sm">
                {getInitials(userData.full_name || userData.username)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-semibold text-white truncate leading-tight">
                {userData.full_name || userData.username}
              </p>
              {userData.role === "guru_kelas" && userData.kelas ? (
                <p className="text-xs sm:text-sm text-blue-200/80 capitalize leading-tight">
                  Guru Kelas {userData.kelas}
                </p>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-blue-200/80 capitalize leading-tight">
                    {userData.role.replace("_", " ")}
                  </p>
                  {userData.kelas && (
                    <p className="text-xs sm:text-sm text-cyan-300 font-medium leading-tight">
                      Kelas {userData.kelas}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-semibold text-xs border-2 border-blue-400/50 shadow-sm"
              title={userData.full_name || userData.username}>
              {getInitials(userData.full_name || userData.username)}
            </div>
          </div>
        )}
      </div>

      {mobile && <div className="pb-safe h-4"></div>}
    </aside>
  );
};

export default Sidebar;
