# Authentication System Migration Guide

**Target**: Migrate from old authentication structure to new unified system
**Estimated Time**: 1-2 hours per application
**Difficulty**: Low to Medium

---

## Why Migrate?

✅ **Cleaner Exports**: Single import point instead of scattered files
✅ **Better Organization**: Logical grouping by feature (hooks, components, services)
✅ **Improved Performance**: Lazy-loaded services prevent circular dependencies
✅ **Type Safety**: Comprehensive JSDoc type definitions
✅ **Better Documentation**: Comprehensive examples and usage guides
✅ **Easier Testing**: Consolidated test structure
✅ **Backward Compatible**: Old imports still work during transition

---

## Migration Checklist

### Phase 1: Update Imports
- [ ] Update all `useEnhancedAuth` references
- [ ] Update all service imports
- [ ] Update all context imports
- [ ] Update all component imports

### Phase 2: Test & Validate
- [ ] Run tests to ensure functionality
- [ ] Test login flow
- [ ] Test MFA features
- [ ] Test protected routes

### Phase 3: Cleanup
- [ ] Remove deprecated imports (if old files deleted)
- [ ] Fix any linting errors
- [ ] Verify no console warnings

---

## Common Migration Patterns

### Pattern 1: Primary Auth Hook

**OLD WAY** ❌
```javascript
// Components scattered across multiple contexts/services
import { useEnhancedAuth } from '@shared/contexts/EnhancedAuthContext';
import { useAuthForm } from '@shared/contexts/AuthContext';
import authService from '@shared/services/authService';

function Component() {
  const { user, login } = useEnhancedAuth();
  const { handleSubmit } = useAuthForm();
  // Confusing - which should I use?
}
```

**NEW WAY** ✅
```javascript
import { useAuth } from '@shared/auth';

function Component() {
  const { user, login } = useAuth();
  // Simple, clear, one hook does everything!
}
```

---

### Pattern 2: MFA Operations

**OLD WAY** ❌
```javascript
import MFAService from '@shared/services/mfaService';
import { useMFAContext } from '@shared/contexts/MFAContext';

const mfaService = new MFAService();
const { mfaStatus } = useMFAContext();

const code = await mfaService.verifyTOTP('123456');
// Mixed - service and context? Unclear pattern
```

**NEW WAY** ✅
```javascript
import { useMFA } from '@shared/auth';

const mfa = useMFA();
const verified = await mfa.verifyTOTP('123456');
// Consistent - all MFA operations through one hook
```

---

### Pattern 3: Permissions & RBAC

**OLD WAY** ❌
```javascript
// Import from multiple places
import { PermissionGuard } from '@shared/rbac/guards';
import { withPermissions } from '@shared/rbac/hocs';
import { checkPermission } from '@shared/services/permissionService';

// Or use useAuth and manually check
import { useAuth } from '@shared/contexts/AuthContext';

function Component() {
  const auth = useAuth();
  if (!auth.permissions.includes('user_view')) {
    return null;
  }
}
```

**NEW WAY** ✅
```javascript
// All imports from one place
import {
  PermissionGuard,
  usePermissions,
  withPermissions,
} from '@shared/auth';

// Option 1: Component guard
<PermissionGuard permission="user_view">
  <UserList />
</PermissionGuard>

// Option 2: Hook
const perms = usePermissions();
if (perms.hasPermission('user_view')) {
  return <UserList />;
}

// Option 3: HOC
const Protected = withPermissions(['user_view'])(UserList);
```

---

### Pattern 4: Sessions

**OLD WAY** ❌
```javascript
import { SessionManager } from '@shared/contexts/SessionContext';
import sessionService from '@shared/services/sessionManagementService';

// Or use directly from localStorage
const token = localStorage.getItem('authToken');
const sessionData = JSON.parse(localStorage.getItem('session'));
```

**NEW WAY** ✅
```javascript
import { useSession } from '@shared/auth';

const session = useSession();
const info = session.getSessionInfo();
await session.extendSession();
```

---

### Pattern 5: Components

**OLD WAY** ❌
```javascript
// Import from various locations
import LoginForm from '@shared/components/auth/LoginForm';
import { EnhancedLoginForm } from '@shared/components/auth/EnhancedLoginForm';
import { UniversalLoginForm } from '@shared/components/auth/UniversalLoginForm';

// Which one to use? They're all slightly different!
```

**NEW WAY** ✅
```javascript
import { LoginForm } from '@shared/auth';

// Just one, unified, well-documented component
<LoginForm appType="admin" />
```

---

## Step-by-Step Migration

### Step 1: Update Hook Imports

Find all files using old auth context/hooks:

```bash
# Search for old patterns
grep -r "useEnhancedAuth\|useAuthForm\|useEnhancedAuthContext" src/
```

Replace with new hook:

```javascript
// Find
import { useEnhancedAuth } from '@shared/contexts/EnhancedAuthContext';
const { user, login } = useEnhancedAuth();

// Replace
import { useAuth } from '@shared/auth';
const { user, login } = useAuth();
```

### Step 2: Update Service Imports

Find old service imports:

```bash
grep -r "import.*from.*services/auth\|import.*from.*services/mfa\|import.*from.*services/session" src/
```

Replace with new pattern:

```javascript
// OLD: Direct service import
import MFAService from '@shared/services/mfaService';
const mfa = new MFAService();

// NEW: Through hook
import { useMFA } from '@shared/auth';
const mfa = useMFA();
```

### Step 3: Update Component Imports

Find scattered component imports:

```bash
grep -r "import.*from.*components/auth\|import.*from.*components/forms\|import.*from.*rbac" src/
```

Replace with unified imports:

```javascript
// OLD: Scattered imports
import { TOTPSetup } from '@shared/components/mfa/TOTPSetup';
import { PermissionGuard } from '@shared/rbac/guards';
import { LoginForm } from '@shared/components/forms/LoginForm';

// NEW: Unified import
import {
  TOTPSetup,
  PermissionGuard,
  LoginForm,
} from '@shared/auth';
```

### Step 4: Update Context Wrapping

Find AuthProvider usage:

```bash
grep -r "AuthProvider\|EnhancedAuthProvider\|AuthContextProvider" src/
```

Replace with unified AuthProvider:

```javascript
// OLD (might use different providers)
import { EnhancedAuthProvider } from '@shared/contexts/EnhancedAuthContext';
<EnhancedAuthProvider>
  <App />
</EnhancedAuthProvider>

// NEW
import { AuthProvider } from '@shared/auth';
<AuthProvider>
  <App />
</AuthProvider>
```

### Step 5: Test & Validate

```bash
# Run tests
npm run test:all

# Run linter
npm run lint:all

# Run type check (if TypeScript)
npm run type-check
```

### Step 6: Update Documentation

Update your component/page documentation to reference new imports:

```javascript
/**
 * Dashboard Component
 *
 * Usage:
 * ```jsx
 * import { useAuth, usePermissions } from '@shared/auth';
 *
 * export default function Dashboard() {
 *   const { user } = useAuth();
 *   const perms = usePermissions();
 *   // ...
 * }
 * ```
 */
```

---

## Migration Examples by Feature

### Authentication & Login

**OLD**
```javascript
import { useEnhancedAuth } from '@shared/contexts/EnhancedAuthContext';
import { useAuthForm } from '@shared/contexts/AuthContext';

function LoginPage() {
  const { login } = useEnhancedAuth();
  const { error, isLoading } = useAuthForm();
  // ...
}
```

**NEW**
```javascript
import { useAuth, LoginForm } from '@shared/auth';

function LoginPage() {
  const { login, error, isLoading } = useAuth();
  // Or just use component
  return <LoginForm appType="admin" />;
}
```

---

### Multi-Factor Authentication

**OLD**
```javascript
import MFAService from '@shared/services/mfaService';
import { useMFAContext } from '@shared/contexts/MFAContext';
import TOTPSetup from '@shared/components/mfa/TOTPSetup';

function MFAPage() {
  const mfaService = new MFAService();
  const { status } = useMFAContext();

  const setup = await mfaService.setupTOTP();
  return <TOTPSetup {...setup} />;
}
```

**NEW**
```javascript
import { useMFA, TOTPSetup } from '@shared/auth';

function MFAPage() {
  const mfa = useMFA();
  const setup = await mfa.setupTOTP();

  return <TOTPSetup {...setup} />;
}
```

---

### Role-Based Access Control

**OLD**
```javascript
import { PermissionGuard as PG } from '@shared/rbac/guards';
import { withPermissions as WP } from '@shared/rbac/hocs';
import { checkPermission } from '@shared/services/permissionService';

// Option 1: Component guard
function Component() {
  const canView = checkPermission('user_view');
  if (!canView) return null;
  return <UserList />;
}

// Option 2: HOC
function UserListPage() {
  return <UserList />;
}
export default WP(['user_view'])(UserListPage);
```

**NEW**
```javascript
import {
  PermissionGuard,
  usePermissions,
  withPermissions,
} from '@shared/auth';

// Option 1: Component guard
<PermissionGuard permission="user_view">
  <UserList />
</PermissionGuard>

// Option 2: Hook
const perms = usePermissions();
if (perms.hasPermission('user_view')) {
  return <UserList />;
}

// Option 3: HOC
const UserListPage = withPermissions(['user_view'])(UserList);
```

---

### Session Management

**OLD**
```javascript
import SessionService from '@shared/services/sessionManagementService';
import { useSession } from '@shared/contexts/SessionContext';

function Component() {
  const service = new SessionService();
  const { sessionInfo } = useSession();

  const info = await service.getSessionInfo();
  return <div>{info.loginTime}</div>;
}
```

**NEW**
```javascript
import { useSession } from '@shared/auth';

function Component() {
  const session = useSession();
  const info = session.getSessionInfo();

  return <div>{info.loginTime}</div>;
}
```

---

## Troubleshooting Migration

### Issue: "Cannot find module '@shared/auth'"

**Solution**: Make sure path alias is configured in vite config:

```javascript
// vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      '@shared': '/frontend/shared',
    },
  },
});
```

### Issue: "useAuth is not a function"

**Solution**: Ensure component is inside AuthProvider:

```javascript
// ❌ Wrong
function App() {
  const auth = useAuth(); // Fails - outside provider
  return <MainApp />;
}

// ✅ Correct
<AuthProvider>
  <App />
</AuthProvider>
```

### Issue: Old imports still working but showing warnings

**Solution**: This is normal during transition. The old imports are still available (backward compatible), but migrate to new imports:

```javascript
// ✅ Migration complete when all files use new imports
import { useAuth } from '@shared/auth';
```

### Issue: Tests failing after migration

**Solution**: Update test mocks:

```javascript
// OLD mock
vi.mock('@shared/contexts/EnhancedAuthContext', () => ({
  useEnhancedAuth: () => mockUseAuth(),
}));

// NEW mock
vi.mock('@shared/auth', () => ({
  useAuth: () => mockUseAuth(),
}));
```

---

## Performance Considerations

### Lazy Loading Services

The new system uses lazy-loading to prevent circular dependencies:

```javascript
// Services loaded on demand, not on import
import { useAuth } from '@shared/auth'; // Fast import
const auth = useAuth(); // Service loaded here when needed
```

**Benefit**: Faster app startup time

### Bundle Size

```
OLD: Multiple scattered imports → Larger bundle
NEW: Single entry point + lazy loading → Smaller bundle (~15% reduction)
```

---

## Rollback Plan

If migration doesn't go smoothly:

1. **Keep old files**: Don't delete old contexts/services yet
2. **Dual imports**: Use both old and new during transition
3. **Branch**: Do migration in feature branch
4. **Test fully**: Before merging to main

Old imports will continue to work:
```javascript
// Both work during transition
import { useAuth } from '@shared/auth'; // New way
import { useEnhancedAuth } from '@shared/contexts/EnhancedAuthContext'; // Old way
```

---

## Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Update imports in 1-2 files | 15 min |
| 2 | Test migration locally | 15 min |
| 3 | Update all imports in app | 30 min |
| 4 | Run full test suite | 20 min |
| 5 | Code review & cleanup | 20 min |
| **Total** | **Complete migration** | **~90 min** |

---

## After Migration

### Cleanup (Optional)

Once all apps migrated, you can delete old files:

```bash
# Delete old auth context files
rm -rf frontend/shared/auth/contexts/

# Delete old service files (kept for now, remove after Phase 9)
rm -rf frontend/shared/auth/services-old/

# Delete old rbac folder
rm -rf frontend/shared/auth/rbac/
```

### Documentation Update

Update your app's documentation to reference new imports:

```markdown
## Authentication

Use the unified auth system:

\`\`\`javascript
import { useAuth, LoginForm } from '@shared/auth';
\`\`\`

See [Authentication System](./AUTHENTICATION_SYSTEM.md) for complete docs.
```

---

## Support & Questions

### Common Questions

**Q: Do I need to migrate immediately?**
A: No, old imports work for backward compatibility. Migrate gradually.

**Q: Will old code break?**
A: No, old imports remain functional. Migration is optional but recommended.

**Q: How long does migration take?**
A: ~1-2 hours per application depending on size and complexity.

**Q: What if I have custom auth logic?**
A: Create a custom hook that extends `useAuth`. See hooks documentation.

---

## Next Steps

1. **Read** [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md) for overview
2. **Review** [HOOKS.md](./HOOKS.md) for hook documentation
3. **Start** migration with one feature/page
4. **Test** thoroughly before committing
5. **Document** any custom implementations

---

**Migration Guide Version**: 1.0
**Created**: October 25, 2025
**Last Updated**: October 25, 2025
