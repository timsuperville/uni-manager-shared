/**
 * API Envelope Utilities
 *
 * Provides canonical type guards and unwrappers for responses formatted with
 * the standard `{ success: boolean, data: T }` envelope.
 */

export interface ApiEnvelope<T = unknown> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data: T;
}

/**
 * Type-guard checking if a payload conforms to the canonical API envelope.
 */
export function isApiEnvelope<T = unknown>(
  val: unknown
): val is ApiEnvelope<T> {
  return (
    val !== null &&
    typeof val === 'object' &&
    'data' in (val as object) &&
    ('success' in (val as object) || 'statusCode' in (val as object))
  );
}

/**
 * Standard typed unwrapper for API responses.
 * Peels the `{ success, data }` or `{ statusCode, data }` envelope so
 * consumers receive the typed entity directly. If the response is already
 * bare (e.g. an array or un-enveloped object), returns it directly.
 */
export function unwrap<T>(response: unknown): T {
  if (isApiEnvelope<T>(response)) {
    return response.data;
  }
  return response as T;
}
