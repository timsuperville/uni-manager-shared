import { useState, useCallback, useRef, useEffect } from 'react';
import { getApiBaseUrl } from '../../api/config/apiConfig';

export interface QRSessionDelegationOptions {
  ttlMs?: number;
  pollIntervalMs?: number;
  appType?: string;
  onApprove?: (sessionToken: string) => void;
  apiBaseUrl?: string;
}

export function useQRSessionDelegation({
  ttlMs = 3 * 60 * 1000,
  pollIntervalMs = 2000,
  appType = 'presentation-pro',
  onApprove,
  apiBaseUrl = getApiBaseUrl()
}: QRSessionDelegationOptions = {}) {
  const [token, setToken] = useState(() => crypto.randomUUID());
  const [qrStatus, setQrStatus] = useState<
    'pending' | 'approved' | 'expired' | 'backend-offline'
  >('pending');
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(ttlMs / 1000));
  const [qrInitError, setQrInitError] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef(Date.now() + ttlMs);

  const registerToken = useCallback(
    async (tok: string) => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/auth/qr-session/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrToken: tok }),
          signal: AbortSignal.timeout(4000)
        });
        if (!res.ok && res.status !== 409) throw new Error('init failed');
        setQrInitError(false);
      } catch (_err) {
        setQrInitError(true);
      }
    },
    [apiBaseUrl]
  );

  const startPolling = useCallback(
    (tok: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const remaining = Math.max(0, expiryRef.current - Date.now());
        setSecondsLeft(Math.floor(remaining / 1000));

        if (remaining === 0) {
          if (pollRef.current) clearInterval(pollRef.current);
          setQrStatus('expired');
          return;
        }

        if (qrInitError) return;

        try {
          const res = await fetch(
            `${apiBaseUrl}/api/v1/auth/qr-session/status?token=${tok}`,
            { signal: AbortSignal.timeout(2000) }
          );
          if (!res.ok) return;
          const json = await res.json();
          const data = json.data || json;

          if (data.status === 'approved' && data.sessionToken) {
            if (pollRef.current) clearInterval(pollRef.current);
            setQrStatus('approved');
            onApprove?.(data.sessionToken);
          } else if (data.status === 'expired') {
            if (pollRef.current) clearInterval(pollRef.current);
            setQrStatus('expired');
          }
        } catch (_err) {}
      }, pollIntervalMs);
    },
    [apiBaseUrl, qrInitError, pollIntervalMs, onApprove]
  );

  const refreshToken = useCallback(() => {
    const newToken = crypto.randomUUID();
    expiryRef.current = Date.now() + ttlMs;
    setToken(newToken);
    setQrStatus('pending');
    setSecondsLeft(Math.floor(ttlMs / 1000));
    registerToken(newToken);
    startPolling(newToken);
  }, [registerToken, startPolling, ttlMs]);

  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;
    registerToken(token);
    startPolling(token);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    startPolling(token);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [qrInitError]); // eslint-disable-line

  return {
    qrToken: token,
    qrStatus,
    secondsLeft,
    qrInitError,
    refreshToken,
    buildQrPayload: () =>
      `https://church.uni-manager.com/auth/qr-approve?token=${token}&app=${appType}&v=1`
  };
}
