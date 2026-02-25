/**
 * _authUI barrel
 *
 * Re-exports every auth form primitive so that existing consumers can keep
 * importing from "./AuthUIComponents" without change, while each primitive
 * now lives in its own sovereign file.
 */

export { AuthButton } from "./AuthButton.jsx";
export { OAuthButton } from "./OAuthButton.jsx";
export { AuthInput } from "./AuthInput.jsx";
export { AuthContainer } from "./AuthContainer.jsx";
export { AuthCardContent } from "./AuthCardContent.jsx";
export { AuthDivider } from "./AuthDivider.jsx";
export { Alert } from "./Alert.jsx";
export { GoogleIcon } from "./GoogleIcon.jsx";
