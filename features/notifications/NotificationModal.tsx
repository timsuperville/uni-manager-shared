import React, { useState, useCallback } from "react";
import {
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
  FiDownload,
  FiCornerUpLeft as FiReply,
  FiCornerUpRight as FiForward,
} from "react-icons/fi";
import { format } from "date-fns";
import {
  Button,
  Badge,
  Avatar,
  LoadingSpinner,
  Modal,
} from "@shared/components/ui";
import type { Notification, Attachment } from "./NotificationToast";

// ── Types ────────────────────────────────────────────────────────────────────

type ActionFn = (id: string) => Promise<void>;

interface ActionStatus {
  type: "success" | "error";
  message: string;
}

interface NotificationModalProps {
  notification: Notification;
  isOpen?: boolean;
  onClose?: () => void;
  onMarkAsRead?: ActionFn;
  onArchive?: ActionFn;
  onDelete?: ActionFn;
  onReply?: (notification: Notification) => void;
  onForward?: (notification: Notification) => void;
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{ className?: string }>;

const TYPE_ICON_MAP: Record<string, IconComponent> = {
  user: FiUser,
  system: FiSettings,
  church: FiMessageSquare,
  business: FiMail,
  security: FiAlertCircle,
  workflow: FiSettings,
};

const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  urgent: { color: "red", label: "Urgent" },
  high: { color: "orange", label: "High" },
  normal: { color: "blue", label: "Normal" },
  low: { color: "gray", label: "Low" },
};

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  unread: { color: "blue", label: "Unread" },
  read: { color: "green", label: "Read" },
  archived: { color: "gray", label: "Archived" },
};

// ── Component ────────────────────────────────────────────────────────────────

/**
 * NotificationModal - Detailed notification display and action modal
 *
 * Features:
 * - Rich notification content display with attachments
 * - Action buttons (mark as read, archive, delete, reply, forward)
 * - Notification metadata and delivery status
 * - Attachment viewing and downloading
 * - Rich text content rendering
 * - Accessibility compliant
 */
const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  isOpen = false,
  onClose = () => {},
  onMarkAsRead = async () => {},
  onArchive = async () => {},
  onDelete = async () => {},
  onReply,
  onForward,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [actionStatus, setActionStatus] = useState<ActionStatus | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const notificationId = notification.id ?? notification._id ?? "";

  // Handle action with loading state
  const handleAction = useCallback(
    async (action: string, actionFn: ActionFn, successMessage: string) => {
      setIsLoading(true);
      setActionStatus(null);
      try {
        await actionFn(notificationId);
        setActionStatus({ type: "success", message: successMessage });
        if (action !== "markRead") {
          setTimeout(() => onClose(), 1500);
        }
      } catch {
        setActionStatus({
          type: "error",
          message: `Failed to ${action} notification`,
        });
      } finally {
        setIsLoading(false);
        setTimeout(() => setActionStatus(null), 3000);
      }
    },
    [notificationId, onClose],
  );

  const handleMarkAsRead = useCallback(() => {
    handleAction("markRead", onMarkAsRead, "Marked as read");
  }, [handleAction, onMarkAsRead]);

  const handleArchive = useCallback(() => {
    handleAction("archive", onArchive, "Archived successfully");
  }, [handleAction, onArchive]);

  const handleDelete = useCallback(() => setConfirmDelete(true), []);

  const handleDeleteConfirmed = useCallback(() => {
    setConfirmDelete(false);
    handleAction("delete", onDelete, "Deleted successfully");
  }, [handleAction, onDelete]);

  const handleReply = useCallback(
    () => onReply?.(notification),
    [onReply, notification],
  );
  const handleForward = useCallback(
    () => onForward?.(notification),
    [onForward, notification],
  );

  const handleDownloadAttachment = useCallback((attachment: Attachment) => {
    try {
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.filename ?? "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setActionStatus({
        type: "error",
        message: "Failed to download attachment",
      });
    }
  }, []);

  const handleExternalLink = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  // Icon selector
  const getNotificationIcon = useCallback(() => {
    const IconComponent =
      TYPE_ICON_MAP[notification.type ?? ""] ?? FiMessageSquare;
    const priorityColor =
      notification.priority === "urgent"
        ? "text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
        : notification.priority === "high"
          ? "text-[var(--accent-amber)] drop-shadow-[0_0_8px_var(--accent-amber-glow)]"
          : notification.priority === "normal"
            ? "text-[var(--primary-resonance)]"
            : "text-[var(--text-muted)]";
    return <IconComponent className={`w-6 h-6 ${priorityColor}`} />;
  }, [notification]);

  const getPriorityBadge = useCallback(() => {
    const badge =
      PRIORITY_BADGE[notification.priority ?? "normal"] ??
      PRIORITY_BADGE.normal;
    return (
      <Badge color={badge.color} size="sm">
        {badge.label}
      </Badge>
    );
  }, [notification]);

  const getStatusBadge = useCallback(() => {
    const status =
      STATUS_BADGE[notification.status ?? "unread"] ?? STATUS_BADGE.unread;
    return (
      <Badge color={status.color} size="sm">
        {status.label}
      </Badge>
    );
  }, [notification]);

  // Attachments renderer
  const renderAttachments = useCallback(() => {
    if (!notification.attachments?.length) return null;
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-[var(--text-primary)] tracking-wide uppercase mb-2">
          Attachments
        </h4>
        <div className="space-y-2">
          {notification.attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[var(--glass-surface)] border border-[var(--glass-outline)] rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="shrink-0">
                  {attachment.type?.startsWith("image/") ? (
                    <img
                      src={attachment.thumbnail ?? attachment.url}
                      alt={attachment.filename}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[var(--primary-subtle)] border border-[var(--primary-resonance)] border-opacity-30 rounded-lg flex items-center justify-center">
                      <FiDownload className="w-5 h-5 text-[var(--text-accent)]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {attachment.filename ?? "Attachment"}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {attachment.size != null &&
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
  }, [notification.attachments, handleDownloadAttachment]);

  // Notification actions renderer
  const renderActionButtons = useCallback(() => {
    if (!notification.actions?.length) return null;
    return (
      <div className="mt-4 border-t border-[var(--glass-outline)] pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
          Available Actions
        </h4>
        <div className="flex flex-wrap gap-2">
          {notification.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => action.url && handleExternalLink(action.url)}
              disabled={isLoading}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${action.primary ? "btn-primary" : "btn-ghost"}`}
            >
              {action.icon && <FiDownload className="w-4 h-4 mr-2" />}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  }, [notification.actions, handleExternalLink, isLoading]);

  // Delivery status renderer
  const renderDeliveryStatus = useCallback(() => {
    if (!notification.deliveryStatus) return null;
    const { deliveryStatus } = notification;
    return (
      <div className="mt-4 border-t border-[var(--glass-outline)] pt-4">
        <button
          onClick={() => setShowDeliveryDetails(!showDeliveryDetails)}
          className="flex items-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <FiMessageSquare className="w-4 h-4 mr-2" />
          Delivery Details
        </button>
        {showDeliveryDetails && (
          <div className="mt-3 p-3 bg-[var(--glass-surface)] border border-[var(--glass-outline)] rounded-xl blur-backdrop">
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
                    size="sm"
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
  }, [notification.deliveryStatus, showDeliveryDetails]);

  // Rich content renderer
  const renderContent = useCallback(() => {
    const content = notification.content ?? notification.message ?? "";
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="bg-[var(--glass-surface)] border border-[var(--glass-outline)] px-1.5 py-0.5 rounded text-[var(--primary-resonance)]">$1</code>',
      )
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[var(--accent-sky)] hover:brightness-110 underline decoration-white/20 underline-offset-2">$1</a>',
      );
    return (
      <div
        className="text-[var(--text-secondary)] leading-relaxed text-[15px] space-y-4"
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
        title={notification.subject ?? notification.title ?? "Notification"}
        size="lg"
        className={className}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-[var(--primary-subtle)] border border-[var(--primary-resonance)] border-opacity-20 shadow-inner inline-flex items-center justify-center">
                {getNotificationIcon()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                  {notification.subject ?? notification.title ?? "Notification"}
                </h3>
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  {getPriorityBadge()}
                  {getStatusBadge()}
                  <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full bg-[var(--glass-surface)] border border-[var(--glass-outline)] text-[var(--text-secondary)]">
                    {notification.type ?? "General"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 glass-card rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-aurora opacity-30 mix-blend-screen pointer-events-none" />
            <div className="relative z-10">
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                From
              </label>
              <div className="flex items-center space-x-2">
                {notification.sender?.avatar && (
                  <Avatar
                    src={notification.sender.avatar}
                    alt={notification.sender.name}
                    size="sm"
                  />
                )}
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {notification.sender?.name ?? notification.module ?? "System"}
                </span>
              </div>
            </div>
            <div className="relative z-10">
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Time
              </label>
              <div className="flex items-center space-x-1.5">
                <FiClock className="w-4 h-4 text-[var(--primary-resonance)] opacity-80" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {format(
                    new Date(
                      notification.createdAt ??
                        notification.timestamp ??
                        Date.now(),
                    ),
                    "PPpp",
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 pt-2">
            <div>{renderContent()}</div>
            {renderAttachments()}
            {renderActionButtons()}
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
        <div className="mt-6 flex items-center justify-between border-t border-[var(--glass-outline)] pt-5 pb-1 gap-2 overflow-x-auto scrollbar-responsive px-1">
          <div className="flex items-center space-x-3 shrink-0">
            {onReply && (
              <button
                onClick={handleReply}
                disabled={isLoading}
                className="btn-ghost flex items-center shadow-sm"
              >
                <FiReply className="w-4 h-4 mr-2" />
                Reply
              </button>
            )}
            {onForward && (
              <button
                onClick={handleForward}
                disabled={isLoading}
                className="btn-ghost flex items-center shadow-sm"
              >
                <FiForward className="w-4 h-4 mr-2" />
                Forward
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {notification.status === "unread" && (
              <button
                onClick={handleMarkAsRead}
                disabled={isLoading}
                className="btn-primary flex items-center focus:ring-4 focus:ring-[var(--primary-glow)]"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <FiCheck className="w-4 h-4 mr-2" />
                )}
                Mark Read
              </button>
            )}
            <button
              onClick={handleArchive}
              disabled={isLoading}
              className="btn-ghost flex items-center"
            >
              <FiArchive className="w-4 h-4 mr-2" />
              Archive
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center church-cancel-btn px-4 py-2 rounded-[12px] text-[14px] font-semibold"
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Attachment viewer modal */}
      {selectedAttachment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAttachment(null)}
          title={selectedAttachment.filename ?? "Attachment"}
          size="xl"
        >
          <div className="flex items-center justify-center">
            <img
              src={selectedAttachment.url}
              alt={selectedAttachment.filename}
              className="max-w-full max-h-96 object-contain"
            />
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => handleDownloadAttachment(selectedAttachment)}
              className="btn-primary flex items-center shadow-sm"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Notification"
        size="sm"
      >
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Are you sure you want to delete this notification? This action cannot
          be undone.
        </p>
        <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-[var(--glass-outline)]">
          <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </button>
          <button
            className="church-cancel-btn px-4 py-2 rounded-xl text-sm font-semibold flex items-center shadow-sm"
            onClick={handleDeleteConfirmed}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <FiTrash2 className="w-4 h-4 mr-2" />
            )}
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
};

export { NotificationModal };
export default NotificationModal;
