/**
 * MFA Management Component
 *
 * Provides comprehensive MFA management interface including:
 * - MFA status display and configuration
 * - Enable/disable MFA functionality
 * - Backup codes management and regeneration
 * - Trusted devices management
 * - Security settings and preferences
 *
 * Features:
 * - Real-time status updates
 * - Secure operations with verification
 * - Device trust management
 * - Backup codes regeneration
 * - Security audit information
 */

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Smartphone,
  Key,
  Monitor,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import MFASetup from "./MFASetup";
import MFAVerification from "./MFAVerification";

const MFAManagement = ({ className = "" }) => {
  const [mfaStatus, setMfaStatus] = useState(null);
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationPurpose, setVerificationPurpose] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMFAStatus();
    loadTrustedDevices();
  }, []);

  const loadMFAStatus = async () => {
    try {
      const response = await fetch("/api/auth/mfa/status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMfaStatus(data.data);
      } else {
        throw new Error(data.message || "Failed to load MFA status");
      }
    } catch (err) {
      setError("Failed to load MFA status");
      console.error("MFA status error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrustedDevices = async () => {
    try {
      const response = await fetch("/api/auth/mfa/trusted-devices", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTrustedDevices(data.data || []);
      }
    } catch (err) {
      console.error("Trusted devices error:", err);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    loadMFAStatus();
    loadTrustedDevices();
  };

  const handleVerificationSuccess = async (result) => {
    setShowVerification(false);

    if (verificationPurpose === "disable") {
      await performDisableMFA(result);
    } else if (verificationPurpose === "regenerate") {
      await performRegenerateBackupCodes(result);
    }
  };

  const startDisableMFA = () => {
    setVerificationPurpose("disable");
    setShowVerification(true);
    setShowDisableConfirm(false);
  };

  const performDisableMFA = async () => {
    try {
      // This would be handled by the verification flow
      // The actual disable happens in the MFA verification component
      await loadMFAStatus();
    } catch (err) {
      setError("Failed to disable MFA");
    }
  };

  const startRegenerateBackupCodes = () => {
    setVerificationPurpose("regenerate");
    setShowVerification(true);
    setShowRegenerateConfirm(false);
  };

  const performRegenerateBackupCodes = async () => {
    try {
      // This would be handled by the verification flow
      await loadMFAStatus();
    } catch (err) {
      setError("Failed to regenerate backup codes");
    }
  };

  const revokeTrustedDevice = async (fingerprint) => {
    try {
      const response = await fetch(
        `/api/auth/mfa/trusted-devices/${fingerprint}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        await loadTrustedDevices();
      } else {
        throw new Error(data.message || "Failed to revoke device");
      }
    } catch (err) {
      setError("Failed to revoke device trust");
    }
  };

  const downloadBackupCodes = () => {
    if (!newBackupCodes) return;

    const codesText = newBackupCodes.join("\n");
    const blob = new Blob(
      [
        `Uni-Manager MFA Backup Codes\n\nGenerated: ${new Date().toISOString()}\n\n${codesText}`,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMFAStatus = () => {
    if (!mfaStatus) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {mfaStatus.isEnabled ? (
              <ShieldCheck className="text-green-600" size={24} />
            ) : (
              <ShieldX className="text-gray-400" size={24} />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600">
                {mfaStatus.isEnabled
                  ? "Your account is protected with 2FA"
                  : "Add an extra layer of security to your account"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                mfaStatus.isEnabled
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {mfaStatus.isEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>
        </div>

        {mfaStatus.isEnabled && (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Enabled:</span>
                <span className="ml-2 text-gray-900">
                  {formatDate(mfaStatus.enabledDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last used:</span>
                <span className="ml-2 text-gray-900">
                  {formatDate(mfaStatus.lastUsed)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Backup codes:</span>
                <span className="ml-2 text-gray-900">
                  {mfaStatus.backupCodeCount} remaining
                </span>
              </div>
              <div>
                <span className="text-gray-500">Trusted devices:</span>
                <span className="ml-2 text-gray-900">
                  {mfaStatus.trustedDeviceCount} active
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!mfaStatus.isEnabled ? (
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Enable 2FA</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowRegenerateConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={16} />
                <span>Regenerate Backup Codes</span>
              </button>
              <button
                onClick={() => setShowDisableConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                <ShieldX size={16} />
                <span>Disable 2FA</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderTrustedDevices = () => {
    if (!mfaStatus?.isEnabled) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Monitor className="text-blue-600" size={24} />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Trusted Devices
              </h3>
              <p className="text-sm text-gray-600">
                Devices that can skip 2FA verification for 30 days
              </p>
            </div>
          </div>
        </div>

        {trustedDevices.length === 0 ? (
          <div className="text-center py-8">
            <Monitor className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No trusted devices</p>
            <p className="text-sm text-gray-400 mt-1">
              You can trust devices during login to skip 2FA verification
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trustedDevices.map((device, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Monitor className="text-gray-400" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">
                      {device.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Trusted {formatDate(device.trustedDate)} • Last used{" "}
                      {formatDate(device.lastUsed)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Expires {formatDate(device.expiresAt)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => revokeTrustedDevice(device.fingerprint)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  title="Revoke trust"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderConfirmationModals = () => (
    <>
      {/* Disable MFA Confirmation */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="text-red-600" size={24} />
              <h3 className="text-lg font-medium text-gray-900">
                Disable Two-Factor Authentication
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to disable 2FA? This will make your account
              less secure. You'll need to verify your identity with a 2FA code
              to proceed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDisableConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startDisableMFA}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Confirmation */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <Key className="text-yellow-600" size={24} />
              <h3 className="text-lg font-medium text-gray-900">
                Regenerate Backup Codes
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will generate new backup codes and invalidate all existing
              ones. Make sure to save the new codes securely. You'll need to
              verify your identity to proceed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startRegenerateBackupCodes}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 h-48 rounded-lg"></div>
          <div className="bg-gray-200 h-32 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-600" size={16} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {renderMFAStatus()}
      {renderTrustedDevices()}

      {/* New Backup Codes Display */}
      {newBackupCodes && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              New Backup Codes
            </h3>
            <button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {showBackupCodes ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showBackupCodes ? "Hide" : "Show"}</span>
            </button>
          </div>

          {showBackupCodes && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">
                  Save these codes in a secure location. Each code can only be
                  used once.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {newBackupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded px-3 py-2"
                  >
                    <code className="font-mono text-sm">{code}</code>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={downloadBackupCodes}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setNewBackupCodes(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  I've Saved These Codes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MFA Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <MFASetup
            onSetupComplete={handleSetupComplete}
            onCancel={() => setShowSetup(false)}
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          />
        </div>
      )}

      {/* MFA Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <MFAVerification
            userId={mfaStatus?.userId} // This would need to come from auth context
            onVerificationSuccess={handleVerificationSuccess}
            onCancel={() => setShowVerification(false)}
            className="max-w-md w-full"
          />
        </div>
      )}

      {renderConfirmationModals()}
    </div>
  );
};

export default MFAManagement;
