import axios from "axios";
import { env } from "../config/env";

// Get API URL from environment
const API_URL = env.apiUrl;

class ErrorReportingService {
  /**
   * Log an error to the backend
   * @param {Error} error - The error object
   * @param {Object} errorInfo - React error info (component stack)
   * @param {Object} metadata - Additional context (user ID, etc.)
   */
  async logError(error, errorInfo = {}, metadata = {}) {
    try {
      // Don't log in development if you want to keep console clean,
      // but usually good to test it.
      // if (import.meta.env.DEV) return;

      const payload = {
        message: error.message || "Unknown Error",
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        severity: metadata.severity || "medium",
        category: metadata.category || "rendering",

        // Context
        url: window.location.href,
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        browserInfo: this._getBrowserInfo(),

        // User Context (if passed)
        userId: metadata.userId,
        userEmail: metadata.userEmail,
        appType: metadata.appType || "unknown",
        environment: env.mode,

        // Custom meta
        meta: {
          ...metadata,
        },
      };

      await axios.post(`${API_URL}/api/v1/errors/log`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        // Don't wait too long for error logging
        timeout: 5000,
      });
    } catch (loggingError) {
      // Failsafe: Don't let error logging crash the app
      console.error("Failed to report error to backend:", loggingError);
    }
  }

  _getBrowserInfo() {
    return {
      name: navigator.appName,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
    };
  }
}

export const errorReportingService = new ErrorReportingService();
