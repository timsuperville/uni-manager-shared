// @shared/performance/webVitals.ts
// Performance monitoring with Core Web Vitals integration.
// NOTE: No backend ingest endpoint exists for /api/analytics/web-vitals —
//       metrics are retained in-memory and logged DEV-only (Rule 9.8/§451).

import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types (exported for consumption by app-level hooks)
// ---------------------------------------------------------------------------

export type VitalName = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | string;
export type VitalRating = 'good' | 'needs-improvement' | 'poor' | 'unknown';

interface VitalThreshold {
  good: number;
  poor: number;
}

export interface VitalMetric {
  value: number;
  rating: VitalRating;
  timestamp: number;
}

interface WebVitalsPayload {
  url: string;
  userAgent: string;
  connection: string;
  metrics: Record<VitalName, VitalMetric>;
  timestamp: number;
  app: string;
}

/** Extended Navigator to optionally access the Network Information API. */
interface NavigatorWithConnection extends Navigator {
  connection?: { effectiveType?: string };
}

/** Extended Window with optional ENV namespace and potential errorTracker. */
interface AppWindow extends Window {
  ENV?: { VITE_APP_NAME?: string };
}

export interface UseWebVitalsResult {
  metrics: Record<VitalName, VitalMetric>;
  score: number;
}

/**
 * Canonical return type for all app-level `usePerformance` hooks.
 * Extends `UseWebVitalsResult` with performance mark/measure helpers.
 */
export interface UsePerformanceReturn extends UseWebVitalsResult {
  isLoading: boolean;
  markFeatureUsed: (featureName: string) => void;
  measureFeatureTime: (featureName: string) => void;
}

// ---------------------------------------------------------------------------
// WebVitalsMonitor class
// ---------------------------------------------------------------------------

class WebVitalsMonitor {
  private metrics: Record<VitalName, VitalMetric> = {};
  private readonly thresholds: Record<VitalName, VitalThreshold> = {
    LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
    FID: { good: 100, poor: 300 }, // First Input Delay
    CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
    FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
    TTFB: { good: 800, poor: 1800 } // Time to First Byte
  };
  private initialized = false;

  init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    this.trackPerformanceMetrics();

    window.addEventListener('beforeunload', () => {
      void this.sendMetrics();
    });

    // Send metrics after 30 seconds.
    window.setTimeout(() => {
      void this.sendMetrics();
    }, 30_000);
  }

  private trackPerformanceMetrics(): void {
    if (!('PerformanceObserver' in window)) return;
    try {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => this.handleEntry(entry));
      });
      observer.observe({
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint']
      });
    } catch (_err) {
      // PerformanceObserver entryTypes not fully supported — safe to ignore.
      if (import.meta.env.DEV) {
        console.warn('[WebVitals] PerformanceObserver not fully supported.');
      }
    }
  }

  private handleEntry(entry: PerformanceEntry): void {
    const metricName: VitalName =
      entry.entryType === 'largest-contentful-paint'
        ? 'LCP'
        : entry.name === 'first-contentful-paint'
          ? 'FCP'
          : entry.entryType;

    // `startTime` exists on all PerformanceEntry; `loadEventEnd` on
    // PerformanceNavigationTiming. Cast to access it safely.
    const nav = entry as PerformanceNavigationTiming;
    const value = entry.startTime || nav.loadEventEnd || 0;

    this.metrics[metricName] = {
      value,
      rating: this.getRating(metricName, value),
      timestamp: Date.now()
    };

    if (import.meta.env.DEV && this.getRating(metricName, value) === 'poor') {
      console.warn(`[WebVitals] Poor ${metricName}: ${value}`);
    }
  }

  private getRating(metricName: VitalName, value: number): VitalRating {
    const threshold = this.thresholds[metricName];
    if (!threshold) return 'unknown';
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /** DEV-only metrics log — no backend endpoint exists for web vitals. */
  async sendMetrics(): Promise<void> {
    if (Object.keys(this.metrics).length === 0) return;

    const nav = window.navigator as NavigatorWithConnection;
    const win = window as AppWindow;

    const payload: WebVitalsPayload = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: nav.connection?.effectiveType ?? 'unknown',
      metrics: this.metrics,
      timestamp: Date.now(),
      app: win.ENV?.VITE_APP_NAME ?? 'unknown'
    };

    // No production endpoint — log in dev for awareness only (Rule 9.8).
    if (import.meta.env.DEV) {
      console.info('[WebVitals] Metrics snapshot:', payload);
    }
  }

  getMetrics(): Record<VitalName, VitalMetric> {
    return this.metrics;
  }

  getPerformanceScore(): number {
    const scores = Object.values(this.metrics).map(({ rating }) => {
      switch (rating) {
        case 'good':
          return 100;
        case 'needs-improvement':
          return 50;
        case 'poor':
          return 0;
        default:
          return 50;
      }
    });
    if (scores.length === 0) return 0;
    return scores.reduce<number>((a, b) => a + b, 0) / scores.length;
  }
}

// ---------------------------------------------------------------------------
// Singleton + hook
// ---------------------------------------------------------------------------

/** Global singleton — call `.init()` once in your app entry point. */
export const webVitalsMonitor = new WebVitalsMonitor();

/**
 * React hook that polls the WebVitalsMonitor every second.
 * Initializes the monitor on first mount.
 */
export const useWebVitals = (): UseWebVitalsResult => {
  const [metrics, setMetrics] = useState<Record<VitalName, VitalMetric>>({});
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    webVitalsMonitor.init();

    const interval = window.setInterval(() => {
      setMetrics({ ...webVitalsMonitor.getMetrics() });
      setScore(webVitalsMonitor.getPerformanceScore());
    }, 1_000);

    return () => window.clearInterval(interval);
  }, []);

  return { metrics, score };
};
