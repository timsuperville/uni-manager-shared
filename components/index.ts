// @shared/components — Ecosystem Kernel barrel
// Usage: import { Button, Modal, ... } from "@shared/components"
//        import { Button, Modal, ... } from "@shared/components/ui"  (ui-only)

// ── Layout / infrastructure ───────────────────────────────────────────────────
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as RoleGuard } from './RoleGuard';
export { ThemeProvider, useTheme, tokens } from './ThemeProvider';
export { default as ThemeToggle } from './ThemeToggle';
export { ErrorBoundary } from './error-boundary';
export { withErrorBoundary } from './error-boundary';
export { flushPendingErrorReports } from './error-boundary';
// GlobalErrorBoundary merged into ErrorBoundary (variant="full-screen" is now default)
export { ApiProvider, useApi } from './ApiProvider';
export { BioAdaptiveWrapper } from './wrappers/BioAdaptiveWrapper';

// ── Feedback / Notifications ──────────────────────────────────────────────────
export { default as Toast } from './Toast';
export { ToastProvider, useToast, useToastNotification } from './ToastProvider';
export { default as ConfirmDialog } from './ConfirmDialog';
export {
  FeedbackQuickAction,
  submitFeedbackSilently,
  FEEDBACK_SOURCES
} from '../features/feedback';
export { NpsSurvey } from '../features/nps';

// ── Features (canonical: import directly from @shared/features/<name>) ────────
// AdvancedSearch removed — MUI dependency, zero consumers in any app
// DataExport removed — MUI dependency, zero consumers in any app
// RealTimeNotifications removed — MUI dependency, zero consumers in any app
export {
  ErrorBoundary as ErrorMonitoringBoundary,
  setupGlobalErrorHandling,
  installFetchInterceptor,
  setupOfflineFlush,
  setupPerformanceMonitoring,
  setupHealthCheck,
  initializeMonitoring,
  createMonitoredQueryClient
} from '../features/monitoring';

// ── Context (canonical: import from @shared/context) ─────────────────────────
export { PresenceProvider, usePresence, PresenceContext } from '../context';

// ── Liquid Glass UI primitives ────────────────────────────────────────────────
// Source of truth for: Modal, Button, Card, Badge, Input, Select, ProgressBar,
// Toggle, Spinner, EmptyState, FormField, WizardStepper, etc.
export * from './ui';
