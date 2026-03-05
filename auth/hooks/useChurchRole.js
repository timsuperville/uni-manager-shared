/**
 * useChurchRole — CH-036 CAHA Hook
 *
 * Resolves the calling user's role and ministry assignments within their
 * current church context. Uses the same 6-tier CAHA vocabulary as the backend
 * rbacMiddleware (visitor → viewer → attendee → member → volunteer → admin).
 *
 * This is the single source of truth for church-context role checks in any
 * Church app component or route guard. NEVER check user.roles directly for
 * church-contextual access control.
 *
 * @example
 * const { churchRole, ministryRoles, hasMinRole, isAdmin } = useChurchRole();
 *
 * if (hasMinRole('volunteer')) { ... }
 * if (isAdmin) { ... }
 */

import { useMemo } from "react";
import { useAuth } from "@shared/auth";

// ─── CAHA Role Tier Map ────────────────────────────────────────────────────────
// Mirrors backend/src/domains/apps/church/middleware/rbacMiddleware.js ROLE_TIER
const ROLE_TIER = {
    visitor: 0,
    viewer: 1,
    attendee: 2,
    member: 3,
    volunteer: 4,
    admin: 5,
};

/**
 * useChurchRole
 *
 * @returns {{
 *   churchRole: string,           // Effective CAHA role for current church
 *   churchRoleTier: number,       // Numeric tier (0–5)
 *   ministryRoles: Array,         // Array of { ministryId, role } objects
 *   membership: object|null,      // Raw church membership record from user.churches[]
 *   hasMinRole: (minRole: string) => boolean,  // Returns true if user tier >= minRole
 *   hasExactRole: (role: string) => boolean,   // Exact role match
 *   isAdmin: boolean,             // Shorthand: churchRole === 'admin' or platform admin
 *   isVolunteer: boolean,         // Shorthand: tier >= volunteer
 *   isMember: boolean,            // Shorthand: tier >= member
 *   isPlatformAdmin: boolean,     // True if user has platform-level admin or org_admin role
 *   currentChurchId: string|null, // Currently active church ID
 * }}
 */
export function useChurchRole() {
    const { user } = useAuth();

    return useMemo(() => {
        // No user → visitor defaults
        if (!user) {
            return buildResult("visitor", null, null, null);
        }

        // Platform admin always gets full access regardless of church membership
        const userRoles = user.roles || [];
        const isPlatformAdmin =
            userRoles.includes("admin") || userRoles.includes("org_admin");

        if (isPlatformAdmin) {
            return buildResult("admin", null, user.currentChurch, user, true);
        }

        // Resolve current church ID
        const currentChurchId =
            user.currentChurch?._id?.toString() ||
            user.currentChurch?.toString() ||
            null;

        if (!currentChurchId) {
            // User is authenticated but not in any church context → visitor
            return buildResult("visitor", null, null, user);
        }

        // Find membership in user.churches[]
        const membership = (user.churches || []).find((c) => {
            const churchId = c.church?._id?.toString() || c.church?.toString();
            return churchId === currentChurchId;
        });

        if (!membership) {
            // Authenticated but not a member of this church
            return buildResult("visitor", null, currentChurchId, user);
        }

        // Left members are demoted to visitor
        const effectiveRole =
            membership.status === "left"
                ? "visitor"
                : membership.role || "viewer";

        return buildResult(effectiveRole, membership, currentChurchId, user);
    }, [user]);
}

// ─── Internal Builder ─────────────────────────────────────────────────────────

function buildResult(
    churchRole,
    membership,
    currentChurchId,
    user,
    isPlatformAdmin = false
) {
    const tier = ROLE_TIER[churchRole] ?? 0;
    const ministryRoles = membership?.ministryRoles || [];

    return {
        churchRole,
        churchRoleTier: tier,
        ministryRoles,
        membership: membership || null,
        currentChurchId,
        isPlatformAdmin:
            isPlatformAdmin ||
            !!(user?.roles?.includes("admin") || user?.roles?.includes("org_admin")),

        /**
         * Returns true if the user's effective church tier is >= minRole.
         * Mirrors backend requireChurchRole() logic exactly.
         */
        hasMinRole: (minRole) => {
            const minTier = ROLE_TIER[minRole];
            if (minTier === undefined) {
                console.warn(
                    `useChurchRole.hasMinRole: unknown role "${minRole}". Valid: ${Object.keys(ROLE_TIER).join(", ")}`
                );
                return false;
            }
            return isPlatformAdmin || tier >= minTier;
        },

        /**
         * Returns true if the user's church role exactly matches.
         */
        hasExactRole: (role) => churchRole === role,

        /**
         * Checks if the user has a specific role in a given ministry.
         */
        hasMinistryRole: (ministryId, minRole) => {
            if (isPlatformAdmin) return true;
            const entry = ministryRoles.find(
                (m) =>
                    (m.ministry?._id?.toString() || m.ministry?.toString()) ===
                    ministryId?.toString()
            );
            if (!entry) return false;
            const entryTier = ROLE_TIER[entry.role] ?? 0;
            const minTier = ROLE_TIER[minRole] ?? 0;
            return entryTier >= minTier;
        },

        // Convenience shorthands
        isAdmin: isPlatformAdmin || tier >= ROLE_TIER.admin,
        isVolunteer: isPlatformAdmin || tier >= ROLE_TIER.volunteer,
        isMember: isPlatformAdmin || tier >= ROLE_TIER.member,
    };
}

export default useChurchRole;
