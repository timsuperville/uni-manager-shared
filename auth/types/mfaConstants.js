/**
 * Multi-Factor Authentication Constants
 *
 * Constants for MFA methods, status tracking, and configuration.
 */

// ==================== MFA METHODS ====================

/**
 * MFA method types
 */
export const MFA_METHOD = {
  TOTP: "totp", // Time-based one-time password
  SMS: "sms", // SMS text message
  EMAIL: "email", // Email code
  WEBAUTHN: "webauthn", // WebAuthn/FIDO2
};

/**
 * MFA status values
 */
export const MFA_STATUS = {
  NONE: "none", // Not enabled
  ENABLED: "enabled",
  PENDING: "pending", // Waiting for setup completion
  FAILED: "failed", // Last attempt failed
  LOCKED: "locked", // Too many failed attempts
};

/**
 * MFA configuration
 */
export const MFA_CONFIG = {
  CODE_LENGTH: 6,
  CODE_EXPIRY: 5 * 60 * 1000, // 5 minutes
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  BACKUP_CODES_COUNT: 10,
  TOTP_WINDOW: 1, // Allow codes from ±1 time window
};

// ==================== MFA ACTION TYPES ====================

/**
 * MFA-related action types for context reducer
 */
export const MFA_ACTIONS = {
  MFA_SETUP_START: "MFA_SETUP_START",
  MFA_SETUP_SUCCESS: "MFA_SETUP_SUCCESS",
  MFA_SETUP_FAILURE: "MFA_SETUP_FAILURE",
  MFA_VERIFY_START: "MFA_VERIFY_START",
  MFA_VERIFY_SUCCESS: "MFA_VERIFY_SUCCESS",
  MFA_VERIFY_FAILURE: "MFA_VERIFY_FAILURE",
  MFA_DISABLE_START: "MFA_DISABLE_START",
  MFA_DISABLE_SUCCESS: "MFA_DISABLE_SUCCESS",
  MFA_CHALLENGE_REQUIRED: "MFA_CHALLENGE_REQUIRED",
  MFA_CHALLENGE_FAILED: "MFA_CHALLENGE_FAILED",
};
