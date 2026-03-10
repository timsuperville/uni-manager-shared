/**
 * Social Authentication Utilities
 *
 * Handles OAuth provider configuration, device fingerprinting,
 * and session activity tracking.
 */

import { getCurrentAppConfig } from "../config/appConfigs.ts";
import {
  getCachedDeviceFingerprint,
  setCachedDeviceFingerprint,
} from "./deviceFingerprintCache.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of an app config's apiEndpoints block (minimal surface we need). */
interface AppConfigEndpoints {
  apiEndpoints: { login: string };
  features: {
    socialLogin?: {
      enabled: boolean;
      providers: string[];
      [key: string]: unknown; // e.g. googleClientId, microsoftClientId
    };
  };
}

interface OAuthProviderConfig {
  name: string;
  icon: string;
  color: string;
  getAuthUrl: (appConfig: AppConfigEndpoints) => string;
  scopes: string[];
}

interface OAuthProviderEntry extends OAuthProviderConfig {
  id: string;
  clientId: unknown;
}

interface InitiateOAuthOptions {
  redirectUrl?: string;
}

interface ActivityData {
  event: string;
  timestamp: string;
  deviceFingerprint: string | null;
  sessionId: string | null;
  [key: string]: unknown;
}

type ActivityCallback = (timestamp: number | null, signal?: string) => void;

// ---------------------------------------------------------------------------
// Device Fingerprint
// ---------------------------------------------------------------------------

/**
 * Generates a stable device fingerprint for security.
 * Uses a 24-hour cache to avoid redundant recalculation.
 */
export const generateDeviceFingerprint = async (): Promise<string> => {
  const cached = getCachedDeviceFingerprint();
  if (cached) return cached;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return "server-render";
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Device fingerprint", 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset(),
    navigator.platform,
    canvas.toDataURL(),
  ].join("|");

  // Simple 32-bit hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  const result = Math.abs(hash).toString(36);
  setCachedDeviceFingerprint(result);
  return result;
};

/** Returns basic device/environment information for the current session. */
export const getDeviceInfo = () => {
  if (typeof window === "undefined") {
    return {
      userAgent: "server-render",
      language: "en",
      timezone: "UTC",
      screenResolution: "1920x1080",
      platform: "server",
    };
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    platform: navigator.platform,
    fingerprint: null as string | null, // populated by generateDeviceFingerprint
  };
};

// ---------------------------------------------------------------------------
// OAuth Provider Registry
// ---------------------------------------------------------------------------

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  google: {
    name: "Google",
    icon: "FcGoogle",
    color: "#4285f4",
    getAuthUrl: (c) => `${c.apiEndpoints.login.replace("/login", "")}/google`,
    scopes: ["profile", "email"],
  },
  microsoft: {
    name: "Microsoft",
    icon: "SiMicrosoft",
    color: "#00a4ef",
    getAuthUrl: (c) => `${c.apiEndpoints.login.replace("/login", "")}/microsoft`,
    scopes: ["User.Read"],
  },
  linkedin: {
    name: "LinkedIn",
    icon: "FaLinkedin",
    color: "#0077b5",
    getAuthUrl: (c) => `${c.apiEndpoints.login.replace("/login", "")}/linkedin`,
    scopes: ["r_liteprofile", "r_emailaddress"],
  },
  github: {
    name: "GitHub",
    icon: "FaGithub",
    color: "#333",
    getAuthUrl: (c) => `${c.apiEndpoints.login.replace("/login", "")}/github`,
    scopes: ["user:email"],
  },
  spotify: {
    name: "Spotify",
    icon: "FaSpotify",
    color: "#1db954",
    getAuthUrl: (c) => `${c.apiEndpoints.login.replace("/login", "")}/spotify`,
    scopes: ["user-read-email", "user-read-private"],
  },
  apple: {
    name: "Apple",
    icon: "FaApple",
    color: "#000",
    getAuthUrl: (c) => `${c.apiEndpoints.login.replace("/login", "")}/apple`,
    scopes: ["name", "email"],
  },
} as const;

/** Returns only the OAuth providers that are enabled and configured for the current app. */
export const getEnabledOAuthProviders = (): OAuthProviderEntry[] => {
  const appConfig = getCurrentAppConfig() as unknown as AppConfigEndpoints;
  const socialLogin = appConfig.features.socialLogin;
  if (!socialLogin?.enabled) return [];

  return socialLogin.providers
    .map((id) => ({
      id,
      ...(OAUTH_PROVIDERS[id] as OAuthProviderConfig),
      clientId: socialLogin[`${id}ClientId`],
    }))
    .filter((p): p is OAuthProviderEntry => Boolean(p.clientId));
};

/** Redirects the user to the OAuth provider's authorization page. */
export const initiateOAuthLogin = (
  providerId: string,
  options: InitiateOAuthOptions = {},
): string => {
  const appConfig = getCurrentAppConfig() as unknown as AppConfigEndpoints;
  const provider = OAUTH_PROVIDERS[providerId];

  if (!provider) throw new Error(`Unknown OAuth provider: ${providerId}`);
  if (!appConfig.features.socialLogin?.enabled) throw new Error("Social login is not enabled for this app");
  if (!appConfig.features.socialLogin.providers.includes(providerId)) {
    throw new Error(`${provider.name} login is not enabled for this app`);
  }

  const authUrl = provider.getAuthUrl(appConfig);
  const redirectUrl = options.redirectUrl ?? (typeof window !== "undefined" ? window.location.origin : "");

  if (typeof window !== "undefined") {
    sessionStorage.setItem("oauthRedirectUrl", redirectUrl);
    sessionStorage.setItem("oauthProvider", providerId);
    window.location.href = authUrl;
  }

  return authUrl;
};

/** Exchanges the OAuth callback code for an access token via the backend. */
export const handleOAuthCallback = async (
  code: string,
  state: string,
  provider: string,
): Promise<unknown> => {
  const appConfig = getCurrentAppConfig() as unknown as AppConfigEndpoints;

  try {
    const response = await fetch(
      `${appConfig.apiEndpoints.login.replace("/login", "")}/oauth/callback`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          state,
          provider,
          redirectUrl: typeof window !== "undefined" ? window.location.origin : "",
        }),
      },
    );

    if (!response.ok) throw new Error("OAuth authentication failed");

    const result: unknown = await response.json();

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("oauthRedirectUrl");
      sessionStorage.removeItem("oauthProvider");
    }

    return result;
  } catch (error) {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("oauthRedirectUrl");
      sessionStorage.removeItem("oauthProvider");
    }
    throw error;
  }
};

/** Returns true if the current URL has OAuth callback parameters. */
export const isOAuthCallback = (): boolean => {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  return params.has("code") && (params.has("state") || sessionStorage.getItem("oauthProvider") !== null);
};

/** Returns the post-OAuth redirect path stored before the provider redirect. */
export const getOAuthRedirectUrl = (): string => {
  if (typeof window === "undefined") return "/";
  return sessionStorage.getItem("oauthRedirectUrl") ?? "/";
};

// ---------------------------------------------------------------------------
// Session Utilities
// ---------------------------------------------------------------------------

export const sessionUtils = {
  /**
   * Attaches activity event listeners and starts a periodic inactivity check.
   * Returns a cleanup function to unbind listeners and clear the interval.
   */
  startActivityTracking: (callback: ActivityCallback, interval = 60_000): (() => void) | null => {
    if (typeof window === "undefined") return null;

    let lastActivity = Date.now();
    const trackActivity = () => {
      lastActivity = Date.now();
      callback(lastActivity);
    };

    const events: string[] = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    events.forEach((e) => document.addEventListener(e, trackActivity, true));

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivity > 30 * 60 * 1000) {
        callback(null, "SESSION_INACTIVE");
      }
    }, interval);

    return () => {
      events.forEach((e) => document.removeEventListener(e, trackActivity, true));
      clearInterval(intervalId);
    };
  },

  /** Returns true if the last activity timestamp is within the allowed inactivity window. */
  isSessionValid: (lastActivity: number | null, maxInactiveTime = 30 * 60 * 1000): boolean => {
    if (!lastActivity) return false;
    return Date.now() - lastActivity < maxInactiveTime;
  },

  /** Reads basic session metadata from sessionStorage. */
  getSessionInfo: () => {
    if (typeof window === "undefined") return null;
    return {
      sessionId: sessionStorage.getItem("sessionId"),
      deviceFingerprint: sessionStorage.getItem("deviceFingerprint"),
      lastActivity: parseInt(sessionStorage.getItem("lastActivity") ?? "0", 10),
      loginTime: parseInt(sessionStorage.getItem("loginTime") ?? "0", 10),
    };
  },
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/** Appends an activity record to the local sessionStorage queue (max 100 entries). */
export const trackUserActivity = async (
  event: string,
  data: Record<string, unknown> = {},
): Promise<void> => {
  if (typeof window === "undefined") return;

  try {
    const activityData: ActivityData = {
      event,
      timestamp: new Date().toISOString(),
      deviceFingerprint: sessionStorage.getItem("deviceFingerprint"),
      sessionId: sessionStorage.getItem("sessionId"),
      ...data,
    };

    const raw = sessionStorage.getItem("userActivities") ?? "[]";
    const activities = JSON.parse(raw) as ActivityData[];
    activities.push(activityData);

    if (activities.length > 100) activities.splice(0, activities.length - 100);

    sessionStorage.setItem("userActivities", JSON.stringify(activities));
  } catch {
    // Intentionally silent — activity tracking is non-critical; loss is acceptable
  }
};

export default {
  generateDeviceFingerprint,
  getDeviceInfo,
  OAUTH_PROVIDERS,
  getEnabledOAuthProviders,
  initiateOAuthLogin,
  handleOAuthCallback,
  isOAuthCallback,
  getOAuthRedirectUrl,
  sessionUtils,
  trackUserActivity,
};
