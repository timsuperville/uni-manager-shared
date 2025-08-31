/* global fetch, window, sessionStorage, localStorage, console, URLSearchParams, setInterval, clearInterval */
/**
 * Enhanced Authentication Service
 * Integrates with OAuth providers and preserves Church app functionality
 * Supports device fingerprinting, session management, and security features
 */

import {
  generateDeviceFingerprint,
  getDeviceInfo,
  trackUserActivity,
} from "../utils/socialAuth.js";
import {
  getProviderConfig,
  generatePKCE,
  generateNonce,
  generateState,
} from "../config/oauthProviders.js";
import { getCurrentAppConfig } from "../config/appConfigs.js";

class AuthService {
  constructor() {
    this.apiEndpoint = "/api/auth";
    this.currentUser = null;
    this.sessionToken = null;
    this.deviceFingerprint = null;
    this.activityTracker = null;
  }

  /**
   * Initialize authentication service
   */
  async initialize() {
    try {
      // Generate device fingerprint for security
      this.deviceFingerprint = await generateDeviceFingerprint();

      // Check for existing session
      await this.checkExistingSession();

      // Start activity tracking
      this.startActivityTracking();

      return true;
    } catch (error) {
      console.error("Auth service initialization failed:", error);
      return false;
    }
  }

  /**
   * Check for existing authentication session
   */
  async checkExistingSession() {
    const token = this.getStoredToken();
    if (!token) return null;

    try {
      const appConfig = getCurrentAppConfig();
      const response = await fetch(`${appConfig.apiEndpoints.auth}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceFingerprint: this.deviceFingerprint,
          deviceInfo: getDeviceInfo(),
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        this.currentUser = userData.user;
        this.sessionToken = token;
        return userData.user;
      } else {
        // Invalid token, clear storage
        this.clearStoredAuth();
        return null;
      }
    } catch (error) {
      console.error("Session verification failed:", error);
      this.clearStoredAuth();
      return null;
    }
  }

  /**
   * Start OAuth authentication flow
   */
  async startOAuthFlow(providerId, options = {}) {
    const appConfig = getCurrentAppConfig();
    const providerConfig = getProviderConfig(providerId, appConfig.name);

    if (!providerConfig) {
      throw new Error(
        `OAuth provider ${providerId} not supported for ${appConfig.name}`
      );
    }

    try {
      // Generate security parameters
      const state = generateState();
      const nonce = providerConfig.security.nonce ? generateNonce() : null;
      let pkceParams = {};

      if (providerConfig.security.pkce) {
        const pkce = await generatePKCE();
        pkceParams = {
          codeChallenge: pkce.codeChallenge,
          codeChallengeMethod: "S256",
        };
        // Store code verifier for token exchange
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("pkce_verifier", pkce.codeVerifier);
        }
      }

      // Store OAuth state and provider info
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("oauth_state", state);
        sessionStorage.setItem("oauth_provider", providerId);
        sessionStorage.setItem("oauth_nonce", nonce || "");
        sessionStorage.setItem("device_fingerprint", this.deviceFingerprint);
      }

      // Build OAuth URL
      const params = new URLSearchParams({
        client_id: appConfig.oauth[providerId].clientId,
        redirect_uri:
          options.redirectUri ||
          `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
        scope: providerConfig.scope,
        response_type: providerConfig.responseType,
        state: state,
        ...pkceParams,
        ...(nonce && { nonce }),
        ...providerConfig.additionalParams,
      });

      const authUrl = `${providerConfig.authUrl}?${params.toString()}`;

      // Track authentication attempt
      await this.trackAuthEvent("oauth_start", {
        provider: providerId,
        deviceFingerprint: this.deviceFingerprint,
      });

      // Redirect to OAuth provider
      if (typeof window !== "undefined") {
        window.location.href = authUrl;
      }

      return authUrl;
    } catch (error) {
      console.error("OAuth flow initialization failed:", error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(urlParams) {
    try {
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error("Missing required OAuth parameters");
      }

      // Verify state parameter
      const storedState =
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem("oauth_state")
          : null;
      if (state !== storedState) {
        throw new Error("Invalid OAuth state parameter");
      }

      const providerId =
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem("oauth_provider")
          : null;
      const nonce =
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem("oauth_nonce")
          : null;
      const codeVerifier =
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem("pkce_verifier")
          : null;

      if (!providerId) {
        throw new Error("OAuth provider not found in session");
      }

      // Exchange code for tokens
      const tokenData = await this.exchangeCodeForToken(
        code,
        providerId,
        codeVerifier,
        nonce
      );

      // Clear OAuth session data
      this.clearOAuthSession();

      return tokenData;
    } catch (error) {
      console.error("OAuth callback handling failed:", error);
      this.clearOAuthSession();
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, providerId, codeVerifier, nonce) {
    const appConfig = getCurrentAppConfig();

    try {
      const response = await fetch(
        `${appConfig.apiEndpoints.auth}/oauth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            provider: providerId,
            codeVerifier,
            nonce,
            deviceFingerprint: this.deviceFingerprint,
            deviceInfo: getDeviceInfo(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Token exchange failed");
      }

      const tokenData = await response.json();

      // Store authentication data
      this.currentUser = tokenData.user;
      this.sessionToken = tokenData.token;
      this.storeAuth(tokenData);

      // Track successful authentication
      await this.trackAuthEvent("oauth_success", {
        provider: providerId,
        userId: tokenData.user.id,
      });

      return tokenData;
    } catch (error) {
      await this.trackAuthEvent("oauth_failure", {
        provider: providerId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Perform traditional email/password login
   */
  async login(email, password, options = {}) {
    const appConfig = getCurrentAppConfig();

    try {
      const response = await fetch(`${appConfig.apiEndpoints.auth}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          deviceFingerprint: this.deviceFingerprint,
          deviceInfo: getDeviceInfo(),
          rememberMe: options.rememberMe || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const authData = await response.json();

      // Store authentication data
      this.currentUser = authData.user;
      this.sessionToken = authData.token;
      this.storeAuth(authData);

      // Track successful login
      await this.trackAuthEvent("login_success", {
        method: "email",
        userId: authData.user.id,
      });

      return authData;
    } catch (error) {
      await this.trackAuthEvent("login_failure", {
        method: "email",
        email,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * User registration
   */
  async register(userData) {
    const appConfig = getCurrentAppConfig();

    try {
      const response = await fetch(`${appConfig.apiEndpoints.auth}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userData,
          deviceFingerprint: this.deviceFingerprint,
          deviceInfo: getDeviceInfo(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const authData = await response.json();

      // Track registration
      await this.trackAuthEvent("registration_success", {
        method: "email",
        userId: authData.user?.id,
      });

      return authData;
    } catch (error) {
      await this.trackAuthEvent("registration_failure", {
        method: "email",
        email: userData.email,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      if (this.sessionToken) {
        const appConfig = getCurrentAppConfig();
        await fetch(`${appConfig.apiEndpoints.auth}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.sessionToken}`,
          },
          body: JSON.stringify({
            deviceFingerprint: this.deviceFingerprint,
          }),
        });
      }

      // Track logout
      await this.trackAuthEvent("logout", {
        userId: this.currentUser?.id,
      });

      // Clear local auth data
      this.currentUser = null;
      this.sessionToken = null;
      this.clearStoredAuth();
      this.stopActivityTracking();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser && !!this.sessionToken;
  }

  /**
   * Get stored authentication token
   */
  getStoredToken() {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    );
  }

  /**
   * Store authentication data
   */
  storeAuth(authData) {
    if (typeof window === "undefined") return;

    const storage = authData.rememberMe ? localStorage : sessionStorage;
    storage.setItem("auth_token", authData.token);
    storage.setItem("auth_user", JSON.stringify(authData.user));
    storage.setItem("auth_expires", authData.expiresAt || "");
  }

  /**
   * Clear stored authentication data
   */
  clearStoredAuth() {
    if (typeof window === "undefined") return;

    ["localStorage", "sessionStorage"].forEach((storageType) => {
      const storage = window[storageType];
      ["auth_token", "auth_user", "auth_expires"].forEach((key) => {
        storage.removeItem(key);
      });
    });
  }

  /**
   * Clear OAuth session data
   */
  clearOAuthSession() {
    if (typeof sessionStorage === "undefined") return;

    [
      "oauth_state",
      "oauth_provider",
      "oauth_nonce",
      "pkce_verifier",
      "device_fingerprint",
    ].forEach((key) => {
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Track authentication events
   */
  async trackAuthEvent(event, data = {}) {
    try {
      await trackUserActivity(event, {
        ...data,
        timestamp: new Date().toISOString(),
        deviceFingerprint: this.deviceFingerprint,
      });
    } catch (error) {
      console.error("Auth event tracking failed:", error);
    }
  }

  /**
   * Start activity tracking
   */
  startActivityTracking() {
    if (!this.isAuthenticated() || typeof window === "undefined") return;

    this.activityTracker = setInterval(
      () => {
        this.trackAuthEvent("activity_heartbeat", {
          userId: this.currentUser?.id,
        });
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }

  /**
   * Stop activity tracking
   */
  stopActivityTracking() {
    if (this.activityTracker) {
      clearInterval(this.activityTracker);
      this.activityTracker = null;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    if (!this.sessionToken) {
      throw new Error("No session token available");
    }

    const appConfig = getCurrentAppConfig();

    try {
      const response = await fetch(`${appConfig.apiEndpoints.auth}/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceFingerprint: this.deviceFingerprint,
        }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const authData = await response.json();
      this.sessionToken = authData.token;
      this.storeAuth(authData);

      return authData;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await this.logout();
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
