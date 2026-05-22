import React, { useState, useCallback } from 'react';

export interface KVProps {
  label: string;
  value?: string | number | null | unknown;
  mono?: boolean;
  copyable?: boolean;
  link?: string;
  className?: string;
}

export const KV: React.FC<KVProps> = ({
  label,
  value,
  mono = false,
  copyable = false,
  link,
  className = ''
}) => {
  // Guard: convert any object/array to a displayable string so React never
  // receives a plain object as a child (crashes with "Objects are not valid…").
  const toSafeDisplay = (v: unknown): string | null => {
    if (v == null) return null;
    if (typeof v === 'object') {
      return Array.isArray(v)
        ? v.map(toSafeDisplay).join(', ')
        : JSON.stringify(v, null, 1);
    }
    return String(v);
  };
  const displayValue = toSafeDisplay(value);

  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!displayValue) return;
      navigator.clipboard
        ?.writeText(displayValue)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
        .catch(err => {
          if (import.meta.env.DEV)
            console.warn('[KV] Clipboard write failed:', err);
        });
    },
    [displayValue]
  );

  return (
    <div style={{ marginBottom: '10px' }} className={className}>
      <div
        style={{
          fontSize: '9px',
          fontWeight: '700',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '2px'
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '5px',
          fontSize: '12px',
          color: displayValue ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
          wordBreak: 'break-all',
          lineHeight: 1.4
        }}
      >
        {link && displayValue ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              color: 'var(--cobalt)',
              textDecoration: 'none'
            }}
          >
            {displayValue}
          </a>
        ) : (
          <span style={{ flex: 1 }}>{displayValue || '—'}</span>
        )}
        {copyable && displayValue && (
          <button
            onClick={copy}
            title="Copy to clipboard"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              color: copied ? 'hsl(160,70%,55%)' : 'var(--text-muted)',
              padding: '0 2px',
              flexShrink: 0,
              marginTop: '1px',
              transition: 'color 150ms ease',
              fontFamily: 'var(--font-body)'
            }}
          >
            {copied ? '✓ Copied' : '⎘'}
          </button>
        )}
      </div>
    </div>
  );
};
