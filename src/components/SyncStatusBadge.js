// src/components/SyncStatusBadge.js
import React from "react";
import { useSyncStatus } from "../hooks/useSyncStatus";

export default function SyncStatusBadge() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useSyncStatus();

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          isOnline ? "bg-green-50" : "bg-yellow-50"
        }`}>
        {/* Indicator Dot */}
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? "bg-green-500 animate-pulse" : "bg-yellow-500"
          }`}></span>

        {/* Status Text */}
        <span
          className={`text-sm font-medium ${
            isOnline ? "text-green-700" : "text-yellow-700"
          }`}>
          {isOnline ? "Online" : "Offline"}
        </span>

        {/* Pending Count */}
        {pendingCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white">
            {isSyncing ? (
              <span className="text-blue-600">Syncing...</span>
            ) : (
              <span className="text-gray-600">{pendingCount} pending</span>
            )}
          </span>
        )}
      </div>

      {/* Manual Sync Button (hanya tampil kalau ada pending & online) */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          onClick={syncNow}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition">
          Sync Now
        </button>
      )}
    </div>
  );
}
