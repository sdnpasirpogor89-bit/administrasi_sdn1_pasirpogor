import React, { useState } from 'react';

function MonitorResults({ results, isChecking }) {
  const [expandedCategories, setExpandedCategories] = useState({
    database: true,
    validation: false,
    businessLogic: false,
    appHealth: false
  });

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (isChecking) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin text-4xl mb-4">🔄</div>
        <p className="text-gray-600 font-medium">Memeriksa kesehatan sistem...</p>
        <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
        <div className="mt-4 flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🔧</div>
        <p className="text-gray-600 mb-2 font-medium text-lg">Belum ada pemeriksaan</p>
        <p className="text-sm text-gray-500">
          Klik tombol "Run System Check" untuk memulai pemeriksaan kesehatan sistem
        </p>
      </div>
    );
  }

  const { summary, results: checkResults, executionTime, errors } = results;

  // Helper function to get status color
  const getStatusColor = (status) => {
    const colors = {
      healthy: 'green',
      warning: 'yellow',
      critical: 'red',
      info: 'blue'
    };
    return colors[status] || 'gray';
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    const icons = {
      healthy: '✅',
      warning: '⚠️',
      critical: '🔴',
      info: 'ℹ️'
    };
    return icons[status] || '❓';
  };

  // Helper function to get severity badge
  const getSeverityBadge = (severity) => {
    const badges = {
      critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: '🔴' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⚠️' },
      info: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: 'ℹ️' }
    };
    return badges[severity] || badges.info;
  };

  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      database: '🗄️',
      validation: '✅',
      businessLogic: '🧠',
      appHealth: '📱'
    };
    return icons[category] || '📋';
  };

  // Helper function to get category title
  const getCategoryTitle = (category) => {
    const titles = {
      database: 'Database Integrity',
      validation: 'Data Validation',
      businessLogic: 'Business Logic',
      appHealth: 'App Health'
    };
    return titles[category] || category;
  };

  // Collect all issues from all categories
  const getAllIssues = () => {
    const allIssues = [];
    
    // Database issues
    if (checkResults.database?.issues) {
      checkResults.database.issues.forEach(issue => {
        allIssues.push({ ...issue, category: 'database' });
      });
    }
    
    // Validation issues
    if (checkResults.validation?.issues) {
      checkResults.validation.issues.forEach(issue => {
        allIssues.push({ ...issue, category: 'validation' });
      });
    }
    
    // Business Logic issues
    if (checkResults.businessLogic?.issues) {
      checkResults.businessLogic.issues.forEach(issue => {
        allIssues.push({ ...issue, category: 'businessLogic' });
      });
    }
    
    // App Health issues
    if (checkResults.appHealth?.issues) {
      checkResults.appHealth.issues.forEach(issue => {
        allIssues.push({ ...issue, category: 'appHealth' });
      });
    }
    
    return allIssues;
  };

  // Group issues by category
  const groupedIssues = {
    database: checkResults.database?.issues || [],
    validation: checkResults.validation?.issues || [],
    businessLogic: checkResults.businessLogic?.issues || [],
    appHealth: checkResults.appHealth?.issues || []
  };

  const totalIssues = getAllIssues();

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <div className={`rounded-lg p-6 border-2 ${
        summary.status === 'healthy' 
          ? 'bg-green-50 border-green-200' 
          : summary.status === 'warning'
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">
              {getStatusIcon(summary.status)} Status Keseluruhan
            </h3>
            <p className={`text-sm font-medium ${
              summary.status === 'healthy' ? 'text-green-700' :
              summary.status === 'warning' ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              {summary.status === 'healthy' ? 'Sistem Sehat' :
               summary.status === 'warning' ? 'Perlu Perhatian' :
               'Critical - Perlu Tindakan Segera'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {summary.totalIssues}
            </p>
            <p className="text-sm text-gray-600">Total Issues</p>
          </div>
        </div>
        
        <div className="mt-4 flex gap-4 text-sm">
          {summary.criticalCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-red-600 font-semibold">🔴 {summary.criticalCount}</span>
              <span className="text-gray-600">Critical</span>
            </div>
          )}
          {summary.warningCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-600 font-semibold">⚠️ {summary.warningCount}</span>
              <span className="text-gray-600">Warning</span>
            </div>
          )}
          {summary.infoCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-blue-600 font-semibold">ℹ️ {summary.infoCount}</span>
              <span className="text-gray-600">Info</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-gray-500">⏱️</span>
            <span className="text-gray-600">{(executionTime / 1000).toFixed(2)}s</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Card */}
        <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${
          checkResults.database?.status === 'healthy' ? 'border-green-500' :
          checkResults.database?.status === 'warning' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Database Integrity</h4>
          <div className="flex items-center justify-between">
            <p className="text-3xl">
              {getStatusIcon(checkResults.database?.status || 'info')}
            </p>
            <div className="text-right">
              <p className={`text-lg font-bold ${
                checkResults.database?.status === 'healthy' ? 'text-green-600' :
                checkResults.database?.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {checkResults.database?.checks?.length || 0}
              </p>
              <p className="text-xs text-gray-500">checks</p>
            </div>
          </div>
          {checkResults.database?.error && (
            <p className="text-xs text-red-600 mt-2">Error: {checkResults.database.error}</p>
          )}
        </div>

        {/* Data Validation Card */}
        <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${
          checkResults.validation?.status === 'healthy' ? 'border-green-500' :
          checkResults.validation?.status === 'warning' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Data Validation</h4>
          <div className="flex items-center justify-between">
            <p className="text-3xl">
              {getStatusIcon(checkResults.validation?.status || 'info')}
            </p>
            <div className="text-right">
              <p className={`text-lg font-bold ${
                checkResults.validation?.status === 'healthy' ? 'text-green-600' :
                checkResults.validation?.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {checkResults.validation?.checks?.length || 0}
              </p>
              <p className="text-xs text-gray-500">checks</p>
            </div>
          </div>
          {checkResults.validation?.error && (
            <p className="text-xs text-red-600 mt-2">Error: {checkResults.validation.error}</p>
          )}
        </div>

        {/* Business Logic Card */}
        <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${
          checkResults.businessLogic?.status === 'healthy' ? 'border-green-500' :
          checkResults.businessLogic?.status === 'warning' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Business Logic</h4>
          <div className="flex items-center justify-between">
            <p className="text-3xl">
              {getStatusIcon(checkResults.businessLogic?.status || 'info')}
            </p>
            <div className="text-right">
              <p className={`text-lg font-bold ${
                checkResults.businessLogic?.status === 'healthy' ? 'text-green-600' :
                checkResults.businessLogic?.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {checkResults.businessLogic?.checks?.length || 0}
              </p>
              <p className="text-xs text-gray-500">checks</p>
            </div>
          </div>
          {checkResults.businessLogic?.error && (
            <p className="text-xs text-red-600 mt-2">Error: {checkResults.businessLogic.error}</p>
          )}
        </div>

        {/* App Health Card */}
        <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${
          checkResults.appHealth?.status === 'healthy' ? 'border-green-500' :
          checkResults.appHealth?.status === 'warning' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">App Health</h4>
          <div className="flex items-center justify-between">
            <p className="text-3xl">
              {getStatusIcon(checkResults.appHealth?.status || 'info')}
            </p>
            <div className="text-right">
              <p className={`text-lg font-bold ${
                checkResults.appHealth?.status === 'healthy' ? 'text-green-600' :
                checkResults.appHealth?.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {checkResults.appHealth?.checks?.length || 0}
              </p>
              <p className="text-xs text-gray-500">metrics</p>
            </div>
          </div>
          {checkResults.appHealth?.error && (
            <p className="text-xs text-red-600 mt-2">Error: {checkResults.appHealth.error}</p>
          )}
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📋</span>
          Detail Hasil Pemeriksaan
        </h3>
        
        {errors && errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-800 mb-2">⚠️ Errors During Check:</p>
            <ul className="list-disc list-inside text-sm text-red-700">
              {errors.map((err, idx) => (
                <li key={idx}>{err.checker}: {err.error}</li>
              ))}
            </ul>
          </div>
        )}

        {totalIssues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">✅</p>
            <p className="font-medium text-lg">Tidak ada masalah ditemukan!</p>
            <p className="text-sm mt-2">Semua pemeriksaan sistem berjalan dengan baik</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Database Issues */}
            {groupedIssues.database.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory('database')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon('database')}</span>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">
                        {getCategoryTitle('database')}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {groupedIssues.database.length} issue(s) ditemukan
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xl">
                    {expandedCategories.database ? '▼' : '▶'}
                  </span>
                </button>
                
                {expandedCategories.database && (
                  <div className="divide-y divide-gray-100">
                    {groupedIssues.database.map((issue, idx) => {
                      const badge = getSeverityBadge(issue.severity);
                      return (
                        <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0 mt-0.5">{badge.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h5 className="font-semibold text-gray-800 text-sm">
                                  {issue.message}
                                </h5>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border} whitespace-nowrap flex-shrink-0`}>
                                  {issue.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{issue.details}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                {issue.table && (
                                  <span className="flex items-center gap-1">
                                    <span>📊</span>
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                      {issue.table}
                                    </span>
                                  </span>
                                )}
                                {issue.count !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <span>🔢</span>
                                    <span className="font-semibold">
                                      {issue.count} record(s)
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Validation Issues */}
            {groupedIssues.validation.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory('validation')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon('validation')}</span>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">
                        {getCategoryTitle('validation')}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {groupedIssues.validation.length} issue(s) ditemukan
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xl">
                    {expandedCategories.validation ? '▼' : '▶'}
                  </span>
                </button>
                
                {expandedCategories.validation && (
                  <div className="divide-y divide-gray-100">
                    {groupedIssues.validation.map((issue, idx) => {
                      const badge = getSeverityBadge(issue.severity);
                      return (
                        <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0 mt-0.5">{badge.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h5 className="font-semibold text-gray-800 text-sm">
                                  {issue.message}
                                </h5>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border} whitespace-nowrap flex-shrink-0`}>
                                  {issue.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{issue.details}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                {issue.table && (
                                  <span className="flex items-center gap-1">
                                    <span>📊</span>
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                      {issue.table}
                                    </span>
                                  </span>
                                )}
                                {issue.count !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <span>🔢</span>
                                    <span className="font-semibold">
                                      {issue.count} record(s)
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Business Logic Issues */}
            {groupedIssues.businessLogic.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory('businessLogic')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon('businessLogic')}</span>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">
                        {getCategoryTitle('businessLogic')}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {groupedIssues.businessLogic.length} issue(s) ditemukan
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xl">
                    {expandedCategories.businessLogic ? '▼' : '▶'}
                  </span>
                </button>
                
                {expandedCategories.businessLogic && (
                  <div className="divide-y divide-gray-100">
                    {groupedIssues.businessLogic.map((issue, idx) => {
                      const badge = getSeverityBadge(issue.severity);
                      return (
                        <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0 mt-0.5">{badge.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h5 className="font-semibold text-gray-800 text-sm">
                                  {issue.message}
                                </h5>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border} whitespace-nowrap flex-shrink-0`}>
                                  {issue.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{issue.details}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                {issue.table && (
                                  <span className="flex items-center gap-1">
                                    <span>📊</span>
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                      {issue.table}
                                    </span>
                                  </span>
                                )}
                                {issue.count !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <span>🔢</span>
                                    <span className="font-semibold">
                                      {issue.count} record(s)
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* App Health Issues */}
            {groupedIssues.appHealth.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory('appHealth')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon('appHealth')}</span>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">
                        {getCategoryTitle('appHealth')}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {groupedIssues.appHealth.length} issue(s) ditemukan
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xl">
                    {expandedCategories.appHealth ? '▼' : '▶'}
                  </span>
                </button>
                
                {expandedCategories.appHealth && (
                  <div className="divide-y divide-gray-100">
                    {groupedIssues.appHealth.map((issue, idx) => {
                      const badge = getSeverityBadge(issue.severity);
                      return (
                        <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0 mt-0.5">{badge.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h5 className="font-semibold text-gray-800 text-sm">
                                  {issue.message}
                                </h5>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border} whitespace-nowrap flex-shrink-0`}>
                                  {issue.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{issue.details}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                {issue.table && (
                                  <span className="flex items-center gap-1">
                                    <span>📊</span>
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                      {issue.table}
                                    </span>
                                  </span>
                                )}
                                {issue.count !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <span>🔢</span>
                                    <span className="font-semibold">
                                      {issue.count} record(s)
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MonitorResults;