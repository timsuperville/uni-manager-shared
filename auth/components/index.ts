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

export { default as LoginForm } from './LoginForm';
export { default as SignupForm } from './SignupForm';
export { default as ForgotPasswordForm } from './ForgotPasswordForm';

// ── MFA Components ────────────────────────────────────────────────────────────

export { default as MFAVerification } from './MFAVerification';
export { default as MFASetup } from './MFASetup';

// ── OAuth Components ──────────────────────────────────────────────────────────

export { default as OAuthProviderComponents } from './OAuthProviderComponents';
export { default as OAuthCallback } from './OAuthCallback';

// ── Authorization & Access Control ────────────────────────────────────────────

export { default as ProtectedRoute } from './ProtectedRoute';
export { default as CahaGate, CAHA_TIER } from './CahaGate';
export type { CahaRole, CahaGateProps } from './CahaGate';

// ── Security Components ───────────────────────────────────────────────────────

export { default as SecurityDashboard } from './SecurityDashboard';

// ── Layout Components ─────────────────────────────────────────────────────────

export { default as AuthLayout } from './AuthLayout';

// ── User Management ───────────────────────────────────────────────────────────

export { default as UserMenu } from './UserMenu';
export { default as UserMenuItem } from './_userMenu/UserMenuItem';

// ── Legal Components ────────────────────────────────────────────────────────────

export { default as TermsOfService } from './legal/TermsOfService';
export { default as PrivacyPolicy } from './legal/PrivacyPolicy';

// Re-export default for convenience
export { default } from './LoginForm';
