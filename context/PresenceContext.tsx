import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback
} from 'react';
import { AuthContext } from '../auth/context/AuthContext';
import { getWebSocketUrl } from '../config/environment';
import { logger } from '@shared/utils/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PresenceContextValue {
  isConnected: boolean;
  socket: WebSocket | null;
  status: string;
  setStatus: (status: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

export const PresenceContext = createContext<PresenceContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export const PresenceProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  /**
   * Safe auth read — reads context directly instead of going through the
   * throwing useAuth() hook. This prevents an HMR crash where AuthContext.jsx
   * is reloaded mid-session and the context briefly returns null before
   * the new AuthProvider is fully mounted.
   */
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(() => {
    return localStorage.getItem('user_presence_status') || 'available';
  });

  // Refs for socket management and state access inside callbacks
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const statusRef = useRef(status);

  // Update ref when status changes
  useEffect(() => {
    statusRef.current = status;
    localStorage.setItem('user_presence_status', status);
  }, [status]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const connect = useCallback(() => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) return;

    // Resolve the access token — try authService.getStoredToken() first, then fall
    // back to known namespaced storage keys (admin, church, etc.) so presence isn't
    // blocked by authService chain fragility at mount time.
    const token =
      auth?.authService?.getStoredToken?.() ??
      sessionStorage.getItem('admin_auth_access_token') ??
      sessionStorage.getItem('church_auth_access_token') ??
      localStorage.getItem('admin_auth_access_token') ??
      localStorage.getItem('church_auth_access_token') ??
      null;

    // Never connect without a token — the server will reject it with 1008
    if (!token) {
      if (import.meta.env.DEV) {
        logger.debug(
          '[PresenceContext] No token available — skipping WS connection'
        );
      }
      return;
    }

    // Build the presence WebSocket URL — append /presence path to the API base.
    // PresenceServer is mounted at ws://host/presence?token=<JWT>
    const wsBase = getWebSocketUrl();
    const presenceBase = wsBase.endsWith('/presence')
      ? wsBase
      : wsBase.replace(/\/+$/, '') + '/presence';
    const urlWithAuth = `${presenceBase}?token=${token}`;

    try {
      const ws = new WebSocket(urlWithAuth);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        setSocket(ws);

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'presence',
              action: 'update',
              data: { status: statusRef.current }
            })
          );
        }
      };

      ws.onclose = event => {
        if (!isMountedRef.current) return;
        if (import.meta.env.DEV) {
          logger.debug('WebSocket disconnected:', event.code, event.reason);
        }
        setIsConnected(false);
        setSocket(null);
        wsRef.current = null;

        // Cap reconnect attempts — if the WS server is unavailable (no backend WS
        // handler yet), stop retrying after 5 attempts to avoid console noise.
        const MAX_RECONNECT_ATTEMPTS = 5;
        if (
          event.code !== 1000 &&
          event.code !== 1001 &&
          event.code !== 1008 && // 1008 is Unauthorized, retrying won't help
          user &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          if (import.meta.env.DEV) {
            logger.debug(
              `Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`
            );
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else if (
          reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS &&
          import.meta.env.DEV
        ) {
          logger.debug(
            '[PresenceContext] WS server unavailable — presence feature inactive until server is running.'
          );
        }
      };

      ws.onerror = error => {
        if (import.meta.env.DEV) {
          logger.error('WebSocket error:', error);
        }
      };

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data as string) as {
            type: string;
            action?: string;
            data?: Record<string, unknown>;
          };

          // Heartbeat reply — no action needed
          if (message.type === 'pong') return;

          // Presence events (join, leave, update, roster snapshot) — handled by consumers
          // via the socket ref; context-level state can be extended here if needed
          if (message.type === 'presence') {
            if (import.meta.env.DEV) {
              logger.debug(
                '[PresenceContext] Presence event:',
                message.action,
                message.data
              );
            }
            return;
          }
        } catch (e) {
          if (import.meta.env.DEV) {
            logger.error(
              '[PresenceContext] Error parsing WebSocket message:',
              e
            );
          }
        }
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Failed to create WebSocket connection:', error);
      }
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User logged out or component unmounted');
      wsRef.current = null;
    }
    setIsConnected(false);
    setSocket(null);
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Reset reconnect counter for each new authenticated session
      reconnectAttemptsRef.current = 0;
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect]);

  const updateStatus = useCallback((newStatus: string) => {
    setStatus(newStatus);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'presence',
          action: 'update',
          data: { status: newStatus }
        })
      );
    }
  }, []);

  return (
    <PresenceContext.Provider
      value={{ isConnected, socket, status, setStatus: updateStatus }}
    >
      {children}
    </PresenceContext.Provider>
  );
};

// ── Consumer hook ─────────────────────────────────────────────────────────────

export const usePresence = (): PresenceContextValue => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
