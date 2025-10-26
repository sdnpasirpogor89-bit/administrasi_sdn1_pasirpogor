// src/system/checkers/DataValidator.js
import { supabase } from "../../supabaseClient";

export async function checkDataValidation() {
  const startTime = Date.now();
  const issues = [];

  try {
    await validateStudents(issues);
    await validateUsers(issues);
    await validateAttendance(issues);
    await validateGrades(issues);
    await validateSiswaBaru(issues);

    return {
      success: true,
      issues,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      issues,
      executionTime: Date.now() - startTime,
    };
  }
}

async function validateStudents(issues) {
  try {
    const { data: students, error } = await supabase
      .from("students")
      .select("nisn, nama_siswa, jenis_kelamin, kelas, is_active");

    if (error) throw error;
    if (!students || students.length === 0) return;

    // Invalid NISN format (should be 9-10 digits)
    const invalidNisn = students.filter((s) => {
      if (!s.nisn) return false;
      const nisnStr = String(s.nisn).trim();
      return !/^\d{9,10}$/.test(nisnStr);
    });

    if (invalidNisn.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Invalid NISN format",
        details: `${invalidNisn.length} students with NISN not 9-10 digits`,
        table: "students",
        count: invalidNisn.length,
      });
    }

    // Invalid gender
    const validGenders = ["L", "P", "Laki-laki", "Perempuan"];
    const invalidGender = students.filter(
      (s) => s.jenis_kelamin && !validGenders.includes(s.jenis_kelamin)
    );

    if (invalidGender.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Invalid gender values",
        details: `${invalidGender.length} students with invalid gender`,
        table: "students",
        count: invalidGender.length,
      });
    }

    // Invalid class (should be 1-6 for SD)
    const invalidKelas = students.filter((s) => {
      if (!s.kelas) return false;
      const kelasNum = parseInt(s.kelas);
      return isNaN(kelasNum) || kelasNum < 1 || kelasNum > 6;
    });

    if (invalidKelas.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Invalid class values",
        details: `${invalidKelas.length} students with class not 1-6`,
        table: "students",
        count: invalidKelas.length,
      });
    }

    // Missing critical fields
    const missingData = students.filter(
      (s) => !s.nisn || !s.nama_siswa || !s.kelas
    );

    if (missingData.length > 0) {
      issues.push({
        category: "data",
        severity: "critical",
        message: "Missing required student data",
        details: `${missingData.length} students missing NISN, name, or class`,
        table: "students",
        count: missingData.length,
      });
    }

    // Name contains only numbers
    const invalidName = students.filter(
      (s) => s.nama_siswa && /^\d+$/.test(s.nama_siswa.trim())
    );

    if (invalidName.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Invalid student names",
        details: `${invalidName.length} students with numeric-only names`,
        table: "students",
        count: invalidName.length,
      });
    }

    // Inactive students with recent data
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    const inactiveStudents = students.filter((s) => s.is_active === false);
    if (inactiveStudents.length > 0) {
      const { data: recentAttendance } = await supabase
        .from("attendance")
        .select("nisn")
        .in(
          "nisn",
          inactiveStudents.map((s) => s.nisn)
        )
        .gte("tanggal", thirtyDaysAgo.toISOString());

      if (recentAttendance && recentAttendance.length > 0) {
        issues.push({
          category: "data",
          severity: "warning",
          message: "Inactive students with recent attendance",
          details: `${recentAttendance.length} inactive students have attendance in last 30 days`,
          table: "students",
          count: recentAttendance.length,
        });
      }
    }
  } catch (error) {
    issues.push({
      category: "data",
      severity: "critical",
      message: "Failed to validate students",
      details: error.message,
      table: "students",
      count: 1,
    });
  }
}

async function validateUsers(issues) {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select(
        "id, username, role, is_active, full_name, mata_pelajaran, kelas"
      );

    if (error) throw error;
    if (!users || users.length === 0) return;

    // Invalid roles
    const validRoles = [
      "admin",
      "guru",
      "siswa",
      "guru_kelas",
      "guru_mapel",
      "kepala_sekolah",
      "parent",
    ];
    const invalidRole = users.filter(
      (u) => u.role && !validRoles.includes(u.role)
    );

    if (invalidRole.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Invalid user roles",
        details: `${invalidRole.length} users with non-standard roles`,
        table: "users",
        count: invalidRole.length,
      });
    }

    // Missing username
    const missingUsername = users.filter(
      (u) => !u.username || u.username.trim() === ""
    );

    if (missingUsername.length > 0) {
      issues.push({
        category: "data",
        severity: "critical",
        message: "Users without username",
        details: `${missingUsername.length} users missing username`,
        table: "users",
        count: missingUsername.length,
      });
    }

    // Missing role
    const missingRole = users.filter((u) => !u.role);

    if (missingRole.length > 0) {
      issues.push({
        category: "data",
        severity: "critical",
        message: "Users without role",
        details: `${missingRole.length} users missing role - authorization will fail`,
        table: "users",
        count: missingRole.length,
      });
    }

    // Guru without mata_pelajaran
    const guruNoMapel = users.filter(
      (u) =>
        (u.role === "guru" || u.role === "guru_mapel") &&
        (!u.mata_pelajaran || u.mata_pelajaran.trim() === "")
    );

    if (guruNoMapel.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Teachers without subject",
        details: `${guruNoMapel.length} guru/guru_mapel without mata_pelajaran assigned`,
        table: "users",
        count: guruNoMapel.length,
      });
    }

    // Guru kelas without kelas
    const guruNoKelas = users.filter(
      (u) => u.role === "guru_kelas" && (!u.kelas || u.kelas.trim() === "")
    );

    if (guruNoKelas.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Class teachers without class",
        details: `${guruNoKelas.length} guru_kelas without kelas assigned`,
        table: "users",
        count: guruNoKelas.length,
      });
    }

    // Username too short (< 3 chars)
    const shortUsername = users.filter(
      (u) => u.username && u.username.trim().length < 3
    );

    if (shortUsername.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Usernames too short",
        details: `${shortUsername.length} users with username < 3 characters`,
        table: "users",
        count: shortUsername.length,
      });
    }
  } catch (error) {
    issues.push({
      category: "data",
      severity: "critical",
      message: "Failed to validate users",
      details: error.message,
      table: "users",
      count: 1,
    });
  }
}

async function validateAttendance(issues) {
  try {
    const { data: attendance, error } = await supabase
      .from("attendance")
      .select("id, nisn, nama_siswa, tanggal, status, kelas, jenis_presensi")
      .limit(1000);

    if (error) throw error;
    if (!attendance || attendance.length === 0) return;

    // Invalid status
    const validStatuses = [
      "Hadir",
      "Sakit",
      "Izin",
      "Alpa",
      "Terlambat",
      "hadir",
      "sakit",
      "izin",
      "alpa",
    ];
    const invalidStatus = attendance.filter(
      (a) => a.status && !validStatuses.includes(a.status)
    );

    if (invalidStatus.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Invalid attendance status",
        details: `${invalidStatus.length} records with invalid status`,
        table: "attendance",
        count: invalidStatus.length,
      });
    }

    // Future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const futureDates = attendance.filter(
      (a) => a.tanggal && new Date(a.tanggal) > today
    );

    if (futureDates.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Future attendance dates",
        details: `${futureDates.length} attendance records with future dates`,
        table: "attendance",
        count: futureDates.length,
      });
    }

    // Weekend attendance (Saturday=6, Sunday=0)
    const weekendAttendance = attendance.filter((a) => {
      if (!a.tanggal) return false;
      const day = new Date(a.tanggal).getDay();
      return day === 0 || day === 6;
    });

    if (weekendAttendance.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Weekend attendance records",
        details: `${weekendAttendance.length} attendance on Saturday/Sunday`,
        table: "attendance",
        count: weekendAttendance.length,
      });
    }

    // Missing critical fields
    const missingData = attendance.filter(
      (a) => !a.nisn || !a.tanggal || !a.status
    );

    if (missingData.length > 0) {
      issues.push({
        category: "data",
        severity: "critical",
        message: "Missing attendance data",
        details: `${missingData.length} records missing NISN, date, or status`,
        table: "attendance",
        count: missingData.length,
      });
    }
  } catch (error) {
    issues.push({
      category: "data",
      severity: "warning",
      message: "Failed to validate attendance",
      details: error.message,
      table: "attendance",
      count: 1,
    });
  }
}

async function validateGrades(issues) {
  try {
    const { data: grades, error } = await supabase
      .from("nilai")
      .select(
        "id, nisn, nama_siswa, mata_pelajaran, jenis_nilai, nilai, guru_input, tanggal"
      )
      .limit(1000);

    if (error) throw error;
    if (!grades || grades.length === 0) return;

    // Invalid grade values
    const invalidGrades = grades.filter(
      (g) =>
        g.nilai !== null && (isNaN(g.nilai) || g.nilai < 0 || g.nilai > 100)
    );

    if (invalidGrades.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Invalid grade values",
        details: `${invalidGrades.length} grades outside 0-100 range`,
        table: "nilai",
        count: invalidGrades.length,
      });
    }

    // Too many perfect scores (suspicious)
    const perfectScores = grades.filter((g) => g.nilai === 100);
    const perfectRatio = perfectScores.length / grades.length;

    if (perfectRatio > 0.3 && grades.length > 20) {
      issues.push({
        category: "data",
        severity: "info",
        message: "High perfect score ratio",
        details: `${Math.round(perfectRatio * 100)}% of grades are 100 (${
          perfectScores.length
        }/${grades.length})`,
        table: "nilai",
        count: perfectScores.length,
      });
    }

    // Too many zeros (suspicious)
    const zeroScores = grades.filter((g) => g.nilai === 0);
    const zeroRatio = zeroScores.length / grades.length;

    if (zeroRatio > 0.2 && grades.length > 20) {
      issues.push({
        category: "data",
        severity: "info",
        message: "High zero score ratio",
        details: `${Math.round(zeroRatio * 100)}% of grades are 0 (${
          zeroScores.length
        }/${grades.length})`,
        table: "nilai",
        count: zeroScores.length,
      });
    }

    // Future dates
    const today = new Date();
    const futureDates = grades.filter(
      (g) => g.tanggal && new Date(g.tanggal) > today
    );

    if (futureDates.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Future grade dates",
        details: `${futureDates.length} grades with future dates`,
        table: "nilai",
        count: futureDates.length,
      });
    }

    // Missing critical fields
    const missingData = grades.filter(
      (g) => !g.nisn || !g.mata_pelajaran || g.nilai === null
    );

    if (missingData.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Missing grade data",
        details: `${missingData.length} records missing NISN, subject, or value`,
        table: "nilai",
        count: missingData.length,
      });
    }
  } catch (error) {
    issues.push({
      category: "data",
      severity: "warning",
      message: "Failed to validate grades",
      details: error.message,
      table: "nilai",
      count: 1,
    });
  }
}

async function validateSiswaBaru(issues) {
  try {
    const { data: siswaBaru, error } = await supabase
      .from("siswa_baru")
      .select(
        "id, nama_lengkap, jenis_kelamin, tanggal_lahir, status, no_hp, nisn, tanggal_daftar"
      );

    if (error) throw error;
    if (!siswaBaru || siswaBaru.length === 0) return;

    // Invalid gender
    const validGenders = ["L", "P", "Laki-laki", "Perempuan"];
    const invalidGender = siswaBaru.filter(
      (s) => s.jenis_kelamin && !validGenders.includes(s.jenis_kelamin)
    );

    if (invalidGender.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Invalid gender in siswa_baru",
        details: `${invalidGender.length} registrations with invalid gender`,
        table: "siswa_baru",
        count: invalidGender.length,
      });
    }

    // Invalid phone format
    const invalidPhone = siswaBaru.filter((s) => {
      if (!s.no_hp) return false;
      const phone = String(s.no_hp).replace(/\D/g, "");
      return phone.length < 10 || phone.length > 15;
    });

    if (invalidPhone.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Invalid phone numbers",
        details: `${invalidPhone.length} registrations with invalid phone format`,
        table: "siswa_baru",
        count: invalidPhone.length,
      });
    }

    // Old pending registrations (> 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldPending = siswaBaru.filter(
      (s) =>
        s.status === "pending" &&
        s.tanggal_daftar &&
        new Date(s.tanggal_daftar) < thirtyDaysAgo
    );

    if (oldPending.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Old pending registrations",
        details: `${oldPending.length} pending registrations older than 30 days`,
        table: "siswa_baru",
        count: oldPending.length,
      });
    }

    // Future birth dates
    const today = new Date();
    const futureBirthDates = siswaBaru.filter(
      (s) => s.tanggal_lahir && new Date(s.tanggal_lahir) > today
    );

    if (futureBirthDates.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Future birth dates",
        details: `${futureBirthDates.length} registrations with future birth dates`,
        table: "siswa_baru",
        count: futureBirthDates.length,
      });
    }

    // Too young (< 5 years old)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const tooYoung = siswaBaru.filter(
      (s) => s.tanggal_lahir && new Date(s.tanggal_lahir) > fiveYearsAgo
    );

    if (tooYoung.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Registrations too young",
        details: `${tooYoung.length} registrations under 5 years old`,
        table: "siswa_baru",
        count: tooYoung.length,
      });
    }

    // Missing critical fields
    const missingData = siswaBaru.filter(
      (s) => !s.nama_lengkap || !s.jenis_kelamin || !s.tanggal_lahir
    );

    if (missingData.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Missing siswa_baru data",
        details: `${missingData.length} registrations missing name, gender, or birth date`,
        table: "siswa_baru",
        count: missingData.length,
      });
    }
  } catch (error) {
    issues.push({
      category: "data",
      severity: "warning",
      message: "Failed to validate siswa_baru",
      details: error.message,
      table: "siswa_baru",
      count: 1,
    });
  }
}

export default checkDataValidation;
