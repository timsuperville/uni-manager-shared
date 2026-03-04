/**
 * useCapacityBridge — Cross-App Contract 4: Personal → Church Capacity Bridge
 *
 * Queries the Personal App's capacity status endpoint for a given user ID.
 * Used by the Church Service Planner to surface Sovereign Capacity Conflict warnings
 * when rostering a volunteer for a high-intensity role.
 *
 * Privacy guarantee: This hook NEVER receives raw biometric data. The backend
 * classifies the signal into one of: 'optimal' | 'reduced' | 'low' | 'critical'
 * before transmission.
 *
 * Usage:
 *   const { capacityStatus, isLoading, consentGiven } = useCapacityBridge(userId);
 */

import { useState, useEffect, useRef } from "react";

const STATUS_CACHE = new Map(); // In-memory cache — keyed by userId, TTL 5 min
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * @param {string|null} userId - Target volunteer's user ID. Pass null to skip.
 * @returns {{ capacityStatus: string|null, consentGiven: boolean, message: string|null, isLoading: boolean, error: string|null }}
 */
export function useCapacityBridge(userId) {
  const [state, setState] = useState({
    capacityStatus: null,
    consentGiven: true,
    message: null,
    isLoading: false,
    error: null,
  });

  const abortRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      setState({
        capacityStatus: null,
        consentGiven: true,
        message: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Check cache first
    const cached = STATUS_CACHE.get(userId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setState({ ...cached.data, isLoading: false, error: null });
      return;
    }

    // Abort previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    fetch(`/api/v1/personal/capacity-status/${userId}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: abortRef.current.signal,
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success)
          throw new Error(json.message || "Capacity query failed");
        const data = {
          capacityStatus: json.data.capacityStatus,
          consentGiven: json.data.consentGiven !== false,
          message: json.data.message || null,
        };
        STATUS_CACHE.set(userId, { data, fetchedAt: Date.now() });
        setState({ ...data, isLoading: false, error: null });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        // Fail gracefully — never block the Church UI if Personal App is unreachable
        setState({
          capacityStatus: null,
          consentGiven: true,
          message: null,
          isLoading: false,
          error: err.message,
        });
      });

    return () => {
      abortRef.current?.abort();
    };
  }, [userId]);

  return state;
}
