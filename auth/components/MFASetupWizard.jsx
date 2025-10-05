import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  MFAService,
  MFA_METHODS,
  validateTOTPCode,
  validateSMSCode,
  formatPhoneNumber,
  getMFAMethodDisplayName,
  getMFAMethodIcon,
} from "@shared/auth/services/mfaService.js";

/**
 * MFA Setup Wizard Component
 * Guides users through Multi-Factor Authentication setup
 */
export function MFASetupWizard({ onComplete, onCancel, apiService }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // MFA service instance
  const [mfaService] = useState(() => new MFAService(apiService));

  // Setup data for different methods
  const [setupData, setSetupData] = useState({
    totp: null,
    sms: null,
    email: null,
    backupCodes: [],
  });

  // Form data
  const [formData, setFormData] = useState({
    phoneNumber: "",
    email: "",
    verificationCode: "",
    verificationId: "",
  });

  // Available MFA methods
  const availableMethods = [
    {
      id: MFA_METHODS.TOTP,
      name: getMFAMethodDisplayName(MFA_METHODS.TOTP),
      icon: getMFAMethodIcon(MFA_METHODS.TOTP),
      description:
        "Use an authenticator app like Google Authenticator or Authy",
      recommended: true,
    },
    {
      id: MFA_METHODS.SMS,
      name: getMFAMethodDisplayName(MFA_METHODS.SMS),
      icon: getMFAMethodIcon(MFA_METHODS.SMS),
      description: "Receive verification codes via text message",
      recommended: false,
    },
    {
      id: MFA_METHODS.EMAIL,
      name: getMFAMethodDisplayName(MFA_METHODS.EMAIL),
      icon: getMFAMethodIcon(MFA_METHODS.EMAIL),
      description: "Receive verification codes via email",
      recommended: false,
    },
  ];

  const handleMethodSelection = (methodId) => {
    setSelectedMethod(methodId);
    setError(null);
    setCurrentStep(2);
  };

  const handleTOTPSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await mfaService.setupTOTP();
      if (result.success) {
        setSetupData((prev) => ({
          ...prev,
          totp: result.data,
        }));
        setCurrentStep(3);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to setup authenticator app");
    } finally {
      setLoading(false);
    }
  };

  const handleSMSSetup = async () => {
    if (!formData.phoneNumber) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      const result = await mfaService.setupSMS(formattedPhone);
      if (result.success) {
        setSetupData((prev) => ({
          ...prev,
          sms: result.data,
        }));
        setFormData((prev) => ({
          ...prev,
          verificationId: result.data.verificationId,
        }));
        setCurrentStep(3);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to setup SMS verification");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSetup = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await mfaService.setupEmail(formData.email);
      if (result.success) {
        setSetupData((prev) => ({
          ...prev,
          email: result.data,
        }));
        setFormData((prev) => ({
          ...prev,
          verificationId: result.data.verificationId,
        }));
        setCurrentStep(3);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to setup email verification");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!formData.verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    // Validate code format based on method
    if (
      selectedMethod === MFA_METHODS.TOTP &&
      !validateTOTPCode(formData.verificationCode)
    ) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    if (
      selectedMethod === MFA_METHODS.SMS &&
      !validateSMSCode(formData.verificationCode)
    ) {
      setError("Please enter a valid verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;

      switch (selectedMethod) {
        case MFA_METHODS.TOTP:
          result = await mfaService.verifyTOTPSetup(formData.verificationCode);
          break;
        case MFA_METHODS.SMS:
          result = await mfaService.verifySMSSetup(
            formData.verificationId,
            formData.verificationCode
          );
          break;
        case MFA_METHODS.EMAIL:
          result = await mfaService.verifyEmailSetup(
            formData.verificationId,
            formData.verificationCode
          );
          break;
        default:
          throw new Error("Invalid MFA method");
      }

      if (result.success) {
        // Generate backup codes
        const backupResult = await mfaService.generateBackupCodes();
        if (backupResult.success) {
          setSetupData((prev) => ({
            ...prev,
            backupCodes: backupResult.data.codes,
          }));
        }
        setCurrentStep(4);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        method: selectedMethod,
        setupData: setupData,
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mfa-method-selection">
            <h2>Choose Your Security Method</h2>
            <p>
              Select how you'd like to secure your account with two-factor
              authentication:
            </p>

            <div className="method-options">
              {availableMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelection(method.id)}
                  className={`method-option ${method.recommended ? "recommended" : ""}`}
                  disabled={loading}
                >
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-info">
                    <h3>{method.name}</h3>
                    {method.recommended && (
                      <span className="recommended-badge">Recommended</span>
                    )}
                    <p>{method.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="mfa-method-setup">
            <h2>Setup {getMFAMethodDisplayName(selectedMethod)}</h2>

            {selectedMethod === MFA_METHODS.TOTP && (
              <div className="totp-setup">
                <p>
                  We'll help you set up an authenticator app for secure login.
                </p>
                <button
                  onClick={handleTOTPSetup}
                  disabled={loading}
                  className="setup-button"
                >
                  {loading ? "Setting up..." : "Generate QR Code"}
                </button>
              </div>
            )}

            {selectedMethod === MFA_METHODS.SMS && (
              <div className="sms-setup">
                <p>Enter your phone number to receive verification codes:</p>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  placeholder="+1 (555) 123-4567"
                  className="phone-input"
                />
                <button
                  onClick={handleSMSSetup}
                  disabled={loading || !formData.phoneNumber}
                  className="setup-button"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </button>
              </div>
            )}

            {selectedMethod === MFA_METHODS.EMAIL && (
              <div className="email-setup">
                <p>Enter your email address to receive verification codes:</p>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="your@email.com"
                  className="email-input"
                />
                <button
                  onClick={handleEmailSetup}
                  disabled={loading || !formData.email}
                  className="setup-button"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </button>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="mfa-verification">
            <h2>Verify Your Setup</h2>

            {selectedMethod === MFA_METHODS.TOTP && setupData.totp && (
              <div className="totp-verification">
                <p>Scan this QR code with your authenticator app:</p>
                <div className="qr-code-container">
                  <img
                    src={setupData.totp.qrCode}
                    alt="QR Code"
                    className="qr-code"
                  />
                </div>
                <p>
                  Or enter this code manually:{" "}
                  <code>{setupData.totp.manualEntryKey}</code>
                </p>
                <p>Then enter the 6-digit code from your app:</p>
              </div>
            )}

            {(selectedMethod === MFA_METHODS.SMS ||
              selectedMethod === MFA_METHODS.EMAIL) && (
              <div className="code-verification">
                <p>Enter the verification code we sent to you:</p>
              </div>
            )}

            <input
              type="text"
              value={formData.verificationCode}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  verificationCode: e.target.value,
                }))
              }
              placeholder={
                selectedMethod === MFA_METHODS.TOTP ? "123456" : "Enter code"
              }
              className="verification-input"
              maxLength={selectedMethod === MFA_METHODS.TOTP ? 6 : 8}
            />

            <button
              onClick={handleVerification}
              disabled={loading || !formData.verificationCode}
              className="verify-button"
            >
              {loading ? "Verifying..." : "Verify & Enable"}
            </button>
          </div>
        );

      case 4:
        return (
          <div className="mfa-success">
            <h2>🎉 Success!</h2>
            <p>Two-factor authentication has been enabled for your account.</p>

            {setupData.backupCodes && setupData.backupCodes.length > 0 && (
              <div className="backup-codes">
                <h3>🔐 Backup Codes</h3>
                <p>
                  Save these backup codes in a safe place. You can use them to
                  access your account if you lose your{" "}
                  {getMFAMethodDisplayName(selectedMethod).toLowerCase()}:
                </p>
                <div className="codes-list">
                  {setupData.backupCodes.map((code, index) => (
                    <code key={index} className="backup-code">
                      {code}
                    </code>
                  ))}
                </div>
                <p className="backup-warning">
                  ⚠️ These codes can only be used once. Store them securely!
                </p>
              </div>
            )}

            <button onClick={handleComplete} className="complete-button">
              Complete Setup
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mfa-setup-wizard">
      <div className="wizard-header">
        <div className="step-indicator">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`step ${currentStep >= step ? "active" : ""} ${currentStep > step ? "completed" : ""}`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content">
        {error && <div className="error-message">{error}</div>}

        {renderStepContent()}
      </div>

      <div className="wizard-footer">
        {currentStep > 1 && currentStep < 4 && (
          <button
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="back-button"
            disabled={loading}
          >
            Back
          </button>
        )}

        <button onClick={onCancel} className="cancel-button" disabled={loading}>
          Cancel
        </button>
      </div>

      <style>{`
        .mfa-setup-wizard {
          max-width: 500px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .wizard-header {
          margin-bottom: 2rem;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .step {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e5e7eb;
          color: #6b7280;
          font-weight: 600;
          position: relative;
        }

        .step.active {
          background: #3b82f6;
          color: white;
        }

        .step.completed {
          background: #10b981;
          color: white;
        }

        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 100%;
          width: 1rem;
          height: 2px;
          background: #e5e7eb;
          transform: translateY(-50%);
        }

        .step.completed:not(:last-child)::after {
          background: #10b981;
        }

        .wizard-content {
          min-height: 300px;
          margin-bottom: 2rem;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .method-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .method-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .method-option:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .method-option.recommended {
          border-color: #10b981;
        }

        .method-icon {
          font-size: 2rem;
        }

        .method-info h3 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
        }

        .method-info p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .recommended-badge {
          background: #10b981;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          margin-left: 0.5rem;
        }

        .phone-input,
        .email-input,
        .verification-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          margin: 1rem 0;
          font-size: 1rem;
        }

        .setup-button,
        .verify-button,
        .complete-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .setup-button:hover,
        .verify-button:hover,
        .complete-button:hover {
          background: #2563eb;
        }

        .setup-button:disabled,
        .verify-button:disabled,
        .complete-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .qr-code-container {
          text-align: center;
          margin: 1rem 0;
        }

        .qr-code {
          max-width: 200px;
          height: auto;
        }

        .backup-codes {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }

        .codes-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin: 1rem 0;
        }

        .backup-code {
          background: white;
          padding: 0.5rem;
          border-radius: 0.25rem;
          text-align: center;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .backup-warning {
          color: #d97706;
          font-weight: 600;
          margin: 0;
        }

        .wizard-footer {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .back-button,
        .cancel-button {
          background: transparent;
          border: 1px solid #d1d5db;
          color: #6b7280;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-button:hover,
        .cancel-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

MFASetupWizard.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  apiService: PropTypes.object.isRequired,
};

export default MFASetupWizard;
