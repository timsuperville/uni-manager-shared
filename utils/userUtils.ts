/**
 * User-related utility functions.
 * Provides standardized access to user data fields.
 */

import { getAbsoluteUrl as getAbsoluteUploadUrl } from '../api/config/apiConfig';

/** Minimal user shape expected by avatar/cover helpers. */
interface UserWithMedia {
  avatarUrl?: string | null;
  avatar?: string | null;
  coverImageUrl?: string | null;
  coverImage?: string | null;
}

/**
 * Get user's avatar URL with fallback.
 * Checks both avatarUrl (immediate upload response) and avatar (persisted DB field).
 */
export const getUserAvatar = (
  user: UserWithMedia | null | undefined
): string | null => {
  if (!user) return null;
  const url = user.avatarUrl || user.avatar || null;
  return getAbsoluteUploadUrl(url);
};

/**
 * Get user's cover image URL with fallback.
 * Checks both coverImageUrl (immediate upload response) and coverImage (persisted DB field).
 */
export const getUserCoverImage = (
  user: UserWithMedia | null | undefined
): string | null => {
  if (!user) return null;
  const url = user.coverImageUrl || user.coverImage || null;
  return getAbsoluteUploadUrl(url);
};

/** Check if user has an avatar set. */
export const hasAvatar = (user: UserWithMedia | null | undefined): boolean => {
  return !!getUserAvatar(user);
};

/** Check if user has a cover image set. */
export const hasCoverImage = (
  user: UserWithMedia | null | undefined
): boolean => {
  return !!getUserCoverImage(user);
};
