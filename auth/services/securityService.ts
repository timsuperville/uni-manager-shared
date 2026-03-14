/* global setInterval */
/**
 * Advanced Security Service
 *
 * Provides comprehensive security features including:
 * - Rate limiting for authentication attempts
 * - Fraud detection and suspicious activity monitoring
 * - Security event logging and analytics
 * - IP-based and user-based restrictions
 * - Automatic lockout and recovery mechanisms
 */

// ── Types ─────────────────────────────────────────────────────────────────────

type RiskLevel = "low" | "medium" | "high";
type EventSeverity = "low" | "medium" | "high";
type RecommendedAction = "allow" | "challenge" | "require_mfa";

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
  lockedUntil: number | null;
}

interface RateLimitResult {
  allowed: boolean;
  attemptsRemaining?: number;
  windowEnd?: number;
  reason?: string;
  remainingTime?: number;
}

interface SecurityEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
  severity: EventSeverity;
}

interface FraudAttemptData {
  ipAddress?: string | null;
  userId?: string;
  timestamp?: number | string;
  geolocation?: { lat: number; lng: number };
  deviceFingerprint?: string;
}

interface FraudAnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  recommendedAction: RecommendedAction;
  timestamp: number;
  error?: string;
}

interface SecurityStats {
  timeframe: number;
  totalEvents: number;
  eventsByType: Record<string, number>;
  highRiskEvents: number;
  suspiciousIPs: number;
  activeRateLimits: number;
  securityScore: number;
  timestamp: number;
  error?: string;
}

interface SecurityConfig {
  maxLoginAttempts: number;
  maxMFAAttempts: number;
  maxAPICallsPerMinute: number;
  lockoutDuration: number;
  suspiciousActivityThreshold: number;
  maxEventsToStore: number;
  ipWhitelist: Set<string>;
}

// ── SecurityService ───────────────────────────────────────────────────────────

class SecurityService {
  // `protected` (not private) so test suites can access via type-cast
  protected rateLimits = new Map<string, RateLimitEntry>();
  protected readonly userAttempts = new Map<string, unknown>();
  protected readonly suspiciousIPs = new Set<string>();
  protected securityEvents: SecurityEvent[] = [];
  protected readonly config: SecurityConfig = {
    maxLoginAttempts: 5,
    maxMFAAttempts: 3,
    maxAPICallsPerMinute: 60,
    lockoutDuration: 15 * 60 * 1000,
    suspiciousActivityThreshold: 10,
    maxEventsToStore: 1000,
    ipWhitelist: new Set(["127.0.0.1", "::1"]),
  };

  // ── Rate Limiting ───────────────────────────────────────────────────────────

  checkRateLimit(
    identifier: string,
    action: string,
    maxAttempts = 5,
    windowMs = 60000,
  ): RateLimitResult {
    try {
      const key = `${identifier}:${action}`;
      const now = Date.now();

      if (!this.rateLimits.has(key)) {
        this.rateLimits.set(key, {
          attempts: 0,
          windowStart: now,
          lockedUntil: null,
        });
      }

      const limitData = this.rateLimits.get(key)!;

      if (limitData.lockedUntil !== null && now < limitData.lockedUntil) {
        const remainingTime = Math.ceil((limitData.lockedUntil - now) / 1000);
        return {
          allowed: false,
          reason: "rate_limited",
          remainingTime,
          attemptsRemaining: 0,
        };
      }

      if (now - limitData.windowStart > windowMs) {
        limitData.attempts = 0;
        limitData.windowStart = now;
        limitData.lockedUntil = null;
      }

      if (limitData.attempts >= maxAttempts) {
        limitData.lockedUntil = now + this.config.lockoutDuration;
        this.logSecurityEvent("rate_limit_exceeded", {
          identifier,
          action,
          attempts: limitData.attempts,
        });
        return {
          allowed: false,
          reason: "rate_limited",
          remainingTime: Math.ceil(this.config.lockoutDuration / 1000),
          attemptsRemaining: 0,
        };
      }

      return {
        allowed: true,
        attemptsRemaining: maxAttempts - limitData.attempts,
        windowEnd: limitData.windowStart + windowMs,
      };
    } catch (error) {
      if (import.meta.env?.DEV)
        console.warn(
          "[SecurityService] checkRateLimit failed — failing open:",
          (error as Error).message,
        );
      return { allowed: true, attemptsRemaining: 1 };
    }
  }

  recordAttempt(identifier: string, action: string, success = false): void {
    try {
      const key = `${identifier}:${action}`;

      if (!this.rateLimits.has(key)) {
        this.rateLimits.set(key, {
          attempts: 0,
          windowStart: Date.now(),
          lockedUntil: null,
        });
      }

      const limitData = this.rateLimits.get(key)!;
      limitData.attempts += 1;

      this.logSecurityEvent("attempt_recorded", {
        identifier,
        action,
        success,
        totalAttempts: limitData.attempts,
      });

      if (
        !success &&
        limitData.attempts > this.config.suspiciousActivityThreshold
      ) {
        this.flagSuspiciousActivity(identifier, action);
      }

      if (success && (action === "login" || action === "mfa")) {
        limitData.attempts = 0;
        limitData.lockedUntil = null;
      }
    } catch (error) {
      if (import.meta.env?.DEV)
        console.warn(
          "[SecurityService] recordAttempt failed:",
          (error as Error).message,
        );
    }
  }

  // ── Fraud Detection ─────────────────────────────────────────────────────────

  analyzeFraudRisk(attemptData: FraudAttemptData): FraudAnalysisResult {
    try {
      const {
        ipAddress,
        userId,
        timestamp = Date.now(),
        geolocation,
        deviceFingerprint,
      } = attemptData;

      let riskScore = 0;
      const riskFactors: string[] = [];

      if (ipAddress && this.suspiciousIPs.has(ipAddress)) {
        riskScore += 30;
        riskFactors.push("suspicious_ip");
      }

      if (ipAddress) {
        const recentAttempts = this.getRecentAttempts(ipAddress, 5 * 60 * 1000);
        if (recentAttempts.length > 10) {
          riskScore += 25;
          riskFactors.push("rapid_attempts");
        }
      }

      if (geolocation && userId) {
        const userHistory = this.getUserLocationHistory();
        if (
          userHistory.length > 0 &&
          this.isUnusualLocation(geolocation, userHistory)
        ) {
          riskScore += 20;
          riskFactors.push("unusual_location");
        }
      }

      if (
        this.isUnusualTime(
          typeof timestamp === "string"
            ? Number(timestamp)
            : (timestamp ?? Date.now()),
        )
      ) {
        riskScore += 15;
        riskFactors.push("unusual_time");
      }

      if (deviceFingerprint && userId) {
        const knownDevices = this.getUserDevices();
        if (
          knownDevices.length > 0 &&
          !knownDevices.includes(deviceFingerprint)
        ) {
          riskScore += 10;
          riskFactors.push("new_device");
        }
      }

      const riskLevel: RiskLevel =
        riskScore >= 50 ? "high" : riskScore >= 25 ? "medium" : "low";

      const resolvedTs =
        typeof timestamp === "string"
          ? Number(timestamp)
          : (timestamp ?? Date.now());
      const result: FraudAnalysisResult = {
        riskScore,
        riskLevel,
        riskFactors,
        recommendedAction: this.getRecommendedAction(riskLevel),
        timestamp: resolvedTs,
      };

      if (riskLevel === "high") {
        this.logSecurityEvent("high_risk_attempt", {
          ...attemptData,
          fraudAnalysis: result,
        });
      }

      return result;
    } catch (error) {
      return {
        riskScore: 0,
        riskLevel: "low",
        riskFactors: [],
        recommendedAction: "allow",
        timestamp: Date.now(),
        error: (error as Error).message,
      };
    }
  }

  flagSuspiciousActivity(identifier: string, reason: string): void {
    try {
      this.suspiciousIPs.add(identifier);
      this.logSecurityEvent("suspicious_activity_flagged", {
        identifier,
        reason,
        timestamp: Date.now(),
      });
    } catch (error) {
      if (import.meta.env?.DEV)
        console.warn(
          "[SecurityService] flagSuspiciousActivity failed:",
          (error as Error).message,
        );
    }
  }

  // ── Event Logging ───────────────────────────────────────────────────────────

  logSecurityEvent(
    eventType: string,
    eventData: Record<string, unknown>,
  ): void {
    try {
      const event: SecurityEvent = {
        id: this.generateEventId(),
        type: eventType,
        timestamp: Date.now(),
        data: eventData,
        severity: this.getEventSeverity(eventType),
      };

      this.securityEvents.push(event);

      if (this.securityEvents.length > this.config.maxEventsToStore) {
        this.securityEvents.shift();
      }
    } catch (error) {
      if (import.meta.env?.DEV)
        console.warn(
          "[SecurityService] logSecurityEvent failed:",
          (error as Error).message,
        );
    }
  }

  getSecurityEvents(
    limit = 100,
    eventType: string | null = null,
  ): SecurityEvent[] {
    try {
      let events = [...this.securityEvents];
      if (eventType) events = events.filter((e) => e.type === eventType);
      return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    } catch (error) {
      if (import.meta.env?.DEV)
        console.warn(
          "[SecurityService] getSecurityEvents failed:",
          (error as Error).message,
        );
      return [];
    }
  }

  // ── Analytics ───────────────────────────────────────────────────────────────

  getSecurityStats(timeframe = 24 * 60 * 60 * 1000): SecurityStats {
    try {
      const now = Date.now();
      const startTime = now - timeframe;

      const recentEvents = this.securityEvents.filter(
        (e) => e.timestamp >= startTime,
      );
      const totalEvents = recentEvents.length;
      const eventsByType = this.groupEventsByType(recentEvents);
      const highRiskEvents = recentEvents.filter(
        (e) => e.severity === "high",
      ).length;
      const suspiciousIPs = this.suspiciousIPs.size;
      const activeRateLimits = Array.from(this.rateLimits.values()).filter(
        (limit) => limit.lockedUntil !== null && limit.lockedUntil > now,
      ).length;

      return {
        timeframe,
        totalEvents,
        eventsByType,
        highRiskEvents,
        suspiciousIPs,
        activeRateLimits,
        securityScore: this.calculateSecurityScore(recentEvents),
        timestamp: now,
      };
    } catch (error) {
      return {
        timeframe,
        totalEvents: 0,
        eventsByType: {},
        highRiskEvents: 0,
        suspiciousIPs: 0,
        activeRateLimits: 0,
        securityScore: 0,
        timestamp: Date.now(),
        error: (error as Error).message,
      };
    }
  }

  // ── Utility Methods ─────────────────────────────────────────────────────────

  getRecentAttempts(identifier: string, timeWindow: number): SecurityEvent[] {
    const now = Date.now();
    return this.securityEvents.filter(
      (event) =>
        event.data["identifier"] === identifier &&
        event.timestamp >= now - timeWindow,
    );
  }

  isUnusualLocation(
    currentLocation: { lat: number; lng: number },
    locationHistory: Array<{ lat: number; lng: number }>,
  ): boolean {
    return (
      locationHistory.length > 0 &&
      !locationHistory.some(
        (loc) =>
          Math.abs(loc.lat - currentLocation.lat) < 0.1 &&
          Math.abs(loc.lng - currentLocation.lng) < 0.1,
      )
    );
  }

  isUnusualTime(timestamp: number): boolean {
    const hour = new Date(timestamp).getHours();
    return hour >= 2 && hour <= 6;
  }

  getUserLocationHistory(): Array<{ lat: number; lng: number }> {
    return [];
  }

  getUserDevices(): string[] {
    return [];
  }

  getRecommendedAction(riskLevel: RiskLevel): RecommendedAction {
    switch (riskLevel) {
      case "high":
        return "require_mfa";
      case "medium":
        return "challenge";
      default:
        return "allow";
    }
  }

  generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  getEventSeverity(eventType: string): EventSeverity {
    const highSeverityEvents = [
      "suspicious_activity_flagged",
      "high_risk_attempt",
      "multiple_failed_logins",
      "rate_limit_exceeded",
    ];
    const mediumSeverityEvents = [
      "unusual_location",
      "new_device",
      "mfa_bypass_attempt",
    ];

    if (highSeverityEvents.includes(eventType)) return "high";
    if (mediumSeverityEvents.includes(eventType)) return "medium";
    return "low";
  }

  groupEventsByType(events: SecurityEvent[]): Record<string, number> {
    return events.reduce<Record<string, number>>((acc, event) => {
      acc[event.type] = (acc[event.type] ?? 0) + 1;
      return acc;
    }, {});
  }

  calculateSecurityScore(recentEvents: SecurityEvent[]): number {
    const baseScore = 100;
    const highRiskEvents = recentEvents.filter(
      (e) => e.severity === "high",
    ).length;
    const mediumRiskEvents = recentEvents.filter(
      (e) => e.severity === "medium",
    ).length;
    const penalty = highRiskEvents * 10 + mediumRiskEvents * 5;
    return Math.max(0, baseScore - penalty);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendToSecurityMonitoring(_event: SecurityEvent): void {
    // Production: integrate with Splunk, ELK Stack, or custom security dashboard
  }

  cleanup(): void {
    try {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, data] of this.rateLimits.entries()) {
        if (data.lockedUntil !== null && data.lockedUntil < now) {
          data.lockedUntil = null;
        }
        if (now - data.windowStart > 24 * 60 * 60 * 1000) {
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach((key) => this.rateLimits.delete(key));
    } catch (error) {
      if (import.meta.env?.DEV)
        console.warn(
          "[SecurityService] cleanup failed:",
          (error as Error).message,
        );
    }
  }

  reset(): void {
    this.rateLimits.clear();
    this.userAttempts.clear();
    this.suspiciousIPs.clear();
    this.securityEvents.length = 0;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

const securityService = new SecurityService();

if (typeof window !== "undefined") {
  setInterval(() => securityService.cleanup(), 60 * 60 * 1000);
}

export default securityService;
export { SecurityService };
