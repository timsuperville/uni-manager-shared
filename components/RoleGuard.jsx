// RoleGuard component for role-based access control
import React from "react";
import PropTypes from "prop-types";

/**
 * RoleGuard component for conditional rendering based on user roles and permissions
 *
 * This is a generic component that can be used across different apps.
 * Pass the user object as a prop to use it.
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - User object with roles and permissions
 * @param {string[]} props.roles - Array of roles that can access the content
 * @param {string[]} props.permissions - Array of permissions required to access the content
 * @param {string} props.ministryId - Ministry ID for ministry-specific permissions
 * @param {string[]} props.ministryRoles - Array of ministry roles required
 * @param {React.ReactNode} props.children - Content to render if access is granted
 * @param {React.ReactNode} props.fallback - Content to render if access is denied
 * @param {boolean} props.requireAll - Whether all permissions/roles are required (default: false)
 */
const RoleGuard = ({
  user = null,
  roles = [],
  permissions = [],
  ministryId = null,
  ministryRoles = [],
  children,
  fallback = null,
  requireAll = false,
}) => {
  // If no user is authenticated, deny access
  if (!user) {
    return fallback;
  }

  // Check if user has required roles
  const hasRequiredRoles = () => {
    if (roles.length === 0) return true;

    const userRoles = user.roles || [];
    if (requireAll) {
      return roles.every((role) => userRoles.includes(role));
    } else {
      return roles.some((role) => userRoles.includes(role));
    }
  };

  // Check if user has required permissions
  const hasRequiredPermissions = () => {
    if (permissions.length === 0) return true;

    const userPermissions = user.permissions || [];
    if (requireAll) {
      return permissions.every((permission) =>
        userPermissions.includes(permission),
      );
    } else {
      return permissions.some((permission) =>
        userPermissions.includes(permission),
      );
    }
  };

  // Check ministry-specific access
  const hasMinistryAccess = () => {
    if (!ministryId || ministryRoles.length === 0) return true;

    const userMinistries = user.ministries || [];
    const ministry = userMinistries.find((m) => m.id === ministryId);

    if (!ministry) return false;

    const userMinistryRoles = ministry.roles || [];
    if (requireAll) {
      return ministryRoles.every((role) => userMinistryRoles.includes(role));
    } else {
      return ministryRoles.some((role) => userMinistryRoles.includes(role));
    }
  };

  // Check if user has access
  const hasAccess =
    hasRequiredRoles() && hasRequiredPermissions() && hasMinistryAccess();

  // Render children if access is granted, otherwise render fallback
  return hasAccess ? children : fallback;
};

RoleGuard.propTypes = {
  user: PropTypes.shape({
    roles: PropTypes.arrayOf(PropTypes.string),
    permissions: PropTypes.arrayOf(PropTypes.string),
    ministries: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        roles: PropTypes.arrayOf(PropTypes.string),
      }),
    ),
  }),
  roles: PropTypes.arrayOf(PropTypes.string),
  permissions: PropTypes.arrayOf(PropTypes.string),
  ministryId: PropTypes.string,
  ministryRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node,
  fallback: PropTypes.node,
  requireAll: PropTypes.bool,
};
export default RoleGuard;
