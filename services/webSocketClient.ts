/**
 * Real-time WebSocket Client
 * Frontend WebSocket client for real-time updates and notifications
 */

import { io, Socket } from "socket.io-client";
import { getWebSocketUrl } from "../config/environment.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WsConnectOptions {
  url?: string;
  [key: string]: unknown;
}

export interface WsStatusResult {
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
  subscriptions: string[];
  queuedMessages: number;
}

type WsEventHandler = (data?: any) => void;

interface QueuedMessage {
  event: string;
  data: unknown;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

class WebSocketClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1_000;
  private eventHandlers: Map<string, Set<WsEventHandler>> = new Map();
  private subscriptions: Set<string> = new Set();
  private messageQueue: QueuedMessage[] = [];
  private isReconnecting = false;

  // Connect — returns a Promise that resolves when the socket handshake is complete
  connect(token: string, options: WsConnectOptions = {}): Promise<void> {
    const socketUrl = (options.url as string | undefined) ?? getWebSocketUrl();

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      timeout: 20_000,
      forceNew: true,
      ...options,
    });

    this.setupEventHandlers();

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10_000);

      this.socket!.on("connect", () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.processMessageQueue();
        this.reestablishSubscriptions();
        resolve();
      });

      this.socket!.on("connect_error", (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("disconnect", (reason: string) => {
      this.isConnected = false;
      if (reason === "io server disconnect") return;
      this.attemptReconnect();
    });

    this.socket.on("reconnect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.reestablishSubscriptions();
      this.emit("reconnected");
    });

    this.socket.on("reconnect_attempt", () => {
      this.isReconnecting = true;
    });

    this.socket.on("reconnect_failed", () => {
      this.isReconnecting = false;
      this.emit("reconnect_failed");
    });

    this.socket.on("connect_error", (error: Error) => {
      if (
        error.message === "Authentication token required" ||
        error.message === "Invalid authentication token"
      ) {
        this.emit("auth_error", error);
      }
    });

    this.setupRealTimeEventHandlers();
  }

  private setupRealTimeEventHandlers(): void {
    if (!this.socket) return;

    const relay = (from: string, to: string) => {
      this.socket!.on(from, (data: unknown) => this.emit(to, data));
    };

    relay("member_created", "member:created");
    relay("member_updated", "member:updated");
    relay("member_deleted", "member:deleted");
    relay("invitation_sent", "invitation:sent");
    relay("invitation_received", "invitation:received");
    relay("invitation_accepted", "invitation:accepted");
    relay("invitation_declined", "invitation:declined");
    relay("activity_created", "activity:created");
    relay("notification_created", "notification:created");
    relay("notification_read", "notification:read");
    relay("user_connected", "user:connected");
    relay("user_disconnected", "user:disconnected");
    relay("presence_updated", "presence:updated");
    relay("typing_start", "typing:start");
    relay("typing_stop", "typing:stop");
    relay("system_maintenance", "system:maintenance");
    relay("room_initial_data", "room:initial_data");
    relay("room_data_error", "room:data_error");
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit("max_reconnect_attempts_reached");
      return;
    }

    this.reconnectAttempts++;
    this.isReconnecting = true;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (!this.isConnected) this.socket?.connect();
    }, delay);
  }

  subscribe(room: string, filters: Record<string, unknown> = {}): void {
    if (!this.isConnected) return;
    this.subscriptions.add(room);
    this.socket?.emit("subscribe", { room, filters });
  }

  unsubscribe(room: string): void {
    if (!this.isConnected) return;
    this.subscriptions.delete(room);
    this.socket?.emit("unsubscribe", { room });
  }

  private reestablishSubscriptions(): void {
    this.subscriptions.forEach((room) => {
      this.socket?.emit("subscribe", { room });
    });
  }

  emitMemberAction(
    action: string,
    member: unknown,
    metadata: Record<string, unknown> = {},
  ): void {
    if (!this.isConnected) {
      this.queueMessage("member_action", { action, member, metadata });
      return;
    }
    this.socket?.emit("member_action", { action, member, metadata });
  }

  emitInvitationAction(
    action: string,
    invitation: unknown,
    metadata: Record<string, unknown> = {},
  ): void {
    if (!this.isConnected) {
      this.queueMessage("invitation_action", { action, invitation, metadata });
      return;
    }
    this.socket?.emit("invitation_action", { action, invitation, metadata });
  }

  emitActivityUpdate(activity: unknown): void {
    if (!this.isConnected) {
      this.queueMessage("activity_update", { activity });
      return;
    }
    this.socket?.emit("activity_update", { activity });
  }

  markNotificationRead(notificationId: string): void {
    if (!this.isConnected) {
      this.queueMessage("notification_read", { notificationId });
      return;
    }
    this.socket?.emit("notification_read", { notificationId });
  }

  startTyping(
    conversationId: string,
    context: Record<string, unknown> = {},
  ): void {
    if (!this.isConnected) return;
    this.socket?.emit("typing_start", { conversationId, context });
  }

  stopTyping(
    conversationId: string,
    context: Record<string, unknown> = {},
  ): void {
    if (!this.isConnected) return;
    this.socket?.emit("typing_stop", { conversationId, context });
  }

  updatePresence(status: string, activity: string | null = null): void {
    if (!this.isConnected) {
      this.queueMessage("presence_update", { status, activity });
      return;
    }
    this.socket?.emit("presence_update", { status, activity });
  }

  private queueMessage(event: string, data: unknown): void {
    this.messageQueue.push({ event, data, timestamp: new Date() });
    if (this.messageQueue.length > 100) this.messageQueue.shift();
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const item = this.messageQueue.shift();
      if (item) this.socket?.emit(item.event, item.data);
    }
  }

  on(event: string, handler: WsEventHandler): void {
    if (!this.eventHandlers.has(event))
      this.eventHandlers.set(event, new Set());
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: WsEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  emit(event: string, data?: unknown): void {
    this.eventHandlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch {
        // Handler errors must not crash the event bus
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.subscriptions.clear();
      this.eventHandlers.clear();
      this.messageQueue = [];
    }
  }

  getStatus(): WsStatusResult {
    return {
      connected: this.isConnected,
      reconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions),
      queuedMessages: this.messageQueue.length,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const webSocketClient = new WebSocketClient();
export default webSocketClient;
