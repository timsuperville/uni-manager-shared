/**
 * Authentication System Constants
 *
 * Central export hub for all authentication constants.
 * Constants are organized into focused files by category for better maintainability.
 *
 * @module auth/types/constants
 */

// ==================== RE-EXPORTS FROM FOCUSED FILES ====================

// Session constants
export {
  SESSION_STATUS,
  SESSION_CONFIG,
  SESSION_ACTIONS,
  STORAGE_KEYS,
} from "./sessionConstants.ts";

// MFA constants
export {
  MFA_METHOD,
  MFA_STATUS,
  MFA_CONFIG,
  MFA_ACTIONS,
} from "./mfaConstants.ts";

// RBAC constants
export {
  USER_ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  PERMISSION_ACTIONS,
  RBAC_ACTIONS,
} from "./rbacConstants.ts";

// Error constants
export {
  AUTH_ERROR_CODES,
  ERROR_MESSAGES,
  ERROR_ACTIONS,
} from "./errorConstants.ts";

// ==================== GENERAL AUTH CONSTANTS ====================

/**
 * Authentication action types used in context reducer
 */
export const AUTH_ACTIONS = {
  // Login/Logout
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT_START: "LOGOUT_START",
  LOGOUT_SUCCESS: "LOGOUT_SUCCESS",

  // Signup
  SIGNUP_START: "SIGNUP_START",
  SIGNUP_SUCCESS: "SIGNUP_SUCCESS",
  SIGNUP_FAILURE: "SIGNUP_FAILURE",

  // Password Reset
  FORGOT_PASSWORD_START: "FORGOT_PASSWORD_START",
  FORGOT_PASSWORD_SUCCESS: "FORGOT_PASSWORD_SUCCESS",
  FORGOT_PASSWORD_FAILURE: "FORGOT_PASSWORD_FAILURE",
  RESET_PASSWORD_START: "RESET_PASSWORD_START",
  RESET_PASSWORD_SUCCESS: "RESET_PASSWORD_SUCCESS",
  RESET_PASSWORD_FAILURE: "RESET_PASSWORD_FAILURE",

  // Token/Auth State
  REFRESH_TOKEN_START: "REFRESH_TOKEN_START",
  REFRESH_TOKEN_SUCCESS: "REFRESH_TOKEN_SUCCESS",
  REFRESH_TOKEN_FAILURE: "REFRESH_TOKEN_FAILURE",
  CHECK_AUTH_STATE: "CHECK_AUTH_STATE",
  AUTH_STATE_VALID: "AUTH_STATE_VALID",
  AUTH_STATE_INVALID: "AUTH_STATE_INVALID",

  // User Profile
  UPDATE_USER_PROFILE: "UPDATE_USER_PROFILE",
  UPDATE_USER_SUCCESS: "UPDATE_USER_SUCCESS",
  UPDATE_USER_FAILURE: "UPDATE_USER_FAILURE",

  // OAuth Providers
  ADD_OAUTH_PROVIDER: "ADD_OAUTH_PROVIDER",
  REMOVE_OAUTH_PROVIDER: "REMOVE_OAUTH_PROVIDER",
  LINK_OAUTH_ACCOUNT: "LINK_OAUTH_ACCOUNT",
  UNLINK_OAUTH_ACCOUNT: "UNLINK_OAUTH_ACCOUNT",

  // Security
  SECURITY_ALERT: "SECURITY_ALERT",
  SECURITY_CHECK_REQUIRED: "SECURITY_CHECK_REQUIRED",
  ACKNOWLEDGE_ALERT: "ACKNOWLEDGE_ALERT",
  SUSPICIOUS_ACTIVITY_DETECTED: "SUSPICIOUS_ACTIVITY_DETECTED",

  // Analytics
  TRACK_EVENT: "TRACK_EVENT",
  TRACK_FAILED_LOGIN: "TRACK_FAILED_LOGIN",
  TRACK_SUCCESSFUL_LOGIN: "TRACK_SUCCESSFUL_LOGIN",
};

// ==================== API ENDPOINTS ====================

/**
 * Authentication API endpoints
 */
export const AUTH_ENDPOINTS = {
  // Authentication
  LOGIN: "/api/auth/login",
  SIGNUP: "/api/auth/signup",
  LOGOUT: "/api/auth/logout",
  REFRESH_TOKEN: "/api/auth/refresh",
  VERIFY_TOKEN: "/api/auth/verify",

  // Password Management
  FORGOT_PASSWORD: "/api/auth/forgot-password",
  RESET_PASSWORD: "/api/auth/reset-password",
  CHANGE_PASSWORD: "/api/auth/change-password",

  // MFA
  MFA_SETUP: "/api/auth/mfa/setup",
  MFA_VERIFY: "/api/auth/mfa/verify",
  MFA_DISABLE: "/api/auth/mfa/disable",
  MFA_BACKUP_CODES: "/api/auth/mfa/backup-codes",

  // OAuth
  OAUTH_START: "/api/auth/oauth/:provider",
  OAUTH_CALLBACK: "/api/auth/oauth/:provider/callback",
  OAUTH_LINK: "/api/auth/oauth/:provider/link",
  OAUTH_UNLINK: "/api/auth/oauth/:provider/unlink",

  // WebAuthn
  WEBAUTHN_REGISTER_OPTIONS: "/api/auth/webauthn/register/options",
  WEBAUTHN_REGISTER_VERIFY: "/api/auth/webauthn/register/verify",
  WEBAUTHN_AUTHENTICATE_OPTIONS: "/api/auth/webauthn/authenticate/options",
  WEBAUTHN_AUTHENTICATE_VERIFY: "/api/auth/webauthn/authenticate/verify",

  // User
  GET_USER: "/api/auth/user",
  UPDATE_USER: "/api/auth/user/update",

  // Sessions
  GET_SESSIONS: "/api/auth/sessions",
  REVOKE_SESSION: "/api/auth/sessions/revoke",
  REVOKE_ALL_SESSIONS: "/api/auth/sessions/revoke-all",

  // Security
  GET_SECURITY_ALERTS: "/api/auth/security/alerts",
  ACKNOWLEDGE_ALERT: "/api/auth/security/alerts/acknowledge",
};

// ==================== HTTP STATUS CODES ====================

/**
 * Common HTTP status codes for auth endpoints
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ==================== EVENT TYPES ====================

/**
 * Authentication event types for analytics/logging
 */
export const AUTH_EVENTS = {
  LOGIN_ATTEMPT: "login_attempt",
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILURE: "login_failure",
  LOGOUT: "logout",
  SIGNUP: "signup",
  PASSWORD_RESET: "password_reset",
  MFA_ENABLED: "mfa_enabled",
  MFA_DISABLED: "mfa_disabled",
  MFA_VERIFICATION: "mfa_verification",
  OAUTH_LOGIN: "oauth_login",
  SESSION_STARTED: "session_started",
  SESSION_UPDATED: "session_updated",
  SESSION_EXPIRED: "session_expired",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  DEVICE_REGISTERED: "device_registered",
  DEVICE_TRUSTED: "device_trusted",
};

// ==================== DEVICE & SECURITY CONFIGURATION ====================

/**
 * Device trust and security configuration
 */
export const DEVICE_CONFIG = {
  MAX_TRUSTED_DEVICES: 5,
  DEVICE_TRUST_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  FINGERPRINT_ENABLED: true,
};

/**
 * Password policy configuration
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
  MAX_AGE_DAYS: 90,
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
};

/**
 * Supported OAuth providers
 */
export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  MICROSOFT: "microsoft",
  GITHUB: "github",
  LINKEDIN: "linkedin",
  FACEBOOK: "facebook",
};
