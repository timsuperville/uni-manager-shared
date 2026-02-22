// Production Error Monitoring Configuration
// This configures error tracking and performance monitoring for production

import React from "react";
import PropTypes from "prop-types";

// Environment-specific configuration
const isProd = (import.meta.env?.MODE || "development") === "production";
const isStaging = (import.meta.env?.MODE || "development") === "staging";
const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000";

// Error Boundary Component for React
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to monitoring service in all environments
    this.logError(error, errorInfo);
  }

  logError(error, errorInfo) {
    // Collect comprehensive error context for debugging
    const errorReport = {
      // Error details
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      name: error.name,

      // Environment context
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" && navigator.userAgent,
      url: typeof window !== "undefined" && window.location.href,
      pathname: typeof window !== "undefined" && window.location.pathname,
      search: typeof window !== "undefined" && window.location.search,
      hash: typeof window !== "undefined" && window.location.hash,
      appType: import.meta.env.VITE_APP_TYPE || "unknown",
      nodeEnv: import.meta.env?.MODE || "development",

      // Browser context
      browserInfo: {
        language: typeof navigator !== "undefined" && navigator.language,
        languages: typeof navigator !== "undefined" && navigator.languages,
        platform: typeof navigator !== "undefined" && navigator.platform,
        cookieEnabled:
          typeof navigator !== "undefined" && navigator.cookieEnabled,
        onLine: typeof navigator !== "undefined" && navigator.onLine,
        hardwareConcurrency:
          typeof navigator !== "undefined" && navigator.hardwareConcurrency,
        maxTouchPoints:
          typeof navigator !== "undefined" && navigator.maxTouchPoints,
      },

      // Screen and viewport info
      screenInfo: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
      },

      viewportInfo: {
        innerWidth: typeof window !== "undefined" && window.innerWidth,
        innerHeight: typeof window !== "undefined" && window.innerHeight,
        outerWidth: typeof window !== "undefined" && window.outerWidth,
        outerHeight: typeof window !== "undefined" && window.outerHeight,
        devicePixelRatio:
          typeof window !== "undefined" && window.devicePixelRatio,
      },

      // Performance context
      performanceInfo: this.getPerformanceInfo(),

      // Local storage info (non-sensitive)
      storageInfo: this.getStorageInfo(),

      // React component context
      reactContext: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
        props: this.props ? Object.keys(this.props) : [],
        state: this.state ? Object.keys(this.state) : [],
      },

      // User session context (if available)
      userContext: this.getUserContext(),

      // Promote identity fields to top level for ErrorLog schema compatibility
      userId: this.getUserContext().userId || undefined,
      userEmail: this.getUserContext().userEmail || undefined,

      // Error categorization
      errorCategory: this.categorizeError(error),
      severity: this.calculateSeverity(error, errorInfo),

      // Auto-generated feedback report
      autoFeedback: {
        reportType: "automatic_error_report",
        priority: "high",
        category: "technical_error",
        reproductionSteps: this.generateReproductionSteps(),
        expectedBehavior: "Application should function without errors",
        actualBehavior: `Error occurred: ${error.message}`,
        browserCompatibility: this.checkBrowserCompatibility(),
        additionalContext: this.gatherAdditionalContext(),
      },
    };

    // Send to both error logging and feedback endpoints
    Promise.all([
      this.sendToErrorLogging(errorReport),
      this.sendToFeedbackSystem(errorReport),
    ]).catch((err) => {
      // console.error('Failed to send error reports:', err);
      // Fallback: store locally for later retry
      this.storeErrorLocally(errorReport);
    });
  }

  getPerformanceInfo() {
    try {
      const navigation = performance.getEntriesByType("navigation")[0];
      return {
        loadTime: navigation
          ? navigation.loadEventEnd - navigation.loadEventStart
          : null,
        domContentLoaded: navigation
          ? navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart
          : null,
        memoryUsage: performance.memory
          ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          }
          : null,
        connectionType:
          typeof navigator !== "undefined" && navigator.connection
            ? typeof navigator !== "undefined" &&
            navigator.connection.effectiveType
            : null,
        timing: performance.timing
          ? {
            pageLoadTime:
              performance.timing.loadEventEnd -
              performance.timing.navigationStart,
            domReadyTime:
              performance.timing.domContentLoadedEventEnd -
              performance.timing.navigationStart,
            connectTime:
              performance.timing.connectEnd - performance.timing.connectStart,
          }
          : null,
      };
    } catch (_e) {
      return { error: "Unable to collect performance info" };
    }
  }

  getStorageInfo() {
    try {
      const localStorageSize = new Blob(Object.values(localStorage)).size;
      const sessionStorageSize = new Blob(Object.values(sessionStorage)).size;

      return {
        localStorageKeys: Object.keys(localStorage).length,
        sessionStorageKeys: Object.keys(sessionStorage).length,
        localStorageSize: Math.round(localStorageSize / 1024) + " KB",
        sessionStorageSize: Math.round(sessionStorageSize / 1024) + " KB",
        cookiesEnabled:
          typeof navigator !== "undefined" && navigator.cookieEnabled,
        indexedDBSupported: "indexedDB" in window,
      };
    } catch (_e) {
      return { error: "Unable to collect storage info" };
    }
  }

  getUserContext() {
    try {
      // Probe all known storage patterns across apps in priority order
      let userInfo = {};

      // Pattern 1: shared hooks/useAuth.js stores { id, email, role, ... } under "user"
      const rawUser = typeof localStorage !== "undefined" && localStorage.getItem("user");
      if (rawUser) {
        try { userInfo = JSON.parse(rawUser); } catch (_) { }
      }

      // Pattern 2: CrossAppService stores under "uni_manager_auth"
      if (!userInfo.id) {
        const crossApp = typeof localStorage !== "undefined" && localStorage.getItem("uni_manager_auth");
        if (crossApp) {
          try {
            const parsed = JSON.parse(crossApp);
            userInfo = parsed.user || parsed;
          } catch (_) { }
        }
      }

      // Pattern 3: Decode JWT payload from any known token key
      // (admin_auth_token, auth_token, authToken, accessToken)
      if (!userInfo.id) {
        const tokenKeys = ["admin_auth_token", "auth_token", "authToken", "accessToken"];
        for (const key of tokenKeys) {
          const token = typeof localStorage !== "undefined" && localStorage.getItem(key);
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              userInfo = {
                id: payload.id || payload.sub || payload._id,
                email: payload.email,
                role: payload.role,
              };
              if (userInfo.id) break;
            } catch (_) { }
          }
        }
      }

      return {
        isAuthenticated: !!(userInfo.id || userInfo._id),
        userId: userInfo.id || userInfo._id || null,
        userEmail: userInfo.email || userInfo.userEmail || null,
        userRole: userInfo.role,
        lastActiveTime:
          typeof localStorage !== "undefined" &&
          localStorage.getItem("lastActiveTime"),
        sessionDuration: this.calculateSessionDuration(),
        featureFlags: this.getActiveFeatureFlags(),
      };
    } catch (_e) {
      return { error: "Unable to collect user context" };
    }
  }

  calculateSessionDuration() {
    const sessionStart = sessionStorage.getItem("sessionStart");
    if (sessionStart) {
      return Date.now() - parseInt(sessionStart);
    }
    return null;
  }

  getActiveFeatureFlags() {
    try {
      return JSON.parse(
        (typeof localStorage !== "undefined" &&
          localStorage.getItem("featureFlags")) ||
        "{}",
      );
    } catch (_e) {
      return {};
    }
  }

  categorizeError(error) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    if (message.includes("network") || message.includes("fetch")) {
      return "network_error";
    } else if (
      message.includes("permission") ||
      message.includes("unauthorized")
    ) {
      return "permission_error";
    } else if (
      message.includes("syntax") ||
      message.includes("unexpected token")
    ) {
      return "syntax_error";
    } else if (stack.includes("react") || stack.includes("component")) {
      return "react_component_error";
    } else if (message.includes("memory") || message.includes("heap")) {
      return "memory_error";
    } else if (message.includes("timeout")) {
      return "timeout_error";
    } else {
      return "unknown_error";
    }
  }

  calculateSeverity(error, errorInfo) {
    let severity = "medium";

    // High severity conditions
    if (
      error.message.includes("SecurityError") ||
      error.message.includes("Permission denied") ||
      errorInfo.componentStack.includes("App") ||
      errorInfo.componentStack.includes("Router")
    ) {
      severity = "critical";
    }
    // Low severity conditions
    else if (
      error.message.includes("Warning") ||
      error.message.includes("deprecated")
    ) {
      severity = "low";
    }

    return severity;
  }

  generateReproductionSteps() {
    const steps = [
      `1. Navigate to ${typeof window !== "undefined" && window.location.pathname}`,
      `2. User agent: ${typeof navigator !== "undefined" && navigator.userAgent}`,
      `3. Screen resolution: ${screen.width}x${screen.height}`,
    ];

    // Add recent user actions if available
    const recentActions = sessionStorage.getItem("recentActions");
    if (recentActions) {
      try {
        const actions = JSON.parse(recentActions);
        steps.push(
          ...actions
            .slice(-3)
            .map((action, index) => `${steps.length + index + 1}. ${action}`),
        );
      } catch (_e) {
        // Ignore if actions can't be parsed
      }
    }

    steps.push(`${steps.length + 1}. Error occurred automatically`);
    return steps.join("\n");
  }

  checkBrowserCompatibility() {
    const compatibility = {
      es6Support: "Promise" in window,
      fetchSupport: "fetch" in window,
      asyncAwaitSupport: true, // Assume true if code is running
      webglSupport:
        !!typeof document !== "undefined" &&
        document.createElement("canvas").getContext("webgl"),
      serviceWorkerSupport: "serviceWorker" in navigator,
      webAssemblySupport: "WebAssembly" in window,
      intersectionObserverSupport: "IntersectionObserver" in window,
    };

    const unsupportedFeatures = Object.keys(compatibility).filter(
      (key) => !compatibility[key],
    );

    return {
      ...compatibility,
      unsupportedFeatures,
      isModernBrowser: unsupportedFeatures.length === 0,
    };
  }

  gatherAdditionalContext() {
    return {
      referrer: typeof document !== "undefined" && document.referrer,
      documentReadyState:
        typeof document !== "undefined" && document.readyState,
      visibilityState:
        typeof document !== "undefined" && document.visibilityState,
      connectionType:
        (typeof navigator !== "undefined" &&
          navigator.connection?.effectiveType) ||
        "unknown",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: typeof navigator !== "undefined" && navigator.language,
      standalone:
        (typeof window !== "undefined" &&
          typeof navigator !== "undefined" &&
          navigator.standalone) ||
        false,
      touchSupport: "ontouchstart" in window,
      orientation: screen.orientation?.type || "unknown",
    };
  }

  async sendToErrorLogging(errorReport) {
    // Use relative URL so Vite proxy routes it correctly in dev;
    // in production the reverse-proxy handles /api/v1 routing.
    return fetch(`/api/v1/errors/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorReport),
    });
  }

  async sendToFeedbackSystem(errorReport) {
    const feedbackPayload = {
      type: "error-report",
      priority: errorReport.severity === "critical" ? "urgent" : "high",
      category: "bug",
      title: `Automatic Error Report: ${errorReport.message}`,
      description: this.formatErrorForFeedback(errorReport),
      metadata: {
        errorId: this.generateErrorId(errorReport),
        autoGenerated: true,
        timestamp: errorReport.timestamp,
        userAgent: errorReport.userAgent,
        url: errorReport.url,
        appType: errorReport.appType,
        errorCategory: errorReport.errorCategory,
        severity: errorReport.severity,
      },
      attachments: {
        fullErrorReport: errorReport,
        performanceMetrics: errorReport.performanceInfo,
        userContext: errorReport.userContext,
      },
    };

    return fetch(`/api/v1/feedback/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feedbackPayload),
    });
  }

  formatErrorForFeedback(errorReport) {
    return `
**Automatic Error Report**

**Error Message:** ${errorReport.message}

**Location:** ${errorReport.url}

**Time:** ${new Date(errorReport.timestamp).toLocaleString()}

**Severity:** ${errorReport.severity}

**Category:** ${errorReport.errorCategory}

**Reproduction Steps:**
${errorReport.autoFeedback.reproductionSteps}

**Browser Information:**
- User Agent: ${errorReport.userAgent}
- Platform: ${errorReport.browserInfo.platform}
- Language: ${errorReport.browserInfo.language}
- Online: ${errorReport.browserInfo.onLine}

**Screen Information:**
- Resolution: ${errorReport.screenInfo.width}x${errorReport.screenInfo.height}
- Viewport: ${errorReport.viewportInfo.innerWidth}x${errorReport.viewportInfo.innerHeight}
- Device Pixel Ratio: ${errorReport.viewportInfo.devicePixelRatio}

**Performance Context:**
${errorReport.performanceInfo.memoryUsage
        ? `- Memory Usage: ${Math.round(errorReport.performanceInfo.memoryUsage.usedJSHeapSize / 1024 / 1024)}MB`
        : ""
      }
${errorReport.performanceInfo.connectionType
        ? `- Connection: ${errorReport.performanceInfo.connectionType}`
        : ""
      }

**Technical Details:**
\`\`\`
${errorReport.stack}
\`\`\`

**Component Stack:**
\`\`\`
${errorReport.componentStack}
\`\`\`

*This report was automatically generated by the error monitoring system.*
    `.trim();
  }

  generateErrorId(errorReport) {
    const hash = btoa(
      `${errorReport.message}-${errorReport.url}-${errorReport.timestamp}`,
    )
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 12);
    return `ERR-${hash}-${Date.now()}`;
  }

  storeErrorLocally(errorReport) {
    try {
      const stored = JSON.parse(
        (typeof localStorage !== "undefined" &&
          localStorage.getItem("pendingErrorReports")) ||
        "[]",
      );
      stored.push({
        ...errorReport,
        storedAt: Date.now(),
      });

      // Keep only last 10 errors to prevent storage bloat
      const recent = stored.slice(-10);
      typeof localStorage !== "undefined" &&
        localStorage.setItem("pendingErrorReports", JSON.stringify(recent));
    } catch (_e) {
      // console.error('Failed to store error locally:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
                <p className="text-sm text-gray-500">
                  We're sorry, but something unexpected happened. An error
                  report has been automatically sent to help us fix this issue.
                </p>
              </div>
            </div>

            {/* Error Report Status */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <svg
                  className="h-4 w-4 text-blue-400 mt-0.5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-blue-700 font-medium">
                    Automatic Report Sent
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Error ID:{" "}
                    {this.generateErrorId({
                      message: this.state.error?.message || "Unknown error",
                      url:
                        typeof window !== "undefined" && window.location.href,
                      timestamp: new Date().toISOString(),
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message for Feedback */}
            {this.state.feedbackSubmitted && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-green-700">
                    Additional feedback submitted successfully!
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() =>
                  typeof window !== "undefined" && window.location.reload()
                }
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Reload Page
              </button>

              <button
                onClick={() => this.openFeedbackModal()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Provide Additional Feedback
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={() =>
                    typeof window !== "undefined" && window.history.back()
                  }
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                >
                  Go Back
                </button>

                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/";
                    }
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                >
                  Home
                </button>
              </div>
            </div>

            {/* Development Details */}
            {!isProd && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-3 rounded border">
                  <div className="space-y-2">
                    <div>
                      <strong>Error:</strong>{" "}
                      {this.state.error && this.state.error.toString()}
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                    <div>
                      <strong>Full Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs max-h-32 overflow-y-auto">
                        {this.state.error?.stack}
                      </pre>
                    </div>
                  </div>
                </div>
              </details>
            )}

            {/* Feedback Modal */}
            {this.state.showFeedbackModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => this.setState({ showFeedbackModal: false })}
              >
                <div
                  className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-medium mb-4">
                    Additional Feedback
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Help us understand what you were trying to do when this
                    error occurred.
                  </p>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                    rows={4}
                    placeholder="What were you trying to do? Any additional context that might help us fix this issue..."
                    value={this.state.userFeedback || ""}
                    onChange={(e) =>
                      this.setState({ userFeedback: e.target.value })
                    }
                  />
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() =>
                        this.setState({ showFeedbackModal: false })
                      }
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => this.submitUserFeedback()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  openFeedbackModal() {
    this.setState({ showFeedbackModal: true, userFeedback: "" });
  }

  submitUserFeedback() {
    const feedback = {
      type: "user_error_feedback",
      errorId: this.generateErrorId({
        message: this.state.error?.message || "Unknown error",
        url: typeof window !== "undefined" && window.location.href,
        timestamp: new Date().toISOString(),
      }),
      userComment: this.state.userFeedback,
      timestamp: new Date().toISOString(),
      error: {
        message: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
      },
    };

    fetch("/feedback/error-follow-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feedback),
    })
      .then(() => {
        this.setState({
          showFeedbackModal: false,
          feedbackSubmitted: true,
        });

        // Show success message
        setTimeout(() => {
          this.setState({ feedbackSubmitted: false });
        }, 3000);
      })
      .catch((err) => {
        // console.error('Failed to submit user feedback:', err);
      });
  }
}

// Advanced error collection utility
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

  return fetch("/feedback/submit", {
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
      ]).catch(() => { /* swallow — don't loop on monitor failure */ });
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
      ]).catch(() => { /* swallow */ });
    });
};

/**
 * Layer 3 — Fetch interceptor: automatically reports 5xx responses
 * to /api/v1/errors/log without any per-call instrumentation.
 * Call once from main.jsx alongside setupGlobalErrorHandling().
 */
export const installFetchInterceptor = () => {
  if (typeof window === "undefined" || window.__fetchInterceptorInstalled) return;
  window.__fetchInterceptorInstalled = true;

  const _originalFetch = window.fetch;
  window.fetch = async function interceptedFetch(...args) {
    const response = await _originalFetch.apply(this, args);
    // Skip reporting calls to our own ingest endpoints to prevent loops
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url ?? "";
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
      _originalFetch("/api/v1/errors/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorPayload),
      }).catch(() => { /* swallow */ });
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

  // Use the backend URL for analytics
  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  fetch(`${backendUrl}/analytics/web-vitals`, {
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

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
};
