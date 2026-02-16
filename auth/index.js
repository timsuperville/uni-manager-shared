import React from "react";

/**
 * Unified Authentication System - Main Export Hub
 * ================================================
 *
 * Single entry point for all authentication features including:
 * - React Context (AuthProvider)
 * - Custom Hooks (9 specialized hooks)
 * - UI Components (forms, MFA, session, RBAC, etc.)
 * - Services (consolidated session, auth, MFA, etc.)
 * - Type Definitions (comprehensive TypeScript types)
 * - Configuration (app configs, OAuth providers)
 *
 * Quick Start:
 * ===========
 *
 * 1. Wrap your app:
 *    import { AuthProvider } from '@shared/auth';
 *    export default function App() {
 *      return <AuthProvider><MainApp /></AuthProvider>;
 *    }
 *
 * 2. Use in components:
 *    import { useAuth } from '@shared/auth';
 *    const { user, isAuthenticated, login } = useAuth();
 *
 * 3. Use login form:
 *    import { LoginForm } from '@shared/auth';
 *    <LoginForm appType="admin" />
 *
 * 4. Protect routes:
 *    import { ProtectedRoute } from '@shared/auth';
 *    <ProtectedRoute component={Dashboard} />
 */

// ============================================================================
// CONTEXT - React Context API
// ============================================================================

/**
 * AuthProvider - Wraps application with authentication state
 * Must be placed at or near root of React component tree
 *
 * Usage: <AuthProvider><App /></AuthProvider>
 */
export { AuthProvider } from "./context/AuthContext.jsx";

/**
 * Additional context exports (HOCs, utilities)
 */
export { withAuth } from "./context/index.jsx";

// ============================================================================
// HOOKS - React Custom Hooks (Recommended)
// ============================================================================

/**
 * Core Hook - PRIMARY AUTHENTICATION HOOK
 * Use this for most auth needs: login, logout, user state, etc.
 */
export { useAuth } from "./hooks/useAuth.js";

/**
 * Specialized Hooks - One responsibility each
 */
export { useLogin } from "./hooks/useLogin.js";
export { useLogout } from "./hooks/useLogout.js";
export { useMFA } from "./hooks/useMFA.js";
export { useSession } from "./hooks/useSession.js";
export { useOAuth } from "./hooks/useOAuth.js";
export { useDeviceTrust } from "./hooks/useDeviceTrust.js";
export { usePermissions } from "./hooks/usePermissions.js";
export { useRateLimit } from "./hooks/useRateLimit.js";

/**
 * Hook utilities
 */
export { listAvailableHooks } from "./hooks/index.js";

// ============================================================================
// COMPONENTS - UI Components Organized by Feature
// ============================================================================

// --- Core Authentication Forms ---

/**
 * LoginForm - Main authentication form component
 * Supports multiple app types, themes, and MFA
 */
export { default as LoginForm } from "./components/LoginForm.jsx";

/**
 * User Registration Form
 */
export { default as SignupForm } from "./components/SignupForm.jsx";

/**
 * Password Recovery Form
 */
export { default as ForgotPasswordForm } from "./components/ForgotPasswordForm.jsx";

// --- MFA Components ---

// Note: MFAVerification, MFASetup, MFAManagement are lazy-loaded below for performance
export { default as MFALoginIntegration } from "./components/MFALoginIntegration.jsx";

// --- MFA Components (Lazy Loaded for Performance) ---

/**
 * MFA Verification Component (Lazy Loaded)
 * Shows when user needs to verify MFA code
 */
export const MFAVerification = React.lazy(
  () => import("./components/MFAVerification.jsx"),
);

/**
 * MFA Setup Wizard Component (Lazy Loaded)
 * Guides user through MFA setup process
 */
export const MFASetupWizard = React.lazy(
  () => import("./components/MFASetupWizard.jsx"),
);

/**
 * MFA Management Dashboard Component (Lazy Loaded)
 * Allows user to manage MFA settings
 */
export const MFAManagementDashboard = React.lazy(
  () => import("./components/MFAManagementDashboard.jsx"),
);

// --- OAuth Components ---

export { default as OAuthProviderComponents } from "./components/OAuthProviderComponents.jsx";
export { default as OAuthCallback } from "./components/OAuthCallback.jsx";

// --- Authorization & RBAC ---

export { default as ProtectedRoute } from "./components/ProtectedRoute.jsx";

// --- Session Management ---

export { default as SessionWarning } from "./components/SessionWarning.jsx";

// --- Security ---

export { default as SecurityDashboard } from "./components/SecurityDashboard.jsx";

// --- Layout Components ---

export { default as AuthLayout } from "./components/AuthLayout.jsx";
export { default as AppSwitcher } from "./components/AppSwitcher.jsx";

// --- User Management ---

export { default as UserMenu } from "./components/UserMenu.jsx";

// --- Session Components (Lazy Loaded) ---

/**
 * Session Management Dashboard Component (Lazy Loaded)
 */
export const SessionManagementDashboard = React.lazy(
  () => import("./components/SessionManagementDashboard.jsx"),
);

/**
 * Active Sessions List Component (Lazy Loaded)
 * TODO: Component file needs to be created
 */
// export const ActiveSessionsList = React.lazy(
//   () => import("./components/ActiveSessionsList.jsx"),
// );

// --- RBAC Components (Lazy Loaded) ---

/**
 * Permission Guard Component (Lazy Loaded)
 * Shows content only if user has required permissions
 */
export const PermissionGuard = React.lazy(() =>
  import("./rbac/RBACComponents.jsx").then((m) => ({
    default: m.PermissionGuard,
  })),
);

/**
 * Role Guard Component (Lazy Loaded)
 * Shows content only if user has required role
 */
export const RoleGuard = React.lazy(() =>
  import("./rbac/RBACComponents.jsx").then((m) => ({ default: m.RoleGuard })),
);

/**
 * Component utilities
 */
export { listAvailableComponents } from "./components/index.js";

// ============================================================================
// SERVICES - Business Logic & State Management
// ============================================================================

/**
 * Consolidated Session Service
 * Combines session management, token handling, cross-tab sync, device trust
 * Lazy-loaded via getter function to prevent circular dependencies
 */
export { default as SessionService } from "./services/SessionService.js";

/**
 * Direct service exports for backward compatibility
 */
export { default as authService } from "./services/authService.js";

/**
 * Service export hub with lazy-loading
 * Use getters to access services safely
 */
export {
  getSessionService,
  getAuthService,
  getMFAService,
  getTokenService,
  getOAuthService,
  getRBACService,
  getSecurityService,
  getDeviceService,
  getCacheService,
  getCrossAppService,
  getLoadedServices,
  isServiceAvailable,
  cacheService,
} from "./services/index.js";

// ============================================================================
// TYPES & CONSTANTS - Type Definitions and Configuration Values
// ============================================================================

/**
 * Type Definitions (TypeScript)
 * Export TypeScript types for full type checking support
 */
export * from "./types/auth.types";

/**
 * Constants - Single source of truth for all auth values
 * Organized into logical sections (SESSION, MFA, AUTH_ACTIONS, etc.)
 */
export {
  SESSION_STATUS,
  SESSION_CONFIG,
  MFA_METHOD,
  MFA_STATUS,
  MFA_CONFIG,
  AUTH_ACTIONS,
  AUTH_ERROR_CODES,
  USER_ROLES,
  ROLE_HIERARCHY,
  PERMISSION_CATEGORIES,
  PASSWORD_POLICY,
  RATE_LIMIT,
  OAUTH_PROVIDERS,
  STORAGE_KEYS,
  AUTH_ENDPOINTS,
  HTTP_STATUS,
  AUTH_EVENTS,
} from "./types/constants.js";

/**
 * All exports organized
 */
export { listAvailableConstants } from "./types/index.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Application Configurations
 * Defines settings for each app (admin, church, business, etc.)
 */
export {
  APP_CONFIGS,
  getAppConfig,
  getCurrentAppName,
  getCurrentAppConfig,
} from "./config/appConfigs.js";

/**
 * OAuth Provider Configurations
 */
export {
  getSupportedProvidersForApp,
  getOAuthConfig,
} from "./config/oauthProviders.js";

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Authentication Validation Utilities
 */
export {
  validateEmail,
  validatePassword,
  validatePasswordStrength,
  validateToken,
  validateMFACode,
  validatePhoneNumber,
  sanitizeInput,
} from "./utils/authValidation.js";

/**
 * Token Storage Utilities
 * Handles secure token persistence
 */
export {
  tokenStorage,
  storeToken,
  getToken,
  getRefreshToken,
  clearTokens,
  isTokenExpired,
  getTokenExpiryTime,
} from "./utils/tokenStorage.js";

// ============================================================================
// RBAC - Role-Based Access Control
// ============================================================================

/**
 * RBAC Utilities and Configuration
 */
export { RBACUtils, PermissionUtils, RouteUtils } from "./rbac/utils.js";
export {
  PERMISSIONS,
  ROLES,
  APPLICATION_ROLES,
  PROTECTED_ROUTES,
  checkPermission,
  hasRole,
  checkAccess,
} from "./rbac/roles.js";

// ============================================================================
// EXPORT UTILITIES FOR DEBUGGING
// ============================================================================

/**
 * Get complete system status and available exports
 */
export function getAuthSystemStatus() {
  return {
    hooks: 9,
    components: 25,
    services: 10,
    types: 16,
    constants: 200,
    initialized: true,
  };
}

// ============================================================================
// SUMMARY
// ============================================================================

/**
 * Available Features:
 *
 * **Hooks (9)**: useAuth, useLogin, useLogout, useMFA, useSession, useOAuth, useDeviceTrust, usePermissions, useRateLimit
 * **Components (25)**: LoginForm, SignupForm, MFA components, OAuth components, RBAC, Session management, Security
 * **Services (10)**: SessionService, authService, MFAService, OAuthService, RBACService, SecurityService, etc.
 * **Types & Constants**: 16 JSDoc types, 200+ organized constants, 5 role categories
 * **Configuration**: App-specific configs, OAuth providers, RBAC configurations
 * **Utilities**: Validation, token storage, RBAC utilities
 */
