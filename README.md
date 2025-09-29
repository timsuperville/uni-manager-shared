# Uni-Manager Shared Library

This package contains shared utilities, components, and types used across all Uni-Manager applications.

## Structure

```text
shared/
├── components/          # Reusable React components
│   ├── Button.jsx      # Standardized button component
│   ├── Modal.jsx       # Modal/dialog component
│   ├── LoadingSpinner.jsx # Loading indicator
│   └── index.js        # Component exports
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── README.md           # This file
```

## Components

### Button

A standardized button component with multiple variants and sizes.

**Usage:**

```jsx
import { Button } from "../../../shared/components";

<Button variant="primary" size="medium">
  Click me
</Button>;
```

**Variants:** `default`, `primary`, `secondary`, `outline`, `danger`, `success`, `warning`
**Sizes:** `small`, `medium`, `large`

### Modal

A reusable modal/dialog component with accessibility features.

**Usage:**

```jsx
import { Modal } from "../../../shared/components";

<Modal isOpen={isOpen} onClose={handleClose} title="Modal Title" size="medium">
  <p>Modal content goes here</p>
</Modal>;
```

### LoadingSpinner

A customizable loading spinner component.

**Usage:**

```jsx
import { LoadingSpinner } from "../../../shared/components";

<LoadingSpinner size="medium" color="blue" text="Loading..." />;
```

## Guidelines

1. **Consistency**: All apps should use these shared components for a consistent UI/UX
2. **Accessibility**: Components include proper ARIA labels and keyboard navigation
3. **Dark Mode**: All components support dark mode with Tailwind CSS classes
4. **Responsive**: Components are built with responsive design in mind
5. **Performance**: Components are optimized for minimal re-renders

## Adding New Components

When adding new shared components:

1. Create the component in `components/`
2. Export it in `components/index.js`
3. Add documentation to this README
4. Ensure it supports dark mode and accessibility
5. Test across multiple applications

## Usage

```javascript
// Import from the main package
import { someUtility } from "uni-manager-shared";

// Or import from specific modules
import { SomeComponent } from "uni-manager-shared/components";
import { someHelper } from "uni-manager-shared/utils";
import { SomeType } from "uni-manager-shared/types";
```

## Development

This is a private package used internally within the Uni-Manager monorepo. It's automatically linked to all applications through npm workspaces.

## Future Enhancements

- Add common UI components (buttons, inputs, modals)
- Add utility functions for data formatting, validation
- Add shared TypeScript types for API responses
- Add shared hooks for common functionality
