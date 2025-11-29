// attendance-teacher/LocationValidator.js - FIXED FOR SD + ADMIN EXCEPTION
// Utility untuk validasi lokasi guru saat presensi manual

import { supabase } from "../supabaseClient";

// ========================================
// 🔧 KONFIGURASI - DISESUAIKAN DENGAN SEKOLAH 🔧
// ========================================

const SCHOOL_COORDS = {
  lat: -6.987732, // Koordinat sekolah
  lng: 107.399172,
};

const SCHOOL_RADIUS = 300; // 300 meter radius

// Debug mode - set true untuk lihat detail GPS di console
const DEBUG_MODE = true;

// ========================================
// ⏰ TIME WINDOW untuk Manual Input
// ========================================
const MANUAL_INPUT_ALLOWED = {
  startHour: 7,
  startMinute: 0,
  endHour: 13,
  endMinute: 0,
};

/**
 * Hitung jarak antara 2 koordinat menggunakan Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check browser support & permission status
 */
const checkGeolocationSupport = async () => {
  // Check basic support
  if (!navigator.geolocation) {
    return {
      supported: false,
      message:
        "Browser Anda tidak mendukung GPS. Gunakan Chrome atau Firefox terbaru.",
    };
  }

  // ✅ Check permission API (modern browsers)
  if (navigator.permissions) {
    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        return {
          supported: true,
          permissionDenied: true,
          message:
            "Akses lokasi diblokir. Buka pengaturan browser → Site Settings → Location → Izinkan",
        };
      }

      return { supported: true, permissionState: permission.state };
    } catch (error) {
      // Permission API tidak support (Safari iOS), lanjut aja
      console.log("Permission API not supported, continuing...");
    }
  }

  return { supported: true };
};

/**
 * 🆕 Check apakah user adalah Admin
 */
export const checkIsAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Error checking admin role:", error);
      return false;
    }

    const isAdmin = data?.role === "admin";
    console.log(`👤 User ${userId} is ${isAdmin ? "ADMIN" : "TEACHER"}`);

    return isAdmin;
  } catch (error) {
    console.error("❌ Exception checking admin:", error);
    return false;
  }
};

/**
 * Validasi lokasi guru untuk presensi manual
 * Returns: { allowed, distance, coords, error, message }
 */
export const validateAttendanceLocation = async () => {
  // ✅ Pre-check browser support & permission
  const supportCheck = await checkGeolocationSupport();

  if (!supportCheck.supported) {
    return {
      allowed: false,
      error: "GEOLOCATION_NOT_SUPPORTED",
      message: supportCheck.message,
    };
  }

  if (supportCheck.permissionDenied) {
    return {
      allowed: false,
      error: "GPS_PERMISSION_DENIED",
      message: supportCheck.message,
      help: getPermissionHelp(),
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          SCHOOL_COORDS.lat,
          SCHOOL_COORDS.lng
        );

        const isWithinRadius = distance <= SCHOOL_RADIUS;

        const result = {
          allowed: isWithinRadius,
          distance: Math.round(distance),
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp,
          message: isWithinRadius
            ? `Anda berada ${Math.round(distance)}m dari sekolah`
            : `Anda berada ${Math.round(
                distance
              )}m dari sekolah. Presensi manual hanya bisa dilakukan dalam radius ${SCHOOL_RADIUS}m`,
        };

        // Debug logging
        if (DEBUG_MODE) {
          console.log("📍 GPS DEBUG INFO:");
          console.log("📍 Lokasi Anda:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: `±${Math.round(position.coords.accuracy)}m`,
          });
          console.log("🏫 Lokasi Sekolah:", SCHOOL_COORDS);
          console.log("📏 Jarak:", `${Math.round(distance)}m`);
          console.log("✅ Radius Max:", `${SCHOOL_RADIUS}m`);
          console.log("🎯 Status:", isWithinRadius ? "✅ VALID" : "❌ INVALID");
          console.log(
            "🗺️ Lihat di Maps:",
            `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
          );
        }

        resolve(result);
      },
      (error) => {
        let errorMessage = "Tidak dapat mengakses lokasi";
        let errorCode = "GPS_ERROR";
        let help = null;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak";
            errorCode = "GPS_PERMISSION_DENIED";
            help = getPermissionHelp();
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Lokasi tidak tersedia. Pastikan GPS HP aktif dan Anda berada di luar ruangan";
            errorCode = "GPS_UNAVAILABLE";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Waktu habis saat mencari lokasi. Pastikan GPS aktif dan coba lagi";
            errorCode = "GPS_TIMEOUT";
            break;
        }

        console.error("❌ GPS Error:", errorCode, error);

        resolve({
          allowed: false,
          error: errorCode,
          message: errorMessage,
          help: help,
        });
      },
      {
        enableHighAccuracy: true, // Akurasi tinggi
        timeout: 15000, // ✅ Naikin jadi 15 detik (mobile lebih lambat)
        maximumAge: 0, // Jangan pake cached location
      }
    );
  });
};

/**
 * Get help text based on user device
 */
const getPermissionHelp = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("android")) {
    if (userAgent.includes("chrome")) {
      return "📱 Cara Mengizinkan di Android Chrome:\n1. Tap ikon 🔒 di address bar\n2. Tap 'Permissions'\n3. Izinkan 'Location'\n4. Refresh halaman ini";
    }
    return "📱 Cara Mengizinkan di Android:\n1. Buka Settings HP\n2. Apps → Browser → Permissions\n3. Aktifkan Location\n4. Refresh halaman ini";
  }

  if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
    if (userAgent.includes("safari")) {
      return "📱 Cara Mengizinkan di iPhone Safari:\n1. Buka Settings iPhone\n2. Safari → Location\n3. Pilih 'Ask' atau 'Allow'\n4. Refresh halaman ini";
    }
    if (userAgent.includes("crios")) {
      return "📱 Cara Mengizinkan di iPhone Chrome:\n1. Buka Settings iPhone\n2. Chrome → Location\n3. Pilih 'While Using'\n4. Refresh halaman ini";
    }
  }

  return "📱 Cara Mengizinkan:\n1. Buka pengaturan browser\n2. Cari 'Site Settings' atau 'Permissions'\n3. Izinkan akses lokasi untuk situs ini\n4. Refresh halaman";
};

/**
 * ✅ FIXED: Check apakah guru punya jadwal hari ini
 * Menggunakan tabel class_schedules (SD)
 */
export const validateTeacherSchedule = async (userId) => {
  try {
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const today = dayNames[new Date().getDay()];

    console.log("📅 Checking schedule for user:", userId, "Day:", today);

    // ✅ FIXED: Query ke class_schedules dengan teacher_id = user.id
    const { data: schedules, error } = await supabase
      .from("class_schedules")
      .select("*")
      .eq("teacher_id", userId)
      .eq("day", today)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching schedule:", error);
      return {
        hasSchedule: null,
        suspicious: false,
        error: "SCHEDULE_CHECK_FAILED",
        message: "Tidak dapat memvalidasi jadwal",
      };
    }

    console.log("📅 Schedules found:", schedules?.length || 0);

    if (!schedules || schedules.length === 0) {
      return {
        hasSchedule: false,
        suspicious: true,
        reason: "NO_SCHEDULE_TODAY",
        message: `Anda tidak memiliki jadwal mengajar hari ini (${today})`,
      };
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:00`;

    const firstClass = schedules[0];

    if (currentTime > firstClass.start_time) {
      return {
        hasSchedule: true,
        suspicious: true,
        reason: "LATE_CHECKIN",
        schedules: schedules,
        message: `Kelas pertama Anda dimulai pukul ${firstClass.start_time.slice(
          0,
          5
        )} (${firstClass.subject || "Mata Pelajaran"})`,
      };
    }

    return {
      hasSchedule: true,
      suspicious: false,
      schedules: schedules,
      totalClasses: schedules.length,
      message: `Hari ini Anda mengajar ${schedules.length} kelas`,
    };
  } catch (error) {
    console.error("Error validating schedule:", error);
    return {
      hasSchedule: null,
      suspicious: false,
      error: "SCHEDULE_CHECK_FAILED",
      message: "Tidak dapat memvalidasi jadwal",
    };
  }
};

/**
 * 🆕 Validasi waktu untuk manual input (DENGAN ADMIN EXCEPTION)
 * @param {string} userId - ID user yang melakukan presensi
 * @returns {Promise<Object>} - { allowed, message, isAdmin, bypassReason }
 */
export const validateManualInputTime = async (userId = null) => {
  // ✅ Cek apakah user adalah Admin
  const isAdmin = userId ? await checkIsAdmin(userId) : false;

  // ✅ Admin BYPASS semua time restriction
  if (isAdmin) {
    console.log("🔓 ADMIN DETECTED - Time restriction bypassed");
    return {
      allowed: true,
      isAdmin: true,
      bypassReason: "ADMIN_PRIVILEGE",
      message: "Admin dapat mengisi presensi kapan saja",
    };
  }

  // ✅ Guru biasa - cek jam operasional
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const currentMinutes = hour * 60 + minute;
  const startMinutes =
    MANUAL_INPUT_ALLOWED.startHour * 60 + MANUAL_INPUT_ALLOWED.startMinute;
  const endMinutes =
    MANUAL_INPUT_ALLOWED.endHour * 60 + MANUAL_INPUT_ALLOWED.endMinute;

  const isWithinWindow =
    currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  if (!isWithinWindow) {
    return {
      allowed: false,
      isAdmin: false,
      message: `Presensi hanya dapat dilakukan pada jam operasional sekolah: ${
        MANUAL_INPUT_ALLOWED.startHour
      }:${MANUAL_INPUT_ALLOWED.startMinute.toString().padStart(2, "0")} - ${
        MANUAL_INPUT_ALLOWED.endHour
      }:${MANUAL_INPUT_ALLOWED.endMinute
        .toString()
        .padStart(2, "0")}. Jika terlambat, hubungi Admin untuk bantuan.`,
    };
  }

  return {
    allowed: true,
    isAdmin: false,
    message: "Waktu presensi valid",
  };
};

/**
 * 🆕 Validasi LENGKAP untuk presensi (Location + Time + Schedule)
 * Digunakan di ManualCheckIn.js dan QRScanner.js
 */
export const validateFullAttendance = async (userId) => {
  console.log("🔍 Starting full attendance validation for user:", userId);

  // 1️⃣ Cek apakah admin
  const isAdmin = await checkIsAdmin(userId);

  // 2️⃣ Validasi waktu (dengan admin exception)
  const timeCheck = await validateManualInputTime(userId);
  if (!timeCheck.allowed && !isAdmin) {
    return {
      valid: false,
      error: "TIME_RESTRICTION",
      ...timeCheck,
    };
  }

  // 3️⃣ Validasi lokasi (admin tetap harus di radius sekolah)
  const locationCheck = await validateAttendanceLocation();
  if (!locationCheck.allowed) {
    return {
      valid: false,
      error: "LOCATION_RESTRICTION",
      ...locationCheck,
      isAdmin,
    };
  }

  // 4️⃣ Validasi jadwal (kecuali admin)
  let scheduleCheck = { hasSchedule: true, suspicious: false };
  if (!isAdmin) {
    scheduleCheck = await validateTeacherSchedule(userId);
  }

  // ✅ Semua validasi lolos
  return {
    valid: true,
    isAdmin,
    location: locationCheck,
    time: timeCheck,
    schedule: scheduleCheck,
    message: isAdmin
      ? "Validasi berhasil (Admin privilege)"
      : "Semua validasi berhasil",
  };
};

export default {
  validateAttendanceLocation,
  validateTeacherSchedule,
  validateManualInputTime,
  validateFullAttendance,
  checkIsAdmin,
  SCHOOL_COORDS,
  SCHOOL_RADIUS,
  MANUAL_INPUT_ALLOWED,
};
