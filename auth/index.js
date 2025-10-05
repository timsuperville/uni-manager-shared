/**
 * Unified Authentication System
 * Main entry point for shared authentication components, hooks, and utilities
 */

// Context
export { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Enhanced Authentication Context with Session Management
export {
  EnhancedAuthProvider,
  useEnhancedAuth,
} from "./EnhancedAuthContext.jsx";

// Components
export {
  LoginForm,
  SignupForm,
  ForgotPasswordForm,
  AuthLayout,
  ProtectedRoute,
  UserMenu,
} from "./components/index.js";

// Universal Login Component
export { default as UniversalLoginComponent } from "./components/UniversalLoginComponent.jsx";

// Session Management
export { default as SessionManager } from "./session/SessionManager.jsx";
export { default as SessionWarning } from "./session/SessionWarning.jsx";

// RBAC System Components
export {
  PermissionGuard,
  RoleGuard,
  RouteGuard,
  AdminGuard,
  ConditionalRender,
  PermissionButton,
  PermissionMenuItem,
  withPermissions,
  withRoles,
} from "./rbac/RBACComponents.jsx";

// RBAC System Utilities
export { RBACUtils, PermissionUtils, RouteUtils } from "./rbac/utils.js";
export {
  PERMISSIONS,
  ROLES,
  APPLICATION_ROLES,
  PROTECTED_ROUTES,
} from "./rbac/roles.js";

// Hooks
export { useAuthForm, usePermissions } from "./hooks/index.js";

// Services
export { default as UnifiedAuthService } from "./services/UnifiedAuthService.js";

// Utilities
export * from "./utils/authValidation.js";
export * from "./utils/tokenStorage.js";

// Configuration
export {
  APP_CONFIGS,
  getAppConfig,
  getCurrentAppName,
  getCurrentAppConfig,
} from "./config/appConfigs.js";
