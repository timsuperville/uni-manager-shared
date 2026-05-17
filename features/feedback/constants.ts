// Canonical feedback source identifiers.
// Use these constants everywhere — never raw strings.
import { logger } from "@shared/utils/logger";

export type FeedbackSource =
  | "frustration-detector"
  | "error-boundary"
  | "manual";

export const FEEDBACK_SOURCES = {
  FRUSTRATION_DETECTOR: "frustration-detector",
  ERROR_BOUNDARY: "error-boundary",
  MANUAL: "manual",
} as const satisfies Record<string, FeedbackSource>;

/** Valid systemContext.source values as accepted by FeedbackReport Mongoose schema. */
export const VALID_SOURCES = new Set<FeedbackSource>(
  Object.values(FEEDBACK_SOURCES),
);

/**
 * Validates and normalises a source string before submission.
 * Returns null (not undefined) so Mongoose keeps the field but stores null
 * rather than silently dropping a typo'd value that would break the enum.
 */
export function resolveSource(
  source: string | null | undefined,
): FeedbackSource | null {
  if (!source) return null;
  if (VALID_SOURCES.has(source as FeedbackSource))
    return source as FeedbackSource;
  if (import.meta.env?.DEV) {
    logger.warn(
      `[Feedback] Unknown source "${source}". ` +
        `Valid values: ${[...VALID_SOURCES].join(", ")}. Defaulting to null.`,
    );
  }
  return null;
}
