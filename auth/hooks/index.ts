/**
 * Auth Hooks Export Hub
 *
 * Central export point for all authentication hooks.
 * Each hook provides specialized access to auth functionality.
 *
 * @example
 * import { useAuth, useMFA, useSession } from '@shared/auth/hooks';
 */

// ── Primary Hook ──────────────────────────────────────────────────────────────

export { useAuth, default as useAuthDefault } from "./useAuth.ts";

// ── Core Context Hooks (internal, used by AuthProvider) ───────────────────────

export { useAuthState } from "./useAuthState.ts";
export { useAuthActions } from "./useAuthActions.ts";
export { useAuthCallbacks } from "./useAuthCallbacks.ts";

// ── Specialized Public Hooks ──────────────────────────────────────────────────

// Login / Logout
export { useLogin } from "./useLogin.ts";
export { useLogout } from "./useLogout.ts";

// MFA
export { useMFA } from "./useMFA.ts";

// Session Management
export { useSession } from "./useSession.ts";
export {
  useSessionManagement,
  useUserSessions,
  useSessionSecurity,
  useSessionAnalytics,
} from "./useSessionManagement.ts";

// OAuth
export { useOAuth } from "./useOAuth.ts";

// Device Trust
export { useDeviceTrust } from "./useDeviceTrust.ts";

// Permissions
export { usePermissions } from "./usePermissions.ts";

// Church CAHA extension hooks
export { useChurchRole } from "./useChurchRole.ts";
export { useChurchId } from "./useChurchId.ts";

// Home domain extension hooks
export { useHouseholdId } from "./useHouseholdId.ts";

// Rate Limiting
export {
  useRateLimit,
  useLoginRateLimit,
  useMFARateLimit,
  useAPIRateLimit,
  usePasswordResetRateLimit,
} from "./useRateLimit.ts";

// Feature Gates
export { useFeatureGate, useFeatureGates, invalidateFeatureGateCache } from "./useFeatureGate.ts";

// Auth Form
export { useAuthForm } from "./useAuthForm.ts";
