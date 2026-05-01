import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import React from "react";
import { ApiProvider } from "../../api/components/ApiProvider";

// Create mock auth service instance
const mockAuthServiceInstance = {
  checkAuthStatus: vi.fn(),
  getCurrentUser: vi.fn(),
  switchChurch: vi.fn(),
  refreshToken: vi.fn(),
  startActivityTracking: vi.fn(),
  stopActivityTracking: vi.fn(),
};

// Mock AuthService
vi.mock("../services/AuthService", () => ({
  AuthService: class AuthService {
    constructor() {
      return mockAuthServiceInstance;
    }
  },
}));

// Mock tokenStorage
vi.mock("../utils/TokenStorage", () => ({
  tokenStorage: {
    updateUser: vi.fn(),
    getAccessToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

// Mock useApi
vi.mock("../../api/hooks/index", () => ({
  useApi: () => ({ apiClient: {} }),
}));

// Test component that uses the hook
const TestComponent = ({
  onStateChange,
}: {
  onStateChange?: (auth: any) => void;
}) => {
  const auth = useAuth();

  React.useEffect(() => {
    if (onStateChange) {
      onStateChange(auth);
    }
  }, [auth, onStateChange]);

  return (
    <div>
      <div data-testid="user">{auth.user?.email || "No user"}</div>
      <div data-testid="loading">{String(auth.isLoading)}</div>
      <div data-testid="error">{auth.error || "No error"}</div>
    </div>
  );
};

describe("AuthContext - switchChurch", () => {
  let mockAuthService: any;
  const mockUser = {
    _id: "user123",
    email: "test@example.com",
    currentChurch: "church1",
    churches: [
      { church: "church1", role: "admin" },
      { church: "church2", role: "member" },
    ],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mock instance
    const { AuthService } = await import("../services/AuthService");
    mockAuthService = new AuthService({} as any);

    // Setup default mocks
    mockAuthService.checkAuthStatus.mockResolvedValue({
      isAuthenticated: true,
      user: mockUser,
    });
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
  });

  it("should successfully switch church and update state", async () => {
    const updatedUser = {
      ...mockUser,
      currentChurch: "church2",
    };

    mockAuthService.switchChurch.mockResolvedValue({
      success: true,
      user: updatedUser,
    });

    let authContext: any;
    const onStateChange = (auth: any) => {
      authContext = auth;
    };

    render(
      <ApiProvider
        config={{ baseURL: "http://localhost:5000" }}
      >
        <AuthProvider config={{ appType: "church" }}>
          <TestComponent onStateChange={onStateChange} />
        </AuthProvider>
      </ApiProvider>,
    );

    // Wait for initialization
    await waitFor(() => {
      expect(authContext?.user).toBeTruthy();
    });

    // Call switchChurch
    const result = await act(async () => {
      return await authContext.switchChurch("church2");
    });

    expect(mockAuthService.switchChurch).toHaveBeenCalledWith("church2");
    expect(result.success).toBe(true);
    expect(result.user).toEqual(updatedUser);

    // Verify state was updated
    await waitFor(() => {
      expect(authContext.user).toEqual(updatedUser);
      expect(authContext.isLoading).toBe(false);
    });
  });

  it("should set loading state during switch", async () => {
    const updatedUser = {
      ...mockUser,
      currentChurch: "church2",
    };

    // Create a promise we can control
    let resolveSwitch: any;
    const switchPromise = new Promise((resolve) => {
      resolveSwitch = resolve;
    });

    mockAuthService.switchChurch.mockReturnValue(switchPromise);

    let authContext: any;
    const onStateChange = (auth: any) => {
      authContext = auth;
    };

    render(
      <ApiProvider
        config={{ baseURL: "http://localhost:5000" }}
      >
        <AuthProvider config={{ appType: "church" }}>
          <TestComponent onStateChange={onStateChange} />
        </AuthProvider>
      </ApiProvider>,
    );

    // Wait for initialization
    await waitFor(() => {
      expect(authContext?.user).toBeTruthy();
    });

    // Start switch (don't await)
    let switchCall;
    act(() => {
      switchCall = authContext.switchChurch("church2");
    });

    // Verify loading state
    await waitFor(() => {
      expect(authContext.isLoading).toBe(true);
    });

    // Resolve the switch
    resolveSwitch({ success: true, user: updatedUser });
    await switchCall;

    // Verify loading is false
    await waitFor(() => {
      expect(authContext.isLoading).toBe(false);
    });
  });

  it("should handle switch errors correctly", async () => {
    mockAuthService.switchChurch.mockRejectedValue(
      new Error("Not a member of this church"),
    );

    let authContext: any;
    const onStateChange = (auth: any) => {
      authContext = auth;
    };

    const onError = vi.fn();

    render(
      <ApiProvider
        config={{ baseURL: "http://localhost:5000" }}
      >
        <AuthProvider config={{ appType: "church" }} onError={onError}>
          <TestComponent onStateChange={onStateChange} />
        </AuthProvider>
      </ApiProvider>,
    );

    // Wait for initialization
    await waitFor(() => {
      expect(authContext?.user).toBeTruthy();
    });

    // Call switchChurch and expect error
    await act(async () => {
      await expect(authContext.switchChurch("church2")).rejects.toThrow(
        "Not a member of this church",
      );
    });

    // Verify error state
    await waitFor(() => {
      expect(authContext.error).toBe("Not a member of this church");
      expect(authContext.isLoading).toBe(false);
    });

    // Verify error callback was called
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it("should call onAuthStateChange callback when church is switched", async () => {
    const updatedUser = {
      ...mockUser,
      currentChurch: "church2",
    };

    mockAuthService.switchChurch.mockResolvedValue({
      success: true,
      user: updatedUser,
    });

    const onAuthStateChange = vi.fn();

    let authContext: any;
    const onStateChange = (auth: any) => {
      authContext = auth;
    };

    render(
      <ApiProvider
        config={{ baseURL: "http://localhost:5000" }}
      >
        <AuthProvider
          config={{ appType: "church" }}
          onAuthStateChange={onAuthStateChange}
        >
          <TestComponent onStateChange={onStateChange} />
        </AuthProvider>
      </ApiProvider>,
    );

    // Wait for initialization
    await waitFor(() => {
      expect(authContext?.user).toBeTruthy();
    });

    // Call switchChurch
    await act(async () => {
      await authContext.switchChurch("church2");
    });

    // Verify callback was called with updated user
    await waitFor(() => {
      expect(onAuthStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          user: updatedUser,
          isLoading: false,
        }),
      );
    });
  });

  it("should not switch if already on the target church", async () => {
    mockAuthService.switchChurch.mockResolvedValue({
      success: true,
      user: mockUser,
      noChange: true,
    });

    let authContext: any;
    const onStateChange = (auth: any) => {
      authContext = auth;
    };

    render(
      <ApiProvider
        config={{ baseURL: "http://localhost:5000" }}
      >
        <AuthProvider config={{ appType: "church" }}>
          <TestComponent onStateChange={onStateChange} />
        </AuthProvider>
      </ApiProvider>,
    );

    // Wait for initialization
    await waitFor(() => {
      expect(authContext?.user).toBeTruthy();
    });

    // Switch to current church
    const result = await act(async () => {
      return await authContext.switchChurch("church1");
    });

    expect(mockAuthService.switchChurch).toHaveBeenCalledWith("church1");
    expect(result.noChange).toBe(true);
  });
});
