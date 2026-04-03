import { BaseService } from "../../../api/services/BaseService";
import type { ApiClient } from "../../../api/core/ApiClient";
import type {
  SecurityProfile,
  SecurityJourney,
  SecurityAnalyticsData,
  AccessControlResult,
  SecurityEventData,
  BatchOperation,
} from "../../../api/types";

type EventCallback = (data: unknown) => void;

/**
 * 🎮🔐 SECURITY SERVICE
 *
 * Replaces the legacy `securityAPI.ts`. Integrates into the unified
 * `@shared/api` architecture, leveraging BaseService routing and caching.
 */
export class SecurityService extends BaseService {
  private readonly eventListeners: Map<string, Set<EventCallback>> = new Map();

  constructor(client: ApiClient) {
    // We map to the /security base path. BaseService handles prefixing.
    super(client, "/security", "SecurityService");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Security profile management
  // ──────────────────────────────────────────────────────────────────────────

  async getSecurityProfile(
    userId: string,
    useCache = true,
  ): Promise<SecurityProfile> {
    try {
      const profile = await this.get<SecurityProfile>(`/profile/${userId}`, {
        cache: useCache,
      });
      if (profile) {
        this.emit("profileUpdated", profile);
      }
      return profile || this.getProfileFallback();
    } catch {
      return this.handleErrorWithFallback(
        "getSecurityProfile",
        this.getProfileFallback(),
      );
    }
  }

  async updateSecurityProfile(
    userId: string,
    updateData: Partial<SecurityProfile>,
  ): Promise<SecurityProfile> {
    const updatedProfile = await this.patch<SecurityProfile>(
      `/profile/${userId}`,
      updateData,
    );

    // BaseService and ApiClient automatically handle general cache invalidation on mutations (like patch, post),
    // but if we needed granular cache busting, we would use this.client.clearCache().

    if (updatedProfile.celebration) {
      this.emit("celebration", updatedProfile.celebration);
    }
    this.emit("profileUpdated", updatedProfile);

    return updatedProfile;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Security journey management
  // ──────────────────────────────────────────────────────────────────────────

  async getSecurityJourney(userId: string): Promise<SecurityJourney> {
    try {
      return (
        (await this.get<SecurityJourney>(`/journey/${userId}`, {
          cache: true,
        })) || {
          currentStage: "newcomer",
          progress: 0,
          stages: [],
          nextSteps: [],
        }
      );
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
  ): Promise<Record<string, unknown>> {
    const result = await this.post<Record<string, unknown>>(
      `/journey/${userId}/milestone`,
      {
        milestoneId,
        ...progressData,
      },
    );

    if (result.celebration) {
      this.emit("milestoneCompleted", result);
    }
    return result;
  }

  async getSecurityRecommendations(
    userId: string,
    limit = 5,
  ): Promise<unknown[]> {
    try {
      // Pass cache: true implicitly or let user handle via react-query
      return (
        (await this.get<unknown[]>(
          `/recommendations/${userId}?limit=${limit}`,
          { cache: true },
        )) || []
      );
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
    try {
      const qs = Object.keys(filters).length
        ? "?" +
          new URLSearchParams(
            Object.entries(filters).map(([k, v]) => [k, String(v)]),
          ).toString()
        : "";

      return (
        (await this.get<unknown>(`/badges/${userId}${qs}`, { cache: true })) ||
        this.getBadgesFallback()
      );
    } catch {
      return this.handleErrorWithFallback(
        "getBadgesAndAchievements",
        this.getBadgesFallback(),
      );
    }
  }

  async awardBadge(
    userId: string,
    badgeId: string,
    context: Record<string, unknown> = {},
  ): Promise<unknown> {
    const result = await this.post<Record<string, unknown>>(
      `/badges/${userId}/award`,
      {
        badgeId,
        context,
        timestamp: new Date().toISOString(),
      },
    );

    if (result.celebration) {
      this.emit("badgeEarned", result);
    }
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
      return await this.post<AccessControlResult>(
        `/access-control/${userId}`,
        context,
      );
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
    const result = await this.patch<unknown>(
      `/context/${userId}`,
      contextUpdate,
    );
    this.emit("contextUpdated", result);
    return result;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Real-time security monitoring
  // ──────────────────────────────────────────────────────────────────────────

  async getSecurityAnalytics(
    userId: string,
    timeRange = "month",
  ): Promise<SecurityAnalyticsData> {
    try {
      return (
        (await this.get<SecurityAnalyticsData>(
          `/analytics/${userId}?timeRange=${timeRange}`,
          { cache: true },
        )) || {
          trends: [],
          insights: [],
          improvements: [],
        }
      );
    } catch {
      return this.handleErrorWithFallback<SecurityAnalyticsData>(
        "getSecurityAnalytics",
        {
          trends: [],
          insights: [],
          improvements: [],
        },
      );
    }
  }

  async reportSecurityEvent(
    userId: string,
    eventData: SecurityEventData,
  ): Promise<boolean> {
    try {
      await this.post(`/events/${userId}`, {
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
      return await this.post("/batch", { operations });
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
    try {
      const [profile, journey, badges, recommendations] = await Promise.all([
        this.getSecurityProfile(userId, false),
        this.getSecurityJourney(userId),
        this.getBadgesAndAchievements(userId),
        this.getSecurityRecommendations(userId, 3),
      ]);
      return { profile, journey, badges, recommendations };
    } catch (error) {
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Event management
  // ──────────────────────────────────────────────────────────────────────────

  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
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
  // Utility
  // ──────────────────────────────────────────────────────────────────────────

  async getHealthStatus(): Promise<unknown> {
    try {
      return await this.get("/health");
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
    await this.post(`/reset/${userId}`, resetOptions);
    return true;
  }

  getSessionId(): string {
    if (typeof sessionStorage === "undefined") return `sec_${Date.now()}`;
    let sessionId = sessionStorage.getItem("securitySessionId");
    if (!sessionId) {
      sessionId = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem("securitySessionId", sessionId);
    }
    return sessionId;
  }

  private handleErrorWithFallback<T>(operation: string, fallbackData: T): T {
    // Fallback warnings are silent in production — callers receive safe stub data
    return fallbackData;
  }

  private getProfileFallback(): SecurityProfile {
    return {
      currentLevel: "newcomer",
      tier: "bronze",
      totalPoints: 0,
      securityScore: 50,
      badges: [],
      achievements: [],
    };
  }

  private getBadgesFallback(): unknown {
    return {
      badges: [],
      achievements: [],
      categories: [],
      progress: {},
    };
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
}
