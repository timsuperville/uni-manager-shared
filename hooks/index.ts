// @shared/hooks — Shared hooks barrel
// All hooks are now TypeScript (.ts). Cycle #480 completed the full migration.

// Authentication hooks
export { useAuth } from "./useAuth";
export { useLogin } from "./useLogin";

// Search, personalization, and utility hooks
export { useAdvancedSearch } from "./useAdvancedSearch";
export * from "./useCachedPersonalization";
export { useUserPreferences } from "./useUserPreferences";
export { useDebounce } from "./useDebounce";
export { useLocalStorage } from "./useLocalStorage";
export { useDarkMode } from "./useDarkMode";

// Engagement / feedback hooks
export { useNpsPulse } from "./useNpsPulse";
export { useFrustrationDetector } from "./useFrustrationDetector";

// Real-time and network hooks
export * from "./useWebSocket";
export * from "./useOnlineStatus";

// CRDT multi-player state sync (FB-016)
export { useSync } from "./sync/useSync";
export { useProjectSync } from "./sync/useProjectSync";

// Cross-app resonance hooks
export { useFocusModeListener } from "./useFocusModeListener";
export { useCapacityBridge } from "./useCapacityBridge";
export { useHospitalityBridge } from "./useHospitalityBridge";

// Notification hooks
// NOTE: useNotifications.js/useNotificationPreferences.js were renamed to .ts —
//       the old .js reference below was broken. Fixed here (Cycle #486).
export { default as useNotifications } from "./useNotifications";
export { default as useNotificationPreferences } from "./useNotificationPreferences";

// UI helpers (re-exported from components for convenience)
export { useToast } from "../components/ToastProvider";

// Audio analysis hooks
export { useAnalyserLevel } from "./useAnalyserLevel";

// Live cue safety
export { useArmConfirm } from "./useArmConfirm";
