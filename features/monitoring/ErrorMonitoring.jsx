// Production Error Monitoring Configuration — utility functions only.
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
const isProd = (import.meta.env?.MODE || 'development') === 'production';
const isStaging = (import.meta.env?.MODE || 'development') === 'staging';

// ── Ingest endpoints ──────────────────────────────────────────────────────────
// Intentionally RELATIVE — Vite proxy (/api/v1 → localhost:5000) handles dev,
// nginx handles prod. VITE_API_URL belongs in ApiClient config, not here.
// See frontend/vite-proxy.js and shared/api/config/apiConfig.ts.
const INGEST_ERRORS = "/api/v1/errors/log";
const INGEST_FEEDBACK = "/api/v1/feedback/submit";

// ErrorBoundary — canonical unified component. Re-exported here so the
// @shared/monitoring shim and all initializeMonitoring consumers keep working.
export { ErrorBoundary } from '../../components/ErrorBoundary.jsx';

// ── Advanced error collection utility (used by global handlers below) ─────────
const collectAdvancedErrorContext = (baseError) => {
  return {
    ...baseError,
    // Enhanced context
    performanceInfo: {
      memory: performance.memory
        ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        }
        : null,
      timing: performance.timing
        ? {
          loadTime:
            performance.timing.loadEventEnd -
            performance.timing.navigationStart,
          domReady:
            performance.timing.domContentLoadedEventEnd -
            performance.timing.navigationStart,
        }
        : null,
      connection:
        typeof navigator !== "undefined" && navigator.connection
          ? {
            effectiveType:
              typeof navigator !== "undefined" &&
              navigator.connection.effectiveType,
            downlink:
              typeof navigator !== "undefined" &&
              navigator.connection.downlink,
            rtt: typeof navigator !== "undefined" && navigator.connection.rtt,
          }
          : null,
    },

    // Environment details
    environment: {
      userAgent: typeof navigator !== "undefined" && navigator.userAgent,
      platform: typeof navigator !== "undefined" && navigator.platform,
      language: typeof navigator !== "undefined" && navigator.language,
      cookieEnabled:
        typeof navigator !== "undefined" && navigator.cookieEnabled,
      onLine: typeof navigator !== "undefined" && navigator.onLine,
      viewport: {
        width: typeof window !== "undefined" && window.innerWidth,
        height: typeof window !== "undefined" && window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
    },

    // Recent user activity
    recentActivity: getRecentUserActivity(),

    // Browser capabilities
    capabilities: {
      serviceWorker: "serviceWorker" in navigator,
      pushManager: "PushManager" in window,
      notifications: "Notification" in window,
      geolocation: "geolocation" in navigator,
      webgl:
        !!typeof document !== "undefined" &&
        document.createElement("canvas").getContext("webgl"),
    },
  };
};

const getRecentUserActivity = () => {
  try {
    const activities = JSON.parse(
      sessionStorage.getItem("userActivities") || "[]",
    );
    return activities.slice(-5); // Last 5 activities
  } catch (_e) {
    return [];
  }
};

const sendToFeedbackSystem = async (errorData) => {
  const feedbackPayload = {
    type: "automatic_global_error",
    priority: errorData.type === "uncaught" ? "urgent" : "high",
    category: "runtime_error",
    title: `Global Error: ${errorData.message}`,
    description: `
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
        ? `- Memory Usage: ${Math.round(errorData.performanceInfo.memory.usedJSHeapSize / 1024 / 1024)}MB`
        : ""
      }
${errorData.performanceInfo?.connection
        ? `- Connection: ${errorData.performanceInfo.connection.effectiveType}`
        : ""
      }

**Recent User Activity:**
${errorData.recentActivity?.map((activity, i) => `${i + 1}. ${activity}`).join("\n") || "No recent activity recorded"}

**Stack Trace:**
\`\`\`
${errorData.stack || "No stack trace available"}
\`\`\`

*This report was automatically generated by the global error handler.*
    `,
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
  };

  return fetch(INGEST_FEEDBACK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(feedbackPayload),
  });
};

// Global error handler for unhandled promises
export const setupGlobalErrorHandling = () => {
  // Track user activities for better error context
  const trackActivity = (activity) => {
    try {
      const activities = JSON.parse(
        sessionStorage.getItem("userActivities") || "[]",
      );
      activities.push(`${new Date().toLocaleTimeString()}: ${activity}`);
      sessionStorage.setItem(
        "userActivities",
        JSON.stringify(activities.slice(-10)),
      );
    } catch (_e) {
      // Ignore if can't track
    }
  };

  // Track page navigation
  trackActivity(
    `Navigated to ${typeof window !== "undefined" && window.location.pathname}`,
  );

  // Track clicks on important elements
  typeof document !== "undefined" &&
    document.addEventListener("click", (event) => {
      if (
        event.target.tagName === "BUTTON" ||
        event.target.tagName === "A" ||
        event.target.closest("button") ||
        event.target.closest("a")
      ) {
        const element =
          event.target.closest("button") ||
          event.target.closest("a") ||
          event.target;
        const text =
          element.textContent?.trim().substring(0, 50) || "Unknown element";
        trackActivity(`Clicked: ${text}`);
      }
    });

  // Handle unhandled promise rejections — fires in all environments
  typeof window !== "undefined" &&
    window.addEventListener("unhandledrejection", (event) => {
      const baseError = {
        type: "unhandledrejection",
        message: event.reason?.message || "Unhandled promise rejection",
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" && window.location.href,
        appType: import.meta.env.VITE_APP_TYPE || "unknown",
      };

      const enhancedError = collectAdvancedErrorContext(baseError);

      Promise.all([
        fetch("/api/v1/errors/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(enhancedError),
        }),
        sendToFeedbackSystem(enhancedError),
      ]).catch(() => {
        /* swallow — don't loop on monitor failure */
      });
    });

  // Handle uncaught errors — fires in all environments
  typeof window !== "undefined" &&
    window.addEventListener("error", (event) => {
      const baseError = {
        type: "uncaught",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" && window.location.href,
        appType: import.meta.env.VITE_APP_TYPE || "unknown",
      };

      const enhancedError = collectAdvancedErrorContext(baseError);

      Promise.all([
        fetch("/api/v1/errors/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(enhancedError),
        }),
        sendToFeedbackSystem(enhancedError),
      ]).catch(() => {
        /* swallow */
      });
    });
};

/**
 * Layer 3 — Fetch interceptor: automatically reports 5xx responses
 * to /api/v1/errors/log without any per-call instrumentation.
 * Call once from main.jsx alongside setupGlobalErrorHandling().
 */
export const installFetchInterceptor = () => {
  if (typeof window === "undefined" || window.__fetchInterceptorInstalled)
    return;
  window.__fetchInterceptorInstalled = true;

  const _originalFetch = window.fetch;
  window.fetch = async function interceptedFetch(...args) {
    const response = await _originalFetch.apply(this, args);
    // Skip reporting calls to our own ingest endpoints to prevent loops
    const url = typeof args[0] === "string" ? args[0] : (args[0]?.url ?? "");
    const isMonitoringCall = /\/api\/v1\/(errors|feedback)\//i.test(url);
    if (!isMonitoringCall && response.status >= 500) {
      const errorPayload = {
        type: "network-5xx",
        message: `HTTP ${response.status} on ${response.url || url}`,
        stack: new Error().stack,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" && window.location.href,
        appType: import.meta.env.VITE_APP_TYPE || "unknown",
        severity: response.status >= 503 ? "critical" : "high",
        networkInfo: { status: response.status, endpoint: response.url || url },
      };
      _originalFetch(INGEST_ERRORS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorPayload),
      }).catch(() => {
        /* swallow */
      });
    }
    return response;
  };
};

// Performance monitoring
export const setupPerformanceMonitoring = () => {
  if (!isProd && !isStaging) return;

  // Monitor Core Web Vitals
  if ("web-vital" in window) {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    });
  }

  // Monitor long tasks
  if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "longtask") {
          sendToAnalytics({
            name: "longtask",
            value: entry.duration,
            timestamp: entry.startTime,
          });
        }
      }
    });

    observer.observe({ entryTypes: ["longtask"] });
  }
};

// Send analytics data
const sendToAnalytics = (metric) => {
  const data = {
    ...metric,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" && window.location.href,
    appType: import.meta.env.VITE_APP_TYPE || "unknown",
    userAgent: typeof navigator !== "undefined" && navigator.userAgent,
  };

  // Relative path — Vite proxy and nginx handle routing (same as INGEST_ERRORS above)
  fetch(`/analytics/web-vitals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ metric: data }),
  }).catch((err) => {
    // console.error('Failed to send analytics:', err);
  });
};

// Health check for frontend
export const setupHealthCheck = () => {
  // Periodic health check to backend
  setInterval(async () => {
    try {
      const response = await fetch("/health");
      if (!response.ok) {
        // console.warn('Backend health check failed');
      }
    } catch (_error) {
      // console.error('Health check error:', error);
    }
  }, 30000); // Check every 30 seconds
};

// Initialize all monitoring — global handlers run in every environment;
// performance monitoring and health checks remain prod/staging-only.
export const initializeMonitoring = () => {
  // Always set up global error capture (unhandledrejection, uncaught, fetch 5xx)
  setupGlobalErrorHandling();
  installFetchInterceptor();
  // Performance monitoring and periodic health checks only in production
  if (isProd || isStaging) {
    setupPerformanceMonitoring();
    setupHealthCheck();
  }
};

