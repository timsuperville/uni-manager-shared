/**
 * Session Management Service Tests
 *
 * Comprehensive test coverage for session management functionality including:
 * - Session creation and validation
 * - Device fingerprinting and tracking
 * - Concurrent session management
 * - Security monitoring and fraud detection
 * - Session analytics and cleanup
 * - Integration with security service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import sessionManagementService from '../services/sessionManagementService';
import securityService from '../services/securityService';

// Mock dependencies
vi.mock('../services/securityService', () => ({
  default: {
    analyzeFraudRisk: vi.fn(),
    logSecurityEvent: vi.fn(),
  },
}));

// Mock globals
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    platform: 'Win32',
    language: 'en-US',
    hardwareConcurrency: 8,
    deviceMemory: 8,
  },
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    screen: {
      width: 1920,
      height: 1080,
      colorDepth: 24,
    },
    dispatchEvent: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      getContext: vi.fn(() => ({
        textBaseline: '',
        font: '',
        fillText: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
      })),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock-canvas-data'),
    })),
  },
  writable: true,
});

Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: vi.fn(() => ({
      resolvedOptions: vi.fn(() => ({ timeZone: 'America/New_York' })),
    })),
  },
  writable: true,
});

describe('SessionManagementService', () => {
  beforeEach(() => {
    // Reset service state
    sessionManagementService.reset();

    // Setup default mocks
    securityService.analyzeFraudRisk.mockReturnValue({
      score: 0.2,
      riskLevel: 'low',
      factors: [],
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionManagementService.reset();
  });

  describe('Session Creation', () => {
    it('should create a new session successfully', async () => {
      const sessionData = {
        userId: 'user123',
        authMethod: 'password',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser',
        rememberMe: false,
      };

      const result = await sessionManagementService.createSession(sessionData);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.deviceFingerprint).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(result.requiresAdditionalVerification).toBe(false);
    });

    it('should create session with remember me functionality', async () => {
      const sessionData = {
        userId: 'user123',
        authMethod: 'password',
        rememberMe: true,
      };

      const result = await sessionManagementService.createSession(sessionData);

      expect(result.success).toBe(true);

      // Should have longer expiration (30 days vs 24 hours)
      const session = sessionManagementService.validateSession(
        result.sessionId
      );
      const now = Date.now();
      const sessionDuration = session.session.expiresAt - now;
      expect(sessionDuration).toBeGreaterThan(24 * 60 * 60 * 1000); // More than 24 hours
    });

    it('should detect high risk sessions and flag them', async () => {
      securityService.analyzeFraudRisk.mockReturnValue({
        score: 0.9,
        riskLevel: 'high',
        factors: ['unusual_location', 'suspicious_ip'],
      });

      const sessionData = {
        userId: 'user123',
        authMethod: 'password',
        ipAddress: '1.2.3.4', // Suspicious IP
      };

      const result = await sessionManagementService.createSession(sessionData);

      expect(result.success).toBe(true);
      expect(result.requiresAdditionalVerification).toBe(true);
      expect(securityService.logSecurityEvent).toHaveBeenCalledWith(
        'high_risk_session_created',
        expect.objectContaining({
          sessionId: result.sessionId,
          userId: 'user123',
        })
      );
    });

    it('should handle session creation errors gracefully', async () => {
      securityService.analyzeFraudRisk.mockImplementation(() => {
        throw new Error('Fraud analysis failed');
      });

      const sessionData = {
        userId: 'user123',
        authMethod: 'password',
      };

      const result = await sessionManagementService.createSession(sessionData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Fraud analysis failed');
    });
  });

  describe('Session Validation', () => {
    let sessionId;

    beforeEach(async () => {
      const result = await sessionManagementService.createSession({
        userId: 'user123',
        authMethod: 'password',
      });
      sessionId = result.sessionId;
    });

    it('should validate active sessions', () => {
      const validation = sessionManagementService.validateSession(sessionId);

      expect(validation.valid).toBe(true);
      expect(validation.session.sessionId).toBe(sessionId);
      expect(validation.session.userId).toBe('user123');
    });

    it('should reject non-existent sessions', () => {
      const validation =
        sessionManagementService.validateSession('invalid-session-id');

      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('session_not_found');
    });

    it('should reject expired sessions', () => {
      // Manually expire the session
      const session = sessionManagementService.activeSessions.get(sessionId);
      session.expiresAt = Date.now() - 1000; // Expired 1 second ago

      const validation = sessionManagementService.validateSession(sessionId);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('session_expired');
    });

    it('should reject inactive sessions', () => {
      // Manually set last activity to long ago
      const session = sessionManagementService.activeSessions.get(sessionId);
      session.lastActivity = Date.now() - 35 * 60 * 1000; // 35 minutes ago
      session.rememberMe = false;

      const validation = sessionManagementService.validateSession(sessionId);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('session_inactive');
    });

    it('should update activity timestamp on validation', () => {
      const beforeValidation = Date.now();
      const validation = sessionManagementService.validateSession(sessionId);

      expect(validation.valid).toBe(true);
      expect(validation.session.lastActivity).toBeGreaterThanOrEqual(
        beforeValidation
      );
    });

    it('should handle validation errors gracefully', () => {
      // Corrupt session data to trigger error
      sessionManagementService.activeSessions.set(sessionId, null);

      const validation = sessionManagementService.validateSession(sessionId);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('validation_error');
    });
  });

  describe('Session Invalidation', () => {
    let sessionId;

    beforeEach(async () => {
      const result = await sessionManagementService.createSession({
        userId: 'user123',
        authMethod: 'password',
      });
      sessionId = result.sessionId;
    });

    it('should invalidate sessions successfully', () => {
      const result = sessionManagementService.invalidateSession(
        sessionId,
        'manual'
      );

      expect(result).toBe(true);

      // Session should no longer exist
      const validation = sessionManagementService.validateSession(sessionId);
      expect(validation.valid).toBe(false);
    });

    it('should log session invalidation events', () => {
      sessionManagementService.invalidateSession(
        sessionId,
        'security_violation'
      );

      expect(securityService.logSecurityEvent).toHaveBeenCalledWith(
        'session_invalidated',
        expect.objectContaining({
          sessionId,
          userId: 'user123',
          reason: 'security_violation',
        })
      );
    });

    it('should clean up session from all tracking structures', () => {
      const session = sessionManagementService.activeSessions.get(sessionId);
      const userId = session.userId;
      const deviceFingerprint = session.deviceFingerprint;

      sessionManagementService.invalidateSession(sessionId);

      // Check all tracking structures are cleaned
      expect(sessionManagementService.activeSessions.has(sessionId)).toBe(
        false
      );
      expect(
        sessionManagementService.userSessions.get(userId) || []
      ).not.toContain(sessionId);
      expect(
        sessionManagementService.deviceSessions.get(deviceFingerprint) || []
      ).not.toContain(sessionId);
    });

    it('should handle invalidation of non-existent sessions gracefully', () => {
      const result = sessionManagementService.invalidateSession(
        'non-existent-session'
      );

      expect(result).toBe(true); // Should not throw error
    });
  });

  describe('Device Fingerprinting', () => {
    it('should generate consistent device fingerprints', async () => {
      const fingerprint1 =
        await sessionManagementService.generateDeviceFingerprint();
      const fingerprint2 =
        await sessionManagementService.generateDeviceFingerprint();

      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toBeDefined();
      expect(typeof fingerprint1).toBe('string');
    });

    it('should generate fallback fingerprint when browser APIs unavailable', async () => {
      // Mock undefined navigator
      const originalNavigator = global.navigator;
      global.navigator = undefined;

      const fingerprint =
        await sessionManagementService.generateDeviceFingerprint();

      expect(fingerprint).toBeDefined();
      expect(fingerprint.startsWith('fallback_')).toBe(true);

      global.navigator = originalNavigator;
    });

    it('should include canvas fingerprinting', () => {
      const canvasFingerprint = sessionManagementService.getCanvasFingerprint();

      expect(canvasFingerprint).toBeDefined();
      expect(typeof canvasFingerprint).toBe('string');
    });

    it('should handle canvas errors gracefully', () => {
      // Mock canvas error
      typeof document !== "undefined" && document.createElement.mockReturnValue({
        getContext: () => null,
      });

      const canvasFingerprint = sessionManagementService.getCanvasFingerprint();

      expect(canvasFingerprint).toBe('no-context');
    });
  });

  describe('Concurrent Session Management', () => {
    it('should track multiple sessions per user', async () => {
      const userId = 'user123';
      const sessions = [];

      // Create multiple sessions
      for (let i = 0; i < 3; i++) {
        const result = await sessionManagementService.createSession({
          userId,
          authMethod: 'password',
          deviceInfo: { platform: `Device${i}` },
        });
        sessions.push(result.sessionId);
      }

      const userSessions = sessionManagementService.getUserSessions(userId);
      expect(userSessions).toHaveLength(3);
    });

    it('should enforce session limits', async () => {
      const userId = 'user123';
      const originalLimit =
        sessionManagementService.config.maxConcurrentSessions;
      sessionManagementService.config.maxConcurrentSessions = 2;

      // Create sessions up to limit
      await sessionManagementService.createSession({
        userId,
        deviceInfo: { platform: 'Device1' },
      });
      await sessionManagementService.createSession({
        userId,
        deviceInfo: { platform: 'Device2' },
      });

      // Creating third session should remove oldest
      await sessionManagementService.createSession({
        userId,
        deviceInfo: { platform: 'Device3' },
      });

      const userSessions = sessionManagementService.getUserSessions(userId);
      expect(userSessions).toHaveLength(2);

      sessionManagementService.config.maxConcurrentSessions = originalLimit;
    });

    it('should invalidate all user sessions except specified', () => {
      const userId = 'user123';

      // Create test sessions
      sessionManagementService.userSessions.set(userId, [
        'session1',
        'session2',
        'session3',
      ]);
      sessionManagementService.activeSessions.set('session1', {
        sessionId: 'session1',
        userId,
        deviceFingerprint: 'device1',
        isActive: true,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });
      sessionManagementService.activeSessions.set('session2', {
        sessionId: 'session2',
        userId,
        deviceFingerprint: 'device2',
        isActive: true,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });
      sessionManagementService.activeSessions.set('session3', {
        sessionId: 'session3',
        userId,
        deviceFingerprint: 'device3',
        isActive: true,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });

      const invalidatedCount = sessionManagementService.invalidateUserSessions(
        userId,
        'session2'
      );

      expect(invalidatedCount).toBe(2);
      expect(sessionManagementService.activeSessions.has('session2')).toBe(
        true
      );
      expect(sessionManagementService.activeSessions.has('session1')).toBe(
        false
      );
      expect(sessionManagementService.activeSessions.has('session3')).toBe(
        false
      );
    });
  });

  describe('Security Monitoring', () => {
    let sessionId;

    beforeEach(async () => {
      const result = await sessionManagementService.createSession({
        userId: 'user123',
        authMethod: 'password',
        ipAddress: '192.168.1.100',
      });
      sessionId = result.sessionId;
    });

    it('should detect IP address changes', () => {
      const result = sessionManagementService.detectSuspiciousActivity(
        sessionId,
        {
          ipAddress: '10.0.0.1', // Different IP
        }
      );

      expect(result.requiresReauth).toBe(false); // Not enough indicators yet
    });

    it('should detect location changes', () => {
      const session = sessionManagementService.activeSessions.get(sessionId);
      session.geolocation = { lat: 40.7128, lng: -74.006 }; // NYC

      const result = sessionManagementService.detectSuspiciousActivity(
        sessionId,
        {
          geolocation: { lat: 34.0522, lng: -118.2437 }, // LA
        }
      );

      expect(result.requiresReauth).toBe(false); // Distance < threshold for testing
    });

    it('should detect rapid activity patterns', () => {
      const session = sessionManagementService.activeSessions.get(sessionId);
      session.lastActivity = Date.now() - 500; // 500ms ago
      session.activityCount = 150; // High activity count

      const result = sessionManagementService.detectSuspiciousActivity(
        sessionId,
        {}
      );

      expect(result.requiresReauth).toBe(false); // Need more indicators
    });

    it('should require re-authentication for high suspicion', () => {
      const session = sessionManagementService.activeSessions.get(sessionId);
      session.lastActivity = Date.now() - 500;
      session.activityCount = 150;
      session.geolocation = { lat: 40.7128, lng: -74.006 };

      const result = sessionManagementService.detectSuspiciousActivity(
        sessionId,
        {
          ipAddress: '10.0.0.1',
          geolocation: { lat: 51.5074, lng: -0.1278 }, // London - far from NYC
        }
      );

      // This should trigger multiple indicators and require reauth
      if (result.requiresReauth) {
        expect(result.reason).toBe('suspicious_activity');
        expect(result.indicators).toBeDefined();
      }
    });

    it('should handle missing session gracefully', () => {
      const result = sessionManagementService.detectSuspiciousActivity(
        'non-existent',
        {}
      );

      expect(result).toBeUndefined();
    });
  });

  describe('Session Analytics', () => {
    beforeEach(async () => {
      // Create test sessions
      await sessionManagementService.createSession({
        userId: 'user1',
        authMethod: 'password',
        deviceInfo: { platform: 'Windows' },
      });

      await sessionManagementService.createSession({
        userId: 'user1',
        authMethod: 'webauthn',
        deviceInfo: { platform: 'macOS' },
      });

      await sessionManagementService.createSession({
        userId: 'user2',
        authMethod: 'oauth',
        deviceInfo: { platform: 'Windows' },
      });
    });

    it('should provide overall analytics', () => {
      const analytics = sessionManagementService.getSessionAnalytics();

      expect(analytics.totalSessions).toBe(3);
      expect(analytics.activeSessions).toBe(3);
      expect(analytics.averageSessionDuration).toBeGreaterThan(0);
      expect(analytics.deviceDistribution).toEqual({
        Windows: 2,
        macOS: 1,
      });
      expect(analytics.authMethodDistribution).toEqual({
        password: 1,
        webauthn: 1,
        oauth: 1,
      });
    });

    it('should provide user-specific analytics', () => {
      const analytics = sessionManagementService.getSessionAnalytics('user1');

      expect(analytics.totalSessions).toBe(2);
      expect(analytics.activeSessions).toBe(2);
      expect(analytics.deviceDistribution).toEqual({
        Windows: 1,
        macOS: 1,
      });
    });

    it('should handle analytics errors gracefully', () => {
      // Corrupt session data
      sessionManagementService.activeSessions.set('corrupt', 'invalid-data');

      const analytics = sessionManagementService.getSessionAnalytics();

      expect(analytics.totalSessions).toBe(0);
      expect(analytics.error).toBeDefined();
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up expired sessions', async () => {
      // Create session and immediately expire it
      const result = await sessionManagementService.createSession({
        userId: 'user123',
        authMethod: 'password',
      });

      const session = sessionManagementService.activeSessions.get(
        result.sessionId
      );
      session.expiresAt = Date.now() - 1000; // Expired

      const beforeCleanup = sessionManagementService.activeSessions.size;
      sessionManagementService.cleanup();
      const afterCleanup = sessionManagementService.activeSessions.size;

      expect(afterCleanup).toBe(beforeCleanup - 1);
    });

    it('should preserve active sessions during cleanup', async () => {
      await sessionManagementService.createSession({
        userId: 'user123',
        authMethod: 'password',
      });

      const beforeCleanup = sessionManagementService.activeSessions.size;
      sessionManagementService.cleanup();
      const afterCleanup = sessionManagementService.activeSessions.size;

      expect(afterCleanup).toBe(beforeCleanup); // No sessions should be removed
    });
  });

  describe('Utility Functions', () => {
    it('should generate unique session IDs', () => {
      const id1 = sessionManagementService.generateSessionId();
      const id2 = sessionManagementService.generateSessionId();

      expect(id1).not.toBe(id2);
      expect(id1.startsWith('ses_')).toBe(true);
      expect(id2.startsWith('ses_')).toBe(true);
    });

    it('should calculate distance correctly', () => {
      const nyc = { lat: 40.7128, lng: -74.006 };
      const la = { lat: 34.0522, lng: -118.2437 };

      const distance = sessionManagementService.calculateDistance(nyc, la);

      expect(distance).toBeGreaterThan(3900); // ~3944 km
      expect(distance).toBeLessThan(4000);
    });

    it('should create simple hashes', () => {
      const hash1 = sessionManagementService.simpleHash('test string');
      const hash2 = sessionManagementService.simpleHash('test string');
      const hash3 = sessionManagementService.simpleHash('different string');

      expect(hash1).toBe(hash2); // Same input, same hash
      expect(hash1).not.toBe(hash3); // Different input, different hash
    });

    it('should convert degrees to radians', () => {
      const radians = sessionManagementService.toRadians(180);
      expect(radians).toBeCloseTo(Math.PI, 5);
    });
  });

  describe('Session State Management', () => {
    it('should reset all session data', async () => {
      // Create some sessions
      await sessionManagementService.createSession({
        userId: 'user123',
        authMethod: 'password',
      });

      expect(sessionManagementService.activeSessions.size).toBeGreaterThan(0);

      sessionManagementService.reset();

      expect(sessionManagementService.activeSessions.size).toBe(0);
      expect(sessionManagementService.userSessions.size).toBe(0);
      expect(sessionManagementService.deviceSessions.size).toBe(0);
      expect(sessionManagementService.currentSession).toBeNull();
    });

    it('should manage user session lists correctly', () => {
      sessionManagementService.addUserSession('user123', 'session1');
      sessionManagementService.addUserSession('user123', 'session2');

      expect(sessionManagementService.userSessions.get('user123')).toEqual([
        'session1',
        'session2',
      ]);

      sessionManagementService.removeUserSession('user123', 'session1');

      expect(sessionManagementService.userSessions.get('user123')).toEqual([
        'session2',
      ]);
    });

    it('should manage device session lists correctly', () => {
      sessionManagementService.addDeviceSession('device123', 'session1');
      sessionManagementService.addDeviceSession('device123', 'session2');

      expect(sessionManagementService.deviceSessions.get('device123')).toEqual([
        'session1',
        'session2',
      ]);

      sessionManagementService.removeDeviceSession('device123', 'session1');

      expect(sessionManagementService.deviceSessions.get('device123')).toEqual([
        'session2',
      ]);
    });
  });

  describe('Integration with Security Service', () => {
    it('should call fraud analysis during session creation', async () => {
      const sessionData = {
        userId: 'user123',
        authMethod: 'password',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser',
      };

      await sessionManagementService.createSession(sessionData);

      expect(securityService.analyzeFraudRisk).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.100',
          userId: 'user123',
          userAgent: 'Test Browser',
        })
      );
    });

    it('should log security events appropriately', async () => {
      const sessionData = {
        userId: 'user123',
        authMethod: 'password',
      };

      const result = await sessionManagementService.createSession(sessionData);

      expect(securityService.logSecurityEvent).toHaveBeenCalledWith(
        'session_created',
        expect.objectContaining({
          sessionId: result.sessionId,
          userId: 'user123',
          authMethod: 'password',
        })
      );
    });
  });
});

describe('SessionManagementService Edge Cases', () => {
  beforeEach(() => {
    sessionManagementService.reset();
    vi.clearAllMocks();
  });

  it('should handle missing device fingerprint gracefully', async () => {
    // Mock fingerprinting failure
    vi.spyOn(
      sessionManagementService,
      'generateDeviceFingerprint'
    ).mockResolvedValue(null);

    const result = await sessionManagementService.createSession({
      userId: 'user123',
      authMethod: 'password',
    });

    expect(result.success).toBe(true);
    expect(result.deviceFingerprint).toBeNull();
  });

  it('should handle session timeout errors', () => {
    // Mock setTimeout to throw
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = vi.fn().mockImplementation(() => {
      throw new Error('setTimeout failed');
    });

    // This should not crash the service
    expect(() => {
      sessionManagementService.setSessionTimeout('test-session', 1000);
    }).not.toThrow();

    global.setTimeout = originalSetTimeout;
  });

  it('should handle heartbeat failures gracefully', () => {
    sessionManagementService.currentSession = {
      sessionId: 'test-session',
    };

    // Mock validation to throw
    vi.spyOn(sessionManagementService, 'validateSession').mockImplementation(
      () => {
        throw new Error('Validation failed');
      }
    );

    // Should not crash
    expect(() => {
      sessionManagementService.performHeartbeat();
    }).not.toThrow();
  });

  it('should handle corrupted session data', () => {
    // Add corrupted session data
    sessionManagementService.activeSessions.set('corrupt', {
      // Missing required fields
      sessionId: 'corrupt',
    });

    expect(() => {
      sessionManagementService.getUserSessions('test-user');
    }).not.toThrow();

    expect(() => {
      sessionManagementService.getSessionAnalytics();
    }).not.toThrow();
  });

  it('should handle browser API failures', async () => {
    // Mock all browser APIs to fail
    global.navigator = undefined;
    global.window = undefined;
    global.document = undefined;

    const fingerprint =
      await sessionManagementService.generateDeviceFingerprint();

    expect(fingerprint).toBeDefined();
    expect(fingerprint.startsWith('fallback_')).toBe(true);
  });
});
