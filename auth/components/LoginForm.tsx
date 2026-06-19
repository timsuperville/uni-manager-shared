import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import MFAVerification from './MFAVerification';
import MFASetup from './MFASetup';
import { getCurrentAppConfig } from '../config/appConfigs';
import { validateEmail } from '../utils/authValidation';
import {
  AuthContainer,
  AuthCardContent,
  AuthButton,
  OAuthButton,
  AuthInput,
  AuthDivider,
  Alert,
  GoogleIcon,
  PasswordToggleButton
} from './_authUI';
import { textAccent, textSecondary, textMuted } from '../../styles/styleUtils';
import { KeyIcon } from '../../components/icons';
import { glassBorder } from '@shared/styles/styleUtils';

// Default UI config for unknown/unregistered appTypes
const DEFAULT_UI = {
  icon: <KeyIcon size={40} className="mx-auto" />,
  loginTitle: 'Sign In',
  loginDescription: 'Sign in to your account',
  registerPath: '/auth/register'
};

/**
 * LoginForm — Primary authentication form.
 *
 * Works in two modes:
 *  - Nested inside AuthLayout → AuthContainer strips its own shell, this
 *    form card floats inside the right panel.
 *  - Standalone (legacy) → AuthContainer wraps in full-viewport shell.
 */
interface LoginFormProps {
  appType?: string;
  appTitle?: string;
  appDescription?: string;
  showRememberMe?: boolean;
  showRegistration?: boolean;
  enableMFA?: boolean;
  trustDeviceAvailable?: boolean;
  onSuccess?: (result: unknown) => void;
  onError?: (error: unknown) => void;
  redirectPath?: string;
}

export function LoginForm({
  appType = 'default',
  appTitle,
  appDescription,
  showRememberMe = true,
  showRegistration = true,
  enableMFA = true,
  trustDeviceAvailable = true,
  onSuccess,
  onError,
  redirectPath = '/dashboard'
}: LoginFormProps) {
  const {
    login,
    loginWithGoogle,
    verifyMFALogin,
    isLoading,
    error,
    mfaRequired,
    mfaSetupRequired,
    clearError
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // returnTo: safe redirect after login (used by AcceptInvitePage invite flow)
  // Only honour paths that start with / to prevent open-redirect attacks.
  const returnTo = (() => {
    try {
      const param = new URLSearchParams(location.search).get('returnTo');
      return param && param.startsWith('/') ? param : null;
    } catch (_err) {
      return null;
    }
  })();

  const initialEmail = (() => {
    try {
      return new URLSearchParams(location.search).get('email') || '';
    } catch (_err) {
      return '';
    }
  })();

  const [currentStep, setCurrentStep] = useState('login');
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
    rememberMe: false
  });
  const [trustDevice, setTrustDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Pull ui branding from the single source of truth — appConfigs.js
  const appConfig = getCurrentAppConfig(appType);
  const ui = appConfig?.ui ?? DEFAULT_UI;
  const finalTitle = appTitle || ui.loginTitle;
  const finalDescription = appDescription || ui.loginDescription;
  // returnTo takes priority over redirectPath prop
  const finalRedirect = returnTo || redirectPath || '/dashboard';

  const generateFingerprint = useCallback((): string | null => {
    if (typeof document === 'undefined') return null;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      const raw = [
        navigator?.userAgent,
        navigator?.language,
        screen ? `${screen.width}x${screen.height}` : '',
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');
      return btoa(raw).slice(0, 32);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setDeviceFingerprint(generateFingerprint());
  }, [generateFingerprint]);

  // ─── MFA state transitions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!enableMFA) return;
    if (mfaRequired) setCurrentStep('mfa-verification');
    else if (mfaSetupRequired) setCurrentStep('mfa-setup');
  }, [mfaRequired, mfaSetupRequired, enableMFA]);

  // Sync autofilled/password manager filled credentials to React state
  useEffect(() => {
    const timer = setInterval(() => {
      const emailEl = document.getElementById(
        'login-email'
      ) as HTMLInputElement | null;
      const passwordEl = document.getElementById(
        'login-password'
      ) as HTMLInputElement | null;

      if (emailEl && passwordEl) {
        const domEmail = emailEl.value;
        const domPassword = passwordEl.value;

        if (
          (domEmail && domEmail !== formData.email) ||
          (domPassword && domPassword !== formData.password)
        ) {
          setFormData(prev => ({
            ...prev,
            email: domEmail || prev.email,
            password: domPassword || prev.password
          }));
        }
      }
    }, 500);

    return () => clearInterval(timer);
  }, [formData.email, formData.password]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError?.();
    setLocalError(null);

    // Fallback DOM extraction for browser / password manager auto-fills
    const emailEl = document.getElementById(
      'login-email'
    ) as HTMLInputElement | null;
    const passwordEl = document.getElementById(
      'login-password'
    ) as HTMLInputElement | null;

    const emailVal = (emailEl?.value || formData.email).trim();
    const passwordVal = passwordEl?.value || formData.password;

    if (!emailVal) {
      setLocalError('Email address is required.');
      return;
    }
    const emailValidation = validateEmail(emailVal);
    if (!emailValidation.isValid) {
      setLocalError(
        emailValidation.errors.email || 'Please enter a valid email address.'
      );
      return;
    }
    if (!passwordVal) {
      setLocalError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({
        email: emailVal,
        password: passwordVal,
        rememberMe: formData.rememberMe,
        deviceInfo: { fingerprint: deviceFingerprint || undefined },
        appType: appType as Parameters<typeof login>[0]['appType']
      });
      const loginResult = result as unknown as Record<string, unknown>;
      const isMFAPending =
        loginResult?.mfaRequired ||
        loginResult?.requiresMFA ||
        loginResult?.mfaSetupRequired;
      if (loginResult?.success && !isMFAPending) {
        if (onSuccess) onSuccess(result);
        else navigate(finalRedirect);
      } else {
        // Only stop submitting if we are showing MFA or failed
        setIsSubmitting(false);
      }
      // MFA step changes handled via the useEffect above
    } catch (err) {
      setIsSubmitting(false);
      // We purposefully do not console.error here to keep expected validation failures (like bad password) out of the console logs
      onError?.(err);
    }
  };

  const handleMFAVerification = async (token: string) => {
    clearError?.();
    try {
      const result = await verifyMFALogin?.(
        token,
        deviceFingerprint,
        trustDevice
      );
      const r = result as Record<string, unknown> | undefined;
      if (r?.success) {
        setCurrentStep('login');
        if (onSuccess) onSuccess(result);
        else navigate(finalRedirect);
      }
    } catch (err) {
      onError?.(err);
    }
  };

  const handleMFASetupComplete = () => {
    setCurrentStep('login');
    if (onSuccess) onSuccess({ success: true, mfaSetupCompleted: true });
    else navigate(finalRedirect);
  };

  const handleBackToLogin = () => {
    setCurrentStep('login');
    clearError?.();
  };

  // Validate both presence and email format for accurate button state
  const isFormValid = Boolean(
    formData.email &&
    validateEmail(formData.email.trim()).isValid &&
    formData.password
  );

  const isFormLoading = isLoading || isSubmitting;

  // ─── MFA Verification step ───────────────────────────────────────────────────
  if (currentStep === 'mfa-verification' && enableMFA) {
    return (
      <AuthContainer maxWidth="md">
        <AuthCardContent>
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 animate-bounce">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify Identity
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Enter the code sent to your device
            </p>
          </div>
          <MFAVerification
            onVerificationSuccess={result =>
              handleMFAVerification(result?.verified ? 'verified' : '')
            }
            onCancel={handleBackToLogin}
            deviceFingerprint={deviceFingerprint}
            className=""
          />
        </AuthCardContent>
      </AuthContainer>
    );
  }

  // ─── MFA Setup step ──────────────────────────────────────────────────────────
  if (currentStep === 'mfa-setup' && enableMFA) {
    return (
      <AuthContainer maxWidth="lg">
        <AuthCardContent>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Secure Your Account
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Set up two-factor authentication for enhanced security
            </p>
          </div>
          <MFASetup
            onSetupComplete={handleMFASetupComplete}
            onCancel={handleMFASetupComplete}
          />
        </AuthCardContent>
      </AuthContainer>
    );
  }

  // ─── Main login form ─────────────────────────────────────────────────────────
  return (
    <AuthContainer maxWidth="md">
      <AuthCardContent>
        {/* Card header */}
        <div className="text-center mb-6 sm:mb-8">
          <div
            className="flex justify-center mb-3 sm:mb-4 text-gray-900 dark:text-white"
            aria-hidden="true"
          >
            {ui.icon}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            {finalTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {finalDescription}
          </p>
        </div>

        {/* Google OAuth */}
        <OAuthButton
          provider="Google"
          onClick={async () => {
            try {
              if (loginWithGoogle) {
                const result = await loginWithGoogle();
                const res = result as any;
                if (res.success || res.user) {
                  if (onSuccess) onSuccess(result as any);
                  else navigate(finalRedirect, { replace: true });
                }
              } else {
                console.warn('Google OAuth login method is not available.');
              }
            } catch (err: any) {
              setLocalError(
                err.message || 'An error occurred during Google sign in.'
              );
              onError?.(err);
            }
          }}
          icon={<GoogleIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
        >
          Sign in with Google
        </OAuthButton>

        <AuthDivider text="Or continue with email" />

        {/* Email + password form */}
        <form className="space-y-5 sm:space-y-6" onSubmit={handleLoginSubmit}>
          {/* Error banner */}
          {(error || localError) && (
            <Alert type="error" message={error || localError || ''} />
          )}

          {/* Email */}
          <AuthInput
            id="login-email"
            name="email"
            type="email"
            label="Email address"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            required
            autoComplete="email"
            autoFocus
          />

          {/* Password */}
          <AuthInput
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            rightElement={
              <PasswordToggleButton
                visible={showPassword}
                onToggle={() => setShowPassword(v => !v)}
              />
            }
          />

          {/* Forgot password */}
          <div className="-mt-3 flex justify-end">
            <button
              type="button"
              className="text-xs font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-live-sync,hsl(272,65%,62%))] rounded cursor-pointer"
              style={textAccent}
              onClick={() => navigate('/auth/forgot-password')}
            >
              Forgot password?
            </button>
          </div>

          {/* Remember me */}
          {showRememberMe && (
            <div className="flex items-center gap-2">
              <input
                id="login-rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 rounded cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-live-sync,hsl(272,65%,62%))]"
                style={{
                  accentColor: 'var(--primary-live-sync, hsl(272,65%,62%))',
                  ...glassBorder
                }}
              />
              <label
                htmlFor="login-rememberMe"
                className="text-sm cursor-pointer select-none"
                style={textSecondary}
              >
                Remember me
              </label>
            </div>
          )}

          {/* Submit */}
          <div className="pt-1">
            <AuthButton
              type="submit"
              disabled={isFormLoading}
              loading={isFormLoading}
              variant="primary"
            >
              {isFormLoading ? 'Signing in…' : 'Sign in'}
            </AuthButton>
          </div>

          {/* Registration link */}
          {showRegistration && (
            <p className="text-center text-sm" style={textMuted}>
              {"Don't have an account? "}
              <button
                type="button"
                className="font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-live-sync,hsl(272,65%,62%))] rounded cursor-pointer"
                style={textAccent}
                onClick={() => navigate(ui.registerPath)}
              >
                Create account
              </button>
            </p>
          )}
        </form>
      </AuthCardContent>
    </AuthContainer>
  );
}

export default LoginForm;
