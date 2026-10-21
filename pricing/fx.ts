/**
 * Canonical Currency Exchange (FX) Engine
 * Powered by live Bank of Canada Valet Open API observations.
 */

export interface LiveExchangeRateResult {
  usdToCadRate: number;
  cadToUsdRate: number;
  source: "BANK_OF_CANADA_VALET" | "FALLBACK_HEDGED";
  observationDate?: string;
  fetchedAt: string;
}

// Canonical platform fallbacks (hedged baseline when network/BoC API is offline)
export const FALLBACK_USD_TO_CAD_RATE = 1.39;
export const FALLBACK_CAD_TO_USD_RATE = 0.72;

// Platform locked domain retail markup constant (53%)
export const LOCKED_DOMAIN_MARKUP_PERCENT = 0.53;

// Edge / runtime in-memory cache
let cachedFxResult: LiveExchangeRateResult | null = null;
let fxCacheExpiryTime = 0;
const FX_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Dynamically fetches the authoritative daily USD/CAD spot rate from the Bank of Canada.
 * Fallback to hedged baseline if API is unreachable.
 */
export async function fetchLiveUsdCadRate(): Promise<LiveExchangeRateResult> {
  const now = Date.now();
  if (cachedFxResult && now < fxCacheExpiryTime) {
    return cachedFxResult;
  }

  try {
    const bocUrl = "https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1";
    const res = await fetch(bocUrl, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      const observation = data?.observations?.[0];
      const rawRate = observation?.FXUSDCAD?.v;

      if (rawRate) {
        const usdToCad = parseFloat(rawRate);
        if (!isNaN(usdToCad) && usdToCad > 0.5 && usdToCad < 3.0) {
          const cadToUsd = Number((1 / usdToCad).toFixed(4));
          const result: LiveExchangeRateResult = {
            usdToCadRate: Number(usdToCad.toFixed(4)),
            cadToUsdRate: cadToUsd,
            source: "BANK_OF_CANADA_VALET",
            observationDate: observation.d,
            fetchedAt: new Date().toISOString(),
          };

          cachedFxResult = result;
          fxCacheExpiryTime = now + FX_CACHE_TTL_MS;
          return result;
        }
      }
    }
  } catch (err) {
    console.warn("Notice: Live Bank of Canada FX lookup fell back to hedged corridor:", err);
  }

  return {
    usdToCadRate: FALLBACK_USD_TO_CAD_RATE,
    cadToUsdRate: FALLBACK_CAD_TO_USD_RATE,
    source: "FALLBACK_HEDGED",
    fetchedAt: new Date().toISOString(),
  };
}
