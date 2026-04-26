# API Usage Guide

Practical examples and patterns for using the unified API layer.

## Table of Contents

1. [Configuration](#configuration)
2. [Authentication](#authentication)
3. [Data Fetching](#data-fetching)
4. [Data Mutations](#data-mutations)
5. [File Uploads](#file-uploads)
6. [Error Handling](#error-handling)
7. [Caching](#caching)
8. [Advanced Patterns](#advanced-patterns)
9. [Debugging](#debugging)

---

## Configuration

### Wrapping your app

```tsx
// main.tsx — do this once at the root level
import { ApiProvider, getApiBaseUrl } from "@shared/api";

function Root() {
  return (
    <ApiProvider
      config={{
        baseURL: getApiBaseUrl(),
        timeout: 10000,
        cacheEnabled: true,
        authEnabled: true,
        authConfig: {
          tokenKey: "uni_auth_access_token",
          refreshTokenKey: "uni_auth_refresh_token",
          tokenStorage: "sessionStorage",
        },
      }}
      onError={(error) => console.error("[API]", error)}
    >
      <App />
    </ApiProvider>
  );
}
```

### Getting API Base URL

Always use `getApiBaseUrl()` — never read `import.meta.env.VITE_API_URL` directly in component code.

```typescript
import { getApiBaseUrl, getAbsoluteUrl } from "@shared/api";

const base = getApiBaseUrl();
// Dev:        "http://localhost:5000/api"
// Production: "/api" (Vite proxy or Firebase rewrite handles routing)

const avatarUrl = getAbsoluteUrl("/uploads/avatar.jpg");
// Dev:        "http://localhost:5000/uploads/avatar.jpg"
// Production: "/uploads/avatar.jpg"
```

---

## Authentication

### Login

```typescript
import { useAuth } from "@shared/api";

function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    await login({ email, password });
    // user state is automatically updated — no setUser needed
  };

  return (
    <form onSubmit={...}>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in…" : "Log In"}
      </button>
    </form>
  );
}
```

### Protected Route

```tsx
import { useAuth } from "@shared/api";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

### Logout

```typescript
const { logout } = useAuth();

const handleLogout = async () => {
  await logout(); // tokens cleared, session invalidated
  navigate("/login");
};
```

### Forced Logout (Token Refresh Failure)

The `AuthInterceptor` dispatches `auth:failure` on `window` when a token refresh fails. Listen at your app root:

```typescript
useEffect(() => {
  const handler = () => navigate("/login");
  window.addEventListener("auth:failure", handler);
  return () => window.removeEventListener("auth:failure", handler);
}, [navigate]);
```

---

## Data Fetching

### Simple Fetch

```tsx
import { useApi, useApiQuery } from "@shared/api";

function UserProfile() {
  const api = useApi();
  const { data: user, isLoading, error } = useApiQuery("current-user", () => api.auth.getCurrentUser());

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{user?.displayName}</div>;
}
```

### Conditional Fetch

```typescript
const { isAuthenticated } = useAuth();

const { data } = useApiQuery(
  "user-notifications",
  () => api.notifications.getUserNotifications(),
  { enabled: isAuthenticated }, // only runs when logged in
);
```

### Paginated Fetch

```typescript
const [page, setPage] = useState(1);

const { data } = useApiQuery(["churches", page], () => api.church.getChurches({}, { page, limit: 10 }), { staleTime: 300_000 });

// data.items — current page
// data.pagination.totalPages
// data.pagination.hasNextPage
```

### Fetch with Filters

```typescript
const [search, setSearch] = useState("");

const { data: results } = useApiQuery(["notifications", search], () => api.notifications.getUserNotifications({ search }), { enabled: search.length > 2 });
```

---

## Data Mutations

### Create

```typescript
import { useApi, useApiMutation } from "@shared/api";
import type { CreateNotificationRequest } from "@shared/api";

function SendNotificationForm() {
  const api = useApi();

  const { mutate: send, isLoading } = useApiMutation(
    (data: CreateNotificationRequest) => api.notifications.createNotification(data),
    {
      onSuccess: () => toast.success("Notification sent!"),
      onError: (err) => toast.error(err.message),
    },
  );

  return (
    <button onClick={() => send({ title: "Hello", message: "…", type: "info", recipients: [userId] })} disabled={isLoading}>
      {isLoading ? "Sending…" : "Send"}
    </button>
  );
}
```

### Update

```typescript
const { mutate: updatePrefs } = useApiMutation((prefs: Partial<NotificationPreferences>) => api.notifications.updateUserPreferences(prefs), {
  onSuccess: () => {
    // Invalidate the cached preferences so they refetch
    refetchPreferences();
  },
});
```

### Delete

```typescript
const { mutate: deleteFile, isLoading: isDeleting } = useApiMutation((id: string) => api.files.deleteFile(id), {
  onSuccess: () => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast.success("File deleted");
  },
});
```

---

## File Uploads

### Avatar Upload (via `useFileUpload`)

```tsx
import { useFileUpload, useApi } from "@shared/api";

function AvatarUpload() {
  const api = useApi();

  const { upload, progress, isUploading, error } = useFileUpload({
    uploadFn: (file) => api.auth.uploadAvatar(file),
    onSuccess: (updatedUser) => setAvatarUrl(updatedUser.avatar),
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      <input type="file" accept="image/*" disabled={isUploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {isUploading && <ProgressBar value={progress} max={100} />}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### File Upload with Manual Progress

```typescript
import type { AxiosProgressEvent } from "axios";

const handleUpload = async (file: File) => {
  const result = await api.files.uploadFile({ file, category: "documents" }, (event: AxiosProgressEvent) => {
    // event.total can be undefined if the server omits Content-Length
    const pct = Math.round((event.loaded * 100) / (event.total ?? event.loaded));
    setProgress(pct);
  });
  setFileUrl(result.url);
};
```

---

## Error Handling

### Component-Level

```tsx
import { ApiErrorType } from "@shared/api";

const { data, error } = useApiQuery("church", () => api.church.getChurch(id));

if (error) {
  if (error.type === ApiErrorType.NOT_FOUND) return <NotFound />;
  if (error.type === ApiErrorType.NETWORK_ERROR) return <Offline onRetry={refetch} />;
  return <ErrorMessage error={error} />;
}
```

### Global Error Handler

```tsx
<ApiProvider
  config={...}
  onError={(error) => {
    if (error.type === ApiErrorType.UNAUTHORIZED) navigate("/login");
    else if (error.type === ApiErrorType.NETWORK_ERROR) setOfflineBanner(true);
  }}
>
```

### Mutation Error Handling

```typescript
const { mutate, error, reset } = useApiMutation((data) => api.notifications.createNotification(data), { onError: (err) => Sentry.captureException(err) });

// Clear error state after user fixes input
reset();
```

---

## Caching

### Custom TTL per Query

```typescript
const { data } = useApiQuery("notification-prefs", () => api.notifications.getUserPreferences(), {
  staleTime: 600_000, // serve from cache for 10 minutes
  retry: 1,
});
```

### Manual Cache Control (DEV)

Available in browser console when `enableDebugLogging: true`:

```javascript
window.apiCacheStats(); // { size, hits, misses, hitRate }
window.clearApiCache(); // Wipe everything
window.apiHealthCheck(); // Ping auth service
window.apiServices; // Direct access to ApiServices instance
```

---

## Advanced Patterns

### Optimistic Updates

```typescript
const queryClient = useQueryClient();

const { mutate: markRead } = useApiMutation((id: string) => api.notifications.markAsRead(id), {
  onMutate: async (id) => {
    await queryClient.cancelQueries(["notifications"]);
    const previous = queryClient.getQueryData(["notifications"]);
    queryClient.setQueryData(["notifications"], (old: Notification[]) => old.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
    return { previous };
  },
  onError: (_err, _id, context) => {
    queryClient.setQueryData(["notifications"], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(["notifications"]);
  },
});
```

### Parallel Requests

```typescript
import { useQueries } from "@tanstack/react-query";

const [profileResult, notifResult] = useQueries({
  queries: [
    { queryKey: ["user-profile"], queryFn: () => api.auth.getCurrentUser() },
    { queryKey: ["unread-count"], queryFn: () => api.notifications.getUnreadCount() },
  ],
});

const isLoading = profileResult.isLoading || notifResult.isLoading;
```

### Offline Mutation Queue

```typescript
import { syncEngine, getApiServices } from "@shared/api";

// Queue when offline
const handleOfflineAction = async (data: CreateNotificationRequest) => {
  await syncEngine.queueMutation("notification-create", [data], "notifications.createNotification");
  toast.info("Saved offline — will sync when reconnected");
};

// Drain on reconnect
useEffect(() => {
  const drain = async () => {
    const api = getApiServices();
    await syncEngine.processQueue({
      notifications: api.notifications,
      files: api.files,
    });
  };
  window.addEventListener("online", drain);
  return () => window.removeEventListener("online", drain);
}, []);
```

### Dependent Queries

```typescript
const { data: user } = useApiQuery("user", () => api.auth.getCurrentUser());

const { data: notifications } = useApiQuery(
  ["notifications", user?.id],
  () => api.notifications.getUserNotifications(),
  { enabled: !!user }, // only fetches after user loads
);
```

---

## Debugging

Enable detailed request/response logging:

```typescript
<ApiProvider
  config={{
    ...config,
    enableDebugLogging: import.meta.env.DEV,
  }}
>
```

> In DEV mode all HTTP requests log to the console and `window.apiServices`, `window.clearApiCache`, `window.apiCacheStats`, and `window.apiHealthCheck` are available in the browser developer tools.
