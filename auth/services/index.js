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
export { OAuthAuthService } from "./OAuthAuthService.js";

// ---------------------------------------------------------------------------
// Lazy-loaded exports — load on demand to keep the auth bundle lean
// ---------------------------------------------------------------------------

/** @returns {Promise<import('./SessionService.js').default>} */
export function getSessionService() {
  return import("./SessionService.js").then((m) => m.default);
}

/** @returns {Promise<import('./authService.js').AuthService>} */
export function getAuthService() {
  return import("./authService.js").then((m) => m.default);
}

/** @returns {Promise<import('./mfaService.js').default>} */
export function getMFAService() {
  return import("./mfaService.js").then((m) => m.default);
}

/**
 * RBAC service — returns the full implementation when available.
 * Currently backed by a dev-only mock; a production RBAC engine is
 * tracked in BL-xxx.
 * @returns {Promise<import('./rbacService.js').default>}
 */
export function getRBACService() {
  return import("./rbacService.js").then((m) => m.default);
}

/** @returns {Promise<import('./securityService.js').default>} */
export function getSecurityService() {
  return import("./securityService.js").then((m) => m.default);
}

/** @returns {Promise<import('./DeviceService.js').default>} */
export function getDeviceService() {
  return import("./DeviceService.js").then((m) => m.default);
}

/** @returns {Promise<import('./sharedDataCache.js').default>} */
export function getCacheService() {
  return import("./sharedDataCache.js").then((m) => m.default);
}

/** @returns {Promise<import('./CrossAppService.js').default>} */
export function getCrossAppService() {
  return import("./CrossAppService.js").then((m) => m.default);
}
