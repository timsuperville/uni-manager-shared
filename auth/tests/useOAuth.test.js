import { renderHook, act } from '@testing-library/react';
import { useOAuth } from '../hooks/useOAuth';

describe('useOAuth', () => {
    let mockWindowOpen;
    let mockPopup;

    beforeEach(() => {
        // Mock window.open
        mockPopup = {
            closed: false,
            close: jest.fn(),
        };
        mockWindowOpen = jest.fn(() => mockPopup);
        global.window.open = mockWindowOpen;

        // Use fake timers
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useOAuth());
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should open popup and set loading state on login', () => {
        const { result } = renderHook(() => useOAuth());

        act(() => {
            result.current.loginWithProvider('google');
        });

        expect(mockWindowOpen).toHaveBeenCalledWith(
            expect.stringContaining('/auth/google'),
            'uni_manager_google_login',
            expect.stringContaining('width=500')
        );
        expect(result.current.isLoading).toBe(true);
        expect(result.current.error).toBe(null);
    });

    it('should handle successful oauth message', () => {
        const { result } = renderHook(() => useOAuth());

        act(() => {
            result.current.loginWithProvider('google');
        });

        act(() => {
            window.dispatchEvent(new MessageEvent('message', {
                data: { type: 'OAUTH_SUCCESS', data: { token: 'fake-token' } }
            }));
        });

        expect(result.current.isLoading).toBe(false);
        expect(mockPopup.close).toHaveBeenCalled();
    });

    it('should handle oauth error message', () => {
        const { result } = renderHook(() => useOAuth());

        act(() => {
            result.current.loginWithProvider('google');
        });

        act(() => {
            window.dispatchEvent(new MessageEvent('message', {
                data: { type: 'OAUTH_ERROR', error: 'Auth failed' }
            }));
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Auth failed');
        expect(mockPopup.close).toHaveBeenCalled();
    });

    it('should handle popup block error', () => {
        global.window.open.mockReturnValue(null);
        const { result } = renderHook(() => useOAuth());

        act(() => {
            result.current.loginWithProvider('google');
        });

        expect(result.current.error).toContain('Popup blocked');
        expect(result.current.isLoading).toBe(false);
    });

    it('should detect manually closed popup', () => {
        const { result } = renderHook(() => useOAuth());

        act(() => {
            result.current.loginWithProvider('google');
        });

        // Simulate popup closed
        mockPopup.closed = true;

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.isLoading).toBe(false);
    });
});
