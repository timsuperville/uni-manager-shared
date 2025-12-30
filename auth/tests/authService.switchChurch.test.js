import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../services/authService';
import { tokenStorage } from '../utils/tokenStorage';

// Mock fetch
global.fetch = vi.fn();

// Mock tokenStorage
vi.mock('../utils/tokenStorage', () => ({
    tokenStorage: {
        updateUser: vi.fn(),
        getAccessToken: vi.fn(),
        setTokens: vi.fn(),
        clearTokens: vi.fn(),
    },
}));

describe('AuthService - switchChurch', () => {
    let authService;
    const mockChurchId = 'church123';
    const mockCurrentChurchId = 'currentChurch456';
    const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        currentChurch: mockCurrentChurchId,
        churches: [
            { church: mockCurrentChurchId, role: 'admin' },
            { church: mockChurchId, role: 'member' },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        authService = new AuthService({
            apiBaseUrl: 'http://localhost:5000',
            appType: 'church',
        });
        authService.currentUser = mockUser;
        authService.sessionToken = 'mock-token';
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully switch to a different church', async () => {
        const updatedUser = {
            ...mockUser,
            currentChurch: mockChurchId,
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
                success: true,
                user: updatedUser,
            }),
        });

        const result = await authService.switchChurch(mockChurchId);

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:5000/api/v1/church/church123/select',
            expect.objectContaining({
                method: 'PUT',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer mock-token',
                }),
            })
        );

        expect(tokenStorage.updateUser).toHaveBeenCalledWith(updatedUser);
        expect(authService.currentUser).toEqual(updatedUser);
        expect(result).toEqual({
            success: true,
            user: updatedUser,
        });
    });

    it('should return early if switching to the same church', async () => {
        const result = await authService.switchChurch(mockCurrentChurchId);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(result).toEqual({
            success: true,
            user: mockUser,
            noChange: true,
        });
    });

    it('should throw error if user is not authenticated', async () => {
        authService.currentUser = null;

        await expect(authService.switchChurch(mockChurchId)).rejects.toThrow(
            'User not authenticated'
        );

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle backend errors correctly', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
                success: false,
                message: 'Not a member of this church',
            }),
        });

        await expect(authService.switchChurch(mockChurchId)).rejects.toThrow(
            'Not a member of this church'
        );

        expect(tokenStorage.updateUser).not.toHaveBeenCalled();
    });

    it('should handle non-JSON error responses', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            headers: new Headers({ 'content-type': 'text/html' }),
            text: async () => '<html>Internal Server Error</html>',
        });

        await expect(authService.switchChurch(mockChurchId)).rejects.toThrow(
            'Server Error (500): Please try again later'
        );

        expect(tokenStorage.updateUser).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(authService.switchChurch(mockChurchId)).rejects.toThrow(
            'Network error'
        );

        expect(tokenStorage.updateUser).not.toHaveBeenCalled();
    });

    it('should handle response with data field instead of user field', async () => {
        const updatedUser = {
            ...mockUser,
            currentChurch: mockChurchId,
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
                success: true,
                data: updatedUser, // Backend returns 'data' instead of 'user'
            }),
        });

        const result = await authService.switchChurch(mockChurchId);

        expect(tokenStorage.updateUser).toHaveBeenCalledWith(updatedUser);
        expect(result.user).toEqual(updatedUser);
    });

    it('should correctly extract user from response', async () => {
        const updatedUser = {
            ...mockUser,
            currentChurch: mockChurchId,
        };

        // Test when backend returns user directly
        global.fetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
                success: true,
                user: updatedUser,
            }),
        });

        const result = await authService.switchChurch(mockChurchId);

        expect(result.user).toEqual(updatedUser);
    });
});
