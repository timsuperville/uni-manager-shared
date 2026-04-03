/**
 * RBAC Components Library
 * React components for role-based access control
 */

import React, { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useFeatureGate } from "../hooks/useFeatureGate";
import { RBACUtils } from "../utils/RBACUtils";
import type { User } from "../types/auth.types";
import type { Permission } from "../types/rbacRoles";

// ── RBACContext (backward-compat: wraps useAuth) ──────────────────────────────

interface RBACContextValue {
  rbac: RBACUtils;
  application: string | null;
  user: User | null | undefined;
  isAuthenticated: boolean | undefined;
  hasPermission: (p: string) => boolean;
  hasAnyPermission: (ps: string[]) => boolean;
  hasAllPermissions: (ps: string[]) => boolean;
  hasRole: (r: string) => boolean;
  hasAnyRole: (rs: string[]) => boolean;
  canAccessRoute: (route: string) => boolean;
  canAccessApplication: (app?: string | null) => boolean;
  isApplicationAdmin: (app?: string | null) => boolean;
  isAnyAdmin: () => boolean;
  getAccessibleApplications: () => string[];
  filterMenuItems: (items: unknown[]) => unknown[];
}

const RBACContext = createContext<RBACContextValue | null>(null);

interface RBACProviderProps {
  children: React.ReactNode;
  application?: string | null;
}

/**
 * RBACProvider — thin compatibility wrapper.
 * Prefer using useAuth directly in new components.
 */
export function RBACProvider({
  children,
  application = null,
}: RBACProviderProps) {
  const auth = useAuth();
  const { user, isAuthenticated } = auth || {};

  const rbac = React.useMemo(
    () => new RBACUtils(isAuthenticated && user ? user : null),
    [user, isAuthenticated],
  );

  const value: RBACContextValue = {
    rbac,
    application,
    user,
    isAuthenticated,
    hasPermission: (p) => rbac.hasPermission(p as Permission),
    hasAnyPermission: (ps) => rbac.hasAnyPermission(ps as Permission[]),
    hasAllPermissions: (ps) => rbac.hasAllPermissions(ps as Permission[]),
    hasRole: (r) => rbac.hasRole(r),
    hasAnyRole: (rs) => rbac.hasAnyRole(rs),
    canAccessRoute: (route) => rbac.canAccessRoute(application ?? "", route),
    canAccessApplication: (app) =>
      rbac.canAccessApplication(app ?? application ?? ""),
    isApplicationAdmin: (app) =>
      rbac.isApplicationAdmin(app ?? application ?? ""),
    isAnyAdmin: () => rbac.isAnyAdmin(),
    getAccessibleApplications: () => rbac.getAccessibleApplications(),
    filterMenuItems: (items) =>
      rbac.filterMenuItems(
        items as Parameters<typeof rbac.filterMenuItems>[0],
        application,
      ),
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

/**
 * useRBAC — backward-compat hook.
 * Prefer useAuth in new components.
 */
export function useRBAC(): RBACContextValue {
  const ctx = useContext(RBACContext);
  if (!ctx) throw new Error("useRBAC must be used within RBACProvider");
  return ctx;
}

// ── Shared child/fallback shape used by all guards ────────────────────────────
interface GuardChildren {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// ── ApplicationGuard ──────────────────────────────────────────────────────────

interface ApplicationGuardProps extends GuardChildren {
  application: string;
}

/**
 * ApplicationGuard — ensures the user can access the given application.
 */
export function ApplicationGuard({
  application,
  fallback,
  children,
}: ApplicationGuardProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth || !auth.user) {
    navigate("/login");
    return null;
  }

  const canAccess = auth.isApplicationAdmin
    ? auth.isApplicationAdmin(application) || auth.isAnyAdmin?.()
    : auth.hasRole?.(`${application}_admin`) || auth.hasRole?.("super_admin");

  if (!canAccess) return <>{fallback ?? null}</>;
  return <>{children}</>;
}

// ── PermissionGuard ───────────────────────────────────────────────────────────

interface PermissionGuardProps extends GuardChildren {
  permissions?: string | string[];
  permission?: string | string[];
  requireAll?: boolean;
}

/**
 * Permission Guard Component
 * Renders children only if user has required permissions.
 */
export function PermissionGuard({
  permissions,
  permission,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const auth = useAuth();

  let permsToCheck: string[];
  if (permission) {
    permsToCheck = Array.isArray(permission) ? permission : [permission];
  } else if (permissions) {
    permsToCheck = Array.isArray(permissions) ? permissions : [permissions];
  } else {
    return <>{fallback}</>;
  }

  if (!permsToCheck.length || !auth || !auth.hasPermission)
    return <>{fallback}</>;

  // Capture after the guard — TS can't narrow closures
  const checkPerm = auth.hasPermission.bind(auth);
  const checkAllPerms = auth.hasAllPermissions?.bind(auth);
  const checkAnyPerms = auth.hasAnyPermission?.bind(auth);

  let hasPermission: boolean;
  if (permsToCheck.length === 1) {
    hasPermission = checkPerm(permsToCheck[0]!);
  } else if (requireAll) {
    hasPermission = checkAllPerms
      ? checkAllPerms(permsToCheck)
      : permsToCheck.every((perm) => checkPerm(perm));
  } else {
    hasPermission = checkAnyPerms
      ? checkAnyPerms(permsToCheck)
      : permsToCheck.some((perm) => checkPerm(perm));
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// ── RoleGuard ─────────────────────────────────────────────────────────────────

interface RoleGuardProps extends GuardChildren {
  roles?: string | string[];
  role?: string | string[];
  minimumLevel?: string | null;
  requireAll?: boolean;
}

/**
 * Role Guard Component
 * Renders children only if user has required roles.
 */
export function RoleGuard({
  roles,
  role,
  minimumLevel = null,
  requireAll = false,
  children,
  fallback = null,
}: RoleGuardProps) {
  const auth = useAuth();

  if (minimumLevel !== null) {
    if (!auth || !auth.hasMinimumRoleLevel) return <>{fallback}</>;
    const level =
      typeof minimumLevel === "string"
        ? parseInt(minimumLevel, 10)
        : minimumLevel;
    const hasLevel = auth.hasMinimumRoleLevel(level);
    return hasLevel ? <>{children}</> : <>{fallback}</>;
  }

  let rolesToCheck: string[];
  if (role) {
    rolesToCheck = Array.isArray(role) ? role : [role];
  } else if (roles) {
    rolesToCheck = Array.isArray(roles) ? roles : [roles];
  } else {
    return <>{fallback}</>;
  }

  if (!rolesToCheck.length || !auth || !auth.hasRole) return <>{fallback}</>;

  // Capture after the guard — TS can't narrow closures
  const checkRole = auth.hasRole.bind(auth);
  const checkAnyRoles = auth.hasAnyRole?.bind(auth);

  let hasRole: boolean;
  if (rolesToCheck.length === 1) {
    hasRole = checkRole(rolesToCheck[0]!);
  } else if (requireAll) {
    hasRole = rolesToCheck.every((r) => checkRole(r));
  } else {
    hasRole = checkAnyRoles
      ? checkAnyRoles(rolesToCheck)
      : rolesToCheck.some((r) => checkRole(r));
  }

  return hasRole ? <>{children}</> : <>{fallback}</>;
}

// ── RouteGuard ────────────────────────────────────────────────────────────────

interface RouteGuardProps extends GuardChildren {
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  redirectTo?: string;
}

/**
 * Route Guard Component
 * Protects routes based on permissions and roles.
 */
export function RouteGuard({
  permissions = [],
  roles = [],
  requireAll = false,
  children,
  redirectTo = "/unauthorized",
  fallback = null,
}: RouteGuardProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth || !auth.user) {
    if (fallback) return <>{fallback}</>;
    navigate("/login");
    return null;
  }

  if (!auth.hasPermission && !auth.hasRole) {
    if (fallback) return <>{fallback}</>;
    navigate(redirectTo);
    return null;
  }

  let hasAccess = true;

  if (permissions.length > 0) {
    hasAccess = requireAll
      ? permissions.every(
          (perm) => auth.hasPermission && auth.hasPermission(perm),
        )
      : permissions.some(
          (perm) => auth.hasPermission && auth.hasPermission(perm),
        );
  }

  if (hasAccess && roles.length > 0) {
    hasAccess = requireAll
      ? roles.every((r) => auth.hasRole && auth.hasRole(r))
      : auth.hasAnyRole
        ? auth.hasAnyRole(roles)
        : roles.some((r) => auth.hasRole && auth.hasRole(r));
  }

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    navigate(redirectTo);
    return null;
  }

  return <>{children}</>;
}

// ── AdminGuard ────────────────────────────────────────────────────────────────

interface AdminGuardProps extends GuardChildren {
  application?: string | null;
}

/**
 * Admin Guard Component
 * Renders children only for admin users.
 */
export function AdminGuard({
  children,
  fallback = null,
  application = null,
}: AdminGuardProps) {
  const auth = useAuth();
  if (!auth) return <>{fallback}</>;

  let isAdmin = false;
  if (application) {
    isAdmin = auth.isApplicationAdmin
      ? auth.isApplicationAdmin(application)
      : !!(auth.hasRole && auth.hasRole(`${application}_admin`));
  } else {
    isAdmin = auth.isAnyAdmin
      ? auth.isAnyAdmin()
      : !!(
          auth.hasRole &&
          (auth.hasRole("super_admin") || auth.hasRole("admin"))
        );
  }

  return isAdmin ? <>{children}</> : <>{fallback}</>;
}

// ── ConditionalRender ─────────────────────────────────────────────────────────

interface ConditionalRenderProps {
  condition?: boolean | ((auth: ReturnType<typeof useAuth>) => boolean) | null;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  elseChildren?: React.ReactNode;
  else?: React.ReactNode;
}

/**
 * Conditional Render Component
 * Renders content based on conditions.
 */
export function ConditionalRender({
  condition = null,
  permissions = [],
  roles = [],
  requireAll = false,
  children,
  elseChildren = null,
  else: elseProp = null,
}: ConditionalRenderProps) {
  const auth = useAuth();
  const fallbackContent = elseProp ?? elseChildren;

  let shouldRender = true;

  if (condition !== null && condition !== undefined) {
    if (typeof condition === "function") {
      shouldRender = Boolean(condition(auth));
    } else {
      shouldRender = Boolean(condition);
    }
  } else if (permissions.length > 0 || roles.length > 0) {
    shouldRender = true;

    if (permissions.length > 0 && auth && auth.hasPermission) {
      const checkPermCR = auth.hasPermission.bind(auth);
      shouldRender = requireAll
        ? permissions.every((perm) => checkPermCR(perm))
        : permissions.some((perm) => checkPermCR(perm));
    }

    if (shouldRender && roles.length > 0 && auth && auth.hasRole) {
      const checkRoleCR = auth.hasRole.bind(auth);
      shouldRender = auth.hasAnyRole
        ? auth.hasAnyRole(roles)
        : roles.some((r) => checkRoleCR(r));
    }
  }

  return shouldRender ? <>{children}</> : <>{fallbackContent}</>;
}

// ── PermissionButton ──────────────────────────────────────────────────────────

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: string;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  hideIfNoAccess?: boolean;
}

/**
 * Permission Button Component
 * Button that's enabled/disabled based on permissions.
 */
export function PermissionButton({
  permission,
  permissions = [],
  roles = [],
  requireAll = false,
  children,
  hideIfNoAccess = false,
  ...buttonProps
}: PermissionButtonProps) {
  const auth = useAuth();

  let hasAccess = true;

  if (permission && auth && auth.hasPermission) {
    hasAccess = auth.hasPermission(permission);
  } else if (permissions.length > 0 && auth && auth.hasPermission) {
    const checkPerm2 = auth.hasPermission.bind(auth);
    hasAccess = requireAll
      ? permissions.every((perm) => checkPerm2(perm))
      : permissions.some((perm) => checkPerm2(perm));
  }

  if (roles.length > 0 && auth && auth.hasRole) {
    const checkRole2 = auth.hasRole.bind(auth);
    hasAccess =
      hasAccess &&
      (auth.hasAnyRole
        ? auth.hasAnyRole(roles)
        : roles.some((r) => checkRole2(r)));
  }

  if (hideIfNoAccess && !hasAccess) return null;

  return (
    <button {...buttonProps} disabled={!hasAccess}>
      {children}
    </button>
  );
}

// ── PermissionMenuItem ────────────────────────────────────────────────────────

interface PermissionMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  permission?: string;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
}

/**
 * Permission Menu Item Component
 * Menu item that's conditionally rendered based on permissions.
 */
export function PermissionMenuItem({
  permission,
  permissions = [],
  roles = [],
  requireAll = false,
  children,
  ...menuItemProps
}: PermissionMenuItemProps) {
  const auth = useAuth();

  let hasAccess = true;

  if (permission && auth && auth.hasPermission) {
    hasAccess = auth.hasPermission(permission);
  } else if (permissions.length > 0 && auth && auth.hasPermission) {
    const checkPerm3 = auth.hasPermission.bind(auth);
    hasAccess = requireAll
      ? permissions.every((perm) => checkPerm3(perm))
      : permissions.some((perm) => checkPerm3(perm));
  }

  if (roles.length > 0 && auth && auth.hasRole) {
    const checkRole3 = auth.hasRole.bind(auth);
    hasAccess =
      hasAccess &&
      (auth.hasAnyRole
        ? auth.hasAnyRole(roles)
        : roles.some((r) => checkRole3(r)));
  }

  if (!hasAccess) return null;

  return (
    <div {...menuItemProps} role="menuitem">
      {children}
    </div>
  );
}

// ── withPermissions HOC ───────────────────────────────────────────────────────

interface WithPermissionsOptions {
  requireAll?: boolean;
  fallback?: React.ComponentType | React.ReactNode;
  redirectTo?: string | null;
}

/**
 * Higher-Order Component for Permission-based rendering.
 * Usage: withPermissions(['permission1', 'permission2'], options)(Component)
 */
export function withPermissions(
  permissions: string[] = [],
  options: WithPermissionsOptions = {},
) {
  return function <P extends object>(WrappedComponent: React.ComponentType<P>) {
    const { requireAll = false, fallback = null, redirectTo = null } = options;

    const WithPermissionComponent = (props: P) => {
      const auth = useAuth();

      if (!auth || !auth.hasPermission) {
        if (redirectTo && import.meta.env?.DEV) {
          console.warn(
            "withPermissions: redirectTo not supported without useNavigate hook",
          );
        }
        if (!fallback) return null;
        if (typeof fallback === "function") {
          const FallbackComponent = fallback as React.ComponentType<P>;
          return <FallbackComponent {...props} />;
        }
        return <>{fallback}</>;
      }

      const checkPermHOC = auth.hasPermission.bind(auth);
      const hasPermission =
        permissions.length === 0 ||
        (requireAll
          ? permissions.every((perm) => checkPermHOC(perm))
          : permissions.some((perm) => checkPermHOC(perm)));

      if (!hasPermission) {
        if (redirectTo && import.meta.env?.DEV) {
          console.warn(
            "withPermissions: redirectTo not supported without useNavigate hook",
          );
        }
        if (!fallback) return null;
        if (typeof fallback === "function") {
          const FallbackComponent = fallback as React.ComponentType<P>;
          return <FallbackComponent {...props} />;
        }
        return <>{fallback}</>;
      }

      return <WrappedComponent {...props} />;
    };

    WithPermissionComponent.displayName = `withPermissions(${WrappedComponent.displayName ?? WrappedComponent.name})`;
    return WithPermissionComponent;
  };
}

// ── withRoles HOC ─────────────────────────────────────────────────────────────

interface WithRolesOptions {
  requireAll?: boolean;
  minimumLevel?: string | null;
  fallback?: React.ComponentType | React.ReactNode;
  redirectTo?: string | null;
}

/**
 * Higher-Order Component for Role-based rendering.
 * Usage: withRoles(['role1', 'role2'], options)(Component)
 */
export function withRoles(
  roles: string[] = [],
  options: WithRolesOptions = {},
) {
  return function <P extends object>(WrappedComponent: React.ComponentType<P>) {
    const {
      requireAll = false,
      minimumLevel = null,
      fallback = null,
      redirectTo = null,
    } = options;

    const WithRoleComponent = (props: P) => {
      const auth = useAuth();

      const renderFallback = () => {
        if (!fallback) return null;
        if (typeof fallback === "function") {
          const FallbackComponent = fallback as React.ComponentType<P>;
          return <FallbackComponent {...props} />;
        }
        return <>{fallback}</>;
      };

      if (!auth || !auth.hasRole) {
        if (redirectTo && import.meta.env?.DEV) {
          console.warn(
            "withRoles: redirectTo not supported without useNavigate hook",
          );
        }
        return renderFallback();
      }

      if (minimumLevel !== null && auth.hasMinimumRoleLevel) {
        const lvl =
          typeof minimumLevel === "string"
            ? parseInt(minimumLevel, 10)
            : minimumLevel;
        if (!auth.hasMinimumRoleLevel(lvl)) {
          if (redirectTo && import.meta.env?.DEV) {
            console.warn(
              "withRoles: redirectTo not supported without useNavigate hook",
            );
          }
          return renderFallback();
        }
        return <WrappedComponent {...props} />;
      }

      const checkRoleHOC = auth.hasRole.bind(auth);
      const hasRole =
        roles.length === 0 ||
        (requireAll
          ? roles.every((r) => checkRoleHOC(r))
          : auth.hasAnyRole
            ? auth.hasAnyRole(roles)
            : roles.some((r) => checkRoleHOC(r)));

      if (!hasRole) {
        if (redirectTo && import.meta.env?.DEV) {
          console.warn(
            "withRoles: redirectTo not supported without useNavigate hook",
          );
        }
        return renderFallback();
      }

      return <WrappedComponent {...props} />;
    };

    WithRoleComponent.displayName = `withRoles(${WrappedComponent.displayName ?? WrappedComponent.name})`;
    return WithRoleComponent;
  };
}

// ── FeatureGuard ──────────────────────────────────────────────────────────────

interface FeatureGuardProps extends GuardChildren {
  featureKey: string;
}

/**
 * Feature Gate Guard Component
 * Renders children only when the named feature gate is enabled.
 *
 * @example
 * <FeatureGuard featureKey="business.advanced_analytics">
 *   <AnalyticsDashboard />
 * </FeatureGuard>
 *
 * // Show a "Coming Soon" label instead
 * <FeatureGuard featureKey="home.budget_goals" fallback={<span>Coming soon</span>}>
 *   <BudgetGoals />
 * </FeatureGuard>
 */
export function FeatureGuard({
  featureKey,
  children,
  fallback = null,
}: FeatureGuardProps) {
  const isEnabled = useFeatureGate(featureKey);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Export all components
export default {
  RBACProvider,
  useRBAC,
  PermissionGuard,
  RoleGuard,
  ApplicationGuard,
  RouteGuard,
  AdminGuard,
  ConditionalRender,
  PermissionButton,
  PermissionMenuItem,
  withPermissions,
  withRoles,
  FeatureGuard,
};
