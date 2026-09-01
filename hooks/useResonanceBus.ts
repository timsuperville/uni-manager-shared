/**
 * useResonanceBus.ts — Universal Cross-App Ecosystem Telemetry Bus
 *
 * Provides real-time event broadcasting and state synchronization across the
 * Uni-Manager life suite (Personal, Home, Work, Church).
 *
 * Supported Event Types:
 *   - SOVEREIGN_COOLDOWN_ENGAGED / SOVEREIGN_COOLDOWN_RELEASED
 *   - CRISIS_MODE_TRIGGERED / CRISIS_MODE_RESOLVED
 *   - BURNOUT_VELOCITY_WARNING
 *   - STEWARDSHIP_EQUITY_UPDATE
 *   - FOCUS_MODE_STATE
 *
 * Architecture:
 *   - Primary transport: BroadcastChannel('uni-manager:resonance-bus')
 *   - Fallback / Snapshot persistence: localStorage('uni-manager:resonance-snapshot')
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export const RESONANCE_CHANNEL_NAME = 'uni-manager:resonance-bus';
export const RESONANCE_STORAGE_KEY = 'uni-manager:resonance-snapshot';

export type ResonanceEventType =
  | 'SOVEREIGN_COOLDOWN_ENGAGED'
  | 'SOVEREIGN_COOLDOWN_RELEASED'
  | 'CRISIS_MODE_TRIGGERED'
  | 'CRISIS_MODE_RESOLVED'
  | 'BURNOUT_VELOCITY_WARNING'
  | 'STEWARDSHIP_EQUITY_UPDATE'
  | 'FOCUS_MODE_STATE';

export interface BaseResonanceEvent {
  type: ResonanceEventType;
  timestamp: string;
  source: 'personal' | 'home' | 'work' | 'church' | string;
}

export interface SovereignCooldownEvent extends BaseResonanceEvent {
  type: 'SOVEREIGN_COOLDOWN_ENGAGED' | 'SOVEREIGN_COOLDOWN_RELEASED';
  durationSeconds?: number;
  reason?: string;
}

export interface CrisisModeEvent extends BaseResonanceEvent {
  type: 'CRISIS_MODE_TRIGGERED' | 'CRISIS_MODE_RESOLVED';
  crisisType?: string;
  severity?: 'advisory' | 'warning' | 'critical';
  message?: string;
}

export interface BurnoutVelocityEvent extends BaseResonanceEvent {
  type: 'BURNOUT_VELOCITY_WARNING';
  psiScore: number;
  velocityTrend: 'stable' | 'accelerating' | 'critical';
}

export interface StewardshipEquityEvent extends BaseResonanceEvent {
  type: 'STEWARDSHIP_EQUITY_UPDATE';
  equityScore: number;
  householdId: string;
}

export interface FocusModeEvent extends BaseResonanceEvent {
  type: 'FOCUS_MODE_STATE';
  isActive: boolean;
}

export type ResonanceEvent =
  | SovereignCooldownEvent
  | CrisisModeEvent
  | BurnoutVelocityEvent
  | StewardshipEquityEvent
  | FocusModeEvent;

export type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

export type ResonanceEventInput = DistributiveOmit<
  ResonanceEvent,
  'timestamp'
>;

export interface ResonanceBusState {
  lastEvent: ResonanceEvent | null;
  isCooldownActive: boolean;
  activeCrisis: CrisisModeEvent | null;
  publish: (event: ResonanceEventInput) => void;
}

/**
 * Publish a standalone event to the Resonance Bus outside React hook lifecycle
 */
export function emitResonanceEvent(event: ResonanceEventInput): void {
  const payload: ResonanceEvent = {
    ...event,
    timestamp: new Date().toISOString()
  } as ResonanceEvent;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RESONANCE_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Ignore storage quota or permission errors
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(RESONANCE_CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch {
    // BroadcastChannel unsupported or blocked
  }
}

/**
 * React Hook for subscribing to and publishing events over the Cross-App Resonance Bus
 */
export function useResonanceBus(
  onEventReceived?: (event: ResonanceEvent) => void
): ResonanceBusState {
  const [lastEvent, setLastEvent] = useState<ResonanceEvent | null>(() => {
    try {
      const raw = localStorage.getItem(RESONANCE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(RESONANCE_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed.type === 'SOVEREIGN_COOLDOWN_ENGAGED';
    } catch {
      return false;
    }
  });

  const [activeCrisis, setActiveCrisis] = useState<CrisisModeEvent | null>(
    () => {
      try {
        const raw = localStorage.getItem(RESONANCE_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed.type === 'CRISIS_MODE_TRIGGERED' ? parsed : null;
      } catch {
        return null;
      }
    }
  );

  const channelRef = useRef<BroadcastChannel | null>(null);
  const callbackRef = useRef(onEventReceived);
  callbackRef.current = onEventReceived;

  const handleIncomingEvent = useCallback((event: ResonanceEvent) => {
    setLastEvent(event);

    if (event.type === 'SOVEREIGN_COOLDOWN_ENGAGED') {
      setIsCooldownActive(true);
    } else if (event.type === 'SOVEREIGN_COOLDOWN_RELEASED') {
      setIsCooldownActive(false);
    } else if (event.type === 'CRISIS_MODE_TRIGGERED') {
      setActiveCrisis(event as CrisisModeEvent);
    } else if (event.type === 'CRISIS_MODE_RESOLVED') {
      setActiveCrisis(null);
    }

    if (callbackRef.current) {
      callbackRef.current(event);
    }
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    try {
      channelRef.current = new BroadcastChannel(RESONANCE_CHANNEL_NAME);
      channelRef.current.onmessage = (
        msgEvent: MessageEvent<ResonanceEvent>
      ) => {
        if (msgEvent.data && typeof msgEvent.data.type === 'string') {
          handleIncomingEvent(msgEvent.data);
        }
      };
    } catch {
      // Channel creation failed gracefully
    }

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [handleIncomingEvent]);

  const publish = useCallback(
    (event: ResonanceEventInput) => {
      const fullEvent: ResonanceEvent = {
        ...event,
        timestamp: new Date().toISOString()
      } as ResonanceEvent;

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            RESONANCE_STORAGE_KEY,
            JSON.stringify(fullEvent)
          );
        }
      } catch {
        // Storage write failed
      }

      if (channelRef.current) {
        channelRef.current.postMessage(fullEvent);
      }

      handleIncomingEvent(fullEvent);
    },
    [handleIncomingEvent]
  );

  return {
    lastEvent,
    isCooldownActive,
    activeCrisis,
    publish
  };
}
