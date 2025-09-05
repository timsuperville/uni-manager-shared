/* global navigator, document, window, screen, sessionStorage, fetch, Intl, URLSearchParams */
/**
 * Social Authentication Utilities
 * Handles OAuth providers (Google, Microsoft, LinkedIn, GitHub, Spotify, Apple)
 */

import { getCurrentAppConfig } from "../config/appConfigs.js";

/**
 * Generate device fingerprint for security
 */
export const generateDeviceFingerprint = async () => {
  if (typeof window === "undefined" || typeof document === "undefined")
    return "server-render";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";
  ctx.font = "14px Arial";
  ctx.fillText("Device fingerprint", 2, 2);

  const fingerprint = [
    typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    typeof navigator !== "undefined" ? navigator.language : "en",
    typeof screen !== "undefined"
      ? screen.width + "x" + screen.height
      : "1920x1080",
    new Date().getTimezoneOffset(),
    typeof navigator !== "undefined" ? navigator.platform : "unknown",
    canvas.toDataURL(),
  ].join("|");

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
};

/**
 * Get device information for session management
 */
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
    fingerprint: null, // Will be set by generateDeviceFingerprint
  };
};

/**
 * OAuth Provider Configuration
 */
export const OAUTH_PROVIDERS = {
  google: {
    name: "Google",
    icon: "FcGoogle",
    color: "#4285f4",
    getAuthUrl: (appConfig) =>
      `${appConfig.apiEndpoints.login.replace("/login", "")}/google`,
    scopes: ["profile", "email"],
  },
  microsoft: {
    name: "Microsoft",
    icon: "SiMicrosoft",
    color: "#00a4ef",
    getAuthUrl: (appConfig) =>
      `${appConfig.apiEndpoints.login.replace("/login", "")}/microsoft`,
    scopes: ["User.Read"],
  },
  linkedin: {
    name: "LinkedIn",
    icon: "FaLinkedin",
    color: "#0077b5",
    getAuthUrl: (appConfig) =>
      `${appConfig.apiEndpoints.login.replace("/login", "")}/linkedin`,
    scopes: ["r_liteprofile", "r_emailaddress"],
  },
  github: {
    name: "GitHub",
    icon: "FaGithub",
    color: "#333",
    getAuthUrl: (appConfig) =>
      `${appConfig.apiEndpoints.login.replace("/login", "")}/github`,
    scopes: ["user:email"],
  },
  spotify: {
    name: "Spotify",
    icon: "FaSpotify",
    color: "#1db954",
    getAuthUrl: (appConfig) =>
      `${appConfig.apiEndpoints.login.replace("/login", "")}/spotify`,
    scopes: ["user-read-email", "user-read-private"],
  },
  apple: {
    name: "Apple",
    icon: "FaApple",
    color: "#000",
    getAuthUrl: (appConfig) =>
      `${appConfig.apiEndpoints.login.replace("/login", "")}/apple`,
    scopes: ["name", "email"],
  },
};

/**
 * Get enabled OAuth providers for current app
 */
export const getEnabledOAuthProviders = () => {
  const appConfig = getCurrentAppConfig();

  if (!appConfig.features.socialLogin?.enabled) {
    return [];
  }

  return appConfig.features.socialLogin.providers
    .map((providerId) => ({
      id: providerId,
      ...OAUTH_PROVIDERS[providerId],
      clientId: appConfig.features.socialLogin[`${providerId}ClientId`],
    }))
    .filter((provider) => provider.clientId); // Only include providers with valid client IDs
};

/**
 * Initiate OAuth login
 */
export const initiateOAuthLogin = (providerId, options = {}) => {
  const appConfig = getCurrentAppConfig();
  const provider = OAUTH_PROVIDERS[providerId];

  if (!provider) {
    throw new Error(`Unknown OAuth provider: ${providerId}`);
  }

  if (!appConfig.features.socialLogin?.enabled) {
    throw new Error("Social login is not enabled for this app");
  }

  if (!appConfig.features.socialLogin.providers.includes(providerId)) {
    throw new Error(`${provider.name} login is not enabled for this app`);
  }

  const authUrl = provider.getAuthUrl(appConfig);
  const redirectUrl = options.redirectUrl || window.location.origin;

  // Store redirect URL for after OAuth callback
  if (typeof window !== "undefined") {
    sessionStorage.setItem("oauthRedirectUrl", redirectUrl);
    sessionStorage.setItem("oauthProvider", providerId);
  }

  // Redirect to OAuth provider
  if (typeof window !== "undefined") {
    window.location.href = authUrl;
  }

  return authUrl;
};

/**
 * Handle OAuth callback
 */
export const handleOAuthCallback = async (code, state, provider) => {
  const appConfig = getCurrentAppConfig();

  try {
    const response = await fetch(
      `${appConfig.apiEndpoints.login.replace("/login", "")}/oauth/callback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          state,
          provider,
          redirectUrl: window.location.origin,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("OAuth authentication failed");
    }

    const result = await response.json();

    // Clear OAuth storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("oauthRedirectUrl");
      sessionStorage.removeItem("oauthProvider");
    }

    return result;
  } catch (error) {
    // Clear OAuth storage on error
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("oauthRedirectUrl");
      sessionStorage.removeItem("oauthProvider");
    }
    throw error;
  }
};

/**
 * Check if user is in OAuth callback flow
 */
export const isOAuthCallback = () => {
  if (typeof window === "undefined") return false;

  const urlParams = new URLSearchParams(window.location.search);
  const hasCode = urlParams.has("code");
  const hasState = urlParams.has("state");
  const hasProvider = sessionStorage.getItem("oauthProvider");

  return hasCode && (hasState || hasProvider);
};

/**
 * Get OAuth redirect URL after successful authentication
 */
export const getOAuthRedirectUrl = () => {
  if (typeof window === "undefined") return "/";

  return sessionStorage.getItem("oauthRedirectUrl") || "/";
};

/**
 * Enhanced session management utilities
 */
export const sessionUtils = {
  /**
   * Start activity tracking
   */
  startActivityTracking: (callback, interval = 60000) => {
    if (typeof window === "undefined") return null;

    let lastActivity = Date.now();

    const trackActivity = () => {
      lastActivity = Date.now();
      callback(lastActivity);
    };

    // Track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, trackActivity, true);
    });

    // Periodic check for session validity
    const intervalId = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      if (timeSinceActivity > 30 * 60 * 1000) {
        // 30 minutes of inactivity
        callback(null, "SESSION_INACTIVE");
      }
    }, interval);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, trackActivity, true);
      });
      clearInterval(intervalId);
    };
  },

  /**
   * Check session validity
   */
  isSessionValid: (lastActivity, maxInactiveTime = 30 * 60 * 1000) => {
    if (!lastActivity) return false;
    return Date.now() - lastActivity < maxInactiveTime;
  },

  /**
   * Get session info
   */
  getSessionInfo: () => {
    if (typeof window === "undefined") return null;

    return {
      sessionId: sessionStorage.getItem("sessionId"),
      deviceFingerprint: sessionStorage.getItem("deviceFingerprint"),
      lastActivity: parseInt(sessionStorage.getItem("lastActivity") || "0"),
      loginTime: parseInt(sessionStorage.getItem("loginTime") || "0"),
    };
  },
};

/**
 * Track user activity for analytics and security
 */
export const trackUserActivity = async (event, data = {}) => {
  if (typeof window === "undefined") return;

  try {
    const activityData = {
      event,
      timestamp: new Date().toISOString(),
      deviceFingerprint: sessionStorage.getItem("deviceFingerprint"),
      sessionId: sessionStorage.getItem("sessionId"),
      ...data,
    };

    // Store locally for now - could be sent to analytics service
    const activities = JSON.parse(
      sessionStorage.getItem("userActivities") || "[]"
    );
    activities.push(activityData);

    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.splice(0, activities.length - 100);
    }

    sessionStorage.setItem("userActivities", JSON.stringify(activities));

    // Could send to analytics endpoint here
    console.log("User activity tracked:", activityData);
  } catch (error) {
    console.warn("Failed to track user activity:", error);
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
