// Unified Toast Provider for all Uni-Manager applications
import React, { useState, useCallback, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import Toast from './Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({
  children,
  position = 'top-right',
  maxToasts = 5,
  className = '',
}) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    (message, type = 'info', options = {}) => {
      const id = Date.now() + Math.random();
      const {
        duration = 5000,
        showCloseButton = true,
        ...restOptions
      } = options;

      const newToast = {
        id,
        message,
        type,
        duration,
        showCloseButton,
        ...restOptions,
      };

      setToasts((prev) => {
        const updatedToasts = [...prev, newToast];
        // Limit the number of toasts
        return updatedToasts.slice(-maxToasts);
      });

      return id;
    },
    [maxToasts],
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback(
    (message, options) => addToast(message, 'success', options),
    [addToast],
  );
  const showError = useCallback(
    (message, options) => addToast(message, 'error', options),
    [addToast],
  );
  const showWarning = useCallback(
    (message, options) => addToast(message, 'warning', options),
    [addToast],
  );
  const showInfo = useCallback(
    (message, options) => addToast(message, 'info', options),
    [addToast],
  );

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    addToast,
    removeToast,
    clearAllToasts,
    toasts,
  };

  const getContainerPosition = () => {
    const positions = {
      'top-right': 'fixed top-4 right-4 z-50',
      'top-left': 'fixed top-4 left-4 z-50',
      'bottom-right': 'fixed bottom-4 right-4 z-50',
      'bottom-left': 'fixed bottom-4 left-4 z-50',
    };
    return positions[position] || positions['top-right'];
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div
        className={`${getContainerPosition()} space-y-2 max-w-sm ${className}`}
      >
        {toasts.map((toast) => (
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

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf([
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]),
  maxToasts: PropTypes.number,
  className: PropTypes.string,
};

// Export both named and default for compatibility
export { ToastProvider as default };

// Hook for convenient toast usage
export const useToastNotification = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
  };
};
