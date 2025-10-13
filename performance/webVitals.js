// Performance monitoring with Web Vitals integration
class WebVitalsMonitor {
  constructor() {
    this.metrics = {};
    this.thresholds = {
      LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
      FID: { good: 100, poor: 300 },   // First Input Delay
      CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
      FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
      TTFB: { good: 800, poor: 1800 }  // Time to First Byte
    };
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    
    this.initialized = true;
    
    // Initialize performance tracking
    this.trackPerformanceMetrics();
    
    // Send metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
    
    // Send metrics after 30 seconds
    setTimeout(() => {
      this.sendMetrics();
    }, 30000);
  }

  trackPerformanceMetrics() {
    // Use Performance Observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.handleEntry(entry);
          });
        });
        
        observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported');
      }
    }
  }

  handleEntry(entry) {
    const metricName = entry.entryType === 'largest-contentful-paint' ? 'LCP' : 
                     entry.name === 'first-contentful-paint' ? 'FCP' :
                     entry.entryType;
    
    this.metrics[metricName] = {
      value: entry.startTime || entry.loadEventEnd,
      rating: this.getRating(metricName, entry.startTime || entry.loadEventEnd),
      timestamp: Date.now()
    };

    // Log performance issues in development
    if (process.env.NODE_ENV === 'development') {
      const rating = this.getRating(metricName, entry.startTime || entry.loadEventEnd);
      if (rating === 'poor') {
        console.warn('Poor ' + metricName + ': ' + (entry.startTime || entry.loadEventEnd));
      }
    }
  }

  getRating(metricName, value) {
    const threshold = this.thresholds[metricName];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  async sendMetrics() {
    if (Object.keys(this.metrics).length === 0) return;

    const payload = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: navigator.connection?.effectiveType || 'unknown',
      metrics: this.metrics,
      timestamp: Date.now(),
      app: window.ENV?.VITE_APP_NAME || 'unknown'
    };

    try {
      // Send to analytics endpoint
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send Web Vitals:', error);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getPerformanceScore() {
    const scores = Object.entries(this.metrics).map(([name, metric]) => {
      const rating = metric.rating;
      switch (rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 50;
      }
    });

    return scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
  }
}

// Global instance
export const webVitalsMonitor = new WebVitalsMonitor();

// React hook for Web Vitals
export const useWebVitals = () => {
  const [metrics, setMetrics] = useState({});
  const [score, setScore] = useState(0);

  useEffect(() => {
    webVitalsMonitor.init();
    
    const interval = setInterval(() => {
      setMetrics(webVitalsMonitor.getMetrics());
      setScore(webVitalsMonitor.getPerformanceScore());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, score };
};