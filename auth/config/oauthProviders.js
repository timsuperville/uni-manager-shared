/* global window, TextEncoder, btoa, process */
/**
 * OAuth Provider Configurations
 * Supports Google, Microsoft, LinkedIn, GitHub, Spotify, Apple OAuth providers
 * Built based on Church app analysis to preserve all existing functionality
 */

/**
 * OAuth provider configurations with security features
 */
export const oauthProviders = {
  google: {
    name: "Google",
    iconName: "google",
    authUrl: "https://accounts.google.com/oauth2/v2/auth",
    scope: "openid email profile",
    responseType: "code",
    includeGrantedScopes: true,
    accessType: "offline",
    state: true, // Include CSRF protection

    // Enhanced security features from Church app
    security: {
      pkce: true, // Enable PKCE for security
      nonce: true, // Include nonce for ID token validation
      deviceFingerprinting: true,
      sessionTracking: true,
    },

    // App-specific configurations
    configs: {
      church: {
        scope:
          "openid email profile https://www.googleapis.com/auth/userinfo.email",
        additionalParams: {
          prompt: "consent", // Force consent screen for refresh tokens
          access_type: "offline",
        },
      },
      admin: {
        scope: "openid email profile",
        additionalParams: {
          hd:
            typeof process !== "undefined" && process.env
              ? process.env.GOOGLE_HOSTED_DOMAIN
              : undefined, // Optional domain restriction
        },
      },
      business: {
        scope: "openid email profile",
        additionalParams: {
          prompt: "select_account",
        },
      },
      personal: {
        scope: "openid email profile",
        additionalParams: {
          prompt: "select_account",
        },
      },
      home: {
        scope: "openid email profile",
        additionalParams: {
          prompt: "select_account",
        },
      },
      playback: {
        scope: "openid email profile",
        additionalParams: {
          prompt: "select_account",
        },
      },
    },
  },

  microsoft: {
    name: "Microsoft",
    iconName: "microsoft",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scope: "openid email profile User.Read",
    responseType: "code",
    state: true,

    security: {
      pkce: true,
      nonce: true,
      deviceFingerprinting: true,
      sessionTracking: true,
    },

    configs: {
      admin: {
        scope: "openid email profile User.Read Directory.Read.All",
        additionalParams: {
          prompt: "select_account",
        },
      },
      business: {
        scope: "openid email profile User.Read",
        additionalParams: {
          prompt: "select_account",
        },
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

    security: {
      pkce: false, // LinkedIn doesn't support PKCE yet
      nonce: false,
      deviceFingerprinting: true,
      sessionTracking: true,
    },

    configs: {
      business: {
        scope: "r_liteprofile r_emailaddress w_member_social",
        additionalParams: {},
      },
    },
  },

  github: {
    name: "GitHub",
    iconName: "github",
    authUrl: "https://github.com/login/oauth/authorize",
    scope: "user:email read:user",
    responseType: "code",
    state: true,

    security: {
      pkce: false, // GitHub doesn't support PKCE
      nonce: false,
      deviceFingerprinting: true,
      sessionTracking: true,
    },

    configs: {
      personal: {
        scope: "user:email read:user repo",
        additionalParams: {
          allow_signup: "false",
        },
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

    security: {
      pkce: true, // Spotify supports PKCE
      nonce: false,
      deviceFingerprinting: true,
      sessionTracking: true,
    },

    configs: {
      playback: {
        scope:
          "user-read-email user-read-private user-read-playback-state user-modify-playback-state",
        additionalParams: {
          show_dialog: "true",
        },
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

    security: {
      pkce: true, // Apple requires PKCE
      nonce: true, // Apple requires nonce
      deviceFingerprinting: true,
      sessionTracking: true,
    },

    configs: {
      playback: {
        scope: "email name",
        additionalParams: {
          response_mode: "form_post",
        },
      },
    },
  },
};

/**
 * Generate PKCE code verifier and challenge
 */
export const generatePKCE = async () => {
  if (
    typeof window === "undefined" ||
    !window.crypto ||
    !window.crypto.subtle
  ) {
    // Fallback for environments without Web Crypto API
    const verifier =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    return {
      codeVerifier: verifier,
      codeChallenge: verifier, // Fallback without proper hashing
    };
  }

  const codeVerifier = generateRandomString(128);
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const codeChallenge = base64URLEncode(digest);

  return {
    codeVerifier,
    codeChallenge,
  };
};

/**
 * Generate random string for PKCE
 */
const generateRandomString = (length) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * Base64 URL encode
 */
const base64URLEncode = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

/**
 * Generate nonce for security
 */
export const generateNonce = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * Generate state parameter for CSRF protection
 */
export const generateState = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
};

/**
 * Get provider configuration for specific app
 */
export const getProviderConfig = (providerId, appName) => {
  const provider = oauthProviders[providerId];
  if (!provider) {
    throw new Error(`Unsupported OAuth provider: ${providerId}`);
  }

  const appConfig = provider.configs[appName] || {};

  return {
    ...provider,
    scope: appConfig.scope || provider.scope,
    additionalParams: appConfig.additionalParams || {},
  };
};

/**
 * Validate OAuth provider support for app
 */
export const isProviderSupportedForApp = (providerId, appName) => {
  const provider = oauthProviders[providerId];
  if (!provider) return false;

  // If no app-specific config exists, provider is not supported for this app
  return Object.prototype.hasOwnProperty.call(provider.configs, appName);
};

/**
 * Get all supported providers for an app
 */
export const getSupportedProvidersForApp = (appName) => {
  return Object.keys(oauthProviders).filter((providerId) =>
    isProviderSupportedForApp(providerId, appName),
  );
};
