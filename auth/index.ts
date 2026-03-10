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

export { default as LoginForm } from "./components/LoginForm.tsx";
export { default as SignupForm } from "./components/SignupForm.tsx";
export { default as ForgotPasswordForm } from "./components/ForgotPasswordForm.tsx";

export const MFAVerification = React.lazy(
  () => import("./components/MFAVerification.tsx"),
);
export const MFASetup = React.lazy(() => import("./components/MFASetup.tsx"));

export { default as OAuthProviderComponents } from "./components/OAuthProviderComponents.tsx";
export { default as OAuthCallback } from "./components/OAuthCallback.tsx";
export { default as ProtectedRoute } from "./components/ProtectedRoute.tsx";
export { default as SecurityDashboard } from "./components/SecurityDashboard.tsx";
export { default as AuthLayout } from "./components/AuthLayout.tsx";
export { default as UserMenu } from "./components/UserMenu.tsx";

// RBAC — context (backward compat: wraps useAuth)
export { RBACProvider, useRBAC } from "./components/RBACComponents.tsx";

// RBAC — guards (lazy-loaded, avoid bloating the initial bundle)
export const PermissionGuard = React.lazy(() =>
  import("./components/RBACComponents.tsx").then((m) => ({ default: m.PermissionGuard })),
);
export const RoleGuard = React.lazy(() =>
  import("./components/RBACComponents.tsx").then((m) => ({ default: m.RoleGuard })),
);
export const ApplicationGuard = React.lazy(() =>
  import("./components/RBACComponents.tsx").then((m) => ({ default: m.ApplicationGuard })),
);
export const RouteGuard = React.lazy(() =>
  import("./components/RBACComponents.tsx").then((m) => ({ default: m.RouteGuard })),
);
export const AdminGuard = React.lazy(() =>
  import("./components/RBACComponents.tsx").then((m) => ({ default: m.AdminGuard })),
);
export const FeatureGuard = React.lazy(() =>
  import("./components/RBACComponents.tsx").then((m) => ({ default: m.FeatureGuard })),
);


// ── Services ──────────────────────────────────────────────────────────────────

export { default as SessionService } from "./services/SessionService.ts";
export { default as authService } from "./services/authService.ts";
export {
  getSessionService,
  getAuthService,
  getMFAService,
  getRBACService,
  getSecurityService,
  getDeviceService,
  getCacheService,
  getCrossAppService,
} from "./services/index.ts";

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
  DEVICE_CONFIG,
  PASSWORD_POLICY,
  RATE_LIMIT,
  OAUTH_PROVIDERS,
  STORAGE_KEYS,
  AUTH_ENDPOINTS,
  HTTP_STATUS,
  AUTH_EVENTS,
} from "./types/index.ts";


// MFA derived types (canonical source: types/mfaConstants.ts)
export type { MFAMethod, MFAStatus } from "./types/index.ts";

// -- Configuration -----------------------------------------------------------

export {
  APP_CONFIGS,
  getAppConfig,
  getCurrentAppName,
  getCurrentAppConfig,
} from "./config/appConfigs.ts";

export {
  getSupportedProvidersForApp,
  getOAuthConfig,
} from "./config/oauthProviders.ts";

// ── Utilities ─────────────────────────────────────────────────────────────────

export {
  validateEmail,
  validatePassword,
  validatePasswordStrength,
  validateToken,
  validateMFACode,
  validatePhoneNumber,
  sanitizeInput,
} from "./utils/authValidation.ts";

export { TokenStorage, tokenStorage } from "./utils/TokenStorage.ts";

// ── RBAC ──────────────────────────────────────────────────────────────────────

export { RBACUtils, PermissionUtils, RouteUtils, createRBAC } from "./utils/RBACUtils.ts";
export {
  PERMISSIONS,
  ROLES,
  ROLE_HIERARCHY,
  APPLICATION_ROLES,
  DEFAULT_ROLES,
  PROTECTED_ROUTES,
  PERMISSION_GROUPS,
  type Permission,
  type RoleDefinition,
  checkPermission,
  hasRole,
  checkAccess,
} from "./types/rbacRoles.ts";


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
