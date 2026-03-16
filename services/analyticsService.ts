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

import { getApiBaseUrl } from "../api/config/apiConfig.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsOptions {
  timeframe?: string;
  userId?: string;
  applicationId?: string;
  [key: string]: unknown;
}

export interface InsightOptions {
  type?: string;
  timeframe?: string;
  parameters?: Record<string, unknown>;
}

export interface ExportOptions {
  format?: "json" | "csv" | "xlsx";
  timeframe?: string;
  dataTypes?: string[];
}

interface TrackBatchEvent {
  type: "user_behavior" | "performance" | "security";
  userId?: string;
  eventType?: string;
  eventData?: Record<string, unknown>;
  metricType?: string;
  value?: number;
  context?: Record<string, unknown>;
  severity?: string;
  details?: Record<string, unknown>;
}

interface InteractionContext {
  element: string;
  action: string;
  details: Record<string, unknown>;
  pageUrl?: string | boolean;
  timestamp: string;
}

interface ApiErrorResponse {
  status: number;
  data: { message?: string; [key: string]: unknown };
}

/** Typed API error that carries an optional HTTP response body */
class ApiError extends Error {
  response?: ApiErrorResponse;
  request?: unknown;

  constructor(message: string, response?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    if (response) this.response = response;
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const API_BASE_URL = getApiBaseUrl() as string;

class AnalyticsService {
  private readonly baseUrl = "/analytics";
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private retryCount = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1_000;

  // ---------------------------------------------------------------------------
  // Private HTTP helper
  // ---------------------------------------------------------------------------

  private async _request(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ data: unknown }> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      const err = new ApiError(errorData.message ?? response.statusText, {
        status: response.status,
        data: errorData,
      });
      throw err;
    }
    const data = await response.json();
    return { data };
  }

  // ---------------------------------------------------------------------------
  // Data retrieval methods
  // ---------------------------------------------------------------------------

  async getDashboard(options: AnalyticsOptions = {}): Promise<unknown> {
    try {
      const { timeframe = "24h", userId, applicationId } = options;
      const params = new URLSearchParams({ timeframe });
      if (userId) params.append("userId", userId);
      if (applicationId) params.append("applicationId", applicationId);
      const response = await this._request(
        `${this.baseUrl}/dashboard?${params}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserBehaviorAnalytics(
    options: AnalyticsOptions = {},
  ): Promise<unknown> {
    try {
      const { timeframe = "24h", userId, applicationId } = options;
      const params = new URLSearchParams({ timeframe });
      if (userId) params.append("userId", userId);
      if (applicationId) params.append("applicationId", applicationId);
      const response = await this._request(
        `${this.baseUrl}/user-behavior?${params}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPerformanceAnalytics(
    options: AnalyticsOptions = {},
  ): Promise<unknown> {
    try {
      const { timeframe = "24h", applicationId } = options;
      const params = new URLSearchParams({ timeframe });
      if (applicationId) params.append("applicationId", applicationId);
      const response = await this._request(
        `${this.baseUrl}/performance/metrics?${params}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMembershipGrowth(
    churchId: string,
    timeframe = "year",
  ): Promise<unknown> {
    try {
      const response = await this._request(
        `/church/${churchId}/dashboard/membership-growth?period=${timeframe}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSecurityAnalytics(options: AnalyticsOptions = {}): Promise<unknown> {
    try {
      const { timeframe = "24h", applicationId } = options;
      const params = new URLSearchParams({ timeframe });
      if (applicationId) params.append("applicationId", applicationId);
      const response = await this._request(
        `${this.baseUrl}/security?${params}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRealTimeMetrics(): Promise<unknown> {
    try {
      const response = await this._request(`${this.baseUrl}/real-time/metrics`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getActiveAlerts(): Promise<unknown> {
    try {
      const response = await this._request(`${this.baseUrl}/real-time/alerts`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Tracking methods
  // ---------------------------------------------------------------------------

  async trackUserBehavior(
    userId: string,
    eventType: string,
    eventData: Record<string, unknown> = {},
  ): Promise<unknown | null> {
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
    } catch {
      // Don't throw — tracking must never disrupt user experience
      return null;
    }
  }

  async trackPerformanceMetric(
    metricType: string,
    value: number,
    context: Record<string, unknown> = {},
  ): Promise<unknown | null> {
    try {
      if (!metricType || typeof metricType !== "string") {
        if (import.meta.env.DEV)
          console.warn("[Analytics] Invalid metricType:", metricType);
        return null;
      }
      if (
        typeof value !== "number" ||
        Number.isNaN(value) ||
        !Number.isFinite(value)
      ) {
        if (import.meta.env.DEV)
          console.warn("[Analytics] Invalid value:", { metricType, value });
        return null;
      }
      if (import.meta.env.DEV) {
        console.debug("[Analytics] Skipped in dev:", {
          metricType,
          value,
          context: context.pageUrl,
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
      if (import.meta.env.DEV)
        console.error("[Analytics] Failed to track performance metric:", error);
      return null;
    }
  }

  async trackSecurityEvent(
    eventType: string,
    severity: string,
    details: Record<string, unknown> = {},
  ): Promise<unknown | null> {
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
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // AI & insights
  // ---------------------------------------------------------------------------

  async getPredictiveInsights(options: InsightOptions = {}): Promise<unknown> {
    try {
      const {
        type = "userEngagement",
        timeframe = "7d",
        parameters = {},
      } = options;
      const response = await this._request(`${this.baseUrl}/ai/insights`, {
        method: "POST",
        body: JSON.stringify({ type, timeframe, parameters }),
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAIRecommendations(options: AnalyticsOptions = {}): Promise<unknown> {
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
      throw this.handleError(error);
    }
  }

  async executeCustomQuery(query: Record<string, unknown>): Promise<unknown> {
    try {
      const response = await this._request(`${this.baseUrl}/query/custom`, {
        method: "POST",
        body: JSON.stringify(query),
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async exportData(options: ExportOptions = {}): Promise<unknown> {
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
        headers: { Authorization: `Bearer ${this.getAuthToken()}` },
      });

      if (!response.ok)
        throw new Error(`Export failed: ${response.statusText}`);
      return format === "json" ? response.json() : response.text();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getServiceHealth(): Promise<unknown> {
    try {
      const response = await this._request(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ---------------------------------------------------------------------------
  // WebSocket for real-time streaming
  // ---------------------------------------------------------------------------

  connectWebSocket(
    onMessage?: (data: unknown) => void,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void,
  ): WebSocket | null {
    try {
      if (this.websocket?.readyState === WebSocket.OPEN) return this.websocket;

      const protocol =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "wss:"
          : "ws:";
      const host =
        typeof window !== "undefined" ? window.location.host : "localhost";
      const wsUrl = `${protocol}//${host}/analytics/stream`;

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        this.isConnected = true;
        this.retryCount = 0;
        this.websocket!.send(
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

      this.websocket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string) as unknown;
          onMessage?.(data);
        } catch {
          // Ignore malformed frames
        }
      };

      this.websocket.onerror = (error: Event) => {
        this.isConnected = false;
        onError?.(error);
      };

      this.websocket.onclose = (event: CloseEvent) => {
        this.isConnected = false;
        onClose?.(event);
        if (event.code !== 1000 && this.retryCount < this.maxRetries) {
          this.retryConnection(onMessage, onError, onClose);
        }
      };

      return this.websocket;
    } catch (error) {
      onError?.(error as Event);
      return null;
    }
  }

  private retryConnection(
    onMessage?: (data: unknown) => void,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void,
  ): void {
    this.retryCount++;
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
    setTimeout(() => this.connectWebSocket(onMessage, onError, onClose), delay);
  }

  disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close(1000, "Manual disconnect");
      this.websocket = null;
      this.isConnected = false;
    }
  }

  sendWebSocketMessage(message: Record<string, unknown>): boolean {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Auto-tracking helpers
  // ---------------------------------------------------------------------------

  trackPageView(path: string, title: string): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      this.trackUserBehavior(userId, "page_view", {
        pageUrl: path,
        pageTitle: title,
        referrer:
          typeof document !== "undefined" ? document.referrer : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  trackInteraction(
    element: string,
    action: string,
    details: Record<string, unknown> = {},
  ): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      const context: InteractionContext = {
        element,
        action,
        details,
        pageUrl:
          typeof window !== "undefined" ? window.location.pathname : undefined,
        timestamp: new Date().toISOString(),
      };
      this.trackUserBehavior(
        userId,
        "interaction",
        context as unknown as Record<string, unknown>,
      );
    }
  }

  trackPerformanceTiming(): void {
    if (typeof window === "undefined" || !window.performance?.timing) return;
    const { timing } = window.performance;
    const navigationStart = timing.navigationStart;

    const metrics: Record<string, number> = {
      dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcp_connection: timing.connectEnd - timing.connectStart,
      server_response: timing.responseEnd - timing.requestStart,
      dom_processing: timing.domComplete - timing.domLoading,
      page_load: timing.loadEventEnd - navigationStart,
    };

    Object.entries(metrics).forEach(([metric, value]) => {
      if (
        typeof value === "number" &&
        !Number.isNaN(value) &&
        Number.isFinite(value) &&
        value > 0
      ) {
        this.trackPerformanceMetric(metric, value, {
          pageUrl:
            typeof window !== "undefined"
              ? window.location.pathname
              : undefined,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private getCurrentUserId(): string | null {
    const raw =
      typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
    const user = JSON.parse(raw ?? "{}") as { id?: string };
    return user.id ?? null;
  }

  private getSessionId(): string {
    let sessionId =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("analytics_session_id")
        : null;
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      if (typeof sessionStorage !== "undefined")
        sessionStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
  }

  private getApplicationId(): string {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    if (path.includes("/church")) return "church";
    if (path.includes("/admin")) return "admin";
    if (path.includes("/business")) return "business";
    if (path.includes("/personal")) return "personal";
    if (path.includes("/home")) return "home";
    if (path.includes("/playback")) return "playback";
    return "main-website";
  }

  private getAuthToken(): string {
    return (
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("auth_token")
        : null) ?? ""
    );
  }

  private handleError(error: unknown): Error {
    if (error instanceof ApiError && error.response) {
      const { status, data } = error.response;
      const message: string = data.message ?? error.message;
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
    } else if (error instanceof ApiError && error.request) {
      return new Error("Network Error: Please check your internet connection");
    }
    return new Error(
      error instanceof Error ? error.message : "An unexpected error occurred",
    );
  }

  // ---------------------------------------------------------------------------
  // Batch tracking
  // ---------------------------------------------------------------------------

  async batchTrackEvents(
    events: TrackBatchEvent[],
  ): Promise<PromiseSettledResult<unknown>[]> {
    try {
      const results = await Promise.allSettled(
        events.map((event) => {
          switch (event.type) {
            case "user_behavior":
              return this.trackUserBehavior(
                event.userId!,
                event.eventType!,
                event.eventData,
              );
            case "performance":
              return this.trackPerformanceMetric(
                event.metricType!,
                event.value!,
                event.context,
              );
            case "security":
              return this.trackSecurityEvent(
                event.eventType!,
                event.severity!,
                event.details,
              );
            default:
              throw new Error(`Unknown event type: ${String(event.type)}`);
          }
        }),
      );
      return results;
    } catch {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Auto-tracking initialiser
  // ---------------------------------------------------------------------------

  initializeAutoTracking(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("load", () => {
        setTimeout(() => this.trackPerformanceTiming(), 100);
      });
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        const userId = this.getCurrentUserId();
        if (userId) {
          this.trackUserBehavior(userId, "page_visibility_change", {
            hidden: document.hidden,
            timestamp: new Date().toISOString(),
          });
        }
      });

      document.addEventListener("click", (event: MouseEvent) => {
        const target = event.target as HTMLElement;
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
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const analyticsService = new AnalyticsService();

if (typeof window !== "undefined") {
  analyticsService.initializeAutoTracking();
}

export default analyticsService;
