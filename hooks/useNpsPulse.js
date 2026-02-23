/**
 * useNpsPulse — Periodic NPS (Net Promoter Score) pulse survey hook
 *
 * Shows a non-intrusive NPS prompt after:
 *   - The user has been active for at least `minActivityMs` (default 3 minutes)
 *   - At least `intervalDays` days have passed since the last prompt (default 14)
 *   - Persisted in localStorage under key `${appType}_nps_last_shown`
 *
 * Returns:
 *   { shouldShow, dismiss, submit }
 *   - shouldShow    {boolean}   True when the prompt should be rendered
 *   - dismiss()     {Function}  Record a dismissal (marks as shown, won't re-show for intervalDays)
 *   - submit(score, comment?) {Function}  Submit the NPS score then dismiss
 *
 * Usage (in a Layout component or App root):
 *   const nps = useNpsPulse({ appType: 'admin' });
 *   {nps.shouldShow && <NpsSurvey onDismiss={nps.dismiss} onSubmit={nps.submit} />}
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { submitFeedbackSilently } from "../components/FeedbackQuickAction";

const STORAGE_KEY_SUFFIX = "_nps_last_shown";

export function useNpsPulse({
  appType = "unknown",
  intervalDays = 14,
  minActivityMs = 3 * 60 * 1000, // 3 minutes
  enabled = true,
} = {}) {
  const [shouldShow, setShouldShow] = useState(false);
  const activityTimer = useRef(null);
  const shown = useRef(false);

  const storageKey = `${appType}${STORAGE_KEY_SUFFIX}`;

  // Check if enough time has elapsed since last shown
  const isEligible = useCallback(() => {
    if (typeof window === "undefined") return false;
    try {
      const last = localStorage.getItem(storageKey);
      if (!last) return true; // Never shown — eligible immediately
      const daysSince =
        (Date.now() - parseInt(last, 10)) / (1000 * 60 * 60 * 24);
      return daysSince >= intervalDays;
    } catch {
      return false;
    }
  }, [storageKey, intervalDays]);

  const markShown = useCallback(() => {
    try {
      localStorage.setItem(storageKey, String(Date.now()));
    } catch {
      // localStorage not available — ignore
    }
  }, [storageKey]);

  // Dismiss without submitting — record as seen so the timer resets
  const dismiss = useCallback(() => {
    setShouldShow(false);
    markShown();
  }, [markShown]);

  // Submit score (0–10) + optional comment, then dismiss
  const submit = useCallback(
    async (score, comment = "") => {
      setShouldShow(false);
      markShown();
      const label =
        score >= 9 ? "Promoter" : score >= 7 ? "Passive" : "Detractor";
      await submitFeedbackSilently({
        title: `NPS Score: ${score}/10 (${label})`,
        description: `Net Promoter Score submitted for ${appType}. Score: ${score}/10.${comment ? ` Comment: ${comment}` : ""}`,
        appType,
        severity: "low",
      });
    },
    [markShown, appType],
  );

  // Timer: fire after minActivityMs if eligible
  useEffect(() => {
    if (!enabled || shown.current) return;

    if (!isEligible()) return;

    activityTimer.current = setTimeout(() => {
      if (isEligible() && !shown.current) {
        shown.current = true;
        setShouldShow(true);
      }
    }, minActivityMs);

    return () => {
      if (activityTimer.current) clearTimeout(activityTimer.current);
    };
  }, [enabled, isEligible, minActivityMs]);

  return { shouldShow, dismiss, submit };
}

export default useNpsPulse;
