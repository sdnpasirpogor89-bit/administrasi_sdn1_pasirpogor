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
  const [showMobileMenu, setShowMobileMenu] = useState(false); // ✅ Mobile menu state

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
      const userSession = JSON.parse(localStorage.getItem("userSession"));
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
          config.grades = ["I", "II", "III", "IV", "V", "VI"]; // Default SD
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
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-3 sm:border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base text-gray-600 font-medium">
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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ✅ Header - Responsive */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <SettingsIcon className="text-blue-600 w-6 h-6 sm:w-7 sm:h-7" />
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">
                Pengaturan Sistem
              </h1>
              {schoolConfig && (
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                  {schoolConfig.schoolName} - {schoolConfig.schoolLevel}
                </p>
              )}
            </div>
          </div>

          {/* ✅ Mobile Menu Toggle - Only visible on mobile/tablet */}
          {tabs.length > 1 && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              {showMobileMenu ? (
                <X size={24} className="text-gray-600" />
              ) : (
                <Menu size={24} className="text-gray-600" />
              )}
            </button>
          )}
        </div>

        {/* ✅ Toast Notification - Responsive */}
        {toast.show && (
          <div
            className={`fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-6 sm:py-4 rounded-lg shadow-lg transition-all duration-300 max-w-[90vw] sm:max-w-md ${
              toast.type === "success"
                ? "bg-green-100 border border-green-200 text-green-800"
                : toast.type === "error"
                ? "bg-red-100 border border-red-200 text-red-800"
                : "bg-blue-100 border border-blue-200 text-blue-800"
            }`}>
            <span className="text-xs sm:text-sm flex-1">{toast.message}</span>
            <button
              onClick={() => setToast({ ...toast, show: false })}
              className="flex-shrink-0">
              <X size={16} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* ✅ Desktop Tab Navigation - Hidden on mobile/tablet */}
        <div className="hidden lg:flex overflow-x-auto border-b border-gray-200 mb-6">
          <div className="flex min-w-max space-x-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 scale-105"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}>
                  <IconComponent
                    size={16}
                    className={isActive ? "animate-pulse" : ""}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ✅ Mobile/Tablet Dropdown Menu */}
        {showMobileMenu && (
          <>
            <div className="lg:hidden mb-4 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-in slide-in-from-top duration-200 relative z-50">
              <div className="p-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
                        isActive
                          ? "text-blue-600 bg-blue-50 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setActiveTab(tab.id)}>
                      <IconComponent
                        size={18}
                        className={isActive ? "text-blue-600" : "text-gray-500"}
                      />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Overlay */}
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-40"
              onClick={() => setShowMobileMenu(false)}></div>
          </>
        )}

        {/* ✅ Tablet Horizontal Scroll Tabs - Only visible on tablet */}
        <div className="lg:hidden block mb-4 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max space-x-2 pb-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 whitespace-nowrap py-2.5 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                    isActive
                      ? "text-blue-600 bg-blue-50 border-2 border-blue-600 shadow-sm"
                      : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}>
                  <IconComponent
                    size={16}
                    className={isActive ? "animate-pulse" : ""}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ✅ Tab Content - Responsive */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default Setting;
