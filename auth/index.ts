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

export {
  AuthProvider,
  useAuth,
  AuthContext,
  type AuthStateChangePayload,
} from "./context/AuthContext";
export { withAuth, AuthContextProvider } from "./context/index";
export { SSOContext, SSOProvider, useSSO, withSSO } from "./context/SSOContext";
export {
  RealTimeSecurityProvider,
  useRealTimeSecurity,
} from "./context/RealTimeSecurityContext";

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Core context hooks (internal)
export { useAuthState } from "./hooks/useAuthState";
export { useAuthActions } from "./hooks/useAuthActions";
export { useAuthCallbacks } from "./hooks/useAuthCallbacks";

// Specialized hooks
export { useLogin } from "./hooks/useLogin";
export { useLogout } from "./hooks/useLogout";
export { useMFA } from "./hooks/useMFA";
export { useSession } from "./hooks/useSession";
export { useOAuth } from "./hooks/useOAuth";
export { useDeviceTrust } from "./hooks/useDeviceTrust";
export { usePermissions } from "./hooks/usePermissions";
export {
  useQRSessionDelegation,
  type QRSessionDelegationOptions,
} from "./hooks/useQRSessionDelegation";
export {
  useRateLimit,
  useLoginRateLimit,
  useMFARateLimit,
  useAPIRateLimit,
  usePasswordResetRateLimit,
} from "./hooks/useRateLimit";
export { useAuthForm } from "./hooks/useAuthForm";

// Church CAHA hooks + types (CAHA_PROTOCOL.md v2.0)
export {
  useChurchRole,
  type UseChurchRoleReturn,
  type CommunityStage,
  type MinistryPosition,
  type MinistryRole,
} from "./hooks/useChurchRole";
export { useChurchId } from "./hooks/useChurchId";

// Home domain extension hooks
export { useHouseholdId } from "./hooks/useHouseholdId";

// Session management
export {
  useSessionManagement,
  useUserSessions,
  useSessionSecurity,
  useSessionAnalytics,
} from "./hooks/useSessionManagement";

// Feature gates
export {
  useFeatureGate,
  useFeatureGates,
  invalidateFeatureGateCache,
} from "./hooks/useFeatureGate";

// ── Components ────────────────────────────────────────────────────────────────

export { default as LoginForm } from "./components/LoginForm";
export { default as SignupForm } from "./components/SignupForm";
export { default as ForgotPasswordForm } from "./components/ForgotPasswordForm";

export const MFAVerification = React.lazy(
  () => import("./components/MFAVerification"),
);
export const MFASetup = React.lazy(() => import("./components/MFASetup"));

export { default as OAuthProviderComponents } from "./components/OAuthProviderComponents";
export { default as OAuthCallback } from "./components/OAuthCallback";
export { default as ProtectedRoute } from "./components/ProtectedRoute";
export { default as SecurityDashboard } from "./components/SecurityDashboard";
export { default as AuthLayout } from "./components/AuthLayout";
export { default as TermsOfService } from "./components/legal/TermsOfService";
export { default as PrivacyPolicy } from "./components/legal/PrivacyPolicy";
export { UserMenu, UserMenuItem } from "./components/index";

// RBAC — context (backward compat: wraps useAuth)
export { RBACProvider, useRBAC } from "./components/RBACComponents";

// RBAC — guards (lazy-loaded, avoid bloating the initial bundle)
export const PermissionGuard = React.lazy(() =>
  import("./components/RBACComponents").then((m) => ({
    default: m.PermissionGuard,
  })),
);
export const RoleGuard = React.lazy(() =>
  import("./components/RBACComponents").then((m) => ({
    default: m.RoleGuard,
  })),
);
export const ApplicationGuard = React.lazy(() =>
  import("./components/RBACComponents").then((m) => ({
    default: m.ApplicationGuard,
  })),
);
export const RouteGuard = React.lazy(() =>
  import("./components/RBACComponents").then((m) => ({
    default: m.RouteGuard,
  })),
);
export const AdminGuard = React.lazy(() =>
  import("./components/RBACComponents").then((m) => ({
    default: m.AdminGuard,
  })),
);
export const FeatureGuard = React.lazy(() =>
  import("./components/RBACComponents").then((m) => ({
    default: m.FeatureGuard,
  })),
);

// Service exports — static re-exports (dynamic lazy-loaders removed: zero consumers,
// and Rollup resolveDynamicImport on Linux CI cannot resolve extensionless relative imports).
export {
  getAuthService,
  RateLimitService,
  TokenManagementService,
  EmailPasswordAuthService,
  OAuthAuthService,
} from "./services/index";

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
} from "./types/index";

// MFA derived types (canonical source: types/mfaConstants.ts)
export type { MFAMethod, MFAStatus } from "./types/index";

// -- Configuration -----------------------------------------------------------

export {
  APP_CONFIGS,
  getAppConfig,
  getCurrentAppName,
  getCurrentAppConfig,
} from "./config/appConfigs";

export {
  getSupportedProvidersForApp,
  getOAuthConfig,
} from "./config/oauthProviders";

// ── Utilities ─────────────────────────────────────────────────────────────────

export {
  validateEmail,
  validatePassword,
  validatePasswordStrength,
  validateToken,
  validateMFACode,
  validatePhoneNumber,
  sanitizeInput,
} from "./utils/authValidation";

export { TokenStorage, tokenStorage } from "./utils/TokenStorage";

// ── RBAC ──────────────────────────────────────────────────────────────────────

export {
  RBACUtils,
  PermissionUtils,
  RouteUtils,
  createRBAC,
} from "./utils/RBACUtils";
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
} from "./types/rbacRoles";

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
