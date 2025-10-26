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
  BookOpen, // ← ICON BARU untuk Catatan Siswa
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
        ],
      },
      {
        category: "AKADEMIK",
        items: [
          { name: "Kehadiran", icon: UserCheck },
          { name: "Nilai Akademik", icon: BarChart3 },
          { name: "Catatan Siswa", icon: BookOpen }, // ← TAMBAH MENU BARU
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
        ],
      },
      {
        category: "AKADEMIK",
        items: [
          { name: "Kehadiran", icon: UserCheck },
          { name: "Nilai Akademik", icon: BarChart3 },
          { name: "Catatan Siswa", icon: BookOpen }, // ← TAMBAH MENU BARU
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
        ],
      },
      {
        category: "AKADEMIK",
        items: [
          { name: "Kehadiran", icon: UserCheck },
          { name: "Nilai Akademik", icon: BarChart3 },
          { name: "Catatan Siswa", icon: BookOpen }, // ← TAMBAH MENU BARU
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
      // 1. Ganti bg-blue-700 menjadi bg-indigo-950 (Dark Navy)
      className={`
      ${showCollapsed ? "w-20" : "w-72"} 
      bg-indigo-950 text-white flex flex-col 
      ${mobile ? "fixed" : "fixed"} 
      left-0 top-0 h-screen shadow-2xl z-50 
      transition-all duration-300
      ${
        mobile
          ? "overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          : "overflow-y-auto"
      }
      scroll-smooth
    `}>
      <div className="p-3 sm:p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!showCollapsed && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-xl sm:text-2xl bg-white/15 p-1.5 sm:p-2 rounded-lg sm:rounded-xl backdrop-blur-sm">
                🏫
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight tracking-wide">
                SDN 1 PASIRPOGOR
              </h2>
            </div>
          )}

          {showCollapsed && (
            <div className="w-full flex justify-center">
              <div className="text-2xl bg-white/15 p-2 rounded-xl backdrop-blur-sm">
                🏫
              </div>
            </div>
          )}

          {!mobile && (
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 ${
                showCollapsed ? "ml-0" : "ml-auto"
              }`}
              title={showCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <Menu size={16} className="transition-transform duration-300" />
            </button>
          )}

          {mobile && (
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all duration-200 ml-auto touch-manipulation"
              title="Close menu">
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 py-2 sm:py-3">
        <div className="px-2 sm:px-3">
          {menuSections.map((section, sectionIndex) => (
            <div
              key={section.category}
              className={sectionIndex > 0 ? "mt-3 sm:mt-4" : ""}>
              {!showCollapsed && (
                <div className="px-2 sm:px-3 mb-1.5 sm:mb-2">
                  {/* Warna text kategori tetap text-white/70, ini sudah bagus untuk Dark Mode */}
                  <h3 className="text-xs sm:text-sm font-semibold text-white/70 uppercase tracking-wider">
                    {section.category}
                  </h3>
                </div>
              )}

              {showCollapsed && sectionIndex > 0 && (
                <div className="w-full h-px bg-white/10 mb-2"></div>
              )}

              <ul className="space-y-0.5 sm:space-y-1">
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = currentPage === item.name;

                  return (
                    <li key={item.name} className="relative group">
                      <button
                        onClick={() => handleMenuClick(item.name)}
                        className={`
                          w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-left
                          transition-all duration-200 touch-manipulation
                          ${
                            mobile
                              ? "min-h-[44px] active:scale-[0.98]"
                              : "min-h-[40px]"
                          }
                          ${
                            isActive
                              // 2. Ganti bg-white/15 menjadi bg-white/10 (lebih halus)
                              // 3. Ganti border-emerald-400 menjadi border-amber-400 (Kuning Emas)
                              ? "bg-white/10 text-white font-semibold border-l-4 border-amber-400 shadow-lg"
                              : "text-white/80 hover:bg-white/10 hover:text-white active:bg-white/20"
                          }
                          ${showCollapsed ? "justify-center" : ""}
                        `}
                        title={showCollapsed ? item.name : ""}>
                        <IconComponent
                          size={mobile ? 22 : 20}
                          className={`flex-shrink-0 ${
                            // 4. Ganti text-emerald-400 menjadi text-amber-400 (Kuning Emas)
                            isActive ? "text-amber-400" : ""
                          }`}
                        />
                        {!showCollapsed && (
                          <span className="text-sm sm:text-base font-medium leading-tight">
                            {item.name}
                          </span>
                        )}

                        {mobile && isActive && (
                          // 5. Ganti bg-emerald-400 menjadi bg-amber-400 (Kuning Emas)
                          <div className="ml-auto w-2.5 h-2.5 bg-amber-400 rounded-full shadow-sm"></div>
                        )}
                      </button>

                      {showCollapsed && !mobile && (
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                          {item.name}
                          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
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

      <div className="p-3 sm:p-4 border-t border-white/10 bg-white/5">
        {!showCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {/* 6. Ganti bg-white/20 (avatar background) menjadi bg-amber-400 */}
              {/* 7. Ganti text-white (avatar text) menjadi text-indigo-950 (Dark Navy) */}
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-amber-400 flex items-center justify-center text-indigo-950 font-semibold text-xs sm:text-sm border-2 border-white/30 shadow-sm">
                {getInitials(userData.full_name || userData.username)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-semibold text-white truncate leading-tight">
                {userData.full_name || userData.username}
              </p>
              {userData.role === "guru_kelas" && userData.kelas ? (
                <p className="text-xs sm:text-sm text-white/80 capitalize leading-tight">
                  Guru Kelas {userData.kelas}
                </p>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-white/80 capitalize leading-tight">
                    {userData.role.replace("_", " ")}
                  </p>
                  {userData.kelas && (
                    // 8. Ganti text-emerald-300 menjadi text-amber-300 (Kuning Emas Lebih Muda)
                    <p className="text-xs sm:text-sm text-amber-300 font-medium leading-tight">
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
              className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-indigo-950 font-semibold text-xs border-2 border-white/30 shadow-sm"
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