import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useChurchRole } from "../hooks/useChurchRole";

export type CahaRole =
  | "tier_8_sovereign"
  | "tier_7_architect"
  | "tier_6_apostolic"
  | "tier_5_pastoral"
  | "tier_4_elder_deacon"
  | "tier_3_ministry_leader"
  | "tier_2_volunteer"
  | "tier_1_member";

export const CAHA_TIER: Record<CahaRole, number> = {
  tier_8_sovereign: 8,
  tier_7_architect: 7,
  tier_6_apostolic: 6,
  tier_5_pastoral: 5,
  tier_4_elder_deacon: 4,
  tier_3_ministry_leader: 3,
  tier_2_volunteer: 2,
  tier_1_member: 1,
};

export interface CahaGateProps {
  domain: "church" | "admin" | "work" | "home";
  minTier: CahaRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * CahaGate
 *
 * Declarative component for the 8-Tier CAHA Permission Matrix.
 * Replaces legacy RoleGuard / PermissionGuard checks with sovereign architecture.
 */
export const CahaGate: React.FC<CahaGateProps> = ({
  domain,
  minTier,
  children,
  fallback = null,
  redirectTo,
}) => {
  const { user, isAuthenticated } = useAuth();
  const churchRole = useChurchRole();

  if (!isAuthenticated || !user) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <>{fallback}</>;
  }

  // 1. Platform Supremacy Check
  const platformRoles = (user as { roles?: string[] }).roles ?? [];
  const isSovereign =
    platformRoles.includes("sovereign") || (user as any).role === "super_admin";
  const isArchitect =
    platformRoles.includes("architect") ||
    platformRoles.includes("admin") ||
    platformRoles.includes("org_admin");

  if (domain === "admin") {
    if (minTier === "tier_8_sovereign" && !isSovereign) {
      if (redirectTo) return <Navigate to={redirectTo} replace />;
      return <>{fallback}</>;
    }
    if (minTier === "tier_7_architect" && !isSovereign && !isArchitect) {
      if (redirectTo) return <Navigate to={redirectTo} replace />;
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  if (domain === "church") {
    let effectiveTier = 0;

    if (churchRole.membership && (churchRole.membership as any).cahaRole) {
      effectiveTier =
        CAHA_TIER[(churchRole.membership as any).cahaRole as CahaRole] ?? 0;
    } else {
      // Fallback for legacy mapped roles
      if (churchRole.isSteward) effectiveTier = 4;
      else if (churchRole.isMember) effectiveTier = 1;

      // Infer middle tiers from ministry participation
      if (
        churchRole.ministryRoles.some((m) => {
          const raw = (
            (m as any).position ??
            m.role ??
            "participant"
          ).toLowerCase();
          return raw === "leader";
        })
      ) {
        effectiveTier = Math.max(effectiveTier, 3); // Ministry Leader
      } else if (churchRole.isVolunteer) {
        effectiveTier = Math.max(effectiveTier, 2); // Volunteer
      }
    }

    const requiredTier = CAHA_TIER[minTier] ?? 0;

    if (effectiveTier < requiredTier) {
      if (redirectTo) return <Navigate to={redirectTo} replace />;
      return <>{fallback}</>;
    }

    return <>{children}</>;
  }

  return <>{children}</>;
};

export default CahaGate;
