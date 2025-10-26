/**
 * Authentication System Type Definitions
 *
 * Comprehensive JSDoc types for all authentication-related data structures,
 * ensuring type safety and clear API contracts throughout the system.
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} email - User's email address
 * @property {string} [firstName] - User's first name
 * @property {string} [lastName] - User's last name
 * @property {string} [avatar] - Avatar URL
 * @property {string} [role] - User's role (admin, user, etc)
 * @property {string[]} [permissions] - Array of permission strings
 * @property {string[]} [churches] - Associated church IDs
 * @property {string[]} [organizations] - Associated organization IDs
 * @property {string} [status] - Account status (active, suspended, etc)
 * @property {boolean} [mfaEnabled] - Whether MFA is enabled
 * @property {Date} [createdAt] - Account creation timestamp
 * @property {Date} [updatedAt] - Last update timestamp
 * @property {Date} [lastLoginAt] - Last login timestamp
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user - Current authenticated user
 * @property {string|null} token - Access token
 * @property {boolean} isAuthenticated - Whether user is logged in
 * @property {boolean} isLoading - Whether an auth operation is in progress
 * @property {string|null} error - Error message if operation failed
 * @property {string|null} sessionId - Current session identifier
 * @property {string} sessionStatus - Session status (inactive, active, warning, expired)
 * @property {number} lastActivity - Timestamp of last user activity
 * @property {number|null} sessionTimeRemaining - Seconds until session expires
 * @property {boolean} mfaRequired - Whether MFA is required for login
 * @property {boolean} mfaSetupRequired - Whether user must set up MFA
 * @property {string|null} mfaStatus - MFA status (none, enabled, pending)
 * @property {string|null} deviceId - Current device identifier
 * @property {boolean} isTrustedDevice - Whether device is trusted
 * @property {Array} oauthProviders - Available OAuth providers
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email - User email
 * @property {string} password - User password
 * @property {boolean} [rememberMe] - Keep user logged in
 * @property {string} [appType] - App identifier (admin, church, home, etc)
 */

/**
 * @typedef {Object} LoginResponse
 * @property {User} user - Authenticated user object
 * @property {string} token - Access token
 * @property {string} [refreshToken] - Refresh token (if supported)
 * @property {string} [sessionId] - Session identifier
 * @property {number} [expiresIn] - Token expiration in seconds
 * @property {boolean} [mfaRequired] - Whether MFA verification is needed
 * @property {string} [mfaChallenge] - MFA challenge (if required)
 */

/**
 * @typedef {Object} SignupData
 * @property {string} email - Email address
 * @property {string} password - Password
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} [appType] - App identifier
 * @property {boolean} [agreeToTerms] - Terms agreement
 */

/**
 * @typedef {Object} Session
 * @property {string} id - Session identifier
 * @property {string} userId - User ID
 * @property {string} deviceId - Device identifier
 * @property {string} deviceFingerprint - Device fingerprint
 * @property {string} ipAddress - IP address
 * @property {string} userAgent - Browser user agent
 * @property {string} status - Session status
 * @property {boolean} isTrusted - Whether device is trusted
 * @property {Date} createdAt - Session creation time
 * @property {Date} expiresAt - Session expiration time
 * @property {Date} lastActivityAt - Last activity time
 */

/**
 * @typedef {Object} MFAChallenge
 * @property {string} method - MFA method (totp, sms, email)
 * @property {string} challengeId - Challenge identifier
 * @property {number} expiresIn - Seconds until challenge expires
 * @property {string} [destination] - Where code was sent (SMS number, email, etc)
 */

/**
 * @typedef {Object} MFASetupResponse
 * @property {string} secret - Base32 encoded secret
 * @property {string} qrCode - QR code data URL
 * @property {string[]} backupCodes - Array of backup codes
 * @property {string} method - MFA method
 */

/**
 * @typedef {Object} DeviceInfo
 * @property {string} id - Device identifier
 * @property {string} fingerprint - Device fingerprint
 * @property {string} userAgent - Browser user agent
 * @property {string} ipAddress - IP address
 * @property {string} [os] - Operating system
 * @property {string} [browser] - Browser name
 * @property {boolean} isMobile - Is mobile device
 * @property {boolean} isTrusted - Is device trusted
 * @property {Date} createdAt - When device was first seen
 * @property {Date} lastSeenAt - Last time device was used
 */

/**
 * @typedef {Object} OAuthProvider
 * @property {string} id - Provider ID (google, github, etc)
 * @property {string} name - Provider name
 * @property {string} icon - Icon URL or identifier
 * @property {string} [description] - Description
 * @property {boolean} enabled - Whether provider is enabled
 */

/**
 * @typedef {Object} Permission
 * @property {string} id - Permission identifier
 * @property {string} name - Human-readable name
 * @property {string} resource - Resource type (user, church, business, etc)
 * @property {string} action - Action (create, read, update, delete)
 * @property {string} [description] - Description
 */

/**
 * @typedef {Object} Role
 * @property {string} id - Role identifier
 * @property {string} name - Role name (admin, user, viewer, etc)
 * @property {string} [description] - Description
 * @property {string[]} permissions - Array of permission IDs
 * @property {boolean} isSystem - Whether role is system-defined
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} SecurityAlert
 * @property {string} id - Alert ID
 * @property {string} type - Alert type (login_failure, mfa_failure, suspicious_activity)
 * @property {string} severity - Severity level (low, medium, high, critical)
 * @property {string} message - Alert message
 * @property {string} [location] - Geographic location
 * @property {string} [deviceInfo] - Device information
 * @property {Date} createdAt - When alert was created
 * @property {boolean} [acknowledged] - Whether user acknowledged alert
 */

/**
 * @typedef {Object} AuthConfig
 * @property {string} [appName] - Application name
 * @property {string} [apiEndpoint] - API endpoint URL
 * @property {number} [tokenRefreshInterval] - Token refresh interval (ms)
 * @property {number} [sessionTimeout] - Session timeout (ms)
 * @property {number} [inactivityTimeout] - Inactivity timeout (ms)
 * @property {boolean} [enableActivityTracking] - Whether to track activity
 * @property {boolean} [enableMFA] - Whether to require MFA
 * @property {boolean} [enableOAuth] - Whether to enable OAuth
 * @property {boolean} [enableDeviceTrust] - Whether to enable device trust
 * @property {boolean} [enableRateLimit] - Whether to enable rate limiting
 * @property {boolean} [enableSecurityAlerts] - Whether to show security alerts
 */

/**
 * @typedef {Object} AuthError
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {string} [statusCode] - HTTP status code
 * @property {Object} [details] - Additional error details
 * @property {string} [timestamp] - When error occurred
 */

// JSDoc types are for IDE intellisense and documentation only.
// No explicit exports needed - JSDoc comments are standalone.

// For TypeScript support or type checking, users can import this file:
// /** @type {import('./auth.types.js').User} */
// or enable JSDoc type checking with:
// // @ts-check
