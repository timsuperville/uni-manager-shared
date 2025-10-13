/* eslint-env browser */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

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
} = {}) => {
  // State management
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Refs for cache management
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // WebSocket integration
  const { isConnected, subscribe, unsubscribe } =
    useWebSocket('/notifications');

  // Build API URL
  const buildApiUrl = useCallback((endpoint, params = {}) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const url = new URL(`${baseUrl}/api/notifications${endpoint}`);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }, []);

  // API request wrapper with error handling
  const apiRequest = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof localStorage !== "undefined" && localStorage.getItem('authToken')}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (_error) {
      // eslint-disable-next-line no-console
      // console.error('API request error:', error);
      throw error;
    }
  }, []);

  // Load notifications with caching
  const loadNotifications = useCallback(
    async (forceRefresh = false) => {
      // Generate cache key
      const cacheKey = `notifications_${page}_${limit}_${type}_${status}_${search}_${userId}`;

      // Check cache if not forcing refresh
      if (!forceRefresh && cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) {
          // 30 second cache
          setNotifications(cached.data.notifications || []);
          setTotalCount(cached.data.totalCount || 0);
          setUnreadCount(cached.data.unreadCount || 0);
          return;
        }
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const url = buildApiUrl('', {
          page,
          limit,
          type,
          status,
          search,
          userId,
        });

        const response = await apiRequest(url, {
          signal: abortControllerRef.current.signal,
        });

        const {
          notifications: newNotifications,
          totalCount: newTotalCount,
          unreadCount: newUnreadCount,
        } = response;

        // Update state
        setNotifications(newNotifications || []);
        setTotalCount(newTotalCount || 0);
        setUnreadCount(newUnreadCount || 0);
        setLastFetch(Date.now());

        // Cache the response
        cacheRef.current.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
        });

        // Cleanup old cache entries
        if (cacheRef.current.size > 10) {
          const oldestKey = Array.from(cacheRef.current.keys())[0];
          cacheRef.current.delete(oldestKey);
        }
      } catch (_error) {
        if (error.name !== 'AbortError') {
          setError(error.message);
          // eslint-disable-next-line no-console
          // console.error('Failed to load notifications:', error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [page, limit, type, status, search, userId, buildApiUrl, apiRequest]
  );

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        // Optimistic update
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ||
            notification._id === notificationId
              ? { ...notification, status: 'read' }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        const url = buildApiUrl(`/${notificationId}/read`);
        await apiRequest(url, { method: 'PUT' });
      } catch (_error) {
        // Revert optimistic update
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ||
            notification._id === notificationId
              ? { ...notification, status: 'unread' }
              : notification
          )
        );
        setUnreadCount((prev) => prev + 1);

        throw error;
      }
    },
    [buildApiUrl, apiRequest]
  );

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(
    async (notificationIds) => {
      // Store original state for revert
      const originalNotifications = [...notifications];
      const originalUnreadCount = unreadCount;

      try {
        // Optimistic update
        setNotifications((prev) =>
          prev.map((notification) =>
            notificationIds.includes(notification.id || notification._id)
              ? { ...notification, status: 'read' }
              : notification
          )
        );

        const unreadToRead = notifications.filter(
          (n) =>
            notificationIds.includes(n.id || n._id) && n.status === 'unread'
        ).length;
        setUnreadCount((prev) => Math.max(0, prev - unreadToRead));

        const url = buildApiUrl('/bulk/read');
        await apiRequest(url, {
          method: 'PUT',
          body: JSON.stringify({ notificationIds }),
        });
      } catch (_error) {
        // Revert optimistic update
        setNotifications(originalNotifications);
        setUnreadCount(originalUnreadCount);
        throw error;
      }
    },
    [notifications, unreadCount, buildApiUrl, apiRequest]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Store original state for revert
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;

    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: 'read',
        }))
      );
      setUnreadCount(0);

      const url = buildApiUrl('/all/read');
      await apiRequest(url, { method: 'PUT' });
    } catch (_error) {
      // Revert optimistic update
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
      throw error;
    }
  }, [notifications, unreadCount, buildApiUrl, apiRequest]);

  // Archive notification
  const archiveNotification = useCallback(
    async (notificationId) => {
      try {
        // Optimistic update
        setNotifications((prev) =>
          prev.filter(
            (notification) =>
              notification.id !== notificationId &&
              notification._id !== notificationId
          )
        );

        const url = buildApiUrl(`/${notificationId}/archive`);
        await apiRequest(url, { method: 'PUT' });
      } catch (_error) {
        // Reload on error
        loadNotifications(true);
        throw error;
      }
    },
    [buildApiUrl, apiRequest, loadNotifications]
  );

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        // Optimistic update
        const notification = notifications.find(
          (n) => n.id === notificationId || n._id === notificationId
        );

        setNotifications((prev) =>
          prev.filter(
            (notification) =>
              notification.id !== notificationId &&
              notification._id !== notificationId
          )
        );

        if (notification?.status === 'unread') {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        const url = buildApiUrl(`/${notificationId}`);
        await apiRequest(url, { method: 'DELETE' });
      } catch (_error) {
        // Reload on error
        loadNotifications(true);
        throw error;
      }
    },
    [notifications, buildApiUrl, apiRequest, loadNotifications]
  );

  // Refresh notifications (force reload)
  const refreshNotifications = useCallback(() => {
    // Clear cache
    cacheRef.current.clear();
    return loadNotifications(true);
  }, [loadNotifications]);

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return;

    const handleNotificationUpdate = (data) => {
      switch (data.event) {
        case 'notification:created':
          // Add new notification to the beginning
          setNotifications((prev) => [data.data, ...prev]);
          if (data.data.status === 'unread') {
            setUnreadCount((prev) => prev + 1);
          }
          break;

        case 'notification:updated':
          // Update existing notification
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === data.data.id ||
              notification._id === data.data.id
                ? { ...notification, ...data.data }
                : notification
            )
          );
          break;

        case 'notification:deleted':
          // Remove notification
          setNotifications((prev) =>
            prev.filter(
              (notification) =>
                notification.id !== data.data.id &&
                notification._id !== data.data.id
            )
          );
          break;

        case 'notification:read':
          // Update notification status
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === data.data.id ||
              notification._id === data.data.id
                ? { ...notification, status: 'read' }
                : notification
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
          break;

        default:
          break;
      }
    };

    subscribe('notification-update', handleNotificationUpdate);

    return () => {
      unsubscribe('notification-update');
    };
  }, [isConnected, subscribe, unsubscribe]);

  // Load notifications on mount and dependency changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
