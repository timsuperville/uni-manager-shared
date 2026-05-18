/**
 * RBACUtils — Full RBAC evaluation class.
 *
 * Provides role-based permission checking, route access control, and
 * menu item filtering for all Uni-Manager applications.
 *
 * Pure class — no network I/O, no React, no state outside the instance.
 * Data (constants, types) lives in types/rbacRoles.ts.
 * Simple functional helpers (checkPermission, hasRole, checkAccess) also
 * live in types/rbacRoles.ts (co-located with the data they operate on).
 */

import {
  ROLES,
  APPLICATION_ROLES,
  PROTECTED_ROUTES,
  type Permission,
  type RoleDefinition
} from '../types/rbacRoles';

// ── Module-level types ────────────────────────────────────────────────────────

interface UserLike {
  id?: string;
  roles?: string[];
  [key: string]: unknown;
}

interface MenuItem {
  requiredPermissions?: Permission[];
  requiredRoles?: string[];
  minimumRoleLevel?: number;
  route?: string;
  children?: MenuItem[];
  [key: string]: unknown;
}

interface PermissionSummary {
  user: string | null;
  roles: string[];
  permissions: Permission[];
  highestLevel: number;
  accessibleApps: string[];
  isAnyAdmin: boolean;
}

interface AssignableRole {
  id: string;
  name: string;
  description: string;
  level: number;
  applicationScope?: string[];
}

type PermissionChecker = {
  hasPermission: (p: Permission) => boolean;
  hasAnyPermission: (ps: Permission[]) => boolean;
  hasAllPermissions: (ps: Permission[]) => boolean;
  hasRole: (r: string) => boolean;
  hasAnyRole: (rs: string[]) => boolean;
  canAccess: (app: string, route: string) => boolean;
  isAdmin: (app: string) => boolean;
};

// ── Role lookup map ───────────────────────────────────────────────────────────

const ROLE_LOOKUP: Record<string, RoleDefinition> = {};
for (const role of Object.values(ROLES)) {
  if (role.id) ROLE_LOOKUP[role.id] = role;
}

// ── RBACUtils ─────────────────────────────────────────────────────────────────

export class RBACUtils {
  private user: UserLike | null;
  private userRoles: string[];
  private userPermissions: Permission[];

  constructor(user: UserLike | null = null) {
    this.user = user;
    this.userRoles = user?.roles ?? [];
    this.userPermissions = this.resolveUserPermissions();
  }

  setUser(user: UserLike | null): void {
    this.user = user;
    this.userRoles = user?.roles ?? [];
    this.userPermissions = this.resolveUserPermissions();
  }

  getRolePermissions(roleId: string): Permission[] {
    const role = ROLE_LOOKUP[roleId];
    if (!role) return [];

    let permissions: Permission[] = [...(role.permissions as Permission[])];

    if (role.inherits.length > 0) {
      for (const inheritedRoleId of role.inherits) {
        permissions = [
          ...permissions,
          ...this.getRolePermissions(inheritedRoleId)
        ];
      }
    }

    return [...new Set(permissions)];
  }

  resolveUserPermissions(): Permission[] {
    if (!this.userRoles.length) return [];

    const allPermissions: Permission[] = [];
    for (const roleId of this.userRoles) {
      allPermissions.push(...this.getRolePermissions(roleId));
    }
    return [...new Set(allPermissions)];
  }

  hasPermission(permission: Permission): boolean {
    if (!this.user || !this.userPermissions) return false;
    return this.userPermissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission | Permission[]): boolean {
    if (!Array.isArray(permissions)) return this.hasPermission(permissions);
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(permissions: Permission | Permission[]): boolean {
    if (!Array.isArray(permissions)) return this.hasPermission(permissions);
    if (permissions.length === 0) return false;
    return permissions.every(p => this.hasPermission(p));
  }

  hasRole(roleId: string): boolean {
    return this.userRoles.includes(roleId);
  }

  hasAnyRole(roles: string | string[]): boolean {
    if (!Array.isArray(roles)) return this.hasRole(roles);
    return roles.some(r => this.hasRole(r));
  }

  hasMinimumRoleLevel(minLevel: number): boolean {
    const levels = this.userRoles.map(
      roleId => ROLE_LOOKUP[roleId]?.level ?? 0
    );
    return Math.max(...levels, 0) >= minLevel;
  }

  canAccessRoute(application: string, route: string): boolean {
    const appRoutes = PROTECTED_ROUTES[application];
    if (!appRoutes) return true;

    const routePattern = Object.keys(appRoutes).find(pattern => {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(route);
    });

    if (!routePattern) return true;

    return this.hasAnyPermission(appRoutes[routePattern]!);
  }

  canAccessApplication(application: string): boolean {
    const appRoles = APPLICATION_ROLES[application];
    if (!appRoles) return false;
    return this.hasAnyRole(appRoles) || this.hasRole('super_admin');
  }

  getAccessibleApplications(): string[] {
    return Object.keys(APPLICATION_ROLES).filter(app =>
      this.canAccessApplication(app)
    );
  }

  getHighestRoleLevel(): number {
    const levels = this.userRoles.map(
      roleId => ROLE_LOOKUP[roleId]?.level ?? 0
    );
    return Math.max(...levels, 0);
  }

  getApplicationRoles(application: string): string[] {
    const appRoles = APPLICATION_ROLES[application];
    if (!appRoles) return [];
    return this.userRoles.filter(roleId => appRoles.includes(roleId));
  }

  isAnyAdmin(): boolean {
    return (
      this.hasAnyRole(['super_admin', 'system_admin']) ||
      this.userRoles.some(roleId => roleId.includes('_admin'))
    );
  }

  isApplicationAdmin(application: string): boolean {
    if (this.hasRole('super_admin')) return true;
    return this.hasRole(`${application}_admin`);
  }

  filterMenuItems(
    menuItems: MenuItem[],
    application: string | null = null
  ): MenuItem[] {
    return menuItems.filter(item => {
      if (!item) return false;
      if (
        item.requiredPermissions &&
        !this.hasAnyPermission(item.requiredPermissions)
      )
        return false;
      if (item.requiredRoles && !this.hasAnyRole(item.requiredRoles))
        return false;
      if (
        item.minimumRoleLevel &&
        !this.hasMinimumRoleLevel(item.minimumRoleLevel)
      )
        return false;
      if (
        item.route &&
        application &&
        !this.canAccessRoute(application, item.route)
      )
        return false;
      if (item.children)
        item.children = this.filterMenuItems(item.children, application);
      return true;
    });
  }

  getPermissionSummary(): PermissionSummary {
    return {
      user: (this.user?.id as string | undefined) ?? null,
      roles: this.userRoles,
      permissions: this.userPermissions,
      highestLevel: this.getHighestRoleLevel(),
      accessibleApps: this.getAccessibleApplications(),
      isAnyAdmin: this.isAnyAdmin()
    };
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createRBAC(user: UserLike | null): RBACUtils {
  return new RBACUtils(user);
}

// ── Permission utilities ──────────────────────────────────────────────────────

export const PermissionUtils = {
  createChecker: (user: UserLike | null): PermissionChecker => {
    const rbac = new RBACUtils(user);
    return {
      hasPermission: p => rbac.hasPermission(p),
      hasAnyPermission: ps => rbac.hasAnyPermission(ps),
      hasAllPermissions: ps => rbac.hasAllPermissions(ps),
      hasRole: r => rbac.hasRole(r),
      hasAnyRole: rs => rbac.hasAnyRole(rs),
      canAccess: (app, route) => rbac.canAccessRoute(app, route),
      isAdmin: app => rbac.isApplicationAdmin(app)
    };
  },

  validateRoleAssignment: (
    assignerRoles: string[],
    targetRole: string
  ): boolean => {
    const assignerRBAC = new RBACUtils({ roles: assignerRoles });
    const targetRoleLevel = ROLE_LOOKUP[targetRole]?.level ?? 0;
    return assignerRBAC.getHighestRoleLevel() >= targetRoleLevel;
  },

  getAssignableRoles: (
    assignerRoles: string[],
    application: string | null = null
  ): AssignableRole[] => {
    const assignerRBAC = new RBACUtils({ roles: assignerRoles });
    const assignerLevel = assignerRBAC.getHighestRoleLevel();

    return Object.values(ROLES)
      .filter(role => {
        if (role.level > assignerLevel) return false;
        if (application && role.applicationScope) {
          return role.applicationScope.includes(application);
        }
        return true;
      })
      .map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        applicationScope: role.applicationScope
      }));
  }
};

// ── Route utilities ───────────────────────────────────────────────────────────

export const RouteUtils = {
  requiresAuth: (application: string, route: string): boolean => {
    const appRoutes = PROTECTED_ROUTES[application];
    if (!appRoutes) return false;
    return Object.keys(appRoutes).some(pattern => {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(route);
    });
  },

  getRoutePermissions: (application: string, route: string): Permission[] => {
    const appRoutes = PROTECTED_ROUTES[application];
    if (!appRoutes) return [];
    const routePattern = Object.keys(appRoutes).find(pattern => {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(route);
    });
    return routePattern ? (appRoutes[routePattern] ?? []) : [];
  }
};

// Re-export for consumers that imported data directly from this module.
export { PERMISSIONS, ROLES } from '../types/rbacRoles';
