/**
 * Session Management Service
 *
 * Provides comprehensive session management features including:
 * - Concurrent session limits and tracking
 * - Device fingerprinting and recognition
 * - Suspicious activity detection for sessions
 * - Secure session invalidation
 * - Session analytics and monitoring
 *
 * @module SessionManagementService
 */

/* global navigator, document, window, setInterval, clearInterval, clearTimeout, setTimeout, Intl, CustomEvent */

import securityService from './securityService';

class SessionManagementService {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> session data
    this.deviceSessions = new Map(); // deviceId -> session IDs
    this.userSessions = new Map(); // userId -> session IDs
    this.sessionTimeouts = new Map(); // sessionId -> timeout handle
    this.config = {
      maxConcurrentSessions: 5,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      inactivityTimeout: 30 * 60 * 1000, // 30 minutes
      deviceFingerprintVersion: '1.0',
      heartbeatInterval: 60 * 1000, // 1 minute
      suspiciousActivityThreshold: 3,
    };
    this.currentSession = null;
    this.heartbeatInterval = null;
  }

  /**
   * Session Creation and Management
   */

  /**
   * Create a new session
   * @param {Object} sessionData - Session creation data
   * @returns {Object} Created session information
   */
  async createSession(sessionData) {
    try {
      const {
        userId,
        authMethod = 'password',
        deviceInfo = {},
        ipAddress = '127.0.0.1',
        userAgent = navigator?.userAgent || 'Unknown',
        rememberMe = false,
      } = sessionData;

      // Generate session ID and device fingerprint
      const sessionId = this.generateSessionId();
      const deviceFingerprint = await this.generateDeviceFingerprint();
      const now = Date.now();

      // Check concurrent session limits
      const existingSessions = this.getUserSessions(userId);
      if (existingSessions.length >= this.config.maxConcurrentSessions) {
        await this.enforceSessionLimit(userId);
      }

      // Perform fraud analysis
      const fraudAnalysis = securityService.analyzeFraudRisk({
        ipAddress,
        userId,
        timestamp: now,
        deviceFingerprint,
        userAgent,
      });

      // Create session object
      const session = {
        sessionId,
        userId,
        deviceFingerprint,
        authMethod,
        ipAddress,
        userAgent,
        deviceInfo: {
          ...deviceInfo,
          platform: navigator?.platform || 'Unknown',
          language: navigator?.language || 'en-US',
          screen: {
            width: window?.screen?.width || 0,
            height: window?.screen?.height || 0,
          },
        },
        createdAt: now,
        lastActivity: now,
        expiresAt:
          now +
          (rememberMe ? 30 * 24 * 60 * 60 * 1000 : this.config.sessionTimeout), // 30 days if remembered
        rememberMe,
        fraudAnalysis,
        isActive: true,
        activityCount: 1,
        flags: [],
      };

      // Check for suspicious activity
      if (fraudAnalysis.riskLevel === 'high') {
        session.flags.push('high_risk_login');
        securityService.logSecurityEvent('high_risk_session_created', {
          sessionId,
          userId,
          fraudAnalysis,
        });
      }

      // Store session
      this.activeSessions.set(sessionId, session);
      this.addUserSession(userId, sessionId);
      this.addDeviceSession(deviceFingerprint, sessionId);

      // Set session timeout
      this.setSessionTimeout(sessionId, session.expiresAt - now);

      // Set as current session
      this.currentSession = session;

      // Start heartbeat monitoring
      this.startHeartbeat();

      // Log session creation
      securityService.logSecurityEvent('session_created', {
        sessionId,
        userId,
        authMethod,
        deviceFingerprint,
      });

      return {
        success: true,
        sessionId,
        deviceFingerprint,
        expiresAt: session.expiresAt,
        requiresAdditionalVerification: fraudAnalysis.riskLevel === 'high',
      };
    } catch (_error) {
      // console.error('Error creating session:', _error);
      return {
        success: false,
        error: _error.message,
      };
    }
  }

  /**
   * Validate and refresh session
   * @param {string} sessionId - Session ID to validate
   * @returns {Object} Session validation result
   */
  validateSession(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        return {
          valid: false,
          reason: 'session_not_found',
        };
      }

      const now = Date.now();

      // Check if session is expired
      if (now > session.expiresAt) {
        this.invalidateSession(sessionId, 'expired');
        return {
          valid: false,
          reason: 'session_expired',
        };
      }

      // Check for inactivity timeout
      const inactiveTime = now - session.lastActivity;
      if (inactiveTime > this.config.inactivityTimeout && !session.rememberMe) {
        this.invalidateSession(sessionId, 'inactive');
        return {
          valid: false,
          reason: 'session_inactive',
        };
      }

      // Update last activity
      session.lastActivity = now;
      session.activityCount += 1;

      return {
        valid: true,
        session: {
          sessionId: session.sessionId,
          userId: session.userId,
          expiresAt: session.expiresAt,
          lastActivity: session.lastActivity,
          flags: session.flags,
        },
      };
    } catch (_error) {
      // console.error('Error validating session:', _error);
      return {
        valid: false,
        reason: 'validation_error',
        error: _error.message,
      };
    }
  }

  /**
   * Invalidate a session
   * @param {string} sessionId - Session ID to invalidate
   * @param {string} reason - Reason for invalidation
   * @returns {boolean} Success status
   */
  invalidateSession(sessionId, reason = 'manual') {
    try {
      const session = this.activeSessions.get(sessionId);

      if (session) {
        // Remove from user sessions
        this.removeUserSession(session.userId, sessionId);

        // Remove from device sessions
        this.removeDeviceSession(session.deviceFingerprint, sessionId);

        // Clear timeout
        if (this.sessionTimeouts.has(sessionId)) {
          clearTimeout(this.sessionTimeouts.get(sessionId));
          this.sessionTimeouts.delete(sessionId);
        }

        // Log session invalidation
        securityService.logSecurityEvent('session_invalidated', {
          sessionId,
          userId: session.userId,
          reason,
          duration: Date.now() - session.createdAt,
        });

        // Remove session
        this.activeSessions.delete(sessionId);

        // If this was the current session, clear it
        if (
          this.currentSession &&
          this.currentSession.sessionId === sessionId
        ) {
          this.currentSession = null;
          this.stopHeartbeat();
        }
      }

      return true;
    } catch (_error) {
      // console.error('Error invalidating session:', error);
      return false;
    }
  }

  /**
   * Device and User Session Management
   */

  /**
   * Get all sessions for a user
   * @param {string} userId - User ID
   * @returns {Array} User's active sessions
   */
  getUserSessions(userId) {
    const sessionIds = this.userSessions.get(userId) || [];
    return sessionIds
      .map((sessionId) => this.activeSessions.get(sessionId))
      .filter((session) => session && session.isActive);
  }

  /**
   * Get all sessions for a device
   * @param {string} deviceFingerprint - Device fingerprint
   * @returns {Array} Device's active sessions
   */
  getDeviceSessions(deviceFingerprint) {
    const sessionIds = this.deviceSessions.get(deviceFingerprint) || [];
    return sessionIds
      .map((sessionId) => this.activeSessions.get(sessionId))
      .filter((session) => session && session.isActive);
  }

  /**
   * Invalidate all sessions for a user
   * @param {string} userId - User ID
   * @param {string} exceptSessionId - Session ID to keep active (optional)
   * @returns {number} Number of sessions invalidated
   */
  invalidateUserSessions(userId, exceptSessionId = null) {
    const sessions = this.getUserSessions(userId);
    let invalidatedCount = 0;

    sessions.forEach((session) => {
      if (session.sessionId !== exceptSessionId) {
        if (this.invalidateSession(session.sessionId, 'user_logout_all')) {
          invalidatedCount++;
        }
      }
    });

    return invalidatedCount;
  }

  /**
   * Enforce concurrent session limits
   * @param {string} userId - User ID
   */
  async enforceSessionLimit(userId) {
    const sessions = this.getUserSessions(userId);

    if (sessions.length >= this.config.maxConcurrentSessions) {
      // Sort by last activity (oldest first)
      sessions.sort((a, b) => a.lastActivity - b.lastActivity);

      // Remove oldest session
      const oldestSession = sessions[0];
      this.invalidateSession(oldestSession.sessionId, 'session_limit_exceeded');

      securityService.logSecurityEvent('session_limit_enforced', {
        userId,
        removedSessionId: oldestSession.sessionId,
        totalSessions: sessions.length,
      });
    }
  }

  /**
   * Device Fingerprinting
   */

  /**
   * Generate device fingerprint
   * @returns {Promise<string>} Device fingerprint
   */
  async generateDeviceFingerprint() {
    try {
      const components = [];

      // Browser and platform info
      if (typeof navigator !== 'undefined') {
        components.push(typeof navigator !== "undefined" && navigator.userAgent || '');
        components.push(typeof navigator !== "undefined" && navigator.platform || '');
        components.push(typeof navigator !== "undefined" && navigator.language || '');
        components.push(typeof navigator !== "undefined" && navigator.hardwareConcurrency || 0);
        components.push(typeof navigator !== "undefined" && navigator.deviceMemory || 0);
      }

      // Screen information
      if (typeof window !== 'undefined' && typeof window !== "undefined" && window.screen) {
        components.push(typeof window !== "undefined" && window.screen.width || 0);
        components.push(typeof window !== "undefined" && window.screen.height || 0);
        components.push(typeof window !== "undefined" && window.screen.colorDepth || 0);
      }

      // Timezone
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');

      // Canvas fingerprinting (simplified)
      const canvasFingerprint = this.getCanvasFingerprint();
      components.push(canvasFingerprint);

      // Combine all components
      const fingerprint = components.join('|');

      // Generate hash (simplified - in production use crypto.subtle)
      return this.simpleHash(fingerprint);
    } catch (_error) {
      // console.error('Error generating device fingerprint:', error);
      return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Get canvas fingerprint
   * @returns {string} Canvas fingerprint
   */
  getCanvasFingerprint() {
    try {
      if (typeof document === 'undefined') return 'no-canvas';

      const canvas = typeof document !== "undefined" && document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return 'no-context';

      // Draw some shapes and text
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint canvas', 2, 2);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillRect(100, 5, 80, 20);

      return canvas.toDataURL().slice(-50); // Last 50 chars
    } catch (_error) {
      return 'canvas-error';
    }
  }

  /**
   * Simple hash function (replace with crypto.subtle in production)
   * @param {string} str - String to hash
   * @returns {string} Hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Session Monitoring and Security
   */

  /**
   * Start heartbeat monitoring
   */
  startHeartbeat() {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat monitoring
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Perform heartbeat check
   */
  performHeartbeat() {
    if (!this.currentSession) return;

    const validationResult = this.validateSession(
      this.currentSession.sessionId
    );

    if (!validationResult.valid) {
      this.stopHeartbeat();
      // Notify application about session expiry
      typeof window !== "undefined" && window.dispatchEvent(
        new CustomEvent('sessionExpired', {
          detail: { reason: validationResult.reason },
        })
      );
    }
  }

  /**
   * Detect suspicious session activity
   * @param {string} sessionId - Session ID
   * @param {Object} activityData - Activity data
   */
  detectSuspiciousActivity(sessionId, activityData) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const suspiciousIndicators = [];

    // Check for unusual IP changes
    if (
      activityData.ipAddress &&
      activityData.ipAddress !== session.ipAddress
    ) {
      suspiciousIndicators.push('ip_change');
    }

    // Check for unusual location changes
    if (activityData.geolocation && session.geolocation) {
      const distance = this.calculateDistance(
        activityData.geolocation,
        session.geolocation
      );
      if (distance > 100) {
        // More than 100km
        suspiciousIndicators.push('location_change');
      }
    }

    // Check for rapid activity patterns
    const timeSinceLastActivity = Date.now() - session.lastActivity;
    if (timeSinceLastActivity < 1000 && session.activityCount > 100) {
      suspiciousIndicators.push('rapid_activity');
    }

    if (
      suspiciousIndicators.length >= this.config.suspiciousActivityThreshold
    ) {
      session.flags.push('suspicious_activity');

      securityService.logSecurityEvent('suspicious_session_activity', {
        sessionId,
        userId: session.userId,
        indicators: suspiciousIndicators,
        activityData,
      });

      // Consider requiring re-authentication
      return {
        requiresReauth: true,
        reason: 'suspicious_activity',
        indicators: suspiciousIndicators,
      };
    }

    return { requiresReauth: false };
  }

  /**
   * Utility Methods
   */

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `ses_${timestamp}_${random}`;
  }

  /**
   * Add session to user's session list
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   */
  addUserSession(userId, sessionId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, []);
    }
    this.userSessions.get(userId).push(sessionId);
  }

  /**
   * Remove session from user's session list
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   */
  removeUserSession(userId, sessionId) {
    if (this.userSessions.has(userId)) {
      const sessions = this.userSessions.get(userId);
      const index = sessions.indexOf(sessionId);
      if (index > -1) {
        sessions.splice(index, 1);
      }
    }
  }

  /**
   * Add session to device's session list
   * @param {string} deviceFingerprint - Device fingerprint
   * @param {string} sessionId - Session ID
   */
  addDeviceSession(deviceFingerprint, sessionId) {
    if (!this.deviceSessions.has(deviceFingerprint)) {
      this.deviceSessions.set(deviceFingerprint, []);
    }
    this.deviceSessions.get(deviceFingerprint).push(sessionId);
  }

  /**
   * Remove session from device's session list
   * @param {string} deviceFingerprint - Device fingerprint
   * @param {string} sessionId - Session ID
   */
  removeDeviceSession(deviceFingerprint, sessionId) {
    if (this.deviceSessions.has(deviceFingerprint)) {
      const sessions = this.deviceSessions.get(deviceFingerprint);
      const index = sessions.indexOf(sessionId);
      if (index > -1) {
        sessions.splice(index, 1);
      }
    }
  }

  /**
   * Set session timeout
   * @param {string} sessionId - Session ID
   * @param {number} timeoutMs - Timeout in milliseconds
   */
  setSessionTimeout(sessionId, timeoutMs) {
    const timeoutHandle = setTimeout(() => {
      this.invalidateSession(sessionId, 'timeout');
    }, timeoutMs);

    this.sessionTimeouts.set(sessionId, timeoutHandle);
  }

  /**
   * Calculate distance between two geolocations
   * @param {Object} geo1 - First geolocation
   * @param {Object} geo2 - Second geolocation
   * @returns {number} Distance in kilometers
   */
  calculateDistance(geo1, geo2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(geo2.lat - geo1.lat);
    const dLon = this.toRadians(geo2.lng - geo1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(geo1.lat)) *
        Math.cos(this.toRadians(geo2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get session analytics
   * @param {string} userId - User ID (optional)
   * @returns {Object} Session analytics
   */
  getSessionAnalytics(userId = null) {
    try {
      const allSessions = Array.from(this.activeSessions.values());
      const targetSessions = userId
        ? allSessions.filter((s) => s.userId === userId)
        : allSessions;

      const now = Date.now();
      const analytics = {
        totalSessions: targetSessions.length,
        activeSessions: targetSessions.filter((s) => s.isActive).length,
        averageSessionDuration: 0,
        deviceDistribution: {},
        authMethodDistribution: {},
        suspiciousSessionCount: 0,
        recentActivity: [],
      };

      if (targetSessions.length > 0) {
        // Calculate average session duration
        const totalDuration = targetSessions.reduce((sum, session) => {
          return sum + (session.lastActivity - session.createdAt);
        }, 0);
        analytics.averageSessionDuration =
          totalDuration / targetSessions.length;

        // Device distribution
        targetSessions.forEach((session) => {
          const platform = session.deviceInfo.platform || 'Unknown';
          analytics.deviceDistribution[platform] =
            (analytics.deviceDistribution[platform] || 0) + 1;
        });

        // Auth method distribution
        targetSessions.forEach((session) => {
          analytics.authMethodDistribution[session.authMethod] =
            (analytics.authMethodDistribution[session.authMethod] || 0) + 1;
        });

        // Suspicious session count
        analytics.suspiciousSessionCount = targetSessions.filter((session) =>
          session.flags.some((flag) => flag.includes('suspicious'))
        ).length;

        // Recent activity (last 24 hours)
        analytics.recentActivity = targetSessions
          .filter((session) => now - session.lastActivity < 24 * 60 * 60 * 1000)
          .sort((a, b) => b.lastActivity - a.lastActivity)
          .slice(0, 10);
      }

      return analytics;
    } catch (_error) {
      // console.error('Error getting session analytics:', _error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        error: _error.message,
      };
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanup() {
    try {
      const now = Date.now();
      const expiredSessions = [];

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now > session.expiresAt) {
          expiredSessions.push(sessionId);
        }
      }

      expiredSessions.forEach((sessionId) => {
        this.invalidateSession(sessionId, 'cleanup_expired');
      });

      // console.log(
      //   `[SESSION] Cleaned up ${expiredSessions.length} expired sessions`
      // );
    } catch (_error) {
      // console.error('Error during session cleanup:', error);
    }
  }

  /**
   * Reset all session data (for testing)
   */
  reset() {
    // Clear all timeouts
    for (const timeoutHandle of this.sessionTimeouts.values()) {
      clearTimeout(timeoutHandle);
    }

    this.activeSessions.clear();
    this.deviceSessions.clear();
    this.userSessions.clear();
    this.sessionTimeouts.clear();
    this.currentSession = null;
    this.stopHeartbeat();
  }
}

// Create and export singleton instance
const sessionManagementService = new SessionManagementService();

// Set up periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => sessionManagementService.cleanup(), 5 * 60 * 1000); // Every 5 minutes
}

export default sessionManagementService;
