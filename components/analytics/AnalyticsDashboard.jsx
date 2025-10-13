/**
 * Advanced Analytics Dashboard Component
 *
 * Comprehensive analytics dashboard with real-time data visualization,
 * machine learning insights, predictive analytics, and AI-powered recommendations.
 *
 * Features:
 * - Real-time metrics and performance monitoring
 * - User behavior analytics with interactive charts
 * - Security analytics with threat detection
 * - Predictive insights and forecasting
 * - AI-powered recommendations and automation
 * - Export functionality for reports
 * - Customizable dashboard layout
 * - Responsive design for all devices
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Brain,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Database,
  Server,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorBoundary } from '../ErrorBoundary';

// Color palette for charts
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  success: '#22c55e',
  chartColors: [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#f97316',
    '#ec4899',
  ],
};

export const AnalyticsDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [predictiveInsights, setPredictiveInsights] = useState({});
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dashboardLayout, setDashboardLayout] = useState('default');
  const [websocket, setWebsocket] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboard, insights, recommendations] = await Promise.all([
        analyticsService.getDashboard({ timeframe: selectedTimeframe }),
        analyticsService.getPredictiveInsights({
          type: 'userEngagement',
          timeframe: selectedTimeframe,
        }),
        analyticsService.getAIRecommendations(),
      ]);

      setDashboardData(dashboard);
      setPredictiveInsights(insights);
      setAiRecommendations(recommendations);
    } catch (_err) {
      setError(err.message);
      // console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (autoRefresh) {
      const ws = new WebSocket(
        `ws://${typeof window !== "undefined" && window.location.host}/api/analytics/stream`
      );

      ws.onopen = () => {
        // console.log('WebSocket connected for real-time analytics');
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            channels: ['metrics', 'alerts', 'user-behavior'],
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'real-time-update') {
            setRealTimeMetrics(data.data.metrics);
            setActiveAlerts(data.data.alerts);
          }
        } catch (_err) {
          // console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (_error) => {
        // console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        // console.log('WebSocket connection closed');
      };

      setWebsocket(ws);

      return () => {
        ws.close();
      };
    }
  }, [autoRefresh]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && !websocket) {
      const interval = setInterval(fetchDashboardData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, websocket, fetchDashboardData]);

  // Export functionality
  const handleExport = async (format) => {
    try {
      const response = await analyticsService.exportData({
        format,
        timeframe: selectedTimeframe,
        dataTypes: ['userBehavior', 'performance', 'security'],
      });

      // Create download link
      const blob = new Blob([response], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = typeof window !== "undefined" && window.URL.createObjectURL(blob);
      const link = typeof document !== "undefined" && document.createElement('a');
      link.href = url;
      link.download = `analytics_export_${Date.now()}.${format}`;
      typeof document !== "undefined" && document.body.appendChild(link);
      link.click();
      typeof document !== "undefined" && document.body.removeChild(link);
      typeof window !== "undefined" && window.URL.revokeObjectURL(url);
    } catch (_err) {
      setError(`Export failed: ${err.message}`);
    }
  };

  // Render metric card
  const MetricCard = ({
    title,
    value,
    trend,
    icon: Icon,
    color = 'primary',
  }) => (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className='text-2xl font-bold text-gray-900'>{value}</p>
        </div>
        <div
          className={`p-3 rounded-full bg-${color === 'primary' ? 'blue' : color}-100`}
        >
          <Icon
            className={`h-6 w-6 text-${color === 'primary' ? 'blue' : color}-600`}
          />
        </div>
      </div>
      {trend && (
        <div className='mt-4 flex items-center'>
          {trend > 0 ? (
            <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
          ) : (
            <TrendingDown className='h-4 w-4 text-red-500 mr-1' />
          )}
          <span
            className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {Math.abs(trend)}%
          </span>
          <span className='text-sm text-gray-500 ml-1'>vs last period</span>
        </div>
      )}
    </div>
  );

  // Render chart container
  const ChartContainer = ({ title, children, actions }) => (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
        {actions && <div className='flex space-x-2'>{actions}</div>}
      </div>
      <div className='h-80'>{children}</div>
    </div>
  );

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!dashboardData) return {};

    return {
      userActivity: dashboardData.userBehavior?.activityTrends || [],
      performanceMetrics: dashboardData.performance?.trends || [],
      securityEvents: dashboardData.security?.eventTrends || [],
      applicationUsage: dashboardData.userBehavior?.applicationUsage || [],
      deviceBreakdown: dashboardData.userBehavior?.deviceBreakdown || [],
      securityThreats: dashboardData.security?.threatsByType || [],
    };
  }, [dashboardData]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <LoadingSpinner size='lg' />
        <span className='ml-3 text-lg'>Loading Analytics Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
        <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
        <h3 className='text-lg font-semibold text-red-800 mb-2'>
          Dashboard Error
        </h3>
        <p className='text-red-600 mb-4'>{error}</p>
        <button
          onClick={fetchDashboardData}
          className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50 p-6'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Analytics Dashboard
              </h1>
              <p className='text-gray-600 mt-1'>
                Real-time insights, predictive analytics, and AI-powered
                recommendations
              </p>
            </div>

            <div className='flex items-center space-x-4'>
              {/* Timeframe Selector */}
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='1h'>Last Hour</option>
                <option value='6h'>Last 6 Hours</option>
                <option value='24h'>Last 24 Hours</option>
                <option value='7d'>Last 7 Days</option>
                <option value='30d'>Last 30 Days</option>
                <option value='90d'>Last 90 Days</option>
              </select>

              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`}
                />
                Auto-refresh
              </button>

              {/* Export Dropdown */}
              <div className='relative'>
                <button className='px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center'>
                  <Download className='h-4 w-4 mr-1' />
                  Export
                </button>
                <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 hidden group-hover:block'>
                  <button
                    onClick={() => handleExport('json')}
                    className='block w-full text-left px-4 py-2 hover:bg-gray-50'
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className='block w-full text-left px-4 py-2 hover:bg-gray-50'
                  >
                    Export as CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Banner */}
        {activeAlerts.length > 0 && (
          <div className='bg-red-50 border-l-4 border-red-400 p-4 mb-6'>
            <div className='flex'>
              <AlertTriangle className='h-5 w-5 text-red-400' />
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  {activeAlerts.length} Active Alert
                  {activeAlerts.length > 1 ? 's' : ''}
                </h3>
                <div className='mt-2 text-sm text-red-700'>
                  {activeAlerts.slice(0, 3).map((alert, index) => (
                    <p key={index}>{alert.message}</p>
                  ))}
                  {activeAlerts.length > 3 && (
                    <p>...and {activeAlerts.length - 3} more</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <MetricCard
            title='Active Users'
            value={
              realTimeMetrics.activeUsers ||
              dashboardData?.summary?.activeUsers ||
              0
            }
            trend={dashboardData?.summary?.userGrowth}
            icon={Users}
            color='primary'
          />
          <MetricCard
            title='Performance Score'
            value={`${dashboardData?.summary?.performanceScore || 95}%`}
            trend={dashboardData?.summary?.performanceTrend}
            icon={Zap}
            color='success'
          />
          <MetricCard
            title='Security Score'
            value={`${dashboardData?.summary?.securityScore || 98}%`}
            trend={dashboardData?.summary?.securityTrend}
            icon={Shield}
            color='info'
          />
          <MetricCard
            title='AI Insights'
            value={
              predictiveInsights.totalInsights || aiRecommendations.length || 0
            }
            trend={dashboardData?.summary?.insightsTrend}
            icon={Brain}
            color='warning'
          />
        </div>

        {/* Charts Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* User Activity Chart */}
          <ChartContainer title='User Activity Trends'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData.userActivity}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='time' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type='monotone'
                  dataKey='activeUsers'
                  stackId='1'
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.6}
                />
                <Area
                  type='monotone'
                  dataKey='newUsers'
                  stackId='1'
                  stroke={COLORS.secondary}
                  fill={COLORS.secondary}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Performance Metrics Chart */}
          <ChartContainer title='Performance Metrics'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartData.performanceMetrics}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='time' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='responseTime'
                  stroke={COLORS.primary}
                  strokeWidth={2}
                />
                <Line
                  type='monotone'
                  dataKey='throughput'
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                />
                <Line
                  type='monotone'
                  dataKey='errorRate'
                  stroke={COLORS.danger}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Application Usage Distribution */}
          <ChartContainer title='Application Usage'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={chartData.applicationUsage}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {chartData.applicationUsage.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        COLORS.chartColors[index % COLORS.chartColors.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Security Events */}
          <ChartContainer title='Security Events'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData.securityEvents}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='time' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='threats' fill={COLORS.danger} />
                <Bar dataKey='blocked' fill={COLORS.success} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* AI Recommendations and Insights */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* AI Recommendations */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <Brain className='h-5 w-5 mr-2 text-purple-600' />
              AI Recommendations
            </h3>
            <div className='space-y-3'>
              {aiRecommendations.slice(0, 5).map((recommendation, index) => (
                <div
                  key={index}
                  className='p-3 bg-purple-50 rounded-lg border border-purple-200'
                >
                  <div className='flex items-start'>
                    <div className='flex-1'>
                      <h4 className='font-medium text-purple-900'>
                        {recommendation.title}
                      </h4>
                      <p className='text-sm text-purple-700 mt-1'>
                        {recommendation.description}
                      </p>
                      <div className='flex items-center mt-2'>
                        <span className='text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded'>
                          {recommendation.category}
                        </span>
                        <span className='text-xs text-purple-600 ml-2'>
                          Impact: {recommendation.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Predictive Insights */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <Target className='h-5 w-5 mr-2 text-blue-600' />
              Predictive Insights
            </h3>
            <div className='space-y-4'>
              {predictiveInsights.insights &&
                predictiveInsights.insights
                  .slice(0, 4)
                  .map((insight, index) => (
                    <div
                      key={index}
                      className='p-3 bg-blue-50 rounded-lg border border-blue-200'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium text-blue-900'>
                            {insight.title}
                          </h4>
                          <p className='text-sm text-blue-700'>
                            {insight.prediction}
                          </p>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm font-medium text-blue-900'>
                            {insight.confidence}% confidence
                          </div>
                          <div className='text-xs text-blue-600'>
                            {insight.timeframe}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Real-time System Metrics */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
            <Activity className='h-5 w-5 mr-2 text-green-600' />
            Real-time System Metrics
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <Cpu className='h-8 w-8 text-blue-500 mx-auto mb-2' />
              <div className='text-2xl font-bold text-gray-900'>
                {realTimeMetrics.cpuUsage || '15'}%
              </div>
              <div className='text-sm text-gray-600'>CPU Usage</div>
            </div>
            <div className='text-center'>
              <MemoryStick className='h-8 w-8 text-green-500 mx-auto mb-2' />
              <div className='text-2xl font-bold text-gray-900'>
                {realTimeMetrics.memoryUsage || '68'}%
              </div>
              <div className='text-sm text-gray-600'>Memory Usage</div>
            </div>
            <div className='text-center'>
              <HardDrive className='h-8 w-8 text-yellow-500 mx-auto mb-2' />
              <div className='text-2xl font-bold text-gray-900'>
                {realTimeMetrics.diskUsage || '42'}%
              </div>
              <div className='text-sm text-gray-600'>Disk Usage</div>
            </div>
            <div className='text-center'>
              <Wifi className='h-8 w-8 text-purple-500 mx-auto mb-2' />
              <div className='text-2xl font-bold text-gray-900'>
                {realTimeMetrics.networkLatency || '23'}ms
              </div>
              <div className='text-sm text-gray-600'>Network Latency</div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AnalyticsDashboard;
