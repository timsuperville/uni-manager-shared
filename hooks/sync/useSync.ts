import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useAuth } from "@shared/auth/hooks/useAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncStatus = "connected" | "disconnected";

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

  useEffect(() => {
    if (!roomName || !user) return;

    const doc = new Y.Doc();
    docRef.current = doc;

    const wsUrl =
      (import.meta.env.VITE_WS_URL as string | undefined) ??
      "ws://localhost:1234";
    const provider = new WebsocketProvider(wsUrl, roomName, doc);
    providerRef.current = provider;

    provider.awareness.setLocalStateField("user", {
      name: (user as { firstName?: string }).firstName ?? "Unknown",
      color: (user as { color?: string }).color ?? "#3b82f6",
      userId: (user as { id?: string }).id,
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
  }, [roomName, user]);

  return {
    doc: docRef.current,
    status,
    awareness,
    provider: providerRef.current,
  };
}
