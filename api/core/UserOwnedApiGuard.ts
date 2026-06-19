import { AxiosRequestConfig } from 'axios';

/**
 * UserOwnedApiGuard.ts
 *
 * Implements the "UserOwned Shutdown Boundary" (Phase 10: Private Space).
 * Physically severs API connections for work and church domains during shutdown hours.
 */

// In a full implementation, this state would be tied to Redux/Context
let _isShutdownLocked = false;

export const setShutdownLocked = (locked: boolean) => {
  _isShutdownLocked = locked;
};

export const isShutdownLocked = () => _isShutdownLocked;

export class UserOwnedApiGuard {
  /**
   * Evaluates if a request should be severed based on the UserOwned Shutdown Boundary.
   * Returns true if the request is blocked.
   */
  static shouldBlockRequest(config: AxiosRequestConfig): boolean {
    if (!isShutdownLocked()) return false;

    const url = config.url || '';

    // Block church and work API requests
    if (url.includes('/api/church') || url.includes('/api/work')) {
      return true;
    }

    return false;
  }
}
