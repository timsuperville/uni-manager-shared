/**
 * Analytics Dashboard Hook
 * React hook for managing analytics dashboard data and state
 * Provides comprehensive analytics data fetching, caching, and real-time updates
 */

/* eslint-env browser */
/* global console, setInterval, clearInterval, window, document, Blob */

import { useState, useEffect, useCallback, useRef } from 'react';
import analyticsDashboardAPI from '../services/analyticsDashboardAPI';

/**
 * Hook for managing analytics dashboard data
 */
export const useAnalyticsDashboard = (applicationId, options = {}) => {
  const {
    dateRange = '7d',
    userId,
    organizationId,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    enableRealTime = false
  } = options;

  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Refs for cleanup
  const refreshIntervalRef = useRef(null);
  const realTimeUnsubscribeRef = useRef(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (refreshCache = false) => {
    if (!applicationId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await analyticsDashboardAPI.getDashboardData(applicationId, {
        dateRange,
        userId,
        organizationId,
        refreshCache
      });

      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId, dateRange, userId, organizationId]);

  // Fetch real-time metrics
  const fetchRealTimeMetrics = useCallback(async () => {
    if (!applicationId || !enableRealTime) return;

    try {
      const data = await analyticsDashboardAPI.getRealTimeMetrics(applicationId, {
        userId,
        organizationId
      });

      setRealTimeMetrics(data);
    } catch (err) {
      console.error('Failed to fetch real-time metrics:', err);
    }
  }, [applicationId, userId, organizationId, enableRealTime]);

  // Refresh data manually
  const refreshData = useCallback(async () => {
    await fetchDashboardData(true);
    if (enableRealTime) {
      await fetchRealTimeMetrics();
    }
  }, [fetchDashboardData, fetchRealTimeMetrics, enableRealTime]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDashboardData(false);
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  // Setup real-time updates
  useEffect(() => {
    if (enableRealTime && applicationId) {
      realTimeUnsubscribeRef.current = analyticsDashboardAPI.subscribeToRealTimeUpdates(
        applicationId,
        (data) => {
          setRealTimeMetrics(data);
        },
        { userId, organizationId }
      );

      return () => {
        if (realTimeUnsubscribeRef.current) {
          realTimeUnsubscribeRef.current();
          realTimeUnsubscribeRef.current = null;
        }
      };
    }
  }, [enableRealTime, applicationId, userId, organizationId]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    if (enableRealTime) {
      fetchRealTimeMetrics();
    }
  }, [fetchDashboardData, fetchRealTimeMetrics, enableRealTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (realTimeUnsubscribeRef.current) {
        realTimeUnsubscribeRef.current();
      }
    };
  }, []);

  return {
    dashboardData,
    realTimeMetrics,
    loading,
    error,
    lastUpdated,
    refreshData,
    fetchDashboardData,
    fetchRealTimeMetrics
  };
};

/**
 * Hook for specific analytics categories
 */
export const useAnalyticsCategory = (applicationId, category, options = {}) => {
  const {
    dateRange = '7d',
    userId,
    organizationId,
    autoRefresh = false,
    refreshInterval = 300000
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshIntervalRef = useRef(null);

  // Get the appropriate API method based on category
  const getAPIMethod = useCallback((category) => {
    switch (category) {
      case 'behavior':
        return analyticsDashboardAPI.getUserBehaviorAnalytics.bind(analyticsDashboardAPI);
      case 'performance':
        return analyticsDashboardAPI.getPerformanceAnalytics.bind(analyticsDashboardAPI);
      case 'security':
        return analyticsDashboardAPI.getSecurityAnalytics.bind(analyticsDashboardAPI);
      case 'engagement':
        return analyticsDashboardAPI.getEngagementAnalytics.bind(analyticsDashboardAPI);
      case 'features':
        return analyticsDashboardAPI.getFeatureUsageAnalytics.bind(analyticsDashboardAPI);
      case 'errors':
        return analyticsDashboardAPI.getErrorTrackingAnalytics.bind(analyticsDashboardAPI);
      default:
        throw new Error(`Unknown analytics category: ${category}`);
    }
  }, []);

  // Fetch category data
  const fetchData = useCallback(async () => {
    if (!applicationId || !category) return;

    try {
      setLoading(true);
      setError(null);

      const apiMethod = getAPIMethod(category);
      const result = await apiMethod(applicationId, {
        dateRange,
        userId,
        organizationId
      });

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      console.error(`Failed to fetch ${category} analytics:`, err);
    } finally {
      setLoading(false);
    }
  }, [applicationId, category, dateRange, userId, organizationId, getAPIMethod]);

  // Refresh data manually
  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshData,
    fetchData
  };
};

/**
 * Hook for tracking analytics events
 */
export const useAnalyticsTracking = () => {
  const [isTracking, setIsTracking] = useState(false);

  const trackEvent = useCallback(async (eventData) => {
    try {
      setIsTracking(true);
      await analyticsDashboardAPI.trackEvent(eventData);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      throw error;
    } finally {
      setIsTracking(false);
    }
  }, []);

  const trackPageView = useCallback(async (applicationId, page, options = {}) => {
    await trackEvent({
      type: 'page_view',
      applicationId,
      data: {
        page,
        timestamp: new Date().toISOString(),
        ...options
      }
    });
  }, [trackEvent]);

  const trackUserAction = useCallback(async (applicationId, action, options = {}) => {
    await trackEvent({
      type: 'user_action',
      applicationId,
      data: {
        action,
        timestamp: new Date().toISOString(),
        ...options
      }
    });
  }, [trackEvent]);

  const trackFeatureUsage = useCallback(async (applicationId, feature, options = {}) => {
    await trackEvent({
      type: 'feature_usage',
      applicationId,
      data: {
        feature,
        timestamp: new Date().toISOString(),
        ...options
      }
    });
  }, [trackEvent]);

  const trackError = useCallback(async (applicationId, error, options = {}) => {
    await trackEvent({
      type: 'error',
      applicationId,
      data: {
        error: error.message || error,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...options
      }
    });
  }, [trackEvent]);

  return {
    isTracking,
    trackEvent,
    trackPageView,
    trackUserAction,
    trackFeatureUsage,
    trackError
  };
};

/**
 * Hook for managing available applications
 */
export const useAvailableApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await analyticsDashboardAPI.getAvailableApplications();
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch available applications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    refreshApplications: fetchApplications
  };
};

/**
 * Hook for data export functionality
 */
export const useAnalyticsExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async (applicationId, options = {}) => {
    try {
      setIsExporting(true);
      const data = await analyticsDashboardAPI.exportDashboardData(applicationId, options);

      // Create download if format is CSV
      if (options.format === 'csv' && typeof data === 'string') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-${applicationId}-${options.dateRange || '30d'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      return data;
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportData
  };
};