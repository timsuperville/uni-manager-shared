import React from "react";

/**
 * Unified Authentication System — Main Export Hub
 * ================================================
 *
 * Single entry point for all authentication features including:
 * - React Context (AuthProvider)
 * - Custom Hooks (18+ specialized hooks)
 * - UI Components (forms, MFA, session, RBAC, etc.)
 * - Services (consolidated session, auth, MFA, etc.)
 * - Type Definitions (comprehensive TypeScript types)
 * - Configuration (app configs, OAuth providers)
 */

// ── Context ───────────────────────────────────────────────────────────────────

export { AuthProvider, useAuth, AuthContext } from "./context/AuthContext.tsx";
export { withAuth, AuthContextProvider } from "./context/index.ts";
export { SSOContext, SSOProvider, useSSO, withSSO } from "./context/SSOContext.tsx";
export {
  RealTimeSecurityProvider,
  useRealTimeSecurity,
} from "./context/RealTimeSecurityContext.tsx";

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Primary hook
export { useAuth as useAuthHook } from "./hooks/useAuth.ts";

// Core context hooks (internal)
export { useAuthState } from "./hooks/useAuthState.ts";
export { useAuthActions } from "./hooks/useAuthActions.ts";
export { useAuthCallbacks } from "./hooks/useAuthCallbacks.ts";

// Specialized hooks
export { useLogin } from "./hooks/useLogin.ts";
export { useLogout } from "./hooks/useLogout.ts";
export { useMFA } from "./hooks/useMFA.ts";
export { useSession } from "./hooks/useSession.ts";
export { useOAuth } from "./hooks/useOAuth.ts";
export { useDeviceTrust } from "./hooks/useDeviceTrust.ts";
export { usePermissions } from "./hooks/usePermissions.ts";
export {
  useRateLimit,
  useLoginRateLimit,
  useMFARateLimit,
  useAPIRateLimit,
  usePasswordResetRateLimit,
} from "./hooks/useRateLimit.ts";
export { useAuthForm } from "./hooks/useAuthForm.ts";

// Church CAHA hooks
export { useChurchRole } from "./hooks/useChurchRole.ts";
export { useChurchId } from "./hooks/useChurchId.ts";

// Session management
export {
  useSessionManagement,
  useUserSessions,
  useSessionSecurity,
  useSessionAnalytics,
} from "./hooks/useSessionManagement.ts";

// Feature gates
export {
  useFeatureGate,
  useFeatureGates,
  invalidateFeatureGateCache,
} from "./hooks/useFeatureGate.ts";

// ── Components ────────────────────────────────────────────────────────────────

export { default as LoginForm } from "./components/LoginForm.jsx";
export { default as SignupForm } from "./components/SignupForm.jsx";
export { default as ForgotPasswordForm } from "./components/ForgotPasswordForm.jsx";

export const MFAVerification = React.lazy(
  () => import("./components/MFAVerification.jsx"),
);
export const MFASetup = React.lazy(() => import("./components/MFASetup.jsx"));

export { default as OAuthProviderComponents } from "./components/OAuthProviderComponents.jsx";
export { default as OAuthCallback } from "./components/OAuthCallback.jsx";
export { default as ProtectedRoute } from "./components/ProtectedRoute.jsx";
export { default as SecurityDashboard } from "./components/SecurityDashboard.jsx";
export { default as AuthLayout } from "./components/AuthLayout.jsx";
export { default as UserMenu } from "./components/UserMenu.jsx";

// RBAC Components (lazy)
export const PermissionGuard = React.lazy(() =>
  import("./rbac/RBACComponents.jsx").then((m) => ({ default: m.PermissionGuard })),
);
export const RoleGuard = React.lazy(() =>
  import("./rbac/RBACComponents.jsx").then((m) => ({ default: m.RoleGuard })),
);
export const FeatureGuard = React.lazy(() =>
  import("./rbac/RBACComponents.jsx").then((m) => ({ default: m.FeatureGuard })),
);

// ── Services ──────────────────────────────────────────────────────────────────

export { default as SessionService } from "./services/SessionService.js";
export { default as authService } from "./services/authService.js";
export {
  getSessionService,
  getAuthService,
  getMFAService,
  getTokenService,
  getOAuthService,
  getRBACService,
  getSecurityService,
  getDeviceService,
  getCacheService,
  getCrossAppService,
  getLoadedServices,
  isServiceAvailable,
  cacheService,
} from "./services/index.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export * from "./types/auth.types";

// ── Constants ─────────────────────────────────────────────────────────────────

export {
  SESSION_STATUS,
  SESSION_CONFIG,
  MFA_METHOD,
  MFA_STATUS,
  MFA_CONFIG,
  AUTH_ACTIONS,
  AUTH_ERROR_CODES,
  USER_ROLES,
  ROLE_HIERARCHY,
  PERMISSION_CATEGORIES,
  PASSWORD_POLICY,
  RATE_LIMIT,
  OAUTH_PROVIDERS,
  STORAGE_KEYS,
  AUTH_ENDPOINTS,
  HTTP_STATUS,
  AUTH_EVENTS,
} from "./types/constants.js";

export { listAvailableConstants } from "./types/index.js";

// ── Configuration ─────────────────────────────────────────────────────────────

export {
  APP_CONFIGS,
  getAppConfig,
  getCurrentAppName,
  getCurrentAppConfig,
} from "./config/appConfigs.js";

export {
  getSupportedProvidersForApp,
  getOAuthConfig,
} from "./config/oauthProviders.js";

// ── Utilities ─────────────────────────────────────────────────────────────────

export {
  validateEmail,
  validatePassword,
  validatePasswordStrength,
  validateToken,
  validateMFACode,
  validatePhoneNumber,
  sanitizeInput,
} from "./utils/authValidation.js";

export { TokenStorage, tokenStorage } from "./utils/TokenStorage.js";

// ── RBAC ──────────────────────────────────────────────────────────────────────

export { RBACUtils, PermissionUtils, RouteUtils } from "./rbac/utils.js";
export {
  PERMISSIONS,
  ROLES,
  APPLICATION_ROLES,
  PROTECTED_ROUTES,
  checkPermission,
  hasRole,
  checkAccess,
} from "./rbac/roles.js";

// ── Debug ─────────────────────────────────────────────────────────────────────

export function getAuthSystemStatus() {
  return {
    hooks: 18,
    components: 25,
    services: 10,
    types: 16,
    constants: 200,
    initialized: true,
  };
}
