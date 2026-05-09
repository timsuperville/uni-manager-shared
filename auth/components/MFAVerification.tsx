/**
 * MFA Verification Component
 *
 * Handles multi-factor authentication verification during login including:
 * - TOTP token input and validation
 * - Backup code entry option
 * - Device trust management
 * - Progressive error handling
 * - Seamless user experience
 *
 * Features:
 * - Smart input formatting
 * - Backup code fallback
 * - Device trust checkbox
 * - Rate limiting awareness
 * - Accessibility support
 */

import React, { useState, useEffect, useRef } from "react";

// Inline SVG components — consistent with _authUI, no lucide-react dep (AUTH-10)
const ShieldIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);
const SmartphoneIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);
const KeyIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  </svg>
);
const AlertCircleIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

interface MFAVerificationProps {
  userId?: string;
  onVerificationSuccess: (result: {
    verified: boolean;
    deviceTrusted: boolean;
    usedBackupCode: boolean;
    bypassedDueToTrust: boolean;
  }) => void;
  onCancel: () => void;
  className?: string;
  deviceFingerprint?: string | null;
  /** AUTH-03: injected service replaces raw fetch */
  apiService?: { verifyMFA?: (payload: unknown) => Promise<unknown> } | null;
}

const MFAVerification = ({
  userId,
  onVerificationSuccess,
  onCancel,
  className = "",
  deviceFingerprint = null,
  apiService = null,
}: MFAVerificationProps) => {
  const [verificationMode, setVerificationMode] = useState("totp"); // 'totp' or 'backup'
  const [token, setToken] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null,
  );
  const [showTrustOption, setShowTrustOption] = useState(!!deviceFingerprint);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [verificationMode]);

  const handleTokenChange = (value: string) => {
    setError("");

    if (verificationMode === "totp") {
      // Format TOTP token (6 digits only)
      const formatted = value.replace(/\D/g, "").slice(0, 6);
      setToken(formatted);
    } else {
      // Format backup code (alphanumeric, up to 12 chars)
      const formatted = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 12);
      setToken(formatted);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canSubmit()) handleVerification();
    }
  };

  const canSubmit = () => {
    if (verificationMode === "totp") {
      return token.length === 6 && !isVerifying;
    } else {
      return token.length >= 6 && !isVerifying;
    }
  };

  const handleVerification = async () => {
    if (!canSubmit()) return;
    setIsVerifying(true);
    setError("");
    try {
      let data;
      if (apiService?.verifyMFA) {
        // Route through injected service — keeps all API calls in one layer (AUTH-03)
        data = await apiService.verifyMFA({
          userId,
          token,
          deviceFingerprint: trustDevice ? deviceFingerprint : null,
          trustDevice,
        });
      } else {
        // Fallback: direct fetch — only if no service injected
        if (import.meta.env?.DEV) {
          console.warn(
            "[MFAVerification] No apiService provided — falling back to raw fetch. " +
              "Pass apiService prop for proper API layer separation.",
          );
        }
        const response = await fetch("/api/auth/mfa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            token,
            deviceFingerprint: trustDevice ? deviceFingerprint : null,
            trustDevice,
          }),
        });
        data = await response.json();
      }

      if (data?.success && data?.data?.verified) {
        onVerificationSuccess({
          verified: true,
          deviceTrusted: data.data.deviceTrusted,
          usedBackupCode: data.data.usedBackupCode,
          bypassedDueToTrust: data.data.bypassedDueToTrust,
        });
      } else {
        const errorMessage = data?.message || "Invalid verification code";
        setError(errorMessage);
        if (
          errorMessage.includes("too many") ||
          errorMessage.includes("rate limit")
        ) {
          setRemainingAttempts(0);
        } else {
          const currentAttempts =
            remainingAttempts !== null ? remainingAttempts - 1 : 4;
          setRemainingAttempts(Math.max(0, currentAttempts));
        }
        setToken("");
        inputRef.current?.focus();
      }
    } catch (_err) {
      setError(
        "Verification failed. Please check your connection and try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const switchToBackupMode = () => {
    setVerificationMode("backup");
    setToken("");
    setError("");
    setRemainingAttempts(null);
  };

  const switchToTOTPMode = () => {
    setVerificationMode("totp");
    setToken("");
    setError("");
    setRemainingAttempts(null);
  };

  const renderTOTPInput = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <SmartphoneIcon />
          <h3 className="text-lg font-medium text-gray-900">
            Enter Authenticator Code
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Open your authenticator app and enter the 6-digit code
        </p>
      </div>

      <div className="flex justify-center">
        <input
          ref={inputRef}
          type="text"
          value={token}
          onChange={(e) => handleTokenChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="000000"
          className={`text-center text-2xl font-mono tracking-widest w-48 px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
          maxLength={6}
          autoComplete="off"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-invalid={!!error}
          aria-describedby={error ? "mfa-error" : undefined}
        />
      </div>

      <div className="text-center">
        <button
          onClick={switchToBackupMode}
          className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded"
        >
          Use backup code instead
        </button>
      </div>
    </div>
  );

  const renderBackupInput = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <KeyIcon />
          <h3 className="text-lg font-medium text-gray-900">
            Enter Backup Code
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Enter one of your saved backup recovery codes
        </p>
      </div>

      <div className="flex justify-center">
        <input
          ref={inputRef}
          type="text"
          value={token}
          onChange={(e) => handleTokenChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="XXXXXXXX"
          className={`text-center text-xl font-mono tracking-wider w-64 px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
          maxLength={12}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? "mfa-error" : undefined}
        />
      </div>

      <div className="text-center space-y-2">
        <button
          onClick={switchToTOTPMode}
          className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded"
        >
          Use authenticator app instead
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-700">
            <strong>Note:</strong> Each backup code can only be used once. After
            using this code, it will no longer be valid.
          </p>
        </div>
      </div>
    </div>
  );

  const renderDeviceTrustOption = () => {
    if (!showTrustOption || !deviceFingerprint) return null;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="text-sm">
            <div className="font-medium text-gray-900">Trust this device</div>
            <div className="text-gray-600">
              Skip MFA verification on this device for 30 days. Only enable this
              on devices you own and trust.
            </div>
          </div>
        </label>
      </div>
    );
  };

  return (
    <div
      className={`max-w-md mx-auto bg-white rounded-lg shadow-lg ${className}`}
    >
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-shield"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Please verify your identity to continue
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-6">
          {verificationMode === "totp"
            ? renderTOTPInput()
            : renderBackupInput()}

          {/* Device Trust Option */}
          {renderDeviceTrustOption()}

          {/* Error Display */}
          {error && (
            <div
              id="mfa-error"
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start space-x-2">
                <AlertCircleIcon />
                <div className="text-sm">
                  <p className="text-red-700">{error}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="text-red-600 mt-1">
                      {remainingAttempts} attempt
                      {remainingAttempts !== 1 ? "s" : ""} remaining
                    </p>
                  )}
                  {remainingAttempts === 0 && (
                    <p className="text-red-600 mt-1">
                      Too many failed attempts. Please wait before trying again.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleVerification}
              disabled={!canSubmit() || remainingAttempts === 0}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              aria-busy={isVerifying}
            >
              {isVerifying ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                <>
                  {verificationMode === "totp"
                    ? "Verify Code"
                    : "Verify Backup Code"}
                </>
              )}
            </button>

            <button
              onClick={onCancel}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              disabled={isVerifying}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Having trouble? Contact support for assistance.</p>
            <p>Lost your device? Use a backup code to sign in.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
