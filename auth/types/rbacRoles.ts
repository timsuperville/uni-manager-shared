/**
 * RBAC Role and Permission Definitions
 *
 * Canonical source of truth for all permission strings, role definitions,
 * permission groups, application role mappings, and protected route configs.
 *
 * Pure data — no functions, no React, no I/O.
 * Utility functions (checkPermission, hasRole, checkAccess) live in utils/rbacUtils.ts.
 */

// -- Permission constants -----------------------------------------------------

export const PERMISSIONS = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_LIST: 'user:list',

  // Role Management
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN: 'role:assign',

  // Church App
  CHURCH_VIEW: 'church:view',
  CHURCH_MANAGE: 'church:manage',
  CHURCH_ADMIN: 'church:admin',
  SERVICE_CREATE: 'service:create',
  SERVICE_EDIT: 'service:edit',
  SERVICE_DELETE: 'service:delete',
  MEMBER_VIEW: 'member:view',
  MEMBER_MANAGE: 'member:manage',
  DONATION_VIEW: 'donation:view',
  DONATION_MANAGE: 'donation:manage',

  // Admin App
  ADMIN_VIEW: 'admin:view',
  ADMIN_MANAGE: 'admin:manage',
  SYSTEM_CONFIG: 'system:config',
  AUDIT_VIEW: 'audit:view',
  ANALYTICS_VIEW: 'analytics:view',

  // Business App
  BUSINESS_VIEW: 'work:view',
  BUSINESS_MANAGE: 'work:manage',
  FINANCE_VIEW: 'finance:view',
  FINANCE_MANAGE: 'finance:manage',
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',

  // Home App
  HOME_VIEW: 'home:view',
  HOME_MANAGE: 'home:manage',
  TASK_CREATE: 'task:create',
  TASK_ASSIGN: 'task:assign',
  SCHEDULE_VIEW: 'schedule:view',
  SCHEDULE_MANAGE: 'schedule:manage',

  // Personal App
  PERSONAL_VIEW: 'personal:view',
  PERSONAL_MANAGE: 'personal:manage',
  GOAL_CREATE: 'goal:create',
  GOAL_EDIT: 'goal:edit',
  NOTE_CREATE: 'note:create',
  NOTE_EDIT: 'note:edit',

  // Playback App
  PLAYBACK_VIEW: 'playback:view',
  PLAYBACK_MANAGE: 'playback:manage',
  MEDIA_UPLOAD: 'media:upload',
  MEDIA_DELETE: 'media:delete',
  PLAYLIST_CREATE: 'playlist:create',
  PLAYLIST_MANAGE: 'playlist:manage'
} as const;

/** Union of all canonical permission string values. */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// -- Permission groups --------------------------------------------------------

export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_LIST
  ],
  ROLE_MANAGEMENT: [
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE,
    PERMISSIONS.ROLE_ASSIGN
  ],
  CHURCH_MANAGEMENT: [
    PERMISSIONS.CHURCH_VIEW,
    PERMISSIONS.CHURCH_MANAGE,
    PERMISSIONS.SERVICE_CREATE,
    PERMISSIONS.SERVICE_EDIT,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_MANAGE
  ],
  ADMIN_MANAGEMENT: [
    PERMISSIONS.ADMIN_VIEW,
    PERMISSIONS.ADMIN_MANAGE,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  BUSINESS_MANAGEMENT: [
    PERMISSIONS.BUSINESS_VIEW,
    PERMISSIONS.BUSINESS_MANAGE,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE
  ]
} as const;

// -- Role interface -----------------------------------------------------------

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: readonly Permission[];
  inherits: string[];
  isSystemRole?: boolean;
  applicationScope?: string[];
}

// -- Role definitions ---------------------------------------------------------

export const ROLES: Record<string, RoleDefinition> = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access across all applications',
    level: 100,
    permissions: Object.values(PERMISSIONS) as Permission[],
    inherits: [],
    isSystemRole: true
  },
  SYSTEM_ADMIN: {
    id: 'system_admin',
    name: 'System Administrator',
    description: 'Administrative access to system configuration',
    level: 90,
    permissions: [
      ...PERMISSION_GROUPS.USER_MANAGEMENT,
      ...PERMISSION_GROUPS.ROLE_MANAGEMENT,
      ...PERMISSION_GROUPS.ADMIN_MANAGEMENT,
      PERMISSIONS.AUDIT_VIEW,
      PERMISSIONS.ANALYTICS_VIEW
    ],
    inherits: [],
    isSystemRole: true
  },
  CHURCH_ADMIN: {
    id: 'church_admin',
    name: 'Church Administrator',
    description: 'Full administrative access to church application',
    level: 80,
    permissions: [
      PERMISSIONS.CHURCH_ADMIN,
      PERMISSIONS.CHURCH_MANAGE,
      PERMISSIONS.SERVICE_CREATE,
      PERMISSIONS.SERVICE_EDIT,
      PERMISSIONS.SERVICE_DELETE,
      PERMISSIONS.MEMBER_VIEW,
      PERMISSIONS.MEMBER_MANAGE,
      PERMISSIONS.DONATION_VIEW,
      PERMISSIONS.DONATION_MANAGE
    ],
    inherits: ['church_manager'],
    applicationScope: ['church']
  },
  CHURCH_MANAGER: {
    id: 'church_manager',
    name: 'Church Manager',
    description: 'Management access to church services and members',
    level: 70,
    permissions: [
      PERMISSIONS.CHURCH_MANAGE,
      PERMISSIONS.SERVICE_CREATE,
      PERMISSIONS.SERVICE_EDIT,
      PERMISSIONS.MEMBER_VIEW,
      PERMISSIONS.MEMBER_MANAGE,
      PERMISSIONS.DONATION_VIEW
    ],
    inherits: ['church_user'],
    applicationScope: ['church']
  },
  CHURCH_USER: {
    id: 'church_user',
    name: 'Church User',
    description: 'Basic access to church application',
    level: 50,
    permissions: [PERMISSIONS.CHURCH_VIEW, PERMISSIONS.MEMBER_VIEW],
    inherits: [],
    applicationScope: ['church']
  },
  BUSINESS_ADMIN: {
    id: 'business_admin',
    name: 'Business Administrator',
    description: 'Full administrative access to business application',
    level: 80,
    permissions: [
      PERMISSIONS.BUSINESS_MANAGE,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.FINANCE_MANAGE,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE
    ],
    inherits: ['work_manager'],
    applicationScope: ['work']
  },
  BUSINESS_MANAGER: {
    id: 'work_manager',
    name: 'Business Manager',
    description: 'Management access to business operations',
    level: 70,
    permissions: [
      PERMISSIONS.BUSINESS_MANAGE,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE
    ],
    inherits: ['business_user'],
    applicationScope: ['work']
  },
  BUSINESS_USER: {
    id: 'business_user',
    name: 'Business User',
    description: 'Basic access to business application',
    level: 50,
    permissions: [PERMISSIONS.BUSINESS_VIEW, PERMISSIONS.INVENTORY_VIEW],
    inherits: [],
    applicationScope: ['work']
  },
  PERSONAL_USER: {
    id: 'personal_user',
    name: 'Personal User',
    description: 'Full access to personal application',
    level: 50,
    permissions: [
      PERMISSIONS.PERSONAL_VIEW,
      PERMISSIONS.PERSONAL_MANAGE,
      PERMISSIONS.GOAL_CREATE,
      PERMISSIONS.GOAL_EDIT,
      PERMISSIONS.NOTE_CREATE,
      PERMISSIONS.NOTE_EDIT
    ],
    inherits: [],
    applicationScope: ['personal']
  },
  HOME_ADMIN: {
    id: 'home_admin',
    name: 'Home Administrator',
    description: 'Full administrative access to home application',
    level: 80,
    permissions: [
      PERMISSIONS.HOME_MANAGE,
      PERMISSIONS.TASK_CREATE,
      PERMISSIONS.TASK_ASSIGN,
      PERMISSIONS.SCHEDULE_VIEW,
      PERMISSIONS.SCHEDULE_MANAGE
    ],
    inherits: ['home_user'],
    applicationScope: ['home']
  },
  HOME_USER: {
    id: 'home_user',
    name: 'Home User',
    description: 'Basic access to home application',
    level: 50,
    permissions: [
      PERMISSIONS.HOME_VIEW,
      PERMISSIONS.TASK_CREATE,
      PERMISSIONS.SCHEDULE_VIEW
    ],
    inherits: [],
    applicationScope: ['home']
  },
  PLAYBACK_ADMIN: {
    id: 'playback_admin',
    name: 'Playback Administrator',
    description: 'Full administrative access to playback application',
    level: 80,
    permissions: [
      PERMISSIONS.PLAYBACK_MANAGE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_DELETE,
      PERMISSIONS.PLAYLIST_CREATE,
      PERMISSIONS.PLAYLIST_MANAGE
    ],
    inherits: ['playback_user'],
    applicationScope: ['playback']
  },
  PLAYBACK_USER: {
    id: 'playback_user',
    name: 'Playback User',
    description: 'Basic access to playback application',
    level: 50,
    permissions: [PERMISSIONS.PLAYBACK_VIEW, PERMISSIONS.PLAYLIST_CREATE],
    inherits: [],
    applicationScope: ['playback']
  },
  GUEST: {
    id: 'guest',
    name: 'Guest',
    description: 'Limited read-only access',
    level: 10,
    permissions: [],
    inherits: [],
    isSystemRole: true
  }
};

// -- Application mappings ----------------------------------------------------

export const APPLICATION_ROLES: Record<string, string[]> = {
  church: ['church_admin', 'church_manager', 'church_user'],
  admin: ['super_admin', 'system_admin'],
  work: ['business_admin', 'work_manager', 'business_user'],
  home: ['home_admin', 'home_user'],
  personal: ['personal_user'],
  playback: ['playback_admin', 'playback_user']
};

export const DEFAULT_ROLES: Record<string, string> = {
  church: 'church_user',
  work: 'business_user',
  home: 'home_user',
  personal: 'personal_user',
  playback: 'playback_user'
};

export const ROLE_HIERARCHY: Record<string, string[]> = {
  super_admin: [],
  system_admin: [],
  church_admin: ['church_manager'],
  church_manager: ['church_user'],
  church_user: [],
  business_admin: ['work_manager'],
  work_manager: ['business_user'],
  business_user: [],
  home_admin: ['home_user'],
  home_user: [],
  personal_user: [],
  playback_admin: ['playback_user'],
  playback_user: [],
  guest: []
};

export const PROTECTED_ROUTES: Record<string, Record<string, Permission[]>> = {
  church: {
    '/admin': [PERMISSIONS.CHURCH_ADMIN],
    '/services/create': [PERMISSIONS.SERVICE_CREATE],
    '/services/edit/:id': [PERMISSIONS.SERVICE_EDIT],
    '/services/delete/:id': [PERMISSIONS.SERVICE_DELETE],
    '/members': [PERMISSIONS.MEMBER_VIEW],
    '/members/manage': [PERMISSIONS.MEMBER_MANAGE],
    '/donations': [PERMISSIONS.DONATION_VIEW],
    '/donations/manage': [PERMISSIONS.DONATION_MANAGE]
  },
  admin: {
    '/users': [PERMISSIONS.USER_LIST],
    '/users/create': [PERMISSIONS.USER_CREATE],
    '/users/edit/:id': [PERMISSIONS.USER_UPDATE],
    '/roles': [PERMISSIONS.ROLE_READ],
    '/system': [PERMISSIONS.SYSTEM_CONFIG],
    '/audit': [PERMISSIONS.AUDIT_VIEW],
    '/analytics': [PERMISSIONS.ANALYTICS_VIEW]
  },
  work: {
    '/admin': [PERMISSIONS.BUSINESS_MANAGE],
    '/finance': [PERMISSIONS.FINANCE_VIEW],
    '/finance/manage': [PERMISSIONS.FINANCE_MANAGE],
    '/inventory': [PERMISSIONS.INVENTORY_VIEW],
    '/inventory/manage': [PERMISSIONS.INVENTORY_MANAGE]
  },
  home: {
    '/admin': [PERMISSIONS.HOME_MANAGE],
    '/tasks/create': [PERMISSIONS.TASK_CREATE],
    '/tasks/assign': [PERMISSIONS.TASK_ASSIGN],
    '/schedule': [PERMISSIONS.SCHEDULE_VIEW],
    '/schedule/manage': [PERMISSIONS.SCHEDULE_MANAGE]
  },
  personal: {
    '/': [PERMISSIONS.PERSONAL_VIEW],
    '/goals': [PERMISSIONS.GOAL_CREATE],
    '/notes': [PERMISSIONS.NOTE_CREATE]
  },
  playback: {
    '/admin': [PERMISSIONS.PLAYBACK_MANAGE],
    '/upload': [PERMISSIONS.MEDIA_UPLOAD],
    '/playlists/create': [PERMISSIONS.PLAYLIST_CREATE],
    '/playlists/manage': [PERMISSIONS.PLAYLIST_MANAGE]
  }
};

// -- Pure utility functions ---------------------------------------------------
// Co-located here because they depend exclusively on constants defined above.
// The RBACUtils class (utils/RBACUtils.ts) provides the full OO interface.

/** Returns true if the user holds the specified permission. */
export function checkPermission(
  userPermissions: Permission[] = [],
  requiredPermission: Permission
): boolean {
  if (!Array.isArray(userPermissions)) return false;
  return userPermissions.includes(requiredPermission);
}

/**
 * Returns true if `userRole` equals `requiredRole` OR inherits it
 * transitively via the role hierarchy.
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  if (!userRole || !requiredRole) return false;
  return (
    userRole === requiredRole ||
    (ROLE_HIERARCHY[userRole]?.includes(requiredRole) ?? false)
  );
}

/**
 * Returns true if the user holds at least one of the required permissions.
 * Always returns true when `requiredPermissions` is empty (no gate = open).
 */
export function checkAccess(
  _userRole: string,
  userPermissions: Permission[] = [],
  requiredPermissions: Permission[] = []
): boolean {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0)
    return true;
  return requiredPermissions.some(p => checkPermission(userPermissions, p));
}
