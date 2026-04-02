// Production Error Monitoring — utility functions only.
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
//   createMonitoredQueryClient    (wraps QueryClient with onError→INGEST_ERRORS)

import { getAuthToken } from "../../utils/authToken";
import { flushPendingErrorReports } from "../../components/ErrorBoundary";

declare global {
  interface Window {
    __errorHandlersInstalled?: boolean;
    __fetchInterceptorInstalled?: boolean;
    __offlineFlushInstalled?: boolean;
    __healthCheckInstalled?: boolean;
  }
}

// Environment-specific configuration
const isProd = (import.meta.env?.MODE || "development") === "production";
const isStaging = (import.meta.env?.MODE || "development") === "staging";

import { getApiBaseUrl } from "../../api/config/apiConfig";

// ── Ingest endpoints ──────────────────────────────────────────────────────────
// Support remote hosts explicitly if VITE_API_URL is configured
const INGEST_ERRORS = `${getApiBaseUrl()}/api/v1/infra/errors/log`;
const INGEST_FEEDBACK = `${getApiBaseUrl()}/api/v1/integrations/feedback`;

// ErrorBoundary — canonical unified component. Re-exported here so any code
// that still imports from this module continues to work.
export { ErrorBoundary } from "../../components/ErrorBoundary";

// ── Recent user activity ──────────────────────────────────────────────────────
const getRecentUserActivity = () => {
  try {
    return JSON.parse(sessionStorage.getItem("userActivities") || "[]").slice(
      -5,
    );
  } catch (_) {
    return [];
  }
};

// ── Advanced telemetry ────────────────────────────────────────────────────────
// Called by global window handlers (unhandledrejection, error) and merged into
// `meta` by ErrorBoundary.reportError() for render-crash payloads.
//
// IMPORTANT: this function must NOT return a field named `environment` — the
// ErrorLog schema uses that as a top-level String enum ('development'|'production').
// We use `browserContext` for the browser-environment object instead.
//
// All property accesses are typeof-guarded for SSR/jsdom/Worker safety.
export const collectAdvancedErrorContext = (baseError: any): any => {
  const p = typeof performance !== "undefined" ? (performance as any) : null;
  const n = typeof navigator !== "undefined" ? (navigator as any) : null;
  const w = typeof window !== "undefined" ? window : null;
  const s = typeof screen !== "undefined" ? screen : null;
  const d = typeof document !== "undefined" ? document : null;

  return {
    ...baseError,

    // ── Advanced context goes into meta so Mongoose stores it (Mixed field) ──
    // Do NOT spread these at the top level — the backend service destructures
    // only known schema keys; anything extra at root is silently dropped.
    meta: {
      ...(baseError.meta || {}),

      performanceInfo: {
        memory: p?.memory
          ? {
              usedJSHeapSize: p.memory.usedJSHeapSize,
              totalJSHeapSize: p.memory.totalJSHeapSize,
              jsHeapSizeLimit: p.memory.jsHeapSizeLimit,
            }
          : null,
        // performance.timing is deprecated but widely supported.
        // Only include when loadEventEnd is positive (fired after page load).
        timing:
          p?.timing && p.timing.loadEventEnd > 0
            ? {
                loadTime: p.timing.loadEventEnd - p.timing.navigationStart,
                domReady:
                  p.timing.domContentLoadedEventEnd - p.timing.navigationStart,
              }
            : null,
        connection: n?.connection
          ? {
              effectiveType: n.connection.effectiveType,
              downlink: n.connection.downlink,
              rtt: n.connection.rtt,
            }
          : null,
      },

      // Renamed from `environment` to `browserContext` to avoid colliding with
      // the top-level ErrorLog.environment String enum field.
      browserContext: {
        userAgent: n?.userAgent || "",
        platform: n?.platform || "",
        language: n?.language || "",
        cookieEnabled: n?.cookieEnabled ?? null,
        onLine: n?.onLine ?? null,
        viewport: w ? { width: w.innerWidth, height: w.innerHeight } : null,
        screen: s
          ? { width: s.width, height: s.height, colorDepth: s.colorDepth }
          : null,
      },

      capabilities: {
        serviceWorker: !!(n && "serviceWorker" in n),
        pushManager: !!(w && "PushManager" in w),
        notifications: !!(w && "Notification" in w),
        geolocation: !!(n && "geolocation" in n),
        webgl: !!(d && d.createElement("canvas").getContext("webgl")),
      },

      recentActivity: getRecentUserActivity(),
    },
  };
};

// ── Environment normalisation ─────────────────────────────────────────────────
// ErrorLog.environment enum only accepts 'development' | 'production'.
// Staging and any other environments must map to one of those two values.
const normaliseEnvironment = (mode?: string): "development" | "production" =>
  mode === "development" ? "development" : "production";

// ── Feedback payload builder ──────────────────────────────────────────────────
// Builds the FeedbackReport payload for auto-submitted global errors.
// Schema constraints enforced here (never rely on Mongoose to catch them):
//   type      enum: 'user-feedback' | 'error-report' | 'broken-link' | 'performance-issue'
//   category  enum: 'bug' | 'feature' | 'improvement' | 'other'
//   userInput.title          maxlength: 200
//   userInput.description    maxlength: 1000
//   userInput.actualBehavior maxlength: 1000

/** Truncate a string to `max` chars, appending an ellipsis if clipped. */
const trunc = (str: string, max: number): string => {
  if (!str || str.length <= max) return str || "";
  return str.slice(0, max - 1) + "\u2026"; // … (1 char)
};

const buildGlobalFeedbackPayload = (errorData: any): any => {
  const rawTitle = `Global Error: ${errorData.message || "Unknown error"}`;
  const rawStack = errorData.stack || "No stack trace available";

  // Keep description informative but within the 1000-char schema limit.
  // Stack trace is trimmed first since it is the most likely overflow source.
  const stackSnippet = trunc(rawStack, 600);

  const description = trunc(
    `**Automatic Global Error Report**\n\n` +
      `**Error Type:** ${errorData.type}\n` +
      `**Message:** ${trunc(errorData.message, 200)}\n` +
      `**Location:** ${errorData.url}\n` +
      `**Time:** ${new Date(errorData.timestamp).toLocaleString()}\n\n` +
      `**Technical Details:**\n` +
      `- File: ${errorData.filename || "Unknown"}\n` +
      `- Line: ${errorData.lineno || "Unknown"}\n` +
      `- Column: ${errorData.colno || "Unknown"}\n\n` +
      `**Stack Trace:**\n\`\`\`\n${stackSnippet}\n\`\`\``,
    1000,
  );

  const actualBehavior = trunc(
    `Uncaught ${errorData.name || "Error"}: ${errorData.message || "Unknown error"} ` +
      `at ${errorData.filename || "unknown"}:${errorData.lineno || "?"}:${errorData.colno || "?"}`,
    1000,
  );

  return {
    // ── Enum-safe values ──────────────────────────────────────────────────────
    type: "error-report", // was: "automatic_global_error" (invalid enum)
    category: "bug", // was: "runtime_error" (invalid enum)
    severity: errorData.type === "uncaught" ? "critical" : "high",

    // ── User-input fields (schema maxlengths respected) ───────────────────────
    userInput: {
      title: trunc(rawTitle, 200),
      description,
      actualBehavior,
    },

    // ── System context (matches FeedbackReport schema shape) ──────────────────
    systemContext: {
      source: "error-boundary",
      page: {
        url:
          errorData.url ||
          (typeof window !== "undefined" ? window.location.href : ""),
        path:
          errorData.path ||
          (typeof window !== "undefined" ? window.location.pathname : "/"),
        timestamp: new Date(errorData.timestamp || Date.now()),
      },
      browser: {
        userAgent:
          errorData.meta?.browserContext?.userAgent ||
          (typeof navigator !== "undefined" ? navigator.userAgent : "unknown"),
        language: errorData.meta?.browserContext?.language || "",
      },
      application: {
        name: errorData.appType || "unknown",
        environment: errorData.environment || "development",
      },
    },

    // ── Cross-reference (links FeedbackReport → ErrorLog in the admin UI) ─────
    linkedErrorId: errorData.errorId || null,
  };
};

// ── Global window error handlers ──────────────────────────────────────────────

// Layer 2 of the three-layer monitoring stack:
//   Layer 1 — React ErrorBoundary     (render errors inside React tree)
//   Layer 2 — window error handlers   (this file — unhandled promises, uncaught)
//   Layer 3 — installFetchInterceptor (5xx and network-fail responses)
export const setupGlobalErrorHandling = () => {
  if (typeof window === "undefined") return; // SSR guard

  // Idempotency guard — prevents duplicate listeners on HMR / double-mount
  if (window.__errorHandlersInstalled) return;
  window.__errorHandlersInstalled = true;

  const appType = import.meta.env?.VITE_APP_TYPE || "unknown";
  const env = normaliseEnvironment(import.meta.env?.MODE);

  // ── Activity breadcrumb tracker ───────────────────────────────────────────
  const trackActivity = (activity: string) => {
    try {
      const activities = JSON.parse(
        sessionStorage.getItem("userActivities") || "[]",
      );
      // Trim to prevent unbounded sessionStorage growth (10 entries max, 100-char cap each)
      const entry = `${new Date().toLocaleTimeString()}: ${String(activity).substring(0, 100)}`;
      activities.push(entry);
      sessionStorage.setItem(
        "userActivities",
        JSON.stringify(activities.slice(-10)),
      );
    } catch (_) {
      /* sessionStorage unavailable */
    }
  };

  trackActivity(`Navigated to ${window.location.pathname}`);

  document.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const el =
      target.closest("button") ||
      target.closest("a") ||
      (target.tagName === "BUTTON" || target.tagName === "A" ? target : null);
    if (!el) return;
    trackActivity(
      `Clicked: ${(el.textContent?.trim() || el.getAttribute("aria-label") || "element").substring(0, 50)}`,
    );
  });

  // Helper — build auth headers so global errors also get user attribution
  const makeHeaders = (): HeadersInit => {
    const token = getAuthToken(appType);
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  // ── Unhandled promise rejections ──────────────────────────────────────────
  window.addEventListener("unhandledrejection", (event) => {
    const base = {
      type: "unhandledrejection",
      // Generate a short unique ID so admin can cross-reference FeedbackReport↔↔ErrorLog
      errorId: `ERR-${Date.now().toString(36).toUpperCase().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      message:
        event.reason?.message ||
        String(event.reason) ||
        "Unhandled promise rejection",
      name: event.reason?.name || "UnhandledRejection",
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      path: window.location.pathname,
      appType,
      environment: env,
      severity: "high",
      category: "unhandled-rejection",
    };
    const enhanced = collectAdvancedErrorContext(base);
    const headers = makeHeaders();

    // Errors from unhandled rejections are logged to ErrorLog only.
    // FeedbackReport is reserved for real user-submitted feedback.
    fetch(INGEST_ERRORS, {
      method: "POST",
      headers,
      body: JSON.stringify(enhanced),
    }).catch(() => {
      /* swallow — don't loop on monitor failure */
    });
  });

  // ── Uncaught synchronous errors ───────────────────────────────────────────
  window.addEventListener("error", (event: ErrorEvent) => {
    // Resource load errors (img, script) fire window.error with a null event.message
    // and a non-null event.target. Filter them — they're not JS exceptions.
    if (event.target && event.target !== window) return;

    const base = {
      type: "uncaught",
      // Generate a short unique ID so admin can cross-reference FeedbackReport↔↔ErrorLog
      errorId: `ERR-${Date.now().toString(36).toUpperCase().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      message: event.message || "Unknown error",
      name: event.error?.name || "Error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      path: window.location.pathname,
      appType,
      environment: env,
      severity: "critical",
      category: "uncaught",
    };
    const enhanced = collectAdvancedErrorContext(base);
    const headers = makeHeaders();

    // Uncaught synchronous errors are logged to ErrorLog only.
    // FeedbackReport is reserved for real user-submitted feedback.
    fetch(INGEST_ERRORS, {
      method: "POST",
      headers,
      body: JSON.stringify(enhanced),
    }).catch(() => {
      /* swallow */
    });
  });
};

// ── Fetch interceptor ─────────────────────────────────────────────────────────
// Layer 3 — reports 5xx and true network failures without per-call instrumentation.
// Uses _originalFetch to bypass the interceptor itself (no reporting loops).
export const installFetchInterceptor = () => {
  if (typeof window === "undefined" || window.__fetchInterceptorInstalled)
    return;
  window.__fetchInterceptorInstalled = true;

  const _originalFetch = window.fetch;
  const appType = import.meta.env?.VITE_APP_TYPE || "unknown";
  const env = normaliseEnvironment(import.meta.env?.MODE);

  window.fetch = async function interceptedFetch(...args: any[]) {
    const url = typeof args[0] === "string" ? args[0] : (args[0]?.url ?? "");
    // Monitoring + health endpoints excluded to prevent feedback loops.
    // /health failures are owned exclusively by setupHealthCheck (which applies
    // grace periods and consecutive-failure thresholds before logging).
    const isMonitoringCall =
      /\/api\/v1\/(errors|feedback)\//.test(url) ||
      /\/health(\?|$)/.test(url);

    let response;
    try {
      response = await _originalFetch(args[0], args[1]);
    } catch (err: unknown) {
      const networkError = err as Error;
      // True network failure (DNS, CORS, offline) — report if not monitoring call
      if (!isMonitoringCall) {
        _originalFetch(INGEST_ERRORS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "network-error",
            message: `Network error on ${url}: ${networkError.message}`,
            name: networkError.name || "NetworkError",
            stack: networkError.stack,
            timestamp: new Date().toISOString(),
            url: typeof window !== "undefined" ? window.location.href : "",
            path: typeof window !== "undefined" ? window.location.pathname : "",
            appType,
            environment: env,
            severity: "high",
            category: "network",
            meta: { endpoint: url },
          }),
        }).catch(() => {
          /* swallow */
        });
      }
      throw networkError; // Re-throw so caller still gets the error
    }

    if (!isMonitoringCall && response.status >= 500) {
      _originalFetch(INGEST_ERRORS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "network-5xx",
          message: `HTTP ${response.status} on ${response.url || url}`,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          path: window.location.pathname,
          appType,
          environment: env,
          severity: response.status >= 503 ? "critical" : "high",
          category: "network",
          meta: { status: response.status, endpoint: response.url || url },
        }),
      }).catch(() => {
        /* swallow */
      });
    }

    return response;
  };
};

// ── Offline report flush ──────────────────────────────────────────────────────
// Registers listeners so pending error reports are retried when connectivity
// or page visibility is restored. Must be called once from initializeMonitoring.
export const setupOfflineFlush = () => {
  if (typeof window === "undefined") return;
  if (window.__offlineFlushInstalled) return;
  window.__offlineFlushInstalled = true;

  const appType = import.meta.env?.VITE_APP_TYPE;

  // Retry when network comes back
  window.addEventListener("online", () => flushPendingErrorReports(appType));

  // Retry when tab is re-focused (covers backgrounded mobile tabs)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      flushPendingErrorReports(appType);
    }
  });

  // Attempt once immediately in case reports were stored in a previous session
  flushPendingErrorReports(appType);
};

// ── Performance monitoring ────────────────────────────────────────────────────
const sendToAnalytics = (metric: any) => {
  fetch(`${getApiBaseUrl()}/analytics/web-vitals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metric: {
        ...metric,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "",
        appType: import.meta.env?.VITE_APP_TYPE || "unknown",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      },
    }),
  }).catch((_) => {
    /* analytics must never throw */
  });
};

export const setupPerformanceMonitoring = () => {
  if (!isProd && !isStaging) return;
  if (typeof window === "undefined") return;

  import("web-vitals")
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
        console.warn(
          "[ErrorMonitoring] web-vitals package not found — Core Web Vitals reporting disabled. Install with: npm install web-vitals",
        );
      }
    });

  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "longtask") {
            sendToAnalytics({
              name: "longtask",
              value: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch (_) {
      /* entryType 'longtask' not supported in this browser */
    }
  }
};

// ── Health check ──────────────────────────────────────────────────────────────
// Pings /health every 30s in prod/staging. When /health returns non-200 OR
// the network rejects the request, reports a critical error to INGEST_ERRORS
// so the admin dashboard registers the outage even before any user hits a 5xx.
// Returns a cleanup fn so tests can cancel the interval.
export const setupHealthCheck = () => {
  if (typeof window === "undefined") return () => {};
  if (window.__healthCheckInstalled) return () => {};
  window.__healthCheckInstalled = true;

  const appType = import.meta.env?.VITE_APP_TYPE || "unknown";
  const env =
    (import.meta.env?.MODE || "development") === "development"
      ? "development"
      : "production";

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
    statusCode: number | null = null,
  ) => {
    // Still within startup grace period — silently skip.
    if (Date.now() < startupDeadline) return;

    consecutiveFailures++;
    if (consecutiveFailures < FAILURE_THRESHOLD) return;

    fetch(INGEST_ERRORS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "health-check-failure",
        message: `Backend health check failed: ${reason}`,
        severity: "critical",
        category: "infrastructure",
        appType,
        environment: env,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        path: window.location.pathname,
        meta: { statusCode, reason, consecutiveFailures },
      }),
    }).catch(() => {
      /* still failing — don't loop */
    });
  };

  const intervalId = setInterval(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/health`, {
        cache: "no-store",
      });
      if (res.ok) {
        // Reset counter on recovery so a subsequent failure restarts the threshold
        consecutiveFailures = 0;
      } else {
        reportHealthFailure(`HTTP ${res.status}`, res.status);
      }
    } catch (err: unknown) {
      const error = err as Error;
      reportHealthFailure(error.message || "Network error");
    }
  }, 30_000);

  return () => clearInterval(intervalId);
};

// ── initializeMonitoring ──────────────────────────────────────────────────────
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

// ── createMonitoredQueryClient ────────────────────────────────────────────────
// Drop-in factory for TanStack Query clients that routes data-layer errors to
// INGEST_ERRORS. TanStack Query catches all query/mutation errors internally —
// they do NOT propagate to the React ErrorBoundary unless the component
// explicitly re-throws. This QueryCache/MutationCache onError hook gives us
// visibility into data-layer failures without any per-query instrumentation.
//
// Dependency-injection pattern: `reactQuery` is the @tanstack/react-query
// module reference. Keeps this monitoring module decoupled from React Query so
// apps that don't use it don't pull in the dependency.
//
// Usage — in App.jsx (replaces `new QueryClient({...})`):
//   import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
//   import { createMonitoredQueryClient } from "@shared/features/monitoring/ErrorMonitoring";
//
//   const queryClient = createMonitoredQueryClient(
//     { QueryClient, QueryCache, MutationCache },
//     { appType: "church", defaultOptions: { queries: { staleTime: 5 * 60_000 } } }
//   );
export const createMonitoredQueryClient = (
  reactQuery: any,
  options: Record<string, any> = {},
) => {
  const { QueryClient, QueryCache, MutationCache } = reactQuery;

  const appType =
    options.appType || import.meta.env?.VITE_APP_TYPE || "unknown";
  const env =
    (import.meta?.env?.MODE || "development") === "development"
      ? "development"
      : "production";

  const reportQueryError = (error: any, context: any) => {
    const token = getAuthToken(appType);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(INGEST_ERRORS, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: error?.message || "Unknown query error",
        stack: error?.stack || "",
        severity: "high",
        category: "data-layer",
        appType,
        environment: env,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "",
        path: typeof window !== "undefined" ? window.location.pathname : "",
        meta: {
          queryKey: context?.queryKey || null,
          mutationKey: context?.mutationKey || null,
          errorName: error?.name || "Error",
        },
      }),
    }).catch(() => {
      /* swallow — don't loop if ingest is down */
    });
  };

  // Strip our custom option before passing the rest to QueryClient
  const { appType: _appType, ...userOptions } = options;

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error: any, query: any) =>
        reportQueryError(error, { queryKey: query.queryKey }),
    }),
    mutationCache: new MutationCache({
      onError: (error: any, _vars: any, _ctx: any, mutation: any) =>
        reportQueryError(error, { mutationKey: mutation.options.mutationKey }),
    }),
    ...userOptions,
  });
};
