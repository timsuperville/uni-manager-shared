/* global fetch, sessionStorage, URLSearchParams, setInterval, clearInterval */
/**
 * Consolidated Authentication Service
 *
 * Unified service combining OAuth and traditional authentication.
 */

import {
  generateDeviceFingerprint,
  getDeviceInfo,
  trackUserActivity,
} from "../utils/socialAuth.ts";
import {
  getProviderConfig,
  generatePKCE,
  generateNonce,
  generateState,
} from "../config/oauthProviders.ts";
import { getCurrentAppConfig } from "../config/appConfigs.ts";
import { TokenStorage } from "../utils/TokenStorage.ts";
import { validateCredentials } from "../utils/authValidation.ts";
import { getApiBaseUrl } from "../../api/config/apiConfig.ts";
import { RateLimitService } from "./RateLimitService.ts";
import { TokenManagementService } from "./TokenManagementService.ts";
import type { User } from "../types/auth.types.ts";


// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthServiceEndpoints {
  login?: string;
  logout?: string;
  signup?: string;
  forgotPassword?: string;
  resetPassword?: string;
  refreshToken?: string;
  validateToken?: string;
  verify?: string;
  changePassword?: string;
  uploadAvatar?: string;
  uploadCoverImage?: string;
  checkEmail?: string;
  updateProfile?: string;
  [key: string]: string | undefined;
}

interface AuthServiceConfig {
  apiBaseUrl?: string;
  endpoints?: AuthServiceEndpoints;
  apiEndpoints?: AuthServiceEndpoints;
  appType?: string;
  storageNamespace?: string;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  onTokenRefreshed?: () => void;
  onTokenExpired?: () => void;
}

interface ResolvedAuthConfig {
  apiBaseUrl: string;
  endpoints: Required<Pick<AuthServiceEndpoints, "login" | "logout" | "signup" | "forgotPassword" | "resetPassword" | "refreshToken" | "validateToken" | "verify">> & AuthServiceEndpoints;
  appType: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  [key: string]: unknown;
}

interface LoginResult {
  success: true;
  user?: unknown;
  session?: unknown;
  requiresMFA?: boolean;
  userId?: string;
  tempToken?: string;
}

interface SignupResult {
  success: true;
  message?: string;
  requiresVerification?: boolean;
  user?: unknown;
}

interface TokenRefreshResult {
  success: true;
  accessToken: string;
}

interface RequestOptions extends RequestInit {
  signal?: AbortSignal;
}

// ── AuthService ───────────────────────────────────────────────────────────────

class AuthService {
  private readonly config: ResolvedAuthConfig;
  private readonly apiEndpoint: string;
  private currentUser: unknown = null;
  private sessionToken: string | null = null;
  private deviceFingerprint: string | null = null;
  private activityTracker: ReturnType<typeof setInterval> | null = null;
  private readonly tokenStorage: TokenStorage;
  private readonly rateLimitService: RateLimitService;
  private readonly tokenService: TokenManagementService;

  // Backward compat proxies onto rateLimitService (fields are public readonly on RateLimitService)
  readonly loginAttempts: Map<string, { count: number; lastAttempt: number }>;
  readonly maxLoginAttempts: number;
  readonly lockoutDuration: number;

  constructor(config: AuthServiceConfig = {}) {
    const endpoints = config.apiEndpoints ?? config.endpoints ?? {};

    // Transform full URLs to relative paths for _makeRequest
    const transformedEndpoints: AuthServiceEndpoints = {};
    for (const [key, url] of Object.entries(endpoints)) {
      if (url && url.startsWith("http")) {
        try {
          transformedEndpoints[key] = new URL(url).pathname;
        } catch {
          transformedEndpoints[key] = url;
        }
      } else {
        transformedEndpoints[key] = url;
      }
    }

    this.config = {
      apiBaseUrl: config.apiBaseUrl ?? getApiBaseUrl(),
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
      appType: config.appType ?? "default",
    };

    this.apiEndpoint = (this.config.endpoints.login ?? "/api/v1/auth/login").replace("/login", "");

    const storageNamespace = config.storageNamespace ?? config.appType ?? "uni";
    this.tokenStorage = new TokenStorage(storageNamespace);

    this.rateLimitService = new RateLimitService({
      maxLoginAttempts: config.maxLoginAttempts ?? 5,
      lockoutDuration: config.lockoutDuration ?? 15 * 60 * 1000,
    });
    this.tokenService = new TokenManagementService({
      tokenStorage: this.tokenStorage,
      onTokenRefreshed: config.onTokenRefreshed,
      onTokenExpired: config.onTokenExpired,
    });

    this.loginAttempts = this.rateLimitService.loginAttempts;
    this.maxLoginAttempts = this.rateLimitService.maxAttempts;
    this.lockoutDuration = this.rateLimitService.lockoutDuration;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  async initialize(): Promise<boolean> {
    try {
      this.deviceFingerprint = await generateDeviceFingerprint();
      await this.checkExistingSession();
      this.startActivityTracking();
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.warn("[AuthService] initialize failed:", (error as Error).message);
      return false;
    }
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  private async _handleResponse(response: Response): Promise<Record<string, unknown>> {
    const contentType = response.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      throw new Error(`Server Error (${response.status}): Please try again later.`);
    }

    let data: Record<string, unknown>;
    try {
      data = await response.json() as Record<string, unknown>;
    } catch (error) {
      if (import.meta.env.DEV) console.warn("[AuthService] _handleResponse JSON parse failed:", (error as Error).message);
      throw new Error("Invalid JSON response from server");
    }

    if (!response.ok) {
      throw new Error(
        (data["message"] as string | undefined) ??
        (data["error"] as string | undefined) ??
        `Request failed with status ${response.status}`,
      );
    }

    return data;
  }

  private _getEndpointUrl(key: string): string | null {
    const endpoint = this.config.endpoints[key];
    if (!endpoint) return null;
    if (endpoint.startsWith("http")) return endpoint;
    return `${this.config.apiBaseUrl}${endpoint}`;
  }

  private async _makeRequest(endpoint: string, options: RequestOptions = {}): Promise<Response> {
    const endpointPath = this.config.endpoints[endpoint] ?? endpoint;
    const url = (endpointPath ?? "").startsWith("http")
      ? endpointPath!
      : `${this.config.apiBaseUrl}${endpointPath}`;

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    return fetch(url!, {
      ...options,
      headers: defaultHeaders,
      credentials: "include",
    });
  }

  // ── Session ─────────────────────────────────────────────────────────────────

  async checkExistingSession(): Promise<unknown> {
    const token = this.getStoredToken();
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

      if (response.status === 401 || response.status === 403) {
        this.clearStoredAuth();
        return null;
      }

      let responseData: Record<string, unknown>;
      try {
        if (response.ok) {
          responseData = await this._handleResponse(response);
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      } catch (e) {
        if (import.meta.env?.DEV) {
          console.warn("[AuthService] Session verification failed, restoring from storage:", (e as Error).message);
        }
        const storedUser = this.tokenStorage.getUser();
        if (storedUser) {
          this.currentUser = storedUser;
          this.sessionToken = token;
          return storedUser;
        }
        return null;
      }

      this.currentUser = responseData["user"];
      this.sessionToken = token;

      if (responseData["user"]) {
        this.tokenStorage.updateUser(responseData["user"] as Partial<User>);
      }

      return responseData["user"];
    } catch (error) {
      if (import.meta.env.DEV) console.warn("[AuthService] validateToken fallback to stored user:", (error as Error).message);
      const storedUser = this.tokenStorage.getUser();
      if (storedUser) {
        this.currentUser = storedUser;
        this.sessionToken = token;
        return storedUser;
      }
      return null;
    }
  }

  // ── Traditional Auth ────────────────────────────────────────────────────────

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { email } = credentials;

    if (this.isRateLimited(email)) {
      throw new Error("Too many attempts. Please try again later.");
    }

    try {
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

      const responseData = await this._handleResponse(response);

      if (responseData["success"] && responseData["accessToken"]) {
        this.tokenStorage.setTokens({
          accessToken: responseData["accessToken"] as string,
          refreshToken: responseData["refreshToken"] as string | undefined,
          user: responseData["user"] as User | undefined,
        });
        this.currentUser = responseData["user"] as User | undefined;
        this.sessionToken = responseData["accessToken"] as string;
        this.resetLoginAttempts(email);

        return { success: true, user: responseData["user"], session: responseData["session"] };
      }

      if (responseData["success"] && responseData["requiresMFA"]) {
        this.resetLoginAttempts(email);
        return {
          success: true,
          requiresMFA: true,
          userId: responseData["userId"] as string | undefined,
          tempToken: responseData["tempToken"] as string | undefined,
        };
      }

      this.recordLoginAttempt(email);
      throw new Error((responseData["message"] as string | undefined) ?? "Login failed");
    } catch (err) {
      this.recordLoginAttempt(email);
      throw err;
    }
  }

  async logout(): Promise<{ success: true }> {
    try {
      const token = this.getStoredToken();
      if (token) {
        await this._makeRequest("logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      this.clearStoredAuth();
      this.currentUser = null;
      this.sessionToken = null;
      this.stopActivityTracking();
      return { success: true };
    } catch (error) {
      if (import.meta.env.DEV) console.warn("[AuthService] logout backend call failed — clearing local session:", (error as Error).message);
      this.clearStoredAuth();
      this.currentUser = null;
      this.sessionToken = null;
      return { success: true };
    }
  }

  async signup(userData: Record<string, unknown>): Promise<SignupResult> {
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

    if (responseData["success"]) {
      return {
        success: true,
        message: responseData["message"] as string | undefined,
        requiresVerification: responseData["requiresVerification"] as boolean | undefined,
        user: responseData["user"],
      };
    }
    throw new Error((responseData["message"] as string | undefined) ?? "Signup failed");
  }

  async checkEmailAvailability(
    email: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<{ available: boolean }> {
    try {
      const checkUrl = this.config.endpoints["checkEmail"];
      if (!checkUrl) return { available: true };

      const response = await this._makeRequest("checkEmail", {
        method: "POST",
        body: JSON.stringify({ email }),
        signal: options.signal,
      });

      const data = await this._handleResponse(response);
      return { available: !!data["available"] };
    } catch (err) {
      if ((err as Error)?.name === "AbortError") throw err;
      return { available: true };
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    const response = await this._makeRequest("forgotPassword", {
      method: "POST",
      body: JSON.stringify({ email, appType: this.config.appType }),
    });
    const responseData = await response.json() as { success: boolean; message?: string };
    return { success: responseData.success, message: responseData.message };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const response = await this._makeRequest("resetPassword", {
      method: "POST",
      body: JSON.stringify({ token, newPassword, appType: this.config.appType }),
    });
    const responseData = await response.json() as { success: boolean; message?: string };
    return { success: responseData.success, message: responseData.message };
  }

  async updateProfile(profileData: Record<string, unknown>): Promise<{ success: true; user: unknown; message: string }> {
    const response = await this._makeRequest("updateProfile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${this.sessionToken}` },
      body: JSON.stringify(profileData),
    });

    const responseData = await this._handleResponse(response);

    if (responseData["success"]) {
      const updatedUser = responseData["user"] ?? responseData["data"];
      this.currentUser = { ...(this.currentUser as Record<string, unknown>), ...(updatedUser as Record<string, unknown>) };
      return {
        success: true,
        user: this.currentUser,
        message: (responseData["message"] as string | undefined) ?? "Profile updated successfully",
      };
    }

    throw new Error((responseData["message"] as string | undefined) ?? "Failed to update profile");
  }

  async uploadAvatar(file: File): Promise<{ success: true; avatarUrl: string; message: string }> {
    const formData = new FormData();
    formData.append("avatar", file);

    const endpoint = this.config.endpoints["uploadAvatar"]
      ? this._getEndpointUrl("uploadAvatar")
      : `${this.config.apiBaseUrl}/profile/avatar`;

    const response = await fetch(endpoint!, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.sessionToken}` },
      body: formData,
      credentials: "include",
    });

    const responseData = await this._handleResponse(response);

    if (responseData["success"]) {
      this.currentUser = { ...(this.currentUser as Record<string, unknown>), avatarUrl: responseData["avatarUrl"] };
      return {
        success: true,
        avatarUrl: responseData["avatarUrl"] as string,
        message: (responseData["message"] as string | undefined) ?? "Avatar uploaded successfully",
      };
    }

    throw new Error((responseData["message"] as string | undefined) ?? "Failed to upload avatar");
  }

  async uploadCoverImage(file: File): Promise<{ success: true; coverImageUrl: string; user?: unknown; message: string }> {
    const formData = new FormData();
    formData.append("cover", file);

    const endpoint = this.config.endpoints["uploadCoverImage"]
      ? this._getEndpointUrl("uploadCoverImage")
      : `${this.config.apiBaseUrl}/profile/cover`;

    const response = await fetch(endpoint!, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.sessionToken}` },
      body: formData,
      credentials: "include",
    });

    const responseData = await this._handleResponse(response);

    if (responseData["success"]) {
      const coverImageUrl = responseData["coverImageUrl"] as string;
      this.currentUser = {
        ...(this.currentUser as Record<string, unknown>),
        coverImageUrl,
        coverImage: coverImageUrl,
      };
      return {
        success: true,
        coverImageUrl,
        user: responseData["user"],
        message: (responseData["message"] as string | undefined) ?? "Cover image uploaded successfully",
      };
    }

    throw new Error((responseData["message"] as string | undefined) ?? "Failed to upload cover image");
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: true; message: string }> {
    const response = await this._makeRequest("changePassword", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const responseData = await this._handleResponse(response);

    if (responseData["success"]) {
      return {
        success: true,
        message: (responseData["message"] as string | undefined) ?? "Password changed successfully",
      };
    }

    throw new Error((responseData["message"] as string | undefined) ?? "Failed to change password");
  }

  // ── OAuth ───────────────────────────────────────────────────────────────────

  async startOAuthFlow(
    providerId: string,
    options: { additionalParams?: Record<string, string> } = {},
  ): Promise<{ authUrl: string; state: string }> {
    const appConfig = getCurrentAppConfig();
    const providerConfig = getProviderConfig(providerId, appConfig.name);

    if (!providerConfig) {
      throw new Error(`OAuth provider ${providerId} not supported for ${appConfig.name}`);
    }

    const { codeVerifier, codeChallenge } = await generatePKCE();
    const state = generateState();
    const nonce = generateNonce();

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("pkce_verifier", codeVerifier);
      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("oauth_nonce", nonce);
      sessionStorage.setItem("oauth_provider", providerId);
    }

    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.redirectUri,
      scope: providerConfig.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      nonce,
      ...options.additionalParams,
    });

    const authUrl = `${providerConfig.authorizationEndpoint}?${authParams.toString()}`;

    trackUserActivity("oauth_init", {
      provider: providerId,
      app: appConfig.name,
      deviceFingerprint: this.deviceFingerprint,
    });

    return { authUrl, state };
  }

  async handleOAuthCallback(
    code: string,
    state: string,
    error: string | null = null,
  ): Promise<{ success: true; user: unknown; provider: string }> {
    if (error) throw new Error(`OAuth error: ${error}`);

    const storedState = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("oauth_state") : null;
    if (state !== storedState) throw new Error("Invalid OAuth state parameter");

    const providerId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("oauth_provider") : null;
    const codeVerifier = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("pkce_verifier") : null;

    if (!providerId || !codeVerifier) throw new Error("Missing OAuth session data");

    const tokenResponse = await this.exchangeOAuthCode(providerId, code, codeVerifier);

    this.tokenStorage.setTokens({
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      user: tokenResponse.user as User | undefined,
    });
    this.currentUser = tokenResponse.user as User | undefined;
    this.sessionToken = tokenResponse.accessToken;

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("pkce_verifier");
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_nonce");
      sessionStorage.removeItem("oauth_provider");
    }

    return { success: true, user: tokenResponse.user, provider: providerId };
  }

  async exchangeOAuthCode(
    providerId: string,
    code: string,
    codeVerifier: string,
  ): Promise<{ accessToken: string; refreshToken?: string; user: unknown }> {
    const appConfig = getCurrentAppConfig();
    const providerConfig = getProviderConfig(providerId, appConfig.name);

    const tokenParams = {
      grant_type: "authorization_code",
      client_id: providerConfig.clientId,
      code,
      redirect_uri: providerConfig.redirectUri,
      code_verifier: codeVerifier,
    };

    const response = await fetch(providerConfig.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(tokenParams).toString(),
    });

    if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);

    const tokenData = await response.json() as { access_token: string };
    const userInfo = await this.getOAuthUserInfo(providerId, tokenData.access_token);

    const authResponse = await this._makeRequest("login", {
      method: "POST",
      body: JSON.stringify({
        authType: "oauth",
        provider: providerId,
        oauthToken: tokenData.access_token,
        userInfo,
        deviceFingerprint: this.deviceFingerprint,
        deviceInfo: getDeviceInfo(),
        appType: this.config.appType,
      }),
    });

    const authData = await authResponse.json() as { success: boolean; message?: string; accessToken: string; refreshToken?: string; user: unknown };

    if (!authResponse.ok || !authData.success) {
      throw new Error(authData.message ?? "OAuth authentication failed");
    }

    return { accessToken: authData.accessToken, refreshToken: authData.refreshToken, user: authData.user };
  }

  async getOAuthUserInfo(providerId: string, accessToken: string): Promise<unknown> {
    const appConfig = getCurrentAppConfig();
    const providerConfig = getProviderConfig(providerId, appConfig.name);

    const response = await fetch(providerConfig.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });

    if (!response.ok) throw new Error(`Failed to get user info: ${response.status}`);

    return await response.json();
  }

  // ── Token Management ────────────────────────────────────────────────────────

  getStoredToken(): string | null {
    try {
      return this.tokenStorage.getAccessToken();
    } catch (error) {
      if (import.meta.env.DEV) console.warn("[AuthService] getStoredToken failed:", (error as Error).message);
      return null;
    }
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    try {
      const refreshToken = this.tokenStorage.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await this._makeRequest("refreshToken", {
        method: "POST",
        body: JSON.stringify({
          refreshToken,
          deviceFingerprint: this.deviceFingerprint,
          appType: this.config.appType,
        }),
      });

      const responseData = await response.json() as {
        success: boolean;
        message?: string;
        accessToken?: string;
        refreshToken?: string;
        user?: unknown;
      };

      if (response.ok && responseData.success) {
        this.tokenStorage.setTokens({
          accessToken: responseData.accessToken!,
          refreshToken: responseData.refreshToken,
          user: responseData.user as User | undefined,
        });
        this.sessionToken = responseData.accessToken!;
        this.currentUser = responseData.user as User | undefined;

        return { success: true, accessToken: responseData.accessToken! };
      }

      throw new Error(responseData.message ?? "Token refresh failed");
    } catch (_error) {
      this.clearStoredAuth();
      throw _error;
    }
  }

  async isTokenValid(): Promise<boolean> {
    try {
      const token = this.getStoredToken();
      if (!token) return false;

      const response = await this._makeRequest("validateToken", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = await response.json() as { valid?: boolean };
      return response.ok && !!responseData.valid;
    } catch {
      return false;
    }
  }

  async switchChurch(churchId: string): Promise<{ success: true; user: unknown; noChange?: boolean }> {
    if (!this.currentUser) throw new Error("User not authenticated");

    const currentUser = this.currentUser as Record<string, unknown>;
    if (
      currentUser["currentChurch"] &&
      currentUser["currentChurch"].toString() === churchId
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

    if (responseData["success"]) {
      const updatedUser = responseData["data"] ?? responseData["user"];
      this.tokenStorage.updateUser(updatedUser as Partial<Record<string, unknown>>);
      this.currentUser = updatedUser;

      return { success: true, user: updatedUser };
    }

    throw new Error((responseData["message"] as string | undefined) ?? "Failed to switch church");
  }

  clearStoredAuth(): void {
    try {
      this.tokenStorage.clearTokens();
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[AuthService] clearStoredAuth failed:", (error as Error).message);
    }
  }

  // ── Security ────────────────────────────────────────────────────────────────

  isRateLimited(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    if (attempts.count >= this.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      return timeSinceLastAttempt < this.lockoutDuration;
    }

    return false;
  }

  recordLoginAttempt(email: string): void {
    const attempts = this.loginAttempts.get(email) ?? { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(email, attempts);
  }

  resetLoginAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  // ── Activity Tracking ───────────────────────────────────────────────────────

  startActivityTracking(): void {
    if (this.activityTracker) return;
    this.activityTracker = setInterval(() => {
      this.updateActivity();
    }, 30000);
  }

  stopActivityTracking(): void {
    if (this.activityTracker) {
      clearInterval(this.activityTracker);
      this.activityTracker = null;
    }
  }

  async updateActivity(): Promise<void> {
    if (!this.currentUser) return;
    try {
      const user = this.currentUser as Record<string, unknown>;
      trackUserActivity("session_active", {
        userId: user["id"],
        app: this.config.appType,
        deviceFingerprint: this.deviceFingerprint,
      });
    } catch {
      // Intentionally silent — activity tracking is best-effort and must not
      // disrupt the auth flow if the tracker itself throws.
    }
  }

  async isSessionExpired(): Promise<boolean> {
    return !(await this.isTokenValid());
  }

  // ── Getters ─────────────────────────────────────────────────────────────────

  getCurrentUser(): unknown {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!(this.currentUser && this.sessionToken);
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

const authService = new AuthService();
export default authService;
export { authService, AuthService };
