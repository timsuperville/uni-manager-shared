/**
 * Auth Performance Benchmarks
 *
 * Tests to verify performance optimizations are effective,
 * particularly device fingerprint caching.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { generateDeviceFingerprint } from "../../utils/socialAuth.ts";
import {
  clearCachedDeviceFingerprint,
  getCachedDeviceFingerprint,
  hasCachedFingerprint,
} from "../../utils/deviceFingerprintCache.ts";

describe("Auth Performance Benchmarks", () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCachedDeviceFingerprint();
  });

  it("should cache device fingerprint effectively", async () => {
    // First call - no cache, should calculate
    const start1 = performance.now();
    const fp1 = await generateDeviceFingerprint();
    const time1 = performance.now() - start1;

    console.log(`First call (uncached): ${time1.toFixed(2)}ms`);

    // Second call - should use cache
    const start2 = performance.now();
    const fp2 = await generateDeviceFingerprint();
    const time2 = performance.now() - start2;

    console.log(`Second call (cached): ${time2.toFixed(2)}ms`);
    console.log(`Speedup: ${(time1 / time2).toFixed(1)}x faster`);

    // Verify same fingerprint returned
    expect(fp1).toBe(fp2);

    // Cached call should be dramatically faster
    expect(time2).toBeLessThan(5); // Should be <5ms when cached
    expect(time2).toBeLessThan(time1 / 5); // At least 5x faster (conservative)
  });

  it("should persist cache across calls", async () => {
    // Generate fingerprint
    const fp1 = await generateDeviceFingerprint();

    // Verify cache exists
    expect(hasCachedFingerprint()).toBe(true);

    // Get cached value directly
    const cached = getCachedDeviceFingerprint();
    expect(cached).toBe(fp1);

    // Generate again, should use cache
    const fp2 = await generateDeviceFingerprint();
    expect(fp2).toBe(fp1);
  });

  it("should clear cache when requested", async () => {
    // Generate and cache
    await generateDeviceFingerprint();
    expect(hasCachedFingerprint()).toBe(true);

    // Clear cache
    clearCachedDeviceFingerprint();
    expect(hasCachedFingerprint()).toBe(false);

    // Next call should recalculate
    const start = performance.now();
    await generateDeviceFingerprint();
    const time = performance.now() - start;

    // Should be slower (recalculating)
    // Not checking exact time as it varies by environment
    expect(hasCachedFingerprint()).toBe(true);
  });

  it("should handle rapid consecutive calls efficiently", async () => {
    const calls = 10;
    const results = [];

    const start = performance.now();
    for (let i = 0; i < calls; i++) {
      results.push(await generateDeviceFingerprint());
    }
    const totalTime = performance.now() - start;

    // All should return same value
    expect(new Set(results).size).toBe(1);

    // Average per call should be very fast (mostly cached)
    const avgTime = totalTime / calls;
    console.log(
      `Average time per call (${calls} calls): ${avgTime.toFixed(2)}ms`,
    );

    expect(avgTime).toBeLessThan(10); // Should average <10ms
  });
});
