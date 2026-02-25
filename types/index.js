/**
 * @shared/types — Cross-application domain types
 *
 * This module documents the canonical runtime shapes used throughout the
 * Uni-Manager ecosystem. Because the codebase is primarily JavaScript with
 * selective TypeScript files, type information lives here as JSDoc @typedef
 * comments — usable for IDE intellisense (via checkJs / jsconfig.json)
 * without requiring a full TS compilation step.
 *
 * As individual modules migrate to TypeScript, move their interfaces here.
 */

// ─── Auth / Identity ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} AuthUser
 * @property {string}   id
 * @property {string}   email
 * @property {string}   [username]
 * @property {string}   [firstName]
 * @property {string}   [lastName]
 * @property {string}   [avatar]
 * @property {string[]} roles
 * @property {string}   appType  — "admin" | "church" | "home" | "work" | "personal" | "playback"
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} [refreshToken]
 * @property {number} expiresIn  — seconds
 */

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean}  success
 * @property {T}        [data]
 * @property {string}   [message]
 * @property {string}   [resonanceId]  — ErrorLog._id for forensic investigation
 * @property {number}   [statusCode]
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]}    data
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 */

// ─── Error Logging ────────────────────────────────────────────────────────────

/**
 * @typedef {"critical"|"high"|"medium"|"low"} ErrorSeverity
 */

/**
 * @typedef {Object} ErrorLogEntry
 * @property {string}        resonanceId  — MongoDB _id
 * @property {string}        message
 * @property {string}        [stackTrace]
 * @property {ErrorSeverity} severity
 * @property {string}        appType
 * @property {boolean}       resolved
 * @property {boolean}       isRegression
 */

// ─── Feedback ────────────────────────────────────────────────────────────────

/**
 * @typedef {"pending"|"investigating"|"in-progress"|"resolved"} FeedbackStatus
 */

/**
 * @typedef {Object} FeedbackReport
 * @property {string}         reportId
 * @property {string}         title
 * @property {string}         description
 * @property {FeedbackStatus} status
 * @property {"low"|"medium"|"high"|"critical"} priority
 * @property {string}         appType
 */

// ─── Presence ────────────────────────────────────────────────────────────────

/**
 * @typedef {"available"|"busy"|"away"|"offline"} PresenceStatus
 */

/**
 * @typedef {Object} PresenceState
 * @property {boolean}        isConnected
 * @property {WebSocket|null} socket
 * @property {PresenceStatus} status
 * @property {Function}       setStatus
 */

// No runtime exports — this module is purely for JSDoc type annotation.
// Import types like: /** @type {import("@shared/types").AuthUser} */
export {};
