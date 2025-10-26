/**
 * Secure Token Storage Utility
 *
 * Provides secure storage for authentication tokens across all apps.
 * Uses sessionStorage for security and localStorage for persistence options.
 */

/* global window */

class TokenStorage {
  constructor() {
    this.storageKeys = {
      accessToken: 'uni_auth_access_token',
      refreshToken: 'uni_auth_refresh_token',
      user: 'uni_auth_user_data',
      sessionId: 'uni_auth_session_id',
    };

    // Use sessionStorage by default for security
    this.storage = typeof window !== 'undefined' ? window.sessionStorage : null;
    this.persistentStorage =
      typeof window !== 'undefined' ? window.localStorage : null;
  }

  /**
   * Set authentication tokens
   */
  async setTokens({
    accessToken,
    refreshToken,
    user,
    sessionId,
    persistent = false,
  }) {
    try {
      const storage = persistent ? this.persistentStorage : this.storage;
      if (!storage) return false;

      if (accessToken) {
        storage.setItem(this.storageKeys.accessToken, accessToken);
      }

      if (refreshToken) {
        storage.setItem(this.storageKeys.refreshToken, refreshToken);
      }

      if (user) {
        storage.setItem(this.storageKeys.user, JSON.stringify(user));
      }

      if (sessionId) {
        storage.setItem(this.storageKeys.sessionId, sessionId);
      }

      return true;
    } catch (_error) {
      if (typeof console !== 'undefined') {
        // console.error('Error setting tokens:', error);
      }
      return false;
    }
  }

  /**
   * Get access token
   */
  async getAccessToken() {
    try {
      // Check sessionStorage first, then localStorage
      return (
        this.storage?.getItem(this.storageKeys.accessToken) ||
        this.persistentStorage?.getItem(this.storageKeys.accessToken) ||
        null
      );
    } catch (_error) {
      if (typeof console !== 'undefined') {
        // console.error('Error getting access token:', error);
      }
      return null;
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken() {
    try {
      return (
        this.storage?.getItem(this.storageKeys.refreshToken) ||
        this.persistentStorage?.getItem(this.storageKeys.refreshToken) ||
        null
      );
    } catch (_error) {
      if (typeof console !== 'undefined') {
        // console.error('Error getting refresh token:', error);
      }
      return null;
    }
  }

  /**
   * Get user data
   */
  async getUser() {
    try {
      const userData =
        this.storage?.getItem(this.storageKeys.user) ||
        this.persistentStorage?.getItem(this.storageKeys.user);

      return userData ? JSON.parse(userData) : null;
    } catch (_error) {
      if (typeof console !== 'undefined') {
        // console.error('Error getting user data:', error);
      }
      return null;
    }
  }

  /**
   * Get session ID
   */
  async getSessionId() {
    try {
      return (
        this.storage?.getItem(this.storageKeys.sessionId) ||
        this.persistentStorage?.getItem(this.storageKeys.sessionId) ||
        null
      );
    } catch (_error) {
      if (typeof console !== 'undefined') {
        // console.error('Error getting session ID:', error);
      }
      return null;
    }
  }

  /**
   * Clear all authentication data
   */
  async clearTokens() {
    try {
      // Clear from both storages
      Object.values(this.storageKeys).forEach((key) => {
        this.storage?.removeItem(key);
        this.persistentStorage?.removeItem(key);
      });

      return true;
    } catch (_error) {
      if (typeof console !== 'undefined') {
        // console.error('Error clearing tokens:', error);
      }
      return false;
    }
  }

  /**
   * Check if tokens exist
   */
  async hasTokens() {
    try {
      const accessToken = await this.getAccessToken();
      const user = await this.getUser();
      return !!(accessToken && user);
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get all authentication data
   */
  async getAuthData() {
    try {
      const [accessToken, refreshToken, user, sessionId] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken(),
        this.getUser(),
        this.getSessionId(),
      ]);

      return {
        accessToken,
        refreshToken,
        user,
        sessionId,
        isAuthenticated: !!(accessToken && user),
      };
    } catch (_error) {
      if (typeof console !== 'undefined') {
        // console.error('Error getting auth data:', error);
      }
      return {
        accessToken: null,
        refreshToken: null,
        user: null,
        sessionId: null,
        isAuthenticated: false,
      };
    }
  }

  /**
   * Update user data without affecting tokens
   */
  async updateUser(userData) {
    try {
      const currentUser = await this.getUser();
      if (!currentUser) return false;

      const updatedUser = { ...currentUser, ...userData };

      // Update in the same storage where it currently exists
      const storage = this.storage?.getItem(this.storageKeys.user)
        ? this.storage
        : this.persistentStorage;
      storage?.setItem(this.storageKeys.user, JSON.stringify(updatedUser));

      return true;
    } catch (_error) {
      if (typeof console !== 'undefined') {
        // console.error('Error updating user data:', error);
      }
      return false;
    }
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Store token in storage
 */
export const storeToken = (token, refreshToken = null) => {
  tokenStorage.setToken(token);
  if (refreshToken) {
    tokenStorage.setRefreshToken(refreshToken);
  }
};

/**
 * Get token from storage
 */
export const getToken = () => {
  return tokenStorage.getToken();
};

/**
 * Get refresh token from storage
 */
export const getRefreshToken = () => {
  return tokenStorage.getRefreshToken();
};

/**
 * Clear tokens from storage
 */
export const clearTokens = () => {
  tokenStorage.clearTokens();
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token = null) => {
  const tokenToCheck = token || tokenStorage.getToken();
  return tokenStorage.isTokenExpired(tokenToCheck);
};

/**
 * Get token expiry time
 */
export const getTokenExpiryTime = (token = null) => {
  const tokenToCheck = token || tokenStorage.getToken();
  if (!tokenToCheck) return null;
  try {
    // eslint-disable-next-line no-undef
    const decoded = JSON.parse(atob(tokenToCheck.split('.')[1]));
    return decoded.exp ? new Date(decoded.exp * 1000) : null;
  } catch {
    return null;
  }
};

// Export singleton instance
export const tokenStorage = new TokenStorage();
export default tokenStorage;
