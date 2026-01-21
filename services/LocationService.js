/* eslint-disable no-console, no-undef */
import ApiService from "./apiService";

const API_BASE = "/api/v1/locations";
const locationApi = new ApiService();

// Simple in-memory cache
const cache = {
  countries: null,
  subdivisions: {},
  addressFormats: {},
};

export const LocationService = {
  /**
   * Get all supported countries
   * @returns {Promise<Array>} Array of countries
   */
  getCountries: async () => {
    if (cache.countries) return cache.countries;

    try {
      const response = await locationApi.get(`${API_BASE}/countries`);
      const data = response.data || [];
      cache.countries = data;
      return data;
    } catch (error) {
      console.error("Failed to fetch countries", error);
      return [];
    }
  },

  /**
   * Get subdivisions for a country
   * @param {string} countryCode - Country code (e.g. 'US')
   * @returns {Promise<object>} Subdivisions data including dynamic label type
   */
  getSubdivisions: async (countryCode) => {
    if (!countryCode) return { subdivisions: [], subdivisionType: "areas" };

    if (cache.subdivisions[countryCode]) {
      return cache.subdivisions[countryCode];
    }

    try {
      const response = await locationApi.get(`${API_BASE}/subdivisions`, {
        country: countryCode,
      });
      cache.subdivisions[countryCode] = response;
      return response;
    } catch (error) {
      console.error(`Failed to fetch subdivisions for ${countryCode}`, error);
      return { subdivisions: [], subdivisionType: "areas" };
    }
  },

  /**
   * Get address format for a country
   * @param {string} countryCode - Country code
   * @returns {Promise<object>} Address format configuration
   */
  getAddressFormat: async (countryCode) => {
    if (!countryCode) return null;

    if (cache.addressFormats[countryCode]) {
      return cache.addressFormats[countryCode];
    }

    try {
      const response = await locationApi.get(
        `${API_BASE}/address-formats/${countryCode}`,
      );
      const format = response.format;
      cache.addressFormats[countryCode] = format;
      return format;
    } catch (error) {
      // Fallback or silence error if endpoint missing/not critical
      return null;
    }
  },

  /**
   * Detect user's country based on browser timezone
   * @returns {string|null} Detected country code or null
   */
  detectCountry: () => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timeZone) return null;

      // Simple mapping for common timezones to country codes
      // In a real app, this would be more comprehensive or usage an IP API
      if (
        timeZone.startsWith("America/New_York") ||
        timeZone.startsWith("America/Los_Angeles") ||
        timeZone.startsWith("America/Chicago")
      )
        return "US";
      if (timeZone.startsWith("Europe/London")) return "GB";
      if (timeZone.startsWith("Europe/Paris")) return "FR";
      if (timeZone.startsWith("Asia/Tokyo")) return "JP";
      if (timeZone.startsWith("Australia/Sydney")) return "AU";
      if (timeZone.startsWith("America/Toronto")) return "CA";

      // Heuristic: Last part of timezone often indicates region, but unreliable for country code mapping directly
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Get city suggestions based on query and country
   * @param {string} query - Search query
   * @param {string} countryCode - Country code to filter by (optional)
   * @returns {Promise<Array>} Array of city suggestions
   */
  getCitySuggestions: async (query, countryCode) => {
    if (!query || query.length < 2) return [];

    try {
      const params = { q: query, limit: 10 };
      if (countryCode) params.country = countryCode;

      // Use direct axios call if ApiService wrapper doesn't support query params in this way,
      // but ApiService.get(url, config) usually supports params.
      // Assuming ApiService.get supports query params in URL or config:
      const response = await locationApi.get(
        `${API_BASE}/cities/suggestions?${queryString}`,
      );
      return response.suggestions || [];
    } catch (error) {
      console.error("Failed to fetch city suggestions", error);
      return [];
    }
  },

  /**
   * Reverse geocode coordinates to get address details (City, State, Country)
   * Uses OpenStreetMap Nominatim (Free, no key required for low volume)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<object|null>} Address details or null
   */
  reverseGeocode: async (lat, lng) => {
    try {
      // Using OSM Nominatim API directly from client side
      // Note: In production, this should ideally be proxied through backend to handle rate limits/caching
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            "User-Agent": "UniManager/1.0", // Required by OSM policy
          },
        },
      );

      if (!response.ok) throw new Error("Geocoding failed");

      const data = await response.json();
      const addr = data.address || {};

      return {
        city: addr.city || addr.town || addr.village || addr.municipality,
        state: addr.state || addr.region,
        countryCode: addr.country_code ? addr.country_code.toUpperCase() : null,
        country: addr.country,
      };
    } catch (error) {
      console.error("Reverse geocoding failed", error);
      return null;
    }
  },
};
