# Frontend API Migration Guide

Complete guide for migrating from legacy services to the unified API layer.

## Overview

This guide will help you migrate from:

- **Old:** `auth/services/authService.js` (27KB JavaScript)
- **Old:** `services/LocationService.js`, `analyticsService.js`, etc.
- **New:** Unified `@shared/api` TypeScript layer

## Migration Strategy

We're using a **gradual migration approach** with backward compatibility during the transition period.

### Phase 1: Coexistence (Current)

- Both old and new APIs work simultaneously
- No breaking changes
- Update code incrementally

### Phase 2: Deprecation Warnings

- Old services log deprecation warnings in console
- Encourage migration to new API

### Phase 3: Full Migration

- Remove old service files
- All code uses unified API

## Quick Reference

### Import Changes

**Before:**

```javascript
import { authService } from "@shared/auth/services/authService";
import { LocationService } from "@shared/services/LocationService";
```

**After:**

```typescript
import { getApiServices } from "@shared/api";
const api = getApiServices();

// Or import directly
import { getApiBaseUrl, getAbsoluteUrl } from "@shared/api";
```

### Common Patterns

#### Pattern 1: Login

**Before:**

```javascript
import { authService } from "@shared/auth/services/authService";

const handleLogin = async (email, password) => {
  try {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.user);
    }
  } catch (error) {
    console.error(error);
  }
};
```

**After:**

```typescript
import { useAuth } from '@shared/api/hooks';

const Component = () => {
  const { login, user, isLoading, error } = useAuth();

  const handleLogin = async (email, password) => {
    await login({ email, password });
    // User is automatically updated in state
  };

  return <div>{isLoading ? 'Loading...' : user?.name}</div>;
};
```

#### Pattern 2: Fetching Data

**Before:**

```javascript
const [churches, setChurches] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchChurches = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/churches");
      const data = await response.json();
      setChurches(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchChurches();
}, []);
```

**After:**

```typescript
import { useChurch } from '@shared/api/hooks';

const Component = () => {
  const { churches, loading, error, refetch } = useChurch();

  // Data is automatically fetched and managed

  return <div>{loading ? 'Loading...' : churches.map(...)}</div>;
};
```

#### Pattern 3: URL Handling

**Before:**

```javascript
// Scattered across multiple files
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const imageUrl = `${apiUrl}/uploads/avatar.jpg`;
```

**After:**

```typescript
import { getApiBaseUrl, getAbsoluteUrl } from "@shared/api";

// Single source of truth
const apiUrl = getApiBaseUrl();
const imageUrl = getAbsoluteUrl("/uploads/avatar.jpg");
```

## Step-by-Step Migration

### Step 1: Update Imports in AuthContext

**File:** `frontend/shared/auth/context/AuthContext.jsx`

**Before:**

```javascript
import { authService } from "../services/authService";
```

**After:**

```javascript
// Temporary: Use both during migration
import { authService } from "../services/authService"; // Keep for now
import { getApiBaseUrl } from "@shared/api"; // Add new imports
```

### Step 2: Replace URL Logic

Replace hardcoded `import.meta.env.VITE_API_URL` with centralized `getApiBaseUrl()`:

**Before:**

```javascript
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
```

**After:**

```javascript
import { getApiBaseUrl } from "@shared/api";
const apiUrl = getApiBaseUrl();
```

### Step 3: Update User Utilities

Already done! The `userUtils.js` now uses the centralized `getAbsoluteUrl()`.

### Step 4: Migrate Components to Hooks

For React components, replace manual state management with hooks:

**Before:**

```javascript
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);

const login = async (credentials) => {
  setLoading(true);
  try {
    const result = await authService.login(credentials);
    setUser(result.user);
  } finally {
    setLoading(false);
  }
};
```

**After:**

```typescript
import { useAuth } from "@shared/api/hooks";

const { user, loading, login } = useAuth();
// That's it! All state is managed automatically
```

## Service-by-Service Migration

### AuthService Migration

**Current Status:** OLD service in use  
**Priority:** HIGH (most critical)  
**Location:** `auth/services/authService.js` → `api/services/auth/AuthService.ts`

**Key Changes:**

1. Convert to TypeScript
2. Extend `BaseService` class
3. Use `ApiClient` instead of direct `fetch`
4. Remove hardcoded URLs

**Migration Checklist:**

- [ ] Create `api/services/auth/` directory
- [ ] Move `authService.js` logic to `AuthService.ts`
- [ ] Update AuthContext to use new service
- [ ] Test all auth flows (login, logout, register, password reset)
- [ ] Add deprecation warning to old service
- [ ] Remove old service after full migration

### LocationService Migration

**Current Status:** OLD service in use  
**Priority:** MEDIUM  
**Location:** `services/LocationService.js` → `api/services/common/LocationService.ts`

**Migration Checklist:**

- [ ] Create `api/services/common/` directory
- [ ] Convert to TypeScript
- [ ] Update imports across codebase
- [ ] Test location features
- [ ] Remove old service

### AnalyticsService Migration

**Current Status:** OLD service in use  
**Priority:** LOW (not critical for MVP)  
**Location:** `services/analyticsService.js` → `api/services/common/AnalyticsService.ts`

## Testing Your Migration

### 1. Verify Builds

```bash
# Frontend build should succeed
npm run build:church

# Check for TypeScript errors
npm run typecheck
```

### 2. Test Functionality

- [ ] Login/logout works
- [ ] User profile loads
- [ ] Images display correctly (avatars, cover images)
- [ ] Data fetching works (churches, events, etc.)
- [ ] Error handling works properly

### 3. Check Console

Look for:

- ❌ No `import.meta.env.VITE_API_URL` calls outside of `apiConfig.ts`
- ❌ No direct `fetch('/api/v1/...')` calls
- ✅ All API calls use unified API layer

## Rollback Plan

If migration causes issues, you can rollback:

1. **Revert imports:**

   ```javascript
   // Change back to
   import { authService } from "@shared/auth/services/authService";
   ```

2. **Revert git commit:**

   ```bash
   git revert [commit-hash]
   ```

3. **Remove new API usage:**
   - Remove `@shared/api` imports
   - Restore old service imports

## Common Issues

### Issue 1: TypeScript Errors

**Problem:** `Property 'xyz' does not exist on type...`  
**Solution:** Import types from `@shared/api`:

```typescript
import type { User, Church } from "@shared/api";
```

### Issue 2: 404 on Image URLs

**Problem:** Images load as `/uploads/...` instead of `http://localhost:5000/uploads/...`  
**Solution:** Use `getAbsoluteUrl()`:

```typescript
import { getAbsoluteUrl } from "@shared/api";
const imageUrl = getAbsoluteUrl(user.avatar);
```

### Issue 3: Auth State Not Persisting

**Problem:** User logged out on refresh  
**Solution:** Ensure AuthContext uses new token management:

```typescript
import { getApiServices } from "@shared/api";
const api = getApiServices();
api.setAuthToken(token);
```

## Getting Help

- Check the [Usage Guide](./USAGE_GUIDE.md) for examples
- Review the [README](./README.md) for architecture overview
- Ask in the development team chat

## Next Steps

After completing migration:

1. **Remove old services:**

   ```bash
   rm -rf frontend/shared/auth/services/authService.js
   rm -rf frontend/shared/services/LocationService.js
   # etc.
   ```

2. **Update documentation:**
   - Remove references to old services
   - Update onboarding guides

3. **Celebrate! 🎉**
   - Cleaner codebase
   - Type safety
   - Easier maintenance
