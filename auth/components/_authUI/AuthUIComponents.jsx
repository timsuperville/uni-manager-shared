/**
 * @deprecated
 *
 * This file is a legacy compatibility shim created during the AuthUIComponents
 * → _authUI/ split. It exists solely to avoid breaking consumer imports that
 * were temporarily pointed here during the refactor.
 *
 * STATUS: Safe to delete once this file has zero importers.
 * VERIFIED CLEAR: All known consumers (LoginForm, SignupForm,
 *   ForgotPasswordForm) have been migrated to import from "./_authUI"
 *   (index.js) as of commit 18eb5c929.
 *
 * HOW TO DELETE:
 *   1. Run: grep -r "AuthUIComponents" frontend/
 *   2. If no results → delete this file.
 *   3. If results remain → migrate those importers to "./_authUI" first.
 */

export { AuthButton } from "./AuthButton.jsx";
export { OAuthButton } from "./OAuthButton.jsx";
export { AuthInput } from "./AuthInput.jsx";
export { AuthContainer } from "./AuthContainer.jsx";
export { AuthCardContent } from "./AuthCardContent.jsx";
export { AuthDivider } from "./AuthDivider.jsx";
export { Alert } from "./Alert.jsx";
export { GoogleIcon } from "./GoogleIcon.jsx";
