# Universal Login Form Component

A comprehensive, reusable login component designed to work across all frontend applications in the Uni-Manager system.

## Features

- 🎨 **Multi-App Support**: Preconfigured for admin, church, business, home, personal, and playback apps
- 🎭 **Theme System**: Support for default, dark, and minimal themes
- 🔧 **Highly Customizable**: Override titles, descriptions, colors, and behavior
- ♿ **Accessibility First**: Full ARIA support and keyboard navigation
- 🧪 **Comprehensive Testing**: Full test coverage with Vitest
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🔒 **Security Features**: Built-in validation and security best practices

## Quick Start

```jsx
import { UniversalLoginForm } from "@shared/auth/components/UniversalLoginForm";

// Basic usage
export function LoginPage() {
  return <UniversalLoginForm appType="admin" />;
}
```

## App Type Configurations

Each app type comes with preconfigured styling and behavior:

### Admin App

- **Icon**: 🔐
- **Title**: Admin Portal Access
- **Color**: Blue
- **Default Redirect**: `/dashboard`

### Church App

- **Icon**: ⛪
- **Title**: Church Management
- **Color**: Purple
- **Default Redirect**: `/services`

### Business App

- **Icon**: 💼
- **Title**: Business Portal
- **Color**: Emerald
- **Default Redirect**: `/overview`

### Home App

- **Icon**: 🏠
- **Title**: Home Management
- **Color**: Amber
- **Default Redirect**: `/dashboard`

### Personal App

- **Icon**: 👤
- **Title**: Personal Dashboard
- **Color**: Indigo
- **Default Redirect**: `/dashboard`

### Playback App

- **Icon**: 🎵
- **Title**: Media Playback
- **Color**: Pink
- **Default Redirect**: `/player`

## Props API

| Prop               | Type                               | Default                | Description                      |
| ------------------ | ---------------------------------- | ---------------------- | -------------------------------- |
| `appType`          | `AppType`                          | `"default"`            | Predefined app configuration     |
| `appTitle`         | `string`                           | _App-specific_         | Override the default title       |
| `appDescription`   | `string`                           | _App-specific_         | Override the default description |
| `onSuccess`        | `function`                         | _Navigate to redirect_ | Callback when login succeeds     |
| `onError`          | `function`                         | _None_                 | Callback when login fails        |
| `theme`            | `"default" \| "dark" \| "minimal"` | `"default"`            | Visual theme                     |
| `redirectPath`     | `string`                           | _App-specific_         | Where to navigate after login    |
| `showRememberMe`   | `boolean`                          | `true`                 | Show remember me checkbox        |
| `showRegistration` | `boolean`                          | `false`                | Show registration link           |

## Theme System

### Default Theme

Clean, professional look with gray backgrounds and app-specific accent colors.

### Dark Theme

Dark backgrounds with high contrast for reduced eye strain.

### Minimal Theme

Clean, minimal design with subtle borders and ample whitespace.

## Advanced Usage

### Custom Event Handlers

```jsx
function LoginPage() {
  const handleSuccess = (result) => {
    // Custom success logic
    console.log("User logged in:", result.user);
    analytics.track("login_success");
    navigate("/custom-path");
  };

  const handleError = (error) => {
    // Custom error handling
    console.error("Login failed:", error);
    toast.error("Please check your credentials");
  };

  return (
    <UniversalLoginForm
      appType="business"
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

### Complete Customization

```jsx
function CustomLoginPage() {
  return (
    <UniversalLoginForm
      appType="default"
      appTitle="My Custom App"
      appDescription="Welcome to our special portal"
      theme="dark"
      redirectPath="/custom-dashboard"
      showRememberMe={false}
      showRegistration={true}
    />
  );
}
```

### Integration with Existing Apps

Replace existing login forms by importing and using the Universal component:

```jsx
// Before: App-specific login form
import { LoginForm } from "./features/auth/components/LoginForm";

// After: Universal login form
import { UniversalLoginForm } from "@shared/auth/components/UniversalLoginForm";

export function AuthPage() {
  return (
    <UniversalLoginForm
      appType="admin"
      onSuccess={(result) => {
        // Existing success logic
      }}
    />
  );
}
```

## Form Validation

The component includes built-in validation:

- ✅ Email format validation
- ✅ Required field validation
- ✅ Submit button state management
- ✅ Loading state handling
- ✅ Error display

## Accessibility Features

- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus management
- ✅ Color contrast compliance
- ✅ Form validation announcements

## Testing

The component comes with comprehensive test coverage:

```bash
# Run tests for the Universal Login component
npm test -- UniversalLoginForm.test.jsx

# Run with coverage
npm test -- --coverage UniversalLoginForm.test.jsx
```

## TypeScript Support

Full TypeScript interfaces are available:

```typescript
import type {
  LoginFormProps,
  LoginResult,
  User,
} from "@shared/auth/types/auth.types";

const handleSuccess = (result: LoginResult) => {
  console.log("Logged in user:", result.user);
};
```

## Migration Guide

### From Existing Login Forms

1. **Import the Universal component**:

   ```jsx
   import { UniversalLoginForm } from "@shared/auth/components/UniversalLoginForm";
   ```

2. **Replace existing form with Universal component**:

   ```jsx
   // Before
   <LoginForm onSuccess={handleSuccess} />

   // After
   <UniversalLoginForm
     appType="admin"
     onSuccess={handleSuccess}
   />
   ```

3. **Update routing** (if necessary):

   ```jsx
   // The component handles navigation automatically
   // or use the onSuccess callback for custom logic
   ```

4. **Remove old login form files** after migration is complete

### Configuration Checklist

- [ ] Choose appropriate `appType` for your application
- [ ] Test login flow with your authentication system
- [ ] Verify redirect paths are correct
- [ ] Check theme matches your app's design
- [ ] Test error handling scenarios
- [ ] Validate accessibility with screen readers
- [ ] Run tests to ensure everything works

## Troubleshooting

### Common Issues

**Component not rendering**: Ensure you have the proper router context:

```jsx
import { MemoryRouter } from "react-router-dom";

<MemoryRouter>
  <UniversalLoginForm appType="admin" />
</MemoryRouter>;
```

**Authentication not working**: Verify your AuthContext is properly set up:

```jsx
import { AuthProvider } from "@shared/auth/context/AuthContext";

<AuthProvider>
  <UniversalLoginForm appType="admin" />
</AuthProvider>;
```

**Styling issues**: Make sure Tailwind CSS is configured in your app.

**TypeScript errors**: Import the proper types:

```typescript
import type { LoginFormProps } from "@shared/auth/types/auth.types";
```

## Contributing

When modifying the Universal Login Form:

1. Update the component in `UniversalLoginForm.jsx`
2. Add/update tests in `UniversalLoginForm.test.jsx`
3. Update TypeScript interfaces in `auth.types.ts`
4. Update this README with any new features
5. Test across all app types to ensure compatibility

## Performance

The component is optimized for performance:

- ⚡ Minimal re-renders with proper state management
- 📦 Small bundle size with tree-shakeable code
- 🎯 Efficient form validation
- 💾 Optimized for mobile devices

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

For more information, see the [Authentication Architecture Documentation](../../docs/architecture/AUTH_SYSTEM_ARCHITECTURE.md).
