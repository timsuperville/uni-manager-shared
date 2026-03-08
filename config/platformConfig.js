/**
 * @file platformConfig.js
 * @description Singleton configuration constants for the Uni-Manager platform.
 * Import from here rather than hard-coding values across features.
 *
 * For environment-specific overrides, prefix keys with VITE_ in .env files
 * and read them via import.meta.env.
 */

export const PLATFORM_CONFIG = {
    /** Support email shown in footers / help links. */
    SUPPORT_EMAIL: "support@uni-manager.app",

    /** Public marketing site */
    MARKETING_URL: "https://uni-manager.app",

    /** Brand name displayed in UI strings */
    BRAND_NAME: "Uni-Manager",
};
