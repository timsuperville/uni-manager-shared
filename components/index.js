// @shared/components — Ecosystem Kernel barrel
// Usage: import { Button, Modal, ... } from "@shared/components"
//        import { Button, Modal, ... } from "@shared/components/ui"  (ui-only)

// ── Layout / infrastructure ───────────────────────────────────────────────────
export { default as LoadingSpinner } from "./LoadingSpinner";
export { default as RoleGuard } from "./RoleGuard";
export { ThemeProvider, useTheme, tokens } from "./ThemeProvider";
export { default as ThemeToggle } from "./ThemeToggle";
export { default as ErrorBoundary } from "./ErrorBoundary";
export { default as GlobalErrorBoundary } from "./GlobalErrorBoundary";
export { ApiProvider, useApi } from "./ApiProvider";

// ── Feedback / Notifications ──────────────────────────────────────────────────
export { default as Toast } from "./Toast";
export { ToastProvider, useToast, useToastNotification } from "./ToastProvider";
export { default as ConfirmDialog } from "./ConfirmDialog";
export {
  FeedbackQuickAction,
  submitFeedbackSilently,
  FEEDBACK_SOURCES,
} from "../features/feedback";
export { NpsSurvey } from "../features/nps";

// ── Features (canonical: import directly from @shared/features/<name>) ────────
export { default as AdvancedSearch } from "../features/advanced-search";
export { default as DataExport } from "../features/data-export";
export { default as RealTimeNotifications } from "../features/real-time-notifications";
export {
  ErrorBoundary as ErrorMonitoringBoundary,
  setupGlobalErrorHandling,
  installFetchInterceptor,
  setupPerformanceMonitoring,
  setupHealthCheck,
  initializeMonitoring,
} from "../features/monitoring";

// ── Context (canonical: import from @shared/context) ─────────────────────────
export {
  PresenceProvider,
  usePresence,
  PresenceContext,
} from "../context";

// ── Liquid Glass UI primitives ────────────────────────────────────────────────
// Source of truth for: Modal, Button, Card, Badge, Input, Select, ProgressBar,
// Toggle, Spinner, EmptyState, FormField, WizardStepper, etc.
export * from "./ui";
