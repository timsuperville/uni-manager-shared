/**
 * React Router Test Utilities
 * Provides standardized router wrappers with React Router v7 future flags
 */
import React from 'react';
import PropTypes from 'prop-types';
import { MemoryRouter } from 'react-router-dom';

// Default future flags for React Router v7 compatibility
export const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

/**
 * Creates a MemoryRouter with React Router v7 future flags
 * @param {Object} props - MemoryRouter props
 * @param {React.ReactNode} props.children - Child components
 * @param {Array} props.initialEntries - Initial history entries
 * @param {Object} props.future - Future flags (merged with defaults)
 * @returns {React.Component} MemoryRouter with future flags
 */
export const createMemoryRouter = ({ children, initialEntries, future = {}, ...props }) => {
  return (
    <MemoryRouter
      initialEntries={initialEntries}
      future={{ ...routerFutureFlags, ...future }}
      {...props}
    >
      {children}
    </MemoryRouter>
  );
};

/**
 * Wrapper component for testing components that use React Router
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Array} props.initialEntries - Initial history entries
 * @returns {React.Component} RouterTestWrapper
 */
export const RouterTestWrapper = ({ children, initialEntries = ['/'] }) => {
  return createMemoryRouter({ children, initialEntries });
};

/**
 * Enhanced MemoryRouter component with v7 future flags
 * Can be used as a drop-in replacement for MemoryRouter in tests
 */
export const MemoryRouterV7 = ({ children, future = {}, ...props }) => (
  <MemoryRouter future={{ ...routerFutureFlags, ...future }} {...props}>
    {children}
  </MemoryRouter>
);

// PropTypes for components
RouterTestWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  initialEntries: PropTypes.arrayOf(PropTypes.string),
};

MemoryRouterV7.propTypes = {
  children: PropTypes.node.isRequired,
  future: PropTypes.object,
};
