/**
 * SessionManager Tests
 * Comprehensive test suite for session management functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SessionManager } from "../services/SessionManager";

// Mock browser globals
const mockLocalStorage = {
  storage: new Map(),
  getItem: vi.fn((key) => mockLocalStorage.storage.get(key) || null),
  setItem: vi.fn((key, value) => mockLocalStorage.storage.set(key, value)),
  removeItem: vi.fn((key) => mockLocalStorage.storage.delete(key)),
  clear: vi.fn(() => mockLocalStorage.storage.clear()),
};

const mockSessionStorage = {
  storage: new Map(),
  getItem: vi.fn((key) => mockSessionStorage.storage.get(key) || null),
  setItem: vi.fn((key, value) => mockSessionStorage.storage.set(key, value)),
  removeItem: vi.fn((key) => mockSessionStorage.storage.delete(key)),
  clear: vi.fn(() => mockSessionStorage.storage.clear()),
};

const mockBroadcastChannel = {
  addEventListener: vi.fn(),
  postMessage: vi.fn(),
  close: vi.fn(),
};

// Mock global objects
global.window = {
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  BroadcastChannel: vi.fn(() => mockBroadcastChannel),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setTimeout: vi.fn((fn, delay) => setTimeout(fn, delay)),
  clearTimeout: vi.fn((id) => clearTimeout(id)),
};

global.console = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

describe("SessionManager", () => {
  let sessionManager;
  let mockRefreshTokenFn;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    mockLocalStorage.storage.clear();
    mockSessionStorage.storage.clear();

    // Reset localStorage and sessionStorage mocks
    mockLocalStorage.getItem.mockImplementation(
      (key) => mockLocalStorage.storage.get(key) || null
    );
    mockLocalStorage.setItem.mockImplementation((key, value) =>
      mockLocalStorage.storage.set(key, value)
    );
    mockLocalStorage.removeItem.mockImplementation((key) =>
      mockLocalStorage.storage.delete(key)
    );

    mockSessionStorage.getItem.mockImplementation(
      (key) => mockSessionStorage.storage.get(key) || null
    );
    mockSessionStorage.setItem.mockImplementation((key, value) =>
      mockSessionStorage.storage.set(key, value)
    );
    mockSessionStorage.removeItem.mockImplementation((key) =>
      mockSessionStorage.storage.delete(key)
    );

    // Create session manager instance
    sessionManager = new SessionManager();

    // Mock refresh token function
    mockRefreshTokenFn = vi.fn().mockResolvedValue({
      success: true,
      token: "new_token",
      refreshToken: "new_refresh_token",
      expiresIn: 3600,
    });
  });

  afterEach(() => {
    if (sessionManager) {
      sessionManager.destroy();
    }
  });

  describe("Initialization", () => {
    it("should initialize with default options", () => {
      expect(sessionManager.options.tokenKey).toBe("auth_token");
      expect(sessionManager.options.autoRefreshInterval).toBe(5 * 60 * 1000);
      expect(sessionManager.options.warningThreshold).toBe(2 * 60 * 1000);
    });

    it("should initialize with custom options", () => {
      const customManager = new SessionManager({
        tokenKey: "custom_token",
        autoRefreshInterval: 10 * 60 * 1000,
      });

      expect(customManager.options.tokenKey).toBe("custom_token");
      expect(customManager.options.autoRefreshInterval).toBe(10 * 60 * 1000);

      customManager.destroy();
    });

    it("should set up cross-tab synchronization", () => {
      expect(window.BroadcastChannel).toHaveBeenCalledWith("auth_session");
      expect(window.addEventListener).toHaveBeenCalledWith(
        "storage",
        expect.any(Function)
      );
    });
  });

  describe("Session Management", () => {
    const mockSessionData = {
      token: "test_token",
      refreshToken: "test_refresh_token",
      user: { id: 1, name: "Test User", email: "test@example.com" },
      expiresIn: 3600,
      rememberMe: false,
    };

    it("should set session data correctly", () => {
      sessionManager.setSession(mockSessionData);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "auth_token",
        "test_token"
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "refresh_token",
        "test_refresh_token"
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "user_data",
        JSON.stringify(mockSessionData.user)
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "remember_me",
        "false"
      );
    });

    it("should use localStorage when rememberMe is true", () => {
      const rememberMeData = { ...mockSessionData, rememberMe: true };
      sessionManager.setSession(rememberMeData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "auth_token",
        "test_token"
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "remember_me",
        "true"
      );
    });

    it("should get session data correctly", () => {
      sessionManager.setSession(mockSessionData);

      expect(sessionManager.getToken()).toBe("test_token");
      expect(sessionManager.getRefreshToken()).toBe("test_refresh_token");
      expect(sessionManager.getUser()).toEqual(mockSessionData.user);
      expect(sessionManager.getRememberMe()).toBe(false);
    });

    it("should check authentication status", () => {
      // Not authenticated initially
      expect(sessionManager.isAuthenticated()).toBe(false);

      // Set session and check
      sessionManager.setSession(mockSessionData);
      expect(sessionManager.isAuthenticated()).toBe(true);
    });

    it("should detect expired tokens", () => {
      const expiredData = {
        ...mockSessionData,
        expiresIn: -3600, // Expired 1 hour ago
      };

      sessionManager.setSession(expiredData);
      expect(sessionManager.isAuthenticated()).toBe(false);
    });

    it("should clear session data", () => {
      sessionManager.setSession(mockSessionData);
      sessionManager.clearSession();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("auth_token");
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        "refresh_token"
      );
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("user_data");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("auth_token");
    });
  });

  describe("Token Refresh", () => {
    it("should refresh token successfully", async () => {
      const mockSessionData = {
        token: "old_token",
        refreshToken: "test_refresh_token",
        user: { id: 1, name: "Test User" },
        expiresIn: 3600,
      };

      sessionManager.setSession(mockSessionData);

      const result = await sessionManager.refreshToken(mockRefreshTokenFn);

      expect(mockRefreshTokenFn).toHaveBeenCalledWith("test_refresh_token");
      expect(result.success).toBe(true);
      expect(result.token).toBe("new_token");
    });

    it("should handle refresh token failure", async () => {
      const failedRefreshFn = vi.fn().mockResolvedValue({
        success: false,
        error: "Invalid refresh token",
      });

      sessionManager.setSession({
        token: "old_token",
        refreshToken: "invalid_refresh_token",
        user: { id: 1 },
        expiresIn: 3600,
      });

      await expect(
        sessionManager.refreshToken(failedRefreshFn)
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should throw error when no refresh token available", async () => {
      await expect(
        sessionManager.refreshToken(mockRefreshTokenFn)
      ).rejects.toThrow("No refresh token available");
    });
  });

  describe("Session Status", () => {
    it("should return correct session status", () => {
      const mockSessionData = {
        token: "test_token",
        refreshToken: "test_refresh_token",
        user: { id: 1, name: "Test User" },
        expiresIn: 3600,
        rememberMe: true,
      };

      sessionManager.setSession(mockSessionData);

      const status = sessionManager.getSessionStatus();

      expect(status.isAuthenticated).toBe(true);
      expect(status.user).toEqual(mockSessionData.user);
      expect(status.rememberMe).toBe(true);
      expect(status.timeUntilExpiry).toBeGreaterThan(0);
    });

    it("should detect tokens expiring soon", () => {
      const expiringSoonData = {
        token: "test_token",
        refreshToken: "test_refresh_token",
        user: { id: 1, name: "Test User" },
        expiresIn: 60, // 1 minute, less than warning threshold of 2 minutes
      };

      sessionManager.setSession(expiringSoonData);

      expect(sessionManager.isTokenExpiringSoon()).toBe(true);
    });

    it("should calculate time until expiry correctly", () => {
      const expiresIn = 1800; // 30 minutes
      const mockSessionData = {
        token: "test_token",
        refreshToken: "test_refresh_token",
        user: { id: 1, name: "Test User" },
        expiresIn,
      };

      sessionManager.setSession(mockSessionData);

      const timeUntilExpiry = sessionManager.getTimeUntilExpiry();
      expect(timeUntilExpiry).toBeGreaterThan(expiresIn - 5); // Allow for small delay
      expect(timeUntilExpiry).toBeLessThanOrEqual(expiresIn);
    });
  });

  describe("Event Handling", () => {
    it("should add and remove event listeners", () => {
      const mockCallback = vi.fn();

      const unsubscribe = sessionManager.addListener(mockCallback);
      expect(sessionManager.listeners.has(mockCallback)).toBe(true);

      unsubscribe();
      expect(sessionManager.listeners.has(mockCallback)).toBe(false);
    });

    it("should notify listeners on session events", () => {
      const mockCallback = vi.fn();
      sessionManager.addListener(mockCallback);

      sessionManager.notifyListeners("test_event", { data: "test" });

      expect(mockCallback).toHaveBeenCalledWith("test_event", { data: "test" });
    });

    it("should handle listener errors gracefully", () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error("Listener error");
      });

      sessionManager.addListener(errorCallback);

      // Should not throw
      expect(() => {
        sessionManager.notifyListeners("test_event");
      }).not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        "Session listener error:",
        expect.any(Error)
      );
    });
  });

  describe("Cross-Tab Synchronization", () => {
    it("should broadcast login events", () => {
      const mockSessionData = {
        token: "test_token",
        refreshToken: "test_refresh_token",
        user: { id: 1, name: "Test User" },
        expiresIn: 3600,
      };

      sessionManager.setSession(mockSessionData);

      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith({
        type: "LOGIN",
        data: expect.objectContaining({
          user: mockSessionData.user,
          expiryTime: expect.any(Number),
        }),
      });
    });

    it("should broadcast logout events", () => {
      sessionManager.clearSession();

      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith({
        type: "LOGOUT",
        data: null,
      });
    });

    it("should handle cross-tab login events", () => {
      const mockCallback = vi.fn();
      sessionManager.addListener(mockCallback);

      const userData = { id: 1, name: "Test User" };
      sessionManager.handleCrossTabLogin({ user: userData });

      expect(mockCallback).toHaveBeenCalledWith("cross_tab_login", {
        user: userData,
      });
    });

    it("should handle cross-tab logout events", () => {
      const mockCallback = vi.fn();
      sessionManager.addListener(mockCallback);

      sessionManager.handleCrossTabLogout();

      expect(mockCallback).toHaveBeenCalledWith("cross_tab_logout");
    });
  });

  describe("Cleanup", () => {
    it("should cleanup resources on destroy", () => {
      sessionManager.destroy();

      expect(mockBroadcastChannel.close).toHaveBeenCalled();
      expect(sessionManager.listeners.size).toBe(0);
    });

    it("should clear timers on destroy", () => {
      // Set up session with timers
      sessionManager.setSession({
        token: "test_token",
        refreshToken: "test_refresh_token",
        user: { id: 1 },
        expiresIn: 3600,
      });

      sessionManager.destroy();

      expect(sessionManager.refreshTimer).toBeNull();
      expect(sessionManager.warningTimer).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-browser environment gracefully", () => {
      // Create session manager with isBrowser = false
      const nonBrowserManager = new SessionManager();
      nonBrowserManager.isBrowser = false;

      // Should not throw errors
      expect(() => {
        nonBrowserManager.setSession({
          token: "test_token",
          refreshToken: "test_refresh_token",
          user: { id: 1 },
          expiresIn: 3600,
        });
        nonBrowserManager.getToken();
        nonBrowserManager.isAuthenticated();
        nonBrowserManager.clearSession();
      }).not.toThrow();

      nonBrowserManager.destroy();
    });

    it("should handle missing BroadcastChannel gracefully", () => {
      // Create session manager without BroadcastChannel
      const originalBroadcastChannel = window.BroadcastChannel;
      window.BroadcastChannel = undefined;

      const manager = new SessionManager();

      // Should still initialize without errors
      expect(manager.crossTabChannel).toBeNull();

      // Restore original
      window.BroadcastChannel = originalBroadcastChannel;
      manager.destroy();
    });

    it("should handle invalid JSON in stored user data", () => {
      mockSessionStorage.storage.set("user_data", "invalid-json");

      expect(sessionManager.getUser()).toBeNull();
    });

    it("should handle missing expiry data", () => {
      mockSessionStorage.storage.set("auth_token", "test_token");
      // No expiry set

      expect(sessionManager.isAuthenticated()).toBe(false);
      expect(sessionManager.getTimeUntilExpiry()).toBe(0);
    });
  });
});
