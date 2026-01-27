/**
 * Church Service
 *
 * Handles all church-related API operations including church management,
 * member operations, and church discovery.
 */

import {
  BaseService,
  ValidationSchema,
  PaginationParams,
  PaginatedResponse,
} from "./BaseService";
import { ApiClient } from "../core/ApiClient";
import {
  Church,
  CreateChurchRequest,
  UpdateChurchRequest,
  ChurchFilters,
  SearchResult,
  ChurchStats,
  Member,
  JoinChurchRequest,
  MemberFilters,
  UpdateRequest,
} from "../types";

export class ChurchService extends BaseService {
  constructor(client: ApiClient) {
    super(client, "/church", "ChurchService");
  }

  // ==================== CHURCH MANAGEMENT ====================

  /**
   * Get all churches with optional filtering and pagination
   * Note: This usually maps to discovery or search in this backend
   */
  async getChurches(
    filters?: ChurchFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Church>> {
    const params = {
      ...this.buildPaginationParams(pagination),
      ...filters,
    };

    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value.toString();
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    ).toString();

    const endpoint = queryString
      ? this.buildEndpoint(`/onboarding/search?${queryString}`) // Fallback to search if general list doesn't exist
      : this.buildEndpoint("/onboarding/search");

    return this.post<PaginatedResponse<Church>>(endpoint, { filters }, { cacheTTL: 300000 });
  }

  /**
   * Get specific church by ID
   */
  async getChurch(churchId: string): Promise<Church> {
    const schema: ValidationSchema = {
      churchId: {
        type: "string",
        required: true,
        minLength: 1,
      },
    };

    this.validateRequest({ churchId }, schema);
    return this.get<Church>(this.buildIdEndpoint(churchId));
  }

  /**
   * Get available denominations
   */
  async getDenominations(): Promise<string[]> {
    return this.get<string[]>(this.buildEndpoint("/onboarding/denominations"), {
      cacheTTL: 3600000, // 1 hour cache
    });
  }

  /**
   * Get available ministry types
   */
  async getMinistryTypes(): Promise<string[]> {
    return this.get<string[]>(this.buildEndpoint("/onboarding/ministries"), {
      cacheTTL: 3600000, // 1 hour cache
    });
  }

  /**
   * Create new church
   */
  async createChurch(churchData: CreateChurchRequest): Promise<Church> {
    const schema: ValidationSchema = {
      name: {
        type: "string",
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      description: {
        type: "string",
        required: false,
        maxLength: 500,
      },
      address: {
        type: "object",
        required: true,
        validator: (value) => {
          const required = ["street", "city", "state", "zipCode", "country"];
          const missing = required.filter((field) => !value[field]);
          if (missing.length > 0) {
            return `Address is missing required fields: ${missing.join(", ")}`;
          }
          return true;
        },
      },
      contactInfo: {
        type: "object",
        required: true,
        validator: (value) => {
          if (!value.email) {
            return "Contact email is required";
          }
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(value.email)) {
            return "Valid contact email is required";
          }
          return true;
        },
      },
      denomination: {
        type: "string",
        required: false,
        maxLength: 50,
      },
      website: {
        type: "string",
        required: false,
        pattern: /^https?:\/\/.+/,
        validator: (value) => {
          if (value && !value.startsWith("http")) {
            return "Website must be a valid URL starting with http:// or https://";
          }
          return true;
        },
      },
    };

    const validatedData = this.validateRequest(churchData, schema);
    return this.post<Church>(this.buildEndpoint("/onboarding/create"), validatedData, {
      cache: false,
    });
  }

  /**
   * Update church information
   */
  async updateChurch(
    churchId: string,
    updates: UpdateChurchRequest,
  ): Promise<Church> {
    const schema: ValidationSchema = {
      name: {
        type: "string",
        required: false,
        minLength: 2,
        maxLength: 100,
      },
      description: {
        type: "string",
        required: false,
        maxLength: 500,
      },
      website: {
        type: "string",
        required: false,
        pattern: /^https?:\/\/.+/,
      },
    };

    this.validateRequest(
      { churchId },
      { churchId: { type: "string", required: true } },
    );
    const validatedData = this.validateRequest(updates, schema);

    return this.put<Church>(this.buildIdEndpoint(churchId), validatedData, {
      cache: false,
    });
  }

  /**
   * Delete church (admin only)
   */
  async deleteChurch(churchId: string): Promise<void> {
    this.validateRequest(
      { churchId },
      { churchId: { type: "string", required: true } },
    );

    await this.delete<void>(this.buildIdEndpoint(churchId), {
      cache: false,
      headers: { "X-Confirm-Delete": "true" },
    });
  }

  /**
   * Search churches by query
   */
  async searchChurches(
    query: string,
    filters?: ChurchFilters,
  ): Promise<SearchResult<Church>> {
    const schema: ValidationSchema = {
      query: {
        type: "string",
        required: true,
        minLength: 2,
        maxLength: 100,
      },
    };

    this.validateRequest({ query }, schema);

    const params = {
      q: query,
      ...filters,
    };

    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value.toString();
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    ).toString();

    return this.get<SearchResult<Church>>(
      this.buildEndpoint(`/search?${queryString}`),
      { cacheTTL: 180000 }, // 3 minutes cache for search results
    );
  }

  /**
   * Get church statistics
   */
  async getChurchStats(churchId: string): Promise<ChurchStats> {
    this.validateRequest(
      { churchId },
      { churchId: { type: "string", required: true } },
    );

    return this.get<ChurchStats>(
      this.buildIdEndpoint(churchId, "/stats"),
      { cacheTTL: 600000 }, // 10 minutes cache for stats
    );
  }

  // ==================== MEMBERSHIP MANAGEMENT ====================

  /**
   * Request to join a church
   */
  async requestJoinChurch(joinRequest: JoinChurchRequest): Promise<void> {
    const schema: ValidationSchema = {
      churchId: {
        type: "string",
        required: true,
        minLength: 1,
      },
      message: {
        type: "string",
        required: false,
        maxLength: 500,
      },
      membershipType: {
        type: "string",
        required: false,
        validator: (value) => {
          if (
            value &&
            !["full", "associate", "visitor", "child"].includes(value)
          ) {
            return "Invalid membership type";
          }
          return true;
        },
      },
    };

    const validatedData = this.validateRequest(joinRequest, schema);

    await this.post<void>(
      this.buildIdEndpoint(joinRequest.churchId, "/join"),
      validatedData,
      { cache: false },
    );
  }

  /**
   * Leave a church
   */
  async leaveChurch(churchId: string, reason?: string): Promise<void> {
    this.validateRequest(
      { churchId },
      { churchId: { type: "string", required: true } },
    );

    await this.delete<void>(this.buildIdEndpoint(churchId, "/leave"), {
      cache: false,
      headers: reason ? { "X-Leave-Reason": reason } : undefined,
    });
  }

  /**
   * Get church members
   */
  async getChurchMembers(
    churchId: string,
    filters?: MemberFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Member>> {
    this.validateRequest(
      { churchId },
      { churchId: { type: "string", required: true } },
    );

    const params = {
      ...this.buildPaginationParams(pagination),
      ...filters,
    };

    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value.toString();
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    ).toString();

    const endpoint = queryString
      ? this.buildIdEndpoint(churchId, `/members?${queryString}`)
      : this.buildIdEndpoint(churchId, "/members");

    return this.getList<Member>(endpoint, undefined, { cacheTTL: 180000 }); // 3 minutes cache
  }

  /**
   * Get specific church member
   */
  async getChurchMember(churchId: string, memberId: string): Promise<Member> {
    const schema: ValidationSchema = {
      churchId: { type: "string", required: true },
      memberId: { type: "string", required: true },
    };

    this.validateRequest({ churchId, memberId }, schema);

    return this.get<Member>(
      this.buildIdEndpoint(churchId, `/members/${memberId}`),
    );
  }

  /**
   * Update member information (admin/self only)
   */
  async updateChurchMember(
    churchId: string,
    memberId: string,
    updates: UpdateRequest<Member>,
  ): Promise<Member> {
    const schema: ValidationSchema = {
      churchId: { type: "string", required: true },
      memberId: { type: "string", required: true },
    };

    this.validateRequest({ churchId, memberId }, schema);

    // Validate updates
    const updateSchema: ValidationSchema = {
      role: {
        type: "string",
        required: false,
        validator: (value) => {
          const validRoles = [
            "admin",
            "pastor",
            "elder",
            "deacon",
            "leader",
            "member",
            "visitor",
          ];
          if (value && !validRoles.includes(value)) {
            return "Invalid member role";
          }
          return true;
        },
      },
      status: {
        type: "string",
        required: false,
        validator: (value) => {
          const validStatuses = ["active", "inactive", "pending", "suspended"];
          if (value && !validStatuses.includes(value)) {
            return "Invalid member status";
          }
          return true;
        },
      },
      membershipType: {
        type: "string",
        required: false,
        validator: (value) => {
          const validTypes = ["full", "associate", "visitor", "child"];
          if (value && !validTypes.includes(value)) {
            return "Invalid membership type";
          }
          return true;
        },
      },
      notes: {
        type: "string",
        required: false,
        maxLength: 1000,
      },
    };

    const validatedUpdates = this.validateRequest(updates, updateSchema);

    return this.put<Member>(
      this.buildIdEndpoint(churchId, `/members/${memberId}`),
      validatedUpdates,
      { cache: false },
    );
  }

  /**
   * Remove member from church (admin only)
   */
  async removeChurchMember(
    churchId: string,
    memberId: string,
    reason?: string,
  ): Promise<void> {
    const schema: ValidationSchema = {
      churchId: { type: "string", required: true },
      memberId: { type: "string", required: true },
    };

    this.validateRequest({ churchId, memberId }, schema);

    await this.delete<void>(
      this.buildIdEndpoint(churchId, `/members/${memberId}`),
      {
        cache: false,
        headers: reason ? { "X-Remove-Reason": reason } : undefined,
      },
    );
  }

  // ==================== FILE OPERATIONS ====================

  /**
   * Upload church logo
   */
  async uploadChurchLogo(churchId: string, file: File): Promise<Church> {
    this.validateRequest(
      { churchId },
      { churchId: { type: "string", required: true } },
    );

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw this.createValidationError(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
      );
    }

    if (file.size > maxSize) {
      throw this.createValidationError(
        "File size too large. Maximum size is 5MB.",
      );
    }

    return this.upload<Church>(this.buildIdEndpoint(churchId, "/logo"), file, {
      fieldName: "logo",
      cache: false,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        // Emit progress event
        if (typeof window !== "undefined") {
          typeof window !== "undefined" &&
            window.dispatchEvent(
              new CustomEvent("church-logo-upload-progress", {
                detail: { churchId, progress: percentCompleted },
              }),
            );
        }
      },
    });
  }

  /**
   * Upload church cover image
   */
  async uploadChurchCoverImage(churchId: string, file: File): Promise<Church> {
    this.validateRequest(
      { churchId },
      { churchId: { type: "string", required: true } },
    );

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB for cover images

    if (!allowedTypes.includes(file.type)) {
      throw this.createValidationError(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
      );
    }

    if (file.size > maxSize) {
      throw this.createValidationError(
        "File size too large. Maximum size is 10MB.",
      );
    }

    return this.upload<Church>(
      this.buildIdEndpoint(churchId, "/cover-image"),
      file,
      {
        fieldName: "coverImage",
        cache: false,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          // Emit progress event
          if (typeof window !== "undefined") {
            typeof window !== "undefined" &&
              window.dispatchEvent(
                new CustomEvent("church-cover-upload-progress", {
                  detail: { churchId, progress: percentCompleted },
                }),
              );
          }
        },
      },
    );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if user can join church
   */
  async canJoinChurch(
    churchId: string,
  ): Promise<{ canJoin: boolean; reason?: string }> {
    this.validateRequest(
      { churchId },
      { churchId: { type: "string", required: true } },
    );

    return this.get<{ canJoin: boolean; reason?: string }>(
      this.buildIdEndpoint(churchId, "/can-join"),
      { cacheTTL: 60000 }, // 1 minute cache
    );
  }

  /**
   * Get user's churches
   */
  async getUserChurches(): Promise<Church[]> {
    return this.get<Church[]>(
      this.buildEndpoint("/my-churches"),
      { cacheTTL: 300000 }, // 5 minutes cache
    );
  }

  /**
   * Get nearby churches
   */
  async getNearbyChurches(
    latitude: number,
    longitude: number,
    radius: number = 25,
  ): Promise<Church[]> {
    const schema: ValidationSchema = {
      latitude: {
        type: "number",
        required: true,
        validator: (value) =>
          (value >= -90 && value <= 90) || "Invalid latitude",
      },
      longitude: {
        type: "number",
        required: true,
        validator: (value) =>
          (value >= -180 && value <= 180) || "Invalid longitude",
      },
      radius: {
        type: "number",
        required: false,
        validator: (value) =>
          (value > 0 && value <= 100) ||
          "Radius must be between 1 and 100 miles",
      },
    };

    this.validateRequest({ latitude, longitude, radius }, schema);

    const params = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      radius: radius.toString(),
    });

    return this.get<Church[]>(
      this.buildEndpoint(`/nearby?${params}`),
      { cacheTTL: 600000 }, // 10 minutes cache for location-based results
    );
  }
}

export default ChurchService;
