import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormData, string>>;

// NOTE: simulateLogin is a dev/demo stub only. In production flows each app
// shell calls its AuthService directly. This hook intentionally remains for
// local development parity.
interface SimulatedUser {
  id: string;
  email: string;
  name: string;
  appType: string;
}

interface SimulateLoginResult {
  success: boolean;
  user?: SimulatedUser;
  error?: string;
}

export interface UseLoginResult {
  formData: LoginFormData;
  errors: LoginFormErrors;
  isLoading: boolean;
  updateField: (name: keyof LoginFormData, value: string | boolean) => void;
  validateForm: () => boolean;
  simulateLogin: (appType: string) => Promise<SimulateLoginResult>;
  resetForm: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const INITIAL_FORM: LoginFormData = {
  email: "",
  password: "",
  rememberMe: false,
};

/**
 * Custom hook for handling login form logic.
 * Provides form state management, validation, and a dev/demo simulateLogin stub.
 */
export function useLogin(): UseLoginResult {
  const [formData, setFormData] = useState<LoginFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (
    name: keyof LoginFormData,
    value: string | boolean,
  ): void => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Dev/demo stub — production shells use their own AuthService
  const simulateLogin = async (
    appType: string,
  ): Promise<SimulateLoginResult> => {
    setIsLoading(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 1_000));
      if (formData.email && formData.password.length >= 8) {
        return {
          success: true,
          user: {
            id: "1",
            email: formData.email,
            name: formData.email.split("@")[0],
            appType,
          },
        };
      }
      throw new Error("Invalid credentials");
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (): void => {
    setFormData(INITIAL_FORM);
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
