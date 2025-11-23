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
} from "lucide-react";
import { supabase } from "../supabaseClient";
import ProfileTab from "./ProfileTab";
import SchoolManagementTab from "./SchoolManagementTab";
import AcademicYearTab from "./AcademicYearTab";
import SchoolSettingsTab from "./SchoolSettingsTab";
import SystemTab from "./SystemTab";
import MaintenanceModeTab from "./MaintenanceModeTab"; // ✅ Import baru

const Setting = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(null);

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
          { id: "maintenance", label: "Maintenance", icon: AlertCircle }, // ✅ Tab paling akhir
        ]
      : []),
  ];

  // ✅ Render Active Tab
  const renderActiveTab = () => {
    // ✅ TUNGGU sampai user data loaded
    if (!user) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
            <p className="mt-6 text-gray-600 font-medium">
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
      case "maintenance": // ✅ Case baru
        return <MaintenanceModeTab {...commonProps} />;
      default:
        return <ProfileTab {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Pengaturan Sistem
            </h1>
            {schoolConfig && (
              <p className="text-sm text-gray-600 mt-1">
                {schoolConfig.schoolName} - {schoolConfig.schoolLevel}
              </p>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
              toast.type === "success"
                ? "bg-green-100 border border-green-200 text-green-800"
                : toast.type === "error"
                ? "bg-red-100 border border-red-200 text-red-800"
                : "bg-blue-100 border border-blue-200 text-blue-800"
            }`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
          <div className="flex min-w-max space-x-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
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

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">{renderActiveTab()}</div>
      </div>
    </div>
  );
};

export default Setting;
