// ⚠️  SHIM — do not add logic here.
// This file exists only for backward compatibility with existing imports.
// The canonical source has moved to @shared/features/feedback.
//
// All new imports MUST use:
//   import { FeedbackQuickAction } from "@shared/features/feedback";
//
// Existing consumers (admin/Layout, church/Sidebar, playback/Layout, etc.)
// will be migrated to the new path in a dedicated cleanup pulse.
export {
  FeedbackQuickAction,
  FeedbackQuickAction as default,
  submitFeedbackSilently,
  FEEDBACK_SOURCES,
} from "../features/feedback/index.js";
