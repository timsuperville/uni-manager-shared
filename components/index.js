// @shared/components — Ecosystem Kernel barrel
// Usage: import { Button, Modal, ... } from "@shared/components"
//        import { Button, Modal, ... } from "@shared/components/ui"  (ui-only)
//
// ── Primitives resolved to ui/ (Liquid Glass, CSS vars) ───────────────────────
// Modal, Select, Input, etc. come from ./ui via the wildcard below.
// DO NOT re-export them here again — that causes name collisions.
//
// ── Layout utilities ──────────────────────────────────────────────────────────
export { default as LoadingSpinner } from "./LoadingSpinner";
export { default as RoleGuard } from "./RoleGuard";
export { ThemeProvider, useTheme, tokens } from "./ThemeProvider";
export { default as GlobalErrorBoundary } from "./GlobalErrorBoundary";
export { default as EnvironmentDebugBanner } from "./EnvironmentDebugBanner";

// ── Feedback / Notifications ──────────────────────────────────────────────────
export { default as Toast } from "./Toast";
export { ToastProvider, useToast, useToastNotification } from "./ToastProvider";
export { default as ConfirmDialog } from "./ConfirmDialog";
export {
  FeedbackQuickAction,
  submitFeedbackSilently,
  FEEDBACK_SOURCES,
} from "../features/feedback";
export { NpsSurvey } from "./NpsSurvey";

// ── Feature components ────────────────────────────────────────────────────────
export { default as ActivityFeed } from "./ActivityFeed";
export { default as AdvancedSearch } from "./AdvancedSearch";
export { default as DataExport } from "./DataExport";
export { default as LazyWidget } from "./LazyWidget";
export { default as ErrorBoundary } from "./ErrorBoundary";
export { default as RealTimeNotifications } from "./RealTimeNotifications";
export { default as ThemeToggle } from "./ThemeToggle";

// ── Mobile-optimized shared components ───────────────────────────────────────
export { default as MobileOptimizedLayout } from "./MobileOptimizedLayout";
export { default as MobileFormComponents } from "./MobileFormComponents";
export { default as MobileInvitationCard } from "./MobileInvitationCard";
export { default as MobileMemberCard } from "./MobileMemberCard";
export { default as MobilePagination } from "./MobilePagination";

// ── SelectDropdown — rich custom picker (different from native <select> in ui/Input) ──
// Import as: import { SelectDropdown } from "@shared/components"
export { default as SelectDropdown } from "./Select";

// ── Consolidated from monitoring/, context/, performance/, services/ ──────────
// Canonical home: these components now live here; old paths have shims.
export {
  ErrorBoundary as ErrorMonitoringBoundary,
  setupGlobalErrorHandling,
  installFetchInterceptor,
  setupPerformanceMonitoring,
  setupHealthCheck,
  initializeMonitoring,
} from "./ErrorMonitoring";
export {
  PresenceProvider,
  usePresence,
  PresenceContext,
} from "./PresenceContext";
export { PerformanceDashboard } from "./PerformanceDashboard";
export { ApiProvider, useApi } from "./ApiProvider";

// ── Liquid Glass UI primitives ────────────────────────────────────────────────
// Source of truth for: Modal, Button, Card, Badge, Input, Select, ProgressBar,
// Toggle, Spinner, EmptyState, FormField, WizardStepper, etc.
export * from "./ui";
