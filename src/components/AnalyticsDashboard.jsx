/**
 * Analytics Dashboard Component
 * Comprehensive analytics dashboard with real-time metrics, charts, and data visualization
 * Integrates with enhanced analytics API and provides interactive dashboard experience
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  TimeScale
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
  useAnalyticsDashboard,
  useAnalyticsCategory,
  useAnalyticsTracking,
  useAvailableApplications,
  useAnalyticsExport
} from '../hooks/useAnalyticsDashboard';
import './AnalyticsDashboard.css';

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
  TimeScale
);

const AnalyticsDashboard = ({
  applicationId = 'home',
  userId,
  organizationId,
  className = '',
  enableRealTime = true,
  autoRefresh = true,
  showExportButtons = true
}) => {
  // State management
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [chartType, setChartType] = useState('line');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Analytics hooks
  const {
    dashboardData,
    realTimeMetrics,
    loading: dashboardLoading,
    error: dashboardError,
    refreshData
  } = useAnalyticsDashboard(applicationId, {
    dateRange: selectedDateRange,
    userId,
    organizationId,
    enableRealTime,
    autoRefresh,
    refreshInterval: 300000 // 5 minutes
  });

  const {
    data: categoryData,
    loading: categoryLoading,
    refreshData: refreshCategoryData
  } = useAnalyticsCategory(applicationId, selectedCategory === 'overview' ? 'behavior' : selectedCategory, {
    dateRange: selectedDateRange,
    userId,
    organizationId,
    autoRefresh
  });

  const { applications } = useAvailableApplications();
  const { trackEvent } = useAnalyticsTracking();
  const { exportData, isExporting } = useAnalyticsExport();

  // Track dashboard usage
  useEffect(() => {
    if (applicationId) {
      trackEvent({
        type: 'dashboard_view',
        applicationId,
        data: {
          category: selectedCategory,
          dateRange: selectedDateRange,
          timestamp: new Date().toISOString()
        }
      }).catch(console.error);
    }
  }, [applicationId, selectedCategory, selectedDateRange, trackEvent]);

  // Date range options
  const dateRangeOptions = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'overview', label: 'Overview', icon: '📊' },
    { value: 'behavior', label: 'User Behavior', icon: '👥' },
    { value: 'performance', label: 'Performance', icon: '⚡' },
    { value: 'security', label: 'Security', icon: '🔒' },
    { value: 'engagement', label: 'Engagement', icon: '💡' },
    { value: 'features', label: 'Feature Usage', icon: '🔧' },
    { value: 'errors', label: 'Error Tracking', icon: '🐛' }
  ];

  // Chart type options
  const chartTypeOptions = [
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'doughnut', label: 'Doughnut Chart', icon: '🍩' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' }
  ];

  // Get current application info
  const currentApp = useMemo(() => {
    return applications.find(app => app.id === applicationId) || {
      id: applicationId,
      name: applicationId.charAt(0).toUpperCase() + applicationId.slice(1),
      description: 'Application analytics'
    };
  }, [applications, applicationId]);

  // Prepare chart data based on category and data
  const chartData = useMemo(() => {
    if (!dashboardData && !categoryData) return null;

    const data = selectedCategory === 'overview' ? dashboardData : categoryData;
    if (!data || !data.chartData) return null;

    return {
      labels: data.chartData.labels || [],
      datasets: data.chartData.datasets || []
    };
  }, [dashboardData, categoryData, selectedCategory]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${currentApp.name} - ${categoryOptions.find(opt => opt.value === selectedCategory)?.label || 'Analytics'}`
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: chartType === 'line' || chartType === 'bar' ? {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Value'
        }
      }
    } : {},
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Get the appropriate chart component
  const getChartComponent = () => {
    if (!chartData) return null;

    const chartProps = {
      data: chartData,
      options: chartOptions,
      height: 400
    };

    switch (chartType) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      default:
        return <Line {...chartProps} />;
    }
  };

  // Handle export
  const handleExport = async (format = 'json') => {
    try {
      await exportData(applicationId, {
        dateRange: selectedDateRange,
        format,
        userId,
        organizationId
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([
      refreshData(),
      refreshCategoryData()
    ]);
  };

  // Loading state
  if (dashboardLoading && !dashboardData) {
    return (
      <div className={`analytics-dashboard loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardError) {
    return (
      <div className={`analytics-dashboard error ${className}`}>
        <div className="error-message">
          <h3>Failed to load analytics</h3>
          <p>{dashboardError}</p>
          <button onClick={handleRefresh} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`analytics-dashboard ${isFullscreen ? 'fullscreen' : ''} ${className}`}>
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2>{currentApp.name} Analytics</h2>
          <p className="app-description">{currentApp.description}</p>
        </div>
        <div className="header-right">
          {/* Real-time indicator */}
          {enableRealTime && realTimeMetrics && (
            <div className="realtime-indicator">
              <span className="indicator-dot"></span>
              <span>Live</span>
            </div>
          )}

          {/* Fullscreen toggle */}
          <button
            className="fullscreen-toggle"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⤋' : '⤢'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="dashboard-controls">
        {/* Date Range Selector */}
        <div className="control-group">
          <label>Date Range:</label>
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="date-range-select"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div className="control-group">
          <label>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Chart Type Selector */}
        <div className="control-group">
          <label>Chart Type:</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="chart-type-select"
          >
            {chartTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="control-group actions">
          <button
            onClick={handleRefresh}
            disabled={dashboardLoading || categoryLoading}
            className="refresh-button"
            title="Refresh Data"
          >
            🔄 Refresh
          </button>

          {showExportButtons && (
            <>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="export-button"
                title="Export as JSON"
              >
                📄 JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="export-button"
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
          className="realtime-metrics"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="metric-item">
            <span className="metric-label">Active Users</span>
            <span className="metric-value">{realTimeMetrics.activeUsers || 0}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Current Sessions</span>
            <span className="metric-value">{realTimeMetrics.currentSessions || 0}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Page Views/Min</span>
            <span className="metric-value">{realTimeMetrics.pageViewsPerMinute || 0}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Response Time</span>
            <span className="metric-value">{realTimeMetrics.avgResponseTime || 0}ms</span>
          </div>
        </motion.div>
      )}

      {/* Main Chart */}
      <div className="dashboard-chart">
        <AnimatePresence mode="wait">
          {(dashboardLoading || categoryLoading) && (
            <motion.div
              className="chart-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="loading-spinner small">
                <div className="spinner"></div>
              </div>
            </motion.div>
          )}

          {chartData && (
            <motion.div
              className="chart-container"
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
        <div className="summary-cards">
          {Object.entries(dashboardData?.summary || categoryData?.summary || {}).map(([key, value]) => (
            <motion.div
              key={key}
              className="summary-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h4>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
              <p className="summary-value">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="dashboard-footer">
        <div className="footer-left">
          {dashboardData?.metadata?.lastUpdated && (
            <span className="last-updated">
              Last updated: {new Date(dashboardData.metadata.lastUpdated).toLocaleString()}
            </span>
          )}
        </div>
        <div className="footer-right">
          <span className="powered-by">Powered by Uni-Manager Analytics</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;