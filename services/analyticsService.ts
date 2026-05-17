/**
 * Frontend Analytics Service — ECO-R-32
 *
 * Refactored to extend BaseService, using the canonical ApiClient (Axios)
 * pipeline for all HTTP calls. Auth token injection, retry logic, and
 * error telemetry are delegated to ApiClient / AuthInterceptor / BaseService.
 *
 * WebSocket management is kept inline (BaseService has no WS abstraction).
 */

import { BaseService } from "../api/services/BaseService";
import { ApiClient, getApiClient } from "../api/core/ApiClient";
import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from "web-vitals";
import { logger } from "@shared/utils/logger";

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
  pageUrl?: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Service Class
// ---------------------------------------------------------------------------

export class AnalyticsService extends BaseService {
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private retryCount = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1_000;

  constructor(client: ApiClient) {
    super(client, "/analytics", "AnalyticsService");
  }

  // ---------------------------------------------------------------------------
  // Data retrieval
  // ---------------------------------------------------------------------------

  async getDashboard(options: AnalyticsOptions = {}): Promise<unknown> {
    const { timeframe = "24h", userId, applicationId } = options;
    const params = new URLSearchParams({ timeframe });
    if (userId) params.append("userId", userId);
    if (applicationId) params.append("applicationId", applicationId);
    return this.get<unknown>(`/dashboard?${params}`, { cache: false });
  }

  async getUserBehaviorAnalytics(
    options: AnalyticsOptions = {},
  ): Promise<unknown> {
    const { timeframe = "24h", userId, applicationId } = options;
    const params = new URLSearchParams({ timeframe });
    if (userId) params.append("userId", userId);
    if (applicationId) params.append("applicationId", applicationId);
    return this.get<unknown>(`/user-behavior?${params}`, { cache: false });
  }

  async getPerformanceAnalytics(
    options: AnalyticsOptions = {},
  ): Promise<unknown> {
    const { timeframe = "24h", applicationId } = options;
    const params = new URLSearchParams({ timeframe });
    if (applicationId) params.append("applicationId", applicationId);
    return this.get<unknown>(`/performance/metrics?${params}`, {
      cache: false,
    });
  }

  async getMembershipGrowth(
    churchId: string,
    timeframe = "year",
  ): Promise<unknown> {
    // This route lives in the church domain, outside the /analytics base.
    // Call the ApiClient directly to avoid the /analytics prefix being prepended.
    const response = await this.client.get<unknown>(
      `/church/${churchId}/dashboard/membership-growth?period=${timeframe}`,
      { cache: false },
    );
    return this.transformResponse(response);
  }

  async getSecurityAnalytics(options: AnalyticsOptions = {}): Promise<unknown> {
    const { timeframe = "24h", applicationId } = options;
    const params = new URLSearchParams({ timeframe });
    if (applicationId) params.append("applicationId", applicationId);
    return this.get<unknown>(`/security?${params}`, { cache: false });
  }

  async getRealTimeMetrics(): Promise<unknown> {
    return this.get<unknown>("/real-time/metrics", { cache: false });
  }

  async getActiveAlerts(): Promise<unknown> {
    return this.get<unknown>("/real-time/alerts", { cache: false });
  }

  // ---------------------------------------------------------------------------
  // Tracking (fire-and-forget — must never throw to callers)
  // ---------------------------------------------------------------------------

  async trackUserBehavior(
    userId: string,
    eventType: string,
    eventData: Record<string, unknown> = {},
  ): Promise<unknown | null> {
    try {
      return await this.post<unknown>("/track/user-behavior", {
        userId,
        eventType,
        eventData: {
          ...eventData,
          timestamp: new Date().toISOString(),
          sessionId: this.getSessionId(),
          applicationId: this.getApplicationId(),
        },
      });
    } catch {
      // Tracking must never disrupt user experience
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
          logger.warn("[Analytics] Invalid metricType:", metricType);
        return null;
      }
      if (
        typeof value !== "number" ||
        Number.isNaN(value) ||
        !Number.isFinite(value)
      ) {
        if (import.meta.env.DEV)
          logger.warn("[Analytics] Invalid value:", { metricType, value });
        return null;
      }
      if (import.meta.env.DEV) {
        logger.debug("[Analytics] Skipped in dev:", {
          metricType,
          value,
          context: context["pageUrl"],
        });
        return null;
      }

      return await this.post<unknown>("/track/performance", {
        metricType,
        value,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          applicationId: this.getApplicationId(),
        },
      });
    } catch (error) {
      if (import.meta.env.DEV)
        logger.error("[Analytics] Failed to track performance metric:", error);
      return null;
    }
  }

  async trackSecurityEvent(
    eventType: string,
    severity: string,
    details: Record<string, unknown> = {},
  ): Promise<unknown | null> {
    try {
      return await this.post<unknown>("/track/security", {
        eventType,
        severity,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
          applicationId: this.getApplicationId(),
        },
      });
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // AI & Insights
  // ---------------------------------------------------------------------------

  async getPredictiveInsights(options: InsightOptions = {}): Promise<unknown> {
    const {
      type = "userEngagement",
      timeframe = "7d",
      parameters = {},
    } = options;
    return this.post<unknown>("/ai/insights", { type, timeframe, parameters });
  }

  async getAIRecommendations(options: AnalyticsOptions = {}): Promise<unknown> {
    const { userId, applicationId } = options;
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (applicationId) params.append("applicationId", applicationId);
    return this.get<unknown>(`/ai/recommendations?${params}`, { cache: false });
  }

  async executeCustomQuery(query: Record<string, unknown>): Promise<unknown> {
    return this.post<unknown>("/query/custom", query);
  }

  async exportData(options: ExportOptions = {}): Promise<unknown> {
    const {
      format = "json",
      timeframe = "24h",
      dataTypes = ["userBehavior", "performance", "security"],
    } = options;
    // Export uses the download utility because the response may be non-JSON.
    // BaseService.download() returns a Blob; for JSON format the caller may
    // parse it — this preserves the original fetch-based contract.
    const params = new URLSearchParams({
      format,
      timeframe,
      dataTypes: dataTypes.join(","),
    });
    if (format === "json") {
      return this.get<unknown>(`/export?${params}`, {
        cache: false,
        responseType: "json",
      });
    }
    return this.download(`/export?${params}`);
  }

  async getServiceHealth(): Promise<unknown> {
    return this.get<unknown>("/health", { cache: false });
  }

  // ---------------------------------------------------------------------------
  // WebSocket for real-time streaming (BaseService has no WS abstraction)
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
    if (typeof window === "undefined") return;

    const reportMetric = (metric: Metric) => {
      this.trackPerformanceMetric(metric.name, metric.value, {
        pageUrl: window.location.pathname,
        userAgent: navigator.userAgent,
        rating: metric.rating,
        id: metric.id,
      });
    };

    try {
      onCLS(reportMetric);
      onFCP(reportMetric);
      onINP(reportMetric);
      onLCP(reportMetric);
      onTTFB(reportMetric);
    } catch (e) {
      if (import.meta.env.DEV) {
        logger.warn("[Analytics] Failed to initialize web-vitals", e);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Batch tracking
  // ---------------------------------------------------------------------------

  async batchTrackEvents(
    events: TrackBatchEvent[],
  ): Promise<PromiseSettledResult<unknown>[]> {
    try {
      return await Promise.allSettled(
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
    } catch {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Auto-tracking initialiser
  // ---------------------------------------------------------------------------

  initializeAutoTracking(): void {
    if (typeof window !== "undefined") {
      this.trackPerformanceTiming();
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
    if (path.includes("/work")) return "work";
    if (path.includes("/personal")) return "personal";
    if (path.includes("/home")) return "home";
    if (path.includes("/playback")) return "playback";
    return "main-website";
  }
}

// ---------------------------------------------------------------------------
// Lazy singleton — initialized with the default ApiClient on first access.
// Pattern mirrors ArtNetBridgeService to avoid circular import issues.
// NOTE: We intentionally do NOT use a Proxy here — the TSC flow analysis
// hits a stack overflow on Proxy<AnalyticsService> due to recursive inference.
// ---------------------------------------------------------------------------

let _instance: AnalyticsService | null = null;

/**
 * Initialise the analytics singleton with a specific ApiClient.
 * Call this once from the service bootstrap (e.g. where ApiClient is created).
 */
export function initAnalyticsService(client: ApiClient): void {
  _instance = new AnalyticsService(client);
  if (typeof window !== "undefined") {
    _instance.initializeAutoTracking();
  }
}

function getInstance(): AnalyticsService {
  if (!_instance) {
    _instance = new AnalyticsService(getApiClient());
    if (typeof window !== "undefined") {
      _instance.initializeAutoTracking();
    }
  }
  return _instance;
}

/**
 * Singleton accessor — lazily initializes on first call.
 * Drop-in replacement for the previous export; all consumers are unaffected.
 */
export function getAnalyticsService(): AnalyticsService {
  return getInstance();
}

/**
 * Named singleton export preserved for backwards-compat with all existing
 * import sites: `import { analyticsService } from "@shared/services"`.
 *
 * This is initialized eagerly here (module-load time) so consumers that
 * destructure methods from the import can call them without a factory call.
 * The ApiClient must be initialized before this module is first imported.
 */
// eslint-disable-next-line prefer-const
export const analyticsService = new Proxy({} as AnalyticsService, {
  get(_target, prop, receiver) {
    const instance = getInstance();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as AnalyticsService;

export default analyticsService;
