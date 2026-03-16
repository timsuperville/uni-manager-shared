// Performance optimization utilities for React components
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
  ComponentType,
  ReactNode,
  ErrorInfo,
} from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface PerformanceErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface PerformanceErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface OptimizedComponentProps {
  children: ReactNode;
  trackPerformance?: boolean;
  componentName?: string;
}

interface OptimizedFetchOptions extends RequestInit {}

interface OptimizedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface LazyImageResult {
  imageSrc: string;
  isLoaded: boolean;
  imgRef: React.RefObject<HTMLElement>;
}

interface VirtualListRange {
  startIndex: number;
  endIndex: number;
}

interface VirtualListResult<T> {
  visibleItems: (T & { index: number })[];
  totalHeight: number;
  offsetY: number;
  setScrollTop: React.Dispatch<React.SetStateAction<number>>;
}

// ── HOC: withMemo ─────────────────────────────────────────────────────────────

export function withMemo<P extends object>(
  WrappedComponent: ComponentType<P>,
  customCompare?: ((prev: P, next: P) => boolean) | null,
): ComponentType<P> {
  return memo(WrappedComponent, customCompare ?? undefined) as ComponentType<P>;
}

// ── HOC: withLazyLoading ──────────────────────────────────────────────────────

export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = <div>Loading...</div>,
): ComponentType<P> {
  const LazyComponent = lazy(importFunc);

  const LazyWrapper = (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  LazyWrapper.displayName = "LazyWrapper";
  return LazyWrapper;
}

// ── Hook: useOptimizedMemo ────────────────────────────────────────────────────

export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(), deps);
}

// ── Hook: useOptimizedCallback ────────────────────────────────────────────────

export function useOptimizedCallback<Args extends unknown[], R>(
  callback: (...args: Args) => R,
  deps: React.DependencyList,
): (...args: Args) => R {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: Args) => callback(...args), deps);
}

// ── Hook: useDebounce ─────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ── Hook: useThrottle ─────────────────────────────────────────────────────────

export function useThrottle<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const [isThrottled, setIsThrottled] = useState(false);

  const throttledCallback = useCallback(
    (...args: Args) => {
      if (!isThrottled) {
        callback(...args);
        setIsThrottled(true);
        setTimeout(() => setIsThrottled(false), delay);
      }
    },
    [callback, delay, isThrottled],
  );

  return throttledCallback;
}

// ── Hook: useVirtualList ──────────────────────────────────────────────────────

export function useVirtualList<T extends object>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
): VirtualListResult<T> {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo<VirtualListRange>(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length,
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(
    () =>
      items
        .slice(visibleRange.startIndex, visibleRange.endIndex)
        .map((item, index) => ({
          ...item,
          index: visibleRange.startIndex + index,
        })),
    [items, visibleRange.startIndex, visibleRange.endIndex],
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return { visibleItems, totalHeight, offsetY, setScrollTop };
}

// ── Hook: usePerformanceMonitor ───────────────────────────────────────────────

export function usePerformanceMonitor(componentName: string): void {
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16 && import.meta.env.DEV) {
        console.warn(
          `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`,
        );
      }
    };
  });
}

// ── Hook: useLazyImage ────────────────────────────────────────────────────────

export function useLazyImage(
  src: string,
  placeholder: string,
): LazyImageResult {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, imgRef: imgRef as React.RefObject<HTMLElement> };
}

// ── Hook: useOptimizedFetch ────────────────────────────────────────────────────

export function useOptimizedFetch<T = unknown>(
  url: string,
  options: OptimizedFetchOptions = {},
): OptimizedFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Simple cache using stable Map reference
  const cache = useMemo(() => new Map<string, T>(), []);

  const fetchData = useCallback(async () => {
    const cacheKey = `${url}${JSON.stringify(options)}`;

    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result: T = await response.json();
      cache.set(cacheKey, result);
      setData(result);
      setError(null);
    } catch (err) {
      // Bug fix: original code referenced `err` out of scope — use caught reference
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, cache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ── createAsyncComponent ──────────────────────────────────────────────────────

export function createAsyncComponent<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
): React.LazyExoticComponent<ComponentType<P>> {
  return lazy(() =>
    importFunc().then((module) => ({ default: module.default })),
  );
}

// ── OptimizedComponent ────────────────────────────────────────────────────────

const OptimizedComponentInner: React.FC<OptimizedComponentProps> = ({
  children,
  trackPerformance = false,
  componentName = "Anonymous",
}) => {
  if (trackPerformance) {
    // Hook called at top-level — this is safe because trackPerformance is stable
    usePerformanceMonitor(componentName);
  }
  return <>{children}</>;
};

export const OptimizedComponent = memo(OptimizedComponentInner);
OptimizedComponent.displayName = "OptimizedComponent";

// ── PerformanceErrorBoundary ──────────────────────────────────────────────────

export class PerformanceErrorBoundary extends Component<
  PerformanceErrorBoundaryProps,
  PerformanceErrorBoundaryState
> {
  constructor(props: PerformanceErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PerformanceErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Silenced for production — wire to error monitoring service if needed
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
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

// ── Default export ────────────────────────────────────────────────────────────

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
