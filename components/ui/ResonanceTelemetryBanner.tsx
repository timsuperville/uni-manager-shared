import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Wind,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  BellOff
} from 'lucide-react';
import { useResonanceBus } from '../../hooks/useResonanceBus';

export interface ResonanceTelemetryBannerProps {
  className?: string;
  sourceDomain?: 'personal' | 'home' | 'work' | 'church';
}

export const ResonanceTelemetryBanner: React.FC<
  ResonanceTelemetryBannerProps
> = ({ className = '', sourceDomain = 'personal' }) => {
  const { isCooldownActive, activeCrisis, publish } = useResonanceBus();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900);
  const [breathingPhase, setBreathingPhase] = useState<
    'inhale' | 'hold' | 'exhale'
  >('inhale');

  useEffect(() => {
    if (!isCooldownActive) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(prev - 1, 0));
    }, 1000);

    const breathInterval = setInterval(() => {
      setBreathingPhase(prev => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(breathInterval);
    };
  }, [isCooldownActive]);

  const handleStartCooldown = (durationMinutes: number = 15) => {
    setSecondsRemaining(durationMinutes * 60);
    publish({
      type: 'SOVEREIGN_COOLDOWN_ENGAGED',
      durationSeconds: durationMinutes * 60,
      reason: 'User activated Sovereign Cooldown protocol',
      source: sourceDomain
    });
  };

  const handleReleaseCooldown = () => {
    publish({
      type: 'SOVEREIGN_COOLDOWN_RELEASED',
      source: sourceDomain
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`w-full space-y-3 ${className}`}
      id="resonance-telemetry-banner"
    >
      {/* Ecosystem Crisis Alert */}
      {activeCrisis && (
        <div
          className="p-4 rounded-2xl flex items-center justify-between gap-4 border transition-all"
          style={{
            background:
              'linear-gradient(135deg, hsla(350,85%,55%,0.15), hsla(340,90%,45%,0.08))',
            borderColor: 'hsla(350,85%,55%,0.35)',
            boxShadow: '0 8px 32px hsla(350,85%,55%,0.15)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'hsla(350,85%,55%,0.2)',
                color: 'hsl(350,85%,65%)'
              }}
            >
              <AlertTriangle size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Ecosystem Crisis Active
                </span>
                <span className="text-xs opacity-60">
                  Source: {activeCrisis.source}
                </span>
              </div>
              <p className="text-sm font-medium mt-0.5">
                {activeCrisis.message ||
                  'Urgent crisis protocol active across suite.'}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              publish({ type: 'CRISIS_MODE_RESOLVED', source: sourceDomain })
            }
            className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer"
            style={{
              background: 'hsla(350,85%,55%,0.2)',
              color: 'hsl(350,85%,80%)',
              border: '1px solid hsla(350,85%,55%,0.4)'
            }}
          >
            Resolve
          </button>
        </div>
      )}

      {/* Sovereign Cooldown / Bio-Friction Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all duration-300 ${
          isCooldownActive ? 'border-violet-500/40 p-5' : 'p-4'
        }`}
        style={{
          background: isCooldownActive
            ? 'linear-gradient(135deg, hsla(265,85%,60%,0.12), hsla(240,80%,50%,0.06))'
            : 'var(--glass-surface, rgba(255,255,255,0.03))',
          borderColor: isCooldownActive
            ? 'hsla(265,85%,60%,0.4)'
            : 'var(--glass-outline, rgba(255,255,255,0.08))'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: isCooldownActive
                  ? 'linear-gradient(135deg, hsl(265,85%,60%), hsl(240,80%,55%))'
                  : 'hsla(265,85%,60%,0.12)',
                color: isCooldownActive ? '#fff' : 'hsl(265,85%,65%)',
                boxShadow: isCooldownActive
                  ? '0 0 24px hsla(265,85%,60%,0.4)'
                  : 'none'
              }}
            >
              {isCooldownActive ? (
                <Wind size={20} className="animate-pulse" />
              ) : (
                <ShieldCheck size={20} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">
                  {isCooldownActive
                    ? 'Sovereign Cooldown Active'
                    : 'Sanctuary Shield Active'}
                </h3>
                {isCooldownActive && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
                    style={{
                      background: 'hsla(265,85%,60%,0.2)',
                      color: 'hsl(265,85%,75%)',
                      border: '1px solid hsla(265,85%,60%,0.4)'
                    }}
                  >
                    {breathingPhase === 'inhale'
                      ? '🌬️ Inhale'
                      : breathingPhase === 'hold'
                        ? '⏸️ Hold'
                        : '💨 Exhale'}
                  </span>
                )}
              </div>
              <p className="text-xs opacity-70 mt-0.5">
                {isCooldownActive
                  ? `Bio-friction engaged across workspaces (${formatTime(
                      secondsRemaining
                    )} remaining).`
                  : 'Cross-app live sync protecting focus and cognitive equilibrium.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {isCooldownActive ? (
              <button
                onClick={handleReleaseCooldown}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                style={{
                  border: '1px solid hsla(265,85%,60%,0.3)',
                  color: 'hsl(265,85%,80%)',
                  background: 'hsla(265,85%,60%,0.1)'
                }}
              >
                <PlayCircle size={14} />
                Release
              </button>
            ) : (
              <button
                onClick={() => handleStartCooldown(15)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                style={{
                  background:
                    'linear-gradient(135deg, hsla(265,85%,60%,0.15), hsla(240,80%,55%,0.1))',
                  border: '1px solid hsla(265,85%,60%,0.3)',
                  color: 'hsl(265,85%,75%)'
                }}
              >
                <PauseCircle size={14} />
                15m Sanctuary
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
