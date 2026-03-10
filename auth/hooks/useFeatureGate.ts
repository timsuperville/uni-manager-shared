import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth.ts";
import { getApiBaseUrl } from "../../api/config/apiConfig.js";

// ── Module-level gate cache ───────────────────────────────────────────────────
// Keyed by `${appType}:${userId}`, value is Map<featureKey, boolean>.
// Prevents refetching on every component mount.
const _cache = new Map<string, Map<string, boolean>>();

async function fetchActiveGates(
  appType: string,
  token: string | null | undefined,
  userId: string,
): Promise<Map<string, boolean>> {
  const cacheKey = `${appType}:${userId}`;
  const cached = _cache.get(cacheKey);
  if (cached) return cached;

  try {
    const base = getApiBaseUrl() as string;
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
      _cache.set(cacheKey, new Map());
      return new Map();
    }

    const data = await res.json() as { features?: Array<{ featureKey: string; isEnabled?: boolean }> };
    const gates = data.features ?? [];
    const gateMap = new Map<string, boolean>();
    gates.forEach((gate) => {
      gateMap.set(gate.featureKey, gate.isEnabled !== false);
    });

    _cache.set(cacheKey, gateMap);
    return gateMap;
  } catch {
    // Network failure → fail open
    _cache.set(cacheKey, new Map());
    return new Map();
  }
}

/**
 * Invalidate the feature gate cache for a given user/app.
 * Call from admin UI after toggling a gate.
 */
export function invalidateFeatureGateCache(appType: string, userId: string): void {
  _cache.delete(`${appType}:${userId}`);
}

// ── Primary hook — single feature key ────────────────────────────────────────

export function useFeatureGate(featureKey: string): boolean {
  const { user, isAuthenticated } = useAuth();
  const [enabled, setEnabled] = useState(true); // fail-open default
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setEnabled(false);
      return;
    }

    const extUser = user as typeof user & {
      rbac?: { app?: string };
      _token?: string;
      _id?: string;
    };

    const appType = extUser.rbac?.app ?? "personal";
    const token = extUser._token ?? null;
    const userId = extUser._id ?? user.id ?? "anon";

    fetchActiveGates(appType, token, userId).then((gateMap) => {
      if (!mountedRef.current) return;
      if (gateMap.size === 0) {
        setEnabled(true); // endpoint unavailable — fail open
        return;
      }
      const val = gateMap.has(featureKey) ? gateMap.get(featureKey)! : true;
      setEnabled(val);
    });
  }, [featureKey, isAuthenticated, user]);

  return enabled;
}

// ── Batch hook ────────────────────────────────────────────────────────────────

export function useFeatureGates(featureKeys: string[]): Record<string, boolean> {
  const { user, isAuthenticated } = useAuth();
  const [gates, setGates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(featureKeys.map((k) => [k, true])),
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setGates(Object.fromEntries(featureKeys.map((k) => [k, false])));
      return;
    }

    const extUser = user as typeof user & {
      rbac?: { app?: string };
      _token?: string;
      _id?: string;
    };

    const appType = extUser.rbac?.app ?? "personal";
    const token = extUser._token ?? null;
    const userId = extUser._id ?? user.id ?? "anon";

    fetchActiveGates(appType, token, userId).then((gateMap) => {
      if (!mountedRef.current) return;
      const result: Record<string, boolean> = {};
      featureKeys.forEach((key) => {
        result[key] = gateMap.has(key) ? gateMap.get(key)! : true;
      });
      setGates(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(featureKeys), isAuthenticated, user]);

  return gates;
}

export default useFeatureGate;
