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

export { AuthButton } from "./AuthButton.jsx";
export { OAuthButton } from "./OAuthButton.jsx";
export { AuthInput } from "./AuthInput.jsx";
export { AuthContainer } from "./AuthContainer.jsx";
export { AuthCardContent } from "./AuthCardContent.jsx";
export { AuthDivider } from "./AuthDivider.jsx";
export { Alert } from "./Alert.jsx";
export { GoogleIcon } from "./GoogleIcon.jsx";
