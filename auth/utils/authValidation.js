/**
 * Authentication Validation Utilities
 *
 * Provides client-side validation for authentication forms and data.
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return { isValid: false, error: "Email is required" };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true };
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

  if (!password) return { isValid: false, error: "Password is required" };

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
};

/**
 * Calculate password strength score
 */
export const calculatePasswordStrength = (password) => {
  if (!password) return 0;

  let score = 0;

  // Length bonus
  score += Math.min(password.length * 2, 20);

  // Character variety bonus
  if (/[a-z]/.test(password)) score += 5;
  if (/[A-Z]/.test(password)) score += 5;
  if (/\d/.test(password)) score += 5;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 10; // Common patterns

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
 * Sanitize user input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 1000); // Limit length
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
