import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import MFAVerification from "./MFAVerification.jsx";
import { MFASetupWizard } from "./MFASetupWizard.jsx";

/**
 * MFA Login Integration Component
 * Handles the MFA flow during login process.
 *
 * AUTH-05: Replaced raw <style> tag with Tailwind classes.
 * AUTH-13: Moved the side-effect `onLoginComplete()` call from the render path
 *          into a useEffect so it never fires during the render cycle.
 */
export function MFALoginIntegration({
  loginResult,
  onLoginComplete,
  onLoginCancel,
  apiService,
}) {
  const [showSetup, setShowSetup] = useState(false);

  const isMFARequired = loginResult?.requiresMFA;
  const isMFASetupPrompt = loginResult?.promptMFASetup;
  const sessionId = loginResult?.sessionId;
  const availableMethods = loginResult?.availableMethods || [];

  // AUTH-13: Fire the "no MFA required" completion as a side-effect, not in render
  useEffect(() => {
    if (!isMFARequired && !isMFASetupPrompt && onLoginComplete) {
      onLoginComplete({ mfaNotRequired: true });
    }
  }, [isMFARequired, isMFASetupPrompt, onLoginComplete]);

  const handleMFAVerificationSuccess = (result) => {
    onLoginComplete?.({ ...result, mfaVerified: true });
  };

  const handleMFASetupComplete = (setupResult) => {
    setShowSetup(false);
    onLoginComplete?.({ mfaSetup: setupResult, mfaEnabled: true });
  };

  const handleSkipMFASetup = () => {
    setShowSetup(false);
    onLoginComplete?.({ mfaSkipped: true });
  };

  // MFA verification required
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

  // MFA setup flow (user opted in or setup was prompted + user clicked "Set Up")
  if ((isMFASetupPrompt || showSetup) && !isMFARequired) {
    return (
      <MFASetupWizard
        onComplete={handleMFASetupComplete}
        onCancel={handleSkipMFASetup}
        apiService={apiService}
      />
    );
  }

  // AUTH-05: MFA setup upsell prompt — replaces the 100-line inline <style> block
  // with Tailwind/Liquid Glass classes consistent with the rest of the auth system.
  if (isMFASetupPrompt && !showSetup) {
    return (
      <div className="max-w-sm mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 text-center">
          {/* Icon */}
          <div className="text-5xl mb-4" aria-hidden="true">
            🔒
          </div>

          {/* Copy */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Secure Your Account
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">
            Protect your account with two-factor authentication — an extra layer
            of security that prevents unauthorized access even if your password
            is compromised.
          </p>

          {/* Benefits */}
          <ul className="text-left space-y-2 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            {[
              "Prevent unauthorized access",
              "Secure sensitive data",
              "Peace of mind",
            ].map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="text-green-500 shrink-0" aria-hidden="true">
                  ✓
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowSetup(true)}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Set Up Two-Factor Authentication
            </button>
            <button
              onClick={handleSkipMFASetup}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none"
            >
              Skip for now
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            You can always enable two-factor authentication later in your
            account settings.
          </p>
        </div>
      </div>
    );
  }

  // No MFA flow — useEffect above handles completion; render nothing
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
