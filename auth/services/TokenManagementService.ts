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
import type { User } from "../types/auth.types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TokenPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
}

type RefreshCallback = () => Promise<void>;

interface TokenManagementConfig {
  tokenStorage?: TokenStorage;
  onTokenRefreshed?: () => void;
  onTokenExpired?: (error: Error) => void;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class TokenManagementService {
  private readonly config: TokenManagementConfig;
  private readonly storage: TokenStorage;
  private refreshInterval: ReturnType<typeof setInterval> | null;
  private readonly onTokenRefreshed: (() => void) | null;
  private readonly onTokenExpired: ((error: Error) => void) | null;

  /**
   * Pass new TokenStorage("church") etc. via config.tokenStorage.
   * Defaults to new TokenStorage() ("uni" namespace) — only acceptable for
   * legacy/test contexts.
   */
  constructor(config: TokenManagementConfig = {}) {
    this.config = config;
    this.storage = config.tokenStorage ?? new TokenStorage();
    this.refreshInterval = null;
    this.onTokenRefreshed = config.onTokenRefreshed ?? null;
    this.onTokenExpired = config.onTokenExpired ?? null;
  }

  // ---------------------------------------------------------------------------
  // Storage delegation — all sync (TokenStorage uses sessionStorage/localStorage)
  // ---------------------------------------------------------------------------

  /** Store authentication tokens — throws if accessToken is missing. */
  setTokens(tokens: { accessToken: string; refreshToken?: string; user?: User }): void {
    if (!tokens?.accessToken) throw new Error("Access token is required");
    this.storage.setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
  }

  /** Returns the current access token, or null. */
  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }

  /** Returns the current refresh token, or null. */
  getRefreshToken(): string | null {
    return this.storage.getRefreshToken();
  }

  /** Returns the stored user object, or null. */
  getUser(): User | null {
    return this.storage.getUser();
  }

  /** Merges partial user fields into the stored user record. */
  updateUser(user: Partial<User>): boolean {
    if (!user) throw new Error("User data is required");
    return this.storage.updateUser(user);
  }

  /** Clears all stored tokens and stops auto-refresh. */
  clearTokens(): void {
    this.storage.clearTokens();
    this.stopAutoRefresh();
  }

  /** Returns true if an access token exists in storage. */
  hasToken(): boolean {
    return this.getAccessToken() !== null;
  }

  // ---------------------------------------------------------------------------
  // JWT utilities — pure sync, no I/O
  // ---------------------------------------------------------------------------

  /**
   * Decodes the JWT payload for client-side metadata reads.
   * NOT a security validation — always verify on the backend.
   */
  decodeToken(token: string): TokenPayload | null {
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload) as TokenPayload;
    } catch {
      return null;
    }
  }

  /** Returns the token's expiration Date, or null if invalid/missing. */
  getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return null;
    return new Date(decoded.exp * 1000);
  }

  /**
   * Client-side expiry check only — the backend is the authority.
   * Returns true if the token is expired or cannot be decoded.
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration.getTime() < Date.now();
  }

  /** Returns milliseconds until expiration (0 if expired or invalid). */
  getTimeUntilExpiration(token: string): number {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return 0;
    return Math.max(0, expiration.getTime() - Date.now());
  }

  // ---------------------------------------------------------------------------
  // Auto-refresh — async because the refresh callback hits the network
  // ---------------------------------------------------------------------------

  /**
   * Starts automatic token refresh on a timer.
   * The callback is invoked when a token is within 5 minutes of expiry.
   */
  startAutoRefresh(refreshCallback: RefreshCallback, interval = 10 * 60 * 1000): void {
    if (this.refreshInterval !== null) this.stopAutoRefresh();

    this.refreshInterval = setInterval(async () => {
      try {
        const token = this.getAccessToken();
        if (!token) {
          this.stopAutoRefresh();
          return;
        }

        if (this.getTimeUntilExpiration(token) < 5 * 60 * 1000) {
          await refreshCallback(); // network I/O — correctly async
          this.onTokenRefreshed?.();
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("[TokenManagementService] Auto-refresh failed:", (error as Error).message);
        }
        this.onTokenExpired?.(error as Error);
      }
    }, interval);
  }

  /** Stops the auto-refresh timer. */
  stopAutoRefresh(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /** Alias for stopAutoRefresh — call on component unmount or logout. */
  cleanup(): void {
    this.stopAutoRefresh();
  }
}

export default TokenManagementService;
