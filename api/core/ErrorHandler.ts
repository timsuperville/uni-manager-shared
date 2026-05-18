/**
 * Centralized Error Handler
 *
 * Handles all API errors with consistent patterns, retry logic,
 * and user-friendly error messages across all applications.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse
} from 'axios';
import { reportApiError, isDev } from '../../utils';

/** Ambient type for optional window-level error tracker (e.g. Sentry, LogRocket). */
interface ErrorTracker {
  captureException(
    error: unknown,
    context?: { extra?: Record<string, unknown> }
  ): void;
}

declare global {
  interface Window {
    errorTracker?: ErrorTracker;
  }
}

export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN'
}

export interface ApiError extends Error {
  type: ApiErrorType;
  statusCode?: number;
  originalError?: Error;
  retryable: boolean;
  details?: unknown;
  timestamp: string;
  requestId?: string;
  resonanceId?: string;
  silent?: boolean;
}

export interface ErrorContext {
  [key: string]: unknown;
  endpoint?: string;
  method?: string;
  requestId?: string;
  userId?: string;
  attemptNumber?: number;
}

export class ErrorHandler {
  private maxRetryAttempts: number;
  private retryDelays: number[] = [1000, 2000, 4000]; // Exponential backoff

  constructor(maxRetryAttempts: number = 3) {
    this.maxRetryAttempts = maxRetryAttempts;
  }

  /**
   * Handle and potentially retry failed requests
   */
  async handleError(
    error: AxiosError,
    axiosInstance: AxiosInstance
  ): Promise<AxiosResponse> {
    const apiError = this.transformError(error);
    const config = error.config as AxiosRequestConfig & {
      _retryCount?: number;
      silent?: boolean;
    };

    // Check if error is retryable and within retry limits
    if (this.shouldRetry(apiError, config)) {
      return this.retryRequest(config, axiosInstance);
    }

    // Log error for monitoring
    if (!config.silent) {
      this.logError(apiError, error.config);
    }

    // Dispatch a global event so the UI can show a toast or banner
    if (
      typeof window !== 'undefined' &&
      apiError.type !== ApiErrorType.CANCELLED &&
      !config.silent
    ) {
      window.dispatchEvent(
        new CustomEvent('api:error', {
          detail: {
            message: this.getUserMessage(apiError),
            type: apiError.type,
            statusCode: apiError.statusCode
          }
        })
      );
    }

    throw apiError;
  }

  /**
   * Transform axios error to standardized ApiError
   */
  transformError(error: AxiosError): ApiError {
    const requestId = error.config?.headers?.['X-Request-ID'] as string;
    const isSilent = (error.config as AxiosRequestConfig & { silent?: boolean })
      ?.silent;

    if (axios.isCancel(error)) {
      return this.createApiError({
        type: ApiErrorType.CANCELLED,
        message: 'Request was cancelled',
        originalError: error,
        retryable: false,
        timestamp: new Date().toISOString(),
        requestId
      });
    }

    let apiError: ApiError;

    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as Record<string, unknown>;
      apiError = this.createApiError({
        type: this.mapStatusToErrorType(error.response.status),
        message: this.extractErrorMessage(responseData),
        statusCode: error.response.status,
        originalError: error,
        retryable: this.isRetryableStatus(error.response.status),
        details: responseData,
        timestamp: new Date().toISOString(),
        requestId,
        resonanceId:
          (responseData?.['resonanceId'] as string) ||
          (error.response.headers as Record<string, string>)?.[
            'x-correlation-id'
          ]
      });
    } else if (error.request) {
      // Request was made but no response received
      apiError = this.createApiError({
        type:
          error.code === 'ECONNABORTED'
            ? ApiErrorType.TIMEOUT
            : ApiErrorType.NETWORK_ERROR,
        message: this.getNetworkErrorMessage(error.code),
        originalError: error,
        retryable: true,
        timestamp: new Date().toISOString(),
        requestId
      });
    } else {
      // Something else happened
      apiError = this.createApiError({
        type: ApiErrorType.UNKNOWN,
        message: error.message || 'An unexpected error occurred',
        originalError: error,
        retryable: false,
        timestamp: new Date().toISOString(),
        requestId
      });
    }

    if (isSilent) {
      apiError.silent = true;
    }

    return apiError;
  }

  private createApiError(params: {
    type: ApiErrorType;
    message: string;
    statusCode?: number;
    originalError?: Error;
    retryable: boolean;
    details?: unknown;
    timestamp: string;
    requestId?: string;
    resonanceId?: string;
    silent?: boolean;
  }): ApiError {
    const error = new Error(params.message) as ApiError;
    error.name = 'ApiError';
    error.type = params.type;
    error.statusCode = params.statusCode;
    error.originalError = params.originalError;
    error.retryable = params.retryable;
    error.details = params.details;
    error.timestamp = params.timestamp;
    error.requestId = params.requestId;
    error.resonanceId = params.resonanceId;
    error.silent = params.silent;

    return error;
  }

  private mapStatusToErrorType(status: number): ApiErrorType {
    switch (true) {
      case status === 401:
        return ApiErrorType.AUTHENTICATION_ERROR;
      case status === 403:
        return ApiErrorType.AUTHORIZATION_ERROR;
      case status === 404:
        return ApiErrorType.NOT_FOUND;
      case status === 422:
        return ApiErrorType.VALIDATION_ERROR;
      case status === 429:
        return ApiErrorType.RATE_LIMIT;
      case status >= 400 && status < 500:
        return ApiErrorType.VALIDATION_ERROR;
      case status >= 500:
        return ApiErrorType.SERVER_ERROR;
      default:
        return ApiErrorType.UNKNOWN;
    }
  }

  private extractErrorMessage(responseData: unknown): string {
    if (typeof responseData === 'string') {
      const trimmed = responseData.trim();
      if (
        trimmed.toLowerCase().startsWith('<!doctype html') ||
        trimmed.toLowerCase().includes('<html')
      ) {
        return 'Received an unexpected HTML response. The server endpoint may be missing or misconfigured.';
      }
      return responseData;
    }

    if (responseData && typeof responseData === 'object') {
      const data = responseData as Record<string, unknown>;
      // Try common error message fields
      const possibleFields = ['message', 'error', 'detail', 'description'];

      for (const field of possibleFields) {
        if (data[field] && typeof data[field] === 'string') {
          return data[field] as string;
        }
      }

      // If it's a validation error with field-specific messages
      if (data['errors'] && typeof data['errors'] === 'object') {
        const errorMessages = Object.values(
          data['errors'] as Record<string, unknown>
        )
          .flat()
          .filter(msg => typeof msg === 'string');

        if (errorMessages.length > 0) {
          return errorMessages.join('; ');
        }
      }
    }

    return 'An error occurred while processing your request';
  }

  private getNetworkErrorMessage(errorCode?: string): string {
    switch (errorCode) {
      case 'ECONNABORTED':
        return 'Request timed out. Please check your connection and try again.';
      case 'ENOTFOUND':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'ECONNREFUSED':
        return 'Connection refused. The server may be temporarily unavailable.';
      case 'NETWORK_ERROR':
        return 'A network error occurred. Please check your connection and try again.';
      default:
        return 'Unable to connect to the server. Please try again.';
    }
  }

  private isRetryableStatus(status: number): boolean {
    // Retry on server errors and rate limiting
    return status >= 500 || status === 429 || status === 408;
  }

  private shouldRetry(
    error: ApiError,
    config?: AxiosRequestConfig & { _retryCount?: number }
  ): boolean {
    if (!error.retryable || !config) {
      return false;
    }

    const retryCount = config._retryCount || 0;
    return retryCount < this.maxRetryAttempts;
  }

  private async retryRequest(
    config: AxiosRequestConfig & { _retryCount?: number },
    axiosInstance: AxiosInstance
  ): Promise<AxiosResponse> {
    const retryCount = (config._retryCount || 0) + 1;
    const delay =
      this.retryDelays[Math.min(retryCount - 1, this.retryDelays.length - 1)];

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    // Update retry count
    config._retryCount = retryCount;

    // Add retry headers
    config.headers = {
      ...config.headers,
      'X-Retry-Attempt': retryCount.toString(),
      'X-Retry-Timestamp': new Date().toISOString()
    };

    return axiosInstance.request(config);
  }

  private logError(
    error: ApiError,
    config?: AxiosRequestConfig & { _retryCount?: number }
  ): void {
    if (error.type === ApiErrorType.CANCELLED) {
      return; // Do not log intentional cancellations
    }

    const context: ErrorContext = {
      endpoint: config?.url,
      method: config?.method?.toUpperCase(),
      requestId: error.requestId,
      attemptNumber: config?._retryCount ?? 1
    };

    // Temporarily dump all API error structures directly to console.error
    // regardless of the DEV check so the custom UI overlay captures it.
    console.error('[API Error Intercepted]', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      context,
      timestamp: error.timestamp
    });

    if (isDev()) {
      console.error('[API Error DEV]', {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        context,
        timestamp: error.timestamp,
        stack: error.stack
      });
    }

    // ── Proactive telemetry: report to ErrorLog so Admin can see failures
    // without waiting for user-submitted feedback. Fire-and-forget.
    reportApiError({
      statusCode: error.statusCode ?? 0,
      message: error.message,
      endpoint: config?.url,
      method: config?.method?.toUpperCase(),
      service: 'ApiClient',
      context: {
        errorType: error.type as string,
        requestId: error.requestId,
        retryCount: config?._retryCount ?? 0
      }
    });

    // Forward to window-level tracker if configured (e.g. Sentry, LogRocket)
    if (typeof window !== 'undefined' && window.errorTracker) {
      window.errorTracker.captureException(error, { extra: context });
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: ApiError): string {
    switch (error.type) {
      case ApiErrorType.NETWORK_ERROR:
        return 'Unable to connect. Please check your internet connection and try again.';

      case ApiErrorType.AUTHENTICATION_ERROR:
        return 'Your session has expired. Please sign in again.';

      case ApiErrorType.AUTHORIZATION_ERROR:
        return "You don't have permission to perform this action.";

      case ApiErrorType.NOT_FOUND:
        return 'The requested resource was not found.';

      case ApiErrorType.VALIDATION_ERROR:
        return error.message || 'Please check your input and try again.';

      case ApiErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.';

      case ApiErrorType.SERVER_ERROR:
        return 'A server error occurred. Please try again later.';

      case ApiErrorType.TIMEOUT:
        return 'The request timed out. Please try again.';

      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error should trigger logout
   */
  shouldLogout(error: ApiError): boolean {
    return (
      error.type === ApiErrorType.AUTHENTICATION_ERROR &&
      error.statusCode === 401
    );
  }

  /**
   * Check if error should show retry option
   */
  canRetry(error: ApiError): boolean {
    return (
      error.retryable &&
      ![
        ApiErrorType.AUTHENTICATION_ERROR,
        ApiErrorType.AUTHORIZATION_ERROR,
        ApiErrorType.VALIDATION_ERROR
      ].includes(error.type)
    );
  }
}

export default ErrorHandler;
