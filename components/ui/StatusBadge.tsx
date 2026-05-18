import { Chip, CHIP_VARIANTS } from './Chip';

type ChipVariantKey = keyof typeof CHIP_VARIANTS;

interface CustomStyle {
  bg?: string;
  color?: string;
  border?: string;
  dot?: string;
}

interface StatusBadgeProps {
  label: string;
  variant?: ChipVariantKey;
  customStyle?: CustomStyle;
}

/**
 * StatusBadge — Liquid Glass backward-compatible wrapper around Chip.
 * Renders a pill with a status dot + label.
 */
export function StatusBadge({ label, variant, customStyle }: StatusBadgeProps) {
  if (customStyle) {
    return (
      <Chip
        bg={customStyle.bg}
        color={customStyle.color}
        border={customStyle.border}
        label={label}
        dot={!!customStyle.dot}
        dotColor={customStyle.dot ?? undefined}
        size="sm"
      />
    );
  }
  return <Chip variant={variant ?? 'muted'} label={label} dot size="sm" />;
}

/** Re-exported for backward-compat — callers that used STATUS_VARIANTS don't need to change. */
export { CHIP_VARIANTS as STATUS_VARIANTS };
