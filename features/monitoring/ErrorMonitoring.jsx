// Production Error Monitoring — utility functions only.
// The ErrorBoundary class has been consolidated into @shared/components/ErrorBoundary.jsx.
//
// Exports from this file:
//   ErrorBoundary           (re-export from canonical location)
//   setupGlobalErrorHandling
//   installFetchInterceptor
//   setupPerformanceMonitoring
//   setupHealthCheck
//   initializeMonitoring

// Environment-specific configuration
const isProd = (import.meta.env?.MODE || "development") === "production";
const isStaging = (import.meta.env?.MODE || "development") === "staging";

// ── Ingest endpoints ──────────────────────────────────────────────────────────
// Intentionally RELATIVE — Vite proxy (/api/v1 → localhost:5000) handles dev,
// nginx handles prod. See frontend/vite-proxy.js and shared/api/config/apiConfig.ts.
const INGEST_ERRORS = "/api/v1/errors/log";
const INGEST_FEEDBACK = "/api/v1/feedback/submit";

// ErrorBoundary — canonical unified component. Re-exported here so the
// @shared/monitoring barrel and all initializeMonitoring consumers keep working.
export { ErrorBoundary } from "../../components/ErrorBoundary.jsx";

// ── Recent user activity ──────────────────────────────────────────────────────
// Populated by the click/navigation tracker in setupGlobalErrorHandling.
// Read by collectAdvancedErrorContext to give a "breadcrumb" trail.
const getRecentUserActivity = () => {
  try {
    return JSON.parse(sessionStorage.getItem("userActivities") || "[]").slice(-5);
  } catch (_) {
    return [];
  }
};

// ── Advanced telemetry ────────────────────────────────────────────────────────
// Called by the global window handlers (unhandledrejection, error).
// Also exported so ErrorBoundary.collectTelemetry can merge it in for
// the highest-severity render crashes.
//
// All property accesses are typeof-guarded so this is safe in SSR/jsdom/Workers.
export const collectAdvancedErrorContext = (baseError) => {
  const p = typeof performance !== "undefined" ? performance : null;
  const n = typeof navigator !== "undefined" ? navigator : null;
  const w = typeof window !== "undefined" ? window : null;
  const s = typeof screen !== "undefined" ? screen : null;
  const d = typeof document !== "undefined" ? document : null;

  return {
    ...baseError,

    // Performance metrics
    performanceInfo: {
      memory: p?.memory
        ? {
          usedJSHeapSize: p.memory.usedJSHeapSize,
          totalJSHeapSize: p.memory.totalJSHeapSize,
          jsHeapSizeLimit: p.memory.jsHeapSizeLimit,
        }
        : null,
      // performance.timing is deprecated but still widely supported; may be null
      // on modern Safari/Firefox when navigation timing v2 is used instead.
      timing: p?.timing && p.timing.loadEventEnd > 0
        ? {
          loadTime: p.timing.loadEventEnd - p.timing.navigationStart,
          domReady: p.timing.domContentLoadedEventEnd - p.timing.navigationStart,
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

    // Browser environment snapshot
    environment: {
      userAgent: n?.userAgent || "",
      platform: n?.platform || "",
      language: n?.language || "",
      cookieEnabled: n?.cookieEnabled ?? null,
      onLine: n?.onLine ?? null,
      viewport: w
        ? { width: w.innerWidth, height: w.innerHeight }
        : null,
      screen: s
        ? { width: s.width, height: s.height, colorDepth: s.colorDepth }
        : null,
    },

    // Browser capabilities (feature detection)
    capabilities: {
      serviceWorker: !!(n && "serviceWorker" in n),
      pushManager: !!(w && "PushManager" in w),
      notifications: !!(w && "Notification" in w),
      geolocation: !!(n && "geolocation" in n),
      // canvas.getContext("webgl") returns null if WebGL is unavailable
      webgl: !!(d && d.createElement("canvas").getContext("webgl")),
    },

    // Breadcrumb trail — last 5 click/navigation events
    recentActivity: getRecentUserActivity(),
  };
};

// ── Feedback payload builder ──────────────────────────────────────────────────
// Used by the global window handlers (different schema from ErrorBoundary's
// render-crash feedback, which goes through reportError() in ErrorBoundary.jsx).
const buildGlobalFeedbackPayload = (errorData) => ({
  type: "automatic_global_error",
  priority: errorData.type === "uncaught" ? "urgent" : "high",
  category: "runtime_error",
  title: `Global Error: ${errorData.message}`,
  description: `\
**Automatic Global Error Report**

**Error Type:** ${errorData.type}
**Message:** ${errorData.message}
**Location:** ${errorData.url}
**Time:** ${new Date(errorData.timestamp).toLocaleString()}

**Technical Details:**
- File: ${errorData.filename || "Unknown"}
- Line: ${errorData.lineno || "Unknown"}
- Column: ${errorData.colno || "Unknown"}

**Environment:**
- User Agent: ${errorData.environment?.userAgent}
- Platform: ${errorData.environment?.platform}
- Language: ${errorData.environment?.language}
- Online: ${errorData.environment?.onLine}

**Performance Context:**
${errorData.performanceInfo?.memory
      ? `- Memory: ${Math.round(errorData.performanceInfo.memory.usedJSHeapSize / 1024 / 1024)}MB`
      : ""}
${errorData.performanceInfo?.connection
      ? `- Connection: ${errorData.performanceInfo.connection.effectiveType}`
      : ""}

**Recent Activity:**
${errorData.recentActivity?.map((a, i) => `${i + 1}. ${a}`).join("\n") || "None recorded"}

**Stack Trace:**
\`\`\`
${errorData.stack || "No stack trace available"}
\`\`\`

*This report was automatically generated by the global error handler.*`,
  metadata: {
    errorType: errorData.type,
    autoGenerated: true,
    timestamp: errorData.timestamp,
    url: errorData.url,
    appType: errorData.appType,
    filename: errorData.filename,
    line: errorData.lineno,
    column: errorData.colno,
  },
});

// ── Global window error handlers ──────────────────────────────────────────────
// Layer 2 of the error monitoring stack:
//   Layer 1 — React ErrorBoundary (render errors, caught React tree)
//   Layer 2 — window.unhandledrejection + window.error (this file)
//   Layer 3 — installFetchInterceptor (5xx network responses)
//
// These three layers are complementary. The boundary catches React render errors;
// these handlers catch everything outside the React lifecycle (setTimeout callbacks,
// promise chains in worker threads, third-party script crashes, etc.)
export const setupGlobalErrorHandling = () => {
  if (typeof window === "undefined") return; // SSR guard

  // ── Activity breadcrumb tracker ───────────────────────────────────────────
  const trackActivity = (activity) => {
    try {
      const activities = JSON.parse(sessionStorage.getItem("userActivities") || "[]");
      activities.push(`${new Date().toLocaleTimeString()}: ${activity}`);
      sessionStorage.setItem("userActivities", JSON.stringify(activities.slice(-10)));
    } catch (_) { /* sessionStorage unavailable */ }
  };

  // Record initial page load
  trackActivity(`Navigated to ${window.location.pathname}`);

  // Record meaningful click interactions
  document.addEventListener("click", (event) => {
    const el =
      event.target.closest("button") ||
      event.target.closest("a") ||
      (event.target.tagName === "BUTTON" || event.target.tagName === "A" ? event.target : null);
    if (!el) return;
    const text = el.textContent?.trim().substring(0, 50) || "Unknown element";
    trackActivity(`Clicked: ${text}`);
  });

  // ── Unhandled promise rejections ──────────────────────────────────────────
  window.addEventListener("unhandledrejection", (event) => {
    const base = {
      type: "unhandledrejection",
      message: event.reason?.message || "Unhandled promise rejection",
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      appType: import.meta.env.VITE_APP_TYPE || "unknown",
    };
    const enhanced = collectAdvancedErrorContext(base);

    Promise.all([
      fetch(INGEST_ERRORS, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(enhanced) }),
      fetch(INGEST_FEEDBACK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildGlobalFeedbackPayload(enhanced)) }),
    ]).catch(() => { /* swallow — don't loop on monitor failure */ });
  });

  // ── Uncaught synchronous errors ───────────────────────────────────────────
  window.addEventListener("error", (event) => {
    const base = {
      type: "uncaught",
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      appType: import.meta.env.VITE_APP_TYPE || "unknown",
    };
    const enhanced = collectAdvancedErrorContext(base);

    Promise.all([
      fetch(INGEST_ERRORS, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(enhanced) }),
      fetch(INGEST_FEEDBACK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildGlobalFeedbackPayload(enhanced)) }),
    ]).catch(() => { /* swallow */ });
  });
};

// ── Fetch interceptor ─────────────────────────────────────────────────────────
// Layer 3 — automatically reports 5xx responses to INGEST_ERRORS without any
// per-call instrumentation. Call once from main.jsx with setupGlobalErrorHandling.
export const installFetchInterceptor = () => {
  if (typeof window === "undefined" || window.__fetchInterceptorInstalled) return;
  window.__fetchInterceptorInstalled = true;

  const _originalFetch = window.fetch;
  window.fetch = async function interceptedFetch(...args) {
    const response = await _originalFetch.apply(this, args);
    const url = typeof args[0] === "string" ? args[0] : (args[0]?.url ?? "");

    // Skip reporting to our own monitoring endpoints to prevent feedback loops
    const isMonitoringCall = /\/api\/v1\/(errors|feedback)\//i.test(url);
    if (!isMonitoringCall && response.status >= 500) {
      _originalFetch(INGEST_ERRORS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "network-5xx",
          message: `HTTP ${response.status} on ${response.url || url}`,
          stack: new Error().stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          appType: import.meta.env.VITE_APP_TYPE || "unknown",
          severity: response.status >= 503 ? "critical" : "high",
          networkInfo: { status: response.status, endpoint: response.url || url },
        }),
      }).catch(() => { /* swallow */ });
    }
    return response;
  };
};

// ── Performance monitoring ────────────────────────────────────────────────────
// Web Vitals + Long Task observer — prod/staging only.
const sendToAnalytics = (metric) => {
  fetch("/analytics/web-vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metric: {
        ...metric,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" && window.location.href,
        appType: import.meta.env.VITE_APP_TYPE || "unknown",
        userAgent: typeof navigator !== "undefined" && navigator.userAgent,
      },
    }),
  }).catch((_) => { /* swallow — analytics must never throw */ });
};

export const setupPerformanceMonitoring = () => {
  if (!isProd && !isStaging) return;
  if (typeof window === "undefined") return;

  // Core Web Vitals — dynamic import so tree-shaking removes it in dev
  // Note: check "web-vital" (singular) is the legacy guard from the old code;
  // the correct check is whether the package resolves at runtime.
  import("web-vitals")
    .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    })
    .catch(() => { /* web-vitals not installed — silently skip */ });

  // Long Task observer — reports tasks > 50ms that block the main thread
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "longtask") {
            sendToAnalytics({ name: "longtask", value: entry.duration, timestamp: entry.startTime });
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch (_) { /* PerformanceObserver may not support longtask in all browsers */ }
  }
};

// ── Health check ──────────────────────────────────────────────────────────────
// Periodic ping to /health — surfaces backend restarts in the Admin dashboard.
// Prod/staging only; 30s interval.
export const setupHealthCheck = () => {
  setInterval(async () => {
    try {
      await fetch("/health");
    } catch (_) { /* network unavailable — silently skip */ }
  }, 30_000);
};

// ── initializeMonitoring ──────────────────────────────────────────────────────
// Call once from each app's main.jsx, before ReactDOM.createRoot().
// Global error handlers run in all environments (dev included).
// Performance monitoring and health checks are prod/staging-only.
export const initializeMonitoring = () => {
  setupGlobalErrorHandling();
  installFetchInterceptor();
  if (isProd || isStaging) {
    setupPerformanceMonitoring();
    setupHealthCheck();
  }
};
