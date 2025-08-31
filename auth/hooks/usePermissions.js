/**
 * usePermissions Hook
 * Unified hook for handling role-based permissions
 */
import { useAuth } from "../context/AuthContext.jsx";
import { getCurrentAppConfig } from "../config/appConfigs.js";

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const appConfig = getCurrentAppConfig();

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  const hasRole = (role) => {
    if (!isAuthenticated || !user) return false;
    return user.role === role;
  };

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Array of roles to check
   * @returns {boolean}
   */
  const hasAnyRole = (roles) => {
    if (!isAuthenticated || !user) return false;
    return roles.includes(user.role);
  };

  /**
   * Check if user has all of the specified roles (useful for multi-role systems)
   * @param {string[]} roles - Array of roles to check
   * @returns {boolean}
   */
  const hasAllRoles = (roles) => {
    if (!isAuthenticated || !user) return false;
    if (!Array.isArray(user.roles)) return roles.includes(user.role);
    return roles.every((role) => user.roles.includes(role));
  };

  /**
   * Check if user can access a specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    if (!isAuthenticated || !user) return false;

    // If user has permissions array, check it
    if (Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }

    // Otherwise, check based on role-based permissions
    const rolePermissions = getRolePermissions(user.role);
    return rolePermissions.includes(permission);
  };

  /**
   * Get permissions for a specific role
   * @param {string} role - Role to get permissions for
   * @returns {string[]}
   */
  const getRolePermissions = (role) => {
    const permissionMap = {
      // Church app permissions
      admin: ["read", "write", "delete", "manage_users", "manage_settings"],
      pastor: ["read", "write", "manage_members", "manage_events"],
      leader: ["read", "write", "manage_groups"],
      member: ["read", "write_limited"],
      visitor: ["read_limited"],

      // Admin app permissions
      super_admin: [
        "read",
        "write",
        "delete",
        "manage_users",
        "manage_settings",
        "manage_system",
      ],
      moderator: ["read", "write", "manage_content"],
      support: ["read", "write_limited"],

      // Business app permissions
      owner: [
        "read",
        "write",
        "delete",
        "manage_users",
        "manage_settings",
        "manage_billing",
      ],
      manager: ["read", "write", "manage_employees"],
      employee: ["read", "write_limited"],
      client: ["read_limited"],
      guest: ["read_public"],

      // Home app permissions
      head: ["read", "write", "delete", "manage_family"],
      adult: ["read", "write", "manage_tasks"],
      teen: ["read", "write_limited"],
      child: ["read_limited"],

      // Personal app permissions
      user: ["read", "write", "manage_personal"],

      // Playback app permissions
      premium: ["read", "write", "premium_content", "offline_access"],
      standard: ["read", "write", "standard_content"],
    };

    return permissionMap[role] || [];
  };

  /**
   * Check if user is admin (highest role in the current app)
   * @returns {boolean}
   */
  const isAdmin = () => {
    if (!isAuthenticated || !user) return false;

    const adminRoles = {
      church: "admin",
      admin: "super_admin",
      business: "owner",
      home: "head",
      personal: "user", // Only one role in personal app
      playback: "premium",
    };

    const currentApp = appConfig.appName.toLowerCase().split(" ")[0];
    return user.role === adminRoles[currentApp];
  };

  /**
   * Check if user can perform action on resource
   * @param {string} action - Action to perform (read, write, delete, etc.)
   * @param {string} resource - Resource to act on
   * @param {Object} resourceData - Additional resource data for context
   * @returns {boolean}
   */
  const canPerform = (action, resource, resourceData = {}) => {
    if (!isAuthenticated || !user) return false;

    // Check basic permission
    if (!hasPermission(action)) return false;

    // Additional context-based checks
    if (resourceData.ownerId && resourceData.ownerId === user.id) {
      return true; // User owns the resource
    }

    // Role-based resource access
    const userPermissions = getRolePermissions(user.role);
    const requiredPermission = `${action}_${resource}`;

    return (
      userPermissions.includes(action) ||
      userPermissions.includes(requiredPermission)
    );
  };

  /**
   * Get user's role hierarchy level (for role comparison)
   * @param {string} role - Role to get level for
   * @returns {number}
   */
  const getRoleLevel = (role) => {
    const roleLevels = {
      // Church app
      visitor: 1,
      member: 2,
      leader: 3,
      pastor: 4,
      church_admin: 5,

      // Admin app
      support: 1,
      moderator: 2,
      admin: 3,
      super_admin: 4,

      // Business app
      business_guest: 1,
      client: 2,
      employee: 3,
      manager: 4,
      owner: 5,

      // Home app
      child: 1,
      teen: 2,
      adult: 3,
      head: 4,

      // Personal app
      user: 1,

      // Playback app
      playback_guest: 1,
      standard: 2,
      premium: 3,
    };

    return roleLevels[role] || 0;
  };

  /**
   * Check if user's role is higher than specified role
   * @param {string} role - Role to compare against
   * @returns {boolean}
   */
  const hasHigherRoleThan = (role) => {
    if (!isAuthenticated || !user) return false;
    return getRoleLevel(user.role) > getRoleLevel(role);
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    getRolePermissions,
    isAdmin,
    canPerform,
    getRoleLevel,
    hasHigherRoleThan,
    userRole: user?.role,
    userPermissions: user?.permissions || getRolePermissions(user?.role || ""),
  };
};
