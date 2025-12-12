// src/attendance-teacher/QRScanner.js - DARK MODE COMPLETE
import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  CheckCircle,
  XCircle,
  Camera,
  AlertCircle,
  Clock,
  Shield,
  MapPin,
  Image,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { validateAttendance } from "./LocationValidator";

const QRScanner = ({ currentUser, onSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [teachersList, setTeachersList] = useState([]);

  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  useEffect(() => {
    if (isAdmin) {
      loadTeachers();
    }
  }, [isAdmin]);

  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      if (scanning && !isScanningRef.current && mounted) {
        await startCamera();
      } else if (!scanning && isScanningRef.current) {
        await stopCamera();
      }
    };

    initCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [scanning]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      if (error) throw error;
      setIsAdmin(data.role === "admin");
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, username")
        .in("role", ["guru_kelas", "guru_mapel"])
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setTeachersList(data || []);
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const startCamera = async () => {
    if (isScanningRef.current) {
      console.log("⚠️ Camera already running, skipping start");
      return;
    }

    try {
      console.log("🎥 Starting camera...");

      const qrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = qrCode;

      await qrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 300 },
        },
        onScanSuccess,
        onScanError
      );

      isScanningRef.current = true;
      console.log("✅ Camera started!");
    } catch (err) {
      console.error("❌ Camera error:", err);
      setMessage({
        type: "error",
        text: "Gagal membuka kamera: " + err.message,
      });
      setScanning(false);
      isScanningRef.current = false;
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        console.log("🛑 Stopping camera...");
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        isScanningRef.current = false;
        console.log("✅ Camera stopped");
      } catch (err) {
        console.error("❌ Error stopping camera:", err);
        isScanningRef.current = false;
      }
    }
  };

  const onScanError = (error) => {
    // Silent - normal scanning errors
  };

  const onScanSuccess = async (decodedText) => {
    console.log("📷 QR Detected:", decodedText);

    const validQRCodes = ["QR_PRESENSI_GURU_SDN1_PASIRPOGOR"];

    if (!validQRCodes.includes(decodedText)) {
      console.log("❌ Invalid QR Code");
      setMessage({
        type: "error",
        text: "QR Code tidak valid! Gunakan QR Code resmi presensi guru SDN 1 Pasirpogor.",
      });
      return;
    }

    console.log("✅ Valid QR Code");

    await stopCamera();
    setScanning(false);

    if (isAdmin) {
      console.log("👤 Admin detected, showing teacher selection...");
      setShowTeacherSelect(true);
      return;
    }

    await processAttendance();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const qrCode = new Html5Qrcode("qr-reader-file");

      console.log("📷 Scanning QR from gallery...");
      const decodedText = await qrCode.scanFile(file, true);

      console.log("📷 QR dari Galeri:", decodedText);

      const validQRCodes = ["QR_PRESENSI_GURU_SDN1_PASIRPOGOR"];

      if (!validQRCodes.includes(decodedText)) {
        console.log("❌ Invalid QR Code from gallery");
        setMessage({
          type: "error",
          text: "QR Code tidak valid! Gunakan QR Code resmi presensi guru SDN 1 Pasirpogor.",
        });
        setLoading(false);
        return;
      }

      console.log("✅ Valid QR Code from gallery");

      if (isAdmin) {
        console.log("👤 Admin detected, showing teacher selection...");
        setShowTeacherSelect(true);
        setLoading(false);
        return;
      }

      await processAttendance();
    } catch (err) {
      console.error("❌ Error scanning file:", err);
      setMessage({
        type: "error",
        text: "Tidak dapat mendeteksi QR Code dari gambar. Pastikan QR Code terlihat jelas dan tidak blur.",
      });
      setLoading(false);
    } finally {
      if (event.target) {
        event.target.value = null;
      }
    }
  };

  const processAttendance = async (adminSelectedTeacherId = null) => {
    setLoading(true);
    setShowTeacherSelect(false);

    try {
      if (!isAdmin) {
        const validation = await validateAttendance({
          method: "qr",
          userId: currentUser.id,
        });

        if (!validation.isValid) {
          const errorMessages = validation.errors
            .map((err) => `• ${err.message}`)
            .join("\n");

          const gpsError = validation.errors.find((err) => err.help);
          const helpText = gpsError?.help
            ? `\n\n📱 Panduan:\n${gpsError.help}`
            : "";

          setMessage({
            type: "error",
            text: `❌ Presensi tidak dapat dilakukan:\n\n${errorMessages}${helpText}\n\n💡 Jika ada kendala, hubungi Admin untuk bantuan.`,
          });
          setLoading(false);
          return;
        }

        if (validation.data.warnings && validation.data.warnings.length > 0) {
          const warningMessages = validation.data.warnings
            .map((warn) => warn.message)
            .join("\n\n");

          const confirmMessage = `⚠️ Perhatian!\n\n${warningMessages}\n\nTetap lanjutkan presensi?`;
          const confirmed = window.confirm(confirmMessage);

          if (!confirmed) {
            setLoading(false);
            return;
          }
        }

        console.log("✅ Validation passed:", validation.data);
      }

      const jakartaDate = new Date(
        new Date().toLocaleString("en-US", {
          timeZone: "Asia/Jakarta",
        })
      );

      const year = jakartaDate.getFullYear();
      const month = String(jakartaDate.getMonth() + 1).padStart(2, "0");
      const day = String(jakartaDate.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      const hour = jakartaDate.getHours();
      const minute = jakartaDate.getMinutes();
      const second = jakartaDate.getSeconds();
      const hourStr = String(hour).padStart(2, "0");
      const minuteStr = String(minute).padStart(2, "0");
      const secondStr = String(second).padStart(2, "0");
      const clockInTime = `${hourStr}:${minuteStr}:${secondStr}`;

      console.log("📅 Date:", today, "Time:", clockInTime);

      let targetTeacherId;
      let targetTeacherName;

      if (isAdmin && adminSelectedTeacherId) {
        targetTeacherId = adminSelectedTeacherId;
        const teacher = teachersList.find(
          (t) => t.id === adminSelectedTeacherId
        );
        targetTeacherName = teacher?.full_name || "Unknown";
      } else {
        targetTeacherId = currentUser.id;
        targetTeacherName = currentUser.full_name;
      }

      console.log("🔍 Checking existing attendance...");
      const { data: existingAttendance, error: checkError } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("teacher_id", targetTeacherId)
        .eq("attendance_date", today)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingAttendance) {
        setMessage({
          type: "warning",
          text: isAdmin
            ? `${targetTeacherName} sudah melakukan presensi hari ini pada pukul ${existingAttendance.clock_in.substring(
                0,
                5
              )} WIB`
            : `Anda sudah melakukan presensi hari ini pada pukul ${existingAttendance.clock_in.substring(
                0,
                5
              )} WIB`,
        });
        setLoading(false);
        return;
      }

      const attendanceData = {
        teacher_id: targetTeacherId,
        attendance_date: today,
        status: "hadir",
        clock_in: clockInTime,
        check_in_method: "Scan QR",
        full_name: targetTeacherName,
        notes: null,
      };

      if (isAdmin) {
        attendanceData.admin_info = `Scan QR oleh admin: ${
          currentUser.full_name
        } pada ${new Date().toLocaleString("id-ID")}`;
      }

      if (!isAdmin) {
        const validation = await validateAttendance({
          method: "qr",
          userId: currentUser.id,
        });

        if (validation.isValid && validation.data.location) {
          const locationData = validation.data.location;

          if (locationData.allowed && locationData.coords) {
            attendanceData.gps_location = `${locationData.coords.lat},${locationData.coords.lng}`;
          }
        }
      }

      console.log("💾 Inserting attendance...");
      const { error: insertError } = await supabase
        .from("teacher_attendance")
        .insert(attendanceData);

      if (insertError) throw insertError;

      setMessage({
        type: "success",
        text: isAdmin
          ? `✅ Presensi ${targetTeacherName} berhasil! Jam: ${clockInTime.substring(
              0,
              5
            )} WIB`
          : `✅ Presensi berhasil! Jam masuk: ${clockInTime.substring(
              0,
              5
            )} WIB`,
      });

      setSelectedTeacherId(null);

      setTimeout(() => {
        setMessage(null);
      }, 3000);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("❌ Error submitting attendance:", error);
      setMessage({
        type: "error",
        text: "Gagal menyimpan presensi: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const startScanning = () => {
    setMessage(null);
    setScanning(true);
  };

  const stopScanning = () => {
    setScanning(false);
    setMessage(null);
  };

  const handleTeacherSubmit = () => {
    if (!selectedTeacherId) {
      setMessage({
        type: "error",
        text: "Silakan pilih guru terlebih dahulu",
      });
      return;
    }
    processAttendance(selectedTeacherId);
  };

  const handleCancelTeacherSelect = () => {
    setShowTeacherSelect(false);
    setSelectedTeacherId(null);
    setMessage(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      <div id="qr-reader-file" style={{ display: "none" }}></div>

      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2 dark:text-white">
          {isAdmin && (
            <Shield className="text-red-600 dark:text-red-400" size={20} />
          )}
          Scan QR Code untuk Presensi
          {isAdmin && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full dark:bg-red-900/50 dark:text-red-300">
              ADMIN MODE
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 px-2">
          {isAdmin
            ? "Scan QR Code untuk input presensi guru (tanpa batasan waktu)"
            : "Arahkan kamera ke QR Code atau pilih dari galeri"}
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 dark:bg-green-900/30 dark:border-green-800"
              : message.type === "error"
              ? "bg-red-50 border border-red-200 dark:bg-red-900/30 dark:border-red-800"
              : "bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800"
          }`}>
          {message.type === "success" ? (
            <CheckCircle
              className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
              size={20}
            />
          ) : message.type === "error" ? (
            <XCircle
              className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              size={20}
            />
          ) : (
            <AlertCircle
              className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
              size={20}
            />
          )}
          <p
            className={`text-sm font-medium whitespace-pre-line ${
              message.type === "success"
                ? "text-green-800 dark:text-green-300"
                : message.type === "error"
                ? "text-red-800 dark:text-red-300"
                : "text-yellow-800 dark:text-yellow-300"
            }`}>
            {message.text}
          </p>
        </div>
      )}

      {showTeacherSelect && isAdmin && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 space-y-4 dark:bg-red-900/30 dark:border-red-700">
          <div className="flex items-center gap-2 text-red-800 font-semibold dark:text-red-300">
            <Shield size={20} />
            <span>Pilih Guru untuk Presensi</span>
          </div>

          <select
            value={selectedTeacherId || ""}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full px-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-red-600 dark:focus:border-red-600">
            <option value="">Pilih Guru</option>
            {teachersList.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <button
              onClick={handleTeacherSubmit}
              disabled={!selectedTeacherId}
              className="flex-1 py-3 min-h-[44px] bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all dark:bg-red-700 dark:hover:bg-red-800">
              Submit Presensi
            </button>
            <button
              onClick={handleCancelTeacherSelect}
              className="flex-1 py-3 min-h-[44px] bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all dark:bg-gray-700 dark:hover:bg-gray-600">
              Batal
            </button>
          </div>
        </div>
      )}

      {!scanning && !loading && !showTeacherSelect && (
        <div className="space-y-3">
          <button
            onClick={startScanning}
            className={`w-full py-4 min-h-[56px] ${
              isAdmin
                ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                : "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            } text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg`}>
            <Camera size={20} />
            Scan dengan Kamera
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-4 min-h-[56px] ${
              isAdmin
                ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                : "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            } text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg`}>
            <Image size={20} />
            Pilih dari Galeri
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto dark:border-red-400"></div>
          <p className="text-gray-600 mt-4 dark:text-gray-300">
            Menyimpan presensi...
          </p>
        </div>
      )}

      {scanning && (
        <div className="space-y-4">
          <div
            id="qr-reader"
            className="rounded-lg overflow-hidden dark:border dark:border-gray-700"
            style={{ width: "100%", minHeight: "300px" }}></div>
          <button
            onClick={stopScanning}
            className="w-full py-4 min-h-[44px] bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all dark:bg-gray-700 dark:hover:bg-gray-600">
            Tutup Kamera
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div
          className={`${
            isAdmin
              ? "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800"
              : "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800"
          } border rounded-lg p-4`}>
          <p className="text-sm text-gray-800 dark:text-gray-300">
            <strong>💡 Tips:</strong> Pastikan pencahayaan cukup dan QR Code
            terlihat jelas, atau pilih screenshot/foto QR dari galeri
          </p>
        </div>

        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 dark:bg-amber-900/30 dark:border-amber-800">
            <Clock
              className="text-amber-600 dark:text-amber-400 flex-shrink-0"
              size={20}
            />
            <div className="space-y-2">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>⏰ Jam Operasional:</strong> Presensi hanya dapat
                dilakukan pada pukul 07:00 - 13:00 WIB
              </p>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 dark:bg-red-900/30 dark:border-red-800">
            <Shield
              className="text-red-600 dark:text-red-400 flex-shrink-0"
              size={20}
            />
            <p className="text-sm text-red-800 dark:text-red-300">
              <strong>Admin Mode:</strong> Anda dapat scan QR kapan saja tanpa
              batasan waktu dan lokasi untuk input presensi guru lain
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
