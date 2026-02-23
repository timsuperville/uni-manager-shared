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
 *     onFrustrated: ({ signal, context }) => setFeedbackOpen(true),
 *   });
 *
 * Props:
 *   appType       {string}   VITE_APP_TYPE value for the current shell
 *   onFrustrated  {Function} Called with { signal, context } on detection
 *   enabled       {boolean}  Defaults to true; set false to pause detection
 *   rageClickThreshold {number} Clicks within window to trigger (default 3)
 *   rageClickWindowMs  {number} Time window for rage-click in ms (default 700)
 *   navThreshold       {number} Navigation changes to trigger (default 3)
 *   navWindowMs        {number} Time window for rapid-nav in ms (default 4000)
 *   cooldownMs         {number} Minimum ms between onFrustrated calls (default 30000)
 */

import { useEffect, useRef, useCallback } from "react";

export function useFrustrationDetector({
  appType = "unknown",
  onFrustrated,
  enabled = true,
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

  const fire = useCallback(
    (signal, context = {}) => {
      if (!onFrustrated) return;
      const now = Date.now();
      if (now - lastTriggeredAt.current < cooldownMs) return;
      lastTriggeredAt.current = now;

      const fullContext = {
        signal,
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
    if (!enabled || typeof window === "undefined") return;

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
  }, [enabled, rageClickThreshold, rageClickWindowMs, fire]);

  // ── Rapid-navigation detector ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

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

    // React Router / Next.js SPA navigation via popstate
    window.addEventListener("popstate", recordNav);

    // Intercept pushState / replaceState (History API mutations don't fire popstate)
    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);

    history.pushState = (...args) => {
      originalPush(...args);
      recordNav();
    };

    history.replaceState = (...args) => {
      originalReplace(...args);
      recordNav();
    };

    return () => {
      window.removeEventListener("popstate", recordNav);
      history.pushState = originalPush;
      history.replaceState = originalReplace;
    };
  }, [enabled, navThreshold, navWindowMs, fire]);

  // No public API needed — the hook is purely side-effectful
  return null;
}

export default useFrustrationDetector;
