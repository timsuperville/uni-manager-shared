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

import type { User } from "../types/auth.types";
import { logger } from "../../utils/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StorageKeys {
  accessToken: string;
  refreshToken: string;
  user: string;
  sessionId: string;
}

interface SetTokensParams {
  accessToken?: string;
  refreshToken?: string;
  user?: User | Record<string, unknown>;
  sessionId?: string;
  persistent?: boolean;
}

interface AuthDataPayload {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  sessionId: string | null;
  isAuthenticated: boolean;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class TokenStorage {
  private readonly storageKeys: StorageKeys;
  private readonly storage: Storage | null;
  private readonly persistentStorage: Storage | null;

  /**
   * App-specific prefix for storage keys. Each app MUST use its own namespace
   * so sessions never bleed between apps on the same origin.
   */
  constructor(namespace = "uni") {
    this.storageKeys = {
      accessToken: `${namespace}_auth_access_token`,
      refreshToken: `${namespace}_auth_refresh_token`,
      user: `${namespace}_auth_user_data`,
      sessionId: `${namespace}_auth_session_id`,
    };
    this.storage = typeof window !== "undefined" ? window.sessionStorage : null;
    this.persistentStorage =
      typeof window !== "undefined" ? window.localStorage : null;
  }

  /** Store authentication tokens. Writes to sessionStorage unless `persistent` is true. */
  setTokens({
    accessToken,
    refreshToken,
    user,
    sessionId,
    persistent = false,
  }: SetTokensParams): boolean {
    try {
      const storage = persistent ? this.persistentStorage : this.storage;
      if (!storage) return false;

      if (accessToken) {
        storage.setItem(this.storageKeys.accessToken, accessToken);
      }
      if (refreshToken)
        storage.setItem(this.storageKeys.refreshToken, refreshToken);
      if (user) storage.setItem(this.storageKeys.user, JSON.stringify(user));
      if (sessionId) storage.setItem(this.storageKeys.sessionId, sessionId);

      return true;
    } catch (error) {
      if (import.meta.env.DEV)
        logger.warn(
          "[TokenStorage] setTokens failed:",
          (error as Error).message,
        );
      return false;
    }
  }

  /** Checks sessionStorage first, then localStorage. Returns null if not found. */
  getAccessToken(): string | null {
    try {
      return (
        this.storage?.getItem(this.storageKeys.accessToken) ||
        this.persistentStorage?.getItem(this.storageKeys.accessToken) ||
        null
      );
    } catch (error) {
      if (import.meta.env.DEV)
        logger.warn(
          "[TokenStorage] getAccessToken failed:",
          (error as Error).message,
        );
      return null;
    }
  }

  /** Checks sessionStorage first, then localStorage. Returns null if not found. */
  getRefreshToken(): string | null {
    try {
      return (
        this.storage?.getItem(this.storageKeys.refreshToken) ||
        this.persistentStorage?.getItem(this.storageKeys.refreshToken) ||
        null
      );
    } catch (error) {
      if (import.meta.env.DEV)
        logger.warn(
          "[TokenStorage] getRefreshToken failed:",
          (error as Error).message,
        );
      return null;
    }
  }

  /** Returns the parsed user object, or null if not found or parse fails. */
  getUser(): User | null {
    try {
      const raw =
        this.storage?.getItem(this.storageKeys.user) ||
        this.persistentStorage?.getItem(this.storageKeys.user);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch (error) {
      if (import.meta.env.DEV)
        logger.warn(
          "[TokenStorage] getUser failed:",
          (error as Error).message,
        );
      return null;
    }
  }

  /** Returns the session ID string, or null if not found. */
  getSessionId(): string | null {
    try {
      return (
        this.storage?.getItem(this.storageKeys.sessionId) ||
        this.persistentStorage?.getItem(this.storageKeys.sessionId) ||
        null
      );
    } catch (error) {
      if (import.meta.env.DEV)
        logger.warn(
          "[TokenStorage] getSessionId failed:",
          (error as Error).message,
        );
      return null;
    }
  }

  /** Removes all auth keys from both sessionStorage and localStorage. */
  clearTokens(): boolean {
    try {
      for (const key of Object.values(this.storageKeys)) {
        this.storage?.removeItem(key);
        this.persistentStorage?.removeItem(key);
      }
      return true;
    } catch (error) {
      if (import.meta.env.DEV)
        logger.warn(
          "[TokenStorage] clearTokens failed:",
          (error as Error).message,
        );
      return false;
    }
  }

  /** Returns true if both an access token and user record exist in storage. */
  hasTokens(): boolean {
    try {
      return !!(this.getAccessToken() && this.getUser());
    } catch (_err) {
      return false;
    }
  }

  /** Returns all auth data in a single call. */
  getAuthData(): AuthDataPayload {
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
      if (import.meta.env.DEV)
        logger.warn(
          "[TokenStorage] getAuthData failed:",
          (error as Error).message,
        );
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
   * Merges partial user data into the stored user record.
   * Writes back to whichever storage currently holds the user key.
   */
  updateUser(userData: Partial<User>): boolean {
    try {
      const currentUser = this.getUser();
      if (!currentUser) return false;

      const updatedUser: User = { ...currentUser, ...userData };
      const storage = this.storage?.getItem(this.storageKeys.user)
        ? this.storage
        : this.persistentStorage;
      storage?.setItem(this.storageKeys.user, JSON.stringify(updatedUser));

      return true;
    } catch (error) {
      if (import.meta.env.DEV)
        logger.warn(
          "[TokenStorage] updateUser failed:",
          (error as Error).message,
        );
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — "uni" namespace for backward compatibility.
// New code must use AuthService (which creates the correct namespaced instance)
// or construct directly: new TokenStorage("church"), new TokenStorage("admin")
// ---------------------------------------------------------------------------
export const tokenStorage = new TokenStorage();
export default tokenStorage;
