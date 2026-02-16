import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import UserMenu from "./UserMenu";
import * as AuthContext from "../context/AuthContext";

// Mock helper to wrap consistent providers
const renderWithProviders = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

vi.mock("lucide-react", () => ({
  User: () => <span data-testid="icon-user" />,
  LogOut: () => <span data-testid="icon-logout" />,
  ChevronDown: () => <span data-testid="icon-chevron" />,
  SlidersHorizontal: () => <span data-testid="icon-sliders" />,
}));

describe("UserMenu Component", () => {
  // Setup default mocks
  const mockUser = {
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    role: "user",
  };

  const mockLogout = vi.fn();
  const mockIsLoading = false;

  // Mock useAuth
  const spyUseAuth = vi.spyOn(AuthContext, "useAuth");

  beforeEach(() => {
    spyUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isLoading: mockIsLoading,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders user initials when no avatar is present", () => {
    renderWithProviders(<UserMenu />);
    // "Test User" -> "TU"
    expect(screen.getByText("TU")).toBeInTheDocument();
  });

  it("renders user full name and role", () => {
    renderWithProviders(<UserMenu />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("formats 'super_admin' role correctly", () => {
    spyUseAuth.mockReturnValue({
      user: { ...mockUser, role: "super_admin" },
      logout: mockLogout,
      isLoading: false,
    });
    renderWithProviders(<UserMenu />);
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("prioritizes churchRole over generic role", () => {
    spyUseAuth.mockReturnValue({
      user: { ...mockUser, role: "user", churchRole: "Worship Leader" },
      logout: mockLogout,
      isLoading: false,
    });
    renderWithProviders(<UserMenu />);
    expect(screen.getByText("Worship Leader")).toBeInTheDocument();
  });

  it("shows skeleton loader when loading", () => {
    spyUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      isLoading: true,
    });
    const { container } = renderWithProviders(<UserMenu />);
    // Check for animate-pulse class
    expect(
      container.getElementsByClassName("animate-pulse").length,
    ).toBeGreaterThan(0);
  });

  it("opens menu on click", () => {
    renderWithProviders(<UserMenu />);
    const button = screen.getByLabelText("User Menu");
    fireEvent.click(button);

    // Expect menu items to appear
    expect(screen.getByText("View Profile")).toBeInTheDocument();
    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("calls logout on sign out click", () => {
    renderWithProviders(<UserMenu />);
    const button = screen.getByLabelText("User Menu");
    fireEvent.click(button);

    const signOutBtn = screen.getByText("Sign out");
    fireEvent.click(signOutBtn);

    expect(mockLogout).toHaveBeenCalled();
  });

  it("hides preferences link when prop is false", () => {
    renderWithProviders(<UserMenu showPreferencesLink={false} />);
    const button = screen.getByLabelText("User Menu");
    fireEvent.click(button);

    expect(screen.queryByText("Preferences")).not.toBeInTheDocument();
  });

  it("renders custom header if provided", () => {
    renderWithProviders(
      <UserMenu customHeader={<div data-testid="custom-header">Custom</div>} />,
    );
    const button = screen.getByLabelText("User Menu");
    fireEvent.click(button);

    expect(screen.getByTestId("custom-header")).toBeInTheDocument();
  });
});
