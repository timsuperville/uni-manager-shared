import { renderHook, act } from '@testing-library/react';
import { useDeviceTrust } from '../hooks/useDeviceTrust';
import { useAuth } from '../hooks/useAuth';
import { MFAService } from '../services/mfaService';
import { generateDeviceFingerprint } from '../utils/socialAuth';

// Mock dependencies
vi.mock('../hooks/useAuth');
vi.mock('../services/mfaService');
vi.mock('../utils/socialAuth');

describe('useDeviceTrust', () => {
    const mockToken = 'fake-token';
    const mockFingerprint = 'device-123';

    const mockServiceMethods = {
        checkDeviceTrust: vi.fn(),
        addTrustedDevice: vi.fn(),
        removeTrustedDevice: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        useAuth.mockReturnValue({ token: mockToken });
        generateDeviceFingerprint.mockResolvedValue(mockFingerprint);
        MFAService.mockImplementation(function () {
            return mockServiceMethods;
        });
    });

    it('should initialize and generate fingerprint', async () => {
        mockServiceMethods.checkDeviceTrust.mockResolvedValue({ isTrusted: false });

        const { result } = renderHook(() => useDeviceTrust());

        // Wait for effects
        await act(async () => { });

        expect(generateDeviceFingerprint).toHaveBeenCalled();
        expect(result.current.deviceFingerprint).toBe(mockFingerprint);
        expect(mockServiceMethods.checkDeviceTrust).toHaveBeenCalledWith(mockFingerprint);
        expect(result.current.isTrusted).toBe(false);
    });

    it('should handle trust device flow', async () => {
        mockServiceMethods.checkDeviceTrust.mockResolvedValue({ isTrusted: false });

        const { result } = renderHook(() => useDeviceTrust());
        await act(async () => { });

        mockServiceMethods.addTrustedDevice.mockResolvedValue({ success: true });

        await act(async () => {
            await result.current.trustDevice();
        });

        expect(mockServiceMethods.addTrustedDevice).toHaveBeenCalled();
        expect(result.current.isTrusted).toBe(true);
    });

    it('should handle untrust device flow', async () => {
        mockServiceMethods.checkDeviceTrust.mockResolvedValue({ isTrusted: true });

        const { result } = renderHook(() => useDeviceTrust());
        await act(async () => { });

        expect(result.current.isTrusted).toBe(true);

        mockServiceMethods.removeTrustedDevice.mockResolvedValue({ success: true });

        await act(async () => {
            await result.current.untrustDevice();
        });

        expect(mockServiceMethods.removeTrustedDevice).toHaveBeenCalledWith(mockFingerprint);
        expect(result.current.isTrusted).toBe(false);
    });
});
