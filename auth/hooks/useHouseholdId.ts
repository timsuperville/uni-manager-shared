import { useAuth } from './useAuth';

/**
 * useHouseholdId — resolves the active household ID from the auth user object or session layer.
 *
 * It checks session storage, local storage, and the `householdId` / `household._id`
 * properties directly on the user object.
 *
 * @returns The resolved household ID, or null when not found.
 *
 * @example
 * const householdId = useHouseholdId();
 * // Use in queries:
 * const { data } = useApiQuery(["dashboard", householdId], () => api.get(householdId), { enabled: !!householdId });
 */
export function useHouseholdId(): string | null {
  const { user } = useAuth();

  const storedId =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('currentHouseholdId') ||
        localStorage.getItem('currentHouseholdId')
      : null;

  if (storedId) {
    return storedId;
  }

  if (!user) return null;

  const u = user as any;
  if (u.householdId) return String(u.householdId);
  if (u.household?._id) return String(u.household._id);
  if (u.household?.id) return String(u.household.id);

  return null;
}

export default useHouseholdId;
