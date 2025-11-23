// src/services/semesterService.js
import { supabase } from "../supabaseClient";

/**
 * GET SEMESTER DATA (Summary View)
 * For: Semester tab - aggregated data tanpa detail harian
 */
export const getSemesterData = async (
  semester,
  academicYear,
  kelas,
  selectedMonth = 0
) => {
  try {
    const kelasNumber = kelas?.toString().replace(/\D/g, "") || kelas;

    let months =
      semester === "Ganjil" ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];

    if (selectedMonth > 0) {
      months = [selectedMonth];
    }

    console.log("=== FETCH SEMESTER DATA ===");
    console.log(
      "Kelas:",
      kelasNumber,
      "Tahun:",
      academicYear,
      "Semester:",
      semester
    );

    // AMBIL SEMUA DATA
    const { data: attendanceData, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("kelas", kelasNumber)
      .eq("tahun_ajaran", academicYear)
      .order("tanggal", { ascending: true });

    if (error) throw error;

    console.log("Total data dari DB:", attendanceData?.length || 0);

    if (!attendanceData?.length) return [];

    // Filter by month
    const filteredData = attendanceData.filter((r) => {
      const parts = r.tanggal.split("-");
      const month = parseInt(parts[1], 10);
      return months.includes(month);
    });

    console.log("Data setelah filter bulan:", filteredData.length);

    if (filteredData.length === 0) return [];

    // HITUNG HARI EFEKTIF = UNIQUE TANGGAL
    const uniqueDates = [...new Set(filteredData.map((r) => r.tanggal))];
    const totalHariEfektif = uniqueDates.length;

    console.log("🎯 HARI EFEKTIF:", totalHariEfektif);

    // Aggregate per siswa
    const studentMap = {};
    filteredData.forEach((r) => {
      if (!studentMap[r.nisn]) {
        studentMap[r.nisn] = {
          nisn: r.nisn,
          nama_siswa: r.nama_siswa,
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpa: 0,
        };
      }
      const s = r.status?.toLowerCase();
      if (s === "hadir") studentMap[r.nisn].hadir++;
      else if (s === "sakit") studentMap[r.nisn].sakit++;
      else if (s === "izin") studentMap[r.nisn].izin++;
      else if (s === "alpa") studentMap[r.nisn].alpa++;
    });

    // Return dengan percentage
    return Object.values(studentMap).map((st) => {
      const total = st.hadir + st.sakit + st.izin + st.alpa;
      const percentage =
        totalHariEfektif > 0
          ? Math.round((st.hadir / totalHariEfektif) * 100)
          : 0;
      return {
        ...st,
        total,
        percentage,
        total_hari_efektif: totalHariEfektif,
      };
    });
  } catch (error) {
    console.error("Error getSemesterData:", error);
    return [];
  }
};

/**
 * GET MONTHLY DETAIL DATA (Daily Status View)
 * For: Monthly tab - dengan detail harian per tanggal
 */
export const getMonthlyDetailData = async (month, year, kelas) => {
  try {
    const kelasNumber = kelas?.toString().replace(/\D/g, "") || kelas;

    // Determine semester and academic year
    const semester = month >= 7 ? "Ganjil" : "Genap";
    const academicYear =
      semester === "Ganjil" ? `${year}/${year + 1}` : `${year - 1}/${year}`;

    console.log("=== FETCH MONTHLY DETAIL DATA ===");
    console.log("Bulan:", month, "Tahun:", year, "Kelas:", kelasNumber);
    console.log("Academic Year:", academicYear);

    // FETCH DATA
    const { data: attendanceData, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("kelas", kelasNumber)
      .eq("tahun_ajaran", academicYear)
      .order("tanggal", { ascending: true });

    if (error) throw error;

    console.log("Total data dari DB:", attendanceData?.length || 0);

    if (!attendanceData?.length) return [];

    // Filter by specific month
    const filteredData = attendanceData.filter((r) => {
      const parts = r.tanggal.split("-");
      const recordMonth = parseInt(parts[1], 10);
      const recordYear = parseInt(parts[0], 10);
      return recordMonth === month && recordYear === year;
    });

    console.log("Data untuk bulan", month, ":", filteredData.length);

    if (filteredData.length === 0) return [];

    // HITUNG HARI EFEKTIF
    const uniqueDates = [...new Set(filteredData.map((r) => r.tanggal))];
    const totalHariEfektif = uniqueDates.length;

    console.log("🎯 HARI EFEKTIF bulan", month, ":", totalHariEfektif);

    // Build student map dengan dailyStatus
    const studentMap = {};

    filteredData.forEach((r) => {
      if (!studentMap[r.nisn]) {
        studentMap[r.nisn] = {
          nisn: r.nisn,
          nama_siswa: r.nama_siswa,
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpa: 0,
          dailyStatus: {}, // PENTING: untuk detail harian
        };
      }

      // Add daily status
      studentMap[r.nisn].dailyStatus[r.tanggal] = r.status;

      // Count totals
      const s = r.status?.toLowerCase();
      if (s === "hadir") studentMap[r.nisn].hadir++;
      else if (s === "sakit") studentMap[r.nisn].sakit++;
      else if (s === "izin") studentMap[r.nisn].izin++;
      else if (s === "alpa") studentMap[r.nisn].alpa++;
    });

    // Return dengan percentage dan dailyStatus
    return Object.values(studentMap).map((st) => {
      const total = st.hadir + st.sakit + st.izin + st.alpa;
      const percentage =
        totalHariEfektif > 0
          ? Math.round((st.hadir / totalHariEfektif) * 100)
          : 0;
      return {
        nisn: st.nisn,
        name: st.nama_siswa,
        hadir: st.hadir,
        sakit: st.sakit,
        izin: st.izin,
        alpa: st.alpa,
        total,
        percentage,
        dailyStatus: st.dailyStatus, // PENTING!
      };
    });
  } catch (error) {
    console.error("Error getMonthlyDetailData:", error);
    return [];
  }
};

/**
 * HELPER: Generate Academic Year String
 */
export const getAcademicYear = (month, year) => {
  const semester = month >= 7 ? "Ganjil" : "Genap";
  return semester === "Ganjil" ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

/**
 * HELPER: Get Semester Type from Month
 */
export const getSemesterType = (month) => {
  return month >= 7 ? "Ganjil" : "Genap";
};
