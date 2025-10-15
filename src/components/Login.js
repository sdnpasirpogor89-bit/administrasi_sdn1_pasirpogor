import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import bcrypt from "bcryptjs";
import Logo from "../components/Logo"; // IMPORT LOGO COMPONENT

// Icon components (since we can't import external icons in this example)
const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [rememberedUsername, setRememberedUsername] = useState("");
  const [schoolName, setSchoolName] = useState("SDN 1 PASIRPOGOR"); // Default school name

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalGuru: 0,
    totalSiswa: 0,
    totalKelas: 0,
    loading: true,
  });

  // Check for saved credentials on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rememberedUsername");
      if (saved) {
        setRememberedUsername(saved);
        setFormData((prev) => ({ ...prev, username: saved }));
        setRememberMe(true);
      }
    } catch (error) {
      console.log("Could not access localStorage:", error);
    }
  }, []);

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStatistics();
    fetchSchoolSettings();
  }, []);

  const fetchSchoolSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('school_name, school_logo')
        .single();

      if (!error && data) {
        if (data.school_name) {
          setSchoolName(data.school_name);
        }
        // Logo akan dihandle oleh Logo component
      }
    } catch (error) {
      console.error('Error fetching school settings:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Fetch total guru (users with roles: guru_kelas, guru_mapel only)
      const { data: guruData, error: guruError } = await supabase
        .from("users")
        .select("id")
        .in("role", ["guru_kelas", "guru_mapel"]);

      if (guruError) throw guruError;

      // Fetch total siswa aktif
      const { data: siswaData, error: siswaError } = await supabase
        .from("students")
        .select("id")
        .eq("is_active", true);

      if (siswaError) throw siswaError;

      // Fetch total kelas (distinct kelas from active students)
      const { data: kelasData, error: kelasError } = await supabase
        .from("students")
        .select("kelas")
        .eq("is_active", true);

      if (kelasError) throw kelasError;

      // Count unique classes
      const uniqueKelas = [...new Set(kelasData.map((item) => item.kelas))];

      setStatistics({
        totalGuru: guruData?.length || 0,
        totalSiswa: siswaData?.length || 0,
        totalKelas: uniqueKelas.length || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.username.trim() || !formData.password) {
      setError("Username dan password harus diisi");
      setLoading(false);
      return;
    }

    try {
      // Query untuk mendapatkan user berdasarkan username
      const { data, error: queryError } = await supabase
        .from("users")
        .select("*")
        .eq("username", formData.username.trim())
        .single();

      if (queryError || !data) {
        setError("Username atau password salah");
        setLoading(false);
        return;
      }

      // VERIFIKASI PASSWORD - Updated dengan bcrypt
      let isPasswordValid = false;

      try {
        // Check apakah password sudah di-hash (bcrypt format $2a$ atau $2b$)
        if (
          data.password.startsWith("$2a$") ||
          data.password.startsWith("$2b$")
        ) {
          // Password sudah di-hash, pakai bcrypt compare
          isPasswordValid = await bcrypt.compare(
            formData.password,
            data.password
          );
        } else {
          // Password masih plain text (backward compatibility)
          isPasswordValid = formData.password === data.password;

          // AUTO-HASH password lama untuk security
          if (isPasswordValid) {
            try {
              const hashedPassword = await bcrypt.hash(formData.password, 10);
              await supabase
                .from("users")
                .update({ password: hashedPassword })
                .eq("id", data.id);
              console.log(`Auto-hashed password for user: ${data.username}`);
            } catch (hashError) {
              console.error("Error hashing password:", hashError);
              // Lanjutkan tanpa error karena login tetap valid
            }
          }
        }
      } catch (bcryptError) {
        console.error("Error during password verification:", bcryptError);
        setError("Terjadi kesalahan dalam verifikasi password");
        setLoading(false);
        return;
      }

      if (!isPasswordValid) {
        setError("Username atau password salah");
        setLoading(false);
        return;
      }

      // Handle remember me functionality
      if (rememberMe) {
        try {
          localStorage.setItem("rememberedUsername", formData.username.trim());
        } catch (error) {
          console.log("Could not save to localStorage:", error);
        }
        setRememberedUsername(formData.username.trim());
      } else {
        try {
          localStorage.removeItem("rememberedUsername");
        } catch (error) {
          console.log("Could not remove from localStorage:", error);
        }
        setRememberedUsername("");
      }

      // Create user session data
      const userData = {
        id: data.id,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        kelas: data.kelas,
        loginTime: new Date().toISOString(),
      };

      // Store session for backward compatibility (optional)
      try {
        localStorage.setItem("userSession", JSON.stringify(userData));
      } catch (error) {
        console.log("Could not save session to localStorage:", error);
      }

      // Always call onLoginSuccess if provided (this is the main method)
      if (onLoginSuccess) {
        onLoginSuccess(userData);
      } else {
        // Fallback: if no onLoginSuccess prop, log a warning
        console.warn("No onLoginSuccess prop provided to Login component");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200/50 w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-emerald-500 p-4 sm:p-6 text-center text-white">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {/* LOGO DI FORGOT PASSWORD - FIXED */}
              <Logo size="medium" className="shadow-lg" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">{schoolName}</h1>
                <p className="text-xs sm:text-sm opacity-90">
                  Sistem Informasi Administrasi Sekolah
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Lupa Password
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Silakan hubungi administrator sekolah untuk reset password Anda.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-left">
              <p className="font-semibold text-emerald-800 mb-2 text-sm sm:text-base">
                Administrator:
              </p>
              <p className="text-gray-700 text-sm">📧 admin@sdn1pasirpogor.sch.id</p>
              <p className="text-gray-700 text-sm">📱 (022) 4378-5436</p>
            </div>
            <button
              type="button"
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 sm:py-4 rounded-xl font-medium transition-colors min-h-[48px] touch-manipulation"
              onClick={closeForgotPassword}>
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* LEFT SIDE - Welcome Section (Desktop: 60%, Mobile: full height but compact) */}
      <div className="flex-1 lg:w-3/5 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 flex items-center justify-center p-3 sm:p-4 lg:p-8 relative overflow-hidden min-h-[50vh] lg:min-h-screen">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 2px, transparent 2px)
            `,
            backgroundSize: "40px 40px",
          }}></div>

        {/* Welcome Content */}
        <div className="text-center text-white z-10 max-w-2xl w-full">
          {/* School Logo & Title - FIXED: Logo lebih rapi */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Logo 
                size="large" 
                className="drop-shadow-2xl"
                onLogoLoad={(hasLogo) => {
                  console.log('Logo loaded:', hasLogo);
                }}
              />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-5xl font-bold mb-1 sm:mb-2 text-white/90 leading-tight">
              Selamat Datang
            </h1>
            <h2 className="text-lg sm:text-xl lg:text-4xl font-semibold text-white/90 leading-tight">
              {schoolName}
            </h2>
          </div>

          {/* Vision */}
          <div className="bg-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8 backdrop-blur-sm border border-white/20">
            <h3 className="text-sm sm:text-base lg:text-xl font-semibold mb-2 sm:mb-3 text-blue-100">
              VISI SEKOLAH
            </h3>
            <p className="text-xs sm:text-sm lg:text-lg italic text-white/95 leading-relaxed">
              "Terwujudnya insan yang berkarakter, cerdas, terampil, berwawasan
              global, dan peduli lingkungan"
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Guru Card */}
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-6 backdrop-blur-sm border border-white/30 transform hover:-translate-y-1 transition-transform">
              <div className="text-lg sm:text-xl lg:text-3xl mb-1 sm:mb-2">👨‍🏫</div>
              <div className="text-lg sm:text-xl lg:text-3xl font-bold mb-1">
                {statistics.loading ? "..." : statistics.totalGuru}
              </div>
              <div className="text-xs sm:text-sm opacity-90">Guru</div>
            </div>

            {/* Siswa Card */}
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-6 backdrop-blur-sm border border-white/30 transform hover:scale-105 transition-transform">
              <div className="text-lg sm:text-xl lg:text-3xl mb-1 sm:mb-2">👦👧</div>
              <div className="text-lg sm:text-xl lg:text-3xl font-bold mb-1">
                {statistics.loading ? "..." : statistics.totalSiswa}
              </div>
              <div className="text-xs sm:text-sm opacity-90">Siswa</div>
            </div>

            {/* Kelas Card */}
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-6 backdrop-blur-sm border border-white/30 transform hover:translate-y-1 transition-transform">
              <div className="text-lg sm:text-xl lg:text-3xl mb-1 sm:mb-2">🏫</div>
              <div className="text-lg sm:text-xl lg:text-3xl font-bold mb-1">
                {statistics.loading ? "..." : statistics.totalKelas}
              </div>
              <div className="text-xs sm:text-sm opacity-90">Kelas</div>
            </div>
          </div>


        </div>
      </div>

      {/* RIGHT SIDE - Login Form (Desktop: 40%, Mobile: auto height) */}
      <div className="flex-1 lg:w-2/5 bg-gray-100 flex items-center justify-center p-3 sm:p-4 lg:p-8 min-h-[50vh] lg:min-h-screen">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
          {/* Login Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg ring-1 ring-gray-200/50 p-4 sm:p-6 lg:p-10 border border-gray-100">
            {/* Login Header - FIXED: Logo lebih rapi */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                <Logo 
                  size="medium" 
                  className="drop-shadow-lg"
                />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                Masuk ke Sistem
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                Silahkan Masukkan Username & Password Anda
              </p>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  required
                  disabled={loading}
                  autoComplete="username"
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-60 shadow-sm hover:shadow-md min-h-[48px] text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-60 pr-12 sm:pr-14 shadow-sm hover:shadow-md min-h-[48px] text-base"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Tampilkan password"
                    }>
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-3 sm:gap-2">
                <label className="flex items-center space-x-3 cursor-pointer min-h-[44px] touch-manipulation">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm sm:text-base text-gray-600">Ingat saya</span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-sm sm:text-base text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors min-h-[44px] px-2 touch-manipulation text-left sm:text-right">
                  Lupa password?
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 text-red-700 flex items-start space-x-2">
                  <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
                  <span className="text-sm sm:text-base">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl min-h-[48px] text-base touch-manipulation">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                © 2025 {schoolName}. Sistem Administrasi Sekolah.
              </p>
              <p className="text-xs sm:text-sm text-emerald-600 font-medium mt-1">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;