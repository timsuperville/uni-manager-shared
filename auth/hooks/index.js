/**
 * Auth Hooks Export Hub
 *
 * Central export point for all authentication hooks.
 * Each hook provides specialized access to auth functionality.
 *
 * @example
 * import { useAuth, useMFA, useSession } from '@shared/auth/hooks';
 */

// ==================== PRIMARY HOOK ====================

export { default as useAuth } from "./useAuth.js";

// ==================== CORE CONTEXT HOOKS ====================

// Internal hooks for AuthContext refactoring
export { useAuthState } from "./useAuthState.js";
export { useAuthActions } from "./useAuthActions.js";
export { useAuthCallbacks } from "./useAuthCallbacks.js";

// ==================== SPECIALIZED HOOKS ====================

// Login/Logout
export { useLogin } from "./useLogin.js";
export { useLogout } from "./useLogout.js";

// MFA
export { useMFA } from "./useMFA.js";

// Session Management
export { useSession } from "./useSession.js";
export {
  useSessionManagement,
  useUserSessions,
  useSessionSecurity,
  useSessionAnalytics,
} from "./useSessionManagement.js";

// OAuth
export { useOAuth } from "./useOAuth.js";

// Device Trust
export { useDeviceTrust } from "./useDeviceTrust.js";

// Permissions (existing hook - updated)
export { usePermissions } from "./usePermissions.js";

// Rate Limiting
export { useRateLimit } from "./useRateLimit.js";

// ==================== LEGACY HOOKS (FOR MIGRATION) ====================

// Deprecated: Use useAuth + useLogin instead
export { useAuthForm } from "./useAuthForm.js";

// ==================== HOOK UTILITIES ====================

/**
 * List all available hooks
 */
export function listAvailableHooks() {
  return [
    "useAuth", // Primary hook - all auth state and methods
    "useLogin", // Login-specific functionality
    "useLogout", // Logout-specific functionality
    "useMFA", // Multi-factor authentication
    "useSession", // Session management
    "useOAuth", // OAuth provider integration
    "useDeviceTrust", // Device trust and fingerprinting
    "usePermissions", // Role-based permissions checking
    "useRateLimit", // Rate limiting for auth operations
  ];
}
