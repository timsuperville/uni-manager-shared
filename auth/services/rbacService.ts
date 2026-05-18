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

import type { Permission, Role } from '../types/auth.types';

export const rbacService = {
  checkPermission: (_userId: string, _permission: string): boolean => true,
  checkRole: (_userId: string, _role: string): boolean => true,
  getUserPermissions: (_userId: string): Permission[] => [],
  getUserRoles: (_userId: string): Role[] => []
};

export default rbacService;
