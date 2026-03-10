// @shared/features/feedback — Public barrel
//
// Usage:
//   import { FeedbackQuickAction, submitFeedbackSilently, FEEDBACK_SOURCES } from '@shared/features/feedback';

export { FeedbackQuickAction, submitFeedbackSilently, FEEDBACK_SOURCES, default } from "./FeedbackQuickAction.jsx";
export { FeedbackModalPortal } from "./FeedbackModal.jsx";
export { collectSystemContext } from "./utils/collectSystemContext.js";
export { useOptionalUser } from "./hooks/useOptionalUser.js";
export { resolveSource, VALID_SOURCES } from "./constants.js";
