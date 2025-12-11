import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../supabaseClient";
import Logo from "./Logo";
import backgroundImage from "../assets/Background.jpg";

// 🔥 FIX: Ganti onLoginSuccess jadi onLogin dan onShowToast
export const Login = ({ onLogin, onShowToast }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check dark mode preference
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener("change", handleChange);

    return () => darkModeMediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => {
      setTimeout(() => setImageLoaded(true), 100);
    };
    img.onerror = () => {
      console.error("Failed to load background image");
      setImageLoaded(true);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!username) {
      setErrors({ username: "Username harus diisi" });
      setIsLoading(false);
      return;
    }
    if (!password) {
      setErrors({ password: "Password harus diisi" });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Username tidak ditemukan");
        }
        throw new Error("Terjadi kesalahan sistem: " + error.message);
      }

      if (!data) {
        throw new Error("Username tidak ditemukan");
      }

      // LOGIN TANPA CEK PASSWORD DULU - BUAT TESTING
      console.log("LOGIN BERHASIL:", data.username);

      const userData = {
        id: data.id,
        username: data.username,
        role: data.role,
        nama: data.full_name,
        full_name: data.full_name,
        kelas: data.kelas,
        email: data.email || `${data.username}@smp.edu`,
        is_active: data.is_active,
        created_at: data.created_at,
      };

      // 🔥 FIX: SAVE KE LOCALSTORAGE SEBELUM PANGGIL CALLBACK
      try {
        localStorage.setItem("userSession", JSON.stringify(userData));
        console.log("✅ Session saved to localStorage:", userData);
      } catch (storageError) {
        console.error("❌ Failed to save to localStorage:", storageError);
        throw new Error("Gagal menyimpan sesi login");
      }

      // Show success toast
      if (onShowToast) {
        onShowToast("Login berhasil! 🎉", "success");
      }

      // 🔥 FIX: Panggil onLogin (bukan onLoginSuccess)
      if (onLogin) {
        onLogin(userData, rememberMe);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      setErrors({ general: error.message });

      // 🔥 TAMBAH: Show toast untuk error
      if (onShowToast) {
        onShowToast(error.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Background gradient based on dark mode
  const getBackgroundGradient = () => {
    return isDarkMode
      ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      : "bg-gradient-to-br from-red-950 via-red-900 to-red-950";
  };

  // Blob colors based on dark mode
  const getBlobColors = () => {
    if (isDarkMode) {
      return {
        first: "bg-slate-700",
        second: "bg-slate-600",
        third: "bg-slate-500",
      };
    }
    return {
      first: "bg-red-600",
      second: "bg-red-700",
      third: "bg-red-500",
    };
  };

  const blobColors = getBlobColors();

  return (
    <div
      className={`min-h-screen flex flex-col ${getBackgroundGradient()} relative overflow-hidden`}>
      {/* Animated background patterns */}
      <div className="absolute inset-0 opacity-30">
        <div
          className={`absolute top-0 -left-4 w-72 h-72 ${blobColors.first} rounded-full mix-blend-multiply filter blur-xl animate-blob`}></div>
        <div
          className={`absolute top-0 -right-4 w-72 h-72 ${blobColors.second} rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000`}></div>
        <div
          className={`absolute -bottom-8 left-20 w-72 h-72 ${blobColors.third} rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000`}></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* HAPUS WARNA KUNING AUTOFILL */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.1) inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
      `}</style>

      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        {/* PHOTO SECTION */}
        <div
          className={`relative overflow-hidden flex-shrink-0 h-[35vh] lg:h-auto lg:flex-[7] transition-all duration-1000 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: imageLoaded ? `url(${backgroundImage})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}>
          {!imageLoaded && (
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                isDarkMode
                  ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                  : "bg-gradient-to-br from-red-900 via-red-800 to-red-900"
              }`}>
              <div className="relative">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
              </div>
            </div>
          )}

          {/* Gradient overlays */}
          <div
            className={`absolute inset-0 ${
              isDarkMode
                ? "bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-700/40"
                : "bg-gradient-to-br from-red-900/40 via-red-800/30 to-red-700/40"
            }`}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]"></div>
        </div>

        {/* FORM SECTION */}
        <div
          className={`flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden flex-1 lg:flex-[2] backdrop-blur-xl ${
            isDarkMode
              ? "bg-gradient-to-br from-slate-900/50 to-slate-800/50"
              : "bg-gradient-to-br from-red-950/50 to-red-900/50"
          }`}>
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl animate-pulse ${
              isDarkMode
                ? "bg-gradient-to-br from-slate-600/20 to-slate-500/20"
                : "bg-gradient-to-br from-red-500/20 to-red-600/20"
            }`}></div>
          <div
            className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl animate-pulse ${
              isDarkMode
                ? "bg-gradient-to-tr from-slate-500/20 to-slate-400/20"
                : "bg-gradient-to-tr from-red-600/20 to-red-500/20"
            }`}
            style={{ animationDelay: "1s" }}></div>

          <form
            className={`relative w-full max-w-md lg:max-w-sm transition-all duration-700 delay-500 ${
              imageLoaded
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-12"
            }`}
            onSubmit={handleSubmit}>
            <div
              className={`backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] ${
                isDarkMode
                  ? "bg-slate-800/30 border-slate-600/30 hover:bg-slate-800/40 hover:shadow-slate-500/20"
                  : "bg-white/10 border-red-200/30 hover:bg-white/[0.12] hover:shadow-red-500/20"
              }`}>
              <div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-r transition-all duration-500 -z-10 ${
                  isDarkMode
                    ? "from-slate-600/0 via-slate-500/0 to-slate-400/0 group-hover:from-slate-600/20 group-hover:via-slate-500/20 group-hover:to-slate-400/20"
                    : "from-red-500/0 via-red-600/0 to-red-500/0 group-hover:from-red-500/20 group-hover:via-red-600/20 group-hover:to-red-500/20"
                }`}></div>

              {/* Header */}
              <div className="text-center mb-8 relative">
                <div className="mb-4 flex justify-center">
                  <div className="relative group/logo">
                    <Logo
                      size="medium"
                      className="opacity-90 drop-shadow-2xl transition-transform duration-300 group-hover/logo:scale-110"
                    />
                    <div
                      className={`absolute inset-0 blur-xl rounded-full scale-150 transition-all duration-300 ${
                        isDarkMode
                          ? "bg-slate-400/20 group-hover/logo:bg-slate-400/30"
                          : "bg-red-400/20 group-hover/logo:bg-red-400/30"
                      }`}></div>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                  Selamat Datang
                </h2>
                <p
                  className={`text-sm sm:text-base ${
                    isDarkMode ? "text-slate-300/80" : "text-red-200/80"
                  }`}>
                  Silakan Masuk Ke Akun Anda
                </p>
                <div
                  className={`mt-3 w-16 h-1 mx-auto bg-gradient-to-r from-transparent rounded-full ${
                    isDarkMode ? "via-slate-400/50" : "via-red-400/50"
                  } to-transparent`}></div>
              </div>

              {/* Username Field */}
              <div className="mb-5 relative group/input">
                <label className="block font-semibold text-white/90 mb-2 text-sm tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    autoComplete="off"
                    className={`w-full px-4 py-3.5 bg-white/10 backdrop-blur-sm border-2 rounded-xl text-white placeholder-white/40 transition-all duration-300 focus:outline-none hover:border-white/30 ${
                      errors.username
                        ? "border-red-400/50 shadow-lg shadow-red-500/20"
                        : isDarkMode
                        ? "border-slate-500/30 focus:border-slate-400/50 focus:shadow-lg focus:shadow-slate-500/20"
                        : "border-red-200/30 focus:border-red-400/50 focus:shadow-lg focus:shadow-red-500/20"
                    }`}
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r transition-all duration-300 pointer-events-none ${
                      isDarkMode
                        ? "from-slate-500/0 to-slate-400/0 group-hover/input:from-slate-500/5 group-hover/input:to-slate-400/5"
                        : "from-red-500/0 to-red-600/0 group-hover/input:from-red-500/5 group-hover/input:to-red-600/5"
                    }`}></div>
                </div>
                {errors.username && (
                  <div className="text-red-300 text-sm mt-2 flex items-center font-medium animate-pulse">
                    <span className="mr-2">⚠️</span>
                    {errors.username}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-5 relative group/input">
                <label className="block font-semibold text-white/90 mb-2 text-sm tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="off"
                    className={`w-full px-4 py-3.5 pr-12 bg-white/10 backdrop-blur-sm border-2 rounded-xl text-white placeholder-white/40 transition-all duration-300 focus:outline-none hover:border-white/30 ${
                      errors.password
                        ? "border-red-400/50 shadow-lg shadow-red-500/20"
                        : isDarkMode
                        ? "border-slate-500/30 focus:border-slate-400/50 focus:shadow-lg focus:shadow-slate-500/20"
                        : "border-red-200/30 focus:border-red-500/50 focus:shadow-lg focus:shadow-red-500/20"
                    }`}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-all duration-300 p-2 hover:bg-white/10 rounded-lg z-10"
                    onClick={togglePasswordVisibility}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r transition-all duration-300 pointer-events-none ${
                      isDarkMode
                        ? "from-slate-400/0 to-slate-500/0 group-hover/input:from-slate-400/5 group-hover/input:to-slate-500/5"
                        : "from-red-600/0 to-red-500/0 group-hover/input:from-red-600/5 group-hover/input:to-red-500/5"
                    }`}></div>
                </div>
                {errors.password && (
                  <div className="text-red-300 text-sm mt-2 flex items-center font-medium animate-pulse">
                    <span className="mr-2">⚠️</span>
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errors.general && (
                <div
                  className={`mb-5 p-4 backdrop-blur-sm border rounded-xl text-sm font-medium shadow-lg animate-pulse ${
                    isDarkMode
                      ? "bg-red-500/10 border-red-400/20 text-red-300 shadow-red-500/5"
                      : "bg-red-500/20 border-red-400/30 text-red-200 shadow-red-500/10"
                  }`}>
                  ⚠️ {errors.general}
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex justify-between items-center mb-6">
                <label className="flex items-center gap-2 cursor-pointer group/check">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={`w-4 h-4 rounded bg-white/10 border-2 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      isDarkMode
                        ? "border-slate-400/30 checked:bg-slate-500 checked:border-slate-500 focus:ring-slate-400/50"
                        : "border-white/30 checked:bg-red-500 checked:border-red-500 focus:ring-red-400/50"
                    }`}
                  />
                  <span className="text-sm text-white/80 group-hover/check:text-white transition-colors select-none">
                    Ingat saya
                  </span>
                </label>
                <a
                  href="#"
                  className={`text-sm font-medium hover:underline transition-colors ${
                    isDarkMode
                      ? "text-slate-300 hover:text-slate-200"
                      : "text-red-300 hover:text-red-200"
                  }`}>
                  Lupa password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`relative w-full py-4 rounded-xl text-white font-bold transition-all duration-500 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group/btn overflow-hidden ${
                  isDarkMode
                    ? "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 hover:from-slate-600 hover:via-slate-500 hover:to-slate-400 shadow-slate-900/40 hover:shadow-slate-800/60"
                    : "bg-gradient-to-r from-red-900 via-red-800 to-red-700 hover:from-red-800 hover:via-red-700 hover:to-red-600 shadow-red-900/40 hover:shadow-red-800/60"
                } disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed`}
                disabled={isLoading}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>

                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span className="relative z-10">Login</span>
                )}
              </button>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-xs text-white/60 mb-1">
                  © 2025 SDN 1 PASIRPOGOR
                </p>
                <p className="text-xs text-white/40">
                  Sistem Administrasi Sekolah • v1.0.0
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
