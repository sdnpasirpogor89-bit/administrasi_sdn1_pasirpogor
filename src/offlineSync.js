// src/offlineSync.js
import db from "./db";
import { supabase } from "./supabaseClient";

/**
 * CREATE - Save data dengan auto sync (offline-first)
 * @param {string} table - Nama table (attendance, grades, student_notes)
 * @param {object} data - Data yang mau disimpan
 */
export const saveWithSync = async (table, data) => {
  try {
    // 1. Save ke database lokal DULU (cepat & reliable)
    const localId = await db[table].add({
      ...data,
      sync_status: "pending", // Belum sync ke cloud
      sync_operation: "create", // Operasi: create
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
 * UPDATE - Update data dengan auto sync
 * @param {string} table - Nama table
 * @param {number} localId - ID lokal di IndexedDB
 * @param {object} updates - Data yang mau diupdate
 */
export const updateWithSync = async (table, localId, updates) => {
  try {
    // 1. Ambil data existing dari lokal
    const existing = await db[table].get(localId);

    if (!existing) {
      throw new Error("Data tidak ditemukan");
    }

    // 2. Update di database lokal
    await db[table].update(localId, {
      ...updates,
      sync_status: "pending",
      sync_operation: "update",
      updated_at: new Date().toISOString(),
    });

    console.log(`✅ Data updated lokal (ID: ${localId})`);

    // 3. Coba sync ke Supabase
    try {
      const supabaseId = existing.supabase_id;

      if (supabaseId) {
        // Sudah pernah sync, update by supabase_id
        const { error } = await supabase
          .from(table)
          .update(updates)
          .eq("id", supabaseId);

        if (!error) {
          await db[table].update(localId, { sync_status: "synced" });
          console.log(`✅ Update berhasil sync ke cloud`);
        }
      } else {
        // Belum pernah sync, tandai pending
        console.log("⏳ Data belum pernah sync, akan diupdate saat sync");
      }
    } catch (syncError) {
      console.log("📡 Offline - Update akan disync saat online");
    }

    return { success: true, id: localId };
  } catch (error) {
    console.error("❌ Error update data:", error);
    return { success: false, error };
  }
};

/**
 * DELETE - Hapus data dengan auto sync
 * @param {string} table - Nama table
 * @param {number} localId - ID lokal di IndexedDB
 */
export const deleteWithSync = async (table, localId) => {
  try {
    // 1. Ambil data existing
    const existing = await db[table].get(localId);

    if (!existing) {
      throw new Error("Data tidak ditemukan");
    }

    // 2. Tandai sebagai deleted (soft delete di lokal)
    await db[table].update(localId, {
      sync_status: "pending",
      sync_operation: "delete",
      deleted_at: new Date().toISOString(),
    });

    console.log(`✅ Data marked for deletion (ID: ${localId})`);

    // 3. Coba hapus di Supabase
    try {
      const supabaseId = existing.supabase_id;

      if (supabaseId) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("id", supabaseId);

        if (!error) {
          // Hapus permanent dari lokal setelah berhasil sync
          await db[table].delete(localId);
          console.log(`✅ Delete berhasil sync ke cloud`);
        }
      } else {
        // Data belum pernah sync, langsung hapus dari lokal
        await db[table].delete(localId);
        console.log(`✅ Data lokal dihapus (belum pernah sync)`);
      }
    } catch (syncError) {
      console.log("📡 Offline - Delete akan disync saat online");
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Error delete data:", error);
    return { success: false, error };
  }
};

/**
 * SYNC - Sync semua data yang pending ke Supabase
 */
export const syncPendingData = async () => {
  const tables = ["attendance", "grades", "student_notes"];
  let totalSynced = 0;
  let totalErrors = 0;

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
          const operation = item.sync_operation || "create";

          // Hapus field yang gak perlu dikirim ke Supabase
          const {
            id,
            sync_status,
            sync_operation,
            supabase_id,
            deleted_at,
            ...cleanData
          } = item;

          if (operation === "create") {
            // CREATE: Insert data baru
            const { data, error } = await supabase
              .from(table)
              .insert(cleanData)
              .select();

            if (!error && data && data.length > 0) {
              await db[table].update(item.id, {
                sync_status: "synced",
                supabase_id: data[0].id,
              });
              totalSynced++;
              console.log(`  ✅ Created: ${item.id} → ${data[0].id}`);
            }
          } else if (operation === "update") {
            // UPDATE: Update data existing
            if (item.supabase_id) {
              const { error } = await supabase
                .from(table)
                .update(cleanData)
                .eq("id", item.supabase_id);

              if (!error) {
                await db[table].update(item.id, { sync_status: "synced" });
                totalSynced++;
                console.log(`  ✅ Updated: ${item.id}`);
              }
            } else {
              // Belum ada supabase_id, create dulu
              const { data, error } = await supabase
                .from(table)
                .insert(cleanData)
                .select();

              if (!error && data && data.length > 0) {
                await db[table].update(item.id, {
                  sync_status: "synced",
                  supabase_id: data[0].id,
                });
                totalSynced++;
                console.log(`  ✅ Created (was update): ${item.id}`);
              }
            }
          } else if (operation === "delete") {
            // DELETE: Hapus data
            if (item.supabase_id) {
              const { error } = await supabase
                .from(table)
                .delete()
                .eq("id", item.supabase_id);

              if (!error) {
                await db[table].delete(item.id);
                totalSynced++;
                console.log(`  ✅ Deleted: ${item.id}`);
              }
            } else {
              // Gak ada di cloud, langsung hapus lokal
              await db[table].delete(item.id);
              totalSynced++;
              console.log(`  ✅ Deleted (local only): ${item.id}`);
            }
          }
        } catch (err) {
          totalErrors++;
          console.log(`  ⚠️ Gagal sync item ${item.id}:`, err.message);
        }
      }
    } catch (error) {
      console.error(`❌ Error sync table ${table}:`, error);
    }
  }

  console.log(
    `✅ Sync selesai! Synced: ${totalSynced}, Errors: ${totalErrors}`
  );
  return { synced: totalSynced, errors: totalErrors };
};

/**
 * GET - Ambil data dengan fallback ke local (kalau offline)
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
  let localData = await db[table]
    .filter((item) => !item.deleted_at) // Skip yang sudah dihapus
    .toArray();

  // Apply filter manual
  Object.keys(filter).forEach((key) => {
    localData = localData.filter((item) => item[key] === filter[key]);
  });

  console.log(`💾 Data dari lokal: ${localData.length} records`);
  return localData;
};

/**
 * GET PENDING COUNT - Hitung jumlah data pending sync
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

/**
 * CHECK ONLINE STATUS
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * AUTO SYNC - Setup listener untuk auto-sync saat online
 */
export const setupAutoSync = () => {
  window.addEventListener("online", async () => {
    console.log("🌐 Online! Memulai auto-sync...");
    const result = await syncPendingData();
    console.log(`📊 Auto-sync result:`, result);
  });

  window.addEventListener("offline", () => {
    console.log("📡 Offline mode - data akan disimpan lokal");
  });
};
