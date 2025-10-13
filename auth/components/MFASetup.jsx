/**
 * MFA Setup Component
 *
 * Provides a comprehensive multi-factor authentication setup flow including:
 * - QR code display for authenticator app setup
 * - Manual secret key entry option
 * - Token verification and MFA enablement
 * - Backup codes display and download
 * - Setup progress tracking
 *
 * Features:
 * - Step-by-step setup wizard
 * - QR code generation and display
 * - Backup codes secure display
 * - Setup completion confirmation
 * - Error handling and user guidance
 */

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Shield,
  Smartphone,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';

const MFASetup = ({ onSetupComplete, onCancel, className = '' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedStates, setCopiedStates] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);

  // Steps configuration
  const steps = [
    {
      id: 1,
      title: 'Setup Authenticator',
      description: 'Scan QR code or enter manual key',
    },
    {
      id: 2,
      title: 'Verify Setup',
      description: 'Enter code from your authenticator app',
    },
    {
      id: 3,
      title: 'Backup Codes',
      description: 'Save your backup recovery codes',
    },
    { id: 4, title: 'Complete', description: 'MFA is now enabled' },
  ];

  useEffect(() => {
    // Auto-start setup when component mounts
    if (currentStep === 1 && !setupData) {
      initializeMFASetup();
    }
  }, []);

  const initializeMFASetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof localStorage !== "undefined" && localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSetupData(data.data);
        setCurrentStep(2); // Move to verification step
      } else {
        throw new Error(data.message || 'Failed to initialize MFA setup');
      }
    } catch (_err) {
      setError(err.message || 'Failed to setup MFA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnableMFA = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/verify-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof localStorage !== "undefined" && localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep(3); // Move to backup codes step
      } else {
        throw new Error(data.message || 'Invalid verification code');
      }
    } catch (_err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyToClipboard = async (text, key) => {
    try {
      await typeof navigator !== "undefined" && navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [key]: true });
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [key]: false });
      }, 2000);
    } catch (_err) {
      // Fallback for browsers without clipboard API
      const textArea = typeof document !== "undefined" && document.createElement('textarea');
      textArea.value = text;
      typeof document !== "undefined" && document.body.appendChild(textArea);
      textArea.select();
      typeof document !== "undefined" && document.execCommand('copy');
      typeof document !== "undefined" && document.body.removeChild(textArea);
      setCopiedStates({ ...copiedStates, [key]: true });
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [key]: false });
      }, 2000);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const codesText = setupData.backupCodes.join("\n");
    const blob = new Blob(
      [
        `Uni-Manager MFA Backup Codes\n\nSave these codes in a secure location.\nEach code can only be used once.\n\n${codesText}\n\nGenerated: ${new Date().toISOString()}`,
      ],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = typeof document !== "undefined" && document.createElement('a');
    a.href = url;
    a.download = `uni-manager-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    typeof document !== "undefined" && document.body.appendChild(a);
    a.click();
    typeof document !== "undefined" && document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completeSetup = () => {
    setCurrentStep(4);
    setTimeout(() => {
      onSetupComplete && onSetupComplete();
    }, 2000);
  };

  const renderStepIndicator = () => (
    <div className='flex items-center justify-center mb-8'>
      {steps.map((step, index) => (
        <div key={step.id} className='flex items-center'>
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.id
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            {currentStep > step.id ? (
              <Check size={20} />
            ) : (
              <span className='text-sm font-medium'>{step.id}</span>
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-16 h-1 mx-2 ${
                currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderAuthenticatorStep = () => (
    <div className='text-center space-y-6'>
      <div className='flex items-center justify-center space-x-3 mb-6'>
        <Shield className='text-blue-600' size={32} />
        <h2 className='text-2xl font-bold text-gray-900'>
          Setup Authenticator App
        </h2>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          <span className='ml-3 text-gray-600'>Initializing MFA setup...</span>
        </div>
      ) : (
        <div className='space-y-6'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-start space-x-3'>
              <Smartphone className='text-blue-600 mt-1' size={20} />
              <div className='text-left'>
                <h3 className='font-medium text-blue-900'>
                  Download an Authenticator App
                </h3>
                <p className='text-sm text-blue-700 mt-1'>
                  Install Google Authenticator, Authy, or any compatible TOTP
                  app on your phone.
                </p>
              </div>
            </div>
          </div>

          {setupData && (
            <>
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Scan QR Code
                </h3>
                <div className='flex justify-center'>
                  <div className='bg-white p-6 rounded-lg border-2 border-gray-200'>
                    <img
                      src={setupData.qrCode}
                      alt='MFA QR Code'
                      className='w-48 h-48'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Or Enter Manual Key
                </h3>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <code className='text-sm font-mono break-all'>
                      {setupData.manualEntryKey}
                    </code>
                    <button
                      onClick={() =>
                        handleCopyToClipboard(
                          setupData.manualEntryKey,
                          'manual-key'
                        )
                      }
                      className='ml-2 p-2 text-gray-500 hover:text-gray-700 transition-colors'
                      title='Copy to clipboard'
                    >
                      {copiedStates['manual-key'] ? (
                        <Check size={16} className='text-green-600' />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderVerificationStep = () => (
    <div className='text-center space-y-6'>
      <div className='flex items-center justify-center space-x-3 mb-6'>
        <Shield className='text-blue-600' size={32} />
        <h2 className='text-2xl font-bold text-gray-900'>Verify Setup</h2>
      </div>

      <div className='space-y-6'>
        <p className='text-gray-600'>
          Enter the 6-digit code from your authenticator app to verify the
          setup.
        </p>

        <div className='space-y-4'>
          <div className='flex justify-center'>
            <input
              type='text'
              value={verificationToken}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationToken(value);
                setError('');
              }}
              placeholder='000000'
              className='text-center text-2xl font-mono tracking-widest w-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              maxLength={6}
              autoComplete='off'
            />
          </div>

          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-center space-x-2'>
                <AlertCircle className='text-red-600' size={16} />
                <p className='text-sm text-red-700'>{error}</p>
              </div>
            </div>
          )}

          <div className='flex justify-center space-x-4'>
            <button
              onClick={onCancel}
              className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              onClick={verifyAndEnableMFA}
              disabled={verificationToken.length !== 6 || isVerifying}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isVerifying ? (
                <div className='flex items-center space-x-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify & Enable MFA'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupCodesStep = () => (
    <div className='text-center space-y-6'>
      <div className='flex items-center justify-center space-x-3 mb-6'>
        <Shield className='text-green-600' size={32} />
        <h2 className='text-2xl font-bold text-gray-900'>Save Backup Codes</h2>
      </div>

      <div className='space-y-6'>
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='text-yellow-600 mt-1' size={20} />
            <div className='text-left'>
              <h3 className='font-medium text-yellow-900'>
                Important: Save These Codes
              </h3>
              <p className='text-sm text-yellow-700 mt-1'>
                These backup codes can be used to access your account if you
                lose your authenticator app. Each code can only be used once.
                Store them in a secure location.
              </p>
            </div>
          </div>
        </div>

        {setupData?.backupCodes && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium text-gray-900'>
                Backup Recovery Codes
              </h3>
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className='flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800'
              >
                {showBackupCodes ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showBackupCodes ? 'Hide' : 'Show'} Codes</span>
              </button>
            </div>

            {showBackupCodes && (
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
                <div className='grid grid-cols-2 gap-4'>
                  {setupData.backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2'
                    >
                      <code className='font-mono text-sm'>{code}</code>
                      <button
                        onClick={() =>
                          handleCopyToClipboard(code, `code-${index}`)
                        }
                        className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
                        title='Copy code'
                      >
                        {copiedStates[`code-${index}`] ? (
                          <Check size={14} className='text-green-600' />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <div className='flex justify-center space-x-4 mt-6'>
                  <button
                    onClick={() =>
                      handleCopyToClipboard(
                        setupData.backupCodes.join("\n'),
                        'all-codes'
                      )
                    }
                    className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
                  >
                    {copiedStates['all-codes'] ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                    <span>Copy All</span>
                  </button>
                  <button
                    onClick={downloadBackupCodes}
                    className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className='flex justify-center'>
          <button
            onClick={completeSetup}
            className='px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            I've Saved My Backup Codes
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className='text-center space-y-6'>
      <div className='flex items-center justify-center space-x-3 mb-6'>
        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
          <Check className='text-green-600' size={32} />
        </div>
      </div>

      <div className='space-y-4'>
        <h2 className='text-2xl font-bold text-gray-900'>
          MFA Successfully Enabled!
        </h2>
        <p className='text-gray-600'>
          Your account is now protected with two-factor authentication. You'll
          need to enter a code from your authenticator app when signing in.
        </p>
      </div>

      <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
        <div className='flex items-start space-x-3'>
          <Shield className='text-green-600 mt-1' size={20} />
          <div className='text-left'>
            <h3 className='font-medium text-green-900'>
              Your Account is More Secure
            </h3>
            <p className='text-sm text-green-700 mt-1'>
              Even if someone discovers your password, they won't be able to
              access your account without your authenticator app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`max-w-2xl mx-auto bg-white rounded-lg shadow-lg ${className}`}
    >
      <div className='p-8'>
        {renderStepIndicator()}

        {currentStep === 1 && renderAuthenticatorStep()}
        {currentStep === 2 && renderVerificationStep()}
        {currentStep === 3 && renderBackupCodesStep()}
        {currentStep === 4 && renderCompleteStep()}

        {error && currentStep === 1 && (
          <div className='mt-6 bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center space-x-2'>
              <AlertCircle className='text-red-600' size={16} />
              <p className='text-sm text-red-700'>{error}</p>
            </div>
            <div className='mt-3'>
              <button
                onClick={initializeMFASetup}
                className='text-sm text-red-600 hover:text-red-800 underline'
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFASetup;
