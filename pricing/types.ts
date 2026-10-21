export type SupportedCurrency = "CAD" | "USD" | "GBP" | "EUR";

export type BillingInterval = "month" | "year";

export interface PlanPriceMatrix {
  monthly: number; // in cents/pence (e.g. 3900 = $39.00)
  yearly?: number;  // in cents/pence (e.g. 39000 = $390.00)
  setupFee: number; // in cents/pence (e.g. 14900 = $149.00)
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  /** Feature IDs from FEATURE_REGISTRY entitled to this plan */
  includedFeatures?: string[];
  prices: Record<SupportedCurrency, PlanPriceMatrix>;
  monthlyCad: number; // Backward compatibility shortcut (CAD monthly cents)
  isPopular?: boolean;
  isActive: boolean;
  badge?: string;
}

export type DiscountType = "percentage" | "fixed_amount" | "waive_setup_fee";

export interface DiscountRule {
  code: string;
  type: DiscountType;
  value: number; // e.g., 20 (for 20%) or 2000 (for $20.00)
  appliesTo: "monthly" | "setup_fee" | "total";
  description: string;
  validUntil?: string; // ISO date string
  applicablePlans?: string[]; // If omitted, applies to all plans
}

export interface AddOnProduct {
  id: string;
  name: string;
  description: string;
  prices: Record<SupportedCurrency, number>; // one-time or recurring cents
  isRecurring: boolean;
}

export interface CheckoutCalculationOptions {
  planId: string;
  currency?: SupportedCurrency;
  interval?: BillingInterval;
  includeSetupFee: boolean;
  promoCode?: string;
  selectedAddOns?: string[];
}

export interface CheckoutSummary {
  planId: string;
  planName: string;
  currency: SupportedCurrency;
  interval: BillingInterval;
  baseRecurringCents: number;
  discountedRecurringCents: number;
  baseSetupFeeCents: number;
  discountedSetupFeeCents: number;
  addOnsTotalCents: number;
  totalDueTodayCents: number;
  appliedDiscount?: {
    code: string;
    description: string;
    savingsCents: number;
  };
}
