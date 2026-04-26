/**
 * NotificationAdapter.ts
 *
 * The canonical interface that decouples the shared `NotificationCenter` UI
 * from any specific backend's URL structure, scope key, or response shape.
 *
 * Each host app implements this interface once and provides it via
 * `NotificationProvider`. The shared component never hard-codes a URL.
 *
 * Implementations:
 *  - church app:  ChurchNotificationAdapter  (scoped to /:churchId/notifications)
 *  - home   app:  HomeNotificationAdapter    (scoped to /households/:householdId/notifications)
 *
 * @see NotificationContext.tsx  — React provider that makes the adapter available
 */

// ── Canonical in-app notification shape ──────────────────────────────────────
// All adapters MUST normalise their backend response to this type before
// returning data to the hook. Never let backend field-name differences
// (e.g. `body` vs `message`, `read` vs `status`) leak into the UI layer.

export interface AppNotification {
  /** Unified ID — adapter maps _id → id when needed */
  id: string;
  /** Legacy alias — some sub-components still use _id for compat */
  _id?: string;
  title: string;
  /** Main notification body text */
  body: string;
  /** Legacy aliases used by NotificationModal and sub-renderers */
  subject?: string;
  content?: string;
  message?: string;
  /** Notification category (announcement, reminder, alert, system, …) */
  type?: string;
  /** "unread" | "read" | "archived" — adapter maps boolean `read` → status */
  status: "unread" | "read" | "archived";
  priority?: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  /** Legacy timestamp alias */
  timestamp?: string;
  /** Free-form metadata preserved for display (module badge, action URL, …) */
  metadata?: Record<string, unknown>;
  /** Optional module/feature badge */
  module?: string;
  /** Optional sender display info */
  sender?: { name?: string; avatar?: string };
  /** Optional file attachments */
  attachments?: Array<{
    url: string;
    filename?: string;
    type?: string;
    size?: number;
    thumbnail?: string;
  }>;
  /** CTA actions on the notification */
  actions?: Array<{
    label: string;
    url?: string;
    primary?: boolean;
    icon?: boolean;
  }>;
  deliveryStatus?: Record<string, string>;
}

// ── Fetch parameters ──────────────────────────────────────────────────────────

export interface FetchNotificationsParams {
  page?: number;
  limit?: number;
  /** Filter by status — adapter maps to backend query param */
  status?: "unread" | "read" | "archived";
  /** Filter by type (announcement, system, …) */
  type?: string;
  search?: string;
  signal?: AbortSignal;
}

// ── Page result ───────────────────────────────────────────────────────────────

export interface NotificationPage {
  items: AppNotification[];
  total: number;
  /** total unread across ALL pages (not just the current page) */
  unreadCount: number;
}

// ── The adapter interface ─────────────────────────────────────────────────────

export interface NotificationAdapter {
  /**
   * Fetch a paginated, filtered list of notifications.
   * Must return a `NotificationPage` with normalised `AppNotification` items.
   */
  fetchNotifications(
    params: FetchNotificationsParams,
  ): Promise<NotificationPage>;

  /**
   * Cheap unread-count poll — used by the bell badge without loading the full list.
   * If the backend has a dedicated unread endpoint use it; otherwise call
   * fetchNotifications with limit:1 and return the result's unreadCount.
   */
  fetchUnreadCount(): Promise<number>;

  /** Mark a single notification as read. */
  markRead(id: string): Promise<void>;

  /** Mark ALL notifications as read for the current user. */
  markAllRead(): Promise<void>;

  /** Mark multiple notifications as read in a single request. */
  bulkMarkRead(ids: string[]): Promise<void>;

  /** Archive a notification (soft-delete / hide from default view). */
  archive(id: string): Promise<void>;

  /** Permanently delete a notification. */
  delete(id: string): Promise<void>;
}

// ── Null object — safe default when no provider is mounted ───────────────────
// This prevents the component from crashing when rendered outside a provider
// (e.g. in Storybook or unit tests that haven't set up the context).

const warn = (method: string) =>
  import.meta.env?.DEV &&
  console.warn(
    `[NotificationCenter] ${method} called without a NotificationProvider. ` +
      "Wrap the notification bell with a <NotificationProvider adapter={...}>.",
  );

export const NULL_NOTIFICATION_ADAPTER: NotificationAdapter = {
  fetchNotifications: async () => {
    warn("fetchNotifications");
    return { items: [], total: 0, unreadCount: 0 };
  },
  fetchUnreadCount: async () => {
    warn("fetchUnreadCount");
    return 0;
  },
  markRead: async () => {
    warn("markRead");
  },
  markAllRead: async () => {
    warn("markAllRead");
  },
  bulkMarkRead: async () => {
    warn("bulkMarkRead");
  },
  archive: async () => {
    warn("archive");
  },
  delete: async () => {
    warn("delete");
  },
};
