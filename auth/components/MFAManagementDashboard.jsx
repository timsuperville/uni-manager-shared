import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MFAService } from '../services/mfaService.js';
import { MFASetupWizard } from './MFASetupWizard.jsx';

export const MFAManagementDashboard = ({ onClose }) => {
  const [mfaStatus, setMfaStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [regeneratingCodes, setRegeneratingCodes] = useState(false);
  const [disablingMethod, setDisablingMethod] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState([]);

  const mfaService = new MFAService();

  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    try {
      setLoading(true);
      const status = await mfaService.getMFAStatus();
      setMfaStatus(status);
      setError('');
    } catch (err) {
      setError(`Failed to load MFA status: ${err.message}`);
      console.error('MFA status loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = (result) => {
    setShowSetupWizard(false);
    if (result.success) {
      loadMFAStatus(); // Refresh status
    }
  };

  const handleDisableMethod = async (method) => {
    if (
      !confirm(
        `Are you sure you want to disable ${method.toUpperCase()} authentication? You may lose access to your account if you don't have other MFA methods enabled.`
      )
    ) {
      return;
    }

    try {
      setDisablingMethod(method);
      await mfaService.disableMFA(method);
      await loadMFAStatus(); // Refresh status
      setError('');
    } catch (err) {
      setError(`Failed to disable ${method}: ${err.message}`);
      console.error('MFA disable error:', err);
    } finally {
      setDisablingMethod('');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (
      !confirm(
        'Are you sure you want to regenerate backup codes? This will invalidate all existing backup codes.'
      )
    ) {
      return;
    }

    try {
      setRegeneratingCodes(true);
      const result = await mfaService.generateBackupCodes();
      setNewBackupCodes(result.backupCodes);
      await loadMFAStatus(); // Refresh status
      setError('');
    } catch (err) {
      setError(`Failed to regenerate backup codes: ${err.message}`);
      console.error('Backup codes regeneration error:', err);
    } finally {
      setRegeneratingCodes(false);
    }
  };

  const formatMethodName = (method) => {
    switch (method) {
      case 'totp':
        return 'Authenticator App';
      case 'sms':
        return 'SMS Text Message';
      case 'email':
        return 'Email Verification';
      case 'webauthn':
        return 'Security Key/Biometric';
      default:
        return method.toUpperCase();
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'totp':
        return '📱';
      case 'sms':
        return '💬';
      case 'email':
        return '📧';
      case 'webauthn':
        return '🔐';
      default:
        return '🔒';
    }
  };

  if (loading) {
    return (
      <div className='mfa-dashboard'>
        <div className='mfa-dashboard-header'>
          <h2>Multi-Factor Authentication</h2>
          <button onClick={onClose} className='close-button'>
            ×
          </button>
        </div>
        <div className='loading-state'>
          <div className='loading-spinner'></div>
          <p>Loading MFA settings...</p>
        </div>
      </div>
    );
  }

  if (showSetupWizard) {
    return (
      <div className='mfa-dashboard'>
        <div className='mfa-dashboard-header'>
          <h2>Setup Multi-Factor Authentication</h2>
          <button
            onClick={() => setShowSetupWizard(false)}
            className='close-button'
          >
            ×
          </button>
        </div>
        <MFASetupWizard onComplete={handleSetupComplete} />
      </div>
    );
  }

  return (
    <div className='mfa-dashboard'>
      <div className='mfa-dashboard-header'>
        <h2>Multi-Factor Authentication</h2>
        <button onClick={onClose} className='close-button'>
          ×
        </button>
      </div>

      {error && (
        <div className='error-message'>
          <span className='error-icon'>⚠️</span>
          {error}
          <button onClick={() => setError('')} className='error-dismiss'>
            ×
          </button>
        </div>
      )}

      <div className='mfa-dashboard-content'>
        {/* MFA Status Overview */}
        <div className='mfa-status-card'>
          <div className='status-header'>
            <h3>Security Status</h3>
            <div
              className={`status-indicator ${mfaStatus?.enabled ? 'enabled' : 'disabled'}`}
            >
              {mfaStatus?.enabled ? '🛡️ Protected' : '⚠️ Vulnerable'}
            </div>
          </div>
          <p>
            {mfaStatus?.enabled
              ? `You have ${mfaStatus.methods?.length || 0} MFA method(s) enabled for enhanced security.`
              : 'Your account is not protected by multi-factor authentication. Enable MFA to secure your account.'}
          </p>
          {!mfaStatus?.enabled && (
            <button
              onClick={() => setShowSetupWizard(true)}
              className='primary-button'
            >
              Enable MFA Protection
            </button>
          )}
        </div>

        {/* Active MFA Methods */}
        {mfaStatus?.enabled && mfaStatus.methods?.length > 0 && (
          <div className='mfa-methods-card'>
            <h3>Active MFA Methods</h3>
            <div className='methods-list'>
              {mfaStatus.methods.map((method) => (
                <div key={method} className='method-item'>
                  <div className='method-info'>
                    <span className='method-icon'>{getMethodIcon(method)}</span>
                    <div className='method-details'>
                      <span className='method-name'>
                        {formatMethodName(method)}
                      </span>
                      <span className='method-status'>Active</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisableMethod(method)}
                    disabled={
                      disablingMethod === method ||
                      mfaStatus.methods.length === 1
                    }
                    className='danger-button small'
                    title={
                      mfaStatus.methods.length === 1
                        ? 'Cannot disable the last MFA method'
                        : 'Disable this method'
                    }
                  >
                    {disablingMethod === method ? 'Disabling...' : 'Disable'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backup Codes Section */}
        {mfaStatus?.enabled && (
          <div className='backup-codes-card'>
            <h3>Backup Recovery Codes</h3>
            <div className='backup-codes-info'>
              <p>
                {mfaStatus.recoveryCodesRemaining > 0
                  ? `You have ${mfaStatus.recoveryCodesRemaining} backup codes remaining.`
                  : 'You have no backup codes remaining. Generate new ones immediately.'}
              </p>
              <p className='backup-codes-warning'>
                ⚠️ Backup codes allow account access if you lose your MFA
                device. Store them securely.
              </p>
            </div>
            <button
              onClick={handleRegenerateBackupCodes}
              disabled={regeneratingCodes}
              className={
                mfaStatus.recoveryCodesRemaining === 0
                  ? 'danger-button'
                  : 'secondary-button'
              }
            >
              {regeneratingCodes
                ? 'Generating...'
                : 'Generate New Backup Codes'}
            </button>

            {/* Show newly generated backup codes */}
            {newBackupCodes.length > 0 && (
              <div className='new-backup-codes'>
                <h4>🔑 Your New Backup Codes</h4>
                <p className='backup-codes-instructions'>
                  Save these codes in a secure location. Each code can only be
                  used once.
                </p>
                <div className='backup-codes-grid'>
                  {newBackupCodes.map((code, index) => (
                    <div key={index} className='backup-code'>
                      <code>{code}</code>
                    </div>
                  ))}
                </div>
                <div className='backup-codes-actions'>
                  <button
                    onClick={() =>
                      typeof navigator !== "undefined" && navigator.clipboard.writeText(newBackupCodes.join("\n"))
                    }
                    className='secondary-button'
                  >
                    📋 Copy All Codes
                  </button>
                  <button
                    onClick={() => setNewBackupCodes([])}
                    className='primary-button'
                  >
                    I've Saved These Codes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add More Methods */}
        {mfaStatus?.enabled && (
          <div className='add-methods-card'>
            <h3>Add Additional Protection</h3>
            <p>
              Increase your account security by enabling multiple MFA methods.
            </p>
            <button
              onClick={() => setShowSetupWizard(true)}
              className='secondary-button'
            >
              + Add Another MFA Method
            </button>
          </div>
        )}

        {/* MFA Information */}
        <div className='mfa-info-card'>
          <h3>About Multi-Factor Authentication</h3>
          <div className='info-content'>
            <p>
              Multi-Factor Authentication (MFA) adds an extra layer of security
              to your account by requiring a second form of verification in
              addition to your password.
            </p>
            <div className='info-methods'>
              <div className='info-method'>
                <span className='info-icon'>📱</span>
                <div>
                  <strong>Authenticator App</strong>
                  <p>
                    Most secure option using apps like Google Authenticator or
                    Authy
                  </p>
                </div>
              </div>
              <div className='info-method'>
                <span className='info-icon'>💬</span>
                <div>
                  <strong>SMS Text Message</strong>
                  <p>Receive verification codes via text message</p>
                </div>
              </div>
              <div className='info-method'>
                <span className='info-icon'>📧</span>
                <div>
                  <strong>Email Verification</strong>
                  <p>Receive verification codes via email</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Activity */}
        {mfaStatus?.lastUsed && (
          <div className='last-activity-card'>
            <h3>Recent Activity</h3>
            <p>
              MFA last used: {new Date(mfaStatus.lastUsed).toLocaleString()}
            </p>
            {mfaStatus.setupDate && (
              <p>
                MFA enabled:{' '}
                {new Date(mfaStatus.setupDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .mfa-dashboard {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .mfa-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .mfa-dashboard-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }

        .close-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .mfa-dashboard-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .mfa-status-card,
        .mfa-methods-card,
        .backup-codes-card,
        .add-methods-card,
        .mfa-info-card,
        .last-activity-card {
          padding: 20px;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          background: #fafbfc;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .status-indicator {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .status-indicator.enabled {
          background: #d4edda;
          color: #155724;
        }

        .status-indicator.disabled {
          background: #f8d7da;
          color: #721c24;
        }

        .methods-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .method-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
        }

        .method-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .method-icon {
          font-size: 24px;
        }

        .method-details {
          display: flex;
          flex-direction: column;
        }

        .method-name {
          font-weight: 500;
          color: #333;
        }

        .method-status {
          font-size: 12px;
          color: #28a745;
        }

        .backup-codes-info p {
          margin-bottom: 8px;
        }

        .backup-codes-warning {
          font-size: 14px;
          color: #856404;
          font-style: italic;
        }

        .new-backup-codes {
          margin-top: 20px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }

        .backup-codes-instructions {
          color: #495057;
          margin-bottom: 16px;
        }

        .backup-codes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 16px;
        }

        .backup-code {
          background: white;
          padding: 8px;
          border-radius: 4px;
          text-align: center;
          border: 1px solid #dee2e6;
        }

        .backup-code code {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #495057;
        }

        .backup-codes-actions {
          display: flex;
          gap: 12px;
        }

        .info-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .info-method {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .info-icon {
          font-size: 24px;
          margin-top: 4px;
        }

        .info-method strong {
          display: block;
          margin-bottom: 4px;
          color: #333;
        }

        .info-method p {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }

        .primary-button,
        .secondary-button,
        .danger-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .primary-button {
          background: #007bff;
          color: white;
        }

        .primary-button:hover {
          background: #0056b3;
        }

        .secondary-button {
          background: #6c757d;
          color: white;
        }

        .secondary-button:hover {
          background: #545b62;
        }

        .danger-button {
          background: #dc3545;
          color: white;
        }

        .danger-button:hover:not(:disabled) {
          background: #c82333;
        }

        .danger-button.small {
          padding: 6px 12px;
          font-size: 12px;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          color: #6c757d;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .error-icon {
          font-size: 18px;
        }

        .error-dismiss {
          background: none;
          border: none;
          color: #721c24;
          cursor: pointer;
          font-size: 18px;
          margin-left: auto;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .mfa-dashboard {
            margin: 0;
            border-radius: 0;
            min-height: 100vh;
          }

          .backup-codes-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .backup-codes-actions {
            flex-direction: column;
          }

          .method-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

MFAManagementDashboard.propTypes = {
  onClose: PropTypes.func.isRequired,
};
