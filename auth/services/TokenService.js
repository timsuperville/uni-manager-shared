/**
 * Token Service
 *
 * Handles token generation, validation, refresh, and storage.
 * Manages JWT tokens, expiration, and token lifecycle.
 *
 * @module services/TokenService
 */

/* global localStorage, console, atob */

class TokenService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Store tokens
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - Refresh token
   * @param {number} expiresIn - Token expiration in seconds
   */
  setTokens(accessToken, refreshToken, expiresIn = 3600) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;

    // Persist to localStorage
    try {
      localStorage.setItem('uni_manager_tokens', JSON.stringify({
        accessToken,
        refreshToken,
        expiresAt: this.tokenExpiry,
      }));
    } catch (err) {
      console.error('Failed to store tokens:', err);
    }
  }

  /**
   * Get current access token
   * @returns {string|null} Access token
   */
  getAccessToken() {
    if (!this.accessToken) {
      this.loadFromStorage();
    }
    return this.accessToken;
  }

  /**
   * Get current refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    if (!this.refreshToken) {
      this.loadFromStorage();
    }
    return this.refreshToken;
  }

  /**
   * Check if token is expired
   * @returns {boolean} True if token is expired
   */
  isExpired() {
    if (!this.tokenExpiry) {
      return true;
    }
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * Check if token is valid
   * @returns {boolean} True if token is valid and not expired
   */
  isValid() {
    return this.accessToken && !this.isExpired();
  }

  /**
   * Get time until expiry in milliseconds
   * @returns {number} Milliseconds until expiry
   */
  getTimeUntilExpiry() {
    if (!this.tokenExpiry) return 0;
    const timeLeft = this.tokenExpiry - Date.now();
    return timeLeft > 0 ? timeLeft : 0;
  }

  /**
   * Clear all tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    try {
      localStorage.removeItem('uni_manager_tokens');
    } catch (err) {
      console.error('Failed to clear tokens from storage:', err);
    }
  }

  /**
   * Load tokens from storage
   * @private
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('uni_manager_tokens');
      if (stored) {
        const { accessToken, refreshToken, expiresAt } = JSON.parse(stored);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = expiresAt;
      }
    } catch (err) {
      console.error('Failed to load tokens from storage:', err);
      this.clearTokens();
    }
  }

  /**
   * Decode token (basic JWT decoding)
   * @param {string} token - JWT token to decode
   * @returns {object|null} Decoded token payload
   */
  decodeToken(token) {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const decoded = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      return decoded;
    } catch (err) {
      console.error('Failed to decode token:', err);
      return null;
    }
  }

  /**
   * Get authorization headers
   * @returns {object} Headers with authorization
   */
  getAuthHeaders() {
    const token = this.getAccessToken();
    return token
      ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      : {
          'Content-Type': 'application/json',
        };
  }
}

// Create singleton instance
const tokenService = new TokenService();

export default tokenService;
