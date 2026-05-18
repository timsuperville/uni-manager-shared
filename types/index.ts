/**
 * @shared/types — Cross-application domain types
 *
 * Canonical runtime shapes used throughout the Uni-Manager ecosystem,
 * now expressed as TypeScript interfaces (previously JSDoc @typedefs).
 */

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
  | 'tier_8_sovereign'
  | 'tier_7_architect'
  | 'tier_6_apostolic'
  | 'tier_5_pastoral'
  | 'tier_4_elder_deacon'
  | 'tier_3_ministry_leader'
  | 'tier_2_volunteer'
  | 'tier_1_member';

export const CAHA_TIER: Record<CahaRole, number> = {
  tier_8_sovereign: 8,
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
