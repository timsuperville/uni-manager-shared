/**
 * Secure Token Storage Utility
 *
 * Provides secure storage for authentication tokens across all apps.
 * Uses sessionStorage by default for security; localStorage is used only
 * when the user opts into persistent login.
 *
 * Each app MUST instantiate TokenStorage with its own namespace so tokens
 * never bleed between apps running on the same origin:
 *   - church app  → new TokenStorage("church")  → church_auth_access_token
 *   - admin app   → new TokenStorage("admin")   → admin_auth_access_token
 *   - home app    → new TokenStorage("home")    → home_auth_access_token
 *
 * AuthService creates the namespaced instance internally.
 * The default singleton (namespace "uni") exists only for backward
 * compatibility with legacy callers — new code must NOT use it.
 *
 * NOTE: All methods are synchronous. sessionStorage and localStorage are
 * synchronous Web APIs. Do not mark callers async solely because of storage
 * reads — only add async if the caller itself does real I/O (fetch, etc.).
 */

/* global window */

export class TokenStorage {
  /**
   * @param {string} [namespace="uni"] - App-specific prefix for storage keys.
   *   Each app MUST use its own namespace so sessions never bleed between apps
   *   running on the same origin (e.g. admin vs church on localhost).
   */
  constructor(namespace = "uni") {
    const ns = namespace;
    this.storageKeys = {
      accessToken: `${ns}_auth_access_token`,
      refreshToken: `${ns}_auth_refresh_token`,
      user: `${ns}_auth_user_data`,
      sessionId: `${ns}_auth_session_id`,
    };

    // Use sessionStorage by default for security
    this.storage = typeof window !== "undefined" ? window.sessionStorage : null;
    this.persistentStorage =
      typeof window !== "undefined" ? window.localStorage : null;
  }

  /**
   * Set authentication tokens.
   * @param {Object} params
   * @param {string} [params.accessToken]
   * @param {string} [params.refreshToken]
   * @param {Object} [params.user]
   * @param {string} [params.sessionId]
   * @param {boolean} [params.persistent=false] - Write to localStorage instead of sessionStorage
   * @returns {boolean}
   */
  setTokens({ accessToken, refreshToken, user, sessionId, persistent = false }) {
    try {
      const storage = persistent ? this.persistentStorage : this.storage;
      if (!storage) return false;

      if (accessToken) storage.setItem(this.storageKeys.accessToken, accessToken);
      if (refreshToken) storage.setItem(this.storageKeys.refreshToken, refreshToken);
      if (user) storage.setItem(this.storageKeys.user, JSON.stringify(user));
      if (sessionId) storage.setItem(this.storageKeys.sessionId, sessionId);

      return true;
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[TokenStorage] setTokens failed:", error.message);
      return false;
    }
  }

  /**
   * Get access token — checks sessionStorage first, then localStorage.
   * @returns {string|null}
   */
  getAccessToken() {
    try {
      return (
        this.storage?.getItem(this.storageKeys.accessToken) ||
        this.persistentStorage?.getItem(this.storageKeys.accessToken) ||
        null
      );
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[TokenStorage] getAccessToken failed:", error.message);
      return null;
    }
  }

  /**
   * Get refresh token — checks sessionStorage first, then localStorage.
   * @returns {string|null}
   */
  getRefreshToken() {
    try {
      return (
        this.storage?.getItem(this.storageKeys.refreshToken) ||
        this.persistentStorage?.getItem(this.storageKeys.refreshToken) ||
        null
      );
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[TokenStorage] getRefreshToken failed:", error.message);
      return null;
    }
  }

  /**
   * Get stored user data.
   * @returns {Object|null}
   */
  getUser() {
    try {
      const userData =
        this.storage?.getItem(this.storageKeys.user) ||
        this.persistentStorage?.getItem(this.storageKeys.user);

      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[TokenStorage] getUser failed:", error.message);
      return null;
    }
  }

  /**
   * Get session ID.
   * @returns {string|null}
   */
  getSessionId() {
    try {
      return (
        this.storage?.getItem(this.storageKeys.sessionId) ||
        this.persistentStorage?.getItem(this.storageKeys.sessionId) ||
        null
      );
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[TokenStorage] getSessionId failed:", error.message);
      return null;
    }
  }

  /**
   * Clear all authentication data from both sessionStorage and localStorage.
   * @returns {boolean}
   */
  clearTokens() {
    try {
      Object.values(this.storageKeys).forEach((key) => {
        this.storage?.removeItem(key);
        this.persistentStorage?.removeItem(key);
      });
      return true;
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[TokenStorage] clearTokens failed:", error.message);
      return false;
    }
  }

  /**
   * Returns true if both an access token and user record exist in storage.
   * @returns {boolean}
   */
  hasTokens() {
    try {
      return !!(this.getAccessToken() && this.getUser());
    } catch {
      return false;
    }
  }

  /**
   * Get all authentication data in one call.
   * @returns {{ accessToken: string|null, refreshToken: string|null, user: Object|null, sessionId: string|null, isAuthenticated: boolean }}
   */
  getAuthData() {
    try {
      const accessToken = this.getAccessToken();
      const refreshToken = this.getRefreshToken();
      const user = this.getUser();
      const sessionId = this.getSessionId();

      return {
        accessToken,
        refreshToken,
        user,
        sessionId,
        isAuthenticated: !!(accessToken && user),
      };
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[TokenStorage] getAuthData failed:", error.message);
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
   * Merge new fields into the stored user object without affecting tokens.
   * @param {Object} userData - Partial user fields to merge
   * @returns {boolean}
   */
  updateUser(userData) {
    try {
      const currentUser = this.getUser();
      if (!currentUser) return false;

      const updatedUser = { ...currentUser, ...userData };

      // Write back to whichever storage currently holds the user record
      const storage = this.storage?.getItem(this.storageKeys.user)
        ? this.storage
        : this.persistentStorage;
      storage?.setItem(this.storageKeys.user, JSON.stringify(updatedUser));

      return true;
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[TokenStorage] updateUser failed:", error.message);
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton instance — default namespace "uni" for backward compatibility.
// DO NOT use this singleton for app-specific token reads/writes.
// Use AuthService (which constructs a namespaced TokenStorage internally) or
// create your own: new TokenStorage("church"), new TokenStorage("admin"), etc.
// ---------------------------------------------------------------------------
export const tokenStorage = new TokenStorage();
export default tokenStorage;
