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

## Configuration

### Basic Setup

```typescript
// main.tsx or App.tsx
import { initializeApiServices } from "@shared/api";

// Initialize once at app startup
const api = initializeApiServices({
  baseUrl: import.meta.env.VITE_API_URL,
  timeout: 10000,
  enableDebugLogging: import.meta.env.DEV,
});

export default api;
```

### Environment Variables

create `.env.local`:

```. env
VITE_API_URL=http://localhost:5000
```

### Getting API Base URL

```typescript
import { getApiBaseUrl, getAbsoluteUrl } from "@shared/api";

// Get base URL
const apiUrl = getApiBaseUrl(); // http://localhost:5000

//Convert relative to absolute
const avatarUrl = getAbsoluteUrl("/uploads/avatar.jpg");
// http://localhost:5000/uploads/avatar.jpg
```

## Authentication

### Login

```typescript
import { useAuth } from '@shared/api/hooks';

function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (email, password) => {
    await login({ email, password });
    // User is automatically updated in context
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error.message}</div>}
      <button disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Check Auth Status

```typescript
import { useAuth } from '@shared/api/hooks';

function ProtectedRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

### Logout

```typescript
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // User state is cleared, tokens removed
  navigate("/login");
};
```

## Data Fetching

### Simple Data Fetch

```typescript
import { useChurch } from '@shared/api/hooks';

function ChurchList() {
  const { churches, loading, error, refetch } = useChurch();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {churches.map(church => (
        <ChurchCard key={church.id} church={church} />
      ))}
    </div>
  );
}
```

### Fetch with Pagination

```typescript
import { getApiServices } from '@shared/api';

function PaginatedList() {
  const [page, setPage] = useState(1);
  const api = getApiServices();

  const { data, loading } = useApiQuery(
    ['churches', page],
    () => api.church.getChurches({}, { page, limit: 10 }),
    { cacheTime: 300000 }
  );

  return (
    <div>
      {data?.data.map(church => <ChurchCard key={church.id} church={church} />  )}
      <Pagination
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Fetch with Filters

```typescript
const [filters, setFilters] = useState({
  denomination: "",
  city: "",
});

const { data: churches, loading } = useApiQuery(
  ["churches", filters],
  () => api.church.getChurches(filters),
  { enabled: !!filters.city }, // Only fetch when city is set
);
```

## Data Mutations

### Create Record

```typescript
import { useApiMutation } from '@shared/api/hooks';

function CreateChurchForm() {
  const api = getApiServices();
  const navigate = useNavigate();

  const { mutate, isLoading, error } = useApiMutation(
    (churchData) => api.church.createChurch(churchData),
    {
      onSuccess: (newChurch) => {
        console.log('Created:', newChurch);
        navigate(`/churches/${newChurch.id}`);
      },
      onError: (error) => {
        console.error('Failed:', error);
      },
    }
  );

  const handleSubmit = (formData) => {
    mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage error={error} />}
      <button disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Church'}
      </button>
    </form>
  );
}
```

### Update Record

```typescript
const { mutate: updateChurch } = useApiMutation(({ id, updates }) => api.church.updateChurch(id, updates), {
  onSuccess: () => {
    // Invalidate cache to refetch
    queryClient.invalidateQueries(["church", churchId]);
    toast.success("Updated successfully");
  },
});

const handleUpdate = () => {
  updateChurch({ id: churchId, updates: formData });
};
```

### Delete Record

```typescript
const { mutate: deleteChurch, isLoading: isDeleting } = useApiMutation((id) => api.church.deleteChurch(id), {
  onSuccess: () => {
    queryClient.invalidateQueries(["churches"]);
    navigate("/churches");
  },
});

const handleDelete = () => {
  if (confirm("Are you sure?")) {
    deleteChurch(churchId);
  }
};
```

## File Uploads

### Upload Avatar

```typescript
import { useFileUpload } from '@shared/api/hooks';

function AvatarUpload() {
  const api = getApiServices();

  const { upload, progress, isUploading } = useFileUpload();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await upload(
        (file, onProgress) => api.files.uploadFile({
          file,
          type: 'avatar'
        }, onProgress)
      );

      console.log('Uploaded:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading && (
        <ProgressBar value={progress} max={100} />
      )}
    </div>
  );
}
```

### Upload with Progress

```typescript
const handleUpload = async (file) => {
  const result = await api.files.uploadFile({ file, folder: "avatars" }, (progressEvent) => {
    const percent = (progressEvent.loaded / progressEvent.total) * 100;
    setProgress(percent);
  });

  setAvatarUrl(result.url);
};
```

## Error Handling

### Component-Level Error Handling

```typescript
function ChurchDetail({ id }) {
  const { data: church, error, isLoading } = useApiQuery(
    ['church', id],
    () => api.church.getChurch(id)
  );

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    // Different UIs based on error type
    if (error.type === 'NETWORK_ERROR') {
      return <OfflineMessage onRetry={() => refetch()} />;
    }

    if (error.type === 'NOT_FOUND') {
      return <NotFoundMessage />;
    }

    return <ErrorMessage error={error} />;
  }

  return <ChurchCard church={church} />;
}
```

### Global Error Handler

```typescript
// App.tsx
import { ApiProvider } from '@shared/api';

function App() {
  const handleApiError = (error) => {
    if (error.type === 'AUTH_ERROR') {
      // Redirect to login
      navigate('/login');
    } else if (error.type === 'NETWORK_ERROR') {
      // Show global offline banner
      setOffline(true);
    }
  };

  return (
    <ApiProvider config={apiConfig} onError={handleApiError}>
      <YourApp />
    </ApiProvider>
  );
}
```

## Caching

### Cache with Custom TTL

```typescript
const { data } = useApiQuery("churches-list", () => api.church.getChurches(), {
  cacheTime: 600000, // 10 minutes
  staleTime: 300000, // 5 minutes
});
```

### Invalidate Cache on Mutation

```typescript
const { mutate } = useApiMutation((data) => api.church.createChurch(data), {
  onSuccess: () => {
    // Invalidate all church queries
    queryClient.invalidateQueries(["churches"]);
  },
});
```

### Manual Cache Control

```typescript
import { getApiServices } from "@shared/api";

const api = getApiServices();

// Clear specific cache
api.clearCache();

// Get cache stats
const stats = api.getCacheStats();
console.log("Cache size:", stats.size);
```

## Advanced Patterns

### Optimistic Updates

```typescript
const { mutate } = useApiMutation(({ id, updates }) => api.church.updateChurch(id, updates), {
  onMutate: async ({ id, updates }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(["church", id]);

    // Snapshot previous value
    const previous = queryClient.getQueryData(["church", id]);

    // Optimistically update UI
    queryClient.setQueryData(["church", id], (old) => ({
      ...old,
      ...updates,
    }));

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["church", variables.id], context.previous);
  },
  onSettled: (data, error, variables) => {
    // Refetch to ensure sync
    queryClient.invalidateQueries(["church", variables.id]);
  },
});
```

### Parallel Requests

```typescript
import { useQueries } from '@tanstack/react-query';

function Dashboard() {
  const api = getApiServices();

  const results = useQueries({
    queries: [
      { queryKey: ['churches'], queryFn: () => api.church.getChurches() },
      { queryKey: ['events'], queryFn: () => api.events.getEvents() },
      { queryKey: ['members'], queryFn: () => api.church.getMembers() },
    ],
  });

  const [churches, events, members] = results;

  const isLoading = results.some(r => r.isLoading);
  const hasError = results.some(r => r.error);

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {hasError && <ErrorMessage />}
      {/* Render data */}
    </div>
  );
}
```

### Dependent Queries

```typescript
function ChurchMembers({ churchId }) {
  // First, get church
  const { data: church } = useApiQuery(
    ['church', churchId],
    () => api.church.getChurch(churchId)
  );

  // Then get members (only runs if church loaded)
  const { data: members } = useApiQuery(
    ['church-members', churchId],
    () => api.church.getChurchMembers(churchId),
    { enabled: !!church }  // Wait for church to load
  );

  return <MemberList members={members} />;
}
```

### Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteChurchList() {
  const api = getApiServices();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['churches-infinite'],
    queryFn: ({ pageParam = 1 }) =>
      api.church.getChurches({}, { page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });

  return (
    <div>
      {data?.pages.map(page =>
        page.data.map(church => (
          <ChurchCard key={church.id} church={church} />
        ))
      )}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Best Practices

1. **Always handle loading and error states**
2. **Use TypeScript types for type safety**
3. **Invalidate cache after mutations**
4. **Set appropriate cache TTLs**
5. **Use optimistic updates for better UX**
6. **Handle offline scenarios gracefully**
7. **Avoid fetching in render - use hooks**
8. **Batch related requests when possible**

## Performance Tips

1. **Enable caching** for frequently accessed data
2. **Use pagination** for large lists
3. **Implement infinite scroll** for better UX
4. **Optimize cache invalidation** (don't clear everything)
5. **Use query prefetching** for predictable navigation
6. **Debounce search inputs** to reduce API calls
7. **Use request deduplication** (automatic with ApiClient)

## Debugging

Enable debug mode to see detailed API logs:

```typescript
const api = initializeApiServices({
  baseUrl: import.meta.env.VITE_API_URL,
  enableDebugLogging: true, // Shows all API calls in console
});
```

Access debug utilities in browser console:

```javascript
// Available in development mode
window.apiServices; // Access API services
window.clearApiCache(); // Clear all caches
window.apiCacheStats(); // View cache statistics
window.apiHealthCheck(); // Check service health
```

## Support

For questions or issues:

- Check [README.md](./README.md) for architecture overview
- See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for migration help
- Review existing examples in `examples/` directory
