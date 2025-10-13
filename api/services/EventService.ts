/**
 * Event Service
 *
 * Handles event management operations including creating, updating,
 * deleting events, managing attendees, and event discovery.
 *
 * @extends BaseService
 */

import {
  BaseService,
  ValidationSchema,
  PaginationParams,
  PaginatedResponse,
} from './BaseService';
import type { ApiClient } from '../core/ApiClient';
import type {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilters,
  EventRegistration,
  CreateEventRegistrationRequest,
  UpdateEventRegistrationRequest,
  EventCategory,
  EventStatus,
} from '../types';

export class EventService extends BaseService {
  constructor(client: ApiClient) {
    super(client, '/events', 'EventService');
  }

  // ==================== EVENT MANAGEMENT ====================

  /**
   * Get events with filtering and pagination
   */
  async getEvents(
    filters?: EventFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Event>> {
    const schema: ValidationSchema = {
      'filters.category': {
        type: 'string',
        required: false,
        validator: (value) => {
          const validCategories: EventCategory[] = [
            'worship',
            'social',
            'education',
            'outreach',
            'youth',
            'children',
            'seniors',
            'other',
          ];
          if (value && !validCategories.includes(value)) {
            return `Invalid category. Must be one of: ${validCategories.join(', ')}`;
          }
          return true;
        },
      },
      'filters.status': {
        type: 'string',
        required: false,
        validator: (value) => {
          const validStatuses: EventStatus[] = [
            'draft',
            'published',
            'ongoing',
            'completed',
            'cancelled',
          ];
          if (value && !validStatuses.includes(value)) {
            return `Invalid status. Must be one of: ${validStatuses.join(', ')}`;
          }
          return true;
        },
      },
      'filters.churchId': {
        type: 'string',
        required: false,
        minLength: 1,
      },
      'filters.startDate': {
        type: 'string',
        required: false,
        validator: (value) => {
          if (value && isNaN(Date.parse(value))) {
            return 'Invalid start date format';
          }
          return true;
        },
      },
      'filters.endDate': {
        type: 'string',
        required: false,
        validator: (value) => {
          if (value && isNaN(Date.parse(value))) {
            return 'Invalid end date format';
          }
          return true;
        },
      },
    };

    this.validateRequest({ filters }, schema);

    const queryParamsObj = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !=== undefined && value !=== null) {
          queryParamsObj.append(key, String(value));
        }
      });
    }

    const paginationParams = this.buildPaginationParams(pagination);
    const allParams = { ...paginationParams };

    // Add filter params to pagination params
    queryParamsObj.forEach((value, key) => {
      allParams[key] = value;
    });

    const queryString = new URLSearchParams(allParams).toString();
    const endpoint = queryString
      ? this.buildEndpoint(`?${queryString}`)
      : this.buildEndpoint();

    return this.getList<Event>(endpoint, undefined, { cacheTTL: 180000 }); // 3 minutes cache
  }

  /**
   * Get specific event by ID
   */
  async getEvent(eventId: string): Promise<Event> {
    const schema: ValidationSchema = {
      eventId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
    };

    this.validateRequest({ eventId }, schema);
    return this.get<Event>(this.buildIdEndpoint(eventId));
  }

  /**
   * Create new event
   */
  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    const schema: ValidationSchema = {
      title: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 200,
      },
      description: {
        type: 'string',
        required: false,
        maxLength: 2000,
      },
      churchId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
      startDate: {
        type: 'string',
        required: true,
        validator: (value) => {
          if (isNaN(Date.parse(value))) {
            return 'Invalid start date format';
          }
          const startDate = new Date(value);
          const now = new Date();
          if (startDate < now) {
            return 'Start date must be in the future';
          }
          return true;
        },
      },
      endDate: {
        type: 'string',
        required: false,
        validator: (value, data) => {
          if (!value) return true;
          if (isNaN(Date.parse(value))) {
            return 'Invalid end date format';
          }
          const endDate = new Date(value);
          const startDate = new Date(data.startDate);
          if (endDate <= startDate) {
            return 'End date must be after start date';
          }
          return true;
        },
      },
      location: {
        type: 'string',
        required: false,
        maxLength: 500,
      },
      category: {
        type: 'string',
        required: true,
        validator: (value) => {
          const validCategories: EventCategory[] = [
            'worship',
            'social',
            'education',
            'outreach',
            'youth',
            'children',
            'seniors',
            'other',
          ];
          if (!validCategories.includes(value)) {
            return `Invalid category. Must be one of: ${validCategories.join(', ')}`;
          }
          return true;
        },
      },
      maxAttendees: {
        type: 'number',
        required: false,
        validator: (value) => {
          if (value !=== undefined && (value < 1 || value > 10000)) {
            return 'Max attendees must be between 1 and 10000';
          }
          return true;
        },
      },
      isPublic: {
        type: 'boolean',
        required: false,
      },
      requiresRegistration: {
        type: 'boolean',
        required: false,
      },
      cost: {
        type: 'number',
        required: false,
        validator: (value) => {
          if (value !=== undefined && value < 0) {
            return 'Cost cannot be negative';
          }
          return true;
        },
      },
      organizer: {
        type: 'string',
        required: true,
        minLength: 1,
      },
    };

    this.validateRequest(eventData, schema);
    return this.post<Event>(this.buildEndpoint(), eventData);
  }

  /**
   * Update existing event
   */
  async updateEvent(
    eventId: string,
    updates: UpdateEventRequest,
  ): Promise<Event> {
    const schema: ValidationSchema = {
      eventId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
      'updates.title': {
        type: 'string',
        required: false,
        minLength: 2,
        maxLength: 200,
      },
      'updates.description': {
        type: 'string',
        required: false,
        maxLength: 2000,
      },
      'updates.startDate': {
        type: 'string',
        required: false,
        validator: (value) => {
          if (value && isNaN(Date.parse(value))) {
            return 'Invalid start date format';
          }
          return true;
        },
      },
      'updates.endDate': {
        type: 'string',
        required: false,
        validator: (value, data) => {
          if (!value) return true;
          if (isNaN(Date.parse(value))) {
            return 'Invalid end date format';
          }
          if (data.updates?.startDate) {
            const endDate = new Date(value);
            const startDate = new Date(data.updates.startDate);
            if (endDate <= startDate) {
              return 'End date must be after start date';
            }
          }
          return true;
        },
      },
      'updates.category': {
        type: 'string',
        required: false,
        validator: (value) => {
          if (!value) return true;
          const validCategories: EventCategory[] = [
            'worship',
            'social',
            'education',
            'outreach',
            'youth',
            'children',
            'seniors',
            'other',
          ];
          if (!validCategories.includes(value)) {
            return `Invalid category. Must be one of: ${validCategories.join(', ')}`;
          }
          return true;
        },
      },
      'updates.status': {
        type: 'string',
        required: false,
        validator: (value) => {
          if (!value) return true;
          const validStatuses: EventStatus[] = [
            'draft',
            'published',
            'ongoing',
            'completed',
            'cancelled',
          ];
          if (!validStatuses.includes(value)) {
            return `Invalid status. Must be one of: ${validStatuses.join(', ')}`;
          }
          return true;
        },
      },
    };

    this.validateRequest({ eventId, updates }, schema);
    return this.put<Event>(this.buildIdEndpoint(eventId), updates);
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const schema: ValidationSchema = {
      eventId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
    };

    this.validateRequest({ eventId }, schema);
    await this.delete(this.buildIdEndpoint(eventId));
  }

  // ==================== EVENT DISCOVERY ====================

  /**
   * Search events by query and filters
   */
  async searchEvents(
    query: string,
    filters?: Omit<EventFilters, 'search'>,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Event>> {
    const schema: ValidationSchema = {
      query: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 200,
      },
    };

    this.validateRequest({ query }, schema);

    const allParams = new URLSearchParams();
    allParams.append('search', query);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !=== undefined && value !=== null) {
          allParams.append(key, String(value));
        }
      });
    }

    const paginationParams = this.buildPaginationParams(pagination);
    Object.entries(paginationParams).forEach(([key, value]) => {
      allParams.append(key, value);
    });

    const queryString = allParams.toString();
    const endpoint = this.buildEndpoint(`/search?${queryString}`);

    return this.getList<Event>(endpoint, undefined, { cacheTTL: 60000 }); // 1 minute cache
  }

  /**
   * Get public events (events marked as public)
   */
  async getPublicEvents(
    filters?: Omit<EventFilters, 'isPublic'>,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Event>> {
    return this.getEvents({ ...filters, isPublic: true }, pagination);
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(
    churchId?: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Event>> {
    const filters: EventFilters = {
      startDate: new Date().toISOString(),
      status: 'published',
    };

    if (churchId) {
      filters.churchId = churchId;
    }

    return this.getEvents(filters, pagination);
  }

  // ==================== EVENT REGISTRATION ====================

  /**
   * Get event registrations
   */
  async getEventRegistrations(
    eventId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<EventRegistration>> {
    const schema: ValidationSchema = {
      eventId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
    };

    this.validateRequest({ eventId }, schema);

    const paginationParams = this.buildPaginationParams(pagination);
    const queryString =
      Object.keys(paginationParams).length > 0
        ? new URLSearchParams(paginationParams).toString()
        : '';

    const endpoint = queryString
      ? this.buildIdEndpoint(eventId, `/registrations?${queryString}`)
      : this.buildIdEndpoint(eventId, '/registrations');

    return this.getList<EventRegistration>(endpoint, undefined, {
      cacheTTL: 60000,
    }); // 1 minute cache
  }

  /**
   * Register for event
   */
  async registerForEvent(
    eventId: string,
    registrationData: CreateEventRegistrationRequest,
  ): Promise<EventRegistration> {
    const schema: ValidationSchema = {
      eventId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
      'registrationData.userId': {
        type: 'string',
        required: true,
        minLength: 1,
      },
      'registrationData.attendeeCount': {
        type: 'number',
        required: false,
        validator: (value) => {
          if (value !=== undefined && (value < 1 || value > 20)) {
            return 'Attendee count must be between 1 and 20';
          }
          return true;
        },
      },
      'registrationData.notes': {
        type: 'string',
        required: false,
        maxLength: 500,
      },
    };

    this.validateRequest({ eventId, registrationData }, schema);
    return this.post<EventRegistration>(
      this.buildIdEndpoint(eventId, '/registrations'),
      registrationData,
    );
  }

  /**
   * Update event registration
   */
  async updateEventRegistration(
    eventId: string,
    registrationId: string,
    updates: UpdateEventRegistrationRequest,
  ): Promise<EventRegistration> {
    const schema: ValidationSchema = {
      eventId: { type: 'string', required: true },
      registrationId: { type: 'string', required: true },
      'updates.attendeeCount': {
        type: 'number',
        required: false,
        validator: (value) => {
          if (value !=== undefined && (value < 1 || value > 20)) {
            return 'Attendee count must be between 1 and 20';
          }
          return true;
        },
      },
    };

    this.validateRequest({ eventId, registrationId, updates }, schema);
    return this.put<EventRegistration>(
      this.buildIdEndpoint(eventId, `/registrations/${registrationId}`),
      updates,
    );
  }

  /**
   * Cancel event registration
   */
  async cancelEventRegistration(
    eventId: string,
    registrationId: string,
  ): Promise<void> {
    const schema: ValidationSchema = {
      eventId: { type: 'string', required: true },
      registrationId: { type: 'string', required: true },
    };

    this.validateRequest({ eventId, registrationId }, schema);
    await this.delete(
      this.buildIdEndpoint(eventId, `/registrations/${registrationId}`),
    );
  }

  // ==================== EVENT ANALYTICS ====================

  /**
   * Get event statistics
   */
  async getEventStats(eventId: string): Promise<any> {
    const schema: ValidationSchema = {
      eventId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
    };

    this.validateRequest({ eventId }, schema);
    return this.get<any>(
      this.buildIdEndpoint(eventId, '/stats'),
      { cacheTTL: 300000 }, // 5 minutes cache
    );
  }

  /**
   * Get church event analytics
   */
  async getChurchEventAnalytics(
    churchId: string,
    timeRange?: { startDate: string; endDate: string },
  ): Promise<any> {
    const schema: ValidationSchema = {
      churchId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
    };

    this.validateRequest({ churchId }, schema);

    const queryParams = new URLSearchParams();
    if (timeRange) {
      queryParams.append('startDate', timeRange.startDate);
      queryParams.append('endDate', timeRange.endDate);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? this.buildEndpoint(`/analytics/church/${churchId}?${queryString}`)
      : this.buildEndpoint(`/analytics/church/${churchId}`);

    return this.get<any>(endpoint, { cacheTTL: 600000 }); // 10 minutes cache
  }

  // ==================== FILE UPLOADS ====================

  /**
   * Upload event image
   */
  async uploadEventImage(
    eventId: string,
    imageFile: File,
  ): Promise<{ imageUrl: string }> {
    const schema: ValidationSchema = {
      eventId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
    };

    this.validateRequest({ eventId }, schema);

    const formData = new FormData();
    formData.append('image', imageFile);

    return this.upload<{ imageUrl: string }>(
      this.buildIdEndpoint(eventId, '/image'),
      formData,
      {
        onUploadProgress: (progress: ProgressEvent) => {
          // Emit progress event for file upload tracking
          typeof window !== "undefined" && window.dispatchEvent(
            new CustomEvent('event-image-upload-progress', {
              detail: { progress, eventId },
            }),
          );
        },
      },
    );
  }
}

export default EventService;
