/**
 * Core API Types
 *
 * Shared types for API requests, responses, and entities
 * used across all services in the unified API layer.
 */

// ==================== BASE TYPES ====================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimestampedEntity {
  createdAt: string;
  updatedAt: string;
}

// ==================== USER & AUTHENTICATION ====================

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  lastLoginAt?: string;
  preferences: UserPreferences;
  profile: UserProfile;
  currentChurch?: string | { id?: string; _id?: string; name: string };
  churches?: Array<{
    church:
      | string
      | { _id?: string; id?: string; name?: string; logo?: string };
    role: string;
  }>;
}

export interface UserProfile {
  bio?: string;
  location?: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
  notifications: NotificationPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
  deviceInfo?: DeviceInfo;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface DeviceInfo {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  fingerprint?: string;
}

// ==================== CHURCH MANAGEMENT ====================

export interface Church extends BaseEntity {
  name: string;
  description?: string;
  address: Address;
  contactInfo: ContactInfo;
  settings: ChurchSettings;
  denomination?: string;
  founded?: string;
  website?: string;
  socialMedia: SocialMediaLinks;
  logo?: string;
  coverImage?: string;
  status: "active" | "inactive" | "pending";
  memberCount: number;
  adminCount: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  fax?: string;
  emergencyContact?: string;
}

export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
}

export interface ChurchSettings {
  timeZone: string;
  currency: string;
  language: string;
  dateFormat: string;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  allowPublicRegistration: boolean;
  requireApprovalForJoin: boolean;
  features: ChurchFeatures;
}

export interface ChurchFeatures {
  giving: boolean;
  events: boolean;
  groups: boolean;
  volunteer: boolean;
  childcare: boolean;
  music: boolean;
  broadcasts: boolean;
}

export interface CreateChurchRequest {
  name: string;
  description?: string;
  address: Omit<Address, "latitude" | "longitude">;
  contactInfo: ContactInfo;
  denomination?: string;
  website?: string;
}

export interface UpdateChurchRequest extends Partial<CreateChurchRequest> {
  settings?: Partial<ChurchSettings>;
  socialMedia?: Partial<SocialMediaLinks>;
}

// ==================== MEMBERSHIP ====================

export interface Member extends BaseEntity {
  churchId: string;
  userId: string;
  user: User;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  membershipType: MembershipType;
  ministries: string[];
  groups: string[];
  permissions: string[];
  emergencyContact?: EmergencyContact;
  familyMembers?: string[];
  notes?: string;
}

export type MemberRole =
  | "admin"
  | "pastor"
  | "elder"
  | "deacon"
  | "leader"
  | "member"
  | "visitor";
export type MemberStatus = "active" | "inactive" | "pending" | "suspended";
export type MembershipType = "full" | "associate" | "visitor" | "child";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface JoinChurchRequest {
  churchId: string;
  message?: string;
  membershipType?: MembershipType;
  emergencyContact?: EmergencyContact;
}

// ==================== SERVICES & EVENTS ====================

export interface ChurchService extends BaseEntity {
  churchId: string;
  title: string;
  description?: string;
  serviceType: ServiceType;
  startTime: string;
  endTime?: string;
  location?: string;
  pastor?: string;
  notes?: string;
  segments: ServiceSegment[];
  attendanceCount?: number;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  status: ServiceStatus;
}

export type ServiceType =
  | "regular"
  | "special"
  | "wedding"
  | "funeral"
  | "baptism"
  | "conference";
export type ServiceStatus =
  | "draft"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface ServiceSegment {
  id: string;
  type: SegmentType;
  title: string;
  duration?: number;
  notes?: string;
  order: number;
  assignedTo?: string;
}

export type SegmentType =
  | "welcome"
  | "worship"
  | "prayer"
  | "sermon"
  | "offering"
  | "announcements"
  | "benediction";

export interface RecurringPattern {
  frequency: "weekly" | "monthly" | "yearly";
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
  exceptions?: string[];
}

export interface Event extends BaseEntity {
  churchId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  maxAttendees?: number;
  currentAttendees: number;
  category: EventCategory;
  isPublic: boolean;
  requiresRegistration: boolean;
  registrationDeadline?: string;
  cost?: number;
  organizer: string;
  status: EventStatus;
  tags: string[];
}

export type EventCategory =
  | "worship"
  | "social"
  | "education"
  | "outreach"
  | "youth"
  | "children"
  | "seniors"
  | "other";
export type EventStatus =
  | "draft"
  | "published"
  | "ongoing"
  | "completed"
  | "cancelled";

// ==================== FILTERS & QUERIES ====================

export interface ChurchFilters {
  search?: string;
  denomination?: string;
  city?: string;
  state?: string;
  hasFeature?: keyof ChurchFeatures;
  memberCountMin?: number;
  memberCountMax?: number;
}

export interface MemberFilters {
  role?: MemberRole;
  status?: MemberStatus;
  membershipType?: MembershipType;
  ministry?: string;
  group?: string;
  search?: string;
}

export interface ServiceFilters {
  serviceType?: ServiceType;
  status?: ServiceStatus;
  startDate?: string;
  endDate?: string;
  pastor?: string;
}

export interface EventFilters {
  category?: EventCategory;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
  requiresRegistration?: boolean;
  churchId?: string;
  search?: string;
  groupId?: string;
}

// ==================== EVENT REQUESTS ====================

export interface CreateEventRequest {
  title: string;
  description?: string;
  churchId: string;
  startDate: string;
  endDate?: string;
  location?: string;
  category: EventCategory;
  maxAttendees?: number;
  isPublic?: boolean;
  requiresRegistration?: boolean;
  registrationDeadline?: string;
  cost?: number;
  organizer: string;
  tags?: string[];
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: EventStatus;
}

// ==================== EVENT REGISTRATION ====================

export interface EventRegistration extends BaseEntity {
  eventId: string;
  userId: string;
  user: User;
  attendeeCount: number;
  registrationDate: string;
  status: "registered" | "attended" | "cancelled";
  notes?: string;
  paymentStatus?: "pending" | "paid" | "refunded";
}

export interface CreateEventRegistrationRequest {
  userId: string;
  attendeeCount?: number;
  notes?: string;
}

export interface UpdateEventRegistrationRequest {
  attendeeCount?: number;
  status?: "registered" | "attended" | "cancelled";
  notes?: string;
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
  timestamp: string;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message?: string;
  status: number;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  details?: unknown;
}

// ==================== UTILITY TYPES ====================

export type CreateRequest<T> = Omit<T, keyof BaseEntity>;
export type UpdateRequest<T> = Partial<CreateRequest<T>>;

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  suggestions?: string[];
}

export interface BulkOperation<T> {
  action: "create" | "update" | "delete";
  items: T[];
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

// ==================== FILE UPLOAD ====================

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ==================== ANALYTICS ====================

export interface AnalyticsData {
  period: string;
  metrics: {
    [key: string]: number | string;
  };
  trends: {
    [key: string]: Array<{
      date: string;
      value: number;
    }>;
  };
}

export interface ChurchStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  averageAttendance: number;
  upcomingEvents: number;
  totalGroups: number;
  totalMinistries: number;
}

// ==================== FILE MANAGEMENT ====================

export interface FileMetadata extends BaseEntity {
  name: string;
  originalName: string;
  description?: string;
  size: number;
  mimeType: string;
  extension: string;
  path: string;
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  category?: string;
  tags: string[];
  folderId?: string;
  uploadedBy: string;
  isPublic: boolean;
  downloadCount: number;
  lastAccessedAt?: string;
  version: number;
  checksum: string;
}

export interface Folder extends BaseEntity {
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  isPublic: boolean;
  totalFiles: number;
  totalSize: number;
  children?: Folder[];
}

export interface FileUploadRequest {
  file: File;
  folderId?: string;
  category?: string;
  tags?: string[];
  description?: string;
  isPublic?: boolean;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface FileSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  folderId?: string;
  mimeType?: string;
  sizeMin?: number;
  sizeMax?: number;
  createdAfter?: string;
  createdBefore?: string;
  isPublic?: boolean;
}

export interface FileShareRequest {
  fileId: string;
  shareWith: string[];
  permissions: "read" | "write" | "admin";
  expiresAt?: string;
  message?: string;
}

export interface BulkFileOperation {
  fileIds: string[];
  operation: "move" | "copy" | "delete" | "share" | "tag";
  targetFolderId?: string;
  tags?: string[];
  shareWith?: string[];
  permissions?: string;
}

export interface StorageAnalytics {
  totalFiles: number;
  totalSize: number;
  totalFolders: number;
  fileTypes: Array<{
    mimeType: string;
    count: number;
    size: number;
  }>;
  sizeByCategory: Array<{
    category: string;
    count: number;
    size: number;
  }>;
  uploadTrends: Array<{
    date: string;
    uploads: number;
    size: number;
  }>;
  topFiles: Array<{
    fileId: string;
    name: string;
    downloadCount: number;
    size: number;
  }>;
  storageQuota?: {
    used: number;
    limit: number;
    percentage: number;
  };
}

// ==================== NOTIFICATION MANAGEMENT ====================

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "announcement";
  status: "sent" | "pending" | "failed" | "read" | "unread" | "archived";
  priority: "low" | "normal" | "high" | "urgent";
  recipients: string[];
  senderId: string;
  senderName: string;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  archivedAt?: string;
  templateId?: string;
  data?: Record<string, unknown>;
  channels: Array<"email" | "push" | "sms" | "in-app">;
  deliveryStatus: {
    email?: "sent" | "delivered" | "failed" | "bounced";
    push?: "sent" | "delivered" | "failed";
    sms?: "sent" | "delivered" | "failed";
    inApp?: "sent" | "read" | "dismissed";
  };
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "announcement";
  recipients: string[];
  priority?: "low" | "normal" | "high" | "urgent";
  scheduledFor?: string;
  templateId?: string;
  data?: Record<string, unknown>;
  channels?: Array<"email" | "push" | "sms" | "in-app">;
}

export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  status?: "sent" | "pending" | "failed" | "cancelled";
  scheduledFor?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export interface NotificationTemplate extends BaseEntity {
  name: string;
  subject: string;
  bodyTemplate: string;
  htmlTemplate?: string;
  type: "email" | "push" | "sms" | "in-app";
  category: string;
  variables: string[];
  isActive: boolean;
  usage: {
    totalUsed: number;
    lastUsed?: string;
  };
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  bodyTemplate: string;
  htmlTemplate?: string;
  type: "email" | "push" | "sms" | "in-app";
  category?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  bodyTemplate?: string;
  htmlTemplate?: string;
  category?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface BulkNotificationRequest {
  notifications: CreateNotificationRequest[];
  templateId?: string;
  scheduledFor?: string;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalRead: number;
  deliveryRate: number;
  readRate: number;
  byType: Array<{
    type: string;
    count: number;
    deliveryRate: number;
    readRate: number;
  }>;
  byChannel: Array<{
    channel: string;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  }>;
  timeline: Array<{
    date: string;
    sent: number;
    delivered: number;
    read: number;
  }>;
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    usage: number;
    deliveryRate: number;
  }>;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
}

// ==================== SECURITY & GAMIFICATION ====================

export interface SecurityProfile {
  currentLevel?: string;
  tier?: string;
  totalPoints?: number;
  securityScore?: number;
  badges?: unknown[];
  achievements?: unknown[];
  celebration?: unknown;
  [key: string]: unknown;
}

export interface SecurityJourney {
  currentStage?: string;
  progress?: number;
  stages?: unknown[];
  nextSteps?: unknown[];
  [key: string]: unknown;
}

export interface SecurityAnalyticsData {
  trends?: unknown[];
  insights?: unknown[];
  improvements?: unknown[];
  [key: string]: unknown;
}

export interface AccessControlResult {
  granted: boolean;
  level: string;
  reason?: string;
  recommendations?: unknown[];
}

export interface SecurityEventData {
  [key: string]: unknown;
}

export interface BatchOperation {
  type: "getProfile" | "awardBadge" | "progressMilestone";
  userId: string;
  badgeId?: string;
  context?: Record<string, unknown>;
  milestoneId?: string;
  data?: Record<string, unknown>;
}

// ==================== DEVELOPER KEYS ====================

export interface ApiKey {
  _id?: string;
  id?: string;
  name: string;
  prefix: string;
  roles: string[];
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
}

export interface ApiKeyCreateResult {
  /** One-time revealed key value — store it immediately, never re-fetched */
  key: string;
  name: string;
  prefix: string;
  roles: string[];
  createdAt: string;
}

// ==================== REPORTING ====================

export interface ReportFilters {
  category?: string;
  type?: string;
  active?: boolean | string;
  [key: string]: unknown;
}

export interface ReportData {
  [key: string]: unknown;
}

export interface GenerateOptions extends ReportData {
  format?: string;
}

export interface ParameterDefinition {
  name: string;
  label?: string;
  required?: boolean;
  type?: "date" | "number" | "string";
}
