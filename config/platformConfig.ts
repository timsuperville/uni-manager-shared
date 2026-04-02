/**
 * @file platformConfig.ts
 * @description Singleton configuration constants for the Uni-Manager platform.
 * Import from here rather than hard-coding values across features.
 *
 * For environment-specific overrides, prefix keys with VITE_ in .env files
 * and read them via import.meta.env.
 */

export interface PlatformConfig {
  /** Support email shown in footers / help links. */
  SUPPORT_EMAIL: string;
  /** Public marketing site */
  MARKETING_URL: string;
  /** Brand name displayed in UI strings */
  BRAND_NAME: string;
}

export const PLATFORM_CONFIG: PlatformConfig = {
  SUPPORT_EMAIL: "support@uni-manager.com",
  MARKETING_URL: "https://uni-manager.com",
  BRAND_NAME: "Uni-Manager",
};
