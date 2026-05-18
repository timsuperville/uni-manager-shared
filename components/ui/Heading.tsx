/**
 * Heading — Semantic heading primitive using Liquid Glass CSS tokens.
 * Renders h1–h6 based on the `level` prop (defaults to h2).
 *
 * Per CSP: This primitive replaces all inline heading elements used
 * across 2+ feature files.
 */
import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, children, className = '', style, ...rest }, ref) => {
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    const sizeClass: Record<number, string> = {
      1: 'text-3xl font-bold',
      2: 'text-2xl font-bold',
      3: 'text-xl font-semibold',
      4: 'text-lg font-semibold',
      5: 'text-base font-semibold',
      6: 'text-sm font-semibold'
    };
    return (
      <Tag
        ref={ref}
        className={`${sizeClass[level]} ${className}`}
        style={{ color: 'var(--text-primary)', ...style }}
        {...rest}
      >
        {children}
      </Tag>
    );
  }
);

Heading.displayName = 'Heading';
export default Heading;
