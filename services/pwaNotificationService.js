/* eslint-disable no-undef */
/**
 * PWA Notification Service
 * Enhanced frontend service for managing push notifications with PWA integration
 * Works with the enhanced backend push notification system
 */

import { apiService } from '../../../shared/services/apiService';

class PWANotificationService {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.permission = Notification.permission;
    this.subscription = null;
    this.preferences = {
      serviceReminders: true,
      eventNotifications: true,
      adminAlerts: true,
      familyUpdates: true,
      businessNotifications: true,
      systemUpdates: false,
      marketingMessages: false
    };
    this.vapidPublicKey = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the notification service
   */
  async initialize() {
    try {
      if (!this.isSupported) {
        // console.warn('Push notifications are not supported in this browser');
        return false;
      }

      // Get VAPID public key from backend
      await this.getVapidPublicKey();

      // Check for existing subscription
      await this.checkExistingSubscription();

      this.isInitialized = true;
      // console.log('PWA Notification Service initialized');
      return true;
    } catch (_error) {
      // console.error('Failed to initialize PWA Notification Service:', error);
      return false;
    }
  }

  /**
   * Get VAPID public key from backend
   */
  async getVapidPublicKey() {
    try {
      // For now, use environment variable or default
      // In production, this should come from the backend
      this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY ||
        'BNxJLxVhXvvJV2wX1xG8K9EeEQy-Zj6QJvF2CZlHfE9QJ6vX2Z8H4G3K9EeEQy';
    } catch (_error) {
      // console.error('Failed to get VAPID public key:', error);
      throw error;
    }
  }

  /**
   * Check for existing push subscription
   */
  async checkExistingSubscription() {
    try {
      if (!('serviceWorker' in navigator)) return null;

      const registration = await typeof navigator !== "undefined" && navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        this.subscription = subscription;

        // Verify subscription with backend
        try {
          const response = await apiService.get('/admin/push-notifications/subscriptions');
          if (response.success) {
            const backendSubscriptions = response.data;
            const matchingSubscription = backendSubscriptions.find(
              sub => sub.endpoint === subscription.endpoint
            );

            if (matchingSubscription) {
              this.preferences = matchingSubscription.preferences;
              // console.log('Found existing subscription in backend');
            } else {
              // Subscription exists locally but not in backend - re-subscribe
              await this.subscribe();
            }
          }
        } catch (_error) {
          // console.warn('Could not verify subscription with backend:', error);
        }
      }

      return subscription;
    } catch (_error) {
      // console.error('Failed to check existing subscription:', error);
      return null;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    try {
      if (!this.isSupported) {
        throw new Error('Push notifications are not supported');
      }

      if (this.permission === 'granted') {
        return true;
      }

      const permission = await Notification.requestPermission();
      this.permission = permission;

      if (permission === 'granted') {
        // console.log('Notification permission granted');
        return true;
      } else {
        // console.log('Notification permission denied');
        return false;
      }
    } catch (_error) {
      // console.error('Failed to request notification permission:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    try {
      if (!this.isSupported) {
        throw new Error('Push notifications are not supported');
      }

      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission not granted');
      }

      // Get service worker registration
      const registration = await typeof navigator !== "undefined" && navigator.serviceWorker.ready;

      // Create push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      this.subscription = subscription;

      // Send subscription to backend
      const deviceInfo = this.getDeviceInfo();
      const response = await apiService.post('/admin/push-notifications/subscribe', {
        subscription: subscription.toJSON(),
        userAgent: typeof navigator !== "undefined" && navigator.userAgent,
        deviceInfo
      });

      if (response.success) {
        this.preferences = response.data.preferences;
        // console.log('Successfully subscribed to push notifications');

        // Dispatch custom event for UI updates
        typeof window !== "undefined" && window.dispatchEvent(new CustomEvent('pwa-notification-subscribed', {
          detail: { subscription: subscription.toJSON(), preferences: this.preferences }
        }));

        return subscription;
      } else {
        throw new Error(response.message || 'Failed to subscribe');
      }
    } catch (_error) {
      // console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    try {
      if (!this.subscription) {
        // console.log('No active subscription to unsubscribe');
        return true;
      }

      // Unsubscribe from backend
      const response = await apiService.delete('/admin/push-notifications/unsubscribe', {
        endpoint: this.subscription.endpoint
      });

      if (response.success) {
        // Unsubscribe locally
        await this.subscription.unsubscribe();
        this.subscription = null;

        // console.log('Successfully unsubscribed from push notifications');

        // Dispatch custom event for UI updates
        typeof window !== "undefined" && window.dispatchEvent(new CustomEvent('pwa-notification-unsubscribed'));

        return true;
      } else {
        throw new Error(response.message || 'Failed to unsubscribe');
      }
    } catch (_error) {
      // console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(newPreferences) {
    try {
      if (!this.subscription) {
        throw new Error('No active subscription');
      }

      const response = await apiService.put('/admin/push-notifications/preferences', {
        subscriptionId: this.subscription.endpoint, // Using endpoint as ID for now
        preferences: newPreferences
      });

      if (response.success) {
        this.preferences = response.data.preferences;
        // console.log('Notification preferences updated');

        // Dispatch custom event for UI updates
        typeof window !== "undefined" && window.dispatchEvent(new CustomEvent('pwa-notification-preferences-updated', {
          detail: { preferences: this.preferences }
        }));

        return this.preferences;
      } else {
        throw new Error(response.message || 'Failed to update preferences');
      }
    } catch (_error) {
      // console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(options = {}) {
    try {
      const testNotification = {
        title: options.title || 'Test Notification',
        body: options.body || 'This is a test notification from Uni-Manager',
        category: options.category || 'system',
        priority: options.priority || 'normal'
      };

      const response = await apiService.post('/admin/push-notifications/test', testNotification);

      if (response.success) {
        // console.log('Test notification sent successfully');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to send test notification');
      }
    } catch (_error) {
      // console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Show local notification (fallback for development)
   */
  showLocalNotification(title, body, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      // console.warn('Cannot show local notification: not supported or permission not granted');
      return null;
    }

    const notification = new Notification(title, {
      body,
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/icon-72x72.png',
      tag: options.tag || 'default',
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      vibrate: options.vibrate || [200, 100, 200],
      data: options.data || {},
      actions: options.actions || []
    });

    // Auto-close after timeout
    if (options.timeout) {
      setTimeout(() => {
        notification.close();
      }, options.timeout);
    }

    return notification;
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    const userAgent = typeof navigator !== "undefined" && navigator.userAgent;
    let browser = 'Unknown';
    let platform = 'Unknown';

    // Detect browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Detect platform
    if (userAgent.includes('Windows')) platform = 'Windows';
    else if (userAgent.includes('Mac')) platform = 'macOS';
    else if (userAgent.includes('Linux')) platform = 'Linux';
    else if (userAgent.includes('Android')) platform = 'Android';
    else if (userAgent.includes('iOS')) platform = 'iOS';

    return {
      browser,
      platform,
      version: typeof navigator !== "undefined" && navigator.appVersion
    };
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = typeof window !== "undefined" && window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Get subscription status
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      isSubscribed: !!this.subscription,
      preferences: this.preferences,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Check if category is enabled in preferences
   */
  isCategoryEnabled(category) {
    const categoryMap = {
      service: 'serviceReminders',
      event: 'eventNotifications',
      admin: 'adminAlerts',
      family: 'familyUpdates',
      business: 'businessNotifications',
      system: 'systemUpdates',
      marketing: 'marketingMessages'
    };

    const prefKey = categoryMap[category];
    return prefKey ? this.preferences[prefKey] : true;
  }
}

// Create singleton instance
const pwaNotificationService = new PWANotificationService();

// Auto-initialize when service worker is ready
if ('serviceWorker' in navigator) {
  typeof navigator !== "undefined" && navigator.serviceWorker.ready.then(() => {
    pwaNotificationService.initialize().catch(console.error);
  });
}

export default pwaNotificationService;
export { PWANotificationService };