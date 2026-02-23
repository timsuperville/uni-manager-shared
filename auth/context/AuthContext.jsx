import React, { createContext, useContext, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { AuthService } from "../services/authService.js";
import { useAuthState } from "../hooks/useAuthState.js";
import { useAuthActions } from "../hooks/useAuthActions.js";
import { useAuthCallbacks } from "../hooks/useAuthCallbacks.js";
import { RBACUtils } from "../rbac/utils.js";

const AuthContext = createContext(null);

/**
 * useAuth Hook
 * Access authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * AuthProvider Component
 * Provides authentication context to the app
 */
export const AuthProvider = ({
  children,
  config = {},
  onAuthStateChange,
  onError,
}) => {
  // Initialize auth service
  const authService = useMemo(() => new AuthService(config), [config]);

  // Use custom hooks for state management
  const {
    state,
    updateState,
    clearError,
    resetState,
    setLoading,
    setError,
    updateActivity,
  } = useAuthState();

  // Step 1: Create callback refs first (will be populated by useAuthCallbacks)
  const callbackRefsRef = useRef({
    onAuthStateChangeRef: { current: null },
    onErrorRef: { current: null },
  });

  // Step 2: Create actions with the callback refs
  const actions = useAuthActions(
    authService,
    updateState,
    setError,
    resetState,
    callbackRefsRef.current,
  );

  // Step 3: Set up callbacks with actions now available
  useAuthCallbacks(
    state,
    actions,
    onAuthStateChange,
    onError,
    config,
    callbackRefsRef.current,
  );

  // ─── RBAC Integration ────────────────────────────────────────────────────
  // Derive RBAC permission methods from user.rbac (returned by verify-token).
  // user.rbac.global contains the resolved permission strings for the current
  // session's appType (e.g. ['home:manage', 'task:create'] for a home owner).
  // user.rbac.role contains the human-readable role (e.g. 'owner').
  // These methods are exposed on the context so all components — including
  // PermissionGuard, RoleGuard, AdminGuard — work without extra wiring.
  const rbacMethods = useMemo(() => {
    const user = state.user;
    if (!user) {
      // Not authenticated: every check returns false
      const noop = () => false;
      return {
        hasPermission: noop,
        hasAnyPermission: noop,
        hasAllPermissions: noop,
        hasRole: noop,
        hasAnyRole: noop,
        hasMinimumRoleLevel: noop,
        isApplicationAdmin: noop,
        isAnyAdmin: noop,
        getApplicationRoles: () => [],
        getPermissionSummary: () => ({}),
      };
    }

    // Build a synthetic roles array from rbac context.
    // user.rbac.role is the domain role (e.g. 'owner', 'home_admin').
    // user.rbac.global holds the resolved permission strings.
    // We need to surface app-scoped roles so RBACUtils.hasRole('home_admin')
    // works even though the DB user.roles[] only stores platform roles.
    const rbacRole = user.rbac?.role;
    const appType = user.rbac?.app || "personal";

    // Build synthetic role array: platform roles + resolved app role
    const platformRoles = Array.isArray(user.roles)
      ? user.roles
      : user.role
        ? [user.role]
        : [];
    const appRoles = rbacRole ? [rbacRole] : [];

    // Try to map domain role names to RBAC role IDs used in roles.js
    // e.g. 'owner' (home) → 'home_admin', 'employee' (business) → 'business_user'
    const DOMAIN_ROLE_MAP = {
      home: {
        owner: "home_admin",
        adult: "home_user",
        child: "home_user",
        guest: "guest",
      },
      business: {
        owner: "business_admin",
        manager: "business_manager",
        accountant: "business_manager",
        employee: "business_user",
        viewer: "guest",
      },
      church: {
        admin: "church_admin",
        staff: "church_manager",
        leader: "church_manager",
        member: "church_user",
        visitor: "guest",
      },
      personal: { personal_user: "personal_user" },
      playback: { operator: "playback_admin", viewer: "playback_user" },
      admin: { super_admin: "super_admin", admin: "system_admin" },
    };

    const domainMap = DOMAIN_ROLE_MAP[appType] || {};
    const mappedAppRole = rbacRole ? domainMap[rbacRole] || rbacRole : null;
    const allRoles = [
      ...new Set([
        ...platformRoles,
        ...appRoles,
        ...(mappedAppRole ? [mappedAppRole] : []),
      ]),
    ];

    // Build a synthetic user object for RBACUtils that carries both
    // platform roles AND the resolved permission strings from verify-token
    const syntheticUser = {
      ...user,
      roles: allRoles,
      // Inject the resolved permission strings so RBACUtils.hasPermission()
      // checks these directly rather than expanding from ROLES definitions
      _resolvedPermissions: Array.isArray(user.rbac?.global)
        ? user.rbac.global
        : [],
    };

    // Extended RBACUtils that checks _resolvedPermissions first
    class SessionRBAC extends RBACUtils {
      hasPermission(permission) {
        // Check backend-resolved permissions first (most accurate)
        if (syntheticUser._resolvedPermissions.length > 0) {
          return syntheticUser._resolvedPermissions.includes(permission);
        }
        // Fallback to role-based expansion from roles.js
        return super.hasPermission(permission);
      }
      resolveUserPermissions() {
        if (syntheticUser._resolvedPermissions.length > 0) {
          return syntheticUser._resolvedPermissions;
        }
        return super.resolveUserPermissions();
      }
    }

    const rbac = new SessionRBAC(syntheticUser);

    return {
      hasPermission: (perm) => rbac.hasPermission(perm),
      hasAnyPermission: (perms) => rbac.hasAnyPermission(perms),
      hasAllPermissions: (perms) => rbac.hasAllPermissions(perms),
      hasRole: (role) => rbac.hasRole(role),
      hasAnyRole: (roles) => rbac.hasAnyRole(roles),
      hasMinimumRoleLevel: (level) => rbac.hasMinimumRoleLevel(level),
      isApplicationAdmin: (app) => rbac.isApplicationAdmin(app),
      isAnyAdmin: () => rbac.isAnyAdmin(),
      getApplicationRoles: (app) => rbac.getApplicationRoles(app),
      getPermissionSummary: () => rbac.getPermissionSummary(),
    };
  }, [state.user]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // State
      ...state,

      // Actions
      ...actions,

      // RBAC methods — derived from user.rbac hydrated by verify-token
      ...rbacMethods,

      // Utility methods
      clearError,
      updateActivity,

      // Service instance (for advanced use cases)
      authService,
    }),
    [state, actions, rbacMethods, clearError, updateActivity, authService],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  config: PropTypes.shape({
    appName: PropTypes.string,
    tokenRefreshInterval: PropTypes.number,
  }),
  onAuthStateChange: PropTypes.func,
  onError: PropTypes.func,
};

// Export both named and default
export { AuthContext };
export default AuthContext;
