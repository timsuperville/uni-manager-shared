/**
 * @shared/pricing/addons.ts
 *
 * Add-on product contracts and dynamic calculation registry.
 * Authoritative product definitions, descriptions, and active pricing are fetched
 * dynamically from the backend API / Stripe product catalog.
 */

import type { AddOnProduct } from "./types.js";

/**
 * In-memory registry of active add-on products.
 * Populated dynamically via API hydration (e.g. from /v1/billing/addons).
 */
const addonRegistry = new Map<string, AddOnProduct>();

/**
 * Neutral baseline catalog for calculation testing and offline engines.
 * Contains zero hardcoded trade marketing copy or vendor couplings.
 */
export const DEFAULT_ADDON_PRODUCTS: Record<string, AddOnProduct> = {
  ai_voice_secretary: {
    id: "ai_voice_secretary",
    name: "AI Voice Receptionist",
    description: "Autonomous inbound telephone answering, call notes, and emergency escalation alerts.",
    features: [
      "Dedicated inbound telephone DID line",
      "Emergency escalation SMS notifications",
      "Automatic CRM contact and activity logging"
    ],
    isRecurring: true,
    prices: {
      CAD: 9900,
      USD: 7900,
      GBP: 6900,
      EUR: 7900,
    },
  },
  local_visitor_radar: {
    id: "local_visitor_radar",
    name: "Visitor & Call Analytics",
    description: "Edge visitor analytics, caller insights, and conversion metrics.",
    isRecurring: true,
    prices: {
      CAD: 1900,
      USD: 1400,
      GBP: 1200,
      EUR: 1400,
    },
  },
};

// Seed baseline items
for (const [id, addon] of Object.entries(DEFAULT_ADDON_PRODUCTS)) {
  addonRegistry.set(id, addon);
}

/**
 * Registers or updates add-on products dynamically from the backend API catalog.
 */
export function registerAddOns(addons: AddOnProduct[]): void {
  for (const addon of addons) {
    addonRegistry.set(addon.id, addon);
  }
}

/**
 * Retrieves an add-on product from the registry by ID.
 */
export function getAddOn(id: string): AddOnProduct | undefined {
  return addonRegistry.get(id);
}

/**
 * Retrieves all registered add-on products.
 */
export function getAllAddOns(): AddOnProduct[] {
  return Array.from(addonRegistry.values());
}

/**
 * Dynamic dictionary proxy for calculation callers.
 */
export const ADDON_PRODUCTS: Record<string, AddOnProduct> = new Proxy(DEFAULT_ADDON_PRODUCTS, {
  get: (_target, prop: string) => addonRegistry.get(prop) || DEFAULT_ADDON_PRODUCTS[prop],
  has: (_target, prop: string) => addonRegistry.has(prop),
});
