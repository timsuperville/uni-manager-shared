/**
 * RBAC React Components
 * Components for permission-based rendering and route protection
 */

import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { RBACUtils, PermissionUtils } from '../rbac/utils';

// Create RBAC Context
const RBACContext = createContext(null);

/**
 * RBAC Provider Component
 * Provides RBAC utilities to child components
 */
export function RBACProvider({ children, application = null }) {
  const { user, isAuthenticated } = useAuth();

  const rbac = React.useMemo(() => {
    if (!isAuthenticated || !user) {
      return new RBACUtils(null);
    }
    return new RBACUtils(user);
  }, [user, isAuthenticated]);

  const value = {
    rbac,
    application,
    user,
    isAuthenticated,
    // Convenience methods
    hasPermission: (permission) => rbac.hasPermission(permission),
    hasAnyPermission: (permissions) => rbac.hasAnyPermission(permissions),
    hasAllPermissions: (permissions) => rbac.hasAllPermissions(permissions),
    hasRole: (role) => rbac.hasRole(role),
    hasAnyRole: (roles) => rbac.hasAnyRole(roles),
    canAccessRoute: (route) => rbac.canAccessRoute(application, route),
    canAccessApplication: (app) =>
      rbac.canAccessApplication(app || application),
    isApplicationAdmin: (app) => rbac.isApplicationAdmin(app || application),
    isAnyAdmin: () => rbac.isAnyAdmin(),
    getAccessibleApplications: () => rbac.getAccessibleApplications(),
    filterMenuItems: (items) => rbac.filterMenuItems(items, application),
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

/**
 * Hook to use RBAC context
 */
export function useRBAC() {
  const context = useContext(RBACContext);

  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }

  return context;
}

/**
 * Permission Guard Component
 * Conditionally renders children based on permissions
 */
export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRBAC();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    // No permissions specified, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
}

/**
 * Role Guard Component
 * Conditionally renders children based on roles
 */
export function RoleGuard({
  role,
  roles,
  requireAll = false,
  minimumLevel = null,
  fallback = null,
  children,
}) {
  const { hasRole, hasAnyRole, rbac } = useRBAC();

  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles) {
    if (requireAll) {
      hasAccess = roles.every((r) => hasRole(r));
    } else {
      hasAccess = hasAnyRole(roles);
    }
  }

  // Check minimum level if specified
  if (hasAccess && minimumLevel !== null) {
    hasAccess = rbac.hasMinimumRoleLevel(minimumLevel);
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
}

/**
 * Application Guard Component
 * Ensures user has access to the current application
 */
export function ApplicationGuard({
  application,
  fallback = <Navigate to='/unauthorized' replace />,
  children,
}) {
  const { canAccessApplication, isAuthenticated } = useRBAC();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (!canAccessApplication(application)) {
    return fallback;
  }

  return children;
}

/**
 * Route Guard Component
 * Protects routes based on permissions and roles
 */
export function RouteGuard({
  permission,
  permissions,
  role,
  roles,
  minimumLevel = null,
  requireAuth = true,
  redirectTo = '/unauthorized',
  children,
}) {
  const {
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    rbac,
  } = useRBAC();

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  // Check permissions
  if (permission && !hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (permissions) {
    const hasRequiredPermissions = hasAllPermissions
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Check roles
  if (role && !hasRole(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles) {
    if (!hasAnyRole(roles)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Check minimum level
  if (minimumLevel !== null && !rbac.hasMinimumRoleLevel(minimumLevel)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

/**
 * Admin Guard Component
 * Ensures user has admin access
 */
export function AdminGuard({
  application = null,
  fallback = <Navigate to='/unauthorized' replace />,
  children,
}) {
  const { isApplicationAdmin, isAnyAdmin } = useRBAC();

  const isAdmin = application ? isApplicationAdmin(application) : isAnyAdmin();

  if (!isAdmin) {
    return fallback;
  }

  return children;
}

/**
 * Conditional Render Component
 * Renders different content based on permissions/roles
 */
export function ConditionalRender({
  permission,
  permissions,
  role,
  roles,
  minimumLevel = null,
  whenTrue,
  whenFalse = null,
}) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    rbac,
  } = useRBAC();

  let hasAccess = true;

  // Check permissions
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = hasAllPermissions
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // Check roles
  if (hasAccess && role) {
    hasAccess = hasRole(role);
  } else if (hasAccess && roles) {
    hasAccess = hasAnyRole(roles);
  }

  // Check minimum level
  if (hasAccess && minimumLevel !== null) {
    hasAccess = rbac.hasMinimumRoleLevel(minimumLevel);
  }

  return hasAccess ? whenTrue : whenFalse;
}

/**
 * Higher-Order Component for permission-based rendering
 */
export function withPermissions(
  Component,
  requiredPermissions = [],
  options = {}
) {
  return function PermissionWrappedComponent(props) {
    const { requireAll = false, fallback = null, redirectTo = null } = options;

    return (
      <PermissionGuard
        permissions={requiredPermissions}
        requireAll={requireAll}
        fallback={redirectTo ? <Navigate to={redirectTo} replace /> : fallback}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Higher-Order Component for role-based rendering
 */
export function withRoles(Component, requiredRoles = [], options = {}) {
  return function RoleWrappedComponent(props) {
    const {
      requireAll = false,
      minimumLevel = null,
      fallback = null,
      redirectTo = null,
    } = options;

    return (
      <RoleGuard
        roles={requiredRoles}
        requireAll={requireAll}
        minimumLevel={minimumLevel}
        fallback={redirectTo ? <Navigate to={redirectTo} replace /> : fallback}
      >
        <Component {...props} />
      </RoleGuard>
    );
  };
}

/**
 * Permission Button Component
 * Button that's only visible/enabled based on permissions
 */
export function PermissionButton({
  permission,
  permissions,
  children,
  disabledProps = { disabled: true, style: { opacity: 0.5 } },
  hideWhenNoAccess = false,
  ...buttonProps
}) {
  const { hasPermission, hasAnyPermission } = useRBAC();

  const hasAccess = permission
    ? hasPermission(permission)
    : permissions
      ? hasAnyPermission(permissions)
      : true;

  if (!hasAccess && hideWhenNoAccess) {
    return null;
  }

  const finalProps = hasAccess
    ? buttonProps
    : { ...buttonProps, ...disabledProps };

  return <button {...finalProps}>{children}</button>;
}

/**
 * Menu Item Component with permission filtering
 */
export function PermissionMenuItem({
  permission,
  permissions,
  role,
  roles,
  minimumLevel = null,
  children,
  ...itemProps
}) {
  return (
    <PermissionGuard permission={permission} permissions={permissions}>
      <RoleGuard role={role} roles={roles} minimumLevel={minimumLevel}>
        <div {...itemProps}>{children}</div>
      </RoleGuard>
    </PermissionGuard>
  );
}

// Export all components
export {
  RBACProvider,
  useRBAC,
  PermissionGuard,
  RoleGuard,
  ApplicationGuard,
  RouteGuard,
  AdminGuard,
  ConditionalRender,
  withPermissions,
  withRoles,
  PermissionButton,
  PermissionMenuItem,
};

RBACContext.propTypes = {
  // TODO: Define specific prop types
};
