import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';

// ── PageLoadingSpinner ────────────────────────────────────────────────────────
// Defined first so createLazyRoute can reference it without hoisting issues.

const PageLoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

// ── createLazyComponent ───────────────────────────────────────────────────────

/**
 * Enhanced lazy loading wrapper with Suspense + optional custom fallback.
 */
export const createLazyComponent = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback: React.ReactNode = null
): React.FC<P> => {
  const LazyComponent = lazy(importFunc);

  return (props: P) => (
    <Suspense
      fallback={fallback ?? <div className="loading-spinner">Loading…</div>}
    >
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
};

// ── preloadComponent ──────────────────────────────────────────────────────────

/**
 * Kick off the dynamic import immediately (e.g. on hover) to shorten the
 * perceived load time when the component is eventually rendered.
 */
export const preloadComponent = <T,>(
  importFunc: () => Promise<T>
): Promise<T> => importFunc();

// ── createLazyRoute ───────────────────────────────────────────────────────────

/**
 * Route-based lazy loading with a fullscreen page spinner fallback.
 */
export const createLazyRoute = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  LoadingComponent: React.ReactNode = null
): React.FC<P> => {
  const LazyRoute = lazy(importFunc);

  return (props: P) => (
    <Suspense fallback={LoadingComponent ?? <PageLoadingSpinner />}>
      <LazyRoute {...(props as any)} />
    </Suspense>
  );
};

// ── LazyImage ─────────────────────────────────────────────────────────────────

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
}

/**
 * Image that defers loading until it enters the viewport via IntersectionObserver.
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholder
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
      ) : (
        (placeholder ?? <div className="image-placeholder" />)
      )}
    </div>
  );
};

// ── LazySection ───────────────────────────────────────────────────────────────

interface LazySectionProps {
  children: React.ReactNode;
  threshold?: number;
}

/**
 * Renders children only after the container enters the viewport.
 * Useful for deferring expensive off-screen sections.
 */
export const LazySection: React.FC<LazySectionProps> = ({
  children,
  threshold = 0.1
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : <div className="lazy-section-placeholder" />}
    </div>
  );
};
