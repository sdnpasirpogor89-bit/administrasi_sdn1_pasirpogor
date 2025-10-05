// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";
import "./index.css"; 
import { supabase } from "./supabaseClient";
import Login from "./components/Login";
import Layout from "./components/Layout";
import AdminDashboard from "./components/AdminDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import Students from "./pages/Students";
import Attendance from "./pages/Attendance";
import Teacher from "./pages/Teacher";
import Grades from "./pages/Grades";
import SPMB from './spmb/SPMB';
import Report from "./reports/Report";
import Setting from './setting/setting';

// Wrapper component untuk handle navigation
const ReportWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return <Report userData={userData} onNavigate={navigate} />;
};

const StudentsWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return <Students userData={userData} onNavigate={navigate} />;
};

const AttendanceWithNavigation = ({ currentUser }) => {
  const navigate = useNavigate();
  return <Attendance currentUser={currentUser} onNavigate={navigate} />;
};

const GradesWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return <Grades userData={userData} onNavigate={navigate} />;
};

const SPMBWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return <SPMB userData={userData} onNavigate={navigate} />;
};

const SettingWithNavigation = ({ userData }) => {
  const navigate = useNavigate();
  return <Setting userData={userData} onNavigate={navigate} />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session with proper security and complete user data
  useEffect(() => {
    const validateSession = async () => {
      try {
        const session = localStorage.getItem("userSession");
        
        if (session) {
          const userData = JSON.parse(session);
          
          // Method 1: Validate with Supabase auth
          const { data: authData, error } = await supabase.auth.getUser();
          
          if (error || !authData.user) {
            // Session invalid with Supabase, clear localStorage
            console.log('Session validation failed:', error);
            localStorage.removeItem("userSession");
            setUser(null);
          } else {
            // Session valid, fetch complete user data from database
            try {
              const { data: dbUserData, error: dbError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userData.id)
                .single();

              if (dbError) {
                console.error('Error fetching user data from database:', dbError);
                // Use cached data as fallback
                setUser(userData);
              } else if (dbUserData) {
                // Merge complete data from database
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
                  loginTime: userData.loginTime || new Date().toISOString(),
                  expiryTime: userData.expiryTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                };
                
                console.log('Complete user data loaded:', completeUserData);
                setUser(completeUserData);
                
                // Update localStorage with complete data
                localStorage.setItem("userSession", JSON.stringify(completeUserData));
              } else {
                // No user data found in database
                console.warn('User not found in database');
                localStorage.removeItem("userSession");
                setUser(null);
              }
            } catch (fetchError) {
              console.error('Error during user data fetch:', fetchError);
              // Use cached data as fallback
              setUser(userData);
            }
          }
        } else {
          // No session in localStorage
          setUser(null);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        localStorage.removeItem("userSession");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateSession();

    // Optional: Listen to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem("userSession");
        setUser(null);
      }
    });

    // Cleanup listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = async (userData) => {
    // Fetch complete user data from database after login
    try {
      const { data: dbUserData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userData.id)
        .single();

      if (error) {
        console.error('Error fetching complete user data:', error);
        // Use login data as fallback
        setUser(userData);
        localStorage.setItem("userSession", JSON.stringify({
          ...userData,
          loginTime: new Date().toISOString(),
          expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));
      } else {
        // Merge complete data
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
          loginTime: new Date().toISOString(),
          expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        console.log('Login success with complete data:', completeUserData);
        setUser(completeUserData);
        localStorage.setItem("userSession", JSON.stringify(completeUserData));
      }
    } catch (fetchError) {
      console.error('Error during post-login data fetch:', fetchError);
      // Use login data as fallback
      setUser(userData);
      localStorage.setItem("userSession", JSON.stringify({
        ...userData,
        loginTime: new Date().toISOString(),
        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      // Clear localStorage
      localStorage.removeItem("userSession");
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Supabase logout fails, clear local state
      localStorage.removeItem("userSession");
      setUser(null);
    }
  };

  // Render appropriate dashboard based on user role
  const renderDashboard = (userData) => {
    if (userData.role === 'admin') {
      return <AdminDashboard userData={userData} />;
    } else {
      return <TeacherDashboard userData={userData} />;
    }
  };

  // Loading state with modern styling
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Validating session...</p>
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
          
          {/* Dashboard Route - Now uses role-based dashboards */}
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
          
          {/* Reports Route - ✅ FIXED IMPORT */}
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
          
          {/* Root redirect */}
          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />
          
          {/* Catch all - redirect to dashboard or login */}
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