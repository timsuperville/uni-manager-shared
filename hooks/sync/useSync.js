import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useAuth } from "@shared/auth/hooks/useAuth";

/**
 * useSync: Multi-Player State Sync Hook (CRDT via Yjs)
 * Phase 5 - Home App Rebuild
 *
 * Provides a real-time, conflict-free shared state for highly concurrent
 * Workspaces (Budget, Calendar, Meal Planning).
 *
 * @param {string} roomName - The unique ID for this sync room (e.g., 'budget-household123')
 * @returns {object} - The Y.Doc, connection status, and basic awareness data
 */
export function useSync(roomName) {
  const { user } = useAuth();
  const [status, setStatus] = useState("disconnected");
  const [awareness, setAwareness] = useState([]);

  // Keep refs to the doc and provider so they persist across renders
  const docRef = useRef(null);
  const providerRef = useRef(null);

  useEffect(() => {
    if (!roomName || !user) return;

    // Initialize Yjs Document
    const doc = new Y.Doc();
    docRef.current = doc;

    // WebSocket URL — reads from VITE_WS_URL env var (falls back to localhost:1234 for local dev)
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:1234";

    // Connect to the WebSocket signaling server
    const provider = new WebsocketProvider(wsUrl, roomName, doc);
    providerRef.current = provider;

    // Set up presence/awareness
    provider.awareness.setLocalStateField("user", {
      name: user.firstName || "Unknown",
      color: user.color || "#3b82f6", // default cobalt
      userId: user.id,
    });

    // Connection state listeners
    provider.on("status", (event) => {
      setStatus(event.status); // 'connected' | 'disconnected'
    });

    // Awareness state listeners (who else is here)
    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states.map((state) => state.user).filter(Boolean);
      setAwareness(users);
    });

    // Cleanup on unmount
    return () => {
      if (providerRef.current) {
        // Defensive check to avoid closing before fully connected
        if (providerRef.current.shouldConnect) {
          providerRef.current.disconnect();
        }
      }
      if (docRef.current) {
        docRef.current.destroy();
      }
    };
  }, [roomName, user]);

  return {
    doc: docRef.current,
    status,
    awareness,
    provider: providerRef.current,
  };
}
