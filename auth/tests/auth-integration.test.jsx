/* eslint-disable */
/**
 * Integration Tests for Authentication Flows
 *
 * Tests complete authentication workflows from start to finish,
 * including login, MFA, OAuth, and session management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";
import { LoginForm } from "../components/LoginForm";

// Mock API responses
const mockSuccessfulLogin = {
  success: true,
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  user: {
    id: "123",
    email: "test@example.com",
    name: "Test User",
  },
};

const mockMFARequired = {
  success: false,
  mfaRequired: true,
  mfaToken: "mock-mfa-token",
  mfaMethods: ["totp", "sms"],
};

const mockOAuthSuccess = {
  success: true,
  authUrl: "https://oauth.provider.com/authorize?state=abc123",
  state: "abc123",
};

describe("Complete Authentication Flows", () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Email/Password Login Flow", () => {
    it("should complete successful login flow", async () => {
      // Mock fetch for login API
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessfulLogin,
      });

      const { container } = render(
        <AuthProvider config={{ appName: "test" }}>
          <LoginForm />
        </AuthProvider>,
      );

      // Fill in credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", {
        name: /sign in|login/i,
      });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      // Wait for login to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/auth/login"),
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("test@example.com"),
          }),
        );
      });

      // Verify tokens are stored
      await waitFor(() => {
        const storedToken = localStorage.getItem("accessToken");
        expect(storedToken).toBe("mock-access-token");
      });
    });

    it("should handle login failure with rate limiting", async () => {
      // Mock failed login
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Invalid credentials" }),
      });

      const { container } = render(
        <AuthProvider config={{ appName: "test" }}>
          <LoginForm />
        </AuthProvider>,
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", {
        name: /sign in|login/i,
      });

      // Attempt login 3 times
      for (let i = 0; i < 3; i++) {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, {
          target: { value: "wrong-password" },
        });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/invalid/i)).toBeInTheDocument();
        });
      }

      // After 3 failures, should show rate limit message
      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
      });
    });
  });

  describe("MFA Login Flow", () => {
    it("should complete MFA verification after login", async () => {
      // Mock login requiring MFA
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMFARequired,
        })
        // Mock MFA verification
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessfulLogin,
        });

      render(
        <AuthProvider config={{ appName: "test" }}>
          <LoginForm />
        </AuthProvider>,
      );

      // Initial login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", {
        name: /sign in|login/i,
      });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      // Wait for MFA prompt
      await waitFor(() => {
        expect(
          screen.getByText(/enter.*code|verification/i),
        ).toBeInTheDocument();
      });

      // Enter MFA code
      const mfaInput = screen.getByLabelText(/code|verification/i);
      const verifyButton = screen.getByRole("button", { name: /verify/i });

      fireEvent.change(mfaInput, { target: { value: "123456" } });
      fireEvent.click(verifyButton);

      // Wait for successful login
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        const storedToken = localStorage.getItem("accessToken");
        expect(storedToken).toBe("mock-access-token");
      });
    });

    it("should handle invalid MFA code", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMFARequired,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: "Invalid MFA code" }),
        });

      render(
        <AuthProvider config={{ appName: "test" }}>
          <LoginForm />
        </AuthProvider>,
      );

      // Complete initial login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /sign in|login/i }));

      await waitFor(() => {
        expect(screen.getByText(/enter.*code/i)).toBeInTheDocument();
      });

      // Enter invalid MFA code
      const mfaInput = screen.getByLabelText(/code/i);
      fireEvent.change(mfaInput, { target: { value: "000000" } });
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/invalid.*code/i)).toBeInTheDocument();
      });
    });
  });

  describe("OAuth Login Flow", () => {
    it("should initiate OAuth flow correctly", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockOAuthSuccess,
      });

      const originalLocation = window.location;
      delete window.location;
      window.location = { href: "" };

      render(
        <AuthProvider config={{ appName: "test" }}>
          <LoginForm />
        </AuthProvider>,
      );

      // Click OAuth button
      const googleButton = screen.getByRole("button", { name: /google/i });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/oauth/google"),
          expect.any(Object),
        );
      });

      // Should redirect to OAuth provider
      await waitFor(() => {
        expect(window.location.href).toContain("oauth.provider.com");
      });

      window.location = originalLocation;
    });

    it("should handle OAuth callback", async () => {
      // Mock OAuth callback handler
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessfulLogin,
      });

      // Simulate OAuth callback URL
      const searchParams = new URLSearchParams({
        code: "auth-code-123",
        state: "abc123",
      });

      // Store state in sessionStorage (as done in real flow)
      sessionStorage.setItem("oauth_state", "abc123");
      sessionStorage.setItem("pkce_verifier", "verifier-123");

      render(
        <AuthProvider config={{ appName: "test" }}>
          <div>OAuth Callback Handler</div>
        </AuthProvider>,
      );

      // Verify callback was processed
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Verify session storage was cleared
      expect(sessionStorage.getItem("oauth_state")).toBeNull();
      expect(sessionStorage.getItem("pkce_verifier")).toBeNull();
    });
  });

  describe("Session Management", () => {
    it("should auto-refresh token before expiration", async () => {
      vi.useFakeTimers();

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessfulLogin,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
          }),
        });

      render(
        <AuthProvider config={{ appName: "test", tokenRefreshInterval: 1000 }}>
          <div>App Content</div>
        </AuthProvider>,
      );

      // Simulate successful login
      await waitFor(() => {
        localStorage.setItem("accessToken", "mock-access-token");
        localStorage.setItem("refreshToken", "mock-refresh-token");
      });

      // Fast-forward time to trigger refresh
      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/refresh"),
          expect.any(Object),
        );
      });

      vi.useRealTimers();
    });

    it("should handle expired session", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Session expired" }),
      });

      const onAuthStateChange = vi.fn();

      render(
        <AuthProvider
          config={{ appName: "test" }}
          onAuthStateChange={onAuthStateChange}
        >
          <div>App Content</div>
        </AuthProvider>,
      );

      // Simulate expired token
      localStorage.setItem("accessToken", "expired-token");

      await waitFor(() => {
        expect(onAuthStateChange).toHaveBeenCalledWith(
          expect.objectContaining({ isAuthenticated: false }),
        );
      });

      // Verify tokens are cleared
      expect(localStorage.getItem("accessToken")).toBeNull();
    });
  });

  describe("Cross-Tab Synchronization", () => {
    it("should sync logout across tabs", async () => {
      render(
        <AuthProvider config={{ appName: "test" }}>
          <div>App Content</div>
        </AuthProvider>,
      );

      // Simulate login in current tab
      localStorage.setItem("accessToken", "mock-token");

      // Simulate logout from another tab
      const storageEvent = new StorageEvent("storage", {
        key: "accessToken",
        oldValue: "mock-token",
        newValue: null,
        storageArea: localStorage,
      });

      window.dispatchEvent(storageEvent);

      await waitFor(() => {
        // Current tab should also logout
        expect(localStorage.getItem("accessToken")).toBeNull();
      });
    });
  });
});
