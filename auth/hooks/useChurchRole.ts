import { useMemo } from "react";
import { useAuth } from "@shared/auth";

// ── CAHA Role Tier Map ────────────────────────────────────────────────────────
// Mirrors backend/src/domains/apps/church/middleware/rbacMiddleware.js ROLE_TIER
const ROLE_TIER: Record<string, number> = {
  visitor: 0,
  viewer: 1,
  attendee: 2,
  member: 3,
  volunteer: 4,
  admin: 5,
};

type CahaRole = keyof typeof ROLE_TIER;

// ── Types ─────────────────────────────────────────────────────────────────────

interface GrantedTool {
  toolId: string;
  canView: boolean;
  canEdit: boolean;
}

interface MinistryRole {
  ministry?: {
    _id?: string;
    grantedTools?: Array<{ toolId?: string; canView?: boolean; canEdit?: boolean }>;
  };
  grantedTools?: Array<{ toolId?: string; canView?: boolean; canEdit?: boolean }>;
  role?: string;
}

interface Membership {
  status?: string;
  role?: string;
  ministryRoles?: MinistryRole[];
  church?: { _id?: string } | string;
}

interface UseChurchRoleReturn {
  churchRole: string;
  churchRoleTier: number;
  ministryRoles: MinistryRole[];
  membership: Membership | null;
  currentChurchId: string | null;
  isPlatformAdmin: boolean;
  resolvedTools: GrantedTool[];
  hasGrantedTool: (toolId: string) => boolean;
  canEditTool: (toolId: string) => boolean;
  hasMinRole: (minRole: CahaRole) => boolean;
  hasExactRole: (role: string) => boolean;
  hasMinistryRole: (ministryId: string, minRole: CahaRole) => boolean;
  isAdmin: boolean;
  isVolunteer: boolean;
  isMember: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useChurchRole — CH-036 CAHA Hook.
 *
 * Resolves the calling user's role and ministry assignments within their
 * current church context. Uses the 6-tier CAHA vocabulary:
 * visitor → viewer → attendee → member → volunteer → admin.
 *
 * This is the single source of truth for church-context role checks.
 * NEVER check user.roles directly for church-context access control.
 */
export function useChurchRole(): UseChurchRoleReturn {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return buildResult("visitor", null, null, null);
    }

    type ExtUser = typeof user & {
      roles?: string[];
      currentChurch?: { _id?: string | { toString(): string } } | string;
      churches?: Membership[];
    };
    const u = user as ExtUser;
    const userRoles = u.roles ?? [];
    const isPlatformAdmin =
      userRoles.includes("admin") || userRoles.includes("org_admin");

    if (isPlatformAdmin) {
      const adminChurchId =
        (typeof u.currentChurch === "object" && u.currentChurch !== null
          ? u.currentChurch._id?.toString() ?? null
          : typeof u.currentChurch === "string"
            ? u.currentChurch
            : null);
      return buildResult("admin", null, adminChurchId, u, true);
    }

    const currentChurchId =
      (typeof u.currentChurch === "object" && u.currentChurch !== null
        ? u.currentChurch._id?.toString() ?? null
        : typeof u.currentChurch === "string"
          ? u.currentChurch
          : null);

    if (!currentChurchId) {
      return buildResult("visitor", null, null, u);
    }

    // u.churches is string[] in the canonical User type but holds Membership objects at runtime;
    // cast to the richer shape that the API returns.
    const memberships = (u.churches ?? []) as unknown as Membership[];
    const membership = memberships.find((c) => {
      const churchId =
        typeof c.church === "object" && c.church !== null
          ? c.church._id?.toString()
          : typeof c.church === "string"
            ? c.church
            : undefined;
      return churchId === currentChurchId;
    });

    if (!membership) {
      return buildResult("visitor", null, currentChurchId, u);
    }

    const effectiveRole =
      membership.status === "left" ? "visitor" : membership.role ?? "viewer";

    return buildResult(effectiveRole, membership, currentChurchId, u);
  }, [user]);
}

// ── Internal Builder ──────────────────────────────────────────────────────────

function buildResult(
  churchRole: string,
  membership: Membership | null,
  currentChurchId: string | null,
  user: (typeof useAuth extends () => infer R ? R : never)["user"] | null,
  isPlatformAdmin = false,
): UseChurchRoleReturn {
  const tier = ROLE_TIER[churchRole] ?? 0;
  const ministryRoles = membership?.ministryRoles ?? [];

  // Resolve granted tools — union of grantedTools[] across all ministries
  const toolMap = new Map<string, GrantedTool>();
  for (const mr of ministryRoles) {
    const granted = mr.ministry?.grantedTools ?? mr.grantedTools ?? [];
    for (const t of granted) {
      if (!t?.toolId) continue;
      const existing = toolMap.get(t.toolId);
      if (existing) {
        existing.canView = existing.canView || !!t.canView;
        existing.canEdit = existing.canEdit || !!t.canEdit;
      } else {
        toolMap.set(t.toolId, {
          toolId: t.toolId,
          canView: !!t.canView,
          canEdit: !!t.canEdit,
        });
      }
    }
  }
  const resolvedTools = Array.from(toolMap.values());

  const extUser = user as (typeof user & { roles?: string[] }) | null;
  const effectivePlatformAdmin =
    isPlatformAdmin ||
    !!(extUser?.roles?.includes("admin") || extUser?.roles?.includes("org_admin"));

  return {
    churchRole,
    churchRoleTier: tier,
    ministryRoles,
    membership: membership ?? null,
    currentChurchId,
    isPlatformAdmin: effectivePlatformAdmin,
    resolvedTools,

    hasGrantedTool: (toolId: string) => {
      if (effectivePlatformAdmin || tier >= (ROLE_TIER["admin"] ?? 0)) return true;
      return (toolMap.get(toolId)?.canView ?? false);
    },

    canEditTool: (toolId: string) => {
      if (effectivePlatformAdmin || tier >= (ROLE_TIER["admin"] ?? 0)) return true;
      return (toolMap.get(toolId)?.canEdit ?? false);
    },

    hasMinRole: (minRole: CahaRole) => {
      const minTier = ROLE_TIER[minRole];
      if (minTier === undefined) {
        console.warn(
          `useChurchRole.hasMinRole: unknown role "${minRole}". Valid: ${Object.keys(ROLE_TIER).join(", ")}`,
        );
        return false;
      }
      return effectivePlatformAdmin || tier >= minTier;
    },

    hasExactRole: (role: string) => churchRole === role,

    hasMinistryRole: (ministryId: string, minRole: CahaRole) => {
      if (effectivePlatformAdmin) return true;
      const entry = ministryRoles.find((m) => {
        const id =
          typeof m.ministry === "object" && m.ministry !== null
            ? m.ministry._id?.toString()
            : typeof m.ministry === "string"
              ? m.ministry
              : undefined;
        return id === ministryId;
      });
      if (!entry) return false;
      const entryTier = ROLE_TIER[entry.role ?? "visitor"] ?? 0;
      const minTier = ROLE_TIER[minRole] ?? 0;
      return entryTier >= minTier;
    },

    isAdmin: effectivePlatformAdmin || tier >= (ROLE_TIER["admin"] ?? 0),
    isVolunteer: effectivePlatformAdmin || tier >= (ROLE_TIER["volunteer"] ?? 0),
    isMember: effectivePlatformAdmin || tier >= (ROLE_TIER["member"] ?? 0),
  };
}

export default useChurchRole;
