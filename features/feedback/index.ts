// @shared/features/feedback — Public barrel
//
// Usage:
//   import { FeedbackQuickAction, submitFeedbackSilently, FEEDBACK_SOURCES } from '@shared/features/feedback';

export { FeedbackQuickAction, submitFeedbackSilently, FEEDBACK_SOURCES, default } from "./FeedbackQuickAction.tsx";
export { FeedbackModalPortal } from "./FeedbackModal.tsx";
export { collectSystemContext } from "./utils/collectSystemContext.ts";
export { useOptionalUser } from "./hooks/useOptionalUser.ts";
export { resolveSource, VALID_SOURCES } from "./constants.ts";

// Re-exported types
export type { FeedbackUser, SystemContext } from "./utils/collectSystemContext.ts";
export type { FeedbackSource } from "./constants.ts";
export type { FeedbackQuickActionProps } from "./FeedbackQuickAction.tsx";
export type { FeedbackModalPortalProps } from "./FeedbackModal.tsx";
