/**
 * Rate Limiting Service
 *
 * Handles rate limiting for authentication attempts to prevent brute force attacks.
 * Entirely in-memory — state resets on page reload.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RateLimitConfig {
  maxLoginAttempts?: number;
  lockoutDuration?: number;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class RateLimitService {
  private readonly loginAttempts: Map<string, AttemptRecord>;
  private readonly maxAttempts: number;
  private readonly lockoutDuration: number;

  constructor(config: RateLimitConfig = {}) {
    this.loginAttempts = new Map();
    this.maxAttempts = config.maxLoginAttempts ?? 5;
    this.lockoutDuration = config.lockoutDuration ?? 15 * 60 * 1000; // 15 minutes
  }

  /** Records a failed login attempt for the given identifier (e.g. email). */
  recordAttempt(identifier: string): void {
    if (!identifier) return;

    const existing = this.loginAttempts.get(identifier);
    const attempts: AttemptRecord = existing ?? {
      count: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
      lockedUntil: null,
    };

    attempts.count++;
    attempts.lastAttempt = Date.now();

    if (attempts.count >= this.maxAttempts) {
      attempts.lockedUntil = Date.now() + this.lockoutDuration;
    }

    this.loginAttempts.set(identifier, attempts);
  }

  /** Returns true if the identifier is currently locked out. */
  isRateLimited(identifier: string): boolean {
    if (!identifier) return false;

    const attempts = this.loginAttempts.get(identifier);
    if (!attempts) return false;

    if (attempts.lockedUntil !== null) {
      if (Date.now() < attempts.lockedUntil) return true;
      // Lockout has expired — clear
      this.resetAttempts(identifier);
      return false;
    }

    return attempts.count >= this.maxAttempts;
  }

  /** Returns milliseconds until the lockout expires, or 0 if not locked. */
  getLockoutTimeRemaining(identifier: string): number {
    if (!identifier) return 0;

    const attempts = this.loginAttempts.get(identifier);
    if (!attempts?.lockedUntil) return 0;

    return Math.max(0, attempts.lockedUntil - Date.now());
  }

  /** Clears failed attempts for this identifier — call on successful login. */
  resetAttempts(identifier: string): void {
    if (!identifier) return;
    this.loginAttempts.delete(identifier);
  }

  /** Returns the current failed attempt count for this identifier. */
  getAttemptCount(identifier: string): number {
    if (!identifier) return 0;
    return this.loginAttempts.get(identifier)?.count ?? 0;
  }

  /** Clears all rate limit state — useful for testing. */
  clearAll(): void {
    this.loginAttempts.clear();
  }
}

export default RateLimitService;
