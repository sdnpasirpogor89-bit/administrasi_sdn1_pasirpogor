// src/App.js - SD VERSION DENGAN MAINTENANCE MODE
import React, { useState, useEffect, useMemo } from "react";
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
import Attendance from "./pages/Attendance";
import Teacher from "./pages/Teacher";
import Grades from "./pages/Grades";
import CatatanSiswa from "./pages/CatatanSiswa";
import TeacherSchedule from "./pages/TeacherSchedule";
import Classes from "./pages/Classes";
import SPMB from "./spmb/SPMB";
import Report from "./reports/Reports";
import Setting from "./setting/setting";
import MonitorSistem from "./system/MonitorSistem";
import MaintenancePage from "./setting/MaintenancePage"; // ✅ Import maintenance
import AdminPanel from "./setting/AdminPanel"; // ✅ Import admin panel

// ===== WRAPPER COMPONENTS DENGAN useMemo =====
const ReportWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return useMemo(
    () => <Report userData={userData} onNavigate={navigate} />,
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
    () => <Grades userData={userData} onNavigate={navigate} />,
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

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ========== MAINTENANCE MODE STATE ==========
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [whitelistUsers, setWhitelistUsers] = useState([]);

  // ========== 1. SETUP AUTO-SYNC & MAINTENANCE CHECK ==========
  useEffect(() => {
    setupAutoSync();
    console.log("✅ Auto-sync initialized");

    // Maintenance check
    checkMaintenanceStatus();

    // Subscribe to maintenance changes
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

      // ✅ Parse whitelist
      if (settings.maintenance_whitelist) {
        try {
          const parsed = JSON.parse(settings.maintenance_whitelist);
          setWhitelistUsers(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setWhitelistUsers([]);
        }
      } else {
        setWhitelistUsers([]);
      }
    } catch (error) {
      console.error("❌ Error loading maintenance settings:", error);
    }
  };

  // ========== 3. CHECK SESSION ==========
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = localStorage.getItem("userSession");

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
          localStorage.removeItem("userSession");
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
          localStorage.removeItem("userSession");
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
        localStorage.removeItem("userSession");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ========== 4. HANDLE LOGIN SUCCESS ==========
  const handleLoginSuccess = async (userData) => {
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
        loginTime: userData.loginTime || Date.now(),
        expiryTime: userData.expiryTime || Date.now() + 24 * 60 * 60 * 1000,
      };

      console.log("✅ Login success:", completeUserData.username);
      setUser(completeUserData);

      localStorage.setItem("userSession", JSON.stringify(completeUserData));
    } catch (error) {
      console.error("❌ Login success handler error:", error);
      setUser(userData);
    }
  };

  // ========== 5. HANDLE LOGOUT ==========
  const handleLogout = async () => {
    try {
      console.log("👋 Logging out...");
      localStorage.removeItem("userSession");
      setUser(null);
    } catch (error) {
      console.error("❌ Logout error:", error);
      localStorage.removeItem("userSession");
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

  // ========== 8. ADMIN PANEL SPECIAL ROUTE (BYPASS MAINTENANCE) ==========
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
          {/* LOGIN ROUTE */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          {/* PROTECTED ROUTES - CEK MAINTENANCE */}
          <Route
            path="/dashboard"
            element={
              user ? (
                // ✅ CEK MAINTENANCE: Jika ON & user bukan admin
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    {renderDashboard(user)}
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <StudentsWithNavigation userData={user} />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <ClassesWithNavigation userData={user} />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <AttendanceWithNavigation currentUser={user} />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <Teacher />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <GradesWithNavigation userData={user} />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <CatatanSiswaWithNavigation userData={user} />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <TeacherScheduleWithNavigation userData={user} />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <SPMBWithNavigation userData={user} />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <ReportWithNavigation userData={user} />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <SettingWithNavigation userData={user} />
                  </Layout>
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
                isMaintenanceMode && user.role !== "admin" ? (
                  <MaintenancePage message={maintenanceMessage} />
                ) : (
                  <Layout userData={user} onLogout={handleLogout}>
                    <MonitorSistemWithNavigation userData={user} />
                  </Layout>
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
