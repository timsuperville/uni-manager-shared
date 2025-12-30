import { renderHook, act } from '@testing-library/react';
import { useSessionManagement, useUserSessions } from '../hooks/useSessionManagement';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

vi.mock('../hooks/useAuth');
vi.mock('../services/authService');

describe('useSessionManagement', () => {
    beforeEach(() => {
        useAuth.mockReturnValue({ session: { id: '1' }, logout: vi.fn() });
        authService.logout = vi.fn().mockResolvedValue({ success: true });
    });

    it('should invalidate session calling authService logout', async () => {
        const { result } = renderHook(() => useSessionManagement());

        await act(async () => {
            await result.current.invalidateSession();
        });

        expect(authService.logout).toHaveBeenCalled();
        expect(result.current.sessionStatus).toBe('invalidated');
    });
});

describe('useUserSessions', () => {
    beforeEach(() => {
        useAuth.mockReturnValue({ token: 'fake-token' });
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ sessions: [{ id: '1', status: 'active' }] })
            })
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch user sessions on mount', async () => {
        const { result } = renderHook(() => useUserSessions('user1'));

        // Wait for effect
        await act(async () => { });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/sessions'),
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }) })
        );
        expect(result.current.userSessions).toHaveLength(1);
    });
});
