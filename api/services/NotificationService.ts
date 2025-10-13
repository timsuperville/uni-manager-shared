/**
 * Notification Management Service
 *
 * Comprehensive notification service providing real-time messaging,
 * push notifications, email notifications, and in-app messaging
 * across the Uni-Manager ecosystem.
 *
 * Features:
 * - Real-time notifications
 * - Push notification management
 * - Email notification templates
 * - In-app messaging
 * - Notification preferences
 * - Notification history
 * - Bulk notification operations
 * - Notification analytics
 */

import {
  BaseService,
  ValidationSchema,
  PaginationParams,
  PaginatedResponse,
} from './BaseService';
import {
  Notification,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  NotificationTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  NotificationPreferences,
  BulkNotificationRequest,
  NotificationStats,
  PushSubscription,
} from '../types';
import { ApiClient } from '../core/ApiClient';

export class NotificationService extends BaseService {
  constructor(client: ApiClient) {
    super(client, '/notifications', 'NotificationService');
  }

  // ===============================================
  // VALIDATION SCHEMAS
  // ===============================================

  private static readonly SCHEMAS = {
    notificationId: {
      notificationId: {
        type: 'string' as const,
        required: true,
        minLength: 1,
      },
    },

    createNotification: {
      title: {
        type: 'string' as const,
        required: true,
        minLength: 1,
        maxLength: 255,
      },
      message: {
        type: 'string' as const,
        required: true,
        minLength: 1,
        maxLength: 1000,
      },
      type: {
        type: 'string' as const,
        required: true,
        validator: (value: string) =>
          ['info', 'success', 'warning', 'error', 'announcement'].includes(
            value,
          ) || 'Invalid notification type',
      },
      recipients: { type: 'array' as const, required: true },
      scheduledFor: { type: 'string' as const },
      templateId: { type: 'string' as const },
    },

    updateNotification: {
      title: {
        type: 'string' as const,
        minLength: 1,
        maxLength: 255,
      },
      message: {
        type: 'string' as const,
        minLength: 1,
        maxLength: 1000,
      },
      status: {
        type: 'string' as const,
        validator: (value: string) =>
          ['draft', 'scheduled', 'sent', 'cancelled'].includes(value) ||
          'Invalid notification status',
      },
      scheduledFor: { type: 'string' as const },
    },

    templateId: {
      templateId: {
        type: 'string' as const,
        required: true,
        minLength: 1,
      },
    },

    createTemplate: {
      name: {
        type: 'string' as const,
        required: true,
        minLength: 1,
        maxLength: 255,
      },
      subject: {
        type: 'string' as const,
        required: true,
        minLength: 1,
        maxLength: 255,
      },
      bodyTemplate: {
        type: 'string' as const,
        required: true,
        minLength: 1,
      },
      type: {
        type: 'string' as const,
        required: true,
        validator: (value: string) =>
          ['email', 'push', 'sms', 'in-app'].includes(value) ||
          'Invalid template type',
      },
    },

    updateTemplate: {
      name: {
        type: 'string' as const,
        minLength: 1,
        maxLength: 255,
      },
      subject: {
        type: 'string' as const,
        minLength: 1,
        maxLength: 255,
      },
      bodyTemplate: {
        type: 'string' as const,
        minLength: 1,
      },
      isActive: { type: 'boolean' as const },
    },

    bulkNotification: {
      notifications: {
        type: 'array' as const,
        required: true,
        validator: (value: any[]) =>
          value.length > 0 || 'At least one notification is required',
      },
      templateId: { type: 'string' as const },
      scheduledFor: { type: 'string' as const },
    },

    preferences: {
      emailNotifications: { type: 'boolean' as const },
      pushNotifications: { type: 'boolean' as const },
      smsNotifications: { type: 'boolean' as const },
      inAppNotifications: { type: 'boolean' as const },
    },
  } as const;

  // ===============================================
  // NOTIFICATION OPERATIONS
  // ===============================================

  /**
   * Create a new notification
   */
  async createNotification(
    notificationData: CreateNotificationRequest,
  ): Promise<Notification> {
    const schema: ValidationSchema =
      NotificationService.SCHEMAS.createNotification;
    this.validateRequest(notificationData, schema);

    return this.post<Notification>(this.baseEndpoint, notificationData);
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<Notification> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.notificationId;
    this.validateRequest({ notificationId }, schema);

    return this.get<Notification>(this.buildIdEndpoint(notificationId));
  }

  /**
   * Update notification
   */
  async updateNotification(
    notificationId: string,
    updates: UpdateNotificationRequest,
  ): Promise<Notification> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.notificationId;
    this.validateRequest({ notificationId }, schema);

    const updateSchema: ValidationSchema =
      NotificationService.SCHEMAS.updateNotification;
    this.validateRequest(updates, updateSchema);

    return this.patch<Notification>(
      this.buildIdEndpoint(notificationId),
      updates,
    );
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    notificationId: string,
  ): Promise<{ success: boolean }> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.notificationId;
    this.validateRequest({ notificationId }, schema);

    return this.delete<{ success: boolean }>(
      this.buildIdEndpoint(notificationId),
    );
  }

  /**
   * Send notification immediately
   */
  async sendNotification(notificationId: string): Promise<{
    sent: boolean;
    sentCount: number;
    failedCount: number;
  }> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.notificationId;
    this.validateRequest({ notificationId }, schema);

    return this.post<{
      sent: boolean;
      sentCount: number;
      failedCount: number;
    }>(this.buildIdEndpoint(notificationId, '/send'), {});
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(
    notificationId: string,
  ): Promise<{ success: boolean }> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.notificationId;
    this.validateRequest({ notificationId }, schema);

    return this.post<{ success: boolean }>(
      this.buildIdEndpoint(notificationId, '/cancel'),
      {},
    );
  }

  /**
   * Get user notifications with filtering and pagination
   */
  async getUserNotifications(
    filters: {
      status?: 'read' | 'unread' | 'archived';
      type?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Notification>> {
    const queryParams: Record<string, string> = {};

    // Build filter parameters
    if (filters.status) {
      queryParams.status = filters.status;
    }

    if (filters.type) {
      queryParams.type = filters.type;
    }

    if (filters.dateFrom) {
      queryParams.dateFrom = filters.dateFrom;
    }

    if (filters.dateTo) {
      queryParams.dateTo = filters.dateTo;
    }

    // Add pagination parameters
    const paginationParams = this.buildPaginationParams(pagination);
    const allParams = { ...queryParams, ...paginationParams };

    const queryString =
      Object.keys(allParams).length > 0
        ? new URLSearchParams(allParams).toString()
        : '';

    const endpoint = queryString
      ? `${this.baseEndpoint}/user?${queryString}`
      : `${this.baseEndpoint}/user`;

    return this.get<PaginatedResponse<Notification>>(endpoint);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.notificationId;
    this.validateRequest({ notificationId }, schema);

    return this.post<{ success: boolean }>(
      this.buildIdEndpoint(notificationId, '/read'),
      {},
    );
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<{
    successful: string[];
    failed: string[];
  }> {
    return this.post<{
      successful: string[];
      failed: string[];
    }>(this.baseEndpoint + '/mark-read', { notificationIds });
  }

  /**
   * Archive notification
   */
  async archiveNotification(
    notificationId: string,
  ): Promise<{ success: boolean }> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.notificationId;
    this.validateRequest({ notificationId }, schema);

    return this.post<{ success: boolean }>(
      this.buildIdEndpoint(notificationId, '/archive'),
      {},
    );
  }

  // ===============================================
  // TEMPLATE OPERATIONS
  // ===============================================

  /**
   * Create notification template
   */
  async createTemplate(
    templateData: CreateTemplateRequest,
  ): Promise<NotificationTemplate> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.createTemplate;
    this.validateRequest(templateData, schema);

    return this.post<NotificationTemplate>(
      this.baseEndpoint + '/templates',
      templateData,
    );
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.templateId;
    this.validateRequest({ templateId }, schema);

    return this.get<NotificationTemplate>(
      this.buildIdEndpoint(templateId, '/templates'),
    );
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: UpdateTemplateRequest,
  ): Promise<NotificationTemplate> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.templateId;
    this.validateRequest({ templateId }, schema);

    const updateSchema: ValidationSchema =
      NotificationService.SCHEMAS.updateTemplate;
    this.validateRequest(updates, updateSchema);

    return this.patch<NotificationTemplate>(
      this.buildIdEndpoint(templateId, '/templates'),
      updates,
    );
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.templateId;
    this.validateRequest({ templateId }, schema);

    return this.delete<{ success: boolean }>(
      this.buildIdEndpoint(templateId, '/templates'),
    );
  }

  /**
   * Get all templates with pagination
   */
  async getTemplates(
    filters: {
      type?: string;
      isActive?: boolean;
    } = {},
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<NotificationTemplate>> {
    const queryParams: Record<string, string> = {};

    if (filters.type) {
      queryParams.type = filters.type;
    }

    if (filters.isActive !=== undefined) {
      queryParams.isActive = String(filters.isActive);
    }

    // Add pagination parameters
    const paginationParams = this.buildPaginationParams(pagination);
    const allParams = { ...queryParams, ...paginationParams };

    const queryString =
      Object.keys(allParams).length > 0
        ? new URLSearchParams(allParams).toString()
        : '';

    const endpoint = queryString
      ? `${this.baseEndpoint}/templates?${queryString}`
      : `${this.baseEndpoint}/templates`;

    return this.get<PaginatedResponse<NotificationTemplate>>(endpoint);
  }

  /**
   * Preview template with data
   */
  async previewTemplate(
    templateId: string,
    data: Record<string, any>,
  ): Promise<{
    subject: string;
    body: string;
    htmlBody?: string;
  }> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.templateId;
    this.validateRequest({ templateId }, schema);

    return this.post<{
      subject: string;
      body: string;
      htmlBody?: string;
    }>(this.buildIdEndpoint(templateId, '/templates/preview'), { data });
  }

  // ===============================================
  // BULK OPERATIONS
  // ===============================================

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(bulkRequest: BulkNotificationRequest): Promise<{
    jobId: string;
    totalNotifications: number;
    estimatedCompletion: string;
  }> {
    const schema: ValidationSchema =
      NotificationService.SCHEMAS.bulkNotification;
    this.validateRequest(bulkRequest, schema);

    return this.post<{
      jobId: string;
      totalNotifications: number;
      estimatedCompletion: string;
    }>(this.baseEndpoint + '/bulk', bulkRequest);
  }

  /**
   * Get bulk operation status
   */
  async getBulkOperationStatus(jobId: string): Promise<{
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: {
      total: number;
      completed: number;
      failed: number;
      percentage: number;
    };
    createdAt: string;
    completedAt?: string;
    error?: string;
  }> {
    return this.get<{
      id: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      progress: {
        total: number;
        completed: number;
        failed: number;
        percentage: number;
      };
      createdAt: string;
      completedAt?: string;
      error?: string;
    }>(`${this.baseEndpoint}/bulk/${jobId}/status`);
  }

  // ===============================================
  // PREFERENCES AND SETTINGS
  // ===============================================

  /**
   * Get user notification preferences
   */
  async getUserPreferences(): Promise<NotificationPreferences> {
    return this.get<NotificationPreferences>(
      this.baseEndpoint + '/preferences',
    );
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.preferences;
    this.validateRequest(preferences, schema);

    return this.patch<NotificationPreferences>(
      this.baseEndpoint + '/preferences',
      preferences,
    );
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(
    subscription: PushSubscription,
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(
      this.baseEndpoint + '/push/subscribe',
      subscription,
    );
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(endpoint: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(
      this.baseEndpoint + '/push/unsubscribe',
      { endpoint },
    );
  }

  // ===============================================
  // ANALYTICS AND REPORTING
  // ===============================================

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    filters: {
      dateFrom?: string;
      dateTo?: string;
      type?: string;
    } = {},
  ): Promise<NotificationStats> {
    const queryParams: Record<string, string> = {};

    if (filters.dateFrom) {
      queryParams.dateFrom = filters.dateFrom;
    }

    if (filters.dateTo) {
      queryParams.dateTo = filters.dateTo;
    }

    if (filters.type) {
      queryParams.type = filters.type;
    }

    const queryString =
      Object.keys(queryParams).length > 0
        ? new URLSearchParams(queryParams).toString()
        : '';

    const endpoint = queryString
      ? `${this.baseEndpoint}/stats?${queryString}`
      : `${this.baseEndpoint}/stats`;

    return this.get<NotificationStats>(endpoint);
  }

  /**
   * Get notification delivery report
   */
  async getDeliveryReport(notificationId: string): Promise<{
    notificationId: string;
    totalRecipients: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
    failures: Array<{
      recipient: string;
      reason: string;
      timestamp: string;
    }>;
  }> {
    const schema: ValidationSchema = NotificationService.SCHEMAS.notificationId;
    this.validateRequest({ notificationId }, schema);

    return this.get<{
      notificationId: string;
      totalRecipients: number;
      delivered: number;
      failed: number;
      pending: number;
      deliveryRate: number;
      failures: Array<{
        recipient: string;
        reason: string;
        timestamp: string;
      }>;
    }>(this.buildIdEndpoint(notificationId, '/delivery-report'));
  }

  // ===============================================
  // REAL-TIME OPERATIONS
  // ===============================================

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return this.get<{ count: number }>(this.baseEndpoint + '/unread-count');
  }

  /**
   * Test notification delivery
   */
  async testNotification(
    type: 'email' | 'push' | 'sms',
    recipient: string,
    message: string,
  ): Promise<{
    sent: boolean;
    deliveryTime: number;
    error?: string;
  }> {
    return this.post<{
      sent: boolean;
      deliveryTime: number;
      error?: string;
    }>(this.baseEndpoint + '/test', {
      type,
      recipient,
      message,
    });
  }

  /**
   * Get notification history for a specific user
   */
  async getUserNotificationHistory(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Notification>> {
    const paginationParams = this.buildPaginationParams(pagination);
    const queryString =
      Object.keys(paginationParams).length > 0
        ? new URLSearchParams(paginationParams).toString()
        : '';

    const endpoint = queryString
      ? `${this.baseEndpoint}/users/${userId}/history?${queryString}`
      : `${this.baseEndpoint}/users/${userId}/history`;

    return this.get<PaginatedResponse<Notification>>(endpoint);
  }
}

export default NotificationService;
