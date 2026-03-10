// Canonical feedback source identifiers.
// Use these constants everywhere — never raw strings.

/** @type {{ FRUSTRATION_DETECTOR: string, ERROR_BOUNDARY: string, MANUAL: string }} */
export const FEEDBACK_SOURCES = /** @type {const} */ ({
    FRUSTRATION_DETECTOR: "frustration-detector",
    ERROR_BOUNDARY: "error-boundary",
    MANUAL: "manual",
});

/** Valid systemContext.source values as accepted by FeedbackReport Mongoose schema. */
export const VALID_SOURCES = new Set(Object.values(FEEDBACK_SOURCES));

/**
 * Validates and normalises a source string before submission.
 * Returns null (not undefined) so Mongoose keeps the field but stores null
 * rather than silently dropping a typo'd value that would break the enum.
 */
export function resolveSource(source) {
    if (!source) return null;
    if (VALID_SOURCES.has(source)) return source;
    if (process.env.NODE_ENV !== "production") {
        console.warn(
            `[Feedback] Unknown source "${source}". ` +
            `Valid values: ${[...VALID_SOURCES].join(", ")}. Defaulting to null.`,
        );
    }
    return null;
}
