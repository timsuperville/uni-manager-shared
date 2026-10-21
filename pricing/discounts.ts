import type { DiscountRule } from "./types.js";

export const PROMOTIONAL_DISCOUNTS: Record<string, DiscountRule> = {
  LAUNCH50: {
    code: "LAUNCH50",
    type: "percentage",
    value: 50, // 50% off first month
    appliesTo: "monthly",
    description: "50% Off First Month Starter or Growth Plan",
  },
  WAIVESETUP: {
    code: "WAIVESETUP",
    type: "waive_setup_fee",
    value: 100, // 100% off setup fee
    appliesTo: "setup_fee",
    description: "$0 One-Time Setup Fee Promotion",
  },
  FOUNDER20: {
    code: "FOUNDER20",
    type: "percentage",
    value: 20, // 20% off
    appliesTo: "total",
    description: "20% VIP Founder Discount",
  },
};

/**
 * Validates a promotion code against provided discount rules (or default promo registry).
 */
export function validatePromoCode(
  rawCode: string | undefined | null,
  planId?: string,
  customRules?: Record<string, DiscountRule>
): DiscountRule | null {
  if (!rawCode) return null;
  const normalized = rawCode.trim().toUpperCase();
  const rule = (customRules && customRules[normalized]) || PROMOTIONAL_DISCOUNTS[normalized];
  if (!rule) return null;

  if (rule.validUntil && new Date() > new Date(rule.validUntil)) {
    return null; // Expired
  }

  if (rule.applicablePlans && planId && !rule.applicablePlans.includes(planId)) {
    return null; // Plan not eligible
  }

  return rule;
}
