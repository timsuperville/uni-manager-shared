/**
 * Unified Authentication Service
 *
 * Provides consistent authentication functionality across all Uni-Manager apps.
 * Each app can customize endpoints and branding while using the same core logic.
 */

import { tokenStorage } from "../utils/tokenStorage.js";
import {
  validateAuthData,
  validateCredentials,
} from "../utils/authValidation.js";

class UnifiedAuthService {
  constructor(config = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || "http://localhost:5000/api",
      endpoints: {
        login: "/auth/login",
        logout: "/auth/logout",
        signup: "/auth/signup",
        forgotPassword: "/auth/forgot-password",
        resetPassword: "/auth/reset-password",
        refreshToken: "/auth/refresh-token",
        validateToken: "/auth/validate-token",
        ...config.endpoints,
      },
      appType: config.appType || "default",
      ...config,
    };
  }

  /**
   * User login
   */
  async login(credentials) {
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
        }),
      });

      if (response.success && response.accessToken) {
        // Store authentication data
        await tokenStorage.setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user,
        });

        return {
          success: true,
          user: response.user,
          session: response.session,
        };
      }

      throw new Error(response.message || "Login failed");
    } catch (error) {
      console.error(`[Auth-${this.config.appType}] Login error:`, error);
      throw error;
    }
  }

  /**
   * User logout
   */
  async logout() {
    try {
      const token = await tokenStorage.getAccessToken();

      if (token) {
        // Notify backend of logout
        await this._makeRequest("logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear local storage regardless of backend response
      await tokenStorage.clearTokens();

      return { success: true };
    } catch (error) {
      console.error(`[Auth-${this.config.appType}] Logout error:`, error);
      // Still clear local storage even if backend call fails
      await tokenStorage.clearTokens();
      return { success: true };
    }
  }

  /**
   * User signup/registration
   */
  async signup(userData) {
    try {
      const response = await this._makeRequest("signup", {
        method: "POST",
        body: JSON.stringify({
          ...userData,
          appType: this.config.appType,
        }),
      });

      if (response.success) {
        return {
          success: true,
          message: response.message,
          requiresVerification: response.requiresVerification,
          user: response.user,
        };
      }

      throw new Error(response.message || "Signup failed");
    } catch (error) {
      console.error(`[Auth-${this.config.appType}] Signup error:`, error);
      throw error;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    try {
      const response = await this._makeRequest("forgotPassword", {
        method: "POST",
        body: JSON.stringify({
          email,
          appType: this.config.appType,
        }),
      });

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error(
        `[Auth-${this.config.appType}] Forgot password error:`,
        error
      );
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await this._makeRequest("resetPassword", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword,
          appType: this.config.appType,
        }),
      });

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error(
        `[Auth-${this.config.appType}] Reset password error:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const userData = await tokenStorage.getUser();
      const token = await tokenStorage.getAccessToken();

      if (!userData || !token) {
        return null;
      }

      // Optionally validate token with backend
      if (this.config.validateTokenOnGet) {
        const isValid = await this.validateToken();
        if (!isValid) {
          await tokenStorage.clearTokens();
          return null;
        }
      }

      return userData;
    } catch (error) {
      console.error(
        `[Auth-${this.config.appType}] Get current user error:`,
        error
      );
      return null;
    }
  }

  /**
   * Validate current token
   */
  async validateToken() {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) return false;

      const response = await this._makeRequest("validateToken", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.valid === true;
    } catch (error) {
      console.error(
        `[Auth-${this.config.appType}] Token validation error:`,
        error
      );
      return false;
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
        body: JSON.stringify({ refreshToken }),
      });

      if (response.success && response.accessToken) {
        await tokenStorage.setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken || refreshToken,
          user: response.user,
        });

        return {
          success: true,
          accessToken: response.accessToken,
        };
      }

      throw new Error(response.message || "Token refresh failed");
    } catch (error) {
      console.error(
        `[Auth-${this.config.appType}] Token refresh error:`,
        error
      );
      await tokenStorage.clearTokens();
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const token = await tokenStorage.getAccessToken();
      const user = await tokenStorage.getUser();

      return !!(token && user);
    } catch (error) {
      console.error(
        `[Auth-${this.config.appType}] Authentication check error:`,
        error
      );
      return false;
    }
  }

  /**
   * Make authenticated API request
   */
  async _makeRequest(endpoint, options = {}) {
    const url = `${this.config.apiBaseUrl}${this.config.endpoints[endpoint]}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
      "X-App-Type": this.config.appType,
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }
}

export default UnifiedAuthService;
