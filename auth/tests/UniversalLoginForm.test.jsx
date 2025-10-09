/**
 * @jest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UniversalLoginForm } from "../components/UniversalLoginForm";
import { MemoryRouterV7 } from "../../testing/router-utils.jsx";

// Mock the auth context
vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const { useAuth } = await import("../context/AuthContext.jsx");

describe("UniversalLoginForm", () => {
  const mockLogin = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });
  });

  describe("Basic Rendering", () => {
    it("renders with default configuration", () => {
      render(
        <MemoryRouterV7>
          <UniversalLoginForm />
        </MemoryRouterV7>
      );

      expect(screen.getByText("Sign In")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your email address")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your password")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("renders admin app configuration correctly", () => {
      render(
        <MemoryRouterV7>
          <UniversalLoginForm appType="admin" />
        </MemoryRouterV7>
      );

      expect(screen.getByText("Admin Portal Access")).toBeInTheDocument();
      expect(
        screen.getByText("Sign in to access the administrative dashboard")
      ).toBeInTheDocument();
      expect(screen.getByText("🔐")).toBeInTheDocument();
    });

    it("renders church app configuration correctly", () => {
      render(
        <MemoryRouterV7>
          <UniversalLoginForm appType="church" />
        </MemoryRouterV7>
      );

      expect(screen.getByText("Church Management")).toBeInTheDocument();
      expect(
        screen.getByText("Sign in to manage church services and events")
      ).toBeInTheDocument();
      expect(screen.getByText("⛪")).toBeInTheDocument();
    });

    it("allows custom title and description override", () => {
      render(
        <MemoryRouterV7>
          <UniversalLoginForm
            appType="admin"
            appTitle="Custom Portal"
            appDescription="Custom description for testing"
          />
        </MemoryRouterV7>
      );

      expect(screen.getByText("Custom Portal")).toBeInTheDocument();
      expect(
        screen.getByText("Custom description for testing")
      ).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("updates email field when user types", async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouterV7>
          <UniversalLoginForm />
        </MemoryRouterV7>
      );

      const emailInput = screen.getByPlaceholderText(
        "Enter your email address"
      );
      await user.type(emailInput, "test@example.com");

      expect(emailInput.value).toBe("test@example.com");
    });

    it("enables submit button when form is valid", async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouterV7>
          <UniversalLoginForm />
        </MemoryRouterV7>
      );

      const emailInput = screen.getByPlaceholderText(
        "Enter your email address"
      );
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Form Submission", () => {
    it("calls login function with correct credentials", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({
        success: true,
        user: { id: "1", email: "test@example.com" },
      });

      render(
        <MemoryRouterV7>
          <UniversalLoginForm appType="admin" />
        </MemoryRouterV7>
      );

      await user.type(
        screen.getByPlaceholderText("Enter your email address"),
        "test@example.com"
      );
      await user.type(
        screen.getByPlaceholderText("Enter your password"),
        "password123"
      );
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
        appType: "admin",
      });
    });
  });
});
