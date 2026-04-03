import React, { createContext, useContext, useMemo, useRef } from "react";
import { AuthService } from "../services/AuthService";
import { useAuthState } from "../hooks/useAuthState";
import { useAuthActions, type AuthServiceLike } from "../hooks/useAuthActions";
import {
  useAuthCallbacks,
  type AuthStateShape,
} from "../hooks/useAuthCallbacks";
import { RBACUtils } from "../utils/RBACUtils";
import type { Permission } from "../types/rbacRoles";
import { useApi } from "../../api/hooks/index";

import type { AuthContextType, User } from "../types/auth.types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthConfig {
  appName?: string;
  tokenRefreshInterval?: number;
  [key: string]: unknown;
}

/** Subset of auth state emitted by every notifyStateChange call. */
export interface AuthStateChangePayload {
  user?: User | null;
  isAuthenticated?: boolean;
  [key: string]: unknown;
}

interface AuthProviderProps {
  children: React.ReactNode;
  config?: AuthConfig;
  onAuthStateChange?: (authState: AuthStateChangePayload) => void;
  onError?: (error: Error | string) => void;
}

interface CallbackRef<T> {
  current: T | null;
}

interface CallbackRefs {
  onAuthStateChangeRef: CallbackRef<AuthProviderProps["onAuthStateChange"]>;
  onErrorRef: CallbackRef<AuthProviderProps["onError"]>;
}

type NoopBool = () => boolean;
type NoopArr = () => string[];
type NoopObj = () => Record<string, unknown>;

interface RBACMethods {
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  hasAllPermissions: (perms: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasMinimumRoleLevel: (level: number) => boolean;
  isApplicationAdmin: (app: string) => boolean;
  isAnyAdmin: () => boolean;
  getApplicationRoles: (app: string) => string[];
  getPermissionSummary: () => Record<string, unknown>;
}

// ── Domain → RBAC role map ────────────────────────────────────────────────────

const DOMAIN_ROLE_MAP: Record<string, Record<string, string>> = {
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
  // CAHA community journey stages — canonical per CAHA_PROTOCOL.md §1.1
  church: {
    steward: "church_steward",
    member: "church_user",
    attendee: "church_user",
    visitor: "guest",
    viewer: "guest",
  },
  personal: { personal_user: "personal_user" },
  playback: { operator: "playback_admin", viewer: "playback_user" },
  admin: { super_admin: "super_admin", admin: "system_admin" },
};

// ── Context ───────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * useAuth — Access authentication state and methods.
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ── SessionRBAC (inline subclass) ─────────────────────────────────────────────

type SyntheticUser = User & {
  _resolvedPermissions: Permission[];
  roles: string[];
};

class SessionRBAC extends (RBACUtils as new (
  user: SyntheticUser | null,
) => RBACUtils) {
  private readonly _resolved: Permission[];

  constructor(user: SyntheticUser) {
    super(user);
    // Note: _resolved may be undefined during super() if super() calls resolveUserPermissions();
    // the guard below handles that.
    this._resolved = user._resolvedPermissions ?? [];
  }

  hasPermission(permission: Permission): boolean {
    // Guard: _resolved may not be assigned yet if super() triggers this method
    if (this._resolved && this._resolved.length > 0)
      return this._resolved.includes(permission);
    return super.hasPermission(permission);
  }

  resolveUserPermissions(): Permission[] {
    // Guard: _resolved may not be assigned yet during super() constructor call
    if (this._resolved && this._resolved.length > 0) return this._resolved;
    return super.resolveUserPermissions();
  }
}

// ── RBAC methods builder ──────────────────────────────────────────────────────

function buildRBACMethods(user: User | null): RBACMethods {
  const noop: NoopBool = () => false;
  const noopArr: NoopArr = () => [];
  const noopObj: NoopObj = () => ({});

  if (!user) {
    return {
      hasPermission: noop,
      hasAnyPermission: noop,
      hasAnyRole: noop,
      hasAllPermissions: noop,
      hasRole: noop,
      hasMinimumRoleLevel: noop,
      isApplicationAdmin: noop,
      isAnyAdmin: noop,
      getApplicationRoles: noopArr,
      getPermissionSummary: noopObj,
    };
  }

  const extUser = user as User & {
    rbac?: { role?: string; app?: string; global?: string[] };
  };
  const rbacRole = extUser.rbac?.role;
  const appType = extUser.rbac?.app ?? "personal";

  const platformRoles: string[] = Array.isArray(user.roles)
    ? user.roles
    : user.role
      ? [user.role]
      : [];
  const appRoles = rbacRole ? [rbacRole] : [];
  const domainMap = DOMAIN_ROLE_MAP[appType] ?? {};
  const mappedAppRole = rbacRole ? (domainMap[rbacRole] ?? rbacRole) : null;
  const allRoles = [
    ...new Set([
      ...platformRoles,
      ...appRoles,
      ...(mappedAppRole ? [mappedAppRole] : []),
    ]),
  ];

  const syntheticUser: SyntheticUser = {
    ...user,
    roles: allRoles,
    // rbac.global contains string permission IDs that are valid Permission literals at runtime
    _resolvedPermissions: (Array.isArray(extUser.rbac?.global)
      ? extUser.rbac!.global!
      : []) as Permission[],
  };

  const rbac = new SessionRBAC(syntheticUser);

  return {
    hasPermission: (perm) => rbac.hasPermission(perm as Permission),
    hasAnyPermission: (perms) => rbac.hasAnyPermission(perms as Permission[]),
    hasAllPermissions: (perms) => rbac.hasAllPermissions(perms as Permission[]),
    hasRole: (role) => rbac.hasRole(role),
    hasAnyRole: (roles) => rbac.hasAnyRole(roles),
    hasMinimumRoleLevel: (level) => rbac.hasMinimumRoleLevel(level),
    isApplicationAdmin: (app) => rbac.isApplicationAdmin(app),
    isAnyAdmin: () => rbac.isAnyAdmin(),
    getApplicationRoles: (app) => rbac.getApplicationRoles(app),
    getPermissionSummary: () =>
      rbac.getPermissionSummary() as unknown as Record<string, unknown>,
  };
}

// ── AuthProvider ──────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  config = {},
  onAuthStateChange,
  onError,
}) => {
  const { apiClient } = useApi();
  const authService = useMemo(() => new AuthService(apiClient), [apiClient]);

  const {
    state,
    updateState,
    clearError,
    resetState,
    setError,
    updateActivity,
  } = useAuthState();

  // Step 1: Create callback refs (populated by useAuthCallbacks)
  const callbackRefsRef = useRef<CallbackRefs>({
    onAuthStateChangeRef: { current: null },
    onErrorRef: { current: null },
  });

  // Step 2: Create actions with the callback refs
  const actions = useAuthActions(
    authService as unknown as AuthServiceLike,
    updateState,
    setError,
    resetState,
    callbackRefsRef.current as unknown as Parameters<typeof useAuthActions>[4],
  );

  // Step 3: Set up callbacks with actions available
  useAuthCallbacks(
    state as unknown as AuthStateShape,
    actions,
    onAuthStateChange as ((state: Record<string, unknown>) => void) | undefined,
    onError as ((error: unknown) => void) | undefined,
    config,
    callbackRefsRef.current as unknown as Parameters<
      typeof useAuthCallbacks
    >[5],
  );

  // Derive RBAC methods from resolved user.rbac (injected by verify-token)
  const rbacMethods = useMemo(() => buildRBACMethods(state.user), [state.user]);

  // Memoize full context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      ...state,
      ...actions,
      ...rbacMethods,
      clearError,
      updateActivity,
      authService,
    }),
    [state, actions, rbacMethods, clearError, updateActivity, authService],
  ) as unknown as AuthContextType;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
