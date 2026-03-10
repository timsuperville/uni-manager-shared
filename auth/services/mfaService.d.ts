/**
 * TACTICAL: Type shim for mfaService.js until Wave 3 TypeScript migration.
 */

export declare class MFAService {
    [key: string]: unknown;
}

export declare const MFA_METHODS: Record<string, string>;
export declare const MFA_STATUS: Record<string, string>;
export declare function formatPhoneNumber(phone: string): string;
export declare function validateTOTPCode(code: string): boolean;

declare const mfaService: MFAService;
export default mfaService;
