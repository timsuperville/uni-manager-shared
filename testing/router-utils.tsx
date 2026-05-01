/**
 * React Router Test Utilities
 * Provides standardized router wrappers with React Router v6/v7 compatibility
 */
import React from "react";
import { MemoryRouter } from "react-router-dom";
import type { MemoryRouterProps } from "react-router-dom";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateMemoryRouterProps extends MemoryRouterProps {
  children: React.ReactNode;
  future?: Record<string, unknown>;
}

interface RouterTestWrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

interface MemoryRouterV7Props extends MemoryRouterProps {
  children: React.ReactNode;
  future?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Default future flags for React Router v7 compatibility
// ---------------------------------------------------------------------------

export const routerFutureFlags: Record<string, boolean> = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/**
 * Creates a MemoryRouter with React Router v7 future flags.
 */
export const createMemoryRouter = ({
  children,
  future = {},
  ...props
}: CreateMemoryRouterProps): React.ReactElement => {
  const RouterV7 = MemoryRouter as React.FC<
    MemoryRouterProps & {
      future?: Record<string, unknown>;
      children?: React.ReactNode;
    }
  >;
  return (
    <RouterV7 future={{ ...routerFutureFlags, ...future }} {...props}>
      {children}
    </RouterV7>
  );
};

/**
 * Wrapper component for testing components that use React Router.
 */
export const RouterTestWrapper: React.FC<RouterTestWrapperProps> = ({
  children,
  initialEntries = ["/"],
}) => createMemoryRouter({ children, initialEntries });

/**
 * Enhanced MemoryRouter component with v7 future flags.
 * Drop-in replacement for MemoryRouter in tests.
 */
export const MemoryRouterV7: React.FC<MemoryRouterV7Props> = ({
  children,
  future = {},
  ...props
}) => {
  const RouterV7 = MemoryRouter as React.FC<
    MemoryRouterProps & {
      future?: Record<string, unknown>;
      children?: React.ReactNode;
    }
  >;
  return (
    <RouterV7 future={{ ...routerFutureFlags, ...future }} {...props}>
      {children}
    </RouterV7>
  );
};
