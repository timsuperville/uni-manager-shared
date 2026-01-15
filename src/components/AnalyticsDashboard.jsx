/**
 * Analytics Dashboard Component
 * Comprehensive analytics dashboard with real-time metrics, charts, and data visualization
 * Integrates with enhanced analytics API and provides interactive dashboard experience
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
} from "chart.js";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import {
  useAnalyticsDashboard,
  useAnalyticsCategory,
  useAnalyticsTracking,
  useAvailableApplications,
  useAnalyticsExport,
} from "../hooks/useAnalyticsDashboard";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
);

const AnalyticsDashboard = ({
  applicationId = "home",
  userId,
  organizationId,
  className = "",
  enableRealTime = true,
  autoRefresh = true,
  showExportButtons = true,
}) => {
  // State management
  const [selectedDateRange, setSelectedDateRange] = useState("7d");
  const [selectedCategory, setSelectedCategory] = useState("overview");
  const [chartType, setChartType] = useState("line");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Analytics hooks
  const {
    dashboardData,
    realTimeMetrics,
    loading: dashboardLoading,
    error: dashboardError,
    refreshData,
  } = useAnalyticsDashboard(applicationId, {
    dateRange: selectedDateRange,
    userId,
    organizationId,
    enableRealTime,
    autoRefresh,
    refreshInterval: 300000, // 5 minutes
  });

  const {
    data: categoryData,
    loading: categoryLoading,
    refreshData: refreshCategoryData,
  } = useAnalyticsCategory(
    applicationId,
    selectedCategory === "overview" ? "behavior" : selectedCategory,
    {
      dateRange: selectedDateRange,
      userId,
      organizationId,
      autoRefresh,
    },
  );

  const { applications } = useAvailableApplications();
  const { trackEvent } = useAnalyticsTracking();
  const { exportData, isExporting } = useAnalyticsExport();

  // Track dashboard usage
  useEffect(() => {
    if (applicationId) {
      trackEvent({
        type: "dashboard_view",
        applicationId,
        data: {
          category: selectedCategory,
          dateRange: selectedDateRange,
          timestamp: new Date().toISOString(),
        },
      }).catch(console.error);
    }
  }, [applicationId, selectedCategory, selectedDateRange, trackEvent]);

  // Date range options
  const dateRangeOptions = [
    { value: "1d", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 3 Months" },
    { value: "1y", label: "Last Year" },
  ];

  // Category options
  const categoryOptions = [
    { value: "overview", label: "Overview", icon: "📊" },
    { value: "behavior", label: "User Behavior", icon: "👥" },
    { value: "performance", label: "Performance", icon: "⚡" },
    { value: "security", label: "Security", icon: "🔒" },
    { value: "engagement", label: "Engagement", icon: "💡" },
    { value: "features", label: "Feature Usage", icon: "🔧" },
    { value: "errors", label: "Error Tracking", icon: "🐛" },
  ];

  // Chart type options
  const chartTypeOptions = [
    { value: "line", label: "Line Chart", icon: "📈" },
    { value: "bar", label: "Bar Chart", icon: "📊" },
    { value: "doughnut", label: "Doughnut Chart", icon: "🍩" },
    { value: "pie", label: "Pie Chart", icon: "🥧" },
  ];

  // Get current application info
  const currentApp = useMemo(() => {
    return (
      applications.find((app) => app.id === applicationId) || {
        id: applicationId,
        name: applicationId.charAt(0).toUpperCase() + applicationId.slice(1),
        description: "Application analytics",
      }
    );
  }, [applications, applicationId]);

  // Prepare chart data based on category and data
  const chartData = useMemo(() => {
    if (!dashboardData && !categoryData) return null;

    const data = selectedCategory === "overview" ? dashboardData : categoryData;
    if (!data || !data.chartData) return null;

    return {
      labels: data.chartData.labels || [],
      datasets: data.chartData.datasets || [],
    };
  }, [dashboardData, categoryData, selectedCategory]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `${currentApp.name} - ${categoryOptions.find((opt) => opt.value === selectedCategory)?.label || "Analytics"}`,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales:
      chartType === "line" || chartType === "bar"
        ? {
            x: {
              display: true,
              title: {
                display: true,
                text: "Time",
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: "Value",
              },
            },
          }
        : {},
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  // Get the appropriate chart component
  const getChartComponent = () => {
    if (!chartData) return null;

    const chartProps = {
      data: chartData,
      options: chartOptions,
      height: 400,
    };

    switch (chartType) {
      case "line":
        return <Line {...chartProps} />;
      case "bar":
        return <Bar {...chartProps} />;
      case "doughnut":
        return <Doughnut {...chartProps} />;
      case "pie":
        return <Pie {...chartProps} />;
      default:
        return <Line {...chartProps} />;
    }
  };

  // Handle export
  const handleExport = async (format = "json") => {
    try {
      await exportData(applicationId, {
        dateRange: selectedDateRange,
        format,
        userId,
        organizationId,
      });
    } catch (_error) {
      // console.error('Export failed:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([refreshData(), refreshCategoryData()]);
  };

  // Loading state
  if (dashboardLoading && !dashboardData) {
    return (
      <div
        className={`w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300 rounded-lg p-6 ${className}`}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardError) {
    return (
      <div
        className={`w-full rounded-lg bg-red-50 border border-red-200 p-6 ${className}`}
      >
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Failed to load analytics
        </h3>
        <p className="text-red-800 mb-4">{dashboardError}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 rounded-lg p-6 shadow-xl relative overflow-hidden ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white"
          : ""
      } ${className}`}
    >
      {/* Dashboard Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-white/20">
        <div>
          <h2
            className={`text-4xl font-bold ${
              isFullscreen
                ? "text-white"
                : "bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent"
            } m-0 mb-2`}
          >
            {currentApp.name} Analytics
          </h2>
          <p
            className={`m-0 text-sm font-normal ${
              isFullscreen ? "text-white/80" : "text-gray-600"
            }`}
          >
            {currentApp.description}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Real-time indicator */}
          {enableRealTime && realTimeMetrics && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                isFullscreen
                  ? "bg-green-500/20 border border-green-300/50 text-green-100"
                  : "bg-green-100/50 border border-green-300/50 text-green-700"
              }`}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
          )}

          {/* Fullscreen toggle */}
          <button
            className={`px-3 py-2 rounded border ${
              isFullscreen
                ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                : "bg-indigo-100/50 border-indigo-300/50 text-indigo-600 hover:bg-indigo-100"
            } transition-colors`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? "⤋" : "⤢"}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        className={`flex flex-wrap gap-3 mb-6 items-center ${isFullscreen ? "backdrop-blur-md bg-white/10 rounded-lg p-4" : "bg-white/50 rounded-lg p-4"}`}
      >
        {/* Date Range Selector */}
        <div className="flex flex-col gap-2">
          <label
            className={`text-sm font-medium ${isFullscreen ? "text-white/80" : "text-gray-700"}`}
          >
            Date Range:
          </label>
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className={`px-3 py-2 rounded border ${
              isFullscreen
                ? "bg-white/10 border-white/30 text-white"
                : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none`}
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div className="flex flex-col gap-2">
          <label
            className={`text-sm font-medium ${isFullscreen ? "text-white/80" : "text-gray-700"}`}
          >
            Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-2 rounded border ${
              isFullscreen
                ? "bg-white/10 border-white/30 text-white"
                : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none`}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Chart Type Selector */}
        <div className="flex flex-col gap-2">
          <label
            className={`text-sm font-medium ${isFullscreen ? "text-white/80" : "text-gray-700"}`}
          >
            Chart Type:
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className={`px-3 py-2 rounded border ${
              isFullscreen
                ? "bg-white/10 border-white/30 text-white"
                : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none`}
          >
            {chartTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleRefresh}
            disabled={dashboardLoading || categoryLoading}
            className={`px-3 py-2 rounded border font-medium transition-colors ${
              isFullscreen
                ? "bg-indigo-500/20 border-indigo-300/50 text-white hover:bg-indigo-500/30 disabled:opacity-50"
                : "bg-indigo-100/50 border-indigo-300/50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
            }`}
            title="Refresh Data"
          >
            🔄 Refresh
          </button>

          {showExportButtons && (
            <>
              <button
                onClick={() => handleExport("json")}
                disabled={isExporting}
                className={`px-3 py-2 rounded border font-medium transition-colors ${
                  isFullscreen
                    ? "bg-purple-500/20 border-purple-300/50 text-white hover:bg-purple-500/30 disabled:opacity-50"
                    : "bg-purple-100/50 border-purple-300/50 text-purple-600 hover:bg-purple-100 disabled:opacity-50"
                }`}
                title="Export as JSON"
              >
                📄 JSON
              </button>
              <button
                onClick={() => handleExport("csv")}
                disabled={isExporting}
                className={`px-3 py-2 rounded border font-medium transition-colors ${
                  isFullscreen
                    ? "bg-purple-500/20 border-purple-300/50 text-white hover:bg-purple-500/30 disabled:opacity-50"
                    : "bg-purple-100/50 border-purple-300/50 text-purple-600 hover:bg-purple-100 disabled:opacity-50"
                }`}
                title="Export as CSV"
              >
                📊 CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Real-time Metrics Bar */}
      {enableRealTime && realTimeMetrics && (
        <motion.div
          className={`grid grid-cols-4 gap-4 mb-6 p-4 rounded-lg ${
            isFullscreen
              ? "bg-white/10 backdrop-blur-md"
              : "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`text-center ${isFullscreen ? "text-white" : ""}`}>
            <p
              className={`text-sm font-medium ${isFullscreen ? "text-white/70" : "text-gray-600"}`}
            >
              Active Users
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${isFullscreen ? "text-white" : "text-indigo-600"}`}
            >
              {realTimeMetrics.activeUsers || 0}
            </p>
          </div>
          <div className={`text-center ${isFullscreen ? "text-white" : ""}`}>
            <p
              className={`text-sm font-medium ${isFullscreen ? "text-white/70" : "text-gray-600"}`}
            >
              Current Sessions
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${isFullscreen ? "text-white" : "text-purple-600"}`}
            >
              {realTimeMetrics.currentSessions || 0}
            </p>
          </div>
          <div className={`text-center ${isFullscreen ? "text-white" : ""}`}>
            <p
              className={`text-sm font-medium ${isFullscreen ? "text-white/70" : "text-gray-600"}`}
            >
              Page Views/Min
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${isFullscreen ? "text-white" : "text-indigo-600"}`}
            >
              {realTimeMetrics.pageViewsPerMinute || 0}
            </p>
          </div>
          <div className={`text-center ${isFullscreen ? "text-white" : ""}`}>
            <p
              className={`text-sm font-medium ${isFullscreen ? "text-white/70" : "text-gray-600"}`}
            >
              Response Time
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${isFullscreen ? "text-white" : "text-purple-600"}`}
            >
              {realTimeMetrics.avgResponseTime || 0}ms
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Chart */}
      <div
        className={`mb-6 p-6 rounded-lg ${
          isFullscreen
            ? "bg-white/10 backdrop-blur-md border border-white/20 min-h-96"
            : "bg-white shadow-lg border border-gray-100"
        }`}
      >
        <AnimatePresence mode="wait">
          {(dashboardLoading || categoryLoading) && (
            <motion.div
              className="flex items-center justify-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`w-12 h-12 border-4 rounded-full animate-spin ${
                    isFullscreen
                      ? "border-white/20 border-t-white"
                      : "border-gray-300 border-t-indigo-500"
                  }`}
                />
              </div>
            </motion.div>
          )}

          {chartData && (
            <motion.div
              className="w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {getChartComponent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary Cards */}
      {(dashboardData?.summary || categoryData?.summary) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(
            dashboardData?.summary || categoryData?.summary || {},
          ).map(([key, value]) => (
            <motion.div
              key={key}
              className={`p-4 rounded-lg border ${
                isFullscreen
                  ? "bg-white/10 backdrop-blur-md border-white/20"
                  : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-md"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h4
                className={`text-sm font-medium ${isFullscreen ? "text-white/70" : "text-gray-600"}`}
              >
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </h4>
              <p
                className={`text-2xl font-bold mt-2 ${isFullscreen ? "text-white" : "text-indigo-600"}`}
              >
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        className={`flex justify-between items-center pt-4 border-t-2 ${
          isFullscreen
            ? "border-white/20 text-white/70"
            : "border-gray-200 text-gray-600"
        }`}
      >
        <div>
          {dashboardData?.metadata?.lastUpdated && (
            <span className="text-sm">
              Last updated:{" "}
              {new Date(dashboardData.metadata.lastUpdated).toLocaleString()}
            </span>
          )}
        </div>
        <div>
          <span className="text-sm font-medium">
            Powered by Uni-Manager Analytics
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
