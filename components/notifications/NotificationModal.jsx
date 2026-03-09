import React, { useState, useCallback, useEffect } from "react";
import {
  FiX,
  FiCheck,
  FiArchive,
  FiTrash2,
  FiClock,
  FiUser,
  FiMail,
  FiMessageSquare,
  FiAlertCircle,
  FiSettings,
  FiEye,
  FiExternalLink,
  FiDownload,
  FiShare2,
  FiFlag,
  FiReply,
  FiForward,
} from "react-icons/fi";
import { format } from "date-fns";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Tooltip } from "../ui/Tooltip";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Modal } from "../ui/Modal";

/**
 * NotificationModal - Detailed notification display and action modal
 *
 * Features:
 * - Rich notification content display with attachments
 * - Action buttons (mark as read, archive, delete, reply, forward)
 * - Notification metadata and delivery status
 * - Related notifications and conversation history
 * - Attachment viewing and downloading
 * - Rich text content rendering
 * - Interactive elements (buttons, links)
 * - Accessibility compliant
 */
const NotificationModal = ({
  notification,
  isOpen = false,
  onClose = () => {},
  onMarkAsRead = () => {},
  onArchive = () => {},
  onDelete = () => {},
  onReply = () => {},
  onForward = () => {},
  className = "",
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Handle action with loading state
  const handleAction = useCallback(
    async (action, actionFn, successMessage) => {
      setIsLoading(true);
      setActionStatus(null);

      try {
        await actionFn(notification.id || notification._id);
        setActionStatus({ type: "success", message: successMessage });

        // Auto-close modal after successful action (except for mark as read)
        if (action !== "markRead") {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (_error) {
        // console.error(`Failed to ${action} notification:`, error);
        setActionStatus({
          type: "error",
          message: `Failed to ${action} notification`,
        });
      } finally {
        setIsLoading(false);
        setTimeout(() => setActionStatus(null), 3000);
      }
    },
    [notification, onClose],
  );

  // Handle mark as read
  const handleMarkAsRead = useCallback(() => {
    handleAction("markRead", onMarkAsRead, "Marked as read");
  }, [handleAction, onMarkAsRead]);

  // Handle archive
  const handleArchive = useCallback(() => {
    handleAction("archive", onArchive, "Archived successfully");
  }, [handleAction, onArchive]);

  // Handle delete
  const handleDelete = useCallback(() => {
    setConfirmDelete(true);
  }, []);

  const handleDeleteConfirmed = useCallback(() => {
    setConfirmDelete(false);
    handleAction("delete", onDelete, "Deleted successfully");
  }, [handleAction, onDelete]);

  // Handle reply
  const handleReply = useCallback(() => {
    if (onReply) {
      onReply(notification);
    }
  }, [onReply, notification]);

  // Handle forward
  const handleForward = useCallback(() => {
    if (onForward) {
      onForward(notification);
    }
  }, [onForward, notification]);

  // Handle attachment download
  const handleDownloadAttachment = useCallback((attachment) => {
    try {
      const link =
        typeof document !== "undefined" && document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.filename || "attachment";
      typeof document !== "undefined" && document.body.appendChild(link);
      link.click();
      typeof document !== "undefined" && document.body.removeChild(link);
    } catch (_error) {
      // console.error('Failed to download attachment:', error);
      setActionStatus({
        type: "error",
        message: "Failed to download attachment",
      });
    }
  }, []);

  // Handle external link
  const handleExternalLink = useCallback((url) => {
    typeof window !== "undefined" &&
      window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  // Get notification icon
  const getNotificationIcon = useCallback(() => {
    const iconMap = {
      user: FiUser,
      system: FiSettings,
      church: FiMessageSquare,
      business: FiMail,
      security: FiAlertCircle,
      workflow: FiSettings,
    };

    const IconComponent = iconMap[notification?.type] || FiMessageSquare;

    return (
      <IconComponent
        className={`w-6 h-6 ${
          notification?.priority === "urgent"
            ? "text-red-500"
            : notification?.priority === "high"
              ? "text-orange-500"
              : notification?.priority === "normal"
                ? "text-blue-500"
                : "text-gray-500"
        }`}
      />
    );
  }, [notification]);

  // Get priority badge
  const getPriorityBadge = useCallback(() => {
    const badgeMap = {
      urgent: { color: "red", label: "Urgent" },
      high: { color: "orange", label: "High" },
      normal: { color: "blue", label: "Normal" },
      low: { color: "gray", label: "Low" },
    };

    const badge = badgeMap[notification?.priority] || badgeMap.normal;

    return (
      <Badge color={badge.color} size="sm">
        {badge.label}
      </Badge>
    );
  }, [notification]);

  // Get status badge
  const getStatusBadge = useCallback(() => {
    const statusMap = {
      unread: { color: "blue", label: "Unread" },
      read: { color: "green", label: "Read" },
      archived: { color: "gray", label: "Archived" },
    };

    const status = statusMap[notification?.status] || statusMap.unread;

    return (
      <Badge color={status.color} size="sm">
        {status.label}
      </Badge>
    );
  }, [notification]);

  // Render attachments
  const renderAttachments = useCallback(() => {
    if (!notification?.attachments || notification.attachments.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments</h4>
        <div className="space-y-2">
          {notification.attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="shrink-0">
                  {attachment.type?.startsWith("image/") ? (
                    <img
                      src={attachment.thumbnail || attachment.url}
                      alt={attachment.filename}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <FiDownload className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {attachment.filename || "Attachment"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {attachment.size &&
                      `${(attachment.size / 1024).toFixed(1)} KB`}
                    {attachment.type && ` • ${attachment.type}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {attachment.type?.startsWith("image/") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAttachment(attachment)}
                  >
                    <FiEye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadAttachment(attachment)}
                >
                  <FiDownload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [notification, handleDownloadAttachment]);

  // Render action buttons
  const renderActionButtons = useCallback(() => {
    if (!notification?.actions || notification.actions.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Actions</h4>
        <div className="flex flex-wrap gap-2">
          {notification.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.primary ? "primary" : "outline"}
              size="sm"
              onClick={() => handleExternalLink(action.url)}
              disabled={isLoading}
            >
              {action.icon && <FiExternalLink className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }, [notification, handleExternalLink, isLoading]);

  // Render delivery status
  const renderDeliveryStatus = useCallback(() => {
    if (!notification?.deliveryStatus) {
      return null;
    }

    const { deliveryStatus } = notification;

    return (
      <div className="mt-4">
        <button
          onClick={() => setShowDeliveryDetails(!showDeliveryDetails)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <FiMessageSquare className="w-4 h-4 mr-1" />
          Delivery Details
        </button>

        {showDeliveryDetails && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              {Object.entries(deliveryStatus).map(([channel, status]) => (
                <div
                  key={channel}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm capitalize">{channel}</span>
                  <Badge
                    color={
                      status === "delivered"
                        ? "green"
                        : status === "failed"
                          ? "red"
                          : status === "pending"
                            ? "orange"
                            : "gray"
                    }
                    size="xs"
                  >
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [notification, showDeliveryDetails]);

  // Render content with rich formatting
  const renderContent = useCallback(() => {
    const content = notification?.content || notification?.message || "";

    // Simple rich text rendering (can be enhanced with a proper rich text library)
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>',
      );

    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  }, [notification]);

  if (!notification) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={notification.subject || notification.title || "Notification"}
        size="lg"
        className={className}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getNotificationIcon()}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {notification.subject || notification.title || "Notification"}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {getPriorityBadge()}
                  {getStatusBadge()}
                  <Badge color="gray" size="sm">
                    {notification.type || "General"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                From
              </label>
              <div className="flex items-center space-x-2 mt-1">
                {notification.sender?.avatar && (
                  <Avatar
                    src={notification.sender.avatar}
                    alt={notification.sender.name}
                    size="sm"
                  />
                )}
                <span className="text-sm text-gray-900">
                  {notification.sender?.name || notification.module || "System"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Time
              </label>
              <div className="flex items-center space-x-1 mt-1">
                <FiClock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">
                  {format(
                    new Date(notification.createdAt || notification.timestamp),
                    "PPpp",
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Message
              </h4>
              {renderContent()}
            </div>

            {/* Attachments */}
            {renderAttachments()}

            {/* Action buttons */}
            {renderActionButtons()}

            {/* Delivery status */}
            {renderDeliveryStatus()}
          </div>

          {/* Status message */}
          {actionStatus && (
            <div
              className={`p-3 rounded-lg ${
                actionStatus.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {actionStatus.message}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2">
            {onReply && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReply}
                disabled={isLoading}
              >
                <FiReply className="w-4 h-4 mr-2" />
                Reply
              </Button>
            )}

            {onForward && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleForward}
                disabled={isLoading}
              >
                <FiForward className="w-4 h-4 mr-2" />
                Forward
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {notification.status === "unread" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsRead}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <FiCheck className="w-4 h-4 mr-2" />
                )}
                Mark as Read
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isLoading}
            >
              <FiArchive className="w-4 h-4 mr-2" />
              Archive
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700"
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Attachment viewer modal */}
      {selectedAttachment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAttachment(null)}
          title={selectedAttachment.filename || "Attachment"}
          size="xl"
        >
          <div className="flex items-center justify-center">
            <img
              src={selectedAttachment.url}
              alt={selectedAttachment.filename}
              className="max-w-full max-h-96 object-contain"
            />
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => handleDownloadAttachment(selectedAttachment)}
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Delete confirmation modal (replaces window.confirm) ── */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Notification"
        size="sm"
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Are you sure you want to delete this notification? This action cannot
          be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirmed}
            disabled={isLoading}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default NotificationModal;
