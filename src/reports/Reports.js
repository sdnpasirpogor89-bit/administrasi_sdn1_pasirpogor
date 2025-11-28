import React, { useState, useEffect } from "react";
import ReportAdmin from "./ReportAdmin";
import ReportTeacher from "./ReportTeacher";

const Report = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage (same as Login.js saves it)
    try {
      const userSession = localStorage.getItem("userSession");
      if (userSession) {
        const userData = JSON.parse(userSession);
        setUser(userData);
      }
    } catch (error) {
      console.error("Error reading user session:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No user session
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">
            Sesi login tidak ditemukan
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  // Route berdasarkan role
  return user.role === "admin" ? (
    <ReportAdmin user={user} />
  ) : (
    <ReportTeacher user={user} />
  );
};

export default Report;
