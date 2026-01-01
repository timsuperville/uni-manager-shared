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
        'inline-flex items-center justify-center px-4 py-3 sm:py-3.5 border border-transparent text-sm sm:text-base font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed';

    const variants = {
        primary:
            'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-lg hover:shadow-xl active:scale-[0.98]',
        secondary:
            'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:ring-blue-500 border-blue-200 dark:border-blue-800',
        success:
            'text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:ring-emerald-500 shadow-lg hover:shadow-xl active:scale-[0.98]',
        danger:
            'text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg hover:shadow-xl active:scale-[0.98]',
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
            className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
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
        <div>
            {label && (
                <label
                    htmlFor={id}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
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
                    className={`w-full ${icon ? 'pl-10' : 'pl-3'} ${rightElement ? 'pr-10' : 'pr-3'} py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200 ${error
                            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700'
                        } text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed`}
                />
                {rightElement && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                    {error}
                </p>
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
 */
export const AuthContainer = ({ children, maxWidth = 'md' }) => {
    const maxWidths = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
    };

    return (
        <div className="min-h-screen flex items-stretch sm:items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className={`w-full ${maxWidths[maxWidth]} sm:my-8 sm:mx-4`}>
                <div className="bg-white dark:bg-gray-800 sm:shadow-xl sm:rounded-2xl min-h-screen sm:min-h-0">
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
        <div className="relative my-6 sm:my-8">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm sm:text-base">
                <span className="px-3 sm:px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
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
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-700 dark:text-red-400',
        },
        success: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            text: 'text-green-700 dark:text-green-400',
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-700 dark:text-blue-400',
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            text: 'text-yellow-700 dark:text-yellow-400',
        },
    };

    const { bg, border, text } = types[type];

    return (
        <div
            className={`${bg} ${border} ${text} border px-4 sm:px-5 py-3 sm:py-4 rounded-lg font-medium text-sm sm:text-base ${className}`}
            role="alert"
        >
            {message}
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
