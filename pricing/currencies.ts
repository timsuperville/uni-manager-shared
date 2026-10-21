import type { SupportedCurrency } from "./types.js";

export interface CurrencyMetadata {
  code: SupportedCurrency;
  label: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: readonly CurrencyMetadata[] = [
  { code: "CAD", label: "CAD ($)", symbol: "$", flag: "🇨🇦" },
  { code: "USD", label: "USD ($)", symbol: "$", flag: "🇺🇸" },
  { code: "GBP", label: "GBP (£)", symbol: "£", flag: "🇬🇧" },
  { code: "EUR", label: "EUR (€)", symbol: "€", flag: "🇪🇺" },
] as const;

export function getCurrencyMetadata(code: SupportedCurrency): CurrencyMetadata {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return (found || SUPPORTED_CURRENCIES[0])!;
}
