import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { MFAVerification } from './MFAVerification';
import { MFASetup } from './MFASetup';

/**
 * Enhanced Login Form with MFA Support
 * Supports multi-factor authentication flow with device trust
 */
export function EnhancedLoginForm({
  appType = 'default',
  appTitle,
  appDescription,
  onSuccess,
  onError,
  theme = 'default',
  redirectPath = '/dashboard',
  showRememberMe = true,
  showRegistration = false,
}) {
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
  const [currentStep, setCurrentStep] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [mfaToken, setMfaToken] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  const [trustDevice, setTrustDevice] = useState(false);

  // App-specific configurations
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

  const config = appConfigs[appType] || appConfigs.default;
  const finalTitle = appTitle || config.title;
  const finalDescription = appDescription || config.description;
  const finalRedirectPath = redirectPath || config.defaultRedirect;

  // Theme configurations
  const themes = {
    default: {
      background: 'bg-gray-50',
      container: 'bg-white shadow-lg',
      primary: `bg-${config.primaryColor}-600 hover:bg-${config.primaryColor}-700`,
      text: 'text-gray-900',
      input: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
    },
    dark: {
      background: 'bg-gray-900',
      container: 'bg-gray-800 shadow-2xl',
      primary: `bg-${config.primaryColor}-600 hover:bg-${config.primaryColor}-700`,
      text: 'text-white',
      input:
        'border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500',
    },
    minimal: {
      background: 'bg-white',
      container: 'border-2 border-gray-200',
      primary: `bg-${config.primaryColor}-600 hover:bg-${config.primaryColor}-700`,
      text: 'text-gray-900',
      input: 'border-b-2 border-gray-300 bg-transparent focus:border-blue-500',
    },
  };

  const currentTheme = themes[theme] || themes.default;

  // Generate device fingerprint function
  const generateFingerprint = useCallback(() => {
    const canvas = typeof document !== "undefined" && document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);

    const fingerprint = [
      typeof navigator !== "undefined" && navigator.userAgent,
      typeof navigator !== "undefined" && navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join('|');

    return btoa(fingerprint).slice(0, 32);
  }, []);

  // Generate device fingerprint on mount
  useEffect(() => {
    setDeviceFingerprint(generateFingerprint());
  }, [generateFingerprint]);

  // Watch for MFA state changes
  useEffect(() => {
    if (mfaRequired) {
      setCurrentStep('mfa-verification');
    } else if (mfaSetupRequired) {
      setCurrentStep('mfa-setup');
    }
  }, [mfaRequired, mfaSetupRequired]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        appType,
      });

      if (result.success && !result.mfaRequired && !result.mfaSetupRequired) {
        if (onSuccess) {
          onSuccess(result);
        } else {
          navigate(finalRedirectPath);
        }
      }
      // MFA flow will be handled by useEffect watching for state changes
    } catch (_err) {
      if (onError) {
        onError(err);
      }
    }
  };

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
    } catch (_err) {
      if (onError) {
        onError(err);
      }
    }
  };

  const handleMFASetupComplete = () => {
    setCurrentStep('login');
    if (onSuccess) {
      onSuccess({ success: true, mfaSetupCompleted: true });
    } else {
      navigate(finalRedirectPath);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBackToLogin = () => {
    setCurrentStep('login');
    clearError();
    setMfaToken('');
  };

  const isFormValid = formData.email && formData.password;

  // Render different steps based on authentication flow
  if (currentStep === 'mfa-verification') {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${currentTheme.background} py-12 px-4 sm:px-6 lg:px-8`}
      >
        <div className='max-w-md w-full space-y-8'>
          <div className={`${currentTheme.container} rounded-lg px-8 py-10`}>
            <MFAVerification
              onVerify={handleMFAVerification}
              onBack={handleBackToLogin}
              deviceTrust={{
                available: true,
                checked: trustDevice,
                onChange: setTrustDevice,
              }}
              theme={currentTheme}
              config={config}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'mfa-setup') {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${currentTheme.background} py-12 px-4 sm:px-6 lg:px-8`}
      >
        <div className='max-w-md w-full space-y-8'>
          <div className={`${currentTheme.container} rounded-lg px-8 py-10`}>
            <MFASetup
              onSetupComplete={handleMFASetupComplete}
              onSkip={handleMFASetupComplete}
              theme={currentTheme}
              config={config}
            />
          </div>
        </div>
      </div>
    );
  }

  // Standard login form
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${currentTheme.background} py-12 px-4 sm:px-6 lg:px-8`}
    >
      <div className='max-w-md w-full space-y-8'>
        <div className={`${currentTheme.container} rounded-lg px-8 py-10`}>
          {/* Header */}
          <div className='text-center'>
            <div className='text-4xl mb-4'>{config.icon}</div>
            <h2 className={`text-3xl font-extrabold ${currentTheme.text}`}>
              {finalTitle}
            </h2>
            <p className={`mt-2 text-sm ${currentTheme.text} opacity-75`}>
              {finalDescription}
            </p>
          </div>

          {/* Form */}
          <form className='mt-8 space-y-6' onSubmit={handleLoginSubmit}>
            {/* Error Display */}
            {error && (
              <div
                className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative'
                role='alert'
              >
                <span className='block sm:inline'>{error}</span>
              </div>
            )}

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
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md ${currentTheme.input} placeholder-gray-400 focus:outline-none focus:ring-2`}
                placeholder='Enter your password'
              />
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
            <div>
              <button
                type='submit'
                disabled={!isFormValid || isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${currentTheme.primary} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${config.primaryColor}-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out`}
              >
                {isLoading ? (
                  <div className='flex items-center'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            {/* Registration Link */}
            {showRegistration && (
              <div className='text-center'>
                <span className={`text-sm ${currentTheme.text} opacity-75`}>
                  Don't have an account?{' '}
                  <button
                    type='button'
                    className={`font-medium text-${config.primaryColor}-600 hover:text-${config.primaryColor}-500`}
                    onClick={() => navigate('/auth/register')}
                  >
                    Sign up
                  </button>
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

EnhancedLoginForm.propTypes = {
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
};
