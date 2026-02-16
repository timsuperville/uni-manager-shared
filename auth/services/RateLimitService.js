/**
 * Rate Limiting Service
 *
 * Handles rate limiting for authentication attempts to prevent brute force attacks.
 */

export class RateLimitService {
  constructor(config = {}) {
    this.loginAttempts = new Map();
    this.maxAttempts = config.maxLoginAttempts || 5;
    this.lockoutDuration = config.lockoutDuration || 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Record a failed login attempt
   * @param {string} identifier - Usually email address
   */
  recordAttempt(identifier) {
    if (!identifier) return;

    const attempts = this.loginAttempts.get(identifier) || {
      count: 0,
      firstAttempt: Date.now(),
      lockedUntil: null,
    };

    attempts.count++;
    attempts.lastAttempt = Date.now();

    if (attempts.count >= this.maxAttempts) {
      attempts.lockedUntil = Date.now() + this.lockoutDuration;
    }

    this.loginAttempts.set(identifier, attempts);
  }

  /**
   * Check if identifier is rate limited
   * @param {string} identifier - Usually email address
   * @returns {boolean} True if rate limited
   */
  isRateLimited(identifier) {
    if (!identifier) return false;

    const attempts = this.loginAttempts.get(identifier);
    if (!attempts) return false;

    // Check if still locked out
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      return true;
    }

    // Clear if lockout has expired
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      this.resetAttempts(identifier);
      return false;
    }

    return attempts.count >= this.maxAttempts;
  }

  /**
   * Get remaining lockout time in milliseconds
   * @param {string} identifier - Usually email address
   * @returns {number} Milliseconds until lockout expires, or 0 if not locked
   */
  getLockoutTimeRemaining(identifier) {
    if (!identifier) return 0;

    const attempts = this.loginAttempts.get(identifier);
    if (!attempts?.lockedUntil) return 0;

    const remaining = attempts.lockedUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Reset login attempts for identifier (called on successful login)
   * @param {string} identifier - Usually email address
   */
  resetAttempts(identifier) {
    if (!identifier) return;
    this.loginAttempts.delete(identifier);
  }

  /**
   * Get attempt count for identifier
   * @param {string} identifier - Usually email address
   * @returns {number} Number of failed attempts
   */
  getAttemptCount(identifier) {
    if (!identifier) return 0;
    return this.loginAttempts.get(identifier)?.count || 0;
  }

  /**
   * Clear all rate limiting data (useful for testing)
   */
  clearAll() {
    this.loginAttempts.clear();
  }
}

export default RateLimitService;
