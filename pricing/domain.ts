import {
  LOCKED_DOMAIN_MARKUP_PERCENT,
  FALLBACK_USD_TO_CAD_RATE,
  FALLBACK_CAD_TO_USD_RATE,
  fetchLiveUsdCadRate,
  LiveExchangeRateResult
} from "./fx.js";

export interface DomainWholesaleEntry {
  tld: string;
  wholesaleCost: number;
  wholesaleCurrency: "USD" | "CAD";
  lastUpdated?: string;
  isLiveRate?: boolean;
}

/**
 * DEVELOPMENT & TEST FIXTURE REGISTRY
 * 
 * NOTE: This fixture is used strictly for offline unit tests and local development fallback.
 * TODO: Remove DEV_FIXTURE_WHOLESALE_REGISTRY and enforce strict live-only pricing once the platform
 * reaches stability with more than 5 active clients, ensuring 100% of quotes are sourced directly
 * from the live Cloudflare Registrar API / KV sync.
 */
export const DEV_FIXTURE_WHOLESALE_REGISTRY: Record<string, DomainWholesaleEntry> = {
  ".ca": { tld: ".ca", wholesaleCost: 11.00, wholesaleCurrency: "CAD", isLiveRate: false },
  ".com": { tld: ".com", wholesaleCost: 10.44, wholesaleCurrency: "USD", isLiveRate: false },
  ".org": { tld: ".org", wholesaleCost: 12.50, wholesaleCurrency: "USD", isLiveRate: false },
  ".net": { tld: ".net", wholesaleCost: 13.50, wholesaleCurrency: "USD", isLiveRate: false },
  ".co": { tld: ".co", wholesaleCost: 22.00, wholesaleCurrency: "USD", isLiveRate: false },
  ".io": { tld: ".io", wholesaleCost: 40.00, wholesaleCurrency: "USD", isLiveRate: false },
};

// Backwards compatibility alias
export const WHOLESALE_TLD_REGISTRY = DEV_FIXTURE_WHOLESALE_REGISTRY;

export interface DomainPricingRule {
  markupPercentage: number; // Locked at 0.53 (53%)
  usdToCadRate: number;     // e.g. from Bank of Canada Valet
  cadToUsdRate: number;     // e.g. from Bank of Canada Valet
}

export const DEFAULT_DOMAIN_PRICING_RULES: DomainPricingRule = {
  markupPercentage: LOCKED_DOMAIN_MARKUP_PERCENT,
  usdToCadRate: FALLBACK_USD_TO_CAD_RATE,
  cadToUsdRate: FALLBACK_CAD_TO_USD_RATE,
};

export interface DomainQuote {
  tld: string;
  domain: string;
  available: boolean;
  isLiveRegistryRate: boolean;
  retailPrice: {
    CAD: number;
    USD: number;
  };
  formattedCAD: string;
  formattedUSD: string;
  wholesaleCostCAD: number;
  wholesaleCostUSD: number;
  markupPercent: number;
  annualProfitCAD: number;
  fxSource?: string;
}

// In-memory cache on edge worker isolate
let cachedLiveRegistry: Record<string, DomainWholesaleEntry> | null = null;
let registrarCacheExpiryTime = 0;
const REGISTRAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Dynamically fetches live wholesale pricing from Cloudflare Registrar API.
 * Falls back to verified dev fixture if API is unreachable.
 */
export async function fetchLiveWholesaleRegistry(
  apiToken?: string,
  accountId?: string
): Promise<Record<string, DomainWholesaleEntry>> {
  const now = Date.now();
  if (cachedLiveRegistry && now < registrarCacheExpiryTime) {
    return cachedLiveRegistry;
  }

  if (!apiToken || !accountId) {
    return DEV_FIXTURE_WHOLESALE_REGISTRY;
  }

  try {
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/registrar/domains/pricing`;
    const res = await fetch(cfUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.success && Array.isArray(data.result)) {
        const liveRegistry: Record<string, DomainWholesaleEntry> = { ...DEV_FIXTURE_WHOLESALE_REGISTRY };

        for (const item of data.result) {
          const tldRaw = item.tld ? (item.tld.startsWith(".") ? item.tld : `.${item.tld}`) : null;
          if (tldRaw && item.registration_fee) {
            liveRegistry[tldRaw] = {
              tld: tldRaw,
              wholesaleCost: parseFloat(item.registration_fee),
              wholesaleCurrency: (item.currency || "USD").toUpperCase() === "CAD" ? "CAD" : "USD",
              lastUpdated: new Date().toISOString(),
              isLiveRate: true,
            };
          }
        }

        cachedLiveRegistry = liveRegistry;
        registrarCacheExpiryTime = now + REGISTRAR_CACHE_TTL_MS;
        return liveRegistry;
      }
    }
  } catch (err) {
    console.warn("Notice: Cloudflare live registrar pricing query fell back to base fixture:", err);
  }

  return DEV_FIXTURE_WHOLESALE_REGISTRY;
}

/**
 * Calculates deterministic retail pricing with locked 53% markup over live wholesale cost and BoC FX.
 */
export function calculateDomainQuote(
  domainName: string,
  available: boolean = true,
  rules: DomainPricingRule = DEFAULT_DOMAIN_PRICING_RULES,
  dynamicRegistry?: Record<string, DomainWholesaleEntry>
): DomainQuote {
  const cleanDomain = domainName.trim().toLowerCase();
  const dotIndex = cleanDomain.lastIndexOf(".");
  const tld = dotIndex !== -1 ? cleanDomain.slice(dotIndex) : ".ca";

  const entry = dynamicRegistry?.[tld] || DEV_FIXTURE_WHOLESALE_REGISTRY[tld] || {
    tld,
    wholesaleCost: 12.00,
    wholesaleCurrency: "USD" as const,
    isLiveRate: false,
  };

  // 1. Calculate wholesale in both currencies
  let costCAD: number;
  let costUSD: number;

  if (entry.wholesaleCurrency === "CAD") {
    costCAD = entry.wholesaleCost;
    costUSD = Number((entry.wholesaleCost * rules.cadToUsdRate).toFixed(2));
  } else {
    costUSD = entry.wholesaleCost;
    costCAD = Number((entry.wholesaleCost * rules.usdToCadRate).toFixed(2));
  }

  // 2. Apply locked 53% markup over wholesale
  const rawTargetCAD = costCAD * (1 + rules.markupPercentage);
  const rawTargetUSD = costUSD * (1 + rules.markupPercentage);

  // 3. Clean rounding to standard integer dollar price points ($18, $23, $27, etc.)
  const retailCAD = Math.ceil(rawTargetCAD);
  const retailUSD = Math.ceil(rawTargetUSD);

  const profitCAD = Number((retailCAD - costCAD).toFixed(2));

  return {
    tld,
    domain: cleanDomain,
    available,
    isLiveRegistryRate: Boolean(entry.isLiveRate),
    retailPrice: {
      CAD: retailCAD,
      USD: retailUSD,
    },
    formattedCAD: `$${retailCAD}.00 CAD / yr`,
    formattedUSD: `$${retailUSD}.00 USD / yr`,
    wholesaleCostCAD: costCAD,
    wholesaleCostUSD: costUSD,
    markupPercent: Math.round(rules.markupPercentage * 100),
    annualProfitCAD: profitCAD,
  };
}
