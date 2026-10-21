import type { SupportedCurrency } from "./types.js";

export function formatCad(cents: number): string {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

export function formatCurrency(
  cents: number,
  currency: SupportedCurrency = "CAD",
  locale?: string
): string {
  const defaultLocale = currency === "CAD" ? "en-CA" : currency === "GBP" ? "en-GB" : currency === "EUR" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(locale || defaultLocale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export const formatPricingCurrency = formatCurrency;

