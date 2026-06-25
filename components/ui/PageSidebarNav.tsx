import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PageSidebarNavItem {
  /** Display label */
  label: string;
  /** Full path this item links to (e.g. "/platform/backups/overview") */
  path: string;
  /** Optional icon node */
  icon?: React.ReactNode;
  /** Optional badge text or number */
  badge?: React.ReactNode;
}

export interface PageSidebarNavProps {
  items: PageSidebarNavItem[];
  /** Optional section title rendered above the nav */
  title?: string;
  /** Optional section subtitle */
  subtitle?: string;
  /** Custom width for the sidebar, defaults to '240px' */
  width?: string;
}

/**
 * PageSidebarNav — Vertical sub-navigation rail for complex modular pages.
 *
 * Replaces massive Radix UI <Tabs> to avoid horizontal wrapping issues and
 * to properly leverage React Router for deep linking.
 */
export function PageSidebarNav({
  items,
  title,
  subtitle,
  width = '220px'
}: PageSidebarNavProps) {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 860) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentWidth = isCollapsed ? '64px' : width;

  return (
    <nav
      style={{
        width: currentWidth,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        borderRight: '1px solid var(--glass-outline)',
        paddingRight: isCollapsed ? '0' : '16px',
        minHeight: '400px',
        transition: 'width 0.2s ease, padding 0.2s ease',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0 0 16px 0' : '0 8px 16px',
          marginBottom: '8px',
          borderBottom: '1px solid var(--glass-outline)'
        }}
      >
        {!isCollapsed && (
          <div style={{ minWidth: 0, paddingRight: '8px' }}>
            {title && (
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-headline)',
                  letterSpacing: '-0.01em',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  margin: '4px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            flexShrink: 0,
            transition: 'color 0.2s ease'
          }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          onMouseEnter={e =>
            (e.currentTarget.style.color = 'var(--text-primary)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.color = 'var(--text-muted)')
          }
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {items.map(item => {
        // A route is active if it exactly matches, or if it's a parent of the current route
        // We add a trailing slash to ensure /foo doesn't match /foobar
        const isActive =
          pathname === item.path || pathname.startsWith(item.path + '/');

        return (
          <Link
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.label : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              padding: isCollapsed ? '10px 0' : '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '500',
              color: isActive
                ? 'var(--primary-live-sync)'
                : 'var(--text-secondary)',
              background: isActive ? 'hsla(187, 84%, 44%, 0.1)' : 'transparent',
              border: '1px solid',
              borderColor: isActive
                ? 'hsla(187, 84%, 44%, 0.2)'
                : 'transparent',
              transition: 'all 150ms ease',
              fontFamily: 'var(--font-body)'
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-surface-1)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isCollapsed ? '0' : '8px',
                justifyContent: 'center'
              }}
            >
              {item.icon && (
                <span
                  style={{
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {item.icon}
                </span>
              )}
              {!isCollapsed && <span>{item.label}</span>}
            </div>
            {!isCollapsed && item.badge && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isActive
                    ? 'hsla(187, 84%, 44%, 0.2)'
                    : 'var(--bg-surface-2)',
                  color: isActive
                    ? 'var(--primary-live-sync)'
                    : 'var(--text-muted)'
                }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default PageSidebarNav;
