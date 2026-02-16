/**
 * Authentication Services Export Hub
 *
 * Central export point for all authentication services.
 * Each service handles a specific domain of authentication functionality.
 *
 * Services are imported on-demand to avoid circular dependencies.
 *
 * @example
 * import { sessionService, authService, mfaService } from '@shared/auth/services';
 */

// ==================== DIRECT EXPORTS (New Refactored Services) ====================

/**
 * Rate Limiting Service
 * Handles login attempt tracking and rate limiting
 */
export { RateLimitService } from "./RateLimitService.js";

/**
 * Token Management Service
 * Handles token storage, validation, and auto-refresh
 */
export { TokenManagementService } from "./TokenManagementService.js";

/**
 * Email/Password Authentication Service
 * Handles traditional email/password authentication flows
 */
export { EmailPasswordAuthService } from "./EmailPasswordAuthService.js";

/**
 * OAuth Authentication Service
 * Handles OAuth 2.0 provider integration and authentication
 */
export { OAuthAuthService } from "./OAuthAuthService.js";

// ==================== LAZY-LOADED SERVICES ====================

/**
 * Get session service (consolidated from 4 files)
 * Handles session management, token storage, device fingerprinting, cross-tab sync
 */
export function getSessionService() {
  return import("./SessionService.js").then((m) => m.default);
}

/**
 * Get authentication service
 * Handles login, signup, password reset, verification
 */
export function getAuthService() {
  return import("./authService.js").then((m) => m.default);
}

/**
 * Get MFA service
 * Handles multi-factor authentication setup and verification
 */
export function getMFAService() {
  return import("./mfaService.js").then((m) => m.default);
}

/**
 * Get RBAC service
 * Handles role-based access control and permissions
 */
export function getRBACService() {
  return import("./rbacService.js").then((m) => m.default);
}

/**
 * Get security service
 * Handles security monitoring and fraud detection
 */
export function getSecurityService() {
  return import("./securityService.js").then((m) => m.default);
}

/**
 * Get device service
 * Handles device fingerprinting and trust management
 */
export function getDeviceService() {
  return import("./DeviceService.js").then((m) => m.default);
}

/**
 * Get cache service
 * Handles shared data caching
 */
export function getCacheService() {
  return import("./sharedDataCache.js").then((m) => m.default);
}

/**
 * Get cross-app service
 * Handles cross-application integration
 */
export function getCrossAppService() {
  return import("./CrossAppService.js").then((m) => m.default);
}

/**
 * Get token service (backward compatibility)
 * Returns TokenManagementService instance
 */
export function getTokenService() {
  // Return the TokenManagementService class for backward compatibility
  return Promise.resolve(TokenManagementService);
}

/**
 * Get OAuth service (backward compatibility)
 * Returns OAuthAuthService instance
 */
export function getOAuthService() {
  // Return the OAuthAuthService class for backward compatibility
  return Promise.resolve(OAuthAuthService);
}

// ==================== SYNCHRONOUS EXPORTS (for already-loaded services) ====================

/**
 * Lazy-loaded services registry
 * Build this up as services are imported
 * @type {Map<string, any>}
 */
const loadedServices = new Map();

/**
 * Get all loaded services
 */
export function getLoadedServices() {
  return Object.fromEntries(loadedServices);
}

/**
 * Cache loaded service
 * @private
 */
export function cacheService(name, instance) {
  loadedServices.set(name, instance);
}

/**
 * Check if a service is available in the loaded services registry
 * @param {string} serviceName - The name of the service to check
 * @returns {boolean}
 */
export function isServiceAvailable(serviceName) {
  return loadedServices.has(serviceName);
}
