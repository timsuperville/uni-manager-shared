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

interface CreateMemoryRouterProps extends Omit<MemoryRouterProps, "future"> {
  children: React.ReactNode;
  future?: MemoryRouterProps["future"];
}

interface RouterTestWrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

interface MemoryRouterV7Props extends Omit<MemoryRouterProps, "future"> {
  children: React.ReactNode;
  future?: MemoryRouterProps["future"];
}

// ---------------------------------------------------------------------------
// Default future flags for React Router v7 compatibility
// ---------------------------------------------------------------------------

export const routerFutureFlags: MemoryRouterProps["future"] = {
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
}: CreateMemoryRouterProps): React.ReactElement => (
  <MemoryRouter future={{ ...routerFutureFlags, ...future }} {...props}>
    {children}
  </MemoryRouter>
);

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
}) => (
  <MemoryRouter future={{ ...routerFutureFlags, ...future }} {...props}>
    {children}
  </MemoryRouter>
);
