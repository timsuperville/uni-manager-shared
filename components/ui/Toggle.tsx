import React from 'react';
import { glassBorder } from '@shared/styles/styleUtils';

interface ToggleProps extends Omit<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  'onChange'
> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/** Toggle — Modern UI accessible switch. Brand colour via --primary-live-sync. */
export function Toggle({
  checked = false,
  onChange,
  label,
  disabled = false,
  className = '',
  id,
  ...props
}: ToggleProps) {
  const handleClick = () => {
    if (!disabled && onChange) onChange(!checked);
  };
  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onChange) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label
      className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      {...props}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        aria-label={props['aria-label'] || label}
        aria-labelledby={props['aria-labelledby']}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKey}
        style={{
          display: 'inline-block',
          width: 36,
          height: 20,
          borderRadius: 10,
          background: checked
            ? 'var(--primary-live-sync)'
            : 'var(--glass-outline)',
          position: 'relative',
          transition: 'background 0.2s',
          cursor: disabled ? 'not-allowed' : 'pointer',
          flexShrink: 0,
          outline: 'none',
          border: 'none',
          padding: 0,
          ...glassBorder
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 17 : 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'var(--text-primary)',
            transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
        />
      </button>
      {label && (
        <span
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            userSelect: 'none'
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}

export default Toggle;
