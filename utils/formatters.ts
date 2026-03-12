/**
 * Formats a system role into a friendly display name.
 * @param role - The role string (e.g. "super_admin")
 * @returns Formatted role (e.g. "Super Admin")
 */
export const formatRole = (role: string | undefined | null): string => {
  if (!role) return "User";
  return role
    .replace(/_/g, " ") // super_admin -> super admin
    .replace(/\b\w/g, (c) => c.toUpperCase()); // super admin -> Super Admin
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
export const getUserDisplayName = (user: UserLike | null | undefined): string => {
  if (!user) return "User";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.email || "User";
};

/**
 * Gets the initials for a user.
 * @param user - The user object
 * @returns Initials (e.g. "JD" or "E")
 */
export const getUserInitials = (user: UserLike | null | undefined): string => {
  if (!user) return "U";
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return (user.email?.[0] || "U").toUpperCase();
};
