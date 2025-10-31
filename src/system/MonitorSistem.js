import React, { useState } from "react";
import MonitorDashboard from "./MonitorDashboard";
import DatabaseCleanupMonitor from "./DatabaseCleanupMonitor";
import PerformanceMonitor from "./PerformanceMonitor";
import { Activity, Database, Zap } from "lucide-react";

function MonitorSistem({ user, onShowToast }) {
  const [activeTab, setActiveTab] = useState("health");

  const tabs = [
    {
      id: "health",
      label: "System Health",
      icon: Activity,
    },
    {
      id: "performance",
      label: "Performance",
      icon: Zap,
    },
    {
      id: "cleanup",
      label: "Database Cleanup",
      icon: Database,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Monitor Sistem</h1>
        <p className="text-gray-600 mt-1">
          Pemeriksaan kesehatan sistem dan integritas data
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                }`}>
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "health" && (
          <MonitorDashboard user={user} onShowToast={onShowToast} />
        )}
        {activeTab === "performance" && (
          <PerformanceMonitor user={user} onShowToast={onShowToast} />
        )}
        {activeTab === "cleanup" && (
          <DatabaseCleanupMonitor user={user} onShowToast={onShowToast} />
        )}
      </div>
    </div>
  );
}

export default MonitorSistem;
