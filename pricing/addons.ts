/**
 * @shared/pricing/addons.ts
 *
 * Headless add-on calculation utilities.
 * Authoritative add-on offerings and pricing are managed dynamically via backend
 * catalogs and Stripe.
 */

import type { AddOnProduct, SupportedCurrency } from "./types.js";

/**
 * Calculates total add-ons cost in cents for a given currency.
 */
export function calculateAddOnsTotal(
  addOns: AddOnProduct[],
  currency: SupportedCurrency = "CAD"
): number {
  return addOns.reduce((total, addon) => {
    const price = addon.prices[currency] ?? addon.prices.CAD ?? 0;
    return total + price;
  }, 0);
}
