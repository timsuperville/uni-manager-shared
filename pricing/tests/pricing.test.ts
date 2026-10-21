import { describe, it, expect } from "vitest";
import {
  calculateCheckoutSummary,
  getPlanPriceMatrix,
  getRecurringPlanPrice,
  calculateAddOnsTotal,
  formatCad,
  formatCurrency,
  validatePromoCode,
  calculateDomainQuote,
  fetchLiveUsdCadRate,
  type PricingPlan,
  type AddOnProduct,
} from "../index";

const fixturePlan: PricingPlan = {
  id: "test-starter",
  name: "Test Starter Plan",
  description: "Test plan fixture for calculation engine",
  features: ["Domain SSL", "Core Workspace"],
  monthlyCad: 3900,
  prices: {
    CAD: { monthly: 3900, yearly: 39000, setupFee: 14900 },
    USD: { monthly: 2900, yearly: 29000, setupFee: 11900 },
    GBP: { monthly: 2500, yearly: 25000, setupFee: 9900 },
    EUR: { monthly: 2900, yearly: 29000, setupFee: 11900 },
  },
  isActive: true,
};

const fixtureGrowthPlan: PricingPlan = {
  id: "test-growth",
  name: "Test Growth Plan",
  description: "Advanced plan fixture for calculation engine",
  features: ["Everything in Starter", "Priority Support"],
  monthlyCad: 7900,
  prices: {
    CAD: { monthly: 7900, yearly: 79000, setupFee: 14900 },
    USD: { monthly: 5900, yearly: 59000, setupFee: 11900 },
    GBP: { monthly: 4900, yearly: 49000, setupFee: 9900 },
    EUR: { monthly: 5900, yearly: 59000, setupFee: 11900 },
  },
  isActive: true,
};

const fixtureAddOn: AddOnProduct = {
  id: "test_voice_assistant",
  name: "Test Voice Assistant",
  description: "Voice receptionist fixture",
  isRecurring: true,
  prices: {
    CAD: 9900,
    USD: 7900,
    GBP: 6900,
    EUR: 7900,
  },
};

describe("@uni-manager/shared Headless Pricing Calculation Engine", () => {
  it("should resolve currency price matrices accurately", () => {
    const cadMatrix = getPlanPriceMatrix(fixturePlan, "CAD");
    expect(cadMatrix.monthly).toBe(3900);
    expect(cadMatrix.setupFee).toBe(14900);

    const usdMatrix = getPlanPriceMatrix(fixturePlan, "USD");
    expect(usdMatrix.monthly).toBe(2900);
    expect(usdMatrix.setupFee).toBe(11900);
  });

  it("should calculate recurring plan price across monthly and yearly intervals", () => {
    const monthlyPrice = getRecurringPlanPrice(fixtureGrowthPlan, "month", "CAD");
    expect(monthlyPrice).toBe(7900);

    const yearlyPrice = getRecurringPlanPrice(fixtureGrowthPlan, "year", "USD");
    expect(yearlyPrice).toBe(59000);
  });

  it("should calculate monthly checkout summary in CAD correctly without discounts", () => {
    const summary = calculateCheckoutSummary({
      plan: fixturePlan,
      currency: "CAD",
      interval: "month",
      includeSetupFee: true,
    });

    expect(summary.currency).toBe("CAD");
    expect(summary.interval).toBe("month");
    expect(summary.baseRecurringCents).toBe(3900);
    expect(summary.discountedRecurringCents).toBe(3900);
    expect(summary.baseSetupFeeCents).toBe(14900);
    expect(summary.discountedSetupFeeCents).toBe(14900);
    expect(summary.totalDueTodayCents).toBe(18800); // 3900 + 14900
  });

  it("should calculate yearly checkout summary in USD with 2 months free discount", () => {
    const summary = calculateCheckoutSummary({
      plan: fixturePlan,
      currency: "USD",
      interval: "year",
      includeSetupFee: true,
    });

    expect(summary.currency).toBe("USD");
    expect(summary.interval).toBe("year");
    expect(summary.baseRecurringCents).toBe(29000);
    expect(summary.discountedRecurringCents).toBe(29000);
    expect(summary.baseSetupFeeCents).toBe(11900);
    expect(summary.totalDueTodayCents).toBe(40900); // 29000 + 11900
  });

  it("should apply percentage promo code correctly", () => {
    const summary = calculateCheckoutSummary({
      plan: fixturePlan,
      currency: "CAD",
      interval: "month",
      includeSetupFee: false,
      promoCode: "LAUNCH50",
    });

    expect(summary.appliedDiscount).toBeDefined();
    expect(summary.appliedDiscount?.code).toBe("LAUNCH50");
    expect(summary.baseRecurringCents).toBe(3900);
    expect(summary.discountedRecurringCents).toBe(1950); // 50% of 3900
    expect(summary.totalDueTodayCents).toBe(1950);
  });

  it("should waive setup fee with WAIVESETUP promo code", () => {
    const summary = calculateCheckoutSummary({
      plan: fixturePlan,
      currency: "CAD",
      interval: "month",
      includeSetupFee: true,
      promoCode: "WAIVESETUP",
    });

    expect(summary.appliedDiscount).toBeDefined();
    expect(summary.appliedDiscount?.code).toBe("WAIVESETUP");
    expect(summary.baseSetupFeeCents).toBe(14900);
    expect(summary.discountedSetupFeeCents).toBe(0);
    expect(summary.totalDueTodayCents).toBe(3900);
  });

  it("should calculate add-ons total accurately across currencies", () => {
    const totalCad = calculateAddOnsTotal([fixtureAddOn], "CAD");
    expect(totalCad).toBe(9900);

    const totalUsd = calculateAddOnsTotal([fixtureAddOn], "USD");
    expect(totalUsd).toBe(7900);
  });

  it("should include recurring add-ons in checkout calculation", () => {
    const summary = calculateCheckoutSummary({
      plan: fixturePlan,
      currency: "CAD",
      interval: "month",
      includeSetupFee: false,
      addOns: [fixtureAddOn],
    });

    expect(summary.addOnsTotalCents).toBe(9900);
    expect(summary.totalDueTodayCents).toBe(13800); // 3900 + 9900
  });

  it("should format multi-currency price strings accurately", () => {
    expect(formatCad(3900)).toBe("$39.00 CAD");
    expect(formatCurrency(2900, "USD")).toContain("29.00");
    expect(formatCurrency(2500, "GBP")).toContain("25.00");
    const eurFormatted = formatCurrency(2900, "EUR");
    expect(eurFormatted.includes("29,00") || eurFormatted.includes("29.00")).toBe(true);
  });

  it("should calculate domain quote with locked 53% markup for .ca", () => {
    const quote = calculateDomainQuote("testdomain.ca", true);
    expect(quote.tld).toBe(".ca");
    expect(quote.available).toBe(true);
    expect(quote.markupPercent).toBe(53);
    expect(quote.wholesaleCostCAD).toBe(11.0);
    expect(quote.retailPrice.CAD).toBe(17);
    expect(quote.formattedCAD).toBe("$17.00 CAD / yr");
    expect(quote.annualProfitCAD).toBe(6.0);
  });

  it("should calculate domain quote with locked 53% markup for .com using USD conversion", () => {
    const quote = calculateDomainQuote("testdomain.com", true);
    expect(quote.tld).toBe(".com");
    expect(quote.available).toBe(true);
    expect(quote.markupPercent).toBe(53);
    expect(quote.wholesaleCostUSD).toBe(10.44);
    expect(quote.retailPrice.CAD).toBeGreaterThanOrEqual(22);
    expect(quote.annualProfitCAD).toBeGreaterThan(0);
  });

  it("should handle live Bank of Canada FX resolution gracefully", async () => {
    const fx = await fetchLiveUsdCadRate();
    expect(fx.usdToCadRate).toBeGreaterThan(1.0);
    expect(fx.cadToUsdRate).toBeLessThan(1.0);
    expect(["BANK_OF_CANADA_VALET", "FALLBACK_HEDGED"]).toContain(fx.source);
  });
});
