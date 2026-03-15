/* eslint-disable no-console, no-undef */

import { getApiBaseUrl } from "../api/config/apiConfig.js";

const API_BASE_URL = getApiBaseUrl();
const API_BASE = `${API_BASE_URL}/api/v1/locations`;

// Helper for requests
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(endpoint, config);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};

// Simple in-memory cache
const cache = {
  data: {},
  set(key, value, ttl = 300000) {
    // 5 minutes default
    this.data[key] = {
      value,
      expiry: Date.now() + ttl,
    };
  },
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    if (Date.now() > item.expiry) {
      delete this.data[key];
      return null;
    }
    return item.value;
  },
  invalidate(pattern) {
    const regex = new RegExp(pattern);
    Object.keys(this.data).forEach((key) => {
      if (regex.test(key)) {
        delete this.data[key];
      }
    });
  },
};

/**
 * Location Service - Handles all location-related API calls
 */
export const LocationService = {
  /**
   * Get all countries
   */
  async getCountries() {
    const cacheKey = "countries";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request(`${API_BASE}/countries`);
      // Backend wraps in { success, data } — unwrap if needed
      const data = Array.isArray(raw) ? raw : (raw?.data ?? []);
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[LocationService] Failed to fetch countries:", error);
      }
      throw error;
    }
  },

  /**
   * Get states/provinces for a country
   * @param {string} countryCode - ISO country code (e.g., 'US', 'CA')
   */
  async getStates(countryCode) {
    if (!countryCode) {
      throw new Error("Country code is required");
    }

    const cacheKey = `states-${countryCode}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request(`${API_BASE}/countries/${countryCode}/states`);
      // Backend wraps in { success, data } or { subdivisions } — normalise
      const data = Array.isArray(raw) ? raw : (raw?.data ?? raw?.states ?? []);
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          `[LocationService] Failed to fetch states for ${countryCode}:`,
          error,
        );
      }
      throw error;
    }
  },

  /**
   * Get subdivisions (states/provinces/regions) for a country.
   * Calls the /subdivisions endpoint which returns the subdivision label,
   * flag emoji, and country name straight from @countrystatecity/countries.
   *
   * Returns { subdivisions, label, flag, country, countryCode }
   */
  async getSubdivisions(countryCode) {
    if (!countryCode)
      return { subdivisions: [], label: "Province / State", flag: null };
    const cacheKey = `subdivisions-${countryCode}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    try {
      const raw = await request(
        `${API_BASE}/subdivisions?country=${encodeURIComponent(countryCode)}`,
      );
      // Backend returns { success: true, data: [{ code, name }] } via formatSuccess.
      // raw.data is the array; raw.subdivisions would only exist on a legacy shape.
      const subdivisionArray = raw?.data ?? raw?.subdivisions ?? [];
      const result = {
        subdivisions: subdivisionArray,
        label: raw?.label ?? "Province / State",
        flag: raw?.flag ?? null,
        country: raw?.country ?? null,
        countryCode: raw?.countryCode ?? countryCode,
      };
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          `[LocationService] Failed to fetch subdivisions for ${countryCode}:`,
          error,
        );
      }
      throw error;
    }
  },

  /**
   * Get a single enriched country record (includes flag emoji, phone code, etc).
   * @param {string} code - ISO-2 country code
   * @returns {Promise<object|null>}
   */
  async getCountry(code) {
    if (!code) return null;
    const cacheKey = `country-${code.toUpperCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    try {
      const raw = await request(
        `${API_BASE}/countries/${encodeURIComponent(code)}`,
      );
      const data = raw?.data ?? null;
      if (data) cache.set(cacheKey, data, 3600000); // 1 hour
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          `[LocationService] Failed to fetch country ${code}:`,
          error,
        );
      }
      return null;
    }
  },

  /**
   * Get cities for a state
   * @param {string} countryCode - ISO country code
   * @param {string} stateCode - State/province code
   */
  async getCities(countryCode, stateCode) {
    if (!countryCode || !stateCode) {
      throw new Error("Country code and state code are required");
    }

    const cacheKey = `cities-${countryCode}-${stateCode}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request(
        `${API_BASE}/countries/${countryCode}/states/${stateCode}/cities`,
      );
      const data = Array.isArray(raw) ? raw : (raw?.data ?? raw?.cities ?? []);
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          `[LocationService] Failed to fetch cities for ${countryCode}/${stateCode}:`,
          error,
        );
      }
      throw error;
    }
  },

  /**
   * Get address format hints for a country.
   * Returns sensible defaults so callers never crash even if backend
   * does not have a dedicated /address-format endpoint.
   */
  async getAddressFormat(countryCode) {
    const cacheKey = `address-format-${countryCode}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const raw = await request(`${API_BASE}/address-formats/${countryCode}`);
      const data = (raw?.data ?? raw) || null;
      if (data) cache.set(cacheKey, data, 3600000);
      return data;
    } catch (_err) {
      // Non-fatal — return reasonable defaults
      const defaults = {
        postalCodeLabel: countryCode === "CA" ? "Postal Code" : "ZIP Code",
        postalCodeRegex: null,
        stateLabel: countryCode === "CA" ? "Province" : "State",
      };
      cache.set(cacheKey, defaults, 3600000);
      return defaults;
    }
  },

  /**
   * Reverse geocode coordinates to a human-readable location.
   * Uses the Nominatim OpenStreetMap API directly — no backend endpoint needed.
   * Returns { city, countryCode, state } or null on failure.
   */
  async reverseGeocode(latitude, longitude) {
    if (!latitude || !longitude) return null;
    try {
      // Nominatim requires a descriptive User-Agent per their usage policy
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        {
          headers: {
            "Accept-Language": navigator?.language || "en",
            "User-Agent": "Uni-Manager/1.0 (church-discovery)",
          },
        },
      );
      if (!resp.ok) return null;
      const data = await resp.json();
      const addr = data?.address ?? {};
      return {
        // Nominatim uses different keys for settlement names by country
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
    } catch (_err) {
      return null;
    }
  },

  /**
   * Search locations by name
   * @param {string} query - Search query
   * @param {string} type - Type of location ('country', 'state', 'city')
   */
  async searchLocations(query, type = "all") {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `search-${type}-${query}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await request(
        `${API_BASE}/search?q=${encodeURIComponent(query)}&type=${type}`,
      );
      cache.set(cacheKey, data, 60000); // 1 minute for searches
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`[LocationService] Failed to search locations:`, error);
      }
      throw error;
    }
  },

  /**
   * Get location details by coordinates.
   * @deprecated — use reverseGeocode() directly; the backend /geocode endpoint
   * was never implemented. Kept for any existing call sites.
   */
  async getLocationByCoords(latitude, longitude) {
    return this.reverseGeocode(latitude, longitude);
  },

  /**
   * Get user's current location (requires geolocation permission)
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
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
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    });
  },

  /**
   * Detect country from browser's IANA timezone.
   *
   * IMPORTANT: Canadian timezones share the "America/" prefix with the US.
   * The explicit CA allowlist MUST be checked before the broad America/ catch.
   * Covers all Canadian IANA zones including Pacific, Mountain, Central,
   * Eastern, Atlantic, Newfoundland, and the territorial zones.
   */
  detectCountry() {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timeZone) return "";

      // ── Canada — must come before the broad America/ catch ────────────────
      const CANADA_TZ = new Set([
        "America/Toronto", // ON, QC (most of Eastern Canada)
        "America/Vancouver", // BC
        "America/Edmonton", // AB
        "America/Calgary", // AB
        "America/Winnipeg", // MB, SK (observing DST)
        "America/Regina", // SK (no DST)
        "America/Swift_Current", // SK
        "America/Halifax", // NS, PE, NB
        "America/Moncton", // NB
        "America/Glace_Bay", // NS
        "America/St_Johns", // NL
        "America/Whitehorse", // YT
        "America/Dawson", // YT
        "America/Yellowknife", // NT
        "America/Inuvik", // NT
        "America/Iqaluit", // NU
        "America/Rankin_Inlet", // NU
        "America/Resolute", // NU
        "America/Creston", // BC (no DST)
        "America/Dawson_Creek", // BC/AB border
        "America/Fort_Nelson", // BC
      ]);
      if (CANADA_TZ.has(timeZone)) return "CA";

      // ── Other America/ zones → United States ───────────────────────────────
      if (timeZone.startsWith("America/")) return "US";

      // ── Other regions ───────────────────────────────────────────────────────
      if (timeZone === "Europe/London") return "GB";
      if (timeZone.startsWith("Europe/")) return "EU";
      if (timeZone === "Asia/Tokyo") return "JP";
      if (timeZone === "Asia/Kolkata") return "IN";
      if (timeZone.startsWith("Australia/") || timeZone === "Pacific/Auckland")
        return "AU";

      return "";
    } catch (_err) {
      return "";
    }
  },

  /**
   * Clear location cache
   * @param {string} pattern - Optional regex pattern to match keys
   */
  clearCache(pattern = null) {
    if (pattern) {
      cache.invalidate(pattern);
    } else {
      cache.data = {};
    }
  },
};
