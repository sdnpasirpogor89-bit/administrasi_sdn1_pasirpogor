// src/system/checkers/BusinessLogicChecker.js
import { supabase } from "../../supabaseClient";

export const checkBusinessLogic = async () => {
  const issues = [];
  const startTime = Date.now();

  try {
    const attendanceIssues = await checkAttendanceLogic();
    issues.push(...attendanceIssues);

    const gradeIssues = await checkGradeLogic();
    issues.push(...gradeIssues);

    const studentIssues = await checkStudentLogic();
    issues.push(...studentIssues);

    const userIssues = await checkUserLogic();
    issues.push(...userIssues);

    const siswaBaruIssues = await checkSiswaBaru();
    issues.push(...siswaBaruIssues);

    return {
      success: true,
      issues,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      issues: [
        {
          category: "business_logic",
          severity: "critical",
          message: "Business logic checker failed",
          details: error.message,
          table: "system",
          count: 1,
        },
      ],
      executionTime: Date.now() - startTime,
    };
  }
};

const checkAttendanceLogic = async () => {
  const issues = [];

  try {
    // Attendance for inactive students
    const { data: attendance } = await supabase
      .from("attendance")
      .select("nisn")
      .not("nisn", "is", null)
      .limit(200);

    if (attendance && attendance.length > 0) {
      const nisnList = [...new Set(attendance.map((a) => a.nisn))];

      const { data: students } = await supabase
        .from("students")
        .select("nisn, is_active")
        .in("nisn", nisnList);

      if (students) {
        const inactiveNisns = new Set(
          students.filter((s) => s.is_active === false).map((s) => s.nisn)
        );

        const count = attendance.filter((a) =>
          inactiveNisns.has(a.nisn)
        ).length;

        if (count > 0) {
          issues.push({
            category: "business_logic",
            severity: "info",
            message: "Attendance for inactive students",
            details: `${count} attendance records for inactive students`,
            table: "attendance",
            count: count,
          });
        }
      }
    }

    // Weekend attendance
    const { data: recentAttendance } = await supabase
      .from("attendance")
      .select("tanggal")
      .gte(
        "tanggal",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .not("tanggal", "is", null);

    if (recentAttendance) {
      const weekendCount = recentAttendance.filter((a) => {
        const day = new Date(a.tanggal).getDay();
        return day === 0 || day === 6;
      }).length;

      if (weekendCount > 0) {
        issues.push({
          category: "business_logic",
          severity: "info",
          message: "Weekend attendance detected",
          details: `${weekendCount} attendance records on Saturday/Sunday`,
          table: "attendance",
          count: weekendCount,
        });
      }
    }

    // Low attendance rate per class
    const { data: allAttendance } = await supabase
      .from("attendance")
      .select("kelas, status")
      .gte(
        "tanggal",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      );

    if (allAttendance && allAttendance.length > 0) {
      const classSummary = {};

      allAttendance.forEach((a) => {
        if (!a.kelas) return;
        if (!classSummary[a.kelas]) {
          classSummary[a.kelas] = { total: 0, hadir: 0 };
        }
        classSummary[a.kelas].total++;
        if (a.status === "Hadir" || a.status === "hadir") {
          classSummary[a.kelas].hadir++;
        }
      });

      const lowAttendanceClasses = Object.entries(classSummary).filter(
        ([kelas, stats]) => {
          const rate = stats.hadir / stats.total;
          return rate < 0.75 && stats.total > 20;
        }
      );

      if (lowAttendanceClasses.length > 0) {
        const details = lowAttendanceClasses
          .map(([kelas, stats]) => {
            const rate = Math.round((stats.hadir / stats.total) * 100);
            return `${kelas} (${rate}%)`;
          })
          .join(", ");

        issues.push({
          category: "business_logic",
          severity: "info",
          message: "Low attendance rate detected",
          details: `Classes with <75% attendance (last 30 days): ${details}`,
          table: "attendance",
          count: lowAttendanceClasses.length,
        });
      }
    }
  } catch (error) {
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Attendance logic check incomplete",
      details: error.message,
      table: "attendance",
      count: 1,
    });
  }

  return issues;
};

const checkGradeLogic = async () => {
  const issues = [];

  try {
    // Grades for inactive students
    const { data: grades } = await supabase
      .from("nilai")
      .select("nisn")
      .gte(
        "tanggal",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .not("nisn", "is", null);

    if (grades && grades.length > 0) {
      const nisnList = [...new Set(grades.map((g) => g.nisn))];

      const { data: students } = await supabase
        .from("students")
        .select("nisn, is_active")
        .in("nisn", nisnList);

      if (students) {
        const inactiveNisns = new Set(
          students.filter((s) => s.is_active === false).map((s) => s.nisn)
        );

        const count = grades.filter((g) => inactiveNisns.has(g.nisn)).length;

        if (count > 0) {
          issues.push({
            category: "business_logic",
            severity: "info",
            message: "Recent grades for inactive students",
            details: `${count} grades (last 90 days) for inactive students`,
            table: "nilai",
            count: count,
          });
        }
      }
    }

    // Grades without attendance
    // Grades without attendance - OPTIMIZED!
    const { data: recentGrades } = await supabase
      .from("nilai")
      .select("nisn, tanggal, mata_pelajaran")
      .gte(
        "tanggal",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .not("nisn", "is", null)
      .not("tanggal", "is", null)
      .limit(100); // Kurangi dari 500 ke 100

    if (recentGrades && recentGrades.length > 0) {
      // ✅ OPTIMIZED: Fetch semua attendance sekaligus dengan IN query
      const gradeKeys = recentGrades.map((g) => `${g.nisn}|${g.tanggal}`);

      const { data: matchingAttendance } = await supabase
        .from("attendance")
        .select("nisn, tanggal")
        .in("nisn", [...new Set(recentGrades.map((g) => g.nisn))])
        .gte(
          "tanggal",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        );

      // Build set of existing attendance
      const attendanceSet = new Set(
        (matchingAttendance || []).map((a) => `${a.nisn}|${a.tanggal}`)
      );

      // Count grades without matching attendance
      const noAttendanceCount = recentGrades.filter(
        (g) => !attendanceSet.has(`${g.nisn}|${g.tanggal}`)
      ).length;

      if (noAttendanceCount > 10) {
        issues.push({
          category: "business_logic",
          severity: "info",
          message: "Grades without attendance",
          details: `${noAttendanceCount} students received grades without attendance record on same day`,
          table: "nilai",
          count: noAttendanceCount,
        });
      }
    }

    // Teacher grading wrong subject
    const { data: allGrades } = await supabase
      .from("nilai")
      .select("guru_input, mata_pelajaran")
      .not("guru_input", "is", null)
      .not("mata_pelajaran", "is", null)
      .limit(500);

    if (allGrades && allGrades.length > 0) {
      const guruList = [...new Set(allGrades.map((g) => g.guru_input))];

      const { data: teachers } = await supabase
        .from("users")
        .select("username, mata_pelajaran")
        .in("username", guruList)
        .not("mata_pelajaran", "is", null);

      if (teachers) {
        const teacherSubjects = new Map(
          teachers.map((t) => [t.username, t.mata_pelajaran])
        );

        const mismatchCount = allGrades.filter((g) => {
          const assignedSubject = teacherSubjects.get(g.guru_input);
          return assignedSubject && assignedSubject !== g.mata_pelajaran;
        }).length;

        if (mismatchCount > 0) {
          issues.push({
            category: "business_logic",
            severity: "warning",
            message: "Teachers grading wrong subject",
            details: `${mismatchCount} grades input by teachers for subjects not assigned to them`,
            table: "nilai",
            count: mismatchCount,
          });
        }
      }
    }
  } catch (error) {
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Grade logic check incomplete",
      details: error.message,
      table: "nilai",
      count: 1,
    });
  }

  return issues;
};

const checkStudentLogic = async () => {
  const issues = [];

  try {
    // Active students without class
    const { count: noClass } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .or("kelas.is.null,kelas.eq.");

    if (noClass > 0) {
      issues.push({
        category: "business_logic",
        severity: "warning",
        message: "Active students without class",
        details: `${noClass} active students not assigned to any class`,
        table: "students",
        count: noClass,
      });
    }

    // Students in same class with big age gap
    const { data: students } = await supabase
      .from("students")
      .select("kelas, created_at")
      .eq("is_active", true)
      .not("kelas", "is", null);

    if (students && students.length > 0) {
      const classGroups = {};

      students.forEach((s) => {
        if (!classGroups[s.kelas]) classGroups[s.kelas] = [];
        classGroups[s.kelas].push(new Date(s.created_at));
      });

      // Check if class has students from very different enrollment periods
      const suspiciousClasses = Object.entries(classGroups).filter(
        ([kelas, dates]) => {
          if (dates.length < 5) return false;
          const sorted = dates.sort((a, b) => a - b);
          const oldest = sorted[0];
          const newest = sorted[sorted.length - 1];
          const yearsDiff = (newest - oldest) / (365 * 24 * 60 * 60 * 1000);
          return yearsDiff > 3;
        }
      );

      if (suspiciousClasses.length > 0) {
        issues.push({
          category: "business_logic",
          severity: "info",
          message: "Classes with mixed enrollment periods",
          details: `${suspiciousClasses.length} classes have students from different enrollment periods (>3 years gap)`,
          table: "students",
          count: suspiciousClasses.length,
        });
      }
    }
  } catch (error) {
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Student logic check incomplete",
      details: error.message,
      table: "students",
      count: 1,
    });
  }

  return issues;
};

const checkUserLogic = async () => {
  const issues = [];

  try {
    // Active users without role
    const { count: noRole } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .or("role.is.null,role.eq.");

    if (noRole > 0) {
      issues.push({
        category: "business_logic",
        severity: "warning",
        message: "Active users without role",
        details: `${noRole} active users without role assignment`,
        table: "users",
        count: noRole,
      });
    }

    // Guru without mata_pelajaran
    const { count: guruNoSubject } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("role", ["guru", "guru_mapel"])
      .eq("is_active", true)
      .or("mata_pelajaran.is.null,mata_pelajaran.eq.");

    if (guruNoSubject > 0) {
      issues.push({
        category: "business_logic",
        severity: "info",
        message: "Teachers without subject",
        details: `${guruNoSubject} guru accounts without mata_pelajaran`,
        table: "users",
        count: guruNoSubject,
      });
    }

    // Guru_kelas without kelas
    const { count: guruNoClass } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "guru_kelas")
      .eq("is_active", true)
      .or("kelas.is.null,kelas.eq.");

    if (guruNoClass > 0) {
      issues.push({
        category: "business_logic",
        severity: "warning",
        message: "Class teachers without class",
        details: `${guruNoClass} guru_kelas without kelas assignment`,
        table: "users",
        count: guruNoClass,
      });
    }

    // Inactive users with recent activity
    const { data: inactiveUsers } = await supabase
      .from("users")
      .select("id, username")
      .eq("is_active", false);

    if (inactiveUsers && inactiveUsers.length > 0) {
      const usernames = inactiveUsers.map((u) => u.username);

      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: recentActivity } = await supabase
        .from("attendance")
        .select("guru_input")
        .in("guru_input", usernames)
        .gte("created_at", thirtyDaysAgo);

      if (recentActivity && recentActivity.length > 0) {
        const activeInactiveUsers = [
          ...new Set(recentActivity.map((a) => a.guru_input)),
        ].length;

        issues.push({
          category: "business_logic",
          severity: "info",
          message: "Inactive users with recent activity",
          details: `${activeInactiveUsers} inactive users have recent activity in last 30 days`,
          table: "users",
          count: activeInactiveUsers,
        });
      }
    }
  } catch (error) {
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "User logic check incomplete",
      details: error.message,
      table: "users",
      count: 1,
    });
  }

  return issues;
};

const checkSiswaBaru = async () => {
  const issues = [];

  try {
    // Old pending registrations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: oldPending } = await supabase
      .from("siswa_baru")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("tanggal_daftar", thirtyDaysAgo.toISOString());

    if (oldPending > 0) {
      issues.push({
        category: "business_logic",
        severity: "info",
        message: "Old pending registrations",
        details: `${oldPending} pending registrations older than 30 days`,
        table: "siswa_baru",
        count: oldPending,
      });
    }

    // Siswa baru with duplicate NISN in students
    const { data: siswaBaru } = await supabase
      .from("siswa_baru")
      .select("nisn")
      .not("nisn", "is", null)
      .neq("nisn", "");

    if (siswaBaru && siswaBaru.length > 0) {
      const nisnList = siswaBaru.map((s) => s.nisn);

      const { data: existingStudents } = await supabase
        .from("students")
        .select("nisn")
        .in("nisn", nisnList);

      if (existingStudents && existingStudents.length > 0) {
        issues.push({
          category: "business_logic",
          severity: "warning",
          message: "Siswa baru with existing NISN",
          details: `${existingStudents.length} siswa_baru have NISN already in students table`,
          table: "siswa_baru",
          count: existingStudents.length,
        });
      }
    }
  } catch (error) {
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Siswa baru check incomplete",
      details: error.message,
      table: "siswa_baru",
      count: 1,
    });
  }

  return issues;
};

export default checkBusinessLogic;
