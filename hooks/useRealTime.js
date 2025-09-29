/**
 * Real-time WebSocket Hooks
 * React hooks for WebSocket integration and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from "react";
import webSocketClient from "../services/webSocketClient";

// Hook for WebSocket connection management
export const useWebSocket = (token, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const connectionRef = useRef(false);

  useEffect(() => {
    if (!token || connectionRef.current) return;

    const connectWebSocket = async () => {
      try {
        setConnectionError(null);
        await webSocketClient.connect(token, options);
        setIsConnected(true);
        connectionRef.current = true;
      } catch (error) {
        setConnectionError(error.message);
        setIsConnected(false);
      }
    };

    // Set up event listeners
    const handleReconnected = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
      setReconnectAttempts(0);
    };

    const handleReconnectFailed = () => {
      setIsReconnecting(false);
      setConnectionError("Failed to reconnect to server");
    };

    const handleAuthError = (error) => {
      setConnectionError(error.message);
      setIsConnected(false);
    };

    const handleMaxReconnectAttempts = () => {
      setIsReconnecting(false);
      setConnectionError("Maximum reconnection attempts reached");
    };

    webSocketClient.on("reconnected", handleReconnected);
    webSocketClient.on("reconnect_failed", handleReconnectFailed);
    webSocketClient.on("auth_error", handleAuthError);
    webSocketClient.on(
      "max_reconnect_attempts_reached",
      handleMaxReconnectAttempts,
    );

    connectWebSocket();

    // Update connection status periodically
    const statusInterval = setInterval(() => {
      const status = webSocketClient.getStatus();
      setIsConnected(status.connected);
      setIsReconnecting(status.reconnecting);
      setReconnectAttempts(status.reconnectAttempts);
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      webSocketClient.off("reconnected", handleReconnected);
      webSocketClient.off("reconnect_failed", handleReconnectFailed);
      webSocketClient.off("auth_error", handleAuthError);
      webSocketClient.off(
        "max_reconnect_attempts_reached",
        handleMaxReconnectAttempts,
      );

      if (connectionRef.current) {
        webSocketClient.disconnect();
        connectionRef.current = false;
      }
    };
  }, [token, options]);

  const reconnect = useCallback(() => {
    if (token) {
      webSocketClient.connect(token, options).catch((error) => {
        setConnectionError(error.message);
      });
    }
  }, [token, options]);

  return {
    isConnected,
    isReconnecting,
    connectionError,
    reconnectAttempts,
    reconnect,
  };
};

// Hook for real-time notifications
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNotificationCreated = (data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 100)); // Keep last 100
      setUnreadCount((prev) => prev + 1);
    };

    const handleNotificationRead = (data) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === data.notificationId
            ? { ...notification, read: true }
            : notification,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    webSocketClient.on("notification:created", handleNotificationCreated);
    webSocketClient.on("notification:read", handleNotificationRead);

    return () => {
      webSocketClient.off("notification:created", handleNotificationCreated);
      webSocketClient.off("notification:read", handleNotificationRead);
    };
  }, []);

  const markAsRead = useCallback((notificationId) => {
    webSocketClient.markNotificationRead(notificationId);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
  };
};

// Hook for real-time member updates
export const useRealTimeMembers = (initialMembers = []) => {
  const [members, setMembers] = useState(initialMembers);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    const handleMemberCreated = (data) => {
      setMembers((prev) => [...prev, data.member]);
      setRecentActivity((prev) => [
        { type: "created", member: data.member, timestamp: data.timestamp },
        ...prev.slice(0, 49), // Keep last 50 activities
      ]);
    };

    const handleMemberUpdated = (data) => {
      setMembers((prev) =>
        prev.map((member) =>
          member.id === data.member.id ? { ...member, ...data.member } : member,
        ),
      );
      setRecentActivity((prev) => [
        { type: "updated", member: data.member, timestamp: data.timestamp },
        ...prev.slice(0, 49),
      ]);
    };

    const handleMemberDeleted = (data) => {
      setMembers((prev) =>
        prev.filter((member) => member.id !== data.member.id),
      );
      setRecentActivity((prev) => [
        { type: "deleted", member: data.member, timestamp: data.timestamp },
        ...prev.slice(0, 49),
      ]);
    };

    webSocketClient.on("member:created", handleMemberCreated);
    webSocketClient.on("member:updated", handleMemberUpdated);
    webSocketClient.on("member:deleted", handleMemberDeleted);

    return () => {
      webSocketClient.off("member:created", handleMemberCreated);
      webSocketClient.off("member:updated", handleMemberUpdated);
      webSocketClient.off("member:deleted", handleMemberDeleted);
    };
  }, []);

  const addMember = useCallback((member, metadata = {}) => {
    webSocketClient.emitMemberAction("create", member, metadata);
  }, []);

  const updateMember = useCallback((member, metadata = {}) => {
    webSocketClient.emitMemberAction("update", member, metadata);
  }, []);

  const deleteMember = useCallback((member, metadata = {}) => {
    webSocketClient.emitMemberAction("delete", member, metadata);
  }, []);

  return {
    members,
    recentActivity,
    addMember,
    updateMember,
    deleteMember,
  };
};

// Hook for real-time invitations
export const useRealTimeInvitations = (initialInvitations = []) => {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setInvitations(initialInvitations);
    setPendingCount(
      initialInvitations.filter((inv) => inv.status === "pending").length,
    );
  }, [initialInvitations]);

  useEffect(() => {
    const handleInvitationSent = (data) => {
      setInvitations((prev) => [...prev, data.invitation]);
      setPendingCount((prev) => prev + 1);
    };

    const handleInvitationReceived = (data) => {
      setInvitations((prev) => [...prev, data.invitation]);
      if (data.invitation.status === "pending") {
        setPendingCount((prev) => prev + 1);
      }
    };

    const handleInvitationAccepted = (data) => {
      setInvitations((prev) =>
        prev.map((invitation) =>
          invitation.id === data.invitation.id
            ? { ...invitation, status: "accepted" }
            : invitation,
        ),
      );
      setPendingCount((prev) => Math.max(0, prev - 1));
    };

    const handleInvitationDeclined = (data) => {
      setInvitations((prev) =>
        prev.map((invitation) =>
          invitation.id === data.invitation.id
            ? { ...invitation, status: "declined" }
            : invitation,
        ),
      );
      setPendingCount((prev) => Math.max(0, prev - 1));
    };

    webSocketClient.on("invitation:sent", handleInvitationSent);
    webSocketClient.on("invitation:received", handleInvitationReceived);
    webSocketClient.on("invitation:accepted", handleInvitationAccepted);
    webSocketClient.on("invitation:declined", handleInvitationDeclined);

    return () => {
      webSocketClient.off("invitation:sent", handleInvitationSent);
      webSocketClient.off("invitation:received", handleInvitationReceived);
      webSocketClient.off("invitation:accepted", handleInvitationAccepted);
      webSocketClient.off("invitation:declined", handleInvitationDeclined);
    };
  }, []);

  const sendInvitation = useCallback((invitation, metadata = {}) => {
    webSocketClient.emitInvitationAction("send", invitation, metadata);
  }, []);

  const acceptInvitation = useCallback((invitation, metadata = {}) => {
    webSocketClient.emitInvitationAction("accept", invitation, metadata);
  }, []);

  const declineInvitation = useCallback((invitation, metadata = {}) => {
    webSocketClient.emitInvitationAction("decline", invitation, metadata);
  }, []);

  return {
    invitations,
    pendingCount,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
  };
};

// Hook for user presence tracking
export const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [currentUserStatus, setCurrentUserStatus] = useState("online");

  useEffect(() => {
    const handleUserConnected = (data) => {
      setOnlineUsers(
        (prev) =>
          new Map(
            prev.set(data.userId, {
              id: data.userId,
              status: "online",
              lastSeen: data.timestamp,
              userInfo: data.userInfo,
            }),
          ),
      );
    };

    const handleUserDisconnected = (data) => {
      setOnlineUsers((prev) => {
        const newMap = new Map(prev);
        const user = newMap.get(data.userId);
        if (user) {
          newMap.set(data.userId, {
            ...user,
            status: "offline",
            lastSeen: data.timestamp,
          });
        }
        return newMap;
      });
    };

    const handlePresenceUpdated = (data) => {
      setOnlineUsers((prev) => {
        const newMap = new Map(prev);
        const user = newMap.get(data.userId);
        if (user) {
          newMap.set(data.userId, {
            ...user,
            status: data.status,
            activity: data.activity,
            lastSeen: data.timestamp,
          });
        }
        return newMap;
      });
    };

    webSocketClient.on("user:connected", handleUserConnected);
    webSocketClient.on("user:disconnected", handleUserDisconnected);
    webSocketClient.on("presence:updated", handlePresenceUpdated);

    return () => {
      webSocketClient.off("user:connected", handleUserConnected);
      webSocketClient.off("user:disconnected", handleUserDisconnected);
      webSocketClient.off("presence:updated", handlePresenceUpdated);
    };
  }, []);

  const updateStatus = useCallback((status, activity = null) => {
    setCurrentUserStatus(status);
    webSocketClient.updatePresence(status, activity);
  }, []);

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    currentUserStatus,
    updateStatus,
  };
};

// Hook for typing indicators
export const useTypingIndicator = (conversationId) => {
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(new Map());

  useEffect(() => {
    const timeouts = typingTimeoutRef.current;

    const handleTypingStart = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => new Set(prev.add(data.userId)));

        // Clear existing timeout for this user
        if (timeouts.has(data.userId)) {
          clearTimeout(timeouts.get(data.userId));
        }

        // Set timeout to remove user after 3 seconds
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
          timeouts.delete(data.userId);
        }, 3000);

        timeouts.set(data.userId, timeout);
      }
    };

    const handleTypingStop = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });

        // Clear timeout for this user
        if (timeouts.has(data.userId)) {
          clearTimeout(timeouts.get(data.userId));
          timeouts.delete(data.userId);
        }
      }
    };

    webSocketClient.on("typing:start", handleTypingStart);
    webSocketClient.on("typing:stop", handleTypingStop);

    return () => {
      webSocketClient.off("typing:start", handleTypingStart);
      webSocketClient.off("typing:stop", handleTypingStop);

      // Clear all timeouts
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [conversationId]);

  const startTyping = useCallback(
    (context = {}) => {
      webSocketClient.startTyping(conversationId, context);
    },
    [conversationId],
  );

  const stopTyping = useCallback(
    (context = {}) => {
      webSocketClient.stopTyping(conversationId, context);
    },
    [conversationId],
  );

  return {
    typingUsers: Array.from(typingUsers),
    startTyping,
    stopTyping,
  };
};

// Hook for real-time room subscription
export const useRealTimeRoom = (room, filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!room || subscribedRef.current) return;

    const handleInitialData = (roomData) => {
      if (roomData.room === room) {
        setData(roomData.data.items || []);
        setLoading(false);
      }
    };

    const handleDataError = (roomData) => {
      if (roomData.room === room) {
        setError(roomData.error);
        setLoading(false);
      }
    };

    webSocketClient.on("room:initial_data", handleInitialData);
    webSocketClient.on("room:data_error", handleDataError);

    // Subscribe to room
    webSocketClient.subscribe(room, filters);
    subscribedRef.current = true;

    return () => {
      webSocketClient.off("room:initial_data", handleInitialData);
      webSocketClient.off("room:data_error", handleDataError);

      if (subscribedRef.current) {
        webSocketClient.unsubscribe(room);
        subscribedRef.current = false;
      }
    };
  }, [room, filters]);

  return {
    data,
    loading,
    error,
  };
};
