// src/App.js - SD VERSION DENGAN MAINTENANCE MODE + WHITELIST + PRESENSI GURU + DARK MODE
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import "./index.css";
import { supabase } from "./supabaseClient";
import db from "./db";
import { setupAutoSync } from "./offlineSync";
import Login from "./components/Login";
import Layout from "./components/Layout";
import AdminDashboard from "./components/AdminDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import Students from "./pages/Students";
import Attendance from "./pages/attendance/Attendance";
import Teacher from "./pages/Teacher";
import Grade from "./pages/grades/Grade";
import Katrol from "./pages/grades/Katrol";
import CatatanSiswa from "./pages/CatatanSiswa";
import TeacherSchedule from "./pages/TeacherSchedule";
import Classes from "./pages/Classes";
import SPMB from "./spmb/SPMB";
import Report from "./reports/Reports";
import Setting from "./setting/setting";
import MonitorSistem from "./system/MonitorSistem";
import MaintenancePage from "./setting/MaintenancePage";
import AdminPanel from "./setting/AdminPanel";
import TeacherAttendance from "./attendance-teacher/TeacherAttendance";

// ===== WRAPPER COMPONENTS =====
const ReportWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <Report user={userData} onNavigate={navigate} />,
    [userData]
  );
};

const StudentsWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <Students userData={userData} onNavigate={navigate} />,
    [userData]
  );
};

const AttendanceWithNavigation = ({ currentUser }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <Attendance currentUser={currentUser} onNavigate={navigate} />,
    [currentUser]
  );
};

const GradesWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <Grade userData={userData} onNavigate={navigate} />,
    [userData]
  );
};

const CatatanSiswaWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <CatatanSiswa userData={userData} onNavigate={navigate} />,
    [userData]
  );
};

const TeacherScheduleWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <TeacherSchedule user={userData} onNavigate={navigate} />,
    [userData]
  );
};

const ClassesWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <Classes userData={userData} onNavigate={navigate} />,
    [userData]
  );
};

const SPMBWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <SPMB userData={userData} onNavigate={navigate} />,
    [userData]
  );
};

const SettingWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <Setting userData={userData} onNavigate={navigate} />,
    [userData]
  );
};

const MonitorSistemWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <MonitorSistem userData={userData} onNavigate={navigate} />,
    [userData]
  );
};

const TeacherAttendanceWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <TeacherAttendance userData={userData} onNavigate={navigate} />,
    [userData]
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ========== 🌙 DARK MODE STATE ==========
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false; // ← pake JSON.parse biar dapat boolean
  });

  // ========== MAINTENANCE MODE STATE ==========
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [whitelistUsers, setWhitelistUsers] = useState([]);

  // ========== 🌙 APPLY DARK MODE TO HTML ==========
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // HAPUS localStorage.setItem dari sini karena udah di toggleDarkMode
  }, [darkMode]);

  // ========== 🌙 TOGGLE DARK MODE FUNCTION ==========
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newValue = !prev;
      console.log("🌙 Toggling dark mode:", prev, "->", newValue);
      localStorage.setItem("darkMode", newValue.toString()); // ← save langsung di sini
      return newValue;
    });
  }, []);

  // ========== 1. SETUP AUTO-SYNC & MAINTENANCE CHECK ==========
  useEffect(() => {
    setupAutoSync();
    console.log("✅ Auto-sync initialized");

    checkMaintenanceStatus();

    const subscription = supabase
      .channel("maintenance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "school_settings",
          filter:
            "setting_key=in.(maintenance_mode,maintenance_message,maintenance_whitelist)",
        },
        (payload) => {
          loadMaintenanceSettings();
        }
      )
      .subscribe();

    if (process.env.NODE_ENV === "development") {
      window.testDB = db;
      console.log("Database exposed to: window.testDB");
    }

    return () => subscription.unsubscribe();
  }, []);

  // ========== 2. CHECK MAINTENANCE STATUS ==========
  const checkMaintenanceStatus = async () => {
    try {
      await loadMaintenanceSettings();
    } catch (error) {
      console.error("❌ Error checking maintenance:", error);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const loadMaintenanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "maintenance_mode",
          "maintenance_message",
          "maintenance_whitelist",
        ]);

      if (error) throw error;

      const settings = {};
      data?.forEach((item) => {
        settings[item.setting_key] = item.setting_value;
      });

      const isMaintenance =
        settings.maintenance_mode === "true" ||
        settings.maintenance_mode === true;

      setIsMaintenanceMode(isMaintenance);
      setMaintenanceMessage(
        settings.maintenance_message ||
          "Aplikasi sedang dalam maintenance. Kami akan kembali segera!"
      );

      if (settings.maintenance_whitelist) {
        try {
          const parsed = JSON.parse(settings.maintenance_whitelist);
          setWhitelistUsers(Array.isArray(parsed) ? parsed : []);
          console.log("✅ Whitelist loaded:", parsed);
        } catch (e) {
          console.error("❌ Error parsing whitelist:", e);
          setWhitelistUsers([]);
        }
      } else {
        setWhitelistUsers([]);
      }
    } catch (error) {
      console.error("❌ Error loading maintenance settings:", error);
    }
  };

  const isUserWhitelisted = useCallback(
    (userId) => {
      return whitelistUsers.some((u) => u.id === userId);
    },
    [whitelistUsers]
  );

  // ========== 3. CHECK SESSION ==========
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = localStorage.getItem("user");

        if (!sessionData) {
          console.log("❌ No session found");
          setUser(null);
          setLoading(false);
          return;
        }

        const session = JSON.parse(sessionData);

        const currentTime = Date.now();
        if (session.expiryTime && currentTime > session.expiryTime) {
          console.log("❌ Session expired");
          localStorage.removeItem("user");
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.id)
          .single();

        if (error || !userData) {
          console.error("❌ User not found in database:", error);
          localStorage.removeItem("user");
          setUser(null);
          setLoading(false);
          return;
        }

        const completeUserData = {
          id: userData.id,
          username: userData.username,
          name: userData.full_name,
          full_name: userData.full_name,
          role: userData.role,
          kelas: userData.kelas,
          mata_pelajaran: userData.mata_pelajaran,
          tahun_ajaran: userData.tahun_ajaran,
          is_active: userData.is_active,
          loginTime: session.loginTime,
          expiryTime: session.expiryTime,
        };

        console.log("✅ Session restored:", completeUserData.username);
        setUser(completeUserData);
      } catch (error) {
        console.error("❌ Session check error:", error);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ========== 4. HANDLE LOGIN ==========
  const handleLogin = async (userData, rememberMe = false) => {
    try {
      const { data: dbUserData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData.id)
        .single();

      if (error) {
        console.error("❌ Error fetching user data:", error);
        setUser(userData);
        return;
      }

      const loginTime = Date.now();
      const expiryTime = rememberMe
        ? loginTime + 30 * 24 * 60 * 60 * 1000
        : loginTime + 24 * 60 * 60 * 1000;

      const completeUserData = {
        id: dbUserData.id,
        username: dbUserData.username,
        name: dbUserData.full_name,
        full_name: dbUserData.full_name,
        role: dbUserData.role,
        kelas: dbUserData.kelas,
        mata_pelajaran: dbUserData.mata_pelajaran,
        tahun_ajaran: dbUserData.tahun_ajaran,
        is_active: dbUserData.is_active,
        loginTime: loginTime,
        expiryTime: expiryTime,
      };

      console.log("✅ Login success:", completeUserData.username);
      setUser(completeUserData);

      localStorage.setItem("user", JSON.stringify(completeUserData));

      if (rememberMe) {
        console.log("✅ Remember Me enabled - 30 days");
      } else {
        console.log("✅ Session valid for 24 hours");
      }
    } catch (error) {
      console.error("❌ Login handler error:", error);
      setUser(userData);
    }
  };

  // ========== 5. HANDLE LOGOUT ==========
  const handleLogout = async () => {
    try {
      console.log("👋 Logging out...");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberMe");
      setUser(null);
    } catch (error) {
      console.error("❌ Logout error:", error);
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  // ========== 6. RENDER DASHBOARD ==========
  const renderDashboard = (userData) => {
    if (userData.role === "admin") {
      return <AdminDashboard userData={userData} />;
    } else {
      return <TeacherDashboard userData={userData} />;
    }
  };

  const canAccessDuringMaintenance = useCallback(
    (userData) => {
      if (!isMaintenanceMode) return true;
      if (userData.role === "admin") {
        console.log("✅ Admin bypassed maintenance");
        return true;
      }
      if (isUserWhitelisted(userData.id)) {
        console.log(
          `✅ Whitelisted user ${userData.username} bypassed maintenance`
        );
        return true;
      }
      console.log(`🔴 User ${userData.username} blocked by maintenance`);
      return false;
    },
    [isMaintenanceMode, isUserWhitelisted]
  );

  // ========== 7. LOADING STATE ==========
  if (loading || maintenanceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  // ========== 8. ADMIN PANEL SPECIAL ROUTE ==========
  const currentPath = window.location.pathname;
  if (currentPath === "/secret-admin-panel-2024") {
    return (
      <Router>
        <Routes>
          <Route path="/secret-admin-panel-2024" element={<AdminPanel />} />
        </Routes>
      </Router>
    );
  }

  // ========== 9. MAIN APP ==========
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          {/* PROTECTED ROUTES */}
          <Route
            path="/dashboard"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    {renderDashboard(user)}
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/students"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <StudentsWithNavigation userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/classes"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <ClassesWithNavigation userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/attendance"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <AttendanceWithNavigation currentUser={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/teacher-attendance"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <TeacherAttendanceWithNavigation userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/teachers"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <Teacher />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/grades"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <Grade userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/grades/katrol"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <Katrol userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/catatan-siswa"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <CatatanSiswaWithNavigation userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/schedule"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <TeacherScheduleWithNavigation userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/spmb"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <SPMBWithNavigation userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/reports"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <ReportWithNavigation userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <SettingWithNavigation userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/monitor-sistem"
            element={
              user ? (
                canAccessDuringMaintenance(user) ? (
                  <Layout
                    userData={user}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}>
                    <MonitorSistemWithNavigation userData={user} />
                  </Layout>
                ) : (
                  <MaintenancePage message={maintenanceMessage} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* DEFAULT ROUTES */}
          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />
          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
