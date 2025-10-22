/* eslint-env browser */
import { useState, useEffect, useCallback, useRef } from 'react';

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
export const useWebSocket = (endpoint = '') => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  // Refs
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const subscribersRef = useRef(new Map());
  const reconnectAttemptsRef = useRef(0);

  // Configuration
  const maxReconnectAttempts = 10;
  const reconnectInterval = 5000;
  const heartbeatInterval = 30000;

  // Build WebSocket URL
  const buildWebSocketUrl = useCallback(() => {
    const baseUrl =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_API_URL?.replace('http', 'ws') ||
      'ws://localhost:5000';
    return `${baseUrl}/ws${endpoint}`;
  }, [endpoint]);

  // Handle WebSocket message
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);

      // Handle heartbeat
      if (data.type === 'ping') {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'pong' }));
        }
        return;
      }

      // Notify subscribers
      subscribersRef.current.forEach((callback, eventType) => {
        if (data.event === eventType || eventType === '*') {
          try {
            callback(data);
          } catch (_error) {
            // eslint-disable-next-line no-console
            // console.error('Error in WebSocket event handler:', error);
          }
        }
      });
    } catch (_error) {
      // eslint-disable-next-line no-console
      // console.error('Error parsing WebSocket message:', error);
    }
  }, []);

  // Handle WebSocket connection open
  const handleOpen = useCallback(() => {
    setIsConnected(true);
    setConnectionStatus('connected');
    setError(null);
    reconnectAttemptsRef.current = 0;

    // Start heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, heartbeatInterval);

    // eslint-disable-next-line no-console
    // console.log('WebSocket connected');
  }, []);

  // Handle WebSocket connection close
  const handleClose = useCallback((event) => {
    setIsConnected(false);
    setConnectionStatus('disconnected');

    // Clear heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Attempt reconnection if not intentional close
    if (
      event.code !== 1000 &&
      reconnectAttemptsRef.current < maxReconnectAttempts
    ) {
      setConnectionStatus('reconnecting');
      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(
        () => {
          connect();
        },
        reconnectInterval *
          Math.pow(2, Math.min(reconnectAttemptsRef.current - 1, 5))
      );

      // eslint-disable-next-line no-console
      // console.log(
      //   `WebSocket disconnected. Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
      // );
    } else {
      setConnectionStatus('failed');
      // eslint-disable-next-line no-console
      // console.log('WebSocket connection failed or manually closed');
    }
  }, []);

  // Handle WebSocket error
  const handleError = useCallback((event) => {
    setError('WebSocket connection error');
    setConnectionStatus('error');
    // eslint-disable-next-line no-console
    // console.error('WebSocket error:', event);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Create new WebSocket connection
      const wsUrl = buildWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      // Add event listeners
      wsRef.current.addEventListener('open', handleOpen);
      wsRef.current.addEventListener('close', handleClose);
      wsRef.current.addEventListener('error', handleError);
      wsRef.current.addEventListener('message', handleMessage);

      setConnectionStatus('connecting');
    } catch (_error) {
      setError('Failed to create WebSocket connection');
      setConnectionStatus('failed');
      // eslint-disable-next-line no-console
      // console.error('Failed to create WebSocket connection:', error);
    }
  }, [buildWebSocketUrl, handleOpen, handleClose, handleError, handleMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  // Subscribe to WebSocket events
  const subscribe = useCallback((eventType, callback) => {
    subscribersRef.current.set(eventType, callback);

    return () => {
      subscribersRef.current.delete(eventType);
    };
  }, []);

  // Unsubscribe from WebSocket events
  const unsubscribe = useCallback((eventType) => {
    subscribersRef.current.delete(eventType);
  }, []);

  // Send message through WebSocket
  const send = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const messageString =
          typeof message === 'string' ? message : JSON.stringify(message);
        wsRef.current.send(messageString);
        return true;
      } catch (_error) {
        // eslint-disable-next-line no-console
        // console.error('Error sending WebSocket message:', error);
        return false;
      }
    } else {
      // eslint-disable-next-line no-console
      // console.warn('WebSocket is not connected');
      return false;
    }
  }, []);

  // Connect on mount
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
