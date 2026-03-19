import { useMemo } from "react";
import { useAuth } from "@shared/auth";

// ── CAHA Community Journey Tier Map ───────────────────────────────────────────
//
// Canonical per CAHA_PROTOCOL.md §1.1 (v2.0)
// Source of truth: backend/src/apps/church/types/church.types.ts
//
//   viewer(0) → visitor(1) → attendee(2) → member(3) → steward(4)
//
// Notes:
//   - 'volunteer' is NOT a stored stage — it is COMPUTED from ministry memberships
//   - 'admin' is the legacy token for 'steward' — accepted during migration (tier 4)
//   - 'super_admin' is a platform role handled by isPlatformAdmin bypass
//
const COMMUNITY_TIER: Record<string, number> = {
  viewer: 0,
  visitor: 1,
  attendee: 2,
  member: 3,
  steward: 4,
  admin: 4, // legacy alias for 'steward' — accepted during migration
};

/** The canonical community journey stage vocabulary. */
export type CommunityStage =
  | "viewer"
  | "visitor"
  | "attendee"
  | "member"
  | "steward";

/** Ministry position tokens — per CAHA_PROTOCOL.md §2.1. */
export type MinistryPosition = "participant" | "volunteer" | "leader";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GrantedTool {
  toolId: string;
  canView: boolean;
  canEdit: boolean;
}

export interface MinistryRole {
  ministry?: {
    _id?: string;
    name?: string;
    grantedTools?: Array<{
      toolId?: string;
      canView?: boolean;
      canEdit?: boolean;
    }>;
  };
  grantedTools?: Array<{
    toolId?: string;
    canView?: boolean;
    canEdit?: boolean;
  }>;
  role?: string;
}

interface Membership {
  status?: string;
  role?: string;
  ministryRoles?: MinistryRole[];
  church?: { _id?: string } | string;
}

export interface UseChurchRoleReturn {
  // ── Community Journey ──────────────────────────────────────────────────────
  /** Current community stage per CAHA §1.1 */
  journeyStage: CommunityStage;
  /** Numeric tier for journeyStage (0–4) */
  journeyTier: number;
  /** true if journeyTier >= member(3) */
  isMember: boolean;
  /** true if journeyTier >= attendee(2) */
  isAttendee: boolean;
  /** true if journeyTier >= visitor(1) */
  isVisitor: boolean;
  /** true if in church context (tier >= viewer(0)) */
  isViewer: boolean;

  // ── Institutional ──────────────────────────────────────────────────────────
  /** true if user holds the steward role (formerly 'admin') in this church. */
  isSteward: boolean;

  // ── Platform ───────────────────────────────────────────────────────────────
  /** true if User.roles[] includes 'admin' or 'org_admin' (platform override). */
  isPlatformAdmin: boolean;

  // ── Ministry ───────────────────────────────────────────────────────────────
  /** true if user is an active member of at least one ministry (computed, never stored). */
  isVolunteer: boolean;
  /** All the user's ministry roles in the current church. */
  ministryRoles: MinistryRole[];
  /** The union of all granted tools from the user's ministry memberships. */
  resolvedTools: GrantedTool[];

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Check if user meets the minimum community stage. */
  hasMinStage: (minStage: CommunityStage | string) => boolean;
  /** Check if user has a specific tool in their effective tool set. */
  hasGrantedTool: (toolId: string) => boolean;
  /** Check if user can edit a specific tool. */
  canEditTool: (toolId: string) => boolean;
  /** Check if user has at least minPosition in the given ministry. */
  hasMinistryRole: (
    ministryId: string,
    minRole: MinistryPosition | string,
  ) => boolean;

  // ── Raw data ───────────────────────────────────────────────────────────────
  /** The resolved journey stage string (same as journeyStage). */
  membership: Membership | null;
  currentChurchId: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useChurchRole — CH-036 CAHA Hook (v2.0).
 *
 * Per CAHA_PROTOCOL.md §6.1 — resolves the calling user's community journey
 * stage and ministry memberships within their current church context.
 *
 * API:
 *   journeyStage    — 'viewer' | 'visitor' | 'attendee' | 'member' | 'steward'
 *   isMember        — tier >= member(3)
 *   isAttendee      — tier >= attendee(2)
 *   isVisitor       — tier >= visitor(1)
 *   isViewer        — always true if in church context
 *   isSteward       — role === 'steward' (institutional governance)
 *   isPlatformAdmin — User.roles[] includes 'admin' or 'org_admin'
 *   isVolunteer     — has >= 1 active ministry membership (computed, never stored)
 *   hasMinStage     — hasMinStage('member') → true if tier >= 3
 *   hasMinistryRole — hasMinistryRole(ministryId, 'leader')
 *
 * This is the single source of truth for church-context role checks.
 * NEVER check user.roles directly for church-context access control.
 */
export function useChurchRole(): UseChurchRoleReturn {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return buildResult("viewer", null, null, null);
    }

    type ExtUser = typeof user & {
      roles?: string[];
      currentChurch?: { _id?: string | { toString(): string } } | string;
      churches?: Membership[];
    };
    const u = user as ExtUser;
    const userRoles = u.roles ?? [];
    const isPlatformAdmin =
      userRoles.includes("admin") ||
      userRoles.includes("org_admin") ||
      (user as { role?: string }).role === "super_admin";

    const currentChurchId =
      typeof u.currentChurch === "object" && u.currentChurch !== null
        ? (u.currentChurch._id?.toString() ?? null)
        : typeof u.currentChurch === "string"
          ? u.currentChurch
          : null;

    if (isPlatformAdmin) {
      return buildResult("steward", null, currentChurchId, u, true);
    }

    if (!currentChurchId) {
      return buildResult("viewer", null, null, u);
    }

    // u.churches holds Membership objects at runtime — cast to the richer shape.
    const memberships = (u.churches ?? []) as Membership[];
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
      return buildResult("viewer", null, currentChurchId, u);
    }

    const rawRole =
      membership.status === "left" ? "viewer" : (membership.role ?? "viewer");
    // Normalize legacy 'admin' token to 'steward'
    const effectiveRole = rawRole === "admin" ? "steward" : rawRole;

    return buildResult(effectiveRole, membership, currentChurchId, u);
  }, [user]);
}

// ── Internal Builder ──────────────────────────────────────────────────────────

/** Ministry position tier map — parallel to MINISTRY_POSITION_TIERS on the backend. */
const MINISTRY_POSITION_TIERS: Record<string, number> = {
  participant: 0,
  volunteer: 1,
  leader: 2,
};

function buildResult(
  rawRole: string,
  membership: Membership | null,
  currentChurchId: string | null,
  user: (typeof useAuth extends () => infer R ? R : never)["user"] | null,
  isPlatformAdmin = false,
): UseChurchRoleReturn {
  const stage = (rawRole === "admin" ? "steward" : rawRole) as CommunityStage;
  const tier = COMMUNITY_TIER[stage] ?? 0;
  const ministryRoles = membership?.ministryRoles ?? [];

  // isVolunteer — computed: true if user has any active ministry membership.
  const isVolunteer = ministryRoles.length > 0;

  // Resolve granted tools — union of grantedTools[] across all ministries.
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
    !!(
      extUser?.roles?.includes("admin") ||
      extUser?.roles?.includes("org_admin") ||
      (extUser as { role?: string } | null)?.role === "super_admin"
    );

  const isSteward = effectivePlatformAdmin || stage === "steward";
  const stewardTier = COMMUNITY_TIER["steward"] ?? 4;

  /** Check if user meets the minimum community stage (by tier). */
  const hasMinStage = (minStage: string): boolean => {
    const minTier = COMMUNITY_TIER[minStage === "admin" ? "steward" : minStage];
    if (minTier === undefined) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `useChurchRole.hasMinStage: unknown stage "${minStage}". Valid: ${Object.keys(COMMUNITY_TIER).join(", ")}`,
        );
      }
      return false;
    }
    return effectivePlatformAdmin || tier >= minTier;
  };

  return {
    // ── Community Journey ────────────────────────────────────────────────────
    journeyStage: stage,
    journeyTier: tier,
    isMember: effectivePlatformAdmin || tier >= (COMMUNITY_TIER["member"] ?? 3),
    isAttendee:
      effectivePlatformAdmin || tier >= (COMMUNITY_TIER["attendee"] ?? 2),
    isVisitor:
      effectivePlatformAdmin || tier >= (COMMUNITY_TIER["visitor"] ?? 1),
    isViewer: true, // always true if in church context

    // ── Institutional ────────────────────────────────────────────────────────
    isSteward,

    // ── Platform ─────────────────────────────────────────────────────────────
    isPlatformAdmin: effectivePlatformAdmin,

    // ── Ministry ─────────────────────────────────────────────────────────────
    isVolunteer,
    ministryRoles,
    resolvedTools,

    // ── Helpers ──────────────────────────────────────────────────────────────
    hasMinStage,

    hasGrantedTool: (toolId: string) => {
      if (effectivePlatformAdmin || tier >= stewardTier) return true;
      return toolMap.get(toolId)?.canView ?? false;
    },

    canEditTool: (toolId: string) => {
      if (effectivePlatformAdmin || tier >= stewardTier) return true;
      return toolMap.get(toolId)?.canEdit ?? false;
    },

    hasMinistryRole: (ministryId: string, minRole: string) => {
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
      // Read `position` (CAHA v2 field) with fallback to `role` for legacy documents
      // that haven't been migrated yet. Remove the fallback once migration is complete.
      const rawPosition =
        (entry as { position?: string }).position ??
        entry.role ??
        "participant";

      const lowerPos = rawPosition.toLowerCase();
      const normalizedPosition =
        lowerPos === "leader"
          ? "leader"
          : lowerPos === "volunteer" ||
              lowerPos === "assistant" ||
              lowerPos === "coordinator"
            ? "volunteer"
            : "participant";

      const entryPosition = MINISTRY_POSITION_TIERS[normalizedPosition] ?? 0;
      const minPosition = MINISTRY_POSITION_TIERS[minRole] ?? 0;
      return entryPosition >= minPosition;
    },

    // ── Raw data ──────────────────────────────────────────────────────────────
    membership: membership ?? null,
    currentChurchId,
  };
}

export default useChurchRole;
