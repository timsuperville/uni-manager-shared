import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

/**
 * Universal Login Form component that can be used across all frontend applications
 * Supports multiple app types with customizable styling and behavior
 */
export function UniversalLoginForm({
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
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        appType,
      });

      if (onSuccess) {
        onSuccess(result);
      } else {
        navigate(finalRedirectPath);
      }
    } catch (_err) {
      if (onError) {
        onError(err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const isFormValid = formData.email && formData.password;

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
          <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
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

UniversalLoginForm.propTypes = {
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
