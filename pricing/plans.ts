import type { PricingPlan, SupportedCurrency } from "./types.js";

export const DEFAULT_SETUP_FEE_CAD = 14900; // $149.00 CAD
export const SETUP_FEE_CAD = DEFAULT_SETUP_FEE_CAD; // Alias for backward-compatibility

export const PLANS: Record<"starter" | "growth", PricingPlan> = {
  starter: {
    id: "starter",
    name: "Beacon Starter",
    description: "Lightning-fast edge storefront on your custom domain, automated SSL, contact routing & weekly health check.",
    monthlyCad: 3900,
    features: [
      "Sub-50ms Global Edge Storefront",
      "Requires Custom Domain (.ca / .com)",
      "Automated Free SSL & DDoS Protection",
      "Instant Contact Form & SMS Lead Routing",
      "Mobile PWA Command Hub & Lead Manager"
    ],
    includedFeatures: [
      "overview",
      "inquiries",
      "payments",
      "tools",
      "website-studio",
      "domains",
      "reviews",
      "compliance-vault",
      "company-profile",
      "billing",
      "channels",
    ],
    prices: {
      CAD: { monthly: 3900, yearly: 39000, setupFee: 14900 }, // $39/mo, $149 setup
      USD: { monthly: 2900, yearly: 29000, setupFee: 11900 }, // $29/mo, $119 setup
      GBP: { monthly: 2500, yearly: 25000, setupFee: 9900 },  // £25/mo, £99 setup
      EUR: { monthly: 2900, yearly: 29000, setupFee: 11900 }, // €29/mo, €119 setup
    },
    isActive: true,
  },
  growth: {
    id: "growth",
    name: "Beacon Growth & Domination",
    description: "Custom apex domain (.ca / .com) included, Google 3-Pack sync, automated reviews booster & priority routing.",
    monthlyCad: 7900,
    features: [
      "Everything in Starter Included",
      "Custom .ca / .com Domain & Managed DNS Included",
      "Google Maps 3-Pack Local SEO Radar",
      "Automated Review Booster Engine",
      "Canadian Statutory Holiday Hours Automation",
      "Priority VIP Support & CMS Updates"
    ],
    includedFeatures: [
      "overview",
      "inquiries",
      "payments",
      "tools",
      "website-studio",
      "domains",
      "reviews",
      "compliance-vault",
      "company-profile",
      "billing",
      "channels",
      "automations",
      "presence-seo",
    ],
    prices: {
      CAD: { monthly: 7900, yearly: 79000, setupFee: 14900 }, // $79/mo, $149 setup
      USD: { monthly: 5900, yearly: 59000, setupFee: 11900 }, // $59/mo, $119 setup
      GBP: { monthly: 4900, yearly: 49000, setupFee: 9900 },  // £49/mo, £99 setup
      EUR: { monthly: 5900, yearly: 59000, setupFee: 11900 }, // €59/mo, €119 setup
    },
    isPopular: true,
    badge: "Most Popular",
    isActive: true,
  }
};

export function getPlan(id: string): PricingPlan {
  if (id === "growth") return PLANS.growth;
  return PLANS.starter;
}

export function getAllPlans(): PricingPlan[] {
  return Object.values(PLANS);
}

export function getActivePlans(): PricingPlan[] {
  return Object.values(PLANS).filter((plan) => plan.isActive);
}

export function getPlanPrice(
  planId: string,
  currency: SupportedCurrency = "CAD"
) {
  const plan = getPlan(planId);
  return plan.prices[currency] || plan.prices.CAD;
}
