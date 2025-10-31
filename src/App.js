// src/App.js - FINAL VERSION DENGAN OFFLINE SYNC - FIXED
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
import SPMB from "./spmb/SPMB";
import Report from "./reports/Reports";
import Setting from "./setting/setting";
import MonitorSistem from "./system/MonitorSistem";

// ===== ✅ FIX: Wrapper components dengan useMemo =====
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
    () => <TeacherSchedule userData={userData} onNavigate={navigate} />,
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

  // ✅ SETUP AUTO-SYNC & EXPOSE DB (DEV ONLY)
  useEffect(() => {
    setupAutoSync();
    console.log("🔄 Auto-sync initialized");

    if (process.env.NODE_ENV === "development") {
      window.testDB = db;
      console.log("💾 Database exposed to: window.testDB");
      console.log("📖 Usage examples:");
      console.log("  await window.testDB.student_notes.toArray()");
      console.log("  await window.testDB.student_notes.count()");
      console.log("  await window.testDB.attendance.toArray()");
      console.log("  await window.testDB.grades.toArray()");
    }
  }, []);

  // ✅ CHECK SESSION DARI LOCALSTORAGE
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = localStorage.getItem("userSession");

        if (!sessionData) {
          console.log("No session found");
          setUser(null);
          setLoading(false);
          return;
        }

        const session = JSON.parse(sessionData);

        // ✅ CEK APAKAH SESSION MASIH VALID (belum expired)
        const currentTime = Date.now();
        if (session.expiryTime && currentTime > session.expiryTime) {
          console.log("Session expired");
          localStorage.removeItem("userSession");
          setUser(null);
          setLoading(false);
          return;
        }

        // ✅ SESSION VALID - Fetch user data terbaru dari database
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.id)
          .single();

        if (error || !userData) {
          console.error("User not found in database:", error);
          localStorage.removeItem("userSession");
          setUser(null);
          setLoading(false);
          return;
        }

        // ✅ SET USER DATA
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

        console.log("Session restored:", completeUserData.username);
        setUser(completeUserData);
      } catch (error) {
        console.error("Session check error:", error);
        localStorage.removeItem("userSession");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ✅ HANDLE LOGIN SUCCESS
  const handleLoginSuccess = async (userData) => {
    try {
      const { data: dbUserData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
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

      console.log("Login success:", completeUserData.username);
      setUser(completeUserData);

      localStorage.setItem("userSession", JSON.stringify(completeUserData));
    } catch (error) {
      console.error("Login success handler error:", error);
      setUser(userData);
    }
  };

  // ✅ HANDLE LOGOUT
  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      localStorage.removeItem("userSession");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("userSession");
      setUser(null);
    }
  };

  // Render dashboard based on role
  const renderDashboard = (userData) => {
    if (userData.role === "admin") {
      return <AdminDashboard userData={userData} />;
    } else {
      return <TeacherDashboard userData={userData} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          {/* Login Route */}
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

          {/* Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  {renderDashboard(user)}
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Students Route */}
          <Route
            path="/students"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <StudentsWithNavigation userData={user} />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Attendance Route */}
          <Route
            path="/attendance"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <AttendanceWithNavigation currentUser={user} />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Teachers Route */}
          <Route
            path="/teachers"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <Teacher />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Grades Route */}
          <Route
            path="/grades"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <GradesWithNavigation userData={user} />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Catatan Siswa Route */}
          <Route
            path="/catatan-siswa"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <CatatanSiswaWithNavigation userData={user} />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Jadwal Pelajaran Route */}
          <Route
            path="/schedule"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <TeacherScheduleWithNavigation userData={user} />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* SPMB Route */}
          <Route
            path="/spmb"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <SPMBWithNavigation userData={user} />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Reports Route */}
          <Route
            path="/reports"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <ReportWithNavigation userData={user} />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Settings Route */}
          <Route
            path="/settings"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <SettingWithNavigation userData={user} />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Monitor Sistem Route */}
          <Route
            path="/monitor-sistem"
            element={
              user ? (
                <Layout userData={user} onLogout={handleLogout}>
                  <MonitorSistemWithNavigation userData={user} />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Root redirect */}
          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />

          {/* Catch all */}
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
