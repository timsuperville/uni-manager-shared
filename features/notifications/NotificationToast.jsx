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
  FiExternalLink,
} from "react-icons/fi";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";

/**
 * NotificationToast - Real-time toast notification component
 *
 * Features:
 * - Multiple toast types (success, error, warning, info, notification)
 * - Auto-dismiss with configurable duration
 * - Manual dismiss with close button
 * - Priority-based styling and positioning
 * - Animation effects (slide in/out, fade)
 * - Action buttons (view, archive, dismiss)
 * - Rich content support with avatars and icons
 * - Touch/mobile-friendly interactions
 * - Accessibility compliant (ARIA labels, keyboard navigation)
 * - Position management (top-right, top-left, bottom-right, bottom-left)
 * - Sound and vibration integration
 */
const NotificationToast = ({
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
  onView = () => {},
  onArchive = () => {},
  onAction = () => {},
  className = "",
}) => {
  // State management
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Refs
  const toastRef = useRef(null);
  const progressRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingTimeRef = useRef(duration);

  // Toast entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

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
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [autoClose, duration, isPaused]);

  // Pause timer on hover/focus
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

  // Resume timer on mouse leave/blur
  const handleMouseLeave = useCallback(() => {
    if (!autoClose || isClosing) return;

    setIsPaused(false);
  }, [autoClose, isClosing]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isClosing) return;

    setIsClosing(true);

    // Cancel any running timer
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }

    // Exit animation
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300);
    }, 100);
  }, [isClosing, onClose]);

  // Handle action click
  const handleActionClick = useCallback(
    (action) => {
      if (action.type === "view" && onView) {
        onView(notification);
      } else if (action.type === "archive" && onArchive) {
        onArchive(notification);
      } else if (action.callback) {
        action.callback(notification);
      } else if (onAction) {
        onAction(action, notification);
      }

      if (action.closeOnClick !== false) {
        handleClose();
      }
    },
    [notification, onView, onArchive, onAction, handleClose],
  );

  // Sound and vibration effects
  useEffect(() => {
    if (sound && typeof Audio !== "undefined") {
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch((e) => {
          if (import.meta.env.DEV) console.warn(e);
        });
      } catch (_error) {
        // console.warn('Failed to play notification sound:', error);
      }
    }

    if (vibration && typeof navigator !== "undefined" && navigator.vibrate) {
      const vibrationPattern = {
        low: [100],
        normal: [200],
        high: [100, 50, 100],
        urgent: [200, 100, 200, 100, 200],
      };

      typeof navigator !== "undefined" &&
        navigator.vibrate(
          vibrationPattern[priority] || vibrationPattern.normal,
        );
    }
  }, [sound, vibration, priority]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isVisible || isClosing) return;

      switch (event.key) {
        case "Escape":
          handleClose();
          break;
        case "Enter":
        case " ":
          if (actions.length > 0) {
            handleActionClick(actions[0]);
          } else if (onView) {
            onView(notification);
          }
          break;
      }
    };

    typeof document !== "undefined" &&
      document.addEventListener("keydown", handleKeyDown);
    return () =>
      typeof document !== "undefined" &&
      document.removeEventListener("keydown", handleKeyDown);
  }, [
    isVisible,
    isClosing,
    actions,
    handleClose,
    handleActionClick,
    onView,
    notification,
  ]);

  // Get toast icon
  const getIcon = useCallback(() => {
    const iconMap = {
      success: { icon: FiCheck, color: "text-green-500" },
      error: { icon: FiAlertCircle, color: "text-red-500" },
      warning: { icon: FiAlertTriangle, color: "text-orange-500" },
      info: { icon: FiInfo, color: "text-blue-500" },
      notification: { icon: FiBell, color: "text-purple-500" },
    };

    const config = iconMap[type] || iconMap.info;
    const Icon = config.icon;

    return <Icon className={`w-5 h-5 ${config.color}`} />;
  }, [type]);

  // Get toast styling
  const getToastStyles = useCallback(() => {
    const baseStyles =
      "relative flex items-start space-x-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 ease-in-out max-w-sm";

    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-orange-50 border-orange-200 text-orange-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
      notification: "bg-white border-gray-200 text-gray-800 shadow-xl",
    };

    const priorityStyles = {
      low: "",
      normal: "",
      high: "ring-2 ring-orange-400 ring-opacity-50",
      urgent: "ring-2 ring-red-500 ring-opacity-75 animate-pulse",
    };

    const positionStyles = {
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "top-center": "top-4 left-1/2 transform -translate-x-1/2",
      "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
    };

    const animationStyles = isVisible
      ? "opacity-100 translate-y-0 scale-100"
      : "opacity-0 translate-y-2 scale-95";

    return `
      ${baseStyles}
      ${typeStyles[type] || typeStyles.info}
      ${priorityStyles[priority] || priorityStyles.normal}
      ${positionStyles[position] || positionStyles["top-right"]}
      ${animationStyles}
      fixed z-50
      ${className}
    `;
  }, [type, priority, position, isVisible, className]);

  // Render default actions
  const renderDefaultActions = useCallback(() => {
    const defaultActions = [];

    if (onView && notification) {
      defaultActions.push({
        type: "view",
        icon: FiEye,
        label: "View",
        variant: "ghost",
      });
    }

    if (onArchive && notification) {
      defaultActions.push({
        type: "archive",
        icon: FiArchive,
        label: "Archive",
        variant: "ghost",
      });
    }

    return [...defaultActions, ...actions];
  }, [onView, onArchive, notification, actions]);

  if (!isVisible && !isClosing) return null;

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
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            ref={progressRef}
            className={`h-full transition-all duration-100 ease-linear ${
              type === "success"
                ? "bg-green-400"
                : type === "error"
                  ? "bg-red-400"
                  : type === "warning"
                    ? "bg-orange-400"
                    : type === "info"
                      ? "bg-blue-400"
                      : "bg-purple-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="shrink-0">
        {avatar ? (
          <Avatar src={avatar} alt="Notification" size="sm" />
        ) : (
          getIcon()
        )}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-medium mb-1 truncate">{title}</h4>
        )}

        {message && (
          <p className="text-sm opacity-90 line-clamp-3">{message}</p>
        )}

        {/* Actions */}
        {renderDefaultActions().length > 0 && (
          <div className="flex items-center space-x-2 mt-3">
            {renderDefaultActions().map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="xs"
                  onClick={() => handleActionClick(action)}
                  className={`${
                    type === "notification"
                      ? "text-gray-600 hover:text-gray-800"
                      : ""
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3 mr-1" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Close button */}
      <div className="shrink-0">
        <Button
          variant="ghost"
          size="xs"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close notification"
        >
          <FiX className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

/**
 * ToastContainer - Container for managing multiple toast notifications
 */
export const ToastContainer = ({
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
            style={{
              zIndex: 1000 - index,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationToast;
