/**
 * Session Management Constants
 *
 * Constants related to session lifecycle, timeouts, and status tracking.
 */

// ==================== SESSION STATUS ====================

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
 * Storage keys for session management
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  LAST_ACTIVITY: "lastActivity",
  TRUSTED_DEVICES: "trustedDevices",
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

// ==================== SESSION ACTION TYPES ====================

/**
 * Session-related action types for context reducer
 */
export const SESSION_ACTIONS = {
  SESSION_CREATED: "SESSION_CREATED",
  SESSION_UPDATED: "SESSION_UPDATED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_RENEWED: "SESSION_RENEWED",
  CLEAR_SESSION: "CLEAR_SESSION",
  UPDATE_ACTIVITY: "UPDATE_ACTIVITY",
  SHOW_SESSION_WARNING: "SHOW_SESSION_WARNING",
};
