/**
 * Shared Authentication Components Export Hub
 * ============================================
 *
 * Centralized export for all authentication-related UI components.
 * Organized by category for easier discovery and maintenance.
 *
 * Usage Examples:
 * ===============
 *
 * 1. Import specific components:
 *    import { LoginForm, SignupForm, ProtectedRoute } from '@shared/auth/components';
 *
 * 2. Import with aliases:
 *    import { LoginForm as AuthForm } from '@shared/auth/components';
 *
 * 3. Backward compatibility (all these work):
 *    import { UniversalLoginForm } from '@shared/auth/components';
 *    import { EnhancedLoginForm } from '@shared/auth/components';
 *    import { LoginForm } from '@shared/auth/components';
 *
 * Component Organization:
 * =======================
 * - Authentication Forms: Login, Signup, Password Reset
 * - MFA Components: Verification, Setup, Management, Wizards
 * - OAuth: Provider selection, callbacks
 * - Authorization: RBAC, Protected Routes
 * - Session Management: Status display, warnings
 * - Security: Dashboard, Monitoring
 * - Layout: Auth layouts, containers
 * - User Management: Menu, Profile
 */

// ============================================================================
// Core Authentication Forms
// ============================================================================

/**
 * LoginForm - Main authentication form component
 */
export { default as LoginForm } from "./LoginForm.jsx";

/**
 * Signup/Registration Form
 * Handles user account creation
 */
export { default as SignupForm } from "./SignupForm.jsx";

/**
 * Forgot Password Form
 * Initiates password reset flow
 */
export { default as ForgotPasswordForm } from "./ForgotPasswordForm.jsx";

// ============================================================================
// Multi-Factor Authentication (MFA) Components
// ============================================================================

/**
 * MFA Verification Component
 * Validates MFA codes during login
 */
export { default as MFAVerification } from "./MFAVerification.jsx";

/**
 * MFA Setup Component
 * Initial MFA configuration for user account
 */
export { default as MFASetup } from "./MFASetup.jsx";

/**
 * MFA Management Dashboard
 * View and manage MFA settings
 */
export { default as MFAManagementDashboard } from "./MFAManagementDashboard.jsx";

/**
 * MFA Setup Wizard
 * Step-by-step MFA configuration
 */
export { default as MFASetupWizard } from "./MFASetupWizard.jsx";

/**
 * MFA Login Integration
 * Seamless MFA integration in login flow
 */
export { default as MFALoginIntegration } from "./MFALoginIntegration.jsx";

/**
 * MFA Management Component
 * General MFA management interface
 */
export { default as MFAManagement } from "./MFAManagement.jsx";

// ============================================================================
// OAuth Components
// ============================================================================

/**
 * OAuth Provider Components
 * Social login buttons and provider selection
 */
export { default as OAuthProviderComponents } from "./OAuthProviderComponents.jsx";

/**
 * OAuth Callback Handler
 * Processes OAuth redirect callbacks
 */
export { default as OAuthCallback } from "./OAuthCallback.jsx";

// ============================================================================
// Authorization & Access Control
// ============================================================================

/**
 * Protected Route Component
 * Wraps routes that require authentication
 */
export { default as ProtectedRoute } from "./ProtectedRoute.jsx";

/**
 * RBAC Components
 * Role-based access control UI elements
 */
export { default as RBACComponents } from "./RBACComponents.jsx";

// ============================================================================
// Session Management
// ============================================================================

/**
 * Session Management Dashboard
 * View active sessions and manage session lifecycle
 */
export { default as SessionManagementDashboard } from "./SessionManagementDashboard.jsx";

/**
 * Session Warning Component
 * Warns user about session expiration
 */
export { default as SessionWarning } from "./SessionWarning.jsx";

// ============================================================================
// Security Components
// ============================================================================

/**
 * Security Dashboard
 * Overview of security settings and alerts
 */
export { default as SecurityDashboard } from "./SecurityDashboard.jsx";

// ============================================================================
// Layout Components
// ============================================================================

/**
 * Auth Layout Component
 * Standard layout for authentication pages
 */
export { default as AuthLayout } from "./AuthLayout.jsx";

// AppSwitcher removed — was dead code with zero consumers.

// ============================================================================
// User Management
// ============================================================================

/**
 * User Menu Component
 * Dropdown menu with user profile and actions
 */
export { default as UserMenu } from "./UserMenu.jsx";

// ============================================================================
// Available Components List
// ============================================================================

/**
 * Get list of all available components
 * Useful for debugging and discovery
 */
export function listAvailableComponents() {
  return {
    forms: ["LoginForm", "SignupForm", "ForgotPasswordForm"],
    mfa: [
      "MFAVerification",
      "MFASetup",
      "MFASetupWizard",
      "MFAManagement",
      "MFAManagementDashboard",
      "MFALoginIntegration",
    ],
    oauth: ["OAuthProviderComponents", "OAuthCallback"],
    authorization: ["ProtectedRoute", "RBACComponents"],
    session: ["SessionManagementDashboard", "SessionWarning"],
    security: ["SecurityDashboard"],
    layout: ["AuthLayout"],
    user: ["UserMenu"],
  };
}

// ============================================================================
// Backward Compatibility
// ============================================================================

/**
 * Re-export main login form as default for convenience
 */
export { default } from "./LoginForm.jsx";
