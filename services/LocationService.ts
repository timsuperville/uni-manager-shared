import { getApiBaseUrl } from "../api/config/apiConfig.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocationRecord {
  [key: string]: unknown;
}

export interface SubdivisionData {
  code: string;
  name: string;
  [key: string]: unknown;
}

export interface SubdivisionsResult {
  subdivisions: SubdivisionData[];
  label: string;
  flag: string | null;
  country: string | null;
  countryCode: string;
}

export interface AddressFormatResult {
  postalCodeLabel: string;
  postalCodeRegex: RegExp | null;
  stateLabel: string;
  [key: string]: unknown;
}

export interface ReverseGeocodeResult {
  city: string | null;
  countryCode: string | null;
  state: string | null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const API_BASE_URL = getApiBaseUrl() as string;
const API_BASE = `${API_BASE_URL}/api/v1/locations`;

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(endpoint, { ...options, headers });
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json() as Promise<T>;
}

interface CacheItem {
  value: unknown;
  expiry: number;
}

const cache = {
  data: {} as Record<string, CacheItem>,

  set(key: string, value: unknown, ttl = 300_000): void {
    this.data[key] = { value, expiry: Date.now() + ttl };
  },

  get<T = unknown>(key: string): T | null {
    const item = this.data[key];
    if (!item) return null;
    if (Date.now() > item.expiry) {
      delete this.data[key];
      return null;
    }
    return item.value as T;
  },

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    Object.keys(this.data).forEach((key) => {
      if (regex.test(key)) delete this.data[key];
    });
  },
};

// ---------------------------------------------------------------------------
// Service object
// ---------------------------------------------------------------------------

export const LocationService = {
  async getCountries(): Promise<LocationRecord[]> {
    const cacheKey = "countries";
    const cached = cache.get<LocationRecord[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request<unknown>(`${API_BASE}/countries`);
      const data = Array.isArray(raw)
        ? raw
        : (((raw as Record<string, unknown>)?.data as LocationRecord[]) ?? []);
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("[LocationService] Failed to fetch countries:", error);
      throw error;
    }
  },

  async getStates(countryCode: string): Promise<LocationRecord[]> {
    if (!countryCode) throw new Error("Country code is required");

    const cacheKey = `states-${countryCode}`;
    const cached = cache.get<LocationRecord[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request<unknown>(
        `${API_BASE}/countries/${countryCode}/states`,
      );
      const r = raw as Record<string, unknown>;
      const data = Array.isArray(raw)
        ? raw
        : ((r?.data ?? r?.states ?? []) as LocationRecord[]);
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (import.meta.env.DEV)
        console.error(
          `[LocationService] Failed to fetch states for ${countryCode}:`,
          error,
        );
      throw error;
    }
  },

  async getSubdivisions(countryCode: string): Promise<SubdivisionsResult> {
    const fallback: SubdivisionsResult = {
      subdivisions: [],
      label: "Province / State",
      flag: null,
      country: null,
      countryCode,
    };
    if (!countryCode) return fallback;

    const cacheKey = `subdivisions-${countryCode}`;
    const cached = cache.get<SubdivisionsResult>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request<Record<string, unknown>>(
        `${API_BASE}/subdivisions?country=${encodeURIComponent(countryCode)}`,
      );
      const subdivisionArray = (raw?.data ??
        raw?.subdivisions ??
        []) as SubdivisionData[];
      const result: SubdivisionsResult = {
        subdivisions: subdivisionArray,
        label: (raw?.label as string) ?? "Province / State",
        flag: (raw?.flag as string | null) ?? null,
        country: (raw?.country as string | null) ?? null,
        countryCode: (raw?.countryCode as string) ?? countryCode,
      };
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      if (import.meta.env.DEV)
        console.error(
          `[LocationService] Failed to fetch subdivisions for ${countryCode}:`,
          error,
        );
      throw error;
    }
  },

  async getCountry(code: string): Promise<LocationRecord | null> {
    if (!code) return null;
    const cacheKey = `country-${code.toUpperCase()}`;
    const cached = cache.get<LocationRecord>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request<Record<string, unknown>>(
        `${API_BASE}/countries/${encodeURIComponent(code)}`,
      );
      const data = (raw?.data as LocationRecord) ?? null;
      if (data) cache.set(cacheKey, data, 3_600_000); // 1 hour
      return data;
    } catch (error) {
      if (import.meta.env.DEV)
        console.error(
          `[LocationService] Failed to fetch country ${code}:`,
          error,
        );
      return null;
    }
  },

  async getCities(
    countryCode: string,
    stateCode: string,
  ): Promise<LocationRecord[]> {
    if (!countryCode || !stateCode)
      throw new Error("Country code and state code are required");

    const cacheKey = `cities-${countryCode}-${stateCode}`;
    const cached = cache.get<LocationRecord[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request<unknown>(
        `${API_BASE}/countries/${countryCode}/states/${stateCode}/cities`,
      );
      const r = raw as Record<string, unknown>;
      const data = Array.isArray(raw)
        ? raw
        : ((r?.data ?? r?.cities ?? []) as LocationRecord[]);
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (import.meta.env.DEV)
        console.error(
          `[LocationService] Failed to fetch cities for ${countryCode}/${stateCode}:`,
          error,
        );
      throw error;
    }
  },

  async getAddressFormat(countryCode: string): Promise<AddressFormatResult> {
    const cacheKey = `address-format-${countryCode}`;
    const cached = cache.get<AddressFormatResult>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request<Record<string, unknown>>(
        `${API_BASE}/address-formats/${countryCode}`,
      );
      const data = ((raw?.data ?? raw) || null) as AddressFormatResult | null;
      if (data) cache.set(cacheKey, data, 3_600_000);
      return data ?? this._defaultAddressFormat(countryCode);
    } catch {
      const defaults = this._defaultAddressFormat(countryCode);
      cache.set(cacheKey, defaults, 3_600_000);
      return defaults;
    }
  },

  _defaultAddressFormat(countryCode: string): AddressFormatResult {
    return {
      postalCodeLabel: countryCode === "CA" ? "Postal Code" : "ZIP Code",
      postalCodeRegex: null,
      stateLabel: countryCode === "CA" ? "Province" : "State",
    };
  },

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodeResult | null> {
    if (!latitude || !longitude) return null;
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        {
          headers: {
            "Accept-Language": navigator?.language ?? "en",
            "User-Agent": "Uni-Manager/1.0 (church-discovery)",
          },
        },
      );
      if (!resp.ok) return null;
      const data = (await resp.json()) as { address?: Record<string, string> };
      const addr = data?.address ?? {};
      return {
        city:
          addr.city ??
          addr.town ??
          addr.village ??
          addr.municipality ??
          addr.county ??
          null,
        countryCode: addr.country_code?.toUpperCase() ?? null,
        state: addr.state ?? addr.province ?? addr.region ?? null,
      };
    } catch {
      return null;
    }
  },

  async searchLocations(
    query: string,
    type = "all",
  ): Promise<LocationRecord[]> {
    if (!query || query.length < 2) return [];

    const cacheKey = `search-${type}-${query}`;
    const cached = cache.get<LocationRecord[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await request<LocationRecord[]>(
        `${API_BASE}/search?q=${encodeURIComponent(query)}&type=${type}`,
      );
      cache.set(cacheKey, data, 60_000); // 1 minute for searches
      return data;
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("[LocationService] Failed to search locations:", error);
      throw error;
    }
  },

  /** @deprecated — use reverseGeocode() directly */
  async getLocationByCoords(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodeResult | null> {
    return this.reverseGeocode(latitude, longitude);
  },

  async getCurrentLocation(): Promise<ReverseGeocodeResult | null> {
    return new Promise<ReverseGeocodeResult | null>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const location = await this.getLocationByCoords(
              position.coords.latitude,
              position.coords.longitude,
            );
            resolve(location);
          } catch (error) {
            reject(error);
          }
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 5_000, maximumAge: 0 },
      );
    });
  },

  /**
   * Detect country from browser IANA timezone.
   * Canadian timezones share "America/" with the US — the explicit CA set
   * MUST be checked before the broad America/ catch.
   */
  detectCountry(): string {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timeZone) return "";

      const CANADA_TZ = new Set([
        "America/Toronto",
        "America/Vancouver",
        "America/Edmonton",
        "America/Calgary",
        "America/Winnipeg",
        "America/Regina",
        "America/Swift_Current",
        "America/Halifax",
        "America/Moncton",
        "America/Glace_Bay",
        "America/St_Johns",
        "America/Whitehorse",
        "America/Dawson",
        "America/Yellowknife",
        "America/Inuvik",
        "America/Iqaluit",
        "America/Rankin_Inlet",
        "America/Resolute",
        "America/Creston",
        "America/Dawson_Creek",
        "America/Fort_Nelson",
      ]);

      if (CANADA_TZ.has(timeZone)) return "CA";
      if (timeZone.startsWith("America/")) return "US";
      if (timeZone === "Europe/London") return "GB";
      if (timeZone.startsWith("Europe/")) return "EU";
      if (timeZone === "Asia/Tokyo") return "JP";
      if (timeZone === "Asia/Kolkata") return "IN";
      if (timeZone.startsWith("Australia/") || timeZone === "Pacific/Auckland")
        return "AU";
      return "";
    } catch {
      return "";
    }
  },

  clearCache(pattern: string | null = null): void {
    if (pattern) {
      cache.invalidate(pattern);
    } else {
      cache.data = {};
    }
  },
};
