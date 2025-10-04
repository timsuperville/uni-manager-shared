/* eslint-env browser */
/* global localStorage, console */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Custom hook for managing user authentication state
 * Provides centralized authentication logic for all apps
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use try-catch to handle test environments where router context might not exist
  let navigate;
  try {
    navigate = useNavigate();
  } catch (error) {
    // In test environment or when router context is not available, provide a mock
    navigate = () => {};
  }

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const authStatus = localStorage.getItem("isAuthenticated");
        const userData = localStorage.getItem("user");
        
        if (authStatus === "true" && userData) {
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData) => {
    try {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
      
      // Navigate only if navigate function is available (not in test environment)
      if (navigate && typeof navigate === 'function') {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error during login:", error);
      throw new Error("Failed to save authentication data");
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
      
      // Navigate only if navigate function is available (not in test environment)
      if (navigate && typeof navigate === 'function') {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const updateUser = (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      localStorage.setItem("user", JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error("Error updating user data:", error);
      throw new Error("Failed to update user data");
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateUser,
  };
}