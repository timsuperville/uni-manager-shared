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

export { default as LoginForm } from "./LoginForm.tsx";
export { default as SignupForm } from "./SignupForm.tsx";
export { default as ForgotPasswordForm } from "./ForgotPasswordForm.tsx";

// ── MFA Components ────────────────────────────────────────────────────────────

export { default as MFAVerification } from "./MFAVerification.tsx";
export { default as MFASetup } from "./MFASetup.tsx";

// ── OAuth Components ──────────────────────────────────────────────────────────

export { default as OAuthProviderComponents } from "./OAuthProviderComponents.tsx";
export { default as OAuthCallback } from "./OAuthCallback.tsx";

// ── Authorization & Access Control ────────────────────────────────────────────

export { default as ProtectedRoute } from "./ProtectedRoute.tsx";

// ── Security Components ───────────────────────────────────────────────────────

export { default as SecurityDashboard } from "./SecurityDashboard.tsx";

// ── Layout Components ─────────────────────────────────────────────────────────

export { default as AuthLayout } from "./AuthLayout.tsx";

// ── User Management ───────────────────────────────────────────────────────────

export { default as UserMenu } from "./UserMenu.tsx";

// Re-export default for convenience
export { default } from "./LoginForm.tsx";
