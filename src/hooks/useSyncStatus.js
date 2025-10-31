// src/hooks/useSyncStatus.js - FIXED VERSION
import { useState, useEffect, useMemo, useCallback } from "react";
import { getPendingCount, syncPendingData } from "../offlineSync";

export const useSyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // ✅ FIX: useCallback untuk handleSync supaya reference stabil
  const handleSync = useCallback(async () => {
    if (isSyncing) return; // Prevent double sync

    setIsSyncing(true);
    try {
      await syncPendingData();
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]); // Dependency: isSyncing

  useEffect(() => {
    // Detect online/offline
    const handleOnline = () => {
      console.log("🟢 Online detected");
      setIsOnline(true);
      // Auto sync pas online
      handleSync();
    };

    const handleOffline = () => {
      console.log("🔴 Offline detected");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Update pending count tiap 5 detik
    const updatePendingCount = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [handleSync]); // ✅ FIX: Tambah handleSync ke dependency

  // ✅ FIX: useMemo untuk return value supaya object stabil
  return useMemo(
    () => ({
      isOnline,
      pendingCount,
      isSyncing,
      syncNow: handleSync,
    }),
    [isOnline, pendingCount, isSyncing, handleSync]
  );
};
