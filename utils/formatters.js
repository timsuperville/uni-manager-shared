/**
 * Formats a system role into a friendly display name.
 * @param {string} role - The role string (e.g. "super_admin")
 * @returns {string} - Formatted role (e.g. "Super Admin")
 */
export const formatRole = (role) => {
    if (!role) return "User";
    return role
        .replace(/_/g, " ") // super_admin -> super admin
        .replace(/\b\w/g, (c) => c.toUpperCase()); // super admin -> Super Admin
};

/**
 * Gets the display name for a user.
 * @param {object} user - The user object
 * @returns {string} - "First Last" or "Email" or "User"
 */
export const getUserDisplayName = (user) => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "User";
};

/**
 * Gets the initials for a user.
 * @param {object} user - The user object
 * @returns {string} - Initials (e.g. "JD" or "E")
 */
export const getUserInitials = (user) => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
        return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return (user.email?.[0] || "U").toUpperCase();
};
