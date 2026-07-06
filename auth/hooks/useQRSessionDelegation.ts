import { useState, useCallback, useRef, useEffect } from 'react';
import { getApiBaseUrl } from '../../api/config/apiConfig';
import { getAppUrl } from '../../config/environment';

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

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiryRef = useRef(Date.now() + ttlMs);
  const consecutiveFailuresRef = useRef(0);
  const currentIntervalRef = useRef(pollIntervalMs);

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
      if (pollRef.current) clearTimeout(pollRef.current);

      const poll = async () => {
        const remaining = Math.max(0, expiryRef.current - Date.now());
        setSecondsLeft(Math.floor(remaining / 1000));

        if (remaining === 0) {
          setQrStatus('expired');
          return;
        }

        if (qrInitError) {
          pollRef.current = setTimeout(poll, currentIntervalRef.current);
          return;
        }

        try {
          const res = await fetch(
            `${apiBaseUrl}/api/v1/auth/qr-session/status?token=${tok}`,
            { signal: AbortSignal.timeout(2000) }
          );

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const json = await res.json();
          const data = json.data || json;

          consecutiveFailuresRef.current = 0;
          currentIntervalRef.current = pollIntervalMs;
          setQrStatus(prev => (prev === 'backend-offline' ? 'pending' : prev));

          if (data.status === 'approved' && data.sessionToken) {
            setQrStatus('approved');
            onApprove?.(data.sessionToken);
            return;
          } else if (data.status === 'expired') {
            setQrStatus('expired');
            return;
          }
        } catch (_err) {
          consecutiveFailuresRef.current++;
          currentIntervalRef.current = Math.min(
            currentIntervalRef.current * 1.5,
            10000
          );

          if (consecutiveFailuresRef.current >= 3) {
            setQrStatus('backend-offline');
          }

          globalThis.conditionalLog?.('warn', '[QRPollFailure]', _err);
        }

        pollRef.current = setTimeout(poll, currentIntervalRef.current);
      };

      pollRef.current = setTimeout(poll, currentIntervalRef.current);
    },
    [apiBaseUrl, qrInitError, pollIntervalMs, onApprove]
  );

  const refreshToken = useCallback(() => {
    const newToken = crypto.randomUUID();
    expiryRef.current = Date.now() + ttlMs;
    setToken(newToken);
    setQrStatus('pending');
    setSecondsLeft(Math.floor(ttlMs / 1000));
    consecutiveFailuresRef.current = 0;
    currentIntervalRef.current = pollIntervalMs;
    registerToken(newToken);
    startPolling(newToken);
  }, [registerToken, startPolling, ttlMs, pollIntervalMs]);

  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;
    registerToken(token);
    startPolling(token);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    startPolling(token);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [qrInitError]); // eslint-disable-line

  return {
    qrToken: token,
    qrStatus,
    secondsLeft,
    qrInitError,
    refreshToken,
    buildQrPayload: () => {
      const churchUrl = getAppUrl('church');
      return `${churchUrl}/auth/qr-approve?token=${token}&app=${appType}&v=1`;
    }
  };
}
