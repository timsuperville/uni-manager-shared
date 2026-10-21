/**
 * @shared/types/voice — Canonical Voice Persona & Telephony Contracts
 *
 * All AI vendor details (Gemini, ElevenLabs, etc.) are strictly abstracted away
 * from the tenant interface. The server maps voice personas to internal synthesis engines.
 */

export interface VoicePersonaSpec {
  voiceId: string;
}

export interface CopilotVoiceSpec {
  useSameAsReceptionist: boolean;
  voiceId: string;
}

export interface VoiceProfile {
  enabled: boolean;
  didPhone?: string;
  allowOutboundSms: boolean;
  voicePersona: string;
  receptionistVoice: VoicePersonaSpec;
  copilotVoice: CopilotVoiceSpec;
  greetingPrompt?: string;
  emergencyKeywords: string[];
  emergencyDispatchPhone?: string;
  diagnosticFee: number;
  diagnosticFeeCad?: number;
  currency?: string;
  serviceArea?: string;
  operatingHoursSummary?: string;
}

export interface VoiceEntitlementStatus {
  entitled: boolean;
  tier?: string;
  message?: string;
}

export interface VoiceSessionConfig {
  tenantId: string;
  brandName?: string;
  voice: VoicePersonaSpec;
  allowOutboundSms: boolean;
  operatingHours?: string;
  availableTools: string[];
}

export interface CallActivityItem {
  id: string;
  callSid: string;
  callerPhone: string;
  callerName?: string;
  timestamp: string;
  durationSeconds: number;
  status: 'completed' | 'emergency' | 'in-progress' | 'missed';
  summary: string;
  actionTaken: string;
  leadCreated: boolean;
}

export interface VoiceStats {
  totalCallsMonth: number;
  emergencyEscalations: number;
  leadsCaptured: number;
  avgResolutionSec: number;
}
