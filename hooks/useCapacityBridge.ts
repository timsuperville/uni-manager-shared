/**
 * useCapacityBridge — Cross-App Contract 4: Personal → Church Capacity Bridge
 *
 * Queries the Personal App's capacity status endpoint for a given user ID.
 * Used by the Church Service Planner to surface UserOwned Capacity Conflict
 * warnings when rostering a volunteer for a high-intensity role.
 *
 * Privacy guarantee: This hook NEVER receives raw biometric data. The backend
 * classifies the signal into one of: 'optimal' | 'reduced' | 'low' | 'critical'
 * before transmission.
 *
 * Usage:
 *   const { capacityStatus, isLoading, consentGiven } = useCapacityBridge(userId);
 */

import { useState, useEffect, useRef } from 'react';
import { getApiClient } from '../api/core/ApiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CapacityStatus = 'optimal' | 'reduced' | 'low' | 'critical';

export interface CapacityBridgeState {
  capacityStatus: CapacityStatus | null;
  consentGiven: boolean;
  message: string | null;
  isLoading: boolean;
  error: string | null;
}

interface CapacityCacheEntry {
  data: Omit<CapacityBridgeState, 'isLoading' | 'error'>;
  fetchedAt: number;
}

interface CapacityApiResponse {
  success: boolean;
  message?: string;
  data: {
    capacityStatus: CapacityStatus;
    consentGiven?: boolean;
    message?: string | null;
  };
}

// ---------------------------------------------------------------------------
// Module-level in-memory cache (TTL 5 min)
// ---------------------------------------------------------------------------

const STATUS_CACHE = new Map<string, CapacityCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const INITIAL_STATE: CapacityBridgeState = {
  capacityStatus: null,
  consentGiven: true,
  message: null,
  isLoading: false,
  error: null
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param userId - Target volunteer's user ID. Pass `null` to skip fetching.
 */
export function useCapacityBridge(userId: string | null): CapacityBridgeState {
  const [state, setState] = useState<CapacityBridgeState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!userId) {
      setState(INITIAL_STATE);
      return;
    }

    // Check cache first
    const cached = STATUS_CACHE.get(userId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setState({ ...cached.data, isLoading: false, error: null });
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const apiClient = getApiClient();
    apiClient
      .get<CapacityApiResponse>(`/api/v1/personal/capacity-status/${userId}`, {
        signal: abortRef.current.signal
      })
      .then(res => {
        const json = res.data;
        if (!json.success) {
          throw new Error(json.message ?? 'Capacity query failed');
        }
        const data: Omit<CapacityBridgeState, 'isLoading' | 'error'> = {
          capacityStatus: json.data.capacityStatus,
          consentGiven: json.data.consentGiven !== false,
          message: json.data.message ?? null
        };
        STATUS_CACHE.set(userId, { data, fetchedAt: Date.now() });
        setState({ ...data, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Fail gracefully — never block the Church UI if Personal App is unreachable
        setState({
          ...INITIAL_STATE,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      });

    return () => {
      abortRef.current?.abort();
    };
  }, [userId]);

  return state;
}
