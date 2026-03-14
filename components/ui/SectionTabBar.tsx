import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface SectionTab {
  /** Display label */
  label: string;
  /** Full path this tab links to (e.g. "/users/overview") */
  path: string;
  /** Optional icon node */
  icon?: React.ReactNode;
}

interface SectionTabBarProps {
  tabs: SectionTab[];
  /** Section title shown left of the tab rail */
  title?: string;
  /** Small subtitle / mandate description */
  subtitle?: string;
}

/**
 * SectionTabBar — URL-driven horizontal tab rail for Hub pages.
 *
 * Active state is derived from the current URL pathname so tabs survive
 * page refresh and are fully bookmarkable. Uses Liquid Glass CSS tokens;
 * no hardcoded colours.
 */
export function SectionTabBar({ tabs, title, subtitle }: SectionTabBarProps) {
  const { pathname } = useLocation();

  return (
    <div
      style={{
        borderBottom: '1px solid var(--glass-outline)',
        marginBottom: '24px',
        paddingBottom: '0',
      }}
    >
      {/* Section header */}
      {(title ?? subtitle) && (
        <div style={{ marginBottom: '16px' }}>
          {title && (
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-headline)',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '3px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.03em',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Tab rail */}
      <nav style={{ display: 'flex', gap: '0', alignItems: 'flex-end' }}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/');
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? 'var(--primary-resonance)' : 'var(--text-muted)',
                textDecoration: 'none',
                borderBottom: isActive
                  ? '2px solid var(--primary-resonance)'
                  : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'color 150ms ease, border-color 150ms ease',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-body)',
                letterSpacing: isActive ? '-0.01em' : '0',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    'var(--text-muted)';
                }
              }}
            >
              {tab.icon && (
                <span style={{ fontSize: '14px', lineHeight: 1 }}>{tab.icon}</span>
              )}
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default SectionTabBar;
