// src/system/checkers/AppHealthChecker.js
import { supabase } from '../../supabaseClient';

export async function checkAppHealth() {
  const startTime = Date.now();
  const issues = [];

  try {
    await checkInactiveRecords(issues);
    await checkRecentActivity(issues);
    await checkSystemSettings(issues);
    await checkUserAccounts(issues);
    await checkDataVolume(issues);
    await checkPerformanceIndicators(issues);
    await checkDataFreshness(issues);
    await checkHealthLogs(issues);

    return {
      success: true,
      issues,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      issues,
      executionTime: Date.now() - startTime
    };
  }
}

async function checkInactiveRecords(issues) {
  try {
    const { count: inactiveStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    if (inactiveStudents > 20) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'High number of inactive students',
        details: `${inactiveStudents} inactive students - consider archiving`,
        table: 'students',
        count: inactiveStudents
      });
    }

    const { count: inactiveUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    if (inactiveUsers > 10) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'Multiple inactive user accounts',
        details: `${inactiveUsers} inactive users - review and cleanup`,
        table: 'users',
        count: inactiveUsers
      });
    }

  } catch (error) {
    console.error('Error checking inactive records:', error);
  }
}

async function checkRecentActivity(issues) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Recent attendance
    const { count: recentAttendance } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .gte('tanggal', sevenDaysAgo.toISOString().split('T')[0]);

    if (recentAttendance === 0) {
      issues.push({
        category: 'app_health',
        severity: 'critical',
        message: 'No recent attendance records',
        details: 'No attendance recorded in last 7 days - system may not be in use',
        table: 'attendance',
        count: 0
      });
    }

    // Recent grades
    const { count: recentGrades } = await supabase
      .from('nilai')
      .select('*', { count: 'exact', head: true })
      .gte('tanggal', thirtyDaysAgo.toISOString().split('T')[0]);

    if (recentGrades === 0) {
      issues.push({
        category: 'app_health',
        severity: 'warning',
        message: 'No recent grade entries',
        details: 'No grades recorded in last 30 days',
        table: 'nilai',
        count: 0
      });
    }

    // Check announcement freshness
    const { data: announcements } = await supabase
      .from('announcement')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (announcements && announcements.length > 0) {
      const lastAnnouncement = new Date(announcements[0].created_at);
      const daysSince = Math.floor((Date.now() - lastAnnouncement) / (1000 * 60 * 60 * 24));
      
      if (daysSince > 90) {
        issues.push({
          category: 'app_health',
          severity: 'info',
          message: 'Old announcements',
          details: `Last announcement was ${daysSince} days ago`,
          table: 'announcement',
          count: 1
        });
      }
    }

  } catch (error) {
    console.error('Error checking recent activity:', error);
  }
}

async function checkSystemSettings(issues) {
  try {
    const { data: settings } = await supabase
      .from('school_settings')
      .select('setting_key, setting_value');

    if (!settings) return;

    const critical = ['semester_aktif', 'academic_year'];
    const recommended = ['school_name', 'school_address', 'school_phone'];

    const existingKeys = settings.map(s => s.setting_key);
    
    const missingCritical = critical.filter(k => !existingKeys.includes(k));
    if (missingCritical.length > 0) {
      issues.push({
        category: 'app_health',
        severity: 'warning',
        message: 'Missing critical settings',
        details: `Missing: ${missingCritical.join(', ')}`,
        table: 'school_settings',
        count: missingCritical.length
      });
    }

    const missingRecommended = recommended.filter(k => !existingKeys.includes(k));
    if (missingRecommended.length > 0) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'Missing recommended settings',
        details: `Consider adding: ${missingRecommended.join(', ')}`,
        table: 'school_settings',
        count: missingRecommended.length
      });
    }

    const emptySettings = settings.filter(s => !s.setting_value || s.setting_value.trim() === '');
    if (emptySettings.length > 0) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'Settings with empty values',
        details: `${emptySettings.length} settings need values: ${emptySettings.map(s => s.setting_key).join(', ')}`,
        table: 'school_settings',
        count: emptySettings.length
      });
    }

  } catch (error) {
    console.error('Error checking system settings:', error);
  }
}

async function checkUserAccounts(issues) {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, username, role, is_active');

    if (!users) return;

    // Active admins
    const activeAdmins = users.filter(u => u.role === 'admin' && u.is_active).length;
    
    if (activeAdmins === 0) {
      issues.push({
        category: 'app_health',
        severity: 'critical',
        message: 'No active admin accounts',
        details: 'System has no active admin - critical security issue',
        table: 'users',
        count: 0
      });
    } else if (activeAdmins === 1) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'Single admin account',
        details: 'Consider creating backup admin for redundancy',
        table: 'users',
        count: 1
      });
    }

    // Active teachers
    const activeTeachers = users.filter(u => 
      ['guru', 'guru_kelas', 'guru_mapel'].includes(u.role) && u.is_active
    ).length;
    
    if (activeTeachers === 0) {
      issues.push({
        category: 'app_health',
        severity: 'warning',
        message: 'No teacher accounts',
        details: 'System has no active teacher accounts',
        table: 'users',
        count: 0
      });
    }

    // Too many inactive users
    const inactiveUsers = users.filter(u => !u.is_active).length;
    if (inactiveUsers > 10) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'Many inactive users',
        details: `${inactiveUsers} inactive accounts - consider cleanup`,
        table: 'users',
        count: inactiveUsers
      });
    }

    // Users with same username (shouldn't happen but check)
    const usernames = {};
    users.forEach(u => {
      if (u.username) {
        usernames[u.username] = (usernames[u.username] || 0) + 1;
      }
    });
    
    const dupes = Object.entries(usernames).filter(([, cnt]) => cnt > 1);
    if (dupes.length > 0) {
      issues.push({
        category: 'app_health',
        severity: 'critical',
        message: 'Duplicate usernames detected',
        details: `${dupes.length} usernames used multiple times`,
        table: 'users',
        count: dupes.length
      });
    }

  } catch (error) {
    console.error('Error checking user accounts:', error);
  }
}

async function checkDataVolume(issues) {
  try {
    const tables = [
      { name: 'students', display: 'Students', threshold: 0 },
      { name: 'attendance', display: 'Attendance', threshold: 0 },
      { name: 'nilai', display: 'Grades', threshold: 0 }
    ];

    for (const table of tables) {
      const { count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (count === table.threshold) {
        issues.push({
          category: 'app_health',
          severity: 'warning',
          message: `Empty table: ${table.display}`,
          details: `Table '${table.name}' has no records`,
          table: table.name,
          count: 0
        });
      }
    }

  } catch (error) {
    console.error('Error checking data volume:', error);
  }
}

async function checkPerformanceIndicators(issues) {
  try {
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (studentCount > 10000) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'Large student database',
        details: `${studentCount} students - consider archiving and pagination`,
        table: 'students',
        count: studentCount
      });
    }

    const { count: attendanceCount } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true });

    if (attendanceCount > 100000) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'Large attendance history',
        details: `${attendanceCount} records - consider archiving old data`,
        table: 'attendance',
        count: attendanceCount
      });
    }

    const { count: nilaiCount } = await supabase
      .from('nilai')
      .select('*', { count: 'exact', head: true });

    if (nilaiCount > 50000) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'Large grades history',
        details: `${nilaiCount} records - consider archiving`,
        table: 'nilai',
        count: nilaiCount
      });
    }

  } catch (error) {
    console.error('Error checking performance:', error);
  }
}

async function checkDataFreshness(issues) {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { count: recentData } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', threeMonthsAgo.toISOString());

    if (recentData === 0) {
      issues.push({
        category: 'app_health',
        severity: 'warning',
        message: 'No recent data updates',
        details: 'No records created in last 3 months - system may be inactive',
        table: 'attendance',
        count: 0
      });
    }

    // Check for pending siswa_baru
    const { count: pendingSiswa } = await supabase
      .from('siswa_baru')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingSiswa > 5) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'Pending student registrations',
        details: `${pendingSiswa} registrations awaiting review`,
        table: 'siswa_baru',
        count: pendingSiswa
      });
    }

  } catch (error) {
    console.error('Error checking data freshness:', error);
  }
}

async function checkHealthLogs(issues) {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: recentLogs } = await supabase
      .from('system_health_logs')
      .select('checked_at, status, critical_count')
      .gte('checked_at', threeDaysAgo.toISOString())
      .order('checked_at', { ascending: false })
      .limit(10);

    if (!recentLogs || recentLogs.length === 0) {
      issues.push({
        category: 'app_health',
        severity: 'info',
        message: 'No recent health checks',
        details: 'System health not monitored in last 3 days',
        table: 'system_health_logs',
        count: 0
      });
    } else {
      const criticalLogs = recentLogs.filter(log => log.critical_count > 0);
      
      if (criticalLogs.length > 0) {
        issues.push({
          category: 'app_health',
          severity: 'warning',
          message: 'Recent critical issues detected',
          details: `${criticalLogs.length} health checks found critical issues in last 3 days`,
          table: 'system_health_logs',
          count: criticalLogs.length
        });
      }

      const failedLogs = recentLogs.filter(log => log.status === 'unhealthy');
      
      if (failedLogs.length > 2) {
        issues.push({
          category: 'app_health',
          severity: 'warning',
          message: 'Multiple unhealthy checks',
          details: `${failedLogs.length} unhealthy system checks in last 3 days`,
          table: 'system_health_logs',
          count: failedLogs.length
        });
      }
    }

  } catch (error) {
    console.error('Error checking health logs:', error);
  }
}

export default checkAppHealth;