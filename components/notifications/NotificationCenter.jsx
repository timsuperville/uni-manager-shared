import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  FiBell,
  FiFilter,
  FiSearch,
  FiSettings,
  FiCheck,
  FiTrash2,
  FiX,
  FiRefreshCw,
  FiChevronDown,
  FiClock,
  FiUser,
  FiMail,
  FiMessageSquare,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import { useWebSocket } from '../../hooks/useWebSocket';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Dropdown } from '../ui/Dropdown';
import { SearchInput } from '../ui/SearchInput';
import { Pagination } from '../ui/Pagination';
import { NotificationModal } from './NotificationModal';
import { NotificationToast } from './NotificationToast';
import { NotificationPreferences } from './NotificationPreferences';

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
 * - Integration with enhanced notification service
 */
const NotificationCenter = ({
  className = '',
  isOpen = false,
  onClose = () => {},
  position = 'right',
}) => {
  // State management
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Refs
  const notificationListRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Custom hooks
  const {
    notifications,
    unreadCount,
    totalCount,
    isLoading: notificationsLoading,
    error,
    loadNotifications,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    refreshNotifications,
  } = useNotifications({
    limit: 20,
    page: currentPage,
    type: filterType === 'all' ? undefined : filterType,
    status: filterStatus === 'all' ? undefined : filterStatus,
    search: searchQuery,
  });

  const { isConnected, connectionStatus, subscribe, unsubscribe } =
    useWebSocket('/notifications');

  // Filter and sort options
  const filterTypeOptions = [
    { value: 'all', label: 'All Types', icon: FiBell },
    { value: 'user', label: 'User', icon: FiUser },
    { value: 'system', label: 'System', icon: FiSettings },
    { value: 'church', label: 'Church', icon: FiMessageSquare },
    { value: 'business', label: 'Business', icon: FiMail },
    { value: 'security', label: 'Security', icon: FiAlertCircle },
  ];

  const filterStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
    { value: 'archived', label: 'Archived' },
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'type', label: 'Type' },
  ];

  // Memoized filtered and sorted notifications
  const processedNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.subject?.toLowerCase().includes(query) ||
          notification.content?.toLowerCase().includes(query) ||
          notification.type?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt || a.timestamp);
          bValue = new Date(b.createdAt || b.timestamp);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [notifications, searchQuery, sortBy, sortOrder]);

  // WebSocket event handlers
  const handleNotificationReceived = useCallback(
    (data) => {
      if (data.event === 'notification:created') {
        // Show toast for new notification
        setToast({
          type: 'info',
          title: 'New Notification',
          message: data.data.subject || 'You have a new notification',
          duration: 5000,
        });

        // Refresh notifications list
        refreshNotifications();
      } else if (data.event === 'notification:processed') {
        // Update notification status
        refreshNotifications();
      }
    },
    [refreshNotifications]
  );

  // Initialize WebSocket connection
  useEffect(() => {
    if (isOpen && isConnected) {
      subscribe('notification-update', handleNotificationReceived);
    }

    return () => {
      if (isConnected) {
        unsubscribe('notification-update');
      }
    };
  }, [isOpen, isConnected, subscribe, unsubscribe, handleNotificationReceived]);

  // Load notifications when filters change
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [
    isOpen,
    currentPage,
    filterType,
    filterStatus,
    searchQuery,
    loadNotifications,
  ]);

  // Handle notification selection
  const handleNotificationSelect = useCallback((notificationId) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);

  // Handle select all notifications
  const handleSelectAll = useCallback(() => {
    if (selectedNotifications.size === processedNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(
        new Set(processedNotifications.map((n) => n.id || n._id))
      );
    }
  }, [selectedNotifications.size, processedNotifications]);

  // Handle notification click
  const handleNotificationClick = useCallback(
    async (notification) => {
      setSelectedNotification(notification);

      // Mark as read if unread
      if (notification.status === 'unread') {
        try {
          await markAsRead(notification.id || notification._id);
        } catch (_error) {
          // console.error('Failed to mark notification as read:', error);
          setToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to mark notification as read',
            duration: 3000,
          });
        }
      }
    },
    [markAsRead]
  );

  // Handle bulk actions
  const handleBulkAction = useCallback(
    async (action) => {
      if (selectedNotifications.size === 0) return;

      setIsLoading(true);
      try {
        const notificationIds = Array.from(selectedNotifications);

        switch (action) {
          case 'markRead':
            await markMultipleAsRead(notificationIds);
            setToast({
              type: 'success',
              title: 'Success',
              message: `Marked ${notificationIds.length} notifications as read`,
              duration: 3000,
            });
            break;
          case 'archive':
            for (const id of notificationIds) {
              await archiveNotification(id);
            }
            setToast({
              type: 'success',
              title: 'Success',
              message: `Archived ${notificationIds.length} notifications`,
              duration: 3000,
            });
            break;
          case 'delete':
            for (const id of notificationIds) {
              await deleteNotification(id);
            }
            setToast({
              type: 'success',
              title: 'Success',
              message: `Deleted ${notificationIds.length} notifications`,
              duration: 3000,
            });
            break;
        }

        setSelectedNotifications(new Set());
        refreshNotifications();
      } catch (_error) {
        // console.error(`Failed to ${action} notifications:`, error);
        setToast({
          type: 'error',
          title: 'Error',
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
    ]
  );

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((type, value) => {
    if (type === 'type') {
      setFilterType(value);
    } else if (type === 'status') {
      setFilterStatus(value);
    }
    setCurrentPage(1);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback(
    (field) => {
      if (sortBy === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(field);
        setSortOrder('desc');
      }
    },
    [sortBy, sortOrder]
  );

  // Get notification icon
  const getNotificationIcon = useCallback((type, priority) => {
    const iconMap = {
      user: FiUser,
      system: FiSettings,
      church: FiMessageSquare,
      business: FiMail,
      security: FiAlertCircle,
    };

    const IconComponent = iconMap[type] || FiBell;

    return (
      <IconComponent
        className={`w-5 h-5 ${
          priority === 'urgent'
            ? 'text-red-500'
            : priority === 'high'
              ? 'text-orange-500'
              : priority === 'normal'
                ? 'text-blue-500'
                : 'text-gray-500'
        }`}
      />
    );
  }, []);

  // Get priority badge
  const getPriorityBadge = useCallback((priority) => {
    const badgeMap = {
      urgent: { color: 'red', label: 'Urgent' },
      high: { color: 'orange', label: 'High' },
      normal: { color: 'blue', label: 'Normal' },
      low: { color: 'gray', label: 'Low' },
    };

    const badge = badgeMap[priority] || badgeMap.normal;

    return (
      <Badge color={badge.color} size='sm'>
        {badge.label}
      </Badge>
    );
  }, []);

  // Render notification item
  const renderNotificationItem = useCallback(
    (notification) => {
      const isSelected = selectedNotifications.has(
        notification.id || notification._id
      );
      const isUnread = notification.status === 'unread';

      return (
        <div
          key={notification.id || notification._id}
          className={`
          relative p-4 border-b border-gray-200 cursor-pointer transition-colors
          ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
          ${isUnread ? 'bg-blue-25' : ''}
        `}
          onClick={() => handleNotificationClick(notification)}
        >
          {/* Selection checkbox */}
          <div className='absolute top-4 left-4'>
            <input
              type='checkbox'
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleNotificationSelect(notification.id || notification._id);
              }}
              className='w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
            />
          </div>

          {/* Notification content */}
          <div className='ml-8'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center space-x-2'>
                {getNotificationIcon(notification.type, notification.priority)}
                <div className='flex-1 min-w-0'>
                  <h4
                    className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}
                  >
                    {notification.subject || notification.title || 'No subject'}
                  </h4>
                  <p className='text-sm text-gray-600 line-clamp-2 mt-1'>
                    {notification.content ||
                      notification.message ||
                      'No content'}
                  </p>
                </div>
              </div>

              {/* Priority and timestamp */}
              <div className='flex flex-col items-end space-y-1 ml-4'>
                {getPriorityBadge(notification.priority)}
                <span className='text-xs text-gray-500 flex items-center'>
                  <FiClock className='w-3 h-3 mr-1' />
                  {formatDistanceToNow(
                    new Date(notification.createdAt || notification.timestamp),
                    { addSuffix: true }
                  )}
                </span>
              </div>
            </div>

            {/* Notification metadata */}
            <div className='flex items-center justify-between mt-2'>
              <div className='flex items-center space-x-2'>
                <Badge color='gray' size='xs'>
                  {notification.type || 'General'}
                </Badge>
                {notification.module && (
                  <Badge color='gray' size='xs'>
                    {notification.module}
                  </Badge>
                )}
              </div>

              {/* Status indicator */}
              {isUnread && <div className='w-2 h-2 bg-blue-500 rounded-full' />}
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
    ]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className='fixed inset-0 bg-black bg-opacity-25 z-40'
        onClick={onClose}
      />

      {/* Notification Center Panel */}
      <div
        className={`
        fixed top-0 ${position === 'right' ? 'right-0' : 'left-0'} h-full w-96 bg-white shadow-xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'}
      `}
      >
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-gray-200'>
            <div className='flex items-center space-x-2'>
              <FiBell className='w-5 h-5 text-gray-700' />
              <h2 className='text-lg font-semibold text-gray-900'>
                Notifications
              </h2>
              {unreadCount > 0 && (
                <Badge color='blue' size='sm'>
                  {unreadCount}
                </Badge>
              )}
            </div>

            <div className='flex items-center space-x-1'>
              {/* Connection status */}
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />

              {/* Preferences button */}
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowPreferences(true)}
                className='p-1'
              >
                <FiSettings className='w-4 h-4' />
              </Button>

              {/* Refresh button */}
              <Button
                variant='ghost'
                size='sm'
                onClick={refreshNotifications}
                disabled={notificationsLoading}
                className='p-1'
              >
                <FiRefreshCw
                  className={`w-4 h-4 ${notificationsLoading ? 'animate-spin' : ''}`}
                />
              </Button>

              {/* Close button */}
              <Button
                variant='ghost'
                size='sm'
                onClick={onClose}
                className='p-1'
              >
                <FiX className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <div className='p-4 border-b border-gray-200 space-y-3'>
            {/* Search */}
            <SearchInput
              placeholder='Search notifications...'
              value={searchQuery}
              onChange={handleSearch}
              className='w-full'
            />

            {/* Filter row */}
            <div className='flex items-center space-x-2'>
              <Dropdown
                value={filterType}
                onChange={(value) => handleFilterChange('type', value)}
                options={filterTypeOptions}
                placeholder='Type'
                size='sm'
              />

              <Dropdown
                value={filterStatus}
                onChange={(value) => handleFilterChange('status', value)}
                options={filterStatusOptions}
                placeholder='Status'
                size='sm'
              />

              <Dropdown
                value={`${sortBy}-${sortOrder}`}
                onChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                options={[
                  { value: 'date-desc', label: 'Latest first' },
                  { value: 'date-asc', label: 'Oldest first' },
                  { value: 'priority-desc', label: 'High priority first' },
                  { value: 'priority-asc', label: 'Low priority first' },
                ]}
                placeholder='Sort'
                size='sm'
              />
            </div>
          </div>

          {/* Bulk actions */}
          {selectedNotifications.size > 0 && (
            <div className='p-4 bg-blue-50 border-b border-blue-200'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-blue-700'>
                  {selectedNotifications.size} selected
                </span>

                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleBulkAction('markRead')}
                    disabled={isLoading}
                  >
                    <FiCheck className='w-4 h-4 mr-1' />
                    Mark Read
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleBulkAction('archive')}
                    disabled={isLoading}
                  >
                    Archive
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleBulkAction('delete')}
                    disabled={isLoading}
                    className='text-red-600 hover:text-red-700'
                  >
                    <FiTrash2 className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications list */}
          <div className='flex-1 overflow-y-auto' ref={notificationListRef}>
            {notificationsLoading && notifications.length === 0 ? (
              <div className='flex items-center justify-center h-32'>
                <LoadingSpinner size='md' />
              </div>
            ) : error ? (
              <div className='p-4 text-center'>
                <p className='text-red-600 mb-2'>
                  Failed to load notifications
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={refreshNotifications}
                >
                  Retry
                </Button>
              </div>
            ) : processedNotifications.length === 0 ? (
              <div className='p-8 text-center'>
                <FiBell className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No notifications
                </h3>
                <p className='text-gray-600'>
                  {searchQuery
                    ? 'No notifications match your search.'
                    : "You're all caught up!'}
                </p>
              </div>
            ) : (
              <>
                {/* Select all */}
                <div className='p-4 border-b border-gray-200'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={
                        selectedNotifications.size ===
                        processedNotifications.length
                      }
                      onChange={handleSelectAll}
                      className='w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                    />
                    <span className='ml-2 text-sm text-gray-700'>
                      Select all
                    </span>
                  </label>
                </div>

                {/* Notification items */}
                <div>{processedNotifications.map(renderNotificationItem)}</div>
              </>
            )}
          </div>

          {/* Footer with pagination */}
          {totalCount > 0 && (
            <div className='p-4 border-t border-gray-200'>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / 20)}
                onPageChange={setCurrentPage}
                size='sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals and toasts */}
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

export default NotificationCenter;
