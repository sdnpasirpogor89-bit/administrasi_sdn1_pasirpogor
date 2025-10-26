// src/db.js
import Dexie from "dexie";

// Bikin database lokal
const db = new Dexie("SekolahPasirpogorDB");

// Define tables (sesuaikan dengan table Supabase lo)
db.version(1).stores({
  // Table presensi
  attendance:
    "++id, student_id, date, status, note, sync_status, created_at, supabase_id",

  // Table nilai
  grades:
    "++id, student_id, subject, grade, semester, sync_status, created_at, supabase_id",

  // Table catatan siswa
  student_notes:
    "++id, student_id, note, date, teacher_id, sync_status, created_at, supabase_id",

  // Bisa ditambah table lain kalau perlu
});

export default db;
