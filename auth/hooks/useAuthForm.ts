import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../utils/authValidation.ts";
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

type AuthFormData = LoginFormData | SignupFormData | ForgotPasswordFormData;

type FieldErrors = Record<string, string>;

interface UseAuthFormReturn {
  formData: AuthFormData;
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
  const { login, signup, resetPassword } = useAuth() as unknown as {
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

  const getInitialFormData = (): AuthFormData => {
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

  const [formData, setFormData] = useState<AuthFormData>(getInitialFormData);
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
    const data = formData as unknown as Record<string, unknown>;
    const newErrors: FieldErrors = {};

    switch (formType) {
      case "signup": {
        const firstNameResult = validateName(data["firstName"] as string, "First name");
        if (!firstNameResult.isValid) newErrors["firstName"] = firstNameResult.error ?? "Invalid first name";
        const lastNameResult = validateName(data["lastName"] as string, "Last name");
        if (!lastNameResult.isValid) newErrors["lastName"] = lastNameResult.error ?? "Invalid last name";
        const emailValidation = validateEmail(data["email"] as string);
        if (!emailValidation.isValid) newErrors["email"] = emailValidation.errors["email"] ?? "Invalid email";
        const passwordValidation = validatePassword(data["password"] as string);
        if (!passwordValidation.isValid) newErrors["password"] = passwordValidation.error ?? "Invalid password";
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
        if (!emailValidation.isValid) newErrors["email"] = emailValidation.errors["email"] ?? "Invalid email";
        break;
      }
      case "login":
      default: {
        const emailValidation = validateEmail(data["email"] as string);
        if (!emailValidation.isValid) newErrors["email"] = emailValidation.errors["email"] ?? "Invalid email";
        const passwordValidation = validatePassword(data["password"] as string);
        if (!passwordValidation.isValid) newErrors["password"] = passwordValidation.error ?? "Invalid password";
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

    let result: unknown;
    const data = formData as unknown as Record<string, unknown>;
    try {

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
      return undefined;
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
