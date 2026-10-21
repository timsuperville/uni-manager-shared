/**
 * @shared/pricing/discounts.ts
 *
 * Headless promotional code validation utilities.
 * Authoritative coupons, promotion codes, and discounts are stored and validated
 * via Stripe Promotion Codes and the Uni-Manager API.
 */

import type { DiscountRule } from "./types.js";

/**
 * Validates a promotion code against a dynamic dictionary of discount rules.
 * Returns null if the code is invalid, expired, or inapplicable to the target plan.
 */
export function validatePromoCode(
  rawCode: string | undefined | null,
  planId?: string,
  rules?: Record<string, DiscountRule>
): DiscountRule | null {
  if (!rawCode || !rules) return null;
  const normalized = rawCode.trim().toUpperCase();
  const rule = rules[normalized];
  if (!rule) return null;

  if (rule.validUntil && new Date() > new Date(rule.validUntil)) {
    return null; // Expired
  }

  if (rule.applicablePlans && planId && !rule.applicablePlans.includes(planId)) {
    return null; // Plan not eligible
  }

  return rule;
}
