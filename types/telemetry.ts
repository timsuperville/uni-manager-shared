/**
 * frontend/shared/types/telemetry.ts
 *
 * Canonical types for Telemetry and Error Monitoring payloads.
 * These align strictly with the backend ErrorLog and FeedbackReport schemas.
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory =
  | 'network'
  | 'rendering'
  | 'auth'
  | 'database'
  | 'bug'
  | 'unknown'
  | string;

export type FeedbackType =
  | 'feature-request'
  | 'error-report'
  | 'general-feedback';

export type AppType =
  | 'admin'
  | 'church'
  | 'home'
  | 'personal'
  | 'work'
  | 'playback'
  | 'presentation'
  | 'unknown'
  | string;

export type ErrorEnvironment = 'development' | 'production';
