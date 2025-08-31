/**
 * AuthLayout Component
 * Unified authentication layout with app-specific branding
 */
import React from "react";
import { getCurrentAppConfig } from "../config/appConfigs.js";

const AuthLayout = ({
  children,
  showLogo = true,
  showBackground = true,
  className = "",
}) => {
  const appConfig = getCurrentAppConfig();

  return (
    <div className={`min-h-screen flex ${className}`}>
      {/* Background Pattern */}
      {showBackground && (
        <div className="hidden lg:flex lg:flex-1 lg:relative">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${appConfig.branding.gradientFrom} ${appConfig.branding.gradientTo}`}
          >
            {/* Pattern overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-10">
              <svg
                className="absolute inset-0 h-full w-full"
                fill="none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
          </div>

          {/* Content overlay */}
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <div className="text-white">
              {showLogo && (
                <div className="mb-8">
                  <h1 className="text-4xl font-bold mb-4">
                    {appConfig.appName}
                  </h1>
                  <div className="w-20 h-1 bg-white bg-opacity-30 rounded"></div>
                </div>
              )}

              <div className="space-y-6">
                <h2 className="text-3xl font-light">Welcome to our platform</h2>
                <p className="text-xl text-white text-opacity-90 max-w-md">
                  Secure, reliable, and built with your privacy in mind.
                </p>

                <div className="space-y-4 text-white text-opacity-80">
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Secure authentication</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Privacy protected</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Always available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          {showLogo && (
            <div className="lg:hidden text-center mb-8">
              <h1
                className={`text-2xl font-bold bg-gradient-to-r ${appConfig.branding.gradientFrom} ${appConfig.branding.gradientTo} bg-clip-text text-transparent`}
              >
                {appConfig.appName}
              </h1>
            </div>
          )}

          {children}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2024 {appConfig.appName}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
