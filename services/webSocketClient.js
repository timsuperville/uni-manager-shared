/**
 * Real-time WebSocket Client
 * Frontend WebSocket client for real-time updates and notifications
 */

import { io } from "socket.io-client";
import { getWebSocketUrl } from "../config/environment.ts";

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
    this.subscriptions = new Set();
    this.messageQueue = [];
    this.isReconnecting = false;
  }

  // Initialize WebSocket connection
  connect(token, options = {}) {
    const socketUrl = options.url || getWebSocketUrl();

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      ...options,
    });

    this.setupEventHandlers();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        console.log("WebSocket connected");

        // Process any queued messages
        this.processMessageQueue();

        // Re-establish subscriptions
        this.reestablishSubscriptions();

        resolve();
      });

      this.socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        console.error("WebSocket connection failed:", error);
        reject(error);
      });
    });
  }

  // Setup event handlers
  setupEventHandlers() {
    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log("WebSocket disconnected:", reason);

      if (reason === "io server disconnect") {
        // Server disconnected, don't reconnect
        return;
      }

      // Attempt to reconnect
      this.attemptReconnect();
    });

    this.socket.on("reconnect", (attemptNumber) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);

      // Re-establish subscriptions
      this.reestablishSubscriptions();

      // Emit reconnected event
      this.emit("reconnected");
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      this.isReconnecting = true;
      console.log(`WebSocket reconnect attempt ${attemptNumber}`);
    });

    this.socket.on("reconnect_failed", () => {
      this.isReconnecting = false;
      console.error("WebSocket reconnection failed");
      this.emit("reconnect_failed");
    });

    // Handle authentication errors
    this.socket.on("connect_error", (error) => {
      if (
        error.message === "Authentication token required" ||
        error.message === "Invalid authentication token"
      ) {
        this.emit("auth_error", error);
      }
    });

    // Handle subscription responses
    this.socket.on("subscription_success", (data) => {
      console.log("Subscribed to room:", data.room);
    });

    this.socket.on("subscription_error", (data) => {
      console.error("Subscription failed:", data);
    });

    // Handle real-time events
    this.setupRealTimeEventHandlers();
  }

  // Setup real-time event handlers
  setupRealTimeEventHandlers() {
    // Member events
    this.socket.on("member_created", (data) => {
      this.emit("member:created", data);
    });

    this.socket.on("member_updated", (data) => {
      this.emit("member:updated", data);
    });

    this.socket.on("member_deleted", (data) => {
      this.emit("member:deleted", data);
    });

    // Invitation events
    this.socket.on("invitation_sent", (data) => {
      this.emit("invitation:sent", data);
    });

    this.socket.on("invitation_received", (data) => {
      this.emit("invitation:received", data);
    });

    this.socket.on("invitation_accepted", (data) => {
      this.emit("invitation:accepted", data);
    });

    this.socket.on("invitation_declined", (data) => {
      this.emit("invitation:declined", data);
    });

    // Activity events
    this.socket.on("activity_created", (data) => {
      this.emit("activity:created", data);
    });

    // Notification events
    this.socket.on("notification_created", (data) => {
      this.emit("notification:created", data);
    });

    this.socket.on("notification_read", (data) => {
      this.emit("notification:read", data);
    });

    // User presence events
    this.socket.on("user_connected", (data) => {
      this.emit("user:connected", data);
    });

    this.socket.on("user_disconnected", (data) => {
      this.emit("user:disconnected", data);
    });

    this.socket.on("presence_updated", (data) => {
      this.emit("presence:updated", data);
    });

    // Typing indicators
    this.socket.on("typing_start", (data) => {
      this.emit("typing:start", data);
    });

    this.socket.on("typing_stop", (data) => {
      this.emit("typing:stop", data);
    });

    // System events
    this.socket.on("system_maintenance", (data) => {
      this.emit("system:maintenance", data);
    });

    // Initial room data
    this.socket.on("room_initial_data", (data) => {
      this.emit("room:initial_data", data);
    });

    this.socket.on("room_data_error", (data) => {
      this.emit("room:data_error", data);
    });
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      this.emit("max_reconnect_attempts_reached");
      return;
    }

    this.reconnectAttempts++;
    this.isReconnecting = true;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (!this.isConnected) {
        console.log(
          `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        this.socket.connect();
      }
    }, delay);
  }

  // Subscribe to room
  subscribe(room, filters = {}) {
    if (!this.isConnected) {
      console.warn("Cannot subscribe: WebSocket not connected");
      return;
    }

    this.subscriptions.add(room);
    this.socket.emit("subscribe", { room, filters });
  }

  // Unsubscribe from room
  unsubscribe(room) {
    if (!this.isConnected) {
      console.warn("Cannot unsubscribe: WebSocket not connected");
      return;
    }

    this.subscriptions.delete(room);
    this.socket.emit("unsubscribe", { room });
  }

  // Re-establish subscriptions after reconnection
  reestablishSubscriptions() {
    this.subscriptions.forEach((room) => {
      this.socket.emit("subscribe", { room });
    });
  }

  // Emit member action
  emitMemberAction(action, member, metadata = {}) {
    if (!this.isConnected) {
      this.queueMessage("member_action", { action, member, metadata });
      return;
    }

    this.socket.emit("member_action", { action, member, metadata });
  }

  // Emit invitation action
  emitInvitationAction(action, invitation, metadata = {}) {
    if (!this.isConnected) {
      this.queueMessage("invitation_action", { action, invitation, metadata });
      return;
    }

    this.socket.emit("invitation_action", { action, invitation, metadata });
  }

  // Emit activity update
  emitActivityUpdate(activity) {
    if (!this.isConnected) {
      this.queueMessage("activity_update", { activity });
      return;
    }

    this.socket.emit("activity_update", { activity });
  }

  // Mark notification as read
  markNotificationRead(notificationId) {
    if (!this.isConnected) {
      this.queueMessage("notification_read", { notificationId });
      return;
    }

    this.socket.emit("notification_read", { notificationId });
  }

  // Start typing indicator
  startTyping(conversationId, context = {}) {
    if (!this.isConnected) return;

    this.socket.emit("typing_start", { conversationId, context });
  }

  // Stop typing indicator
  stopTyping(conversationId, context = {}) {
    if (!this.isConnected) return;

    this.socket.emit("typing_stop", { conversationId, context });
  }

  // Update presence
  updatePresence(status, activity = null) {
    if (!this.isConnected) {
      this.queueMessage("presence_update", { status, activity });
      return;
    }

    this.socket.emit("presence_update", { status, activity });
  }

  // Queue message for when connection is restored
  queueMessage(event, data) {
    this.messageQueue.push({ event, data, timestamp: new Date() });

    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  // Process queued messages
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift();
      this.socket.emit(event, data);
    }
  }

  // Register event handler
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  // Unregister event handler
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  // Emit event to registered handlers
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.subscriptions.clear();
      this.eventHandlers.clear();
      this.messageQueue = [];
    }
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      reconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions),
      queuedMessages: this.messageQueue.length,
    };
  }
}

// Create singleton instance
const webSocketClient = new WebSocketClient();

export default webSocketClient;
