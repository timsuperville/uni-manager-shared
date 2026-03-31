/* global window, TextEncoder, btoa */
/**
 * OAuth Provider Configurations
 * Supports Google, Microsoft, LinkedIn, GitHub, Spotify, Apple OAuth providers
 */

import type { AppName } from "./appConfigs";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OAuthProviderSecurity {
  pkce: boolean;
  nonce: boolean;
  deviceFingerprinting: boolean;
  sessionTracking: boolean;
}

export interface OAuthAppConfig {
  scope?: string;
  additionalParams?: Record<string, string | undefined>;
}

export interface OAuthProvider {
  name: string;
  iconName: string;
  authUrl: string;
  scope: string;
  responseType: string;
  responseMode?: string;
  includeGrantedScopes?: boolean;
  accessType?: string;
  state: boolean;
  security: OAuthProviderSecurity;
  configs: Partial<Record<AppName, OAuthAppConfig>>;
}

export interface ResolvedProviderConfig extends OAuthProvider {
  additionalParams: Record<string, string | undefined>;
  /** OAuth client ID — injected at resolution time from environment config. */
  clientId: string;
  /** OAuth redirect URI — injected at resolution time from environment config. */
  redirectUri: string;
  /** Convenience alias: scope split into an array (callers may use `.scopes.join(' ')`). */
  scopes: string[];
  /** Full authorization endpoint URL (e.g. `authUrl` field). */
  authorizationEndpoint: string;
  /** Token exchange endpoint URL. */
  tokenEndpoint: string;
  /** User-info endpoint URL. */
  userInfoEndpoint: string;
}

// ── Provider Definitions ──────────────────────────────────────────────────────

export const oauthProviders: Record<string, OAuthProvider> = {
  google: {
    name: "Google",
    iconName: "google",
    authUrl: "https://accounts.google.com/oauth2/v2/auth",
    scope: "openid email profile",
    responseType: "code",
    includeGrantedScopes: true,
    accessType: "offline",
    state: true,
    security: { pkce: true, nonce: true, deviceFingerprinting: true, sessionTracking: true },
    configs: {
      church: {
        scope: "openid email profile https://www.googleapis.com/auth/userinfo.email",
        additionalParams: { prompt: "consent", access_type: "offline" },
      },
      admin: {
        scope: "openid email profile",
        additionalParams: { hd: import.meta.env.VITE_GOOGLE_HOSTED_DOMAIN as string | undefined },
      },
      business: { scope: "openid email profile", additionalParams: { prompt: "select_account" } },
      personal: { scope: "openid email profile", additionalParams: { prompt: "select_account" } },
      home: { scope: "openid email profile", additionalParams: { prompt: "select_account" } },
      playback: { scope: "openid email profile", additionalParams: { prompt: "select_account" } },
    },
  },

  microsoft: {
    name: "Microsoft",
    iconName: "microsoft",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scope: "openid email profile User.Read",
    responseType: "code",
    state: true,
    security: { pkce: true, nonce: true, deviceFingerprinting: true, sessionTracking: true },
    configs: {
      admin: {
        scope: "openid email profile User.Read Directory.Read.All",
        additionalParams: { prompt: "select_account" },
      },
      business: {
        scope: "openid email profile User.Read",
        additionalParams: { prompt: "select_account" },
      },
    },
  },

  linkedin: {
    name: "LinkedIn",
    iconName: "linkedin",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    scope: "r_liteprofile r_emailaddress",
    responseType: "code",
    state: true,
    security: { pkce: false, nonce: false, deviceFingerprinting: true, sessionTracking: true },
    configs: {
      business: { scope: "r_liteprofile r_emailaddress w_member_social", additionalParams: {} },
    },
  },

  github: {
    name: "GitHub",
    iconName: "github",
    authUrl: "https://github.com/login/oauth/authorize",
    scope: "user:email read:user",
    responseType: "code",
    state: true,
    security: { pkce: false, nonce: false, deviceFingerprinting: true, sessionTracking: true },
    configs: {
      personal: {
        scope: "user:email read:user repo",
        additionalParams: { allow_signup: "false" },
      },
    },
  },

  spotify: {
    name: "Spotify",
    iconName: "spotify",
    authUrl: "https://accounts.spotify.com/authorize",
    scope: "user-read-email user-read-private",
    responseType: "code",
    state: true,
    security: { pkce: true, nonce: false, deviceFingerprinting: true, sessionTracking: true },
    configs: {
      playback: {
        scope: "user-read-email user-read-private user-read-playback-state user-modify-playback-state",
        additionalParams: { show_dialog: "true" },
      },
    },
  },

  apple: {
    name: "Apple",
    iconName: "apple",
    authUrl: "https://appleid.apple.com/auth/authorize",
    scope: "email name",
    responseType: "code",
    responseMode: "form_post",
    state: true,
    security: { pkce: true, nonce: true, deviceFingerprinting: true, sessionTracking: true },
    configs: {
      playback: { scope: "email name", additionalParams: { response_mode: "form_post" } },
    },
  },
};

// ── PKCE ──────────────────────────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const hasSubtle = typeof window !== "undefined" && window.crypto?.subtle;

  if (!hasSubtle) {
    // Fallback for environments without Web Crypto API
    const verifier =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    return { codeVerifier: verifier, codeChallenge: verifier };
  }

  const codeVerifier = generateRandomString(128);
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const codeChallenge = base64URLEncode(digest);

  return { codeVerifier, codeChallenge };
}

// ── Nonce / State ─────────────────────────────────────────────────────────────

export function generateNonce(): string {
  return (
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  );
}

export function generateState(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

// ── Provider Config Helpers ───────────────────────────────────────────────────

export function getProviderConfig(
  providerId: string,
  appName: string,
): ResolvedProviderConfig {
  const provider = oauthProviders[providerId];
  if (!provider) throw new Error(`Unsupported OAuth provider: ${providerId}`);

  const appConfig = provider.configs[appName as AppName] ?? {};
  const resolvedScope = appConfig.scope ?? provider.scope;

  // Read env vars — these may be undefined in environments that don't configure
  // all providers. Callers that reach OAuth flows should always have them set.
  const clientId =
    (import.meta.env[`VITE_${providerId.toUpperCase()}_CLIENT_ID`] as string | undefined) ?? "";
  const redirectUri =
    (import.meta.env[`VITE_${providerId.toUpperCase()}_REDIRECT_URI`] as string | undefined) ?? "";
  const tokenEndpoint =
    (import.meta.env[`VITE_${providerId.toUpperCase()}_TOKEN_ENDPOINT`] as string | undefined) ??
    `https://${providerId}.auth.default/token`;
  const userInfoEndpoint =
    (import.meta.env[`VITE_${providerId.toUpperCase()}_USERINFO_ENDPOINT`] as string | undefined) ??
    `https://${providerId}.auth.default/userinfo`;

  return {
    ...provider,
    scope: resolvedScope,
    scopes: resolvedScope.split(" ").filter(Boolean),
    additionalParams: appConfig.additionalParams ?? {},
    clientId,
    redirectUri,
    authorizationEndpoint: provider.authUrl,
    tokenEndpoint,
    userInfoEndpoint,
  };
}

export function isProviderSupportedForApp(providerId: string, appName: string): boolean {
  const provider = oauthProviders[providerId];
  if (!provider) return false;
  return Object.prototype.hasOwnProperty.call(provider.configs, appName);
}

export function getSupportedProvidersForApp(appName: string): string[] {
  return Object.keys(oauthProviders).filter((id) => isProviderSupportedForApp(id, appName));
}

/** Alias for getProviderConfig — backward compatibility */
export const getOAuthConfig = getProviderConfig;
