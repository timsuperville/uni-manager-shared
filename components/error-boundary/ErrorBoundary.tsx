import React from "react";
import {
  buildErrorId,
  collectTelemetry,
  reportError,
} from "./ErrorBoundaryTelemetry";
import {
  InlineFallback,
  FullScreenFallback,
  FallbackProps,
} from "./ErrorBoundaryFallback";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** "full-screen" (default) for app roots; "inline" for feature sections */
  variant?: "full-screen" | "inline";
  /** Custom render prop — receives { error, errorInfo, errorId, reset } */
  fallback?: (ctx: {
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    errorId: string | null;
    reset: () => void;
  }) => React.ReactNode;
  /** Identifies the app for telemetry tagging. Falls back to VITE_APP_TYPE. */
  appType?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  title?: string;
  message?: string;
  /** Defaults true for full-screen, false for inline. */
  showHomeButton?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  resonanceId?: string | null;
}

// ── Unified ErrorBoundary ─────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      resonanceId: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const resonanceId = (error as any)?.resonanceId || null;
    return { hasError: true, error, resonanceId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const appType =
      this.props.appType ||
      (import.meta as any).env?.VITE_APP_TYPE ||
      "unknown";
    const errorId = buildErrorId(
      error?.message,
      window?.location?.pathname,
      appType,
    );
    this.setState({ error, errorInfo, errorId });

    if ((import.meta as any).env?.DEV) {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", {
        errorId,
        error,
        componentStack: errorInfo?.componentStack,
      });
    }

    // Auto-reload for Vite chunk loading errors, preventing infinite loops
    if (
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("dynamically imported module") ||
      error?.message?.includes("Importing a module script failed")
    ) {
      const reloadKey = "vite_chunk_reload";
      const lastReload = sessionStorage.getItem(reloadKey);
      if (!lastReload || Date.now() - parseInt(lastReload, 10) > 5000) {
        sessionStorage.setItem(reloadKey, Date.now().toString());
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((r) => r.unregister());
          });
        }
        window.location.reload();
      }
      return; // Return early, ALWAYS do not report chunk loading noise to telemetry
    }

    const telemetry = collectTelemetry(error, errorInfo, appType);
    reportError({ ...telemetry, errorId }, appType);
    this.props.onError?.(error, errorInfo);
  }

  handleReset(): void {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      resonanceId: null,
    });
    this.props.onReset?.();
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        errorId: this.state.errorId,
        reset: this.handleReset,
      });
    }

    const shared: FallbackProps = {
      title: this.props.title,
      message: this.props.message,
      error: this.state.error,
      errorInfo: this.state.errorInfo,
      errorId: this.state.errorId,
      resonanceId: this.state.resonanceId,
      onReset: this.handleReset,
      showHomeButton:
        this.props.showHomeButton ?? this.props.variant !== "inline",
    };

    return this.props.variant === "inline" ? (
      <InlineFallback {...shared} />
    ) : (
      <FullScreenFallback {...shared} />
    );
  }
}

// ── withErrorBoundary HOC ─────────────────────────────────────────────────────
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps: Omit<ErrorBoundaryProps, "children"> = {},
): React.FC<P> {
  const displayName = Component.displayName || Component.name || "Component";

  function WithBoundary(props: P) {
    return (
      <ErrorBoundary {...boundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  }

  WithBoundary.displayName = `WithErrorBoundary(${displayName})`;
  return WithBoundary;
}

export default ErrorBoundary;
