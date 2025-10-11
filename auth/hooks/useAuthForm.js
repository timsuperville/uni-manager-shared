/**
 * useAuthForm Hook
 * Unified hook for handling authentication forms with validation and state management
 */
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../utils/authValidation.js";

export const useAuthForm = (formType = "login") => {
  const { login, signup, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initial form data based on form type
  const getInitialFormData = () => {
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
        return {
          email: "",
        };
      case "login":
      default:
        return {
          email: "",
          password: "",
          rememberMe: false,
        };
    }
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear global error
    if (error) {
      setError(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    switch (formType) {
      case "signup": {
        const firstNameError = validateName(formData.firstName, "First name");
        if (firstNameError) newErrors.firstName = firstNameError;

        const lastNameError = validateName(formData.lastName, "Last name");
        if (lastNameError) newErrors.lastName = lastNameError;

        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) newErrors.email = emailValidation.error;

        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;

        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }

        if (!formData.agreeToTerms) {
          newErrors.agreeToTerms = "You must agree to the terms and conditions";
        }
        break;
      }
      case "forgotPassword": {
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) newErrors.email = emailValidation.error;
        break;
      }
      case "login":
      default: {
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) newErrors.email = emailValidation.error;

        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;
        break;
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;

      switch (formType) {
        case "signup": {
          const submitData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
          };
          result = await signup(submitData);
          break;
        }
        case "forgotPassword": {
          result = await resetPassword(formData.email);
          setSuccess("Password reset link sent to your email");
          break;
        }
        case "login":
        default: {
          result = await login(
            formData.email,
            formData.password,
            formData.rememberMe,
          );
          break;
        }
      }

      return result;
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
      return false;
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
