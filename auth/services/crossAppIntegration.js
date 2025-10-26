/**
 * Cross App Integration Service
 *
 * Handles integration and communication between different Uni-Manager applications.
 * Manages shared state, data synchronization, and cross-app events.
 *
 * @module services/crossAppIntegration
 */

import CrossAppService from './CrossAppService.js';

/**
 * Cross App Integration Service
 * Wrapper around the shared cross-app service singleton
 */
class CrossAppIntegrationService {
  constructor() {
    this.sharedService = CrossAppService;
    this.registrations = new Map();
  }

  /**
   * Register current application
   * @param {string} appName - Name of the application
   * @returns {object} Registration object with unregister method
   */
  registerApp(appName) {
    const registration = this.sharedService.registerApplication(appName);
    this.registrations.set(appName, registration);
    return registration;
  }

  /**
   * Get current user across all apps
   * @returns {object|null} Current authenticated user
   */
  getCurrentUser() {
    return this.sharedService.getCurrentUser();
  }

  /**
   * Check authentication status
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return this.sharedService.isAuthenticated();
  }

  /**
   * Get authentication headers for API calls
   * @returns {object} Headers with authorization
   */
  getAuthHeaders() {
    return this.sharedService.getAuthHeaders();
  }

  /**
   * Listen to authentication events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener callback
   */
  onAuthEvent(event, listener) {
    this.sharedService.on(event, listener);
  }

  /**
   * Remove authentication event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener callback
   */
  offAuthEvent(event, listener) {
    this.sharedService.off(event, listener);
  }

  /**
   * Synchronize auth state across tabs
   * Used internally by the shared service
   */
  syncAuthState() {
    return this.sharedService.validateToken();
  }

  /**
   * Cleanup all registrations
   */
  cleanup() {
    this.registrations.forEach((registration) => {
      registration.unregister();
    });
    this.registrations.clear();
  }
}

// Create singleton instance
const crossAppIntegration = new CrossAppIntegrationService();

export default crossAppIntegration;
