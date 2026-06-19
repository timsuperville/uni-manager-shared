import React from 'react';
import { Edit2 } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import UserAvatar, { UserAvatarUser } from '../ui/UserAvatar';
import { Button } from '../ui/Button';

export interface IdentityCardProps {
  /** The user data representing the unified identity node. */
  user: UserAvatarUser;
  /** Subtitle to show under the name (e.g., job title or status) */
  subtitle?: string;
  /** Primary contact method (e.g., email or phone) */
  contactInfo?: string;
  /** Function to trigger when Edit is clicked. If omitted, Edit button is hidden. */
  onEdit?: () => void;
  /** Extra actions to render on the top right alongside the Edit button. */
  actions?: React.ReactNode;
  /** Additional faceted details specific to the app's domain. */
  children?: React.ReactNode;
}

/**
 * Shared IdentityCard primitive representing the UserOwned Identity core.
 * Host applications (Home, Church, Personal) compose this with domain-specific
 * settings to enforce the "Unified Core / Contextual Facets" architecture.
 */
export const IdentityCard: React.FC<IdentityCardProps> = ({
  user,
  subtitle,
  contactInfo,
  onEdit,
  actions,
  children
}) => {
  return (
    <Card variant="default">
      <CardContent padding="lg">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="shrink-0 relative">
            <UserAvatar user={user} size="lg" className="w-20 h-20 text-2xl" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: 'var(--font-display, inherit)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {user.displayName ||
                    user.name ||
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    'User'}
                </h1>
                {subtitle && (
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--text-accent)' }}
                  >
                    {subtitle}
                  </p>
                )}
                {contactInfo && (
                  <p
                    className="text-xs mt-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {contactInfo}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {actions}
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit2 size={14} />
                    <span>Edit Profile</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Faceted domain details */}
            {children && (
              <div className="mt-6 pt-6 border-t border-(--glass-outline)">
                {children}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IdentityCard;
