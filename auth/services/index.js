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

/**
 * Get session service (consolidated from 4 files)
 * Handles session management, token storage, device fingerprinting, cross-tab sync
 */
export function getSessionService() {
  return import('./SessionService.js').then(m => m.default);
}

/**
 * Get authentication service
 * Handles login, signup, password reset, verification
 */
export function getAuthService() {
  return import('./authService.js').then(m => m.default);
}

/**
 * Get MFA service
 * Handles multi-factor authentication setup and verification
 */
export function getMFAService() {
  return import('./mfaService.js').then(m => m.default);
}

/**
 * Get token service
 * Handles token generation, validation, refresh
 */
export function getTokenService() {
  return import('./TokenService.js').then(m => m.default);
}

/**
 * Get OAuth service
 * Handles OAuth provider integration and authentication
 */
export function getOAuthService() {
  return import('./oauthService.js').then(m => m.default);
}

/**
 * Get RBAC service
 * Handles role-based access control and permissions
 */
export function getRBACService() {
  return import('./rbacService.js').then(m => m.default);
}

/**
 * Get security service
 * Handles security monitoring and fraud detection
 */
export function getSecurityService() {
  return import('./securityService.js').then(m => m.default);
}

/**
 * Get device service
 * Handles device fingerprinting and trust management
 */
export function getDeviceService() {
  return import('./DeviceService.js').then(m => m.default);
}

/**
 * Get cache service
 * Handles shared data caching
 */
export function getCacheService() {
  return import('./sharedDataCache.js').then(m => m.default);
}

/**
 * Get cross-app service
 * Handles cross-application integration
 */
export function getCrossAppService() {
  return import('./crossAppIntegration.js').then(m => m.default);
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
