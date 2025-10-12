// Production Error Monitoring Configuration
// This configures error tracking and performance monitoring for production

import React from 'react';

// Environment-specific configuration
const isProd = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';

// Error Boundary Component for React
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to monitoring service in production
    if (isProd || isStaging) {
      this.logError(error, errorInfo);
    }
  }

  logError(error, errorInfo) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      appType: process.env.VITE_APP_TYPE || 'unknown'
    };

    // Send to backend error logging endpoint
    fetch('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport)
    }).catch(err => {
      console.error('Failed to log error:', err);
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
                <p className="text-sm text-gray-500">
                  We're sorry, but something unexpected happened.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reload Page
              </button>
            </div>

            {!isProd && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                  <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handler for unhandled promises
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = {
      type: 'unhandledrejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      appType: process.env.VITE_APP_TYPE || 'unknown'
    };

    if (isProd || isStaging) {
      fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error)
      }).catch(err => {
        console.error('Failed to log unhandled rejection:', err);
      });
    }
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const error = {
      type: 'uncaught',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      appType: process.env.VITE_APP_TYPE || 'unknown'
    };

    if (isProd || isStaging) {
      fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error)
      }).catch(err => {
        console.error('Failed to log uncaught error:', err);
      });
    }
  });
};

// Performance monitoring
export const setupPerformanceMonitoring = () => {
  if (!isProd && !isStaging) return;

  // Monitor Core Web Vitals
  if ('web-vital' in window) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    });
  }

  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          sendToAnalytics({
            name: 'longtask',
            value: entry.duration,
            timestamp: entry.startTime
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  }
};

// Send analytics data
const sendToAnalytics = (metric) => {
  const data = {
    ...metric,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    appType: process.env.VITE_APP_TYPE || 'unknown',
    userAgent: navigator.userAgent
  };

  fetch('/api/analytics/performance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  }).catch(err => {
    console.error('Failed to send analytics:', err);
  });
};

// Health check for frontend
export const setupHealthCheck = () => {
  // Periodic health check to backend
  setInterval(async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        console.warn('Backend health check failed');
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  }, 30000); // Check every 30 seconds
};

// Initialize all monitoring in production
export const initializeMonitoring = () => {
  if (isProd || isStaging) {
    setupGlobalErrorHandling();
    setupPerformanceMonitoring();
    setupHealthCheck();
  }
};