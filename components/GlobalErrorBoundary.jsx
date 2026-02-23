import React from "react";
import PropTypes from "prop-types";
import { submitFeedbackSilently } from "./FeedbackQuickAction";

/**
 * Global Error Boundary
 * Wraps the entire application to catch unhandled runtime errors
 * providing a graceful fallback UI instead of a whitespace crash.
 * Also auto-reports every crash as an error-report feedback entry.
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const appType = this.props.appType || "unknown";
    if (process.env.NODE_ENV !== "test") {
      console.error(`[${appType}] Critical Error:`, error, errorInfo);
    }
    this.setState({ errorInfo });

    // Auto-report crash as a feedback entry (fire-and-forget, fully silent)
    submitFeedbackSilently({
      title: `[Auto] Crash: ${error?.message || "Unknown error"}`,
      description: [
        `Error: ${error?.toString?.() || error}`,
        "",
        "Component Stack:",
        errorInfo?.componentStack || "(unavailable)",
      ].join("\n"),
      appType,
      severity: "critical",
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                The application encountered a critical error and needs to
                restart.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mb-6 text-left bg-red-50 p-3 rounded overflow-auto max-h-48">
                  <p className="text-xs font-mono text-red-800 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

GlobalErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  appType: PropTypes.string,
};

export default GlobalErrorBoundary;
