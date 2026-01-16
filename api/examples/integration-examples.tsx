/**
 * Unified API Integration Examples
 *
 * This file demonstrates how to integrate the unified API layer
 * into React applications across the Uni-Manager ecosystem.
 */

import React from "react";
import {
  ApiProvider,
  useApi,
  useAuth,
  useChurch,
  useApiQuery,
  useApiMutation,
} from "../index";

// ==================== BASIC SETUP ====================

/**
 * Example: Basic application setup with ApiProvider
 */
const AppWithApiProvider: React.FC = () => {
  const apiConfig = {
    baseURL: "http://localhost:5000/api",
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
        <ChurchSection />
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
        name: "New User",
        email: "newuser@example.com",
        password: "password123",
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

// ==================== CHURCH MANAGEMENT EXAMPLES ====================

/**
 * Example: Church operations hook usage
 */
const ChurchSection: React.FC = () => {
  const { getChurches, getChurch, createChurch, updateChurch, searchChurches } =
    useChurch();

  const handleCreateChurch = async () => {
    try {
      const newChurch = await createChurch({
        name: "New Church",
        denomination: "Methodist",
        address: {
          street: "123 Church St",
          city: "Anytown",
          state: "ST",
          zipCode: "12345",
        },
      });
      // console.log('Church created:', newChurch);
    } catch (_err) {
      // console.error('Failed to create church:', err);
    }
  };

  const handleSearchChurches = async () => {
    try {
      const results = await searchChurches("Methodist", {
        city: "Anytown",
      });
      // console.log('Search results:', results);
    } catch (_err) {
      // console.error('Search failed:', err);
    }
  };

  return (
    <div className="church-section">
      <h2>Church Management</h2>
      <button onClick={handleCreateChurch}>Create Church</button>
      <button onClick={handleSearchChurches}>Search Churches</button>
    </div>
  );
};

// ==================== QUERY HOOK EXAMPLES ====================

/**
 * Example: useApiQuery for data fetching
 */
const QueryExample: React.FC = () => {
  const api = useApi();

  // Example: Fetch churches with caching
  const {
    data: churches,
    isLoading: churchesLoading,
    error: churchesError,
    refetch: refetchChurches,
  } = useApiQuery("churches-list", () => api.church.getChurches(), {
    enabled: true,
    refetchOnMount: true,
    cacheTime: 300000, // 5 minutes
  });

  // Example: Fetch current user profile
  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useApiQuery("user-profile", () => api.auth.getCurrentUser());

  return (
    <div className="query-section">
      <h2>Data Queries</h2>

      <div className="churches-query">
        <h3>Churches</h3>
        {churchesLoading && <div>Loading churches...</div>}
        {churchesError && <div>Error: {churchesError}</div>}
        {churches && (
          <div>
            <div>Found {churches.data?.length || 0} churches</div>
            <button onClick={refetchChurches}>Refresh</button>
          </div>
        )}
      </div>

      <div className="profile-query">
        <h3>User Profile</h3>
        {profileLoading && <div>Loading profile...</div>}
        {profileError && <div>Error: {profileError}</div>}
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
    (profileData: any) => api.auth.updateProfile(profileData),
    {
      onSuccess: (data) => {
        // console.log('Profile updated successfully:', data);
      },
      onError: (_error) => {
        // console.error('Profile update failed:', error);
      },
    },
  );

  // Example: Create church member (placeholder for future implementation)
  const {
    mutate: updateMember,
    isLoading: updateMemberLoading,
    error: updateMemberError,
  } = useApiMutation(
    ({
      churchId,
      memberId,
      memberData,
    }: {
      churchId: string;
      memberId: string;
      memberData: any;
    }) => api.church.updateChurchMember(churchId, memberId, memberData),
  );

  const handleUpdateProfile = () => {
    updateProfile({
      name: "Updated Name",
      bio: "Updated bio information",
    });
  };

  const handleUpdateMember = () => {
    updateMember({
      churchId: "church-123",
      memberId: "member-456",
      memberData: {
        role: "deacon",
        active: true,
      },
    });
  };

  return (
    <div className="mutation-section">
      <h2>Data Mutations</h2>

      <div className="profile-update">
        <button onClick={handleUpdateProfile} disabled={updateLoading}>
          {updateLoading ? "Updating..." : "Update Profile"}
        </button>
        {updateError && <div>Error: {updateError}</div>}
      </div>

      <div className="member-update">
        <button onClick={handleUpdateMember} disabled={updateMemberLoading}>
          {updateMemberLoading ? "Updating..." : "Update Member"}
        </button>
        {updateMemberError && <div>Error: {updateMemberError}</div>}
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

      // Direct access to church service with custom options
      const churches = await api.church.getChurches(
        { denomination: "Methodist" }, // filters
        { page: 1, limit: 10 }, // pagination
      );
      // console.log('Churches:', churches);

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
  ChurchSection,
  QueryExample,
  MutationExample,
  DirectApiExample,
};

export default AppWithApiProvider;
