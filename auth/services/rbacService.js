/**
 * RBAC Service — Development Mock
 *
 * This is a placeholder stub used for cross-app authentication testing.
 * A production RBAC engine is not yet implemented.
 *
 * @see BL-xxx — Production RBAC implementation
 * @see backend/src/domains/core/auth — Backend role enforcement
 *
 * DO NOT import this directly in production feature code. Import via the
 * lazy-loader: import { getRBACService } from '@shared/auth/services'.
 */

export const rbacService = {
  checkPermission: () => true,
  checkRole: () => true,
  getUserPermissions: () => [],
  getUserRoles: () => [],
};

export default rbacService;
