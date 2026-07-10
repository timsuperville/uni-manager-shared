import React from 'react';
import { Badge, Button } from '.';
import {
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

interface UserProps {
  user: {
    _id: string;
    name: string;
    role: string;
    isOnline: boolean;
    lastActive?: Date;
  };
}

export function User({ user }: UserProps) {
  return (
    <div
      key={user._id}
      className="px-6 py-4 transition-colors"
      style={{ borderBottom: '1px solid var(--glass-outline)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Member Avatar */}
          <div className="relative">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-surface-2)' }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
            {/* Online Status Indicator */}
            <div
              className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full"
              style={{
                border: '2px solid var(--glass-surface)',
                background: user.isOnline
                  ? 'var(--color-success)'
                  : 'var(--text-muted)'
              }}
            ></div>
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {user.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                variant={
                  (user.role === 'parent'
                    ? 'primary'
                    : user.role === 'guardian'
                      ? 'purple'
                      : user.role === 'member'
                        ? 'success'
                        : user.role === 'child'
                          ? 'warning'
                          : 'default') as any
                }
                size="sm"
              >
                {user.role}
              </Badge>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {user.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Member Actions */}
        <div className="flex items-center space-x-2">
          {/* Quick Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Send message to', user.name);
            }}
            className="p-1"
            title="Send message"
            aria-label={`Send message to ${user.name}`}
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
          </Button>

          {/* More Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              title="More actions"
              aria-label={`More actions for ${user.name}`}
            >
              <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            {/* Dropdown menu will be implemented in future phase */}
          </div>
        </div>
      </div>

      {/* Member Status Details */}
      {user.lastActive && (
        <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          Last active: {new Date(user.lastActive).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
