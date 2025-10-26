/**
 * Unified Session Service
 *
 * Consolidates all session management concerns into a single service:
 * - Token management (storage, refresh, validation)
 * - Session lifecycle (creation, renewal, expiration)
 * - Device fingerprinting and recognition
 * - Cross-tab synchronization
 * - Activity tracking and monitoring
 * - Suspicious activity detection
 * - Session analytics
 *
 * @module SessionService
 */

/* global navigator, document, window, clearTimeout, setTimeout, Intl, console, crypto, TextEncoder */

import { SESSION_CONFIG, SESSION_STATUS, STORAGE_KEYS, AUTH_EVENTS } from '../types/constants.js';
import securityService from './securityService.js';

/**
 * SessionService: Unified session management
 *
 * @class
 * @example
 * const sessionService = new SessionService();
 * const session = await sessionService.createSession({ userId: '123' });
 * sessionService.refreshToken();
 * sessionService.destroySession();
 */
class SessionService {
  /**
   * @param {Object} options - Configuration options
   * @param {string} [options.storage='localStorage'] - Storage mechanism
   * @param {number} [options.sessionTimeout=1800000] - Session timeout (ms)
   * @param {number} [options.inactivityTimeout=900000] - Inactivity timeout (ms)
   */
  constructor(options = {}) {
    this.options = {
      storage: 'localStorage',
      sessionTimeout: SESSION_CONFIG.TIMEOUT,
      inactivityTimeout: SESSION_CONFIG.INACTIVITY_TIMEOUT,
      warningThreshold: SESSION_CONFIG.WARNING_THRESHOLD,
      tokenRefreshInterval: SESSION_CONFIG.TOKEN_REFRESH_INTERVAL,
      maxConcurrentSessions: SESSION_CONFIG.MAX_DEVICES,
      autoRefreshInterval: 5 * 60 * 1000,
      heartbeatInterval: 60 * 1000,
      ...options,
    };

    // Session state
    this.currentSession = null;
    this.activeSessions = new Map();
    this.deviceSessions = new Map();
    this.userSessions = new Map();
    this.sessionTimeouts = new Map();

    // Token management
    this.refreshTimer = null;
    this.warningTimer = null;
    this.heartbeatInterval = null;

    // Event listeners
    this.listeners = new Set();
    this.crossTabChannel = null;

    // Browser detection
    this.isBrowser = typeof window !== 'undefined';

    if (this.isBrowser) {
      this.initializeCrossTabSync();
      this.initializeAutoRefresh();
      this.setupEventListeners();
    }
  }

  // ==================== SESSION CREATION & MANAGEMENT ====================

  /**
   * Create a new session
   * @param {Object} sessionData - Session creation data
   * @param {string} sessionData.userId - User ID
   * @param {string} [sessionData.authMethod='password'] - Auth method used
   * @param {Object} [sessionData.deviceInfo={}] - Device information
   * @param {string} [sessionData.ipAddress] - IP address
   * @param {boolean} [sessionData.rememberMe=false] - Persist session
   * @returns {Object} Created session
   */
  async createSession(sessionData) {
    try {
      const {
        userId,
        authMethod = 'password',
        deviceInfo = {},
        ipAddress = '127.0.0.1',
        rememberMe = false,
      } = sessionData;

      const sessionId = this.generateSessionId();
      const deviceFingerprint = await this.generateDeviceFingerprint();
      const now = Date.now();

      // Check concurrent session limits
      const existingSessions = this.getUserSessions(userId);
      if (existingSessions.length >= this.options.maxConcurrentSessions) {
        await this.enforceSessionLimit(userId);
      }

      // Fraud analysis
      const fraudRisk = securityService.analyzeFraudRisk({
        ipAddress,
        userId,
        timestamp: now,
        deviceFingerprint,
      });

      const session = {
        sessionId,
        userId,
        deviceFingerprint,
        authMethod,
        ipAddress,
        deviceInfo: this.getDeviceInfo(deviceInfo),
        createdAt: now,
        lastActivity: now,
        expiresAt: now + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : this.options.sessionTimeout),
        rememberMe,
        fraudRisk,
        status: SESSION_STATUS.ACTIVE,
        activityCount: 1,
      };

      // Store session
      this.activeSessions.set(sessionId, session);
      if (!this.deviceSessions.has(deviceFingerprint)) {
        this.deviceSessions.set(deviceFingerprint, []);
      }
      this.deviceSessions.get(deviceFingerprint).push(sessionId);

      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, []);
      }
      this.userSessions.get(userId).push(sessionId);

      this.currentSession = session;
      this.startSessionTimeout(sessionId);

      this.emit(AUTH_EVENTS.SESSION_STARTED, session);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Renew current session
   * @returns {Object} Renewed session
   */
  async renewSession() {
    if (!this.currentSession) {
      throw new Error('No active session to renew');
    }

    const session = this.currentSession;
    session.lastActivity = Date.now();
    session.expiresAt = Date.now() + this.options.sessionTimeout;

    // Reset timeout
    this.clearSessionTimeout(session.sessionId);
    this.startSessionTimeout(session.sessionId);

    this.emit(AUTH_EVENTS.SESSION_UPDATED, session);
    return session;
  }

  /**
   * Get current session
   * @returns {Object|null} Current session or null
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Get all user sessions
   * @param {string} userId - User ID
   * @returns {Object[]} User's sessions
   */
  getUserSessions(userId) {
    return (this.userSessions.get(userId) || [])
      .map(id => this.activeSessions.get(id))
      .filter(Boolean);
  }

  /**
   * Destroy session
   * @param {string} [sessionId] - Session ID (current if not specified)
   * @returns {boolean} Success
   */
  async destroySession(sessionId = this.currentSession?.sessionId) {
    if (!sessionId) return false;

    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Clear timeout
    this.clearSessionTimeout(sessionId);

    // Remove from maps
    this.activeSessions.delete(sessionId);

    const deviceSessions = this.deviceSessions.get(session.deviceFingerprint) || [];
    this.deviceSessions.set(
      session.deviceFingerprint,
      deviceSessions.filter(id => id !== sessionId)
    );

    const userSessions = this.userSessions.get(session.userId) || [];
    this.userSessions.set(
      session.userId,
      userSessions.filter(id => id !== sessionId)
    );

    if (this.currentSession?.sessionId === sessionId) {
      this.currentSession = null;
    }

    this.emit(AUTH_EVENTS.LOGOUT, { sessionId });
    return true;
  }

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Store token
   * @param {string} token - Access token
   * @param {string} [refreshToken] - Refresh token
   * @param {number} [expiresIn] - Expiration in seconds
   */
  storeToken(token, refreshToken = null, expiresIn = 3600) {
    const storage = this.getStorage();
    if (!storage) return;

    storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    if (refreshToken) {
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    const expiresAt = Date.now() + expiresIn * 1000;
    storage.setItem(STORAGE_KEYS.LAST_ACTIVITY, expiresAt.toString());

    this.startAutoRefresh(expiresIn * 1000);
  }

  /**
   * Get stored token
   * @returns {string|null} Access token
   */
  getToken() {
    const storage = this.getStorage();
    return storage?.getItem(STORAGE_KEYS.AUTH_TOKEN) || null;
  }

  /**
   * Get refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    const storage = this.getStorage();
    return storage?.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
  }

  /**
   * Clear tokens
   */
  clearTokens() {
    const storage = this.getStorage();
    if (!storage) return;

    storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    storage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    this.clearAutoRefresh();
  }

  /**
   * Refresh token
   * @param {Function} refreshFn - Function to refresh token
   * @returns {Object} New token data
   */
  async refreshToken(refreshFn) {
    if (!refreshFn) {
      throw new Error('refreshFn required');
    }

    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const result = await refreshFn(refreshToken);
      this.storeToken(result.token, result.refreshToken, result.expiresIn);

      this.emit(AUTH_EVENTS.SESSION_UPDATED, { type: 'token_refresh' });
      return result;
    } catch (error) {
      this.clearTokens();
      this.emit(AUTH_EVENTS.SESSION_EXPIRED, { reason: 'token_refresh_failed' });
      throw error;
    }
  }

  /**
   * Check if token is expired
   * @returns {boolean} Is expired
   */
  isTokenExpired() {
    const storage = this.getStorage();
    const expiresAt = storage?.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    return !expiresAt || Date.now() > parseInt(expiresAt);
  }

  // ==================== DEVICE MANAGEMENT ====================

  /**
   * Generate device fingerprint
   * @returns {Promise<string>} Device fingerprint
   */
  async generateDeviceFingerprint() {
    if (!this.isBrowser) return 'unknown';

    const components = [
      navigator?.userAgent || 'unknown',
      navigator?.language || 'unknown',
      navigator?.platform || 'unknown',
      new Date().getTimezoneOffset().toString(),
      window?.screen?.width || 0,
      window?.screen?.height || 0,
      window?.screen?.colorDepth || 0,
    ];

    const fingerprint = components.join('|');
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get device info
   * @param {Object} [additional={}] - Additional device info
   * @returns {Object} Device information
   */
  getDeviceInfo(additional = {}) {
    return {
      platform: navigator?.platform || 'Unknown',
      language: navigator?.language || 'en-US',
      timezone: Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || 'Unknown',
      screen: {
        width: window?.screen?.width || 0,
        height: window?.screen?.height || 0,
        colorDepth: window?.screen?.colorDepth || 0,
      },
      ...additional,
    };
  }

  /**
   * Verify device trust
   * @param {string} deviceFingerprint - Device fingerprint
   * @returns {boolean} Is trusted
   */
  isDeviceTrusted(deviceFingerprint) {
    const storage = this.getStorage();
    const trustedDevices = storage?.getItem(STORAGE_KEYS.TRUSTED_DEVICES);
    if (!trustedDevices) return false;

    try {
      const devices = JSON.parse(trustedDevices);
      return devices.includes(deviceFingerprint);
    } catch {
      return false;
    }
  }

  /**
   * Trust device
   * @param {string} deviceFingerprint - Device fingerprint
   */
  trustDevice(deviceFingerprint) {
    const storage = this.getStorage();
    if (!storage) return;

    let trustedDevices = [];
    const existing = storage.getItem(STORAGE_KEYS.TRUSTED_DEVICES);
    if (existing) {
      try {
        trustedDevices = JSON.parse(existing);
      } catch {
        trustedDevices = [];
      }
    }

    if (!trustedDevices.includes(deviceFingerprint)) {
      trustedDevices.push(deviceFingerprint);
      storage.setItem(STORAGE_KEYS.TRUSTED_DEVICES, JSON.stringify(trustedDevices));
    }
  }

  // ==================== ACTIVITY TRACKING ====================

  /**
   * Track user activity
   */
  trackActivity() {
    if (!this.currentSession) return;

    this.currentSession.lastActivity = Date.now();
    this.currentSession.activityCount = (this.currentSession.activityCount || 0) + 1;

    // Reset inactivity timeout
    this.resetInactivityTimeout();
  }

  /**
   * Get session status
   * @returns {string} Session status
   */
  getSessionStatus() {
    if (!this.currentSession) return SESSION_STATUS.INACTIVE;

    const now = Date.now();
    const timeRemaining = this.currentSession.expiresAt - now;

    if (timeRemaining <= 0) {
      return SESSION_STATUS.EXPIRED;
    }

    if (timeRemaining < this.options.warningThreshold) {
      return SESSION_STATUS.WARNING;
    }

    return SESSION_STATUS.ACTIVE;
  }

  /**
   * Get time remaining (ms)
   * @returns {number} Milliseconds until expiration
   */
  getTimeRemaining() {
    if (!this.currentSession) return 0;
    return Math.max(0, this.currentSession.expiresAt - Date.now());
  }

  // ==================== CROSS-TAB SYNCHRONIZATION ====================

  /**
   * Initialize cross-tab synchronization
   */
  initializeCrossTabSync() {
    if (!this.isBrowser) return;

    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        this.crossTabChannel = new window.BroadcastChannel('auth_session');
        this.crossTabChannel.addEventListener('message', (event) => {
          this.handleCrossTabMessage(event.data);
        });
      } else if (typeof window !== 'undefined') {
        // Fallback: listen to storage events
        window.addEventListener('storage', (event) => {
          if (event.key === STORAGE_KEYS.AUTH_TOKEN) {
            this.handleCrossTabStorageChange();
          }
        });
      }
    } catch (error) {
      console.warn('Cross-tab sync not available:', error);
    }
  }

  /**
   * Handle cross-tab message
   * @private
   */
  handleCrossTabMessage(data) {
    const { type, payload } = data;

    switch (type) {
      case 'LOGIN':
        this.handleCrossTabLogin(payload);
        break;
      case 'LOGOUT':
        this.handleCrossTabLogout();
        break;
      case 'TOKEN_REFRESH':
        this.handleCrossTabTokenRefresh(payload);
        break;
      case 'ACTIVITY':
        this.trackActivity();
        break;
    }
  }

  /**
   * Broadcast cross-tab message
   * @private
   */
  broadcastCrossTab(type, payload = {}) {
    if (!this.crossTabChannel) return;

    try {
      this.crossTabChannel.postMessage({ type, payload });
    } catch (error) {
      console.warn('Cross-tab broadcast failed:', error);
    }
  }

  /**
   * Handle login from another tab
   * @private
   */
  handleCrossTabLogin(sessionData) {
    this.emit('cross-tab-login', sessionData);
  }

  /**
   * Handle logout from another tab
   * @private
   */
  handleCrossTabLogout() {
    this.clearTokens();
    this.currentSession = null;
    this.emit('cross-tab-logout', null);
  }

  /**
   * Handle token refresh from another tab
   * @private
   */
  handleCrossTabTokenRefresh(tokenData) {
    this.storeToken(tokenData.token, tokenData.refreshToken, tokenData.expiresIn);
  }

  /**
   * Handle storage change from another tab
   * @private
   */
  handleCrossTabStorageChange() {
    // Re-sync with storage
    this.emit('cross-tab-storage-change', null);
  }

  // ==================== TIMEOUT MANAGEMENT ====================

  /**
   * Start session timeout
   * @private
   */
  startSessionTimeout(sessionId) {
    if (!sessionId) return;

    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const timeRemaining = session.expiresAt - Date.now();
    if (timeRemaining <= 0) {
      this.handleSessionExpired(sessionId);
      return;
    }

    // Set warning timer
    const warningTime = timeRemaining - this.options.warningThreshold;
    if (warningTime > 0) {
      setTimeout(() => {
        this.emit(AUTH_EVENTS.SESSION_UPDATED, { type: 'session_warning', sessionId });
      }, warningTime);
    }

    // Set expiration timer
    const timeout = setTimeout(() => {
      this.handleSessionExpired(sessionId);
    }, timeRemaining);

    this.sessionTimeouts.set(sessionId, timeout);
  }

  /**
   * Clear session timeout
   * @private
   */
  clearSessionTimeout(sessionId) {
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  /**
   * Reset inactivity timeout
   * @private
   */
  resetInactivityTimeout() {
    if (!this.currentSession) return;

    const now = Date.now();
    const sessionExpiry = this.currentSession.expiresAt;

    if (now + this.options.inactivityTimeout > sessionExpiry) {
      // Extend session expiration
      this.currentSession.expiresAt = now + this.options.sessionTimeout;
    }
  }

  /**
   * Handle session expiration
   * @private
   */
  async handleSessionExpired(sessionId) {
    await this.destroySession(sessionId);
    this.clearTokens();
    this.emit(AUTH_EVENTS.SESSION_EXPIRED, { sessionId });
  }

  // ==================== AUTO-REFRESH ====================

  /**
   * Initialize auto-refresh
   * @private
   */
  initializeAutoRefresh() {
    if (!this.isBrowser) return;

    // Listen for page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.trackActivity();
        }
      });
    }

    // Listen for user activity
    if (typeof window !== 'undefined') {
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, () => this.trackActivity(), { passive: true });
      });
    }
  }

  /**
   * Start auto-refresh
   * @private
   */
  startAutoRefresh(expiresIn) {
    this.clearAutoRefresh();

    // Refresh before expiration
    const refreshTime = Math.max(60000, expiresIn - this.options.warningThreshold);
    this.refreshTimer = setTimeout(() => {
      this.emit('token-refresh-needed', null);
    }, refreshTime);
  }

  /**
   * Clear auto-refresh
   * @private
   */
  clearAutoRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ==================== SESSION LIMIT ENFORCEMENT ====================

  /**
   * Enforce concurrent session limit
   * @private
   */
  async enforceSessionLimit(userId) {
    const sessions = this.getUserSessions(userId);
    if (sessions.length === 0) return;

    // Remove oldest session
    const oldest = sessions.reduce((prev, curr) =>
      curr.createdAt < prev.createdAt ? curr : prev
    );

    await this.destroySession(oldest.sessionId);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate session ID
   * @private
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get storage object
   * @private
   */
  getStorage() {
    if (!this.isBrowser) return null;

    try {
      const storage =
        this.options.storage === 'sessionStorage'
          ? window.sessionStorage
          : window.localStorage;

      // Test storage access
      storage.setItem('test', 'test');
      storage.removeItem('test');
      return storage;
    } catch {
      return null;
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    if (!this.isBrowser) return;

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clearAutoRefresh();
      });
    }
  }

  // ==================== EVENT MANAGEMENT ====================

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners) this.listeners = new Set();
    this.listeners.add({ event, callback });
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners) return;
    this.listeners.forEach(listener => {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
      }
    });
  }

  /**
   * Emit event
   * @private
   */
  emit(event, data) {
    if (!this.listeners) return;
    this.listeners.forEach(listener => {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    this.clearTokens();
    this.clearAutoRefresh();
    this.activeSessions.clear();
    this.deviceSessions.clear();
    this.userSessions.clear();
    this.sessionTimeouts.forEach(timeout => clearTimeout(timeout));
    this.sessionTimeouts.clear();

    if (this.crossTabChannel) {
      this.crossTabChannel.close();
      this.crossTabChannel = null;
    }

    this.listeners.clear();
    this.currentSession = null;
  }
}

export default new SessionService();
