import React, { lazy, Suspense } from 'react';
import { Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { WidgetSkeleton } from './WidgetSkeleton';

function RouteErrorBoundary({
  children,
  appType
}: {
  children: React.ReactNode;
  appType: string;
}) {
  const location = useLocation();
  return (
    <ErrorBoundary
      key={location.pathname}
      variant="inline"
      appType={appType}
      title="This page encountered an error"
    >
      {children}
    </ErrorBoundary>
  );
}

export function createLazyCluster(
  factory: () => Promise<any>,
  exportName: string,
  appType: string,
  customFallback?: React.ReactNode
) {
  const LazyComponent = lazy(() =>
    factory()
      .then((m: any) => {
        if (!m || !m[exportName]) {
          console.error(
            `[Router] Failed to find export '${exportName}' in module:`,
            m
          );
          const isReloaded = sessionStorage.getItem('route-load-error');
          if (!isReloaded) {
            sessionStorage.setItem('route-load-error', 'true');
            window.location.reload();
          }
          return {
            default: () => (
              <div className="p-8 text-red-500">
                Error loading module. Please refresh.
              </div>
            )
          };
        }
        return {
          default: () => <Routes>{m[exportName]}</Routes>
        };
      })
      .catch(err => {
        console.error('[Router] Dynamic import failed:', err);
        const isReloaded = sessionStorage.getItem('route-load-error');
        if (!isReloaded) {
          sessionStorage.setItem('route-load-error', 'true');
          window.location.reload();
        }
        throw err;
      })
  );
  return function LazyRouteCluster() {
    React.useEffect(() => {
      sessionStorage.removeItem('route-load-error');
    }, []);

    return (
      <RouteErrorBoundary appType={appType}>
        <Suspense
          fallback={
            customFallback || (
              <div className="w-full h-full min-h-[50vh] p-8 flex items-center justify-center">
                <WidgetSkeleton.List rows={5} />
              </div>
            )
          }
        >
          <LazyComponent />
        </Suspense>
      </RouteErrorBoundary>
    );
  };
}

export function createLazyPage(
  factory: () => Promise<any>,
  appType: string,
  customFallback?: React.ReactNode
) {
  const LazyComponent = lazy(() =>
    factory()
      .then((m: any) => {
        // Find default or first exported component
        let component = m.default;
        if (!component) {
          const componentName = Object.keys(m).find(
            key => typeof m[key] === 'function' || typeof m[key] === 'object'
          );
          if (componentName) {
            component = m[componentName];
          }
        }
        if (!component) {
          console.error(
            '[Router] Failed to find component export in module:',
            m
          );
          const isReloaded = sessionStorage.getItem('route-load-error');
          if (!isReloaded) {
            sessionStorage.setItem('route-load-error', 'true');
            window.location.reload();
          }
          return {
            default: () => (
              <div className="p-8 text-red-500">
                Error loading module. Please refresh.
              </div>
            )
          };
        }
        return { default: component };
      })
      .catch(err => {
        console.error('[Router] Dynamic import failed:', err);
        const isReloaded = sessionStorage.getItem('route-load-error');
        if (!isReloaded) {
          sessionStorage.setItem('route-load-error', 'true');
          window.location.reload();
        }
        throw err;
      })
  );
  return function LazyPageWrapper(props: any) {
    React.useEffect(() => {
      sessionStorage.removeItem('route-load-error');
    }, []);

    return (
      <RouteErrorBoundary appType={appType}>
        <Suspense
          fallback={
            customFallback || (
              <div className="w-full h-full min-h-[50vh] p-8 flex items-center justify-center">
                <WidgetSkeleton.List rows={5} />
              </div>
            )
          }
        >
          <LazyComponent {...props} />
        </Suspense>
      </RouteErrorBoundary>
    );
  };
}
