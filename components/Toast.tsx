// Unified Toast component for all Uni-Manager applications
import React, { useState, useEffect } from "react";

type ToastType = "info" | "success" | "warning" | "error";
type ToastPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  position?: ToastPosition;
  showCloseButton?: boolean;
  className?: string;
}

const icons: Record<ToastType | "close", React.ReactElement> = {
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  close: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const typeStyles: Record<ToastType, string> = {
  success: "bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-200",
  error: "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-200",
  warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 text-yellow-800 dark:text-yellow-200",
  info: "bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-200",
};

const iconColors: Record<ToastType, string> = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 5000,
  onClose,
  showCloseButton = true,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const baseStyles = [
    "flex items-start p-4 rounded-lg shadow-lg border-l-4",
    "transition-all duration-300 ease-in-out transform max-w-sm w-full",
    isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
    className,
  ].join(" ");

  return (
    <div className={`${baseStyles} ${typeStyles[type]}`}>
      <div className={`shrink-0 ${iconColors[type]}`}>{icons[type]}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium leading-5">{message}</p>
      </div>
      {showCloseButton && (
        <div className="ml-4 shrink-0">
          <button
            type="button"
            className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-blue-600 transition-colors duration-200"
            onClick={handleClose}
            aria-label="Close notification"
          >
            {icons.close}
          </button>
        </div>
      )}
    </div>
  );
};

export default Toast;
export type { ToastType, ToastPosition, ToastProps };
