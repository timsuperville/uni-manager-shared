/**
 * Session Warning Component
 * Displays warning when session is about to expire and provides options to extend
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.js";

const SessionWarning = ({
  position = "top-right",
  autoHide = false,
  hideDelay = 10000,
  theme = "default",
  showTimeRemaining = true,
  customActions = null,
}) => {
  const {
    sessionWarning,
    timeUntilExpiry,
    extendSession,
    logout,
    clearError,
    isTokenExpiringSoon,
  } = useAuth();

  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeUntilExpiry);
  const [isExtending, setIsExtending] = useState(false);

  // Update visibility based on session warning or token expiring soon
  useEffect(() => {
    setIsVisible(sessionWarning || isTokenExpiringSoon);
  }, [sessionWarning, isTokenExpiringSoon]);

  // Update time remaining
  useEffect(() => {
    setTimeLeft(timeUntilExpiry);
  }, [timeUntilExpiry]);

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, isVisible]);

  // Countdown timer
  useEffect(() => {
    if (isVisible && showTimeRemaining) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, showTimeRemaining]);

  // Handle extend session
  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await extendSession();
      setIsVisible(false);
    } catch (_error) {
      // console.error('Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsVisible(false);
  };

  // Handle dismiss
  const handleDismiss = () => {
    clearError();
    setIsVisible(false);
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Get position classes
  const getPositionClasses = () => {
    const positions = {
      "top-left": "top-4 left-4",
      "top-right": "top-4 right-4",
      "top-center": "top-4 left-1/2 transform -translate-x-1/2",
      "bottom-left": "bottom-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
      center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
    };

    return positions[position] || positions["top-right"];
  };

  // Get theme classes
  const getThemeClasses = () => {
    const themes = {
      default: "bg-yellow-50 border-yellow-200 text-yellow-800",
      warning: "bg-orange-50 border-orange-200 text-orange-800",
      danger: "bg-red-50 border-red-200 text-red-800",
      dark: "bg-gray-800 border-gray-700 text-white",
    };

    return themes[theme] || themes.default;
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed z-50 min-w-80 max-w-md p-4 border rounded-lg shadow-lg
        ${getPositionClasses()}
        ${getThemeClasses()}
        animate-in slide-in-from-top-2 duration-300
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 mr-2 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-sm font-semibold">Session Expiring Soon</h3>
        </div>

        <button
          onClick={handleDismiss}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss warning"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Message */}
      <div className="mb-4">
        <p className="text-sm">
          Your session will expire soon. Would you like to extend your session
          or log out?
        </p>

        {showTimeRemaining && (
          <p className="text-xs mt-2 font-medium">
            Time remaining: {formatTimeRemaining(timeLeft)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        {customActions ? (
          customActions({
            handleExtendSession,
            handleLogout,
            handleDismiss,
            isExtending,
          })
        ) : (
          <>
            <button
              onClick={handleExtendSession}
              disabled={isExtending}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isExtending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Extending...
                </>
              ) : (
                "Extend Session"
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors bg-gray-600 hover:bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Log Out
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionWarning;
