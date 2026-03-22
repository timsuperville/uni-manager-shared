/* eslint-env browser */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNotificationContext } from "../features/notifications/NotificationContext";
import type {
  AppNotification,
  FetchNotificationsParams,
} from "../features/notifications/NotificationAdapter";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseNotificationsOptions extends FetchNotificationsParams {}

export interface UseNotificationsReturn {
  notifications: AppNotification[];
  totalCount: number;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  loadNotifications: (forceRefresh?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markMultipleAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

// ── Cache entry ───────────────────────────────────────────────────────────────

interface CacheEntry {
  items: AppNotification[];
  total: number;
  unreadCount: number;
  timestamp: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useNotifications
 *
 * Provides notification state and mutation methods to the UI.
 * All API calls are delegated to the `NotificationAdapter` supplied via
 * `NotificationProvider` — this hook has zero knowledge of URLs, scope keys
 * (churchId, householdId), or HTTP method differences between backends.
 *
 * Use this hook only inside a `NotificationProvider` tree. It falls back to
 * the `NULL_NOTIFICATION_ADAPTER` (dev warning, no crash) if used outside one.
 */
export const useNotifications = ({
  page = 1,
  limit = 20,
  status,
  type,
  search,
}: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const { adapter } = useNotificationContext();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  const cacheRef = useRef(new Map<string, CacheEntry>());
  const abortRef = useRef<AbortController | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadNotifications = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = `${page}:${limit}:${status ?? ""}:${type ?? ""}:${search ?? ""}`;

      if (!forceRefresh && cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey)!;
        if (Date.now() - cached.timestamp < 30_000) {
          setNotifications(cached.items);
          setTotalCount(cached.total);
          setUnreadCount(cached.unreadCount);
          return;
        }
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const result = await adapter.fetchNotifications({
          page,
          limit,
          status,
          type,
          search,
          signal: abortRef.current.signal,
        });

        setNotifications(result.items);
        setTotalCount(result.total);
        setUnreadCount(result.unreadCount);
        setLastFetch(Date.now());

        cacheRef.current.set(cacheKey, {
          items: result.items,
          total: result.total,
          unreadCount: result.unreadCount,
          timestamp: Date.now(),
        });

        // Evict oldest cache entry beyond 10 entries
        if (cacheRef.current.size > 10) {
          const oldest = cacheRef.current.keys().next().value as string;
          cacheRef.current.delete(oldest);
        }
      } catch (err) {
        const typedErr = err instanceof Error ? err : new Error(String(err));
        if (typedErr.name !== "AbortError") {
          setError(typedErr.message);
          if (import.meta.env?.DEV) {
            console.warn(
              "[useNotifications] fetchNotifications failed:",
              typedErr.message,
            );
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    // adapter is stable for the lifetime of the provider;
    // params change triggers a refetch via the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adapter, page, limit, status, type, search],
  );

  // ── Mutations ───────────────────────────────────────────────────────────────

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" as const } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await adapter.markRead(id);
      } catch (err) {
        // Revert
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, status: "unread" as const } : n,
          ),
        );
        setUnreadCount((prev) => prev + 1);
        if (import.meta.env?.DEV) {
          console.warn("[useNotifications] markRead failed:", err);
        }
        throw err;
      }
    },
    [adapter],
  );

  const markMultipleAsRead = useCallback(
    async (ids: string[]) => {
      const snapshot = [...notifications];
      const snapshotUnread = unreadCount;

      setNotifications((prev) =>
        prev.map((n) =>
          ids.includes(n.id) ? { ...n, status: "read" as const } : n,
        ),
      );
      const toRead = notifications.filter(
        (n) => ids.includes(n.id) && n.status === "unread",
      ).length;
      setUnreadCount((prev) => Math.max(0, prev - toRead));

      try {
        await adapter.bulkMarkRead(ids);
      } catch (err) {
        setNotifications(snapshot);
        setUnreadCount(snapshotUnread);
        if (import.meta.env?.DEV) {
          console.warn("[useNotifications] bulkMarkRead failed:", err);
        }
        throw err;
      }
    },
    [adapter, notifications, unreadCount],
  );

  const markAllAsRead = useCallback(async () => {
    const snapshot = [...notifications];
    const snapshotUnread = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "read" as const })),
    );
    setUnreadCount(0);

    try {
      await adapter.markAllRead();
    } catch (err) {
      setNotifications(snapshot);
      setUnreadCount(snapshotUnread);
      if (import.meta.env?.DEV) {
        console.warn("[useNotifications] markAllRead failed:", err);
      }
      throw err;
    }
  }, [adapter, notifications, unreadCount]);

  const archiveNotification = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      try {
        await adapter.archive(id);
      } catch (err) {
        // Refetch to restore consistent state
        await loadNotifications(true);
        if (import.meta.env?.DEV) {
          console.warn("[useNotifications] archive failed:", err);
        }
        throw err;
      }
    },
    [adapter, loadNotifications],
  );

  const deleteNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target?.status === "unread")
        setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await adapter.delete(id);
      } catch (err) {
        await loadNotifications(true);
        if (import.meta.env?.DEV) {
          console.warn("[useNotifications] delete failed:", err);
        }
        throw err;
      }
    },
    [adapter, notifications, loadNotifications],
  );

  const refreshNotifications = useCallback(async () => {
    cacheRef.current.clear();
    await loadNotifications(true);
  }, [loadNotifications]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Return ──────────────────────────────────────────────────────────────────

  return {
    notifications,
    totalCount,
    unreadCount,
    isLoading,
    error,
    lastFetch,
    loadNotifications,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refreshNotifications,
  };
};

export default useNotifications;
