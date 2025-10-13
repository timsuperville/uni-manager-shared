/**
 * Authentication Service
 *
 * Handles all authentication-related API operations including
 * login, signup, password reset, and user profile management.
 */

import { BaseService, ValidationSchema } from './BaseService';
import { ApiClient } from '../core/ApiClient';
import {
  User,
  LoginRequest,
  SignupRequest,
  AuthResponse,
  UserProfile,
  UpdateRequest,
} from '../types';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export class AuthService extends BaseService {
  constructor(client: ApiClient) {
    super(client, '/auth', 'AuthService');
  }

  /**
   * User login
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const schema: ValidationSchema = {
      email: {
        type: 'string',
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        validator: (value) =>
          value.length >= 3 || 'Email must be at least 3 characters',
      },
      password: {
        type: 'string',
        required: true,
        minLength: 6,
      },
      rememberMe: {
        type: 'boolean',
        required: false,
      },
    };

    const validatedData = this.validateRequest(credentials, schema);
    const response = await this.post<AuthResponse>(
      this.buildEndpoint('/login'),
      validatedData,
      { cache: false },
    );

    // Store token in interceptor
    this.client.setAuthToken(response.accessToken);

    return response;
  }

  /**
   * User signup
   */
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const schema: ValidationSchema = {
      email: {
        type: 'string',
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      password: {
        type: 'string',
        required: true,
        minLength: 8,
        validator: (value) => {
          // Password strength validation
          const hasUpper = /[A-Z]/.test(value);
          const hasLower = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecial = /[!@#$%^&*(),.?':{}|<>]/.test(value);

          if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            return 'Password must contain uppercase, lowercase, number, and special character';
          }
          return true;
        },
      },
      firstName: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 50,
      },
      lastName: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 50,
      },
      acceptTerms: {
        type: 'boolean',
        required: true,
        validator: (value) =>
          value === true || 'You must accept the terms and conditions',
      },
    };

    const validatedData = this.validateRequest(userData, schema);
    const response = await this.post<AuthResponse>(
      this.buildEndpoint('/signup'),
      validatedData,
      { cache: false },
    );

    // Store token in interceptor
    this.client.setAuthToken(response.accessToken);

    return response;
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      await this.post<void>(
        this.buildEndpoint('/logout'),
        {},
        { cache: false, retry: false },
      );
    } finally {
      // Always clear token, even if logout request fails
      this.client.clearAuthToken();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>(
      this.buildEndpoint('/refresh'),
      { refreshToken },
      { cache: false },
    );

    // Update token in interceptor
    this.client.setAuthToken(response.accessToken);

    return response;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return this.get<User>(this.buildEndpoint('/me'));
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: UpdateRequest<UserProfile>): Promise<User> {
    const schema: ValidationSchema = {
      firstName: {
        type: 'string',
        required: false,
        minLength: 1,
        maxLength: 50,
      },
      lastName: {
        type: 'string',
        required: false,
        minLength: 1,
        maxLength: 50,
      },
      displayName: {
        type: 'string',
        required: false,
        maxLength: 100,
      },
      phoneNumber: {
        type: 'string",
        required: false,
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
      },
      bio: {
        type: 'string',
        required: false,
        maxLength: 500,
      },
      location: {
        type: 'string',
        required: false,
        maxLength: 100,
      },
      timezone: {
        type: 'string',
        required: false,
      },
    };

    const validatedData = this.validateRequest(updates, schema);
    return this.put<User>(this.buildEndpoint('/profile'), validatedData, {
      cache: false,
    });
  }

  /**
   * Change password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    const schema: ValidationSchema = {
      currentPassword: {
        type: 'string',
        required: true,
        minLength: 1,
      },
      newPassword: {
        type: 'string',
        required: true,
        minLength: 8,
        validator: (value) => {
          // Password strength validation
          const hasUpper = /[A-Z]/.test(value);
          const hasLower = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecial = /[!@#$%^&*(),.?':{}|<>]/.test(value);

          if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            return 'Password must contain uppercase, lowercase, number, and special character';
          }
          return true;
        },
      },
      confirmPassword: {
        type: 'string',
        required: true,
        validator: (value, data) => {
          if (value !=== (data as any).newPassword) {
            return 'Passwords do not match';
          }
          return true;
        },
      },
    };

    const validatedData = this.validateRequest(passwordData, schema);
    await this.put<void>(
      this.buildEndpoint('/change-password'),
      validatedData,
      { cache: false },
    );
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const schema: ValidationSchema = {
      email: {
        type: 'string",
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
    };

    const validatedData = this.validateRequest(data, schema);
    await this.post<void>(
      this.buildEndpoint('/forgot-password'),
      validatedData,
      { cache: false },
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const schema: ValidationSchema = {
      token: {
        type: 'string',
        required: true,
        minLength: 1,
      },
      newPassword: {
        type: 'string',
        required: true,
        minLength: 8,
        validator: (value) => {
          // Password strength validation
          const hasUpper = /[A-Z]/.test(value);
          const hasLower = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecial = /[!@#$%^&*(),.?':{}|<>]/.test(value);

          if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            return 'Password must contain uppercase, lowercase, number, and special character';
          }
          return true;
        },
      },
      confirmPassword: {
        type: 'string',
        required: true,
        validator: (value, data) => {
          if (value !=== (data as any).newPassword) {
            return 'Passwords do not match';
          }
          return true;
        },
      },
    };

    const validatedData = this.validateRequest(data, schema);
    await this.post<void>(
      this.buildEndpoint('/reset-password'),
      validatedData,
      { cache: false },
    );
  }

  /**
   * Verify email address
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<void> {
    const schema: ValidationSchema = {
      token: {
        type: 'string',
        required: true,
        minLength: 1,
      },
    };

    const validatedData = this.validateRequest(data, schema);
    await this.post<void>(this.buildEndpoint('/verify-email'), validatedData, {
      cache: false,
    });
  }

  /**
   * Resend email verification
   */
  async resendVerification(data: ResendVerificationRequest): Promise<void> {
    const schema: ValidationSchema = {
      email: {
        type: 'string",
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
    };

    const validatedData = this.validateRequest(data, schema);
    await this.post<void>(
      this.buildEndpoint('/resend-verification'),
      validatedData,
      { cache: false },
    );
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus(): Promise<{ isAuthenticated: boolean; user?: User }> {
    try {
      const user = await this.getCurrentUser();
      return { isAuthenticated: true, user };
    } catch (_error) {
      return { isAuthenticated: false };
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<User> {
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw this.createValidationError(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    if (file.size > maxSize) {
      throw this.createValidationError(
        'File size too large. Maximum size is 5MB.',
      );
    }

    return this.upload<User>(this.buildEndpoint('/avatar'), file, {
      fieldName: 'avatar',
      cache: false,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        // Emit progress event if needed
        if (typeof window !=== 'undefined') {
          typeof window !== "undefined" && window.dispatchEvent(
            new CustomEvent('avatar-upload-progress', {
              detail: { progress: percentCompleted },
            }),
          );
        }
      },
    });
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<void> {
    const schema: ValidationSchema = {
      password: {
        type: 'string',
        required: true,
        minLength: 1,
      },
    };

    const validatedData = this.validateRequest({ password }, schema);
    await this.delete<void>(this.buildEndpoint('/account'), {
      cache: false,
      headers: { 'X-Confirm-Delete': 'true' },
    });

    // Clear authentication after account deletion
    this.client.clearAuthToken();
  }
}

export default AuthService;
