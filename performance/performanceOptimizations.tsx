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
  ComponentType,
  ReactNode,
  ErrorInfo
} from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface PerformanceErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface PerformanceErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface PerformanceMonitorProps {
  children: ReactNode;
  componentName: string;
}

interface OptimizedListItem {
  id?: string | number;
  [key: string]: unknown;
}

interface OptimizedListProps<T extends OptimizedListItem> {
  items: T[];
  renderItem: (item: T & { index: number }, index: number) => ReactNode;
  containerHeight?: number;
  itemHeight?: number;
  keyExtractor?: (item: T, index: number) => string | number;
}

interface OptimizedSearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> {
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

interface VirtualListResult<T> {
  visibleItems: (T & { index: number })[];
  totalHeight: number;
  offsetY: number;
  setScrollTop: React.Dispatch<React.SetStateAction<number>>;
}

interface LazyImageResult {
  imageSrc: string;
  isLoaded: boolean;
  imgRef: React.RefObject<HTMLElement>;
}

// ── HOC: withMemo ─────────────────────────────────────────────────────────────

export function withMemo<P extends object>(
  WrappedComponent: ComponentType<P>,
  customCompare?: (prev: P, next: P) => boolean
): ComponentType<P> {
  const MemoizedComponent = memo(WrappedComponent, customCompare);
  MemoizedComponent.displayName = `Memoized(${WrappedComponent.displayName ?? WrappedComponent.name})`;
  return MemoizedComponent as ComponentType<P>;
}

// ── HOC: withLazyLoading ──────────────────────────────────────────────────────

export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = <div>Loading...</div>
): ComponentType<P> {
  const LazyComponent = lazy(importFunc);

  const LazyWrapper = (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  LazyWrapper.displayName = 'LazyWrapper';
  return LazyWrapper;
}

// ── Hook: useDebounce ─────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ── Hook: useThrottle ─────────────────────────────────────────────────────────

export function useThrottle<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number
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
    [callback, delay, isThrottled]
  );

  return throttledCallback;
}

// ── Hook: useVirtualList ──────────────────────────────────────────────────────

export function useVirtualList<T extends OptimizedListItem>(
  items: T[],
  containerHeight: number,
  itemHeight: number
): VirtualListResult<T> {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(
    () =>
      items
        .slice(visibleRange.startIndex, visibleRange.endIndex)
        .map((item, index) => ({
          ...item,
          index: visibleRange.startIndex + index
        })),
    [items, visibleRange.startIndex, visibleRange.endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return { visibleItems, totalHeight, offsetY, setScrollTop };
}

// ── Hook: useLazyImage ────────────────────────────────────────────────────────

export function useLazyImage(
  src: string,
  placeholder: string
): LazyImageResult {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
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
      { threshold: 0.1 }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, imgRef: imgRef as React.RefObject<HTMLElement> };
}

// ── createAsyncComponent ──────────────────────────────────────────────────────

export function createAsyncComponent<P extends object>(
  importFunc: () => Promise<
    { default: ComponentType<P> } | { [key: string]: ComponentType<P> }
  >
): React.LazyExoticComponent<ComponentType<P>> {
  return lazy(() =>
    importFunc().then(module => ({
      default:
        (module as { default: ComponentType<P> }).default ??
        (module as unknown as ComponentType<P>)
    }))
  );
}

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

// ── PerformanceMonitor ────────────────────────────────────────────────────────

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  children,
  componentName: _componentName
}) => {
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16 && import.meta.env.DEV) {
        console.warn(
          `[Performance] ${_componentName} render took ${renderTime.toFixed(2)}ms`
        );
      }
    };
  });
  return <>{children}</>;
};

// ── OptimizedList ─────────────────────────────────────────────────────────────

function OptimizedListInner<T extends OptimizedListItem>({
  items,
  renderItem,
  containerHeight = 400,
  itemHeight = 50,
  keyExtractor = (item: T, index: number) =>
    (item.id as string | number) ?? index
}: OptimizedListProps<T>) {
  const { visibleItems, totalHeight, offsetY, setScrollTop } = useVirtualList(
    items,
    containerHeight,
    itemHeight
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop((e.target as HTMLDivElement).scrollTop);
    },
    [setScrollTop]
  );

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={keyExtractor(item, index)} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const OptimizedList = memo(
  OptimizedListInner
) as typeof OptimizedListInner;
(OptimizedList as { displayName?: string }).displayName = 'OptimizedList';

// ── OptimizedSearchInput ──────────────────────────────────────────────────────

const OptimizedSearchInputInner: React.FC<OptimizedSearchInputProps> = ({
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
};

export const OptimizedSearchInput = memo(OptimizedSearchInputInner);
OptimizedSearchInput.displayName = 'OptimizedSearchInput';

// ── Default export (barrel object) ───────────────────────────────────────────

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
  OptimizedSearchInput
};
