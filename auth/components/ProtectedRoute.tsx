/**
 * ProtectedRoute Component
 * Unified route protection with authentication checks
 */
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getCurrentAppConfig } from "../config/appConfigs";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  showLoading?: boolean;
}

const ProtectedRoute = ({
  children,
  requiredRoles = [],
  fallback = null,
  redirectTo = "/auth/login",
  showLoading = true,
}: ProtectedRouteProps) => {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const appConfig = getCurrentAppConfig();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated && !fallback) {
      navigate(redirectTo, { state: { from: location.pathname } });
    }
  }, [
    loading,
    isAuthenticated,
    navigate,
    redirectTo,
    fallback,
    location.pathname,
  ]);

  // Show loading state
  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  // Check role permissions
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role ?? "");

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don&apos;t have permission to access this page. Required
              role(s): {requiredRoles.join(", ")}
            </p>
            <button
              onClick={() => navigate(-1)}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-linear-to-r ${appConfig.branding.gradientFrom} ${appConfig.branding.gradientTo} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${appConfig.branding.focusRing}`}
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;
