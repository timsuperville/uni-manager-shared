/**
 * useHospitalityBridge — Cross-App Contract 5: Church → Home Hospitality Loop
 *
 * Pushes a sanitized church event payload to the Home App's hospitality endpoint
 * when a small-group or in-home event is saved. The Home App then generates a
 * SecureVault Prep Checklist and a "Hosting Routine" task cluster for the household.
 *
 * Privacy guarantee: this hook NEVER sends CRM contact details — only:
 *   - churchEventId, churchEventTitle, eventType
 *   - scheduledAt
 *   - householdId (the host's identifier)
 *   - guestCount (number only)
 *   - dietaryFlags (enum array — no personal names)
 *
 * Usage:
 *   const { pushHospitalityEvent, isLoading, error, lastEventId } = useHospitalityBridge();
 *   await pushHospitalityEvent({ churchEventId, ... });
 */

import { useState, useCallback } from 'react';
import { getApiClient } from '../api/core/ApiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HospitalityEventType =
  | 'small-group'
  | 'in-home'
  | 'bible-study'
  | 'prayer-meeting'
  | 'other';

export type DietaryFlag =
  | 'nut_allergy'
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'halal'
  | 'kosher'
  | 'lactose_intolerant'
  | 'other';

export interface HospitalityEventPayload {
  churchEventId: string;
  churchEventTitle?: string;
  eventType?: HospitalityEventType;
  scheduledAt: string | Date;
  householdId: string;
  guestCount?: number;
  dietaryFlags?: DietaryFlag[];
}

export interface UseHospitalityBridgeResult {
  pushHospitalityEvent: (
    payload: HospitalityEventPayload
  ) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
  lastEventId: string | null;
}

interface HospitalityApiResponse {
  success: boolean;
  message?: string;
  data?: { _id?: string };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_DIETARY_FLAGS = new Set<DietaryFlag>([
  'nut_allergy',
  'vegetarian',
  'vegan',
  'gluten_free',
  'halal',
  'kosher',
  'lactose_intolerant',
  'other'
]);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useHospitalityBridge(): UseHospitalityBridgeResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const pushHospitalityEvent = useCallback(
    async (payload: HospitalityEventPayload): Promise<string | null> => {
      const {
        churchEventId,
        churchEventTitle,
        eventType = 'small-group',
        scheduledAt,
        householdId,
        guestCount = 1,
        dietaryFlags = []
      } = payload;

      if (!churchEventId || !scheduledAt || !householdId) {
        setError('churchEventId, scheduledAt, and householdId are required');
        return null;
      }

      // Sanitize dietary flags — only allow valid enum values
      const sanitizedFlags = dietaryFlags.filter(f =>
        VALID_DIETARY_FLAGS.has(f)
      );

      // Build sanitized payload — NO CRM contact details
      const sanitizedPayload = {
        churchEventId,
        churchEventTitle: churchEventTitle ?? 'Church Gathering',
        eventType,
        scheduledAt:
          scheduledAt instanceof Date ? scheduledAt.toISOString() : scheduledAt,
        householdId,
        guestCount: Math.max(1, Math.min(500, Number(guestCount) || 1)),
        dietaryFlags: sanitizedFlags
      };

      setIsLoading(true);
      setError(null);

      try {
        const apiClient = getApiClient();
        const res = await apiClient.post<HospitalityApiResponse>(
          '/api/v1/home/hospitality/events',
          sanitizedPayload
        );

        const json = res.data;
        if (!json.success)
          throw new Error(json.message ?? 'Hospitality push failed');

        const eventId = json.data?._id ?? null;
        setLastEventId(eventId);
        return eventId;
      } catch (err: unknown) {
        // Fail silently — Church App must never block on Home App availability
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { pushHospitalityEvent, isLoading, error, lastEventId };
}
