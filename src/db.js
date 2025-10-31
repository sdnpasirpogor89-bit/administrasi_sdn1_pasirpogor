// src/db.js - FIXED VERSION ✅
// FILE INI CUMA SCHEMA DEXIE AJA!
import Dexie from "dexie";

const db = new Dexie("SekolahPasirpogorDB");

// ✅ Schema FIXED - Match dengan Supabase + Tambah index sync_status
db.version(1).stores({
  // Table attendance - Match dengan Supabase structure
  attendance:
    "++id, tanggal, nisn, nama_siswa, kelas, status, keterangan, guru_input, jenis_presensi, sync_status, sync_operation, supabase_id, created_at, updated_at, deleted_at",

  // Table nilai - Match dengan Supabase structure
  grades:
    "++id, nisn, nama_siswa, kelas, mata_pelajaran, jenis_nilai, nilai, guru_input, tanggal, sync_status, sync_operation, supabase_id, created_at, updated_at, deleted_at",

  // Table catatan_siswa - Match dengan Supabase structure
  student_notes:
    "++id, student_id, teacher_id, class_id, academic_year, semester, category, label, note_content, action_taken, sync_status, sync_operation, supabase_id, created_at, updated_at, deleted_at",
});

// ✅ PENTING: Export default db
export default db;
