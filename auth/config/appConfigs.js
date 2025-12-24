/**
 * App-specific authentication configurations
 * Each app has its own branding and API endpoints while maintaining consistent UX
 */
/* global window */

// Base API URL - can be overridden per app if needed
const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const APP_CONFIGS = {
  church: {
    appName: 'Church Manager',
    brandColor: 'blue', // Uses blue-500 as primary
    logo: '/church-logo.png',
    favicon: '/church-favicon.ico',
    apiEndpoints: {
      login: `${BASE_API_URL}/auth/login`,
      signup: `${BASE_API_URL}/auth/signup`,
      logout: `${BASE_API_URL}/auth/logout`,
      refresh: `${BASE_API_URL}/auth/refresh`,
      profile: `${BASE_API_URL}/auth/me`,
      updateProfile: `${BASE_API_URL}/auth/profile`,
      resetPassword: `${BASE_API_URL}/auth/reset-password`,
      changePassword: `${BASE_API_URL}/auth/change-password`,
    },
    features: {
      registration: true,
      socialLogin: {
        enabled: true,
        providers: ['google'], // Extensible array for future providers
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      },
      passwordReset: true,
      emailVerification: true,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV, // Only in development
    },
    permissions: {
      roles: ['admin', 'pastor', 'leader', 'member', 'visitor'],
      defaultRole: 'member',
    },
    branding: {
      primaryColor: 'rgb(59, 130, 246)', // blue-500
      primaryColorHover: 'rgb(37, 99, 235)', // blue-600
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      focusRing: 'focus:ring-blue-500',
      accentColor: 'accent-blue-500',
    },
  },

  admin: {
    appName: 'Admin Portal',
    brandColor: 'red', // Uses red-500 as primary
    logo: '/admin-logo.png',
    favicon: '/admin-favicon.ico',
    apiEndpoints: {
      login: `${BASE_API_URL}/auth/login`,
      signup: `${BASE_API_URL}/auth/signup`,
      logout: `${BASE_API_URL}/auth/logout`,
      refresh: `${BASE_API_URL}/auth/refresh`,
      profile: `${BASE_API_URL}/auth/me`,
      updateProfile: `${BASE_API_URL}/auth/profile`,
      resetPassword: `${BASE_API_URL}/auth/reset-password`,
      changePassword: `${BASE_API_URL}/auth/change-password`,
    },
    features: {
      registration: false, // Admin accounts created by super admin
      socialLogin: {
        enabled: true,
        providers: ['google', 'microsoft'], // Enterprise providers
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        microsoftClientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
      },
      passwordReset: true,
      emailVerification: true,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV,
    },
    permissions: {
      roles: ['super_admin', 'admin', 'moderator', 'support'],
      defaultRole: 'support',
    },
    branding: {
      primaryColor: 'rgb(71, 85, 105)', // slate-600
      primaryColorHover: 'rgb(51, 65, 85)', // slate-700
      gradientFrom: 'from-slate-600',
      gradientTo: 'to-slate-700',
      focusRing: 'focus:ring-slate-500',
      accentColor: 'accent-slate-600',
    },
  },

  business: {
    appName: 'Business Manager',
    brandColor: 'emerald', // Uses emerald-500 as primary
    logo: '/business-logo.png',
    favicon: '/business-favicon.ico',
    apiEndpoints: {
      login: `${BASE_API_URL}/auth/login`,
      signup: `${BASE_API_URL}/auth/signup`,
      logout: `${BASE_API_URL}/auth/logout`,
      refresh: `${BASE_API_URL}/auth/refresh`,
      profile: `${BASE_API_URL}/auth/profile`,
      updateProfile: `${BASE_API_URL}/auth/profile`,
      resetPassword: `${BASE_API_URL}/auth/reset-password`,
      changePassword: `${BASE_API_URL}/auth/change-password`,
    },
    features: {
      registration: true,
      socialLogin: {
        enabled: true,
        providers: ['google', 'linkedin'], // Business-focused providers
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        linkedinClientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
      },
      passwordReset: true,
      emailVerification: true,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV,
    },
    permissions: {
      roles: ['owner', 'manager', 'employee', 'client', 'guest'],
      defaultRole: 'guest',
    },
    branding: {
      primaryColor: 'rgb(16, 185, 129)', // emerald-500
      primaryColorHover: 'rgb(5, 150, 105)', // emerald-600
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-600',
      focusRing: 'focus:ring-emerald-500',
      accentColor: 'accent-emerald-500',
    },
  },

  home: {
    appName: 'Home Hub',
    brandColor: 'amber', // Uses amber-500 as primary
    logo: '/home-logo.png',
    favicon: '/home-favicon.ico',
    apiEndpoints: {
      login: `${BASE_API_URL}/auth/login`,
      signup: `${BASE_API_URL}/auth/signup`,
      logout: `${BASE_API_URL}/auth/logout`,
      refresh: `${BASE_API_URL}/auth/refresh`,
      profile: `${BASE_API_URL}/auth/profile`,
      updateProfile: `${BASE_API_URL}/auth/profile`,
      resetPassword: `${BASE_API_URL}/auth/reset-password`,
      changePassword: `${BASE_API_URL}/auth/change-password`,
    },
    features: {
      registration: true,
      socialLogin: {
        enabled: false, // Family-focused, local accounts preferred
        providers: [],
      },
      passwordReset: true,
      emailVerification: false,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: false, // Simplified for family use
      sessionManagement: true,
      testLogin: import.meta.env.DEV,
    },
    permissions: {
      roles: ['head', 'adult', 'teen', 'child', 'guest'],
      defaultRole: 'guest',
    },
    branding: {
      primaryColor: 'rgb(245, 158, 11)', // amber-500
      primaryColorHover: 'rgb(217, 119, 6)', // amber-600
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-600',
      focusRing: 'focus:ring-amber-500',
      accentColor: 'accent-amber-500',
    },
  },

  personal: {
    appName: 'Personal Dashboard',
    brandColor: 'purple', // Uses purple-500 as primary
    logo: '/personal-logo.png',
    favicon: '/personal-favicon.ico',
    apiEndpoints: {
      login: `${BASE_API_URL}/auth/login`,
      signup: `${BASE_API_URL}/auth/signup`,
      logout: `${BASE_API_URL}/auth/logout`,
      refresh: `${BASE_API_URL}/auth/refresh`,
      profile: `${BASE_API_URL}/auth/profile`,
      updateProfile: `${BASE_API_URL}/auth/profile`,
      resetPassword: `${BASE_API_URL}/auth/reset-password`,
      changePassword: `${BASE_API_URL}/auth/change-password`,
    },
    features: {
      registration: true,
      socialLogin: {
        enabled: true,
        providers: ['google', 'github'], // Personal/creative providers
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
      },
      passwordReset: true,
      emailVerification: false,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV,
    },
    permissions: {
      roles: ['user'],
      defaultRole: 'user',
    },
    branding: {
      primaryColor: 'rgb(168, 85, 247)', // purple-500
      primaryColorHover: 'rgb(147, 51, 234)', // purple-600
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
      focusRing: 'focus:ring-purple-500',
      accentColor: 'accent-purple-500',
    },
  },

  playback: {
    appName: 'Media Player',
    brandColor: 'rose', // Uses rose-500 as primary
    logo: '/playback-logo.png',
    favicon: '/playback-favicon.ico',
    apiEndpoints: {
      login: `${BASE_API_URL}/auth/login`,
      signup: `${BASE_API_URL}/auth/signup`,
      logout: `${BASE_API_URL}/auth/logout`,
      refresh: `${BASE_API_URL}/auth/refresh`,
      profile: `${BASE_API_URL}/auth/profile`,
      updateProfile: `${BASE_API_URL}/auth/profile`,
      resetPassword: `${BASE_API_URL}/auth/reset-password`,
      changePassword: `${BASE_API_URL}/auth/change-password`,
    },
    features: {
      registration: true,
      socialLogin: {
        enabled: true,
        providers: ['google', 'spotify', 'apple'], // Media-focused providers
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
        appleClientId: import.meta.env.VITE_APPLE_CLIENT_ID,
      },
      passwordReset: true,
      emailVerification: false,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV,
    },
    permissions: {
      roles: ['premium', 'standard', 'guest'],
      defaultRole: 'guest',
    },
    branding: {
      primaryColor: 'rgb(244, 63, 94)', // rose-500
      primaryColorHover: 'rgb(225, 29, 72)', // rose-600
      gradientFrom: 'from-rose-500',
      gradientTo: 'to-rose-600',
      focusRing: 'focus:ring-rose-500',
      accentColor: 'accent-rose-500',
    },
  },
};

/**
 * Get configuration for a specific app
 * @param {string} appName - Name of the app (church, admin, business, etc.)
 * @returns {Object} App configuration object
 */
export function getAppConfig(appName) {
  const config = APP_CONFIGS[appName.toLowerCase()];
  if (!config) {
    // eslint-disable-next-line no-console
    // console.warn(
    //   `No configuration found for app: ${appName}. Using default config.`
    // );
    return APP_CONFIGS.church; // Default fallback
  }
  return config;
}

/**
 * Get the current app name from the window location or environment
 * @returns {string} Current app name
 */
export function getCurrentAppName() {
  // Check for environment variable first
  if (import.meta.env.VITE_APP_NAME) {
    return import.meta.env.VITE_APP_NAME.toLowerCase();
  }

  // Parse from hostname in development
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const hostname = typeof window !== "undefined" && window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      const port = typeof window !== "undefined" && window.location.port;
      const portMap = {
        5173: 'church',
        5174: 'admin',
        5175: 'business',
        5176: 'home',
        5177: 'personal',
        5178: 'playback',
      };
      return portMap[port] || 'church';
    }
  }

  // Parse from subdomain in production
  if (typeof window !== 'undefined') {
    const subdomain = typeof window !== "undefined" && window.location.hostname.split('.')[0];
    if (Object.keys(APP_CONFIGS).includes(subdomain)) {
      return subdomain;
    }
  }

  // Default fallback
  return 'church';
}

/**
 * Get the current app's configuration
 * @returns {Object} Current app configuration
 */
export function getCurrentAppConfig() {
  const appName = getCurrentAppName();
  return getAppConfig(appName);
}

export default APP_CONFIGS;
