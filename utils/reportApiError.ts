/**
 * reportApiError — Proactive API Failure Telemetry
 *
 * Silently reports API-layer failures to the backend ErrorLog so they surface
 * in the Admin Error LiveSync dashboard WITHOUT requiring a user to manually
 * submit feedback.
 *
 * Design principles:
 *  - Uses raw fetch (never BaseService) to avoid recursive error loops.
 *  - Fire-and-forget: never throws, never blocks the caller.
 *  - Skips expected auth signals (401, 403) and request timeouts (408).
 *  - Skips 404s that are known-acceptable (e.g. "not found" on optional
 *    checks) — callers opt-in by passing `reportable: true` explicitly.
 *  - Controlled by the `VITE_REPORT_API_ERRORS` env var:
 *      - production: always reports
 *      - development/staging: reports only when VITE_REPORT_API_ERRORS=true
 *
 * Endpoint: POST /api/v1/errors/log (public, no auth required)
 * The endpoint is intentionally unauthenticated so pre-login errors are
 * captured. We still attach the token if available.
 */

/** Status codes that are expected control-flow signals, NOT bugs. */
const EXPECTED_STATUS_CODES = new Set([
  401, // Unauthenticated — handled by auth redirect
  403, // Forbidden — handled by RBAC guard
  408 // Request timeout — transient, user retries
]);

/**
 * Discovers the auth token from storage without importing AuthService,
 * which would create a circular dependency.
 * Mirrors the same namespace scan used by GlobalErrorBoundary.
 */
function resolveAuthToken(): string | null {
  const namespaces = ['church', 'admin', 'home', 'personal', 'work', 'uni'];
  for (const ns of namespaces) {
    const token =
      window.sessionStorage?.getItem(`${ns}_auth_access_token`) ??
      window.localStorage?.getItem(`${ns}_auth_access_token`);
    if (token) return token;
  }
  return null;
}

export interface ApiErrorReport {
  /** HTTP status code (e.g. 404, 500). Required. */
  statusCode: number;
  /** Human-readable error message. */
  message: string;
  /** The endpoint path that failed (e.g. "/church/abc123/follow"). */
  endpoint?: string;
  /** HTTP method (GET, POST, etc). */
  method?: string;
  /** Service class name (e.g. "DiscoveryService"). */
  service?: string;
  /** App that triggered the error (e.g. "church"). */
  appType?: string;
  /** Additional context key/value pairs. */
  context?: Record<string, unknown>;
}

/**
 * Determines whether this error should be reported to the ErrorLog.
 * Returns false for expected control-flow signals to avoid flooding the DB.
 */
function isReportable(statusCode: number): boolean {
  // Always report server errors
  if (statusCode >= 500) return true;

  // Skip known expected control-flow codes
  if (EXPECTED_STATUS_CODES.has(statusCode)) return false;

  // Report all other 4xx (404s for routes that should exist, 400 bad payloads, etc.)
  return statusCode >= 400;
}

/**
 * Returns true when reporting is enabled for the current environment.
 * Production always reports. Other environments require opt-in via env var.
 */
function isReportingEnabled(): boolean {
  // Vite exposes import.meta.env — typed via vite/client ambient declarations.
  const mode = import.meta.env.MODE ?? 'development';
  if (mode === 'production') return true;
  return import.meta.env.VITE_REPORT_API_ERRORS === 'true';
}

/**
 * Fire-and-forget error reporter. Never throws. Always returns void.
 *
 * @example
 * // In BaseService.logError:
 * reportApiError({ statusCode: 404, message: err.message, endpoint, service: this.serviceName });
 */
export async function reportApiError(report: ApiErrorReport): Promise<void> {
  try {
    if (!isReportingEnabled()) return;
    if (!isReportable(report.statusCode)) return;

    const token = resolveAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const mode = import.meta.env.MODE ?? 'development';

    await fetch('/api/v1/errors/log', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        // Core fields expected by ErrorLog model
        message: report.message || 'API call failed',
        severity: report.statusCode >= 500 ? 'high' : 'medium',
        appType: report.appType ?? 'unknown',
        category: 'api',
        environment: mode === 'production' ? 'production' : 'development',
        url: window.location.href,
        path: window.location.pathname,
        userAgent: navigator.userAgent,

        // API-specific context
        statusCode: report.statusCode,
        endpoint: report.endpoint,
        method: report.method,
        service: report.service,

        // free-form additional context
        ...(report.context ?? {})
      })
    });
  } catch (_err) {
    (globalThis as any).conditionalLog?.('warn', '[EmptyCatch]', _err);
    // Intentionally silent — this reporter must never surface errors itself.
  }
}
