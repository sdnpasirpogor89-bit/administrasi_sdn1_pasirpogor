// src/offlineSync.js
import db from "./db";
import { supabase } from "./supabaseClient";

/**
 * Save data dengan auto sync (offline-first)
 * @param {string} table - Nama table (attendance, grades, student_notes)
 * @param {object} data - Data yang mau disimpan
 */
export const saveWithSync = async (table, data) => {
  try {
    // 1. Save ke database lokal DULU (cepat & reliable)
    const localId = await db[table].add({
      ...data,
      sync_status: "pending", // Belum sync ke cloud
      created_at: new Date().toISOString(),
    });

    console.log(`✅ Data tersimpan lokal (ID: ${localId})`);

    // 2. Coba sync ke Supabase (kalau online)
    try {
      const { data: supabaseData, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (!error && supabaseData && supabaseData.length > 0) {
        // Berhasil sync → update status
        await db[table].update(localId, {
          sync_status: "synced",
          supabase_id: supabaseData[0].id,
        });
        console.log(
          `✅ Data berhasil sync ke cloud (ID: ${supabaseData[0].id})`
        );
      } else {
        console.log("⏳ Gagal sync, akan dicoba lagi nanti");
      }
    } catch (syncError) {
      // Offline atau network error
      console.log("📡 Offline - Data akan disync saat online");
    }

    return { success: true, id: localId };
  } catch (error) {
    console.error("❌ Error save data:", error);
    return { success: false, error };
  }
};

/**
 * Sync semua data yang pending ke Supabase
 */
export const syncPendingData = async () => {
  const tables = ["attendance", "grades", "student_notes"];
  let totalSynced = 0;

  console.log("🔄 Mulai sync data pending...");

  for (const table of tables) {
    try {
      // Ambil semua data yang belum sync
      const pendingData = await db[table]
        .where("sync_status")
        .equals("pending")
        .toArray();

      if (pendingData.length === 0) continue;

      console.log(`📤 Sync ${pendingData.length} data dari ${table}...`);

      for (const item of pendingData) {
        try {
          // Hapus field yang gak perlu dikirim ke Supabase
          const { id, sync_status, supabase_id, ...cleanData } = item;

          const { data, error } = await supabase
            .from(table)
            .insert(cleanData)
            .select();

          if (!error && data && data.length > 0) {
            // Update status jadi synced
            await db[table].update(item.id, {
              sync_status: "synced",
              supabase_id: data[0].id,
            });
            totalSynced++;
            console.log(`  ✅ Synced: ${item.id} → ${data[0].id}`);
          }
        } catch (err) {
          console.log(`  ⚠️ Gagal sync item ${item.id}:`, err.message);
        }
      }
    } catch (error) {
      console.error(`❌ Error sync table ${table}:`, error);
    }
  }

  console.log(`✅ Sync selesai! Total: ${totalSynced} data`);
  return totalSynced;
};

/**
 * Get data dengan fallback ke local (kalau offline)
 * @param {string} table - Nama table
 * @param {object} filter - Filter data (opsional)
 */
export const getDataWithFallback = async (table, filter = {}) => {
  try {
    // Coba fetch dari Supabase dulu
    let query = supabase.from(table).select();

    // Apply filter kalau ada
    Object.keys(filter).forEach((key) => {
      query = query.eq(key, filter[key]);
    });

    const { data, error } = await query;

    if (!error && data) {
      console.log(`✅ Data dari Supabase: ${data.length} records`);
      return data;
    }
  } catch (error) {
    console.log("📡 Offline - menggunakan data lokal");
  }

  // Fallback: ambil dari database lokal
  let localData = await db[table].toArray();

  // Apply filter manual
  Object.keys(filter).forEach((key) => {
    localData = localData.filter((item) => item[key] === filter[key]);
  });

  console.log(`💾 Data dari lokal: ${localData.length} records`);
  return localData;
};

/**
 * Get jumlah data pending sync
 */
export const getPendingCount = async () => {
  const tables = ["attendance", "grades", "student_notes"];
  let total = 0;

  for (const table of tables) {
    const count = await db[table]
      .where("sync_status")
      .equals("pending")
      .count();
    total += count;
  }

  return total;
};
