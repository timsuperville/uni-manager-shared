/**
 * NotificationContext.tsx
 *
 * React context that makes a `NotificationAdapter` available to the entire
 * notification sub-tree. Each host app wraps its notification bell with
 * `<NotificationProvider adapter={...}>` — the shared `NotificationCenter`
 * and `useNotifications` hook consume the adapter through this context and
 * never hard-code any URL or scope key.
 *
 * Usage (church app):
 *
 *   const adapter = useChurchNotificationAdapter();
 *   return (
 *     <NotificationProvider adapter={adapter}>
 *       <NotificationBell />
 *     </NotificationProvider>
 *   );
 */
import React, { createContext, useContext, useMemo } from 'react';
import {
  NULL_NOTIFICATION_ADAPTER,
  type NotificationAdapter
} from './NotificationAdapter';

// ── Context ───────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  adapter: NotificationAdapter;
}

const NotificationContext = createContext<NotificationContextValue>({
  adapter: NULL_NOTIFICATION_ADAPTER
});

// ── Provider ──────────────────────────────────────────────────────────────────

interface NotificationProviderProps {
  adapter: NotificationAdapter;
  children: React.ReactNode;
}

/**
 * NotificationProvider
 *
 * Wrap the notification bell (and the NotificationCenter portal it renders)
 * with this provider, passing the app-specific adapter.
 *
 * @example
 *   // church app layout
 *   const adapter = useChurchNotificationAdapter();
 *   <NotificationProvider adapter={adapter}>
 *     <NotificationBell />
 *   </NotificationProvider>
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  adapter,
  children
}) => {
  const value = useMemo(() => ({ adapter }), [adapter]);
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// ── Consumer hook ─────────────────────────────────────────────────────────────

/**
 * useNotificationContext
 *
 * Returns the adapter supplied by the nearest `NotificationProvider`.
 * Falls back to `NULL_NOTIFICATION_ADAPTER` (logs a DEV warning) if no
 * provider is found — prevents crashes in Storybook / unit tests.
 */
export const useNotificationContext = (): NotificationContextValue =>
  useContext(NotificationContext);
