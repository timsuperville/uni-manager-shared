/**
 * Shared Authentication Components Export Hub
 * ============================================
 *
 * Centralized export for all authentication-related UI components.
 * Organized by category for easier discovery and maintenance.
 *
 * Usage:
 *   import { LoginForm, SignupForm, ProtectedRoute } from '@shared/auth/components';
 *   import { LoginForm as AuthForm } from '@shared/auth/components';
 */

// ============================================================================
// Core Authentication Forms
// ============================================================================

/** LoginForm — main authentication form */
export { default as LoginForm } from "./LoginForm.jsx";

/** SignupForm — user account creation */
export { default as SignupForm } from "./SignupForm.jsx";

/** ForgotPasswordForm — initiates password reset flow */
export { default as ForgotPasswordForm } from "./ForgotPasswordForm.jsx";

// ============================================================================
// MFA Components (used internally by LoginForm)
// ============================================================================

/** MFAVerification — TOTP/backup code input rendered inside the login flow */
export { default as MFAVerification } from "./MFAVerification.jsx";

/** MFASetup — step-by-step MFA enrollment rendered inside the login flow */
export { default as MFASetup } from "./MFASetup.jsx";

// ============================================================================
// OAuth Components
// ============================================================================

/** OAuthProviderComponents — social login buttons and provider icons */
export { default as OAuthProviderComponents } from "./OAuthProviderComponents.jsx";

/** OAuthCallback — processes OAuth redirect callbacks */
export { default as OAuthCallback } from "./OAuthCallback.jsx";

// ============================================================================
// Authorization & Access Control
// ============================================================================

/** ProtectedRoute — wraps routes that require authentication */
export { default as ProtectedRoute } from "./ProtectedRoute.jsx";

/** RBACComponents — role-based access control UI elements */
export { default as RBACComponents } from "./RBACComponents.jsx";

// ============================================================================
// Session Management
// ============================================================================

/** SessionManagementDashboard — view and manage active sessions */
export { default as SessionManagementDashboard } from "./SessionManagementDashboard.jsx";

// ============================================================================
// Security Components
// ============================================================================

/** SecurityDashboard — security events, stats, and alerts */
export { default as SecurityDashboard } from "./SecurityDashboard.jsx";

// ============================================================================
// Layout Components
// ============================================================================

/** AuthLayout — split-screen Liquid Glass wrapper for all auth pages */
export { default as AuthLayout } from "./AuthLayout.jsx";

// ============================================================================
// User Management
// ============================================================================

/** UserMenu — dropdown with user profile and session actions */
export { default as UserMenu } from "./UserMenu.jsx";

// Re-export default for convenience
export { default } from "./LoginForm.jsx";
