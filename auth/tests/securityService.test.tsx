/**
 * Security Service Tests
 *
 * Comprehensive test suite for security service functionality including:
 * - Rate limiting tests
 * - Fraud detection tests
 * - Security event logging tests
 * - Security analytics tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import securityService from "../services/securityService";

describe("SecurityService", () => {
  beforeEach(() => {
    // Reset security service state before each test
    securityService.reset();
  });

  describe("Rate Limiting", () => {
    it("should allow initial attempts within limits", () => {
      const result = securityService.checkRateLimit(
        "192.168.1.1",
        "login",
        5,
        60000,
      );

      expect(result.allowed).toBe(true);
      expect(result.attemptsRemaining).toBe(5);
      expect(result.reason).toBeUndefined();
    });

    it("should track attempts correctly", () => {
      const identifier = "192.168.1.1";
      const action = "login";

      // Record several attempts
      securityService.recordAttempt(identifier, action, false);
      securityService.recordAttempt(identifier, action, false);
      securityService.recordAttempt(identifier, action, false);

      const result = securityService.checkRateLimit(
        identifier,
        action,
        5,
        60000,
      );
      expect(result.attemptsRemaining).toBe(2);
    });

    it("should block when max attempts exceeded", () => {
      const identifier = "192.168.1.1";
      const action = "login";
      const maxAttempts = 3;

      // Exceed max attempts
      for (let i = 0; i < maxAttempts + 1; i++) {
        securityService.recordAttempt(identifier, action, false);
      }

      const result = securityService.checkRateLimit(
        identifier,
        action,
        maxAttempts,
        60000,
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("rate_limited");
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it("should reset attempts after successful authentication", () => {
      const identifier = "192.168.1.1";
      const action = "login";

      // Record failed attempts
      securityService.recordAttempt(identifier, action, false);
      securityService.recordAttempt(identifier, action, false);

      // Record successful attempt
      securityService.recordAttempt(identifier, action, true);

      const result = securityService.checkRateLimit(
        identifier,
        action,
        5,
        60000,
      );
      expect(result.attemptsRemaining).toBe(5);
    });

    it("should handle different actions independently", () => {
      const identifier = "192.168.1.1";

      // Max out login attempts
      for (let i = 0; i < 6; i++) {
        securityService.recordAttempt(identifier, "login", false);
      }

      // MFA should still be available
      const mfaResult = securityService.checkRateLimit(
        identifier,
        "mfa",
        3,
        60000,
      );
      expect(mfaResult.allowed).toBe(true);

      // Login should be blocked
      const loginResult = securityService.checkRateLimit(
        identifier,
        "login",
        5,
        60000,
      );
      expect(loginResult.allowed).toBe(false);
    });

    it("should handle different identifiers independently", () => {
      const action = "login";

      // Max out attempts for first IP
      for (let i = 0; i < 6; i++) {
        securityService.recordAttempt("192.168.1.1", action, false);
      }

      // Second IP should still be available
      const result = securityService.checkRateLimit(
        "192.168.1.2",
        action,
        5,
        60000,
      );
      expect(result.allowed).toBe(true);
    });
  });

  describe("Fraud Detection", () => {
    it("should analyze fraud risk for normal activity", () => {
      const attemptData = {
        ipAddress: "192.168.1.1",
        userId: "user123",
        timestamp: Date.now(),
        geolocation: { lat: 40.7128, lng: -74.006 }, // NYC
        deviceFingerprint: "device123",
      };

      const result = securityService.analyzeFraudRisk(attemptData);

      expect(result.riskLevel).toBe("low");
      expect(result.riskScore).toBeLessThan(25);
      expect(result.recommendedAction).toBe("allow");
    });

    it("should detect suspicious IP addresses", () => {
      const suspiciousIP = "10.0.0.1";

      // Flag IP as suspicious
      securityService.flagSuspiciousActivity(
        suspiciousIP,
        "multiple_failed_logins",
      );

      const attemptData = {
        ipAddress: suspiciousIP,
        userId: "user123",
        timestamp: Date.now(),
      };

      const result = securityService.analyzeFraudRisk(attemptData);

      expect(result.riskScore).toBeGreaterThanOrEqual(30);
      expect(result.riskFactors).toContain("suspicious_ip");
    });

    it("should detect rapid attempts from same IP", () => {
      const ipAddress = "192.168.1.1";

      // Create many recent attempts
      for (let i = 0; i < 15; i++) {
        securityService.logSecurityEvent("attempt_recorded", {
          identifier: ipAddress,
          action: "login",
          success: false,
        });
      }

      const attemptData = {
        ipAddress,
        userId: "user123",
        timestamp: Date.now(),
      };

      const result = securityService.analyzeFraudRisk(attemptData);

      expect(result.riskFactors).toContain("rapid_attempts");
      expect(result.riskScore).toBeGreaterThanOrEqual(25);
    });

    it("should detect unusual time patterns", () => {
      // Create timestamp for 3 AM (unusual hour)
      const unusualTime = new Date();
      unusualTime.setHours(3, 0, 0, 0);

      const attemptData = {
        ipAddress: "192.168.1.1",
        userId: "user123",
        timestamp: unusualTime.getTime(),
      };

      const result = securityService.analyzeFraudRisk(attemptData);

      expect(result.riskFactors).toContain("unusual_time");
      expect(result.riskScore).toBeGreaterThanOrEqual(15);
    });

    it("should handle fraud analysis errors gracefully", () => {
      // Test with invalid data that might cause errors
      const invalidData = {
        ipAddress: null,
        userId: undefined,
        timestamp: "invalid",
      };

      const result = securityService.analyzeFraudRisk(invalidData);

      // Should not throw error and return safe defaults
      expect(result.riskLevel).toBe("low");
      expect(result.recommendedAction).toBe("allow");
      // Since invalid data doesn't necessarily throw, just verify structure
      expect(result.riskScore).toBeDefined();
    });

    it("should recommend appropriate actions based on risk level", () => {
      // Test high risk scenario
      const highRiskData = {
        ipAddress: "10.0.0.1",
        userId: "user123",
        timestamp: new Date().setHours(3, 0, 0, 0), // 3 AM
      };

      // Flag IP as suspicious first
      securityService.flagSuspiciousActivity("10.0.0.1", "suspicious_activity");

      const result = securityService.analyzeFraudRisk(highRiskData);

      if (result.riskLevel === "high") {
        expect(result.recommendedAction).toBe("require_mfa");
      } else if (result.riskLevel === "medium") {
        expect(result.recommendedAction).toBe("challenge");
      } else {
        expect(result.recommendedAction).toBe("allow");
      }
    });
  });

  describe("Security Event Logging", () => {
    it("should log security events correctly", () => {
      const eventType = "test_event";
      const eventData = { test: "data" };

      securityService.logSecurityEvent(eventType, eventData);

      const events = securityService.getSecurityEvents(10);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(eventType);
      expect(events[0].data).toEqual(eventData);
      expect(events[0].timestamp).toBeDefined();
      expect(events[0].id).toBeDefined();
    });

    it("should maintain event log size limit", () => {
      const maxEvents = (securityService as any).config.maxEventsToStore;

      // Log more events than the limit
      for (let i = 0; i < maxEvents + 10; i++) {
        securityService.logSecurityEvent("test_event", { index: i });
      }

      const events = securityService.getSecurityEvents(maxEvents + 20);
      expect(events.length).toBeLessThanOrEqual(maxEvents);
    });

    it("should filter events by type", () => {
      securityService.logSecurityEvent("login_attempt", { user: "user1" });
      securityService.logSecurityEvent("mfa_attempt", { user: "user1" });
      securityService.logSecurityEvent("login_attempt", { user: "user2" });

      const loginEvents = securityService.getSecurityEvents(
        10,
        "login_attempt",
      );
      expect(loginEvents).toHaveLength(2);
      expect(loginEvents.every((event) => event.type === "login_attempt")).toBe(
        true,
      );
    });

    it("should assign appropriate severity levels", () => {
      securityService.logSecurityEvent("rate_limit_exceeded", {
        ip: "192.168.1.1",
      });
      securityService.logSecurityEvent("unusual_location", { user: "user1" });
      securityService.logSecurityEvent("attempt_recorded", { user: "user1" });

      const events = securityService.getSecurityEvents(10);

      const highSeverityEvent = events.find(
        (e) => e.type === "rate_limit_exceeded",
      );
      const mediumSeverityEvent = events.find(
        (e) => e.type === "unusual_location",
      );
      const lowSeverityEvent = events.find(
        (e) => e.type === "attempt_recorded",
      );

      expect(highSeverityEvent?.severity).toBe("high");
      expect(mediumSeverityEvent?.severity).toBe("medium");
      expect(lowSeverityEvent?.severity).toBe("low");
    });
  });

  describe("Security Analytics", () => {
    it("should generate accurate security statistics", () => {
      // Log various events
      securityService.logSecurityEvent("login_attempt", { success: true });
      securityService.logSecurityEvent("login_attempt", { success: false });
      securityService.logSecurityEvent("rate_limit_exceeded", {
        ip: "192.168.1.1",
      });
      securityService.logSecurityEvent("suspicious_activity_flagged", {
        ip: "10.0.0.1",
      });

      const stats = securityService.getSecurityStats(24 * 60 * 60 * 1000);

      expect(stats.totalEvents).toBe(4);
      expect(stats.eventsByType.login_attempt).toBe(2);
      expect(stats.eventsByType.rate_limit_exceeded).toBe(1);
      expect(stats.highRiskEvents).toBeGreaterThan(0);
      expect(stats.securityScore).toBeLessThan(100);
    });

    it("should calculate security score based on risk events", () => {
      // Log only low-risk events
      securityService.logSecurityEvent("attempt_recorded", { success: true });
      const lowRiskStats = securityService.getSecurityStats();

      // Reset and log high-risk events
      securityService.reset();
      securityService.logSecurityEvent("rate_limit_exceeded", {
        ip: "192.168.1.1",
      });
      securityService.logSecurityEvent("suspicious_activity_flagged", {
        ip: "10.0.0.1",
      });
      const highRiskStats = securityService.getSecurityStats();

      expect(lowRiskStats.securityScore).toBeGreaterThan(
        highRiskStats.securityScore,
      );
    });

    it("should handle empty event history", () => {
      const stats = securityService.getSecurityStats();

      expect(stats.totalEvents).toBe(0);
      expect(stats.highRiskEvents).toBe(0);
      expect(stats.securityScore).toBe(100);
      expect(stats.eventsByType).toEqual({});
    });

    it("should filter events by timeframe", () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      // Mock timestamp on events
      securityService.logSecurityEvent("recent_event", { time: "recent" });
      (securityService as any).securityEvents[
        (securityService as any).securityEvents.length - 1
      ].timestamp = oneHourAgo;

      securityService.logSecurityEvent("old_event", { time: "old" });
      (securityService as any).securityEvents[
        (securityService as any).securityEvents.length - 1
      ].timestamp = twoDaysAgo;

      const oneDayStats = securityService.getSecurityStats(24 * 60 * 60 * 1000);
      expect(oneDayStats.totalEvents).toBe(1);

      const threeDayStats = securityService.getSecurityStats(
        3 * 24 * 60 * 60 * 1000,
      );
      expect(threeDayStats.totalEvents).toBe(2);
    });
  });

  describe("Utility Functions", () => {
    it("should generate unique event IDs", () => {
      const id1 = securityService.generateEventId();
      const id2 = securityService.generateEventId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^sec_\d+_[a-z0-9]+$/);
    });

    it("should detect unusual locations correctly", () => {
      const currentLocation = { lat: 40.7128, lng: -74.006 }; // NYC
      const nearbyHistory = [{ lat: 40.758, lng: -73.9855 }]; // Also NYC area
      const distantHistory = [{ lat: 34.0522, lng: -118.2437 }]; // LA

      expect(
        securityService.isUnusualLocation(currentLocation, nearbyHistory),
      ).toBe(false);
      expect(
        securityService.isUnusualLocation(currentLocation, distantHistory),
      ).toBe(true);
      expect(securityService.isUnusualLocation(currentLocation, [])).toBe(
        false,
      );
    });

    it("should detect unusual times correctly", () => {
      const normalHour = new Date();
      normalHour.setHours(14, 0, 0, 0); // 2 PM

      const unusualHour = new Date();
      unusualHour.setHours(3, 0, 0, 0); // 3 AM

      expect(securityService.isUnusualTime(normalHour.getTime())).toBe(false);
      expect(securityService.isUnusualTime(unusualHour.getTime())).toBe(true);
    });

    it("should group events by type correctly", () => {
      const events = [
        { type: "login_attempt" },
        { type: "login_attempt" },
        { type: "mfa_attempt" },
        { type: "login_attempt" },
      ];

      const grouped = securityService.groupEventsByType(events as any);

      expect(grouped.login_attempt).toBe(3);
      expect(grouped.mfa_attempt).toBe(1);
    });

    it("should handle cleanup correctly", () => {
      const now = Date.now();
      const identifier = "192.168.1.1";

      // Create rate limit data with expired lock
      (securityService as any).rateLimits.set(`${identifier}:login`, {
        attempts: 5,
        windowStart: now - 25 * 60 * 60 * 1000, // 25 hours ago
        lockedUntil: now - 60 * 1000, // 1 minute ago (expired)
      });

      // Run cleanup
      securityService.cleanup();

      // Should remove expired data
      expect(
        (securityService as any).rateLimits.has(`${identifier}:login`),
      ).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid input gracefully", () => {
      // Test with null/undefined inputs
      expect(() =>
        securityService.checkRateLimit(null as any, null as any),
      ).not.toThrow();
      expect(() =>
        securityService.recordAttempt(undefined as any, undefined as any),
      ).not.toThrow();
      expect(() => securityService.analyzeFraudRisk({} as any)).not.toThrow();
    });

    it("should fail open on critical errors", () => {
      // Mock an error condition
      const originalMap = (securityService as any).rateLimits;
      (securityService as any).rateLimits = null;

      const result = securityService.checkRateLimit("192.168.1.1", "login");

      // Should allow the action even with errors
      expect(result.allowed).toBe(true);

      // Restore original state
      (securityService as any).rateLimits = originalMap;
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete login flow with rate limiting", () => {
      const userIP = "192.168.1.100";
      const action = "login";

      // Simulate multiple failed login attempts
      for (let i = 0; i < 4; i++) {
        const status = securityService.checkRateLimit(userIP, action, 5, 60000);
        expect(status.allowed).toBe(true);
        securityService.recordAttempt(userIP, action, false);
      }

      // 5th attempt should still be allowed
      const fifthAttempt = securityService.checkRateLimit(
        userIP,
        action,
        5,
        60000,
      );
      expect(fifthAttempt.allowed).toBe(true);
      expect(fifthAttempt.attemptsRemaining).toBe(1);

      // Record the 5th failed attempt
      securityService.recordAttempt(userIP, action, false);

      // 6th attempt should be blocked
      const sixthAttempt = securityService.checkRateLimit(
        userIP,
        action,
        5,
        60000,
      );
      expect(sixthAttempt.allowed).toBe(false);
      expect(sixthAttempt.reason).toBe("rate_limited");
    });

    it("should handle MFA with different rate limits", () => {
      const userIP = "192.168.1.101";

      // Max out login attempts (5 attempts)
      for (let i = 0; i < 6; i++) {
        securityService.recordAttempt(userIP, "login", false);
      }

      // Login should be blocked
      const loginStatus = securityService.checkRateLimit(
        userIP,
        "login",
        5,
        60000,
      );
      expect(loginStatus.allowed).toBe(false);

      // But MFA should still be available (3 attempts)
      const mfaStatus = securityService.checkRateLimit(userIP, "mfa", 3, 60000);
      expect(mfaStatus.allowed).toBe(true);
    });

    it("should integrate fraud detection with rate limiting", () => {
      const suspiciousIP = "10.0.0.50";

      // Perform fraud analysis
      const fraudResult = securityService.analyzeFraudRisk({
        ipAddress: suspiciousIP,
        userId: "user123",
        timestamp: new Date().setHours(3, 0, 0, 0), // 3 AM
      });

      // Should detect unusual time
      expect(fraudResult.riskFactors).toContain("unusual_time");

      // Now perform rate-limited actions
      const rateLimitStatus = securityService.checkRateLimit(
        suspiciousIP,
        "login",
        5,
        60000,
      );
      expect(rateLimitStatus.allowed).toBe(true);

      // Record failed attempt
      securityService.recordAttempt(suspiciousIP, "login", false);

      // Check that events are logged
      const events = securityService.getSecurityEvents(10);
      expect(events.some((e) => e.type === "attempt_recorded")).toBe(true);
    });
  });
});
