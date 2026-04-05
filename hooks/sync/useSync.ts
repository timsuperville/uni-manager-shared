import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useAuth } from "@shared/auth/hooks/useAuth";
import { getWebSocketUrl } from "@shared/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncStatus = "connected" | "disconnected" | "connecting";

export interface AwarenessUser {
  name: string;
  color: string;
  userId: string;
}

export interface UseSyncResult {
  doc: Y.Doc | null;
  status: SyncStatus;
  awareness: AwarenessUser[];
  provider: WebsocketProvider | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useSync: Multi-Player State Sync Hook (CRDT via Yjs)
 * Phase 5 - Home App Rebuild
 *
 * Provides a real-time, conflict-free shared state for highly concurrent
 * Workspaces (Budget, Calendar, Meal Planning).
 *
 * @param roomName - The unique ID for this sync room (e.g., 'budget-household123')
 */
export function useSync(roomName: string | null): UseSyncResult {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("disconnected");
  const [awareness, setAwareness] = useState<AwarenessUser[]>([]);

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // Extract primitives to avoid deep-equality teardowns in the dependency array
  const userId = (user as any)?.id;
  const userFirstName = (user as any)?.firstName ?? "Unknown";
  const userColor = (user as any)?.color ?? "#3b82f6";

  useEffect(() => {
    if (!roomName || !userId) return;

    const doc = new Y.Doc();
    docRef.current = doc;

    const wsUrl = getWebSocketUrl();
    const provider = new WebsocketProvider(wsUrl, roomName, doc);
    providerRef.current = provider;

    provider.awareness.setLocalStateField("user", {
      name: userFirstName,
      color: userColor,
      userId: userId,
    });

    provider.on("status", (event: { status: SyncStatus }) => {
      setStatus(event.status);
    });

    provider.awareness.on("change", () => {
      const states = Array.from(
        provider.awareness.getStates().values(),
      ) as Array<{ user?: AwarenessUser }>;
      const users = states
        .map((s) => s.user)
        .filter((u): u is AwarenessUser => !!u);
      setAwareness(users);
    });

    return () => {
      if (providerRef.current?.shouldConnect) {
        providerRef.current.disconnect();
      }
      docRef.current?.destroy();
    };
  }, [roomName, userId, userFirstName, userColor]);

  return {
    doc: docRef.current,
    status,
    awareness,
    provider: providerRef.current,
  };
}
