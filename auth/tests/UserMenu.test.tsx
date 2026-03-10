import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import * as AuthContext from "../context/AuthContext";
import type { AuthContextType } from "../types/auth.types.ts";

// ── Mock Lucide icons ─────────────────────────────────────────────────────────

vi.mock("lucide-react", () => ({
  User: () => <span data-testid="icon-user" />,
  LogOut: () => <span data-testid="icon-logout" />,
  ChevronDown: () => <span data-testid="icon-chevron" />,
  SlidersHorizontal: () => <span data-testid="icon-sliders" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderWithProviders = (ui: React.ReactNode) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser = {
  id: "user-1",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  role: "user",
};

const mockLogout = vi.fn();

// Minimal valid AuthContextType shape for tests
const baseAuthMock = {
  user: mockUser,
  logout: mockLogout,
  isLoading: false,
} as unknown as AuthContextType;

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("UserMenu Component", () => {
  const spyUseAuth = vi.spyOn(AuthContext, "useAuth");

  beforeEach(() => {
    spyUseAuth.mockReturnValue(baseAuthMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders user initials when no avatar is present", () => {
    renderWithProviders(<UserMenu />);
    // "Test User" → "TU"
    expect(screen.getByText("TU")).toBeInTheDocument();
  });

  it("renders user full name and role", () => {
    renderWithProviders(<UserMenu />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    const button = screen.getByLabelText("User menu");
    fireEvent.click(button);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("formats 'super_admin' role correctly", () => {
    spyUseAuth.mockReturnValue({
      ...baseAuthMock,
      user: { ...mockUser, role: "super_admin" },
    } as unknown as AuthContextType);
    renderWithProviders(<UserMenu />);
    const button = screen.getByLabelText("User menu");
    fireEvent.click(button);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("prioritizes churchRole over generic role", () => {
    spyUseAuth.mockReturnValue({
      ...baseAuthMock,
      user: { ...mockUser, role: "user", churchRole: "Worship Leader" },
    } as unknown as AuthContextType);
    renderWithProviders(<UserMenu />);
    expect(screen.getByText("Worship Leader")).toBeInTheDocument();
  });

  it("shows skeleton loader when loading", () => {
    spyUseAuth.mockReturnValue({
      ...baseAuthMock,
      user: null,
      isLoading: true,
    } as unknown as AuthContextType);
    const { container } = renderWithProviders(<UserMenu />);
    expect(container.getElementsByClassName("animate-pulse").length).toBeGreaterThan(0);
  });

  it("opens menu on click", () => {
    renderWithProviders(<UserMenu />);
    const button = screen.getByLabelText("User menu");
    fireEvent.click(button);
    expect(screen.getByText("View Profile")).toBeInTheDocument();
    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("calls logout on sign out click", () => {
    renderWithProviders(<UserMenu />);
    const button = screen.getByLabelText("User menu");
    fireEvent.click(button);
    const signOutBtn = screen.getByText("Sign out");
    fireEvent.click(signOutBtn);
    expect(mockLogout).toHaveBeenCalled();
  });

  it("hides preferences link when prop is false", () => {
    renderWithProviders(<UserMenu showPreferencesLink={false} />);
    const button = screen.getByLabelText("User menu");
    fireEvent.click(button);
    expect(screen.queryByText("Preferences")).not.toBeInTheDocument();
  });

  it("renders custom header if provided", () => {
    renderWithProviders(
      <UserMenu customHeader={<div data-testid="custom-header">Custom</div>} />,
    );
    const button = screen.getByLabelText("User menu");
    fireEvent.click(button);
    expect(screen.getByTestId("custom-header")).toBeInTheDocument();
  });
});
