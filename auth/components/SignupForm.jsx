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

// Dynamic import for enhanced auth service based on environment
const getAuthService = async () => {
  try {
    // Try to import the shared auth service
    const { default: authService } = await import(
      '../services/authService.js'
    );
    return authService;
  } catch (_error) {
    // console.warn('Enhanced auth service not available, using mock methods');
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
  authService: providedAuthService = null, // Allow injecting auth service for testing
}) => {
  const navigate = useNavigate();
  const appConfig = getCurrentAppConfig();
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

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Update password strength in real time
    if (name === 'password') {
      const strength = getPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  // Email validation and availability check on blur
  const handleEmailBlur = async () => {
    if (formData.email) {
      // First validate email format
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        setErrors((prev) => ({
          ...prev,
          email: emailValidation.error,
        }));
        return;
      }

      // Clear any existing email errors
      setErrors((prev) => ({
        ...prev,
        email: '',
      }));

      // Check availability if auth service is ready
      if (authService) {
        setEmailChecking(true);
        try {
          const result = await authService.checkEmailAvailability(
            formData.email,
          );
          if (!result.available) {
            setErrors((prev) => ({
              ...prev,
              email: 'Email is already registered',
            }));
          }
        } catch (_error) {
          // console.error('Email availability check failed:', error);
        } finally {
          setEmailChecking(false);
        }
      }
    }
  };

  // Password confirmation validation on blur
  const handleConfirmPasswordBlur = () => {
    if (formData.password && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: 'Passwords do not match',
        }));
      } else {
        // Clear error if passwords match
        setErrors((prev) => ({
          ...prev,
          confirmPassword: '',
        }));
      }
    }
  };

  // Password validation on blur
  const handlePasswordBlur = () => {
    if (formData.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        setErrors((prev) => ({
          ...prev,
          password: passwordError,
        }));
      } else {
        // Clear error if password is valid
        setErrors((prev) => ({
          ...prev,
          password: '',
        }));
      }
    }
  };

  // OAuth signup handlers
  const handleGoogleSignup = async () => {
    if (!authService) return;

    try {
      setIsSubmitting(true);
      const result = await authService.googleSignup();
      if (result.success) {
        navigate('/onboarding');
      }
    } catch (_error) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || 'Google signup failed',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = {};

    const firstNameError = validateName(formData.firstName, 'First name');
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateName(formData.lastName, 'Last name');
    if (lastNameError) newErrors.lastName = lastNameError;

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) newErrors.email = emailValidation.error;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
    if (_onSubmit) {
      // Use provided onSubmit callback (for testing or custom handling)
      setIsSubmitting(true);
      try {
        const submitData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          acceptTerms: formData.agreeToTerms,
        };
        await _onSubmit(submitData);
      } catch (_error) {
        setErrors((prev) => ({
          ...prev,
          general: error.message || 'Registration failed',
        }));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!authService) {
      // Auth service not ready, just show form validation worked
      // console.log('Form validation passed, auth service initializing...');
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
        general: error.message || 'Registration failed',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className='bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8'>
        {/* App branding */}
        <div className='text-center mb-8'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
            Join {appConfig.appName}
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Create your account to get started
          </p>
        </div>

        {/* Error message */}
        {(error || errors.general) && (
          <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md'>
            <p className='text-sm text-red-600 dark:text-red-400'>
              {error || errors.general}
            </p>
          </div>
        )}

        {/* OAuth Signup Buttons */}
        <div className='mb-6'>
          <button
            type='button'
            onClick={handleGoogleSignup}
            disabled={isSubmitting}
            className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
              <path
                fill='#4285F4'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='#34A853'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='#FBBC05'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='#EA4335'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Sign up with Google
          </button>

          <div className='mt-6 relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-300 dark:border-gray-600' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'>
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6' role='form'>
          {/* Name fields */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='firstName'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                First name
              </label>
              <input
                id='firstName'
                name='firstName'
                type='text'
                autoComplete='given-name'
                required
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.firstName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : `border-gray-300 ${appConfig.branding.focusRing} focus:border-brand-500`
                  }`}
                placeholder='First name'
              />
              {errors.firstName && (
                <p
                  role='alert'
                  className='mt-1 text-sm text-red-600 dark:text-red-400'
                >
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='lastName'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                Last name
              </label>
              <input
                id='lastName'
                name='lastName'
                type='text'
                autoComplete='family-name'
                required
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.lastName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : `border-gray-300 ${appConfig.branding.focusRing} focus:border-brand-500`
                  }`}
                placeholder='Last name'
              />
              {errors.lastName && (
                <p
                  role='alert'
                  className='mt-1 text-sm text-red-600 dark:text-red-400'
                >
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email field */}
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Email address
            </label>
            <div className='relative'>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : `border-gray-300 ${appConfig.branding.focusRing} focus:border-brand-500`
                  }`}
                placeholder='Enter your email'
              />
              {emailChecking && (
                <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                  <div className='animate-spin h-4 w-4 text-gray-400'>
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24'>
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            {errors.email && (
              <p
                role='alert'
                className='mt-1 text-sm text-red-600 dark:text-red-400'
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Password
            </label>
            <input
              id='password'
              name='password'
              type='password'
              autoComplete='new-password'
              required
              value={formData.password}
              onChange={handleChange}
              onBlur={handlePasswordBlur}
              className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.password
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : `border-gray-300 ${appConfig.branding.focusRing} focus:border-brand-500`
                }`}
              placeholder='Create a password'
            />

            {/* Password Strength Indicator */}
            {formData.password && passwordStrength && (
              <div className='mt-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Password strength:
                  </span>
                  <span
                    className={`font-medium ${passwordStrength.color === 'red'
                        ? 'text-red-600'
                        : passwordStrength.color === 'orange'
                          ? 'text-orange-600'
                          : passwordStrength.color === 'yellow'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className='mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color === 'red'
                        ? 'bg-red-500'
                        : passwordStrength.color === 'orange'
                          ? 'bg-orange-500'
                          : passwordStrength.color === 'yellow'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                    style={{
                      width: `${passwordStrength.label === 'Weak'
                          ? 25
                          : passwordStrength.label === 'Fair'
                            ? 50
                            : passwordStrength.label === 'Good'
                              ? 75
                              : 100
                        }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {errors.password && (
              <p
                role='alert'
                className='mt-1 text-sm text-red-600 dark:text-red-400'
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password field */}
          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Confirm password
            </label>
            <input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              autoComplete='new-password'
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleConfirmPasswordBlur}
              className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.confirmPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : `border-gray-300 ${appConfig.branding.focusRing} focus:border-brand-500`
                }`}
              placeholder='Confirm your password'
            />
            {errors.confirmPassword && (
              <p
                role='alert'
                className='mt-1 text-sm text-red-600 dark:text-red-400'
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms and conditions */}
          <div>
            <div className='flex items-start'>
              <input
                id='agreeToTerms'
                name='agreeToTerms'
                type='checkbox'
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className={`h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded ${appConfig.branding.accentColor} mt-1`}
              />
              <label
                htmlFor='agreeToTerms'
                className='ml-2 block text-sm text-gray-700 dark:text-gray-300'
              >
                I agree to the{' '}
                <a
                  href='/terms'
                  className='text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300'
                >
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a
                  href='/privacy'
                  className='text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300'
                >
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p
                role='alert'
                className='mt-1 text-sm text-red-600 dark:text-red-400'
              >
                {errors.agreeToTerms}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type='submit'
            disabled={isLoading || isSubmitting}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r ${appConfig.branding.gradientFrom} ${appConfig.branding.gradientTo} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${appConfig.branding.focusRing} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading || isSubmitting ? (
              <div className='flex items-center'>
                <div className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'>
                  <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                </div>
                Creating account...
              </div>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Login link */}
        <div className='mt-6 text-center'>
          <span className='text-sm text-gray-600 dark:text-gray-400'>
            Already have an account?{' '}
            <button
              type='button'
              onClick={onLogin}
              className='text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 font-medium'
            >
              Sign in
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

SignupForm.propTypes = {
  _onSubmit: PropTypes.func,
  onLogin: PropTypes.func,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
  authService: PropTypes.object,
};

export default SignupForm;
