// @shared/features/feedback — Public barrel
//
// Usage:
//   import { FeedbackQuickAction, submitFeedbackSilently, FEEDBACK_SOURCES } from '@shared/features/feedback';

export {
  FeedbackQuickAction,
  submitFeedbackSilently,
  FEEDBACK_SOURCES,
  default,
} from "./FeedbackQuickAction";
export { FeedbackModalPortal } from "./FeedbackModal";
export { collectSystemContext } from "./utils/collectSystemContext";
export { useOptionalUser } from "./hooks/useOptionalUser";
export { resolveSource, VALID_SOURCES } from "./constants";

// Re-exported types
export type { FeedbackUser, SystemContext } from "./utils/collectSystemContext";
export type { FeedbackSource } from "./constants";
export type { FeedbackQuickActionProps } from "./FeedbackQuickAction";
export type { FeedbackModalPortalProps } from "./FeedbackModal";
