import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '@shared/auth/hooks/useAuth';
import { getWebSocketUrl } from '@shared/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncStatus = 'connected' | 'disconnected' | 'connecting';

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

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const namespaces = [
    'home',
    'church',
    'work',
    'personal',
    'admin',
    'playback',
    'presentation',
    'uni'
  ];
  for (const ns of namespaces) {
    const sessionToken = sessionStorage.getItem(`${ns}_auth_access_token`);
    if (sessionToken) return sessionToken;
    const localToken = localStorage.getItem(`${ns}_auth_access_token`);
    if (localToken) return localToken;
  }
  return sessionStorage.getItem('token') || localStorage.getItem('token');
}

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
  const [status, setStatus] = useState<SyncStatus>('disconnected');
  const [awareness, setAwareness] = useState<AwarenessUser[]>([]);
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // Extract primitives to avoid deep-equality teardowns in the dependency array
  const userId = (user as any)?.id;
  const userFirstName = (user as any)?.firstName ?? 'Unknown';
  const userColor = (user as any)?.color ?? '#3b82f6';

  useEffect(() => {
    if (!roomName || !userId) {
      setDoc(null);
      setProvider(null);
      return;
    }

    const newDoc = new Y.Doc();
    docRef.current = newDoc;
    setDoc(newDoc);

    const wsUrl = getWebSocketUrl();
    const token = getAuthToken();
    const newProvider = new WebsocketProvider(wsUrl, roomName, newDoc, {
      params: token ? { token } : {}
    });
    providerRef.current = newProvider;
    setProvider(newProvider);

    newProvider.awareness.setLocalStateField('user', {
      name: userFirstName,
      color: userColor,
      userId: userId
    });

    newProvider.on('status', (event: { status: SyncStatus }) => {
      setStatus(event.status);
    });

    const handleAwarenessChange = () => {
      const states = Array.from(
        newProvider.awareness.getStates().values()
      ) as Array<{ user?: AwarenessUser }>;
      const users = states
        .map(s => s.user)
        .filter((u): u is AwarenessUser => !!u);
      setAwareness(users);
    };

    newProvider.awareness.on('change', handleAwarenessChange);

    return () => {
      newProvider.awareness.off('change', handleAwarenessChange);
      try {
        newProvider.destroy();
      } catch {
        // Safe destroy fallback
      }
      try {
        newDoc.destroy();
      } catch {
        // Safe destroy fallback
      }
      providerRef.current = null;
      docRef.current = null;
    };
  }, [roomName, userId]);

  // Sync awareness fields when user details update without tearing down WebSocket
  useEffect(() => {
    if (!providerRef.current || !userId) return;
    providerRef.current.awareness.setLocalStateField('user', {
      name: userFirstName,
      color: userColor,
      userId: userId
    });
  }, [userFirstName, userColor, userId]);

  return {
    doc,
    status,
    awareness,
    provider
  };
}
