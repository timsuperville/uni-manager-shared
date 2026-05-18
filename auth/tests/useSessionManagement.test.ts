import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSessionManagement,
  useUserSessions
} from '../hooks/useSessionManagement';
import { useAuth } from '../hooks/useAuth';

const mockLogout = vi.fn().mockResolvedValue({ success: true });

vi.mock('../hooks/useAuth');
vi.mock('../../api/index.ts', () => ({
  getApiClient: vi.fn()
}));
vi.mock('../services/AuthService.ts', () => {
  class MockAuthService {
    logout = mockLogout;
  }
  return {
    __esModule: true,
    default: MockAuthService
  };
});

describe('useSessionManagement', () => {
  beforeEach(() => {
    (useAuth as Mock).mockReturnValue({
      session: { id: '1' },
      logout: vi.fn()
    });
    mockLogout.mockClear();
  });

  it('should invalidate session calling authService logout', async () => {
    const { result } = renderHook(() => useSessionManagement());

    await act(async () => {
      await result.current.invalidateSession();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(result.current.sessionStatus).toBe('invalidated');
  });
});

describe('useUserSessions', () => {
  beforeEach(() => {
    (useAuth as Mock).mockReturnValue({ token: 'fake-token' });
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ sessions: [{ id: '1', status: 'active' }] })
      } as Response)
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user sessions on mount', async () => {
    const { result } = renderHook(() => useUserSessions('user1'));

    // Wait for effect
    await act(async () => {});

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/sessions'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-token'
        })
      })
    );
    expect(result.current.userSessions).toHaveLength(1);
  });
});
