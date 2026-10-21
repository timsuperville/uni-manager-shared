import type { AddOnProduct } from "./types.js";

export const ADDON_PRODUCTS: Record<string, AddOnProduct> = {
  logo_design: {
    id: "logo_design",
    name: "Vector Brand & Logo Identity Suite",
    description: "High-resolution SVG vector logos, business card ready files, favicon bundle, and brand book.",
    isRecurring: false,
    prices: {
      CAD: 19900, // $199.00 CAD
      USD: 14900, // $149.00 USD
      GBP: 11900, // £119.00 GBP
      EUR: 13900, // €139.00 EUR
    },
  },
  ai_voice_secretary: {
    id: "ai_voice_secretary",
    name: "24/7 AI Voice Dispatch & Receptionist",
    description: "Instant phone call answering, calendar booking, and SMS triage to technician phones.",
    isRecurring: true,
    prices: {
      CAD: 9900,  // $99.00 CAD / month
      USD: 7900,  // $79.00 USD / month
      GBP: 6900,  // £69.00 GBP / month
      EUR: 7900,  // €79.00 EUR / month
    },
  },
  local_visitor_radar: {
    id: "local_visitor_radar",
    name: "Local Visitor & Call Radar",
    description: "Real-time edge visitor analytics, geographic caller heatmaps, and conversion tracking.",
    isRecurring: true,
    prices: {
      CAD: 1900,  // $19.00 CAD / month
      USD: 1400,  // $14.00 USD / month
      GBP: 1200,  // £12.00 GBP / month
      EUR: 1400,  // €14.00 EUR / month
    },
  },
};

export function getAddOn(id: string): AddOnProduct | undefined {
  return ADDON_PRODUCTS[id];
}
