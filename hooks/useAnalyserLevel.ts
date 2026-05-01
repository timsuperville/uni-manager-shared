/**
 * useAnalyserLevel — shared hook for reading real-time audio levels
 * from a Web Audio AnalyserNode using requestAnimationFrame.
 *
 * Returns a normalized 0–1 level value updated each animation frame.
 * Safe to use without an AnalyserNode — returns 0 and skips the rAF loop.
 *
 * @param analyser  - AnalyserNode from the Web Audio graph (or null)
 * @param smoothing - additional client-side smoothing factor 0–1 (default 0.85)
 * @returns         - normalized level 0–1 (0 = silence, 1 = full)
 */

import { useState, useEffect, useRef } from "react";

export function useAnalyserLevel(
  analyser: AnalyserNode | null,
  smoothing = 0.85,
): number {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef(0);

  useEffect(() => {
    if (!analyser) {
      setLevel(0);
      return;
    }

    const bufLen = analyser.frequencyBinCount; // fftSize / 2
    const buf = new Uint8Array(bufLen);

    const tick = () => {
      analyser.getByteFrequencyData(buf);

      // Peak value across all bins (0–255)
      let peak = 0;
      for (let i = 0; i < bufLen; i++) {
        const sample = buf[i] ?? 0;
        if (sample > peak) peak = sample;
      }

      // Normalize to 0–1 then smooth
      const raw = peak / 255;
      const smoothed = prevRef.current * smoothing + raw * (1 - smoothing);
      prevRef.current = smoothed;

      setLevel(smoothed);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [analyser, smoothing]);

  return level;
}
