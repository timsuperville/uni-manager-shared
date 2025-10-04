// Cross-Application Notification System for Uni-Manager
// Enables real-time communication between all applications
/* global console, window, setTimeout, clearInterval, localStorage */
class CrossAppNotificationSystem {
  constructor() {
    this.channels = new Map(); // notification channels
    this.subscribers = new Map(); // subscribers by app
    this.messageQueue = new Map(); // queued messages by app
    this.broadcastChannel = null;
    this.retryIntervals = new Map();
    this.boundStorageHandler = null; // Store bound function for cleanup
    this.boundBroadcastHandler = null; // Store bound function for cleanup
    this.init();
  }
  init() {
    // Use BroadcastChannel for same-origin tab communication
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastChannel = new window.BroadcastChannel(
        "uni-manager-notifications"
      );
      this.boundBroadcastHandler = this.handleBroadcastMessage.bind(this);
      this.broadcastChannel.addEventListener(
        "message",
        this.boundBroadcastHandler
      );
    } else {
      console.warn(
        "BroadcastChannel not available, using localStorage fallback"
      );
      this.initLocalStorageFallback();
    }
  }
  initLocalStorageFallback() {
    // Fallback to localStorage events for cross-tab communication
    this.boundStorageHandler = (event) => {
      if (event.key && event.key.startsWith("uni_manager_notification_")) {
        try {
          const message = JSON.parse(event.newValue);
          this.handleBroadcastMessage({ data: message });
        } catch (error) {
          console.error("Error parsing localStorage notification:", error);
        }
      }
    };
    window.addEventListener("storage", this.boundStorageHandler);
  }
  // Register an application to receive notifications
  registerApplication(appName, handlers = {}) {
    const appSubscription = {
      appName,
      handlers: {
        dataUpdate: handlers.dataUpdate || (() => {}),
        userAction: handlers.userAction || (() => {}),
        systemAlert: handlers.systemAlert || (() => {}),
        customEvent: handlers.customEvent || (() => {}),
      },
      isActive: true,
      registeredAt: new Date(),
    };
    this.subscribers.set(appName, appSubscription);
    // Process any queued messages for this app
    this.processQueuedMessages(appName);
    return {
      unregister: () => this.unregisterApplication(appName),
      sendNotification: (type, data, options) =>
        this.sendNotification(appName, type, data, options),
      updateHandlers: (newHandlers) =>
        this.updateHandlers(appName, newHandlers),
    };
  }
  unregisterApplication(appName) {
    this.subscribers.delete(appName);
    // Clear any retry intervals
    if (this.retryIntervals.has(appName)) {
      clearInterval(this.retryIntervals.get(appName));
      this.retryIntervals.delete(appName);
    }
  }
  updateHandlers(appName, newHandlers) {
    const subscription = this.subscribers.get(appName);
    if (subscription) {
      subscription.handlers = { ...subscription.handlers, ...newHandlers };
    }
  }
  // Send notification to specific app or broadcast to all
  sendNotification(sourceApp, type, data, options = {}) {
    const {
      targetApp = "all",
      priority = "normal",
      persistent = false,
      retryCount = 3,
      delay = 0,
    } = options;
    const message = {
      id: this.generateMessageId(),
      sourceApp,
      targetApp,
      type,
      data,
      priority,
      persistent,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: retryCount,
    };
    if (delay > 0) {
      setTimeout(() => this.deliverNotification(message), delay);
    } else {
      this.deliverNotification(message);
    }
    return message.id;
  }
  deliverNotification(message) {
    const { targetApp } = message;
    if (targetApp === "all") {
      // Broadcast to all registered applications
      this.broadcastToAll(message);
    } else {
      // Send to specific application
      this.sendToApp(targetApp, message);
    }
    // Also send via broadcast channel for cross-tab communication
    this.sendViaBroadcast(message);
  }
  broadcastToAll(message) {
    const deliveryResults = [];
    for (const [appName, subscription] of this.subscribers) {
      if (appName !== message.sourceApp && subscription.isActive) {
        const result = this.deliverToSubscriber(appName, subscription, message);
        deliveryResults.push({ appName, delivered: result });
      }
    }
    return deliveryResults;
  }
  sendToApp(targetApp, message) {
    const subscription = this.subscribers.get(targetApp);
    if (subscription && subscription.isActive) {
      return this.deliverToSubscriber(targetApp, subscription, message);
    } else {
      // Queue message if app is not currently subscribed
      this.queueMessage(targetApp, message);
      return false;
    }
  }
  deliverToSubscriber(appName, subscription, message) {
    try {
      const handler = subscription.handlers[message.type];
      if (typeof handler === "function") {
        handler(message.data, {
          messageId: message.id,
          sourceApp: message.sourceApp,
          timestamp: message.timestamp,
          priority: message.priority,
        });
        return true;
      } else {
        console.warn(`No handler for ${message.type} in ${appName}`);
        return false;
      }
    } catch (error) {
      console.error(`Error delivering notification to ${appName}:`, error);
      // Retry if applicable
      if (message.retryCount < message.maxRetries) {
        message.retryCount++;
        setTimeout(() => {
          this.deliverToSubscriber(appName, subscription, message);
        }, 1000 * message.retryCount); // Exponential backoff
      }
      return false;
    }
  }
  sendViaBroadcast(message) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    } else {
      // Fallback to localStorage
      const key = `uni_manager_notification_${message.id}`;
      localStorage.setItem(key, JSON.stringify(message));
      // Clean up after a short delay
      setTimeout(() => {
        localStorage.removeItem(key);
      }, 5000);
    }
  }
  handleBroadcastMessage(event) {
    const message = event.data;
    // Don't process messages from the same tab
    if (message.sourceTab === this.getTabId()) {
      return;
    }
    // Process the message for local subscribers
    if (message.targetApp === "all") {
      this.broadcastToAll(message);
    } else {
      this.sendToApp(message.targetApp, message);
    }
  }
  queueMessage(appName, message) {
    if (!this.messageQueue.has(appName)) {
      this.messageQueue.set(appName, []);
    }
    const queue = this.messageQueue.get(appName);
    queue.push(message);
    // Limit queue size
    if (queue.length > 50) {
      queue.shift(); // Remove oldest message
    }
  }
  processQueuedMessages(appName) {
    const queue = this.messageQueue.get(appName);
    if (!queue || queue.length === 0) return;
    const subscription = this.subscribers.get(appName);
    if (!subscription) return;
    // Process messages in order
    const processed = [];
    for (const message of queue) {
      if (this.deliverToSubscriber(appName, subscription, message)) {
        processed.push(message);
      }
    }
    // Remove processed messages from queue
    this.messageQueue.set(
      appName,
      queue.filter((msg) => !processed.includes(msg))
    );
  }
  // Predefined notification types with helpers
  sendDataUpdate(sourceApp, updateType, data, targetApp = "all") {
    return this.sendNotification(
      sourceApp,
      "dataUpdate",
      {
        updateType,
        data,
        timestamp: new Date().toISOString(),
      },
      { targetApp }
    );
  }
  sendUserAction(sourceApp, action, context, targetApp = "all") {
    return this.sendNotification(
      sourceApp,
      "userAction",
      {
        action,
        context,
        timestamp: new Date().toISOString(),
      },
      { targetApp, priority: "high" }
    );
  }
  sendSystemAlert(sourceApp, alertType, message, options = {}) {
    return this.sendNotification(
      sourceApp,
      "systemAlert",
      {
        alertType,
        message,
        level: options.level || "info",
        timestamp: new Date().toISOString(),
      },
      {
        targetApp: "all",
        priority: "high",
        persistent: options.persistent || false,
      }
    );
  }
  sendCustomEvent(sourceApp, eventName, eventData, targetApp = "all") {
    return this.sendNotification(
      sourceApp,
      "customEvent",
      {
        eventName,
        eventData,
        timestamp: new Date().toISOString(),
      },
      { targetApp }
    );
  }
  // Utility methods
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  getTabId() {
    if (!this.tabId) {
      this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.tabId;
  }
  getActiveSubscribers() {
    return Array.from(this.subscribers.keys()).filter(
      (appName) => this.subscribers.get(appName).isActive
    );
  }
  getQueueStatus() {
    const status = {};
    for (const [appName, queue] of this.messageQueue) {
      status[appName] = queue.length;
    }
    return status;
  }
  // Health check and diagnostics
  healthCheck() {
    return {
      broadcastChannelAvailable: !!this.broadcastChannel,
      activeSubscribers: this.getActiveSubscribers().length,
      totalSubscribers: this.subscribers.size,
      queuedMessages: this.getQueueStatus(),
      systemStatus: "healthy",
    };
  }

  // Cleanup method to prevent memory leaks
  cleanup() {
    // Clear all retry intervals
    for (const interval of this.retryIntervals.values()) {
      clearInterval(interval);
    }
    this.retryIntervals.clear();

    // Remove BroadcastChannel listener and close channel
    if (this.broadcastChannel && this.boundBroadcastHandler) {
      this.broadcastChannel.removeEventListener(
        "message",
        this.boundBroadcastHandler
      );
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    // Remove localStorage listener
    if (typeof window !== "undefined" && this.boundStorageHandler) {
      window.removeEventListener("storage", this.boundStorageHandler);
    }

    // Clear all data structures
    this.channels.clear();
    this.subscribers.clear();
    this.messageQueue.clear();
    this.boundStorageHandler = null;
    this.boundBroadcastHandler = null;
  }
}
// Create singleton instance
const crossAppNotifications = new CrossAppNotificationSystem();
export default crossAppNotifications;
