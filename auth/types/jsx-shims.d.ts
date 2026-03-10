/**
 * jsx-shims.d.ts
 *
 * Ambient module declarations for auth UI components that have not yet been
 * migrated to TypeScript. These stubs satisfy the compiler without silencing
 * real type errors in TypeScript files.
 *
 * Migration status: tracked under the TypeScript Strict-First Migration wave.
 * Each entry here should be removed once the corresponding file is renamed
 * to `.tsx` and given proper props types.
 *
 * TACTICAL: BL-TS-MIGRATE-AUTH-JSX — remove these shims as each file is migrated.
 */

import type { ComponentType } from "react";

declare module "*/LoginForm.jsx" {
  const LoginForm: ComponentType<Record<string, unknown>>;
  export default LoginForm;
}

declare module "*/SignupForm.jsx" {
  const SignupForm: ComponentType<Record<string, unknown>>;
  export default SignupForm;
}

declare module "*/ForgotPasswordForm.jsx" {
  const ForgotPasswordForm: ComponentType<Record<string, unknown>>;
  export default ForgotPasswordForm;
}

declare module "*/MFAVerification.jsx" {
  const MFAVerification: ComponentType<Record<string, unknown>>;
  export default MFAVerification;
}

declare module "*/MFASetup.jsx" {
  const MFASetup: ComponentType<Record<string, unknown>>;
  export default MFASetup;
}

declare module "*/OAuthProviderComponents.jsx" {
  const OAuthProviderComponents: ComponentType<Record<string, unknown>>;
  export default OAuthProviderComponents;
}

declare module "*/OAuthCallback.jsx" {
  const OAuthCallback: ComponentType<Record<string, unknown>>;
  export default OAuthCallback;
}

declare module "*/ProtectedRoute.jsx" {
  const ProtectedRoute: ComponentType<Record<string, unknown>>;
  export default ProtectedRoute;
}

declare module "*/SecurityDashboard.jsx" {
  const SecurityDashboard: ComponentType<Record<string, unknown>>;
  export default SecurityDashboard;
}

declare module "*/AuthLayout.jsx" {
  const AuthLayout: ComponentType<Record<string, unknown>>;
  export default AuthLayout;
}

declare module "*/UserMenu.jsx" {
  const UserMenu: ComponentType<Record<string, unknown>>;
  export default UserMenu;
}

declare module "*/AuthButton.jsx" {
  const AuthButton: ComponentType<Record<string, unknown>>;
  export default AuthButton;
}

declare module "*/OAuthButton.jsx" {
  const OAuthButton: ComponentType<Record<string, unknown>>;
  export default OAuthButton;
}

declare module "*/AuthInput.jsx" {
  const AuthInput: ComponentType<Record<string, unknown>>;
  export default AuthInput;
}

declare module "*/AuthContainer.jsx" {
  const AuthContainer: ComponentType<Record<string, unknown>>;
  export default AuthContainer;
}

declare module "*/AuthCardContent.jsx" {
  const AuthCardContent: ComponentType<Record<string, unknown>>;
  export default AuthCardContent;
}

declare module "*/AuthDivider.jsx" {
  const AuthDivider: ComponentType<Record<string, unknown>>;
  export default AuthDivider;
}

declare module "*/Alert.jsx" {
  const Alert: ComponentType<Record<string, unknown>>;
  export default Alert;
}

declare module "*/GoogleIcon.jsx" {
  const GoogleIcon: ComponentType<Record<string, unknown>>;
  export default GoogleIcon;
}

declare module "*/PasswordToggle.jsx" {
  const PasswordToggle: ComponentType<Record<string, unknown>>;
  export default PasswordToggle;
}

declare module "*/RBACComponents.jsx" {
  export const PermissionGuard: ComponentType<Record<string, unknown>>;
  export const RoleGuard: ComponentType<Record<string, unknown>>;
  export const FeatureGuard: ComponentType<Record<string, unknown>>;
}
