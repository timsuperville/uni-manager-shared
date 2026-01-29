/**
 * API URL Utilities
 *
 * Centralizes all URL-related logic for the API,
 * ensuring consistent URL handling across the application.
 */

/**
 * Get the API base URL from environment variables
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = () => {
  // Check various environment variables in order of preference
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.VITE_API_URL || "http://localhost:5000";
  }

  // Fallback for non-Vite environments
  if (typeof process !== "undefined" && process.env) {
    return (
      process.env.VITE_API_URL || process.env.API_URL || "http://localhost:5000"
    );
  }

  // Final fallback
  return "http://localhost:5000";
};

/**
 * Convert a relative upload path to an absolute URL
 * This is needed because Vite proxy only works for fetch/XHR, not img src attributes
 *
 * @param {string} path - The relative path (e.g., "/uploads/avatars/file.jpg")
 * @returns {string} Absolute URL (e.g., "http://localhost:5000/uploads/avatars/file.jpg")
 */
export const getAbsoluteUploadUrl = (path) => {
  if (!path) return null;

  // Already absolute
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Make relative paths absolute
  if (path.startsWith("/uploads")) {
    return `${getApiBaseUrl()}${path}`;
  }

  return path;
};
