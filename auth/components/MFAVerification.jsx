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
import { Shield, AlertCircle, Smartphone, Key, Check } from "lucide-react";

const MFAVerification = ({
  userId,
  onVerificationSuccess,
  onCancel,
  className = "",
  deviceFingerprint = null,
}) => {
  const [verificationMode, setVerificationMode] = useState("totp"); // 'totp' or 'backup'
  const [token, setToken] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [showTrustOption, setShowTrustOption] = useState(!!deviceFingerprint);

  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [verificationMode]);

  const handleTokenChange = (value) => {
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canSubmit()) {
        handleVerification();
      }
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
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          token,
          deviceFingerprint: trustDevice ? deviceFingerprint : null,
          trustDevice,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.verified) {
        // Success - call parent success handler
        onVerificationSuccess({
          verified: true,
          deviceTrusted: data.data.deviceTrusted,
          usedBackupCode: data.data.usedBackupCode,
          bypassedDueToTrust: data.data.bypassedDueToTrust,
        });
      } else {
        // Failed verification
        const errorMessage = data.message || "Invalid verification code";
        setError(errorMessage);

        // Check for rate limiting hints
        if (
          errorMessage.includes("too many") ||
          errorMessage.includes("rate limit")
        ) {
          setRemainingAttempts(0);
        } else {
          // Estimate remaining attempts (rough)
          const currentAttempts =
            remainingAttempts !== null ? remainingAttempts - 1 : 4;
          setRemainingAttempts(Math.max(0, currentAttempts));
        }

        // Clear token on failure
        setToken("");

        // Refocus input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (_err) {
      // console.error('MFA verification error:', err);
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
          <Smartphone className="text-blue-600" size={24} />
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
          onKeyPress={handleKeyPress}
          placeholder="000000"
          className="text-center text-2xl font-mono tracking-widest w-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={6}
          autoComplete="off"
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>

      <div className="text-center">
        <button
          onClick={switchToBackupMode}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
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
          <Key className="text-blue-600" size={24} />
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
          onKeyPress={handleKeyPress}
          placeholder="XXXXXXXX"
          className="text-center text-xl font-mono tracking-wider w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={12}
          autoComplete="off"
        />
      </div>

      <div className="text-center space-y-2">
        <button
          onClick={switchToTOTPMode}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
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
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="text-blue-600" size={24} />
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="text-red-600 mt-0.5" size={16} />
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
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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
