import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "../auth/context/AuthContext";

export const PresenceContext = createContext(null);

export const PresenceProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(() => {
    return localStorage.getItem("user_presence_status") || "available";
  });

  // Refs for socket management and state access inside callbacks
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const statusRef = useRef(status); // Keep track of current status for reconnection

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

    // URL construction
    const baseUrl = import.meta.env?.VITE_API_URL || "http://localhost:5000";
    // Convert http(s) to ws(s)
    const wsUrl = baseUrl.replace(/^http/, "ws");
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

        // Send initial status immediately upon connection
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "presence",
              action: "update",
              data: {
                status: statusRef.current,
              },
            }),
          );
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        wsRef.current = null;

        // Reconnection logic (exponential backoff)
        if (event.code !== 1000 && event.code !== 1001 && user) {
          // Don't reconnect on normal closure
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000,
          );
          console.log(
            `Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current + 1})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        // onError usually precedes onClose, so actual handling happens in onClose
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // Handle system messages if needed, e.g., pong
          if (message.type === "system" && message.action === "pong") {
            // Heartbeat response
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [user?.id]); // Depend on ID, not object reference

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // 1000 = Normal Closure
      wsRef.current.close(1000, "User logged out or component unmounted");
      wsRef.current = null;
    }
    setIsConnected(false);
    setSocket(null);
  }, []);

  // Handle connection lifecycle
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

  const updateStatus = useCallback((newStatus) => {
    setStatus(newStatus);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "presence",
          action: "update",
          data: {
            status: newStatus,
          },
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

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return context;
};
