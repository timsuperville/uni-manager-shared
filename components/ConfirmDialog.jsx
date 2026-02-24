// Unified ConfirmDialog component for all Uni-Manager applications
import React from "react";
import PropTypes from "prop-types";

// Icon components using inline SVG for consistency
const icons = {
  info: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  ),
  danger: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  ),
  success: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  close: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
};

const ConfirmDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  size = "medium",
  showCloseButton = true,
  isLoading = false,
  className = "",
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const getTypeStyles = () => {
    const styles = {
      info: {
        iconColor: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-100 dark:bg-blue-900/20",
        confirmBtn:
          "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      },
      success: {
        iconColor: "text-green-600 dark:text-green-400",
        iconBg: "bg-green-100 dark:bg-green-900/20",
        confirmBtn:
          "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
      },
      warning: {
        iconColor: "text-yellow-600 dark:text-yellow-400",
        iconBg: "bg-yellow-100 dark:bg-yellow-900/20",
        confirmBtn:
          "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
      },
      danger: {
        iconColor: "text-red-600 dark:text-red-400",
        iconBg: "bg-red-100 dark:bg-red-900/20",
        confirmBtn: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      },
    };
    return styles[type] || styles.info;
  };

  const getSizeStyles = () => {
    const sizes = {
      small: "max-w-md",
      medium: "max-w-lg",
      large: "max-w-2xl",
    };
    return sizes[size] || sizes.medium;
  };

  const typeStyles = getTypeStyles();
  const sizeClass = getSizeStyles();

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleBackdropClick}
      >
        <div
          className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity"
          aria-hidden="true"
        />

        {/* Center alignment trick */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div
          className={`
          inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left 
          overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6 w-full
          ${sizeClass} ${className}
        `}
        >
          {/* Header */}
          <div className="sm:flex sm:items-start">
            {/* Icon */}
            <div
              className={`
              mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full 
              ${typeStyles.iconBg} sm:mx-0 sm:h-10 sm:w-10
            `}
            >
              <div className={typeStyles.iconColor}>
                {icons[type] || icons.info}
              </div>
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3
                className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100"
                id="modal-title"
              >
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </div>

            {/* Close button */}
            {showCloseButton && (
              <button
                type="button"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onClose}
                aria-label="Close dialog"
              >
                {icons.close}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
            <button
              type="button"
              className={`
                w-full inline-flex justify-center rounded-md border border-transparent 
                px-4 py-2 text-base font-medium shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-offset-2 
                sm:ml-3 sm:w-auto sm:text-sm transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${typeStyles.confirmBtn}
              `}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading...
                </div>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(["info", "success", "warning", "danger"]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  showCloseButton: PropTypes.bool,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
};

export default ConfirmDialog;
