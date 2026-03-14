// Safe auth access — reads user from AuthContext without throwing when
// the component is rendered outside an AuthProvider (e.g. public marketing pages).
import { useContext } from "react";
import { AuthContext } from "../../../auth/context/AuthContext.tsx";
import type { FeedbackUser } from "../utils/collectSystemContext.ts";

export function useOptionalUser(): FeedbackUser | null {
  const ctx = useContext(AuthContext);
  if (!ctx?.user) return null;
  const u = ctx.user as Record<string, unknown> & {
    _id?: string; id?: string;
    email?: string; name?: string; displayName?: string;
    firstName?: string; lastName?: string;
    role?: string;
    roles?: string[];
    rbac?: { role?: string };
  };
  return {
    id:      (u._id ?? u.id ?? null) as string | null,
    email:   (u.email ?? null) as string | null,
    name: (
      u.name ??
      u.displayName ??
      [u.firstName, u.lastName].filter(Boolean).join(" ") ||
      null
    ) as string | null,
    role:    (u.role ?? (u.roles as string[] | undefined)?.[0] ?? u.rbac?.role ?? null) as string | null,
    appRole: (u.rbac?.role ?? null) as string | null,
  };
}
