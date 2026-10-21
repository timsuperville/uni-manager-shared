/**
 * @shared/pricing/plans.ts
 *
 * Headless pricing plan utilities.
 * Authoritative plan definitions and pricing are stored in MongoDB (PlanDefinition)
 * and Stripe, fetched dynamically via the Uni-Manager API.
 */

import type { PricingPlan, PlanPriceMatrix, SupportedCurrency } from "./types.js";

/**
 * Extracts the price matrix for a given currency from a plan object.
 * Falls back to CAD if the specified currency matrix is absent.
 */
export function getPlanPriceMatrix(plan: PricingPlan, currency: SupportedCurrency = "CAD"): PlanPriceMatrix {
  return plan.prices[currency] ?? plan.prices.CAD;
}

/**
 * Calculates recurring price in cents for a given plan, interval, and currency.
 */
export function getRecurringPlanPrice(
  plan: PricingPlan,
  interval: "month" | "year" = "month",
  currency: SupportedCurrency = "CAD"
): number {
  const matrix = getPlanPriceMatrix(plan, currency);
  return interval === "year" && matrix.yearly ? matrix.yearly : matrix.monthly;
}
