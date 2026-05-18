// Unified Toast Provider for all Uni-Manager applications
import React, { useState, useCallback, createContext, useContext } from 'react';
import Toast from './Toast';
import type { ToastType, ToastPosition } from './Toast';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ToastOptions {
  duration?: number;
  showCloseButton?: boolean;
}

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  showCloseButton: boolean;
}

type ShowToastFn = (message: string, options?: ToastOptions) => number;

interface ToastContextValue {
  showSuccess: ShowToastFn;
  showError: ShowToastFn;
  showWarning: ShowToastFn;
  showInfo: ShowToastFn;
  showToast: (
    message: string,
    type?: ToastType,
    options?: ToastOptions
  ) => number;
  addToast: (
    message: string,
    type?: ToastType,
    options?: ToastOptions
  ) => number;
  removeToast: (id: number) => void;
  clearAllToasts: () => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

// ── Provider ───────────────────────────────────────────────────────────────────

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
  className?: string;
}

const positionClasses: Record<ToastPosition, string> = {
  'top-right': 'fixed top-4 right-4 z-50',
  'top-left': 'fixed top-4 left-4 z-50',
  'bottom-right': 'fixed bottom-4 right-4 z-50',
  'bottom-left': 'fixed bottom-4 left-4 z-50'
};

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
  className = ''
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options: ToastOptions = {}
    ): number => {
      const id = Date.now() + Math.random();
      const { duration = 5000, showCloseButton = true } = options;
      const newToast: ToastItem = {
        id,
        message,
        type,
        duration,
        showCloseButton
      };
      setToasts(prev => [...prev, newToast].slice(-maxToasts));
      return id;
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => setToasts([]), []);

  const showSuccess: ShowToastFn = useCallback(
    (m, o) => addToast(m, 'success', o),
    [addToast]
  );
  const showError: ShowToastFn = useCallback(
    (m, o) => addToast(m, 'error', o),
    [addToast]
  );
  const showWarning: ShowToastFn = useCallback(
    (m, o) => addToast(m, 'warning', o),
    [addToast]
  );
  const showInfo: ShowToastFn = useCallback(
    (m, o) => addToast(m, 'info', o),
    [addToast]
  );

  const value: ToastContextValue = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast: addToast,
    addToast,
    removeToast,
    clearAllToasts,
    toasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`${positionClasses[position]} space-y-2 max-w-sm ${className}`}
      >
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            showCloseButton={toast.showCloseButton}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export { ToastProvider as default };

// Hook for convenient toast usage
export const useToastNotification = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo
  };
};
