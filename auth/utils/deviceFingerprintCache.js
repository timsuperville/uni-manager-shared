/**
 * Device Fingerprint Cache
 *
 * Caches device fingerprints to avoid expensive recalculation.
 * Device characteristics are static, so we cache for 24 hours.
 *
 * Uses both memory cache (fast) and sessionStorage (persistent across page reloads).
 */

// Memory cache
let cachedFingerprint = null;
let cacheTimestamp = null;

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Storage keys
const STORAGE_KEY = "device_fingerprint";
const STORAGE_TIME_KEY = "device_fingerprint_time";

/**
 * Get cached device fingerprint if available and not expired
 * @returns {string|null} Cached fingerprint or null if not available/expired
 */
export function getCachedDeviceFingerprint() {
  const now = Date.now();

  // Check memory cache first (fastest)
  if (cachedFingerprint && cacheTimestamp) {
    const age = now - cacheTimestamp;
    if (age < CACHE_DURATION) {
      return cachedFingerprint;
    }
  }

  // Check sessionStorage (persistent across page reloads)
  if (typeof sessionStorage !== "undefined") {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const storedTime = sessionStorage.getItem(STORAGE_TIME_KEY);

      if (stored && storedTime) {
        const age = now - parseInt(storedTime, 10);
        if (age < CACHE_DURATION) {
          // Restore to memory cache
          cachedFingerprint = stored;
          cacheTimestamp = parseInt(storedTime, 10);
          return stored;
        }
      }
    } catch (error) {
      // SessionStorage might be disabled or full
      if (import.meta.env.DEV) {
        console.warn(
          "[DeviceFingerprintCache] Failed to read from sessionStorage:",
          error,
        );
      }
    }
  }

  return null;
}

/**
 * Cache device fingerprint for future use
 * @param {string} fingerprint - Device fingerprint to cache
 */
export function setCachedDeviceFingerprint(fingerprint) {
  if (!fingerprint) return;

  const now = Date.now();

  // Update memory cache
  cachedFingerprint = fingerprint;
  cacheTimestamp = now;

  // Update sessionStorage for persistence
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY, fingerprint);
      sessionStorage.setItem(STORAGE_TIME_KEY, now.toString());
    } catch (error) {
      // SessionStorage might be disabled or full
      if (import.meta.env.DEV) {
        console.warn(
          "[DeviceFingerprintCache] Failed to write to sessionStorage:",
          error,
        );
      }
    }
  }
}

/**
 * Clear cached device fingerprint
 * Called on logout to ensure new fingerprint on next login
 */
export function clearCachedDeviceFingerprint() {
  // Clear memory cache
  cachedFingerprint = null;
  cacheTimestamp = null;

  // Clear sessionStorage
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_TIME_KEY);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(
          "[DeviceFingerprintCache] Failed to clear sessionStorage:",
          error,
        );
      }
    }
  }
}

/**
 * Check if cache exists and is valid
 * @returns {boolean}
 */
export function hasCachedFingerprint() {
  return getCachedDeviceFingerprint() !== null;
}
