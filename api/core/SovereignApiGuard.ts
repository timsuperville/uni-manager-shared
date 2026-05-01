import { AxiosRequestConfig } from "axios";

/**
 * SovereignApiGuard.ts
 *
 * Implements the "Sovereign Shutdown Boundary" (Phase 10: Personal Sanctuary).
 * Physically severs API connections for work and church domains during shutdown hours.
 */

// In a full implementation, this state would be tied to Redux/Context
let _isShutdownLocked = false;

export const setShutdownLocked = (locked: boolean) => {
  _isShutdownLocked = locked;
};

export const isShutdownLocked = () => _isShutdownLocked;

export class SovereignApiGuard {
  /**
   * Evaluates if a request should be severed based on the Sovereign Shutdown Boundary.
   * Returns true if the request is blocked.
   */
  static shouldBlockRequest(config: AxiosRequestConfig): boolean {
    if (!isShutdownLocked()) return false;

    const url = config.url || "";

    // Block church and work API requests
    if (url.includes("/api/church") || url.includes("/api/work")) {
      return true;
    }

    return false;
  }
}
