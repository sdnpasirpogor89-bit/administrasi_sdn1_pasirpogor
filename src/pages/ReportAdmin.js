import React, { useMemo, useCallback, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, AreaChart, Area, Legend, Cell 
} from 'recharts';
import {
    Users, GraduationCap, UserCheck, Download, FileText,
    Award, AlertTriangle, CheckCircle, BookOpen, TrendingUp,
    Filter, MoreVertical, Eye, Settings
} from 'lucide-react';

// =============================================
// 🎯 OPTIMIZATION 1: MEMOIZED COMPONENTS
// =============================================

const InsightCard = React.memo(({ icon: Icon, title, value, description, color, alert, trend }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group ${
        alert ? 'border-l-4 border-l-red-500' : ''
    }`}>
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
                        <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                        {alert && (
                            <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">
                                Perlu Perhatian
                            </span>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                    {trend && (
                        <div className={`flex items-center gap-2 text-xs font-medium ${
                            trend.positive ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {trend.positive ? <TrendingUp size={14} /> : <AlertTriangle size={14} />}
                            {trend.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
));

const ClassPerformanceCard = React.memo(({ classData, classOpt, onClassSelect }) => {
    const getPerformanceColor = (value, type) => {
        if (type === 'attendance') {
            return value < 80 ? 'text-red-600' : value < 90 ? 'text-yellow-600' : 'text-green-600';
        }
        return value < 70 ? 'text-red-600' : value < 80 ? 'text-yellow-600' : 'text-green-600';
    };

    return (
        <div 
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => onClassSelect(classOpt.value)}
        >
            <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {classOpt.label}
                </h4>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={16} className="text-gray-400" />
                </div>
            </div>
            
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Siswa</span>
                    <span className="font-semibold text-gray-900">{classData.studentCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kehadiran</span>
                    <span className={`font-semibold ${getPerformanceColor(classData.attendanceRate, 'attendance')}`}>
                        {classData.attendanceRate}%
                    </span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rata-rata</span>
                    <span className={`font-semibold ${getPerformanceColor(classData.avgGrade, 'grade')}`}>
                        {classData.avgGrade}
                    </span>
                </div>
                
                <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Penilaian</span>
                        <span className="font-medium">{classData.assessmentCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

// =============================================
// 🎯 OPTIMIZATION 2: CUSTOM HOOKS
// =============================================

const useAdminAnalytics = (students, attendance, nilai, selectedClass, selectedMapel) => {
    return useMemo(() => {
        // Filter data dengan optimasi
        const filteredStudents = selectedClass 
            ? students.filter(s => s.kelas === parseInt(selectedClass))
            : students;

        const studentNisns = filteredStudents.map(s => s.nisn);
        const filteredAttendance = attendance.filter(a => studentNisns.includes(a.nisn));
        const filteredNilai = selectedMapel
            ? nilai.filter(n => studentNisns.includes(n.nisn) && n.mata_pelajaran === selectedMapel)
            : nilai.filter(n => studentNisns.includes(n.nisn));

        // Analytics calculations
        const monthlyAttendance = {};
        filteredAttendance.forEach(record => {
            const monthKey = new Date(record.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
            if (!monthlyAttendance[monthKey]) {
                monthlyAttendance[monthKey] = { total: 0, hadir: 0, alpha: 0, izin: 0, sakit: 0 };
            }
            monthlyAttendance[monthKey].total++;
            monthlyAttendance[monthKey][record.status.toLowerCase()]++;
        });

        const attendanceTrend = Object.entries(monthlyAttendance)
            .map(([month, data]) => ({
                month,
                'Hadir': data.hadir,
                'Alpha': data.alpha,
                'Izin': data.izin,
                'Sakit': data.sakit,
                percentage: data.total > 0 ? ((data.hadir / data.total) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => new Date(a.month) - new Date(b.month));

        // Performance by class dengan caching
        const performanceByClass = {};
        const classOptions = Array.from({ length: 6 }, (_, i) => ({
            label: `Kelas ${i + 1}`,
            value: `${i + 1}`
        }));

        classOptions.forEach(classOpt => {
            const classStudents = students.filter(s => s.kelas === parseInt(classOpt.value));
            const classNilai = nilai.filter(n => classStudents.some(s => s.nisn === n.nisn));
            const classAttendance = attendance.filter(a => classStudents.some(s => s.nisn === a.nisn));
            
            const avgGrade = classNilai.length > 0 
                ? (classNilai.reduce((sum, n) => sum + n.nilai, 0) / classNilai.length).toFixed(1)
                : 0;
                
            const attendanceRate = classAttendance.length > 0
                ? (classAttendance.filter(a => a.status.toLowerCase() === 'hadir').length / classAttendance.length * 100).toFixed(1)
                : 0;

            performanceByClass[classOpt.value] = {
                label: classOpt.label,
                studentCount: classStudents.length,
                avgGrade,
                attendanceRate,
                assessmentCount: classNilai.length
            };
        });

        // Summary statistics
        const totalStudents = filteredStudents.length;
        const overallAttendanceRate = filteredAttendance.length > 0 
            ? (filteredAttendance.filter(a => a.status.toLowerCase() === 'hadir').length / filteredAttendance.length * 100).toFixed(1)
            : 0;
        
        const overallAvgGrade = filteredNilai.length > 0 
            ? (filteredNilai.reduce((sum, n) => sum + n.nilai, 0) / filteredNilai.length).toFixed(1)
            : 0;

        return {
            attendanceTrend,
            performanceByClass,
            classOptions,
            summary: {
                totalStudents,
                overallAttendanceRate,
                overallAvgGrade,
                totalAssessments: filteredNilai.length,
                totalAttendanceRecords: filteredAttendance.length,
                filteredStudentsCount: filteredStudents.length,
                filteredAttendanceCount: filteredAttendance.length,
                filteredNilaiCount: filteredNilai.length
            }
        };
    }, [students, attendance, nilai, selectedClass, selectedMapel]);
};

// =============================================
// 🎯 OPTIMIZATION 3: MAIN COMPONENT
// =============================================

const ReportAdmin = ({
    students,
    attendance,
    nilai,
    periodOptions,
    selectedPeriod,
    onPeriodChange,
    classOptions,
    selectedClass,
    onClassChange,
    onNavigate
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [mataPelajaranList, setMataPelajaranList] = useState([]);
    const [selectedMapel, setSelectedMapel] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [exportLoading, setExportLoading] = useState(false);

    // Extract unique mata pelajaran
    const uniqueMapel = useMemo(() => 
        [...new Set(nilai.map(n => n.mata_pelajaran))].filter(Boolean),
        [nilai]
    );

    // Analytics dengan custom hook
    const insights = useAdminAnalytics(students, attendance, nilai, selectedClass, selectedMapel);

    // Export handler dengan optimasi
    const handleExport = useCallback(async (type) => {
        setExportLoading(true);
        try {
            // Simulate export process
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log(`Exporting ${type} data...`);
            // Actual export logic here
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExportLoading(false);
        }
    }, []);

    // Tab configuration
    const tabs = useMemo(() => [
        { id: 'overview', label: 'Ringkasan', icon: Users, description: 'Gambaran keseluruhan' },
        { id: 'classes', label: 'Performa Kelas', icon: GraduationCap, description: 'Analisis per kelas' },
        { id: 'analytics', label: 'Analisis Mendalam', icon: Award, description: 'Insight detail' }
    ], []);

    // Chart colors dengan memoization
    const chartColors = useMemo(() => ({
        hadir: '#10B981',
        alpha: '#EF4444', 
        izin: '#3B82F6',
        sakit: '#F59E0B',
        primary: '#3B82F6'
    }), []);

    return (
        <div className="space-y-6">
            {/* 🎯 ENHANCED FILTER SECTION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Period Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Periode</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={selectedPeriod}
                                    onChange={(e) => onPeriodChange(e.target.value)}
                                >
                                    {periodOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Class Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Kelas</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={selectedClass}
                                    onChange={(e) => onClassChange(e.target.value)}
                                >
                                    <option value="">Semua Kelas</option>
                                    {classOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Mata Pelajaran Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={selectedMapel}
                                    onChange={(e) => setSelectedMapel(e.target.value)}
                                >
                                    <option value="">Semua Mapel</option>
                                    {uniqueMapel.map(mapel => (
                                        <option key={mapel} value={mapel}>{mapel}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {/* View Controls */}
                        <div className="flex items-center gap-3">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                        viewMode === 'grid' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                        viewMode === 'list' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(selectedClass || selectedMapel) && (
                    <div className="px-6 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-500">Filter aktif:</span>
                            {selectedClass && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                    Kelas: {selectedClass}
                                    <button 
                                        onClick={() => onClassChange('')}
                                        className="hover:text-blue-900 transition-colors"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {selectedMapel && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                    Mapel: {selectedMapel}
                                    <button 
                                        onClick={() => setSelectedMapel('')}
                                        className="hover:text-green-900 transition-colors"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 🎯 ENHANCED TAB SYSTEM */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 py-4 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap group ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon size={18} className="transition-transform group-hover:scale-110" />
                                <div className="text-left">
                                    <div>{tab.label}</div>
                                    <div className="text-xs text-gray-400 font-normal">{tab.description}</div>
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* OVERVIEW TAB CONTENT */}
                    {activeTab === 'overview' && <OverviewTab insights={insights} chartColors={chartColors} />}
                    
                    {/* CLASSES TAB CONTENT */}  
                    {activeTab === 'classes' && (
                        <ClassesTab 
                            insights={insights} 
                            viewMode={viewMode}
                            onClassSelect={onClassChange}
                        />
                    )}
                    
                    {/* ANALYTICS TAB CONTENT */}
                    {activeTab === 'analytics' && <AnalyticsTab insights={insights} />}
                </div>
            </div>

            {/* 🎯 SMART EXPORT SECTION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Laporan Siap Export</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span>📊 {insights.summary.totalStudents} siswa</span>
                            <span>📅 {insights.summary.totalAttendanceRecords} kehadiran</span>
                            <span>🎯 {insights.summary.totalAssessments} penilaian</span>
                            {selectedClass && <span>🏫 Kelas {selectedClass}</span>}
                            {selectedMapel && <span>📚 {selectedMapel}</span>}
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleExport('pdf')}
                            disabled={exportLoading}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
                        >
                            <FileText size={16} />
                            {exportLoading ? 'Processing...' : 'Export PDF'}
                        </button>
                        <button 
                            onClick={() => handleExport('excel')}
                            disabled={exportLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
                        >
                            <Download size={16} />
                            {exportLoading ? 'Processing...' : 'Export Excel'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================
// 🎯 OPTIMIZATION 4: TAB COMPONENTS
// =============================================

const OverviewTab = React.memo(({ insights, chartColors }) => (
    <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InsightCard
                icon={Users}
                title="Total Siswa"
                value={insights.summary.totalStudents}
                description="Jumlah siswa aktif"
                color="bg-blue-600"
            />
            <InsightCard
                icon={UserCheck}
                title="Tingkat Kehadiran"
                value={`${insights.summary.overallAttendanceRate}%`}
                description="Rata-rata kehadiran"
                color="bg-green-600"
                alert={insights.summary.overallAttendanceRate < 80}
                trend={{
                    positive: insights.summary.overallAttendanceRate >= 80,
                    text: insights.summary.overallAttendanceRate >= 80 ? 'Baik' : 'Perlu perhatian'
                }}
            />
            <InsightCard
                icon={GraduationCap}
                title="Rata-rata Nilai"
                value={insights.summary.overallAvgGrade}
                description="Nilai akademik rata-rata"
                color="bg-purple-600"
                alert={insights.summary.overallAvgGrade < 75}
            />
            <InsightCard
                icon={BookOpen}
                title="Aktivitas Penilaian"
                value={insights.summary.totalAssessments}
                description="Total penilaian tercatat"
                color="bg-orange-600"
            />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend Chart */}
            <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Kehadiran Bulanan</h3>
                <div className="h-64">
                    {insights.attendanceTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={insights.attendanceTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="month" 
                                    fontSize={12}
                                    tick={{ fill: '#6B7280' }}
                                />
                                <YAxis 
                                    fontSize={12}
                                    tick={{ fill: '#6B7280' }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Area 
                                    type="monotone" 
                                    dataKey="Hadir" 
                                    stackId="1" 
                                    stroke={chartColors.hadir} 
                                    fill={chartColors.hadir}
                                    fillOpacity={0.6}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Sakit" 
                                    stackId="1" 
                                    stroke={chartColors.sakit} 
                                    fill={chartColors.sakit}
                                    fillOpacity={0.6}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Izin" 
                                    stackId="1" 
                                    stroke={chartColors.izin} 
                                    fill={chartColors.izin}
                                    fillOpacity={0.6}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Alpha" 
                                    stackId="1" 
                                    stroke={chartColors.alpha} 
                                    fill={chartColors.alpha}
                                    fillOpacity={0.6}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <UserCheck size={48} className="mb-4 text-gray-300" />
                            <p className="font-medium">Tidak ada data kehadiran</p>
                            <p className="text-sm text-center mt-1">Data akan muncul setelah ada record kehadiran</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Performa Kelas</h3>
                <div className="h-64">
                    {Object.keys(insights.performanceByClass).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.values(insights.performanceByClass)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="label" 
                                    fontSize={11}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    tick={{ fill: '#6B7280' }}
                                />
                                <YAxis 
                                    fontSize={11}
                                    tick={{ fill: '#6B7280' }}
                                />
                                <Tooltip />
                                <Bar 
                                    dataKey="attendanceRate" 
                                    name="Kehadiran %"
                                    fill={chartColors.primary}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <GraduationCap size={48} className="mb-4 text-gray-300" />
                            <p className="font-medium">Tidak ada data kelas</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
));

const ClassesTab = React.memo(({ insights, viewMode, onClassSelect }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">Performa Kelas</h3>
                <p className="text-sm text-gray-500">
                    Analisis detail performa setiap kelas
                </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>≥ 90%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>80-89%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>&lt; 80%</span>
                </div>
            </div>
        </div>

        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.classOptions.map(classOpt => (
                    <ClassPerformanceCard
                        key={classOpt.value}
                        classData={insights.performanceByClass[classOpt.value]}
                        classOpt={classOpt}
                        onClassSelect={onClassSelect}
                    />
                ))}
            </div>
        ) : (
            <div className="bg-gray-50 rounded-xl p-4">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Kelas</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-900">Siswa</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-900">Kehadiran</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-900">Nilai Rata-rata</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-900">Penilaian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {insights.classOptions.map(classOpt => {
                                const data = insights.performanceByClass[classOpt.value];
                                return (
                                    <tr 
                                        key={classOpt.value} 
                                        className="border-b border-gray-100 hover:bg-white cursor-pointer transition-colors"
                                        onClick={() => onClassSelect(classOpt.value)}
                                    >
                                        <td className="py-3 px-4 font-medium text-gray-900">{classOpt.label}</td>
                                        <td className="py-3 px-4 text-center">{data.studentCount}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`font-semibold ${
                                                data.attendanceRate >= 90 ? 'text-green-600' :
                                                data.attendanceRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                                {data.attendanceRate}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center font-semibold">{data.avgGrade}</td>
                                        <td className="py-3 px-4 text-center">{data.assessmentCount}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
));

const AnalyticsTab = React.memo(({ insights }) => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Analisis & Rekomendasi Strategis</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Actions */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="text-red-600" size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-800">Prioritas Tindakan</h4>
                        <p className="text-sm text-red-600">Segera ditangani</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {insights.summary.overallAttendanceRate < 85 && (
                        <div className="bg-white rounded-lg p-4 border border-red-100">
                            <p className="font-medium text-gray-900 mb-2">🚨 Tingkatkan Kehadiran</p>
                            <p className="text-sm text-gray-600">
                                Rata-rata kehadiran {insights.summary.overallAttendanceRate}% berada di bawah target 85%
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors">
                                    Analisis Penyebab
                                </button>
                                <button className="text-xs border border-red-600 text-red-600 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">
                                    Program Intervensi
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {insights.summary.overallAvgGrade < 75 && (
                        <div className="bg-white rounded-lg p-4 border border-red-100">
                            <p className="font-medium text-gray-900 mb-2">📚 Program Remedial</p>
                            <p className="text-sm text-gray-600">
                                Rata-rata nilai {insights.summary.overallAvgGrade} memerlukan intervensi akademik
                            </p>
                        </div>
                    )}
                    
                    {(insights.summary.overallAttendanceRate >= 85 && insights.summary.overallAvgGrade >= 75) && (
                        <div className="bg-white rounded-lg p-4 border border-green-100 text-center">
                            <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                            <p className="font-medium text-gray-900">Situasi Optimal</p>
                            <p className="text-sm text-gray-600 mt-1">Tidak ada tindakan prioritas saat ini</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Award className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-800">Rekomendasi Strategis</h4>
                        <p className="text-sm text-blue-600">Pengembangan jangka panjang</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="font-medium text-gray-900 mb-2">👥 Program Mentoring</p>
                        <p className="text-sm text-gray-600">
                            Implementasi sistem mentoring untuk meningkatkan engagement siswa
                        </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="font-medium text-gray-900 mb-2">📊 Analytics Dashboard</p>
                        <p className="text-sm text-gray-600">
                            Pengembangan dashboard real-time untuk monitoring performa
                        </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="font-medium text-gray-900 mb-2">🤝 Kolaborasi Guru</p>
                        <p className="text-sm text-gray-600">
                            Intensifkan forum diskusi dan sharing best practices antar guru
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
                <div className="text-2xl font-bold text-blue-600">{insights.summary.totalStudents}</div>
                <div className="text-sm text-gray-600 mt-1">Total Siswa</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
                <div className="text-2xl font-bold text-green-600">{insights.summary.overallAttendanceRate}%</div>
                <div className="text-sm text-gray-600 mt-1">Kehadiran</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
                <div className="text-2xl font-bold text-purple-600">{insights.summary.overallAvgGrade}</div>
                <div className="text-sm text-gray-600 mt-1">Nilai Rata-rata</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
                <div className="text-2xl font-bold text-orange-600">{insights.summary.totalAssessments}</div>
                <div className="text-sm text-gray-600 mt-1">Aktivitas</div>
            </div>
        </div>
    </div>
));

export default ReportAdmin;