// src/reports/useReportData.js
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";

/**
 * Custom Hook untuk fetch data laporan dari Supabase
 * ✅ Support: students, attendance, attendance-recap, grades, notes, teachers, grades-grid
 */
export const useReportData = (reportType, filters = {}, user) => {
  const safeUser = user || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    // Safety Check: Hentikan fetch jika user belum terload
    if (!user || !user.role) {
      setError("User tidak ditemukan");
      return;
    }

    // Cache management
    const filtersKey = JSON.stringify(filters);
    const userKey = `${user.id}-${user.role}`;
    const cacheKey = `${reportType}-${filtersKey}-${userKey}`;

    const cached = cacheRef.current[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < 300000) {
      // 5 minutes cache
      setData(cached.data);
      setLoading(false);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      let result;

      switch (reportType) {
        case "students":
          result = await fetchStudentsData(filters, user);
          break;

        case "grades":
          result = await fetchGradesData(filters, user);
          break;

        case "grades-grid":
          result = await fetchGradesGridData(filters, user);
          break;

        case "attendance":
          result = await fetchAttendanceData(filters, user);
          break;

        case "attendance-recap":
          result = await fetchAttendanceRecapData(filters, user);
          break;

        case "notes":
          result = await fetchNotesData(filters, user);
          break;

        case "teachers":
          result = await fetchTeachersData(filters, user);
          break;

        default:
          throw new Error(`Report type tidak valid: ${reportType}`);
      }

      // Cache result
      cacheRef.current[cacheKey] = {
        data: result || [],
        timestamp: now,
      };

      setData(result || []);
    } catch (err) {
      if (err.name === "AbortError") return;

      console.error("Error fetching report data:", err);
      setError(err.message || "Gagal memuat data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, filters, user]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache,
  };
};

/**
 * ========================================
 * FETCH STUDENTS DATA
 * ========================================
 */
const fetchStudentsData = async (filters, user) => {
  try {
    let query = supabase
      .from("students")
      .select("*")
      .order("nama_siswa", { ascending: true });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
    }

    // Filter by kelas
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
    }

    // Filter by status
    if (filters.status && filters.status !== "semua") {
      const isActive = filters.status === "aktif";
      query = query.eq("is_active", isActive);
    }

    // Filter by jenis kelamin
    if (filters.jenisKelamin && filters.jenisKelamin !== "semua") {
      query = query.eq("jenis_kelamin", filters.jenisKelamin);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw new Error(`Gagal memuat data siswa: ${error.message}`);
  }
};

/**
 * ========================================
 * FETCH GRADES DATA - NILAI TERAKHIR (LIST VIEW)
 * ========================================
 * Priority: semester > uas > uts > harian
 */
const fetchGradesData = async (filters, user) => {
  try {
    let query = supabase
      .from("nilai")
      .select("*")
      .order("nama_siswa", { ascending: true });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
    } else if (user.role === "guru_mapel") {
      query = query.eq("mata_pelajaran", user.mata_pelajaran);
    }

    // Filter by kelas
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
    }

    // Filter by mapel
    if (filters.mapel && filters.mapel !== "") {
      query = query.eq("mata_pelajaran", filters.mapel);
    }

    // Filter by semester
    if (filters.semester && filters.semester !== "semua") {
      if (filters.semester === "ganjil") {
        const year = new Date().getFullYear();
        query = query
          .gte("tanggal", `${year}-07-01`)
          .lte("tanggal", `${year}-12-31`);
      } else if (filters.semester === "genap") {
        const year = new Date().getFullYear();
        query = query
          .gte("tanggal", `${year}-01-01`)
          .lte("tanggal", `${year}-06-30`);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    // Process data to get latest grade per student per subject
    const latestGrades = getLatestGrades(data || []);

    return latestGrades;
  } catch (error) {
    throw new Error(`Gagal memuat data nilai: ${error.message}`);
  }
};

/**
 * ========================================
 * FETCH GRADES GRID DATA - NILAI AKHIR PER SISWA
 * ========================================
 */
const fetchGradesGridData = async (filters, user) => {
  try {
    console.log("🔍 fetchGradesGridData called with filters:", filters);

    // Fetch semua nilai (tidak hanya "Nilai Akhir")
    let query = supabase
      .from("nilai")
      .select("*")
      .order("nama_siswa", { ascending: true });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
      console.log("👨‍🏫 Guru Kelas filter: kelas =", user.kelas);
    }

    // Filter by kelas (jika ada di filter)
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
      console.log("🏫 Kelas filter:", filters.kelas);
    }

    // Filter by semester
    if (filters.semester && filters.semester !== "semua") {
      const year = new Date().getFullYear();
      if (filters.semester === "ganjil") {
        query = query
          .gte("tanggal", `${year}-07-01`)
          .lte("tanggal", `${year}-12-31`);
        console.log("📅 Semester Ganjil:", `${year}-07-01 to ${year}-12-31`);
      } else if (filters.semester === "genap") {
        query = query
          .gte("tanggal", `${year}-01-01`)
          .lte("tanggal", `${year}-06-30`);
        console.log("📅 Semester Genap:", `${year}-01-01 to ${year}-06-30`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Raw data from Supabase:", data?.length, "records");

    if (!data || data.length === 0) {
      console.warn("⚠️ No data found for grades-grid");
      return [];
    }

    // Get latest grades first (prioritize by jenis_nilai)
    const latestGrades = getLatestGrades(data);
    console.log("📊 Latest grades:", latestGrades.length, "records");

    // Transform ke grid format
    const gridData = transformToGridFormat(latestGrades);
    console.log("🎯 Grid data:", gridData.length, "students");

    return gridData;
  } catch (error) {
    console.error("❌ Error in fetchGradesGridData:", error);
    throw new Error(`Gagal memuat data nilai grid: ${error.message}`);
  }
};

/**
 * Transform nilai data ke grid format (1 siswa = 1 row)
 */
const transformToGridFormat = (gradesData) => {
  // 9 Mata Pelajaran
  const MAPEL_LIST = [
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "Bahasa Sunda",
    "Matematika",
    "IPAS",
    "Pendidikan Pancasila",
    "Seni Budaya",
    "Pendidikan Agama Islam",
    "PJOK",
  ];

  // Group by nisn
  const grouped = {};

  gradesData.forEach((grade) => {
    const key = grade.nisn;

    if (!grouped[key]) {
      grouped[key] = {
        nisn: grade.nisn,
        nama_siswa: grade.nama_siswa,
        kelas: grade.kelas,
        grades: {},
      };
    }

    // Assign nilai per mapel (ambil yang paling tinggi prioritasnya)
    if (!grouped[key].grades[grade.mata_pelajaran]) {
      grouped[key].grades[grade.mata_pelajaran] = grade.nilai;
    }
  });

  // Convert to array with all mapel columns
  const result = Object.values(grouped).map((student) => {
    const row = {
      nisn: student.nisn,
      nama_siswa: student.nama_siswa,
      kelas: student.kelas,
    };

    let total = 0;
    let count = 0;

    // Add all 9 mapel columns + hitung jumlah & rata-rata
    MAPEL_LIST.forEach((mapel) => {
      const nilai = student.grades[mapel];
      if (nilai !== undefined && nilai !== null && nilai !== "-") {
        row[mapel] = nilai;
        total += parseFloat(nilai);
        count++;
      } else {
        row[mapel] = "-";
      }
    });

    // Calculate jumlah dan rata-rata OTOMATIS
    row.jumlah = count > 0 ? Math.round(total) : "-";
    row.rata_rata = count > 0 ? (total / count).toFixed(2) : "-";

    return row;
  });

  // SORT BY NAMA SISWA (A-Z)
  result.sort((a, b) => {
    const nameA = a.nama_siswa.toLowerCase();
    const nameB = b.nama_siswa.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  return result;
};

/**
 * Get latest grade per student per subject
 * Priority: Nilai Akhir > semester > uas > uts > harian
 */
const getLatestGrades = (allGrades) => {
  const priorityMap = {
    "Nilai Akhir": 5,
    semester: 4,
    uas: 3,
    uts: 2,
    harian: 1,
  };

  // Group by nisn + mata_pelajaran
  const grouped = {};

  allGrades.forEach((grade) => {
    const key = `${grade.nisn}-${grade.mata_pelajaran}`;

    if (!grouped[key]) {
      grouped[key] = grade;
    } else {
      const currentPriority = priorityMap[grouped[key].jenis_nilai] || 0;
      const newPriority = priorityMap[grade.jenis_nilai] || 0;

      // Replace if higher priority, or same priority but newer date
      if (newPriority > currentPriority) {
        grouped[key] = grade;
      } else if (newPriority === currentPriority) {
        const currentDate = new Date(grouped[key].tanggal);
        const newDate = new Date(grade.tanggal);
        if (newDate > currentDate) {
          grouped[key] = grade;
        }
      }
    }
  });

  return Object.values(grouped);
};

/**
 * ========================================
 * FETCH ATTENDANCE DATA (DETAIL HARIAN)
 * ========================================
 */
const fetchAttendanceData = async (filters, user) => {
  try {
    let query = supabase
      .from("attendance")
      .select("*")
      .order("tanggal", { ascending: false });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
    }

    // Filter by kelas
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
    }

    // Filter by bulan & tahun
    if (filters.bulan && filters.bulan !== 0 && filters.tahun) {
      const startDate = `${filters.tahun}-${String(filters.bulan).padStart(
        2,
        "0"
      )}-01`;
      const endDate = new Date(filters.tahun, filters.bulan, 0)
        .toISOString()
        .split("T")[0];
      query = query.gte("tanggal", startDate).lte("tanggal", endDate);
    }

    // Filter by status
    if (filters.statusPresensi && filters.statusPresensi !== "semua") {
      query = query.eq("status", filters.statusPresensi);
    }

    // Filter by jenis presensi (kelas/mapel)
    if (filters.jenisPresensi && filters.jenisPresensi !== "semua") {
      query = query.eq("jenis_presensi", filters.jenisPresensi);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw new Error(`Gagal memuat data presensi: ${error.message}`);
  }
};

/**
 * ========================================
 * FETCH ATTENDANCE RECAP DATA (REKAPITULASI BULANAN)
 * ========================================
 */
const fetchAttendanceRecapData = async (filters, user) => {
  try {
    console.log("📊 fetchAttendanceRecapData called with filters:", filters);

    // STEP 1: Fetch semua data presensi sesuai filter
    let query = supabase
      .from("attendance")
      .select("*")
      .order("nisn", { ascending: true });

    // Role-based filtering
    if (user.role === "guru_kelas") {
      query = query.eq("kelas", user.kelas);
      console.log("👨‍🏫 Guru Kelas filter: kelas =", user.kelas);
    }

    // Filter by kelas
    if (filters.kelas && filters.kelas !== "") {
      query = query.eq("kelas", filters.kelas);
      console.log("🏫 Kelas filter:", filters.kelas);
    }

    // ⚠️ WAJIB: Filter by bulan & tahun untuk rekap bulanan
    if (!filters.bulan || filters.bulan === 0 || !filters.tahun) {
      console.warn("⚠️ Bulan/Tahun tidak dipilih, gunakan bulan ini");
      const today = new Date();
      filters.bulan = today.getMonth() + 1;
      filters.tahun = today.getFullYear();
    }

    const startDate = `${filters.tahun}-${String(filters.bulan).padStart(
      2,
      "0"
    )}-01`;
    const lastDay = new Date(filters.tahun, filters.bulan, 0).getDate();
    const endDate = `${filters.tahun}-${String(filters.bulan).padStart(
      2,
      "0"
    )}-${String(lastDay).padStart(2, "0")}`;

    query = query.gte("tanggal", startDate).lte("tanggal", endDate);
    console.log("📅 Date range:", startDate, "to", endDate);

    // Filter by jenis presensi (optional)
    if (filters.jenisPresensi && filters.jenisPresensi !== "semua") {
      query = query.eq("jenis_presensi", filters.jenisPresensi);
    }

    const { data: attendanceData, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Raw attendance data:", attendanceData?.length, "records");

    if (!attendanceData || attendanceData.length === 0) {
      console.warn("⚠️ No attendance data found for recap");
      return [];
    }

    // STEP 2: Fetch daftar siswa untuk kelas yang dipilih
    let studentsQuery = supabase
      .from("students")
      .select("nisn, nama_siswa, kelas")
      .eq("is_active", true);

    if (user.role === "guru_kelas") {
      studentsQuery = studentsQuery.eq("kelas", user.kelas);
    } else if (filters.kelas && filters.kelas !== "") {
      studentsQuery = studentsQuery.eq("kelas", filters.kelas);
    }

    const { data: studentsData, error: studentsError } = await studentsQuery;

    if (studentsError) throw studentsError;

    console.log("👥 Students data:", studentsData?.length, "students");

    // STEP 3: Transform ke format rekap
    const recapData = transformToRecapFormat(attendanceData, studentsData);
    console.log("🎯 Recap data:", recapData.length, "students");

    return recapData;
  } catch (error) {
    console.error("❌ Error in fetchAttendanceRecapData:", error);
    throw new Error(`Gagal memuat rekapitulasi presensi: ${error.message}`);
  }
};

/**
 * Transform attendance data ke format rekapitulasi
 * Output: { nisn, nama_siswa, kelas, hadir, sakit, izin, alpa }
 */
const transformToRecapFormat = (attendanceData, studentsData) => {
  // Buat map siswa untuk lookup cepat
  const studentsMap = new Map(studentsData.map((s) => [s.nisn, s]));

  // Group attendance by NISN
  const grouped = {};

  attendanceData.forEach((record) => {
    const nisn = record.nisn;

    if (!grouped[nisn]) {
      const student = studentsMap.get(nisn);
      grouped[nisn] = {
        id: record.id,
        nisn: nisn,
        nama_siswa:
          student?.nama_siswa || record.nama_siswa || "Tidak Diketahui",
        kelas: student?.kelas || record.kelas || "-",
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
      };
    }

    // Count status
    const status = record.status;
    if (status === "Hadir") {
      grouped[nisn].hadir++;
    } else if (status === "Sakit") {
      grouped[nisn].sakit++;
    } else if (status === "Izin") {
      grouped[nisn].izin++;
    } else if (status === "Alpa") {
      grouped[nisn].alpa++;
    }
  });

  // Convert to array
  let result = Object.values(grouped);

  // Tambahkan siswa yang tidak punya record presensi sama sekali
  studentsData.forEach((student) => {
    if (!grouped[student.nisn]) {
      result.push({
        id: `student-${student.nisn}`,
        nisn: student.nisn,
        nama_siswa: student.nama_siswa,
        kelas: student.kelas,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
      });
    }
  });

  // Sort by nama siswa
  result.sort((a, b) => {
    const nameA = a.nama_siswa.toLowerCase();
    const nameB = b.nama_siswa.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  console.log("📊 Recap summary:", {
    totalStudents: result.length,
    totalHadir: result.reduce((sum, r) => sum + r.hadir, 0),
    totalSakit: result.reduce((sum, r) => sum + r.sakit, 0),
    totalIzin: result.reduce((sum, r) => sum + r.izin, 0),
    totalAlpa: result.reduce((sum, r) => sum + r.alpa, 0),
  });

  return result;
};

/**
 * ========================================
 * ✅ FETCH NOTES DATA (CATATAN SISWA) - FIXED
 * ========================================
 * PERBAIKAN:
 * - Guru Kelas: HANYA lihat catatan yang DIA BUAT SENDIRI
 * - Hapus filter "dibuatOleh" karena tidak relevan
 * - Auto filter by teacher_id untuk guru_kelas
 */
const fetchNotesData = async (filters, user) => {
  try {
    console.log("📝 fetchNotesData called with filters:", filters);
    console.log("👤 User:", user.role, user.id, user.kelas);

    let query = supabase
      .from("catatan_siswa")
      .select("*")
      .order("created_at", { ascending: false });

    // ✅ ROLE-BASED FILTERING
    if (user.role === "guru_kelas") {
      // Guru Kelas: HANYA catatan yang dibuat oleh dirinya sendiri
      // ⚠️ PENTING: class_id di database adalah VARCHAR, jadi jangan pakai parseInt!
      query = query
        .eq("teacher_id", user.id) // ✅ FILTER BY TEACHER ID
        .eq("class_id", user.kelas); // ✅ FILTER BY CLASS (STRING, bukan parseInt!)

      console.log(
        "👨‍🏫 Guru Kelas filter: teacher_id =",
        user.id,
        ", class_id =",
        user.kelas
      );
    } else if (user.role === "guru_mapel") {
      // Guru Mapel: catatan yang dibuat oleh dirinya sendiri
      query = query.eq("teacher_id", user.id);

      // Filter by kelas (optional untuk guru_mapel)
      if (filters.kelas && filters.kelas !== "") {
        query = query.eq("class_id", filters.kelas); // ✅ STRING juga
      }

      console.log("👨‍🏫 Guru Mapel filter: teacher_id =", user.id);
    }

    // ✅ FILTER BY SISWA (optional)
    if (filters.siswa && filters.siswa !== "") {
      query = query.eq("student_id", filters.siswa);
      console.log("👤 Student filter:", filters.siswa);
    }

    // ✅ FILTER BY KATEGORI (Case Insensitive)
    if (filters.kategori && filters.kategori !== "semua") {
      // Capitalize first letter untuk match database format
      const kategoriCapitalized =
        filters.kategori.charAt(0).toUpperCase() + filters.kategori.slice(1);
      query = query.eq("category", kategoriCapitalized);
      console.log("🏷️ Category filter:", kategoriCapitalized);
    }

    // ✅ FILTER BY PERIODE
    if (filters.periode && filters.periode !== "semua") {
      const dateRange = getDateRangeFromPeriode(filters.periode);
      if (dateRange.start) {
        query = query.gte("created_at", dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte("created_at", dateRange.end);
      }
      console.log("📅 Period filter:", dateRange);
    }

    const { data: notesData, error: notesError } = await query;

    if (notesError) {
      console.error("❌ Supabase error:", notesError);
      throw notesError;
    }

    console.log("✅ Raw notes data:", notesData?.length, "records");

    if (!notesData || notesData.length === 0) {
      console.warn("⚠️ No notes found");
      return [];
    }

    // ✅ FETCH RELATED STUDENTS AND TEACHERS
    const studentIds = [...new Set(notesData.map((n) => n.student_id))];
    const teacherIds = [...new Set(notesData.map((n) => n.teacher_id))];

    const [studentsResponse, teachersResponse] = await Promise.all([
      supabase
        .from("students")
        .select("id, nisn, nama_siswa, kelas")
        .in("id", studentIds),
      supabase
        .from("users")
        .select("id, full_name, username")
        .in("id", teacherIds),
    ]);

    // Create lookup maps
    const studentsMap = new Map(
      (studentsResponse.data || []).map((s) => [s.id, s])
    );
    const teachersMap = new Map(
      (teachersResponse.data || []).map((t) => [t.id, t])
    );

    // ✅ TRANSFORM DATA
    const transformedData = notesData.map((note) => {
      const student = studentsMap.get(note.student_id);
      const teacher = teachersMap.get(note.teacher_id);

      return {
        ...note,
        student_name: student?.nama_siswa || "Siswa tidak ditemukan",
        student_nisn: student?.nisn || "-",
        student_kelas: student?.kelas || "-",
        teacher_name: teacher?.full_name || "Guru tidak ditemukan",
        // showKelas: untuk guru_mapel perlu lihat kelas
        // showTeacher: untuk admin (bukan untuk guru_kelas karena semua catatan dari dia sendiri)
        showKelas: user.role === "guru_mapel",
        showTeacher: false, // ❌ Hapus showTeacher karena semua catatan dari guru tersebut
      };
    });

    console.log("🎯 Transformed notes:", transformedData.length, "records");

    return transformedData;
  } catch (error) {
    console.error("❌ Error in fetchNotesData:", error);
    throw new Error(`Gagal memuat catatan siswa: ${error.message}`);
  }
};

/**
 * ========================================
 * FETCH TEACHERS DATA
 * ========================================
 */
const fetchTeachersData = async (filters, user) => {
  try {
    let query = supabase
      .from("users")
      .select("*")
      .in("role", ["guru_kelas", "guru_mapel"])
      .order("full_name", { ascending: true });

    // Filter by status
    if (filters.statusGuru && filters.statusGuru !== "semua") {
      const isActive = filters.statusGuru === "aktif";
      query = query.eq("is_active", isActive);
    }

    // Filter by role
    if (filters.roleGuru && filters.roleGuru !== "semua") {
      query = query.eq("role", filters.roleGuru);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw new Error(`Gagal memuat data guru: ${error.message}`);
  }
};

/**
 * ========================================
 * HELPER FUNCTIONS
 * ========================================
 */
const getDateRangeFromPeriode = (periode) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  const toISODate = (d) => d.toISOString().split("T")[0];

  switch (periode) {
    case "minggu_ini": {
      const firstDayOfWeek = date - today.getDay();
      return {
        start: toISODate(new Date(year, month, firstDayOfWeek)),
        end: toISODate(today),
      };
    }

    case "bulan_ini":
      return {
        start: toISODate(new Date(year, month, 1)),
        end: toISODate(today),
      };

    case "semester": {
      const currentMonth = month + 1;
      if (currentMonth >= 7 && currentMonth <= 12) {
        return {
          start: `${year}-07-01`,
          end: `${year}-12-31`,
        };
      } else {
        return {
          start: `${year}-01-01`,
          end: `${year}-06-30`,
        };
      }
    }

    case "semua":
    default:
      return { start: null, end: null };
  }
};

export default useReportData;
