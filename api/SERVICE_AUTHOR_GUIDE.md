# API Migration Guide

Guide for teams migrating from legacy service patterns to the unified `@shared/api` layer.

## Status

The migration is **complete** for core infrastructure. The old `auth/services/authService.js`, `LocationService.js`, and `analyticsService.js` have been retired. Everything now flows through `frontend/shared/api/`.

This guide documents:
1. The current correct patterns to use going forward
2. How to build new feature services that plug into the shared layer
3. Known pitfalls discovered and fixed during the migration

---

## Building New Feature Services

### ✅ Correct Pattern

```typescript
import { BaseService, ValidationSchema } from "@shared/api";
import type { ApiClient, PaginationParams, PaginatedResponse } from "@shared/api";

export class ChurchService extends BaseService {
  private static readonly SCHEMAS = {
    create: {
      name: { required: true, type: "string", minLength: 2 },
      address: { required: true, type: "object" },
    } satisfies ValidationSchema,
  };

  constructor(client: ApiClient) {
    // Pass a RELATIVE path — ApiClient.baseURL (/api/v1) is prepended automatically.
    // Never include /api or /api/v1 here.
    super(client, "/churches", "ChurchService");
  }

  async getAll(pagination?: PaginationParams): Promise<PaginatedResponse<Church>> {
    // this.getMany("") → GET /api/v1/churches
    return this.getMany<Church>("", undefined, pagination);
  }

  async getById(id: string): Promise<Church> {
    // this.getById(id) → GET /api/v1/churches/:id
    return this.getItemById<Church>(id);
  }

  async create(data: CreateChurchRequest): Promise<Church> {
    this.validateRequest(data, ChurchService.SCHEMAS.create);
    // this.post("") → POST /api/v1/churches
    return this.post<Church>("", data);
  }

  async update(id: string, updates: UpdateChurchRequest): Promise<Church> {
    // this.patchById → PATCH /api/v1/churches/:id
    return this.patchById<Church>(id, updates);
  }

  async remove(id: string): Promise<void> {
    // this.deleteById → DELETE /api/v1/churches/:id
    return this.deleteById(id);
  }
}
```

### ❌ Patterns That Will Break

```typescript
// WRONG — double-prefix bug: /api/v1 + /api/v1/... = /api/v1/api/v1/...
super(client, "/api/v1/churches", "ChurchService");

// WRONG — manually prepending baseEndpoint doubles the path
// Results in /churches/churches
this.post(this.baseEndpoint, data);

// WRONG — same double-prefix via concatenation
this.post(this.baseEndpoint + "/special", data);
// Correct: this.post("/special", data)

// WRONG — hardcoded localhost port (breaks in prod and other devs' environments)
const client = new ApiClient({ baseURL: "http://localhost:5000/api" });
// Correct: new ApiClient({ baseURL: getApiBaseUrl() })
```

---

## Registering a New Service

Add your service to the `ApiServices` class in `services/index.ts`:

```typescript
// services/index.ts

import { ChurchService } from "./ChurchService";

export class ApiServices {
  private _church: ChurchService;

  constructor(config: ApiServiceConfig) {
    // ... existing setup ...
    this._church = new ChurchService(this.client);
  }

  get church(): ChurchService {
    return this._church;
  }
}
```

And export it from the barrel (`api/index.ts`):

```typescript
export { ChurchService } from "./services/ChurchService";
```

---

## Import Path Reference

| What you need | Correct import |
|---------------|----------------|
| Services via hooks | `import { useApi } from "@shared/api"` |
| Services outside React | `import { getApiServices } from "@shared/api"` |
| Types | `import type { User, Church } from "@shared/api"` |
| Base URL | `import { getApiBaseUrl } from "@shared/api"` |
| Absolute URL (for images) | `import { getAbsoluteUrl } from "@shared/api"` |
| Error types | `import { ApiErrorType } from "@shared/api"` |
| Hooks | `import { useAuth, useApiQuery, useApiMutation, useFileUpload } from "@shared/api"` |

---

## Replacing Old Patterns

### Direct `fetch` / `axios` Calls

**Before:**

```javascript
const response = await fetch(`/api/v1/churches`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json();
```

**After:**

```typescript
const api = useApi();
const churches = await api.church.getAll();
```

### Manual Auth State

**Before:**

```javascript
const [user, setUser] = useState(null);

useEffect(() => {
  authService.getCurrentUser().then(setUser);
}, []);
```

**After:**

```typescript
const { user, isAuthenticated, isLoading } = useAuth();
// State is automatically initialized and kept in sync
```

### Raw `useEffect` Data Fetching

**Before:**

```javascript
const [churches, setChurches] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetch("/api/v1/churches")
    .then((r) => r.json())
    .then((d) => setChurches(d.data))
    .finally(() => setLoading(false));
}, []);
```

**After:**

```typescript
const api = useApi();
const { data: churches, isLoading } = useApiQuery(
  "churches",
  () => api.church.getAll(),
);
```

### URL Construction

**Before:**

```javascript
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const avatarUrl = `${apiUrl}/uploads/${user.avatar}`;
```

**After:**

```typescript
import { getAbsoluteUrl } from "@shared/api";

const avatarUrl = getAbsoluteUrl(`/uploads/${user.avatar}`);
```

---

## Known Pitfalls (Discovered & Fixed)

These bugs were found and resolved during the migration. Document them here so they are never reintroduced.

### Pitfall 1: `ProgressEvent` vs `AxiosProgressEvent`

**Symptom:** `event.estimated`, `event.bytes`, and `event.rate` are `undefined`.

**Root cause:** DOM's native `ProgressEvent` was used instead of Axios's `AxiosProgressEvent`.

**Fix:** Always type progress callbacks as `AxiosProgressEvent`:

```typescript
import type { AxiosProgressEvent } from "axios";

onUploadProgress: (event: AxiosProgressEvent) => {
  const pct = Math.round((event.loaded * 100) / (event.total ?? event.loaded));
};
```

---

### Pitfall 2: `total` is `undefined` → `NaN` Progress

**Symptom:** Upload progress shows `NaN%` in the UI.

**Root cause:** `AxiosProgressEvent.total` is `number | undefined`. Division by `undefined` produces `NaN`. This happens when the server does not send a `Content-Length` header.

**Fix:**

```typescript
const pct = Math.round((event.loaded * 100) / (event.total ?? event.loaded));
// Falls back to loaded/loaded = 100% rather than NaN
```

---

### Pitfall 3: Ghost Event Listeners on Upload Failure

**Symptom:** After a failed upload, progress bars from previous uploads flicker on the next attempt.

**Root cause:** `window.removeEventListener` was only called on the success path. If `uploadFn` threw, the listener was never removed.

**Fix:** Always remove listeners in `finally`:

```typescript
try {
  window.addEventListener("avatar-upload-progress", handler);
  const result = await uploadFn(file);
  return result;
} finally {
  window.removeEventListener("avatar-upload-progress", handler);
}
```

---

### Pitfall 4: Double-Prefix Route Bug

**Symptom:** API calls go to `/notifications/notifications`, `/files/files`, etc. — always 404.

**Root cause:** Service methods calling `this.post(this.baseEndpoint, data)`. `BaseService.buildEndpoint()` prepends `this.baseEndpoint` automatically — concatenating it manually doubles the path.

**Fix:** Use `""` or relative paths:

```typescript
// WRONG
this.post(this.baseEndpoint, data);              // → /notifications/notifications
this.post(this.baseEndpoint + "/bulk", data);    // → /notifications/notifications/bulk

// CORRECT
this.post("", data);                             // → /notifications
this.post("/bulk", data);                        // → /notifications/bulk
```

---

### Pitfall 5: Token Retry Used Global Axios Instance

**Symptom:** After a 401, the retry request went to `:5000` directly instead of through the proxy. Always failed in production.

**Root cause:** `AuthInterceptor` was calling `axios.request()` (the global singleton) instead of the configured instance with the correct `baseURL`.

**Fix:** `AuthInterceptor.setAxiosInstance(instance)` was added. `ApiClient` calls it during initialization:

```typescript
// ApiClient.ts constructor
this.authInterceptor = new AuthInterceptor(this.axiosInstance, authConfig);
this.authInterceptor.setAxiosInstance(this.axiosInstance);
```

---

### Pitfall 6: ArtNet Circular Import

**Symptom:** `getApiServices` returned `undefined` inside `ArtNetBridgeService` despite being called after initialization.

**Root cause:** `ArtNetBridgeService.ts` imported `getApiServices` from `./index`. `./index` imports `ArtNetBridgeService`. JavaScript circular imports produce `undefined` at module init time.

**Fix:** Dependency inversion. `ArtNetBridgeService` now exposes `initArtNetBridge(client)`. `services/index.ts` calls it after creating the `ApiClient`:

```typescript
// services/index.ts
import { initArtNetBridge } from "./ArtNetBridgeService";

constructor(config) {
  this.client = new ApiClient(config);
  initArtNetBridge(this.client); // ← no circular import
}
```

---

### Pitfall 7: SyncEngine Retry Counter Not Persisted

**Symptom:** Offline mutations that failed were never dropped after 5 retries — they accumulated indefinitely.

**Root cause:** `entry.retries += 1` mutated the in-memory object from `idb-keyval`'s `get()`. The counter was never written back to IndexedDB. On the next `processQueue()` call, the fresh `get()` returned `retries: 0` again.

**Fix:** After incrementing, write the full updated queue back:

```typescript
const currentQueue = await get(SYNC_STORE_NAME) ?? [];
const updated = currentQueue.map((item) =>
  item.id === entry.id ? { ...item, retries: entry.retries } : item,
);
await set(SYNC_STORE_NAME, updated);
```

---

## Checklist for New Service Authors

Before merging a new service:

- [ ] Extends `BaseService` (not a raw class)
- [ ] `super(client, "/relative-path", "ServiceName")` — no `/api` or `/api/v1` prefix
- [ ] All endpoint strings are relative (no `this.baseEndpoint +` concatenation)
- [ ] Progress callbacks typed as `AxiosProgressEvent`, guarded against `undefined` total
- [ ] No hardcoded `localhost` URLs
- [ ] No imports from `./index` (avoids circular dependency)
- [ ] Registered in `ApiServices` and exported from `api/index.ts`
- [ ] Types added to `types/index.ts` if shared across apps
