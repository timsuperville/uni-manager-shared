import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { getCurrentAppConfig } from "../config/appConfigs.js";

/**
 * OAuth Callback Handler Component
 * Handles OAuth provider callbacks and redirects users appropriately
 * Preserves Church app functionality while standardizing OAuth flow
 */
const OAuthCallback = ({ onSuccess, onError, redirectPath = "/" }) => {
  const { handleOAuthCallback, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse URL parameters
        const urlParams =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();

        // Check for OAuth error
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        if (error) {
          const errorMsg = errorDescription || `OAuth error: ${error}`;
          setStatus("error");
          setMessage(errorMsg);

          if (onError) {
            onError(new Error(errorMsg));
          }
          return;
        }

        // Check for authorization code
        const code = urlParams.get("code");
        if (!code) {
          const errorMsg = "No authorization code received";
          setStatus("error");
          setMessage(errorMsg);

          if (onError) {
            onError(new Error(errorMsg));
          }
          return;
        }

        setMessage("Exchanging authorization code...");

        // Handle OAuth callback
        const authData = await handleOAuthCallback(urlParams);

        setStatus("success");
        setMessage("Authentication successful! Redirecting...");

        if (onSuccess) {
          onSuccess(authData);
        } else {
          // Use React Router navigate — preserves SPA state, no hard reload
          setTimeout(() => navigate(redirectPath), 1500);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("OAuth callback error:", error);
        }
        setStatus("error");
        setMessage(error.message || "Authentication failed");

        if (onError) {
          onError(error);
        }
      }
    };

    processCallback();
  }, [handleOAuthCallback, onSuccess, onError, redirectPath]);

  const appConfig = getCurrentAppConfig();
  const brandColor = appConfig.branding.primaryColor;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {/* App Logo */}
          <div
            className="mx-auto h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4"
            style={{ backgroundColor: brandColor }}
          >
            {appConfig.appName.charAt(0).toUpperCase()}
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            {appConfig.appName}
          </h2>

          <div className="mb-6">
            {status === "processing" && (
              <div className="flex items-center justify-center space-x-2">
                <div
                  className="animate-spin rounded-full h-6 w-6 border-b-2"
                  style={{ borderColor: brandColor }}
                ></div>
                <span className="text-gray-600">Processing...</span>
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Success!</span>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Error</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">{message}</p>

          {status === "error" && (
            <div className="space-y-4">
              <button
                onClick={() => navigate("/auth/login")}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: brandColor,
                }}
              >
                Back to Login
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Go Home
              </button>
            </div>
          )}

          {status === "processing" && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: brandColor,
                    width: loading ? "60%" : "100%",
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
