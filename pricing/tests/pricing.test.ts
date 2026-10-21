import { describe, it, expect } from "vitest";
import {
  getPlan,
  getAllPlans,
  calculateCheckoutSummary,
  formatCad,
  formatCurrency,
  validatePromoCode,
  ADDON_PRODUCTS,
  calculateDomainQuote,
  fetchLiveUsdCadRate,
} from "../index";

describe("@uni-manager/shared Pricing Catalog & Calculation Engine", () => {
  it("should retrieve all active plans", () => {
    const plans = getAllPlans();
    expect(plans.length).toBeGreaterThanOrEqual(2);
    const starter = plans.find((p) => p.id === "starter");
    expect(starter).toBeDefined();
    expect(starter?.prices.CAD.monthly).toBe(3900);
    expect(starter?.prices.USD.monthly).toBe(2900);
  });

  it("should retrieve specific plan by id", () => {
    const growthPlan = getPlan("growth");
    expect(growthPlan).toBeDefined();
    expect(growthPlan?.name).toBe("Beacon Growth & Domination");
    expect(growthPlan?.prices.CAD.monthly).toBe(7900);
    expect(growthPlan?.prices.CAD.setupFee).toBe(14900);
  });

  it("should calculate monthly checkout summary in CAD correctly without discounts", () => {
    const summary = calculateCheckoutSummary({
      planId: "starter",
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
      planId: "starter",
      currency: "USD",
      interval: "year",
      includeSetupFee: true,
    });

    expect(summary.currency).toBe("USD");
    expect(summary.interval).toBe("year");
    expect(summary.baseRecurringCents).toBe(29000); // 10 months price = 2900 * 10
    expect(summary.discountedRecurringCents).toBe(29000);
    expect(summary.baseSetupFeeCents).toBe(11900);
    expect(summary.totalDueTodayCents).toBe(40900); // 29000 + 11900
  });

  it("should apply percentage promo code correctly", () => {
    const summary = calculateCheckoutSummary({
      planId: "starter",
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
      planId: "starter",
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

  it("should include recurring add-ons in calculation", () => {
    const summary = calculateCheckoutSummary({
      planId: "starter",
      currency: "CAD",
      interval: "month",
      includeSetupFee: false,
      selectedAddOns: ["ai_voice_secretary"],
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
    // 11 * 1.53 = 16.83 -> Math.ceil = 17
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
