import React, { createContext, useContext, useMemo, useRef } from "react";
import { AuthService } from "../services/authService.js";
import { useAuthState } from "../hooks/useAuthState.ts";
import { useAuthActions } from "../hooks/useAuthActions.ts";
import { useAuthCallbacks } from "../hooks/useAuthCallbacks.ts";
import { RBACUtils } from "../rbac/utils.ts";
import type { AuthContextType, User } from "../types/auth.types.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthConfig {
  appName?: string;
  tokenRefreshInterval?: number;
  [key: string]: unknown;
}

interface AuthProviderProps {
  children: React.ReactNode;
  config?: AuthConfig;
  onAuthStateChange?: (user: User | null, isAuthenticated: boolean) => void;
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
  home: { owner: "home_admin", adult: "home_user", child: "home_user", guest: "guest" },
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

type SyntheticUser = User & { _resolvedPermissions: string[]; roles: string[] };

class SessionRBAC extends (RBACUtils as new (user: SyntheticUser | null) => RBACUtils) {
  private readonly _resolved: string[];

  constructor(user: SyntheticUser) {
    super(user);
    this._resolved = user._resolvedPermissions;
  }

  hasPermission(permission: string): boolean {
    if (this._resolved.length > 0) return this._resolved.includes(permission);
    return super.hasPermission(permission);
  }

  resolveUserPermissions(): string[] {
    if (this._resolved.length > 0) return this._resolved;
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
    ...new Set([...platformRoles, ...appRoles, ...(mappedAppRole ? [mappedAppRole] : [])]),
  ];

  const syntheticUser: SyntheticUser = {
    ...user,
    roles: allRoles,
    _resolvedPermissions: Array.isArray(extUser.rbac?.global) ? extUser.rbac!.global! : [],
  };

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
    getPermissionSummary: () => rbac.getPermissionSummary() as Record<string, unknown>,
  };
}

// ── AuthProvider ──────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  config = {},
  onAuthStateChange,
  onError,
}) => {
  const authService = useMemo(() => new AuthService(config), [config]);

  const {
    state,
    updateState,
    clearError,
    resetState,
    setLoading,
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
    authService,
    updateState,
    setError,
    resetState,
    callbackRefsRef.current,
  );

  // Step 3: Set up callbacks with actions available
  useAuthCallbacks(
    state,
    actions,
    onAuthStateChange,
    onError,
    config,
    callbackRefsRef.current,
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
