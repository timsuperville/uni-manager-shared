/**
 * Enhanced Session Manager
 * Handles token storage, refresh, validation, and cross-tab synchronization
 */

export class SessionManager {
  constructor(options = {}) {
    this.options = {
      tokenKey: "auth_token",
      refreshTokenKey: "refresh_token",
      expiryKey: "token_expiry",
      userKey: "user_data",
      rememberMeKey: "remember_me",
      autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
      warningThreshold: 2 * 60 * 1000, // 2 minutes before expiry
      storage: "localStorage", // or 'sessionStorage'
      ...options,
    };

    this.refreshTimer = null;
    this.warningTimer = null;
    this.listeners = new Set();
    this.crossTabChannel = null;
    this.isBrowser = typeof window !== "undefined";

    if (this.isBrowser) {
      this.initializeCrossTabSync();
      this.initializeAutoRefresh();
    }
  }

  /**
   * Initialize cross-tab synchronization using BroadcastChannel
   */
  initializeCrossTabSync() {
    if (!this.isBrowser) return;

    try {
      this.crossTabChannel = new window.BroadcastChannel("auth_session");

      this.crossTabChannel.addEventListener("message", (event) => {
        const { type, data } = event.data;

        switch (type) {
          case "LOGIN":
            this.handleCrossTabLogin(data);
            break;
          case "LOGOUT":
            this.handleCrossTabLogout();
            break;
          case "TOKEN_REFRESH":
            this.handleCrossTabTokenRefresh(data);
            break;
          case "SESSION_WARNING":
            this.handleCrossTabSessionWarning();
            break;
        }
      });
    } catch (error) {
      // BroadcastChannel not supported, fallback to storage events only
      console.warn("BroadcastChannel not supported, using storage events only");
    }

    // Fallback: Listen to storage events for cross-tab sync
    window.addEventListener("storage", (event) => {
      if (event.key === this.options.tokenKey) {
        if (event.newValue === null) {
          // Token was removed, trigger logout
          this.handleCrossTabLogout();
        } else if (event.oldValue !== event.newValue) {
          // Token was updated, sync session
          this.syncFromStorage();
        }
      }
    });
  }

  /**
   * Initialize automatic token refresh
   */
  initializeAutoRefresh() {
    // Check if we have a valid session on initialization
    if (this.isAuthenticated()) {
      this.scheduleRefresh();
    }
  }

  /**
   * Get storage interface (localStorage or sessionStorage)
   */
  getStorage() {
    if (!this.isBrowser) return null;

    const rememberMe = this.getRememberMe();
    return rememberMe ? window.localStorage : window.sessionStorage;
  }

  /**
   * Set authentication tokens and user data
   */
  setSession(data) {
    if (!this.isBrowser) return;

    const { token, refreshToken, user, expiresIn, rememberMe = false } = data;
    const storage = rememberMe ? window.localStorage : window.sessionStorage;

    // Calculate expiry time
    const expiryTime = Date.now() + expiresIn * 1000;

    // Store session data
    storage.setItem(this.options.tokenKey, token);
    storage.setItem(this.options.refreshTokenKey, refreshToken);
    storage.setItem(this.options.expiryKey, expiryTime.toString());
    storage.setItem(this.options.userKey, JSON.stringify(user));
    storage.setItem(this.options.rememberMeKey, rememberMe.toString());

    // Schedule automatic refresh
    this.scheduleRefresh();

    // Notify other tabs
    this.broadcastToTabs("LOGIN", { user, expiryTime });

    // Notify listeners
    this.notifyListeners("session_start", { user, token });
  }

  /**
   * Get current authentication token
   */
  getToken() {
    const storage = this.getStorage();
    return storage ? storage.getItem(this.options.tokenKey) : null;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken() {
    const storage = this.getStorage();
    return storage ? storage.getItem(this.options.refreshTokenKey) : null;
  }

  /**
   * Get current user data
   */
  getUser() {
    const storage = this.getStorage();
    if (!storage) return null;

    const userData = storage.getItem(this.options.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Get token expiry time
   */
  getExpiry() {
    const storage = this.getStorage();
    if (!storage) return null;

    const expiry = storage.getItem(this.options.expiryKey);
    return expiry ? parseInt(expiry) : null;
  }

  /**
   * Get remember me preference
   */
  getRememberMe() {
    if (!this.isBrowser) return false;
    return window.localStorage.getItem(this.options.rememberMeKey) === "true";
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    const expiry = this.getExpiry();

    if (!token || !expiry) {
      return false;
    }

    // Check if token is expired
    return Date.now() < expiry;
  }

  /**
   * Check if token is expiring soon
   */
  isTokenExpiringSoon() {
    const expiry = this.getExpiry();
    if (!expiry) return false;

    return expiry - Date.now() < this.options.warningThreshold;
  }

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiry() {
    const expiry = this.getExpiry();
    if (!expiry) return 0;

    return Math.max(0, Math.floor((expiry - Date.now()) / 1000));
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshTokenFn) {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await refreshTokenFn(refreshToken);

      if (response.success) {
        // Update session with new token
        this.updateSession({
          token: response.token,
          refreshToken: response.refreshToken || refreshToken,
          expiresIn: response.expiresIn,
        });

        // Notify other tabs
        this.broadcastToTabs("TOKEN_REFRESH", {
          token: response.token,
          expiryTime: Date.now() + response.expiresIn * 1000,
        });

        // Notify listeners
        this.notifyListeners("token_refreshed", response);

        return response;
      } else {
        throw new Error(response.error || "Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearSession();
      throw error;
    }
  }

  /**
   * Update session with new token data
   */
  updateSession(data) {
    const storage = this.getStorage();
    if (!storage) return;

    const { token, refreshToken, expiresIn } = data;

    if (token) {
      storage.setItem(this.options.tokenKey, token);
    }

    if (refreshToken) {
      storage.setItem(this.options.refreshTokenKey, refreshToken);
    }

    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      storage.setItem(this.options.expiryKey, expiryTime.toString());
    }

    // Reschedule refresh
    this.scheduleRefresh();
  }

  /**
   * Clear all session data
   */
  clearSession() {
    if (!this.isBrowser) return;

    // Clear from both storages to be safe
    [window.localStorage, window.sessionStorage].forEach((storage) => {
      storage.removeItem(this.options.tokenKey);
      storage.removeItem(this.options.refreshTokenKey);
      storage.removeItem(this.options.expiryKey);
      storage.removeItem(this.options.userKey);
    });

    // Keep rememberMe preference
    // window.localStorage.removeItem(this.options.rememberMeKey);

    // Clear timers
    this.clearTimers();

    // Notify other tabs
    this.broadcastToTabs("LOGOUT");

    // Notify listeners
    this.notifyListeners("session_end");
  }

  /**
   * Schedule automatic token refresh
   */
  scheduleRefresh() {
    if (!this.isBrowser) return;

    this.clearTimers();

    const expiry = this.getExpiry();
    if (!expiry) return;

    const timeUntilExpiry = expiry - Date.now();
    const timeUntilRefresh = timeUntilExpiry - this.options.autoRefreshInterval;
    const timeUntilWarning = timeUntilExpiry - this.options.warningThreshold;

    // Schedule warning notification
    if (timeUntilWarning > 0) {
      this.warningTimer = window.setTimeout(() => {
        this.notifyListeners("session_warning", {
          timeRemaining: this.getTimeUntilExpiry(),
        });
        this.broadcastToTabs("SESSION_WARNING");
      }, timeUntilWarning);
    }

    // Schedule automatic refresh
    if (timeUntilRefresh > 0) {
      this.refreshTimer = window.setTimeout(async () => {
        try {
          // This would be called by the AuthContext with the actual refresh function
          this.notifyListeners("auto_refresh_needed");
        } catch (error) {
          console.error("Auto refresh failed:", error);
          this.notifyListeners("session_expired");
        }
      }, timeUntilRefresh);
    }
  }

  /**
   * Clear refresh timers
   */
  clearTimers() {
    if (!this.isBrowser) return;

    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.warningTimer) {
      window.clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Add event listener for session events
   */
  addListener(callback) {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of session events
   */
  notifyListeners(event, data = null) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error("Session listener error:", error);
      }
    });
  }

  /**
   * Broadcast message to other tabs
   */
  broadcastToTabs(type, data = null) {
    if (this.crossTabChannel) {
      this.crossTabChannel.postMessage({ type, data });
    }
  }

  /**
   * Handle login event from another tab
   */
  handleCrossTabLogin(data) {
    // Sync session from storage
    this.syncFromStorage();
    this.notifyListeners("cross_tab_login", data);
  }

  /**
   * Handle logout event from another tab
   */
  handleCrossTabLogout() {
    this.clearTimers();
    this.notifyListeners("cross_tab_logout");
  }

  /**
   * Handle token refresh from another tab
   */
  handleCrossTabTokenRefresh(data) {
    this.syncFromStorage();
    this.notifyListeners("cross_tab_refresh", data);
  }

  /**
   * Handle session warning from another tab
   */
  handleCrossTabSessionWarning() {
    this.notifyListeners("cross_tab_warning");
  }

  /**
   * Sync session data from storage
   */
  syncFromStorage() {
    if (this.isAuthenticated()) {
      this.scheduleRefresh();
    } else {
      this.clearTimers();
    }
  }

  /**
   * Get session status information
   */
  getSessionStatus() {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.getUser(),
      timeUntilExpiry: this.getTimeUntilExpiry(),
      isExpiringSoon: this.isTokenExpiringSoon(),
      rememberMe: this.getRememberMe(),
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.clearTimers();

    if (this.crossTabChannel) {
      this.crossTabChannel.close();
    }

    if (this.isBrowser) {
      // Note: We don't have handleStorageChange method, so removing this
      // window.removeEventListener('storage', this.handleStorageChange);
    }

    this.listeners.clear();
  }
}
