import React, { useState, useEffect } from 'react';
import ReportAdmin from './ReportAdmin';
import ReportTeacher from './ReportTeacher';
import { supabase } from '../supabaseClient';
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';

const Report = ({ userData, onNavigate }) => {
    const safeUserData = userData || {};
    const userRole = safeUserData.role || 'admin';
    const userKelas = safeUserData.kelas || '1';
    const userName = safeUserData.full_name || 'User';

    // Global states
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [nilai, setNilai] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Filter states
    const [selectedPeriod, setSelectedPeriod] = useState('3months');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedMapel, setSelectedMapel] = useState('');
    const [selectedJenisNilai, setSelectedJenisNilai] = useState('');

    const periodOptions = [
        { value: '1month', label: '1 Bulan Terakhir' },
        { value: '3months', label: '3 Bulan Terakhir' },
        { value: '6months', label: '6 Bulan Terakhir' },
        { value: '1year', label: '1 Tahun Terakhir' }
    ];

    const classOptions = Array.from({ length: 6 }, (_, i) => ({
        label: `Kelas ${i + 1}`,
        value: `${i + 1}`
    }));

    // Data fetching function
    const fetchData = async () => {
        setLoading(true);
        setRefreshing(true);
        setError(null);
        
        try {
            const { startDate } = getDateRange();

            // Students query dengan role-based filtering
            let studentsQuery = supabase.from('students').select('*').eq('is_active', true);
            if (userRole === 'guru_kelas') {
                studentsQuery = studentsQuery.eq('kelas', parseInt(userKelas));
            }
            
            const { data: studentsData, error: studentsError } = await studentsQuery;
            if (studentsError) throw studentsError;
            setStudents(studentsData);

            const studentNisns = studentsData.map(s => s.nisn);

            // Attendance query
            let attendanceQuery = supabase
                .from('attendance')
                .select('*')
                .gte('tanggal', startDate.toISOString().split('T')[0]);
            
            if (userRole === 'guru_kelas') {
                attendanceQuery = attendanceQuery.eq('kelas', parseInt(userKelas));
            } else if (userRole === 'guru_mapel') {
                attendanceQuery = attendanceQuery.eq('guru_input', userName);
            } else {
                attendanceQuery = attendanceQuery.in('nisn', studentNisns);
            }

            const { data: attendanceData, error: attendanceError } = await attendanceQuery;
            if (attendanceError) throw attendanceError;
            setAttendance(attendanceData);

            // Nilai query
            let nilaiQuery = supabase
                .from('nilai')
                .select('*')
                .gte('tanggal', startDate.toISOString().split('T')[0]);
            
            if (userRole === 'guru_kelas') {
                nilaiQuery = nilaiQuery.eq('kelas', parseInt(userKelas));
            } else if (userRole === 'guru_mapel') {
                nilaiQuery = nilaiQuery.eq('guru_input', userName);
            } else {
                nilaiQuery = nilaiQuery.in('nisn', studentNisns);
            }
            
            const { data: nilaiData, error: nilaiError } = await nilaiQuery;
            if (nilaiError) throw nilaiError;
            setNilai(nilaiData);

        } catch (err) {
            console.error("Error fetching report data:", err);
            setError("Gagal memuat data laporan");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getDateRange = () => {
        const now = new Date();
        const startDate = new Date();
        
        switch (selectedPeriod) {
            case '1month': startDate.setMonth(now.getMonth() - 1); break;
            case '3months': startDate.setMonth(now.getMonth() - 3); break;
            case '6months': startDate.setMonth(now.getMonth() - 6); break;
            case '1year': startDate.setFullYear(now.getFullYear() - 1); break;
            default: startDate.setMonth(now.getMonth() - 3);
        }
        
        return { startDate, endDate: now };
    };

    useEffect(() => {
        fetchData();
    }, [selectedPeriod, userRole, userKelas, userName]);

    // Loading state
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-medium">Menganalisis data laporan...</p>
        </div>
    );

    // Error state
    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <p className="text-red-600 font-medium text-lg">Gagal Memuat Laporan</p>
            <button 
                onClick={fetchData}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Coba Lagi
            </button>
        </div>
    );

    // Render role-specific component
    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <BarChart3 className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Laporan Analitik</h1>
                            <p className="text-gray-500">
                                {userRole === 'admin' ? 'Analisis seluruh sekolah' : 
                                 userRole === 'guru_kelas' ? `Kelas ${userKelas}` : 
                                 `Mata pelajaran - ${userName}`}
                            </p>
                        </div>
                    </div>
                    <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                        onClick={fetchData}
                        disabled={refreshing}
                    >
                        {refreshing ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Role-specific content */}
            {userRole === 'admin' ? (
                <ReportAdmin
                    students={students}
                    attendance={attendance}
                    nilai={nilai}
                    periodOptions={periodOptions}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                    classOptions={classOptions}
                    selectedClass={selectedClass}
                    onClassChange={setSelectedClass}
                    onNavigate={onNavigate}
                />
            ) : (
                <ReportTeacher
                    userRole={userRole}
                    userKelas={userKelas}
                    userName={userName}
                    students={students}
                    attendance={attendance}
                    nilai={nilai}
                    periodOptions={periodOptions}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                    selectedMapel={selectedMapel}
                    onMapelChange={setSelectedMapel}
                    selectedJenisNilai={selectedJenisNilai}
                    onJenisNilaiChange={setSelectedJenisNilai}
                    onNavigate={onNavigate}
                />
            )}
        </div>
    );
};

export default Report;