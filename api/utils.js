/**
 * URL Utilities
 *
 * Re-exports from the centralized API configuration.
 * This file exists for backward compatibility.
 *
 * @deprecated Import from '@shared/api/config/apiConfig' instead
 */

export { getApiBaseUrl, getAbsoluteUrl } from "./config/apiConfig";

// Legacy export name for compatibility
export { getAbsoluteUrl as getAbsoluteUploadUrl } from "./config/apiConfig";
