/**
 * Environment-Aware Logging Utility
 *
 * Provides structured logging with environment awareness.
 * In development: logs to console.
 * In production: suppresses debug/info; sends errors to Sentry if present.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type LogArgs = unknown[];

interface SentryLike {
  captureException: (
    error: Error,
    context?: { extra: Record<string, unknown> },
  ) => void;
}

interface SentryWindow extends Window {
  Sentry?: SentryLike;
}

// ─── Log level constants ──────────────────────────────────────────────────────

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

// ─── Logger class ─────────────────────────────────────────────────────────────

const isDevelopment = import.meta.env.MODE === "development";
const isTest = import.meta.env.MODE === "test";

class Logger {
  private readonly level: number;

  constructor() {
    this.level = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
  }

  /** Log debug information (development only) */
  debug(message: string, ...args: LogArgs): void {
    if (this.level <= LOG_LEVELS.DEBUG && !isTest) {
      console.debug("🔍 [DEBUG]", message, ...args);
    }
  }

  /** Log informational messages (development only) */
  info(message: string, ...args: LogArgs): void {
    if (this.level <= LOG_LEVELS.INFO && !isTest) {
      console.info("ℹ️ [INFO]", message, ...args);
    }
  }

  /** Log warnings (development only — production warnings go to Sentry via error()) */
  warn(message: string, ...args: LogArgs): void {
    if (this.level <= LOG_LEVELS.WARN && !isTest && import.meta.env.DEV) {
      console.warn("⚠️ [WARN]", message, ...args);
    }
  }

  /**
   * Log errors.
   * In development: console.error.
   * In production: sends to Sentry if available.
   */
  error(message: string, error?: unknown, ...args: LogArgs): void {
    if (!isTest && import.meta.env.DEV) {
      console.error("❌ [ERROR]", message, error, ...args);
    }

    if (!isDevelopment && !isTest && typeof window !== "undefined") {
      const win = window as SentryWindow;
      if (win.Sentry) {
        win.Sentry.captureException(
          error instanceof Error ? error : new Error(message),
          {
            extra: { args },
          },
        );
      }
    }
  }

  /** Log with a custom emoji/prefix (development only) */
  log(emoji: string, prefix: string, message: string, ...args: LogArgs): void {
    if (isDevelopment && !isTest) {
      console.log(`${emoji} [${prefix}]`, message, ...args);
    }
  }

  /** Group related logs together (development only) */
  group(label: string, callback: () => void): void {
    if (isDevelopment && !isTest) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }

  /** Log a performance measurement (development only) */
  perf(label: string, duration: number): void {
    if (isDevelopment && !isTest) {
      console.log(`⏱️ [PERF] ${label}:`, `${duration.toFixed(2)}ms`);
    }
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const logger = new Logger();

// Convenience named exports (bind to preserve `this`)
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const log = logger.log.bind(logger);
export const group = logger.group.bind(logger);
export const perf = logger.perf.bind(logger);

export default logger;
