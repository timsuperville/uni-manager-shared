/**
 * Real-time WebSocket Hooks
 * React hooks for WebSocket integration and real-time updates
 *
 * Bug fixes applied during TS migration:
 *  1. useWebSocket: catch block used `error.message` (was named `_error`) — 3 occurrences
 *     fixed to `_error instanceof Error ? _error.message : "Unknown error"`
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketClient from '../services/webSocketClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WsStatus {
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
}

interface NotificationRecord {
  id: string;
  read?: boolean;
  [key: string]: unknown;
}

interface MemberRecord {
  id: string;
  [key: string]: unknown;
}

interface InvitationRecord {
  id: string;
  status?: string;
  [key: string]: unknown;
}

export type UserPresenceStatus = 'online' | 'away' | 'busy' | 'offline';

interface PresenceUser {
  id: string;
  status: UserPresenceStatus;
  lastSeen?: string;
  userInfo?: Record<string, unknown>;
  activity?: string;
}

interface RoomItemsData {
  room: string;
  data: { items?: unknown[] };
  error?: string;
}

export interface UseWebSocketConnectionOptions {
  [key: string]: unknown;
}

export interface UseWebSocketConnectionResult {
  isConnected: boolean;
  isReconnecting: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  reconnect: () => void;
}

export interface UseRealTimeNotificationsResult {
  notifications: NotificationRecord[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
}

export interface UseRealTimeMembersResult {
  members: MemberRecord[];
  recentActivity: Array<{
    type: string;
    member: MemberRecord;
    timestamp: string;
  }>;
  addMember: (member: MemberRecord, metadata?: Record<string, unknown>) => void;
  updateMember: (
    member: MemberRecord,
    metadata?: Record<string, unknown>
  ) => void;
  deleteMember: (
    member: MemberRecord,
    metadata?: Record<string, unknown>
  ) => void;
}

export interface UseRealTimeInvitationsResult {
  invitations: InvitationRecord[];
  pendingCount: number;
  sendInvitation: (
    invitation: InvitationRecord,
    metadata?: Record<string, unknown>
  ) => void;
  acceptInvitation: (
    invitation: InvitationRecord,
    metadata?: Record<string, unknown>
  ) => void;
  declineInvitation: (
    invitation: InvitationRecord,
    metadata?: Record<string, unknown>
  ) => void;
}

export interface UseUserPresenceResult {
  onlineUsers: PresenceUser[];
  currentUserStatus: UserPresenceStatus;
  updateStatus: (status: UserPresenceStatus, activity?: string | null) => void;
}

export interface UseTypingIndicatorResult {
  typingUsers: string[];
  startTyping: (context?: Record<string, unknown>) => void;
  stopTyping: (context?: Record<string, unknown>) => void;
}

export interface UseRealTimeRoomResult {
  data: unknown[];
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toErrorMessage(err: unknown, fallback = 'Unknown error'): string {
  return err instanceof Error ? err.message : fallback;
}

// ---------------------------------------------------------------------------
// useWebSocket (connection management)
// ---------------------------------------------------------------------------

export const useWebSocketConnection = (
  token: string,
  options: UseWebSocketConnectionOptions = {}
): UseWebSocketConnectionResult => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const connectionRef = useRef(false);

  useEffect(() => {
    if (!token || connectionRef.current) return;

    const connectWebSocket = async (): Promise<void> => {
      try {
        setConnectionError(null);
        await webSocketClient.connect(token, options);
        setIsConnected(true);
        connectionRef.current = true;
      } catch (_error) {
        // Bug fix: was `error.message` — `error` was not in scope
        setConnectionError(toErrorMessage(_error));
        setIsConnected(false);
      }
    };

    const handleReconnected = (): void => {
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
      setReconnectAttempts(0);
    };

    const handleReconnectFailed = (): void => {
      setIsReconnecting(false);
      setConnectionError('Failed to reconnect to server');
    };

    const handleAuthError = (_error: unknown): void => {
      // Bug fix: was `error.message` — `error` was not in scope
      setConnectionError(toErrorMessage(_error));
      setIsConnected(false);
    };

    const handleMaxReconnectAttempts = (): void => {
      setIsReconnecting(false);
      setConnectionError('Maximum reconnection attempts reached');
    };

    webSocketClient.on('reconnected', handleReconnected);
    webSocketClient.on('reconnect_failed', handleReconnectFailed);
    webSocketClient.on('auth_error', handleAuthError);
    webSocketClient.on(
      'max_reconnect_attempts_reached',
      handleMaxReconnectAttempts
    );

    connectWebSocket();

    const statusInterval = setInterval(() => {
      const status = webSocketClient.getStatus() as WsStatus;
      setIsConnected(status.connected);
      setIsReconnecting(status.reconnecting);
      setReconnectAttempts(status.reconnectAttempts);
    }, 1_000);

    return () => {
      clearInterval(statusInterval);
      webSocketClient.off('reconnected', handleReconnected);
      webSocketClient.off('reconnect_failed', handleReconnectFailed);
      webSocketClient.off('auth_error', handleAuthError);
      webSocketClient.off(
        'max_reconnect_attempts_reached',
        handleMaxReconnectAttempts
      );
      if (connectionRef.current) {
        webSocketClient.disconnect();
        connectionRef.current = false;
      }
    };
  }, [token, options]);

  const reconnect = useCallback((): void => {
    if (token) {
      webSocketClient.connect(token, options).catch((_error: unknown) => {
        // Bug fix: was `error.message` — `error` was not in scope
        setConnectionError(toErrorMessage(_error));
      });
    }
  }, [token, options]);

  return {
    isConnected,
    isReconnecting,
    connectionError,
    reconnectAttempts,
    reconnect
  };
};

// ---------------------------------------------------------------------------
// useRealTimeNotifications
// ---------------------------------------------------------------------------

export const useRealTimeNotifications = (): UseRealTimeNotificationsResult => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNotificationCreated = (data: {
      notification?: NotificationRecord;
      [key: string]: unknown;
    }): void => {
      if (!data.notification) return;
      setNotifications(prev => [data.notification!, ...prev].slice(0, 100));
      setUnreadCount(prev => prev + 1);
    };

    const handleNotificationRead = (data: {
      notificationId?: string;
    }): void => {
      setNotifications(prev =>
        prev.map(n => (n.id === data.notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    webSocketClient.on('notification:created', handleNotificationCreated);
    webSocketClient.on('notification:read', handleNotificationRead);

    return () => {
      webSocketClient.off('notification:created', handleNotificationCreated);
      webSocketClient.off('notification:read', handleNotificationRead);
    };
  }, []);

  const markAsRead = useCallback((notificationId: string): void => {
    webSocketClient.markNotificationRead(notificationId);
  }, []);

  const clearAll = useCallback((): void => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markAsRead, clearAll };
};

// ---------------------------------------------------------------------------
// useRealTimeMembers
// ---------------------------------------------------------------------------

export const useRealTimeMembers = (
  initialMembers: MemberRecord[] = []
): UseRealTimeMembersResult => {
  const [members, setMembers] = useState<MemberRecord[]>(initialMembers);
  const [recentActivity, setRecentActivity] = useState<
    Array<{ type: string; member: MemberRecord; timestamp: string }>
  >([]);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    type MemberEvent = { member: MemberRecord; timestamp: string };

    const handleCreated = (data: MemberEvent): void => {
      setMembers(prev => [...prev, data.member]);
      setRecentActivity(prev => [
        { type: 'created', member: data.member, timestamp: data.timestamp },
        ...prev.slice(0, 49)
      ]);
    };

    const handleUpdated = (data: MemberEvent): void => {
      setMembers(prev =>
        prev.map(m => (m.id === data.member.id ? { ...m, ...data.member } : m))
      );
      setRecentActivity(prev => [
        { type: 'updated', member: data.member, timestamp: data.timestamp },
        ...prev.slice(0, 49)
      ]);
    };

    const handleDeleted = (data: MemberEvent): void => {
      setMembers(prev => prev.filter(m => m.id !== data.member.id));
      setRecentActivity(prev => [
        { type: 'deleted', member: data.member, timestamp: data.timestamp },
        ...prev.slice(0, 49)
      ]);
    };

    webSocketClient.on('member:created', handleCreated);
    webSocketClient.on('member:updated', handleUpdated);
    webSocketClient.on('member:deleted', handleDeleted);

    return () => {
      webSocketClient.off('member:created', handleCreated);
      webSocketClient.off('member:updated', handleUpdated);
      webSocketClient.off('member:deleted', handleDeleted);
    };
  }, []);

  const addMember = useCallback(
    (member: MemberRecord, metadata: Record<string, unknown> = {}): void => {
      webSocketClient.emitMemberAction('create', member, metadata);
    },
    []
  );

  const updateMember = useCallback(
    (member: MemberRecord, metadata: Record<string, unknown> = {}): void => {
      webSocketClient.emitMemberAction('update', member, metadata);
    },
    []
  );

  const deleteMember = useCallback(
    (member: MemberRecord, metadata: Record<string, unknown> = {}): void => {
      webSocketClient.emitMemberAction('delete', member, metadata);
    },
    []
  );

  return { members, recentActivity, addMember, updateMember, deleteMember };
};

// ---------------------------------------------------------------------------
// useRealTimeInvitations
// ---------------------------------------------------------------------------

export const useRealTimeInvitations = (
  initialInvitations: InvitationRecord[] = []
): UseRealTimeInvitationsResult => {
  const [invitations, setInvitations] =
    useState<InvitationRecord[]>(initialInvitations);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setInvitations(initialInvitations);
    setPendingCount(
      initialInvitations.filter(inv => inv.status === 'pending').length
    );
  }, [initialInvitations]);

  useEffect(() => {
    type InvEvent = { invitation: InvitationRecord };

    const handleSent = (data: InvEvent): void => {
      setInvitations(prev => [...prev, data.invitation]);
      setPendingCount(prev => prev + 1);
    };

    const handleReceived = (data: InvEvent): void => {
      setInvitations(prev => [...prev, data.invitation]);
      if (data.invitation.status === 'pending')
        setPendingCount(prev => prev + 1);
    };

    const handleAccepted = (data: InvEvent): void => {
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === data.invitation.id ? { ...inv, status: 'accepted' } : inv
        )
      );
      setPendingCount(prev => Math.max(0, prev - 1));
    };

    const handleDeclined = (data: InvEvent): void => {
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === data.invitation.id ? { ...inv, status: 'declined' } : inv
        )
      );
      setPendingCount(prev => Math.max(0, prev - 1));
    };

    webSocketClient.on('invitation:sent', handleSent);
    webSocketClient.on('invitation:received', handleReceived);
    webSocketClient.on('invitation:accepted', handleAccepted);
    webSocketClient.on('invitation:declined', handleDeclined);

    return () => {
      webSocketClient.off('invitation:sent', handleSent);
      webSocketClient.off('invitation:received', handleReceived);
      webSocketClient.off('invitation:accepted', handleAccepted);
      webSocketClient.off('invitation:declined', handleDeclined);
    };
  }, []);

  const sendInvitation = useCallback(
    (
      invitation: InvitationRecord,
      metadata: Record<string, unknown> = {}
    ): void => {
      webSocketClient.emitInvitationAction('send', invitation, metadata);
    },
    []
  );

  const acceptInvitation = useCallback(
    (
      invitation: InvitationRecord,
      metadata: Record<string, unknown> = {}
    ): void => {
      webSocketClient.emitInvitationAction('accept', invitation, metadata);
    },
    []
  );

  const declineInvitation = useCallback(
    (
      invitation: InvitationRecord,
      metadata: Record<string, unknown> = {}
    ): void => {
      webSocketClient.emitInvitationAction('decline', invitation, metadata);
    },
    []
  );

  return {
    invitations,
    pendingCount,
    sendInvitation,
    acceptInvitation,
    declineInvitation
  };
};

// ---------------------------------------------------------------------------
// useUserPresence
// ---------------------------------------------------------------------------

export const useUserPresence = (): UseUserPresenceResult => {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(
    new Map()
  );
  const [currentUserStatus, setCurrentUserStatus] =
    useState<UserPresenceStatus>('online');

  useEffect(() => {
    type ConnectEvent = {
      userId: string;
      timestamp: string;
      userInfo?: Record<string, unknown>;
    };
    type DisconnectEvent = { userId: string; timestamp: string };
    type PresenceEvent = {
      userId: string;
      status: UserPresenceStatus;
      activity?: string;
      timestamp: string;
    };

    const handleConnected = (data: ConnectEvent): void => {
      setOnlineUsers(prev =>
        new Map(prev).set(data.userId, {
          id: data.userId,
          status: 'online',
          lastSeen: data.timestamp,
          userInfo: data.userInfo
        })
      );
    };

    const handleDisconnected = (data: DisconnectEvent): void => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        const user = newMap.get(data.userId);
        if (user)
          newMap.set(data.userId, {
            ...user,
            status: 'offline',
            lastSeen: data.timestamp
          });
        return newMap;
      });
    };

    const handlePresenceUpdated = (data: PresenceEvent): void => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        const user = newMap.get(data.userId);
        if (user) {
          newMap.set(data.userId, {
            ...user,
            status: data.status,
            activity: data.activity,
            lastSeen: data.timestamp
          });
        }
        return newMap;
      });
    };

    webSocketClient.on('user:connected', handleConnected);
    webSocketClient.on('user:disconnected', handleDisconnected);
    webSocketClient.on('presence:updated', handlePresenceUpdated);

    return () => {
      webSocketClient.off('user:connected', handleConnected);
      webSocketClient.off('user:disconnected', handleDisconnected);
      webSocketClient.off('presence:updated', handlePresenceUpdated);
    };
  }, []);

  const updateStatus = useCallback(
    (status: UserPresenceStatus, activity: string | null = null): void => {
      setCurrentUserStatus(status);
      webSocketClient.updatePresence(status, activity);
    },
    []
  );

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    currentUserStatus,
    updateStatus
  };
};

// ---------------------------------------------------------------------------
// useTypingIndicator
// ---------------------------------------------------------------------------

export const useTypingIndicator = (
  conversationId: string
): UseTypingIndicatorResult => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useEffect(() => {
    const timeouts = typingTimeoutRef.current;
    type TypingEvent = { conversationId: string; userId: string };

    const handleTypingStart = (data: TypingEvent): void => {
      if (data.conversationId !== conversationId) return;
      setTypingUsers(prev => new Set(prev).add(data.userId));

      if (timeouts.has(data.userId)) clearTimeout(timeouts.get(data.userId)!);

      timeouts.set(
        data.userId,
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
          timeouts.delete(data.userId);
        }, 3_000)
      );
    };

    const handleTypingStop = (data: TypingEvent): void => {
      if (data.conversationId !== conversationId) return;
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
      if (timeouts.has(data.userId)) {
        clearTimeout(timeouts.get(data.userId)!);
        timeouts.delete(data.userId);
      }
    };

    webSocketClient.on('typing:start', handleTypingStart);
    webSocketClient.on('typing:stop', handleTypingStop);

    return () => {
      webSocketClient.off('typing:start', handleTypingStart);
      webSocketClient.off('typing:stop', handleTypingStop);
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [conversationId]);

  const startTyping = useCallback(
    (context: Record<string, unknown> = {}): void => {
      webSocketClient.startTyping(conversationId, context);
    },
    [conversationId]
  );

  const stopTyping = useCallback(
    (context: Record<string, unknown> = {}): void => {
      webSocketClient.stopTyping(conversationId, context);
    },
    [conversationId]
  );

  return { typingUsers: Array.from(typingUsers), startTyping, stopTyping };
};

// ---------------------------------------------------------------------------
// useRealTimeRoom
// ---------------------------------------------------------------------------

export const useRealTimeRoom = (
  room: string,
  filters: Record<string, unknown> = {}
): UseRealTimeRoomResult => {
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!room || subscribedRef.current) return;

    const handleInitialData = (data: unknown): void => {
      const roomData = data as RoomItemsData;
      if (roomData.room === room) {
        setData(roomData.data.items ?? []);
        setLoading(false);
      }
    };

    const handleDataError = (data: unknown): void => {
      const roomData = data as RoomItemsData;
      if (roomData.room === room) {
        setError(roomData.error ?? 'Unknown room error');
        setLoading(false);
      }
    };

    webSocketClient.on('room:initial_data', handleInitialData);
    webSocketClient.on('room:data_error', handleDataError);
    webSocketClient.subscribe(room, filters);
    subscribedRef.current = true;

    return () => {
      webSocketClient.off('room:initial_data', handleInitialData);
      webSocketClient.off('room:data_error', handleDataError);
      if (subscribedRef.current) {
        webSocketClient.unsubscribe(room);
        subscribedRef.current = false;
      }
    };
  }, [room, filters]);

  return { data, loading, error };
};
