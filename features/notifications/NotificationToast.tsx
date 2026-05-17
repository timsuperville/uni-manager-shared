import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FiX,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
  FiBell,
  FiEye,
  FiTrash2,
  FiArchive,
} from "react-icons/fi";
import { Button, Avatar } from "@shared/components/ui";
import { logger } from "@shared/utils/logger";

// ── Types ────────────────────────────────────────────────────────────────────

export type ToastType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "notification";
export type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface ToastAction {
  type?: "view" | "archive" | string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: string;
  closeOnClick?: boolean;
  callback?: (notification: unknown) => void;
}

/**
 * Re-export AppNotification as `Notification` for backwards compatibility.
 * All notification data in the UI layer must use this type.
 * The source of truth is NotificationAdapter.ts.
 */
export type { AppNotification as Notification } from "./NotificationAdapter";

export interface Attachment {
  url: string;
  filename?: string;
  type?: string;
  size?: number;
  thumbnail?: string;
}

export interface NotificationAction {
  label: string;
  url?: string;
  primary?: boolean;
  icon?: boolean;
}

interface NotificationToastProps {
  type?: ToastType;
  title?: string;
  message?: string;
  duration?: number;
  position?: ToastPosition;
  priority?: NotificationPriority;
  avatar?: string | null;
  actions?: ToastAction[];
  notification?: Notification | null;
  autoClose?: boolean;
  showProgress?: boolean;
  sound?: boolean;
  vibration?: boolean;
  onClose?: () => void;
  onView?: (notification: Notification | null | undefined) => void;
  onArchive?: (notification: Notification | null | undefined) => void;
  onAction?: (
    action: ToastAction,
    notification: Notification | null | undefined,
  ) => void;
  className?: string;
  resonanceId?: string;
}

interface ToastContainerProps {
  toasts?: (NotificationToastProps & { id?: string })[];
  position?: ToastPosition;
  maxToasts?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

const NotificationToast: React.FC<NotificationToastProps> = ({
  type = "info",
  title = "",
  message = "",
  duration = 5000,
  position = "top-right",
  priority = "normal",
  avatar = null,
  actions = [],
  notification = null,
  autoClose = true,
  showProgress = true,
  sound = false,
  vibration = false,
  onClose = () => {},
  onView,
  onArchive,
  onAction = () => {},
  className = "",
  resonanceId = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const toastRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (!autoClose || isPaused) return;

    startTimeRef.current = Date.now();
    remainingTimeRef.current = duration;

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed);
      const progressPercent = (remaining / duration) * 100;

      setProgress(progressPercent);

      if (remaining <= 0) {
        handleClose();
      } else {
        timerRef.current = requestAnimationFrame(updateProgress);
      }
    };

    timerRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoClose, duration, isPaused]);

  const handleMouseEnter = useCallback(() => {
    if (!autoClose) return;
    setIsPaused(true);
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      remainingTimeRef.current = Math.max(
        0,
        remainingTimeRef.current - (Date.now() - startTimeRef.current),
      );
    }
  }, [autoClose]);

  const handleMouseLeave = useCallback(() => {
    if (!autoClose || isClosing) return;
    setIsPaused(false);
  }, [autoClose, isClosing]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300);
    }, 100);
  }, [isClosing, onClose]);

  const handleActionClick = useCallback(
    (action: ToastAction) => {
      if (action.type === "view") {
        onView?.(notification);
      } else if (action.type === "archive") {
        onArchive?.(notification);
      } else if (action.callback) {
        action.callback(notification);
      } else {
        onAction(action, notification);
      }
      if (action.closeOnClick !== false) handleClose();
    },
    [notification, onView, onArchive, onAction, handleClose],
  );

  // Sound & vibration
  useEffect(() => {
    if (sound && typeof Audio !== "undefined") {
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch((e) => {
          if (import.meta.env.DEV) logger.warn(e);
        });
      } catch {
        // Silently ignore
      }
    }

    if (vibration && typeof navigator !== "undefined" && navigator.vibrate) {
      const vibrationPattern: Record<NotificationPriority, number[]> = {
        low: [100],
        normal: [200],
        high: [100, 50, 100],
        urgent: [200, 100, 200, 100, 200],
      };
      navigator.vibrate(vibrationPattern[priority] ?? vibrationPattern.normal);
    }
  }, [sound, vibration, priority]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible || isClosing) return;
      if (event.key === "Escape") {
        handleClose();
      } else if (event.key === "Enter" || event.key === " ") {
        if (actions.length > 0) handleActionClick(actions[0]);
        else onView?.(notification);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isVisible,
    isClosing,
    actions,
    handleClose,
    handleActionClick,
    onView,
    notification,
  ]);

  const getIcon = useCallback(() => {
    const iconMap: Record<
      ToastType,
      {
        icon: React.ComponentType<{ className?: string }>;
        color: string;
        bg: string;
      }
    > = {
      success: {
        icon: FiCheck,
        color: "text-green-400",
        bg: "bg-green-500 bg-opacity-10",
      },
      error: {
        icon: FiAlertCircle,
        color: "text-red-400",
        bg: "bg-red-500 bg-opacity-10",
      },
      warning: {
        icon: FiAlertTriangle,
        color: "text-orange-400",
        bg: "bg-orange-500 bg-opacity-10",
      },
      info: {
        icon: FiInfo,
        color: "text-blue-400",
        bg: "bg-blue-500 bg-opacity-10",
      },
      notification: {
        icon: FiBell,
        color: "text-()",
        bg: "bg-()",
      },
    };
    const config = iconMap[type] ?? iconMap.info;
    const Icon = config.icon;
    return (
      <div
        className={`p-2 rounded-xl flex items-center justify-center ${config.bg}`}
      >
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
    );
  }, [type]);

  const getToastStyles = useCallback(() => {
    const base =
      "relative flex items-start space-x-3 p-4 rounded-xl glass-card border transition-all duration-300 ease-in-out max-w-sm overflow-hidden";
    const typeStyles: Record<ToastType, string> = {
      success: "border-() text-() shadow-[0_8px_32px_rgba(16,185,129,0.15)]",
      error: "border-() text-() shadow-[0_8px_32px_rgba(239,68,68,0.2)]",
      warning: "border-() text-() shadow-[0_8px_32px_rgba(245,158,11,0.15)]",
      info: "border-() text-() shadow-[0_8px_32px_rgba(59,130,246,0.15)]",
      notification: "border-() text-()",
    };
    const priorityStyles: Record<NotificationPriority, string> = {
      low: "",
      normal: "",
      high: "border-() border-opacity-50 shadow-[0_0_16px_var(--accent-amber-glow)]",
      urgent:
        "border-red-500 border-opacity-70 shadow-[0_0_24px_rgba(239,68,68,0.4)] animate-pulse",
    };
    const positionStyles: Record<ToastPosition, string> = {
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "top-center": "top-4 left-1/2 transform -translate-x-1/2",
      "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
    };
    const animation = isVisible
      ? "opacity-100 translate-y-0 scale-100"
      : "opacity-0 translate-y-2 scale-95";

    return `${base} ${typeStyles[type] ?? typeStyles.info} ${priorityStyles[priority] ?? ""} ${positionStyles[position] ?? positionStyles["top-right"]} ${animation} fixed z-50 ${className}`;
  }, [type, priority, position, isVisible, className]);

  const renderDefaultActions = useCallback(() => {
    const defaults: ToastAction[] = [];
    if (onView && notification)
      defaults.push({
        type: "view",
        icon: FiEye,
        label: "View",
        variant: "ghost",
      });
    if (onArchive && notification)
      defaults.push({
        type: "archive",
        icon: FiArchive,
        label: "Archive",
        variant: "ghost",
      });
    return [...defaults, ...actions];
  }, [onView, onArchive, notification, actions]);

  if (!isVisible && !isClosing) return null;

  const allActions = renderDefaultActions();

  return (
    <div
      ref={toastRef}
      className={getToastStyles()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={0}
    >
      {/* Progress bar */}
      {showProgress && autoClose && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-() z-20">
          <div
            ref={progressRef}
            className={`h-full transition-all duration-100 ease-linear ${
              type === "success"
                ? "bg-green-500 shadow-[0_0_8px_currentColor]"
                : type === "error"
                  ? "bg-red-500 shadow-[0_0_8px_currentColor]"
                  : type === "warning"
                    ? "bg-orange-400 shadow-[0_0_8px_currentColor]"
                    : type === "info"
                      ? "bg-blue-400 shadow-[0_0_8px_currentColor]"
                      : "bg-() shadow-[0_0_8px_var(--primary-glow)]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="shrink-0 z-10 pt-0.5">
        {avatar ? (
          <Avatar src={avatar} alt="Notification" size="sm" />
        ) : (
          getIcon()
        )}
      </div>

      <div className="flex-1 min-w-0 z-10">
        {title && (
          <h4 className="text-sm font-semibold mb-0.5 mt-0.5 truncate text-() tracking-tight">
            {title}
          </h4>
        )}
        {message && (
          <p className="text-[13px] text-() opacity-90 line-clamp-3 leading-snug">
            {message}
          </p>
        )}
        {resonanceId && (
          <div className="mt-1.5 font-mono text-[10px] text-() opacity-70 break-all select-all flex items-center bg-black/20 px-1.5 py-0.5 rounded w-fit">
            <span className="mr-1 text-[8px] uppercase tracking-widest font-bold">
              Ref
            </span>{" "}
            {resonanceId}
          </div>
        )}

        {allActions.length > 0 && (
          <div className="flex items-center space-x-2 mt-3">
            {allActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  className={`
                    flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all
                    ${action.variant === "primary" ? "bg-() text-white shadow-md hover:brightness-110" : "bg-() border border-() text-() hover:text-() hover:bg-()"}
                  `}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 z-10">
        <button
          onClick={handleClose}
          className="church-cancel-btn p-1.5 rounded-md"
          aria-label="Close notification"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── ToastContainer ────────────────────────────────────────────────────────────

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts = [],
  position = "top-right",
  maxToasts = 5,
}) => {
  const visibleToasts = toasts.slice(0, maxToasts);

  return (
    <div
      className={`fixed z-50 pointer-events-none ${
        position.includes("top") ? "top-4" : "bottom-4"
      } ${
        position.includes("right")
          ? "right-4"
          : position.includes("left")
            ? "left-4"
            : "left-1/2 transform -translate-x-1/2"
      }`}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="space-y-2 pointer-events-auto">
        {visibleToasts.map((toast, index) => (
          <NotificationToast
            key={toast.id || index}
            {...toast}
            position={position}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationToast;
