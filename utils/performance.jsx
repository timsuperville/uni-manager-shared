// Performance optimization utilities for React components
import {
  memo,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  Component,
} from 'react';
import PropTypes from 'prop-types';

/**
 * HOC for memoizing components with shallow comparison
 * Use for components that receive stable props
 */
export const withMemo = (Component, customCompare = null) => {
  return memo(Component, customCompare);
};

/**
 * HOC for lazy loading components with loading fallback
 * Use for route-level components or heavy components
 */
export const withLazyLoading = (
  importFunc,
  fallback = <div>Loading...</div>,
) => {
  const LazyComponent = lazy(importFunc);

  const LazyWrapper = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  LazyWrapper.displayName = 'LazyWrapper';

  return LazyWrapper;
};

/**
 * Hook for memoizing expensive calculations
 * Use for complex data transformations or filtering
 */
export const useOptimizedMemo = (factory, deps) => {
  return useMemo(() => factory(), deps);
};

/**
 * Hook for memoizing callback functions
 * Use for event handlers and callback props
 */
export const useOptimizedCallback = (callback, deps) => {
  return useCallback((...args) => callback(...args), deps);
};

/**
 * Hook for debouncing values to prevent excessive re-renders
 * Use for search inputs or frequent state updates
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling function calls
 * Use for scroll handlers or resize events
 */
export const useThrottle = (callback, delay) => {
  const [isThrottled, setIsThrottled] = useState(false);

  const throttledCallback = useCallback(
    (...args) => {
      if (!isThrottled) {
        callback(...args);
        setIsThrottled(true);

        setTimeout(() => {
          setIsThrottled(false);
        }, delay);
      }
    },
    [callback, delay, isThrottled],
  );

  return throttledCallback;
};

/**
 * Virtual scrolling hook for large lists
 * Use for rendering large datasets efficiently
 */
export const useVirtualList = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length,
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items
      .slice(visibleRange.startIndex, visibleRange.endIndex)
      .map((item, index) => ({
        ...item,
        index: visibleRange.startIndex + index,
      }));
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
};

/**
 * Performance monitoring hook
 * Use for measuring component render times
 */
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) {
        // Warn if render takes longer than one frame
        // console.warn(
          `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`,
        );
      }
    };
  });
};

/**
 * Image lazy loading hook
 * Use for optimizing image loading performance
 */
export const useLazyImage = (src, placeholder) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
          };
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, imgRef };
};

/**
 * Optimized data fetching hook with caching
 * Use for API calls with automatic caching
 */
export const useOptimizedFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simple cache using Map
  const cache = useMemo(() => new Map(), []);

  const fetchData = useCallback(async () => {
    const cacheKey = `${url}${JSON.stringify(options)}`;

    // Check cache first
    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Cache the result
      cache.set(cacheKey, result);
      setData(result);
      setError(null);
    } catch (_err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, options, cache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Bundle splitting utilities
 */
export const createAsyncComponent = (importFunc) => {
  return lazy(() =>
    importFunc().then((module) => ({
      default: module.default || module,
    })),
  );
};

/**
 * Performance optimization wrapper component
 * Automatically applies common optimizations
 */
export const OptimizedComponent = memo(
  ({ children, trackPerformance = false, componentName = 'Anonymous' }) => {
    if (trackPerformance) {
      usePerformanceMonitor(componentName);
    }

    return children;
  },
);

/**
 * Error boundary for performance-critical components
 */
export class PerformanceErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // console.error('[Performance Error]:', error, errorInfo);

    // Log performance impact
    if (error.name === 'ChunkLoadError') {
      // console.warn('Bundle loading failed - check network and caching');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className='error-boundary'>
            <h3>Something went wrong with this component</h3>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}


withMemo.propTypes = {
  // TODO: Define specific prop types
};
export default {
  withMemo,
  withLazyLoading,
  useOptimizedMemo,
  useOptimizedCallback,
  useDebounce,
  useThrottle,
  useVirtualList,
  usePerformanceMonitor,
  useLazyImage,
  useOptimizedFetch,
  createAsyncComponent,
  OptimizedComponent,
  PerformanceErrorBoundary,
};
