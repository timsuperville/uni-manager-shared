/**
 * Authentication System Constants
 *
 * Central location for all constants used throughout the authentication system.
 * Organized by category for clarity and maintainability.
 */

// ==================== SESSION CONSTANTS ====================

/**
 * Session status values
 */
export const SESSION_STATUS = {
  INACTIVE: "inactive",
  ACTIVE: "active",
  WARNING: "warning", // About to expire
  EXPIRED: "expired",
  SUSPENDED: "suspended",
};

/**
 * Default session configuration (in milliseconds)
 */
export const SESSION_CONFIG = {
  TIMEOUT: 30 * 60 * 1000, // 30 minutes
  INACTIVITY_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  WARNING_THRESHOLD: 5 * 60 * 1000, // Show warning 5 minutes before expiry
  TOKEN_REFRESH_INTERVAL: 25 * 60 * 1000, // Refresh every 25 minutes
  MAX_DEVICES: 5, // Max devices per user
};

// ==================== MFA CONSTANTS ====================

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

// ==================== AUTHENTICATION CONSTANTS ====================

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
  UPDATE_USER_START: "UPDATE_USER_START",
  UPDATE_USER_SUCCESS: "UPDATE_USER_SUCCESS",
  UPDATE_USER_FAILURE: "UPDATE_USER_FAILURE",
  UPDATE_PROFILE_PICTURE: "UPDATE_PROFILE_PICTURE",

  // Session Management
  SESSION_CREATED: "SESSION_CREATED",
  SESSION_UPDATED: "SESSION_UPDATED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_RENEWED: "SESSION_RENEWED",
  CLEAR_SESSION: "CLEAR_SESSION",
  UPDATE_ACTIVITY: "UPDATE_ACTIVITY",
  SHOW_SESSION_WARNING: "SHOW_SESSION_WARNING",

  // MFA
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

  // OAuth
  OAUTH_START: "OAUTH_START",
  OAUTH_SUCCESS: "OAUTH_SUCCESS",
  OAUTH_FAILURE: "OAUTH_FAILURE",
  OAUTH_CALLBACK: "OAUTH_CALLBACK",

  // Device Management
  DEVICE_REGISTERED: "DEVICE_REGISTERED",
  DEVICE_TRUSTED: "DEVICE_TRUSTED",
  DEVICE_UNTRUSTED: "DEVICE_UNTRUSTED",
  DEVICE_REVOKED: "DEVICE_REVOKED",

  // WebAuthn
  WEBAUTHN_REGISTER_START: "WEBAUTHN_REGISTER_START",
  WEBAUTHN_REGISTER_SUCCESS: "WEBAUTHN_REGISTER_SUCCESS",
  WEBAUTHN_REGISTER_FAILURE: "WEBAUTHN_REGISTER_FAILURE",
  WEBAUTHN_AUTHENTICATE_START: "WEBAUTHN_AUTHENTICATE_START",
  WEBAUTHN_AUTHENTICATE_SUCCESS: "WEBAUTHN_AUTHENTICATE_SUCCESS",
  WEBAUTHN_AUTHENTICATE_FAILURE: "WEBAUTHN_AUTHENTICATE_FAILURE",

  // Permissions/RBAC
  UPDATE_PERMISSIONS: "UPDATE_PERMISSIONS",
  UPDATE_ROLES: "UPDATE_ROLES",
  ADD_PERMISSION: "ADD_PERMISSION",
  REMOVE_PERMISSION: "REMOVE_PERMISSION",

  // Security
  SECURITY_ALERT: "SECURITY_ALERT",
  SECURITY_CHECK_REQUIRED: "SECURITY_CHECK_REQUIRED",
  ACKNOWLEDGE_ALERT: "ACKNOWLEDGE_ALERT",
  SUSPICIOUS_ACTIVITY_DETECTED: "SUSPICIOUS_ACTIVITY_DETECTED",

  // Analytics
  TRACK_EVENT: "TRACK_EVENT",
  TRACK_FAILED_LOGIN: "TRACK_FAILED_LOGIN",
  TRACK_SUCCESSFUL_LOGIN: "TRACK_SUCCESSFUL_LOGIN",

  // Error Handling
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",

  // OAuth Providers
  ADD_OAUTH_PROVIDER: "ADD_OAUTH_PROVIDER",
  REMOVE_OAUTH_PROVIDER: "REMOVE_OAUTH_PROVIDER",
  LINK_OAUTH_ACCOUNT: "LINK_OAUTH_ACCOUNT",
  UNLINK_OAUTH_ACCOUNT: "UNLINK_OAUTH_ACCOUNT",
};

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

// ==================== USER ROLES ====================

/**
 * Predefined user roles
 */
export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
  GUEST: "guest",
};

/**
 * Role hierarchy (lower number = higher privilege)
 */
export const ROLE_HIERARCHY = {
  super_admin: 0,
  admin: 1,
  moderator: 2,
  user: 3,
  guest: 4,
};

// ==================== PERMISSIONS ====================

/**
 * Permission categories
 */
export const PERMISSION_CATEGORIES = {
  ADMIN: "admin",
  USER_MANAGEMENT: "user_management",
  SECURITY: "security",
  CONTENT: "content",
  REPORTING: "reporting",
  SETTINGS: "settings",
};

/**
 * Standard permission actions
 */
export const PERMISSION_ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage",
};

// ==================== DEVICE CONSTANTS ====================

/**
 * Device trust configuration
 */
export const DEVICE_CONFIG = {
  FINGERPRINT_ALGORITHM: "SHA-256",
  TRUST_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  REQUIRE_VERIFICATION_AFTER: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ==================== PASSWORD POLICY ====================

/**
 * Password validation rules
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  SPECIAL_CHARS: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  EXPIRY_DAYS: 90, // Require password change every 90 days
  HISTORY_COUNT: 5, // Remember last 5 passwords
};

// ==================== RATE LIMITING ====================

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  MFA_ATTEMPTS: 5,
  MFA_WINDOW: 15 * 60 * 1000,
  PASSWORD_RESET_ATTEMPTS: 3,
  PASSWORD_RESET_WINDOW: 60 * 60 * 1000, // 1 hour
};

// ==================== OAUTH PROVIDERS ====================

/**
 * Supported OAuth providers
 */
export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  GITHUB: "github",
  MICROSOFT: "microsoft",
  FACEBOOK: "facebook",
  APPLE: "apple",
};

// ==================== STORAGE KEYS ====================

/**
 * LocalStorage/SessionStorage keys used by auth system
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  SESSION_ID: "session_id",
  USER_DATA: "user_data",
  DEVICE_ID: "device_id",
  DEVICE_FINGERPRINT: "device_fingerprint",
  MFA_SETUP_REQUIRED: "mfa_setup_required",
  TRUSTED_DEVICES: "trusted_devices",
  LAST_ACTIVITY: "last_activity",
  SESSION_WARNINGS_SHOWN: "session_warnings_shown",
};

// ==================== API ENDPOINTS ====================

/**
 * Authentication API endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  LOGOUT: "/api/auth/logout",
  SIGNUP: "/api/auth/signup",
  REFRESH_TOKEN: "/api/auth/refresh",
  VERIFY_EMAIL: "/api/auth/verify-email",
  RESEND_VERIFICATION: "/api/auth/resend-verification",
  FORGOT_PASSWORD: "/api/auth/forgot-password",
  RESET_PASSWORD: "/api/auth/reset-password",
  CHANGE_PASSWORD: "/api/auth/change-password",

  // MFA
  MFA_SETUP: "/api/auth/mfa/setup",
  MFA_VERIFY: "/api/auth/mfa/verify",
  MFA_BACKUP_CODES: "/api/auth/mfa/backup-codes",
  MFA_DISABLE: "/api/auth/mfa/disable",

  // OAuth
  OAUTH_AUTHORIZE: "/api/auth/oauth/authorize",
  OAUTH_CALLBACK: "/api/auth/oauth/callback",
  OAUTH_LINK: "/api/auth/oauth/link",
  OAUTH_UNLINK: "/api/auth/oauth/unlink",

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
  SESSION_EXPIRED: "session_expired",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  DEVICE_REGISTERED: "device_registered",
  DEVICE_TRUSTED: "device_trusted",
};
