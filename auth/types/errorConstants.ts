/**
 * Authentication Error Constants
 *
 * Error codes and messages for authentication system.
 */

// ==================== ERROR CODES ====================

/**
 * Authentication error codes
 */
export const AUTH_ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_NOT_VERIFIED: "ACCOUNT_NOT_VERIFIED",

  // Session Errors
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_INVALID: "SESSION_INVALID",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",

  // MFA Errors
  MFA_INVALID_CODE: "MFA_INVALID_CODE",
  MFA_CODE_EXPIRED: "MFA_CODE_EXPIRED",
  MFA_LOCKOUT: "MFA_LOCKOUT",
  MFA_NOT_ENABLED: "MFA_NOT_ENABLED",
  MFA_SETUP_REQUIRED: "MFA_SETUP_REQUIRED",

  // Token Errors
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_REFRESH_FAILED: "TOKEN_REFRESH_FAILED",
  NO_TOKEN: "NO_TOKEN",

  // OAuth Errors
  OAUTH_ERROR: "OAUTH_ERROR",
  OAUTH_CANCELLED: "OAUTH_CANCELLED",
  OAUTH_INVALID_STATE: "OAUTH_INVALID_STATE",

  // WebAuthn Errors
  WEBAUTHN_NOT_SUPPORTED: "WEBAUTHN_NOT_SUPPORTED",
  WEBAUTHN_REGISTRATION_FAILED: "WEBAUTHN_REGISTRATION_FAILED",
  WEBAUTHN_AUTHENTICATION_FAILED: "WEBAUTHN_AUTHENTICATION_FAILED",

  // Network/Server Errors
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // Validation Errors
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  PASSWORDS_MISMATCH: "PASSWORDS_MISMATCH",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
};

// ==================== ERROR MESSAGES ====================

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: "Invalid email or password",
  [AUTH_ERROR_CODES.ACCOUNT_NOT_FOUND]: "Account not found",
  [AUTH_ERROR_CODES.ACCOUNT_SUSPENDED]: "Account has been suspended",
  [AUTH_ERROR_CODES.ACCOUNT_LOCKED]:
    "Account is locked due to multiple failed attempts",
  [AUTH_ERROR_CODES.SESSION_EXPIRED]:
    "Your session has expired. Please log in again",
  [AUTH_ERROR_CODES.MFA_INVALID_CODE]: "Invalid verification code",
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: "Your session has expired",
  [AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    "Too many attempts. Please try again later",
  [AUTH_ERROR_CODES.NETWORK_ERROR]:
    "Network error. Please check your connection",
};

// ==================== ERROR ACTION TYPES ====================

/**
 * Error-related action types
 */
export const ERROR_ACTIONS = {
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
};
