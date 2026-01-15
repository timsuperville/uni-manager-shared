/**
 * TypeScript interfaces for Universal Login Form
 */

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export type AppType =
  | "admin"
  | "church"
  | "business"
  | "home"
  | "personal"
  | "playback"
  | "default";

export type LoginTheme = "default" | "dark" | "minimal";

export interface AppConfig {
  title: string;
  description: string;
  icon: string;
  primaryColor: string;
  defaultRedirect: string;
}

export interface LoginFormProps {
  appType?: AppType;
  appTitle?: string;
  appDescription?: string;
  onSuccess?: (result: LoginResult) => void;
  onError?: (error: Error) => void;
  theme?: LoginTheme;
  redirectPath?: string;
  showRememberMe?: boolean;
  showRegistration?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  appType?: AppType;
}

export interface SessionManager {
  getToken: () => string | null;
  setToken: (token: string, rememberMe?: boolean) => void;
  removeToken: () => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (token: string) => void;
  removeRefreshToken: () => void;
  isTokenValid: () => boolean;
  getTokenExpiry: () => Date | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface LoginFormState {
  formData: LoginFormData;
  errors: ValidationErrors;
  isLoading: boolean;
  isSubmitting: boolean;
}

// Event handler types
export type FormChangeHandler = (
  e: React.ChangeEvent<HTMLInputElement>,
) => void;
export type FormSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => void;

// API response types
export interface LoginApiResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: {
    message: string;
    code: string;
    field?: string;
  };
}

export interface AuthProviderProps {
  children: React.ReactNode;
  apiBaseUrl?: string;
  tokenStorageKey?: string;
  refreshTokenStorageKey?: string;
  autoRefreshInterval?: number;
}
