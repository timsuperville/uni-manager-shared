import { getPlan, getPlanPrice } from "./plans.js";
import { validatePromoCode } from "./discounts.js";
import { getAddOn } from "./addons.js";
import type { CheckoutCalculationOptions, CheckoutSummary, SupportedCurrency } from "./types.js";

export function calculateCheckoutSummary(options: CheckoutCalculationOptions): CheckoutSummary {
  const currency: SupportedCurrency = options.currency || "CAD";
  const interval = options.interval || "month";
  const plan = getPlan(options.planId);
  const planPrice = getPlanPrice(options.planId, currency);

  // 1. Calculate Recurring Base
  const baseRecurringCents = interval === "year" && planPrice.yearly ? planPrice.yearly : planPrice.monthly;
  let discountedRecurringCents = baseRecurringCents;

  // 2. Calculate Setup Fee
  const baseSetupFeeCents = options.includeSetupFee ? planPrice.setupFee : 0;
  let discountedSetupFeeCents = baseSetupFeeCents;

  // 3. Calculate Add-ons
  let addOnsTotalCents = 0;
  if (options.selectedAddOns && options.selectedAddOns.length > 0) {
    for (const addonId of options.selectedAddOns) {
      const addon = getAddOn(addonId);
      if (addon) {
        addOnsTotalCents += addon.prices[currency] || 0;
      }
    }
  }

  // 4. Evaluate Promo Code
  const discountRule = validatePromoCode(options.promoCode, options.planId);
  let appliedDiscount: CheckoutSummary["appliedDiscount"] = undefined;

  if (discountRule) {
    let savings = 0;
    if (discountRule.type === "waive_setup_fee" || discountRule.appliesTo === "setup_fee") {
      savings = baseSetupFeeCents;
      discountedSetupFeeCents = 0;
    } else if (discountRule.type === "percentage") {
      if (discountRule.appliesTo === "monthly") {
        savings = Math.round((baseRecurringCents * discountRule.value) / 100);
        discountedRecurringCents = Math.max(0, baseRecurringCents - savings);
      } else if (discountRule.appliesTo === "total") {
        const subtotal = baseRecurringCents + baseSetupFeeCents + addOnsTotalCents;
        savings = Math.round((subtotal * discountRule.value) / 100);
        discountedRecurringCents = Math.max(0, baseRecurringCents - Math.round((baseRecurringCents * discountRule.value) / 100));
        discountedSetupFeeCents = Math.max(0, baseSetupFeeCents - Math.round((baseSetupFeeCents * discountRule.value) / 100));
      }
    } else if (discountRule.type === "fixed_amount") {
      savings = Math.min(discountRule.value, baseRecurringCents + baseSetupFeeCents);
      discountedRecurringCents = Math.max(0, baseRecurringCents - savings);
    }

    if (savings > 0) {
      appliedDiscount = {
        code: discountRule.code,
        description: discountRule.description,
        savingsCents: savings,
      };
    }
  }

  const totalDueTodayCents = discountedRecurringCents + discountedSetupFeeCents + addOnsTotalCents;

  return {
    planId: plan.id,
    planName: plan.name,
    currency,
    interval,
    baseRecurringCents,
    discountedRecurringCents,
    baseSetupFeeCents,
    discountedSetupFeeCents,
    addOnsTotalCents,
    totalDueTodayCents,
    appliedDiscount,
  };
}
