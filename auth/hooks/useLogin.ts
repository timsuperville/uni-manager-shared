import { useCallback, useState } from "react";
import { useAuth } from "./useAuth.ts";
import type { LoginFormData } from "../types/auth.types.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseLoginReturn {
  form: LoginFormData;
  isLoading: boolean;
  error: string | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const INITIAL_FORM: LoginFormData = {
  email: "",
  password: "",
  rememberMe: false,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Login hook with form management.
 * Handles form state, validation, and submission.
 */
export function useLogin(): UseLoginReturn {
  const { login: authLogin, isLoading, error } = useAuth();

  const [form, setForm] = useState<LoginFormData>(INITIAL_FORM);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setLocalError(null);
  }, []);

  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM);
    setLocalError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e?.preventDefault?.();

      if (!form.email || !form.password) {
        setLocalError("Email and password are required");
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
        const message = err instanceof Error ? err.message : "Login failed";
        setLocalError(message);
        throw err;
      }
    },
    [form, authLogin, handleReset],
  );

  const handleClearError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    form,
    isLoading,
    error: localError ?? error ?? null,
    handleChange,
    handleSubmit,
    clearError: handleClearError,
    reset: handleReset,
  };
}

export default useLogin;
