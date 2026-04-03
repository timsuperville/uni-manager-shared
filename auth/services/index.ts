/**
 * Authentication Services — Export Hub
 *
 * Services are grouped by import pattern:
 *  - Direct (sync-safe) exports: classes used by callers directly
 *  - Lazy-loaded: heavy services loaded on demand to reduce initial bundle
 *
 * @example
 * import { authService } from '@shared/auth';
 * import { RateLimitService, TokenManagementService } from '@shared/auth/services';
 */

// ---------------------------------------------------------------------------
// Direct exports — lightweight classes, safe to import on every page
// ---------------------------------------------------------------------------

/** Handles login attempt tracking and exponential back-off */
export { RateLimitService } from "./RateLimitService.ts";

/** Token lifecycle: storage delegation, JWT decode/expiry, auto-refresh */
export { TokenManagementService } from "./TokenManagementService.ts";

/** Traditional email/password flows (login, signup, forgot/reset password) */
export { EmailPasswordAuthService } from "./EmailPasswordAuthService.ts";

/** MFA utility helpers — phone formatting, code validation, display names */
export {
  getMFAMethodDisplayName,
  getMFAMethodIcon,
  validateTOTPCode,
  validateSMSCode,
  formatPhoneNumber,
  type MFAMethod,
} from "../utils/mfaUtils.ts";

/** OAuth 2.0 PKCE flows */
export { OAuthAuthService } from "./OAuthAuthService.ts";

// ---------------------------------------------------------------------------
// Lazy-loaded exports — load on demand to keep the auth bundle lean
// ---------------------------------------------------------------------------

export function getSessionService() {
  return import("./SessionService.ts").then((m) => m.default);
}

export async function getAuthService() {
  const m = await import("./AuthService.ts");
  const { getApiClient } = await import("../../api");
  return new m.default(getApiClient());
}

export function getMFAService() {
  return import("./mfaService.ts").then((m) => m.default);
}

/**
 * RBAC service — returns the full implementation when available.
 * Currently backed by a dev-only mock; a production RBAC engine is
 * tracked in BL-xxx.
 */
export function getRBACService() {
  return import("./rbacService.ts").then((m) => m.default);
}

export function getSecurityService() {
  return import("./securityService.ts").then((m) => m.default);
}

export function getDeviceService() {
  return import("./DeviceService.ts").then((m) => m.default);
}

export function getCacheService() {
  return import("./sharedDataCache.ts").then((m) => m.default);
}

export function getCrossAppService() {
  return import("./CrossAppService.ts").then((m) => m.default);
}
