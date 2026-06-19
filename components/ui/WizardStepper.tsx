import React from 'react';
import { CheckCircle } from 'lucide-react';
import { flex1 } from '@shared/styles/styleUtils';

interface WizardStep {
  label?: string;
  icon?: React.ElementType;
}

interface WizardStepperProps {
  steps: WizardStep[];
  activeStep?: number;
  completed?: Set<number>;
  className?: string;
}

/**
 * WizardStepper — Modern UI horizontal step indicator.
 * Active/completed states use CSS vars for per-app branding.
 */
export function WizardStepper({
  steps = [],
  activeStep = 0,
  completed = new Set<number>(),
  className = ''
}: WizardStepperProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}
    >
      {steps.map((step, i) => {
        const isDone = completed.has(i);
        const isActive = i === activeStep;
        return (
          <div
            key={step.label ?? i}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 72,
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isDone
                    ? 'var(--accent-emerald, var(--color-success, #22c55e))'
                    : isActive
                      ? 'var(--primary-live-sync, var(--color-primary, #6366f1))'
                      : 'var(--glass-outline, var(--glass-border, rgba(255,255,255,0.1)))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.25rem',
                  transition: 'background 0.2s ease'
                }}
              >
                {isDone ? (
                  <CheckCircle size={16} style={{ color: '#fff' }} />
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      color: isActive ? '#fff' : 'var(--text-muted, #94a3b8)',
                      fontWeight: isActive ? 600 : 400
                    }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: '0.65rem',
                  color: isActive
                    ? 'var(--text-primary, #f1f5f9)'
                    : 'var(--text-muted, #94a3b8)',
                  margin: 0,
                  fontWeight: isActive ? 600 : 400,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap'
                }}
              >
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  height: 2,
                  minWidth: 16,
                  background: isDone
                    ? 'var(--accent-emerald, var(--color-success, #22c55e))'
                    : 'var(--glass-outline, rgba(255,255,255,0.1))',
                  borderRadius: 1,
                  alignSelf: 'flex-start',
                  marginTop: 15,
                  transition: 'background 0.2s ease',
                  ...flex1
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default WizardStepper;
