/**
 * Type declarations for useFrustrationDetector.js
 * Source: frontend/shared/hooks/useFrustrationDetector.js
 *
 * TODO: migrate useFrustrationDetector.js → .ts in the shared hooks migration pulse.
 */

export interface FrustrationContext {
  /** "rage-click" | "rapid-nav" */
  signal: string;
  /** The FEEDBACK_SOURCES value that triggered the detection */
  source: string;
  /** Pathname where the signal fired */
  path: string;
}

export interface UseFrustrationDetectorOptions {
  /** VITE_APP_TYPE for the current shell (used in auto-report metadata) */
  appType?: string;
  /** Called with context when a frustration threshold is crossed */
  onFrustrated?: (ctx: FrustrationContext) => void;
  /** Defaults true — set false to pause detection */
  enabled?: boolean;
  /** Defaults true — suppresses all fires in dev to avoid polluting the DB */
  disableInDev?: boolean;
  /** Clicks within window to trigger rage-click (default 3) */
  rageClickThreshold?: number;
  /** Time window for rage-click in ms (default 700) */
  rageClickWindowMs?: number;
  /** Navigation changes to trigger rapid-nav (default 3) */
  navThreshold?: number;
  /** Time window for rapid-nav in ms (default 4000) */
  navWindowMs?: number;
  /** Minimum ms between onFrustrated calls (default 30000) */
  cooldownMs?: number;
}

export function useFrustrationDetector(options?: UseFrustrationDetectorOptions): void;
