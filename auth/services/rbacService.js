/**
 * RBAC Service Mock
 * Simple mock for Cross-App Authentication Testing
 */

export const rbacService = {
  checkPermission: (_user, _permission) => true,
  checkRole: (_user, _role) => true,
  getUserPermissions: (_user) => [],
  getUserRoles: (_user) => []
};

export default rbacService;