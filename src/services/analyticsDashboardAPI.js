/**
 * Analytics Dashboard API Service
 * Frontend service for interacting with enhanced analytics dashboard API
 * Provides methods for fetching comprehensive dashboard data, real-time metrics, and analytics
 */

/* eslint-env browser */
/* global URLSearchParams, fetch, localStorage, setTimeout, clearInterval, setInterval, console */

import { getEnvironmentConfig } from '../../../core/config/environment';

class AnalyticsDashboardAPIService {
  constructor() {
    this.config = getEnvironmentConfig();
    this.baseURL = `${this.config.api.baseUrl}/api/analytics`;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.realTimeSubscriptions = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Get comprehensive dashboard data for an application
   */
  async getDashboardData(applicationId, options = {}) {
    try {
      const {
        dateRange = '7d',
        userId,
        organizationId,
        refreshCache = false
      } = options;

      const cacheKey = `dashboard_${applicationId}_${dateRange}_${userId || 'all'}_${organizationId || 'all'}`;

      // Check cache first
      if (!refreshCache && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const params = new URLSearchParams({
        dateRange,
        refreshCache: refreshCache.toString()
      });

      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/app-dashboard/${applicationId}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Dashboard API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (_error) {
      // console.error('Failed to get dashboard data:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get real-time metrics for an application
   */
  async getRealTimeMetrics(applicationId, options = {}) {
    try {
      const { userId, organizationId } = options;

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/realtime/${applicationId}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Real-time API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (_error) {
      // console.error('Failed to get real-time metrics:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get user behavior analytics
   */
  async getUserBehaviorAnalytics(applicationId, options = {}) {
    try {
      const { dateRange = '7d', userId, organizationId } = options;

      const params = new URLSearchParams({ dateRange });
      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/behavior/${applicationId}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`User behavior API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (_error) {
      // console.error('Failed to get user behavior analytics:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(applicationId, options = {}) {
    try {
      const { dateRange = '7d', userId, organizationId } = options;

      const params = new URLSearchParams({ dateRange });
      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/performance/${applicationId}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Performance API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (_error) {
      // console.error('Failed to get performance analytics:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get security analytics
   */
  async getSecurityAnalytics(applicationId, options = {}) {
    try {
      const { dateRange = '7d', userId, organizationId } = options;

      const params = new URLSearchParams({ dateRange });
      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/security/${applicationId}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Security API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (_error) {
      // console.error('Failed to get security analytics:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get engagement analytics
   */
  async getEngagementAnalytics(applicationId, options = {}) {
    try {
      const { dateRange = '7d', userId, organizationId } = options;

      const params = new URLSearchParams({ dateRange });
      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/engagement/${applicationId}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Engagement API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (_error) {
      // console.error('Failed to get engagement analytics:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get feature usage analytics
   */
  async getFeatureUsageAnalytics(applicationId, options = {}) {
    try {
      const { dateRange = '7d', userId, organizationId } = options;

      const params = new URLSearchParams({ dateRange });
      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/features/${applicationId}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Feature usage API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (_error) {
      // console.error('Failed to get feature usage analytics:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get error tracking analytics
   */
  async getErrorTrackingAnalytics(applicationId, options = {}) {
    try {
      const { dateRange = '7d', userId, organizationId } = options;

      const params = new URLSearchParams({ dateRange });
      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/errors/${applicationId}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Error tracking API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (_error) {
      // console.error('Failed to get error tracking analytics:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(eventData) {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseURL}/track`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );

      if (!response.ok) {
        throw new Error(`Track event API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (_error) {
      // console.error('Failed to track event:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Update real-time metrics
   */
  async updateRealTimeMetrics(applicationId, metrics, options = {}) {
    try {
      const { userId, organizationId } = options;

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/realtime/${applicationId}?${params}`,
        {
          method: 'PUT',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metrics)
        }
      );

      if (!response.ok) {
        throw new Error(`Update metrics API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (_error) {
      // console.error('Failed to update real-time metrics:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(applicationId, options = {}) {
    try {
      const {
        dateRange = '30d',
        format = 'json',
        userId,
        organizationId
      } = options;

      const params = new URLSearchParams({
        dateRange,
        format
      });

      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await this.fetchWithRetry(
        `${this.baseURL}/export/${applicationId}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Export API error: ${response.status} ${response.statusText}`);
      }

      if (format === 'csv') {
        return await response.text();
      } else {
        return await response.json();
      }
    } catch (_error) {
      // console.error('Failed to export dashboard data:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get available applications
   */
  async getAvailableApplications() {
    try {
      const cacheKey = 'available_applications';

      // Check cache first (applications don't change often)
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout * 6) { // Cache for 30 minutes
          return cached.data;
        }
      }

      const response = await this.fetchWithRetry(
        `${this.baseURL}/applications`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Applications API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (_error) {
      // console.error('Failed to get available applications:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToRealTimeUpdates(applicationId, callback, options = {}) {
    try {
      const subscriptionKey = `${applicationId}_${options.userId || 'all'}`;

      // Store callback for this subscription
      this.realTimeSubscriptions.set(subscriptionKey, callback);

      // Set up polling for real-time updates
      const pollInterval = setInterval(async () => {
        try {
          const data = await this.getRealTimeMetrics(applicationId, options);
          callback(data);
        } catch (_error) {
          // console.error('Real-time update error:', error);
        }
      }, 30000); // Poll every 30 seconds

      // Return unsubscribe function
      return () => {
        clearInterval(pollInterval);
        this.realTimeSubscriptions.delete(subscriptionKey);
      };
    } catch (_error) {
      // console.error('Failed to subscribe to real-time updates:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache(pattern = null) {
    if (pattern) {
      // Clear cache entries matching pattern
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  /**
   * Get request headers
   */
  getHeaders() {
    const headers = {
      'Accept': 'application/json'
    };

    // Add auth token if available
    const token = typeof localStorage !== "undefined" && localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Fetch with retry logic
   */
  async fetchWithRetry(url, options, attempt = 1) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 10000 // 10 second timeout
      });

      return response;
    } catch (_error) {
      if (attempt < this.retryAttempts && this.isRetryableError(error)) {
        // console.warn(`API request failed, retrying (${attempt}/${this.retryAttempts}):`, error.message);
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'TypeError' || // Network error
      error.name === 'TimeoutError' ||
      (error.response && error.response.status >= 500)
    );
  }

  /**
   * Handle API errors consistently
   */
  handleAPIError(error) {
    if (error.response) {
      // Server responded with error status
      return new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request made but no response received
      return new Error('Network Error: No response from server');
    } else {
      // Something else happened
      return new Error(`Request Error: ${error.message}`);
    }
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const analyticsDashboardAPI = new AnalyticsDashboardAPIService();

export default analyticsDashboardAPI;
export { AnalyticsDashboardAPIService };