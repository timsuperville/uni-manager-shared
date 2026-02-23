import React from "react";
import { submitFeedbackSilently } from "./FeedbackQuickAction";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== "test") {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
    // Auto-report silently — zero user friction
    submitFeedbackSilently({
      title: `[Auto] Component crash: ${error?.message || "Unknown error"}`,
      description: [
        `Error: ${error?.toString?.() || error}`,
        "",
        "Component Stack:",
        errorInfo?.componentStack || "(unavailable)",
      ].join("\n"),
      appType: this.props.appType || "unknown",
      severity: "high",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 text-sm">
            An error occurred while rendering this component. Please try
            refreshing the page.
          </p>
          {process?.env?.NODE_ENV ||
            ("development" === "development" && this.state.error && (
              <details className="mt-3">
                <summary className="text-red-700 cursor-pointer">
                  Error details
                </summary>
                <pre className="text-xs text-red-600 mt-2 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            ))}
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
