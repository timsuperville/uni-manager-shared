import React from 'react';
import { ChevronDown, WifiOff, Ghost } from 'lucide-react';

import { UserAvatar } from '../../../components/ui';
import { getUserDisplayName } from '../../../utils';
import type { User } from '../../types/auth.types';
import type { AppConfig } from '../../config/appConfigs';

interface UserMenuTriggerProps {
  buttonRef: React.RefObject<HTMLButtonElement>;
  triggerId: string;
  panelId: string;
  isOpen: boolean;
  user: User;
  appConfig: AppConfig;
  roleLabel?: string;
  hasPresence: boolean;
  isConnected: boolean;
  status: string;
  statusDotColor: string;
  onToggle: () => void;
  onMouseEnter: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave: React.MouseEventHandler<HTMLButtonElement>;
  triggerBorder: string;
  triggerBg: string;
}

/**
 * UserMenuTrigger — the pill button that opens/closes the UserMenu dropdown.
 * Purely presentational — all state and handlers come from UserMenu.
 */
function UserMenuTrigger({
  buttonRef,
  triggerId,
  panelId,
  isOpen,
  user,
  appConfig,
  roleLabel,
  hasPresence,
  isConnected,
  status,
  statusDotColor,
  onToggle,
  onMouseEnter,
  onMouseLeave,
  triggerBorder,
  triggerBg
}: UserMenuTriggerProps) {
  return (
    <button
      ref={buttonRef}
      id={triggerId}
      onClick={onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label="User menu"
      aria-controls={isOpen ? panelId : undefined}
      className="focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 10px 4px 4px',
        borderRadius: '100px',
        border: `1px solid ${triggerBorder}`,
        background: triggerBg,
        cursor: 'pointer',
        transition: 'all 200ms ease',
        outline: 'none'
      }}
    >
      {/* Avatar + presence dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <UserAvatar user={user} appConfig={appConfig} size="xs" />
        {hasPresence && (
          <span
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: isConnected
                ? statusDotColor
                : 'var(--color-warning, hsl(38,95%,54%))',
              border:
                '2px solid var(--bg-sidebar, var(--bg-obsidian, #0a0e1a))',
              transition: 'background 300ms ease'
            }}
            title={
              !isConnected
                ? 'Offline'
                : status === 'available'
                  ? 'Available'
                  : 'Unavailable'
            }
            aria-hidden="true"
          />
        )}
      </div>

      {/* Name + role subtitle — hidden on mobile */}
      <div className="hidden md:block" style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: '500',
            color: 'var(--text-secondary)',
            maxWidth: '110px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2
          }}
        >
          {getUserDisplayName(user)}
        </p>
        {roleLabel && (
          <p
            style={{
              margin: 0,
              fontSize: '10px',
              color: user.isGhost ? 'hsla(0,80%,68%,1)' : 'var(--text-muted)',
              maxWidth: '110px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={
              user.isGhost
                ? `Ghost: ${user.impersonatorEmail || 'Admin'}`
                : undefined
            }
          >
            {user.isGhost && (
              <Ghost
                size={10}
                style={{ animation: 'status-pulse 2s ease-in-out infinite' }}
              />
            )}
            {roleLabel}
          </p>
        )}
      </div>

      {/* Offline badge */}
      {hasPresence && !isConnected && (
        <WifiOff
          size={12}
          style={{
            color: 'var(--color-warning, hsl(38,95%,54%))',
            flexShrink: 0
          }}
          aria-label="Offline"
        />
      )}

      {/* Chevron */}
      <ChevronDown
        size={12}
        style={{
          color: 'var(--text-ghost, var(--text-muted))',
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 200ms ease',
          flexShrink: 0
        }}
      />
    </button>
  );
}

export default UserMenuTrigger;
