import { useAuth } from "../context/AuthContext";
import { getCurrentAppConfig } from "../config/appConfigs";

// ── Types ─────────────────────────────────────────────────────────────────────

type RoleName = string;
type Permission = string;

interface PermissionMap {
  [role: string]: Permission[];
}

const ROLE_PERMISSIONS: PermissionMap = {
  // Church app
  admin: ["read", "write", "delete", "manage_users", "manage_settings"],
  pastor: ["read", "write", "manage_members", "manage_events"],
  leader: ["read", "write", "manage_groups"],
  member: ["read", "write_limited"],
  visitor: ["read_limited"],
  // Admin app
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
  // Business app
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
  // Home app
  head: ["read", "write", "delete", "manage_family"],
  adult: ["read", "write", "manage_tasks"],
  teen: ["read", "write_limited"],
  child: ["read_limited"],
  // Personal app
  user: ["read", "write", "manage_personal"],
  // Playback app
  premium: ["read", "write", "premium_content", "offline_access"],
  standard: ["read", "write", "standard_content"],
};

const ROLE_LEVELS: Record<string, number> = {
  // Church
  visitor: 1,
  member: 2,
  leader: 3,
  pastor: 4,
  church_admin: 5,
  // Admin
  support: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
  // Business
  work_guest: 1,
  client: 2,
  employee: 3,
  work_manager: 3,
  business_owner: 5,
  // Home
  child: 1,
  teen: 2,
  home_adult: 3,
  head: 4,
  // Personal
  personal_user: 1,
  // Playback
  playback_guest: 1,
  play_standard: 2,
  premium: 3,
};

const ADMIN_ROLES: Record<string, string> = {
  church: "admin",
  admin: "super_admin",
  work: "owner",
  home: "head",
  personal: "user",
  playback: "premium",
};

interface AppConfig {
  appName: string;
}

interface UsePermissionsReturn {
  hasRole: (role: RoleName) => boolean;
  hasAnyRole: (roles: RoleName[]) => boolean;
  hasAllRoles: (roles: RoleName[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  getRolePermissions: (role: RoleName) => Permission[];
  isAdmin: () => boolean;
  canPerform: (
    action: string,
    resource: string,
    resourceData?: { ownerId?: string },
  ) => boolean;
  getRoleLevel: (role: RoleName) => number;
  hasHigherRoleThan: (role: RoleName) => boolean;
  userRole: string | undefined;
  userPermissions: Permission[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const usePermissions = (): UsePermissionsReturn => {
  const { user, isAuthenticated } = useAuth();
  const appConfig = getCurrentAppConfig() as AppConfig;

  const getRolePermissions = (role: RoleName): Permission[] =>
    ROLE_PERMISSIONS[role] ?? [];

  const hasRole = (role: RoleName): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.role === role;
  };

  const hasAnyRole = (roles: RoleName[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roles.includes(user.role ?? "");
  };

  const hasAllRoles = (roles: RoleName[]): boolean => {
    if (!isAuthenticated || !user) return false;
    if (!Array.isArray(user.roles)) return roles.includes(user.role ?? "");
    return roles.every((role) => user.roles!.includes(role));
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!isAuthenticated || !user) return false;
    if (Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    return getRolePermissions(user.role ?? "").includes(permission);
  };

  const isAdmin = (): boolean => {
    if (!isAuthenticated || !user) return false;
    const currentApp = appConfig.appName.toLowerCase().split(" ")[0]!;
    return user.role === (ADMIN_ROLES[currentApp] ?? "");
  };

  const canPerform = (
    action: string,
    resource: string,
    resourceData: { ownerId?: string } = {},
  ): boolean => {
    if (!isAuthenticated || !user) return false;
    if (!hasPermission(action)) return false;
    if (resourceData.ownerId && resourceData.ownerId === user.id) return true;
    const userPermissions = getRolePermissions(user.role ?? "");
    return (
      userPermissions.includes(action) ||
      userPermissions.includes(`${action}_${resource}`)
    );
  };

  const getRoleLevel = (role: RoleName): number => ROLE_LEVELS[role] ?? 0;

  const hasHigherRoleThan = (role: RoleName): boolean => {
    if (!isAuthenticated || !user) return false;
    return getRoleLevel(user.role ?? "") > getRoleLevel(role);
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
    userPermissions: user?.permissions ?? getRolePermissions(user?.role ?? ""),
  };
};

export default usePermissions;
