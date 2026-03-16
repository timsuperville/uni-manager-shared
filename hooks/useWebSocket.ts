/* eslint-env browser */
import { useState, useEffect, useCallback, useRef } from "react";
import { getWebSocketUrl } from "../config/environment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WsConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed"
  | "error";

type WsMessage = Record<string, unknown>;
type WsEventCallback = (data: WsMessage) => void;

export interface UseWebSocketResult {
  isConnected: boolean;
  connectionStatus: WsConnectionStatus;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (eventType: string, callback: WsEventCallback) => () => void;
  unsubscribe: (eventType: string) => void;
  send: (message: string | WsMessage) => boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL_MS = 5_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useWebSocket - Custom hook for WebSocket connection management
 *
 * Features:
 * - Auto-connection and reconnection
 * - Event subscription and unsubscription
 * - Connection status monitoring
 * - Error handling and retry logic
 * - Heartbeat/ping-pong support
 */
export const useWebSocket = (endpoint = ""): UseWebSocketResult => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<WsConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const subscribersRef = useRef<Map<string, WsEventCallback>>(new Map());
  const reconnectAttemptsRef = useRef(0);

  const buildWebSocketUrl = useCallback((): string => {
    return `${getWebSocketUrl()}/ws${endpoint}`;
  }, [endpoint]);

  const handleMessage = useCallback((event: MessageEvent): void => {
    try {
      const data = JSON.parse(event.data as string) as WsMessage;

      if (data["type"] === "ping") {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "pong" }));
        }
        return;
      }

      subscribersRef.current.forEach((callback, eventType) => {
        if (data["event"] === eventType || eventType === "*") {
          try {
            callback(data);
          } catch {
            // Subscriber errors must not crash the WS loop
          }
        }
      });
    } catch {
      // Ignore malformed frames
    }
  }, []);

  const handleOpen = useCallback((): void => {
    setIsConnected(true);
    setConnectionStatus("connected");
    setError(null);
    reconnectAttemptsRef.current = 0;

    if (heartbeatIntervalRef.current)
      clearInterval(heartbeatIntervalRef.current);

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, []);

  const handleClose = useCallback((event: CloseEvent): void => {
    setIsConnected(false);
    setConnectionStatus("disconnected");

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (
      event.code !== 1000 &&
      reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
    ) {
      setConnectionStatus("reconnecting");
      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(
        () => {
          connect();
        },
        RECONNECT_INTERVAL_MS *
          Math.pow(2, Math.min(reconnectAttemptsRef.current - 1, 5)),
      );
    } else {
      setConnectionStatus("failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleError = useCallback((): void => {
    setError("WebSocket connection error");
    setConnectionStatus("error");
  }, []);

  const connect = useCallback((): void => {
    try {
      if (wsRef.current) wsRef.current.close();

      const wsUrl = buildWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.addEventListener("open", handleOpen);
      wsRef.current.addEventListener("close", handleClose);
      wsRef.current.addEventListener("error", handleError);
      wsRef.current.addEventListener("message", handleMessage);

      setConnectionStatus("connecting");
    } catch {
      setError("Failed to create WebSocket connection");
      setConnectionStatus("failed");
    }
  }, [buildWebSocketUrl, handleOpen, handleClose, handleError, handleMessage]);

  const disconnect = useCallback((): void => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus("disconnected");
    reconnectAttemptsRef.current = 0;
  }, []);

  const subscribe = useCallback(
    (eventType: string, callback: WsEventCallback): (() => void) => {
      subscribersRef.current.set(eventType, callback);
      return () => {
        subscribersRef.current.delete(eventType);
      };
    },
    [],
  );

  const unsubscribe = useCallback((eventType: string): void => {
    subscribersRef.current.delete(eventType);
  }, []);

  const send = useCallback((message: string | WsMessage): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const messageString =
          typeof message === "string" ? message : JSON.stringify(message);
        wsRef.current.send(messageString);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
  };
};

export default useWebSocket;
