# Authentication System Best Practices

This guide outlines best practices for working with the authentication system to ensure security, maintainability, and optimal performance.

---

## 🔒 Security Best Practices

### 1. Token Storage

**✅ DO:**

- Use `TokenManagementService` for all token operations
- Store tokens in httpOnly cookies when possible
- Use sessionStorage for PKCE verifiers (auto-cleared on tab close)
- Implement automatic token refresh before expiration

**❌ DON'T:**

- Store tokens in localStorage (vulnerable to XSS)
- Log tokens to console
- Send tokens in URL parameters
- Share tokens across origins

```javascript
// ✅ Good
import { TokenManagementService } from "@shared/auth/services";

const tokenService = new TokenManagementService();
await tokenService.setTokens({ accessToken, refreshToken });

// ❌ Bad
localStorage.setItem("token", accessToken); // Vulnerable
console.log("Token:", accessToken); // Security risk
```

### 2. Password Handling

**✅ DO:**

- Enforce strong password requirements (min 8 chars, mixed case, numbers, symbols)
- Use password strength indicators
- Implement rate limiting on login attempts
- Hash passwords on backend (never on frontend)
- Support password managers

**❌ DON'T:**

- Store passwords in any form on frontend
- Send passwords over unencrypted connections
- Log passwords anywhere
- Implement weak password requirements

```javascript
// ✅ Good - Use validation utilities
import { validatePassword } from "@shared/auth/utils/authValidation";

const result = validatePassword(password);
if (!result.isValid) {
  setError(result.errors.join(", "));
}

// ❌ Bad - Weak validation
if (password.length < 6) {
  // Too short minimum
  setError("Password too short");
}
```

### 3. MFA Implementation

**✅ DO:**

- Offer multiple MFA methods (TOTP, SMS, Email)
- Provide backup codes for recovery
- Rate limit MFA verification attempts
- Lock accounts after multiple failed MFA attempts
- Use short expiration times for codes (5-10 minutes)

**❌ DON'T:**

- Make MFA optional for admin accounts
- Allow unlimited verification attempts
- Reuse verification codes
- Store MFA codes in plain text

```javascript
// ✅ Good - Proper MFA flow
const { mfaRequired, mfaToken } = await login(credentials);

if (mfaRequired) {
  const code = await promptUserForMFACode();
  await verifyMFA(mfaToken, code);
}

// ❌ Bad - Skipping MFA
if (user.isAdmin) {
  bypassMFA(); // Never do this!
}
```

### 4. OAuth Security

**✅ DO:**

- Always use PKCE (Proof Key for Code Exchange)
- Validate state parameter to prevent CSRF
- Use secure redirect URIs (HTTPS only in production)
- Validate OAuth tokens on backend
- Store OAuth state in sessionStorage

**❌ DON'T:**

- Skip state validation
- Use HTTP redirect URIs in production
- Trust OAuth data without verification
- Store OAuth tokens without encryption

---

## 🏗️ Architecture Best Practices

### 1. Service Usage

**✅ DO:**

- Use focused services for specific domains
- Leverage `RateLimitService` for login attempts
- Use `TokenManagementService` for all token operations
- Use `EmailPasswordAuthService` for traditional auth
- Use `OAuthAuthService` for social auth

**❌ DON'T:**

- Create new service instances unnecessarily
- Mix authentication logic with UI components
- Duplicate service functionality

```javascript
// ✅ Good - Use existing services
import { RateLimitService, EmailPasswordAuthService } from "@shared/auth/services";

const authService = new EmailPasswordAuthService({ apiBaseUrl });
const rateLimitService = new RateLimitService();

// Check rate limit before auth attempt
if (rateLimitService.isRateLimited(email)) {
  showError("Too many attempts. Please wait.");
  return;
}

// ❌ Bad - Implementing rate limiting manually
if (attempts[email] > 5) {
  // Duplicate logic
}
```

### 2. Hook Usage

**✅ DO:**

- Use `useAuth()` for authentication state
- Use `useLogin()` for login functionality
- Use `useMFA()` for MFA operations
- Use context hooks in components only

**❌ DON'T:**

- Call hooks conditionally
- Use hooks outside React components
- Create multiple auth contexts

```javascript
// ✅ Good
function LoginForm() {
  const { login, isLoading, error } = useLogin();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        login(credentials);
      }}
    >
      {/* form fields */}
    </form>
  );
}

// ❌ Bad
function handleLogin() {
  const { login } = useLogin(); // Hook called outside component
  login(credentials);
}
```

### 3. Error Handling

**✅ DO:**

- Use error constants from `errorConstants.js`
- Provide user-friendly error messages
- Log errors for debugging (without sensitive data)
- Show specific errors when helpful, generic when not
- Implement error boundaries for React components

**❌ DON'T:**

- Expose internal error details to users
- Ignore errors silently
- Use generic "Error occurred" for everything

```javascript
// ✅ Good
import { AUTH_ERROR_CODES, ERROR_MESSAGES } from "@shared/auth/types/errorConstants";

try {
  await login(credentials);
} catch (error) {
  const message = ERROR_MESSAGES[error.code] || "Login failed. Please try again.";
  setError(message);
  logError(error); // Log for debugging, no sensitive data
}

// ❌ Bad
try {
  await login(credentials);
} catch (error) {
  alert(error.stack); // Exposes internals
}
```

---

## ⚡ Performance Best Practices

### 1. Code Splitting

**✅ DO:**

- Lazy load MFA components (only needed after login)
- Lazy load RBAC components (permission-dependent)
- Lazy load session management dashboards
- Use React.lazy() and Suspense

**❌ DON'T:**

- Import everything eagerly
- Bundle unused authentication features
- Load admin features for regular users

```javascript
// ✅ Good - Lazy loading
const MFASetupWizard = React.lazy(() => import("./components/MFASetupWizard"));

function Settings() {
  return <Suspense fallback={<Loading />}>{showMFASetup && <MFASetupWizard />}</Suspense>;
}

// ❌ Bad - Eager loading
import MFASetupWizard from "./components/MFASetupWizard"; // Always loaded
```

### 2. Token Refresh

**✅ DO:**

- Refresh tokens automatically before expiration
- Use `TokenManagementService.enableAutoRefresh()`
- Handle refresh failures gracefully
- Cancel refresh on logout

**❌ DON'T:**

- Wait for tokens to expire before refreshing
- Refresh on every request
- Ignore refresh failures

```javascript
// ✅ Good - Automatic refresh
const tokenService = new TokenManagementService({
  apiBaseUrl,
  autoRefresh: true,
  onRefreshError: () => logout(),
});

// ❌ Bad - Manual refresh on each request
async function apiCall() {
  await refreshToken(); // Inefficient
  return fetch("/api/data");
}
```

### 3. Re-render Optimization

**✅ DO:**

- Use memoization for expensive computations
- Split context into focused providers
- Use React.memo for pure components
- Avoid inline function definitions in render

**❌ DON'T:**

- Put all state in one massive context
- Re-render entire app on auth changes
- Create new objects/functions every render

---

## 📝 Code Organization Best Practices

### 1. Constant Usage

**✅ DO:**

- Import from focused constant files
- Use constants for all magic strings/numbers
- Group related constants together

**❌ DON'T:**

- Use magic strings directly in code
- Duplicate constant values
- Mix unrelated constants

```javascript
// ✅ Good
import { SESSION_CONFIG, SESSION_STATUS } from "@shared/auth/types/sessionConstants";

if (status === SESSION_STATUS.EXPIRED) {
  setTimeout(handleExpiry, SESSION_CONFIG.WARNING_THRESHOLD);
}

// ❌ Bad
if (status === "expired") {
  // Magic string
  setTimeout(handleExpiry, 300000); // Magic number
}
```

### 2. Type Safety

**✅ DO:**

- Import TypeScript types from `auth.types.ts`
- Use TypeScript for new components
- Add JSDoc comments for JavaScript files
- Validate data structures

**❌ DON'T:**

- Use `any` type
- Skip type checking
- Assume data structure without validation

### 3. Testing

**✅ DO:**

- Test authentication flows end-to-end
- Mock API calls in unit tests
- Test error scenarios
- Test rate limiting behavior
- Use test utilities from `testing/`

**❌ DON'T:**

- Test only happy paths
- Skip error case testing
- Make real API calls in tests
- Test implementation details

```javascript
// ✅ Good - Comprehensive testing
describe("Login", () => {
  it("should handle rate limiting", async () => {
    // Test rate limit scenario
  });

  it("should handle MFA requirement", async () => {
    // Test MFA flow
  });

  it("should handle network errors", async () => {
    // Test error handling
  });
});

// ❌ Bad - Only happy path
describe("Login", () => {
  it("should login successfully", async () => {
    // Only one test
  });
});
```

---

## 🔄 Maintenance Best Practices

### 1. Backward Compatibility

**✅ DO:**

- Maintain old exports when refactoring
- Add deprecation warnings before removing features
- Version breaking changes
- Document migration paths

**❌ DON'T:**

- Remove exports without warning
- Break existing integrations
- Change APIs without migration guides

### 2. Documentation

**✅ DO:**

- Document all public APIs
- Provide usage examples
- Keep README up to date
- Document security considerations

**❌ DON'T:**

- Leave APIs undocumented
- Document only code, not usage patterns
- Let documentation go stale

### 3. Dependencies

**✅ DO:**

- Keep dependencies minimal
- Update security patches promptly
- Review dependency changes
- Use exact versions for security-critical packages

**❌ DON'T:**

- Add unnecessary dependencies
- Ignore security warnings
- Use deprecated packages

---

## 🎯 Summary Checklist

Before deploying authentication changes:

- [ ] All tokens stored securely
- [ ] Rate limiting implemented
- [ ] MFA properly configured
- [ ] OAuth uses PKCE and state validation
- [ ] Error messages are user-friendly
- [ ] Code is properly split/lazy loaded
- [ ] Tests cover error scenarios
- [ ] Documentation is updated
- [ ] Security audit passed
- [ ] Performance profiling done

---

## 📚 Additional Resources

- [OAuth Examples](./oauth-examples.md)
- [MFA Examples](./mfa-examples.md)
- [API Documentation](./README.md)
- [Type Definitions](./types/auth.types.ts)
