/**
 * Advanced Security Service
 *
 * Provides comprehensive security features including:
 * - Rate limiting for authentication attempts
 * - Fraud detection and suspicious activity monitoring
 * - Security event logging and analytics
 * - IP-based and user-based restrictions
 * - Automatic lockout and recovery mechanisms
 *
 * @module SecurityService
 */

/* global process, setInterval */

class SecurityService {
  constructor() {
    this.rateLimits = new Map(); // IP-based rate limiting
    this.userAttempts = new Map(); // User-based attempt tracking
    this.suspiciousIPs = new Set(); // Known suspicious IP addresses
    this.securityEvents = []; // Security event log
    this.config = {
      maxLoginAttempts: 5,
      maxMFAAttempts: 3,
      maxAPICallsPerMinute: 60,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      suspiciousActivityThreshold: 10,
      maxEventsToStore: 1000,
      ipWhitelist: new Set(['127.0.0.1', '::1']), // Local development IPs
    };
  }

  /**
   * Rate Limiting
   */

  /**
   * Check if an action is rate limited for the given identifier
   * @param {string} identifier - IP address or user ID
   * @param {string} action - Type of action (login, mfa, api)
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} Rate limit status
   */
  checkRateLimit(identifier, action, maxAttempts = 5, windowMs = 60000) {
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

      const limitData = this.rateLimits.get(key);

      // Check if currently locked
      if (limitData.lockedUntil && now < limitData.lockedUntil) {
        const remainingTime = Math.ceil((limitData.lockedUntil - now) / 1000);
        return {
          allowed: false,
          reason: 'rate_limited',
          remainingTime,
          attemptsRemaining: 0,
        };
      }

      // Reset window if expired
      if (now - limitData.windowStart > windowMs) {
        limitData.attempts = 0;
        limitData.windowStart = now;
        limitData.lockedUntil = null;
      }

      // Check if within limits
      if (limitData.attempts >= maxAttempts) {
        limitData.lockedUntil = now + this.config.lockoutDuration;
        this.logSecurityEvent('rate_limit_exceeded', {
          identifier,
          action,
          attempts: limitData.attempts,
        });

        return {
          allowed: false,
          reason: 'rate_limited',
          remainingTime: Math.ceil(this.config.lockoutDuration / 1000),
          attemptsRemaining: 0,
        };
      }

      return {
        allowed: true,
        attemptsRemaining: maxAttempts - limitData.attempts,
        windowEnd: limitData.windowStart + windowMs,
      };
    } catch (_error) {
      // console.error('Rate limit check error:', error);
      // Fail open for non-critical errors
      return { allowed: true, attemptsRemaining: 1 };
    }
  }

  /**
   * Record an attempt for rate limiting
   * @param {string} identifier - IP address or user ID
   * @param {string} action - Type of action
   * @param {boolean} success - Whether the attempt was successful
   */
  recordAttempt(identifier, action, success = false) {
    try {
      const key = `${identifier}:${action}`;

      if (!this.rateLimits.has(key)) {
        this.rateLimits.set(key, {
          attempts: 0,
          windowStart: Date.now(),
          lockedUntil: null,
        });
      }

      const limitData = this.rateLimits.get(key);
      limitData.attempts += 1;

      // Log the attempt
      this.logSecurityEvent('attempt_recorded', {
        identifier,
        action,
        success,
        totalAttempts: limitData.attempts,
      });

      // Check for suspicious activity
      if (
        !success &&
        limitData.attempts > this.config.suspiciousActivityThreshold
      ) {
        this.flagSuspiciousActivity(identifier, action);
      }

      // Reset attempts on successful authentication
      if (success && (action === 'login' || action === 'mfa')) {
        limitData.attempts = 0;
        limitData.lockedUntil = null;
      }
    } catch (_error) {
      // console.error('Error recording attempt:', error);
    }
  }

  /**
   * Fraud Detection
   */

  /**
   * Analyze authentication attempt for suspicious patterns
   * @param {Object} attemptData - Authentication attempt details
   * @returns {Object} Fraud analysis result
   */
  analyzeFraudRisk(attemptData) {
    try {
      const {
        ipAddress,
        userId,
        timestamp = Date.now(),
        geolocation,
        deviceFingerprint,
      } = attemptData;

      let riskScore = 0;
      const riskFactors = [];

      // Check for suspicious IP
      if (this.suspiciousIPs.has(ipAddress)) {
        riskScore += 30;
        riskFactors.push('suspicious_ip');
      }

      // Check for rapid attempts from same IP
      const recentAttempts = this.getRecentAttempts(ipAddress, 5 * 60 * 1000); // 5 minutes
      if (recentAttempts.length > 10) {
        riskScore += 25;
        riskFactors.push('rapid_attempts');
      }

      // Check for unusual geolocation (if available)
      if (geolocation && userId) {
        const userHistory = this.getUserLocationHistory();
        if (
          userHistory.length > 0 &&
          this.isUnusualLocation(geolocation, userHistory)
        ) {
          riskScore += 20;
          riskFactors.push('unusual_location');
        }
      }

      // Check for unusual time patterns
      if (this.isUnusualTime(timestamp)) {
        riskScore += 15;
        riskFactors.push('unusual_time');
      }

      // Check for device fingerprint changes
      if (deviceFingerprint && userId) {
        const knownDevices = this.getUserDevices();
        if (
          knownDevices.length > 0 &&
          !knownDevices.includes(deviceFingerprint)
        ) {
          riskScore += 10;
          riskFactors.push('new_device');
        }
      }

      // Determine risk level
      let riskLevel = 'low';
      if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 25) riskLevel = 'medium';

      const result = {
        riskScore,
        riskLevel,
        riskFactors,
        recommendedAction: this.getRecommendedAction(riskLevel),
        timestamp,
      };

      // Log high-risk attempts
      if (riskLevel === 'high') {
        this.logSecurityEvent('high_risk_attempt', {
          ...attemptData,
          fraudAnalysis: result,
        });
      }

      return result;
    } catch (_error) {
      // console.error('Fraud analysis error:', _error);
      return {
        riskScore: 0,
        riskLevel: 'low',
        riskFactors: [],
        recommendedAction: 'allow',
        error: _error.message,
      };
    }
  }

  /**
   * Flag suspicious activity from an identifier
   * @param {string} identifier - IP address or user ID
   * @param {string} reason - Reason for flagging
   */
  flagSuspiciousActivity(identifier, reason) {
    try {
      this.suspiciousIPs.add(identifier);

      this.logSecurityEvent('suspicious_activity_flagged', {
        identifier,
        reason,
        timestamp: Date.now(),
      });

      // Consider implementing additional actions:
      // - Send alert to security team
      // - Temporarily block the IP
      // - Require additional verification
    } catch (_error) {
      // console.error('Error flagging suspicious activity:', error);
    }
  }

  /**
   * Security Event Logging
   */

  /**
   * Log a security event
   * @param {string} eventType - Type of security event
   * @param {Object} eventData - Event details
   */
  logSecurityEvent(eventType, eventData) {
    try {
      const event = {
        id: this.generateEventId(),
        type: eventType,
        timestamp: Date.now(),
        data: eventData,
        severity: this.getEventSeverity(eventType),
      };

      this.securityEvents.push(event);

      // Maintain event log size
      if (this.securityEvents.length > this.config.maxEventsToStore) {
        this.securityEvents.shift();
      }

      // Log to console for development
      // console.log(`[SECURITY] ${eventType}:`, eventData);

      // In production, send to security monitoring system
      if (process?.env?.NODE_ENV || "development" === 'production') {
        this.sendToSecurityMonitoring(event);
      }
    } catch (_error) {
      // console.error('Error logging security event:', error);
    }
  }

  /**
   * Get recent security events
   * @param {number} limit - Maximum number of events to return
   * @param {string} eventType - Filter by event type (optional)
   * @returns {Array} Recent security events
   */
  getSecurityEvents(limit = 100, eventType = null) {
    try {
      let events = [...this.securityEvents];

      if (eventType) {
        events = events.filter((event) => event.type === eventType);
      }

      return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    } catch (_error) {
      // console.error('Error getting security events:', error);
      return [];
    }
  }

  /**
   * Security Analytics
   */

  /**
   * Get security statistics for dashboard
   * @param {number} timeframe - Time period in milliseconds
   * @returns {Object} Security statistics
   */
  getSecurityStats(timeframe = 24 * 60 * 60 * 1000) {
    // 24 hours
    try {
      const now = Date.now();
      const startTime = now - timeframe;

      const recentEvents = this.securityEvents.filter(
        (event) => event.timestamp >= startTime
      );

      // Calculate statistics
      const totalEvents = recentEvents.length;
      const eventsByType = this.groupEventsByType(recentEvents);
      const highRiskEvents = recentEvents.filter(
        (event) => event.severity === 'high'
      ).length;

      const suspiciousIPs = this.suspiciousIPs.size;
      const activeRateLimits = Array.from(this.rateLimits.values()).filter(
        (limit) => limit.lockedUntil && limit.lockedUntil > now
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
    } catch (_error) {
      // console.error('Error getting security stats:', _error);
      return {
        timeframe,
        totalEvents: 0,
        eventsByType: {},
        highRiskEvents: 0,
        suspiciousIPs: 0,
        activeRateLimits: 0,
        securityScore: 0,
        error: _error.message,
      };
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Get recent attempts for an identifier
   * @param {string} identifier - IP address or user ID
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {Array} Recent attempts
   */
  getRecentAttempts(identifier, timeWindow) {
    const now = Date.now();
    return this.securityEvents.filter(
      (event) =>
        event.data &&
        event.data.identifier === identifier &&
        event.timestamp >= now - timeWindow
    );
  }

  /**
   * Check if location is unusual for user
   * @param {Object} currentLocation - Current geolocation
   * @param {Array} locationHistory - User's location history
   * @returns {boolean} Whether location is unusual
   */
  isUnusualLocation(currentLocation, locationHistory) {
    // Implement geolocation distance checking
    // For now, simplified implementation
    return (
      locationHistory.length > 0 &&
      !locationHistory.some(
        (loc) =>
          Math.abs(loc.lat - currentLocation.lat) < 0.1 &&
          Math.abs(loc.lng - currentLocation.lng) < 0.1
      )
    );
  }

  /**
   * Check if time is unusual for user
   * @param {number} timestamp - Current timestamp
   * @returns {boolean} Whether time is unusual
   */
  isUnusualTime(timestamp) {
    const hour = new Date(timestamp).getHours();
    // Consider 2AM-6AM as unusual hours
    return hour >= 2 && hour <= 6;
  }

  /**
   * Get user's location history
   * @returns {Array} Location history
   */
  getUserLocationHistory() {
    // In real implementation, fetch from database
    return [];
  }

  /**
   * Get user's known devices
   * @returns {Array} Known device fingerprints
   */
  getUserDevices() {
    // In real implementation, fetch from database
    return [];
  }

  /**
   * Get recommended action based on risk level
   * @param {string} riskLevel - Risk level (low, medium, high)
   * @returns {string} Recommended action
   */
  getRecommendedAction(riskLevel) {
    switch (riskLevel) {
      case 'high':
        return 'require_mfa';
      case 'medium':
        return 'challenge';
      case 'low':
      default:
        return 'allow';
    }
  }

  /**
   * Generate unique event ID
   * @returns {string} Unique event ID
   */
  generateEventId() {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event severity level
   * @param {string} eventType - Type of event
   * @returns {string} Severity level
   */
  getEventSeverity(eventType) {
    const highSeverityEvents = [
      'suspicious_activity_flagged',
      'high_risk_attempt',
      'multiple_failed_logins',
      'rate_limit_exceeded',
    ];

    const mediumSeverityEvents = [
      'unusual_location',
      'new_device',
      'mfa_bypass_attempt',
    ];

    if (highSeverityEvents.includes(eventType)) return 'high';
    if (mediumSeverityEvents.includes(eventType)) return 'medium';
    return 'low';
  }

  /**
   * Group events by type for statistics
   * @param {Array} events - Security events
   * @returns {Object} Events grouped by type
   */
  groupEventsByType(events) {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Calculate overall security score
   * @param {Array} recentEvents - Recent security events
   * @returns {number} Security score (0-100)
   */
  calculateSecurityScore(recentEvents) {
    const baseScore = 100;
    const highRiskEvents = recentEvents.filter(
      (e) => e.severity === 'high'
    ).length;
    const mediumRiskEvents = recentEvents.filter(
      (e) => e.severity === 'medium'
    ).length;

    // Decrease score based on risk events
    const penalty = highRiskEvents * 10 + mediumRiskEvents * 5;

    return Math.max(0, baseScore - penalty);
  }

  /**
   * Send event to security monitoring system (production)
   * @param {Object} event - Security event
   */
  sendToSecurityMonitoring(/* event */) {
    // In production, implement integration with security monitoring
    // Examples: Splunk, ELK Stack, custom security dashboard
    // console.log('[SECURITY MONITORING]', event);
  }

  /**
   * Clear old rate limit data
   */
  cleanup() {
    try {
      const now = Date.now();
      const expiredKeys = [];

      for (const [key, data] of this.rateLimits.entries()) {
        if (data.lockedUntil && data.lockedUntil < now) {
          // Remove expired locks
          data.lockedUntil = null;
        }

        // Remove old entries
        if (now - data.windowStart > 24 * 60 * 60 * 1000) {
          // 24 hours
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach((key) => this.rateLimits.delete(key));

      // console.log(
      //   `[SECURITY] Cleaned up ${expiredKeys.length} expired rate limits`
      // );
    } catch (_error) {
      // console.error('Error during security cleanup:', error);
    }
  }

  /**
   * Reset security data (for testing)
   */
  reset() {
    this.rateLimits.clear();
    this.userAttempts.clear();
    this.suspiciousIPs.clear();
    this.securityEvents.length = 0;
  }
}

// Create and export singleton instance
const securityService = new SecurityService();

// Set up periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => securityService.cleanup(), 60 * 60 * 1000); // Hourly cleanup
}

export default securityService;
