import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  compact?: boolean;
  className?: string;
  /** Optional cover image URL — renders a hero background behind the title. */
  image?: string | null;
  /** Size variant: 'sm' | 'md' | 'lg'. Affects hero height when image is provided. */
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const IMAGE_HEIGHT: Record<string, string> = {
  sm: 'h-24 sm:h-40',
  md: 'h-32 sm:h-56',
  lg: 'h-48 sm:h-72'
};

/**
 * PageHeader — Liquid Glass responsive title bar.
 * Stacks on mobile; single row on sm+. Description hidden on xs.
 * Optionally renders a full-width cover image hero when `image` is provided.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  compact = false,
  className = '',
  image,
  size = 'md',
  children
}: PageHeaderProps) {
  if (image) {
    const heightClass = IMAGE_HEIGHT[size] ?? IMAGE_HEIGHT.md;
    return (
      <div
        className={`relative overflow-hidden rounded-xl ${heightClass} ${className}`}
      >
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)'
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
            <div className="text-white min-w-0 flex-1">
              {breadcrumb && (
                <div className="text-white/70 text-xs mb-1">{breadcrumb}</div>
              )}
              <h1
                className={`font-bold leading-tight truncate ${compact ? 'text-lg sm:text-2xl' : 'text-xl sm:text-3xl'}`}
              >
                {title}
              </h1>
              {description && (
                <p className="text-sm text-white/80 mt-0.5 truncate hidden sm:block">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto mt-1 sm:mt-0">
                {actions}
              </div>
            )}
          </div>
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        'flex flex-col gap-0.5 sm:gap-1',
        compact ? 'py-0' : 'py-0.5 sm:py-1',
        className
      ].join(' ')}
    >
      {breadcrumb && (
        <div
          className="flex items-center gap-1 mb-0.5 sm:mb-1 text-xs font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {breadcrumb}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <h1
            className={[
              'font-bold leading-tight truncate',
              compact ? 'text-lg sm:text-2xl' : 'text-xl sm:text-3xl'
            ].join(' ')}
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)'
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="hidden sm:block text-sm mt-0.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto mt-1 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
