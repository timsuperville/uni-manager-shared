import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import MFAVerification from './MFAVerification';
import MFASetup from './MFASetup';
import {
  AuthContainer,
  AuthCardContent,
  AuthButton,
  OAuthButton,
  AuthDivider,
  Alert,
  GoogleIcon,
} from './AuthUIComponents.jsx';

/**
 * LoginForm - Main Authentication Form Component
 * Supports:
 * - Multi-factor authentication (MFA) with device trust
 * - Multiple application types with app-specific configurations
 * - Customizable themes and styling
 * - Cross-app compatibility
 */
export function LoginForm({
  // App configuration
  appType = 'default',
  appTitle,
  appDescription,

  // UI customization
  theme = 'default',
  showRememberMe = true,
  showRegistration = false,

  // MFA configuration
  enableMFA = true,
  trustDeviceAvailable = true,

  // Callbacks
  onSuccess,
  onError,

  // Navigation
  redirectPath = '/dashboard',
}) {
  // Auth context
  const {
    login,
    verifyMFALogin,
    isLoading,
    error,
    mfaRequired,
    mfaSetupRequired,
    clearError,
  } = useAuth();

  const navigate = useNavigate();

  // State management
  const [currentStep, setCurrentStep] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [mfaToken, setMfaToken] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  const [trustDevice, setTrustDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  /**
   * App-specific configurations
   * Defines title, icon, colors, and default redirect paths for each application
   */
  const appConfigs = {
    admin: {
      title: 'Admin Portal Access',
      description: 'Sign in to access the administrative dashboard',
      icon: '🔐',
      primaryColor: 'blue',
      defaultRedirect: '/dashboard',
    },
    church: {
      title: 'Church Management',
      description: 'Sign in to manage church services and events',
      icon: '⛪',
      primaryColor: 'purple',
      defaultRedirect: '/services',
    },
    business: {
      title: 'Business Portal',
      description: 'Access your business management tools',
      icon: '💼',
      primaryColor: 'emerald',
      defaultRedirect: '/overview',
    },
    home: {
      title: 'Home Management',
      description: 'Manage your household and family activities',
      icon: '🏠',
      primaryColor: 'amber',
      defaultRedirect: '/dashboard',
    },
    personal: {
      title: 'Personal Dashboard',
      description: 'Access your personal productivity tools',
      icon: '👤',
      primaryColor: 'indigo',
      defaultRedirect: '/dashboard',
    },
    playback: {
      title: 'Media Playback',
      description: 'Control and manage media playback',
      icon: '🎵',
      primaryColor: 'pink',
      defaultRedirect: '/player',
    },
    default: {
      title: 'Sign In',
      description: 'Sign in to your account',
      icon: '🔑',
      primaryColor: 'gray',
      defaultRedirect: '/dashboard',
    },
  };

  // Resolve configuration
  const config = appConfigs[appType] || appConfigs.default;
  const finalTitle = appTitle || config.title;
  const finalDescription = appDescription || config.description;
  const finalRedirectPath = redirectPath || config.defaultRedirect;

  /**
   * Tailwind Safe Color Classes (to ensure JIT generates them)
   */
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    amber: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    pink: 'bg-pink-600 hover:bg-pink-700 focus:ring-pink-500',
    gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
  };

  /**
   * Theme configurations
   * Supports default (system adaptive), dark (forced), and minimal themes
   */
  const themes = {
    default: {
      background: 'bg-gray-50 dark:bg-gray-900',
      container: 'bg-white dark:bg-gray-800 shadow-lg',
      primary: colorClasses[config.primaryColor] || colorClasses.gray,
      text: 'text-gray-900 dark:text-white',
      input: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 shadow-sm',
    },
    dark: {
      background: 'bg-gray-900',
      container: 'bg-gray-800 shadow-2xl',
      primary: colorClasses[config.primaryColor] || colorClasses.gray,
      text: 'text-white',
      input:
        'border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 shadow-sm',
    },
    minimal: {
      background: 'bg-white dark:bg-gray-900',
      container: 'border-2 border-gray-200 dark:border-gray-700',
      primary: colorClasses[config.primaryColor] || colorClasses.gray,
      text: 'text-gray-900 dark:text-white',
      input: 'border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:border-blue-500',
    },
  };

  const currentTheme = themes[theme] || themes.default;

  /**
   * Generate device fingerprint for device trust
   * Creates a unique identifier for the current device
   */
  const generateFingerprint = useCallback(() => {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);

    const fingerprint = [
      typeof navigator !== 'undefined' && navigator.userAgent,
      typeof navigator !== 'undefined' && navigator.language,
      typeof screen !== 'undefined' && (screen.width + 'x' + screen.height),
      typeof Date !== 'undefined' && new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join('|');

    return btoa(fingerprint).slice(0, 32);
  }, []);

  /**
   * Initialize device fingerprint on mount
   */
  useEffect(() => {
    setDeviceFingerprint(generateFingerprint());
  }, [generateFingerprint]);

  /**
   * Monitor MFA state changes and update current step
   */
  useEffect(() => {
    if (enableMFA) {
      if (mfaRequired) {
        setCurrentStep('mfa-verification');
      } else if (mfaSetupRequired) {
        setCurrentStep('mfa-setup');
      }
    }
  }, [mfaRequired, mfaSetupRequired, enableMFA]);

  /**
   * Handle login form submission
   */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      setDebugInfo('Attempting login...');
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        appType,
      });

      setDebugInfo('Login response received');
      if (result.success && !result.mfaRequired && !result.mfaSetupRequired) {
        setDebugInfo('Login successful!');
        if (onSuccess) {
          onSuccess(result);
        } else {
          navigate(finalRedirectPath);
        }
      }
      // MFA flow will be handled by useEffect watching for state changes
    } catch (err) {
      setDebugInfo(`Error: ${err.message || 'Unknown error'} | Type: ${err.name || 'N/A'}`);
      if (onError) {
        onError(err);
      }
    }
  };

  /**
   * Handle MFA verification
   */
  const handleMFAVerification = async (token) => {
    clearError();
    setMfaToken(token);

    try {
      const result = await verifyMFALogin(
        token,
        deviceFingerprint,
        trustDevice
      );

      if (result.success) {
        setCurrentStep('login');
        if (onSuccess) {
          onSuccess(result);
        } else {
          navigate(finalRedirectPath);
        }
      }
    } catch (err) {
      if (onError) {
        onError(err);
      }
    }
  };

  /**
   * Handle MFA setup completion
   */
  const handleMFASetupComplete = () => {
    setCurrentStep('login');
    if (onSuccess) {
      onSuccess({ success: true, mfaSetupCompleted: true });
    } else {
      navigate(finalRedirectPath);
    }
  };

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Handle back to login button
   */
  const handleBackToLogin = () => {
    setCurrentStep('login');
    clearError();
    setMfaToken('');
  };

  // Validation
  const isFormValid = formData.email && formData.password;

  // Render MFA Verification Step
  if (currentStep === 'mfa-verification' && enableMFA) {
    return (
      <AuthContainer maxWidth="md">
        <AuthCardContent>
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 animate-bounce">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Identity</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Enter the code sent to your device
            </p>
          </div>

          <MFAVerification
            onVerify={handleMFAVerification}
            onBack={handleBackToLogin}
            deviceTrust={{
              available: trustDeviceAvailable,
              checked: trustDevice,
              onChange: setTrustDevice,
            }}
            theme={currentTheme}
            config={config}
            isLoading={isLoading}
            error={error}
          />
        </AuthCardContent>
      </AuthContainer>
    );
  }

  // Render MFA Setup Step
  if (currentStep === 'mfa-setup' && enableMFA) {
    return (
      <AuthContainer maxWidth="lg">
        <AuthCardContent>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Secure Your Account</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Set up two-factor authentication for enhanced security
            </p>
          </div>

          <MFASetup
            onSetupComplete={handleMFASetupComplete}
            onSkip={handleMFASetupComplete}
            theme={currentTheme}
            config={config}
          />
        </AuthCardContent>
      </AuthContainer>
    );
  }

  // Render Login Form
  return (
    <AuthContainer maxWidth="md">
      <AuthCardContent>
        {/* Header */}
        <div className='text-center mb-6 sm:mb-8'>
          <div className='text-4xl sm:text-5xl mb-3 sm:mb-4'>{config.icon}</div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold ${currentTheme.text}`}>
            {finalTitle}
          </h2>
          <p className={`mt-2 text-sm ${currentTheme.text} opacity-75`}>
            {finalDescription}
          </p>
        </div>

        {/* OAuth Login */}
        <div>
          <OAuthButton
            provider="Google"
            onClick={() => {
              // TODO: Implement Google OAuth
              console.log('Google login clicked');
            }}
            icon={<GoogleIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          >
            Sign in with Google
          </OAuthButton>

          <AuthDivider text="Or continue with email" />
        </div>

        {/* Form */}
        <form className='space-y-5 sm:space-y-6' onSubmit={handleLoginSubmit}>
          {/* Debug Info */}
          {debugInfo && <Alert type="info" message={`Debug: ${debugInfo}`} />}

          {/* Error Display */}
          {error && <Alert type="error" message={error} />}

          {/* Email Field */}
          <div>
            <label
              htmlFor='email'
              className={`block text-sm font-medium ${currentTheme.text} mb-2`}
            >
              Email address
            </label>
            <input
              id='email'
              name='email'
              type='email'
              autoComplete='email'
              required
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-md ${currentTheme.input} placeholder-gray-400 focus:outline-none focus:ring-2`}
              placeholder='Enter your email address'
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor='password'
              className={`block text-sm font-medium ${currentTheme.text} mb-2`}
            >
              Password
            </label>
            <div className="relative">
              <input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md ${currentTheme.input} placeholder-gray-400 focus:outline-none focus:ring-2 pr-10`}
                placeholder='Enter your password'
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          {showRememberMe && (
            <div className='flex items-center'>
              <input
                id='rememberMe'
                name='rememberMe'
                type='checkbox'
                checked={formData.rememberMe}
                onChange={handleChange}
                className={`h-4 w-4 text-${config.primaryColor}-600 focus:ring-${config.primaryColor}-500 border-gray-300 rounded`}
              />
              <label
                htmlFor='rememberMe'
                className={`ml-2 block text-sm ${currentTheme.text}`}
              >
                Remember me
              </label>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <AuthButton
              type="submit"
              disabled={!isFormValid || isLoading}
              loading={isLoading}
              variant="primary"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </AuthButton>
          </div>

          {/* Registration Link */}
          {showRegistration && (
            <div className='text-center pt-2'>
              <span className={`text-sm sm:text-base ${currentTheme.text} opacity-75`}>
                Don't have an account?{' '}
                <button
                  type='button'
                  className={`font-semibold text-${config.primaryColor}-600 hover:text-${config.primaryColor}-500 underline underline-offset-2`}
                  onClick={() => navigate('/auth/register')}
                >
                  Create account
                </button>
              </span>
            </div>
          )}
        </form>
      </AuthCardContent>
    </AuthContainer>
  );
}

LoginForm.propTypes = {
  appType: PropTypes.oneOf([
    'admin',
    'church',
    'business',
    'home',
    'personal',
    'playback',
    'default',
  ]),
  appTitle: PropTypes.string,
  appDescription: PropTypes.string,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  theme: PropTypes.oneOf(['default', 'dark', 'minimal']),
  redirectPath: PropTypes.string,
  showRememberMe: PropTypes.bool,
  showRegistration: PropTypes.bool,
  enableMFA: PropTypes.bool,
  trustDeviceAvailable: PropTypes.bool,
};



// Export as default
export default LoginForm;

// Backward compatibility aliases (deprecated - use LoginForm instead)
export const UnifiedLoginForm = LoginForm;
export const UniversalLoginForm = LoginForm;
export const EnhancedLoginForm = LoginForm;
