/**
 * Authentication Validation Utilities
 *
 * Client-side validation for authentication forms and data.
 * All functions are pure — no side effects, no I/O.
 */

import type { ValidationResult } from "../types/auth.types.js";

// ---------------------------------------------------------------------------
// Internal result shapes
// ---------------------------------------------------------------------------

interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

interface PasswordValidationResult {
  isValid: boolean;
  error: string | null;
  strength?: number;
}

interface CredentialsInput {
  email: string;
  password: string;
}

interface SignupInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ResetPasswordInput {
  password: string;
  confirmPassword: string;
  token: string;
}

interface AuthDataInput {
  user?: { email?: string } | null;
  accessToken?: string | null;
}

interface StrengthLabel {
  label: "Weak" | "Fair" | "Good" | "Strong";
  color: "red" | "orange" | "yellow" | "green";
}

interface PasswordStrength {
  score: 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

interface FormattedError {
  message: string;
  type: "validation";
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/** Returns true if the email passes basic RFC format validation. */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, errors: { email: "Email is required" } };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, errors: { email: "Please enter a valid email address" } };
  }

  return { isValid: true, errors: {} };
};

/** Validates password against configurable strength requirements. */
export const validatePassword = (
  password: string,
  options: PasswordValidationOptions = {},
): PasswordValidationResult => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  const errors: string[] = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }
  if (requireUppercase && !/[A-Z]/.test(password)) errors.push("uppercase letter");
  if (requireLowercase && !/[a-z]/.test(password)) errors.push("lowercase letter");
  if (requireNumbers && !/\d/.test(password)) errors.push("number");
  if (requireSpecialChars && !/[!@#$%^&*(),.?':{}|<>]/.test(password)) errors.push("special character");

  if (errors.length > 1) {
    const lastError = errors.pop()!;
    return {
      isValid: false,
      error: `Password must contain at least one ${errors.join(", ")} and ${lastError}`,
    };
  }
  if (errors.length === 1) {
    return { isValid: false, error: `Password must contain at least one ${errors[0]!}` };
  }

  return { isValid: true, error: null };
};

/** Returns a 0-100 score representing password strength. */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;

  let score = 0;

  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 15;

  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;

  const varietyCount = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
  ].filter(Boolean).length;

  if (varietyCount >= 3) score += 10;
  if (varietyCount >= 4) score += 20;

  if (/(.)\\1{2,}/.test(password)) score -= 15;
  if (/123|abc|qwe|password/i.test(password)) score -= 20;

  return Math.max(0, Math.min(100, score));
};

/** Returns a human-readable label for a 0-100 strength score. */
export const getPasswordStrengthLabel = (strength: number): StrengthLabel => {
  if (strength < 30) return { label: "Weak", color: "red" };
  if (strength < 60) return { label: "Fair", color: "orange" };
  if (strength < 80) return { label: "Good", color: "yellow" };
  return { label: "Strong", color: "green" };
};

/** Validates both email and password for login. */
export const validateCredentials = ({ email, password }: CredentialsInput) => {
  const errors: string[] = [];

  const emailResult = validateEmail(email);
  if (!emailResult.isValid && emailResult.errors.email) errors.push(emailResult.errors.email);
  if (!password) errors.push("Password is required");

  return { isValid: errors.length === 0, errors };
};

/** Full signup form validation. */
export const validateSignupData = ({ name, email, password, confirmPassword }: SignupInput) => {
  const errors: string[] = [];

  if (!name || name.trim().length < 2) errors.push("Name must be at least 2 characters");

  const emailResult = validateEmail(email);
  if (!emailResult.isValid && emailResult.errors.email) errors.push(emailResult.errors.email);

  const passwordResult = validatePassword(password);
  if (!passwordResult.isValid && passwordResult.error) errors.push(passwordResult.error);

  if (password !== confirmPassword) errors.push("Passwords do not match");

  return {
    isValid: errors.length === 0,
    errors,
    passwordStrength: calculatePasswordStrength(password),
  };
};

/** Validates the reset-password form (token + new password). */
export const validateResetPassword = ({ password, confirmPassword, token }: ResetPasswordInput) => {
  const errors: string[] = [];

  if (!token) errors.push("Reset token is required");

  const passwordResult = validatePassword(password);
  if (!passwordResult.isValid && passwordResult.error) errors.push(passwordResult.error);

  if (password !== confirmPassword) errors.push("Passwords do not match");

  return { isValid: errors.length === 0, errors };
};

/** Validates that an auth data payload contains the required fields. */
export const validateAuthData = (authData: AuthDataInput | null | undefined) => {
  if (!authData) return { isValid: false, error: "No auth data provided" };

  const { user, accessToken } = authData;

  if (!user) return { isValid: false, error: "User data missing" };
  if (!user.email) return { isValid: false, error: "User email missing" };
  if (!accessToken) return { isValid: false, error: "Access token missing" };

  return { isValid: true, error: null };
};

/** Validates a name field (letters, spaces, hyphens, apostrophes; 2-50 chars). */
export const validateName = (name: string, fieldName = "Name") => {
  if (!name) return { isValid: false, error: `${fieldName} is required` };

  const trimmedName = name.trim();
  if (trimmedName.length < 2) return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  if (trimmedName.length > 50) return { isValid: false, error: `${fieldName} must be less than 50 characters` };
  if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }

  return { isValid: true, error: null };
};

/**
 * Returns a score (1-4) and label for a password string.
 * The score maps to the 4-bar strength UI in SignupForm.
 */
export const getPasswordStrength = (password: string): PasswordStrength => {
  const strength = calculatePasswordStrength(password);
  const { label, color } = getPasswordStrengthLabel(strength);
  const score = (strength < 30 ? 1 : strength < 50 ? 2 : strength < 75 ? 3 : 4) as 1 | 2 | 3 | 4;
  return { score, label, color };
};

/** Maps a raw error array to the `{ message, type }` shape expected by form UIs. */
export const formatValidationErrors = (errors: string[]): FormattedError[] => {
  if (!Array.isArray(errors)) return [];
  return errors.map((message) => ({ message, type: "validation" as const }));
};

/** @deprecated Use getPasswordStrength */
export const validatePasswordStrength = getPasswordStrength;

/** Returns true if the string matches JWT format (xxx.yyy.zzz). */
export const validateToken = (token: unknown): boolean => {
  if (!token || typeof token !== "string") return false;
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
};

/** Returns true if the code is 4-6 digits. */
export const validateMFACode = (code: unknown): boolean => {
  if (!code || typeof code !== "string") return false;
  return /^\d{4,6}$/.test(code.trim());
};

/** Returns true if the string is a valid 10 or 11-digit phone number. */
export const validatePhoneNumber = (phone: unknown): boolean => {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
};

/** Escapes HTML special characters to prevent XSS. */
export const sanitizeInput = (input: unknown): unknown => {
  if (typeof input !== "string") return input;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};
