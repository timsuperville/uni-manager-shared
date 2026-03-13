/* global navigator, document, window, clearTimeout, setTimeout, Intl, crypto, TextEncoder, BroadcastChannel */
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
 */

import {
  SESSION_CONFIG,
  SESSION_STATUS,
  STORAGE_KEYS,
  AUTH_EVENTS,
} from "../types/constants.ts";
import securityService from "./securityService.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionOptions {
  storage?: "localStorage" | "sessionStorage";
  sessionTimeout?: number;
  inactivityTimeout?: number;
  warningThreshold?: number;
  tokenRefreshInterval?: number;
  maxConcurrentSessions?: number;
  autoRefreshInterval?: number;
  heartbeatInterval?: number;
}

interface SessionData {
  userId: string;
  authMethod?: string;
  deviceInfo?: Record<string, unknown>;
  ipAddress?: string;
  rememberMe?: boolean;
}

interface Session {
  sessionId: string;
  userId: string;
  deviceFingerprint: string;
  authMethod: string;
  ipAddress: string;
  deviceInfo: Record<string, unknown>;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  rememberMe: boolean;
  fraudRisk: unknown;
  status: string;
  activityCount: number;
}

interface StoredTokenRefreshResult {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

interface DeviceInfo {
  platform: string;
  language: string;
  timezone: string;
  screen: { width: number; height: number; colorDepth: number };
  [key: string]: unknown;
}

interface CrossTabMessage {
  type: "LOGIN" | "LOGOUT" | "TOKEN_REFRESH" | "ACTIVITY";
  payload: Record<string, unknown>;
}

interface EventListener {
  event: string;
  callback: (data: unknown) => void;
}

// ── SessionService ────────────────────────────────────────────────────────────

class SessionService {
  private readonly options: Required<SessionOptions>;
  private currentSession: Session | null = null;
  private readonly activeSessions = new Map<string, Session>();
  private readonly deviceSessions = new Map<string, string[]>();
  private readonly userSessions = new Map<string, string[]>();
  private readonly sessionTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private crossTabChannel: BroadcastChannel | null = null;
  private listeners: Set<EventListener> = new Set();
  private readonly isBrowser: boolean;

  constructor(options: SessionOptions = {}) {
    this.options = {
      storage: "localStorage",
      sessionTimeout: SESSION_CONFIG.TIMEOUT,
      inactivityTimeout: SESSION_CONFIG.INACTIVITY_TIMEOUT,
      warningThreshold: SESSION_CONFIG.WARNING_THRESHOLD,
      tokenRefreshInterval: SESSION_CONFIG.TOKEN_REFRESH_INTERVAL,
      maxConcurrentSessions: SESSION_CONFIG.MAX_DEVICES,
      autoRefreshInterval: 5 * 60 * 1000,
      heartbeatInterval: 60 * 1000,
      ...options,
    };

    this.isBrowser = typeof window !== "undefined";

    if (this.isBrowser) {
      this.initializeCrossTabSync();
      this.initializeAutoRefresh();
      this.setupEventListeners();
    }
  }

  // ── Session Creation & Management ───────────────────────────────────────────

  async createSession(sessionData: SessionData): Promise<Session> {
    try {
      const {
        userId,
        authMethod = "password",
        deviceInfo = {},
        ipAddress = "127.0.0.1",
        rememberMe = false,
      } = sessionData;

      const sessionId = this.generateSessionId();
      const deviceFingerprint = await this.generateDeviceFingerprint();
      const now = Date.now();

      const existingSessions = this.getUserSessions(userId);
      if (existingSessions.length >= this.options.maxConcurrentSessions) {
        await this.enforceSessionLimit(userId);
      }

      const fraudRisk = securityService.analyzeFraudRisk({
        ipAddress,
        userId,
        timestamp: now,
        deviceFingerprint,
      });

      const session: Session = {
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

      this.activeSessions.set(sessionId, session);

      if (!this.deviceSessions.has(deviceFingerprint)) {
        this.deviceSessions.set(deviceFingerprint, []);
      }
      this.deviceSessions.get(deviceFingerprint)!.push(sessionId);

      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, []);
      }
      this.userSessions.get(userId)!.push(sessionId);

      this.currentSession = session;
      this.startSessionTimeout(sessionId);

      this.emit(AUTH_EVENTS.SESSION_STARTED, session);
      return session;
    } catch (error) {
      if (import.meta.env?.DEV) console.error("[SessionService] Failed to create session:", error);
      throw error;
    }
  }

  async renewSession(): Promise<Session> {
    if (!this.currentSession) throw new Error("No active session to renew");

    const session = this.currentSession;
    session.lastActivity = Date.now();
    session.expiresAt = Date.now() + this.options.sessionTimeout;

    this.clearSessionTimeout(session.sessionId);
    this.startSessionTimeout(session.sessionId);

    this.emit(AUTH_EVENTS.SESSION_UPDATED, session);
    return session;
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  getUserSessions(userId: string): Session[] {
    return (this.userSessions.get(userId) ?? [])
      .map((id) => this.activeSessions.get(id))
      .filter((s): s is Session => s !== undefined);
  }

  async destroySession(sessionId?: string): Promise<boolean> {
    const id = sessionId ?? this.currentSession?.sessionId;
    if (!id) return false;

    const session = this.activeSessions.get(id);
    if (!session) return false;

    this.clearSessionTimeout(id);
    this.activeSessions.delete(id);

    const deviceSessions = this.deviceSessions.get(session.deviceFingerprint) ?? [];
    this.deviceSessions.set(session.deviceFingerprint, deviceSessions.filter((s) => s !== id));

    const userSessions = this.userSessions.get(session.userId) ?? [];
    this.userSessions.set(session.userId, userSessions.filter((s) => s !== id));

    if (this.currentSession?.sessionId === id) {
      this.currentSession = null;
    }

    this.emit(AUTH_EVENTS.LOGOUT, { sessionId: id });
    return true;
  }

  // ── Token Management ────────────────────────────────────────────────────────

  storeToken(token: string, refreshToken: string | null = null, expiresIn = 3600): void {
    const storage = this.getStorage();
    if (!storage) return;

    storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    if (refreshToken) storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

    const expiresAt = Date.now() + expiresIn * 1000;
    storage.setItem(STORAGE_KEYS.LAST_ACTIVITY, expiresAt.toString());

    this.startAutoRefresh(expiresIn * 1000);
  }

  getToken(): string | null {
    return this.getStorage()?.getItem(STORAGE_KEYS.AUTH_TOKEN) ?? null;
  }

  getRefreshToken(): string | null {
    return this.getStorage()?.getItem(STORAGE_KEYS.REFRESH_TOKEN) ?? null;
  }

  clearTokens(): void {
    const storage = this.getStorage();
    if (!storage) return;

    storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    storage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    this.clearAutoRefresh();
  }

  async refreshToken(refreshFn: (token: string) => Promise<StoredTokenRefreshResult>): Promise<StoredTokenRefreshResult> {
    if (!refreshFn) throw new Error("refreshFn required");

    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token available");

      const result = await refreshFn(refreshToken);
      this.storeToken(result.token, result.refreshToken ?? null, result.expiresIn ?? 3600);

      this.emit(AUTH_EVENTS.SESSION_UPDATED, { type: "token_refresh" });
      return result;
    } catch (error) {
      this.clearTokens();
      this.emit(AUTH_EVENTS.SESSION_EXPIRED, { reason: "token_refresh_failed" });
      throw error;
    }
  }

  isTokenExpired(): boolean {
    const expiresAt = this.getStorage()?.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    return !expiresAt || Date.now() > parseInt(expiresAt, 10);
  }

  // ── Device Management ───────────────────────────────────────────────────────

  async generateDeviceFingerprint(): Promise<string> {
    if (!this.isBrowser) return "unknown";

    const components = [
      navigator?.userAgent ?? "unknown",
      navigator?.language ?? "unknown",
      navigator?.platform ?? "unknown",
      new Date().getTimezoneOffset().toString(),
      window?.screen?.width ?? 0,
      window?.screen?.height ?? 0,
      window?.screen?.colorDepth ?? 0,
    ];

    const fingerprint = components.join("|");
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fingerprint));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  getDeviceInfo(additional: Record<string, unknown> = {}): DeviceInfo {
    return {
      platform: navigator?.platform ?? "Unknown",
      language: navigator?.language ?? "en-US",
      timezone: Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone ?? "Unknown",
      screen: {
        width: window?.screen?.width ?? 0,
        height: window?.screen?.height ?? 0,
        colorDepth: window?.screen?.colorDepth ?? 0,
      },
      ...additional,
    };
  }

  isDeviceTrusted(deviceFingerprint: string): boolean {
    const trustedDevices = this.getStorage()?.getItem(STORAGE_KEYS.TRUSTED_DEVICES);
    if (!trustedDevices) return false;

    try {
      const devices = JSON.parse(trustedDevices) as string[];
      return devices.includes(deviceFingerprint);
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[SessionService] isDeviceTrusted JSON parse failed:", (error as Error).message);
      return false;
    }
  }

  trustDevice(deviceFingerprint: string): void {
    const storage = this.getStorage();
    if (!storage) return;

    let trustedDevices: string[] = [];
    const existing = storage.getItem(STORAGE_KEYS.TRUSTED_DEVICES);
    if (existing) {
      try {
        trustedDevices = JSON.parse(existing) as string[];
      } catch (_err) {
        trustedDevices = [];
      }
    }

    if (!trustedDevices.includes(deviceFingerprint)) {
      trustedDevices.push(deviceFingerprint);
      storage.setItem(STORAGE_KEYS.TRUSTED_DEVICES, JSON.stringify(trustedDevices));
    }
  }

  // ── Activity Tracking ───────────────────────────────────────────────────────

  trackActivity(): void {
    if (!this.currentSession) return;
    this.currentSession.lastActivity = Date.now();
    this.currentSession.activityCount = (this.currentSession.activityCount ?? 0) + 1;
    this.resetInactivityTimeout();
  }

  getSessionStatus(): string {
    if (!this.currentSession) return SESSION_STATUS.INACTIVE;

    const now = Date.now();
    const timeRemaining = this.currentSession.expiresAt - now;

    if (timeRemaining <= 0) return SESSION_STATUS.EXPIRED;
    if (timeRemaining < this.options.warningThreshold) return SESSION_STATUS.WARNING;
    return SESSION_STATUS.ACTIVE;
  }

  getTimeRemaining(): number {
    if (!this.currentSession) return 0;
    return Math.max(0, this.currentSession.expiresAt - Date.now());
  }

  // ── Cross-Tab Synchronization ───────────────────────────────────────────────

  private initializeCrossTabSync(): void {
    if (!this.isBrowser) return;
    try {
      if (typeof window !== "undefined" && window.BroadcastChannel) {
        this.crossTabChannel = new window.BroadcastChannel("auth_session");
        this.crossTabChannel.addEventListener("message", (event: MessageEvent<CrossTabMessage>) => {
          this.handleCrossTabMessage(event.data);
        });
      } else if (typeof window !== "undefined") {
        window.addEventListener("storage", (event: StorageEvent) => {
          if (event.key === STORAGE_KEYS.AUTH_TOKEN) {
            this.handleCrossTabStorageChange();
          }
        });
      }
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[SessionService] Cross-tab sync not available:", error);
    }
  }

  private handleCrossTabMessage(data: CrossTabMessage): void {
    const { type, payload } = data;
    switch (type) {
      case "LOGIN":
        this.emit("cross-tab-login", payload);
        break;
      case "LOGOUT":
        this.clearTokens();
        this.currentSession = null;
        this.emit("cross-tab-logout", null);
        break;
      case "TOKEN_REFRESH":
        this.storeToken(
          payload["token"] as string,
          payload["refreshToken"] as string | null,
          payload["expiresIn"] as number | undefined,
        );
        break;
      case "ACTIVITY":
        this.trackActivity();
        break;
    }
  }

  private broadcastCrossTab(type: CrossTabMessage["type"], payload: Record<string, unknown> = {}): void {
    if (!this.crossTabChannel) return;
    try {
      this.crossTabChannel.postMessage({ type, payload });
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[SessionService] Cross-tab broadcast failed:", error);
    }
  }

  private handleCrossTabStorageChange(): void {
    this.emit("cross-tab-storage-change", null);
  }

  // ── Timeout Management ──────────────────────────────────────────────────────

  private startSessionTimeout(sessionId: string): void {
    if (!sessionId) return;
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const timeRemaining = session.expiresAt - Date.now();
    if (timeRemaining <= 0) {
      this.handleSessionExpired(sessionId);
      return;
    }

    const warningTime = timeRemaining - this.options.warningThreshold;
    if (warningTime > 0) {
      setTimeout(() => {
        this.emit(AUTH_EVENTS.SESSION_UPDATED, { type: "session_warning", sessionId });
      }, warningTime);
    }

    const timeout = setTimeout(() => {
      this.handleSessionExpired(sessionId);
    }, timeRemaining);

    this.sessionTimeouts.set(sessionId, timeout);
  }

  private clearSessionTimeout(sessionId: string): void {
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  private resetInactivityTimeout(): void {
    if (!this.currentSession) return;

    const now = Date.now();
    const sessionExpiry = this.currentSession.expiresAt;

    if (now + this.options.inactivityTimeout > sessionExpiry) {
      this.currentSession.expiresAt = now + this.options.sessionTimeout;
    }
  }

  private async handleSessionExpired(sessionId: string): Promise<void> {
    await this.destroySession(sessionId);
    this.clearTokens();
    this.emit(AUTH_EVENTS.SESSION_EXPIRED, { sessionId });
  }

  // ── Auto-Refresh ────────────────────────────────────────────────────────────

  private initializeAutoRefresh(): void {
    if (!this.isBrowser) return;

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) this.trackActivity();
      });
    }

    if (typeof window !== "undefined") {
      (["mousedown", "keydown", "scroll", "touchstart"] as const).forEach((event) => {
        window.addEventListener(event, () => this.trackActivity(), { passive: true });
      });
    }
  }

  private startAutoRefresh(expiresIn: number): void {
    this.clearAutoRefresh();
    const refreshTime = Math.max(60000, expiresIn - this.options.warningThreshold);
    this.refreshTimer = setTimeout(() => {
      this.emit("token-refresh-needed", null);
    }, refreshTime);
  }

  private clearAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ── Session Limit Enforcement ───────────────────────────────────────────────

  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = this.getUserSessions(userId);
    if (sessions.length === 0) return;

    const oldest = sessions.reduce((prev, curr) =>
      curr.createdAt < prev.createdAt ? curr : prev,
    );
    await this.destroySession(oldest.sessionId);
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private getStorage(): Storage | null {
    if (!this.isBrowser) return null;
    try {
      const storage =
        this.options.storage === "sessionStorage" ? window.sessionStorage : window.localStorage;
      storage.setItem("test", "test");
      storage.removeItem("test");
      return storage;
    } catch (error) {
      // Intentionally silent — storage may be unavailable (SSR, private mode, quota)
      if (import.meta.env?.DEV) console.warn("[SessionService] getStorage failed:", (error as Error).message);
      return null;
    }
  }

  private setupEventListeners(): void {
    if (!this.isBrowser) return;
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.clearAutoRefresh();
      });
    }
  }

  // ── Event Management ────────────────────────────────────────────────────────

  on(event: string, callback: (data: unknown) => void): void {
    this.listeners.add({ event, callback });
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.listeners.forEach((listener) => {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
      }
    });
  }

  private emit(event: string, data: unknown): void {
    this.listeners.forEach((listener) => {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch (error) {
          if (import.meta.env?.DEV) console.warn(`[SessionService] Error in ${event} listener:`, (error as Error).message);
        }
      }
    });
  }

  destroy(): void {
    this.clearTokens();
    this.clearAutoRefresh();
    this.activeSessions.clear();
    this.deviceSessions.clear();
    this.userSessions.clear();
    this.sessionTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.sessionTimeouts.clear();

    if (this.crossTabChannel) {
      this.crossTabChannel.close();
      this.crossTabChannel = null;
    }

    this.listeners.clear();
    this.currentSession = null;
  }

  // Expose broadcastCrossTab as public for callers that need cross-tab messaging
  broadcast(type: CrossTabMessage["type"], payload: Record<string, unknown> = {}): void {
    this.broadcastCrossTab(type, payload);
  }
}

export default new SessionService();
export { SessionService };
