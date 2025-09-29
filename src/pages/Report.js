import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    AreaChart,
    Area
} from 'recharts';
import {
    Users,
    GraduationCap,
    UserCheck,
    Download,
    RefreshCw,
    FileText,
    BookOpen,
    Award,
    AlertCircle,
    Filter,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Clock,
    Target,
    BarChart3
} from 'lucide-react';

const Report = ({ userData, onNavigate }) => {
    // Safe userData handling
    const safeUserData = userData || {};
    const userRole = safeUserData.role || 'admin';
    const userKelas = safeUserData.kelas || '1';
    const userName = safeUserData.full_name || 'User';

    // State untuk data laporan
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [nilai, setNilai] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk filter dan UI
    const [selectedPeriod, setSelectedPeriod] = useState('3months');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedMapel, setSelectedMapel] = useState('');
    const [selectedJenisNilai, setSelectedJenisNilai] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    
    // ====================================================================
    // PERUBAHAN 1: ACTIVE TAB BERDASARKAN ROLE
    // ====================================================================
    const initialTab = userRole === 'guru_mapel' ? 'subjects' : 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Dynamic options from data
    const [mataPelajaranList, setMataPelajaranList] = useState([]);
    const [jenisNilaiList, setJenisNilaiList] = useState([]);

    // Period options
    const periodOptions = [
        { value: '1month', label: '1 Bulan Terakhir' },
        { value: '3months', label: '3 Bulan Terakhir' },
        { value: '6months', label: '6 Bulan Terakhir' },
        { value: '1year', label: '1 Tahun Terakhir' }
    ];

    // Daftar Kelas (hanya untuk admin)
    const classOptions = Array.from({ length: 6 }, (_, i) => ({
        label: `Kelas ${i + 1}`,
        value: `${i + 1}`
    }));

    // Colors for charts
    const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

    // Get date range based on period
    const getDateRange = () => {
        const now = new Date();
        const startDate = new Date();
        
        switch (selectedPeriod) {
            case '1month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3months':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6months':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 3);
        }
        
        return { startDate, endDate: now };
    };

    // Fetch data function with role-based filtering
    const fetchData = async () => {
        setLoading(true);
        setRefreshing(true);
        setError(null);
        try {
            const { startDate } = getDateRange();

            // Students query
            let studentsQuery = supabase.from('students').select('*').eq('is_active', true);
            if (userRole === 'guru_kelas') {
                studentsQuery = studentsQuery.eq('kelas', parseInt(userKelas));
            }
            
            const { data: studentsData, error: studentsError } = await studentsQuery;
            if (studentsError) throw studentsError;
            setStudents(studentsData);

            // Get student NISNs for filtering (for consistency)
            const studentNisns = studentsData.map(s => s.nisn);

            // Attendance query with date range and role filtering
            let attendanceQuery = supabase
                .from('attendance')
                .select('*')
                .gte('tanggal', startDate.toISOString().split('T')[0]);
            
            if (userRole !== 'admin') {
                 // Untuk Guru Kelas, attendance difilter berdasarkan kelas siswa yang dia ajar
                if (userRole === 'guru_kelas') {
                     attendanceQuery = attendanceQuery.eq('kelas', parseInt(userKelas));
                } 
                // Untuk Guru Mapel, kita hanya ambil data kehadirannya
                // di kelas yang siswanya ada di studentsData. 
                // Keterangan: Jika Guru Mapel ingin melihat kehadiran, kita asumsikan 
                // itu adalah kehadiran total siswa-siswa yang dinilai. 
                // Filter di level data Nilai sudah cukup membatasi.
                attendanceQuery = attendanceQuery.in('nisn', studentNisns);
            }
            
            // Khusus untuk Guru Mapel, jika mereka mengambil kehadiran sendiri, 
            // kita harus filter berdasarkan input guru. Ini yang sering bikin kosong/error.
            if (userRole === 'guru_mapel') {
                 attendanceQuery = attendanceQuery.eq('guru_input', userName);
            }


            const { data: attendanceData, error: attendanceError } = await attendanceQuery;
            if (attendanceError) throw attendanceError;
            setAttendance(attendanceData);

            // Nilai query with date range and role filtering
            let nilaiQuery = supabase
                .from('nilai')
                .select('*')
                .gte('tanggal', startDate.toISOString().split('T')[0]);
            
            if (userRole === 'guru_kelas') {
                nilaiQuery = nilaiQuery.eq('kelas', parseInt(userKelas));
            } else if (userRole === 'guru_mapel') {
                // Guru mapel hanya lihat nilai yang dia input
                nilaiQuery = nilaiQuery.eq('guru_input', userName);
            } else {
                 nilaiQuery = nilaiQuery.in('nisn', studentNisns);
            }
            
            const { data: nilaiData, error: nilaiError } = await nilaiQuery;
            if (nilaiError) throw nilaiError;
            setNilai(nilaiData);

            // Extract unique mata pelajaran and jenis nilai for filters
            const uniqueMapel = [...new Set(nilaiData.map(n => n.mata_pelajaran))].filter(Boolean);
            const uniqueJenisNilai = [...new Set(nilaiData.map(n => n.jenis_nilai))].filter(Boolean);
            
            setMataPelajaranList(uniqueMapel);
            setJenisNilaiList(uniqueJenisNilai);

        } catch (err) {
            console.error("Error fetching report data:", err);
            setError("Gagal memuat data laporan");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedPeriod, userRole, userKelas, userName]);

    // Enhanced filtering (Hanya untuk filter tambahan di UI, fetch data sudah terfilter)
    const getFilteredData = () => {
        let filteredStudents = students;
        let filteredAttendance = attendance;
        let filteredNilai = nilai;

        // Class filter (admin only)
        if (userRole === 'admin' && selectedClass) {
            const classInt = parseInt(selectedClass);
            filteredStudents = students.filter(s => s.kelas === classInt);
            // Re-filter attendance dan nilai sesuai siswa di kelas yang dipilih
            const studentNisns = filteredStudents.map(s => s.nisn);
            filteredAttendance = filteredAttendance.filter(a => studentNisns.includes(a.nisn));
            filteredNilai = filteredNilai.filter(n => studentNisns.includes(n.nisn));
        }

        // Mata pelajaran filter
        if (selectedMapel) {
            filteredNilai = filteredNilai.filter(n => n.mata_pelajaran === selectedMapel);
        }

        // Jenis nilai filter
        if (selectedJenisNilai) {
            filteredNilai = filteredNilai.filter(n => n.jenis_nilai === selectedJenisNilai);
        }

        return { 
            students: filteredStudents, 
            attendance: filteredAttendance, 
            nilai: filteredNilai 
        };
    };

    const { students: filteredStudents, attendance: filteredAttendance, nilai: filteredNilai } = getFilteredData();

    // Enhanced Analytics
    const calculateAdvancedInsights = () => {
        // ... (Logika calculateAdvancedInsights yang sama dengan perbaikan sebelumnya) ...
        // Attendance trends by month
        const monthlyAttendance = {};
        filteredAttendance.forEach(record => {
            const monthKey = new Date(record.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
            if (!monthlyAttendance[monthKey]) {
                monthlyAttendance[monthKey] = { total: 0, hadir: 0, alpha: 0, izin: 0, sakit: 0 };
            }
            monthlyAttendance[monthKey].total++;
            
            switch(record.status.toLowerCase()) {
                case 'hadir':
                    monthlyAttendance[monthKey].hadir++;
                    break;
                case 'alpha':
                    monthlyAttendance[monthKey].alpha++;
                    break;
                case 'izin':
                    monthlyAttendance[monthKey].izin++;
                    break;
                case 'sakit':
                    monthlyAttendance[monthKey].sakit++;
                    break;
            }
        });

        const attendanceTrend = Object.entries(monthlyAttendance).map(([month, data]) => ({
            month,
            'Hadir': data.hadir,
            'Alpha': data.alpha,
            'Izin': data.izin,
            'Sakit': data.sakit,
            percentage: data.total > 0 ? ((data.hadir / data.total) * 100).toFixed(1) : 0
        })).sort((a, b) => new Date(a.month) - new Date(b.month));

        // Grade analysis by mata pelajaran
        const gradesByMapel = {};
        filteredNilai.forEach(record => {
            if (!gradesByMapel[record.mata_pelajaran]) {
                gradesByMapel[record.mata_pelajaran] = [];
            }
            gradesByMapel[record.mata_pelajaran].push(record.nilai);
        });

        const mapelPerformance = Object.entries(gradesByMapel).map(([mapel, grades]) => ({
            mapel,
            average: (grades.reduce((sum, grade) => sum + grade, 0) / grades.length).toFixed(1),
            count: grades.length,
            highest: Math.max(...grades),
            lowest: Math.min(...grades)
        }));

        // Grade trends by jenis nilai
        const gradesByJenis = {};
        filteredNilai.forEach(record => {
            if (!gradesByJenis[record.jenis_nilai]) {
                gradesByJenis[record.jenis_nilai] = [];
            }
            gradesByJenis[record.jenis_nilai].push(record.nilai);
        });

        const jenisNilaiPerformance = Object.entries(gradesByJenis).map(([jenis, grades]) => ({
            jenis,
            average: (grades.reduce((sum, grade) => sum + grade, 0) / grades.length).toFixed(1),
            count: grades.length
        }));

        // Student performance analysis with enhanced risk assessment
        const studentPerformance = filteredStudents.map(student => {
            // Note: studentAttendance for guru_mapel might be empty if they don't input attendance
            const studentAttendance = attendance.filter(a => a.nisn === student.nisn); // Use the general 'attendance' data for overall rate
            const studentGrades = filteredNilai.filter(n => n.nisn === student.nisn);
            
            const totalMeetings = studentAttendance.length;
            const hadirCount = studentAttendance.filter(a => a.status.toLowerCase() === 'hadir').length;
            const alphaCount = studentAttendance.filter(a => a.status.toLowerCase() === 'alpha').length;
            const attendanceRate = totalMeetings > 0 ? (hadirCount / totalMeetings * 100) : 0;
            
            const avgGrade = studentGrades.length > 0 
                ? studentGrades.reduce((sum, g) => sum + g.nilai, 0) / studentGrades.length
                : 0;

            // Enhanced risk assessment
            let riskLevel = 'low';
            let riskFactors = [];
            
            if (attendanceRate < 75) {
                riskLevel = 'high';
                riskFactors.push('Kehadiran rendah');
            } else if (attendanceRate < 85) {
                if (riskLevel !== 'high') riskLevel = 'medium';
                riskFactors.push('Kehadiran perlu ditingkatkan');
            }
            
            if (avgGrade < 65 && studentGrades.length > 0) {
                riskLevel = 'high';
                riskFactors.push('Nilai di bawah standar');
            } else if (avgGrade < 75 && studentGrades.length > 0) {
                if (riskLevel !== 'high') riskLevel = 'medium';
                riskFactors.push('Prestasi perlu ditingkatkan');
            }
            
            if (alphaCount >= 3) {
                riskLevel = 'high';
                riskFactors.push('Sering alpha');
            }

            return {
                ...student,
                attendanceRate: attendanceRate.toFixed(1),
                avgGrade: avgGrade.toFixed(1),
                totalAssessments: studentGrades.length,
                totalMeetings,
                hadirCount,
                alphaCount,
                riskLevel,
                riskFactors
            };
        });
        
        // FIX: Menghitung jumlah pertemuan sebenarnya (tanggal unik)
        const uniqueDates = [...new Set(filteredAttendance.map(a => a.tanggal))];
        const totalActualMeetings = uniqueDates.length;
        

        // Summary statistics
        const totalStudents = filteredStudents.length;
        const overallAttendanceRate = filteredAttendance.length > 0 
            ? (filteredAttendance.filter(a => a.status.toLowerCase() === 'hadir').length / filteredAttendance.length * 100).toFixed(1)
            : 0;
        
        const overallAvgGrade = filteredNilai.length > 0 
            ? (filteredNilai.reduce((sum, n) => sum + n.nilai, 0) / filteredNilai.length).toFixed(1)
            : 0;

        const highRiskStudents = studentPerformance.filter(s => s.riskLevel === 'high').length;
        const mediumRiskStudents = studentPerformance.filter(s => s.riskLevel === 'medium').length;
        const lowRiskStudents = studentPerformance.filter(s => s.riskLevel === 'low').length;

        // Top performers
        const topPerformers = studentPerformance
            .filter(s => s.totalAssessments > 0)
            .sort((a, b) => parseFloat(b.avgGrade) - parseFloat(a.avgGrade))
            .slice(0, 5);

        return {
            attendanceTrend,
            mapelPerformance,
            jenisNilaiPerformance,
            studentPerformance,
            topPerformers,
            summary: {
                totalStudents,
                overallAttendanceRate,
                overallAvgGrade,
                highRiskStudents,
                mediumRiskStudents,
                lowRiskStudents,
                totalAssessments: filteredNilai.length,
                totalMeetings: filteredAttendance.length, // Total Record Kehadiran
                totalActualMeetings: totalActualMeetings // Total Pertemuan Sebenarnya (FIX)
            }
        };
    };

    const insights = calculateAdvancedInsights();

    // Enhanced Components (InsightCard & StudentPerformanceCard - tidak berubah)

    const InsightCard = ({ icon: Icon, title, value, description, trend, color, alert }) => (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-300 ${alert ? 'border-l-4 border-l-red-500' : ''}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${color}`}>
                            <Icon size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{title}</h3>
                            {alert && <span className="text-xs text-red-600 font-medium">Perlu Perhatian</span>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-600">{description}</p>
                        {trend && (
                            <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.positive ? <Award size={14} /> : <TrendingDown size={14} />}
                                {trend.text}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const StudentPerformanceCard = ({ student }) => {
        const getRiskColor = (riskLevel) => {
            switch (riskLevel) {
                case 'high': return 'bg-red-50 border-red-200 text-red-800';
                case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
                default: return 'bg-green-50 border-green-200 text-green-800';
            }
        };

        const getRiskLabel = (riskLevel) => {
            switch (riskLevel) {
                case 'high': return 'Perlu Perhatian';
                case 'medium': return 'Perlu Monitoring';
                default: return 'Baik';
            }
        };

        // ====================================================================
        // OPTIMASI: Sembunyikan metrik yang tidak ada datanya (terutama untuk Guru Mapel)
        // ====================================================================
        const isAttendanceDataAvailable = student.totalMeetings > 0;
        const isGradeDataAvailable = student.totalAssessments > 0;

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-gray-900">{student.nama_siswa}</h3>
                        <p className="text-sm text-gray-500">NISN: {student.nisn} • Kelas {student.kelas}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(student.riskLevel)}`}>
                        {getRiskLabel(student.riskLevel)}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase">Kehadiran</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {isAttendanceDataAvailable ? `${student.attendanceRate}%` : '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {isAttendanceDataAvailable ? `${student.hadirCount}/${student.totalMeetings}` : 'Data tidak tersedia'}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase">Rata-rata Nilai</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {isGradeDataAvailable ? student.avgGrade : '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {isGradeDataAvailable ? `${student.totalAssessments} penilaian` : 'Data tidak tersedia'}
                        </p>
                    </div>
                </div>
                
                {student.riskFactors.length > 0 && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium mb-1">Faktor Risiko:</p>
                        <ul className="text-xs text-gray-600">
                            {student.riskFactors.map((factor, idx) => (
                                <li key={idx}>• {factor}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };


    if (loading) return (
        // ... (Loading state)
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-medium">Menganalisis data laporan...</p>
            <p className="text-gray-500 text-sm mt-1">Memproses data selama {periodOptions.find(p => p.value === selectedPeriod)?.label.toLowerCase()}</p>
        </div>
    );
    
    if (error) return (
        // ... (Error state)
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <p className="text-red-600 font-medium text-lg">Gagal Memuat Laporan</p>
            <p className="text-gray-600 text-center mt-2 mb-4">{error}</p>
            <button 
                onClick={fetchData}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Coba Lagi
            </button>
        </div>
    );

    // List of tabs, hidden based on role
    const tabs = [
        { id: 'overview', label: 'Ringkasan', icon: BarChart3, roles: ['admin', 'guru_kelas'] },
        { id: 'subjects', label: 'Per Mata Pelajaran', icon: BookOpen, roles: ['admin', 'guru_kelas', 'guru_mapel'] },
        { id: 'students', label: 'Analisis Siswa', icon: Users, roles: ['admin', 'guru_kelas'] },
        { id: 'insights', label: 'Insight & Rekomendasi', icon: Target, roles: ['admin', 'guru_kelas', 'guru_mapel'] }
    ].filter(tab => tab.roles.includes(userRole));


    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">
            {/* HEADER */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <BarChart3 className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Laporan Analitik</h1>
                                <p className="text-sm text-gray-500">
                                    {userRole === 'admin' ? 'Analisis performa seluruh sekolah' : 
                                     userRole === 'guru_kelas' ? `Analisis kelas ${userKelas}` : 
                                     `Analisis mata pelajaran yang diampu oleh ${userName}`} • {periodOptions.find(p => p.value === selectedPeriod)?.label}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 text-sm transition-colors"
                            onClick={fetchData}
                            disabled={refreshing}
                        >
                            {refreshing ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* ENHANCED FILTER SECTION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* ... (Filter Toggle Button - tidak berubah) ... */}
                <div className="md:hidden p-4 border-b border-gray-100">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <Filter size={20} className="text-gray-500" />
                            <span className="font-medium text-gray-700">Filter Laporan</span>
                        </div>
                        <span className="text-gray-400">{showFilters ? '▲' : '▼'}</span>
                    </button>
                </div>
                
                <div className={`p-4 sm:p-6 ${!showFilters ? 'hidden md:block' : ''}`}>
                    {/* Menggunakan grid 3 kolom jika Guru Mapel/Kelas, 4 kolom jika Admin */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${userRole === 'admin' ? 4 : 3} gap-4`}>
                        {/* Period Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Periode Analisis</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                            >
                                {periodOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Class Filter - Admin Only */}
                        {userRole === 'admin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Filter Kelas</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="">Semua Kelas</option>
                                    {classOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {/* Mata Pelajaran Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={selectedMapel}
                                onChange={(e) => setSelectedMapel(e.target.value)}
                            >
                                <option value="">Semua Mata Pelajaran</option>
                                {mataPelajaranList.map(mapel => (
                                    <option key={mapel} value={mapel}>{mapel}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Jenis Nilai Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Nilai</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={selectedJenisNilai}
                                onChange={(e) => setSelectedJenisNilai(e.target.value)}
                            >
                                <option value="">Semua Jenis Nilai</option>
                                {jenisNilaiList.map(jenis => (
                                    <option key={jenis} value={jenis}>{jenis}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* Active Filters Display (Sama) */}
                    {(selectedClass || selectedMapel || selectedJenisNilai) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">Filter aktif:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedClass && (
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                        Kelas: {selectedClass}
                                    </span>
                                )}
                                {selectedMapel && (
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                        Mapel: {selectedMapel}
                                    </span>
                                )}
                                {selectedJenisNilai && (
                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                        Jenis: {selectedJenisNilai}
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedClass('');
                                        setSelectedMapel('');
                                        setSelectedJenisNilai('');
                                    }}
                                    className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm hover:bg-red-200 transition-colors"
                                >
                                    Hapus Filter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-4 sm:px-6 overflow-x-auto">
                        {/* MENGGUNAKAN LIST TAB YANG SUDAH DIFILTER ROLE */}
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 sm:p-6">
                    {/* TABS CONTENT */}
                    
                    {/* OVERVIEW TAB (Admin/Guru Kelas Only) */}
                    {(activeTab === 'overview' && tabs.find(t => t.id === 'overview')) && (
                        <div className="space-y-6">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <InsightCard
                                    icon={Users}
                                    title="Total Siswa"
                                    value={insights.summary.totalStudents}
                                    description={userRole === 'admin' ? (selectedClass ? `Kelas ${selectedClass}` : 'Seluruh sekolah') : `Kelas ${userKelas}`}
                                    color="bg-blue-600"
                                />
                                <InsightCard
                                    icon={UserCheck}
                                    title="Tingkat Kehadiran"
                                    value={`${insights.summary.overallAttendanceRate}%`}
                                    description={`${filteredAttendance.filter(a => a.status.toLowerCase() === 'hadir').length} dari ${insights.summary.totalMeetings} record kehadiran (dari ${insights.summary.totalActualMeetings} pertemuan)`}
                                    color="bg-green-600"
                                    alert={insights.summary.overallAttendanceRate < 80}
                                />
                                <InsightCard
                                    icon={GraduationCap}
                                    title="Rata-rata Nilai"
                                    value={insights.summary.overallAvgGrade}
                                    description={`${insights.summary.totalAssessments} penilaian tercatat`}
                                    color="bg-purple-600"
                                    alert={insights.summary.overallAvgGrade < 75}
                                />
                                <InsightCard
                                    icon={AlertTriangle}
                                    title="Perlu Perhatian"
                                    value={insights.summary.highRiskStudents}
                                    description="Siswa berisiko tinggi"
                                    color="bg-red-600"
                                    alert={insights.summary.highRiskStudents > 0}
                                />
                            </div>

                            {/* Trend Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* ... (Attendance Trend Chart) ... */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Kehadiran Bulanan</h3>
                                    <div className="h-64">
                                        {insights.attendanceTrend.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={insights.attendanceTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" fontSize={12} />
                                                    <YAxis fontSize={12} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Area type="monotone" dataKey="Hadir" stackId="1" stroke="#10B981" fill="#10B981" />
                                                    <Area type="monotone" dataKey="Sakit" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                                                    <Area type="monotone" dataKey="Izin" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                                                    <Area type="monotone" dataKey="Alpha" stackId="1" stroke="#EF4444" fill="#EF4444" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                <UserCheck size={48} className="mb-4" />
                                                <p className="font-medium">Tidak ada data kehadiran</p>
                                                <p className="text-sm text-center">Data akan muncul setelah ada record kehadiran</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ... (Status Kehadiran Chart) ... */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Kehadiran</h3>
                                    <div className="h-64">
                                        {filteredAttendance.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Hadir', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'hadir').length, fill: '#10B981' },
                                                            { name: 'Sakit', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'sakit').length, fill: '#F59E0B' },
                                                            { name: 'Izin', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'izin').length, fill: '#3B82F6' },
                                                            { name: 'Alpha', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'alpha').length, fill: '#EF4444' }
                                                        ].filter(item => item.value > 0)}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                <Clock size={48} className="mb-4" />
                                                <p className="font-medium">Tidak ada data kehadiran</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUBJECTS TAB (Semua Role) */}
                    {activeTab === 'subjects' && (
                        // ... (Konten Per Mata Pelajaran - tidak berubah) ...
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa Per Mata Pelajaran</h3>
                                
                                {insights.mapelPerformance.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <h4 className="font-semibold text-gray-900 mb-4">Rata-rata Nilai per Mata Pelajaran</h4>
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={insights.mapelPerformance}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="mapel" fontSize={12} angle={-45} textAnchor="end" height={80} />
                                                            <YAxis domain={[0, 100]} fontSize={12} />
                                                            <Tooltip />
                                                            <Bar dataKey="average" fill="#8B5CF6" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <h4 className="font-semibold text-gray-900 mb-4">Distribusi Jenis Penilaian</h4>
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={insights.jenisNilaiPerformance.map((item, index) => ({
                                                                    ...item,
                                                                    fill: COLORS[index % COLORS.length]
                                                                }))}
                                                                cx="50%"
                                                                cy="50%"
                                                                outerRadius={80}
                                                                dataKey="count"
                                                                label={({ jenis, percent }) => `${jenis} ${(percent * 100).toFixed(0)}%`}
                                                            >
                                                            </Pie>
                                                            <Tooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {insights.mapelPerformance.map((mapel, index) => (
                                                <div key={mapel.mapel} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">{mapel.mapel}</h3>
                                                            <p className="text-sm text-gray-500">{mapel.count} penilaian</p>
                                                        </div>
                                                        <div className={`w-3 h-3 rounded-full`} style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Rata-rata</p>
                                                            <p className="text-lg font-semibold text-gray-900">{mapel.average}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Tertinggi</p>
                                                            <p className="text-lg font-semibold text-green-600">{mapel.highest}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Terendah</p>
                                                            <p className="text-lg font-semibold text-red-600">{mapel.lowest}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-16">
                                        <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data nilai</h3>
                                        <p className="text-gray-500">
                                            {selectedMapel || selectedJenisNilai 
                                                ? 'Coba ubah filter untuk melihat data nilai'
                                                : 'Data nilai akan muncul setelah guru menginput penilaian'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STUDENTS TAB (Admin/Guru Kelas Only) */}
                    {(activeTab === 'students' && tabs.find(t => t.id === 'students')) && (
                        // ... (Konten Analisis Siswa - tidak berubah) ...
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Performa Individual Siswa</h3>
                                    <p className="text-sm text-gray-500">Menampilkan {insights.studentPerformance.length} siswa dengan analisis risiko</p>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <span>Perlu Perhatian ({insights.summary.highRiskStudents})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <span>Monitoring ({insights.summary.mediumRiskStudents})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span>Baik ({insights.summary.lowRiskStudents})</span>
                                    </div>
                                </div>
                            </div>

                            {insights.studentPerformance.length > 0 ? (
                                <>
                                    {/* Top Performers Section */}
                                    {insights.topPerformers.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <Award size={20} className="text-yellow-500" />
                                                Top 5 Performer
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                                {insights.topPerformers.map((student, index) => (
                                                    <div key={student.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 text-center">
                                                        <div className="text-2xl mb-2">
                                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                                                        </div>
                                                        <p className="font-semibold text-gray-900 text-sm">{student.nama_siswa}</p>
                                                        <p className="text-xs text-gray-600">Kelas {student.kelas}</p>
                                                        <p className="text-lg font-bold text-yellow-600 mt-1">{student.avgGrade}</p>
                                                        <p className="text-xs text-gray-500">{student.attendanceRate}% Hadir</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* All Students Performance */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {insights.studentPerformance
                                            .sort((a, b) => {
                                                const riskOrder = { high: 0, medium: 1, low: 2 };
                                                return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
                                            })
                                            .map(student => (
                                                <StudentPerformanceCard key={student.id} student={student} />
                                            ))
                                        }
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-16">
                                    <Users size={48} className="text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data siswa</h3>
                                    <p className="text-gray-500">Data siswa akan muncul setelah ada yang terdaftar</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* INSIGHTS TAB (Semua Role) */}
                    {activeTab === 'insights' && (
                        // ... (Konten Insight & Rekomendasi - tidak berubah) ...
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Insight & Rekomendasi</h3>
                                
                                {/* Action Items */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* High Priority Actions */}
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertTriangle className="text-red-600" size={20} />
                                            <h4 className="font-semibold text-red-800">Tindakan Segera</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {insights.summary.highRiskStudents > 0 && (
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="font-medium text-gray-900">Siswa Berisiko Tinggi</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {insights.summary.highRiskStudents} siswa memerlukan konseling dan perhatian khusus
                                                    </p>
                                                    <button className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors">
                                                        Lihat Detail Siswa
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {insights.summary.overallAttendanceRate < 80 && (
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="font-medium text-gray-900">Kehadiran Rendah</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Tingkat kehadiran {insights.summary.overallAttendanceRate}% perlu ditingkatkan
                                                    </p>
                                                    <button className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors">
                                                        Analisis Penyebab
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {insights.summary.overallAvgGrade < 75 && (
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="font-medium text-gray-900">Prestasi Akademik</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Rata-rata nilai {insights.summary.overallAvgGrade} memerlukan intervensi pembelajaran
                                                    </p>
                                                    <button className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors">
                                                        Program Remedial
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {insights.summary.highRiskStudents === 0 && insights.summary.overallAttendanceRate >= 80 && insights.summary.overallAvgGrade >= 75 && (
                                                <div className="bg-white p-3 rounded-lg text-center">
                                                    <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                                                    <p className="font-medium text-gray-900">Situasi Terkendali</p>
                                                    <p className="text-sm text-gray-600">Tidak ada tindakan segera yang diperlukan saat ini</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircle className="text-blue-600" size={20} />
                                            <h4 className="font-semibold text-blue-800">Rekomendasi Strategis</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {insights.summary.mediumRiskStudents + insights.summary.highRiskStudents > 0 && (
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="font-medium text-gray-900">Program Mentoring</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Siapkan program pendampingan untuk {insights.summary.mediumRiskStudents + insights.summary.highRiskStudents} siswa yang memerlukan dukungan
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {insights.mapelPerformance.some(m => parseFloat(m.average) < 75) && (
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="font-medium text-gray-900">Evaluasi Mata Pelajaran</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Beberapa mata pelajaran memiliki nilai rata-rata rendah, perlu review metode pembelajaran
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <div className="bg-white p-3 rounded-lg">
                                                <p className="font-medium text-gray-900">Komunikasi Orang Tua</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Intensifkan koordinasi dengan orang tua untuk mendukung perkembangan siswa
                                                </p>
                                            </div>
                                            
                                            <div className="bg-white p-3 rounded-lg">
                                                <p className="font-medium text-gray-900">Monitoring Berkelanjutan</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Lakukan evaluasi rutin setiap bulan untuk memantau perkembangan
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary & Next Steps */}
                                <div className="bg-gray-50 rounded-xl p-6 mt-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">
                                        Kesimpulan Laporan
                                    </h4>
                                    <div className="p-4 bg-white rounded-lg">
                                        <h5 className="font-medium text-gray-900 mb-2">Langkah Selanjutnya:</h5>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• Fokus pada siswa berisiko tinggi dengan program konseling individual</li>
                                            <li>• Evaluasi efektivitas metode pembelajaran untuk meningkatkan *engagement*</li>
                                            <li>• Koordinasi intensif dengan orang tua untuk mendukung sistem pembelajaran</li>
                                            <li>• Monitor progress mingguan untuk siswa dalam kategori risiko</li>
                                            {userRole === 'admin' && (
                                                <li>• Review alokasi sumber daya dan dukungan untuk guru kelas dan mapel</li>
                                            )}
                                            <li>• Lakukan evaluasi bulanan untuk mengukur efektivitas intervensi</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* EXPORT SUMMARY */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-900">Laporan Siap Export</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Data periode {periodOptions.find(p => p.value === selectedPeriod)?.label.toLowerCase()} • 
                            {insights.summary.totalStudents} siswa • 
                            {insights.summary.totalMeetings} record kehadiran (dari {insights.summary.totalActualMeetings} pertemuan) • 
                            {insights.summary.totalAssessments} penilaian
                            {selectedMapel && ` • Mata Pelajaran: ${selectedMapel}`}
                            {selectedJenisNilai && ` • Jenis Nilai: ${selectedJenisNilai}`}
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onNavigate('/kehadiran')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors"
                        >
                            <FileText size={16} />
                            Export Presensi 
                        </button>
                        <button 
                            onClick={() => onNavigate('/nilai-akademik')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm transition-colors"
                        >
                            <Download size={16} />
                            Export Nilai
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Report;