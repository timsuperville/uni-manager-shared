/**
 * Unified API Integration Examples
 *
 * This file demonstrates how to integrate the unified API layer
 * into React applications across the Uni-Manager ecosystem.
 *
 * NOTE: Church-specific API examples have been moved to the Church app.
 * The `church` service is not part of the shared ApiServices interface.
 * See: frontend/apps/church/src for ecclesiastical service patterns.
 */

import React from "react";
import {
  ApiProvider,
  useApi,
  useAuth,
  useApiQuery,
  useApiMutation,
  getApiBaseUrl,
} from "../index";
import type { UserProfile } from "../types";

// ==================== BASIC SETUP ====================

/**
 * Example: Basic application setup with ApiProvider
 */
const AppWithApiProvider: React.FC = () => {
  const apiConfig = {
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    enableCaching: true,
    enableAuth: true,
  };

  return (
    <ApiProvider
      config={apiConfig}
      onError={(error) => console.error("API Error:", error)}
    >
      <div className="app">
        <AuthSection />
        <QueryExample />
      </div>
    </ApiProvider>
  );
};

// ==================== AUTHENTICATION EXAMPLES ====================

/**
 * Example: Authentication hook usage
 */
const AuthSection: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, login, logout, signup } =
    useAuth();

  const handleLogin = async () => {
    try {
      await login({
        email: "user@example.com",
        password: "password123",
      });
    } catch (_err) {
      // console.error('Login failed:', err);
    }
  };

  const handleSignup = async () => {
    try {
      await signup({
        firstName: "New",
        lastName: "User",
        email: "newuser@example.com",
        password: "password123",
        acceptTerms: true,
      });
    } catch (_err) {
      // console.error('Signup failed:', err);
    }
  };

  if (isLoading) {
    return <div>Checking authentication...</div>;
  }

  if (error) {
    return <div>Authentication error: {error}</div>;
  }

  return (
    <div className="auth-section">
      {isAuthenticated ? (
        <div>
          <h2>Welcome, {user?.displayName || user?.firstName}!</h2>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleSignup}>Sign Up</button>
        </div>
      )}
    </div>
  );
};

// ==================== QUERY HOOK EXAMPLES ====================

/**
 * Example: useApiQuery for data fetching
 */
const QueryExample: React.FC = () => {
  const api = useApi();

  // Example: Fetch current user profile
  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useApiQuery("user-profile", () => api.auth.getCurrentUser());

  return (
    <div className="query-section">
      <h2>Data Queries</h2>

      <div className="profile-query">
        <h3>User Profile</h3>
        {profileLoading && <div>Loading profile...</div>}
        {profileError && <div>Error: {profileError.message}</div>}
        {userProfile && (
          <div>
            Profile loaded for:{" "}
            {userProfile.displayName || userProfile.firstName}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MUTATION EXAMPLES ====================

/**
 * Example: useApiMutation for data modifications
 */
const MutationExample: React.FC = () => {
  const api = useApi();

  // Example: Update user profile
  const {
    mutate: updateProfile,
    isLoading: updateLoading,
    error: updateError,
  } = useApiMutation(
    (profileData: Partial<UserProfile>) => api.auth.updateProfile(profileData),
    {
      onSuccess: (_data) => {
        // console.log('Profile updated successfully:', data);
      },
      onError: (_error) => {
        // console.error('Profile update failed:', error);
      },
    },
  );

  const handleUpdateProfile = () => {
    updateProfile({
      name: "Updated Name",
      bio: "Updated bio information",
    });
  };

  return (
    <div className="mutation-section">
      <h2>Data Mutations</h2>

      <div className="profile-update">
        <button onClick={handleUpdateProfile} disabled={updateLoading}>
          {updateLoading ? "Updating..." : "Update Profile"}
        </button>
        {updateError && <div>Error: {updateError.message}</div>}
      </div>
    </div>
  );
};

// ==================== DIRECT API ACCESS ====================

/**
 * Example: Direct API service access
 */
const DirectApiExample: React.FC = () => {
  const api = useApi();

  const handleDirectApiCall = async () => {
    try {
      // Direct access to auth service
      const authStatus = await api.auth.checkAuthStatus();
      // console.log('Auth status:', authStatus);

      // Access to auth service methods
      const currentUser = await api.auth.getCurrentUser();
      // console.log('Current user:', currentUser);
    } catch (_error) {
      // console.error('Direct API call failed:', error);
    }
  };

  return (
    <div className="direct-api-section">
      <h2>Direct API Access</h2>
      <button onClick={handleDirectApiCall}>Execute Direct API Calls</button>
    </div>
  );
};

// ==================== EXPORTS ====================

export {
  AppWithApiProvider,
  AuthSection,
  QueryExample,
  MutationExample,
  DirectApiExample,
};

export default AppWithApiProvider;
