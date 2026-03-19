// @shared/features/notifications — barrel

// ── Core types ────────────────────────────────────────────────────────────────
export type {
  AppNotification,
  NotificationAdapter,
  NotificationPage,
  FetchNotificationsParams,
} from "./NotificationAdapter";
export { NULL_NOTIFICATION_ADAPTER } from "./NotificationAdapter";

// ── Provider / context ────────────────────────────────────────────────────────
export {
  NotificationProvider,
  useNotificationContext,
} from "./NotificationContext";

// ── UI components ─────────────────────────────────────────────────────────────
export { default as NotificationCenter } from "./NotificationCenter";
export { default as NotificationPreferences } from "./NotificationPreferences";
export { default as NotificationModal } from "./NotificationModal";
export {
  default as NotificationToast,
  ToastContainer,
} from "./NotificationToast";

// ── Re-export hooks for convenience ───────────────────────────────────────────
export { default as useNotifications } from "../../hooks/useNotifications";
export { default as useNotificationPreferences } from "../../hooks/useNotificationPreferences";
