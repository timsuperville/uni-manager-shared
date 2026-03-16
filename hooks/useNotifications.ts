/* eslint-env browser */
import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./useWebSocket";
import { getApiBaseUrl } from "../api/config/apiConfig";
import type { Notification } from "../features/notifications/NotificationToast";

// ── Types ────────────────────────────────────────────────────────────────────

interface UseNotificationsOptions {
  limit?: number;
  page?: number;
  type?: string;
  status?: string;
  search?: string;
  userId?: string | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}

interface CacheEntry {
  data: NotificationsResponse;
  timestamp: number;
}

interface ApiRequestOptions extends RequestInit {}

export interface UseNotificationsReturn {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  loadNotifications: (forceRefresh?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markMultipleAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

const _API_BASE = getApiBaseUrl();

/**
 * useNotifications - Custom hook for notification management
 *
 * Features:
 * - Notification CRUD operations
 * - Real-time updates via WebSocket
 * - Pagination and filtering
 * - Optimistic updates
 * - Error handling and retry logic
 * - Local caching
 * - Batch operations
 */
export const useNotifications = ({
  limit = 20,
  page = 1,
  type = undefined,
  status = undefined,
  search = undefined,
  userId = null,
}: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  const cacheRef = useRef(new Map<string, CacheEntry>());
  const abortControllerRef = useRef<AbortController | null>(null);

  const { isConnected, subscribe, unsubscribe } =
    useWebSocket("/notifications");

  const buildApiUrl = useCallback(
    (endpoint: string, params: Record<string, unknown> = {}) => {
      const url = new URL(`${_API_BASE}/api/notifications${endpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });
      return url.toString();
    },
    [],
  );

  const apiRequest = useCallback(
    async (url: string, options: ApiRequestOptions = {}): Promise<unknown> => {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof localStorage !== "undefined" && localStorage.getItem("authToken")}`,
          ...options.headers,
        },
        ...options,
      });
      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }
      return response.json();
    },
    [],
  );

  const loadNotifications = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = `notifications_${page}_${limit}_${type}_${status}_${search}_${userId}`;

      if (!forceRefresh && cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey)!;
        if (Date.now() - cached.timestamp < 30_000) {
          setNotifications(cached.data.notifications ?? []);
          setTotalCount(cached.data.totalCount ?? 0);
          setUnreadCount(cached.data.unreadCount ?? 0);
          return;
        }
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const url = buildApiUrl("", {
          page,
          limit,
          type,
          status,
          search,
          userId,
        });
        const response = (await apiRequest(url, {
          signal: abortControllerRef.current.signal,
        })) as NotificationsResponse;

        setNotifications(response.notifications ?? []);
        setTotalCount(response.totalCount ?? 0);
        setUnreadCount(response.unreadCount ?? 0);
        setLastFetch(Date.now());

        cacheRef.current.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
        });

        // Evict oldest entry if cache grows too large
        if (cacheRef.current.size > 10) {
          const oldestKey = cacheRef.current.keys().next().value as string;
          cacheRef.current.delete(oldestKey);
        }
      } catch (err) {
        // Root-cause fix: the original code caught as `_error` but threw
        // an undefined outer `error` — that caused a ReferenceError.
        const typedErr = err instanceof Error ? err : new Error(String(err));
        if (typedErr.name !== "AbortError") {
          setError(typedErr.message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [page, limit, type, status, search, userId, buildApiUrl, apiRequest],
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          (n.id ?? n._id) === notificationId
            ? { ...n, status: "read" as const }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await apiRequest(buildApiUrl(`/${notificationId}/read`), {
          method: "PUT",
        });
      } catch (err) {
        // Revert
        setNotifications((prev) =>
          prev.map((n) =>
            (n.id ?? n._id) === notificationId
              ? { ...n, status: "unread" as const }
              : n,
          ),
        );
        setUnreadCount((prev) => prev + 1);
        throw err;
      }
    },
    [buildApiUrl, apiRequest],
  );

  const markMultipleAsRead = useCallback(
    async (notificationIds: string[]) => {
      const originalNotifications = [...notifications];
      const originalUnreadCount = unreadCount;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes((n.id ?? n._id) as string)
            ? { ...n, status: "read" as const }
            : n,
        ),
      );
      const unreadToRead = notifications.filter(
        (n) =>
          notificationIds.includes((n.id ?? n._id) as string) &&
          n.status === "unread",
      ).length;
      setUnreadCount((prev) => Math.max(0, prev - unreadToRead));

      try {
        await apiRequest(buildApiUrl("/bulk/read"), {
          method: "PUT",
          body: JSON.stringify({ notificationIds }),
        });
      } catch (err) {
        setNotifications(originalNotifications);
        setUnreadCount(originalUnreadCount);
        throw err;
      }
    },
    [notifications, unreadCount, buildApiUrl, apiRequest],
  );

  const markAllAsRead = useCallback(async () => {
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "read" as const })),
    );
    setUnreadCount(0);

    try {
      await apiRequest(buildApiUrl("/all/read"), { method: "PUT" });
    } catch (err) {
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
      throw err;
    }
  }, [notifications, unreadCount, buildApiUrl, apiRequest]);

  const archiveNotification = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) =>
        prev.filter((n) => (n.id ?? n._id) !== notificationId),
      );
      try {
        await apiRequest(buildApiUrl(`/${notificationId}/archive`), {
          method: "PUT",
        });
      } catch (err) {
        await loadNotifications(true);
        throw err;
      }
    },
    [buildApiUrl, apiRequest, loadNotifications],
  );

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      const target = notifications.find(
        (n) => (n.id ?? n._id) === notificationId,
      );
      setNotifications((prev) =>
        prev.filter((n) => (n.id ?? n._id) !== notificationId),
      );
      if (target?.status === "unread")
        setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await apiRequest(buildApiUrl(`/${notificationId}`), {
          method: "DELETE",
        });
      } catch (err) {
        await loadNotifications(true);
        throw err;
      }
    },
    [notifications, buildApiUrl, apiRequest, loadNotifications],
  );

  const refreshNotifications = useCallback(() => {
    cacheRef.current.clear();
    return loadNotifications(true);
  }, [loadNotifications]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const handleNotificationUpdate = (data: {
      event: string;
      data: Notification & { id?: string };
    }) => {
      switch (data.event) {
        case "notification:created":
          setNotifications((prev) => [data.data, ...prev]);
          if (data.data.status === "unread") setUnreadCount((prev) => prev + 1);
          break;
        case "notification:updated":
          setNotifications((prev) =>
            prev.map((n) =>
              (n.id ?? n._id) === data.data.id ? { ...n, ...data.data } : n,
            ),
          );
          break;
        case "notification:deleted":
          setNotifications((prev) =>
            prev.filter((n) => (n.id ?? n._id) !== data.data.id),
          );
          break;
        case "notification:read":
          setNotifications((prev) =>
            prev.map((n) =>
              (n.id ?? n._id) === data.data.id
                ? { ...n, status: "read" as const }
                : n,
            ),
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
          break;
        default:
          break;
      }
    };

    subscribe("notification-update", handleNotificationUpdate);
    return () => unsubscribe("notification-update");
  }, [isConnected, subscribe, unsubscribe]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
