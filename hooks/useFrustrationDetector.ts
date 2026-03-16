/**
 * useFrustrationDetector — Passive frustration detection hook
 *
 * Monitors two passive behavioural signals:
 *   1. Rage-click: ≥3 rapid clicks on the same element within 700ms
 *   2. Rapid navigation: ≥3 route/page changes within 4 seconds
 *
 * When a frustration threshold is crossed the hook calls onFrustrated()
 * once (then resets the cooldown counter) so the caller can:
 *   - Open the FeedbackQuickAction modal pre-filled with context, OR
 *   - Call submitFeedbackSilently() for a zero-UI auto-report
 *
 * P4 architecture: history.pushState/replaceState are patched once at
 * module level via a shared listener Set so concurrent hook instances
 * never apply the patch twice.
 */

import { useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FrustrationSignal = "rage-click" | "rapid-navigation" | "consecutive-api-failure";

export interface FrustrationContext {
  signal: FrustrationSignal;
  source: "frustration-detector";
  path: string;
  url: string;
  appType: string;
  timestamp: string;
  // rage-click extras
  element?: string | null;
  elementId?: string | null;
  elementText?: string | null;
  // rapid-nav extras
  // rapid-nav extras
  navCount?: number;
  windowMs?: number;
  // api-failure extras
  apiFailureCount?: number;
  errorObject?: any;
  mutationName?: string;
}

export interface UseFrustrationDetectorOptions {
  appType?: string;
  onFrustrated?: (context: FrustrationContext) => void;
  enabled?: boolean;
  disableInDev?: boolean;
  rageClickThreshold?: number;
  rageClickWindowMs?: number;
  navThreshold?: number;
  navWindowMs?: number;
  apiFailureThreshold?: number;
  apiFailureWindowMs?: number;
  cooldownMs?: number;
}

interface ClickLogEntry {
  target: EventTarget | null;
  ts: number;
}

// ---------------------------------------------------------------------------
// Module-level history patch (P4 — patch once, share via listener Set)
// ---------------------------------------------------------------------------

type NavListener = () => void;
const _navListeners = new Set<NavListener>();
let _historyPatched = false;

function _ensureHistoryPatched(): void {
  if (_historyPatched || typeof history === "undefined") return;
  _historyPatched = true;

  const _origPush = history.pushState.bind(history) as typeof history.pushState;
  const _origReplace = history.replaceState.bind(
    history,
  ) as typeof history.replaceState;

  history.pushState = (...args: Parameters<typeof history.pushState>) => {
    _origPush(...args);
    _navListeners.forEach((fn) => fn());
  };
  history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
    _origReplace(...args);
    _navListeners.forEach((fn) => fn());
  };
  // The patch is additive (calls originals); listener set empties as instances
  // unmount, making it a no-op with zero listeners.
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFrustrationDetector(
  options: UseFrustrationDetectorOptions = {},
): null {
  const {
    appType = "unknown",
    onFrustrated,
    enabled = true,
    disableInDev = true,
    rageClickThreshold = 3,
    rageClickWindowMs = 700,
    navThreshold = 3,
    navWindowMs = 4_000,
    apiFailureThreshold = 2,
    apiFailureWindowMs = 15_000,
    cooldownMs = 30_000,
  } = options;

  const clickLog = useRef<ClickLogEntry[]>([]);
  const navLog = useRef<number[]>([]);
  const apiFailureLog = useRef<number[]>([]);
  const lastTriggeredAt = useRef<number>(0);

  // Resolve effective enabled state — suppress in development when disableInDev is set.
  const isDev: boolean =
    typeof import.meta !== "undefined"
      ? import.meta.env?.MODE === "development" || import.meta.env?.DEV === true
      : process.env.NODE_ENV === "development";

  const effectivelyEnabled = enabled && !(disableInDev && isDev);

  const fire = useCallback(
    (
      signal: FrustrationSignal,
      context: Partial<FrustrationContext> = {},
    ): void => {
      if (!onFrustrated) return;
      const now = Date.now();
      if (now - lastTriggeredAt.current < cooldownMs) return;
      lastTriggeredAt.current = now;

      const fullContext: FrustrationContext = {
        signal,
        source: "frustration-detector",
        path: typeof window !== "undefined" ? window.location.pathname : "/",
        url: typeof window !== "undefined" ? window.location.href : "",
        appType,
        timestamp: new Date().toISOString(),
        ...context,
      };

      try {
        onFrustrated(fullContext);
      } catch {
        // Absorb any error in the caller so detection never crashes the UI
      }
    },
    [onFrustrated, cooldownMs, appType],
  );

  // ── Rage-click detector ────────────────────────────────────────────────────
  useEffect(() => {
    if (!effectivelyEnabled || typeof window === "undefined") return;

    const handleClick = (e: MouseEvent): void => {
      const now = Date.now();
      const target = e.target;

      clickLog.current = clickLog.current.filter(
        (entry) =>
          now - entry.ts <= rageClickWindowMs && entry.target === target,
      );
      clickLog.current.push({ target, ts: now });

      if (clickLog.current.length >= rageClickThreshold) {
        clickLog.current = [];
        fire("rage-click", {
          element: (target as Element | null)?.tagName?.toLowerCase() ?? null,
          elementId: (target as Element | null)?.id || null,
          elementText:
            (target as Element | null)?.textContent?.trim().slice(0, 80) ??
            null,
        });
      }
    };

    window.addEventListener("click", handleClick, { capture: true });
    return () =>
      window.removeEventListener("click", handleClick, { capture: true });
  }, [effectivelyEnabled, rageClickThreshold, rageClickWindowMs, fire]);

  // ── Rapid-navigation detector ──────────────────────────────────────────────
  useEffect(() => {
    if (!effectivelyEnabled || typeof window === "undefined") return;

    const recordNav: NavListener = () => {
      const now = Date.now();
      navLog.current = navLog.current.filter((ts) => now - ts <= navWindowMs);
      navLog.current.push(now);

      if (navLog.current.length >= navThreshold) {
        navLog.current = [];
        fire("rapid-navigation", {
          navCount: navThreshold,
          windowMs: navWindowMs,
        });
      }
    };

    // P4 — Register as a subscriber to the shared module-level history patch
    _ensureHistoryPatched();
    _navListeners.add(recordNav);
    window.addEventListener("popstate", recordNav);

    return () => {
      window.removeEventListener("popstate", recordNav);
      _navListeners.delete(recordNav);
    };
  }, [effectivelyEnabled, navThreshold, navWindowMs, fire]);

  // ── Consecutive API failure detector ─────────────────────────────────────
  useEffect(() => {
    if (!effectivelyEnabled || typeof window === "undefined") return;

    const recordApiFailure = (e: Event) => {
      const customEvent = e as CustomEvent;
      const now = Date.now();
      apiFailureLog.current = apiFailureLog.current.filter((ts) => now - ts <= apiFailureWindowMs);
      apiFailureLog.current.push(now);

      if (apiFailureLog.current.length >= apiFailureThreshold) {
        apiFailureLog.current = [];
        fire("consecutive-api-failure", {
          apiFailureCount: apiFailureThreshold,
          windowMs: apiFailureWindowMs,
          errorObject: customEvent.detail?.error,
          mutationName: customEvent.detail?.mutationName,
        });
      }
    };

    window.addEventListener("api-mutation-failure", recordApiFailure);
    return () => window.removeEventListener("api-mutation-failure", recordApiFailure);
  }, [effectivelyEnabled, apiFailureThreshold, apiFailureWindowMs, fire]);

  // Purely side-effectful hook
  return null;
}

export default useFrustrationDetector;
