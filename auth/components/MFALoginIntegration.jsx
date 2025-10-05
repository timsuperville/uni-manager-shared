import React, { useState } from "react";
import PropTypes from "prop-types";
import { MFAVerification } from "./MFAVerification.jsx";
import { MFASetupWizard } from "./MFASetupWizard.jsx";

/**
 * MFA Login Integration Component
 * Handles the MFA flow during login process
 */
export function MFALoginIntegration({
  loginResult,
  onLoginComplete,
  onLoginCancel,
  apiService,
}) {
  const [showSetup, setShowSetup] = useState(false);

  // Check if MFA is required or if user wants to set it up
  const isMFARequired = loginResult?.requiresMFA;
  const isMFASetupPrompt = loginResult?.promptMFASetup;
  const sessionId = loginResult?.sessionId;
  const availableMethods = loginResult?.availableMethods || [];

  const handleMFAVerificationSuccess = (result) => {
    if (onLoginComplete) {
      onLoginComplete({
        ...result,
        mfaVerified: true,
      });
    }
  };

  const handleMFASetupComplete = (setupResult) => {
    setShowSetup(false);
    if (onLoginComplete) {
      onLoginComplete({
        mfaSetup: setupResult,
        mfaEnabled: true,
      });
    }
  };

  const handleSkipMFASetup = () => {
    setShowSetup(false);
    if (onLoginComplete) {
      onLoginComplete({
        mfaSkipped: true,
      });
    }
  };

  // If MFA is required, show verification
  if (isMFARequired && sessionId) {
    return (
      <MFAVerification
        sessionId={sessionId}
        availableMethods={availableMethods}
        onSuccess={handleMFAVerificationSuccess}
        onCancel={onLoginCancel}
        apiService={apiService}
      />
    );
  }

  // If MFA setup is prompted and user chooses to set it up
  if ((isMFASetupPrompt || showSetup) && !isMFARequired) {
    return (
      <MFASetupWizard
        onComplete={handleMFASetupComplete}
        onCancel={handleSkipMFASetup}
        apiService={apiService}
      />
    );
  }

  // If MFA setup is suggested but not required
  if (isMFASetupPrompt && !showSetup) {
    return (
      <div className="mfa-setup-prompt">
        <div className="prompt-container">
          <div className="prompt-header">
            <div className="security-icon">🔒</div>
            <h2>Secure Your Account</h2>
            <p>
              Protect your account with two-factor authentication. This adds an
              extra layer of security to prevent unauthorized access.
            </p>
          </div>

          <div className="benefits-list">
            <div className="benefit-item">
              <span className="benefit-icon">✅</span>
              <span>Prevent unauthorized access</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✅</span>
              <span>Secure sensitive data</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✅</span>
              <span>Peace of mind</span>
            </div>
          </div>

          <div className="prompt-actions">
            <button onClick={() => setShowSetup(true)} className="setup-button">
              Set Up Two-Factor Authentication
            </button>

            <button onClick={handleSkipMFASetup} className="skip-button">
              Skip for now
            </button>
          </div>

          <p className="skip-note">
            You can always enable two-factor authentication later in your
            account settings.
          </p>
        </div>

        <style>{`
          .mfa-setup-prompt {
            max-width: 450px;
            margin: 0 auto;
            padding: 2rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .prompt-container {
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            text-align: center;
          }

          .prompt-header {
            margin-bottom: 1.5rem;
          }

          .security-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }

          .prompt-header h2 {
            margin: 0 0 1rem 0;
            color: #1f2937;
            font-size: 1.5rem;
          }

          .prompt-header p {
            margin: 0;
            color: #6b7280;
            line-height: 1.6;
          }

          .benefits-list {
            text-align: left;
            margin: 1.5rem 0;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 0.5rem;
          }

          .benefit-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }

          .benefit-item:last-child {
            margin-bottom: 0;
          }

          .benefit-icon {
            font-size: 1rem;
          }

          .prompt-actions {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin: 1.5rem 0;
          }

          .setup-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.875rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }

          .setup-button:hover {
            background: #2563eb;
          }

          .skip-button {
            background: transparent;
            border: 1px solid #d1d5db;
            color: #6b7280;
            padding: 0.875rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .skip-button:hover {
            background: #f9fafb;
            border-color: #9ca3af;
          }

          .skip-note {
            color: #9ca3af;
            font-size: 0.875rem;
            margin: 1rem 0 0 0;
          }
        `}</style>
      </div>
    );
  }

  // No MFA flow needed, complete login immediately
  if (onLoginComplete) {
    onLoginComplete({
      mfaNotRequired: true,
    });
  }

  return null;
}

MFALoginIntegration.propTypes = {
  loginResult: PropTypes.shape({
    requiresMFA: PropTypes.bool,
    promptMFASetup: PropTypes.bool,
    sessionId: PropTypes.string,
    availableMethods: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onLoginComplete: PropTypes.func.isRequired,
  onLoginCancel: PropTypes.func.isRequired,
  apiService: PropTypes.object.isRequired,
};

export default MFALoginIntegration;
