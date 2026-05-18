/* global window */
/**
 * App-specific authentication configurations
 * Each app has its own branding and API endpoints while maintaining consistent UX.
 */

import React from 'react';
import { getApiBaseUrl } from '../../api/config/apiConfig';
import {
  ChurchAppLogo,
  AdminAppLogo,
  WorkAppLogo,
  HomeAppLogo,
  PersonalAppLogo,
  PlaybackAppLogo,
  PresentationAppLogo
} from '../../components/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppName =
  | 'church'
  | 'admin'
  | 'work'
  | 'home'
  | 'personal'
  | 'playback'
  | 'presentation';

export type SecurityProfile = 'standard' | 'strict' | 'relaxed';

export interface SocialLoginConfig {
  enabled: boolean;
  providers: string[];
  googleClientId?: string;
  microsoftClientId?: string;
  linkedinClientId?: string;
  githubClientId?: string;
  spotifyClientId?: string;
  appleClientId?: string;
}

export interface AppFeatures {
  registration: boolean;
  socialLogin: SocialLoginConfig;
  passwordReset: boolean;
  emailVerification: boolean;
  rememberMe: boolean;
  profileManagement: boolean;
  deviceFingerprinting: boolean;
  sessionManagement: boolean;
  testLogin: boolean;
}

export interface AppEndpoints {
  login: string;
  signup: string;
  logout: string;
  refresh: string;
  refreshToken: string;
  profile: string;
  updateProfile: string;
  resetPassword: string;
  changePassword: string;
  uploadAvatar?: string;
  uploadCoverImage?: string;
}

export interface AppBranding {
  primaryColor: string;
  primaryColorHover: string;
  gradientFrom: string;
  gradientTo: string;
  focusRing: string;
  accentColor: string;
}

export interface AppUI {
  icon: React.ReactNode;
  loginTitle: string;
  loginDescription: string;
  registerPath: string;
}

export interface AppPermissions {
  roles: string[];
  defaultRole: string;
}

export interface AppConfig {
  appName: string;
  appType: AppName;
  storageNamespace: string;
  brandColor: string;
  logo: string;
  favicon: string;
  apiEndpoints: AppEndpoints;
  features: AppFeatures;
  permissions: AppPermissions;
  branding: AppBranding;
  ui: AppUI;
  name?: string; // resolved at runtime by getCurrentAppConfig
  securityProfile: SecurityProfile;
  [key: string]: unknown;
}

// ── Configuration ─────────────────────────────────────────────────────────────

// Base API URL — resolved from the canonical shared config (handles SSR, prod origin, dev fallback)
const BASE_API_URL = getApiBaseUrl();

export const APP_CONFIGS: Record<AppName, AppConfig> = {
  church: {
    appName: 'Ecclesia',
    appType: 'church',
    storageNamespace: 'church',
    brandColor: 'violet',
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    securityProfile: 'standard',
    apiEndpoints: {
      login: `${BASE_API_URL}/api/v1/auth/login`,
      signup: `${BASE_API_URL}/api/v1/auth/signup`,
      logout: `${BASE_API_URL}/api/v1/auth/logout`,
      refresh: `${BASE_API_URL}/api/v1/auth/refresh`,
      refreshToken: `${BASE_API_URL}/api/v1/auth/refresh-token`,
      profile: `${BASE_API_URL}/api/v1/auth/me`,
      updateProfile: `${BASE_API_URL}/api/v1/users/profile`,
      resetPassword: `${BASE_API_URL}/api/v1/auth/reset-password`,
      changePassword: `${BASE_API_URL}/api/v1/auth/change-password`,
      uploadAvatar: `${BASE_API_URL}/api/v1/users/profile/avatar`,
      uploadCoverImage: `${BASE_API_URL}/api/v1/users/profile/cover`
    },
    features: {
      registration: true,
      socialLogin: {
        enabled: true,
        providers: ['google'],
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as
          | string
          | undefined
      },
      passwordReset: true,
      emailVerification: true,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV as boolean
    },
    permissions: {
      roles: ['visitor', 'viewer', 'attendee', 'member', 'volunteer', 'admin'],
      defaultRole: 'member'
    },
    branding: {
      primaryColor: 'rgb(124, 58, 237)',
      primaryColorHover: 'rgb(109, 40, 217)',
      gradientFrom: 'from-violet-600',
      gradientTo: 'to-violet-700',
      focusRing: 'focus:ring-violet-500',
      accentColor: 'accent-violet-600'
    },
    ui: {
      icon: (
        <ChurchAppLogo
          size={40}
          style={{ color: 'rgb(124, 58, 237)' }}
          sw={2}
        />
      ),
      loginTitle: 'Ecclesia',
      loginDescription: 'Sign in to your church community',
      registerPath: '/auth/register'
    }
  },

  admin: {
    appName: 'Admin Portal',
    appType: 'admin',
    storageNamespace: 'admin',
    brandColor: 'red',
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    securityProfile: 'strict',
    apiEndpoints: {
      login: `${BASE_API_URL}/api/v1/auth/login`,
      signup: `${BASE_API_URL}/api/v1/auth/signup`,
      logout: `${BASE_API_URL}/api/v1/auth/logout`,
      refresh: `${BASE_API_URL}/api/v1/auth/refresh`,
      refreshToken: `${BASE_API_URL}/api/v1/auth/refresh-token`,
      profile: `${BASE_API_URL}/api/v1/auth/me`,
      updateProfile: `${BASE_API_URL}/api/v1/auth/profile`,
      resetPassword: `${BASE_API_URL}/api/v1/auth/reset-password`,
      changePassword: `${BASE_API_URL}/api/v1/auth/change-password`
    },
    features: {
      registration: false,
      socialLogin: {
        enabled: true,
        providers: ['google', 'microsoft'],
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as
          | string
          | undefined,
        microsoftClientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID as
          | string
          | undefined
      },
      passwordReset: true,
      emailVerification: true,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV as boolean
    },
    permissions: {
      roles: ['super_admin', 'admin', 'moderator', 'support'],
      defaultRole: 'support'
    },
    branding: {
      primaryColor: 'rgb(71, 85, 105)',
      primaryColorHover: 'rgb(51, 65, 85)',
      gradientFrom: 'from-slate-600',
      gradientTo: 'to-slate-700',
      focusRing: 'focus:ring-slate-500',
      accentColor: 'accent-slate-600'
    },
    ui: {
      icon: (
        <AdminAppLogo size={40} style={{ color: 'rgb(71, 85, 105)' }} sw={2} />
      ),
      loginTitle: 'Admin Portal Access',
      loginDescription: 'Sign in to access the administrative dashboard',
      registerPath: '/auth/register'
    }
  },

  work: {
    appName: 'Work Manager',
    appType: 'work',
    storageNamespace: 'work',
    brandColor: 'emerald',
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    securityProfile: 'standard',
    apiEndpoints: {
      login: `${BASE_API_URL}/api/v1/auth/login`,
      signup: `${BASE_API_URL}/api/v1/auth/signup`,
      logout: `${BASE_API_URL}/api/v1/auth/logout`,
      refresh: `${BASE_API_URL}/api/v1/auth/refresh`,
      refreshToken: `${BASE_API_URL}/api/v1/auth/refresh-token`,
      profile: `${BASE_API_URL}/api/v1/auth/profile`,
      updateProfile: `${BASE_API_URL}/api/v1/auth/profile`,
      resetPassword: `${BASE_API_URL}/api/v1/auth/reset-password`,
      changePassword: `${BASE_API_URL}/api/v1/auth/change-password`
    },
    features: {
      registration: true,
      socialLogin: {
        enabled: true,
        providers: ['google', 'linkedin'],
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as
          | string
          | undefined,
        linkedinClientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID as
          | string
          | undefined
      },
      passwordReset: true,
      emailVerification: true,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV as boolean
    },
    permissions: {
      roles: ['owner', 'manager', 'employee', 'client', 'guest'],
      defaultRole: 'guest'
    },
    branding: {
      primaryColor: 'rgb(16, 185, 129)',
      primaryColorHover: 'rgb(5, 150, 105)',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-600',
      focusRing: 'focus:ring-emerald-500',
      accentColor: 'accent-emerald-500'
    },
    ui: {
      icon: (
        <WorkAppLogo size={40} style={{ color: 'rgb(16, 185, 129)' }} sw={2} />
      ),
      loginTitle: 'Work Portal',
      loginDescription: 'Access your work management tools',
      registerPath: '/auth/register'
    }
  },

  home: {
    appName: 'Home Hub',
    appType: 'home',
    storageNamespace: 'home',
    brandColor: 'amber',
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    securityProfile: 'standard',
    apiEndpoints: {
      login: `${BASE_API_URL}/api/v1/auth/login`,
      signup: `${BASE_API_URL}/api/v1/auth/signup`,
      logout: `${BASE_API_URL}/api/v1/auth/logout`,
      refresh: `${BASE_API_URL}/api/v1/auth/refresh`,
      refreshToken: `${BASE_API_URL}/api/v1/auth/refresh-token`,
      profile: `${BASE_API_URL}/api/v1/auth/profile`,
      updateProfile: `${BASE_API_URL}/api/v1/auth/profile`,
      resetPassword: `${BASE_API_URL}/api/v1/auth/reset-password`,
      changePassword: `${BASE_API_URL}/api/v1/auth/change-password`
    },
    features: {
      registration: true,
      socialLogin: { enabled: false, providers: [] },
      passwordReset: true,
      emailVerification: false,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: false,
      sessionManagement: true,
      testLogin: import.meta.env.DEV as boolean
    },
    permissions: {
      roles: ['head', 'adult', 'teen', 'child', 'guest'],
      defaultRole: 'guest'
    },
    branding: {
      primaryColor: 'rgb(245, 158, 11)',
      primaryColorHover: 'rgb(217, 119, 6)',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-600',
      focusRing: 'focus:ring-amber-500',
      accentColor: 'accent-amber-500'
    },
    ui: {
      icon: (
        <HomeAppLogo size={40} style={{ color: 'rgb(245, 158, 11)' }} sw={2} />
      ),
      loginTitle: 'Home Management',
      loginDescription: 'Manage your household and family activities',
      registerPath: '/auth/register'
    }
  },

  personal: {
    appName: 'Personal Dashboard',
    appType: 'personal',
    storageNamespace: 'personal',
    brandColor: 'purple',
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    securityProfile: 'standard',
    apiEndpoints: {
      login: `${BASE_API_URL}/api/v1/auth/login`,
      signup: `${BASE_API_URL}/api/v1/auth/signup`,
      logout: `${BASE_API_URL}/api/v1/auth/logout`,
      refresh: `${BASE_API_URL}/api/v1/auth/refresh`,
      refreshToken: `${BASE_API_URL}/api/v1/auth/refresh-token`,
      profile: `${BASE_API_URL}/api/v1/auth/profile`,
      updateProfile: `${BASE_API_URL}/api/v1/auth/profile`,
      resetPassword: `${BASE_API_URL}/api/v1/auth/reset-password`,
      changePassword: `${BASE_API_URL}/api/v1/auth/change-password`
    },
    features: {
      registration: true,
      socialLogin: {
        enabled: true,
        providers: ['google', 'github'],
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as
          | string
          | undefined,
        githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID as
          | string
          | undefined
      },
      passwordReset: true,
      emailVerification: false,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV as boolean
    },
    permissions: {
      roles: ['user'],
      defaultRole: 'user'
    },
    branding: {
      primaryColor: 'rgb(168, 85, 247)',
      primaryColorHover: 'rgb(147, 51, 234)',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
      focusRing: 'focus:ring-purple-500',
      accentColor: 'accent-purple-500'
    },
    ui: {
      icon: (
        <PersonalAppLogo
          size={40}
          style={{ color: 'rgb(168, 85, 247)' }}
          sw={2}
        />
      ),
      loginTitle: 'Personal Dashboard',
      loginDescription: 'Access your personal productivity tools',
      registerPath: '/auth/register'
    }
  },

  playback: {
    appName: 'Media Player',
    appType: 'playback',
    storageNamespace: 'playback',
    brandColor: 'rose',
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    securityProfile: 'relaxed',
    apiEndpoints: {
      login: `${BASE_API_URL}/api/v1/auth/login`,
      signup: `${BASE_API_URL}/api/v1/auth/signup`,
      logout: `${BASE_API_URL}/api/v1/auth/logout`,
      refresh: `${BASE_API_URL}/api/v1/auth/refresh`,
      refreshToken: `${BASE_API_URL}/api/v1/auth/refresh-token`,
      profile: `${BASE_API_URL}/api/v1/auth/profile`,
      updateProfile: `${BASE_API_URL}/api/v1/auth/profile`,
      resetPassword: `${BASE_API_URL}/api/v1/auth/reset-password`,
      changePassword: `${BASE_API_URL}/api/v1/auth/change-password`
    },
    features: {
      registration: true,
      socialLogin: {
        enabled: true,
        providers: ['google', 'spotify', 'apple'],
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as
          | string
          | undefined,
        spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID as
          | string
          | undefined,
        appleClientId: import.meta.env.VITE_APPLE_CLIENT_ID as
          | string
          | undefined
      },
      passwordReset: true,
      emailVerification: false,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV as boolean
    },
    permissions: {
      roles: ['premium', 'standard', 'guest'],
      defaultRole: 'guest'
    },
    branding: {
      primaryColor: 'rgb(244, 63, 94)',
      primaryColorHover: 'rgb(225, 29, 72)',
      gradientFrom: 'from-rose-500',
      gradientTo: 'to-rose-600',
      focusRing: 'focus:ring-rose-500',
      accentColor: 'accent-rose-500'
    },
    ui: {
      icon: (
        <PlaybackAppLogo
          size={40}
          style={{ color: 'rgb(244, 63, 94)' }}
          sw={2}
        />
      ),
      loginTitle: 'Media Playback',
      loginDescription: 'Control and manage media playback',
      registerPath: '/auth/register'
    }
  },

  presentation: {
    appName: 'Presentation Pro',
    appType: 'presentation',
    storageNamespace: 'presentation',
    brandColor: 'violet',
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    securityProfile: 'relaxed',
    apiEndpoints: {
      login: `${BASE_API_URL}/api/v1/auth/login`,
      signup: `${BASE_API_URL}/api/v1/auth/signup`,
      logout: `${BASE_API_URL}/api/v1/auth/logout`,
      refresh: `${BASE_API_URL}/api/v1/auth/refresh`,
      refreshToken: `${BASE_API_URL}/api/v1/auth/refresh-token`,
      profile: `${BASE_API_URL}/api/v1/auth/profile`,
      updateProfile: `${BASE_API_URL}/api/v1/auth/profile`,
      resetPassword: `${BASE_API_URL}/api/v1/auth/reset-password`,
      changePassword: `${BASE_API_URL}/api/v1/auth/change-password`
    },
    features: {
      registration: false,
      socialLogin: { enabled: false, providers: [] },
      passwordReset: true,
      emailVerification: false,
      rememberMe: true,
      profileManagement: true,
      deviceFingerprinting: true,
      sessionManagement: true,
      testLogin: import.meta.env.DEV as boolean
    },
    permissions: {
      roles: ['operator', 'admin', 'guest'],
      defaultRole: 'guest'
    },
    branding: {
      primaryColor: 'rgb(139, 92, 246)',
      primaryColorHover: 'rgb(124, 58, 237)',
      gradientFrom: 'from-violet-500',
      gradientTo: 'to-violet-600',
      focusRing: 'focus:ring-violet-500',
      accentColor: 'accent-violet-500'
    },
    ui: {
      icon: (
        <PresentationAppLogo
          size={40}
          style={{ color: 'rgb(139, 92, 246)' }}
          sw={2}
        />
      ),
      loginTitle: 'Presentation Pro',
      loginDescription: 'Service stage management and projection',
      registerPath: '/auth/register'
    }
  }
};

// ── Utility functions ─────────────────────────────────────────────────────────

export function getAppConfig(appName: string): AppConfig {
  const config = APP_CONFIGS[appName.toLowerCase() as AppName];
  return config ?? APP_CONFIGS.church;
}

const PORT_MAP: Record<number, AppName> = {
  5173: 'church',
  5174: 'admin',
  5175: 'home',
  5176: 'work',
  5177: 'personal',
  5178: 'playback',
  5179: 'presentation'
};

export function getCurrentAppName(): AppName {
  // Priority 1: Vite compile-time define
  if (import.meta.env.VITE_APP_TYPE) {
    return import.meta.env.VITE_APP_TYPE.toLowerCase() as AppName;
  }

  // Priority 2: Explicit env var override
  if (import.meta.env.VITE_APP_NAME) {
    return import.meta.env.VITE_APP_NAME.toLowerCase() as AppName;
  }

  // Priority 3: Port-based lookup (localhost only)
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const port = parseInt(window.location.port, 10);
      const mapped = PORT_MAP[port];
      if (mapped) return mapped;
    }
  }

  // Priority 4: Subdomain-based lookup (production)
  if (typeof window !== 'undefined') {
    const subdomain = window.location.hostname.split('.')[0] as AppName;
    if (Object.prototype.hasOwnProperty.call(APP_CONFIGS, subdomain))
      return subdomain;
  }

  return 'church';
}

export function getCurrentAppConfig(
  appType?: string
): AppConfig & { name: AppName } {
  const name = appType
    ? (appType.toLowerCase() as AppName)
    : getCurrentAppName();
  const config = getAppConfig(name);
  return { ...config, name };
}

export default APP_CONFIGS;
