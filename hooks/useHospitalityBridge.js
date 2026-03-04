/**
 * useHospitalityBridge — Cross-App Contract 5: Church → Home Hospitality Loop
 *
 * Pushes a sanitized church event payload to the Home App's hospitality endpoint
 * when a small-group or in-home event is saved. The Home App then generates a
 * Sanctuary Prep Checklist and a "Hosting Ritual" task cluster for the household.
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
 *   await pushHospitalityEvent({ churchEventId, churchEventTitle, eventType, scheduledAt, householdId, guestCount, dietaryFlags });
 */

import { useState, useCallback } from 'react';

const VALID_DIETARY_FLAGS = [
    'nut_allergy', 'vegetarian', 'vegan', 'gluten_free',
    'halal', 'kosher', 'lactose_intolerant', 'other'
];

/**
 * @returns {{ pushHospitalityEvent: Function, isLoading: boolean, error: string|null, lastEventId: string|null }}
 */
export function useHospitalityBridge() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastEventId, setLastEventId] = useState(null);

    /**
     * Push a hospitality event to the Home App.
     * @param {Object} payload
     * @param {string} payload.churchEventId
     * @param {string} [payload.churchEventTitle]
     * @param {'small-group'|'in-home'|'bible-study'|'prayer-meeting'|'other'} [payload.eventType]
     * @param {string|Date} payload.scheduledAt
     * @param {string} payload.householdId
     * @param {number} [payload.guestCount=1]
     * @param {string[]} [payload.dietaryFlags=[]]
     */
    const pushHospitalityEvent = useCallback(async (payload) => {
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
        const sanitizedFlags = (dietaryFlags || []).filter(f => VALID_DIETARY_FLAGS.includes(f));

        // Build sanitized payload — NO CRM contact details
        const sanitizedPayload = {
            churchEventId,
            churchEventTitle: churchEventTitle || 'Church Gathering',
            eventType,
            scheduledAt: scheduledAt instanceof Date ? scheduledAt.toISOString() : scheduledAt,
            householdId,
            guestCount: Math.max(1, Math.min(500, Number(guestCount) || 1)),
            dietaryFlags: sanitizedFlags
        };

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/v1/home/hospitality/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(sanitizedPayload)
            });

            const json = await res.json();
            if (!json.success) throw new Error(json.message || 'Hospitality push failed');

            const eventId = json.data?._id || null;
            setLastEventId(eventId);
            return eventId;
        } catch (err) {
            // Fail silently — Church App must never block on Home App availability
            setError(err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { pushHospitalityEvent, isLoading, error, lastEventId };
}
