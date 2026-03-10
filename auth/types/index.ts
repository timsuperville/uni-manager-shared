/**
 * Authentication Types and Constants Export Hub
 *
 * Central export point for all type definitions and constants used throughout
 * the authentication system. Import from this file to access all auth types.
 *
 * @example
 * import { SESSION_CONFIG, AUTH_ACTIONS, SESSION_STATUS } from '@shared/auth/types';
 */

// ==================== CONSTANTS ====================

export {
  // Session
  SESSION_STATUS,
  SESSION_CONFIG,

  // MFA
  MFA_METHOD,
  MFA_STATUS,
  MFA_CONFIG,

  // Authentication
  AUTH_ACTIONS,
  AUTH_ERROR_CODES,

  // User Roles
  USER_ROLES,
  ROLE_HIERARCHY,

  // Permissions
  PERMISSION_CATEGORIES,
  PERMISSION_ACTIONS,

  // Device
  DEVICE_CONFIG,

  // Password
  PASSWORD_POLICY,

  // Rate Limiting
  RATE_LIMIT,

  // OAuth
  OAUTH_PROVIDERS,

  // Storage
  STORAGE_KEYS,

  // API
  AUTH_ENDPOINTS,
  HTTP_STATUS,

  // Events
  AUTH_EVENTS,
} from "./constants.js";

// ==================== EXPORT UTILITIES ====================

/**
 * List all available constants organized by category
 */
export function listAvailableConstants() {
  return {
    session: ["SESSION_STATUS", "SESSION_CONFIG"],
    mfa: ["MFA_METHOD", "MFA_STATUS", "MFA_CONFIG"],
    auth: ["AUTH_ACTIONS", "AUTH_ERROR_CODES"],
    roles: ["USER_ROLES", "ROLE_HIERARCHY"],
    permissions: ["PERMISSION_CATEGORIES", "PERMISSION_ACTIONS"],
    device: ["DEVICE_CONFIG"],
    password: ["PASSWORD_POLICY"],
    rate_limit: ["RATE_LIMIT"],
    oauth: ["OAUTH_PROVIDERS"],
    storage: ["STORAGE_KEYS"],
    api: ["AUTH_ENDPOINTS", "HTTP_STATUS"],
    events: ["AUTH_EVENTS"],
  };
}
