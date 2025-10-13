/**
 * RBAC Utilities
 * Core functions for role-based access control and permission checking
 */

import {
  ROLES,
  PERMISSIONS,
  ROLE_HIERARCHY,
  APPLICATION_ROLES,
  PROTECTED_ROUTES,
} from './roles.js';

/**
 * RBAC Utility Class
 * Provides methods for checking permissions, roles, and access control
 */
export class RBACUtils {
  constructor(user = null) {
    this.user = user;
    this.userRoles = user?.roles || [];
    this.userPermissions = this.resolveUserPermissions();
  }

  /**
   * Update user context
   */
  setUser(user) {
    this.user = user;
    this.userRoles = user?.roles || [];
    this.userPermissions = this.resolveUserPermissions();
  }

  /**
   * Get all permissions for a role including inherited permissions
   */
  getRolePermissions(roleId) {
    const role = ROLES[roleId];
    if (!role) return [];

    let permissions = [...role.permissions];

    // Add inherited permissions
    if (role.inherits && role.inherits.length > 0) {
      role.inherits.forEach((inheritedRoleId) => {
        const inheritedPermissions = this.getRolePermissions(inheritedRoleId);
        permissions = [...permissions, ...inheritedPermissions];
      });
    }

    // Remove duplicates
    return [...new Set(permissions)];
  }

  /**
   * Resolve all permissions for current user
   */
  resolveUserPermissions() {
    if (!this.userRoles || this.userRoles.length === 0) {
      return [];
    }

    let allPermissions = [];

    this.userRoles.forEach((roleId) => {
      const rolePermissions = this.getRolePermissions(roleId);
      allPermissions = [...allPermissions, ...rolePermissions];
    });

    // Remove duplicates and return
    return [...new Set(allPermissions)];
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission) {
    if (!this.user || !this.userPermissions) {
      return false;
    }

    return this.userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions) {
    if (!Array.isArray(permissions)) {
      return this.hasPermission(permissions);
    }

    return permissions.some((permission) => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions) {
    if (!Array.isArray(permissions)) {
      return this.hasPermission(permissions);
    }

    return permissions.every((permission) => this.hasPermission(permission));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleId) {
    return this.userRoles.includes(roleId);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles) {
    if (!Array.isArray(roles)) {
      return this.hasRole(roles);
    }

    return roles.some((role) => this.hasRole(role));
  }

  /**
   * Check if user has role with minimum level
   */
  hasMinimumRoleLevel(minLevel) {
    const userRoleLevels = this.userRoles.map((roleId) => {
      const role = ROLES[roleId];
      return role ? role.level : 0;
    });

    const maxUserLevel = Math.max(...userRoleLevels, 0);
    return maxUserLevel >= minLevel;
  }

  /**
   * Check if user can access a specific route in an application
   */
  canAccessRoute(application, route) {
    const appRoutes = PROTECTED_ROUTES[application];
    if (!appRoutes) return true; // No protection defined

    // Find matching route pattern
    const routePattern = Object.keys(appRoutes).find((pattern) => {
      // Simple pattern matching (can be enhanced with more sophisticated routing)
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(route);
    });

    if (!routePattern) return true; // Route not protected

    const requiredPermissions = appRoutes[routePattern];
    return this.hasAnyPermission(requiredPermissions);
  }

  /**
   * Check if user can access an application
   */
  canAccessApplication(application) {
    const appRoles = APPLICATION_ROLES[application];
    if (!appRoles) return false;

    return this.hasAnyRole(appRoles) || this.hasRole('super_admin');
  }

  /**
   * Get user's accessible applications
   */
  getAccessibleApplications() {
    return Object.keys(APPLICATION_ROLES).filter((app) =>
      this.canAccessApplication(app)
    );
  }

  /**
   * Get user's highest role level
   */
  getHighestRoleLevel() {
    const userRoleLevels = this.userRoles.map((roleId) => {
      const role = ROLES[roleId];
      return role ? role.level : 0;
    });

    return Math.max(...userRoleLevels, 0);
  }

  /**
   * Get user's roles for a specific application
   */
  getApplicationRoles(application) {
    const appRoles = APPLICATION_ROLES[application];
    if (!appRoles) return [];

    return this.userRoles.filter((roleId) => appRoles.includes(roleId));
  }

  /**
   * Check if user is admin for any application
   */
  isAnyAdmin() {
    return (
      this.hasAnyRole(['super_admin', 'system_admin']) ||
      this.userRoles.some((roleId) => roleId.includes('_admin'))
    );
  }

  /**
   * Check if user is admin for a specific application
   */
  isApplicationAdmin(application) {
    if (this.hasRole('super_admin')) return true;

    const adminRole = `${application}_admin`;
    return this.hasRole(adminRole);
  }

  /**
   * Get filtered menu items based on permissions
   */
  filterMenuItems(menuItems, application = null) {
    return menuItems.filter((item) => {
      // Check permission requirements
      if (item.requiredPermissions) {
        if (!this.hasAnyPermission(item.requiredPermissions)) {
          return false;
        }
      }

      // Check role requirements
      if (item.requiredRoles) {
        if (!this.hasAnyRole(item.requiredRoles)) {
          return false;
        }
      }

      // Check minimum role level
      if (item.minimumRoleLevel) {
        if (!this.hasMinimumRoleLevel(item.minimumRoleLevel)) {
          return false;
        }
      }

      // Check route access
      if (item.route && application) {
        if (!this.canAccessRoute(application, item.route)) {
          return false;
        }
      }

      // Recursively filter children
      if (item.children) {
        item.children = this.filterMenuItems(item.children, application);
      }

      return true;
    });
  }

  /**
   * Get permission summary for debugging
   */
  getPermissionSummary() {
    return {
      user: this.user?.id || null,
      roles: this.userRoles,
      permissions: this.userPermissions,
      highestLevel: this.getHighestRoleLevel(),
      accessibleApps: this.getAccessibleApplications(),
      isAnyAdmin: this.isAnyAdmin(),
    };
  }
}

/**
 * Create RBAC instance for a user
 */
export function createRBAC(user) {
  return new RBACUtils(user);
}

/**
 * Permission checking decorators/utilities
 */
export const PermissionUtils = {
  /**
   * Create a permission checker function
   */
  createChecker: (user) => {
    const rbac = new RBACUtils(user);
    return {
      hasPermission: (permission) => rbac.hasPermission(permission),
      hasAnyPermission: (permissions) => rbac.hasAnyPermission(permissions),
      hasAllPermissions: (permissions) => rbac.hasAllPermissions(permissions),
      hasRole: (role) => rbac.hasRole(role),
      hasAnyRole: (roles) => rbac.hasAnyRole(roles),
      canAccess: (app, route) => rbac.canAccessRoute(app, route),
      isAdmin: (app) => rbac.isApplicationAdmin(app),
    };
  },

  /**
   * Validate role assignment
   */
  validateRoleAssignment: (assignerRoles, targetRole) => {
    const assignerRBAC = new RBACUtils({ roles: assignerRoles });
    const targetRoleLevel = ROLES[targetRole]?.level || 0;
    const assignerLevel = assignerRBAC.getHighestRoleLevel();

    // Can only assign roles with lower or equal level
    return assignerLevel >= targetRoleLevel;
  },

  /**
   * Get available roles for assignment
   */
  getAssignableRoles: (assignerRoles, application = null) => {
    const assignerRBAC = new RBACUtils({ roles: assignerRoles });
    const assignerLevel = assignerRBAC.getHighestRoleLevel();

    let availableRoles = Object.values(ROLES).filter((role) => {
      // Can only assign roles with lower or equal level
      if (role.level > assignerLevel) return false;

      // Filter by application if specified
      if (application && role.applicationScope) {
        return role.applicationScope.includes(application);
      }

      return true;
    });

    return availableRoles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      level: role.level,
      applicationScope: role.applicationScope,
    }));
  },
};

/**
 * Route protection utilities
 */
export const RouteUtils = {
  /**
   * Check if route requires authentication
   */
  requiresAuth: (application, route) => {
    const appRoutes = PROTECTED_ROUTES[application];
    if (!appRoutes) return false;

    const routePattern = Object.keys(appRoutes).find((pattern) => {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(route);
    });

    return !!routePattern;
  },

  /**
   * Get required permissions for a route
   */
  getRoutePermissions: (application, route) => {
    const appRoutes = PROTECTED_ROUTES[application];
    if (!appRoutes) return [];

    const routePattern = Object.keys(appRoutes).find((pattern) => {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(route);
    });

    return routePattern ? appRoutes[routePattern] : [];
  },
};

// Export commonly used permission constants
export { PERMISSIONS, ROLES } from './roles.js';
