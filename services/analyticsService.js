/**
 * Frontend Analytics Service
 *
 * Client-side service for interacting with the Advanced Analytics & AI Dashboard API.
 * Provides methods for:
 * - Dashboard data retrieval
 * - Real-time metrics and event tracking
 * - Predictive analytics and AI insights
 * - User behavior analytics
 * - Performance monitoring
 * - Security analytics
 * - Data export functionality
 * - WebSocket connections for real-time updates
 */

/* global window, document, localStorage, sessionStorage, WebSocket, fetch, URLSearchParams, console, navigator, setTimeout */

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

class AnalyticsService {
  constructor() {
    this.baseUrl = "/analytics";
    this.baseUrl = "/analytics";
    this.websocket = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async _request(endpoint, options = {}) {
    const token = this.getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      // Create an error object similar to what axios might return for compatibility
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || response.statusText);
      error.response = {
        status: response.status,
        data: errorData,
      };
      throw error;
    }
    const data = await response.json();
    return { data }; // maintain { data: ... } structure expected by methods
  }

  /**
   * Get comprehensive analytics dashboard
   */
  async getDashboard(options = {}) {
    try {
      const { timeframe = "24h", userId, applicationId } = options;

      const params = new URLSearchParams({
        timeframe,
      });

      if (userId) params.append("userId", userId);
      if (applicationId) params.append("applicationId", applicationId);

      const response = await this._request(
        `${this.baseUrl}/dashboard?${params}`,
      );
      return response.data;
    } catch (error) {
      // console.error('Failed to get dashboard data:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user behavior analytics
   */
  async getUserBehaviorAnalytics(options = {}) {
    try {
      const { timeframe = "24h", userId, applicationId } = options;

      const params = new URLSearchParams({
        timeframe,
      });

      if (userId) params.append("userId", userId);
      if (applicationId) params.append("applicationId", applicationId);

      const response = await this._request(
        `${this.baseUrl}/user-behavior?${params}`,
      );
      return response.data;
    } catch (error) {
      // console.error('Failed to get user behavior analytics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(options = {}) {
    try {
      const { timeframe = "24h", applicationId } = options;

      const params = new URLSearchParams({
        timeframe,
      });

      if (applicationId) params.append("applicationId", applicationId);

      const response = await this._request(
        `${this.baseUrl}/performance/metrics?${params}`,
      );
      return response.data;
    } catch (error) {
      // console.error('Failed to get performance analytics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get membership growth data for Church app
   */
  async getMembershipGrowth(churchId, timeframe = "year") {
    try {
      const response = await this._request(
        `/church/${churchId}/dashboard/membership-growth?period=${timeframe}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get security analytics
   */
  async getSecurityAnalytics(options = {}) {
    try {
      const { timeframe = "24h", applicationId } = options;

      const params = new URLSearchParams({
        timeframe,
      });

      if (applicationId) params.append("applicationId", applicationId);

      const response = await this._request(
        `${this.baseUrl}/security?${params}`,
      );
      return response.data;
    } catch (error) {
      // console.error('Failed to get security analytics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics() {
    try {
      const response = await this._request(`${this.baseUrl}/real-time/metrics`);
      return response.data;
    } catch (error) {
      // console.error('Failed to get real-time metrics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    try {
      const response = await this._request(`${this.baseUrl}/real-time/alerts`);
      return response.data;
    } catch (error) {
      // console.error('Failed to get active alerts:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Track user behavior event
   */
  async trackUserBehavior(userId, eventType, eventData = {}) {
    try {
      const response = await this._request(
        `${this.baseUrl}/track/user-behavior`,
        {
          method: "POST",
          body: JSON.stringify({
            userId,
            eventType,
            eventData: {
              ...eventData,
              timestamp: new Date().toISOString(),
              sessionId: this.getSessionId(),
              applicationId: this.getApplicationId(),
            },
          }),
        },
      );
      return response.data;
    } catch (error) {
      // console.error('Failed to track user behavior:', error);
      // Don't throw error for tracking to avoid disrupting user experience
      return null;
    }
  }

  /**
   * Track performance metric
   */
  async trackPerformanceMetric(metricType, value, context = {}) {
    try {
      // Validate inputs before sending
      if (!metricType || typeof metricType !== "string") {
        console.warn(
          "Invalid metricType for performance tracking:",
          metricType,
        );
        return null;
      }

      if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
        console.warn("Invalid value for performance tracking:", {
          metricType,
          value,
        });
        return null;
      }

      // NOTE: Analytics backend not yet implemented - see missing_features.md
      // Skip API call in development to prevent 404 errors
      if (import.meta.env.DEV) {
        console.debug("[Analytics] Skipped in dev:", {
          metricType,
          value,
          context: context?.pageUrl,
        });
        return null;
      }

      const response = await this._request(
        `${this.baseUrl}/track/performance`,
        {
          method: "POST",
          body: JSON.stringify({
            metricType,
            value,
            context: {
              ...context,
              timestamp: new Date().toISOString(),
              applicationId: this.getApplicationId(),
            },
          }),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to track performance metric:", error);
      // Don't throw error for tracking to avoid disrupting user experience
      return null;
    }
  }

  /**
   * Track security event
   */
  async trackSecurityEvent(eventType, severity, details = {}) {
    try {
      const response = await this._request(`${this.baseUrl}/track/security`, {
        method: "POST",
        body: JSON.stringify({
          eventType,
          severity,
          details: {
            ...details,
            timestamp: new Date().toISOString(),
            applicationId: this.getApplicationId(),
          },
        }),
      });
      return response.data;
    } catch (error) {
      // console.error('Failed to track security event:', error);
      // Don't throw error for tracking to avoid disrupting user experience
      return null;
    }
  }

  /**
   * Generate predictive insights
   */
  async getPredictiveInsights(options = {}) {
    try {
      const {
        type = "userEngagement",
        timeframe = "7d",
        parameters = {},
      } = options;

      const response = await this._request(`${this.baseUrl}/ai/insights`, {
        method: "POST",
        body: JSON.stringify({
          type,
          timeframe,
          parameters,
        }),
      });
      return response.data;
    } catch (error) {
      // console.error('Failed to get predictive insights:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get AI-powered recommendations
   */
  async getAIRecommendations(options = {}) {
    try {
      const { userId, applicationId } = options;

      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (applicationId) params.append("applicationId", applicationId);

      const response = await this._request(
        `${this.baseUrl}/ai/recommendations?${params}`,
      );
      return response.data;
    } catch (error) {
      // console.error('Failed to get AI recommendations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Execute custom analytics query
   */
  async executeCustomQuery(query) {
    try {
      const response = await this._request(`${this.baseUrl}/query/custom`, {
        method: "POST",
        body: JSON.stringify(query),
      });
      return response.data;
    } catch (error) {
      // console.error('Failed to execute custom query:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Export analytics data
   */
  async exportData(options = {}) {
    try {
      const {
        format = "json",
        timeframe = "24h",
        dataTypes = ["userBehavior", "performance", "security"],
      } = options;

      const params = new URLSearchParams({
        format,
        timeframe,
        dataTypes: dataTypes.join(","),
      });

      const response = await fetch(`${this.baseUrl}/export?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      if (format === "json") {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      // console.error('Failed to export data:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    try {
      const response = await this._request(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      // console.error('Failed to get service health:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Setup WebSocket connection for real-time updates
   */
  connectWebSocket(onMessage, onError, onClose) {
    try {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        // console.log('WebSocket already connected');
        return this.websocket;
      }

      const protocol =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "wss:"
          : "ws:";
      const wsUrl = `${protocol}//${typeof window !== "undefined" && window.location.host}/analytics/stream`;

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        // console.log('Analytics WebSocket connected');
        this.isConnected = true;
        this.retryCount = 0;

        // Subscribe to real-time updates
        this.websocket.send(
          JSON.stringify({
            type: "subscribe",
            channels: [
              "metrics",
              "alerts",
              "user-behavior",
              "performance",
              "security",
            ],
          }),
        );
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (error) {
          // console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onerror = (error) => {
        // console.error('Analytics WebSocket error:', error);
        this.isConnected = false;
        if (onError) onError(error);
      };

      this.websocket.onclose = (event) => {
        // console.log('Analytics WebSocket closed:', event.code, event.reason);
        this.isConnected = false;

        if (onClose) onClose(event);

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && this.retryCount < this.maxRetries) {
          this.retryConnection(onMessage, onError, onClose);
        }
      };

      return this.websocket;
    } catch (error) {
      // console.error('Failed to setup WebSocket connection:', error);
      if (onError) onError(error);
      return null;
    }
  }

  /**
   * Retry WebSocket connection
   */
  retryConnection(onMessage, onError, onClose) {
    this.retryCount++;
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff

    // console.log(
    //   `Retrying WebSocket connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`
    // );

    setTimeout(() => {
      this.connectWebSocket(onMessage, onError, onClose);
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close(1000, "Manual disconnect");
      this.websocket = null;
      this.isConnected = false;
    }
  }

  /**
   * Send message through WebSocket
   */
  sendWebSocketMessage(message) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
      return true;
    } else {
      // console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }

  /**
   * Auto-track page view
   */
  trackPageView(path, title) {
    const userId = this.getCurrentUserId();
    if (userId) {
      this.trackUserBehavior(userId, "page_view", {
        pageUrl: path,
        pageTitle: title,
        referrer: typeof document !== "undefined" && document.referrer,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Auto-track user interaction
   */
  trackInteraction(element, action, details = {}) {
    const userId = this.getCurrentUserId();
    if (userId) {
      this.trackUserBehavior(userId, "interaction", {
        element,
        action,
        details,
        pageUrl: typeof window !== "undefined" && window.location.pathname,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Auto-track performance timing
   */
  trackPerformanceTiming() {
    if (
      typeof window !== "undefined" &&
      window.performance &&
      typeof window !== "undefined" &&
      window.performance.timing
    ) {
      const timing = typeof window !== "undefined" && window.performance.timing;
      const navigationStart = timing.navigationStart;

      // Track various performance metrics
      const metrics = {
        dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
        tcp_connection: timing.connectEnd - timing.connectStart,
        server_response: timing.responseEnd - timing.requestStart,
        dom_processing: timing.domComplete - timing.domLoading,
        page_load: timing.loadEventEnd - navigationStart,
      };

      Object.entries(metrics).forEach(([metric, value]) => {
        // Ensure value is a valid positive number
        if (
          typeof value === "number" &&
          !isNaN(value) &&
          isFinite(value) &&
          value > 0
        ) {
          this.trackPerformanceMetric(metric, value, {
            pageUrl: typeof window !== "undefined" && window.location.pathname,
            userAgent: typeof navigator !== "undefined" && navigator.userAgent,
          });
        }
      });
    }
  }

  /**
   * Get current user ID from auth context
   */
  getCurrentUserId() {
    // This would typically come from your auth context or local storage
    const user = JSON.parse(
      (typeof localStorage !== "undefined" && localStorage.getItem("user")) ||
        "{}",
    );
    return user.id || null;
  }

  /**
   * Get session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
  }

  /**
   * Get application ID
   */
  getApplicationId() {
    // Determine application ID based on current path or configuration
    const path = typeof window !== "undefined" && window.location.pathname;
    if (path.includes("/church")) return "church";
    if (path.includes("/admin")) return "admin";
    if (path.includes("/business")) return "business";
    if (path.includes("/personal")) return "personal";
    if (path.includes("/home")) return "home";
    if (path.includes("/playback")) return "playback";
    return "main-website";
  }

  /**
   * Get auth token
   */
  getAuthToken() {
    return (
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("auth_token")) ||
      ""
    );
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Bad Request: ${message}`);
        case 401:
          return new Error("Unauthorized: Please log in again");
        case 403:
          return new Error(
            "Forbidden: You do not have permission to access this resource",
          );
        case 404:
          return new Error("Not Found: The requested resource was not found");
        case 429:
          return new Error("Rate Limit Exceeded: Please try again later");
        case 500:
          return new Error("Server Error: Please try again later");
        default:
          return new Error(`HTTP ${status}: ${message}`);
      }
    } else if (error.request) {
      // Network error
      return new Error("Network Error: Please check your internet connection");
    } else {
      // Other error
      return new Error(error.message || "An unexpected error occurred");
    }
  }

  /**
   * Batch track multiple events
   */
  async batchTrackEvents(events) {
    try {
      // For now, send events individually
      // In production, this could be optimized with a batch endpoint
      const results = await Promise.allSettled(
        events.map((event) => {
          switch (event.type) {
            case "user_behavior":
              return this.trackUserBehavior(
                event.userId,
                event.eventType,
                event.eventData,
              );
            case "performance":
              return this.trackPerformanceMetric(
                event.metricType,
                event.value,
                event.context,
              );
            case "security":
              return this.trackSecurityEvent(
                event.eventType,
                event.severity,
                event.details,
              );
            default:
              throw new Error(`Unknown event type: ${event.type}`);
          }
        }),
      );

      return results;
    } catch (error) {
      // console.error('Failed to batch track events:', error);
      return [];
    }
  }

  /**
   * Initialize auto-tracking
   */
  initializeAutoTracking() {
    // Track page load performance
    typeof window !== "undefined" &&
      window.addEventListener("load", () => {
        setTimeout(() => this.trackPerformanceTiming(), 100);
      });

    // Track page visibility changes
    typeof document !== "undefined" &&
      document.addEventListener("visibilitychange", () => {
        const userId = this.getCurrentUserId();
        if (userId) {
          this.trackUserBehavior(userId, "page_visibility_change", {
            hidden: typeof document !== "undefined" && document.hidden,
            timestamp: new Date().toISOString(),
          });
        }
      });

    // Track clicks on important elements
    typeof document !== "undefined" &&
      document.addEventListener("click", (event) => {
        const target = event.target;
        if (
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.hasAttribute("data-track")
        ) {
          this.trackInteraction(target.tagName.toLowerCase(), "click", {
            text: target.textContent?.trim(),
            className: target.className,
            id: target.id,
          });
        }
      });

    // console.log('Analytics auto-tracking initialized');
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

// Initialize auto-tracking when the service is imported
if (typeof window !== "undefined") {
  analyticsService.initializeAutoTracking();
}

export default analyticsService;
