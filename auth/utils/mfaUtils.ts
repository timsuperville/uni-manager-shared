/**
 * MFA Utility Functions
 *
 * Pure helper functions for phone number formatting, code validation,
 * and display metadata for each MFA method.
 *
 * These have no dependency on the MFAService class and can be imported
 * directly without loading the full service.
 */

import { MFA_METHOD, type MFAMethod } from "../types/mfaConstants.ts";

// Re-export so callers who import from mfaUtils don't need a second import.
export type { MFAMethod };

// -- Display helpers ----------------------------------------------------------

/** Map each MFA method to its user-readable display name. */
export function getMFAMethodDisplayName(method: MFAMethod): string {
  const displayNames: Record<string, string> = {
    [MFA_METHOD.TOTP]: "Authenticator App",
    [MFA_METHOD.SMS]: "SMS Text Message",
    [MFA_METHOD.EMAIL]: "Email Code",
    [MFA_METHOD.WEBAUTHN]: "Security Key",
    backup: "Backup Codes",
  };
  return displayNames[method] ?? method;
}

/** Map each MFA method to an icon identifier. */
export function getMFAMethodIcon(method: MFAMethod): string {
  const icons: Record<string, string> = {
    [MFA_METHOD.TOTP]: "shield",
    [MFA_METHOD.SMS]: "smartphone",
    [MFA_METHOD.EMAIL]: "mail",
    [MFA_METHOD.WEBAUTHN]: "fingerprint",
    backup: "key",
  };
  return icons[method] ?? "shield";
}

// ── Validation helpers ────────────────────────────────────────────────────────

/** Returns true if the string is a 6-digit TOTP code. */
export function validateTOTPCode(code: string): boolean {
  if (!code) return false;
  return /^\d{6}$/.test(code.toString().trim());
}

/** Returns true if the string is a 4-6 digit SMS code. */
export function validateSMSCode(code: string): boolean {
  if (!code) return false;
  return /^\d{4,6}$/.test(code.toString().trim());
}

// ── Format helpers ────────────────────────────────────────────────────────────

/** Normalises a phone number string into a human-readable format. */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `+${cleaned[0]} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
