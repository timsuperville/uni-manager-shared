/**
 * Real-time Context Provider
 * Centralized real-time updates management
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import webSocketClient from "../services/webSocketClient";

const RealTimeContext = createContext({
  isConnected: false,
  connectionError: null,
  members: [],
  invitations: [],
  notifications: [],
  onlineUsers: [],
  connect: () => {},
  disconnect: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
});

export const useRealTimeContext = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error(
      "useRealTimeContext must be used within a RealTimeProvider",
    );
  }
  return context;
};

export const RealTimeProvider = ({ children, token, householdId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState(new Set());

  // Connection management
  useEffect(() => {
    if (!token) return;

    const connectWebSocket = async () => {
      try {
        await webSocketClient.connect(token);
        setIsConnected(true);
        setConnectionError(null);

        // Subscribe to household room
        if (householdId) {
          webSocketClient.subscribe(`household_${householdId}`);
          setSubscriptions(
            (prev) => new Set(prev.add(`household_${householdId}`)),
          );
        }
      } catch (_error) {
        setConnectionError(error.message);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      webSocketClient.disconnect();
      setIsConnected(false);
      setSubscriptions(new Set());
    };
  }, [token, householdId]);

  // Real-time event handlers
  useEffect(() => {
    // Member events
    const handleMemberCreated = (data) => {
      setMembers((prev) => [...prev, data.member]);
    };

    const handleMemberUpdated = (data) => {
      setMembers((prev) =>
        prev.map((member) =>
          member.id === data.member.id ? { ...member, ...data.member } : member,
        ),
      );
    };

    const handleMemberDeleted = (data) => {
      setMembers((prev) =>
        prev.filter((member) => member.id !== data.member.id),
      );
    };

    // Invitation events
    const handleInvitationSent = (data) => {
      setInvitations((prev) => [...prev, data.invitation]);
    };

    const handleInvitationAccepted = (data) => {
      setInvitations((prev) =>
        prev.map((invitation) =>
          invitation.id === data.invitation.id
            ? { ...invitation, status: "accepted" }
            : invitation,
        ),
      );
    };

    const handleInvitationDeclined = (data) => {
      setInvitations((prev) =>
        prev.map((invitation) =>
          invitation.id === data.invitation.id
            ? { ...invitation, status: "declined" }
            : invitation,
        ),
      );
    };

    // Notification events
    const handleNotificationCreated = (data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 100));
    };

    const handleNotificationRead = (data) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === data.notificationId
            ? { ...notification, read: true }
            : notification,
        ),
      );
    };

    // User presence events
    const handleUserConnected = (data) => {
      setOnlineUsers((prev) => {
        const existing = prev.find((user) => user.id === data.userId);
        if (existing) {
          return prev.map((user) =>
            user.id === data.userId
              ? { ...user, status: "online", lastSeen: data.timestamp }
              : user,
          );
        }
        return [
          ...prev,
          {
            id: data.userId,
            status: "online",
            lastSeen: data.timestamp,
            ...data.userInfo,
          },
        ];
      });
    };

    const handleUserDisconnected = (data) => {
      setOnlineUsers((prev) =>
        prev.map((user) =>
          user.id === data.userId
            ? { ...user, status: "offline", lastSeen: data.timestamp }
            : user,
        ),
      );
    };

    const handlePresenceUpdated = (data) => {
      setOnlineUsers((prev) =>
        prev.map((user) =>
          user.id === data.userId
            ? {
                ...user,
                status: data.status,
                activity: data.activity,
                lastSeen: data.timestamp,
              }
            : user,
        ),
      );
    };

    // Connection events
    const handleReconnected = () => {
      setIsConnected(true);
      setConnectionError(null);

      // Re-establish subscriptions
      subscriptions.forEach((room) => {
        webSocketClient.subscribe(room);
      });
    };

    const handleAuthError = (_error) => {
      setConnectionError(error.message);
      setIsConnected(false);
    };

    // Register event listeners
    webSocketClient.on("member:created", handleMemberCreated);
    webSocketClient.on("member:updated", handleMemberUpdated);
    webSocketClient.on("member:deleted", handleMemberDeleted);
    webSocketClient.on("invitation:sent", handleInvitationSent);
    webSocketClient.on("invitation:accepted", handleInvitationAccepted);
    webSocketClient.on("invitation:declined", handleInvitationDeclined);
    webSocketClient.on("notification:created", handleNotificationCreated);
    webSocketClient.on("notification:read", handleNotificationRead);
    webSocketClient.on("user:connected", handleUserConnected);
    webSocketClient.on("user:disconnected", handleUserDisconnected);
    webSocketClient.on("presence:updated", handlePresenceUpdated);
    webSocketClient.on("reconnected", handleReconnected);
    webSocketClient.on("auth_error", handleAuthError);

    return () => {
      // Cleanup event listeners
      webSocketClient.off("member:created", handleMemberCreated);
      webSocketClient.off("member:updated", handleMemberUpdated);
      webSocketClient.off("member:deleted", handleMemberDeleted);
      webSocketClient.off("invitation:sent", handleInvitationSent);
      webSocketClient.off("invitation:accepted", handleInvitationAccepted);
      webSocketClient.off("invitation:declined", handleInvitationDeclined);
      webSocketClient.off("notification:created", handleNotificationCreated);
      webSocketClient.off("notification:read", handleNotificationRead);
      webSocketClient.off("user:connected", handleUserConnected);
      webSocketClient.off("user:disconnected", handleUserDisconnected);
      webSocketClient.off("presence:updated", handlePresenceUpdated);
      webSocketClient.off("reconnected", handleReconnected);
      webSocketClient.off("auth_error", handleAuthError);
    };
  }, [subscriptions]);

  // Context methods
  const connect = async (newToken) => {
    try {
      await webSocketClient.connect(newToken || token);
      setIsConnected(true);
      setConnectionError(null);
    } catch (_error) {
      setConnectionError(error.message);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    webSocketClient.disconnect();
    setIsConnected(false);
    setSubscriptions(new Set());
  };

  const subscribe = (room, filters = {}) => {
    webSocketClient.subscribe(room, filters);
    setSubscriptions((prev) => new Set(prev.add(room)));
  };

  const unsubscribe = (room) => {
    webSocketClient.unsubscribe(room);
    setSubscriptions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(room);
      return newSet;
    });
  };

  const value = {
    isConnected,
    connectionError,
    members,
    invitations,
    notifications,
    onlineUsers,
    connect,
    disconnect,
    subscribe,
    unsubscribe,

    // WebSocket actions
    emitMemberAction: webSocketClient.emitMemberAction.bind(webSocketClient),
    emitInvitationAction:
      webSocketClient.emitInvitationAction.bind(webSocketClient),
    emitActivityUpdate:
      webSocketClient.emitActivityUpdate.bind(webSocketClient),
    markNotificationRead:
      webSocketClient.markNotificationRead.bind(webSocketClient),
    updatePresence: webSocketClient.updatePresence.bind(webSocketClient),
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
