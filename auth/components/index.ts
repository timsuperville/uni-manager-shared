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

// ── Core Authentication Forms ────────────────────────────────────────────────

export { default as LoginForm } from "./LoginForm.jsx";
export { default as SignupForm } from "./SignupForm.jsx";
export { default as ForgotPasswordForm } from "./ForgotPasswordForm.jsx";

// ── MFA Components ────────────────────────────────────────────────────────────

export { default as MFAVerification } from "./MFAVerification.jsx";
export { default as MFASetup } from "./MFASetup.jsx";

// ── OAuth Components ──────────────────────────────────────────────────────────

export { default as OAuthProviderComponents } from "./OAuthProviderComponents.jsx";
export { default as OAuthCallback } from "./OAuthCallback.jsx";

// ── Authorization & Access Control ────────────────────────────────────────────

export { default as ProtectedRoute } from "./ProtectedRoute.jsx";

// ── Security Components ───────────────────────────────────────────────────────

export { default as SecurityDashboard } from "./SecurityDashboard.jsx";

// ── Layout Components ─────────────────────────────────────────────────────────

export { default as AuthLayout } from "./AuthLayout.jsx";

// ── User Management ───────────────────────────────────────────────────────────

export { default as UserMenu } from "./UserMenu.jsx";

// Re-export default for convenience
export { default } from "./LoginForm.jsx";
