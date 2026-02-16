// Authentication hooks
export { useAuth } from "./useAuth.js";
export { useLogin } from "./useLogin.js";

// Search and personalization hooks
export { useAdvancedSearch } from "./useAdvancedSearch.js";
export * from "./useCachedPersonalization.js";
export { useUserPreferences } from "./useUserPreferences.js";
export { useMinistryContext } from "./useMinistryContext.js";
export { useSeasonalContext } from "./useSeasonalContext.js";
export { useActivityContext } from "./useActivityContext.js";

// Real-time hooks
export * from "./useRealTime.js";

// Notification hooks
export { default as useNotifications } from "./useNotifications.js";
export { default as useNotificationPreferences } from "./useNotificationPreferences.js";
export * from "./useWebSocket.js";
export * from "./useOnlineStatus.js";
export { useToast } from "../components/ToastProvider";
