/**
 * Authentication Services — Export Hub
 *
 * All services are exported as static re-exports.
 * Dynamic lazy-loaders (getAuthService, getSessionService, etc.) have been
 * removed — they had zero consumers and their import() calls caused
 * Rollup resolveDynamicImport failures on Linux CI (extensionless specifiers
 * cannot be resolved across directory boundaries in Rollup 4).
 *
 * @example
 * import { AuthService } from '@shared/auth/services';
 * import { RateLimitService, TokenManagementService } from '@shared/auth/services';
 */

// ---------------------------------------------------------------------------
// Core auth service
// ---------------------------------------------------------------------------

import { AuthService as _AuthService } from "./AuthService";
import { getApiClient } from "../../api";

/**
 * Factory — returns a ready AuthService instance using the shared ApiClient.
 * Returns a resolved Promise to preserve the async API callers expect (.then()).
 * Uses only static imports — no dynamic import() that Rollup cannot resolve on CI.
 */
export function getAuthService(): Promise<InstanceType<typeof _AuthService>> {
  return Promise.resolve(new _AuthService(getApiClient()));
}

// ---------------------------------------------------------------------------
// Supporting services
// ---------------------------------------------------------------------------

/** Handles login attempt tracking and exponential back-off */
export { RateLimitService } from "./RateLimitService";

/** Token lifecycle: storage delegation, JWT decode/expiry, auto-refresh */
export { TokenManagementService } from "./TokenManagementService";

/** Traditional email/password flows (login, signup, forgot/reset password) */
export { EmailPasswordAuthService } from "./EmailPasswordAuthService";

/** OAuth 2.0 PKCE flows */
export { OAuthAuthService } from "./OAuthAuthService";

/** WebAuthn (Biometric Anchor) */
export { webAuthnService, WebAuthnService } from "./webAuthnService";

/** MFA utility helpers — phone formatting, code validation, display names */
export {
  getMFAMethodDisplayName,
  getMFAMethodIcon,
  validateTOTPCode,
  validateSMSCode,
  formatPhoneNumber,
  type MFAMethod,
} from "../utils/mfaUtils";
