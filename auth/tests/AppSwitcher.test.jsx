/**
 * @jest-environment jsdom
 */

/**
 * App Switcher Component Tests
 *
 * Tests for the SSO app switcher UI component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppSwitcher from '../components/AppSwitcher.jsx';
import { useSSO } from '../context/SSOContext.jsx';

// Mock the SSO context
vi.mock('../context/SSOContext.jsx', () => ({
  useSSO: vi.fn(),
}));

// Mock CSS import
vi.mock('../components/AppSwitcher.css', () => ({}));

const defaultSSOState = {
  currentApp: 'church',
  availableApps: [
    { id: 'admin', name: 'Administration', description: 'Admin tools' },
    { id: 'business', name: 'Business', description: 'Business management' },
    { id: 'home', name: 'Home Services', description: 'Home management' },
  ],
  ssoLoading: false,
  ssoError: null,
  switchToApp: vi.fn(),
  hasAppPermission: vi.fn().mockReturnValue(true),
  getAppInfo: vi.fn().mockImplementation((appId) => ({
    id: appId,
    name: appId.charAt(0).toUpperCase() + appId.slice(1),
    port: 5173,
  })),
};

const renderAppSwitcher = (ssoOverrides = {}) => {
  const ssoState = { ...defaultSSOState, ...ssoOverrides };
  useSSO.mockReturnValue(ssoState);
  return render(React.createElement(AppSwitcher));
};

describe('AppSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state when SSO is loading', () => {
      renderAppSwitcher({ ssoLoading: true, currentApp: null });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('📱')).toBeInTheDocument();
    });

    it('should disable button during SSO loading', () => {
      renderAppSwitcher({ ssoLoading: true });

      // Loading state shows disabled button
      const loadingElement = screen.getByText('Loading...');
      expect(loadingElement).toBeInTheDocument();

      // Check that the button is disabled
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Current App Display', () => {
    it('should display current app correctly', () => {
      renderAppSwitcher();

      expect(screen.getByText('⛪')).toBeInTheDocument();
      expect(screen.getByText('Church Management')).toBeInTheDocument();
    });

    it('should display correct icon for different apps', () => {
      renderAppSwitcher({ currentApp: 'admin' });

      expect(screen.getByText('🔧')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
    });

    it('should handle unknown app gracefully', () => {
      renderAppSwitcher({ currentApp: 'unknown' });

      expect(screen.getByText('📱')).toBeInTheDocument();
      expect(screen.getByText('Unknown App')).toBeInTheDocument();
    });
  });

  describe('Dropdown Interaction', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      renderAppSwitcher();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Switch Application')).toBeInTheDocument();
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should close dropdown when clicked outside', async () => {
      const user = userEvent.setup();
      renderAppSwitcher();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Switch Application')).toBeInTheDocument();

      // Click outside
      await user.click(typeof document !== "undefined" && document.body);

      await waitFor(() => {
        expect(
          screen.queryByText('Switch Application')
        ).not.toBeInTheDocument();
      });
    });

    it('should show available apps in dropdown', async () => {
      const user = userEvent.setup();
      renderAppSwitcher();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Administration')).toBeInTheDocument();
      expect(screen.getByText('Admin tools')).toBeInTheDocument();
      expect(screen.getByText('Business Tools')).toBeInTheDocument();
      expect(screen.getByText('Business management')).toBeInTheDocument();
    });

    it('should filter out current app from dropdown', async () => {
      const user = userEvent.setup();
      renderAppSwitcher();

      const button = screen.getByRole('button');
      await user.click(button);

      // Should not show church app (current app) in the app list
      const appOptions = screen.getAllByRole('option');
      const churchOption = appOptions.find(option =>
        option.querySelector('.app-name')?.textContent === 'Church Management'
      );
      expect(churchOption).toBeUndefined();

      // But should show it in the footer as current app
      expect(screen.getByText('Currently in: Church Management')).toBeInTheDocument();
    });

    it('should show no apps message when no other apps available', async () => {
      const user = userEvent.setup();
      renderAppSwitcher({ availableApps: [] });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('No other apps available')).toBeInTheDocument();
    });
  });

  describe('App Switching', () => {
    it('should call switchToApp when app option is clicked', async () => {
      const user = userEvent.setup();
      const mockSwitchToApp = vi.fn();
      renderAppSwitcher({ switchToApp: mockSwitchToApp });

      const button = screen.getByRole('button');
      await user.click(button);

      const adminOption = screen.getByText('Administration');
      await user.click(adminOption);

      expect(mockSwitchToApp).toHaveBeenCalledWith('admin');
    });

    it('should show switching indicator during app switch', async () => {
      const user = userEvent.setup();
      const mockSwitchToApp = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );
      renderAppSwitcher({ switchToApp: mockSwitchToApp });

      const button = screen.getByRole('button');
      await user.click(button);

      const adminOption = screen.getByText('Administration');
      await user.click(adminOption);

      expect(
        screen.getByText('Switching to Administration...')
      ).toBeInTheDocument();
    });

    it('should disable buttons during switching', async () => {
      const user = userEvent.setup();
      const mockSwitchToApp = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );
      renderAppSwitcher({ switchToApp: mockSwitchToApp });

      const button = screen.getByRole('button');
      await user.click(button);

      const adminOption = screen.getByText('Administration');
      await user.click(adminOption);

      // Main button should be disabled
      expect(button).toBeDisabled();
    });

    it('should not switch to same app', async () => {
      const user = userEvent.setup();
      const mockSwitchToApp = vi.fn();
      renderAppSwitcher({
        switchToApp: mockSwitchToApp,
        availableApps: [
          ...defaultSSOState.availableApps,
          { id: 'church', name: 'Church', description: 'Current app' },
        ],
      });

      const button = screen.getByRole('button');
      await user.click(button);

      // Church should not appear in dropdown (filtered out as current app)
      expect(screen.queryByText('Church')).not.toBeInTheDocument();
      expect(mockSwitchToApp).not.toHaveBeenCalled();
    });
  });

  describe('Permissions', () => {
    it('should filter apps based on permissions', async () => {
      const user = userEvent.setup();
      const mockHasPermission = vi
        .fn()
        .mockImplementation((appId) => appId === 'admin');
      renderAppSwitcher({ hasAppPermission: mockHasPermission });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Administration')).toBeInTheDocument();
      expect(screen.queryByText('Business')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display SSO errors', () => {
      renderAppSwitcher({ ssoError: 'Failed to connect to SSO service' });

      expect(screen.getByText('⚠️')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to connect to SSO service')
      ).toBeInTheDocument();
    });

    it('should handle switching errors gracefully', async () => {
      const user = userEvent.setup();
      const mockSwitchToApp = vi
        .fn()
        .mockRejectedValue(new Error('Switch failed'));
      renderAppSwitcher({ switchToApp: mockSwitchToApp });

      const button = screen.getByRole('button');
      await user.click(button);

      const adminOption = screen.getByText('Administration');
      await user.click(adminOption);

      // Error should be handled by SSO context
      expect(mockSwitchToApp).toHaveBeenCalledWith('admin');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderAppSwitcher();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      renderAppSwitcher();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper listbox role for dropdown', async () => {
      const user = userEvent.setup();
      renderAppSwitcher();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should have option roles for app choices', async () => {
      const user = userEvent.setup();
      renderAppSwitcher();

      const button = screen.getByRole('button');
      await user.click(button);

      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    it('should have alert role for errors', () => {
      renderAppSwitcher({ ssoError: 'Test error' });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with keyboard', () => {
      renderAppSwitcher();

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });

    it('should open dropdown with Enter key', async () => {
      const user = userEvent.setup();
      renderAppSwitcher();

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('Switch Application')).toBeInTheDocument();
    });

    it('should close dropdown with Escape key', async () => {
      const user = userEvent.setup();
      renderAppSwitcher();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Switch Application')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(
          screen.queryByText('Switch Application')
        ).not.toBeInTheDocument();
      });
    });
  });
});
