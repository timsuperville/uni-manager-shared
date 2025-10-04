/**
 * Lazy Loading System for Dashboard Widgets
 * Intelligent component loading with caching and performance optimization
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  lazy,
} from "react";
import { useCacheManager } from "../utils/intelligentCache";

// Intersection Observer hook for viewport detection
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasIntersected, options]);

  return [ref, isIntersecting, hasIntersected];
};

// Lazy Widget Loader Component
export const LazyWidget = ({
  widgetId,
  importPromise,
  fallback = null,
  priority = "normal",
  className = "",
  ...props
}) => {
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver();
  const [Component, setComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheManager = useCacheManager();

  // Load component when it comes into view or has high priority
  useEffect(() => {
    const shouldLoad =
      hasIntersected || priority === "high" || priority === "critical";

    if (shouldLoad && !Component && !isLoading) {
      loadComponent();
    }
  }, [hasIntersected, priority, Component, isLoading]);

  const loadComponent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = `widget-${widgetId}`;
      const cachedComponent = cacheManager.getCache("widgets").get(cacheKey);

      if (cachedComponent) {
        setComponent(() => cachedComponent);
        setIsLoading(false);
        return;
      }

      // Load component dynamically
      const module = await importPromise();
      const LoadedComponent = module.default || module;

      // Cache the component
      cacheManager.getCache("widgets").set(cacheKey, LoadedComponent, {
        ttl: 30 * 60 * 1000, // 30 minutes
        priority: priority,
      });

      setComponent(() => LoadedComponent);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [widgetId, importPromise, cacheManager, priority]);

  // Render loading state
  if (isLoading) {
    return (
      <div ref={ref} className={`widget-loading ${className}`}>
        {fallback || <WidgetSkeleton />}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div ref={ref} className={`widget-error ${className}`}>
        <WidgetError error={error} onRetry={loadComponent} />
      </div>
    );
  }

  // Render placeholder until component should load
  if (!Component) {
    return (
      <div ref={ref} className={`widget-placeholder ${className}`}>
        <WidgetPlaceholder widgetId={widgetId} priority={priority} />
      </div>
    );
  }

  // Render the actual component
  return (
    <div ref={ref} className={className}>
      <Suspense fallback={fallback || <WidgetSkeleton />}>
        <Component {...props} />
      </Suspense>
    </div>
  );
};

// Widget Skeleton Loader
const WidgetSkeleton = () => (
  <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
    <div className="space-y-3">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
    </div>
    <div className="mt-6 h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

// Widget Error Component
const WidgetError = ({ error, onRetry }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
    <div className="flex items-center space-x-3 mb-3">
      <div className="text-red-500 text-xl">⚠️</div>
      <h3 className="text-red-800 dark:text-red-200 font-medium">
        Widget Load Error
      </h3>
    </div>
    <p className="text-red-600 dark:text-red-300 text-sm mb-4">
      {error.message || "Failed to load widget component"}
    </p>
    <button
      onClick={onRetry}
      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

// Widget Placeholder Component
const WidgetPlaceholder = ({ widgetId, priority }) => {
  const priorityIcons = {
    critical: "🔥",
    high: "⚡",
    normal: "📊",
    low: "⏳",
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
      <div className="text-4xl mb-3">{priorityIcons[priority] || "📊"}</div>
      <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-2">
        {widgetId
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Widget will load when visible
      </p>
    </div>
  );
};

// Preloader for critical widgets
export const useWidgetPreloader = (widgets = []) => {
  const cacheManager = useCacheManager();
  const [preloadStatus, setPreloadStatus] = useState({});

  const preloadWidget = useCallback(
    async (widgetConfig) => {
      const { id, importPromise, priority } = widgetConfig;

      if (priority !== "critical" && priority !== "high") return;

      try {
        setPreloadStatus((prev) => ({ ...prev, [id]: "loading" }));

        const module = await importPromise();
        const Component = module.default || module;

        // Cache the preloaded component
        cacheManager.getCache("widgets").set(`widget-${id}`, Component, {
          ttl: 30 * 60 * 1000, // 30 minutes
          priority: priority,
        });

        setPreloadStatus((prev) => ({ ...prev, [id]: "loaded" }));
      } catch (error) {
        setPreloadStatus((prev) => ({ ...prev, [id]: "error" }));
      }
    },
    [cacheManager]
  );

  useEffect(() => {
    // Preload critical and high priority widgets
    const criticalWidgets = widgets.filter(
      (w) => w.priority === "critical" || w.priority === "high"
    );

    criticalWidgets.forEach((widget) => {
      preloadWidget(widget);
    });
  }, [widgets, preloadWidget]);

  return preloadStatus;
};

// Lazy Dashboard Layout with Progressive Loading
export const LazyDashboardLayout = ({
  widgets,
  userPreferences,
  className = "",
}) => {
  const preloadStatus = useWidgetPreloader(widgets);

  // Sort widgets by priority and user preferences
  const sortedWidgets = [...widgets].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const userOrder = userPreferences?.widgetOrder || {};

    // First sort by user preference order
    const aOrder = userOrder[a.id] || 999;
    const bOrder = userOrder[b.id] || 999;

    if (aOrder !== bOrder) return aOrder - bOrder;

    // Then by priority
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className={`lazy-dashboard-layout ${className}`}>
      {/* Critical widgets render first */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedWidgets.map((widget) => (
          <LazyWidget
            key={widget.id}
            widgetId={widget.id}
            importPromise={widget.importPromise}
            priority={widget.priority}
            className="widget-container"
            fallback={<WidgetSkeleton />}
            {...widget.props}
          />
        ))}
      </div>

      {/* Preload status indicator for development */}
      {import.meta.env.DEV && (
        <div
          className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          data-testid="development-preload-status"
        >
          <h4 className="font-medium mb-2">
            Widget Preload Status (Development Mode):
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {Object.entries(preloadStatus).map(([id, status]) => (
              <div
                key={id}
                className={`px-2 py-1 rounded ${
                  status === "loaded"
                    ? "bg-green-100 text-green-800"
                    : status === "loading"
                      ? "bg-yellow-100 text-yellow-800"
                      : status === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {id}: {status}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Export lazy loading utilities
export const createLazyWidget = (importPromise) => {
  return React.forwardRef((props, ref) => {
    const LazyComponent = lazy(importPromise);
    return (
      <Suspense fallback={<WidgetSkeleton />}>
        <LazyComponent ref={ref} {...props} />
      </Suspense>
    );
  });
};

// Widget Registry for dynamic loading
export class WidgetRegistry {
  constructor() {
    this.widgets = new Map();
    this.cacheManager = null;
  }

  setCacheManager(cacheManager) {
    this.cacheManager = cacheManager;
  }

  register(id, config) {
    this.widgets.set(id, {
      id,
      ...config,
      registered: Date.now(),
    });
  }

  get(id) {
    return this.widgets.get(id);
  }

  getAll() {
    return Array.from(this.widgets.values());
  }

  getByCategory(category) {
    return Array.from(this.widgets.values()).filter(
      (w) => w.category === category
    );
  }

  async preloadCategory(category, priority = "high") {
    const widgets = this.getByCategory(category);
    const promises = widgets
      .filter((w) => w.priority === "critical" || w.priority === priority)
      .map((w) => this.preloadWidget(w.id));

    await Promise.allSettled(promises);
  }

  async preloadWidget(id) {
    const widget = this.get(id);
    if (!widget || !this.cacheManager) return;

    try {
      const module = await widget.importPromise();
      const Component = module.default || module;

      this.cacheManager.getCache("widgets").set(`widget-${id}`, Component, {
        ttl: 30 * 60 * 1000, // 30 minutes
        priority: widget.priority,
      });

      return Component;
    } catch (error) {
      console.warn(`Failed to preload widget ${id}:`, error);
      return null;
    }
  }
}

// Global widget registry instance
export const widgetRegistry = new WidgetRegistry();

export default LazyWidget;
