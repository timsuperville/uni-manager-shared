/**
 * Token Management Service
 *
 * Orchestrates token lifecycle: storage, validation, and auto-refresh.
 * Requires a TokenStorage instance injected via config so it always reads
 * from the correct app-namespaced keys.
 *
 * NOTE: Storage reads/writes are synchronous (TokenStorage uses Web Storage).
 * Methods here are sync unless they do real async I/O (e.g. the auto-refresh
 * callback, which invokes a network request).
 */

import { TokenStorage } from "../utils/TokenStorage.js";

export class TokenManagementService {
  /**
   * @param {Object} config
   * @param {TokenStorage} [config.tokenStorage] - Namespaced storage instance.
   *   Pass new TokenStorage("church") etc. Defaults to new TokenStorage() ("uni"
   *   namespace) — only acceptable for legacy/test contexts.
   * @param {Function} [config.onTokenRefreshed]
   * @param {Function} [config.onTokenExpired]
   */
  constructor(config = {}) {
    this.config = config;
    this.storage = config.tokenStorage ?? new TokenStorage();
    this.refreshInterval = null;
    this.onTokenRefreshed = config.onTokenRefreshed || null;
    this.onTokenExpired = config.onTokenExpired || null;
  }

  // ---------------------------------------------------------------------------
  // Storage delegation — all sync (TokenStorage uses sessionStorage/localStorage)
  // ---------------------------------------------------------------------------

  /**
   * Store authentication tokens.
   * @param {Object} tokens - { accessToken, refreshToken, user }
   */
  setTokens(tokens) {
    if (!tokens || !tokens.accessToken) {
      throw new Error("Access token is required");
    }
    this.storage.setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
  }

  /** @returns {string|null} */
  getAccessToken() {
    return this.storage.getAccessToken();
  }

  /** @returns {string|null} */
  getRefreshToken() {
    return this.storage.getRefreshToken();
  }

  /** @returns {Object|null} */
  getUser() {
    return this.storage.getUser();
  }

  /**
   * @param {Object} user - Updated user fields (merged into existing record)
   * @returns {boolean}
   */
  updateUser(user) {
    if (!user) throw new Error("User data is required");
    return this.storage.updateUser(user);
  }

  /** Clear all stored tokens and stop auto-refresh. */
  clearTokens() {
    this.storage.clearTokens();
    this.stopAutoRefresh();
  }

  /** @returns {boolean} */
  hasToken() {
    return !!this.getAccessToken();
  }

  // ---------------------------------------------------------------------------
  // JWT utilities — pure sync, no I/O
  // ---------------------------------------------------------------------------

  /**
   * Decode JWT token payload (client-side metadata only — NOT for validation).
   * @param {string} token
   * @returns {Object|null}
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
    } catch {
      return null;
    }
  }

  /**
   * @param {string} token
   * @returns {Date|null}
   */
  getTokenExpiration(token) {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return null;
    return new Date(decoded.exp * 1000);
  }

  /**
   * Client-side expiry check only — backend is the authority.
   * @param {string} token
   * @returns {boolean}
   */
  isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration.getTime() < Date.now();
  }

  /**
   * @param {string} token
   * @returns {number} Milliseconds until expiration (0 if expired/invalid)
   */
  getTimeUntilExpiration(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return 0;
    return Math.max(0, expiration.getTime() - Date.now());
  }

  // ---------------------------------------------------------------------------
  // Auto-refresh — async because the refresh callback hits the network
  // ---------------------------------------------------------------------------

  /**
   * Start automatic token refresh.
   * @param {Function} refreshCallback - Async function that refreshes the token via network
   * @param {number} interval - Refresh interval in ms (default: 10 minutes)
   */
  startAutoRefresh(refreshCallback, interval = 10 * 60 * 1000) {
    if (this.refreshInterval) this.stopAutoRefresh();

    this.refreshInterval = setInterval(async () => {
      try {
        const token = this.getAccessToken();
        if (!token) {
          this.stopAutoRefresh();
          return;
        }

        // Refresh if token expires in less than 5 minutes
        if (this.getTimeUntilExpiration(token) < 5 * 60 * 1000) {
          await refreshCallback(); // network I/O — correctly async
          this.onTokenRefreshed?.();
        }
      } catch (error) {
        if (import.meta.env?.DEV) console.warn("[TokenManagementService] Auto-refresh failed:", error.message);
        this.onTokenExpired?.(error);
      }
    }, interval);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  cleanup() {
    this.stopAutoRefresh();
  }
}

export default TokenManagementService;
