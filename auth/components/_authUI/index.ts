/**
 * @module _authUI
 *
 * Internal auth-form primitives.
 * All consumers should import from this barrel:
 *
 *   import { AuthButton, AuthInput, … } from "./_authUI";
 *
 * Do NOT import from individual files directly — this barrel is the stable
 * public surface for the _authUI layer.
 */

export { AuthButton } from './AuthButton';
export { OAuthButton } from './OAuthButton';
export { AuthInput } from './AuthInput';
export { AuthContainer, AuthShellContext } from './AuthContainer';
export { AuthCardContent } from './AuthCardContent';
export { AuthDivider } from './AuthDivider';
export { Alert } from './Alert';
export { GoogleIcon } from './GoogleIcon';
export { EyeIcon, EyeOffIcon, PasswordToggleButton } from './PasswordToggle';
