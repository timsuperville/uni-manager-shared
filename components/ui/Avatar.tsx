import React from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  className?: string;
}

const SIZES: Record<AvatarSize, number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 44,
  xl: 56
};
const FONT_SIZES: Record<AvatarSize, number> = {
  xs: 9,
  sm: 11,
  md: 13,
  lg: 15,
  xl: 18
};

function getInitials(alt = ''): string {
  return alt
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase();
}

/** Avatar — image-first circular avatar with initials fallback. */
export function Avatar({
  src,
  alt = '',
  size = 'md',
  className = ''
}: AvatarProps) {
  const dim = SIZES[size] ?? SIZES.md;
  const fs = FONT_SIZES[size] ?? FONT_SIZES.md;

  const baseStyle: React.CSSProperties = {
    width: dim,
    height: dim,
    minWidth: dim,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--glass-outline, rgba(128,128,128,0.25))',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    fontSize: fs,
    fontWeight: 600,
    background: 'var(--primary-resonance, #6366f1)',
    color: '#fff',
    userSelect: 'none'
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ ...baseStyle, objectFit: 'cover' }}
        onError={e => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).parentElement?.setAttribute(
            'data-fallback',
            'true'
          );
        }}
      />
    );
  }

  return (
    <div className={className} style={baseStyle} aria-label={alt}>
      {getInitials(alt)}
    </div>
  );
}

export default Avatar;
