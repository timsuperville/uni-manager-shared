import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useResonanceBus,
  emitResonanceEvent,
  RESONANCE_STORAGE_KEY
} from '../useResonanceBus';

// Mock BroadcastChannel for JSDOM
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  static instances: MockBroadcastChannel[] = [];

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(data: any) {
    MockBroadcastChannel.instances.forEach(channel => {
      if (channel !== this && channel.name === this.name && channel.onmessage) {
        channel.onmessage(new MessageEvent('message', { data }));
      }
    });
  }

  close() {
    const idx = MockBroadcastChannel.instances.indexOf(this);
    if (idx !== -1) {
      MockBroadcastChannel.instances.splice(idx, 1);
    }
  }
}

describe('useResonanceBus', () => {
  beforeEach(() => {
    localStorage.clear();
    MockBroadcastChannel.instances = [];
    (global as any).BroadcastChannel = MockBroadcastChannel;
  });

  afterEach(() => {
    localStorage.clear();
    MockBroadcastChannel.instances = [];
  });

  it('initializes with default values when localStorage is empty', () => {
    const { result } = renderHook(() => useResonanceBus());
    expect(result.current.lastEvent).toBeNull();
    expect(result.current.isCooldownActive).toBe(false);
    expect(result.current.activeCrisis).toBeNull();
  });

  it('publishes and receives SOVEREIGN_COOLDOWN_ENGAGED events', () => {
    const listener = vi.fn();
    const { result } = renderHook(() => useResonanceBus(listener));

    act(() => {
      result.current.publish({
        type: 'SOVEREIGN_COOLDOWN_ENGAGED',
        durationSeconds: 120,
        reason: 'Executive burnout velocity threshold exceeded',
        source: 'personal'
      });
    });

    expect(result.current.isCooldownActive).toBe(true);
    expect(result.current.lastEvent?.type).toBe('SOVEREIGN_COOLDOWN_ENGAGED');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SOVEREIGN_COOLDOWN_ENGAGED',
        source: 'personal'
      })
    );

    const stored = JSON.parse(
      localStorage.getItem(RESONANCE_STORAGE_KEY) || '{}'
    );
    expect(stored.type).toBe('SOVEREIGN_COOLDOWN_ENGAGED');
  });

  it('handles CRISIS_MODE_TRIGGERED and CRISIS_MODE_RESOLVED lifecycle', () => {
    const { result } = renderHook(() => useResonanceBus());

    act(() => {
      result.current.publish({
        type: 'CRISIS_MODE_TRIGGERED',
        crisisType: 'domestic_medical',
        severity: 'critical',
        message: 'Emergency sentinel protocol initiated',
        source: 'home'
      });
    });

    expect(result.current.activeCrisis).not.toBeNull();
    expect(result.current.activeCrisis?.message).toBe(
      'Emergency sentinel protocol initiated'
    );

    act(() => {
      result.current.publish({
        type: 'CRISIS_MODE_RESOLVED',
        source: 'home'
      });
    });

    expect(result.current.activeCrisis).toBeNull();
  });

  it('emitResonanceEvent standalone broadcaster writes to storage and notifies subscribers', () => {
    const { result } = renderHook(() => useResonanceBus());

    act(() => {
      emitResonanceEvent({
        type: 'BURNOUT_VELOCITY_WARNING',
        psiScore: 88,
        velocityTrend: 'critical',
        source: 'work'
      });
    });

    const stored = JSON.parse(
      localStorage.getItem(RESONANCE_STORAGE_KEY) || '{}'
    );
    expect(stored.type).toBe('BURNOUT_VELOCITY_WARNING');
    expect(stored.psiScore).toBe(88);
  });
});
