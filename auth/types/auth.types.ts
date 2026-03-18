/**
 * Comprehensive Authentication System Type Definitions
 *
 * Unified type definitions for all authentication-related data structures.
 * This file consolidates types from both JSDoc and TypeScript sources.
 */

// ==================== USER TYPES ====================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Combined name (for backward compatibility)
  avatar?: string;
  avatarUrl?: string; // Alias for avatar
  coverImage?: string;
  coverImageUrl?: string; // Alias for coverImage
  role?: string;
  roles?: string[];
  permissions?: string[];
  /**
   * Populated by the backend — the user's active/selected church.
   * Can be a plain church ID string (pre-populate) or a partially-populated
   * object after login / switchChurch.
   */
  currentChurch?:
    | string
    | { _id?: string; id?: string; name?: string; logo?: string };
  /** Convenience scalar — mirrors currentChurch._id when populated as object */
  churchId?: string;
  /** Convenience scalar — mirrors currentChurch.name when populated as object */
  churchName?: string;
  churches?:
    | Array<{
        church:
          | string
          | { _id?: string; id?: string; name?: string; logo?: string };
        role: string;
      }>
    | string[];
  organizations?: string[];
  status?: "active" | "suspended" | "pending" | "inactive";
  mfaEnabled?: boolean;
  preferences?: UserPreferences;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastLoginAt?: Date | string;
  /** Allow app-specific fields (churchRole, title, position, etc.) at runtime */
  [key: string]: unknown;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

// ==================== AUTH STATE ====================

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sessionStatus: "inactive" | "active" | "warning" | "expired";
  lastActivity: number;
  sessionTimeRemaining: number | null;
  mfaRequired: boolean;
  mfaSetupRequired: boolean;
  mfaStatus: "none" | "enabled" | "pending" | null;
  deviceId: string | null;
  isTrustedDevice: boolean;
  oauthProviders: OAuthProvider[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token?: string | null;
  sessionStatus?: string;
  lastActivity?: number;
  sessionTimeRemaining?: number | null;
  mfaRequired?: boolean;
  mfaSetupRequired?: boolean;

  // Core auth methods
  login: (
    credentials: LoginCredentials,
  ) => Promise<LoginResult | LoginResponse>;
  logout: () => Promise<void | { success: boolean }>;
  signup?: (data: SignupData) => Promise<any>;

  // Token management
  refreshToken?: () => Promise<void>;
  refreshAuth?: () => Promise<boolean>;

  // Profile management
  updateProfile?: (updates: Partial<User>) => Promise<void | any>;
  updateUser?: (userData: Partial<User>) => Promise<boolean>;
  uploadAvatar?: (file: File) => Promise<any>;
  uploadCoverImage?: (file: File) => Promise<any>;

  // Password management
  forgotPassword?: (email: string) => Promise<any>;
  resetPassword?: (token: string, newPassword: string) => Promise<any>;
  changePassword?: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<any>;

  // Church management (app-specific)
  switchChurch?: (churchId: string) => Promise<any>;

  // State management
  checkAuthState?: () => Promise<{
    user: User | null;
    isAuthenticated: boolean;
  }>;
  updateActivity?: () => void;
  clearError?: () => void;

  // MFA
  verifyMFALogin?: (
    token: string,
    deviceFingerprint?: string | null,
    trustDevice?: boolean,
  ) => Promise<any>;

  // OAuth
  /** handleOAuthCallback — forwarded from authService via AuthProvider */
  handleOAuthCallback?: (params: URLSearchParams) => Promise<unknown>;
  /** loading — alias for isLoading retained for backward compatibility */
  loading?: boolean;

  // RBAC helpers — derived via buildRBACMethods and spread into context by AuthProvider
  hasPermission?: (permission: string) => boolean;
  hasAnyPermission?: (permissions: string[]) => boolean;
  hasAllPermissions?: (permissions: string[]) => boolean;
  hasRole?: (role: string) => boolean;
  hasAnyRole?: (roles: string[]) => boolean;
  hasMinimumRoleLevel?: (level: number) => boolean;
  isApplicationAdmin?: (app: string) => boolean;
  isAnyAdmin?: () => boolean;
  getApplicationRoles?: (app: string) => string[];
  getPermissionSummary?: () => Record<string, unknown>;

  /**
   * The underlying auth service instance — provides access to token storage
   * and other auth operations that are not exposed as individual context fields.
   * Use sparingly; prefer dedicated context fields where they exist.
   */
  authService?: {
    getStoredToken: () => string | null;
    [key: string]: unknown;
  };
}

// ==================== LOGIN & SIGNUP ====================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  appType?: AppType;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
  mfaRequired?: boolean;
  mfaSetupRequired?: boolean;
  mfaSetupCompleted?: boolean;
  userId?: string;
  tempToken?: string;
  requiresMFA?: boolean;
  session?: Session;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  sessionId?: string;
  expiresIn?: number;
  mfaRequired?: boolean;
  mfaChallenge?: string;
}

export interface LoginApiResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: {
    message: string;
    code: string;
    field?: string;
  };
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  appType?: string;
  agreeToTerms?: boolean;
}

// ==================== SESSION ====================

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  isTrusted: boolean;
  createdAt: Date | string;
  expiresAt: Date | string;
  lastActivityAt: Date | string;
}

export interface SessionManager {
  getToken: () => string | null;
  setToken: (token: string, rememberMe?: boolean) => void;
  removeToken: () => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (token: string) => void;
  removeRefreshToken: () => void;
  isTokenValid: () => boolean;
  getTokenExpiry: () => Date | null;
}

// ==================== MFA ====================

export interface MFAChallenge {
  method: "totp" | "sms" | "email" | "webauthn";
  challengeId: string;
  expiresIn: number;
  destination?: string;
}

export interface MFASetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  method: string;
}

// ==================== DEVICE ====================

export interface DeviceInfo {
  id: string;
  fingerprint: string;
  userAgent: string;
  ipAddress: string;
  os?: string;
  browser?: string;
  isMobile: boolean;
  isTrusted: boolean;
  createdAt: Date | string;
  lastSeenAt: Date | string;
}

// ==================== OAUTH ====================

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  description?: string;
  enabled: boolean;
}

// ==================== RBAC ====================

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage";
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date | string;
}

// ==================== SECURITY ====================

export interface SecurityAlert {
  id: string;
  type: "login_failure" | "mfa_failure" | "suspicious_activity" | string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  location?: string;
  deviceInfo?: string;
  createdAt: Date | string;
  acknowledged?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  statusCode?: string | number;
  details?: any;
  timestamp?: string;
}

// ==================== APP CONFIGURATION ====================

export type AppType =
  | "admin"
  | "church"
  | "business"
  | "home"
  | "personal"
  | "playback"
  | "default";

export type LoginTheme = "default" | "dark" | "minimal";

export interface AppConfig {
  title: string;
  description: string;
  icon: string;
  primaryColor: string;
  defaultRedirect: string;
}

export interface AuthConfig {
  appName?: string;
  appType?: string;
  apiEndpoint?: string;
  apiBaseUrl?: string;
  tokenRefreshInterval?: number;
  sessionTimeout?: number;
  inactivityTimeout?: number;
  enableActivityTracking?: boolean;
  enableMFA?: boolean;
  enableOAuth?: boolean;
  enableDeviceTrust?: boolean;
  enableRateLimit?: boolean;
  enableSecurityAlerts?: boolean;
}

// ==================== COMPONENT PROPS ====================

export interface LoginFormProps {
  appType?: AppType;
  appTitle?: string;
  appDescription?: string;
  onSuccess?: (result: LoginResult) => void;
  onError?: (error: Error) => void;
  theme?: LoginTheme;
  redirectPath?: string;
  showRememberMe?: boolean;
  showRegistration?: boolean;
  enableMFA?: boolean;
  trustDeviceAvailable?: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
  config?: AuthConfig;
  apiBaseUrl?: string;
  tokenStorageKey?: string;
  refreshTokenStorageKey?: string;
  autoRefreshInterval?: number;
  onAuthStateChange?: (state: Partial<AuthState>) => void;
  onError?: (error: Error | any) => void;
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
  [key: string]: string | undefined;
}

export interface LoginFormState {
  formData: LoginFormData;
  errors: ValidationErrors;
  isLoading: boolean;
  isSubmitting: boolean;
}

// ==================== EVENT HANDLERS ====================

export type FormChangeHandler = (
  e: React.ChangeEvent<HTMLInputElement>,
) => void;

export type FormSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => void;

// ==================== SERVICE TYPES ====================

export interface AuthServiceConfig extends AuthConfig {
  endpoints?: Record<string, string>;
  apiEndpoints?: Record<string, string>;
}

// ==================== BACKWARD COMPATIBILITY ====================

// Export commonly used type aliases
export type { User as UserType };
export type { LoginCredentials as Credentials };
export type { LoginResult as AuthResult };

// ==================== SERVICE INTERFACE TYPES ====================

/**
 * Structural interface for the auth service — allows AuthContext to depend on
 * an abstraction rather than the concrete AuthService class, enabling testing
 * and alternative implementations without coupling to the class file.
 */
export interface AuthServiceLike {
  initialize(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
  login(credentials: LoginCredentials): Promise<Record<string, unknown>>;
  logout(): Promise<void>;
  signup(data: SignupData): Promise<unknown>;
  resetPassword(email: string): Promise<unknown>;
  verifyMFA(code: string): Promise<Record<string, unknown>>;
  setupMFA(method: string): Promise<unknown>;
  refreshToken(): Promise<boolean>;
  updateUser(userData: Partial<User>): Promise<boolean>;
  switchChurch(churchId: string): Promise<Record<string, unknown>>;
}

/**
 * Minimal auth state shape used by auth callbacks and lifecycle hooks.
 * Intentionally loose (index signature) so partial state slices are accepted.
 */
export interface AuthStateShape {
  isAuthenticated: boolean;
  sessionExpiry: number | null;
  [key: string]: unknown;
}
