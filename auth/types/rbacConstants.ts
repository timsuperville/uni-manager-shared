/**
 * Role-Based Access Control Constants
 *
 * Constants for user roles, permissions, and RBAC action types.
 */

// ==================== USER ROLES ====================

/**
 * Predefined user roles
 */
export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
  GUEST: "guest",
};

/**
 * Role hierarchy (lower number = higher privilege)
 */
export const ROLE_HIERARCHY = {
  super_admin: 0,
  admin: 1,
  moderator: 2,
  user: 3,
  guest: 4,
};

// ==================== PERMISSIONS ====================

/**
 * Common permission strings
 */
export const PERMISSIONS = {
  // User Management
  CREATE_USER: "user:create",
  READ_USER: "user:read",
  UPDATE_USER: "user:update",
  DELETE_USER: "user:delete",

  // Content Management
  CREATE_CONTENT: "content:create",
  READ_CONTENT: "content:read",
  UPDATE_CONTENT: "content:update",
  DELETE_CONTENT: "content:delete",
  PUBLISH_CONTENT: "content:publish",

  // System Administration
  MANAGE_SETTINGS: "system:settings",
  VIEW_ANALYTICS: "system:analytics",
  MANAGE_ROLES: "system:roles",
  MANAGE_PERMISSIONS: "system:permissions",
};

/**
 * Permission categories for grouping
 */
export const PERMISSION_CATEGORIES = {
  USER: "user",
  CONTENT: "content",
  SYSTEM: "system",
};

/**
 * Permission actions
 */
export const PERMISSION_ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage",
  PUBLISH: "publish",
};

// ==================== RBAC ACTION TYPES ====================

/**
 * RBAC-related action types for context reducer
 */
export const RBAC_ACTIONS = {
  UPDATE_PERMISSIONS: "UPDATE_PERMISSIONS",
  UPDATE_ROLES: "UPDATE_ROLES",
  ADD_PERMISSION: "ADD_PERMISSION",
  REMOVE_PERMISSION: "REMOVE_PERMISSION",
};
