/* eslint-env browser */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  churchId?: string;
  [key: string]: unknown;
}

export interface UseAuthResult {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  updateUser: (updatedUserData: Partial<AuthUser>) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LS_AUTH_KEY = "isAuthenticated";
const LS_USER_KEY = "user";

function safeLocalStorage<T>(
  action: "get" | "set" | "remove",
  key: string,
  value?: string,
): T | null {
  try {
    if (typeof localStorage === "undefined") return null;
    if (action === "get") return localStorage.getItem(key) as unknown as T;
    if (action === "set" && value !== undefined) {
      localStorage.setItem(key, value);
      return null;
    }
    if (action === "remove") {
      localStorage.removeItem(key);
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook for managing user authentication state.
 *
 * NOTE: This hook uses localStorage as a lightweight persistence layer for
 * development / legacy paths. Production app shells should use the canonical
 * AuthService and its context-based providers.
 *
 * The try/catch around useNavigate (original anti-pattern) has been replaced
 * with a stable hook call — navigate is always retrieved from the router; if
 * the hook is used outside a router context it will throw at the React hooks
 * rules layer, which is the correct behaviour.
 */
export function useAuth(): UseAuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // useNavigate must NOT be called inside try/catch (violates Rules of Hooks).
  // Tests that render without a router should wrap with <MemoryRouter>.
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = (): void => {
      try {
        const authStatus = safeLocalStorage<string>("get", LS_AUTH_KEY);
        const userData = safeLocalStorage<string>("get", LS_USER_KEY);

        if (authStatus === "true" && userData) {
          setIsAuthenticated(true);
          setUser(JSON.parse(userData as string) as AuthUser);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData: AuthUser): void => {
    try {
      safeLocalStorage("set", LS_AUTH_KEY, "true");
      safeLocalStorage("set", LS_USER_KEY, JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
      navigate("/dashboard");
    } catch {
      throw new Error("Failed to save authentication data");
    }
  };

  const logout = (): void => {
    try {
      safeLocalStorage("remove", LS_AUTH_KEY);
      safeLocalStorage("remove", LS_USER_KEY);
      setIsAuthenticated(false);
      setUser(null);
      navigate("/login");
    } catch {
      // Fail silently — clear local state regardless
    }
  };

  const updateUser = (updatedUserData: Partial<AuthUser>): void => {
    try {
      const newUserData: AuthUser = { ...user, ...updatedUserData };
      safeLocalStorage("set", LS_USER_KEY, JSON.stringify(newUserData));
      setUser(newUserData);
    } catch {
      throw new Error("Failed to update user data");
    }
  };

  return { isAuthenticated, user, loading, login, logout, updateUser };
}
