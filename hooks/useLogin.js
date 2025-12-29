/* eslint-env browser */
/* global console, setTimeout */
import { useState } from 'react';

/**
 * Custom hook for handling login form logic
 * Provides form state management and validation
 */
export function useLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const simulateLogin = async (appType) => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate login success for demo purposes
      if (formData.email && formData.password.length >= 8) {
        const userData = {
          id: '1',
          email: formData.email,
          name: formData.email.split('@')[0],
          appType,
        };
        return { success: true, user: userData };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (_error) {
      // console.error('Login error:', _error);
      return { success: false, error: _error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      rememberMe: false,
    });
    setErrors({});
    setIsLoading(false);
  };

  return {
    formData,
    errors,
    isLoading,
    updateField,
    validateForm,
    simulateLogin,
    resetForm,
  };
}
