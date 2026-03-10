/**
 * Device Fingerprint Cache
 *
 * Caches device fingerprints to avoid expensive recalculation.
 * Device characteristics are static, so we cache for 24 hours.
 *
 * Uses both memory cache (fast) and sessionStorage (persistent across page reloads).
 */

// Memory cache — null means no value cached
let cachedFingerprint: string | null = null;
let cacheTimestamp: number | null = null;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = "device_fingerprint";
const STORAGE_TIME_KEY = "device_fingerprint_time";

/** Returns the cached device fingerprint if available and not expired, otherwise null. */
export function getCachedDeviceFingerprint(): string | null {
  const now = Date.now();

  // Memory cache first (fastest path)
  if (cachedFingerprint !== null && cacheTimestamp !== null) {
    if (now - cacheTimestamp < CACHE_DURATION) {
      return cachedFingerprint;
    }
  }

  // sessionStorage (persistent across page reloads)
  if (typeof sessionStorage !== "undefined") {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const storedTime = sessionStorage.getItem(STORAGE_TIME_KEY);

      if (stored !== null && storedTime !== null) {
        const age = now - parseInt(storedTime, 10);
        if (age < CACHE_DURATION) {
          // Warm the memory cache
          cachedFingerprint = stored;
          cacheTimestamp = parseInt(storedTime, 10);
          return stored;
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[DeviceFingerprintCache] Failed to read from sessionStorage:", error);
      }
    }
  }

  return null;
}

/** Stores the fingerprint in both the memory cache and sessionStorage. */
export function setCachedDeviceFingerprint(fingerprint: string): void {
  if (!fingerprint) return;

  const now = Date.now();
  cachedFingerprint = fingerprint;
  cacheTimestamp = now;

  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY, fingerprint);
      sessionStorage.setItem(STORAGE_TIME_KEY, now.toString());
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[DeviceFingerprintCache] Failed to write to sessionStorage:", error);
      }
    }
  }
}

/**
 * Clears the cached fingerprint from memory and sessionStorage.
 * Called on logout so a fresh fingerprint is generated on the next login.
 */
export function clearCachedDeviceFingerprint(): void {
  cachedFingerprint = null;
  cacheTimestamp = null;

  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_TIME_KEY);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[DeviceFingerprintCache] Failed to clear sessionStorage:", error);
      }
    }
  }
}

/** Returns true if a valid (non-expired) fingerprint is currently cached. */
export function hasCachedFingerprint(): boolean {
  return getCachedDeviceFingerprint() !== null;
}
