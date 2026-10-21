// @shared/data — Shared static datasets
// Provides reference data usable across all shells.

export * from './integrations';
export * from './churchConstants';
export * from './voicePersonas';
export type {
  IntegrationCategoryId,
  IconComponent,
  IntegrationCategory,
  IntegrationEntry,
  IntegrationDatabase
} from './integrations';
export type { AvailableVoicePersona } from './voicePersonas';
