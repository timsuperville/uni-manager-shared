import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../utils/authValidation.js";
import type { SignupData } from "../types/auth.types.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

type FormType = "login" | "signup" | "forgotPassword";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface ForgotPasswordFormData {
  email: string;
}

type FormData = LoginFormData | SignupFormData | ForgotPasswordFormData;

type FieldErrors = Record<string, string>;

interface UseAuthFormReturn {
  formData: FormData;
  errors: FieldErrors;
  error: string | null;
  success: string | null;
  isLoading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<unknown>;
  resetForm: () => void;
  clearErrors: () => void;
  setError: (msg: string | null) => void;
  setSuccess: (msg: string | null) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Unified hook for authentication forms (login, signup, forgot password).
 */
export const useAuthForm = (formType: FormType = "login"): UseAuthFormReturn => {
  const { login, signup, resetPassword } = useAuth() as {
    login: (email: string, password: string, rememberMe?: boolean) => Promise<unknown>;
    signup: (data: SignupData) => Promise<unknown>;
    resetPassword: (email: string) => Promise<unknown>;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const getInitialFormData = (): FormData => {
    switch (formType) {
      case "signup":
        return {
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          agreeToTerms: false,
        };
      case "forgotPassword":
        return { email: "" };
      case "login":
      default:
        return { email: "", password: "", rememberMe: false };
    }
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) setError(null);
  };

  const validateForm = (): FieldErrors => {
    const data = formData as Record<string, unknown>;
    const newErrors: FieldErrors = {};

    switch (formType) {
      case "signup": {
        const firstNameError = validateName(data["firstName"] as string, "First name");
        if (firstNameError) newErrors["firstName"] = firstNameError;
        const lastNameError = validateName(data["lastName"] as string, "Last name");
        if (lastNameError) newErrors["lastName"] = lastNameError;
        const emailValidation = validateEmail(data["email"] as string);
        if (!emailValidation.isValid) newErrors["email"] = emailValidation.error;
        const passwordError = validatePassword(data["password"] as string);
        if (passwordError) newErrors["password"] = passwordError;
        if (data["password"] !== data["confirmPassword"]) {
          newErrors["confirmPassword"] = "Passwords do not match";
        }
        if (!data["agreeToTerms"]) {
          newErrors["agreeToTerms"] = "You must agree to the terms and conditions";
        }
        break;
      }
      case "forgotPassword": {
        const emailValidation = validateEmail(data["email"] as string);
        if (!emailValidation.isValid) newErrors["email"] = emailValidation.error;
        break;
      }
      case "login":
      default: {
        const emailValidation = validateEmail(data["email"] as string);
        if (!emailValidation.isValid) newErrors["email"] = emailValidation.error;
        const passwordError = validatePassword(data["password"] as string);
        if (passwordError) newErrors["password"] = passwordError;
        break;
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<unknown> => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const data = formData as Record<string, unknown>;

    try {
      let result: unknown;

      switch (formType) {
        case "signup": {
          result = await signup({
            firstName: data["firstName"] as string,
            lastName: data["lastName"] as string,
            email: data["email"] as string,
            password: data["password"] as string,
          });
          break;
        }
        case "forgotPassword": {
          result = await resetPassword(data["email"] as string);
          setSuccess("Password reset link sent to your email");
          break;
        }
        case "login":
        default: {
          result = await login(
            data["email"] as string,
            data["password"] as string,
            data["rememberMe"] as boolean,
          );
          break;
        }
      }

      return result;
    } catch (err) {
      if (mounted.current) {
        setError(
          err instanceof Error ? err.message : "An error occurred. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setErrors({});
    setError(null);
    setSuccess(null);
  };

  const clearErrors = () => {
    setErrors({});
    setError(null);
  };

  return {
    formData,
    errors,
    error,
    success,
    isLoading,
    handleChange,
    handleSubmit,
    resetForm,
    clearErrors,
    setError,
    setSuccess,
  };
};

export default useAuthForm;
