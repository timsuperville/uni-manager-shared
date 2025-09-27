/**
 * Performance Monitoring Components
 * Real-time cache performance monitoring and optimization recommendations
 */

import React, { useState, useEffect } from "react";
import { useCacheManager, useCacheStats } from "../utils/intelligentCache";

// Performance Dashboard Component
export const PerformanceDashboard = () => {
  const cacheManager = useCacheManager();
  const stats = useCacheStats();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Generate optimization recommendations based on cache performance
    const newRecommendations = generateRecommendations(stats);
    setRecommendations(newRecommendations);
  }, [stats]);

  return (
    <div className="performance-dashboard bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Cache Performance Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <PerformanceMetric
          title="Hit Rate"
          value={`${((stats.hits / (stats.hits + stats.misses)) * 100 || 0).toFixed(1)}%`}
          status={getHitRateStatus(stats.hits, stats.misses)}
          icon="📊"
        />
        <PerformanceMetric
          title="Cache Size"
          value={`${stats.totalEntries} entries`}
          status={getCacheSizeStatus(stats.totalEntries)}
          icon="💾"
        />
        <PerformanceMetric
          title="Memory Usage"
          value={`${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`}
          status={getMemoryStatus(stats.memoryUsage)}
          icon="🧠"
        />
        <PerformanceMetric
          title="Avg Response"
          value={`${stats.averageResponseTime.toFixed(2)}ms`}
          status={getResponseTimeStatus(stats.averageResponseTime)}
          icon="⚡"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CacheBreakdown stats={stats} />
        <OptimizationRecommendations recommendations={recommendations} />
      </div>
    </div>
  );
};

// Individual Performance Metric Component
const PerformanceMetric = ({ title, value, status, icon }) => {
  const statusColors = {
    excellent: "text-green-600 dark:text-green-400",
    good: "text-blue-600 dark:text-blue-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    critical: "text-red-600 dark:text-red-400",
  };

  const statusBgColors = {
    excellent: "bg-green-50 dark:bg-green-900/20",
    good: "bg-blue-50 dark:bg-blue-900/20",
    warning: "bg-yellow-50 dark:bg-yellow-900/20",
    critical: "bg-red-50 dark:bg-red-900/20",
  };

  return (
    <div
      className={`${statusBgColors[status]} rounded-lg p-4 border border-gray-200 dark:border-gray-700`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className={`text-2xl font-bold ${statusColors[status]}`}>
            {value}
          </p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
};

// Cache Type Breakdown Component
const CacheBreakdown = ({ stats }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cache Breakdown
      </h3>
      <div className="space-y-3">
        {Object.entries(stats.cacheTypes || {}).map(([type, typeStats]) => (
          <CacheTypeRow key={type} type={type} stats={typeStats} />
        ))}
      </div>
    </div>
  );
};

// Individual Cache Type Row
const CacheTypeRow = ({ type, stats }) => {
  const hitRate = (
    (stats.hits / (stats.hits + stats.misses)) * 100 || 0
  ).toFixed(1);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
          {type.replace(/([A-Z])/g, " $1").trim()}
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {stats.entries} entries
        </span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {hitRate}% hit rate
        </span>
      </div>
    </div>
  );
};

// Optimization Recommendations Component
const OptimizationRecommendations = ({ recommendations }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Optimization Recommendations
      </h3>
      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ✅ All systems running optimally
          </p>
        ) : (
          recommendations.map((rec, index) => (
            <RecommendationItem key={index} recommendation={rec} />
          ))
        )}
      </div>
    </div>
  );
};

// Individual Recommendation Item
const RecommendationItem = ({ recommendation }) => {
  const priorityColors = {
    high: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    medium:
      "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
    low: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  };

  return (
    <div
      className={`rounded-lg p-3 ${priorityColors[recommendation.priority]} border`}
    >
      <div className="flex items-start space-x-3">
        <div className="text-lg">
          {recommendation.priority === "high"
            ? "🚨"
            : recommendation.priority === "medium"
              ? "⚠️"
              : "💡"}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{recommendation.title}</p>
          <p className="text-xs mt-1">{recommendation.description}</p>
        </div>
      </div>
    </div>
  );
};

// Cache Control Panel Component
export const CacheControlPanel = () => {
  const cacheManager = useCacheManager();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async (type) => {
    setIsClearing(true);
    try {
      if (type === "all") {
        cacheManager.clearAll();
      } else {
        cacheManager.getCache(type).clear();
      }
    } finally {
      setIsClearing(false);
    }
  };

  const handleOptimizeCache = () => {
    cacheManager.performCleanup();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cache Controls
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleOptimizeCache}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🚀 Optimize Cache
        </button>
        <button
          onClick={() => handleClearCache("userPreferences")}
          disabled={isClearing}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
        >
          🧹 Clear User Cache
        </button>
        <button
          onClick={() => handleClearCache("all")}
          disabled={isClearing}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          💥 Clear All Caches
        </button>
      </div>
    </div>
  );
};

// Helper Functions
const generateRecommendations = (stats) => {
  const recommendations = [];
  const hitRate = (stats.hits / (stats.hits + stats.misses)) * 100 || 0;

  if (hitRate < 50) {
    recommendations.push({
      title: "Low Cache Hit Rate",
      description: "Consider increasing cache TTL or reviewing cache keys",
      priority: "high",
    });
  }

  if (stats.memoryUsage > 50 * 1024 * 1024) {
    // 50MB
    recommendations.push({
      title: "High Memory Usage",
      description:
        "Cache is using significant memory. Consider reducing TTL or cache size limits",
      priority: "medium",
    });
  }

  if (stats.averageResponseTime > 100) {
    recommendations.push({
      title: "Slow Cache Response",
      description:
        "Cache operations are taking longer than expected. Consider cache optimization",
      priority: "medium",
    });
  }

  if (stats.totalEntries > 1000) {
    recommendations.push({
      title: "Large Cache Size",
      description:
        "Cache has many entries. Consider implementing more aggressive cleanup",
      priority: "low",
    });
  }

  return recommendations;
};

const getHitRateStatus = (hits, misses) => {
  const rate = (hits / (hits + misses)) * 100 || 0;
  if (rate >= 80) return "excellent";
  if (rate >= 60) return "good";
  if (rate >= 40) return "warning";
  return "critical";
};

const getCacheSizeStatus = (entries) => {
  if (entries < 100) return "excellent";
  if (entries < 500) return "good";
  if (entries < 1000) return "warning";
  return "critical";
};

const getMemoryStatus = (bytes) => {
  const mb = bytes / 1024 / 1024;
  if (mb < 10) return "excellent";
  if (mb < 25) return "good";
  if (mb < 50) return "warning";
  return "critical";
};

const getResponseTimeStatus = (ms) => {
  if (ms < 10) return "excellent";
  if (ms < 50) return "good";
  if (ms < 100) return "warning";
  return "critical";
};

export default PerformanceDashboard;
