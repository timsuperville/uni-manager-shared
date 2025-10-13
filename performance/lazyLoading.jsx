import { lazy, Suspense, useState, useEffect, useRef } from 'react';

/**
 * Enhanced lazy loading wrapper with error handling and loading states
 */
export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback || <div className="loading-spinner">Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Preload component for better UX
 */
export const preloadComponent = (importFunc) => {
  const componentImport = importFunc();
  return componentImport;
};

/**
 * Route-based lazy loading
 */
export const createLazyRoute = (importFunc, LoadingComponent = null) => {
  const LazyRoute = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={LoadingComponent || <PageLoadingSpinner />}>
      <LazyRoute {...props} />
    </Suspense>
  );
};

/**
 * Image lazy loading with intersection observer
 */
export const LazyImage = ({ src, alt, className, placeholder }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

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

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      ) : (
        placeholder || <div className="image-placeholder" />
      )}
    </div>
  );
};

/**
 * Component lazy loading with viewport detection
 */
export const LazySection = ({ children, threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : <div className="lazy-section-placeholder" />}
    </div>
  );
};

const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);