import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Download, Upload, AlertTriangle, RefreshCw } from 'lucide-react';

const SystemTab = ({ user, loading, setLoading, showToast }) => {
  const [schoolSettings, setSchoolSettings] = useState({
    academic_year: '2025/2026',
    school_name: 'SD Negeri 1 Pasir Pogor'
  });
  const [schoolStats, setSchoolStats] = useState({
    total_students: 0,
    total_teachers: 0
  });
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      setLoading(true);
      
      // Load school settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('school_settings')
        .select('setting_key, setting_value');
      
      if (settingsError) throw settingsError;
      
      if (settingsData && settingsData.length > 0) {
        const settings = {};
        settingsData.forEach(item => {
          settings[item.setting_key] = item.setting_value;
        });
        setSchoolSettings(prev => ({ ...prev, ...settings }));
      }
      
      // Load stats
      const [teachersRes, studentsRes] = await Promise.all([
        supabase.from('users').select('id').in('role', ['admin', 'guru_kelas', 'guru_mapel']),
        supabase.from('students').select('id').eq('is_active', true)
      ]);
      
      if (teachersRes.error) throw teachersRes.error;
      if (studentsRes.error) throw studentsRes.error;
      
      setSchoolStats({
        total_students: studentsRes.data?.length || 0,
        total_teachers: teachersRes.data?.length || 0
      });
      
    } catch (error) {
      console.error('Error loading school data:', error);
      showToast('Error loading school data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportDatabaseBackup = async () => {
    try {
      setLoading(true);
      
      const [usersRes, studentsRes, attendanceRes, nilaiRes, siswaBaruRes, schoolSettingsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('students').select('*'),
        supabase.from('attendance').select('*').limit(1000),
        supabase.from('nilai').select('*').limit(1000),
        supabase.from('siswa_baru').select('*'),
        supabase.from('school_settings').select('*')
      ]);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        academic_year: schoolSettings.academic_year,
        school_info: schoolSettings,
        data: {
          users: usersRes.data,
          students: studentsRes.data,
          attendance: attendanceRes.data,
          nilai: nilaiRes.data,
          siswa_baru: siswaBaruRes.data,
          school_settings: schoolSettingsRes.data
        },
        stats: {
          total_users: usersRes.data?.length,
          total_students: studentsRes.data?.length,
          total_attendance_records: attendanceRes.data?.length,
          total_nilai_records: nilaiRes.data?.length,
          total_siswa_baru: siswaBaruRes.data?.length
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${schoolSettings.school_name?.replace(/\s+/g, '_')}_backup_${schoolSettings.academic_year.replace('/', '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Database backup downloaded successfully!', 'success');
      
    } catch (error) {
      console.error('Error creating backup:', error);
      showToast('Error creating database backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setRestoreFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          setRestorePreview({
            timestamp: backupData.timestamp,
            academic_year: backupData.academic_year,
            school_info: backupData.school_info,
            stats: backupData.stats
          });
        } catch (error) {
          showToast('Invalid backup file format', 'error');
          setRestoreFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const executeRestore = async () => {
    if (!restoreFile) return;
    
    const confirmed = window.confirm(
      `PERINGATAN: Restore akan menimpa semua data yang ada!\n\n` +
      `Backup dari: ${restorePreview.timestamp}\n` +
      `Academic Year: ${restorePreview.academic_year}\n\n` +
      `Tindakan ini TIDAK DAPAT DIBATALKAN. Apakah Anda yakin?`
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          
          await supabase.from('attendance').delete().neq('id', 0);
          await supabase.from('nilai').delete().neq('id', 0);
          await supabase.from('siswa_baru').delete().neq('id', 0);
          await supabase.from('students').delete().neq('id', 0);
          await supabase.from('users').delete().neq('id', 0);
          await supabase.from('school_settings').delete().neq('id', 0);
          
          if (backupData.data.school_settings?.length > 0) {
            await supabase.from('school_settings').insert(backupData.data.school_settings);
          }
          
          if (backupData.data.users?.length > 0) {
            await supabase.from('users').insert(backupData.data.users);
          }
          
          if (backupData.data.students?.length > 0) {
            await supabase.from('students').insert(backupData.data.students);
          }
          
          if (backupData.data.attendance?.length > 0) {
            await supabase.from('attendance').insert(backupData.data.attendance);
          }
          
          if (backupData.data.nilai?.length > 0) {
            await supabase.from('nilai').insert(backupData.data.nilai);
          }
          
          if (backupData.data.siswa_baru?.length > 0) {
            await supabase.from('siswa_baru').insert(backupData.data.siswa_baru);
          }
          
          showToast('Database restored successfully!', 'success');
          setRestoreFile(null);
          setRestorePreview(null);
          
          await loadSchoolData();
          
        } catch (error) {
          console.error('Error restoring backup:', error);
          showToast('Error restoring database: ' + error.message, 'error');
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsText(restoreFile);
      
    } catch (error) {
      console.error('Error reading restore file:', error);
      showToast('Error reading backup file', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">System Management</h2>
      
      {/* Database Backup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Database Backup</h3>
        <p className="text-gray-600 mb-4">
          Download backup lengkap database untuk keperluan keamanan dan migrasi data.
        </p>
        
        <button
          onClick={exportDatabaseBackup}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          <Download size={18} />
          {loading ? 'Membuat Backup...' : 'Download Backup Database'}
        </button>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Backup akan berisi:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Data pengguna (users table)</li>
            <li>Data siswa (students table)</li>
            <li>Data kehadiran terbaru (attendance table - 1000 records terakhir)</li>
            <li>Data nilai terbaru (nilai table - 1000 records terakhir)</li>
            <li>Data siswa baru (siswa_baru table)</li>
            <li>Pengaturan sekolah (school_settings table)</li>
          </ul>
        </div>
      </div>
      
      {/* Database Restore */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Database Restore</h3>
        <p className="text-gray-600 mb-4">
          Upload dan restore backup database. <span className="text-red-600 font-medium">PERHATIAN: Ini akan menimpa semua data yang ada!</span>
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Backup File</label>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {restorePreview && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-yellow-800">Backup File Preview</h4>
                  <div className="text-sm text-yellow-700 mt-2 space-y-1">
                    <p><strong>Tanggal Backup:</strong> {new Date(restorePreview.timestamp).toLocaleString()}</p>
                    <p><strong>Academic Year:</strong> {restorePreview.academic_year}</p>
                    <p><strong>School:</strong> {restorePreview.school_info?.school_name}</p>
                    <p><strong>Data Records:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>{restorePreview.stats?.total_users || 0} users</li>
                      <li>{restorePreview.stats?.total_students || 0} students</li>
                      <li>{restorePreview.stats?.total_attendance_records || 0} attendance records</li>
                      <li>{restorePreview.stats?.total_nilai_records || 0} nilai records</li>
                      <li>{restorePreview.stats?.total_siswa_baru || 0} siswa baru records</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={executeRestore}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin inline mr-2" size={16} />
                      Restoring...
                    </>
                  ) : 'Execute Restore'}
                </button>
                
                <button
                  onClick={() => {
                    setRestoreFile(null);
                    setRestorePreview(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* System Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Sistem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
            <p className="text-sm text-gray-600">Supabase PostgreSQL</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Records</label>
            <p className="text-sm text-gray-600">
              {schoolStats.total_students + schoolStats.total_teachers} users total
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <p className="text-sm text-gray-600">{schoolSettings.academic_year}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <p className="text-sm text-gray-600">{schoolSettings.school_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTab;