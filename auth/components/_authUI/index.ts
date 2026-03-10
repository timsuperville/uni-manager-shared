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

export { AuthButton } from "./AuthButton.tsx";
export { OAuthButton } from "./OAuthButton.tsx";
export { AuthInput } from "./AuthInput.tsx";
export { AuthContainer, AuthShellContext } from "./AuthContainer.tsx";
export { AuthCardContent } from "./AuthCardContent.tsx";
export { AuthDivider } from "./AuthDivider.tsx";
export { Alert } from "./Alert.tsx";
export { GoogleIcon } from "./GoogleIcon.tsx";
export {
  EyeIcon,
  EyeOffIcon,
  PasswordToggleButton,
} from "./PasswordToggle.tsx";
