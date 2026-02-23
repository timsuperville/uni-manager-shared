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
      const data = await request(`${API_BASE}/countries`);
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
      const data = await request(`${API_BASE}/countries/${countryCode}/states`);
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
      const data = await request(
        `${API_BASE}/countries/${countryCode}/states/${stateCode}/cities`,
      );
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
   * Get location details by coordinates
   * @param {number} latitude
   * @param {number} longitude
   */
  async getLocationByCoords(latitude, longitude) {
    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    try {
      const data = await request(
        `${API_BASE}/geocode?lat=${latitude}&lng=${longitude}`,
      );
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          `[LocationService] Failed to geocode coordinates:`,
          error,
        );
      }
      throw error;
    }
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
   * Detect country from browser settings
   */
  detectCountry() {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timeZone) return "";

      // Very basic mapping for common timezones
      if (timeZone.startsWith("America/")) return "US";
      if (timeZone.startsWith("Europe/London")) return "GB";
      if (timeZone.startsWith("Europe/")) return "DE"; // Fallback for Europe
      if (timeZone.startsWith("Asia/Tokyo")) return "JP";
      if (timeZone.startsWith("Australia/")) return "AU";

      return "";
    } catch (e) {
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
