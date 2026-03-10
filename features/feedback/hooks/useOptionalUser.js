// Safe auth access — reads user from AuthContext without throwing when
// the component is rendered outside an AuthProvider (e.g. public marketing pages).
import { useContext } from "react";
import { AuthContext } from "../../../auth/context/AuthContext.jsx";

export function useOptionalUser() {
    const ctx = useContext(AuthContext);
    if (!ctx?.user) return null;
    const u = ctx.user;
    return {
        id: u._id || u.id || null,
        email: u.email || null,
        name:
            u.name ||
            u.displayName ||
            [u.firstName, u.lastName].filter(Boolean).join(" ") ||
            null,
        role: u.role || u.roles?.[0] || u.rbac?.role || null,
        appRole: u.rbac?.role || null,
    };
}
