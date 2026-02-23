/**
 * useFeatureGate — Feature Gate Hook
 * =====================================
 * Checks whether a feature is enabled for the current user based on:
 * 1. Platform-level on/off toggle (isEnabled)
 * 2. Subscription tier of the user's org
 * 3. RBAC role requirements (requiredRoles)
 *
 * Feature gates are fetched once per session from:
 *   GET /api/v1/features/active?appType=<appType>
 *
 * @example
 *   const canViewBudget = useFeatureGate('home.budget_goals');
 *   const canUploadMedia = useFeatureGate('playback.media_upload');
 *
 * @param {string} featureKey - The feature identifier (e.g. 'home.budget_goals')
 * @returns {boolean} Whether the feature is accessible for this user
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth.js";
import { getApiBaseUrl } from "../../api/config/apiConfig.js";

// Module-level cache: featureKey → boolean, keyed by appType+userId
// Prevents refetching on every component mount
const _cache = new Map(); // key: `${appType}:${userId}`, value: Map<featureKey, boolean>

/**
 * Fetch and cache all active feature gates for the given appType.
 * Returns a Map<featureKey, boolean>.
 */
async function fetchActiveGates(appType, token, userId) {
  const cacheKey = `${appType}:${userId}`;
  if (_cache.has(cacheKey)) {
    return _cache.get(cacheKey);
  }

  try {
    const base = getApiBaseUrl();
    const res = await fetch(
      `${base}/api/v1/features/active?appType=${encodeURIComponent(appType)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      },
    );

    if (!res.ok) {
      // Graceful degradation — if the endpoint fails, treat all gates as enabled
      _cache.set(cacheKey, new Map());
      return new Map();
    }

    const data = await res.json();
    const gates = data.features || data.featureGates || [];

    const gateMap = new Map();
    gates.forEach((gate) => {
      gateMap.set(gate.featureKey, gate.isEnabled !== false);
    });

    _cache.set(cacheKey, gateMap);
    return gateMap;
  } catch {
    // Network failure → fail open (don't block UI)
    _cache.set(cacheKey, new Map());
    return new Map();
  }
}

/**
 * Invalidate the feature gate cache for a given user.
 * Call this from admin UI after toggling a gate.
 */
export function invalidateFeatureGateCache(appType, userId) {
  _cache.delete(`${appType}:${userId}`);
}

/**
 * Primary hook — single feature key
 */
export function useFeatureGate(featureKey) {
  const { user, isAuthenticated } = useAuth();
  const [enabled, setEnabled] = useState(true); // fail-open default
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setEnabled(false);
      return;
    }

    const appType = user.rbac?.app || "personal";
    const token = user._token || null; // Token may be stored on user object
    const userId = user._id || user.id || "anon";

    fetchActiveGates(appType, token, userId).then((gateMap) => {
      if (!mountedRef.current) return;
      if (gateMap.size === 0) {
        // Empty map = endpoint unavailable, fail open
        setEnabled(true);
        return;
      }
      // If gate exists in map, return its value; if unknown key, fail open
      const val = gateMap.has(featureKey) ? gateMap.get(featureKey) : true;
      setEnabled(val);
    });
  }, [featureKey, isAuthenticated, user]);

  return enabled;
}

/**
 * Batch hook — check multiple feature keys at once
 * @param {string[]} featureKeys
 * @returns {Record<string, boolean>}
 */
export function useFeatureGates(featureKeys) {
  const { user, isAuthenticated } = useAuth();
  const [gates, setGates] = useState(() => {
    // Default all to enabled (fail open)
    return Object.fromEntries(featureKeys.map((k) => [k, true]));
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setGates(Object.fromEntries(featureKeys.map((k) => [k, false])));
      return;
    }

    const appType = user.rbac?.app || "personal";
    const token = user._token || null;
    const userId = user._id || user.id || "anon";

    fetchActiveGates(appType, token, userId).then((gateMap) => {
      if (!mountedRef.current) return;
      const result = {};
      featureKeys.forEach((key) => {
        result[key] = gateMap.has(key) ? gateMap.get(key) : true;
      });
      setGates(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(featureKeys), isAuthenticated, user]);

  return gates;
}

export default useFeatureGate;
