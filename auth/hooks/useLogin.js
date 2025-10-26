/**
 * useLogin - Login Functionality Hook
 *
 * Specialized hook for login operations.
 * Handles form state, validation, and submission.
 *
 * @module hooks/useLogin
 * @example
 * const { email, password, isLoading, error, handleChange, handleSubmit } = useLogin();
 */

import { useCallback, useState } from 'react';
import { useAuth } from './useAuth.js';

/**
 * @typedef {Object} LoginFormState
 * @property {string} email - Email input value
 * @property {string} password - Password input value
 * @property {boolean} rememberMe - Remember me checkbox
 */

/**
 * @typedef {Object} UseLoginReturn
 * @property {LoginFormState} form - Form state
 * @property {boolean} isLoading - Is login in progress
 * @property {string|null} error - Error message
 * @property {Function} handleChange - Handle form input change
 * @property {Function} handleSubmit - Handle form submission
 * @property {Function} clearError - Clear error message
 * @property {Function} reset - Reset form to initial state
 */

/**
 * Login hook with form management
 *
 * @returns {UseLoginReturn} Login form state and handlers
 */
export function useLogin() {
  const { login: authLogin, isLoading, error } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [localError, setLocalError] = useState(null);

  /**
   * Handle form input change
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setLocalError(null);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();

    if (!form.email || !form.password) {
      setLocalError('Email and password are required');
      return;
    }

    try {
      await authLogin({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
      });
      handleReset();
    } catch (err) {
      setLocalError(err.message || 'Login failed');
      throw err;
    }
  }, [form, authLogin]);

  /**
   * Clear error message
   */
  const handleClearError = useCallback(() => {
    setLocalError(null);
  }, []);

  /**
   * Reset form to initial state
   */
  const handleReset = useCallback(() => {
    setForm({
      email: '',
      password: '',
      rememberMe: false,
    });
    setLocalError(null);
  }, []);

  return {
    form,
    isLoading,
    error: localError || error,
    handleChange,
    handleSubmit,
    clearError: handleClearError,
    reset: handleReset,
  };
}

export default useLogin;
