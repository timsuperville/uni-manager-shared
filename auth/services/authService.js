/* global fetch, sessionStorage, URLSearchParams, setInterval, clearInterval */
/**
 * Consolidated Authentication Service
 *
 * Unified service that combines OAuth and traditional authentication
 * Eliminates redundancy while preserving all functionality from:
 * - authService.js (OAuth, device fingerprinting, security features)
 * - UnifiedAuthService.js (traditional auth, app-configurable endpoints)
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
import { tokenStorage } from "../utils/tokenStorage.js";
import { validateCredentials } from "../utils/authValidation.js";

class AuthService {
  constructor(config = {}) {
    // Transform apiEndpoints to endpoints for compatibility
    const endpoints = config.apiEndpoints || config.endpoints || {};

    // Convert full URLs to relative paths for _makeRequest
    const transformedEndpoints = {};
    Object.keys(endpoints).forEach((key) => {
      const url = endpoints[key];
      if (url && url.startsWith("http")) {
        // Extract path from full URL
        try {
          transformedEndpoints[key] = new globalThis.URL(url).pathname;
        } catch {
          transformedEndpoints[key] = url;
        }
      } else {
        transformedEndpoints[key] = url;
      }
    });

    // Merge app-specific config with defaults
    this.config = {
      apiBaseUrl: config.apiBaseUrl || "", // Empty string uses relative paths (proxied by Vite)
      endpoints: {
        login: "/api/v1/auth/login",
        logout: "/api/v1/auth/logout",
        signup: "/api/v1/auth/signup",
        forgotPassword: "/api/v1/auth/forgot-password",
        resetPassword: "/api/v1/auth/reset-password",
        refreshToken: "/api/v1/auth/refresh-token",
        validateToken: "/api/v1/auth/validate-token",
        verify: "/api/v1/auth/verify-token",
        ...transformedEndpoints,
      },
      appType: config.appType || "default",
      ...config,
    };

    // Core auth state
    this.apiEndpoint = this.config.endpoints.login.replace("/login", "");
    this.currentUser = null;
    this.sessionToken = null;
    this.deviceFingerprint = null;
    this.activityTracker = null;
    this.loginAttempts = new Map();
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
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
    } catch (_error) {
      // console.error('Auth service initialization failed:', error);
      return false;
    }
  }

  /**
   * Helper to safely handle API responses
   */
  async _handleResponse(response) {
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (error) {
        throw new Error("Invalid JSON response from server");
      }
    } else {
      // Handle non-JSON responses (usually 404s or 500s throwing HTML)
      // const text = await response.text();
      // throw new Error(response.statusText || 'Server error');
      // For debugging, you might log the text, but don't expose it to user
      throw new Error(
        `Server Error (${response.status}): Please try again later.`,
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          `Request failed with status ${response.status}`,
      );
    }

    return data;
  }

  /**
   * Check for existing authentication session
   */
  async checkExistingSession() {
    const token = await this.getStoredToken();
    if (!token) return null;

    try {
      const response = await this._makeRequest("verify", {
        method: "POST",
        body: JSON.stringify({
          token,
          deviceFingerprint: this.deviceFingerprint,
          deviceInfo: getDeviceInfo(),
        }),
      });

      // Explicitly check for invalid token (401/403)
      if (response.status === 401 || response.status === 403) {
        await this.clearStoredAuth();
        return null;
      }

      // If server error or network issue (response not ok but not 401/403), or if response parsing fails
      // We assume offline/temporary issue and restore session from storage
      let responseData;
      try {
        if (response.ok) {
          responseData = await this._handleResponse(response);
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      } catch (e) {
        // Fallback to offline session restoration
        // console.warn('Session verification failed, restoring from storage (Offline Mode)', e);
        const storedUser = await tokenStorage.getUser();
        if (storedUser) {
          this.currentUser = storedUser;
          this.sessionToken = token;
          return storedUser;
        }
        return null;
      }

      this.currentUser = responseData.user;
      this.sessionToken = token;

      // Update storage with fresh data to ensure persistence
      if (responseData.user) {
        tokenStorage.updateUser(responseData.user).catch(() => {
          // Silently handle storage update failure
        });
      }

      return responseData.user;
    } catch (_error) {
      // Network error (fetch failed) -> Restore from storage (Offline Mode)
      const storedUser = await tokenStorage.getUser();
      if (storedUser) {
        this.currentUser = storedUser;
        this.sessionToken = token;
        return storedUser;
      }
      return null;
    }
  }

  // ==========================================
  // TRADITIONAL EMAIL/PASSWORD AUTHENTICATION
  // ==========================================

  /**
   * Traditional email/password login
   */
  async login(credentials) {
    const { email } = credentials;

    // Check rate limiting
    if (this.isRateLimited(email)) {
      throw new Error("Too many login attempts. Please try again later.");
    }

    try {
      // Validate credentials client-side
      const validation = validateCredentials(credentials);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const response = await this._makeRequest("login", {
        method: "POST",
        body: JSON.stringify({
          ...credentials,
          appType: this.config.appType,
          deviceFingerprint: this.deviceFingerprint,
          deviceInfo: getDeviceInfo(),
        }),
      });

      // Use safe response handling
      const responseData = await this._handleResponse(response);

      if (responseData.success && responseData.accessToken) {
        // Store authentication data
        await tokenStorage.setTokens({
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken,
          user: responseData.user,
        });

        this.currentUser = responseData.user;
        this.sessionToken = responseData.accessToken;

        // Reset login attempts on successful login
        this.resetLoginAttempts(email);

        return {
          success: true,
          user: responseData.user,
          session: responseData.session,
        };
      }

      // Handle MFA required response
      if (responseData.success && responseData.requiresMFA) {
        // Reset login attempts on successful credential validation (but MFA still required)
        this.resetLoginAttempts(email);

        return {
          success: true,
          requiresMFA: true,
          userId: responseData.userId,
          tempToken: responseData.tempToken,
        };
      }

      // Record failed login attempt (should ideally be caught by error handler above)
      this.recordLoginAttempt(email);
      throw new Error(responseData.message || "Login failed");
    } catch (_error) {
      // console.error(`[Auth-${this.config.appType}] Login error:`, _error);
      this.recordLoginAttempt(email);
      throw _error;
    }
  }

  /**
   * User logout
   */
  async logout() {
    try {
      const token = await this.getStoredToken();

      if (token) {
        // Notify backend of logout
        await this._makeRequest("logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear local storage and reset state
      await this.clearStoredAuth();
      this.currentUser = null;
      this.sessionToken = null;

      // Stop activity tracking
      this.stopActivityTracking();

      return { success: true };
    } catch (_error) {
      // console.error(`[Auth-${this.config.appType}] Logout error:`, error);
      // Still clear local storage even if backend call fails
      await this.clearStoredAuth();
      this.currentUser = null;
      this.sessionToken = null;
      return { success: true };
    }
  }

  /**
   * User signup/registration
   */
  async signup(userData) {
    const response = await this._makeRequest("signup", {
      method: "POST",
      body: JSON.stringify({
        ...userData,
        appType: this.config.appType,
        deviceFingerprint: this.deviceFingerprint,
        deviceInfo: getDeviceInfo(),
      }),
    });

    const responseData = await this._handleResponse(response);

    if (responseData.success) {
      return {
        success: true,
        message: responseData.message,
        requiresVerification: responseData.requiresVerification,
        user: responseData.user,
      };
    }
    throw new Error(responseData.message || "Signup failed");
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    const response = await this._makeRequest("forgotPassword", {
      method: "POST",
      body: JSON.stringify({
        email,
        appType: this.config.appType,
      }),
    });

    const responseData = await response.json();

    return {
      success: responseData.success,
      message: responseData.message,
    };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    const response = await this._makeRequest("resetPassword", {
      method: "POST",
      body: JSON.stringify({
        token,
        newPassword,
        appType: this.config.appType,
      }),
    });

    const responseData = await response.json();

    return {
      success: responseData.success,
      message: responseData.message,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    const response = await this._makeRequest("updateProfile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.sessionToken}`,
      },
      body: JSON.stringify(profileData),
    });

    const responseData = await this._handleResponse(response);

    if (responseData.success) {
      // Update current user data
      const updatedUser = responseData.user || responseData.data;
      this.currentUser = { ...this.currentUser, ...updatedUser };
      return {
        success: true,
        user: this.currentUser,
        message: responseData.message || "Profile updated successfully",
      };
    }

    throw new Error(responseData.message || "Failed to update profile");
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(file) {
    const formData = new globalThis.FormData();
    formData.append("avatar", file);

    // Use configured endpoint or fallback
    const endpoint = this.config.endpoints.uploadAvatar
      ? this._getEndpointUrl("uploadAvatar")
      : `${this.config.apiBaseUrl}/profile/avatar`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.sessionToken}`,
      },
      body: formData,
      credentials: "include",
    });

    const responseData = await this._handleResponse(response);

    if (responseData.success) {
      // Update current user avatar
      this.currentUser = {
        ...this.currentUser,
        avatarUrl: responseData.avatarUrl,
      };
      return {
        success: true,
        avatarUrl: responseData.avatarUrl,
        message: responseData.message || "Avatar uploaded successfully",
      };
    }

    throw new Error(responseData.message || "Failed to upload avatar");
  }

  /**
   * Upload cover image
   */
  async uploadCoverImage(file) {
    const formData = new globalThis.FormData();
    formData.append("cover", file);

    // Use configured endpoint or fallback
    const endpoint = this.config.endpoints.uploadCoverImage
      ? this._getEndpointUrl("uploadCoverImage")
      : `${this.config.apiBaseUrl}/profile/cover`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.sessionToken}`,
      },
      body: formData,
      credentials: "include",
    });

    const responseData = await this._handleResponse(response);

    if (responseData.success) {
      // Update current user cover (set both fields for persistence)
      this.currentUser = {
        ...this.currentUser,
        coverImageUrl: responseData.coverImageUrl,
        coverImage: responseData.coverImageUrl, // Also set coverImage for persistence
      };
      return {
        success: true,
        coverImageUrl: responseData.coverImageUrl,
        user: responseData.user,
        message: responseData.message || "Cover image uploaded successfully",
      };
    }

    throw new Error(responseData.message || "Failed to upload cover image");
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword, newPassword) {
    // Use the standard "changePassword" key which should be in appConfigs
    const response = await this._makeRequest("changePassword", {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const responseData = await this._handleResponse(response);

    if (responseData.success) {
      return {
        success: true,
        message: responseData.message || "Password changed successfully",
      };
    }

    throw new Error(responseData.message || "Failed to change password");
  }

  // ===============================
  // OAUTH AUTHENTICATION
  // ===============================

  /**
   * Start OAuth authentication flow
   */
  async startOAuthFlow(providerId, options = {}) {
    const appConfig = getCurrentAppConfig();
    const providerConfig = getProviderConfig(providerId, appConfig.name);

    if (!providerConfig) {
      throw new Error(
        `OAuth provider ${providerId} not supported for ${appConfig.name}`,
      );
    }

    // Generate PKCE parameters for security
    const { codeVerifier, codeChallenge } = generatePKCE();
    const state = generateState();
    const nonce = generateNonce();

    // Store PKCE parameters and state
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("pkce_verifier", codeVerifier);
      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("oauth_nonce", nonce);
      sessionStorage.setItem("oauth_provider", providerId);
    }

    // Build authorization URL
    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.redirectUri,
      scope: providerConfig.scopes.join(" "),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      nonce: nonce,
      ...options.additionalParams,
    });

    const authUrl = `${providerConfig.authorizationEndpoint}?${authParams.toString()}`;

    // Track OAuth initiation
    trackUserActivity("oauth_init", {
      provider: providerId,
      app: appConfig.name,
      deviceFingerprint: this.deviceFingerprint,
    });

    return { authUrl, state };
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code, state, error = null) {
    if (error) {
      throw new Error(`OAuth error: ${error}`);
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
    const codeVerifier =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("pkce_verifier")
        : null;

    if (!providerId || !codeVerifier) {
      throw new Error("Missing OAuth session data");
    }

    // Exchange code for tokens
    const tokenResponse = await this.exchangeOAuthCode(
      providerId,
      code,
      codeVerifier,
    );

    // Store authentication data
    await tokenStorage.setTokens({
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      user: tokenResponse.user,
    });

    this.currentUser = tokenResponse.user;
    this.sessionToken = tokenResponse.accessToken;

    // Clear OAuth session data
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("pkce_verifier");
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_nonce");
      sessionStorage.removeItem("oauth_provider");
    }

    return {
      success: true,
      user: tokenResponse.user,
      provider: providerId,
    };
  }

  /**
   * Exchange OAuth authorization code for tokens
   */
  async exchangeOAuthCode(providerId, code, codeVerifier) {
    const appConfig = getCurrentAppConfig();
    const providerConfig = getProviderConfig(providerId, appConfig.name);

    const tokenParams = {
      grant_type: "authorization_code",
      client_id: providerConfig.clientId,
      code: code,
      redirect_uri: providerConfig.redirectUri,
      code_verifier: codeVerifier,
    };

    const response = await fetch(providerConfig.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams(tokenParams).toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokenData = await response.json();

    // Get user info from provider
    const userInfo = await this.getOAuthUserInfo(
      providerId,
      tokenData.access_token,
    );

    // Register user with our backend
    const authResponse = await this._makeRequest("login", {
      method: "POST",
      body: JSON.stringify({
        authType: "oauth",
        provider: providerId,
        oauthToken: tokenData.access_token,
        userInfo: userInfo,
        deviceFingerprint: this.deviceFingerprint,
        deviceInfo: getDeviceInfo(),
        appType: this.config.appType,
      }),
    });

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.success) {
      throw new Error(authData.message || "OAuth authentication failed");
    }

    return {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      user: authData.user,
    };
  }

  /**
   * Get user information from OAuth provider
   */
  async getOAuthUserInfo(providerId, accessToken) {
    const appConfig = getCurrentAppConfig();
    const providerConfig = getProviderConfig(providerId, appConfig.name);

    const response = await fetch(providerConfig.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return await response.json();
  }

  // ===============================
  // TOKEN MANAGEMENT
  // ===============================

  /**
   * Get stored authentication token
   */
  async getStoredToken() {
    try {
      return await tokenStorage.getAccessToken();
    } catch (_error) {
      // console.error('Failed to get stored token:', error);
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await this._makeRequest("refreshToken", {
        method: "POST",
        body: JSON.stringify({
          refreshToken,
          deviceFingerprint: this.deviceFingerprint,
          appType: this.config.appType,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        await tokenStorage.setTokens({
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken,
          user: responseData.user,
        });

        this.sessionToken = responseData.accessToken;
        this.currentUser = responseData.user;

        return {
          success: true,
          accessToken: responseData.accessToken,
        };
      }

      throw new Error(responseData.message || "Token refresh failed");
    } catch (_error) {
      // console.error('Token refresh failed:', _error);
      await this.clearStoredAuth();
      throw _error;
    }
  }

  /**
   * Validate current token
   */
  async isTokenValid() {
    try {
      const token = await this.getStoredToken();
      if (!token) return false;

      const response = await this._makeRequest("validateToken", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json();
      return response.ok && responseData.valid;
    } catch (_error) {
      // console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Switch current active church
   */
  async switchChurch(churchId) {
    if (!this.currentUser) throw new Error("User not authenticated");

    // Optimistic check (though backend validation is source of truth)
    if (
      this.currentUser.currentChurch &&
      this.currentUser.currentChurch.toString() === churchId
    ) {
      return { success: true, user: this.currentUser, noChange: true };
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/api/v1/church/${churchId}/select`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.sessionToken}`,
        },
      },
    );

    const responseData = await this._handleResponse(response);

    if (responseData.success) {
      // Update local state
      const updatedUser = responseData.data || responseData.user;

      // Update stored tokens/user
      await tokenStorage.updateUser(updatedUser);
      this.currentUser = updatedUser;

      return {
        success: true,
        user: updatedUser,
      };
    }
    throw new Error(responseData.message || "Failed to switch church");
  }

  /**
   * Clear stored authentication data
   */
  async clearStoredAuth() {
    try {
      await tokenStorage.clearTokens();
    } catch (_error) {
      // console.error('Failed to clear stored auth:', error);
    }
  }

  // ===============================
  // SECURITY FEATURES
  // ===============================

  /**
   * Check if user is rate limited
   */
  isRateLimited(email) {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    if (attempts.count >= this.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      return timeSinceLastAttempt < this.lockoutDuration;
    }

    return false;
  }

  /**
   * Record login attempt
   */
  recordLoginAttempt(email) {
    const attempts = this.loginAttempts.get(email) || {
      count: 0,
      lastAttempt: 0,
    };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(email, attempts);
  }

  /**
   * Reset login attempts
   */
  resetLoginAttempts(email) {
    this.loginAttempts.delete(email);
  }

  /**
   * Start activity tracking
   */
  startActivityTracking() {
    if (this.activityTracker) return;

    this.activityTracker = setInterval(() => {
      this.updateActivity();
    }, 30000); // Update every 30 seconds
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
   * Update user activity
   */
  async updateActivity() {
    if (!this.currentUser) return;

    try {
      trackUserActivity("session_active", {
        userId: this.currentUser.id,
        app: this.config.appType,
        deviceFingerprint: this.deviceFingerprint,
      });
    } catch (_error) {
      // console.error('Activity update failed:', error);
    }
  }

  /**
   * Check if session is expired
   */
  async isSessionExpired() {
    return !(await this.isTokenValid());
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.currentUser && this.sessionToken);
  }

  /**
   * Helper to get full endpoint URL, handling absolute URLs correctly
   */
  _getEndpointUrl(key) {
    const endpoint = this.config.endpoints[key];
    if (!endpoint) return null;
    // If endpoint is already absolute (from APP_CONFIGS), return as is
    if (endpoint.startsWith("http")) return endpoint;
    // Otherwise prepend base URL
    return `${this.config.apiBaseUrl}${endpoint}`;
  }

  /**
   * Make authenticated API request
   */
  async _makeRequest(endpoint, options = {}) {
    const endpointPath = this.config.endpoints[endpoint] || endpoint;
    const url = endpointPath.startsWith("http")
      ? endpointPath
      : `${this.config.apiBaseUrl}${endpointPath}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const requestOptions = {
      ...options,
      headers: defaultHeaders,
      credentials: "include",
    };

    return fetch(url, requestOptions);
  }
}

// Export singleton instance as both default and named export
const authService = new AuthService();
export default authService;
export { authService };

// Also export the class for custom configurations
export { AuthService };
