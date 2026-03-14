import React from "react";

interface MinistryMembership {
  id: string;
  roles?: string[];
}

interface RoleGuardUser {
  roles?: string[];
  permissions?: string[];
  ministries?: MinistryMembership[];
}

interface RoleGuardProps {
  user?: RoleGuardUser | null;
  roles?: string[];
  permissions?: string[];
  ministryId?: string | null;
  ministryRoles?: string[];
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * RoleGuard — conditional rendering based on user roles and permissions.
 * Pass the user object as a prop (generic, works across all apps).
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  user = null,
  roles = [],
  permissions = [],
  ministryId = null,
  ministryRoles = [],
  children,
  fallback = null,
  requireAll = false,
}) => {
  if (!user) return <>{fallback}</>;

  const hasRequiredRoles = (): boolean => {
    if (roles.length === 0) return true;
    const userRoles = user.roles ?? [];
    return requireAll
      ? roles.every((r) => userRoles.includes(r))
      : roles.some((r) => userRoles.includes(r));
  };

  const hasRequiredPermissions = (): boolean => {
    if (permissions.length === 0) return true;
    const userPerms = user.permissions ?? [];
    return requireAll
      ? permissions.every((p) => userPerms.includes(p))
      : permissions.some((p) => userPerms.includes(p));
  };

  const hasMinistryAccess = (): boolean => {
    if (!ministryId || ministryRoles.length === 0) return true;
    const ministry = (user.ministries ?? []).find((m) => m.id === ministryId);
    if (!ministry) return false;
    const mRoles = ministry.roles ?? [];
    return requireAll
      ? ministryRoles.every((r) => mRoles.includes(r))
      : ministryRoles.some((r) => mRoles.includes(r));
  };

  const hasAccess = hasRequiredRoles() && hasRequiredPermissions() && hasMinistryAccess();
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;
