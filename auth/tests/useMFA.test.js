import { renderHook, act } from '@testing-library/react';
import { useMFA } from '../hooks/useMFA';
import { useAuth } from '../hooks/useAuth';
import { MFAService } from '../services/mfaService';

// Mock dependencies
jest.mock('../hooks/useAuth');
jest.mock('../services/mfaService');

describe('useMFA', () => {
    const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        mfaStatus: 'disabled'
    };
    const mockToken = 'fake-jwt-token';

    // Mock service instance methods
    const mockServiceMethods = {
        setupTOTP: jest.fn(),
        setupSMS: jest.fn(),
        verifyTOTPSetup: jest.fn(),
        verifyTOTP: jest.fn(),
        disableMFA: jest.fn(),
        generateBackupCodes: jest.fn(),
    };

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock useAuth
        useAuth.mockReturnValue({
            user: mockUser,
            token: mockToken
        });

        // Mock MFAService constructor to return our mock methods
        MFAService.mockImplementation(() => mockServiceMethods);
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useMFA());
        expect(result.current.mfaStatus).toBe('disabled');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.backupCodes).toEqual([]);
    });

    it('should initialize MFAService with token', () => {
        renderHook(() => useMFA());
        expect(MFAService).toHaveBeenCalledWith(mockToken);
    });

    it('should handle MFA setup for TOTP', async () => {
        const mockSetupResponse = { qrCode: 'data:image/...', secret: 'XYZ' };
        mockServiceMethods.setupTOTP.mockResolvedValue(mockSetupResponse);

        const { result } = renderHook(() => useMFA());

        let setupResult;
        await act(async () => {
            setupResult = await result.current.setupMFA('totp');
        });

        expect(mockServiceMethods.setupTOTP).toHaveBeenCalledWith(mockUser.email);
        expect(setupResult).toEqual(mockSetupResponse);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should handle MFA verification during setup', async () => {
        const mockVerifyResponse = { success: true };
        const mockBackupCodes = { backupCodes: ['code1', 'code2'] };

        mockServiceMethods.verifyTOTPSetup.mockResolvedValue(mockVerifyResponse);
        mockServiceMethods.generateBackupCodes.mockResolvedValue(mockBackupCodes);

        const { result } = renderHook(() => useMFA());

        await act(async () => {
            await result.current.verifyCode('123456', true);
        });

        expect(mockServiceMethods.verifyTOTPSetup).toHaveBeenCalledWith('123456');
        expect(mockServiceMethods.generateBackupCodes).toHaveBeenCalled();
        expect(result.current.backupCodes).toEqual(['code1', 'code2']);
    });

    it('should handle MFA disable', async () => {
        mockServiceMethods.disableMFA.mockResolvedValue({ success: true });

        const { result } = renderHook(() => useMFA());

        await act(async () => {
            await result.current.disableMFA('totp');
        });

        expect(mockServiceMethods.disableMFA).toHaveBeenCalledWith('totp', null);
        expect(result.current.error).toBe(null);
    });

    it('should handle errors correctly', async () => {
        const errorMsg = 'Invalid code';
        mockServiceMethods.verifyTOTP.mockRejectedValue(new Error(errorMsg));

        const { result } = renderHook(() => useMFA());

        await act(async () => {
            try {
                await result.current.verifyCode('000000', false);
            } catch (e) {
                // Expected error
            }
        });

        expect(result.current.error).toBe(errorMsg);
        expect(result.current.isLoading).toBe(false);
    });
});
