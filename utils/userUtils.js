/**
 * User-related utility functions
 * Provides standardized access to user data fields
 */

/**
 * Get user's avatar URL with fallback
 * Checks both avatarUrl (immediate upload response) and avatar (persisted DB field)
 *
 * @param {Object} user - User object
 * @returns {string|null} Avatar URL or null if not set
 */
export const getUserAvatar = (user) => {
  if (!user) return null;
  const url = user.avatarUrl || user.avatar || null;

  // If URL starts with /uploads, prepend backend URL for img tags
  // Vite proxy only works for fetch/XHR, not img src
  if (url && url.startsWith("/uploads")) {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${backendUrl}${url}`;
  }

  return url;
};

/**
 * Get user's cover image URL with fallback
 * Checks both coverImageUrl (immediate upload response) and coverImage (persisted DB field)
 *
 * @param {Object} user - User object
 * @returns {string|null} Cover image URL or null if not set
 */
export const getUserCoverImage = (user) => {
  if (!user) return null;
  const url = user.coverImageUrl || user.coverImage || null;

  // If URL starts with /uploads, prepend backend URL for img tags
  // Vite proxy only works for fetch/XHR, not img src
  if (url && url.startsWith("/uploads")) {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${backendUrl}${url}`;
  }

  return url;
};

/**
 * Check if user has an avatar set
 * @param {Object} user - User object
 * @returns {boolean} True if user has an avatar
 */
export const hasAvatar = (user) => {
  return !!getUserAvatar(user);
};

/**
 * Check if user has a cover image set
 * @param {Object} user - User object
 * @returns {boolean} True if user has a cover image
 */
export const hasCoverImage = (user) => {
  return !!getUserCoverImage(user);
};
