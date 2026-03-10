/**
 * RBAC Components Re-exports
 *
 * Backward-compat shim — all RBAC logic lives canonically in `rbac/RBACComponents.jsx`.
 * Import from `@shared/auth` or `@shared/auth/rbac/RBACComponents` directly in new code.
 */

export {
  RBACProvider,
  useRBAC,
  PermissionGuard,
  RoleGuard,
  ApplicationGuard,
  RouteGuard,
  AdminGuard,
  ConditionalRender,
  withPermissions,
  withRoles,
  PermissionButton,
  PermissionMenuItem,
  FeatureGuard,
} from "./RBACComponents.jsx";
