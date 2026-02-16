/**
 * Token Management Service
 *
 * Handles token storage, retrieval, validation, and refresh operations.
 */

import { tokenStorage } from "../utils/tokenStorage.js";

export class TokenManagementService {
  constructor(config = {}) {
    this.config = config;
    this.refreshInterval = null;
    this.onTokenRefreshed = config.onTokenRefreshed || null;
    this.onTokenExpired = config.onTokenExpired || null;
  }

  /**
   * Store authentication tokens
   * @param {Object} tokens - Token object containing accessToken, refreshToken, and user
   */
  async setTokens(tokens) {
    if (!tokens || !tokens.accessToken) {
      throw new Error("Access token is required");
    }

    await tokenStorage.setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
  }

  /**
   * Get stored access token
   * @returns {Promise<string|null>} Access token or null if not found
   */
  async getAccessToken() {
    return tokenStorage.getToken();
  }

  /**
   * Get stored refresh token
   * @returns {Promise<string|null>} Refresh token or null if not found
   */
  async getRefreshToken() {
    return tokenStorage.getRefreshToken();
  }

  /**
   * Get stored user data
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUser() {
    return tokenStorage.getUser();
  }

  /**
   * Update stored user data
   * @param {Object} user - Updated user object
   */
  async updateUser(user) {
    if (!user) {
      throw new Error("User data is required");
    }
    return tokenStorage.updateUser(user);
  }

  /**
   * Clear all stored tokens and user data
   */
  async clearTokens() {
    await tokenStorage.clear();
    this.stopAutoRefresh();
  }

  /**
   * Check if token exists
   * @returns {Promise<boolean>} True if token exists
   */
  async hasToken() {
    const token = await this.getAccessToken();
    return !!token;
  }

  /**
   * Decode JWT token (client-side, for metadata only - NOT for validation)
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  decodeToken(token) {
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date|null} Expiration date or null if invalid
   */
  getTokenExpiration(token) {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return null;
    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired (client-side check only)
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration.getTime() < Date.now();
  }

  /**
   * Get time until token expires
   * @param {string} token - JWT token
   * @returns {number} Milliseconds until expiration, or 0 if expired/invalid
   */
  getTimeUntilExpiration(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return 0;
    const timeRemaining = expiration.getTime() - Date.now();
    return Math.max(0, timeRemaining);
  }

  /**
   * Start automatic token refresh
   * @param {Function} refreshCallback - Function to call to refresh the token
   * @param {number} interval - Refresh interval in milliseconds (default: 10 minutes)
   */
  startAutoRefresh(refreshCallback, interval = 10 * 60 * 1000) {
    if (this.refreshInterval) {
      this.stopAutoRefresh();
    }

    this.refreshInterval = setInterval(async () => {
      try {
        const token = await this.getAccessToken();
        if (!token) {
          this.stopAutoRefresh();
          return;
        }

        // Refresh if token expires in less than 5 minutes
        const timeUntilExpiration = this.getTimeUntilExpiration(token);
        if (timeUntilExpiration < 5 * 60 * 1000) {
          await refreshCallback();
          if (this.onTokenRefreshed) {
            this.onTokenRefreshed();
          }
        }
      } catch (error) {
        console.error("Auto-refresh failed:", error);
        if (this.onTokenExpired) {
          this.onTokenExpired(error);
        }
      }
    }, interval);
  }

  /**
   * Stop automatic token refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Cleanup - call when service is no longer needed
   */
  cleanup() {
    this.stopAutoRefresh();
  }
}

export default TokenManagementService;
