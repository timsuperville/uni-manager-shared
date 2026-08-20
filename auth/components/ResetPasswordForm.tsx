/**
 * ResetPasswordForm - Sets a new password using a reset token.
 * Works nested inside AuthLayout and uses namespaced UI inputs and alerts.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatePassword } from '../utils/authValidation';
import {
  AuthContainer,
  AuthCardContent,
  AuthButton,
  AuthInput,
  Alert
} from './_authUI';
import { LockIcon } from '../../components/icons';

// Seconds to wait before auto-redirecting to login after a successful submission
const SUCCESS_REDIRECT_DELAY = 5;

interface ResetPasswordFormProps {
  onSubmit?: (payload: { password: string; confirmPassword: string }) => Promise<void>;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
  token?: string | null;
}

const ResetPasswordForm = ({
  onSubmit,
  onBackToLogin,
  isLoading = false,
  error = null,
  success = null,
  token = null
}: ResetPasswordFormProps) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // After success, start a countdown and auto-redirect to login
  useEffect(() => {
    if (!success) return;
    setCountdown(SUCCESS_REDIRECT_DELAY);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          navigate('/auth/login');
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
      navigate('/auth/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');

    if (!token) {
      setLocalError('Reset token is missing or invalid.');
      return;
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      setLocalError(passwordResult.error ?? 'Invalid password');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!onSubmit) {
      if (import.meta.env?.DEV) {
        console.error(
          '[ResetPasswordForm] No onSubmit handler provided. ' +
            'Use the app-specific wrapper rather than the raw shared component directly.'
        );
      }
      return;
    }

    try {
      await onSubmit({ password, confirmPassword });
    } catch (err: any) {
      // Swallowed here since wrapper updates the error prop
    }
  };

  const displayError = error || localError;

  return (
    <AuthContainer maxWidth="md">
      <AuthCardContent>
        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors -mt-1 mb-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-live-sync,hsl(272,65%,62%))] rounded"
        >
          <svg
            className="w-4.5 h-4.5 shrink-0"
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
          <div
            className="flex justify-center mb-3 text-gray-900 dark:text-white"
            aria-hidden="true"
          >
            <LockIcon size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Set new password
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Please enter your new password below.
          </p>
        </div>

        {/* Alerts */}
        {success && (
          <Alert
            type="success"
            message={
              countdown !== null
                ? `${success} Redirecting to sign in in ${countdown}s.`
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
              id="new-password"
              name="password"
              type="password"
              label="New password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setLocalError('');
              }}
              placeholder="Enter new password"
              error={localError && password === '' ? localError : undefined}
              required
              autoComplete="new-password"
              autoFocus
            />

            <AuthInput
              id="confirm-password"
              name="confirmPassword"
              type="password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setLocalError('');
              }}
              placeholder="Confirm new password"
              error={localError && password !== confirmPassword ? localError : undefined}
              required
              autoComplete="new-password"
            />

            <div className="pt-1">
              <AuthButton
                type="submit"
                disabled={isLoading || !password || !confirmPassword || !token}
                loading={isLoading}
                variant="primary"
              >
                {isLoading ? 'Updating password...' : 'Update password'}
              </AuthButton>
            </div>
          </form>
        )}

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {'Remember your password? '}
          <button
            type="button"
            onClick={handleBack}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-live-sync,hsl(272,65%,62%))] rounded"
          >
            Sign in
          </button>
        </p>
      </AuthCardContent>
    </AuthContainer>
  );
};

export default ResetPasswordForm;