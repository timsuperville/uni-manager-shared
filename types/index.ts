/**
 * @shared/types — Cross-application domain types
 *
 * Canonical runtime shapes used throughout the Uni-Manager ecosystem,
 * now expressed as TypeScript interfaces (previously JSDoc @typedefs).
 */

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Skill LiveSync Engine (ECO-R-56) ────────────────────────────────────────

/**
 * Proficiency scale used across both Work and Church skill domains.
 * Enables the Talent Discovery bridge to compare professional certifications
 * against equivalent ministry skill requirements.
 */
export type SkillProficiency =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

/**
 * Canonical skill categories shared between the Professional Merit graph
 * and the Ministry Skill graph. New categories must be added here first.
 */
export type SkillCategory =
  | 'audio_visual' // Sound engineering, lighting, livestream production
  | 'music' // Instrumental, vocal, arrangement
  | 'teaching' // Preaching, facilitation, curriculum
  | 'administration' // Scheduling, finance, communications
  | 'technology' // Software, infrastructure, web
  | 'counselling' // Pastoral care, crisis support
  | 'hospitality' // Events, guest services, food
  | 'leadership' // Team management, vision casting
  | 'creative' // Design, writing, media production
  | 'physical' // Facilities, construction, maintenance
  | 'other';

/**
 * ProfessionalMerit — A verified skill or certification in the Work domain.
 * Sourced from the Merit Graph (MeritGraphPage) and exposed via the
 * Skill LiveSync Engine for cross-domain talent discovery.
 */
export interface ProfessionalMerit {
  id: string;
  name: string;
  category: SkillCategory;
  proficiencyLevel: SkillProficiency;
  /** ISO date string of when this merit was verified/awarded. */
  verifiedAt?: string;
  /** External certification body, institution, or endorser. */
  issuedBy?: string;
  /** Optional expiry for credentials that lapse (e.g. OSHA-30). */
  expiresAt?: string;
  tags?: string[];
}

/**
 * MinistrySkill — A skill requirement or declaration in the Church domain.
 * Stored on Ministry documents and used by the CAHA talent-discovery bridge
 * to match professionals with appropriate ministry roles.
 */
export interface MinistrySkill {
  id: string;
  name: string;
  domain: SkillCategory;
  minimumProficiency: SkillProficiency;
  /** Whether this skill is required (blocker) vs preferred (nice-to-have). */
  isRequired: boolean;
  /** Human-readable description of what the skill is used for in this ministry. */
  description?: string;
}

/**
 * SkillResonanceMap — A single mapping entry produced by the Skill LiveSync Engine.
 * Maps one ProfessionalMerit to a compatible MinistrySkill with a liveSync score.
 *
 * resonanceScore 0–1:
 *   1.0  = exact category + proficiency match
 *   0.6+ = category match, proficiency one level lower
 *   < 0.5 = partial category overlap only
 */
export interface SkillResonanceMap {
  professionalMeritId: string;
  ministrySkillId: string;
  ministryId: string;
  resonanceScore: number;
  matchReason: string;
}

// ─── Auth / Identity ──────────────────────────────────────────────────────────

export type AppType =
  | 'admin'
  | 'church'
  | 'home'
  | 'work'
  | 'personal'
  | 'playback'
  | 'presentation';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  roles: string[];
  appType: AppType;
}

export type CahaRole =
  | 'tier_8_user_owned'
  | 'tier_7_architect'
  | 'tier_6_apostolic'
  | 'tier_5_pastoral'
  | 'tier_4_elder_deacon'
  | 'tier_3_ministry_leader'
  | 'tier_2_volunteer'
  | 'tier_1_member';

export const CAHA_TIER: Record<CahaRole, number> = {
  tier_8_user_owned: 8,
  tier_7_architect: 7,
  tier_6_apostolic: 6,
  tier_5_pastoral: 5,
  tier_4_elder_deacon: 4,
  tier_3_ministry_leader: 3,
  tier_2_volunteer: 2,
  tier_1_member: 1
};

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  /** Expiry duration in seconds. */
  expiresIn: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  /** ErrorLog._id for forensic investigation via the Admin portal. */
  resonanceId?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Error Logging ────────────────────────────────────────────────────────────

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ErrorLogEntry {
  /** MongoDB _id */
  resonanceId: string;
  message: string;
  stackTrace?: string;
  severity: ErrorSeverity;
  appType: AppType;
  resolved: boolean;
  isRegression: boolean;
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export type FeedbackStatus =
  | 'pending'
  | 'investigating'
  | 'in-progress'
  | 'resolved';

export interface FeedbackReport {
  reportId: string;
  title: string;
  description: string;
  status: FeedbackStatus;
  priority: ErrorSeverity;
  appType: AppType;
}

// ─── Presence ────────────────────────────────────────────────────────────────

export type PresenceStatus = 'available' | 'busy' | 'away' | 'offline';

export interface PresenceState {
  isConnected: boolean;
  socket: WebSocket | null;
  status: PresenceStatus;
  setStatus: (status: PresenceStatus) => void;
}

// ─── Voice & Telephony Contracts ─────────────────────────────────────────────

export * from './voice';

// ─── Billing & Subscription Contracts ────────────────────────────────────────

export * from './billing';

