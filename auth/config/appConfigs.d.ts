/**
 * Type declarations for config/appConfigs.js
 * TACTICAL: This shim exists until appConfigs.js is migrated to TypeScript (Wave 3).
 * When converted, delete this file and import directly from appConfigs.ts.
 */

export interface AppEndpoints {
    login: string;
    logout: string;
    refresh: string;
    signup: string;
    [key: string]: string;
}

export interface SocialLoginConfig {
    enabled: boolean;
    providers: string[];
    [key: string]: unknown; // provider-specific clientId keys
}

export interface AppFeatures {
    socialLogin?: SocialLoginConfig;
    [key: string]: unknown;
}

export interface AppConfig {
    appName: string;
    appType: string;
    apiEndpoints: AppEndpoints;
    features: AppFeatures;
    loginTitle?: string;
    loginDescription?: string;
    [key: string]: unknown;
}

export const APP_CONFIGS: Record<string, AppConfig>;
export function getAppConfig(appName: string): AppConfig;
export function getCurrentAppName(): string;
export function getCurrentAppConfig(appType?: string): AppConfig;
export default APP_CONFIGS;
