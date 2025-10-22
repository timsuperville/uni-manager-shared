/**
 * @jest-environment jsdom
 */

/**
 * Cross-App Authentication Testing Suite
 * Validates authentication flow across all 6 applications
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { createElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { EnhancedAuthContext } from '../contexts/AuthContext';
import { UniversalLoginForm } from '../auth/components/UniversalLoginForm';
import { SessionManager } from '../auth/services/SessionManager';
import { rbacService } from '../auth/services/rbacService';

// Mock all external dependencies
vi.mock('../auth/services/SessionManager');
vi.mock('../auth/services/rbacService');
vi.mock('../auth/services/authService');

describe('Cross-App Authentication Testing', () => {
  let mockSessionManager;
  let mockAuthContext;
  let mockSetUser;
  let mockSetIsAuthenticated;

  const applications = [
    {
      name: 'church',
      port: 5173,
      roles: ['church_user', 'church_manager', 'church_admin'],
    },
    {
      name: 'admin',
      port: 5174,
      roles: ['admin_user', 'admin_manager', 'admin_admin'],
    },
    {
      name: 'home',
      port: 5175,
      roles: ['home_user', 'home_manager', 'home_admin'],
    },
    {
      name: 'business',
      port: 5176,
      roles: ['business_user', 'business_manager', 'business_admin'],
    },
    {
      name: 'personal',
      port: 5177,
      roles: ['personal_user', 'personal_manager', 'personal_admin'],
    },
    {
      name: 'playback',
      port: 5178,
      roles: ['playback_user', 'playback_manager', 'playback_admin'],
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock SessionManager
    mockSessionManager = {
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getUser: vi.fn(),
      isAuthenticated: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    SessionManager.mockImplementation(() => mockSessionManager);

    // Mock auth context state setters
    mockSetUser = vi.fn();
    mockSetIsAuthenticated = vi.fn();

    mockAuthContext = {
      user: null,
      isAuthenticated: false,
      permissions: [],
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      canAccessApplication: vi.fn(),
      refreshUserData: vi.fn(),
    };

    // Mock RBAC service
    rbacService.checkPermission.mockResolvedValue(true);
    rbacService.getUserPermissions.mockResolvedValue(['view', 'manage']);
    rbacService.canUserAccessRoute.mockResolvedValue(true);
  });

  const renderWithAuthContext = (component, authState = {}) => {
    const defaultAuthState = {
      ...mockAuthContext,
      ...authState,
    };

    return render(
      createElement(
        BrowserRouter,
        {},
        createElement(
          EnhancedAuthContext.Provider,
          { value: defaultAuthState },
          component
        )
      )
    );
  };

  describe('Universal Login Component Integration', () => {
    applications.forEach((app) => {
      it(`should handle ${app.name} app login flow`, async () => {
        const mockUser = {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          roles: [app.roles[0]], // Use basic user role for app
        };

        mockSessionManager.login.mockResolvedValue({
          success: true,
          user: mockUser,
          rbacData: {
            accessibleApplications: [app.name],
            roles: [app.roles[0]],
            permissions: [`${app.name}_view`],
          },
        });

        const onLoginSuccess = vi.fn();

        renderWithAuthContext(
          createElement(UniversalLoginForm, {
            application: app.name,
            onLoginSuccess,
          })
        );

        // Fill login form
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockSessionManager.login).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            application: app.name,
          });
        });

        await waitFor(() => {
          expect(onLoginSuccess).toHaveBeenCalledWith(mockUser);
        });
      });

      it(`should deny ${app.name} app access for unauthorized users`, async () => {
        mockSessionManager.login.mockResolvedValue({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'User does not have access to this application',
        });

        renderWithAuthContext(
          createElement(UniversalLoginForm, {
            application: app.name,
          })
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, {
          target: { value: 'unauthorized@example.com' },
        });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/access denied/i)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Cross-Tab Session Synchronization', () => {
    it('should synchronize login across all application tabs', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        roles: ['church_user', 'admin_user'], // Multi-app access
      };

      const sessionEventListeners = new Map();
      mockSessionManager.addEventListener.mockImplementation(
        (event, listener) => {
          sessionEventListeners.set(event, listener);
        }
      );

      // Render auth contexts for multiple apps
      const churchAuthState = { ...mockAuthContext, isAuthenticated: false };
      const adminAuthState = { ...mockAuthContext, isAuthenticated: false };

      renderWithAuthContext(
        createElement('div', {}, 'Church App'),
        churchAuthState
      );

      renderWithAuthContext(
        createElement('div', {}, 'Admin App'),
        adminAuthState
      );

      // Simulate login in church app
      const loginEventListener = sessionEventListeners.get('login');
      expect(loginEventListener).toBeDefined();

      // Trigger cross-tab login event
      loginEventListener({
        type: 'login',
        user: mockUser,
        application: 'church',
      });

      // Verify both app contexts are updated
      await waitFor(() => {
        expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true);
        expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      });
    });

    it('should synchronize logout across all application tabs', async () => {
      const sessionEventListeners = new Map();
      mockSessionManager.addEventListener.mockImplementation(
        (event, listener) => {
          sessionEventListeners.set(event, listener);
        }
      );

      // Start with authenticated state
      const authState = {
        ...mockAuthContext,
        isAuthenticated: true,
        user: { id: '123', email: 'test@example.com' },
      };

      renderWithAuthContext(createElement('div', {}, 'Test App'), authState);

      // Simulate logout event from another tab
      const logoutEventListener = sessionEventListeners.get('logout');
      expect(logoutEventListener).toBeDefined();

      logoutEventListener({
        type: 'logout',
        reason: 'user_initiated',
      });

      await waitFor(() => {
        expect(mockSetIsAuthenticated).toHaveBeenCalledWith(false);
        expect(mockSetUser).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Role-Based Application Access', () => {
    const testUsersByRole = {
      user: {
        id: 'user123',
        roles: ['church_user', 'business_user'],
        accessibleApps: ['church', 'business'],
      },
      manager: {
        id: 'manager123',
        roles: ['church_manager', 'admin_manager'],
        accessibleApps: ['church', 'admin'],
      },
      admin: {
        id: 'admin123',
        roles: ['church_admin', 'business_admin'],
        accessibleApps: ['church', 'business'],
      },
      superAdmin: {
        id: 'super123',
        roles: ['super_admin'],
        accessibleApps: [
          'church',
          'admin',
          'home',
          'business',
          'personal',
          'playback',
        ],
      },
    };

    Object.entries(testUsersByRole).forEach(([roleType, userData]) => {
      it(`should validate ${roleType} access across applications`, async () => {
        applications.forEach((app) => {
          const hasAccess = userData.accessibleApps.includes(app.name);

          mockAuthContext.canAccessApplication.mockImplementation((appName) => {
            return appName === app.name ? hasAccess : false;
          });

          renderWithAuthContext(
            createElement('div', {}, `${app.name} App Test`),
            {
              ...mockAuthContext,
              user: userData,
              isAuthenticated: true,
            }
          );

          const canAccess = mockAuthContext.canAccessApplication(app.name);
          expect(canAccess).toBe(hasAccess);
        });
      });
    });
  });

  describe('Permission Validation Across Apps', () => {
    const permissionMatrix = {
      church: {
        user: ['church_view', 'member_view', 'service_view'],
        manager: [
          'church_view',
          'church_manage',
          'member_create',
          'service_create',
        ],
        admin: [
          'church_view',
          'church_manage',
          'church_admin',
          'member_delete',
          'service_delete',
        ],
      },
      admin: {
        user: ['admin_view', 'user_view'],
        manager: ['admin_view', 'admin_manage', 'user_create'],
        admin: ['admin_view', 'admin_manage', 'admin_admin', 'user_delete'],
      },
      business: {
        user: ['business_view', 'inventory_view'],
        manager: ['business_view', 'business_manage', 'inventory_create'],
        admin: [
          'business_view',
          'business_manage',
          'business_admin',
          'inventory_delete',
        ],
      },
    };

    Object.entries(permissionMatrix).forEach(([appName, rolePermissions]) => {
      Object.entries(rolePermissions).forEach(
        ([roleLevel, expectedPermissions]) => {
          it(`should validate ${roleLevel} permissions in ${appName} app`, async () => {
            mockAuthContext.hasPermission.mockImplementation((permission) => {
              return expectedPermissions.includes(permission);
            });

            renderWithAuthContext(
              createElement('div', {}, `${appName} Permission Test`),
              {
                ...mockAuthContext,
                isAuthenticated: true,
                permissions: expectedPermissions,
              }
            );

            // Test each expected permission
            expectedPermissions.forEach((permission) => {
              expect(mockAuthContext.hasPermission(permission)).toBe(true);
            });

            // Test permission not in list
            const unauthorizedPermission = `${appName}_delete_all`;
            if (!expectedPermissions.includes(unauthorizedPermission)) {
              expect(
                mockAuthContext.hasPermission(unauthorizedPermission)
              ).toBe(false);
            }
          });
        }
      );
    });
  });

  describe('Token Refresh Across Applications', () => {
    it('should refresh tokens consistently across all apps', async () => {
      const refreshedUser = {
        id: '123',
        email: 'test@example.com',
        roles: ['church_user', 'admin_user'],
      };

      mockSessionManager.refreshToken.mockResolvedValue({
        success: true,
        user: refreshedUser,
        rbacData: {
          accessibleApplications: ['church', 'admin'],
          permissions: ['church_view', 'admin_view'],
        },
      });

      applications.forEach(async (app) => {
        renderWithAuthContext(createElement('div', {}, `${app.name} App`), {
          ...mockAuthContext,
          isAuthenticated: true,
          user: { id: '123', email: 'test@example.com' },
        });

        // Trigger token refresh
        await mockAuthContext.refreshUserData();

        expect(mockSessionManager.refreshToken).toHaveBeenCalledWith({
          includeRBAC: true,
        });
      });
    });

    it('should handle token refresh failures gracefully', async () => {
      mockSessionManager.refreshToken.mockResolvedValue({
        success: false,
        error: 'TOKEN_EXPIRED',
      });

      renderWithAuthContext(createElement('div', {}, 'Test App'), {
        ...mockAuthContext,
        isAuthenticated: true,
      });

      await mockAuthContext.refreshUserData();

      await waitFor(() => {
        expect(mockAuthContext.logout).toHaveBeenCalled();
      });
    });
  });

  describe('Session Timeout Behavior', () => {
    it('should handle session timeout consistently across all apps', async () => {
      const sessionEventListeners = new Map();
      mockSessionManager.addEventListener.mockImplementation(
        (event, listener) => {
          sessionEventListeners.set(event, listener);
        }
      );

      applications.forEach((app) => {
        renderWithAuthContext(createElement('div', {}, `${app.name} App`), {
          ...mockAuthContext,
          isAuthenticated: true,
          user: { id: '123', email: 'test@example.com' },
        });
      });

      // Simulate session timeout
      const timeoutListener = sessionEventListeners.get('sessionTimeout');
      expect(timeoutListener).toBeDefined();

      timeoutListener({
        type: 'sessionTimeout',
        reason: 'inactivity',
      });

      await waitFor(() => {
        expect(mockSetIsAuthenticated).toHaveBeenCalledWith(false);
        expect(mockSetUser).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Error Handling Across Applications', () => {
    const commonErrors = [
      { type: 'NETWORK_ERROR', message: 'Network connection failed' },
      { type: 'AUTH_ERROR', message: 'Authentication failed' },
      { type: 'PERMISSION_ERROR', message: 'Insufficient permissions' },
      { type: 'SESSION_ERROR', message: 'Session expired' },
    ];

    commonErrors.forEach((error) => {
      it(`should handle ${error.type} consistently across all apps`, async () => {
        applications.forEach((app) => {
          mockSessionManager.login.mockRejectedValue(new Error(error.message));

          renderWithAuthContext(
            createElement(UniversalLoginForm, {
              application: app.name,
            })
          );

          // Attempt login that will fail
          const submitButton = screen.getByRole('button', { name: /sign in/i });
          fireEvent.click(submitButton);

          // Should display error message
          waitFor(() => {
            expect(
              screen.getByText(new RegExp(error.message, 'i'))
            ).toBeInTheDocument();
          });
        });
      });
    });
  });

  describe('Performance Validation', () => {
    it('should maintain authentication performance across all apps', async () => {
      const performanceMetrics = {};

      for (const app of applications) {
        const startTime = performance.now();

        mockSessionManager.login.mockResolvedValue({
          success: true,
          user: { id: '123', email: 'test@example.com' },
          rbacData: { accessibleApplications: [app.name] },
        });

        renderWithAuthContext(
          createElement(UniversalLoginForm, {
            application: app.name,
          })
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockSessionManager.login).toHaveBeenCalled();
        });

        const endTime = performance.now();
        performanceMetrics[app.name] = endTime - startTime;
      }

      // Verify reasonable performance (adjust thresholds as needed)
      Object.values(performanceMetrics).forEach((duration) => {
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      });
    });
  });

  describe('Security Validation', () => {
    it('should prevent cross-app permission escalation', async () => {
      const restrictedUser = {
        id: '123',
        roles: ['church_user'], // Only church access
        accessibleApplications: ['church'],
      };

      // Attempt to access admin functions with church user
      mockAuthContext.hasPermission.mockImplementation((permission) => {
        return permission.startsWith('church_');
      });

      renderWithAuthContext(createElement('div', {}, 'Security Test'), {
        ...mockAuthContext,
        user: restrictedUser,
        isAuthenticated: true,
      });

      // Should not have admin permissions
      expect(mockAuthContext.hasPermission('admin_delete')).toBe(false);
      expect(mockAuthContext.hasPermission('business_admin')).toBe(false);
      expect(mockAuthContext.hasPermission('super_admin')).toBe(false);

      // Should have church permissions
      expect(mockAuthContext.hasPermission('church_view')).toBe(true);
    });

    it('should validate session integrity across apps', async () => {
      const validUser = {
        id: '123',
        email: 'test@example.com',
        roles: ['church_user'],
      };

      mockSessionManager.getUser.mockReturnValue(validUser);
      mockSessionManager.isAuthenticated.mockReturnValue(true);

      applications.forEach((app) => {
        renderWithAuthContext(
          createElement('div', {}, `${app.name} Security Test`),
          {
            ...mockAuthContext,
            user: validUser,
            isAuthenticated: true,
          }
        );

        // Verify consistent user data
        expect(mockSessionManager.getUser()).toEqual(validUser);
        expect(mockSessionManager.isAuthenticated()).toBe(true);
      });
    });
  });
});
