import { Card, CardContent } from './Card';

type CompositeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';

interface ColorTokens {
  bg: string;
  text: string;
  light: string;
  border: string;
}

const COLOR_VARS: Record<CompositeColor, ColorTokens> = {
  blue: {
    bg: 'var(--primary-resonance, #6366f1)',
    text: 'var(--primary-resonance, #6366f1)',
    light: 'var(--glass-surface, rgba(15,15,35,0.7))',
    border: 'var(--glass-outline, rgba(255,255,255,0.12))'
  },
  green: {
    bg: 'var(--color-success, #10b981)',
    text: 'var(--color-success, #10b981)',
    light: 'var(--glass-surface, rgba(15,15,35,0.7))',
    border: 'var(--glass-outline, rgba(255,255,255,0.12))'
  },
  purple: {
    bg: 'var(--cobalt, #7c3aed)',
    text: 'var(--cobalt, #7c3aed)',
    light: 'var(--glass-surface, rgba(15,15,35,0.7))',
    border: 'var(--glass-outline, rgba(255,255,255,0.12))'
  },
  orange: {
    bg: 'var(--color-warning, #f59e0b)',
    text: 'var(--color-warning, #f59e0b)',
    light: 'var(--glass-surface, rgba(15,15,35,0.7))',
    border: 'var(--glass-outline, rgba(255,255,255,0.12))'
  },
  red: {
    bg: 'var(--color-error, #ef4444)',
    text: 'var(--color-error, #ef4444)',
    light: 'var(--glass-surface, rgba(15,15,35,0.7))',
    border: 'var(--glass-outline, rgba(255,255,255,0.12))'
  }
};

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  action: () => void;
  color?: CompositeColor;
  actionText?: string;
}

/** QuickActionCard — icon, title, description, and CTA button. */
export function QuickActionCard({
  title,
  description,
  icon,
  action,
  color = 'blue',
  actionText = 'Get Started'
}: QuickActionCardProps) {
  const colors = COLOR_VARS[color] ?? COLOR_VARS.blue;
  return (
    <Card
      interactive
      style={{ background: colors.light, border: `1px solid ${colors.border}` }}
    >
      <CardContent padding="lg">
        <div className="flex items-start space-x-4">
          <div
            className="rounded-lg p-3 shrink-0"
            style={{ background: colors.bg }}
          >
            <span className="text-white text-xl">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-medium mb-1"
              style={{ color: colors.text }}
            >
              {title}
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--text-muted, #94a3b8)' }}
            >
              {description}
            </p>
            <button
              onClick={action}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-white"
              style={{ background: colors.bg }}
            >
              {actionText}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgressCardProps {
  title: string;
  progress: number;
  target: number;
  unit: string;
  description?: string;
  color?: CompositeColor;
}

/** ProgressCard — progress bar card towards a numeric goal. */
export function ProgressCard({
  title,
  progress,
  target,
  unit,
  description,
  color = 'blue'
}: ProgressCardProps) {
  const percentage = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  const colors = COLOR_VARS[color] ?? COLOR_VARS.blue;
  return (
    <Card style={{ background: colors.light }}>
      <CardContent padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium" style={{ color: colors.text }}>
            {title}
          </h3>
          <span
            className="text-sm"
            style={{ color: 'var(--text-muted, #94a3b8)' }}
          >
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="mb-4">
          <div
            className="flex justify-between text-sm mb-2"
            style={{ color: 'var(--text-muted, #94a3b8)' }}
          >
            <span>
              {progress} {unit}
            </span>
            <span>
              {target} {unit}
            </span>
          </div>
          <div
            className="w-full rounded-full h-2"
            style={{
              background: 'var(--glass-outline, rgba(255,255,255,0.12))'
            }}
          >
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%`, background: colors.bg }}
            />
          </div>
        </div>
        {description && (
          <p
            className="text-sm"
            style={{ color: 'var(--text-muted, #94a3b8)' }}
          >
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
