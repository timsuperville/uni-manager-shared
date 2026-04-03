/**
 * OAuth Authentication Service
 *
 * Handles OAuth 2.0 authentication flows including authorization,
 * callback handling, token exchange, and provider management.
 */

import {
  getProviderConfig,
  generatePKCE,
  generateNonce,
  generateState,
} from "../config/oauthProviders";
import { getCurrentAppConfig } from "../config/appConfigs";
import { trackUserActivity } from "../utils/socialAuth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OAuthServiceConfig {
  apiBaseUrl: string;
  endpoints: Record<string, string>;
  appType?: string;
  deviceFingerprint?: string | null;
}

interface OAuthFlowOptions {
  additionalParams?: Record<string, string>;
}

interface OAuthFlowResult {
  authUrl: string;
  state: string;
}

interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  user: unknown;
}

interface OAuthCallbackResult {
  success: true;
  user: unknown;
  accessToken: string;
  refreshToken?: string;
  provider: string;
}

interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

// ── OAuthAuthService ──────────────────────────────────────────────────────────

export class OAuthAuthService {
  private readonly config: OAuthServiceConfig;
  private readonly apiBaseUrl: string;
  private readonly endpoints: Record<string, string>;
  private readonly appType: string;
  private readonly deviceFingerprint: string | null;

  constructor(config: OAuthServiceConfig) {
    this.config = config;
    this.apiBaseUrl = config.apiBaseUrl;
    this.endpoints = config.endpoints ?? {};
    this.appType = config.appType ?? "default";
    this.deviceFingerprint = config.deviceFingerprint ?? null;
  }

  private async _makeRequest(
    endpoint: string,
    options: ApiRequestOptions = {},
  ): Promise<Response> {
    const url = `${this.apiBaseUrl}${this.endpoints[endpoint] ?? endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    return fetch(url, { ...options, headers });
  }

  private async _handleResponse(
    response: Response,
  ): Promise<Record<string, unknown>> {
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`,
        );
      }
      return { success: true };
    }
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(
        (data["message"] as string | undefined) ??
          `Request failed with status ${response.status}`,
      );
    }
    return data;
  }

  async startOAuthFlow(
    providerId: string,
    options: OAuthFlowOptions = {},
  ): Promise<OAuthFlowResult> {
    const appConfig = getCurrentAppConfig();
    const providerConfig = getProviderConfig(providerId, appConfig.name);

    if (!providerConfig) {
      throw new Error(
        `OAuth provider ${providerId} not supported for ${appConfig.name}`,
      );
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
  ): Promise<OAuthCallbackResult> {
    if (error) throw new Error(`OAuth error: ${error}`);

    const storedState =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("oauth_state")
        : null;
    if (state !== storedState) throw new Error("Invalid OAuth state parameter");

    const providerId =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("oauth_provider")
        : null;
    const codeVerifier =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("pkce_verifier")
        : null;

    if (!providerId || !codeVerifier)
      throw new Error("Missing OAuth session data");

    const tokenResponse = await this.exchangeOAuthCode(
      providerId,
      code,
      codeVerifier,
    );

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("pkce_verifier");
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_nonce");
      sessionStorage.removeItem("oauth_provider");
    }

    return {
      success: true,
      user: tokenResponse.user,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      provider: providerId,
    };
  }

  async exchangeOAuthCode(
    providerId: string,
    code: string,
    codeVerifier: string,
  ): Promise<OAuthTokenResponse> {
    const appConfig = getCurrentAppConfig();
    const providerConfig = getProviderConfig(providerId, appConfig.name);

    const response = await this._makeRequest("oauthExchange", {
      method: "POST",
      body: JSON.stringify({
        providerId,
        code,
        codeVerifier,
        redirectUri: providerConfig.redirectUri,
        appType: this.appType,
      }),
    });

    const responseData = await this._handleResponse(response);

    if (responseData["success"] && responseData["accessToken"]) {
      return {
        accessToken: responseData["accessToken"] as string,
        refreshToken: responseData["refreshToken"] as string | undefined,
        user: responseData["user"],
      };
    }

    throw new Error(
      (responseData["message"] as string | undefined) ??
        "OAuth token exchange failed",
    );
  }

  async linkOAuthAccount(
    providerId: string,
    sessionToken: string,
  ): Promise<OAuthFlowResult> {
    const { authUrl, state } = await this.startOAuthFlow(providerId, {
      additionalParams: { link_account: "true" },
    });
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("link_session_token", sessionToken);
    }
    return { authUrl, state };
  }

  async unlinkOAuthAccount(
    providerId: string,
    sessionToken: string,
  ): Promise<{ success: true; message: string }> {
    const response = await this._makeRequest("unlinkOAuth", {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ providerId }),
    });

    const responseData = await this._handleResponse(response);

    if (responseData["success"]) {
      return {
        success: true,
        message:
          (responseData["message"] as string | undefined) ??
          "Account unlinked successfully",
      };
    }

    throw new Error(
      (responseData["message"] as string | undefined) ??
        "Failed to unlink OAuth account",
    );
  }

  async getLinkedProviders(sessionToken: string): Promise<unknown[]> {
    const response = await this._makeRequest("linkedProviders", {
      method: "GET",
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    const responseData = await this._handleResponse(response);
    return (responseData["providers"] as unknown[] | undefined) ?? [];
  }
}

export default OAuthAuthService;
