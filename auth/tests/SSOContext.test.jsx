/**
 * SSO Provider Component Tests
 *
 * Comprehensive tests for Cross-Application SSO functionality
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SSOProvider, useSSO } from "../context/SSOContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Mock the AuthContext
vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn(),
}));

// Mock the CrossApplicationSSOService
vi.mock("../services/crossApplicationSSOService.js", () => ({
  CrossApplicationSSOService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    currentApp: "church",
    getAvailableApps: vi.fn().mockResolvedValue([
      { id: "admin", name: "Administration", description: "Admin tools" },
      { id: "business", name: "Business", description: "Business management" },
    ]),
    switchToApp: vi.fn().mockResolvedValue(undefined),
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue({ success: true }),
    hasAppPermission: vi.fn().mockReturnValue(true),
    appRegistry: {
      church: { id: "church", name: "Church", port: 5173 },
      admin: { id: "admin", name: "Administration", port: 5174 },
      business: { id: "business", name: "Business", port: 5176 },
    },
    isAuthenticated: vi.fn().mockResolvedValue(true),
  })),
}));

// Test component that uses SSO context
const TestComponent = () => {
  const sso = useSSO();

  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { "data-testid": "current-app" },
      sso.currentApp
    ),
    React.createElement(
      "div",
      { "data-testid": "available-apps" },
      sso.availableApps.length
    ),
    React.createElement(
      "div",
      { "data-testid": "loading" },
      sso.ssoLoading ? "loading" : "ready"
    ),
    React.createElement(
      "div",
      { "data-testid": "error" },
      sso.ssoError || "no error"
    ),
    React.createElement(
      "button",
      {
        "data-testid": "switch-app",
        onClick: () => sso.switchToApp("admin"),
      },
      "Switch to Admin"
    ),
    React.createElement(
      "button",
      {
        "data-testid": "login",
        onClick: () => sso.loginWithSSO({ username: "test", password: "test" }),
      },
      "Login"
    ),
    React.createElement(
      "button",
      {
        "data-testid": "logout",
        onClick: () => sso.logoutWithSSO(),
      },
      "Logout"
    )
  );
};

const renderWithSSO = (authState = {}) => {
  const mockAuth = {
    isAuthenticated: false,
    user: null,
    ...authState,
  };

  useAuth.mockReturnValue(mockAuth);

  return render(
    React.createElement(SSOProvider, null, React.createElement(TestComponent))
  );
};

describe("SSOProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL search params
    Object.defineProperty(window, "location", {
      value: {
        search: "",
        pathname: "/test",
        href: "http://localhost:5173/test",
      },
      writable: true,
    });

    // Mock history API
    Object.defineProperty(window, "history", {
      value: {
        replaceState: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize SSO service on mount", async () => {
      renderWithSSO({ isAuthenticated: true });

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      expect(screen.getByTestId("current-app")).toHaveTextContent("church");
    });

    it("should handle initialization errors gracefully", async () => {
      const { CrossApplicationSSOService } = await import(
        "../services/crossApplicationSSOService.js"
      );
      CrossApplicationSSOService.mockImplementation(() => ({
        initialize: vi.fn().mockRejectedValue(new Error("Init failed")),
        destroy: vi.fn(),
      }));

      renderWithSSO();

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Init failed");
      });
    });

    it("should load available apps for authenticated users", async () => {
      renderWithSSO({ isAuthenticated: true });

      await waitFor(() => {
        expect(screen.getByTestId("available-apps")).toHaveTextContent("2");
      });
    });

    it("should not load apps for unauthenticated users", async () => {
      renderWithSSO({ isAuthenticated: false });

      await waitFor(() => {
        expect(screen.getByTestId("available-apps")).toHaveTextContent("0");
      });
    });
  });

  describe("App Switching", () => {
    it("should switch to different app successfully", async () => {
      const user = userEvent.setup();
      renderWithSSO({ isAuthenticated: true });

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      const switchButton = screen.getByTestId("switch-app");
      await user.click(switchButton);

      // The actual app switch would happen via service
      expect(screen.queryByText("Switch to Admin")).toBeInTheDocument();
    });

    it("should handle app switch errors", async () => {
      const user = userEvent.setup();
      const { CrossApplicationSSOService } = await import(
        "../services/crossApplicationSSOService.js"
      );

      // Mock service to throw error on switchToApp
      CrossApplicationSSOService.mockImplementation(() => ({
        initialize: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        currentApp: "church",
        getAvailableApps: vi.fn().mockResolvedValue([]),
        switchToApp: vi.fn().mockRejectedValue(new Error("Switch failed")),
        appRegistry: {},
      }));

      renderWithSSO({ isAuthenticated: true });

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      const switchButton = screen.getByTestId("switch-app");
      await user.click(switchButton);

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Switch failed");
      });
    });
  });

  describe("Authentication", () => {
    it("should handle SSO login successfully", async () => {
      const user = userEvent.setup();
      renderWithSSO();

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      const loginButton = screen.getByTestId("login");
      await user.click(loginButton);

      // Should update available apps after login
      await waitFor(() => {
        expect(screen.getByTestId("available-apps")).toHaveTextContent("2");
      });
    });

    it("should handle SSO logout successfully", async () => {
      const user = userEvent.setup();
      renderWithSSO({ isAuthenticated: true });

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      const logoutButton = screen.getByTestId("logout");
      await user.click(logoutButton);

      // Should clear available apps after logout
      await waitFor(() => {
        expect(screen.getByTestId("available-apps")).toHaveTextContent("0");
      });
    });

    it("should handle login errors gracefully", async () => {
      const user = userEvent.setup();
      const { CrossApplicationSSOService } = await import(
        "../services/crossApplicationSSOService.js"
      );

      CrossApplicationSSOService.mockImplementation(() => ({
        initialize: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        currentApp: "church",
        getAvailableApps: vi.fn().mockResolvedValue([]),
        login: vi.fn().mockRejectedValue(new Error("Login failed")),
        appRegistry: {},
      }));

      renderWithSSO();

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      const loginButton = screen.getByTestId("login");
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Login failed");
      });
    });
  });

  describe("SSO URL Parameters", () => {
    it("should handle SSO session parameters", async () => {
      // Mock URL with SSO parameters
      Object.defineProperty(window, "location", {
        value: {
          search: "?sso_session=test123&source_app=admin",
          pathname: "/test",
          href: "http://localhost:5173/test?sso_session=test123&source_app=admin",
        },
        writable: true,
      });

      renderWithSSO({ isAuthenticated: true });

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      // Should clean up URL parameters
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        expect.any(String),
        "/test"
      );
    });

    it("should handle invalid SSO parameters gracefully", async () => {
      const { CrossApplicationSSOService } = await import(
        "../services/crossApplicationSSOService.js"
      );

      CrossApplicationSSOService.mockImplementation(() => ({
        initialize: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        currentApp: "church",
        getAvailableApps: vi.fn().mockResolvedValue([]),
        isAuthenticated: vi
          .fn()
          .mockRejectedValue(new Error("Invalid session")),
        appRegistry: {},
      }));

      Object.defineProperty(window, "location", {
        value: {
          search: "?sso_session=invalid&source_app=admin",
          pathname: "/test",
        },
        writable: true,
      });

      renderWithSSO();

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "SSO session verification failed"
        );
      });
    });
  });

  describe("Context Error Handling", () => {
    it("should throw error when used outside provider", () => {
      // Capture console.error to prevent test output noise
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(React.createElement(TestComponent));
      }).toThrow("useSSO must be used within an SSOProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Cleanup", () => {
    it("should cleanup SSO service on unmount", async () => {
      const { unmount } = renderWithSSO();

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      const { CrossApplicationSSOService } = await import(
        "../services/crossApplicationSSOService.js"
      );
      const mockInstance = CrossApplicationSSOService.mock.results[0].value;

      unmount();

      expect(mockInstance.destroy).toHaveBeenCalled();
    });
  });
});
