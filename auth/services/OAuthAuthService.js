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
} from "../config/oauthProviders.js";
import { getCurrentAppConfig } from "../config/appConfigs.js";
import { trackUserActivity } from "../utils/socialAuth.js";

export class OAuthAuthService {
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
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
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
   * Start OAuth authentication flow
   * @param {string} providerId - OAuth provider (google, github, microsoft, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Authorization URL and state
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

    // Store PKCE parameters and state in session storage
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
   * @param {string} code - Authorization code
   * @param {string} state - State parameter for CSRF protection
   * @param {string|null} error - Error from OAuth provider
   * @returns {Promise<Object>} Authentication result
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
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      provider: providerId,
    };
  }

  /**
   * Exchange OAuth authorization code for tokens
   * @param {string} providerId - OAuth provider ID
   * @param {string} code - Authorization code
   * @param {string} codeVerifier - PKCE code verifier
   * @returns {Promise<Object>} Token response
   */
  async exchangeOAuthCode(providerId, code, codeVerifier) {
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

    if (responseData.success && responseData.accessToken) {
      return {
        accessToken: responseData.accessToken,
        refreshToken: responseData.refreshToken,
        user: responseData.user,
      };
    }

    throw new Error(responseData.message || "OAuth token exchange failed");
  }

  /**
   * Link OAuth account to existing user
   * @param {string} providerId - OAuth provider
   * @param {string} sessionToken - Current session token
   * @returns {Promise<Object>} Result
   */
  async linkOAuthAccount(providerId, sessionToken) {
    const { authUrl, state } = await this.startOAuthFlow(providerId, {
      additionalParams: {
        link_account: "true",
      },
    });

    // Store session token for account linking
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("link_session_token", sessionToken);
    }

    return { authUrl, state };
  }

  /**
   * Unlink OAuth account from user
   * @param {string} providerId - OAuth provider
   * @param {string} sessionToken - Current session token
   * @returns {Promise<Object>} Result
   */
  async unlinkOAuthAccount(providerId, sessionToken) {
    const response = await this._makeRequest("unlinkOAuth", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        providerId,
      }),
    });

    const responseData = await this._handleResponse(response);

    if (responseData.success) {
      return {
        success: true,
        message: responseData.message || "Account unlinked successfully",
      };
    }

    throw new Error(responseData.message || "Failed to unlink OAuth account");
  }

  /**
   * Get list of linked OAuth providers
   * @param {string} sessionToken - Current session token
   * @returns {Promise<Array>} List of linked providers
   */
  async getLinkedProviders(sessionToken) {
    const response = await this._makeRequest("linkedProviders", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const responseData = await this._handleResponse(response);

    return responseData.providers || [];
  }
}

export default OAuthAuthService;
