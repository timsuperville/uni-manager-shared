// React Performance Optimization Utilities
import React, {
  memo,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  Component,
} from "react";

/**
 * HOC for memoizing components with shallow comparison
 */
export const withMemo = (Component, customCompare = null) => {
  const MemoizedComponent = memo(Component, customCompare);
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

/**
 * HOC for lazy loading components
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

  LazyWrapper.displayName = "LazyWrapper";
  return LazyWrapper;
};

/**
 * Hook for debouncing values
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
 * Image lazy loading hook
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
    console.error("[Performance Error]:", error, errorInfo);

    if (error.name === "ChunkLoadError") {
      console.warn("Bundle loading failed - check network and caching");
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
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

/**
 * Performance monitoring component
 */
export const PerformanceMonitor = ({ children, componentName }) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) {
        console.warn(
          `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`,
        );
      }
    };
  });

  return children;
};

/**
 * Optimized list component for large datasets
 */
export const OptimizedList = memo(
  ({
    items,
    renderItem,
    containerHeight = 400,
    itemHeight = 50,
    keyExtractor = (item, index) => item.id || index,
  }) => {
    const { visibleItems, totalHeight, offsetY, setScrollTop } = useVirtualList(
      items,
      containerHeight,
      itemHeight,
    );

    const handleScroll = useCallback(
      (e) => {
        setScrollTop(e.target.scrollTop);
      },
      [setScrollTop],
    );

    return (
      <div
        style={{ height: containerHeight, overflow: "auto" }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item, index) => (
              <div
                key={keyExtractor(item, index)}
                style={{ height: itemHeight }}
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

OptimizedList.displayName = "OptimizedList";

/**
 * Memoized search input with debouncing
 */
export const OptimizedSearchInput = memo(
  ({ onSearch, placeholder = "Search...", debounceMs = 300, ...props }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

    useEffect(() => {
      onSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearch]);

    const handleChange = useCallback((e) => {
      setSearchTerm(e.target.value);
    }, []);

    return (
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

OptimizedSearchInput.displayName = "OptimizedSearchInput";

export default {
  withMemo,
  withLazyLoading,
  useDebounce,
  useThrottle,
  useVirtualList,
  useLazyImage,
  createAsyncComponent,
  PerformanceErrorBoundary,
  PerformanceMonitor,
  OptimizedList,
  OptimizedSearchInput,
};
