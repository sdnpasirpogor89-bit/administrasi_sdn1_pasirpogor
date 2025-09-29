// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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
import Report from "./pages/Report";
import Setting from "./pages/Setting";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session with proper security
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
            // Session valid, check if userData still matches
            if (userData.id === authData.user.id) {
              setUser(userData);
            } else {
              // User data mismatch, clear and re-authenticate
              localStorage.removeItem("userSession");
              setUser(null);
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

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Store user session with timestamp for additional validation
    const sessionData = {
      ...userData,
      loginTime: new Date().toISOString(),
      // Optional: Add expiry time (e.g., 24 hours)
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem("userSession", JSON.stringify(sessionData));
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
                  <Students userData={user} />
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
                  <Attendance currentUser={user} />
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
                  <Grades userData={user} />
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
                  <SPMB userData={user} />
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
                  <Report userData={user} />
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
                  <Setting userData={user} />
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