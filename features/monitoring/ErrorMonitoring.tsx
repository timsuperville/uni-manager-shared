// Production Error Monitoring â€” utility functions only.
// The ErrorBoundary class has been consolidated into @shared/components/ErrorBoundary.jsx.
//
// Exports from this file:
//   ErrorBoundary                 (re-export from canonical location)
//   collectAdvancedErrorContext
//   setupGlobalErrorHandling
//   installFetchInterceptor
//   setupPerformanceMonitoring
//   setupOfflineFlush
//   setupHealthCheck
//   initializeMonitoring
//   createMonitoredQueryClient    (wraps QueryClient with onErrorâ†’INGEST_ERRORS)

import { getAuthToken } from '../../utils/authToken';
import { flushPendingErrorReports } from '../../components/error-boundary';
import { collectSystemContext } from '../feedback/utils/collectSystemContext';
import { logger } from '../../utils/logger';

declare global {
  interface Window {
    __errorHandlersInstalled?: boolean;
    __fetchInterceptorInstalled?: boolean;
    __offlineFlushInstalled?: boolean;
    __healthCheckInstalled?: boolean;
  }
}

// Environment-specific configuration
const isProd = (import.meta.env?.MODE || 'development') === 'production';
const isStaging = (import.meta.env?.MODE || 'development') === 'staging';

import { getApiBaseUrl } from '../../api/config/apiConfig';

// â”€â”€ Ingest endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Support remote hosts explicitly if VITE_API_URL is configured
const INGEST_ERRORS = `${getApiBaseUrl()}/api/v1/infra/errors/log`;
const INGEST_FEEDBACK = `${getApiBaseUrl()}/api/v1/feedback`;

// ErrorBoundary â€” canonical unified component. Re-exported here so any code
// that still imports from this module continues to work.
export { ErrorBoundary } from '../../components/error-boundary';

// â”€â”€ Recent user activity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getRecentUserActivity = () => {
  try {
    return JSON.parse(sessionStorage.getItem('userActivities') || '[]').slice(
      -5
    );
  } catch (_) {
    return [];
  }
};

// â”€â”€ Advanced telemetry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Called by global window handlers (unhandledrejection, error) and merged into
// `meta` by ErrorBoundary.reportError() for render-crash payloads.
//
// IMPORTANT: this function must NOT return a field named `environment` â€” the
// ErrorLog schema uses that as a top-level String enum ('development'|'production').
// We use `browserContext` for the browser-environment object instead.
//
// All property accesses are typeof-guarded for SSR/jsdom/Worker safety.
interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface ExtendedNavigator extends Navigator {
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

export const collectAdvancedErrorContext = (
  baseError: Record<string, unknown>
): Record<string, unknown> => {
  const p =
    typeof performance !== 'undefined'
      ? (performance as ExtendedPerformance)
      : null;
  const n =
    typeof navigator !== 'undefined' ? (navigator as ExtendedNavigator) : null;
  const w = typeof window !== 'undefined' ? window : null;
  const s = typeof screen !== 'undefined' ? screen : null;
  const d = typeof document !== 'undefined' ? document : null;

  return {
    ...baseError,

    // â”€â”€ Advanced context goes into meta so Mongoose stores it (Mixed field) â”€â”€
    // Do NOT spread these at the top level â€” the backend service destructures
    // only known schema keys; anything extra at root is silently dropped.
    meta: {
      ...(baseError.meta ? (baseError.meta as Record<string, unknown>) : {}),

      performanceInfo: {
        memory: p?.memory
          ? {
              usedJSHeapSize: p.memory.usedJSHeapSize,
              totalJSHeapSize: p.memory.totalJSHeapSize,
              jsHeapSizeLimit: p.memory.jsHeapSizeLimit
            }
          : null,
        // performance.timing is deprecated but widely supported.
        // Only include when loadEventEnd is positive (fired after page load).
        timing:
          p?.timing && p.timing.loadEventEnd > 0
            ? {
                loadTime: p.timing.loadEventEnd - p.timing.navigationStart,
                domReady:
                  p.timing.domContentLoadedEventEnd - p.timing.navigationStart
              }
            : null,
        connection: n?.connection
          ? {
              effectiveType: n.connection.effectiveType,
              downlink: n.connection.downlink,
              rtt: n.connection.rtt
            }
          : null
      },

      // Renamed from `environment` to `browserContext` to avoid colliding with
      // the top-level ErrorLog.environment String enum field.
      browserContext: {
        userAgent: n?.userAgent || '',
        platform: n?.platform || '',
        language: n?.language || '',
        cookieEnabled: n?.cookieEnabled ?? null,
        onLine: n?.onLine ?? null,
        viewport: w ? { width: w.innerWidth, height: w.innerHeight } : null,
        screen: s
          ? { width: s.width, height: s.height, colorDepth: s.colorDepth }
          : null
      },

      capabilities: {
        serviceWorker: !!(n && 'serviceWorker' in n),
        pushManager: !!(w && 'PushManager' in w),
        notifications: !!(w && 'Notification' in w),
        geolocation: !!(n && 'geolocation' in n),
        webgl: (() => {
          try {
            return !!(d && d.createElement('canvas').getContext('webgl'));
          } catch (e) {
            return false;
          }
        })()
      },

      recentActivity: getRecentUserActivity()
    }
  };
};

// â”€â”€ Environment normalisation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ErrorLog.environment enum only accepts 'development' | 'production'.
// Staging and any other environments must map to one of those two values.
const normaliseEnvironment = (mode?: string): 'development' | 'production' =>
  mode === 'development' ? 'development' : 'production';

// â”€â”€ Feedback payload builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Builds the FeedbackReport payload for auto-submitted global errors.
// Schema constraints enforced here (never rely on Mongoose to catch them):
//   type      enum: 'user-feedback' | 'error-report' | 'broken-link' | 'performance-issue'
//   category  enum: 'bug' | 'feature' | 'improvement' | 'other'
//   userInput.title          maxlength: 200
//   userInput.description    maxlength: 1000
//   userInput.actualBehavior maxlength: 1000

/** Truncate a string to `max` chars, appending an ellipsis if clipped. */
const trunc = (str: string, max: number): string => {
  if (!str || str.length <= max) return str || '';
  return str.slice(0, max - 1) + '\u2026'; // â€¦ (1 char)
};

interface GlobalErrorData {
  type?: string;
  message?: string;
  url?: string;
  timestamp?: string | number;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  name?: string;
  appType?: string;
  errorId?: string;
}

const buildGlobalFeedbackPayload = (
  errorData: GlobalErrorData
): Record<string, unknown> => {
  const rawTitle = `Global Error: ${errorData.message || 'Unknown error'}`;
  const rawStack = errorData.stack || 'No stack trace available';

  // Keep description informative but within the 1000-char schema limit.
  // Stack trace is trimmed first since it is the most likely overflow source.
  const stackSnippet = trunc(rawStack, 600);

  const description = trunc(
    `**Automatic Global Error Report**\n\n` +
      `**Error Type:** ${errorData.type || 'Unknown'}\n` +
      `**Message:** ${trunc(errorData.message || 'Unknown error', 200)}\n` +
      `**Location:** ${errorData.url || 'Unknown'}\n` +
      `**Time:** ${errorData.timestamp ? new Date(errorData.timestamp).toLocaleString() : new Date().toLocaleString()}\n\n` +
      `**Technical Details:**\n` +
      `- File: ${errorData.filename || 'Unknown'}\n` +
      `- Line: ${errorData.lineno || 'Unknown'}\n` +
      `- Column: ${errorData.colno || 'Unknown'}\n\n` +
      `**Stack Trace:**\n\`\`\`\n${stackSnippet}\n\`\`\``,
    1000
  );

  const actualBehavior = trunc(
    `Uncaught ${errorData.name || 'Error'}: ${errorData.message || 'Unknown error'} ` +
      `at ${errorData.filename || 'unknown'}:${errorData.lineno || '?'}:${errorData.colno || '?'}`,
    1000
  );

  return {
    // â”€â”€ Enum-safe values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    type: 'error-report', // was: "automatic_global_error" (invalid enum)
    category: 'bug', // was: "runtime_error" (invalid enum)
    severity: errorData.type === 'uncaught' ? 'critical' : 'high',

    // â”€â”€ User-input fields (schema maxlengths respected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    userInput: {
      title: trunc(rawTitle, 200),
      description,
      actualBehavior
    },

    // â”€â”€ System context (matches FeedbackReport schema shape) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    systemContext: {
      ...(typeof window !== 'undefined'
        ? collectSystemContext(errorData.appType || 'unknown')
        : {}),
      source: 'global-error-handler',
      errors: [
        {
          message: errorData.message || 'Unknown error',
          stack: errorData.stack,
          timestamp: errorData.timestamp
            ? new Date(errorData.timestamp)
            : new Date(),
          level: 'error'
        }
      ]
    },

    // â”€â”€ Cross-reference (links FeedbackReport â†’ ErrorLog in the admin UI) â”€â”€â”€â”€â”€
    linkedErrorId: errorData.errorId || null
  };
};

// â”€â”€ Global window error handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Layer 2 of the three-layer monitoring stack:
//   Layer 1 â€” React ErrorBoundary     (render errors inside React tree)
//   Layer 2 â€” window error handlers   (this file â€” unhandled promises, uncaught)
//   Layer 3 â€” installFetchInterceptor (5xx and network-fail responses)
export const setupGlobalErrorHandling = () => {
  if (typeof window === 'undefined') return; // SSR guard

  // Idempotency guard â€” prevents duplicate listeners on HMR / double-mount
  if (window.__errorHandlersInstalled) return;
  window.__errorHandlersInstalled = true;

  const appType =
    (import.meta.env && import.meta.env.VITE_APP_TYPE) || 'unknown';
  const env = normaliseEnvironment(import.meta.env?.MODE);

  // â”€â”€ Activity breadcrumb tracker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const trackActivity = (activity: string) => {
    try {
      const activities = JSON.parse(
        sessionStorage.getItem('userActivities') || '[]'
      );
      // Trim to prevent unbounded sessionStorage growth (10 entries max, 100-char cap each)
      const entry = `${new Date().toLocaleTimeString()}: ${String(activity).substring(0, 100)}`;
      activities.push(entry);
      sessionStorage.setItem(
        'userActivities',
        JSON.stringify(activities.slice(-10))
      );
    } catch (_) {
      globalThis.conditionalLog?.('warn', '[EmptyCatch]', _);
      /* sessionStorage unavailable */
    }
  };

  trackActivity(`Navigated to ${window.location.pathname}`);

  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const el =
      target.closest('button') ||
      target.closest('a') ||
      (target.tagName === 'BUTTON' || target.tagName === 'A' ? target : null);
    if (!el) return;
    trackActivity(
      `Clicked: ${(el.textContent?.trim() || el.getAttribute('aria-label') || 'element').substring(0, 50)}`
    );
  });

  // Helper â€” build auth headers so global errors also get user attribution
  const makeHeaders = (): HeadersInit => {
    const token = getAuthToken(appType);
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  // â”€â”€ Unhandled promise rejections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  window.addEventListener('unhandledrejection', event => {
    const errMessage = event.reason?.message || String(event.reason) || '';

    // Filter expected third-party noise (YouTube Iframe API & AdBlockers)
    if (
      errMessage.includes("Failed to execute 'postMessage' on 'DOMWindow'") ||
      errMessage.includes('target origin provided') ||
      errMessage.includes('youtube-nocookie.com') ||
      errMessage.includes('doubleclick.net')
    ) {
      return;
    }

    // Specific handler for Vite chunk load errors (during background deployments)
    if (
      errMessage.includes('Failed to fetch dynamically imported module') ||
      errMessage.includes('dynamically imported module') ||
      errMessage.includes('Importing a module script failed')
    ) {
      const reloadKey = 'vite_chunk_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      if (!lastReload || Date.now() - parseInt(lastReload, 10) > 5000) {
        sessionStorage.setItem(reloadKey, Date.now().toString());
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(r => r.unregister());
          });
        }
        window.location.reload();
      }
      return; // Always stop processing to avoid spamming the log for this noise
    }

    const base = {
      type: 'unhandledrejection',
      // Generate a short unique ID so admin can cross-reference FeedbackReportâ†”â†”ErrorLog
      errorId: `ERR-${Date.now().toString(36).toUpperCase().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      message: errMessage || 'Unhandled promise rejection',
      name: event.reason?.name || 'UnhandledRejection',
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      path: window.location.pathname,
      appType,
      environment: env,
      severity: 'high',
      category: 'unhandled-rejection'
    };
    const enhanced = collectAdvancedErrorContext(base);
    const headers = makeHeaders();

    // Errors from unhandled rejections are logged to ErrorLog only.
    // FeedbackReport is reserved for real user-submitted feedback.
    fetch(INGEST_ERRORS, {
      method: 'POST',
      headers,
      body: JSON.stringify(enhanced)
    }).catch(() => {
      /* swallow â€” don't loop on monitor failure */
    });
  });

  // â”€â”€ Uncaught synchronous errors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  window.addEventListener('error', (event: ErrorEvent) => {
    // Resource load errors (img, script) fire window.error with a null event.message
    // and a non-null event.target. Filter them â€” they're not JS exceptions.
    if (event.target && event.target !== window) return;

    const errMessage = event.message || 'Unknown error';

    // Filter expected third-party noise (YouTube Iframe API & AdBlockers)
    if (
      errMessage.includes("Failed to execute 'postMessage' on 'DOMWindow'") ||
      errMessage.includes('target origin provided') ||
      errMessage.includes('youtube-nocookie.com') ||
      errMessage.includes('doubleclick.net')
    ) {
      return;
    }

    // Specific handler for Vite chunk load errors (during background deployments)
    if (
      errMessage.includes('Failed to fetch dynamically imported module') ||
      errMessage.includes('dynamically imported module') ||
      errMessage.includes('Importing a module script failed')
    ) {
      const reloadKey = 'vite_chunk_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      if (!lastReload || Date.now() - parseInt(lastReload, 10) > 5000) {
        sessionStorage.setItem(reloadKey, Date.now().toString());
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(r => r.unregister());
          });
        }
        window.location.reload();
      }
      return; // Always stop processing to avoid spamming the log for this noise
    }

    const base = {
      type: 'uncaught',
      // Generate a short unique ID so admin can cross-reference FeedbackReportâ†”â†”ErrorLog
      errorId: `ERR-${Date.now().toString(36).toUpperCase().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      message: errMessage,
      name: event.error?.name || 'Error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      path: window.location.pathname,
      appType,
      environment: env,
      severity: 'critical',
      category: 'uncaught'
    };
    const enhanced = collectAdvancedErrorContext(base);
    const headers = makeHeaders();

    // Uncaught synchronous errors are logged to ErrorLog only.
    // FeedbackReport is reserved for real user-submitted feedback.
    fetch(INGEST_ERRORS, {
      method: 'POST',
      headers,
      body: JSON.stringify(enhanced)
    }).catch(() => {
      /* swallow */
    });
  });
};

// â”€â”€ Fetch interceptor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Layer 3 â€” reports 5xx and true network failures without per-call instrumentation.
// Uses _originalFetch to bypass the interceptor itself (no reporting loops).
export const installFetchInterceptor = () => {
  if (typeof window === 'undefined' || window.__fetchInterceptorInstalled)
    return;
  window.__fetchInterceptorInstalled = true;

  const _originalFetch = window.fetch;
  const appType =
    (import.meta.env && import.meta.env.VITE_APP_TYPE) || 'unknown';
  const env = normaliseEnvironment(import.meta.env?.MODE);

  window.fetch = async function interceptedFetch(
    ...args: Parameters<typeof fetch>
  ) {
    const arg = args[0];
    const url =
      typeof arg === 'string' ? arg : 'url' in arg ? arg.url : arg.href || '';
    // Monitoring + health endpoints excluded to prevent feedback loops.
    // /health failures are owned exclusively by setupHealthCheck (which applies
    // grace periods and consecutive-failure thresholds before logging).
    const isMonitoringCall =
      /\/api\/v1\/(infra\/errors|integrations\/feedback)\//.test(url) ||
      /\/analytics(\/|$)/.test(url) ||
      /\/health(\?|$)/.test(url) ||
      /\/admin\/system\/init\/status(\?|$)/.test(url);

    let response;
    try {
      response = await _originalFetch(args[0], args[1]);
    } catch (err: unknown) {
      const networkError = err as Error;
      const urlStr = String(url);

      // Filter expected third-party noise (AdBlockers blocking YouTube/DoubleClick)
      const isExpectedNoise =
        urlStr.includes('doubleclick.net') ||
        urlStr.includes('googleads') ||
        urlStr.includes('youtube-nocookie.com') ||
        networkError.message.includes('doubleclick.net') ||
        networkError.message.includes('youtube');

      // True network failure (DNS, CORS, offline) â€” report if not monitoring call
      if (!isMonitoringCall && !isExpectedNoise) {
        _originalFetch(INGEST_ERRORS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'network-error',
            message: `Network error on ${url}: ${networkError.message}`,
            name: networkError.name || 'NetworkError',
            stack: networkError.stack,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : '',
            path: typeof window !== 'undefined' ? window.location.pathname : '',
            appType,
            environment: env,
            severity: 'high',
            category: 'network',
            meta: { endpoint: url }
          })
        }).catch(() => {
          /* swallow */
        });
      }
      throw networkError; // Re-throw so caller still gets the error
    }

    if (!isMonitoringCall && response.status >= 500) {
      _originalFetch(INGEST_ERRORS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'network-5xx',
          message: `HTTP ${response.status} on ${response.url || url}`,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          path: window.location.pathname,
          appType,
          environment: env,
          severity: response.status >= 503 ? 'critical' : 'high',
          category: 'network',
          meta: { status: response.status, endpoint: response.url || url }
        })
      }).catch(() => {
        /* swallow */
      });
    }

    return response;
  };
};

// â”€â”€ Offline report flush â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Registers listeners so pending error reports are retried when connectivity
// or page visibility is restored. Must be called once from initializeMonitoring.
export const setupOfflineFlush = () => {
  if (typeof window === 'undefined') return;
  if (window.__offlineFlushInstalled) return;
  window.__offlineFlushInstalled = true;

  const appType = import.meta.env && import.meta.env.VITE_APP_TYPE;

  // Retry when network comes back
  window.addEventListener('online', () => flushPendingErrorReports(appType));

  // Retry when tab is re-focused (covers backgrounded mobile tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      flushPendingErrorReports(appType);
    }
  });

  // Attempt once immediately in case reports were stored in a previous session
  flushPendingErrorReports(appType);
};

// â”€â”€ Performance monitoring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sendToAnalytics = (metric: unknown) => {
  // NOTE: No backend ingest endpoint exists for web-vitals â€”
  //       metrics are retained in-memory and logged DEV-only (Rule 9.8/Â§451).
  // This suppresses the 404 (Not Found) errors in production.
  if (import.meta.env?.DEV) {
    logger.info('[ErrorMonitoring] Web Vitals Metric:', metric);
  }
};

export const setupPerformanceMonitoring = () => {
  if (!isProd && !isStaging) return;
  if (typeof window === 'undefined') return;

  import('web-vitals')
    .then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(sendToAnalytics);
      onINP(sendToAnalytics);
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
    })
    .catch(() => {
      if (import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        logger.warn(
          '[ErrorMonitoring] web-vitals package not found â€” Core Web Vitals reporting disabled. Install with: npm install web-vitals'
        );
      }
    });

  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            sendToAnalytics({
              name: 'longtask',
              value: entry.duration,
              startTime: entry.startTime
            });
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (_) {
      globalThis.conditionalLog?.('warn', '[EmptyCatch]', _);
      /* entryType 'longtask' not supported in this browser */
    }
  }
};

// â”€â”€ Health check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Pings /health every 30s in prod/staging. When /health returns non-200 OR
// the network rejects the request, reports a critical error to INGEST_ERRORS
// so the admin dashboard registers the outage even before any user hits a 5xx.
// Returns a cleanup fn so tests can cancel the interval.
export const setupHealthCheck = () => {
  if (typeof window === 'undefined') return () => {};
  if (window.__healthCheckInstalled) return () => {};
  window.__healthCheckInstalled = true;

  const appType =
    (import.meta.env && import.meta.env.VITE_APP_TYPE) || 'unknown';
  const env =
    (import.meta.env?.MODE || 'development') === 'development'
      ? 'development'
      : 'production';

  // Grace period: don't log any failures for the first 60 seconds after the
  // page loads. This suppresses the wave of errors that occur during rolling
  // deployments (backend restart window) and cold-start scenarios.
  const startupDeadline = Date.now() + 60_000;

  // Consecutive failure counter: only log to the DB after 2 back-to-back
  // failures so a single blip (brief network hiccup) is not persisted.
  let consecutiveFailures = 0;
  const FAILURE_THRESHOLD = 2;

  const reportHealthFailure = (
    reason: string,
    statusCode: number | null = null
  ) => {
    // Still within startup grace period â€” silently skip.
    if (Date.now() < startupDeadline) return;

    // Do not report if the browser is offline or tab is backgrounded
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      consecutiveFailures = 0; // reset to avoid instant alert when coming online
      return;
    }
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden'
    ) {
      return; // pause checks essentially while hidden
    }

    consecutiveFailures++;
    if (consecutiveFailures < FAILURE_THRESHOLD) return;

    fetch(INGEST_ERRORS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'health-check-failure',
        message: `Backend health check failed: ${reason}`,
        severity: 'critical',
        category: 'infrastructure',
        appType,
        environment: env,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        meta: { statusCode, reason, consecutiveFailures }
      })
    }).catch(() => {
      /* still failing â€” don't loop */
    });
  };

  const intervalId = setInterval(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/health`, {
        cache: 'no-store'
      });
      if (res.ok) {
        // Reset counter on recovery so a subsequent failure restarts the threshold
        consecutiveFailures = 0;
      } else {
        reportHealthFailure(`HTTP ${res.status}`, res.status);
      }
    } catch (err: unknown) {
      const error = err as Error;
      reportHealthFailure(error.message || 'Network error');
    }
  }, 30_000);

  return () => clearInterval(intervalId);
};

// â”€â”€ initializeMonitoring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Call once from each app's main.jsx, before ReactDOM.createRoot().
// All three layers of monitoring are wired here.
export const initializeMonitoring = () => {
  setupGlobalErrorHandling();
  installFetchInterceptor();
  setupOfflineFlush();
  if (isProd || isStaging) {
    setupPerformanceMonitoring();
    setupHealthCheck();
  }
};

// â”€â”€ createMonitoredQueryClient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Drop-in factory for TanStack Query clients that routes data-layer errors to
// INGEST_ERRORS. TanStack Query catches all query/mutation errors internally â€”
// they do NOT propagate to the React ErrorBoundary unless the component
// explicitly re-throws. This QueryCache/MutationCache onError hook gives us
// visibility into data-layer failures without any per-query instrumentation.
//
// Dependency-injection pattern: `reactQuery` is the @tanstack/react-query
// module reference. Keeps this monitoring module decoupled from React Query so
// apps that don't use it don't pull in the dependency.
//
// Usage â€” in App.jsx (replaces `new QueryClient({...})`):
//   import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
//   import { createMonitoredQueryClient } from "@shared/features/monitoring/ErrorMonitoring";
//
//   const queryClient = createMonitoredQueryClient(
//     { QueryClient, QueryCache, MutationCache },
//     { appType: "church", defaultOptions: { queries: { staleTime: 5 * 60_000 } } }
//   );
interface ReactQueryExports {
  QueryClient: new (config: any) => any;
  QueryCache: new (config: any) => any;
  MutationCache: new (config: any) => any;
}

export const createMonitoredQueryClient = (
  reactQuery: ReactQueryExports,
  options: any = {}
): any => {
  const { QueryClient, QueryCache, MutationCache } = reactQuery;

  const appType =
    (options.appType as string) ||
    (import.meta.env && import.meta.env.VITE_APP_TYPE) ||
    'unknown';
  const env =
    (import.meta?.env?.MODE || 'development') === 'development'
      ? 'development'
      : 'production';

  const reportQueryError = (
    error: unknown,
    context: Record<string, unknown>
  ) => {
    const err = error as Error;
    const token = getAuthToken(appType);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(INGEST_ERRORS, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: err?.message || 'Unknown query error',
        stack: err?.stack || '',
        severity: 'high',
        category: 'data-layer',
        appType,
        environment: env,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        meta: {
          queryKey: context?.queryKey || null,
          mutationKey: context?.mutationKey || null,
          errorName: err?.name || 'Error'
        }
      })
    }).catch(() => {
      /* swallow â€” don't loop if ingest is down */
    });
  };

  // Strip our custom option before passing the rest to QueryClient
  const { appType: _appType, ...userOptions } = options;

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error: unknown, query: { queryKey: unknown }) =>
        reportQueryError(error, { queryKey: query.queryKey })
    }),
    mutationCache: new MutationCache({
      onError: (
        error: unknown,
        _vars: unknown,
        _ctx: unknown,
        mutation: { options: { mutationKey: unknown } }
      ) =>
        reportQueryError(error, { mutationKey: mutation.options.mutationKey })
    }),
    ...userOptions
  });
};
