/**
 * SignupForm Component
 * Unified signup form with app-specific branding
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  validateEmail,
  validatePassword,
  validateName,
  getPasswordStrength,
} from '../utils/authValidation.js';
import { getCurrentAppConfig } from '../config/appConfigs.js';
import {
  AuthContainer,
  AuthCardContent,
  AuthButton,
  OAuthButton,
  AuthInput,
  AuthDivider,
  Alert,
  GoogleIcon,
} from './AuthUIComponents.jsx';

// Dynamic import for enhanced auth service based on environment
const getAuthService = async () => {
  try {
    const { default: authService } = await import('../services/authService.js');
    return authService;
  } catch (_error) {
    return {
      checkEmailAvailability: async (_email) => ({ available: true }),
      signup: async (_data) => ({ success: true, requiresVerification: true }),
      googleSignup: async () => ({ success: true }),
    };
  }
};

const SignupForm = ({
  _onSubmit,
  onLogin,
  isLoading = false,
  error = null,
  className = '',
  authService: providedAuthService = null,
  appType = 'default',
  loginPath = '/auth/login',
}) => {
  const navigate = useNavigate();
  const appConfig = getCurrentAppConfig(appType);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authService, setAuthService] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState('');

  // Initialize auth service
  useEffect(() => {
    const initializeAuthService = async () => {
      if (providedAuthService) {
        setAuthService(providedAuthService);
      } else {
        const service = await getAuthService();
        setAuthService(service);
      }
    };
    initializeAuthService();
  }, [providedAuthService]);

  // Password strength validation
  useEffect(() => {
    if (formData.password) {
      const strength = getPasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleEmailBlur = async () => {
    if (formData.email && authService) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        setErrors((prev) => ({
          ...prev,
          email: emailValidation.error,
        }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        email: '',
      }));

      setEmailChecking(true);
      try {
        const result = await authService.checkEmailAvailability(formData.email);
        if (!result.available) {
          setErrors((prev) => ({
            ...prev,
            email: 'Email is already registered',
          }));
        }
      } catch (_error) {
        // Silent fail on availability check
      } finally {
        setEmailChecking(false);
      }
    }
  };

  const handlePasswordBlur = () => {
    if (formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        setErrors((prev) => ({
          ...prev,
          password: passwordValidation.error,
        }));
      }
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (formData.password && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: 'Passwords do not match',
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: '',
        }));
      }
    }
  };

  const handleGoogleSignup = async () => {
    if (!authService) return;
    try {
      const result = await authService.googleSignup();
      if (result.success) {
        if (result.requiresVerification) {
          navigate('/auth/verify-email');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (_error) {
      setErrors((prev) => ({
        ...prev,
        general: 'Google signup failed',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Validate first name
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid) newErrors.firstName = firstNameValidation.error;

    // Validate last name
    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.isValid) newErrors.lastName = lastNameValidation.error;

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) newErrors.email = emailValidation.error;

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.error;

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!authService) {
      setErrors((prev) => ({
        ...prev,
        general: 'Authentication service not available',
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        acceptTerms: formData.agreeToTerms,
      });

      if (result.success) {
        if (result.requiresVerification) {
          navigate('/auth/verify-email', {
            state: { email: formData.email },
          });
        } else {
          navigate('/onboarding');
        }
      }
    } catch (_error) {
      setErrors((prev) => ({
        ...prev,
        general: error?.message || 'Registration failed',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    formData.agreeToTerms &&
    Object.keys(errors).filter((key) => errors[key]).length === 0;

  const PasswordToggleIcon = ({ show }) => (
    <button
      type="button"
      className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
      onClick={() => (show === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword))}
    >
      {(show === 'password' ? showPassword : showConfirmPassword) ? (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      )}
    </button>
  );

  return (
    <AuthContainer maxWidth="md">
      <AuthCardContent>
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{appConfig.branding.icon}</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Join {appConfig.appName}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create your account to get started
          </p>
        </div>

        {/* Success Message */}
        {success && <Alert type="success" message={success} className="mb-6" />}

        {/* Error message */}
        {(error || errors.general) && (
          <Alert type="error" message={error || errors.general} className="mb-6" />
        )}

        {/* OAuth Signup Buttons */}
        <div>
          <OAuthButton
            provider="Google"
            onClick={handleGoogleSignup}
            disabled={isSubmitting}
            icon={<GoogleIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          >
            Sign up with Google
          </OAuthButton>

          <AuthDivider text="Or continue with email" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" role="form">
          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <AuthInput
              id="firstName"
              name="firstName"
              type="text"
              label="First name"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First name"
              error={errors.firstName}
              required
              autoComplete="given-name"
            />

            <AuthInput
              id="lastName"
              name="lastName"
              type="text"
              label="Last name"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last name"
              error={errors.lastName}
              required
              autoComplete="family-name"
            />
          </div>

          {/* Email field */}
          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Email address"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            placeholder="Enter your email"
            error={errors.email}
            required
            autoComplete="email"
            disabled={emailChecking}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          {/* Password field */}
          <div>
            <AuthInput
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handlePasswordBlur}
              placeholder="Create a password"
              error={errors.password}
              required
              autoComplete="new-password"
              rightElement={<PasswordToggleIcon show="password" />}
            />
            {passwordStrength && formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Password strength:
                  </span>
                  <span className={`text-xs sm:text-sm font-medium ${passwordStrength.score >= 3 ? 'text-green-600 dark:text-green-400' :
                      passwordStrength.score >= 2 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                    }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? 'bg-green-600' :
                        passwordStrength.score >= 2 ? 'bg-yellow-600' :
                          'bg-red-600'
                      }`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <AuthInput
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleConfirmPasswordBlur}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            rightElement={<PasswordToggleIcon show="confirm" />}
          />

          {/* Terms agreement */}
          <div>
            <div className="flex items-start">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="mt-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                {errors.agreeToTerms}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <AuthButton
              type="submit"
              disabled={!isFormValid || isSubmitting}
              loading={isSubmitting}
              variant="primary"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </AuthButton>
          </div>

          {/* Login Link */}
          <div className="text-center pt-2">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
                onClick={() => {
                  if (onLogin) {
                    onLogin();
                  } else {
                    navigate(loginPath);
                  }
                }}
              >
                Sign in
              </button>
            </span>
          </div>
        </form>
      </AuthCardContent>
    </AuthContainer>
  );
};

SignupForm.propTypes = {
  _onSubmit: PropTypes.func,
  onLogin: PropTypes.func,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
  authService: PropTypes.object,
  appType: PropTypes.string,
  loginPath: PropTypes.string,
};

export default SignupForm;
