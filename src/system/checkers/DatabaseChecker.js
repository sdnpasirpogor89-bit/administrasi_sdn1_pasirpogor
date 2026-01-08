// src/system/checkers/DatabaseChecker.js
import { supabase } from "../../supabaseClient";

const CRITICAL_TABLES = [
  "users",
  "students",
  "attendance",
  "nilai",
  "announcement",
  "school_settings",
  "siswa_baru",
  "catatan_siswa",
  "system_health_logs",
];

export const checkDatabase = async () => {
  const issues = [];
  const startTime = Date.now();

  try {
    const connectionCheck = await checkConnection();
    if (!connectionCheck.success) {
      issues.push({
        category: "database",
        severity: "critical",
        message: "Database connection failed",
        details: connectionCheck.error,
        table: "connection",
        count: 1,
      });
      return { success: false, issues, executionTime: Date.now() - startTime };
    }

    const tableChecks = await checkTablesExist();
    issues.push(...tableChecks);

    const orphanedChecks = await checkOrphanedRecords();
    issues.push(...orphanedChecks);

    const constraintChecks = await checkConstraints();
    issues.push(...constraintChecks);

    const duplicateChecks = await checkDuplicates();
    issues.push(...duplicateChecks);

    return { success: true, issues, executionTime: Date.now() - startTime };
  } catch (error) {
    return {
      success: false,
      issues: [
        {
          category: "database",
          severity: "critical",
          message: "Database checker failed",
          details: error.message,
          table: "system",
          count: 1,
        },
      ],
      executionTime: Date.now() - startTime,
    };
  }
};

const checkConnection = async () => {
  try {
    const { error } = await supabase.from("students").select("id").limit(1);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const checkTablesExist = async () => {
  const issues = [];
  for (const tableName of CRITICAL_TABLES) {
    try {
      const { error } = await supabase.from(tableName).select("id").limit(1);
      if (error) {
        issues.push({
          category: "database",
          severity: "critical",
          message: `Table '${tableName}' not accessible`,
          details: error.message,
          table: tableName,
          count: 1,
        });
      }
    } catch (error) {
      issues.push({
        category: "database",
        severity: "critical",
        message: `Failed to check table '${tableName}'`,
        details: error.message,
        table: tableName,
        count: 1,
      });
    }
  }
  return issues;
};

const checkOrphanedRecords = async () => {
  const issues = [];

  try {
    // Check attendance orphans
    const { data: attendances } = await supabase
      .from("attendance")
      .select("nisn")
      .not("nisn", "is", null)
      .limit(1000); // ✅ Limit untuk sampling

    if (attendances && attendances.length > 0) {
      const nisnList = [...new Set(attendances.map((a) => a.nisn))];
      const { data: students } = await supabase
        .from("students")
        .select("nisn")
        .in("nisn", nisnList);

      const validNisns = new Set(students?.map((s) => s.nisn) || []);
      const orphaned = attendances.filter(
        (a) => !validNisns.has(a.nisn)
      ).length;

      if (orphaned > 0) {
        issues.push({
          category: "database",
          severity: "warning",
          message: "Orphaned attendance records",
          details: `${orphaned} attendance records reference non-existent students`,
          table: "attendance",
          count: orphaned,
        });
      }
    }

    // Check nilai orphans
    const { data: nilai } = await supabase
      .from("nilai")
      .select("nisn")
      .not("nisn", "is", null)
      .limit(1000); // ✅ Limit

    if (nilai && nilai.length > 0) {
      const nisnList = [...new Set(nilai.map((n) => n.nisn))];
      const { data: students } = await supabase
        .from("students")
        .select("nisn")
        .in("nisn", nisnList);

      const validNisns = new Set(students?.map((s) => s.nisn) || []);
      const orphaned = nilai.filter((n) => !validNisns.has(n.nisn)).length;

      if (orphaned > 0) {
        issues.push({
          category: "database",
          severity: "warning",
          message: "Orphaned grade records",
          details: `${orphaned} nilai records reference non-existent students`,
          table: "nilai",
          count: orphaned,
        });
      }
    }

    // Check siswa_baru orphans
    const { data: siswaBaru } = await supabase
      .from("siswa_baru")
      .select("user_id")
      .not("user_id", "is", null)
      .limit(500); // ✅ Limit

    if (siswaBaru && siswaBaru.length > 0) {
      const userIds = [...new Set(siswaBaru.map((s) => s.user_id))];
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .in("id", userIds);

      const validUserIds = new Set(users?.map((u) => u.id) || []);
      const orphaned = siswaBaru.filter(
        (s) => !validUserIds.has(s.user_id)
      ).length;

      if (orphaned > 0) {
        issues.push({
          category: "database",
          severity: "warning",
          message: "Orphaned siswa_baru records",
          details: `${orphaned} siswa_baru records reference non-existent users`,
          table: "siswa_baru",
          count: orphaned,
        });
      }
    }

    // Check catatan_siswa orphans
    const { data: catatan } = await supabase
      .from("catatan_siswa")
      .select("student_id, teacher_id")
      .limit(500); // ✅ Limit

    if (catatan && catatan.length > 0) {
      const studentIds = [
        ...new Set(catatan.map((c) => c.student_id).filter(Boolean)),
      ];
      const teacherIds = [
        ...new Set(catatan.map((c) => c.teacher_id).filter(Boolean)),
      ];

      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("id")
          .in("id", studentIds);

        const validStudentIds = new Set(students?.map((s) => s.id) || []);
        const orphaned = catatan.filter(
          (c) => c.student_id && !validStudentIds.has(c.student_id)
        ).length;

        if (orphaned > 0) {
          issues.push({
            category: "database",
            severity: "warning",
            message: "Orphaned catatan_siswa (student)",
            details: `${orphaned} catatan_siswa records reference non-existent students`,
            table: "catatan_siswa",
            count: orphaned,
          });
        }
      }

      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from("users")
          .select("id")
          .in("id", teacherIds);

        const validTeacherIds = new Set(teachers?.map((t) => t.id) || []);
        const orphaned = catatan.filter(
          (c) => c.teacher_id && !validTeacherIds.has(c.teacher_id)
        ).length;

        if (orphaned > 0) {
          issues.push({
            category: "database",
            severity: "warning",
            message: "Orphaned catatan_siswa (teacher)",
            details: `${orphaned} catatan_siswa records reference non-existent teachers`,
            table: "catatan_siswa",
            count: orphaned,
          });
        }
      }
    }
  } catch (error) {
    issues.push({
      category: "database",
      severity: "info",
      message: "Orphaned check incomplete",
      details: error.message,
      table: "system",
      count: 1,
    });
  }

  return issues;
};

const checkConstraints = async () => {
  const issues = [];

  try {
    // Students without name
    const { count: noName } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .or("nama_siswa.is.null,nama_siswa.eq.");

    if (noName > 0) {
      issues.push({
        category: "database",
        severity: "critical",
        message: "Students missing names",
        details: `${noName} students without nama_siswa`,
        table: "students",
        count: noName,
      });
    }

    // Students without NISN
    const { count: noNisn } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .or("nisn.is.null,nisn.eq.");

    if (noNisn > 0) {
      issues.push({
        category: "database",
        severity: "warning",
        message: "Students missing NISN",
        details: `${noNisn} students without NISN`,
        table: "students",
        count: noNisn,
      });
    }

    // Invalid gender
    const { count: invalidGender } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .not("jenis_kelamin", "in", '("Laki-laki","Perempuan")');

    if (invalidGender > 0) {
      issues.push({
        category: "database",
        severity: "warning",
        message: "Invalid gender values",
        details: `${invalidGender} students with gender not Laki-laki or Perempuan`,
        table: "students",
        count: invalidGender,
      });
    }

    // Users without username
    const { count: noUsername } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .or("username.is.null,username.eq.");

    if (noUsername > 0) {
      issues.push({
        category: "database",
        severity: "critical",
        message: "Users missing username",
        details: `${noUsername} users without username - login will fail`,
        table: "users",
        count: noUsername,
      });
    }

    // Users without password
    const { count: noPassword } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .or("password.is.null,password.eq.");

    if (noPassword > 0) {
      issues.push({
        category: "database",
        severity: "critical",
        message: "Users missing password",
        details: `${noPassword} users without password - login will fail`,
        table: "users",
        count: noPassword,
      });
    }

    // Users without role
    const { count: noRole } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .or("role.is.null,role.eq.");

    if (noRole > 0) {
      issues.push({
        category: "database",
        severity: "critical",
        message: "Users missing role",
        details: `${noRole} users without role - authorization will fail`,
        table: "users",
        count: noRole,
      });
    }

    // Invalid nilai scores
    const { count: invalidScores } = await supabase
      .from("nilai")
      .select("*", { count: "exact", head: true })
      .or("nilai.lt.0,nilai.gt.100");

    if (invalidScores > 0) {
      issues.push({
        category: "database",
        severity: "warning",
        message: "Invalid grade scores",
        details: `${invalidScores} grades outside 0-100 range`,
        table: "nilai",
        count: invalidScores,
      });
    }

    // Invalid attendance status
    const { count: invalidStatus } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .not("status", "in", '("Hadir","Sakit","Izin","Alpa")');

    if (invalidStatus > 0) {
      issues.push({
        category: "database",
        severity: "warning",
        message: "Invalid attendance status",
        details: `${invalidStatus} attendance with status not Hadir/Sakit/Izin/Alpa`,
        table: "attendance",
        count: invalidStatus,
      });
    }

    // Siswa baru without contact
    const { count: noContact } = await supabase
      .from("siswa_baru")
      .select("*", { count: "exact", head: true })
      .or("no_hp.is.null,no_hp.eq.");

    if (noContact > 0) {
      issues.push({
        category: "database",
        severity: "warning",
        message: "Siswa baru without contact",
        details: `${noContact} siswa_baru without phone number`,
        table: "siswa_baru",
        count: noContact,
      });
    }
  } catch (error) {
    issues.push({
      category: "database",
      severity: "info",
      message: "Constraint check incomplete",
      details: error.message,
      table: "system",
      count: 1,
    });
  }

  return issues;
};

const checkDuplicates = async () => {
  const issues = [];

  try {
    // Duplicate NISN
    const { data: students } = await supabase
      .from("students")
      .select("nisn")
      .not("nisn", "is", null)
      .neq("nisn", "")
      .limit(2000); // ✅ Limit - students biasanya banyak

    if (students) {
      const nisnCount = {};
      students.forEach((s) => {
        nisnCount[s.nisn] = (nisnCount[s.nisn] || 0) + 1;
      });

      const duplicates = Object.entries(nisnCount).filter(
        ([, count]) => count > 1
      );
      if (duplicates.length > 0) {
        const total = duplicates.reduce((sum, [, count]) => sum + count, 0);
        issues.push({
          category: "database",
          severity: "critical",
          message: "Duplicate NISN in students",
          details: `${duplicates.length} duplicate NISN: ${duplicates
            .slice(0, 3)
            .map(([nisn, cnt]) => `${nisn}(${cnt}x)`)
            .join(", ")}`,
          table: "students",
          count: total,
        });
      }
    }

    // Duplicate usernames
    const { data: users } = await supabase
      .from("users")
      .select("username")
      .not("username", "is", null)
      .neq("username", "")
      .limit(500); // ✅ Limit

    if (users) {
      const usernameCount = {};
      users.forEach((u) => {
        usernameCount[u.username] = (usernameCount[u.username] || 0) + 1;
      });

      const duplicates = Object.entries(usernameCount).filter(
        ([, count]) => count > 1
      );
      if (duplicates.length > 0) {
        const total = duplicates.reduce((sum, [, count]) => sum + count, 0);
        issues.push({
          category: "database",
          severity: "critical",
          message: "Duplicate usernames",
          details: `${
            duplicates.length
          } duplicate usernames - login issues: ${duplicates
            .slice(0, 3)
            .map(([usr, cnt]) => `${usr}(${cnt}x)`)
            .join(", ")}`,
          table: "users",
          count: total,
        });
      }
    }

    // Duplicate attendance - FIXED
    const thirtyDaysAgoAttendance = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0];

    const { data: attendance } = await supabase
      .from("attendance")
      .select("nisn, tanggal, jenis_presensi, kelas, tahun_ajaran, semester")
      .not("nisn", "is", null)
      .not("tanggal", "is", null)
      .gte("tanggal", thirtyDaysAgoAttendance) // ✅ Ganti nama
      .limit(2000);

    if (attendance) {
      const keys = {};
      attendance.forEach((a) => {
        // ✅ Key HARUS SAMA dengan UNIQUE CONSTRAINT!
        const key = `${a.nisn}|${a.tanggal}|${a.jenis_presensi || "default"}|${
          a.kelas
        }|${a.tahun_ajaran}|${a.semester}`;
        keys[key] = (keys[key] || 0) + 1;
      });

      const duplicates = Object.entries(keys).filter(([, count]) => count > 1);
      if (duplicates.length > 0) {
        issues.push({
          category: "database",
          severity: "warning",
          message: "Duplicate attendance entries",
          details: `${duplicates.length} duplicate attendance (same student/date/type/class)`,
          table: "attendance",
          count: duplicates.length,
        });
      }
    }
  } catch (error) {
    issues.push({
      category: "database",
      severity: "info",
      message: "Duplicate check incomplete",
      details: error.message,
      table: "system",
      count: 1,
    });
  }

  return issues;
};

export default checkDatabase;
