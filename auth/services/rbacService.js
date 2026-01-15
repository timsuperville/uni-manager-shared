/**
 * RBAC Service Mock
 * Simple mock for Cross-App Authentication Testing
 */

export const rbacService = {
  checkPermission: () => true,
  checkRole: () => true,
  getUserPermissions: () => [],
  getUserRoles: () => [],
};

export default rbacService;
