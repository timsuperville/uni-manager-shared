import { useAuth } from "./useAuth.js";

/**
 * useChurchId — resolves the active church ID from the auth user object.
 *
 * The `currentChurch` field on the user can be either a string (plain ID) or
 * an object (populated church doc). This hook normalises both shapes into a
 * plain string ID so callers never need to repeat the ternary.
 *
 * @returns {string | null} The resolved church ID, or null when unauthenticated.
 *
 * @example
 * const churchId = useChurchId();
 * // Use in queries:
 * const { data } = useApiQuery(["foo", churchId], () => api.get(churchId), { enabled: !!churchId });
 */
export function useChurchId() {
    const { user } = useAuth();
    if (!user?.currentChurch) return null;
    return typeof user.currentChurch === "object"
        ? user.currentChurch.id ?? user.currentChurch._id ?? null
        : user.currentChurch;
}
