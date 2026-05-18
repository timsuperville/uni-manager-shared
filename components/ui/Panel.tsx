import React, { useEffect } from 'react';
import { glassBackground, glassBorder, flex1 } from '@shared/styles/styleUtils';

interface PanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  className?: string;
  padded?: boolean;
}

/** Panel — Liquid Glass slide-over drawer anchored to the right. */
export function Panel({
  open,
  onClose,
  title,
  children,
  footer,
  width = 440,
  className = '',
  padded = true
}: PanelProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Panel overlay'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          cursor: 'pointer',
          animation: 'fadeInBg 0.2s ease-out forwards'
        }}
      />
      <div
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: width,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          boxShadow: '-12px 0 48px rgba(0,0,0,0.45)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          ...glassBackground,
          ...glassBorder
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            ...glassBorder
          }}
        >
          {title ? (
            <h3
              style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display, inherit)'
              }}
            >
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.color = 'var(--text-primary)')
            }
            onMouseLeave={e =>
              (e.currentTarget.style.color = 'var(--text-muted)')
            }
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div
          style={{
            overflowY: 'auto',
            padding: padded ? '1.5rem' : '0',
            ...flex1
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: 'rgba(0,0,0,0.2)',
              ...glassBorder
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Panel;
