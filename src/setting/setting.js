import React, { useState, useEffect } from "react";
import {
  SettingsIcon,
  User,
  School,
  Calendar,
  Building2,
  Database,
  AlertCircle,
  X,
  Menu,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import ProfileTab from "./ProfileTab";
import SchoolManagementTab from "./SchoolManagementTab";
import AcademicYearTab from "./AcademicYearTab";
import SchoolSettingsTab from "./SchoolSettingsTab";
import SystemTab from "./SystemTab";
import MaintenanceModeTab from "./MaintenanceModeTab";

const Setting = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  // Toast helper
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "info" }),
      5000
    );
  };

  useEffect(() => {
    loadUserProfile();
    loadSchoolConfig();
  }, []);

  // ✅ Close mobile menu when tab changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [activeTab]);

  // ✅ Load user profile dari localStorage
  const loadUserProfile = () => {
    try {
      const userSession = JSON.parse(localStorage.getItem("user"));
      console.log("📋 Setting.js - User Session:", userSession);

      if (userSession) {
        console.log("✅ User ID:", userSession.id);
        console.log("✅ User Data:", userSession);
        setUser(userSession);
      } else {
        console.error("❌ No user session found!");
      }
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
      showToast("Error loading user profile", "error");
    }
  };

  // ✅ Load school config dari Supabase
  const loadSchoolConfig = async () => {
    try {
      setLoading(true);

      const { data: settings, error } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["school_name", "school_level", "grades"]);

      if (error) throw error;

      const config = {};
      settings?.forEach((item) => {
        config[item.setting_key] = item.setting_value;
      });

      if (config.grades && typeof config.grades === "string") {
        try {
          config.grades = JSON.parse(config.grades);
        } catch (e) {
          config.grades = ["I", "II", "III", "IV", "V", "VI"];
        }
      }

      setSchoolConfig({
        schoolName: config.school_name || "SD Anda",
        schoolLevel: config.school_level || "SD",
        grades: config.grades || ["I", "II", "III", "IV", "V", "VI"],
      });
    } catch (error) {
      console.error("Error loading school config:", error);
      showToast("Gagal memuat konfigurasi sekolah", "error");

      setSchoolConfig({
        schoolName: "SD Anda",
        schoolLevel: "SD",
        grades: ["I", "II", "III", "IV", "V", "VI"],
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Tabs - hanya admin yang bisa akses maintenance
  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    ...(user?.role === "admin"
      ? [
          { id: "school", label: "School Management", icon: School },
          { id: "academic", label: "Academic Year", icon: Calendar },
          { id: "settings", label: "School Settings", icon: Building2 },
          { id: "system", label: "System", icon: Database },
          { id: "maintenance", label: "Maintenance", icon: AlertCircle },
        ]
      : []),
  ];

  // ✅ Render Active Tab
  const renderActiveTab = () => {
    // ✅ TUNGGU sampai user data loaded
    if (!user) {
      return (
        <div className="flex items-center justify-center p-8 sm:p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-3 sm:border-4 border-blue-100 dark:border-gray-700 border-t-blue-600 dark:border-t-red-500 mx-auto"></div>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
              Memuat data user...
            </p>
          </div>
        </div>
      );
    }

    const commonProps = {
      userId: user?.id,
      user,
      loading,
      setLoading,
      showToast,
      schoolConfig,
      refreshSchoolConfig: loadSchoolConfig,
    };

    console.log("🎯 Rendering Tab with props:", commonProps);

    switch (activeTab) {
      case "profile":
        return <ProfileTab {...commonProps} />;
      case "school":
        return <SchoolManagementTab {...commonProps} />;
      case "academic":
        return <AcademicYearTab {...commonProps} />;
      case "settings":
        return <SchoolSettingsTab {...commonProps} />;
      case "system":
        return <SystemTab {...commonProps} />;
      case "maintenance":
        return <MaintenanceModeTab {...commonProps} />;
      default:
        return <ProfileTab {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-5 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ✅ Header - Responsive dengan tema merah */}
        <div className="flex items-center justify-between mb-5 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-2.5 rounded-lg bg-red-100 dark:bg-red-900/30">
              <SettingsIcon className="text-red-600 dark:text-red-400 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
                Pengaturan Sistem
              </h1>
              {schoolConfig && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-300 mt-1 sm:mt-1.5">
                  {schoolConfig.schoolName} - {schoolConfig.schoolLevel}
                </p>
              )}
            </div>
          </div>

          {/* ✅ Mobile Menu Toggle */}
          {tabs.length > 1 && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2.5 sm:p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              {showMobileMenu ? (
                <X size={20} className="text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              )}
            </button>
          )}
        </div>

        {/* ✅ Toast Notification - Responsive dengan tema merah */}
        {toast.show && (
          <div
            className={`fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 rounded-lg shadow-lg border transition-all duration-300 max-w-[calc(100vw-2rem)] sm:max-w-md min-h-[44px] ${
              toast.type === "success"
                ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                : toast.type === "error"
                ? "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                : "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"
            }`}>
            <span className="text-sm sm:text-base flex-1 pr-4">
              {toast.message}
            </span>
            <button
              onClick={() => setToast({ ...toast, show: false })}
              className="flex-shrink-0 p-1 hover:bg-white/30 dark:hover:bg-black/20 rounded-full transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center">
              <X size={16} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* ✅ Desktop Tab Navigation - Tema merah */}
        <div className="hidden lg:flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 mb-6 md:mb-8">
          <div className="flex min-w-max space-x-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-3 whitespace-nowrap py-3 px-5 font-medium text-sm transition-all duration-200 rounded-t-lg min-h-[44px] ${
                    isActive
                      ? "text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border-t-2 border-l border-r border-red-200 dark:border-red-800 shadow-sm relative"
                      : "text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800/50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}>
                  <IconComponent
                    size={18}
                    className={isActive ? "text-red-600 dark:text-red-400" : ""}
                  />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-400"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ✅ Mobile/Tablet Dropdown Menu */}
        {showMobileMenu && (
          <>
            <div className="lg:hidden mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-300 dark:border-gray-700 overflow-hidden animate-in slide-in-from-top duration-200 relative z-50">
              <div className="p-2">
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Menu Pengaturan
                  </h3>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <X size={18} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg font-medium text-sm transition-all my-1 min-h-[48px] ${
                        isActive
                          ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                      onClick={() => setActiveTab(tab.id)}>
                      <IconComponent
                        size={18}
                        className={
                          isActive
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-500 dark:text-gray-400"
                        }
                      />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {isActive && (
                        <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Overlay */}
            <div
              className="lg:hidden fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowMobileMenu(false)}></div>
          </>
        )}

        {/* ✅ Tablet Horizontal Scroll Tabs */}
        <div className="lg:hidden block mb-5 md:mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max space-x-2 pb-2 px-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-lg font-medium text-sm transition-all min-h-[44px] min-w-[44px] sm:min-w-auto ${
                    isActive
                      ? "text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border-2 border-red-500 dark:border-red-600 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700"
                  }`}
                  onClick={() => setActiveTab(tab.id)}>
                  <IconComponent
                    size={18}
                    className={isActive ? "text-red-600 dark:text-red-400" : ""}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.charAt(0)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ✅ Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default Setting;
