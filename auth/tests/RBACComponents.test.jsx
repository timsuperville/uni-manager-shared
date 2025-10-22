/**
 * RBAC Components Tests
 * Comprehensive test suite for role-based access control React components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  PermissionGuard,
  RoleGuard,
  RouteGuard,
  AdminGuard,
  ConditionalRender,
  PermissionButton,
  PermissionMenuItem,
  withPermissions,
  withRoles,
} from '../rbac/RBACComponents';

// Mock the enhanced auth context
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useEnhancedAuth: () => mockUseAuth(),
}));

// Mock the navigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper for router context
const RouterWrapper = ({ children }) => {
  return createElement(BrowserRouter, null, children);
};

describe('Permission-Based Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PermissionGuard', () => {
    it('should render children when user has required permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['church_view', 'member_view'],
        hasPermission: vi.fn().mockReturnValue(true),
      });

      render(
        <PermissionGuard permission='church_view'>
          <div>Protected Content</div>
        </PermissionGuard>
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
        <PermissionGuard permission='church_admin'>
          <div>Protected Content</div>
        </PermissionGuard>
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
        <PermissionGuard
          permission='church_admin'
          fallback={<div>Access Denied</div>}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should handle multiple permissions with any matching', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['church_view'],
        hasPermission: vi.fn().mockReturnValue(false), // Mock hasPermission for single permission checks
        hasAnyPermission: vi.fn().mockReturnValue(true), // Mock hasAnyPermission for array checks
      });

      render(
        <PermissionGuard permission={['church_admin', 'church_view']}>
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should handle multiple permissions requiring all', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        permissions: ['church_view'],
        hasAllPermissions: vi.fn().mockReturnValue(false),
      });

      render(
        <PermissionGuard
          permission={['church_view', 'member_edit']}
          requireAll={true}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        permissions: [],
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        <PermissionGuard permission='church_view'>
          <div>Protected Content</div>
        </PermissionGuard>
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
        <RoleGuard role='church_admin'>
          <div>Admin Content</div>
        </RoleGuard>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should not render children when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasRole: vi.fn().mockReturnValue(false),
      });

      render(
        <RoleGuard role='church_admin'>
          <div>Admin Content</div>
        </RoleGuard>
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should handle multiple roles with any matching', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_manager'] },
        hasRole: vi.fn().mockReturnValue(false), // Mock hasRole for single role checks
        hasAnyRole: vi.fn().mockReturnValue(true), // Mock hasAnyRole for array checks
      });

      render(
        <RoleGuard role={['church_admin', 'church_manager']}>
          <div>Manager Content</div>
        </RoleGuard>
      );

      expect(screen.getByText('Manager Content')).toBeInTheDocument();
    });

    it('should handle minimum role level checking', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_manager'] },
        hasRole: vi.fn().mockReturnValue(true), // Mock hasRole for basic functionality
        hasMinimumRoleLevel: vi.fn().mockReturnValue(true),
      });

      render(
        <RoleGuard minimumLevel={60}>
          <div>Manager Level Content</div>
        </RoleGuard>
      );

      expect(screen.getByText('Manager Level Content')).toBeInTheDocument();
    });
  });

  describe('AdminGuard', () => {
    it('should render children for super admin', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['super_admin'] },
        isAnyAdmin: vi.fn().mockReturnValue(true),
      });

      render(
        <AdminGuard>
          <div>Super Admin Content</div>
        </AdminGuard>
      );

      expect(screen.getByText('Super Admin Content')).toBeInTheDocument();
    });

    it('should render children for application admin', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_admin'] },
        isApplicationAdmin: vi.fn().mockReturnValue(true),
      });

      render(
        <AdminGuard application='church'>
          <div>Church Admin Content</div>
        </AdminGuard>
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
        <AdminGuard>
          <div>Admin Content</div>
        </AdminGuard>
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });
});

describe('Route Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RouteGuard', () => {
    it('should render children when user can access route', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(true), // Add hasPermission mock
        hasRole: vi.fn().mockReturnValue(true), // Add hasRole mock
        canAccessRoute: vi.fn().mockReturnValue(true),
      });

      render(
        <RouterWrapper>
          <RouteGuard application='church' route='/members'>
            <div>Protected Route Content</div>
          </RouteGuard>
        </RouterWrapper>
      );

      expect(screen.getByText('Protected Route Content')).toBeInTheDocument();
    });

    it('should redirect when user cannot access route', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        canAccessRoute: vi.fn().mockReturnValue(false),
      });

      render(
        <RouterWrapper>
          <RouteGuard application='church' route='/admin'>
            <div>Protected Route Content</div>
          </RouteGuard>
        </RouterWrapper>
      );

      expect(
        screen.queryByText('Protected Route Content')
      ).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized');
    });

    it('should use custom redirect path when provided', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        canAccessRoute: vi.fn().mockReturnValue(false),
      });

      render(
        <RouterWrapper>
          <RouteGuard
            application='church'
            route='/admin'
            redirectTo='/church/dashboard'
          >
            <div>Protected Route Content</div>
          </RouteGuard>
        </RouterWrapper>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/church/dashboard');
    });

    it('should redirect unauthenticated users to login', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        canAccessRoute: vi.fn().mockReturnValue(false),
      });

      render(
        <RouterWrapper>
          <RouteGuard application='church' route='/members'>
            <div>Protected Route Content</div>
          </RouteGuard>
        </RouterWrapper>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});

describe('Conditional Rendering Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ConditionalRender', () => {
    it('should render when condition is true', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(true),
      });

      render(
        <ConditionalRender
          condition={(authUtils) => authUtils.hasPermission('church_view')}
        >
          <div>Conditional Content</div>
        </ConditionalRender>
      );

      expect(screen.getByText('Conditional Content')).toBeInTheDocument();
    });

    it('should not render when condition is false', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        <ConditionalRender
          condition={(authUtils) => authUtils.hasPermission('church_admin')}
        >
          <div>Conditional Content</div>
        </ConditionalRender>
      );

      expect(screen.queryByText('Conditional Content')).not.toBeInTheDocument();
    });

    it('should render else content when condition is false', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        <ConditionalRender
          condition={(authUtils) => authUtils.hasPermission('church_admin')}
          else={<div>Alternative Content</div>}
        >
          <div>Conditional Content</div>
        </ConditionalRender>
      );

      expect(screen.queryByText('Conditional Content')).not.toBeInTheDocument();
      expect(screen.getByText('Alternative Content')).toBeInTheDocument();
    });
  });

  describe('PermissionButton', () => {
    it('should render enabled button when user has permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_manager'] },
        hasPermission: vi.fn().mockReturnValue(true),
      });

      render(
        <PermissionButton permission='service_create' onClick={() => {}}>
          Create Service
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: /create service/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should render disabled button when user lacks permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        <PermissionButton permission='service_create' onClick={() => {}}>
          Create Service
        </PermissionButton>
      );

      const button = screen.getByRole('button', { name: /create service/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should not render when hideIfNoAccess is true', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        <PermissionButton
          permission='service_create'
          onClick={() => {}}
          hideIfNoAccess={true}
        >
          Create Service
        </PermissionButton>
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('PermissionMenuItem', () => {
    it('should render menu item when user has permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(true),
      });

      render(
        <PermissionMenuItem permission='member_view' href='/members'>
          Members
        </PermissionMenuItem>
      );

      expect(screen.getByText('Members')).toBeInTheDocument();
    });

    it('should not render menu item when user lacks permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        <PermissionMenuItem permission='church_admin' href='/admin'>
          Administration
        </PermissionMenuItem>
      );

      expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    });

    it('should handle role-based menu items', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_manager'] },
        hasRole: vi.fn().mockReturnValue(true),
      });

      render(
        <PermissionMenuItem role='church_manager' href='/manage'>
          Management
        </PermissionMenuItem>
      );

      expect(screen.getByText('Management')).toBeInTheDocument();
    });
  });
});

describe('Higher-Order Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withPermissions HOC', () => {
    const TestComponent = ({ message }) => <div>{message}</div>;

    it('should render wrapped component when user has permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(true),
      });

      const WrappedComponent = withPermissions(['church_view'])(TestComponent);

      render(<WrappedComponent message='Test Message' />);

      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('should not render wrapped component when user lacks permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(false),
      });

      const WrappedComponent = withPermissions(['church_admin'])(TestComponent);

      render(<WrappedComponent message='Test Message' />);

      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
    });

    it('should render fallback component when provided', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasPermission: vi.fn().mockReturnValue(false),
      });

      const FallbackComponent = () => <div>No Access</div>;
      const WrappedComponent = withPermissions(['church_admin'], {
        fallback: FallbackComponent,
      })(TestComponent);

      render(<WrappedComponent message='Test Message' />);

      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
      expect(screen.getByText('No Access')).toBeInTheDocument();
    });

    it('should handle requireAll option correctly', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasAllPermissions: vi.fn().mockReturnValue(false),
      });

      const WrappedComponent = withPermissions(['church_view', 'member_edit'], {
        requireAll: true,
      })(TestComponent);

      render(<WrappedComponent message='Test Message' />);

      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
    });
  });

  describe('withRoles HOC', () => {
    const TestComponent = ({ message }) => <div>{message}</div>;

    it('should render wrapped component when user has role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_admin'] },
        hasRole: vi.fn().mockReturnValue(true),
      });

      const WrappedComponent = withRoles(['church_admin'])(TestComponent);

      render(<WrappedComponent message='Admin Message' />);

      expect(screen.getByText('Admin Message')).toBeInTheDocument();
    });

    it('should not render wrapped component when user lacks role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_user'] },
        hasRole: vi.fn().mockReturnValue(false),
      });

      const WrappedComponent = withRoles(['church_admin'])(TestComponent);

      render(<WrappedComponent message='Admin Message' />);

      expect(screen.queryByText('Admin Message')).not.toBeInTheDocument();
    });

    it('should handle minimum level checking', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roles: ['church_manager'] },
        hasRole: vi.fn().mockReturnValue(true), // Add hasRole mock for basic functionality
        hasMinimumRoleLevel: vi.fn().mockReturnValue(true),
      });

      const WrappedComponent = withRoles([], { minimumLevel: 60 })(
        TestComponent
      );

      render(<WrappedComponent message='Manager Message' />);

      expect(screen.getByText('Manager Message')).toBeInTheDocument();
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle null auth context gracefully', () => {
    mockUseAuth.mockReturnValue(null);

    render(
      <PermissionGuard permission='church_view'>
        <div>Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should handle undefined user gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: undefined,
      hasPermission: vi.fn().mockReturnValue(false),
    });

    render(
      <RoleGuard role='church_user'>
        <div>Role Content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Role Content')).not.toBeInTheDocument();
  });

  it('should handle missing permission functions', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, roles: ['church_user'] },
      // Missing hasPermission function
    });

    expect(() => {
      render(
        <PermissionGuard permission='church_view'>
          <div>Protected Content</div>
        </PermissionGuard>
      );
    }).not.toThrow();
  });

  it('should handle empty arrays in permission checks', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, roles: ['church_user'] },
      hasAnyPermission: vi.fn().mockReturnValue(false),
    });

    render(
      <PermissionGuard permission={[]}>
        <div>Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
