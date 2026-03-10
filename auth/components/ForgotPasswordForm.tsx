/**
 * ForgotPasswordForm — Email-only reset request form.
 * Works both standalone (legacy) and nested inside AuthLayout.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { validateEmail } from "../utils/authValidation.ts";
import {
  AuthContainer,
  AuthCardContent,
  AuthButton,
  AuthInput,
  Alert,
} from "./_authUI";

// Seconds to wait before auto-redirecting to login after a successful submission
const SUCCESS_REDIRECT_DELAY = 5;

interface ForgotPasswordFormProps {
  onSubmit?: (payload: { email: string }) => void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
}

const ForgotPasswordForm = ({
  onSubmit,
  onBackToLogin,
  isLoading = false,
  error = null,
  success = null,
}: ForgotPasswordFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);

  // After success, start a countdown and auto-redirect to login
  useEffect(() => {
    if (!success) return;
    setCountdown(SUCCESS_REDIRECT_DELAY);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          navigate("/auth/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, navigate]);

  const handleBack = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      // Safe fallback: always stay in-app, never use navigate(-1)
      navigate("/auth/login");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError("");

    const { isValid, errors: validationErrors } = validateEmail(email);
    if (!isValid) {
      setLocalError(validationErrors?.[0] ?? "Invalid email address");
      return;
    }

    if (!onSubmit) {
      if (import.meta.env?.DEV) {
        console.error(
          "[ForgotPasswordForm] No onSubmit handler provided. " +
            "Use the app-specific wrapper (e.g. ForgotPasswordWrapper) " +
            "rather than the raw shared component directly.",
        );
      }
      return;
    }

    onSubmit({ email });
  };

  const displayError = error || localError;

  return (
    <AuthContainer maxWidth="md">
      <AuthCardContent>
        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors -mt-1 mb-1"
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        <div className="text-center">
          <div className="text-4xl mb-3" aria-hidden="true">
            🔒
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {/* Alerts */}
        {success && (
          <Alert
            type="success"
            message={
              countdown !== null
                ? `${success} Redirecting to sign in in ${countdown}s…`
                : success
            }
          />
        )}
        {displayError && !success && (
          <Alert type="error" message={displayError} />
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              id="forgot-email"
              name="email"
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLocalError("");
              }}
              placeholder="Enter your email address"
              error={localError}
              required
              autoComplete="email"
              autoFocus
              icon={
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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

            <div className="pt-1">
              <AuthButton
                type="submit"
                disabled={isLoading || !email}
                loading={isLoading}
                variant="primary"
              >
                {isLoading ? "Sending reset link…" : "Send reset link"}
              </AuthButton>
            </div>
          </form>
        )}

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {"Remember your password? "}
          <button
            type="button"
            onClick={handleBack}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
          >
            Sign in
          </button>
        </p>
      </AuthCardContent>
    </AuthContainer>
  );
};

export default ForgotPasswordForm;
