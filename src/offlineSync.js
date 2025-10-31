// src/offlineSync.js - SYNC FUNCTIONS ✅ FIXED VERSION (NO LOOP LOGS)
import db from "./db";
import { supabase } from "./supabaseClient";

// ✅ TABLE MAPPING - Map table lokal ke Supabase
const TABLE_MAP = {
  student_notes: "catatan_siswa",
  attendance: "attendance",
  grades: "nilai",
};

const getSupabaseTable = (localTable) => {
  return TABLE_MAP[localTable] || localTable;
};

/**
 * ✅ VALIDATE DATA - Cek data sebelum proses
 */
const validateData = (data, operation = "create") => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      `Data harus berupa object, bukan ${typeof data} atau array!`
    );
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new Error("Data object kosong!");
  }

  return true;
};

/**
 * ✅ CLEAN DATA - Hapus field sync sebelum kirim ke Supabase
 */
const cleanDataForSupabase = (data) => {
  validateData(data);

  const {
    id,
    sync_status,
    sync_operation,
    supabase_id,
    deleted_at,
    ...cleanData
  } = data;

  const cleanKeys = Object.keys(cleanData);
  if (cleanKeys.length === 0) {
    console.error("❌ Data kosong setelah cleaning! Original:", data);
    throw new Error("Data tidak valid - semua field ter-filter");
  }

  return cleanData;
};

/**
 * ✅ BATCH SAVE - Save multiple items (auto-detect array)
 */
export const saveWithSync = async (table, data) => {
  if (Array.isArray(data)) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      ids: [],
    };

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        const result = await saveSingleItem(table, item);
        if (result.success) {
          results.success++;
          results.ids.push(result.id);
        } else {
          results.failed++;
          results.errors.push({ index: i, item, error: result.error });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ index: i, item, error });
      }
    }

    const syncedCount = results.ids.filter((_, idx) => {
      const hasError = results.errors.some((err) => err.index === idx);
      return !hasError;
    }).length;

    return {
      success: results.failed === 0,
      batch: true,
      synced: syncedCount === results.success,
      syncedCount,
      pendingCount: results.success - syncedCount,
      ...results,
    };
  }

  return await saveSingleItem(table, data);
};

/**
 * ✅ CREATE - Save single data dengan auto sync (offline-first)
 */
const saveSingleItem = async (table, data) => {
  try {
    validateData(data);

    const dataToSave = {
      ...data,
      sync_status: "pending",
      sync_operation: "create",
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    };

    const localId = await db[table].add(dataToSave);

    if (navigator.onLine) {
      try {
        const supabaseTable = getSupabaseTable(table);
        const cleanData = cleanDataForSupabase(dataToSave);

        const { data: supabaseData, error } = await supabase
          .from(supabaseTable)
          .insert(cleanData)
          .select();

        if (error) {
          console.error(`❌ Supabase error:`, error.message);
          return { success: true, id: localId, synced: false };
        }

        if (supabaseData && supabaseData.length > 0) {
          await db[table].update(localId, {
            sync_status: "synced",
            supabase_id: supabaseData[0].id,
          });
          return {
            success: true,
            id: localId,
            synced: true,
            supabaseId: supabaseData[0].id,
          };
        }
      } catch (syncError) {
        console.error("🔥 Sync exception:", syncError.message);
      }
    }

    return { success: true, id: localId, synced: false };
  } catch (error) {
    console.error("❌ Error save data:", error);
    return { success: false, error };
  }
};

/**
 * ✅ UPDATE - Update data dengan auto sync
 */
export const updateWithSync = async (table, localId, updates) => {
  try {
    validateData(updates, "update");

    const existing = await db[table].get(localId);

    if (!existing) {
      throw new Error("Data tidak ditemukan");
    }

    const dataToUpdate = {
      ...updates,
      sync_status: "pending",
      sync_operation: "update",
      updated_at: new Date().toISOString(),
    };

    await db[table].update(localId, dataToUpdate);

    if (navigator.onLine && existing.supabase_id) {
      try {
        const supabaseTable = getSupabaseTable(table);
        const cleanData = cleanDataForSupabase({
          ...updates,
          updated_at: new Date().toISOString(),
        });

        const { error } = await supabase
          .from(supabaseTable)
          .update(cleanData)
          .eq("id", existing.supabase_id);

        if (!error) {
          await db[table].update(localId, { sync_status: "synced" });
        }
      } catch (syncError) {
        console.error("🔥 Sync exception:", syncError.message);
      }
    }

    return { success: true, id: localId };
  } catch (error) {
    console.error("❌ Error update data:", error);
    return { success: false, error };
  }
};

/**
 * ✅ DELETE - Hapus data dengan auto sync
 */
export const deleteWithSync = async (table, localId) => {
  try {
    const existing = await db[table].get(localId);

    if (!existing) {
      throw new Error("Data tidak ditemukan");
    }

    await db[table].update(localId, {
      sync_status: "pending",
      sync_operation: "delete",
      deleted_at: new Date().toISOString(),
    });

    if (navigator.onLine && existing.supabase_id) {
      try {
        const supabaseTable = getSupabaseTable(table);

        const { error } = await supabase
          .from(supabaseTable)
          .delete()
          .eq("id", existing.supabase_id);

        if (!error) {
          await db[table].delete(localId);
        }
      } catch (syncError) {
        console.error("🔥 Sync exception:", syncError.message);
      }
    } else if (!existing.supabase_id) {
      await db[table].delete(localId);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Error delete data:", error);
    return { success: false, error };
  }
};

/**
 * ✅ SYNC - Sync semua data pending ke Supabase
 */
export const syncPendingData = async () => {
  const tables = ["attendance", "grades", "student_notes"];
  let totalSynced = 0;
  let totalErrors = 0;
  const errorDetails = [];

  console.log("🔄 Mulai sync data pending...");

  for (const table of tables) {
    try {
      const allData = await db[table].toArray();
      const pendingData = allData.filter(
        (item) => item.sync_status === "pending"
      );

      if (pendingData.length === 0) continue;

      console.log(`📤 Sync ${pendingData.length} data dari ${table}...`);

      const supabaseTable = getSupabaseTable(table);

      for (const item of pendingData) {
        try {
          const operation = item.sync_operation || "create";
          validateData(item);
          const cleanData = cleanDataForSupabase(item);

          if (operation === "create") {
            const { data, error } = await supabase
              .from(supabaseTable)
              .insert(cleanData)
              .select();

            if (error) {
              errorDetails.push({
                table,
                localId: item.id,
                operation,
                error: error.message,
              });
              totalErrors++;
            } else if (data && data.length > 0) {
              await db[table].update(item.id, {
                sync_status: "synced",
                supabase_id: data[0].id,
              });
              totalSynced++;
            }
          } else if (operation === "update") {
            if (item.supabase_id) {
              const { error } = await supabase
                .from(supabaseTable)
                .update(cleanData)
                .eq("id", item.supabase_id);

              if (error) {
                errorDetails.push({
                  table,
                  localId: item.id,
                  operation,
                  error: error.message,
                });
                totalErrors++;
              } else {
                await db[table].update(item.id, { sync_status: "synced" });
                totalSynced++;
              }
            } else {
              const { data, error } = await supabase
                .from(supabaseTable)
                .insert(cleanData)
                .select();

              if (error) {
                errorDetails.push({
                  table,
                  localId: item.id,
                  operation: "create (was update)",
                  error: error.message,
                });
                totalErrors++;
              } else if (data && data.length > 0) {
                await db[table].update(item.id, {
                  sync_status: "synced",
                  supabase_id: data[0].id,
                });
                totalSynced++;
              }
            }
          } else if (operation === "delete") {
            if (item.supabase_id) {
              const { error } = await supabase
                .from(supabaseTable)
                .delete()
                .eq("id", item.supabase_id);

              if (error) {
                errorDetails.push({
                  table,
                  localId: item.id,
                  operation,
                  error: error.message,
                });
                totalErrors++;
              } else {
                await db[table].delete(item.id);
                totalSynced++;
              }
            } else {
              await db[table].delete(item.id);
              totalSynced++;
            }
          }
        } catch (err) {
          totalErrors++;
          errorDetails.push({
            table,
            localId: item.id,
            operation: item.sync_operation,
            error: err.message,
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error sync table ${table}:`, error);
    }
  }

  if (totalSynced > 0 || totalErrors > 0) {
    console.log(
      `✅ Sync selesai! Synced: ${totalSynced}, Errors: ${totalErrors}`
    );
  }

  return { synced: totalSynced, errors: totalErrors, errorDetails };
};

/**
 * ✅ GET - Ambil data dengan fallback ke local
 */
export const getDataWithFallback = async (table, filterFunc) => {
  try {
    if (navigator.onLine) {
      const supabaseTable = getSupabaseTable(table);
      let query = supabase.from(supabaseTable).select();

      // Apply filter function if provided
      if (typeof filterFunc === "function") {
        query = filterFunc(query);
      }

      const { data, error } = await query;

      if (!error && data) {
        return data;
      }
    }
  } catch (error) {
    console.log("📡 Offline - menggunakan data lokal");
  }

  // Fallback ke lokal
  let localData = await db[table].filter((item) => !item.deleted_at).toArray();

  // Apply filter function to local data if provided
  if (typeof filterFunc === "function") {
    // For local data, we need to simulate the query interface
    const mockQuery = {
      data: localData,
      eq: function (field, value) {
        this.data = this.data.filter((item) => item[field] === value);
        return this;
      },
      order: function (field, options) {
        const { ascending = true } = options || {};
        this.data.sort((a, b) => {
          if (a[field] < b[field]) return ascending ? -1 : 1;
          if (a[field] > b[field]) return ascending ? 1 : -1;
          return 0;
        });
        return this;
      },
    };

    filterFunc(mockQuery);
    localData = mockQuery.data;
  }

  return localData;
};

/**
 * ✅ GET PENDING COUNT - TANPA LOG BERLEBIHAN
 */
export const getPendingCount = async () => {
  const tables = ["attendance", "grades", "student_notes"];
  let total = 0;
  const breakdown = {};

  for (const table of tables) {
    const allData = await db[table].toArray();
    const pending = allData.filter((item) => item.sync_status === "pending");
    breakdown[table] = pending.length;
    total += pending.length;
  }

  // ✅ HANYA LOG KALAU ADA PENDING
  if (total > 0) {
    console.log("📊 Pending sync:", breakdown);
  }

  return { total, breakdown };
};

/**
 * ✅ CHECK ONLINE STATUS
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * ✅ DEBUG HELPERS - Untuk troubleshooting
 */
export const debugHelpers = {
  viewPending: async () => {
    const tables = ["attendance", "grades", "student_notes"];
    const result = {};

    for (const table of tables) {
      const allData = await db[table].toArray();
      result[table] = allData.filter((item) => item.sync_status === "pending");
    }

    console.table(result);
    return result;
  },

  clearAllPending: async () => {
    const confirmed = window.confirm(
      "⚠️ PERINGATAN: Ini akan menghapus SEMUA data pending yang belum sync!\nLanjutkan?"
    );
    if (!confirmed) return;

    const tables = ["attendance", "grades", "student_notes"];
    let deleted = 0;

    for (const table of tables) {
      const allData = await db[table].toArray();
      const pending = allData.filter((item) => item.sync_status === "pending");

      for (const item of pending) {
        await db[table].delete(item.id);
        deleted++;
      }
    }

    console.log(`✅ Deleted ${deleted} pending items`);
    return deleted;
  },

  viewErrors: async () => {
    const tables = ["attendance", "grades", "student_notes"];
    const errors = [];

    for (const table of tables) {
      const allData = await db[table].toArray();
      const pending = allData.filter((item) => item.sync_status === "pending");

      for (const item of pending) {
        try {
          validateData(item);
          cleanDataForSupabase(item);
        } catch (error) {
          errors.push({
            table,
            localId: item.id,
            error: error.message,
            data: item,
          });
        }
      }
    }

    console.table(errors);
    return errors;
  },
};

/**
 * ✅ AUTO SYNC SETUP
 */
export const setupAutoSync = () => {
  window.addEventListener("online", async () => {
    console.log("🌐 Online! Memulai auto-sync...");
    const result = await syncPendingData();
    if (result.synced > 0) {
      console.log(`📊 Auto-sync: ${result.synced} items synced`);
    }
  });

  window.addEventListener("offline", () => {
    console.log("📡 Offline mode - data akan disimpan lokal");
  });

  window.syncManager = {
    syncNow: syncPendingData,
    getPending: getPendingCount,
    isOnline,
    debug: debugHelpers,
  };

  console.log("✅ SyncManager ready! Try: window.syncManager.getPending()");
};
