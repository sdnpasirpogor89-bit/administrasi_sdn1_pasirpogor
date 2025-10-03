import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, AreaChart, Area, Legend, Cell
} from 'recharts';
import {
    Users, GraduationCap, UserCheck, Download, FileText,
    Award, AlertTriangle, CheckCircle, BookOpen, Target,
    TrendingUp, TrendingDown, Clock, Filter
} from 'lucide-react';

const ReportTeacher = ({
    userRole,
    userKelas,
    userName,
    students,
    attendance,
    nilai,
    periodOptions,
    selectedPeriod,
    onPeriodChange,
    selectedMapel,
    onMapelChange,
    selectedJenisNilai,
    onJenisNilaiChange,
    onNavigate
}) => {
    const [activeTab, setActiveTab] = useState(userRole === 'guru_mapel' ? 'subjects' : 'overview');
    const [mataPelajaranList, setMataPelajaranList] = useState([]);
    const [jenisNilaiList, setJenisNilaiList] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

    // Extract unique values for filters
    useEffect(() => {
        const uniqueMapel = [...new Set(nilai.map(n => n.mata_pelajaran))].filter(Boolean);
        const uniqueJenisNilai = [...new Set(nilai.map(n => n.jenis_nilai))].filter(Boolean);
        setMataPelajaranList(uniqueMapel);
        setJenisNilaiList(uniqueJenisNilai);
    }, [nilai]);

    // Filter data
    const getFilteredData = () => {
        let filteredNilai = nilai;

        // Mata pelajaran filter
        if (selectedMapel) {
            filteredNilai = filteredNilai.filter(n => n.mata_pelajaran === selectedMapel);
        }

        // Jenis nilai filter
        if (selectedJenisNilai) {
            filteredNilai = filteredNilai.filter(n => n.jenis_nilai === selectedJenisNilai);
        }

        return { 
            students, 
            attendance, 
            nilai: filteredNilai 
        };
    };

    const { students: filteredStudents, attendance: filteredAttendance, nilai: filteredNilai } = getFilteredData();

    // Analytics calculations untuk guru
    const calculateTeacherInsights = () => {
        // Student performance analysis
        const studentPerformance = filteredStudents.map(student => {
            const studentAttendance = attendance.filter(a => a.nisn === student.nisn);
            const studentGrades = filteredNilai.filter(n => n.nisn === student.nisn);
            
            const totalMeetings = studentAttendance.length;
            const hadirCount = studentAttendance.filter(a => a.status.toLowerCase() === 'hadir').length;
            const alphaCount = studentAttendance.filter(a => a.status.toLowerCase() === 'alpha').length;
            const attendanceRate = totalMeetings > 0 ? (hadirCount / totalMeetings * 100) : 0;
            
            const avgGrade = studentGrades.length > 0 
                ? studentGrades.reduce((sum, g) => sum + g.nilai, 0) / studentGrades.length
                : 0;

            // Risk assessment
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

        // Mata pelajaran performance
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

        // Attendance trends
        const monthlyAttendance = {};
        filteredAttendance.forEach(record => {
            const monthKey = new Date(record.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
            if (!monthlyAttendance[monthKey]) {
                monthlyAttendance[monthKey] = { total: 0, hadir: 0 };
            }
            monthlyAttendance[monthKey].total++;
            if (record.status.toLowerCase() === 'hadir') {
                monthlyAttendance[monthKey].hadir++;
            }
        });

        const attendanceTrend = Object.entries(monthlyAttendance).map(([month, data]) => ({
            month,
            'Hadir': data.hadir,
            'Total': data.total,
            percentage: data.total > 0 ? ((data.hadir / data.total) * 100).toFixed(1) : 0
        })).sort((a, b) => new Date(a.month) - new Date(b.month));

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
            studentPerformance,
            mapelPerformance,
            attendanceTrend,
            topPerformers,
            summary: {
                totalStudents,
                overallAttendanceRate,
                overallAvgGrade,
                highRiskStudents,
                mediumRiskStudents,
                lowRiskStudents,
                totalAssessments: filteredNilai.length,
                totalAttendanceRecords: filteredAttendance.length
            }
        };
    };

    const insights = calculateTeacherInsights();

    // Components
    const InsightCard = ({ icon: Icon, title, value, description, color, alert, trend }) => (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all ${alert ? 'border-l-4 border-l-red-500' : ''}`}>
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
                                {trend.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
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

        const isAttendanceDataAvailable = student.totalMeetings > 0;
        const isGradeDataAvailable = student.totalAssessments > 0;

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-gray-900">{student.nama_siswa}</h3>
                        <p className="text-sm text-gray-500">Kelas {student.kelas}</p>
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

    // Tabs berdasarkan role
    const tabs = [
        { id: 'overview', label: 'Ringkasan', icon: Users, roles: ['guru_kelas'] },
        { id: 'subjects', label: 'Mata Pelajaran', icon: BookOpen, roles: ['guru_kelas', 'guru_mapel'] },
        { id: 'students', label: 'Siswa', icon: GraduationCap, roles: ['guru_kelas'] },
        { id: 'insights', label: 'Rekomendasi', icon: Target, roles: ['guru_kelas', 'guru_mapel'] }
    ].filter(tab => tab.roles.includes(userRole));

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Periode Analisis</label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={selectedPeriod}
                            onChange={(e) => onPeriodChange(e.target.value)}
                        >
                            {periodOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={selectedMapel}
                            onChange={(e) => onMapelChange(e.target.value)}
                        >
                            <option value="">Semua Mata Pelajaran</option>
                            {mataPelajaranList.map(mapel => (
                                <option key={mapel} value={mapel}>{mapel}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Nilai</label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={selectedJenisNilai}
                            onChange={(e) => onJenisNilaiChange(e.target.value)}
                        >
                            <option value="">Semua Jenis Nilai</option>
                            {jenisNilaiList.map(jenis => (
                                <option key={jenis} value={jenis}>{jenis}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Overview Tab - Guru Kelas Only */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <InsightCard
                                    icon={Users}
                                    title="Total Siswa"
                                    value={insights.summary.totalStudents}
                                    description={`Kelas ${userKelas}`}
                                    color="bg-blue-600"
                                />
                                <InsightCard
                                    icon={UserCheck}
                                    title="Tingkat Kehadiran"
                                    value={`${insights.summary.overallAttendanceRate}%`}
                                    description={`${insights.summary.totalAttendanceRecords} record`}
                                    color="bg-green-600"
                                    alert={insights.summary.overallAttendanceRate < 80}
                                />
                                <InsightCard
                                    icon={GraduationCap}
                                    title="Rata-rata Nilai"
                                    value={insights.summary.overallAvgGrade}
                                    description={`${insights.summary.totalAssessments} penilaian`}
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

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Kehadiran</h3>
                                    <div className="h-64">
                                        {insights.attendanceTrend.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={insights.attendanceTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="Hadir" stroke="#10B981" fill="#10B981" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                <Clock size={48} className="mb-2" />
                                                <p>Tidak ada data kehadiran</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Kehadiran</h3>
                                    <div className="h-64">
                                        {filteredAttendance.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Hadir', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'hadir').length },
                                                            { name: 'Alpha', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'alpha').length },
                                                            { name: 'Izin', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'izin').length },
                                                            { name: 'Sakit', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'sakit').length }
                                                        ].filter(item => item.value > 0)}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        dataKey="value"
                                                        label
                                                    >
                                                        {[
                                                            { name: 'Hadir', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'hadir').length, fill: '#10B981' },
                                                            { name: 'Alpha', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'alpha').length, fill: '#EF4444' },
                                                            { name: 'Izin', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'izin').length, fill: '#3B82F6' },
                                                            { name: 'Sakit', value: filteredAttendance.filter(a => a.status.toLowerCase() === 'sakit').length, fill: '#F59E0B' }
                                                        ].filter(item => item.value > 0).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                <UserCheck size={48} className="mb-2" />
                                                <p>Tidak ada data kehadiran</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subjects Tab - All Teachers */}
                    {activeTab === 'subjects' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {userRole === 'guru_mapel' ? 'Performa Mata Pelajaran' : 'Performa per Mata Pelajaran'}
                            </h3>
                            
                            {insights.mapelPerformance.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h4 className="font-semibold text-gray-900 mb-4">Rata-rata Nilai</h4>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={insights.mapelPerformance}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="mapel" angle={-45} textAnchor="end" height={80} />
                                                        <YAxis domain={[0, 100]} />
                                                        <Tooltip />
                                                        <Bar dataKey="average" fill="#8B5CF6" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h4 className="font-semibold text-gray-900 mb-4">Distribusi Penilaian</h4>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={insights.mapelPerformance.map((item, index) => ({
                                                                name: item.mapel,
                                                                value: item.count,
                                                                fill: COLORS[index % COLORS.length]
                                                            }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={80}
                                                            dataKey="value"
                                                            label
                                                        />
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
                                            ? 'Coba ubah filter untuk melihat data'
                                            : 'Data akan muncul setelah menginput penilaian'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Students Tab - Guru Kelas Only */}
                    {activeTab === 'students' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Performa Individual Siswa</h3>
                                    <p className="text-sm text-gray-500">
                                        Menampilkan {insights.studentPerformance.length} siswa
                                    </p>
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
                                </div>
                            </div>

                            {insights.studentPerformance.length > 0 ? (
                                <>
                                    {/* Top Performers */}
                                    {insights.topPerformers.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <Award size={20} className="text-yellow-500" />
                                                Top Performer
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                                {insights.topPerformers.map((student, index) => (
                                                    <div key={student.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 text-center">
                                                        <div className="text-2xl mb-2">
                                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                                                        </div>
                                                        <p className="font-semibold text-gray-900 text-sm">{student.nama_siswa}</p>
                                                        <p className="text-lg font-bold text-yellow-600 mt-1">{student.avgGrade}</p>
                                                        <p className="text-xs text-gray-500">{student.attendanceRate}% Hadir</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* All Students */}
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
                                    <p className="text-gray-500">Data siswa akan muncul setelah terdaftar</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Insights Tab - All Teachers */}
                    {activeTab === 'insights' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Rekomendasi & Tindakan</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Priority Actions */}
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle className="text-red-600" size={20} />
                                        <h4 className="font-semibold text-red-800">Prioritas Tindakan</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {insights.summary.highRiskStudents > 0 && (
                                            <div className="bg-white p-3 rounded-lg">
                                                <p className="font-medium text-gray-900">Siswa Berisiko Tinggi</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {insights.summary.highRiskStudents} siswa memerlukan perhatian khusus dan konseling
                                                </p>
                                            </div>
                                        )}
                                        
                                        {insights.summary.overallAttendanceRate < 80 && (
                                            <div className="bg-white p-3 rounded-lg">
                                                <p className="font-medium text-gray-900">Tingkatkan Kehadiran</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Kehadiran {insights.summary.overallAttendanceRate}% perlu ditingkatkan
                                                </p>
                                            </div>
                                        )}
                                        
                                        {insights.summary.overallAvgGrade < 75 && (
                                            <div className="bg-white p-3 rounded-lg">
                                                <p className="font-medium text-gray-900">Program Remedial</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Rata-rata nilai {insights.summary.overallAvgGrade} memerlukan intervensi pembelajaran
                                                </p>
                                            </div>
                                        )}
                                        
                                        {insights.summary.highRiskStudents === 0 && insights.summary.overallAttendanceRate >= 80 && insights.summary.overallAvgGrade >= 75 && (
                                            <div className="bg-white p-3 rounded-lg text-center">
                                                <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                                                <p className="font-medium text-gray-900">Situasi Optimal</p>
                                                <p className="text-sm text-gray-600">Tidak ada tindakan prioritas saat ini</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Teaching Recommendations */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Target className="text-blue-600" size={20} />
                                        <h4 className="font-semibold text-blue-800">Strategi Mengajar</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {insights.mapelPerformance.some(m => parseFloat(m.average) < 75) && (
                                            <div className="bg-white p-3 rounded-lg">
                                                <p className="font-medium text-gray-900">Evaluasi Metode</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Beberapa mata pelajaran memerlukan review metode pembelajaran
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="font-medium text-gray-900">Pembelajaran Diferensiasi</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Siapkan materi dengan level kesulitan berbeda untuk berbagai kemampuan siswa
                                            </p>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="font-medium text-gray-900">Feedback Rutin</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Berikan umpan balik secara teratur untuk meningkatkan motivasi belajar
                                            </p>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="font-medium text-gray-900">Kolaborasi dengan Orang Tua</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Intensifkan komunikasi untuk mendukung pembelajaran di rumah
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">Export Laporan</h3>
                        <p className="text-sm text-gray-500">
                            {userRole === 'guru_kelas' ? `Kelas ${userKelas}` : `Mata Pelajaran - ${userName}`} • 
                            {insights.summary.totalStudents} siswa
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onNavigate('/kehadiran')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <FileText size={16} />
                            Export Presensi
                        </button>
                        <button 
                            onClick={() => onNavigate('/nilai-akademik')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
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

export default ReportTeacher;