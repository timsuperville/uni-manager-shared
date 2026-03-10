import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { AuthContext } from "@shared/auth/context/AuthContext.jsx";
import { getWebSocketUrl } from "../config/environment";

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

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
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
    return localStorage.getItem("user_presence_status") || "available";
  });

  // Refs for socket management and state access inside callbacks
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const statusRef = useRef(status);

  // Update ref when status changes
  useEffect(() => {
    statusRef.current = status;
    localStorage.setItem("user_presence_status", status);
  }, [status]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const connect = useCallback(() => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = getWebSocketUrl();
    const token = localStorage.getItem("token");
    const urlWithAuth = `${wsUrl}?token=${token}`;

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
              type: "presence",
              action: "update",
              data: { status: statusRef.current },
            }),
          );
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        if (import.meta.env.DEV) {
          console.debug("WebSocket disconnected:", event.code, event.reason);
        }
        setIsConnected(false);
        setSocket(null);
        wsRef.current = null;

        if (event.code !== 1000 && event.code !== 1001 && user) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000,
          );
          if (import.meta.env.DEV) {
            console.debug(
              `Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current + 1})`,
            );
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        if (import.meta.env.DEV) {
          console.error("WebSocket error:", error);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as { type: string; action: string };
          if (message.type === "system" && message.action === "pong") {
            // Heartbeat response — no action needed
          }
        } catch (e) {
          if (import.meta.env.DEV) {
            console.error("Error parsing WebSocket message:", e);
          }
        }
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to create WebSocket connection:", error);
      }
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "User logged out or component unmounted");
      wsRef.current = null;
    }
    setIsConnected(false);
    setSocket(null);
  }, []);

  useEffect(() => {
    if (user?.id) {
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
          type: "presence",
          action: "update",
          data: { status: newStatus },
        }),
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
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return context;
};
