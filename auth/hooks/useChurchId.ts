import { useAuth } from "./useAuth.ts";
import type { User } from "../types/auth.types.ts";

/**
 * useChurchId — resolves the active church ID from the auth user object.
 *
 * The `currentChurch` field on the user can be either a string (plain ID) or
 * an object (populated church doc). This hook normalises both shapes into a
 * plain string ID so callers never need to repeat the ternary.
 *
 * @returns The resolved church ID, or null when unauthenticated.
 *
 * @example
 * const churchId = useChurchId();
 * // Use in queries:
 * const { data } = useApiQuery(["foo", churchId], () => api.get(churchId), { enabled: !!churchId });
 */
export function useChurchId(): string | null {
  const { user } = useAuth();

  if (!user) return null;

  const church = (user as User & { currentChurch?: string | { id?: string; _id?: string } }).currentChurch;
  if (!church) return null;

  return typeof church === "object"
    ? church.id ?? church._id ?? null
    : church;
}

export default useChurchId;
