/**
 * FeedbackQuickAction â€” Shared Feedback Submission Component
 *
 * Variants:
 *   "sidebar-item"    â€” pinned nav row for sidebar footer (preferred for sidebar apps)
 *   "sidebar-icon"    â€” collapsed icon-only mode
 *   "button"          â€” inline button for header placement
 *   "bottom-nav-item" â€” icon + label for mobile bottom nav
 *   "quick-react"     â€” 3-emoji inline strip
 *   "floating"        â€” FAB, only for apps without a persistent sidebar (e.g. playback)
 *
 * Uses inline styles throughout to avoid Tailwind JIT scanning gaps in shared/.
 */

import React, { useState } from 'react';
import { FeedbackModalPortal } from './FeedbackModal';
import { FEEDBACK_SOURCES, resolveSource } from './constants';
import { useOptionalUser } from './hooks/useOptionalUser';
import { collectSystemContext } from './utils/collectSystemContext';
import type { FeedbackUser } from './utils/collectSystemContext';
import { useFrustrationDetector } from '../../hooks/useFrustrationDetector.js';
import { getApiBaseUrl } from '../../api/config/apiConfig';

// â”€â”€â”€ Schema field limits (must match FeedbackReport Mongoose schema) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Enforced here at the network boundary so no caller can overflow regardless
// of what string they pass in.
const TITLE_MAX = 200;
const DESC_MAX = 1000;

function trunc(str: string | null | undefined, max: number): string {
  if (!str || str.length <= max) return str ?? '';
  return str.slice(0, max - 1) + '\u2026';
}

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type FabPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
type Variant =
  | 'sidebar-item'
  | 'sidebar-icon'
  | 'button'
  | 'bottom-nav-item'
  | 'quick-react'
  | 'floating';
type Sentiment = 'positive' | 'neutral' | 'negative';

/** Shape of the context object passed to useFrustrationDetector onFrustrated. */
type FrustrationContext = { signal: string; source: string; path: string };

interface SilentSubmitOptions {
  title?: string;
  description?: string;
  appType?: string;
  severity?: string;
  user?: FeedbackUser | null;
  source?: string | null;
}

export interface FeedbackQuickActionProps {
  variant?: Variant;
  position?: FabPosition;
  appType?: string;
  accentColor?: string;
  onSubmitSuccess?: () => void;
}

// â”€â”€â”€ Silent auto-submit (used by ErrorBoundary, no UI) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Fire-and-forget â€” never throws, never alerts the user.
export async function submitFeedbackSilently({
  title,
  description,
  appType,
  severity = 'high',
  user = null,
  source = null
}: SilentSubmitOptions = {}): Promise<void> {
  try {
    const appName =
      appType ??
      (typeof window !== 'undefined'
        ? (import.meta?.env?.VITE_APP_TYPE as string | undefined)
        : undefined) ??
      'unknown';

    const namespaces = [
      appName,
      'admin',
      'church',
      'personal',
      'home',
      'work',
      'uni'
    ].filter(Boolean);
    let authToken: string | null = null;
    for (const ns of namespaces) {
      const key = `${ns}_auth_access_token`;
      authToken =
        window.sessionStorage?.getItem(key) ||
        window.localStorage?.getItem(key);
      if (authToken) break;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const systemCtx = collectSystemContext(appName, user ?? null);
    systemCtx.source = resolveSource(source);

    await fetch(`${getApiBaseUrl()}/api/v1/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'error-report',
        category: 'bug',
        severity,
        userInput: {
          title: trunc(title, TITLE_MAX),
          description: trunc(description, DESC_MAX),
          allowContact: false
        },
        systemContext: systemCtx
      })
    });
  } catch {
    // Intentionally silent â€” never surface auto-report errors to users
  }
}

// â”€â”€â”€ Shared trigger icon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ChatBubbleIconProps {
  size?: number;
  strokeWidth?: number;
}

const ChatBubbleIcon: React.FC<ChatBubbleIconProps> = ({
  size = 15,
  strokeWidth = 1.8
}) => (
  <svg
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    style={{ flexShrink: 0 }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

// â”€â”€â”€ Public Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const FeedbackQuickAction: React.FC<FeedbackQuickActionProps> = ({
  variant = 'sidebar-item',
  position = 'bottom-right',
  appType,
  accentColor,
  onSubmitSuccess
}) => {
  const user = useOptionalUser();
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState({ title: '', description: '' });
  // R4 â€” 'reacted' declared here so hooks are never called inside a conditional branch
  const [reacted, setReacted] = useState(false);

  const appName =
    appType ??
    (typeof window !== 'undefined'
      ? (import.meta?.env?.VITE_APP_TYPE as string | undefined)
      : undefined) ??
    'unknown';

  // Passive frustration detection
  useFrustrationDetector({
    appType: appName,
    disableInDev: true,
    onFrustrated: ({ signal, source, path }: FrustrationContext) => {
      const title =
        signal === 'rage-click'
          ? `Repeated click detected on ${path}`
          : `Rapid navigation on ${path}`;
      const description =
        signal === 'rage-click'
          ? `The user clicked rapidly in the same area, which may indicate a broken interaction or unresponsive element at ${path}.`
          : `The user navigated rapidly across multiple pages starting at ${path}, which may indicate difficulty finding what they need.`;
      setPrefill({ title, description });
      void submitFeedbackSilently({
        title,
        description,
        appType: appName,
        severity: 'medium',
        user,
        source
      });
    }
  });

  const modalProps = {
    onClose: () => setIsOpen(false),
    onSubmitSuccess,
    appType: appName,
    user,
    initialTitle: prefill.title,
    initialDescription: prefill.description
  };

  // â”€â”€ VARIANT: sidebar-item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (variant === 'sidebar-item') {
    const accent = accentColor || 'var(--primary-resonance, #22d3ee)';
    return (
      <>
        <button
          id="feedback-sidebar-trigger"
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 150ms ease',
            fontFamily: 'var(--font-body, inherit)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background =
              'var(--nav-hover, rgba(255,255,255,0.06))';
            e.currentTarget.style.color = accent;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary, #94a3b8)';
          }}
          title="Share feedback or report a bug"
        >
          <span style={{ color: 'var(--text-muted, #64748b)', flexShrink: 0 }}>
            <ChatBubbleIcon />
          </span>
          <span>Share Feedback</span>
        </button>
        {isOpen && <FeedbackModalPortal {...modalProps} />}
      </>
    );
  }

  // â”€â”€ VARIANT: sidebar-icon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (variant === 'sidebar-icon') {
    const accent = accentColor || 'var(--primary-resonance, #22d3ee)';
    return (
      <>
        <button
          id="feedback-sidebar-icon-trigger"
          onClick={() => setIsOpen(true)}
          title="Share Feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted, #64748b)',
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background =
              'var(--nav-hover, rgba(255,255,255,0.06))';
            e.currentTarget.style.color = accent;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted, #64748b)';
          }}
        >
          <ChatBubbleIcon />
        </button>
        {isOpen && <FeedbackModalPortal {...modalProps} />}
      </>
    );
  }

  // â”€â”€ VARIANT: button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (variant === 'button') {
    return (
      <>
        <button
          id="feedback-header-trigger"
          onClick={() => setIsOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(128,128,128,0.25)',
            background: 'transparent',
            color: 'var(--text-secondary, #64748b)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            fontFamily: 'var(--font-body, inherit)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(128,128,128,0.1)';
            e.currentTarget.style.color = 'var(--text-primary, inherit)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary, #64748b)';
          }}
        >
          <ChatBubbleIcon />
          <span>Feedback</span>
        </button>
        {isOpen && <FeedbackModalPortal {...modalProps} />}
      </>
    );
  }

  // â”€â”€ VARIANT: bottom-nav-item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (variant === 'bottom-nav-item') {
    const accent = accentColor || 'var(--primary-resonance, #22d3ee)';
    return (
      <>
        <button
          id="feedback-bottom-nav-trigger"
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'var(--font-body, inherit)',
            transition: 'background 150ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--primary-subtle, rgba(99,102,241,0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              flexShrink: 0
            }}
          >
            <ChatBubbleIcon size={18} />
          </span>
          <div>
            <div
              style={{
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Share Feedback
            </div>
            <div
              style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px' }}
            >
              Report a bug or suggest a feature
            </div>
          </div>
        </button>
        {isOpen && <FeedbackModalPortal {...modalProps} />}
      </>
    );
  }

  // â”€â”€ VARIANT: quick-react â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (variant === 'quick-react') {
    const handleReact = (emoji: string, sentiment: Sentiment) => {
      if (reacted) return;
      if (sentiment === 'positive') {
        setReacted(true);
        void submitFeedbackSilently({
          title: `Quick reaction: ${emoji}`,
          description: `User gave a positive quick reaction on ${window.location.pathname}`,
          appType: appName,
          severity: 'low',
          source: FEEDBACK_SOURCES.MANUAL
        });
      } else {
        setIsOpen(true);
      }
    };

    return (
      <>
        {reacted ? (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary, #64748b)',
              padding: '4px 8px'
            }}
          >
            Thanks! ðŸ™Œ
          </span>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(128,128,128,0.06)',
              borderRadius: '20px',
              padding: '4px 8px',
              border: '1px solid rgba(128,128,128,0.15)'
            }}
          >
            {(
              [
                {
                  emoji: 'ðŸ˜Š',
                  label: 'Great',
                  sentiment: 'positive' as Sentiment
                },
                {
                  emoji: 'ðŸ˜',
                  label: 'Okay',
                  sentiment: 'neutral' as Sentiment
                },
                {
                  emoji: 'ðŸ˜¤',
                  label: 'Frustrating',
                  sentiment: 'negative' as Sentiment
                }
              ] as const
            ).map(({ emoji, label, sentiment }) => (
              <button
                key={sentiment}
                id={`quick-react-${sentiment}`}
                title={label}
                onClick={() => handleReact(emoji, sentiment)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '2px 4px',
                  borderRadius: '6px',
                  lineHeight: 1,
                  transition: 'transform 120ms ease'
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.transform = 'scale(1.25)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        {isOpen && (
          <FeedbackModalPortal
            onClose={() => setIsOpen(false)}
            appType={appName}
            user={user}
          />
        )}
      </>
    );
  }

  // â”€â”€ VARIANT: floating (FAB) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const positionMap: Record<FabPosition, React.CSSProperties> = {
    'bottom-right': { bottom: '24px', right: '24px' },
    'bottom-left': { bottom: '24px', left: '24px' },
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' }
  };

  return (
    <>
      <div style={{ position: 'fixed', zIndex: 40, ...positionMap[position] }}>
        <button
          id="feedback-fab-trigger"
          onClick={() => setIsOpen(true)}
          title="Send Feedback"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, var(--primary-resonance), var(--primary-hover, var(--primary-resonance)))',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px var(--primary-glow, rgba(0,0,0,0.3))',
            transition: 'transform 150ms ease, box-shadow 150ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
          }}
        >
          <ChatBubbleIcon size={20} strokeWidth={2} />
        </button>
      </div>
      {isOpen && <FeedbackModalPortal {...modalProps} />}
    </>
  );
};

export default FeedbackQuickAction;

// Re-export constants so consumers can import from one place
export { FEEDBACK_SOURCES } from './constants';
