/**
 * RBAC Components Library
 * React components for role-based access control
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '../contexts/AuthContext.jsx';

/**
 * Permission Guard Component
 * Renders children only if user has required permissions
 */
export function PermissionGuard({
  permissions,
  permission,
  requireAll = false,
  children,
  fallback = null
}) {
  const auth = useEnhancedAuth();

  // Handle both single permission and multiple permissions
  // Also handle the case where permission prop contains an array (for test compatibility)
  let permsToCheck;
  if (permission) {
    permsToCheck = Array.isArray(permission) ? permission : [permission];
  } else if (permissions) {
    permsToCheck = Array.isArray(permissions) ? permissions : [permissions];
  } else {
    return fallback;
  }

  if (!permsToCheck.length || !auth || !auth.hasPermission) {
    return fallback;
  }

  let hasPermission;
  if (permsToCheck.length === 1) {
    hasPermission = auth.hasPermission(permsToCheck[0]);
  } else {
    if (requireAll) {
      // For requireAll, use hasAllPermissions if available, otherwise check each permission
      hasPermission = auth.hasAllPermissions
        ? auth.hasAllPermissions(permsToCheck)
        : permsToCheck.every(perm => auth.hasPermission(perm));
    } else {
      // For any permission, prefer hasAnyPermission if available (test expects this)
      hasPermission = auth.hasAnyPermission
        ? auth.hasAnyPermission(permsToCheck)
        : permsToCheck.some(perm => auth.hasPermission(perm));
    }
  }

  return hasPermission ? children : fallback;
}

/**
 * Role Guard Component
 * Renders children only if user has required roles
 */
export function RoleGuard({
  roles,
  role,
  minimumLevel = null, // Add support for minimum level checking
  requireAll = false,
  children,
  fallback = null
}) {
  const auth = useEnhancedAuth();

  // Handle minimum level checking first
  if (minimumLevel !== null) {
    if (!auth || !auth.hasMinimumRoleLevel) {
      return fallback;
    }
    const hasLevel = auth.hasMinimumRoleLevel(minimumLevel);
    return hasLevel ? children : fallback;
  }

  // Handle both single role and multiple roles
  // Also handle the case where role prop contains an array (for test compatibility)
  let rolesToCheck;
  if (role) {
    rolesToCheck = Array.isArray(role) ? role : [role];
  } else if (roles) {
    rolesToCheck = Array.isArray(roles) ? roles : [roles];
  } else {
    return fallback;
  }

  if (!rolesToCheck.length || !auth || !auth.hasRole) {
    return fallback;
  }

  let hasRole;
  if (rolesToCheck.length === 1) {
    hasRole = auth.hasRole(rolesToCheck[0]);
  } else {
    if (requireAll) {
      // For requireAll, check each role
      hasRole = rolesToCheck.every(r => auth.hasRole(r));
    } else {
      // For any role, prefer hasAnyRole if available (test expects this)
      hasRole = auth.hasAnyRole
        ? auth.hasAnyRole(rolesToCheck)
        : rolesToCheck.some(r => auth.hasRole(r));
    }
  }

  return hasRole ? children : fallback;
}

/**
 * Route Guard Component
 * Protects routes based on permissions and roles
 */
export function RouteGuard({
  permissions = [],
  roles = [],
  requireAll = false,
  children,
  redirectTo = '/unauthorized',
  fallback = null
}) {
  const auth = useEnhancedAuth();
  const navigate = useNavigate();

  // Check if user is authenticated
  if (!auth || !auth.user) {
    if (fallback) {
      return fallback;
    }
    navigate('/login');
    return null;
  }

  // Check if auth methods are available
  if (!auth.hasPermission && !auth.hasRole) {
    if (fallback) {
      return fallback;
    }
    navigate(redirectTo);
    return null;
  }

  let hasAccess = true;

  if (permissions.length > 0) {
    hasAccess = requireAll
      ? permissions.every(perm => auth.hasPermission && auth.hasPermission(perm))
      : permissions.some(perm => auth.hasPermission && auth.hasPermission(perm));
  }

  if (hasAccess && roles.length > 0) {
    hasAccess = requireAll
      ? roles.every(role => auth.hasRole && auth.hasRole(role))
      : (auth.hasAnyRole ? auth.hasAnyRole(roles) : roles.some(role => auth.hasRole && auth.hasRole(role)));
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    navigate(redirectTo);
    return null;
  }

  return children;
}

/**
 * Admin Guard Component
 * Renders children only for admin users
 */
export function AdminGuard({
  children,
  fallback = null,
  application = null
}) {
  const auth = useEnhancedAuth();

  if (!auth) {
    return fallback;
  }

  let isAdmin = false;

  if (application) {
    // Check for application-specific admin role
    isAdmin = auth.isApplicationAdmin
      ? auth.isApplicationAdmin(application)
      : (auth.hasRole && auth.hasRole(`${application}_admin`));
  } else {
    // Check for any admin role
    isAdmin = auth.isAnyAdmin
      ? auth.isAnyAdmin()
      : (auth.hasRole && (auth.hasRole('super_admin') || auth.hasRole('admin')));
  }

  return isAdmin ? children : fallback;
}

/**
 * Conditional Render Component
 * Renders content based on conditions
 */
export function ConditionalRender({
  condition = null,
  permissions = [],
  roles = [],
  requireAll = false,
  children,
  elseChildren = null,
  else: elseProp = null // Support both 'else' and 'elseChildren' props
}) {
  const auth = useEnhancedAuth();

  // Use elseProp if provided, otherwise fall back to elseChildren
  const fallbackContent = elseProp || elseChildren;

  let shouldRender = true;

  // If condition is explicitly provided, use it (including explicit false)
  if (condition !== null && condition !== undefined) {
    if (typeof condition === 'function') {
      // If condition is a function, call it with auth context
      shouldRender = Boolean(condition(auth));
    } else {
      shouldRender = Boolean(condition);
    }
  } else if (permissions.length > 0 || roles.length > 0) {
    // Only check permissions/roles if no explicit condition and arrays not empty
    shouldRender = true;

    if (permissions.length > 0 && auth && auth.hasPermission) {
      shouldRender = requireAll
        ? permissions.every(perm => auth.hasPermission(perm))
        : permissions.some(perm => auth.hasPermission(perm));
    }

    if (shouldRender && roles.length > 0 && auth && auth.hasRole) {
      shouldRender = auth.hasAnyRole ? auth.hasAnyRole(roles) : roles.some(role => auth.hasRole(role));
    }
  }

  return shouldRender ? children : fallbackContent;
}

/**
 * Permission Button Component
 * Button that's enabled/disabled based on permissions
 */
export function PermissionButton({
  permission,
  permissions = [],
  roles = [],
  requireAll = false,
  children,
  hideIfNoAccess = false,
  ...buttonProps
}) {
  const auth = useEnhancedAuth();

  let hasAccess = true;

  if (permission && auth && auth.hasPermission) {
    hasAccess = auth.hasPermission(permission);
  } else if (permissions.length > 0 && auth && auth.hasPermission) {
    hasAccess = requireAll
      ? permissions.every(perm => auth.hasPermission(perm))
      : permissions.some(perm => auth.hasPermission(perm));
  }

  if (roles.length > 0 && auth && auth.hasRole) {
    hasAccess = hasAccess && (auth.hasAnyRole ? auth.hasAnyRole(roles) : roles.some(role => auth.hasRole(role)));
  }

  if (hideIfNoAccess && !hasAccess) {
    return null;
  }

  return (
    <button {...buttonProps} disabled={!hasAccess}>
      {children}
    </button>
  );
}

/**
 * Permission Menu Item Component
 * Menu item that's conditionally rendered based on permissions
 */
export function PermissionMenuItem({
  permission,
  permissions = [],
  roles = [],
  requireAll = false,
  children,
  ...menuItemProps
}) {
  const auth = useEnhancedAuth();

  let hasAccess = true;

  if (permission && auth && auth.hasPermission) {
    hasAccess = auth.hasPermission(permission);
  } else if (permissions.length > 0 && auth && auth.hasPermission) {
    hasAccess = requireAll
      ? permissions.every(perm => auth.hasPermission(perm))
      : permissions.some(perm => auth.hasPermission(perm));
  }

  if (roles.length > 0 && auth && auth.hasRole) {
    hasAccess = hasAccess && (auth.hasAnyRole ? auth.hasAnyRole(roles) : roles.some(role => auth.hasRole(role)));
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div {...menuItemProps} role="menuitem">
      {children}
    </div>
  );
}

/**
 * Higher-Order Component for Permission-based rendering
 * Usage: withPermissions(['permission1', 'permission2'], options)(Component)
 */
export function withPermissions(permissions = [], options = {}) {
  return function(WrappedComponent) {
    const WithPermissionComponent = (props) => {
      const auth = useEnhancedAuth();

      const {
        requireAll = false,
        fallback = null,
        redirectTo = null,
        user = null
      } = options;

      if (!auth || !auth.hasPermission) {
        if (redirectTo) {
          // Note: useNavigate should be called conditionally, which breaks rules of hooks
          // For now, return fallback in this case
          console.warn('withPermissions: redirectTo not supported without useNavigate hook');
        }
        return fallback;
      }

      const hasPermission = permissions.length === 0 || (requireAll
        ? permissions.every(perm => auth.hasPermission(perm))
        : permissions.some(perm => auth.hasPermission(perm)));

      if (!hasPermission) {
        if (redirectTo) {
          console.warn('withPermissions: redirectTo not supported without useNavigate hook');
        }
        if (fallback) {
          if (typeof fallback === 'function') {
            const FallbackComponent = fallback;
            return <FallbackComponent {...props} />;
          } else {
            return fallback;
          }
        }
        return null;
      }

      return <WrappedComponent {...props} />;
    };

    WithPermissionComponent.displayName = `withPermissions(${WrappedComponent.displayName || WrappedComponent.name})`;
    return WithPermissionComponent;
  };
}

/**
 * Higher-Order Component for Role-based rendering
 * Usage: withRoles(['role1', 'role2'], options)(Component)
 */
export function withRoles(roles = [], options = {}) {
  return function(WrappedComponent) {
    const WithRoleComponent = (props) => {
      const auth = useEnhancedAuth();

      const {
        requireAll = false,
        minimumLevel = null,
        fallback = null,
        redirectTo = null,
        user = null
      } = options;

      if (!auth || !auth.hasRole) {
        if (redirectTo) {
          console.warn('withRoles: redirectTo not supported without useNavigate hook');
        }
        if (fallback) {
          if (typeof fallback === 'function') {
            const FallbackComponent = fallback;
            return <FallbackComponent {...props} />;
          } else {
            return fallback;
          }
        }
        return null;
      }

      // Handle minimum level checking
      if (minimumLevel !== null && auth.hasMinimumRoleLevel) {
        const hasLevel = auth.hasMinimumRoleLevel(minimumLevel);
        if (!hasLevel) {
          if (redirectTo) {
            console.warn('withRoles: redirectTo not supported without useNavigate hook');
          }
          if (fallback) {
            if (typeof fallback === 'function') {
              const FallbackComponent = fallback;
              return <FallbackComponent {...props} />;
            } else {
              return fallback;
            }
          }
          return null;
        }
        return <WrappedComponent {...props} />;
      }

      const hasRole = roles.length === 0 || (requireAll
        ? roles.every(role => auth.hasRole(role))
        : (auth.hasAnyRole ? auth.hasAnyRole(roles) : roles.some(role => auth.hasRole(role))));

      if (!hasRole) {
        if (redirectTo) {
          console.warn('withRoles: redirectTo not supported without useNavigate hook');
        }
        if (fallback) {
          if (typeof fallback === 'function') {
            const FallbackComponent = fallback;
            return <FallbackComponent {...props} />;
          } else {
            return fallback;
          }
        }
        return null;
      }

      return <WrappedComponent {...props} />;
    };

    WithRoleComponent.displayName = `withRoles(${WrappedComponent.displayName || WrappedComponent.name})`;
    return WithRoleComponent;
  };
}

// Export all components
export default {
  PermissionGuard,
  RoleGuard,
  RouteGuard,
  AdminGuard,
  ConditionalRender,
  PermissionButton,
  PermissionMenuItem,
  withPermissions,
  withRoles,
};