/**
 * PWA Notification Service
 * Enhanced frontend service for managing push notifications with PWA integration
 * Works with the enhanced backend push notification system
 */

import { apiService } from '../../../shared/services/apiService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PwaNotificationPreferences {
  serviceReminders: boolean;
  eventNotifications: boolean;
  adminAlerts: boolean;
  familyUpdates: boolean;
  workNotifications: boolean;
  systemUpdates: boolean;
  marketingMessages: boolean;
  [key: string]: boolean;
}

export interface TestNotificationOptions {
  title?: string;
  body?: string;
  category?: string;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
}

export interface LocalNotificationOptions {
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  timeout?: number;
}

export interface DeviceInfo {
  browser: string;
  platform: string;
  version: string | boolean;
}

export interface PwaNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  preferences: PwaNotificationPreferences;
  isInitialized: boolean;
}

type NotificationCategory =
  | 'service'
  | 'event'
  | 'admin'
  | 'family'
  | 'work'
  | 'system'
  | 'marketing';

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

class PWANotificationService {
  isSupported: boolean;
  private permission: NotificationPermission;
  private subscription: PushSubscription | null = null;
  private preferences: PwaNotificationPreferences;
  private vapidPublicKey: string | null = null;
  private isInitialized = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.permission = Notification.permission;
    this.preferences = {
      serviceReminders: true,
      eventNotifications: true,
      adminAlerts: true,
      familyUpdates: true,
      workNotifications: true,
      systemUpdates: false,
      marketingMessages: false
    };
  }

  async initialize(): Promise<boolean> {
    try {
      if (!this.isSupported) return false;
      await this.getVapidPublicKey();
      await this.checkExistingSubscription();
      this.isInitialized = true;
      return true;
    } catch {
      return false;
    }
  }

  private async getVapidPublicKey(): Promise<void> {
    // In production, this should come from the backend
    this.vapidPublicKey =
      (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ??
      'BNxJLxVhXvvJV2wX1xG8K9EeEQy-Zj6QJvF2CZlHfE9QJ6vX2Z8H4G3K9EeEQy';
  }

  private async checkExistingSubscription(): Promise<PushSubscription | null> {
    try {
      if (!('serviceWorker' in navigator)) return null;

      // Bug fix: original had `(await typeof navigator) !== "undefined"` — `typeof` returns a string,
      // not a Promise, so `await` on it is a no-op but the intent was just `navigator.serviceWorker.ready`.
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        this.subscription = subscription;

        try {
          const response = (await apiService.get(
            '/admin/push-notifications/subscriptions'
          )) as {
            success: boolean;
            data: Array<{
              endpoint: string;
              preferences: PwaNotificationPreferences;
            }>;
          };
          if (response.success) {
            const match = response.data.find(
              sub => sub.endpoint === subscription.endpoint
            );
            if (match) {
              this.preferences = match.preferences;
            } else {
              await this.subscribe();
            }
          }
        } catch {
          // Non-fatal: backend sync failure doesn't prevent local usage
        }
      }

      return subscription;
    } catch {
      return null;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported)
      throw new Error('Push notifications are not supported');
    if (this.permission === 'granted') return true;

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async subscribe(): Promise<PushSubscription> {
    if (!this.isSupported)
      throw new Error('Push notifications are not supported');

    const hasPermission = await this.requestPermission();
    if (!hasPermission) throw new Error('Notification permission not granted');

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey!)
    });

    this.subscription = subscription;

    const deviceInfo = this.getDeviceInfo();
    const response = (await apiService.post(
      '/admin/push-notifications/subscribe',
      {
        subscription: subscription.toJSON(),
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : null,
        deviceInfo
      }
    )) as {
      success: boolean;
      message?: string;
      data: { preferences: PwaNotificationPreferences };
    };

    if (response.success) {
      this.preferences = response.data.preferences;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('pwa-notification-subscribed', {
            detail: {
              subscription: subscription.toJSON(),
              preferences: this.preferences
            }
          })
        );
      }

      return subscription;
    }

    throw new Error(response.message ?? 'Failed to subscribe');
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) return true;

    const response = (await apiService.delete(
      '/admin/push-notifications/unsubscribe',
      {
        endpoint: this.subscription.endpoint
      }
    )) as { success: boolean; message?: string };

    if (response.success) {
      await this.subscription.unsubscribe();
      this.subscription = null;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pwa-notification-unsubscribed'));
      }

      return true;
    }

    throw new Error(response.message ?? 'Failed to unsubscribe');
  }

  async updatePreferences(
    newPreferences: Partial<PwaNotificationPreferences>
  ): Promise<PwaNotificationPreferences> {
    if (!this.subscription) throw new Error('No active subscription');

    const response = (await apiService.put(
      '/admin/push-notifications/preferences',
      {
        subscriptionId: this.subscription.endpoint,
        preferences: newPreferences
      }
    )) as {
      success: boolean;
      message?: string;
      data: { preferences: PwaNotificationPreferences };
    };

    if (response.success) {
      this.preferences = response.data.preferences;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('pwa-notification-preferences-updated', {
            detail: { preferences: this.preferences }
          })
        );
      }

      return this.preferences;
    }

    throw new Error(response.message ?? 'Failed to update preferences');
  }

  async sendTestNotification(
    options: TestNotificationOptions = {}
  ): Promise<unknown> {
    const testNotification = {
      title: options.title ?? 'Test Notification',
      body: options.body ?? 'This is a test notification from Uni-Manager',
      category: options.category ?? 'system',
      priority: options.priority ?? 'normal'
    };

    const response = (await apiService.post(
      '/admin/push-notifications/test',
      testNotification
    )) as {
      success: boolean;
      message?: string;
      data: unknown;
    };

    if (response.success) return response.data;
    throw new Error(response.message ?? 'Failed to send test notification');
  }

  showLocalNotification(
    title: string,
    body: string,
    options: LocalNotificationOptions = {}
  ): Notification | null {
    if (!this.isSupported || this.permission !== 'granted') return null;

    const notification = new Notification(title, {
      body,
      icon: options.icon ?? '/icons/icon-192x192.png',
      badge: options.badge ?? '/icons/icon-72x72.png',
      tag: options.tag ?? 'default',
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
      vibrate: options.vibrate ?? [200, 100, 200],
      data: options.data ?? {}
    });

    if (options.timeout) {
      setTimeout(() => notification.close(), options.timeout);
    }

    return notification;
  }

  getDeviceInfo(): DeviceInfo {
    const userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let browser = 'Unknown';
    let platform = 'Unknown';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) platform = 'Windows';
    else if (userAgent.includes('Mac')) platform = 'macOS';
    else if (userAgent.includes('Linux')) platform = 'Linux';
    else if (userAgent.includes('Android')) platform = 'Android';
    else if (userAgent.includes('iOS')) platform = 'iOS';

    return {
      browser,
      platform,
      version: typeof navigator !== 'undefined' ? navigator.appVersion : false
    };
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i)
      outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  getStatus(): PwaNotificationStatus {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      isSubscribed: !!this.subscription,
      preferences: this.preferences,
      isInitialized: this.isInitialized
    };
  }

  isCategoryEnabled(category: NotificationCategory): boolean {
    const categoryMap: Record<
      NotificationCategory,
      keyof PwaNotificationPreferences
    > = {
      service: 'serviceReminders',
      event: 'eventNotifications',
      admin: 'adminAlerts',
      family: 'familyUpdates',
      work: 'workNotifications',
      system: 'systemUpdates',
      marketing: 'marketingMessages'
    };
    const prefKey = categoryMap[category];
    return prefKey ? this.preferences[prefKey] : true;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const pwaNotificationService = new PWANotificationService();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    pwaNotificationService.initialize().catch((e: unknown) => {
      if (import.meta.env.DEV)
        console.error('[PWANotification] Auto-init failed:', e);
    });
  });
}

export default pwaNotificationService;
export { PWANotificationService };
