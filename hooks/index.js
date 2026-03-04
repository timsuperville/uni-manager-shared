// Authentication hooks
export { useAuth } from "./useAuth.js";
export { useLogin } from "./useLogin.js";

// Search, personalization, and utility hooks
export { useAdvancedSearch } from "./useAdvancedSearch.js";
export * from "./useCachedPersonalization.js";
export { useUserPreferences } from "./useUserPreferences.js";
export { useDebounce } from "./useDebounce.js";

// Engagement / feedback hooks
export { useNpsPulse } from "./useNpsPulse.js";
export { useFrustrationDetector } from "./useFrustrationDetector.js";

// Real-time and network hooks
export * from "./useRealTime.js";
export * from "./useWebSocket.js";
export * from "./useOnlineStatus.js";

// Cross-app resonance hooks
export { useFocusModeListener } from "./useFocusModeListener.js";

// Notification hooks
export { default as useNotifications } from "./useNotifications.js";
export { default as useNotificationPreferences } from "./useNotificationPreferences.js";

// UI helpers (re-exported from components for convenience)
export { useToast } from "../components/ToastProvider";
