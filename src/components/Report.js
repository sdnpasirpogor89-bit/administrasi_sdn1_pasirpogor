// src/components/Report.js

import React from 'react';

// Pastikan Anda telah mengimpor ketiga komponen laporan yang telah dibuat:
// Sesuaikan path import ini jika letak filenya berbeda!
import ReportAdmin from './ReportAdmin';
import ReportTeacherClass from './ReportTeacherClass';
import ReportTeacherMapel from './ReportTeacherMapel';

const Report = ({ userData }) => {
    // 1. Ambil role dari userData. Default ke 'guest' jika data tidak ada.
    const userRole = userData?.role || 'guest';
    const userName = userData?.full_name || 'Pengguna';

    // 2. Logging untuk debugging (Opsional, tapi membantu)
    console.log("Rendering Report component for role:", userRole);

    // 3. Tentukan komponen yang akan di-render berdasarkan role
    const renderComponent = () => {
        switch (userRole) {
            case 'admin':
                return <ReportAdmin userData={userData} />;
            
            case 'guru_kelas':
                // Memastikan guru kelas memiliki data kelas untuk ditampilkan
                if (!userData.kelas) {
                    return (
                        <RoleError 
                            title="Akses Ditolak / Data Tidak Lengkap"
                            message={`${userName}, Role Anda adalah Guru Kelas, tetapi data Kelas Anda belum terdefinisi di sistem. Harap hubungi Admin.`}
                        />
                    );
                }
                return <ReportTeacherClass userData={userData} />;
            
            case 'guru_mapel':
                // KOREKSI: Kita hapus check ketat mata_pelajaran di sini 
                // agar ReportTeacherMapel.js (yang memiliki fallback PJOK/PAI) 
                // dapat dipanggil, meskipun data di database kosong.
                return <ReportTeacherMapel userData={userData} />; // Langsung render komponen

            case 'siswa':
                // Siswa mungkin hanya perlu dashboard sederhana
                return (
                    <RoleError 
                        title="Laporan Siswa"
                        message={`${userName}, Anda masuk sebagai Siswa. Anda dapat melihat ringkasan nilai dan kehadiran di dashboard utama.`}
                    />
                );
            
            default:
                return (
                    <RoleError 
                        title="Role Tidak Dikenali"
                        message={`Selamat datang, ${userName}. Role Anda (${userRole}) tidak dikenali oleh sistem laporan. Harap hubungi Admin.`}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {renderComponent()}
        </div>
    );
};

export default Report;


// --- Komponen Error Standar untuk kasus Role tidak sesuai ---

const RoleError = ({ title, message }) => (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 h-screen bg-white">
        <div className="p-4 bg-red-100 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-center">{title}</h1>
        <p className="text-sm text-gray-600 max-w-lg text-center">{message}</p>
    </div>
);