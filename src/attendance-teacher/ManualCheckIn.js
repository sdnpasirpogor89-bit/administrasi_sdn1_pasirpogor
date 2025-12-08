// src/attendance-teacher/ManualCheckIn.js - DARK MODE COMPLETE
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Save,
  CheckCircle,
  XCircle,
  MapPin,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { validateAttendance } from "./LocationValidator";

const ManualCheckIn = ({ currentUser, onSuccess }) => {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().split(" ")[0].slice(0, 5);

  const [formData, setFormData] = useState({
    date: today,
    status: "hadir",
    clockIn: now,
    notes: "",
    teacherId: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teachersList, setTeachersList] = useState([]);

  const statusOptions = [
    { value: "hadir", label: "Hadir", color: "bg-green-500 dark:bg-green-600" },
    { value: "izin", label: "Izin", color: "bg-blue-500 dark:bg-blue-600" },
    {
      value: "sakit",
      label: "Sakit",
      color: "bg-yellow-500 dark:bg-yellow-600",
    },
    { value: "alpha", label: "Alpha", color: "bg-red-500 dark:bg-red-600" },
  ];

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  useEffect(() => {
    if (isAdmin) {
      loadTeachers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (formData.status === "hadir" && !isAdmin) {
      checkLocation();
    } else {
      setLocationStatus(null);
    }
  }, [formData.status, isAdmin]);

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
        .select("id, full_name, username, kelas")
        .in("role", ["guru_kelas", "guru_mapel"])
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setTeachersList(data || []);
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const checkLocation = async () => {
    setCheckingLocation(true);
    const validation = await validateAttendance({
      method: "manual",
      userId: currentUser.id,
    });
    setLocationStatus(validation);
    setCheckingLocation(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!isAdmin) {
        if (formData.status === "hadir") {
          const validation = await validateAttendance({
            method: "manual",
            userId: currentUser.id,
          });

          setLocationStatus(validation);

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
        } else {
          const validation = await validateAttendance({
            method: "manual",
            userId: currentUser.id,
          });

          const timeError = validation.errors.find(
            (err) => err.code === "TIME_NOT_ALLOWED"
          );
          if (timeError) {
            const currentTime = new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Jakarta",
              hour12: false,
            });

            setMessage({
              type: "error",
              text: `⏰ Presensi Hanya Dapat Dilakukan Pada Jam 07:00 - 13:00 WIB.\nWaktu Saat Ini: ${currentTime} WIB\n\n💡 Jika Lupa Input Presensi, Hubungi Admin Untuk Bantuan.`,
            });
            setLoading(false);
            return;
          }
        }
      }

      let targetTeacherId;
      let targetTeacherName;

      if (isAdmin && formData.teacherId) {
        targetTeacherId = formData.teacherId;
        const teacher = teachersList.find((t) => t.id === formData.teacherId);
        targetTeacherName = teacher?.full_name || "Unknown";
      } else {
        targetTeacherId = currentUser.id;
        targetTeacherName = currentUser.full_name;
      }

      const { data: existingAttendance, error: checkError } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("teacher_id", targetTeacherId)
        .eq("attendance_date", formData.date)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      const attendanceData = {
        teacher_id: targetTeacherId,
        attendance_date: formData.date,
        status: formData.status,
        clock_in: formData.clockIn + ":00",
        check_in_method: isAdmin ? "admin" : "Manual",
        notes: formData.notes || null,
        full_name: targetTeacherName,
        updated_at: new Date().toISOString(),
      };

      if (isAdmin) {
        attendanceData.admin_info = `Input oleh: ${
          currentUser.full_name
        } pada ${new Date().toLocaleString("id-ID")}`;
      }

      if (!isAdmin && formData.status === "hadir" && locationStatus?.isValid) {
        const locationData = locationStatus.data.location;

        if (locationData.allowed && locationData.coords) {
          attendanceData.gps_location = `${locationData.coords.lat},${locationData.coords.lng}`;
        }
      } else if (
        !isAdmin &&
        formData.status === "hadir" &&
        !locationStatus?.isValid
      ) {
        attendanceData.gps_location = "GPS_ERROR";
      }

      if (existingAttendance) {
        const { error: updateError } = await supabase
          .from("teacher_attendance")
          .update(attendanceData)
          .eq("id", existingAttendance.id);

        if (updateError) throw updateError;

        setMessage({
          type: "success",
          text: isAdmin
            ? `✅ Presensi ${targetTeacherName} tanggal ${formData.date} berhasil diupdate!`
            : `✅ Presensi tanggal ${formData.date} berhasil diupdate!`,
        });
      } else {
        const { error: insertError } = await supabase
          .from("teacher_attendance")
          .insert(attendanceData);

        if (insertError) throw insertError;

        setMessage({
          type: "success",
          text: isAdmin
            ? `✅ Presensi ${targetTeacherName} tanggal ${formData.date} berhasil disimpan!`
            : `✅ Presensi tanggal ${formData.date} berhasil disimpan!`,
        });
      }

      setTimeout(() => {
        setMessage(null);
      }, 3000);

      if (onSuccess) onSuccess();

      setFormData({
        date: today,
        status: "hadir",
        clockIn: now,
        notes: "",
        teacherId: null,
      });

      if (!isAdmin) {
        setTimeout(() => {
          checkLocation();
        }, 500);
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      setMessage({
        type: "error",
        text: "Gagal menyimpan presensi: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2 dark:text-white">
          {isAdmin && (
            <Shield className="text-blue-600 dark:text-blue-400" size={20} />
          )}
          Input Presensi Manual
          {isAdmin && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
              ADMIN MODE
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isAdmin
            ? "Mode Admin: Dapat input presensi kapan saja untuk semua guru"
            : "Isi form di bawah untuk mencatat presensi"}
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 transition-all duration-500 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 animate-fade-in dark:bg-green-900/30 dark:border-green-800"
              : "bg-red-50 border border-red-200 animate-fade-in dark:bg-red-900/30 dark:border-red-800"
          }`}>
          {message.type === "success" ? (
            <CheckCircle
              className="text-green-600 dark:text-green-400 flex-shrink-0"
              size={24}
            />
          ) : (
            <XCircle
              className="text-red-600 dark:text-red-400 flex-shrink-0"
              size={24}
            />
          )}
          <p
            className={`text-sm font-medium whitespace-pre-line ${
              message.type === "success"
                ? "text-green-800 dark:text-green-300"
                : "text-red-800 dark:text-red-300"
            }`}>
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 dark:text-gray-300">
              <Shield size={18} className="text-blue-600 dark:text-blue-400" />
              Pilih Guru (Opsional)
            </label>
            <select
              value={formData.teacherId || ""}
              onChange={(e) =>
                handleChange("teacherId", e.target.value || null)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
              <option value="">-- Pilih Guru --</option>
              {teachersList.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              * Pilih Guru Yang Akan Diinputkan Presensinya
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 dark:text-gray-300">
            <Calendar size={18} />
            Tanggal Presensi
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            max={isAdmin ? undefined : today}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
            {isAdmin
              ? "* Admin dapat memilih tanggal kapan saja"
              : "* Bisa pilih tanggal mundur untuk input presensi yang terlupa"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Status Kehadiran
          </label>
          <div className="grid grid-cols-2 gap-3">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange("status", option.value)}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.status === option.value
                    ? `${option.color} text-white shadow-lg scale-105`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}>
                {option.label}
              </button>
            ))}
          </div>
          {formData.status !== "hadir" && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 dark:text-gray-400">
              <AlertTriangle size={14} />
              Status selain "Hadir" hanya memerlukan validasi waktu operational
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 dark:text-gray-300">
            <Clock size={18} />
            Jam Masuk
          </label>
          <input
            type="time"
            value={formData.clockIn}
            onChange={(e) => handleChange("clockIn", e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Catatan (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
            placeholder={
              isAdmin
                ? "Contoh: Lupa input presensi, konfirmasi via WA pukul 15.30"
                : "Contoh: Sakit demam, Ada keperluan keluarga, dll... (opsional)"
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 ${
            isAdmin
              ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              : "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          } disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg`}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={20} />
              {isAdmin ? "Simpan Presensi (Admin)" : "Simpan Presensi"}
            </>
          )}
        </button>
      </form>

      <div
        className={`${
          isAdmin
            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
            : "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800"
        } border rounded-lg p-4`}>
        <p className="text-sm text-gray-800 dark:text-gray-300">
          <strong>ℹ️ Info:</strong>{" "}
          {isAdmin
            ? "Sebagai Admin, Anda Dapat Input Presensi Kapan Saja Tanpa Batasan Waktu."
            : "Input Manual Presensi Hanya Tersedia Pada Jam 07:00 - 13:00. Jika Lupa Input, Harap Menghubungi Admin Untuk Bantuan."}
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ManualCheckIn;
