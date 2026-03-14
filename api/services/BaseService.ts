/**
 * Base Service Class
 *
 * Abstract base class for all API services providing common functionality,
 * standardized error handling, and consistent patterns.
 */

import { ApiClient, ApiResponse, RequestOptions } from "../core/ApiClient";
import { ApiError, ApiErrorType } from "../core/ErrorHandler";
import { reportApiError } from "@shared/utils";

export interface ValidationSchema {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object" | "array";
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    validator?: (value: any, data?: any) => boolean | string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export abstract class BaseService {
  protected client: ApiClient;
  protected baseEndpoint: string;
  protected serviceName: string;

  constructor(client: ApiClient, baseEndpoint: string, serviceName: string) {
    this.client = client;
    // Preserve empty string as-is (services that own their own full paths).
    // Non-empty strings without a leading slash get one prepended.
    this.baseEndpoint =
      baseEndpoint === ""
        ? ""
        : baseEndpoint.startsWith("/")
          ? baseEndpoint
          : `/${baseEndpoint}`;
    this.serviceName = serviceName;
  }

  /**
   * Build full endpoint URL.
   *
   * Guards against producing a protocol-relative double-slash (`//path`)
   * which Axios would interpret as `http://<path-segment-as-host>/...`.
   */
  protected buildEndpoint(path: string = ""): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const combined = `${this.baseEndpoint}${cleanPath}`;
    // Collapse any accidental leading `//` into a single `/`
    return combined.startsWith("//") ? combined.slice(1) : combined;
  }

  /**
   * Build endpoint with ID parameter
   */
  protected buildIdEndpoint(id: string, path: string = ""): string {
    const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
    return `${this.baseEndpoint}/${id}${cleanPath}`;
  }

  /**
   * Validate request data against schema
   */
  protected validateRequest<T>(data: T, schema: ValidationSchema): T {
    if (!data || typeof data !== "object") {
      throw this.createValidationError("Request data must be an object");
    }

    const errors: string[] = [];
    const validatedData = { ...data };

    for (const [field, rules] of Object.entries(schema)) {
      const value = (data as Record<string, unknown>)[field];

      // Check required fields
      if (
        rules.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip validation for optional fields that are undefined
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (!this.validateType(value, rules.type)) {
        errors.push(`${field} must be of type ${rules.type}`);
        continue;
      }

      // String validations
      if (rules.type === "string" && typeof value === "string") {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(
            `${field} must be at least ${rules.minLength} characters long`,
          );
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(
            `${field} must be no more than ${rules.maxLength} characters long`,
          );
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }

      // Custom validator
      if (rules.validator) {
        const result = rules.validator(value, data);
        if (result !== true) {
          errors.push(
            typeof result === "string" ? result : `${field} is invalid`,
          );
        }
      }
    }

    if (errors.length > 0) {
      throw this.createValidationError(errors.join("; "));
    }

    return validatedData;
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      case "array":
        return Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Transform response data (override in subclasses)
   */
  protected transformResponse<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  /**
   * Transform list response with pagination
   */
  protected transformListResponse<T>(
    response: ApiResponse<any>,
  ): PaginatedResponse<T> {
    const { data, pagination } = response.data;

    return {
      data: data || [],
      pagination: {
        page: pagination?.page || 1,
        limit: pagination?.limit || 10,
        total: pagination?.total || 0,
        totalPages: pagination?.totalPages || 0,
        hasNextPage: pagination?.hasNextPage || false,
        hasPrevPage: pagination?.hasPrevPage || false,
      },
    };
  }

  /**
   * Handle service-specific errors
   */
  protected handleError(error: ApiError, context?: string): never {
    // Add service context to error
    error.message = `[${this.serviceName}${context ? `:${context}` : ""}] ${error.message}`;

    // Log service-specific error
    this.logError(error, context);

    throw error;
  }

  /**
   * Create validation error
   */
  protected createValidationError(message: string): ApiError {
    const error = new Error(message) as ApiError;
    error.name = "ValidationError";
    error.type = ApiErrorType.VALIDATION_ERROR;
    error.retryable = false;
    error.timestamp = new Date().toISOString();

    return error;
  }

  /**
   * Log service errors with proactive backend telemetry.
   * Always reports to ErrorLog in production; console.error is dev-only.
   */
  protected logError(error: ApiError, context?: string): void {
    if (import.meta.env.DEV) {
      console.error(`[${this.serviceName}${context ? `:${context}` : ""}]`, {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        service: this.serviceName,
        context,
      });
    }

    // Proactive telemetry — surfaces in Admin Error Resonance dashboard.
    // ErrorHandler.logError covers the axios-interceptor path (has endpoint/method).
    // This covers service-level errors that bypass the interceptor.
    reportApiError({
      statusCode: error.statusCode ?? 0,
      message: error.message,
      service: this.serviceName,
      context: {
        operation: context,
        errorType: error.type,
        timestamp: error.timestamp,
      },
    });
  }

  /**
   * Build query parameters from pagination params
   */
  protected buildPaginationParams(
    params: PaginationParams = {},
  ): Record<string, string> {
    const queryParams: Record<string, string> = {};

    if (params.page) queryParams.page = params.page.toString();
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    return queryParams;
  }

  /**
   * Merge request options with defaults
   */
  protected mergeOptions(options?: RequestOptions): RequestOptions {
    return {
      cache: true,
      retry: true,
      ...options,
    };
  }

  /**
   * Generic GET request
   */
  protected async get<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.get<T>(
        this.buildEndpoint(endpoint),
        this.mergeOptions(options),
      );
      return this.transformResponse(response);
    } catch (error) {
      this.handleError(error as ApiError, "GET");
    }
  }

  /**
   * Generic POST request
   */
  protected async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.post<T>(
        this.buildEndpoint(endpoint),
        data,
        this.mergeOptions(options),
      );
      return this.transformResponse(response);
    } catch (error) {
      this.handleError(error as ApiError, "POST");
    }
  }

  /**
   * Generic PUT request
   */
  protected async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.put<T>(
        this.buildEndpoint(endpoint),
        data,
        this.mergeOptions(options),
      );
      return this.transformResponse(response);
    } catch (error) {
      this.handleError(error as ApiError, "PUT");
    }
  }

  /**
   * Generic PATCH request
   */
  protected async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.patch<T>(
        this.buildEndpoint(endpoint),
        data,
        this.mergeOptions(options),
      );
      return this.transformResponse(response);
    } catch (error) {
      this.handleError(error as ApiError, "PATCH");
    }
  }

  /**
   * Generic DELETE request
   */
  protected async delete<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.delete<T>(
        this.buildEndpoint(endpoint),
        this.mergeOptions(options),
      );
      return this.transformResponse(response);
    } catch (error) {
      this.handleError(error as ApiError, "DELETE");
    }
  }

  /**
   * Generic list request with pagination
   */
  protected async getList<T>(
    endpoint: string,
    params?: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<T>> {
    try {
      const queryParams = this.buildPaginationParams(params);
      const base = this.buildEndpoint(endpoint);
      const url =
        Object.keys(queryParams).length > 0
          ? `${base}?${new URLSearchParams(queryParams).toString()}`
          : base;

      const response = await this.client.get(url, this.mergeOptions(options));
      return this.transformListResponse<T>(response);
    } catch (error) {
      this.handleError(error as ApiError, "LIST");
    }
  }

  /**
   * Upload file
   */
  protected async upload<T>(
    endpoint: string,
    file: File | FormData,
    options?: RequestOptions & { fieldName?: string },
  ): Promise<T> {
    try {
      const response = await this.client.upload<T>(
        this.buildEndpoint(endpoint),
        file,
        this.mergeOptions(options),
      );
      return this.transformResponse(response);
    } catch (error) {
      this.handleError(error as ApiError, "UPLOAD");
    }
  }

  /**
   * Download file
   */
  protected async download(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<Blob> {
    try {
      return await this.client.download(
        this.buildEndpoint(endpoint),
        this.mergeOptions(options),
      );
    } catch (error) {
      this.handleError(error as ApiError, "DOWNLOAD");
    }
  }
}

export default BaseService;
