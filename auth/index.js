/**
 * Unified Authentication System - Main Export Hub
 * ================================================
 *
 * Single entry point for all authentication features including:
 * - React Context (AuthProvider)
 * - Custom Hooks (9 specialized hooks)
 * - UI Components (forms, MFA, session, RBAC, etc.)
 * - Services (consolidated session, auth, MFA, etc.)
 * - Type Definitions (16 JSDoc types, 200+ constants)
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
 *
 * File Organization:
 * ==================
 * context/         - React Context & Provider
 * hooks/          - 9 specialized React hooks
 * components/     - UI components organized by feature
 * services/       - Business logic & state management
 * types/          - Type definitions & constants
 * config/         - Application configuration
 * utils/          - Helper functions & utilities
 * rbac/           - Role-based access control
 */

/* global process, console */

// ============================================================================
// CONTEXT - React Context API
// ============================================================================

/**
 * AuthProvider - Wraps application with authentication state
 * Must be placed at or near root of React component tree
 *
 * Usage: <AuthProvider><App /></AuthProvider>
 */
export { AuthProvider } from './context/AuthProvider.jsx';

/**
 * useAuth (from context) - Deprecated, prefer hooks/useAuth.js
 * Re-exported for backward compatibility only
 */
export { useAuth as useAuthContext } from './context/AuthContext.jsx';

/**
 * Additional context exports (HOCs, utilities)
 */
export { withAuth } from './context/index.jsx';

// ============================================================================
// HOOKS - React Custom Hooks (Recommended)
// ============================================================================

/**
 * Core Hook - PRIMARY AUTHENTICATION HOOK
 * Use this for most auth needs: login, logout, user state, etc.
 */
export { useAuth } from './hooks/useAuth.js';

/**
 * Specialized Hooks - One responsibility each
 */
export { useLogin } from './hooks/useLogin.js';
export { useLogout } from './hooks/useLogout.js';
export { useMFA } from './hooks/useMFA.js';
export { useSession } from './hooks/useSession.js';
export { useOAuth } from './hooks/useOAuth.js';
export { useDeviceTrust } from './hooks/useDeviceTrust.js';
export { usePermissions } from './hooks/usePermissions.js';
export { useRateLimit } from './hooks/useRateLimit.js';

/**
 * Legacy hooks (marked for deprecation)
 */
export { useAuthForm } from './hooks/useAuthForm.js';

/**
 * Hook utilities
 */
export { listAvailableHooks } from './hooks/index.js';

// ============================================================================
// COMPONENTS - UI Components Organized by Feature
// ============================================================================

// --- Core Authentication Forms ---

/**
 * LoginForm - Main authentication form component
 * Supports multiple app types, themes, and MFA
 * Backward compatibility aliases: UnifiedLoginForm, UniversalLoginForm, EnhancedLoginForm
 */
export {
  default as LoginForm,
  UnifiedLoginForm,
  UniversalLoginForm,
  EnhancedLoginForm,
} from './components/LoginForm.jsx';

/**
 * User Registration Form
 */
export { default as SignupForm } from './components/SignupForm.jsx';

/**
 * Password Recovery Form
 */
export { default as ForgotPasswordForm } from './components/ForgotPasswordForm.jsx';

// --- MFA Components ---

export { default as MFAVerification } from './components/MFAVerification.jsx';
export { default as MFASetup } from './components/MFASetup.jsx';
export { default as MFASetupWizard } from './components/MFASetupWizard.jsx';
export { default as MFAManagement } from './components/MFAManagement.jsx';
export { default as MFAManagementDashboard } from './components/MFAManagementDashboard.jsx';
export { default as MFALoginIntegration } from './components/MFALoginIntegration.jsx';

// --- OAuth Components ---

export { default as OAuthProviderComponents } from './components/OAuthProviderComponents.jsx';
export { default as OAuthCallback } from './components/OAuthCallback.jsx';

// --- Authorization & RBAC ---

export { default as ProtectedRoute } from './components/ProtectedRoute.jsx';
export { default as RBACComponents } from './components/RBACComponents.jsx';

// --- Session Management ---

export { default as SessionManagementDashboard } from './components/SessionManagementDashboard.jsx';
export { default as SessionWarning } from './components/SessionWarning.jsx';

// --- Security ---

export { default as SecurityDashboard } from './components/SecurityDashboard.jsx';

// --- Layout Components ---

export { default as AuthLayout } from './components/AuthLayout.jsx';
export { default as AppSwitcher } from './components/AppSwitcher.jsx';

// --- User Management ---

export { default as UserMenu } from './components/UserMenu.jsx';

/**
 * Component utilities
 */
export { listAvailableComponents } from './components/index.js';

// ============================================================================
// SERVICES - Business Logic & State Management
// ============================================================================

/**
 * Consolidated Session Service
 * Combines session management, token handling, cross-tab sync, device trust
 * Lazy-loaded via getter function to prevent circular dependencies
 */
export { default as SessionService } from './services/SessionService.js';

/**
 * Direct service exports for backward compatibility
 */
export { default as authService } from './services/authService.js';

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
} from './services/index.js';

// ============================================================================
// TYPES & CONSTANTS - Type Definitions and Configuration Values
// ============================================================================

/**
 * Type Definitions (JSDoc - for IDE intellisense)
 * Export JSDoc types for TypeScript-like type checking
 */
export * from './types/auth.types.js';

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
} from './types/constants.js';

/**
 * All exports organized
 */
export { listAvailableConstants } from './types/index.js';

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
} from './config/appConfigs.js';

/**
 * OAuth Provider Configurations
 */
export { getSupportedProvidersForApp, getOAuthConfig } from './config/oauthProviders.js';

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
} from './utils/authValidation.js';

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
} from './utils/tokenStorage.js';

// ============================================================================
// RBAC - Role-Based Access Control
// ============================================================================

/**
 * RBAC Utilities and Configuration
 */
export { RBACUtils, PermissionUtils, RouteUtils } from './rbac/utils.js';
export {
  PERMISSIONS,
  ROLES,
  APPLICATION_ROLES,
  PROTECTED_ROUTES,
  checkPermission,
  hasRole,
  checkAccess,
} from './rbac/roles.js';

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

/**
 * Log all available exports (development only)
 */
export function logAuthSystemExports() {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
    return;
  }

  if (typeof console !== 'undefined') {
    console.group('🔐 Authentication System Exports');
    console.log('Hooks:', [
      'useAuth (primary)',
      'useLogin',
      'useLogout',
      'useMFA',
      'useSession',
      'useOAuth',
      'useDeviceTrust',
      'usePermissions',
      'useRateLimit',
    ]);
    console.log('Components:', 25);
    console.log('Services:', 10);
    console.log('Constants:', 200);
    console.log('Type Definitions:', 16);
    console.groupEnd();
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

/**
 * What's Available:
 *
 * **Hooks (9 total)**
 * - useAuth: Primary hook for all auth operations
 * - useLogin, useLogout, useMFA: Specialized hooks
 * - useSession, useOAuth, useDeviceTrust: Feature-specific hooks
 * - usePermissions, useRateLimit: Security/utility hooks
 *
 * **Components (25 total)**
 * - LoginForm, SignupForm, ForgotPasswordForm
 * - MFA components (6 total)
 * - OAuth components (2 total)
 * - RBAC & Protection components
 * - Session management & security
 * - Layout components
 *
 * **Services (10 total)**
 * - SessionService (consolidated from 4 files)
 * - 9 other core services via lazy-loading
 *
 * **Types & Constants**
 * - 16 JSDoc type definitions
 * - 200+ organized constants
 * - 5 role categories with permissions
 *
 * **Configuration**
 * - App-specific configs (admin, church, business, etc.)
 * - OAuth provider configs
 * - RBAC configurations
 *
 * **Utilities**
 * - Validation functions
 * - Token storage management
 * - RBAC utilities
 *
 * Migration from old structure:
 * - All old imports still work (backward compatible)
 * - New code should use hooks instead of context
 * - Services auto-lazy-load to prevent circular deps
 */
