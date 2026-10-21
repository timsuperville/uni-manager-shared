/**
 * @shared/data/voicePersonas.ts
 *
 * Canonical voice personas and tones available across the Uni-Manager ecosystem.
 * Vendor synthesis engines (Gemini, ElevenLabs, etc.) are strictly abstracted away.
 */

export interface AvailableVoicePersona {
  id: string;
  name: string;
  tone: string;
}

export const AVAILABLE_VOICE_PERSONAS: AvailableVoicePersona[] = [
  { id: 'Aoede', name: 'Aoede', tone: 'Warm, Sophisticated & Professional' },
  { id: 'Puck', name: 'Puck', tone: 'Upbeat, Engaging & Energetic' },
  { id: 'Charon', name: 'Charon', tone: 'Deep, Grounded & Authoritative' },
  { id: 'Fenrir', name: 'Fenrir', tone: 'Crisp, Direct & Structured' },
  { id: 'Kore', name: 'Kore', tone: 'Gentle, Calm & Reassuring' },
  { id: 'Rachel', name: 'Rachel', tone: 'Natural, Expressive & Conversational' },
  { id: 'Drew', name: 'Drew', tone: 'Steady, Trustworthy & Friendly' }
];
