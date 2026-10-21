/**
 * @shared/pricing/plans.ts
 *
 * Pricing plan contracts and dynamic calculation registry.
 * Authoritative plan definitions, features, and limits are managed via the
 * platform PlanDefinition catalog and backend billing engine.
 */

import type { PricingPlan, SupportedCurrency } from "./types.js";

export const DEFAULT_SETUP_FEE_CAD = 14900;
export const SETUP_FEE_CAD = DEFAULT_SETUP_FEE_CAD;

const planRegistry = new Map<string, PricingPlan>();

/**
 * Neutral baseline plans for calculation engines and offline testing.
 * Contains zero trade marketing copy or hardcoded vendor couplings.
 */
export const DEFAULT_PLANS: Record<"starter" | "growth", PricingPlan> = {
  starter: {
    id: "starter",
    name: "Starter Plan",
    description: "Core organizational workspace, custom domain connection, and direct communication routing.",
    monthlyCad: 3900,
    features: [
      "Custom domain connection & SSL",
      "Direct client communications & routing",
      "Core workspace management suite"
    ],
    prices: {
      CAD: { monthly: 3900, yearly: 39000, setupFee: 14900 },
      USD: { monthly: 2900, yearly: 29000, setupFee: 11900 },
      GBP: { monthly: 2500, yearly: 25000, setupFee: 9900 },
      EUR: { monthly: 2900, yearly: 29000, setupFee: 11900 },
    },
    isActive: true,
  },
  growth: {
    id: "growth",
    name: "Growth Plan",
    description: "Expanded organizational operations, advanced analytics, and priority capabilities.",
    monthlyCad: 7900,
    features: [
      "Everything in Starter included",
      "Advanced operational metrics & analytics",
      "Priority system routing & support"
    ],
    prices: {
      CAD: { monthly: 7900, yearly: 79000, setupFee: 14900 },
      USD: { monthly: 5900, yearly: 59000, setupFee: 11900 },
      GBP: { monthly: 4900, yearly: 49000, setupFee: 9900 },
      EUR: { monthly: 5900, yearly: 59000, setupFee: 11900 },
    },
    isActive: true,
  },
};

for (const [id, plan] of Object.entries(DEFAULT_PLANS)) {
  planRegistry.set(id, plan);
}

/**
 * Registers or updates pricing plans dynamically from the authoritative API catalog.
 */
export function registerPlans(plans: PricingPlan[]): void {
  for (const plan of plans) {
    planRegistry.set(plan.id, plan);
  }
}

/**
 * Retrieves a plan by ID.
 */
export function getPlan(id: string): PricingPlan {
  const plan = planRegistry.get(id);
  if (!plan) {
    throw new Error(`Pricing plan with id '${id}' not found in registry.`);
  }
  return plan;
}

/**
 * Retrieves all registered plans.
 */
export function getAllPlans(): PricingPlan[] {
  return Array.from(planRegistry.values());
}

/**
 * Helper to retrieve currency price matrix for a given plan.
 */
export function getPlanPrice(id: string, currency: SupportedCurrency = "CAD") {
  const plan = getPlan(id);
  const matrix = plan.prices[currency];
  if (!matrix) {
    return plan.prices.CAD;
  }
  return matrix;
}

/**
 * Dynamic dictionary proxy for calculation callers.
 */
export const PLANS: Record<"starter" | "growth", PricingPlan> = new Proxy(DEFAULT_PLANS, {
  get: (_target, prop: string) => (planRegistry.get(prop) as PricingPlan) || (DEFAULT_PLANS as any)[prop],
  has: (_target, prop: string) => planRegistry.has(prop),
});
