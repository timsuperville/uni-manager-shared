# Unified API Service Layer

A comprehensive, type-safe API layer that provides consistent patterns and functionality across all Uni-Manager applications.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Services](#services)
- [React Integration](#react-integration)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Caching](#caching)
- [Offline Sync](#offline-sync)
- [ArtNet Bridge](#artnet-bridge)
- [Troubleshooting](#troubleshooting)
- [Future: Removing Axios](#future-removing-axios)

---

## Overview

The unified API layer is the **single source of truth** for all HTTP communication across the Uni-Manager frontend. It provides:

- **Type Safety** — Full TypeScript with comprehensive shared type definitions in `types/`
- **Consistent Patterns** — Standardized request/response handling via `BaseService`
- **Centralized Error Handling** — User-friendly messages via `ErrorHandler`
- **Intelligent Caching** — TTL-based with pattern invalidation via `CacheManager`
- **Authentication** — Transparent token management + automatic refresh via `AuthInterceptor`
- **React Integration** — Hooks and `ApiProvider` for clean component integration
- **Offline Sync** — IndexedDB-backed mutation queue via `SyncEngine`

---

## Architecture

```
frontend/shared/api/
├── index.ts                  ← Barrel export (import everything from here)
├── config/
│   └── apiConfig.ts          ← Single source of truth for base URL / env
├── core/
│   ├── ApiClient.ts          ← Axios wrapper with interceptors, caching, retry
│   ├── AuthInterceptor.ts    ← Token attach, refresh, retry-on-401
│   ├── CacheManager.ts       ← In-memory TTL cache with pattern invalidation
│   └── ErrorHandler.ts       ← Typed error classification & messaging
├── services/
│   ├── BaseService.ts        ← Abstract base — all services extend this
│   ├── AuthService.ts        ← Login, signup, profile, avatar upload
│   ├── FileService.ts        ← File/folder CRUD + upload with progress
│   ├── NotificationService.ts← Notifications, templates, preferences, push
│   ├── ArtNetBridgeService.ts← ArtNet UDP trigger for Presentation Pro
│   └── index.ts              ← ApiServices class + factory functions
├── hooks/
│   └── index.ts              ← useApi, useAuth, useApiQuery, useApiMutation, useFileUpload
├── components/
│   └── ApiProvider.tsx       ← React context provider
├── types/
│   └── index.ts              ← All shared TypeScript interfaces
├── syncEngine.ts             ← Offline mutation queue (IndexedDB via idb-keyval)
└── examples/
    └── integration-examples.tsx
```

**Feature-specific services** (e.g. `ChurchService`, `SongService`) live in their respective app feature folders and extend `BaseService`:

```
frontend/apps/church/src/features/
├── church/services/ChurchService.ts
├── events/services/EventService.ts
└── songs/services/SongService.ts
```

---

## Quick Start

### 1. Wrap your app in `ApiProvider`

```tsx
// main.tsx
import React from 'react';
import { ApiProvider } from '@shared/api';
import { getApiBaseUrl } from '@shared/api';

const App: React.FC = () => (
  <ApiProvider
    config={{
      baseURL: getApiBaseUrl(), // reads VITE_API_URL or defaults to /api
      timeout: 10000,
      cacheEnabled: true,
      authEnabled: true,
      authConfig: {
        tokenKey: 'uni_auth_access_token',
        refreshTokenKey: 'uni_auth_refresh_token',
        tokenStorage: 'sessionStorage'
      }
    }}
    onError={error => console.error('[API]', error)}
  >
    <YourApplication />
  </ApiProvider>
);
```

### 2. Use hooks in components

```tsx
import { useAuth, useApiQuery, useApi } from '@shared/api';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const api = useApi();

  const { data: profile, isLoading } = useApiQuery('user-profile', () =>
    api.auth.getCurrentUser()
  );

  if (isLoading) return <Spinner />;
  return <div>Welcome, {profile?.displayName}</div>;
};
```

---

## Configuration

### Environment Variables

```env
# .env.local
VITE_API_URL=http://localhost:5000/api
```

In production (Firebase Hosting + Cloud Run backend), the Vite proxy rewrites `/api/*` to the backend automatically. `VITE_API_URL` is not required in production builds.

### `getApiBaseUrl()` — Single Source of Truth

Always use this helper instead of reading `import.meta.env` directly:

```typescript
import { getApiBaseUrl, getAbsoluteUrl } from '@shared/api';

const base = getApiBaseUrl(); // "/api" or "http://localhost:5000/api"
const avatarUrl = getAbsoluteUrl('/uploads/avatar.jpg');
```

### `ApiClientConfig` Reference

```typescript
interface ApiClientConfig {
  baseURL: string; // Required — use getApiBaseUrl()
  timeout?: number; // Default: 10000ms
  retryAttempts?: number; // Default: 3
  cacheEnabled?: boolean; // Default: true
  authEnabled?: boolean; // Default: true
  defaultHeaders?: Record<string, string>;
  authConfig?: {
    tokenKey: string; // localStorage/sessionStorage key
    refreshTokenKey: string;
    tokenStorage: 'localStorage' | 'sessionStorage' | 'memory';
    refreshEndpoint?: string; // Default: "/auth/refresh"
    onTokenRefreshFailure?: () => void;
  };
}
```

---

## Services

All services extend `BaseService` and are available through the `ApiServices` instance.

### Accessing Services

```typescript
// Inside React components — preferred approach
const api = useApi();
await api.auth.login({ email, password });
await api.files.uploadFile(request);
await api.notifications.getUnreadCount();

// Outside React (e.g. in a utility)
import { getApiServices } from '@shared/api';
const api = getApiServices();
```

### AuthService (`api.auth`)

| Method                           | Description                                                 |
| -------------------------------- | ----------------------------------------------------------- |
| `login(credentials)`             | Authenticate user, store tokens                             |
| `signup(userData)`               | Register new user                                           |
| `logout()`                       | Clear tokens, invalidate session                            |
| `getCurrentUser()`               | `GET /auth/me`                                              |
| `updateProfile(updates)`         | `PATCH /profile`                                            |
| `changePassword(data)`           | `POST /auth/change-password`                                |
| `uploadAvatar(file)`             | `POST /avatar` — emits `avatar-upload-progress` CustomEvent |
| `checkAuthStatus()`              | Lightweight session check                                   |
| `refreshToken()`                 | Force token refresh                                         |
| `requestPasswordReset(email)`    | Send reset email                                            |
| `resetPassword(token, password)` | Complete reset flow                                         |

### FileService (`api.files`)

| Method                              | Description                               |
| ----------------------------------- | ----------------------------------------- |
| `uploadFile(request, onProgress?)`  | Upload with `AxiosProgressEvent` progress |
| `getFile(id)`                       | Get file metadata                         |
| `downloadFile(id)`                  | Download file                             |
| `updateFile(id, updates)`           | Update metadata                           |
| `deleteFile(id)`                    | Delete file                               |
| `searchFiles(params?, pagination?)` | Search with filters                       |
| `createFolder(data)`                | Create folder                             |
| `getFolder(id, pagination?)`        | Get folder contents                       |
| `updateFolder(id, updates)`         | Rename / update folder                    |
| `deleteFolder(id, options?)`        | Delete (with recursive option)            |
| `shareFile(shareRequest)`           | Share with users                          |
| `bulkFileOperation(operation)`      | Move / copy / delete / tag in bulk        |
| `getStorageAnalytics(folderId?)`    | Usage statistics                          |

**Progress tracking:**

```typescript
import type { AxiosProgressEvent } from 'axios';

await api.files.uploadFile(request, (event: AxiosProgressEvent) => {
  const pct = Math.round((event.loaded * 100) / (event.total ?? event.loaded));
  setProgress(pct);
});
```

### NotificationService (`api.notifications`)

| Method                                        | Description              |
| --------------------------------------------- | ------------------------ |
| `createNotification(data)`                    | Create notification      |
| `getNotification(id)`                         | Get by ID                |
| `getUserNotifications(filters?, pagination?)` | Paginated list           |
| `markAsRead(id)`                              | Mark single read         |
| `markMultipleAsRead(ids)`                     | Bulk read                |
| `getUnreadCount()`                            | Unread badge count       |
| `createTemplate(data)`                        | Create template          |
| `getTemplate(id)`                             | Get template             |
| `getTemplates(filters?, pagination?)`         | List templates           |
| `sendBulkNotifications(request)`              | Batch send               |
| `getUserPreferences()`                        | Fetch user preferences   |
| `updateUserPreferences(prefs)`                | Update preferences       |
| `subscribeToPush(subscription)`               | Register push endpoint   |
| `unsubscribeFromPush(endpoint)`               | Deregister push endpoint |
| `getNotificationStats(filters?)`              | Delivery statistics      |

### Building Custom Feature Services

```typescript
import { BaseService, ValidationSchema } from '@shared/api';
import type { ApiClient } from '@shared/api';

export class ChurchService extends BaseService {
  constructor(client: ApiClient) {
    // Relative path — ApiClient.baseURL (/api/v1) is prepended automatically.
    // Do NOT include the /api/v1 prefix here.
    super(client, '/churches', 'ChurchService');
  }

  async getChurches(filters?: ChurchFilters) {
    return this.getMany<Church>('', filters);
  }

  async createChurch(data: CreateChurchRequest) {
    return this.post<Church>('', data);
  }
}
```

> **Critical:** Never concatenate `this.baseEndpoint` manually inside a service method. `BaseService.buildEndpoint()` does this automatically. Passing `this.baseEndpoint + "/path"` doubles the prefix.

---

## React Integration

### `useApi` — Access Services

```typescript
const api = useApi();
// api.auth, api.files, api.notifications
```

### `useAuth` — Authentication State

```typescript
const {
  user, // User | null
  isAuthenticated, // boolean
  isLoading, // boolean
  error, // string | null
  login, // (credentials: LoginRequest) => Promise<void>
  logout, // () => Promise<void>
  signup // (data: SignupRequest) => Promise<void>
} = useAuth();
```

### `useApiQuery` — Data Fetching

```typescript
const { data, isLoading, error, refetch } = useApiQuery(
  "unique-cache-key",
  () => api.auth.getCurrentUser(),
  {
    enabled: isAuthenticated,   // Conditional fetch
    staleTime: 300_000,         // 5 minutes
    retry: 2,
    onSuccess: (data) => { ... },
    onError: (error) => { ... },
  }
);
```

### `useApiMutation` — Data Modifications

```typescript
const { mutate, isLoading, error, reset } = useApiMutation(
  (data: CreateNotificationRequest) =>
    api.notifications.createNotification(data),
  {
    onSuccess: result => toast.success('Sent!'),
    onError: error => toast.error(error.message)
  }
);

// Call it:
mutate({
  title: 'Hello',
  message: 'World',
  type: 'info',
  recipients: [userId]
});
```

### `useFileUpload` — Upload with Progress Bar

```typescript
const {
  upload, // (file: File) => Promise<T>
  progress, // number (0–100)
  isUploading, // boolean
  error, // string | null
  result // T | null
} = useFileUpload({
  uploadFn: file => api.auth.uploadAvatar(file),
  onSuccess: result => setAvatarUrl(result.avatar),
  onError: err => toast.error(err.message),
  onProgress: pct => console.log(`${pct}%`)
});
```

Progress is tracked via `CustomEvent` dispatched by the service:

- Avatar uploads emit `"avatar-upload-progress"`
- File uploads emit `"file-upload-progress"`

---

## Authentication

Tokens flow automatically:

1. `AuthInterceptor` attaches `Authorization: Bearer <token>` to every request.
2. On `401`, the interceptor calls `POST /auth/refresh` using the **configured** instance (not the global axios — this was a critical bug fixed in this codebase).
3. The failed request is retried once with the new token.
4. On refresh failure, `auth:failure` is dispatched on `window` for app-level redirect handling.

**Listening for forced logout:**

```typescript
useEffect(() => {
  const handler = () => navigate('/login');
  window.addEventListener('auth:failure', handler);
  return () => window.removeEventListener('auth:failure', handler);
}, [navigate]);
```

---

## Error Handling

All errors are classified by `ErrorHandler` into typed `ApiError` objects:

```typescript
import { ApiErrorType } from '@shared/api';

try {
  await api.auth.login(credentials);
} catch (error) {
  switch (error.type) {
    case ApiErrorType.UNAUTHORIZED: // 401
    case ApiErrorType.FORBIDDEN: // 403
    case ApiErrorType.NOT_FOUND: // 404
    case ApiErrorType.VALIDATION: // 422 / 400
    case ApiErrorType.NETWORK_ERROR: // No response
    case ApiErrorType.SERVER_ERROR: // 5xx
  }
}
```

**Global handler via `ApiProvider`:**

```tsx
<ApiProvider
  config={...}
  onError={(error) => {
    if (error.type === ApiErrorType.UNAUTHORIZED) navigate("/login");
  }}
>
```

---

## Caching

Responses are cached in memory by `CacheManager` using the request URL + params as key.

```typescript
// Check cache stats (DEV only)
window.apiCacheStats(); // { size, hits, misses, hitRate }
window.clearApiCache(); // Wipe all cached entries
```

Cache TTL is configured per-service or per-request via `RequestOptions.cacheTTL`. The default TTL is **5 minutes**.

---

## Offline Sync

`syncEngine` (backed by `idb-keyval`) queues mutations made while offline. Call `processQueue()` when the device reconnects:

```typescript
import { syncEngine } from '@shared/api';

// Queue a mutation
await syncEngine.queueMutation(
  'notifications.create',
  [notificationData],
  'notifications.createNotification'
);

// Drain on reconnect
window.addEventListener('online', async () => {
  const api = getApiServices();
  await syncEngine.processQueue({
    notifications: api.notifications,
    files: api.files
  });
});
```

Failed entries are retried up to **5 times**. The retry counter is persisted to IndexedDB so it survives page refreshes.

---

## ArtNet Bridge

`ArtNetBridgeService` triggers ArtNet UDP presets on a connected lighting console. It is initialized automatically when `ApiServices` is instantiated — no manual setup required.

```typescript
import { artNetBridgeService } from '@shared/api';

await artNetBridgeService.triggerPreset('192.168.1.100', presetId, universe);
```

If you need to use it outside the `ApiServices` lifecycle:

```typescript
import { initArtNetBridge, artNetBridgeService } from '@shared/api';
import { ApiClient } from '@shared/api';

const client = new ApiClient({ baseURL: getApiBaseUrl() });
initArtNetBridge(client);

await artNetBridgeService.triggerPreset(ip, id);
```

---

## Troubleshooting

| Symptom                                             | Cause                                                              | Fix                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| API calls hit `localhost:5000` in production        | `getApiBaseUrl()` not used; hardcoded URL                          | Replace with `getApiBaseUrl()`                                                                     |
| Endpoints doubling (`/notifications/notifications`) | `this.baseEndpoint` prepended manually in a service                | Use relative paths in `this.post()` / `this.get()` — `buildEndpoint()` handles the prefix          |
| Upload progress is `NaN%`                           | `event.total` is `undefined` (server didn't send `Content-Length`) | Use `event.total ?? event.loaded` as divisor                                                       |
| Ghost listeners on repeated failed uploads          | `removeEventListener` only ran on success                          | Fixed — listeners are removed in a `finally` block                                                 |
| `ArtNetBridgeService not initialized` error         | `initArtNetBridge()` not called                                    | `ApiServices` constructor calls it automatically; only call manually if using `ApiClient` directly |
| `auth:failure` event fires but app doesn't redirect | No listener on `window`                                            | Add `window.addEventListener("auth:failure", ...)` in your Auth error boundary                     |
| TypeScript error: no `useChurch` / `setupDevApi`    | These were removed; they were phantom helpers                      | Use `useApi()` and `createApiServices()`                                                           |

---

## Future: Removing Axios

Axios is **intentionally isolated** to `frontend/shared/package.json` only. No app-level `package.json` declares it.

When the time comes to remove it entirely, two pieces of work remain:

1. **Replace `this.axios.request()` with `fetch()`** — Reimplement the auth header attachment, 401-retry, and retry-on-error logic as a small middleware chain.
2. **Replace `onUploadProgress` with `XMLHttpRequest`** — `fetch()` does not support upload progress. Use the `xhr.upload.onprogress` pattern documented in `core/ApiClient.ts`.

Once both are done, `axios` can be removed from `frontend/shared/package.json` entirely.
