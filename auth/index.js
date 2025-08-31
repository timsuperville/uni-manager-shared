/**
 * Unified Authentication System
 * Main entry point for shared authentication components, hooks, and utilities
 */

// Context
export { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Components
export {
  LoginForm,
  SignupForm,
  ForgotPasswordForm,
  AuthLayout,
  ProtectedRoute,
  UserMenu,
} from "./components/index.js";

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
