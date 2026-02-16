/**
 * Email/Password Authentication Service
 *
 * Handles traditional email/password authentication flows including
 * login, signup, password reset, and profile updates.
 */

import { validateCredentials } from "../utils/authValidation.js";
import { getDeviceInfo } from "../utils/socialAuth.js";

export class EmailPasswordAuthService {
  constructor(config = {}) {
    this.config = config;
    this.apiBaseUrl = config.apiBaseUrl;
    this.endpoints = config.endpoints;
    this.appType = config.appType || "default";
    this.deviceFingerprint = config.deviceFingerprint || null;
  }

  /**
   * Make API request helper
   * @private
   */
  async _makeRequest(endpoint, options = {}) {
    const url = `${this.apiBaseUrl}${this.endpoints[endpoint] || endpoint}`;
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    return response;
  }

  /**
   * Handle API response helper
   * @private
   */
  async _handleResponse(response) {
    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Non-JSON response handling
      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`,
        );
      }
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`,
      );
    }

    return data;
  }

  /**
   * Traditional email/password login
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {boolean} [credentials.rememberMe] - Remember user
   * @returns {Promise<Object>} Login result
   */
  async login(credentials) {
    // Validate credentials client-side
    const validation = validateCredentials(credentials);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const response = await this._makeRequest("login", {
      method: "POST",
      body: JSON.stringify({
        ...credentials,
        appType: this.appType,
        deviceFingerprint: this.deviceFingerprint,
        deviceInfo: getDeviceInfo(),
      }),
    });

    const responseData = await this._handleResponse(response);

    if (responseData.success && responseData.accessToken) {
      return {
        success: true,
        user: responseData.user,
        accessToken: responseData.accessToken,
        refreshToken: responseData.refreshToken,
        session: responseData.session,
      };
    }

    // Handle MFA required response
    if (responseData.success && responseData.requiresMFA) {
      return {
        success: true,
        requiresMFA: true,
        userId: responseData.userId,
        tempToken: responseData.tempToken,
      };
    }

    throw new Error(responseData.message || "Login failed");
  }

  /**
   * User signup/registration
   * @param {Object} userData - Signup data
   * @returns {Promise<Object>} Signup result
   */
  async signup(userData) {
    const response = await this._makeRequest("signup", {
      method: "POST",
      body: JSON.stringify({
        ...userData,
        appType: this.appType,
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
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Result
   */
  async forgotPassword(email) {
    const response = await this._makeRequest("forgotPassword", {
      method: "POST",
      body: JSON.stringify({
        email,
        appType: this.appType,
      }),
    });

    const responseData = await response.json();

    return {
      success: responseData.success,
      message: responseData.message,
    };
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result
   */
  async resetPassword(token, newPassword) {
    const response = await this._makeRequest("resetPassword", {
      method: "POST",
      body: JSON.stringify({
        token,
        newPassword,
        appType: this.appType,
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
   * @param {Object} profileData - Profile updates
   * @param {string} sessionToken - Current session token
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(profileData, sessionToken) {
    const response = await this._makeRequest("updateProfile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(profileData),
    });

    const responseData = await this._handleResponse(response);

    if (responseData.success) {
      return {
        success: true,
        user: responseData.user || responseData.data,
      };
    }

    throw new Error(responseData.message || "Profile update failed");
  }

  /**
   * Verify session token
   * @param {string} token - Session token
   * @returns {Promise<Object|null>} User data or null
   */
  async verifyToken(token) {
    try {
      const response = await this._makeRequest("verify", {
        method: "POST",
        body: JSON.stringify({
          token,
          deviceFingerprint: this.deviceFingerprint,
          deviceInfo: getDeviceInfo(),
        }),
      });

      // Check for explicit authentication failure
      if (response.status === 401 || response.status === 403) {
        return null;
      }

      const responseData = await this._handleResponse(response);
      return responseData.user;
    } catch (error) {
      // Network or parse error - return null
      return null;
    }
  }

  /**
   * Logout user
   * @param {string} token - Session token
   * @returns {Promise<Object>} Result
   */
  async logout(token) {
    try {
      if (token) {
        await this._makeRequest("logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return { success: true };
    } catch (error) {
      // Still return success even if backend call fails
      return { success: true };
    }
  }
}

export default EmailPasswordAuthService;
