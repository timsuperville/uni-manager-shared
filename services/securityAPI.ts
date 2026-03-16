/**
 * 🎮🔐 SECURITY API INTEGRATION SERVICE
 *
 * Comprehensive frontend service for integrating with the enhanced security gamification system.
 *
 * Bug fixes applied during TS migration:
 * - Response interceptor: catch was `(_error)` but called `handleAPIError(error)` → fixed to `_error`
 * - preloadSecurityData: catch `_error` → `throw error` → fixed to `throw _error`
 * - getSessionId: .substr() → .slice() (deprecated)
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { getApiBaseUrl } from "../api/config/apiConfig.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SecurityProfile {
  currentLevel?: string;
  tier?: string;
  totalPoints?: number;
  securityScore?: number;
  badges?: unknown[];
  achievements?: unknown[];
  celebration?: unknown;
  [key: string]: unknown;
}

export interface SecurityJourney {
  currentStage?: string;
  progress?: number;
  stages?: unknown[];
  nextSteps?: unknown[];
  [key: string]: unknown;
}

export interface SecurityAnalyticsData {
  trends?: unknown[];
  insights?: unknown[];
  improvements?: unknown[];
  [key: string]: unknown;
}

export interface AccessControlResult {
  granted: boolean;
  level: string;
  reason?: string;
  recommendations?: unknown[];
}

export interface SecurityEventData {
  [key: string]: unknown;
}

export interface BatchOperation {
  type: "getProfile" | "awardBadge" | "progressMilestone";
  userId: string;
  badgeId?: string;
  context?: Record<string, unknown>;
  milestoneId?: string;
  data?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  message: string;
  code: number | string;
  details: unknown;
  timestamp: string;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
  timeout: number;
}

type EventCallback = (data: unknown) => void;

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

class SecurityAPIService {
  private readonly baseURL: string;
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1_000; // 5 minutes
  private readonly eventListeners: Map<string, Set<EventCallback>> = new Map();
  private readonly api: AxiosInstance;

  constructor() {
    this.baseURL = `${String(getApiBaseUrl())}/api`;

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10_000,
      headers: { "Content-Type": "application/json" },
    });

    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token =
          typeof localStorage !== "undefined"
            ? localStorage.getItem("authToken")
            : null;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response) => response,
      // Bug fix: original catch var was `_error` but passed `error` to handleAPIError (undefined)
      (_error) => Promise.reject(this.handleAPIError(_error)),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Security profile management
  // ──────────────────────────────────────────────────────────────────────────

  async getSecurityProfile(
    userId: string,
    useCache = true,
  ): Promise<SecurityProfile> {
    const cacheKey = `security_profile_${userId}`;

    if (useCache && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data as SecurityProfile;
    }

    try {
      const response = await this.api.get(`/security/profile/${userId}`);
      const securityProfile = response.data as SecurityProfile;
      this.setCacheData(cacheKey, securityProfile);
      this.emit("profileUpdated", securityProfile);
      return securityProfile;
    } catch {
      return this.handleErrorWithFallback("getSecurityProfile", {
        currentLevel: "newcomer",
        tier: "bronze",
        totalPoints: 0,
        securityScore: 50,
        badges: [],
        achievements: [],
      });
    }
  }

  async updateSecurityProfile(
    userId: string,
    updateData: Partial<SecurityProfile>,
  ): Promise<SecurityProfile> {
    const response = await this.api.patch(
      `/security/profile/${userId}`,
      updateData,
    );
    const updatedProfile = response.data as SecurityProfile;

    this.invalidateCache(`security_profile_${userId}`);

    if (updatedProfile.celebration)
      this.emit("celebration", updatedProfile.celebration);
    this.emit("profileUpdated", updatedProfile);

    return updatedProfile;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Security journey management
  // ──────────────────────────────────────────────────────────────────────────

  async getSecurityJourney(userId: string): Promise<SecurityJourney> {
    const cacheKey = `security_journey_${userId}`;
    if (this.isCacheValid(cacheKey))
      return this.cache.get(cacheKey)!.data as SecurityJourney;

    try {
      const response = await this.api.get(`/security/journey/${userId}`);
      const journeyData = response.data as SecurityJourney;
      this.setCacheData(cacheKey, journeyData);
      return journeyData;
    } catch {
      return this.handleErrorWithFallback("getSecurityJourney", {
        currentStage: "newcomer",
        progress: 0,
        stages: [],
        nextSteps: [],
      });
    }
  }

  async progressMilestone(
    userId: string,
    milestoneId: string,
    progressData: Record<string, unknown> = {},
  ): Promise<unknown> {
    const response = await this.api.post(
      `/security/journey/${userId}/milestone`,
      {
        milestoneId,
        ...progressData,
      },
    );
    const result = response.data as Record<string, unknown>;

    this.invalidateCache(`security_journey_${userId}`);
    this.invalidateCache(`security_profile_${userId}`);

    if (result.celebration) this.emit("milestoneCompleted", result);
    return result;
  }

  async getSecurityRecommendations(
    userId: string,
    limit = 5,
  ): Promise<unknown[]> {
    const cacheKey = `security_recommendations_${userId}`;
    if (this.isCacheValid(cacheKey))
      return this.cache.get(cacheKey)!.data as unknown[];

    try {
      const response = await this.api.get(
        `/security/recommendations/${userId}`,
        { params: { limit } },
      );
      const recommendations = response.data as unknown[];
      this.setCacheData(cacheKey, recommendations, 2 * 60 * 1_000);
      return recommendations;
    } catch {
      return this.handleErrorWithFallback("getSecurityRecommendations", []);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Badge & achievement system
  // ──────────────────────────────────────────────────────────────────────────

  async getBadgesAndAchievements(
    userId: string,
    filters: Record<string, unknown> = {},
  ): Promise<unknown> {
    const cacheKey = `badges_achievements_${userId}_${JSON.stringify(filters)}`;
    if (this.isCacheValid(cacheKey)) return this.cache.get(cacheKey)!.data;

    try {
      const response = await this.api.get(`/security/badges/${userId}`, {
        params: filters,
      });
      const badgeData = response.data;
      this.setCacheData(cacheKey, badgeData);
      return badgeData;
    } catch {
      return this.handleErrorWithFallback("getBadgesAndAchievements", {
        badges: [],
        achievements: [],
        categories: [],
        progress: {},
      });
    }
  }

  async awardBadge(
    userId: string,
    badgeId: string,
    context: Record<string, unknown> = {},
  ): Promise<unknown> {
    const response = await this.api.post(`/security/badges/${userId}/award`, {
      badgeId,
      context,
      timestamp: new Date().toISOString(),
    });
    const result = response.data as Record<string, unknown>;

    this.invalidateCachePattern(`badges_achievements_${userId}`);
    this.invalidateCache(`security_profile_${userId}`);

    if (result.celebration) this.emit("badgeEarned", result);
    return result;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Contextual access control
  // ──────────────────────────────────────────────────────────────────────────

  async checkAccessControl(
    userId: string,
    context: Record<string, unknown>,
  ): Promise<AccessControlResult> {
    try {
      const response = await this.api.post(
        `/security/access-control/${userId}`,
        context,
      );
      return response.data as AccessControlResult;
    } catch {
      return {
        granted: false,
        level: "restricted",
        reason: "Security check failed",
        recommendations: [],
      };
    }
  }

  async updateSecurityContext(
    userId: string,
    contextUpdate: Record<string, unknown>,
  ): Promise<unknown> {
    const response = await this.api.patch(
      `/security/context/${userId}`,
      contextUpdate,
    );
    this.emit("contextUpdated", response.data);
    return response.data;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Real-time security monitoring
  // ──────────────────────────────────────────────────────────────────────────

  async getSecurityAnalytics(
    userId: string,
    timeRange = "month",
  ): Promise<SecurityAnalyticsData> {
    const cacheKey = `security_analytics_${userId}_${timeRange}`;
    if (this.isCacheValid(cacheKey))
      return this.cache.get(cacheKey)!.data as SecurityAnalyticsData;

    try {
      const response = await this.api.get(`/security/analytics/${userId}`, {
        params: { timeRange },
      });
      const analytics = response.data as SecurityAnalyticsData;
      this.setCacheData(cacheKey, analytics, 10 * 60 * 1_000);
      return analytics;
    } catch {
      return this.handleErrorWithFallback("getSecurityAnalytics", {
        trends: [],
        insights: [],
        improvements: [],
      });
    }
  }

  async reportSecurityEvent(
    userId: string,
    eventData: SecurityEventData,
  ): Promise<boolean> {
    try {
      await this.api.post(`/security/events/${userId}`, {
        ...eventData,
        timestamp: new Date().toISOString(),
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
        sessionId: this.getSessionId(),
      });
      return true;
    } catch {
      return false;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Batch operations
  // ──────────────────────────────────────────────────────────────────────────

  async batchOperations(operations: BatchOperation[]): Promise<unknown> {
    try {
      const response = await this.api.post("/security/batch", { operations });
      return response.data;
    } catch {
      return Promise.allSettled(
        operations.map((op) => this.processSingleOperation(op)),
      );
    }
  }

  async preloadSecurityData(userId: string): Promise<{
    profile: SecurityProfile;
    journey: SecurityJourney;
    badges: unknown;
    recommendations: unknown[];
  }> {
    // Bug fix: original catch used `_error` variable but `throw error` → fixed to `throw _error`
    try {
      const [profile, journey, badges, recommendations] = await Promise.all([
        this.getSecurityProfile(userId, false),
        this.getSecurityJourney(userId),
        this.getBadgesAndAchievements(userId),
        this.getSecurityRecommendations(userId, 3),
      ]);
      return { profile, journey, badges, recommendations };
    } catch (_error) {
      throw _error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Event management
  // ──────────────────────────────────────────────────────────────────────────

  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event))
      this.eventListeners.set(event, new Set());
    this.eventListeners.get(event)!.add(callback);
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch {
        // Handler errors must not crash the event bus
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Cache management
  // ──────────────────────────────────────────────────────────────────────────

  isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < cached.timeout;
  }

  setCacheData(key: string, data: unknown, timeout = this.cacheTimeout): void {
    this.cache.set(key, { data, timestamp: Date.now(), timeout });
  }

  invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  invalidateCachePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Error handling
  // ──────────────────────────────────────────────────────────────────────────

  handleAPIError(error: unknown): ApiErrorDetail {
    const err = error as {
      message?: string;
      response?: { status?: number; data?: unknown };
    };
    return {
      message: err.message ?? "Security service error",
      code: err.response?.status ?? "UNKNOWN",
      details: err.response?.data ?? {},
      timestamp: new Date().toISOString(),
    };
  }

  private handleErrorWithFallback<T>(operation: string, fallbackData: T): T {
    // Fallback warnings are silent in production — callers receive safe stub data
    void operation;
    return fallbackData;
  }

  private async processSingleOperation(
    operation: BatchOperation,
  ): Promise<unknown> {
    switch (operation.type) {
      case "getProfile":
        return this.getSecurityProfile(operation.userId);
      case "awardBadge":
        return this.awardBadge(
          operation.userId,
          operation.badgeId!,
          operation.context,
        );
      case "progressMilestone":
        return this.progressMilestone(
          operation.userId,
          operation.milestoneId!,
          operation.data,
        );
      default:
        throw new Error(
          `Unknown operation type: ${String((operation as BatchOperation).type)}`,
        );
    }
  }

  getSessionId(): string {
    if (typeof sessionStorage === "undefined") return `sec_${Date.now()}`;
    let sessionId = sessionStorage.getItem("securitySessionId");
    if (!sessionId) {
      // Bug fix: .substr() is deprecated → .slice()
      sessionId = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem("securitySessionId", sessionId);
    }
    return sessionId;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Utility
  // ──────────────────────────────────────────────────────────────────────────

  async getHealthStatus(): Promise<unknown> {
    try {
      const response = await this.api.get("/security/health");
      return response.data;
    } catch {
      return {
        status: "error",
        message: "Security service unavailable",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async resetSecurityData(
    userId: string,
    resetOptions: Record<string, unknown> = {},
  ): Promise<boolean> {
    await this.api.post(`/security/reset/${userId}`, resetOptions);
    this.invalidateCachePattern(userId);
    return true;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const securityAPI = new SecurityAPIService();

export { SecurityAPIService };
export default securityAPI;
