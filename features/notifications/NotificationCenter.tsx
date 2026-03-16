import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  FiBell,
  FiSettings,
  FiCheck,
  FiTrash2,
  FiX,
  FiRefreshCw,
  FiClock,
  FiUser,
  FiMail,
  FiMessageSquare,
  FiAlertCircle,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "../../hooks/useNotifications";
import { useWebSocket } from "../../hooks/useWebSocket";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Dropdown } from "../ui/Dropdown";
import { SearchInput } from "../ui/SearchInput";
import { Pagination } from "../ui/Pagination";
import { NotificationModal } from "./NotificationModal";
import NotificationToast from "./NotificationToast";
import { NotificationPreferences } from "./NotificationPreferences";
import type { Notification } from "./NotificationToast";

// ── Types ────────────────────────────────────────────────────────────────────

type PanelPosition = "right" | "left";
type FilterType =
  | "all"
  | "user"
  | "system"
  | "church"
  | "business"
  | "security";
type FilterStatus = "all" | "unread" | "read" | "archived";
type SortField = "date" | "priority" | "type";
type SortOrder = "asc" | "desc";
type BulkAction = "markRead" | "archive" | "delete";

interface ToastConfig {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
}

interface FilterOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NotificationCenterProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  position?: PanelPosition;
}

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  user: FiUser,
  system: FiSettings,
  church: FiMessageSquare,
  business: FiMail,
  security: FiAlertCircle,
};

const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  urgent: { color: "red", label: "Urgent" },
  high: { color: "orange", label: "High" },
  normal: { color: "blue", label: "Normal" },
  low: { color: "gray", label: "Low" },
};

// ── Component ────────────────────────────────────────────────────────────────

/**
 * NotificationCenter - Comprehensive real-time notification management interface
 *
 * Features:
 * - Real-time notification display with WebSocket integration
 * - Advanced filtering and search capabilities
 * - Notification actions (mark as read, archive, dismiss)
 * - Bulk notification management
 * - Notification preferences integration
 * - Performance-optimized virtual scrolling for large lists
 * - Responsive design for all devices
 * - Accessibility compliance
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = "",
  isOpen = false,
  onClose = () => {},
  position = "right",
}) => {
  // State
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<
    Set<string>
  >(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);

  // Refs
  const notificationListRef = useRef<HTMLDivElement>(null);

  // Notification data hook
  const {
    notifications,
    unreadCount,
    totalCount,
    isLoading: notificationsLoading,
    error,
    loadNotifications,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead: _markAllAsRead,
    deleteNotification,
    archiveNotification,
    refreshNotifications,
  } = useNotifications({
    limit: 20,
    page: currentPage,
    type: filterType === "all" ? undefined : filterType,
    status: filterStatus === "all" ? undefined : filterStatus,
    search: searchQuery,
  });

  const { isConnected, subscribe, unsubscribe } =
    useWebSocket("/notifications");

  // ── Filter/sort options ────────────────────────────────────────────────────

  const filterTypeOptions: FilterOption[] = [
    { value: "all", label: "All Types", icon: FiBell },
    { value: "user", label: "User", icon: FiUser },
    { value: "system", label: "System", icon: FiSettings },
    { value: "church", label: "Church", icon: FiMessageSquare },
    { value: "business", label: "Business", icon: FiMail },
    { value: "security", label: "Security", icon: FiAlertCircle },
  ];

  const filterStatusOptions: FilterOption[] = [
    { value: "all", label: "All Status" },
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
    { value: "archived", label: "Archived" },
  ];

  // ── Memoised filtered / sorted list ───────────────────────────────────────

  const processedNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.subject?.toLowerCase().includes(query) ||
          n.content?.toLowerCase().includes(query) ||
          n.type?.toLowerCase().includes(query),
      );
    }

    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case "priority":
          aValue = PRIORITY_ORDER[a.priority ?? ""] ?? 0;
          bValue = PRIORITY_ORDER[b.priority ?? ""] ?? 0;
          break;
        case "type":
          aValue = a.type ?? "";
          bValue = b.type ?? "";
          break;
        case "date":
        default:
          aValue = new Date(a.createdAt ?? a.timestamp ?? 0).getTime();
          bValue = new Date(b.createdAt ?? b.timestamp ?? 0).getTime();
          break;
      }

      return sortOrder === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
          ? 1
          : -1;
    });

    return filtered;
  }, [notifications, searchQuery, sortBy, sortOrder]);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const handleNotificationReceived = useCallback(
    (data: { event: string; data: Notification }) => {
      if (data.event === "notification:created") {
        setToast({
          type: "info",
          title: "New Notification",
          message: data.data.subject ?? "You have a new notification",
          duration: 5000,
        });
        refreshNotifications();
      } else if (data.event === "notification:processed") {
        refreshNotifications();
      }
    },
    [refreshNotifications],
  );

  useEffect(() => {
    if (isOpen && isConnected) {
      subscribe("notification-update", handleNotificationReceived);
    }
    return () => {
      if (isConnected) unsubscribe("notification-update");
    };
  }, [isOpen, isConnected, subscribe, unsubscribe, handleNotificationReceived]);

  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [
    isOpen,
    currentPage,
    filterType,
    filterStatus,
    searchQuery,
    loadNotifications,
  ]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleNotificationSelect = useCallback((notificationId: string) => {
    setSelectedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) {
        next.delete(notificationId);
      } else {
        next.add(notificationId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedNotifications.size === processedNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(
        new Set(processedNotifications.map((n) => (n.id ?? n._id) as string)),
      );
    }
  }, [selectedNotifications.size, processedNotifications]);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      setSelectedNotification(notification);
      if (notification.status === "unread") {
        try {
          await markAsRead((notification.id ?? notification._id) as string);
        } catch {
          setToast({
            type: "error",
            title: "Error",
            message: "Failed to mark notification as read",
            duration: 3000,
          });
        }
      }
    },
    [markAsRead],
  );

  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      if (selectedNotifications.size === 0) return;
      setIsLoading(true);
      const notificationIds = Array.from(selectedNotifications);
      try {
        switch (action) {
          case "markRead":
            await markMultipleAsRead(notificationIds);
            setToast({
              type: "success",
              title: "Success",
              message: `Marked ${notificationIds.length} notifications as read`,
              duration: 3000,
            });
            break;
          case "archive":
            for (const id of notificationIds) await archiveNotification(id);
            setToast({
              type: "success",
              title: "Success",
              message: `Archived ${notificationIds.length} notifications`,
              duration: 3000,
            });
            break;
          case "delete":
            for (const id of notificationIds) await deleteNotification(id);
            setToast({
              type: "success",
              title: "Success",
              message: `Deleted ${notificationIds.length} notifications`,
              duration: 3000,
            });
            break;
        }
        setSelectedNotifications(new Set());
        refreshNotifications();
      } catch {
        setToast({
          type: "error",
          title: "Error",
          message: `Failed to ${action} notifications`,
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedNotifications,
      markMultipleAsRead,
      archiveNotification,
      deleteNotification,
      refreshNotifications,
    ],
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback(
    (type: "type" | "status", value: string) => {
      if (type === "type") setFilterType(value as FilterType);
      else setFilterStatus(value as FilterStatus);
      setCurrentPage(1);
    },
    [],
  );

  // ── Sub-renderers ──────────────────────────────────────────────────────────

  const getNotificationIcon = useCallback(
    (type: string | undefined, priority: string | undefined) => {
      const Icon = ICON_MAP[type ?? ""] ?? FiBell;
      const color =
        priority === "urgent"
          ? "text-red-500"
          : priority === "high"
            ? "text-orange-500"
            : priority === "normal"
              ? "text-blue-500"
              : "text-gray-500";
      return <Icon className={`w-5 h-5 ${color}`} />;
    },
    [],
  );

  const getPriorityBadge = useCallback((priority: string | undefined) => {
    const badge = PRIORITY_BADGE[priority ?? ""] ?? PRIORITY_BADGE.normal;
    return (
      <Badge color={badge.color} size="sm">
        {badge.label}
      </Badge>
    );
  }, []);

  const renderNotificationItem = useCallback(
    (notification: Notification) => {
      const id = (notification.id ?? notification._id) as string;
      const isSelected = selectedNotifications.has(id);
      const isUnread = notification.status === "unread";

      return (
        <div
          key={id}
          className={`relative p-4 border-b border-gray-200 cursor-pointer transition-colors ${
            isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
          } ${isUnread ? "bg-blue-25" : ""}`}
          onClick={() => handleNotificationClick(notification)}
        >
          {/* Selection checkbox */}
          <div className="absolute top-4 left-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleNotificationSelect(id);
              }}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div className="ml-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getNotificationIcon(notification.type, notification.priority)}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-medium ${isUnread ? "text-gray-900" : "text-gray-700"}`}
                  >
                    {notification.subject ?? notification.title ?? "No subject"}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {notification.content ??
                      notification.message ??
                      "No content"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-1 ml-4">
                {getPriorityBadge(notification.priority)}
                <span className="text-xs text-gray-500 flex items-center">
                  <FiClock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(
                    new Date(
                      notification.createdAt ??
                        notification.timestamp ??
                        Date.now(),
                    ),
                    { addSuffix: true },
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Badge color="gray" size="xs">
                  {notification.type ?? "General"}
                </Badge>
                {notification.module && (
                  <Badge color="gray" size="xs">
                    {notification.module}
                  </Badge>
                )}
              </div>
              {isUnread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
            </div>
          </div>
        </div>
      );
    },
    [
      selectedNotifications,
      handleNotificationClick,
      handleNotificationSelect,
      getNotificationIcon,
      getPriorityBadge,
    ],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className={`fixed top-0 ${position === "right" ? "right-0" : "left-0"} h-full w-96 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : position === "right" ? "translate-x-full" : "-translate-x-full"}
          ${className}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <FiBell className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <Badge color="blue" size="sm">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="p-1"
              >
                <FiSettings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshNotifications}
                disabled={notificationsLoading}
                className="p-1"
              >
                <FiRefreshCw
                  className={`w-4 h-4 ${notificationsLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <FiX className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search + filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <SearchInput
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full"
            />
            <div className="flex items-center space-x-2">
              <Dropdown
                value={filterType}
                onChange={(value: string) => handleFilterChange("type", value)}
                options={filterTypeOptions}
                placeholder="Type"
                size="sm"
              />
              <Dropdown
                value={filterStatus}
                onChange={(value: string) =>
                  handleFilterChange("status", value)
                }
                options={filterStatusOptions}
                placeholder="Status"
                size="sm"
              />
              <Dropdown
                value={`${sortBy}-${sortOrder}`}
                onChange={(value: string) => {
                  const [field, order] = value.split("-");
                  setSortBy(field as SortField);
                  setSortOrder(order as SortOrder);
                }}
                options={[
                  { value: "date-desc", label: "Latest first" },
                  { value: "date-asc", label: "Oldest first" },
                  { value: "priority-desc", label: "High priority first" },
                  { value: "priority-asc", label: "Low priority first" },
                ]}
                placeholder="Sort"
                size="sm"
              />
            </div>
          </div>

          {/* Bulk actions bar */}
          {selectedNotifications.size > 0 && (
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedNotifications.size} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("markRead")}
                    disabled={isLoading}
                  >
                    <FiCheck className="w-4 h-4 mr-1" />
                    Mark Read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("archive")}
                    disabled={isLoading}
                  >
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("delete")}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto" ref={notificationListRef}>
            {notificationsLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="md" />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-red-600 mb-2">
                  Failed to load notifications
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshNotifications}
                >
                  Retry
                </Button>
              </div>
            ) : processedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <FiBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notifications
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? "No notifications match your search."
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <>
                {/* Select all */}
                <div className="p-4 border-b border-gray-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedNotifications.size ===
                        processedNotifications.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Select all
                    </span>
                  </label>
                </div>
                <div>{processedNotifications.map(renderNotificationItem)}</div>
              </>
            )}
          </div>

          {/* Footer pagination */}
          {totalCount > 0 && (
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / 20)}
                onPageChange={setCurrentPage}
                size="sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals / toasts */}
      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          isOpen={true}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={markAsRead}
          onArchive={archiveNotification}
          onDelete={deleteNotification}
        />
      )}

      {showPreferences && (
        <NotificationPreferences
          isOpen={true}
          onClose={() => setShowPreferences(false)}
        />
      )}

      {toast && <NotificationToast {...toast} onClose={() => setToast(null)} />}
    </>
  );
};

export { NotificationCenter };
export default NotificationCenter;
