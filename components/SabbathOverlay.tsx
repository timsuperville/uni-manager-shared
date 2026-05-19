import React, { useState, useEffect } from 'react';
import { useAuth } from '@shared/auth';

export const SabbathOverlay: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if Sabbath Sequence is active from user preferences
    if (user && user.preferences?.sabbathSequence) {
      const sabbath = user.preferences.sabbathSequence;
      let active = sabbath.isActive;

      if (
        !active &&
        sabbath.scheduledStartDay !== null &&
        sabbath.scheduledStartTime
      ) {
        const now = new Date();
        if (now.getDay() === sabbath.scheduledStartDay) {
          const [hours, minutes] = sabbath.scheduledStartTime
            .split(':')
            .map(Number);
          const startDateTime = new Date(now);
          startDateTime.setHours(hours, minutes, 0, 0);
          const endDateTime = new Date(startDateTime);
          endDateTime.setHours(startDateTime.getHours() + 24);

          if (now >= startDateTime && now <= endDateTime) {
            active = true;
          }
        }
      }

      setIsActive(active && sabbath.lockAppUI);
    }
  }, [user]);

  if (!isActive || isDismissed) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Underlying app content */}
      <div className="w-full h-full blur-sm pointer-events-none">
        {children}
      </div>

      {/* Liquid Glass Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
        <div className="glass-card p-10 max-w-lg text-center border border-[var(--glass-outline)] rounded-2xl shadow-2xl animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-6 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-display text-[var(--text-primary)] mb-4 tracking-tight">
            Sabbath Sequence Active
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 text-lg leading-relaxed">
            You are currently observing a time of rest. Notifications are
            suppressed and external signals are paused. Return to stillness.
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setIsDismissed(true)}
              className="px-6 py-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)] transition-all duration-300 shadow-sm"
            >
              Override Lock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
