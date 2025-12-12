// src/attendance-teacher/TodaySchedule.js
// Widget menampilkan jadwal mengajar hari ini

import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import { supabase } from "../supabaseClient";

const TodaySchedule = ({ currentUser }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get day name in Indonesian
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

  useEffect(() => {
    if (currentUser?.id) {
      fetchTodaySchedule();
    }

    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchTodaySchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teacher_schedules")
        .select("*")
        .eq("teacher_id", currentUser.id)
        .eq("day", today)
        .order("start_time", { ascending: true });

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      console.error("Error fetching today schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    return timeStr.slice(0, 5); // "07:00:00" -> "07:00"
  };

  const getClassStatus = (startTime, endTime) => {
    const now = currentTime;
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:00`;

    if (currentTimeStr < startTime) {
      return "upcoming"; // Belum mulai
    } else if (currentTimeStr >= startTime && currentTimeStr <= endTime) {
      return "ongoing"; // Sedang berlangsung
    } else {
      return "finished"; // Sudah selesai
    }
  };

  const getNextClass = () => {
    const now = currentTime;
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:00`;

    return schedules.find((s) => s.start_time > currentTimeStr);
  };

  const getTimeUntilNext = (startTime) => {
    const now = currentTime;
    const [hours, minutes] = startTime.split(":").map(Number);
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0);

    const diff = classTime - now;
    const minutesUntil = Math.floor(diff / 60000);

    if (minutesUntil < 0) return null;
    if (minutesUntil < 60) return `${minutesUntil} menit lagi`;

    const hoursUntil = Math.floor(minutesUntil / 60);
    const remainingMinutes = minutesUntil % 60;
    return `${hoursUntil} jam ${remainingMinutes} menit lagi`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const nextClass = getNextClass();

  return (
    <div className="bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-4 md:p-6 border border-red-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar
          className="text-red-600 dark:text-red-400"
          size={20}
          md:size={24}
        />
        <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white">
          Jadwal Mengajar Hari Ini
        </h3>
      </div>

      {/* Day Info */}
      <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 mb-4 border border-red-100 dark:border-red-800/30">
        <p className="text-sm text-red-800 dark:text-red-300 font-medium">
          📅 {today},{" "}
          {currentTime.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {schedules.length === 0 ? (
        /* No Schedule Today */
        <div className="text-center py-6 md:py-8">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3">
            <Calendar
              className="text-gray-400 dark:text-gray-500"
              size={24}
              md:size={32}
            />
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium mb-1 text-sm md:text-base">
            Tidak ada jadwal mengajar hari ini
          </p>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Anda libur atau tidak ada kelas terjadwal
          </p>
        </div>
      ) : (
        <>
          {/* Next Class Alert */}
          {nextClass && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-500 dark:border-orange-600 rounded-lg p-3 md:p-4 mb-4">
              <div className="flex items-start gap-2 md:gap-3">
                <Clock
                  className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                  size={18}
                  md:size={20}
                />
                <div>
                  <p className="text-orange-900 dark:text-orange-300 font-bold text-xs md:text-sm mb-1">
                    🔔 Kelas Berikutnya:{" "}
                    {getTimeUntilNext(nextClass.start_time)}
                  </p>
                  <p className="text-orange-800 dark:text-orange-400 text-xs md:text-sm">
                    <strong>Kelas {nextClass.class_id}</strong> •{" "}
                    {formatTime(nextClass.start_time)} -{" "}
                    {formatTime(nextClass.end_time)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 md:p-3 border border-gray-200 dark:border-gray-700 text-center min-h-[70px] md:min-h-0 flex flex-col justify-center">
              <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                {schedules.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Kelas
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 md:p-3 border border-gray-200 dark:border-gray-700 text-center min-h-[70px] md:min-h-0 flex flex-col justify-center">
              <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                {
                  schedules.filter(
                    (s) =>
                      getClassStatus(s.start_time, s.end_time) === "finished"
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Selesai
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 md:p-3 border border-gray-200 dark:border-gray-700 text-center min-h-[70px] md:min-h-0 flex flex-col justify-center">
              <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {
                  schedules.filter(
                    (s) =>
                      getClassStatus(s.start_time, s.end_time) !== "finished"
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Tersisa
              </p>
            </div>
          </div>

          {/* Schedule List - COMPACT VERSION */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Detail Jadwal:
            </p>

            {/* Group by class untuk compact display */}
            {(() => {
              // Group schedules by class_id
              const groupedSchedules = schedules.reduce((acc, schedule) => {
                const classId = schedule.class_id;
                if (!acc[classId]) {
                  acc[classId] = [];
                }
                acc[classId].push(schedule);
                return acc;
              }, {});

              return Object.entries(groupedSchedules).map(
                ([classId, classSchedules]) => {
                  // Get overall status for this class group
                  const allFinished = classSchedules.every(
                    (s) =>
                      getClassStatus(s.start_time, s.end_time) === "finished"
                  );
                  const anyOngoing = classSchedules.some(
                    (s) =>
                      getClassStatus(s.start_time, s.end_time) === "ongoing"
                  );

                  const groupStatus = anyOngoing
                    ? "ongoing"
                    : allFinished
                    ? "finished"
                    : "upcoming";

                  // Get time range
                  const firstTime = classSchedules[0].start_time;
                  const lastTime =
                    classSchedules[classSchedules.length - 1].end_time;
                  const jpCount = classSchedules.length;

                  return (
                    <div
                      key={classId}
                      className={`
                      p-3 rounded-lg border-l-4 transition-all min-h-[60px] flex items-center
                      ${
                        groupStatus === "ongoing"
                          ? "bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-md"
                          : groupStatus === "upcoming"
                          ? "bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-600"
                          : "bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600"
                      }
                    `}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div
                            className={`
                          w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-sm
                          ${
                            groupStatus === "ongoing"
                              ? "bg-green-500 dark:bg-green-600"
                              : groupStatus === "upcoming"
                              ? "bg-red-500 dark:bg-red-600"
                              : "bg-gray-400 dark:bg-gray-600"
                          }
                        `}>
                            {jpCount}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`
                              font-bold text-sm truncate
                              ${
                                groupStatus === "ongoing"
                                  ? "text-green-900 dark:text-green-300"
                                  : groupStatus === "upcoming"
                                  ? "text-red-900 dark:text-red-300"
                                  : "text-gray-600 dark:text-gray-400"
                              }
                            `}>
                              Kelas {classId}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock
                                size={12}
                                className={
                                  groupStatus === "ongoing"
                                    ? "text-green-600 dark:text-green-400"
                                    : groupStatus === "upcoming"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-500 dark:text-gray-500"
                                }
                              />
                              <p
                                className={`
                                text-xs truncate
                                ${
                                  groupStatus === "ongoing"
                                    ? "text-green-700 dark:text-green-400"
                                    : groupStatus === "upcoming"
                                    ? "text-red-700 dark:text-red-400"
                                    : "text-gray-500 dark:text-gray-500"
                                }
                              `}>
                                {formatTime(firstTime)} - {formatTime(lastTime)}{" "}
                                • {jpCount} JP
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-2">
                          {groupStatus === "ongoing" && (
                            <span className="bg-green-500 dark:bg-green-600 text-white text-xs font-bold px-2 py-1.5 rounded min-h-[32px] flex items-center justify-center">
                              BERLANGSUNG
                            </span>
                          )}
                          {groupStatus === "upcoming" && (
                            <span className="bg-red-500 dark:bg-red-600 text-white text-xs font-bold px-2 py-1.5 rounded min-h-[32px] flex items-center justify-center">
                              AKAN DATANG
                            </span>
                          )}
                          {groupStatus === "finished" && (
                            <span className="bg-gray-400 dark:bg-gray-600 text-white text-xs font-bold px-2 py-1.5 rounded min-h-[32px] flex items-center justify-center">
                              SELESAI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};

export default TodaySchedule;
