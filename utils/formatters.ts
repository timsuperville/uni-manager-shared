/**
 * Formats a numeric value as a currency string.
 * Defaults to USD with no fractional digits.
 *
 * @param n - Numeric value to format (null/undefined renders "—")
 * @param currency - ISO 4217 currency code (defaults to "USD")
 * @returns Formatted currency string or "—" for null/undefined
 */
export const formatCurrency = (
  n: number | null | undefined,
  currency = 'USD'
): string => {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(n);
};

/**
 * Formats a system role into a friendly display name.
 */
export const formatRole = (role: string | undefined | null): string => {
  if (!role) return 'User';
  return role
    .replace(/_/g, ' ') // super_admin -> super admin
    .replace(/\b\w/g, c => c.toUpperCase()); // super admin -> Super Admin
};

/** Minimal user shape expected by display helpers. */
interface UserLike {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

/**
 * Gets the display name for a user.
 * @param user - The user object
 * @returns "First Last" or "Email" or "User"
 */
export const getUserDisplayName = (
  user: UserLike | null | undefined
): string => {
  if (!user) return 'User';
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.email || 'User';
};

/**
 * Gets the initials for a user.
 * @param user - The user object
 * @returns Initials (e.g. "JD" or "E")
 */
export const getUserInitials = (user: UserLike | null | undefined): string => {
  if (!user) return 'U';
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return (user.email?.[0] || 'U').toUpperCase();
};

/**
 * Formats a duration in seconds to a mm:ss string.
 * e.g. 189 → "3:09"
 * Returns "" for null/undefined.
 */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null || isNaN(seconds)) return '';
  const totalSec = Math.round(Math.abs(seconds));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Parses a mm:ss string (or bare second count) to a number of seconds.
 * Returns undefined if the string is empty or not parseable.
 * e.g. "3:09" → 189, "189" → 189, "" → undefined
 */
export const parseDuration = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d+:\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(':').map(Number);
    const m = parts[0] as number;
    const s = parts[1] as number;
    return m * 60 + s;
  }
  const n = Number(trimmed);
  return isNaN(n) ? undefined : Math.round(n);
};

/**
 * Returns true if the value is empty OR starts with http:// or https://.
 * An empty string is treated as valid (field is optional) — callers that
 * require a non-empty URL should pair this with a separate required check.
 */
export const isValidHttpUrl = (value: string): boolean =>
  !value.trim() || /^https?:\/\/.+/.test(value.trim());
