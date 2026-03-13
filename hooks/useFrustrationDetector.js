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
 * Usage:
 *   useFrustrationDetector({
 *     appType: 'admin',
 *     onFrustrated: ({ signal, source, context }) => setFeedbackOpen(true),
 *   });
 *
 * Props:
 *   appType            {string}   VITE_APP_TYPE value for the current shell
 *   onFrustrated       {Function} Called with { signal, source, ...context } on detection
 *   enabled            {boolean}  Defaults to true; set false to pause detection
 *   disableInDev       {boolean}  Defaults to true; suppresses all fires in the development
 *                                 environment to avoid polluting the DB during local testing.
 *                                 Set to false only if you explicitly want dev-time signals.
 *   rageClickThreshold {number}   Clicks within window to trigger (default 3)
 *   rageClickWindowMs  {number}   Time window for rage-click in ms (default 700)
 *   navThreshold       {number}   Navigation changes to trigger (default 3)
 *   navWindowMs        {number}   Time window for rapid-nav in ms (default 4000)
 *   cooldownMs         {number}   Minimum ms between onFrustrated calls (default 30000)
 */

import { useEffect, useRef, useCallback } from "react";

// ─── History patch ref-count ───────────────────────────────────────────────────
// P4: history.pushState/replaceState can only be patched once safely.
// We track how many hook instances are mounted and maintain a single patch,
// broadcasting to all subscribers via a module-level Set of listener functions.
const _navListeners = new Set();
let _historyPatched = false;

function _ensureHistoryPatched() {
  if (_historyPatched || typeof history === "undefined") return;
  _historyPatched = true;

  const _origPush = history.pushState.bind(history);
  const _origReplace = history.replaceState.bind(history);

  history.pushState = (...args) => {
    _origPush(...args);
    _navListeners.forEach((fn) => fn());
  };
  history.replaceState = (...args) => {
    _origReplace(...args);
    _navListeners.forEach((fn) => fn());
  };
  // Note: we intentionally never restore the originals — the patch is
  // additive (it calls the original) and the listener set empties naturally
  // as instances unmount, so it becomes a no-op with zero listeners.
}

export function useFrustrationDetector({
  appType = "unknown",
  onFrustrated,
  enabled = true,
  disableInDev = true,
  rageClickThreshold = 3,
  rageClickWindowMs = 700,
  navThreshold = 3,
  navWindowMs = 4000,
  cooldownMs = 30_000,
} = {}) {
  // Rage-click state
  const clickLog = useRef([]); // [{ target: Element, ts: number }]

  // Rapid-nav state
  const navLog = useRef([]); // [ts: number]

  // Cooldown — prevent repeated triggers within cooldownMs
  const lastTriggeredAt = useRef(0);

  // Resolve effective enabled state — suppress in development when disableInDev is set.
  // Vite exposes import.meta.env; fall back to process.env for test environments.
  const isDev =
    typeof import.meta !== "undefined"
      ? import.meta.env?.MODE === "development" || import.meta.env?.DEV === true
      : process.env.NODE_ENV === "development";

  const effectivelyEnabled = enabled && !(disableInDev && isDev);

  const fire = useCallback(
    (signal, context = {}) => {
      if (!onFrustrated) return;
      const now = Date.now();
      if (now - lastTriggeredAt.current < cooldownMs) return;
      lastTriggeredAt.current = now;

      const fullContext = {
        signal,
        // Tag every auto-fire with its origin so consumers can filter these
        // from the agent issue scan and the Admin Sentiment Feed.
        source: "frustration-detector",
        path: typeof window !== "undefined" ? window.location.pathname : "/",
        url: typeof window !== "undefined" ? window.location.href : "",
        appType,
        timestamp: new Date().toISOString(),
        ...context,
      };

      try {
        onFrustrated(fullContext);
      } catch (_err) {
        // Absorb any error in the caller so detection never crashes the UI
      }
    },
    [onFrustrated, cooldownMs, appType],
  );

  // ── Rage-click detector ────────────────────────────────────────────────────
  useEffect(() => {
    if (!effectivelyEnabled || typeof window === "undefined") return;

    const handleClick = (e) => {
      const now = Date.now();
      const target = e.target;

      // Prune stale entries outside the window
      clickLog.current = clickLog.current.filter(
        (entry) =>
          now - entry.ts <= rageClickWindowMs && entry.target === target,
      );

      clickLog.current.push({ target, ts: now });

      if (clickLog.current.length >= rageClickThreshold) {
        clickLog.current = []; // reset so one frustration === one signal
        fire("rage-click", {
          element: target?.tagName?.toLowerCase(),
          elementId: target?.id || null,
          elementText: target?.textContent?.trim().slice(0, 80) || null,
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

    const recordNav = () => {
      const now = Date.now();
      // Prune stale entries
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
    // instead of patching history.pushState directly, which was unsafe when
    // multiple instances of this hook mounted concurrently.
    _ensureHistoryPatched();
    _navListeners.add(recordNav);
    window.addEventListener("popstate", recordNav);

    return () => {
      window.removeEventListener("popstate", recordNav);
      _navListeners.delete(recordNav);
    };
  }, [effectivelyEnabled, navThreshold, navWindowMs, fire]);

  // No public API needed — the hook is purely side-effectful
  return null;
}

export default useFrustrationDetector;
