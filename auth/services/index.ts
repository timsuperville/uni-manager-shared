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
export { RateLimitService } from "./RateLimitService.js";

/** Token lifecycle: storage delegation, JWT decode/expiry, auto-refresh */
export { TokenManagementService } from "./TokenManagementService.js";

/** Traditional email/password flows (login, signup, forgot/reset password) */
export { EmailPasswordAuthService } from "./EmailPasswordAuthService.js";

/** OAuth 2.0 PKCE flows */
export { OAuthAuthService } from "./OAuthAuthService.ts";

// ---------------------------------------------------------------------------
// Lazy-loaded exports — load on demand to keep the auth bundle lean
// ---------------------------------------------------------------------------

export function getSessionService() {
  return import("./SessionService.js").then((m) => m.default);
}

export function getAuthService() {
  return import("./authService.ts").then((m) => m.default);
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
  return import("./rbacService.js").then((m) => m.default);
}

export function getSecurityService() {
  return import("./securityService.ts").then((m) => m.default);
}

export function getDeviceService() {
  return import("./DeviceService.js").then((m) => m.default);
}

export function getCacheService() {
  return import("./sharedDataCache.js").then((m) => m.default);
}

export function getCrossAppService() {
  return import("./CrossAppService.js").then((m) => m.default);
}
