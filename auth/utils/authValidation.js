/**
 * Authentication Validation Utilities
 *
 * Provides client-side validation for authentication forms and data.
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return "Email is required";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }

  return null; // No error
};

/**
 * Validate password strength
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  if (!password) return "Password is required";

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("uppercase letter");
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("lowercase letter");
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push("number");
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("special character");
  }

  if (errors.length > 1) {
    const lastError = errors.pop();
    return `Password must contain at least one ${errors.join(", ")} and ${lastError}`;
  } else if (errors.length === 1) {
    return `Password must contain at least one ${errors[0]}`;
  }

  return null; // No error
};

/**
 * Calculate password strength score
 */
export const calculatePasswordStrength = (password) => {
  if (!password) return 0;

  let score = 0;

  // Length bonus - more generous scoring
  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 15;

  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;

  // Complexity bonus
  const varietyCount = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
  ].filter(Boolean).length;

  if (varietyCount >= 3) score += 10;
  if (varietyCount >= 4) score += 20;

  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 15; // Repeated characters
  if (/123|abc|qwe|password/i.test(password)) score -= 20; // Common patterns

  // Normalize to 0-100
  return Math.max(0, Math.min(100, score));
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (strength) => {
  if (strength < 30) return { label: "Weak", color: "red" };
  if (strength < 60) return { label: "Fair", color: "orange" };
  if (strength < 80) return { label: "Good", color: "yellow" };
  return { label: "Strong", color: "green" };
};

/**
 * Validate login credentials
 */
export const validateCredentials = ({ email, password }) => {
  const errors = [];

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error);
  }

  if (!password) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate signup data
 */
export const validateSignupData = ({
  name,
  email,
  password,
  confirmPassword,
}) => {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  if (password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  return {
    isValid: errors.length === 0,
    errors,
    passwordStrength: passwordValidation.strength,
  };
};

/**
 * Validate reset password data
 */
export const validateResetPassword = ({ password, confirmPassword, token }) => {
  const errors = [];

  if (!token) {
    errors.push("Reset token is required");
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  if (password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  return {
    isValid: errors.length === 0,
    errors,
    passwordStrength: passwordValidation.strength,
  };
};

/**
 * Validate authentication response data
 */
export const validateAuthData = (authData) => {
  if (!authData) return { isValid: false, error: "No auth data provided" };

  const { user, accessToken } = authData;

  if (!user) return { isValid: false, error: "User data missing" };
  if (!user.email) return { isValid: false, error: "User email missing" };
  if (!accessToken) return { isValid: false, error: "Access token missing" };

  return { isValid: true };
};

/**
 * Validate name field
 */
export const validateName = (name, fieldName = "Name") => {
  if (!name) return `${fieldName} is required`;

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }

  if (trimmedName.length > 50) {
    return `${fieldName} must be less than 50 characters`;
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }

  return null; // No error
};

/**
 * Get password strength assessment
 */
export const getPasswordStrength = (password) => {
  const strength = calculatePasswordStrength(password);
  return getPasswordStrengthLabel(strength);
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors) => {
  if (!Array.isArray(errors)) return [];

  return errors.map((error) => ({
    message: error,
    type: "validation",
  }));
};
