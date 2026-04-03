import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  validateEmail,
  validatePassword,
  validateName,
  getPasswordStrength,
} from "../utils/authValidation.ts";
import { getCurrentAppConfig } from "../config/appConfigs";
import { getAuthService } from "../services";
import {
  AuthContainer,
  AuthCardContent,
  AuthButton,
  OAuthButton,
  AuthInput,
  AuthDivider,
  Alert,
  GoogleIcon,
  PasswordToggleButton,
} from "./_authUI";
import { UserIcon } from "../../components/icons";

interface SignupFormProps {
  onLogin?: () => void;
  isLoading?: boolean;
  error?: string | null;
  /** Optional auth service override — for tests and Storybook */
  authService?: Record<string, unknown> | null;
  appType?: string;
  loginPath?: string;
  onTermsClick?: React.MouseEventHandler<HTMLAnchorElement>;
  onPrivacyClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface SignupFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  general?: string;
  [key: string]: string | undefined;
}

type SignupPasswordStrength = ReturnType<typeof getPasswordStrength>;
type AnyAuthService = any;

const SignupForm = ({
  onLogin,
  isLoading = false,
  error = null,
  authService: providedAuthService = null,
  appType = "default",
  loginPath = "/auth/login",
  onTermsClick,
  onPrivacyClick,
}: SignupFormProps) => {
  const navigate = useNavigate();
  const appConfig = getCurrentAppConfig(appType);

  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [passwordStrength, setPasswordStrength] =
    useState<SignupPasswordStrength | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authService, setAuthService] = useState<AnyAuthService>(
    () => providedAuthService ?? null,
  );
  useEffect(() => {
    if (!providedAuthService && !authService) {
      getAuthService().then((svc) => setAuthService(svc));
    }
  }, [providedAuthService, authService]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ref for debouncing + cancelling stale email availability checks
  const emailCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailCheckAbortRef = useRef<AbortController | null>(null);

  // Swap service if a new one is provided via props (test/story injection)
  useEffect(() => {
    if (providedAuthService) setAuthService(providedAuthService);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (name === "password" && errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleEmailBlur = () => {
    // Cancel any pending debounce + in-flight request from a previous blur
    if (emailCheckTimerRef.current !== null) {
      clearTimeout(emailCheckTimerRef.current);
    }
    emailCheckAbortRef.current?.abort();

    if (!formData.email || !authService) return;

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setErrors((prev) => ({
        ...prev,
        email: emailValidation.errors?.email ?? "Invalid email",
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, email: "" }));

    // Debounce 400 ms so rapid tab-through doesn't fire multiple requests
    emailCheckTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      emailCheckAbortRef.current = controller;
      setEmailChecking(true);
      try {
        const result = await authService.checkEmailAvailability(
          formData.email,
          { signal: controller.signal },
        );
        if (!result.available) {
          setErrors((prev) => ({
            ...prev,
            email: "Email is already registered",
          }));
        }
      } catch (err) {
        // Ignore AbortError (user moved on); surface other errors in dev
        if (
          (err as { name?: string })?.name !== "AbortError" &&
          import.meta.env?.DEV
        ) {
          console.warn("[SignupForm] Email availability check failed:", err);
        }
      } finally {
        setEmailChecking(false);
      }
    }, 400);
  };

  const handlePasswordBlur = () => {
    if (formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        setErrors((prev) => ({
          ...prev,
          password: passwordValidation.error ?? "Invalid password",
        }));
      }
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (formData.password && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "",
        }));
      }
    }
  };

  const handleGoogleSignup = async () => {
    if (!authService) return;
    try {
      const svc = authService as Record<
        string,
        | ((
            ...args: unknown[]
          ) => Promise<{ success: boolean; requiresVerification?: boolean }>)
        | undefined
      >;
      if (!svc.googleSignup) return;
      const result = await svc.googleSignup();
      if (result.success) {
        if (result.requiresVerification) {
          navigate("/auth/verify-email");
        } else {
          navigate("/onboarding");
        }
      }
    } catch (_error) {
      setErrors((prev) => ({
        ...prev,
        general: "Google signup failed",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    // Validate first name
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid)
      newErrors.firstName = firstNameValidation.error ?? "Invalid first name";

    // Validate last name
    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.isValid)
      newErrors.lastName = lastNameValidation.error ?? "Invalid last name";

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid)
      newErrors.email = emailValidation.errors?.email ?? "Invalid email";

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid)
      newErrors.password = passwordValidation.error ?? "Invalid password";

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Check terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!authService) {
      setErrors((prev) => ({
        ...prev,
        general: "Authentication service not available",
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      type SignupFn = (data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        acceptTerms: boolean;
      }) => Promise<{ success: boolean; requiresVerification?: boolean }>;
      const svcAny = authService as unknown as Record<
        string,
        SignupFn | undefined
      >;
      if (!svcAny.signup) throw new Error("signup method not available");
      const result = await svcAny.signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        acceptTerms: formData.agreeToTerms,
      });

      if (result.success) {
        if (result.requiresVerification) {
          navigate("/auth/verify-email", {
            state: { email: formData.email },
          });
        } else {
          navigate("/onboarding");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setErrors((prev) => ({
        ...prev,
        general: msg,
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

  return (
    <AuthContainer maxWidth="md">
      <AuthCardContent>
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div
            className="flex justify-center mb-3 sm:mb-4 text-gray-900 dark:text-white"
            aria-hidden="true"
          >
            {appConfig?.ui?.icon ?? <UserIcon size={40} />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Join {appConfig?.appName ?? "Uni-Manager"}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create your account to get started
          </p>
        </div>

        {/* Error message */}
        {(error || errors.general) && (
          <Alert
            type="error"
            message={error ?? errors.general ?? ""}
            className="mb-6"
          />
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

        <form onSubmit={handleSubmit} className="space-y-4" role="form">
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
              autoFocus
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />

          {/* Password field */}
          <div>
            <AuthInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              label="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handlePasswordBlur}
              placeholder="Create a password"
              error={errors.password}
              required
              autoComplete="new-password"
              rightElement={
                <PasswordToggleButton
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  ariaLabel={showPassword ? "Hide password" : "Show password"}
                />
              }
            />
            {passwordStrength && formData.password && (
              <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Password strength
                  </span>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      passwordStrength.score >= 3
                        ? "text-emerald-600 dark:text-emerald-400"
                        : passwordStrength.score >= 2
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex gap-1.5 h-1.5">
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 rounded-full transition-all duration-500 ease-out ${
                        passwordStrength.score > step
                          ? passwordStrength.score >= 3
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : passwordStrength.score >= 2
                              ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                              : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                          : "bg-gray-200 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Use 8+ chars with a mix of letters, numbers & symbols
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <AuthInput
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleConfirmPasswordBlur}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            rightElement={
              <PasswordToggleButton
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
                ariaLabel={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              />
            }
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
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                I agree to the{" "}
                <a
                  href="/terms"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
                  onClick={onTermsClick}
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
                  onClick={onPrivacyClick}
                >
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </AuthButton>
          </div>

          {/* Login Link */}
          <div className="text-center pt-2">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 cursor-pointer"
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

export default SignupForm;
