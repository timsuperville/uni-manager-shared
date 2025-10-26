/**
 * Device Service
 *
 * Handles device fingerprinting, identification, and trust management.
 * Tracks device information and manages device-based security policies.
 *
 * @module services/DeviceService
 */

/* global localStorage, console, navigator, window */

class DeviceService {
  constructor() {
    this.deviceId = null;
    this.deviceFingerprint = null;
    this.deviceInfo = null;
    this.isTrusted = false;
    this.init();
  }

  /**
   * Initialize device service
   * @private
   */
  init() {
    this.loadDeviceId();
    this.generateFingerprint();
    this.collectDeviceInfo();
  }

  /**
   * Load or create device ID
   * @private
   */
  loadDeviceId() {
    try {
      const stored = localStorage.getItem('uni_manager_device_id');
      if (stored) {
        this.deviceId = stored;
      } else {
        this.deviceId = this.generateDeviceId();
        localStorage.setItem('uni_manager_device_id', this.deviceId);
      }
    } catch (err) {
      console.error('Failed to load device ID:', err);
      this.deviceId = this.generateDeviceId();
    }
  }

  /**
   * Generate unique device ID
   * @private
   * @returns {string} Unique device ID
   */
  generateDeviceId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `device_${timestamp}_${random}`;
  }

  /**
   * Generate device fingerprint
   * @private
   */
  generateFingerprint() {
    try {
      const components = [
        navigator.userAgent || 'unknown',
        navigator.language || 'unknown',
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.deviceMemory || 'unknown',
      ];

      const fingerprint = components.join('|');
      const hash = this.hashString(fingerprint);
      this.deviceFingerprint = hash;
    } catch (err) {
      console.error('Failed to generate fingerprint:', err);
      this.deviceFingerprint = this.generateDeviceId();
    }
  }

  /**
   * Collect device information
   * @private
   */
  collectDeviceInfo() {
    try {
      this.deviceInfo = {
        deviceId: this.deviceId,
        userAgent: navigator.userAgent || 'unknown',
        language: navigator.language || 'unknown',
        timezone: new Date().getTimezoneOffset(),
        screenResolution: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform || 'unknown',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Failed to collect device info:', err);
      this.deviceInfo = {
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get device ID
   * @returns {string} Current device ID
   */
  getDeviceId() {
    return this.deviceId;
  }

  /**
   * Get device fingerprint
   * @returns {string} Device fingerprint
   */
  getFingerprint() {
    return this.deviceFingerprint;
  }

  /**
   * Get device information
   * @returns {object} Device information
   */
  getDeviceInfo() {
    return this.deviceInfo;
  }

  /**
   * Mark device as trusted
   */
  trustDevice() {
    this.isTrusted = true;
    try {
      localStorage.setItem(`uni_manager_trusted_${this.deviceId}`, 'true');
    } catch (err) {
      console.error('Failed to trust device:', err);
    }
  }

  /**
   * Revoke device trust
   */
  revokeTrust() {
    this.isTrusted = false;
    try {
      localStorage.removeItem(`uni_manager_trusted_${this.deviceId}`);
    } catch (err) {
      console.error('Failed to revoke device trust:', err);
    }
  }

  /**
   * Check if device is trusted
   * @returns {boolean} True if device is trusted
   */
  isTrustedDevice() {
    try {
      const trusted = localStorage.getItem(`uni_manager_trusted_${this.deviceId}`);
      this.isTrusted = !!trusted;
      return this.isTrusted;
    } catch (err) {
      console.error('Failed to check device trust:', err);
      return false;
    }
  }

  /**
   * Simple hash function for fingerprinting
   * @private
   * @param {string} str - String to hash
   * @returns {string} Hash value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Clear device information
   */
  clear() {
    this.isTrusted = false;
    try {
      localStorage.removeItem(`uni_manager_trusted_${this.deviceId}`);
    } catch (err) {
      console.error('Failed to clear device info:', err);
    }
  }
}

// Create singleton instance
const deviceService = new DeviceService();

export default deviceService;
