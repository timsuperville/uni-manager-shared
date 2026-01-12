/**
 * Reusable Auth UI Components
 * Shared components for authentication forms with consistent styling
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Auth Button - Primary action button for auth forms
 */
export const AuthButton = ({
    children,
    type = 'button',
    onClick,
    disabled = false,
    variant = 'primary',
    fullWidth = true,
    loading = false,
    className = '',
}) => {
    const baseStyles =
        'inline-flex items-center justify-center px-4 py-3 sm:py-3.5 border border-transparent text-sm sm:text-base font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.98]';

    const variants = {
        primary:
            'text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-900 focus:ring-blue-500 shadow-blue-500/30 hover:shadow-blue-500/40',
        secondary:
            'text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 backdrop-blur-sm border border-blue-100 dark:border-blue-900 focus:ring-blue-500',
        success:
            'text-white bg-gradient-to-r from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 focus:ring-emerald-500 shadow-emerald-500/30 hover:shadow-emerald-500/40',
        danger:
            'text-white bg-gradient-to-r from-red-500 to-rose-700 hover:from-red-600 hover:to-rose-800 focus:ring-red-500 shadow-red-500/30 hover:shadow-red-500/40',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
};

AuthButton.propTypes = {
    children: PropTypes.node.isRequired,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger']),
    fullWidth: PropTypes.bool,
    loading: PropTypes.bool,
    className: PropTypes.string,
};

/**
 * OAuth Button - Button for third-party authentication
 */
export const OAuthButton = ({
    provider,
    onClick,
    disabled = false,
    children,
    icon,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] active:shadow-inner"
        >
            {icon && <span className="flex-shrink-0 transition-transform group-hover:scale-110">{icon}</span>}
            <span>{children || `Continue with ${provider}`}</span>
        </button>
    );
};

OAuthButton.propTypes = {
    provider: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    children: PropTypes.node,
    icon: PropTypes.node,
};

/**
 * Auth Input - Text input field for auth forms
 */
export const AuthInput = ({
    id,
    name,
    type = 'text',
    label,
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    required = false,
    autoComplete,
    disabled = false,
    icon,
    rightElement,
}) => {
    return (
        <div className="group">
            {label && (
                <label
                    htmlFor={id}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    required={required}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    className={`block w-full ${icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-10' : 'pr-4'} py-3 sm:py-3.5 text-sm sm:text-base border rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 ${error
                        ? 'border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'
                        } text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed backdrop-blur-sm`}
                />
                {rightElement && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && (
                <div className="mt-1.5 flex items-center text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium animate-fadeIn">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}
        </div>
    );
};

AuthInput.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    placeholder: PropTypes.string,
    error: PropTypes.string,
    required: PropTypes.bool,
    autoComplete: PropTypes.string,
    disabled: PropTypes.bool,
    icon: PropTypes.node,
    rightElement: PropTypes.node,
};

/**
 * Auth Container - Responsive container for auth forms
 * Now with Glassmorphism!
 */
export const AuthContainer = ({ children, maxWidth = 'md' }) => {
    const maxWidths = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Dynamic background accents (can be overridden by parent layout if needed) */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />

            <div className={`w-full ${maxWidths[maxWidth]} relative z-10 animate-slideUpFade`}>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

AuthContainer.propTypes = {
    children: PropTypes.node.isRequired,
    maxWidth: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
};

/**
 * Auth Card Content - Inner content wrapper
 */
export const AuthCardContent = ({ children }) => {
    return (
        <div className="px-6 py-8 sm:px-10 sm:py-12 space-y-6 sm:space-y-8">
            {children}
        </div>
    );
};

AuthCardContent.propTypes = {
    children: PropTypes.node.isRequired,
};

/**
 * Auth Divider - "Or continue with" divider
 */
export const AuthDivider = ({ text = 'Or' }) => {
    return (
        <div className="relative my-6 sm:my-8 text-center">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative inline-flex justify-center">
                <span className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full">
                    {text}
                </span>
            </div>
        </div>
    );
};

AuthDivider.propTypes = {
    text: PropTypes.string,
};

/**
 * Alert Message - For errors, success, info messages
 */
export const Alert = ({ type = 'error', message, className = '' }) => {
    const types = {
        error: {
            bg: 'bg-red-50/90 dark:bg-red-900/30',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-800 dark:text-red-200',
            icon: (
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )
        },
        success: {
            bg: 'bg-green-50/90 dark:bg-green-900/30',
            border: 'border-green-200 dark:border-green-800',
            text: 'text-green-800 dark:text-green-200',
            icon: (
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            )
        },
        info: {
            bg: 'bg-blue-50/90 dark:bg-blue-900/30',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-800 dark:text-blue-200',
            icon: (
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            )
        },
        warning: {
            bg: 'bg-yellow-50/90 dark:bg-yellow-900/30',
            border: 'border-yellow-200 dark:border-yellow-800',
            text: 'text-yellow-800 dark:text-yellow-200',
            icon: (
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            )
        },
    };

    const { bg, border, text, icon } = types[type];

    return (
        <div
            className={`${bg} ${border} ${text} backdrop-blur-sm border px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm ${className}`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="text-sm font-medium leading-5">{message}</div>
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['error', 'success', 'info', 'warning']),
    message: PropTypes.string.isRequired,
    className: PropTypes.string,
};

/**
 * Google Icon Component
 */
export const GoogleIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

GoogleIcon.propTypes = {
    className: PropTypes.string,
};
