/**
 * Cross-App Authentication Service
 *
 * Manages shared authentication state across all Uni-Manager applications.
 * Uses the browser storage event to synchronise authenticated state across
 * tabs, so all apps react to login/logout without polling.
 *
 * NOTE: The mock{Authenticate,RefreshToken,ValidateToken} methods are
 * development stubs. Replace them with real API calls once the production
 * auth service contract is finalised.
 */

import type { User } from "../types/auth.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventListener<T = unknown> = (payload: T) => void;

interface AuthEventMap {
  "app-registered": { appName: string; totalApps: number };
  "app-unregistered": { appName: string; totalApps: number };
  "auth-login": { user: User | null; source: string; timestamp: Date };
  "auth-logout": { source: string; timestamp: Date };
  "auth-token-refreshed": { user: User | null; timestamp: Date };
  "auth-token-refresh-failed": { error: unknown };
  "auth-state-changed": {
    user: User | null;
    isAuthenticated: boolean;
    timestamp: Date;
  };
  "auth-synced-from-storage": { user: User | null; isAuthenticated: boolean };
  "auth-error": { error: unknown; source: string };
}

interface Credentials {
  email: string;
  password: string;
}

interface StoredAuth {
  user: User;
  accessToken: string;
  refreshToken: string | null;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Simple EventEmitter (browser-compatible — no Node dependency)
// ---------------------------------------------------------------------------

class SimpleEventEmitter {
  private readonly events: Record<string, EventListener[]> = {};

  on<K extends keyof AuthEventMap>(
    event: K,
    listener: EventListener<AuthEventMap[K]>,
  ): void {
    if (!this.events[event]) this.events[event] = [];
    this.events[event]!.push(listener as EventListener);
  }

  emit<K extends keyof AuthEventMap>(event: K, payload: AuthEventMap[K]): void {
    this.events[event]?.forEach((l) => l(payload));
  }

  off<K extends keyof AuthEventMap>(
    event: K,
    listener: EventListener<AuthEventMap[K]>,
  ): void {
    if (this.events[event]) {
      this.events[event] = this.events[event]!.filter((l) => l !== listener);
    }
  }

  protected clearAllListeners(): void {
    for (const key of Object.keys(this.events)) {
      delete this.events[key];
    }
  }
}

// ---------------------------------------------------------------------------
// SharedAuthService
// ---------------------------------------------------------------------------

class SharedAuthService extends SimpleEventEmitter {
  private currentUser: User | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private readonly applications = new Set<string>();
  private readonly boundStorageHandler: (event: StorageEvent) => void;

  constructor() {
    super();
    this.boundStorageHandler = this.handleStorageChange.bind(this);
    this.init();
  }

  private init(): void {
    this.loadStoredAuth();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", this.boundStorageHandler);
    }
    void this.validateToken();
  }

  /** Registers an application with the shared auth service. Returns a handle to unregister. */
  registerApplication(appName: string): { unregister: () => void } {
    this.applications.add(appName);
    this.emit("app-registered", { appName, totalApps: this.applications.size });
    return { unregister: () => this.unregisterApplication(appName) };
  }

  unregisterApplication(appName: string): void {
    this.applications.delete(appName);
    this.emit("app-unregistered", {
      appName,
      totalApps: this.applications.size,
    });
  }

  // ---------------------------------------------------------------------------
  // Authentication methods
  // ---------------------------------------------------------------------------

  async login(
    credentials: Credentials,
    appContext = "unknown",
  ): Promise<{ success: boolean; user: User | null }> {
    try {
      const response = await this.mockAuthenticate(credentials);

      if (response.success && response.user && response.accessToken) {
        this.setAuthState(
          response.user,
          response.accessToken,
          response.refreshToken ?? null,
        );
        this.emit("auth-login", {
          user: this.currentUser,
          source: appContext,
          timestamp: new Date(),
        });
        return { success: true, user: this.currentUser };
      }

      throw new Error(response.message ?? "Authentication failed");
    } catch (error) {
      this.emit("auth-error", { error, source: appContext });
      throw error;
    }
  }

  async logout(appContext = "unknown"): Promise<{ success: boolean }> {
    try {
      this.clearAuthState();
      this.emit("auth-logout", { source: appContext, timestamp: new Date() });
      return { success: true };
    } catch (error) {
      this.emit("auth-error", { error, source: appContext });
      throw error;
    }
  }

  async refreshAuthToken(): Promise<string> {
    if (!this.refreshToken) throw new Error("No refresh token available");

    try {
      const response = await this.mockRefreshToken();

      if (response.success && response.accessToken) {
        this.setAuthState(
          this.currentUser!,
          response.accessToken,
          response.refreshToken ?? null,
        );
        this.emit("auth-token-refreshed", {
          user: this.currentUser,
          timestamp: new Date(),
        });
        return response.accessToken;
      }

      throw new Error("Token refresh failed");
    } catch (error) {
      this.emit("auth-token-refresh-failed", { error });
      void this.logout("token-refresh-failure");
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Auth state management
  // ---------------------------------------------------------------------------

  private setAuthState(
    user: User,
    accessToken: string,
    refreshToken: string | null,
  ): void {
    this.currentUser = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.storeAuth();
    this.emit("auth-state-changed", {
      user: this.currentUser,
      isAuthenticated: this.isAuthenticated(),
      timestamp: new Date(),
    });
  }

  private clearAuthState(): void {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof localStorage !== "undefined")
      localStorage.removeItem("uni_manager_auth");
    this.emit("auth-state-changed", {
      user: null,
      isAuthenticated: false,
      timestamp: new Date(),
    });
  }

  isAuthenticated(): boolean {
    return !!(this.currentUser && this.accessToken);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getAuthHeaders(): Record<string, string> {
    const base = { "Content-Type": "application/json" };
    return this.accessToken
      ? { ...base, Authorization: `Bearer ${this.accessToken}` }
      : base;
  }

  // ---------------------------------------------------------------------------
  // Storage management
  // ---------------------------------------------------------------------------

  private storeAuth(): void {
    const authData = {
      user: this.currentUser,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      timestamp: new Date().toISOString(),
    };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("uni_manager_auth", JSON.stringify(authData));
    }
  }

  private loadStoredAuth(): void {
    try {
      const stored =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("uni_manager_auth")
          : null;
      if (!stored) return;

      const authData = JSON.parse(stored) as StoredAuth;
      const tokenAge = Date.now() - new Date(authData.timestamp).getTime();

      if (tokenAge < 24 * 60 * 60 * 1000) {
        this.currentUser = authData.user;
        this.accessToken = authData.accessToken;
        this.refreshToken = authData.refreshToken;
      } else {
        this.clearAuthState();
      }
    } catch (_err) {
      this.clearAuthState();
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key !== "uni_manager_auth") return;

    if (event.newValue === null) {
      this.clearAuthState();
    } else {
      this.loadStoredAuth();
      this.emit("auth-synced-from-storage", {
        user: this.currentUser,
        isAuthenticated: this.isAuthenticated(),
      });
    }
  }

  async validateToken(): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      const isValid = await this.mockValidateToken(this.accessToken);

      if (!isValid) {
        if (this.refreshToken) {
          await this.refreshAuthToken();
        } else {
          this.clearAuthState();
        }
      }

      return this.isAuthenticated();
    } catch (_err) {
      this.clearAuthState();
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Development stubs — replace with real API calls in production
  // ---------------------------------------------------------------------------

  private async mockAuthenticate(credentials: Credentials): Promise<{
    success: boolean;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
    message?: string;
  }> {
    await new Promise<void>((resolve) => setTimeout(resolve, 500));

    if (credentials.email && credentials.password) {
      return {
        success: true,
        user: {
          id: "user-123",
          email: credentials.email,
          firstName: "John",
          lastName: "Doe",
          roles: ["user"],
        },
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
      };
    }

    return { success: false, message: "Invalid credentials" };
  }

  private async mockRefreshToken(): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
  }> {
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
    return {
      success: true,
      accessToken: `refreshed-access-token-${Date.now()}`,
      refreshToken: `refreshed-refresh-token-${Date.now()}`,
    };
  }

  private async mockValidateToken(token: string): Promise<boolean> {
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    return (
      token.startsWith("mock-access-token") ||
      token.startsWith("refreshed-access-token")
    );
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  cleanup(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", this.boundStorageHandler);
    }
    this.clearAllListeners();
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.applications.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton — one shared auth state per browser context
// ---------------------------------------------------------------------------
const sharedAuthService = new SharedAuthService();
export default sharedAuthService;
