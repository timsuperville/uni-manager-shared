/**
 * Email/Password Authentication Service
 *
 * Handles traditional email/password authentication flows including
 * login, signup, password reset, and profile updates.
 */

import { validateCredentials } from "../utils/authValidation.ts";
import { getDeviceInfo } from "../utils/socialAuth.ts";
import type { User, SignupData, LoginResult, Session } from "../types/auth.types.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceConfig {
  apiBaseUrl: string;
  endpoints: Record<string, string>;
  appType?: string;
  deviceFingerprint?: string | null;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  session?: unknown;
  requiresMFA?: boolean;
  requiresVerification?: boolean;
  userId?: string;
  tempToken?: string;
  data?: User;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class EmailPasswordAuthService {
  private readonly apiBaseUrl: string;
  private readonly endpoints: Record<string, string>;
  private readonly appType: string;
  private readonly deviceFingerprint: string | null;

  constructor(config: ServiceConfig) {
    this.apiBaseUrl = config.apiBaseUrl;
    this.endpoints = config.endpoints;
    this.appType = config.appType ?? "default";
    this.deviceFingerprint = config.deviceFingerprint ?? null;
  }

  private async _makeRequest(endpoint: string, options: RequestOptions = {}): Promise<Response> {
    const url = `${this.apiBaseUrl}${this.endpoints[endpoint] ?? endpoint}`;
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  private async _handleResponse(response: Response): Promise<ApiResponse> {
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);
      return { success: true };
    }

    const data = await response.json() as ApiResponse;
    if (!response.ok) throw new Error(data.message ?? `Request failed with status ${response.status}`);
    return data;
  }

  /** Authenticates with email and password credentials. */
  async login(credentials: { email: string; password: string; rememberMe?: boolean }): Promise<LoginResult> {
    const validation = validateCredentials(credentials);
    if (!validation.isValid) {
      const errorValues = Object.values(validation.errors).filter((v): v is string => typeof v === "string");
      throw new Error(errorValues.join(", "));
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

    const data = await this._handleResponse(response);

    if (data.success && data.accessToken) {
      return {
        success: true,
        user: data.user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        session: data.session as Session | undefined,
      };
    }

    if (data.success && data.requiresMFA) {
      return { success: true, mfaRequired: true, userId: data.userId, tempToken: data.tempToken };
    }

    throw new Error(data.message ?? "Login failed");
  }

  /** Registers a new user account. */
  async signup(userData: SignupData): Promise<{ success: boolean; message?: string; requiresVerification?: boolean; user?: User }> {
    const response = await this._makeRequest("signup", {
      method: "POST",
      body: JSON.stringify({
        ...userData,
        appType: this.appType,
        deviceFingerprint: this.deviceFingerprint,
        deviceInfo: getDeviceInfo(),
      }),
    });

    const data = await this._handleResponse(response);
    if (data.success) {
      return { success: true, message: data.message, requiresVerification: data.requiresVerification, user: data.user };
    }

    throw new Error(data.message ?? "Signup failed");
  }

  /** Sends a password reset email. */
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    const response = await this._makeRequest("forgotPassword", {
      method: "POST",
      body: JSON.stringify({ email, appType: this.appType }),
    });

    const data = await response.json() as ApiResponse;
    return { success: data.success, message: data.message };
  }

  /** Resets the password using a token from the reset email. */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const response = await this._makeRequest("resetPassword", {
      method: "POST",
      body: JSON.stringify({ token, newPassword, appType: this.appType }),
    });

    const data = await response.json() as ApiResponse;
    return { success: data.success, message: data.message };
  }

  /** Updates the authenticated user's profile. */
  async updateProfile(profileData: Partial<User>, sessionToken: string): Promise<{ success: boolean; user?: User }> {
    const response = await this._makeRequest("updateProfile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(profileData),
    });

    const data = await this._handleResponse(response);
    if (data.success) return { success: true, user: data.user ?? data.data };

    throw new Error(data.message ?? "Profile update failed");
  }

  /** Verifies a session token and returns the user if valid. */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const response = await this._makeRequest("verify", {
        method: "POST",
        body: JSON.stringify({
          token,
          deviceFingerprint: this.deviceFingerprint,
          deviceInfo: getDeviceInfo(),
        }),
      });

      if (response.status === 401 || response.status === 403) return null;

      const data = await this._handleResponse(response);
      return data.user ?? null;
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[EmailPasswordAuthService] verifyToken failed:", (error as Error).message);
      return null;
    }
  }

  /** Calls the backend logout endpoint to invalidate the session. */
  async logout(token: string): Promise<{ success: boolean }> {
    try {
      if (token) {
        await this._makeRequest("logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      return { success: true };
    } catch (error) {
      // Intentionally returns success — client-side cleanup continues regardless of backend failure.
      if (import.meta.env?.DEV) console.warn("[EmailPasswordAuthService] logout backend call failed:", (error as Error).message);
      return { success: true };
    }
  }
}

export default EmailPasswordAuthService;
