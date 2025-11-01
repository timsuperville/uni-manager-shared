import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RBACComponents from '../components/RBACComponents';

const {
  RBACProvider,
  PermissionGuard,
  RoleGuard,
  AdminGuard,
  RouteGuard,
  ConditionalRender,
  PermissionButton,
  PermissionMenuItem,
  withPermissions,
  withRoles,
} = RBACComponents;

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  default: mockUseAuth,
  useAuth: mockUseAuth,
}));

// Mock useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper wrapper component using React.createElement
const RouterWrapper = ({ children }) =>
  React.createElement(BrowserRouter, null, children);

const RBACWrapper = ({ children }) =>
  React.createElement(
    RouterWrapper,
    null,
    React.createElement(RBACProvider, null, children)
  );

describe('RBAC Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, roles: ['church_user'] },
      permissions: ['church_view'],
      hasPermission: vi.fn().mockReturnValue(true),
      hasRole: vi.fn().mockReturnValue(false),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PermissionGuard', () => {
    it('should render children when user has required permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['church_view'],
        hasPermission: vi.fn().mockReturnValue(true),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            PermissionGuard,
            { permission: 'church_view' },
            React.createElement('div', null, 'Protected Content')
          )
        )
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render children when user lacks required permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['church_view'],
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            PermissionGuard,
            { permission: 'church_admin' },
            React.createElement('div', null, 'Protected Content')
          )
        )
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render fallback when provided and permission denied', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['church_view'],
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            PermissionGuard,
            {
              permission: 'church_admin',
              fallback: React.createElement('div', null, 'Access Denied'),
            },
            React.createElement('div', null, 'Protected Content')
          )
        )
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should handle multiple permissions with any matching', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['church_view'],
        hasPermission: vi.fn().mockReturnValue(false),
        hasAnyPermission: vi.fn().mockReturnValue(true),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            PermissionGuard,
            { permission: ['church_admin', 'church_view'] },
            React.createElement('div', null, 'Protected Content')
          )
        )
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        permissions: [],
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            PermissionGuard,
            { permission: 'church_view' },
            React.createElement('div', null, 'Protected Content')
          )
        )
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('RoleGuard', () => {
    it('should render children when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_admin'] },
        hasRole: vi.fn().mockReturnValue(true),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            RoleGuard,
            { role: 'church_admin' },
            React.createElement('div', null, 'Admin Content')
          )
        )
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should not render children when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasRole: vi.fn().mockReturnValue(false),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            RoleGuard,
            { role: 'church_admin' },
            React.createElement('div', null, 'Admin Content')
          )
        )
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should handle multiple roles with any matching', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_manager'] },
        hasRole: vi.fn().mockReturnValue(false),
        hasAnyRole: vi.fn().mockReturnValue(true),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            RoleGuard,
            { role: ['church_admin', 'church_manager'] },
            React.createElement('div', null, 'Manager Content')
          )
        )
      );

      expect(screen.getByText('Manager Content')).toBeInTheDocument();
    });
  });

  describe('AdminGuard', () => {
    it('should render children for super admin', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['super_admin'] },
        isAnyAdmin: vi.fn().mockReturnValue(true),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            AdminGuard,
            null,
            React.createElement('div', null, 'Super Admin Content')
          )
        )
      );

      expect(screen.getByText('Super Admin Content')).toBeInTheDocument();
    });

    it('should render children for application admin', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_admin'] },
        isApplicationAdmin: vi.fn().mockReturnValue(true),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            AdminGuard,
            { application: 'church' },
            React.createElement('div', null, 'Church Admin Content')
          )
        )
      );

      expect(screen.getByText('Church Admin Content')).toBeInTheDocument();
    });

    it('should not render for non-admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        isAnyAdmin: vi.fn().mockReturnValue(false),
        isApplicationAdmin: vi.fn().mockReturnValue(false),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(
            AdminGuard,
            null,
            React.createElement('div', null, 'Admin Content')
          )
        )
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('ConditionalRender', () => {
    it('should render children when condition is true', () => {
      render(
        React.createElement(
          ConditionalRender,
          { condition: true },
          React.createElement('div', null, 'Visible Content')
        )
      );

      expect(screen.getByText('Visible Content')).toBeInTheDocument();
    });

    it('should not render children when condition is false', () => {
      render(
        React.createElement(
          ConditionalRender,
          { condition: false },
          React.createElement('div', null, 'Hidden Content')
        )
      );

      expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    });

    it('should render fallback when condition is false and fallback provided', () => {
      render(
        React.createElement(
          ConditionalRender,
          {
            condition: false,
            fallback: React.createElement('div', null, 'Fallback Content'),
          },
          React.createElement('div', null, 'Main Content')
        )
      );

      expect(screen.getByText('Fallback Content')).toBeInTheDocument();
      expect(screen.queryByText('Main Content')).not.toBeInTheDocument();
    });
  });

  describe('PermissionButton', () => {
    it('should render button when user has permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['member_create'],
        hasPermission: vi.fn().mockReturnValue(true),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(PermissionButton, {
            permission: 'member_create',
            children: 'Create Member',
          })
        )
      );

      expect(screen.getByText('Create Member')).toBeInTheDocument();
    });

    it('should disable button when user lacks permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: [],
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(PermissionButton, {
            permission: 'member_create',
            children: 'Create Member',
          })
        )
      );

      const button = screen.getByText('Create Member');
      expect(button).toBeDisabled();
    });
  });

  describe('PermissionMenuItem', () => {
    it('should render menu item when user has permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['member_view'],
        hasPermission: vi.fn().mockReturnValue(true),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(PermissionMenuItem, {
            permission: 'member_view',
            children: 'View Members',
          })
        )
      );

      expect(screen.getByText('View Members')).toBeInTheDocument();
    });

    it('should not render menu item when user lacks permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: [],
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(PermissionMenuItem, {
            permission: 'member_view',
            children: 'View Members',
          })
        )
      );

      expect(screen.queryByText('View Members')).not.toBeInTheDocument();
    });
  });

  describe('Higher-Order Components', () => {
    it('withPermissions should render component when user has permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['member_view'],
        hasPermission: vi.fn().mockReturnValue(true),
      });

      const TestComponent = () =>
        React.createElement('div', null, 'Protected Component');
      const ProtectedComponent = withPermissions(TestComponent, 'member_view');

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(ProtectedComponent)
        )
      );

      expect(screen.getByText('Protected Component')).toBeInTheDocument();
    });

    it('withRoles should render component when user has role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_admin'] },
        hasRole: vi.fn().mockReturnValue(true),
      });

      const TestComponent = () =>
        React.createElement('div', null, 'Admin Component');
      const AdminComponent = withRoles(TestComponent, 'church_admin');

      render(
        React.createElement(
          RBACWrapper,
          null,
          React.createElement(AdminComponent)
        )
      );

      expect(screen.getByText('Admin Component')).toBeInTheDocument();
    });
  });
});
