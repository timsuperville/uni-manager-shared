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

export { useAuth, default as useAuthDefault } from "./useAuth";

// ── Core Context Hooks (internal, used by AuthProvider) ───────────────────────

export { useAuthState } from "./useAuthState";
export { useAuthActions } from "./useAuthActions";
export { useAuthCallbacks } from "./useAuthCallbacks";

// ── Specialized Public Hooks ──────────────────────────────────────────────────

// Login / Logout
export { useLogin } from "./useLogin";
export { useLogout } from "./useLogout";

// MFA
export { useMFA } from "./useMFA";

// Session Management
export { useSession } from "./useSession";
export {
  useSessionManagement,
  useUserSessions,
  useSessionSecurity,
  useSessionAnalytics,
} from "./useSessionManagement";

// OAuth
export { useOAuth } from "./useOAuth";

// Device Trust
export { useDeviceTrust } from "./useDeviceTrust";

// Permissions
export { usePermissions } from "./usePermissions";

// Church CAHA extension hooks
export { useChurchRole } from "./useChurchRole";
export { useChurchId } from "./useChurchId";

// Home domain extension hooks
export { useHouseholdId } from "./useHouseholdId";

// Rate Limiting
export {
  useRateLimit,
  useLoginRateLimit,
  useMFARateLimit,
  useAPIRateLimit,
  usePasswordResetRateLimit,
} from "./useRateLimit";

// Feature Gates
export {
  useFeatureGate,
  useFeatureGates,
  invalidateFeatureGateCache,
} from "./useFeatureGate";

// Auth Form
export { useAuthForm } from "./useAuthForm";
