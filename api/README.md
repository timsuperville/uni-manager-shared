# Unified API Service Layer

A comprehensive, type-safe API layer that provides consistent patterns and functionality across all 6 Uni-Manager applications.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Architecture](#core-architecture)
- [React Integration](#react-integration)
- [Services](#services)
- [Error Handling](#error-handling)
- [Caching](#caching)
- [Authentication](#authentication)
- [Migration Guide](#migration-guide)

## Overview

The Unified API Service Layer provides:

- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Consistent Patterns**: Standardized request/response handling across all services
- **Error Handling**: Centralized error management with user-friendly messages
- **Intelligent Caching**: Automatic response caching with TTL and invalidation
- **Authentication**: Seamless token management with automatic refresh
- **React Integration**: Custom hooks for easy component integration

## Quick Start

### 1. Basic Setup

```typescript
import { ApiProvider, setupDevApi } from "@shared/api";

// For development
const apiServices = setupDevApi();

// For production
const apiServices = setupProdApi("https://api.yourdomain.com");
```

### 2. React Application Setup

```tsx
import React from "react";
import { ApiProvider } from "@shared/api";

const App: React.FC = () => {
  const apiConfig = {
    baseURL: "http://localhost:5000/api",
    timeout: 10000,
    enableCaching: true,
    enableAuth: true,
  };

  return (
    <ApiProvider config={apiConfig}>
      <YourApplication />
    </ApiProvider>
  );
};
```

### 3. Using Hooks in Components

```tsx
import { useAuth, useChurch, useApiQuery } from "@shared/api";

const MyComponent: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { getChurches, createChurch } = useChurch();

  const { data: churches, isLoading } = useApiQuery("churches-list", () =>
    getChurches(),
  );

  return <div>{/* Your component JSX */}</div>;
};
```

## Core Architecture

### Components Overview

```
frontend/shared/api/
├── core/                 # Core infrastructure
│   ├── ApiClient.ts     # HTTP client with interceptors
│   ├── ErrorHandler.ts  # Centralized error handling
│   ├── CacheManager.ts  # Intelligent caching system
│   └── AuthInterceptor.ts # Authentication management
├── services/            # Feature-specific services
│   ├── BaseService.ts   # Abstract base class
│   ├── AuthService.ts   # Authentication operations
│   ├── ChurchService.ts # Church management
│   └── index.ts         # Service registry
├── types/               # TypeScript definitions
│   └── index.ts         # All type definitions
├── hooks/               # React hooks
│   └── index.ts         # Custom hooks for React integration
├── components/          # React components
│   └── ApiProvider.tsx  # Context provider
└── examples/            # Integration examples
    └── integration-examples.tsx
```

### Core Classes

#### ApiClient

HTTP client with automatic retries, request/response interceptors, and error handling.

```typescript
const client = new ApiClient({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  enableRetry: true,
  maxRetries: 3,
});
```

#### ErrorHandler

Centralized error handling with user-friendly messages and retry logic.

```typescript
const errorHandler = new ErrorHandler({
  enableUserFriendlyMessages: true,
  enableRetry: true,
  logErrors: true,
});
```

#### CacheManager

Intelligent caching with TTL, pattern-based invalidation, and memory management.

```typescript
const cacheManager = new CacheManager({
  defaultTTL: 300000, // 5 minutes
  maxSize: 100,
  enablePatternInvalidation: true,
});
```

## React Integration

### ApiProvider

Provides API services to your React application tree.

```tsx
<ApiProvider
  config={apiConfig}
  onError={(error) => console.error("API Error:", error)}
>
  <App />
</ApiProvider>
```

### Core Hooks

#### useApi

Access to all API services.

```typescript
const api = useApi();
const churches = await api.church.getChurches();
```

#### useAuth

Authentication state and operations.

```typescript
const { user, isAuthenticated, isLoading, login, logout, signup } = useAuth();
```

#### useApiQuery

Data fetching with loading states and caching.

```typescript
const { data, isLoading, error, refetch } = useApiQuery(
  "unique-key",
  () => api.church.getChurches(),
  { cacheTime: 300000 },
);
```

#### useApiMutation

Data mutations with loading states and callbacks.

```typescript
const { mutate, isLoading, error } = useApiMutation(
  (churchData) => api.church.createChurch(churchData),
  {
    onSuccess: (data) => console.log("Created:", data),
    onError: (error) => console.error("Failed:", error),
  },
);
```

## Services

### AuthService

Handles authentication operations.

**Available Methods:**

- `login(credentials)` - User login
- `logout()` - User logout
- `signup(userData)` - User registration
- `refreshToken()` - Refresh authentication token
- `getCurrentUser()` - Get current user data
- `updateProfile(updates)` - Update user profile
- `changePassword(data)` - Change user password
- `checkAuthStatus()` - Check authentication status

### ChurchService

Manages church-related operations.

**Available Methods:**

- `getChurches(filters?, pagination?)` - List churches
- `getChurch(id)` - Get specific church
- `createChurch(data)` - Create new church
- `updateChurch(id, updates)` - Update church
- `deleteChurch(id)` - Delete church
- `searchChurches(query, filters?)` - Search churches
- `getChurchMembers(churchId, filters?, pagination?)` - Get church members
- `getChurchMember(churchId, memberId)` - Get specific member
- `updateChurchMember(churchId, memberId, updates)` - Update member
- `removeChurchMember(churchId, memberId)` - Remove member

### EventService

Comprehensive event management system.

**Available Methods:**

- `createEvent(data)` - Create new event
- `getEvent(id)` - Get event details
- `updateEvent(id, updates)` - Update event
- `deleteEvent(id)` - Delete event
- `searchEvents(params?, pagination?)` - Search events with filters
- `registerForEvent(eventId, data)` - Register for event
- `unregisterFromEvent(eventId, registrationId)` - Cancel registration
- `getEventRegistrations(eventId, pagination?)` - Get event registrations
- `updateRegistration(eventId, registrationId, updates)` - Update registration
- `getEventAnalytics(eventId, metrics?)` - Get event analytics
- `uploadEventImage(eventId, imageFile, onProgress?)` - Upload event image

### FileService

Complete file management solution.

**Available Methods:**

- `uploadFile(request, onProgress?)` - Upload file with progress tracking
- `getFile(id)` - Get file metadata
- `downloadFile(id)` - Download file
- `updateFile(id, updates)` - Update file metadata
- `deleteFile(id)` - Delete file
- `searchFiles(params?, pagination?)` - Search files with filters
- `createFolder(data)` - Create new folder
- `getFolder(id, pagination?)` - Get folder contents
- `updateFolder(id, updates)` - Update folder
- `deleteFolder(id, options?)` - Delete folder (with recursive option)
- `shareFile(shareRequest)` - Share file with users
- `bulkFileOperation(operation)` - Perform bulk operations
- `getStorageAnalytics(folderId?)` - Get storage statistics

### NotificationService

Advanced notification system.

**Available Methods:**

- `createNotification(data)` - Create new notification
- `getNotification(id)` - Get notification details
- `updateNotification(id, updates)` - Update notification
- `sendNotification(id)` - Send notification immediately
- `getUserNotifications(filters?, pagination?)` - Get user notifications
- `markAsRead(id)` - Mark notification as read
- `createTemplate(data)` - Create notification template
- `getTemplate(id)` - Get template details
- `sendBulkNotifications(request)` - Send bulk notifications
- `getUserPreferences()` - Get notification preferences
- `updateUserPreferences(preferences)` - Update preferences
- `getNotificationStats(filters?)` - Get notification statistics

## Error Handling

### Automatic Error Processing

All API errors are automatically processed and transformed into user-friendly messages.

```typescript
try {
  await api.church.createChurch(invalidData);
} catch (error) {
  // Error is already processed and user-friendly
  console.error(error.message); // "Please check the required fields"
}
```

### Custom Error Handling

```typescript
const { mutate } = useApiMutation((data) => api.church.createChurch(data), {
  onError: (error, variables) => {
    // Custom error handling
    if (error.type === "VALIDATION_ERROR") {
      showValidationErrors(error.details);
    } else {
      showGenericError(error.message);
    }
  },
});
```

## Caching

### Automatic Caching

API responses are automatically cached based on endpoints and parameters.

```typescript
// First call - hits the server
const churches1 = await api.church.getChurches();

// Second call - served from cache
const churches2 = await api.church.getChurches();
```

### Cache Invalidation

```typescript
// Invalidate specific cache
api.cache.invalidate("churches/list");

// Invalidate by pattern
api.cache.invalidatePattern("churches/*");

// Clear all cache
api.cache.clear();
```

### Custom Cache TTL

```typescript
const { data } = useApiQuery(
  "churches",
  () => api.church.getChurches(),
  { cacheTime: 600000 }, // 10 minutes
);
```

## Authentication

### Automatic Token Management

Authentication tokens are automatically:

- Attached to all requests
- Refreshed when expired
- Stored securely
- Removed on logout

### Authentication Status

```typescript
const { isAuthenticated, user } = useAuth();

if (isAuthenticated) {
  console.log("User:", user.displayName);
} else {
  // Redirect to login
}
```

## Migration Guide

### From Existing API Patterns

#### Before (Direct Axios)

```typescript
const response = await axios.get("/api/churches", {
  headers: { Authorization: `Bearer ${token}` },
});
const churches = response.data;
```

#### After (Unified API)

```typescript
const churches = await api.church.getChurches();
```

#### Before (Manual Error Handling)

```typescript
try {
  const response = await axios.post("/api/churches", data);
  return response.data;
} catch (error) {
  if (error.response?.status === 400) {
    throw new Error("Validation failed");
  } else if (error.response?.status === 401) {
    // Handle auth error
  }
  throw error;
}
```

#### After (Automatic Error Handling)

```typescript
try {
  return await api.church.createChurch(data);
} catch (error) {
  // Error is already processed and user-friendly
  throw error;
}
```

### React Component Migration

#### Before (useEffect + State)

```typescript
const [churches, setChurches] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchChurches = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/churches");
      setChurches(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchChurches();
}, []);
```

#### After (useApiQuery)

```typescript
const {
  data: churches,
  isLoading: loading,
  error,
} = useApiQuery("churches", () => api.church.getChurches());
```

## Best Practices

### 1. Use Appropriate Hooks

- `useApiQuery` for data fetching
- `useApiMutation` for data modifications
- Direct service calls for imperative operations

### 2. Handle Loading States

```typescript
const { data, isLoading, error } = useApiQuery(key, queryFn);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <NoData />;

return <DataDisplay data={data} />;
```

### 3. Implement Optimistic Updates

```typescript
const { mutate } = useApiMutation(
  (updates) => api.church.updateChurch(churchId, updates),
  {
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(["church", churchId]);
    },
  },
);
```

### 4. Use TypeScript Types

```typescript
import type { Church, CreateChurchRequest } from "@shared/api";

const createChurch = (data: CreateChurchRequest): Promise<Church> => {
  return api.church.createChurch(data);
};
```

## Troubleshooting

### Common Issues

1. **API services not initialized**
   - Ensure `ApiProvider` wraps your app
   - Check that config is properly passed

2. **TypeScript errors**
   - Import types from `@shared/api`
   - Use proper generic types with hooks

3. **Authentication errors**
   - Check token storage settings
   - Verify backend authentication endpoints

4. **Cache issues**
   - Use cache invalidation after mutations
   - Check cache TTL settings

### Debug Mode

```typescript
const apiConfig = {
  baseURL: "http://localhost:5000/api",
  debug: true, // Enables detailed logging
  enableRetry: false, // Disable for debugging
};
```

## Performance Considerations

### 1. Cache Strategy

- Default TTL: 5 minutes for lists, 1 minute for details
- Automatic invalidation on mutations
- Pattern-based cache clearing

### 2. Request Optimization

- Automatic request deduplication
- Configurable retry logic
- Request/response compression

### 3. Bundle Size

The unified API layer adds approximately 15KB gzipped to your bundle.

## Contributing

When adding new services:

1. Extend `BaseService` class
2. Implement comprehensive validation schemas
3. Add TypeScript types
4. Create corresponding React hooks
5. Update documentation and examples

## Version History

- **1.0.0** - Initial release with core infrastructure
- **1.1.0** - Added React hooks integration
- **1.2.0** - Enhanced caching and error handling
- **1.3.0** - Added file upload support
- **2.0.0** - Complete rewrite with TypeScript
