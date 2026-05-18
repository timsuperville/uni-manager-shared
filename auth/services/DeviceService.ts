/**
 * Device Service
 *
 * Handles device fingerprinting, identification, and trust management.
 * Tracks device information and manages device-based security policies.
 * Instantiated as a singleton — one device identity per page load.
 */

import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeviceInfo {
  deviceId: string | null;
  userAgent: string;
  language: string;
  timezone: number;
  screenResolution: string;
  platform: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

class DeviceService {
  private deviceId: string | null = null;
  private deviceFingerprint: string | null = null;
  private deviceInfo: Partial<DeviceInfo> | null = null;
  private isTrustedState = false;

  constructor() {
    this.init();
  }

  private init(): void {
    this.loadDeviceId();
    this.generateFingerprint();
    this.collectDeviceInfo();
  }

  private loadDeviceId(): void {
    try {
      const stored = localStorage.getItem('uni_manager_device_id');
      if (stored) {
        this.deviceId = stored;
      } else {
        this.deviceId = this.generateDeviceId();
        localStorage.setItem('uni_manager_device_id', this.deviceId);
      }
    } catch (err) {
      if (import.meta.env.DEV)
        logger.error('Failed to load device ID:', err as Error);
      this.deviceId = this.generateDeviceId();
    }
  }

  private generateDeviceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `device_${timestamp}_${random}`;
  }

  private generateFingerprint(): void {
    try {
      const components = [
        navigator.userAgent || 'unknown',
        navigator.language || 'unknown',
        new Date().getTimezoneOffset(),
        (navigator as Navigator & { hardwareConcurrency?: number })
          .hardwareConcurrency ?? 'unknown',
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory ??
          'unknown'
      ];

      this.deviceFingerprint = this.hashString(components.join('|'));
    } catch (err) {
      if (import.meta.env.DEV)
        logger.error('Failed to generate fingerprint:', err as Error);
      this.deviceFingerprint = this.generateDeviceId();
    }
  }

  private collectDeviceInfo(): void {
    try {
      this.deviceInfo = {
        deviceId: this.deviceId,
        userAgent: navigator.userAgent || 'unknown',
        language: navigator.language || 'unknown',
        timezone: new Date().getTimezoneOffset(),
        screenResolution: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform || 'unknown',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      if (import.meta.env.DEV)
        logger.error('Failed to collect device info:', err as Error);
      this.deviceInfo = {
        deviceId: this.deviceId,
        timestamp: new Date().toISOString()
      };
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /** Returns the stable device ID (persisted in localStorage). */
  getDeviceId(): string | null {
    return this.deviceId;
  }

  /** Returns the device fingerprint hash. */
  getFingerprint(): string | null {
    return this.deviceFingerprint;
  }

  /** Returns collected device information. */
  getDeviceInfo(): Partial<DeviceInfo> | null {
    return this.deviceInfo;
  }

  /** Marks the device as trusted and persists that decision. */
  trustDevice(): void {
    this.isTrustedState = true;
    try {
      localStorage.setItem(`uni_manager_trusted_${this.deviceId}`, 'true');
    } catch (err) {
      if (import.meta.env.DEV)
        logger.error('Failed to trust device:', err as Error);
    }
  }

  /** Revokes device trust in memory and storage. */
  revokeTrust(): void {
    this.isTrustedState = false;
    try {
      localStorage.removeItem(`uni_manager_trusted_${this.deviceId}`);
    } catch (err) {
      if (import.meta.env.DEV)
        logger.error('Failed to revoke device trust:', err as Error);
    }
  }

  /** Checks whether the device is currently trusted. */
  isTrustedDevice(): boolean {
    try {
      const trusted = localStorage.getItem(
        `uni_manager_trusted_${this.deviceId}`
      );
      this.isTrustedState = trusted !== null;
      return this.isTrustedState;
    } catch (err) {
      if (import.meta.env.DEV)
        logger.error('Failed to check device trust:', err as Error);
      return false;
    }
  }

  /** Clears trust state from memory and storage. */
  clear(): void {
    this.isTrustedState = false;
    try {
      localStorage.removeItem(`uni_manager_trusted_${this.deviceId}`);
    } catch (err) {
      if (import.meta.env.DEV)
        logger.error('Failed to clear device info:', err as Error);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton instance — one device identity per page load
// ---------------------------------------------------------------------------
const deviceService = new DeviceService();
export default deviceService;
