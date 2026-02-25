/**
 * ForgotPasswordForm Component
 * Unified forgot password form with app-specific branding
 */
import React, { useState } from "react";
import { validateEmail } from "../utils/authValidation.js";
import { getCurrentAppConfig } from "../config/appConfigs.js";
import {
  AuthContainer,
  AuthCardContent,
  AuthButton,
  AuthInput,
  Alert,
} from "./_authUI";

const ForgotPasswordForm = ({
  onSubmit,
  onBackToLogin,
  isLoading = false,
  error = null,
  success = null,
  className = "",
}) => {
  const appConfig = getCurrentAppConfig();
  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = {};

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) newErrors.email = emailValidation.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
    onSubmit(formData);
  };

  return (
    <AuthContainer maxWidth="md">
      <AuthCardContent>
        {/* Back button */}
        <button
          type="button"
          onClick={onBackToLogin}
          className="mb-6 sm:mb-8 flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to sign in
        </button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔒</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Reset your password
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        {/* Success message */}
        {success && <Alert type="success" message={success} className="mb-6" />}

        {/* Error message */}
        {error && <Alert type="error" message={error} className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Email field */}
          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Email address"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            error={errors.email}
            required
            autoComplete="email"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />

          {/* Submit button */}
          <div className="pt-2">
            <AuthButton
              type="submit"
              disabled={isLoading || !formData.email}
              loading={isLoading}
              variant="primary"
            >
              {isLoading ? "Sending reset link..." : "Send reset link"}
            </AuthButton>
          </div>
        </form>

        {/* Additional help */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Remember your password?{" "}
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-semibold underline underline-offset-2"
            >
              Sign in
            </button>
          </p>
        </div>
      </AuthCardContent>
    </AuthContainer>
  );
};

export default ForgotPasswordForm;
