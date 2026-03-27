import { useState, useEffect, useCallback } from "react";

/**
 * useArmConfirm — Two-step arm-to-fire confirmation pattern for live cue safety.
 *
 * Clicking once "arms" the cue (visual warning state). A second click within
 * `armDurationMs` fires the action. The arm state auto-resets after the timeout
 * to prevent lingering armed states during live service.
 *
 * @param onFire    Callback to invoke when the cue is confirmed.
 * @param armDurationMs  Auto-disarm timeout in milliseconds (default: 4000).
 */
export function useArmConfirm(onFire: () => void, armDurationMs = 4000) {
  const [isArmed, setIsArmed] = useState(false);

  // Auto-disarm after timeout
  useEffect(() => {
    if (!isArmed) return;
    const t = setTimeout(() => setIsArmed(false), armDurationMs);
    return () => clearTimeout(t);
  }, [isArmed, armDurationMs]);

  const handleTrigger = useCallback(() => {
    if (!isArmed) {
      setIsArmed(true);
    } else {
      setIsArmed(false);
      onFire();
    }
  }, [isArmed, onFire]);

  const disarm = useCallback(() => setIsArmed(false), []);

  return { isArmed, handleTrigger, disarm };
}
