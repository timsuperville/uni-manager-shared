
import React from 'react';
import { errorReportingService } from '../services/errorReportingService';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorId: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to the backend
        errorReportingService.logError(error, errorInfo, {
            appType: this.props.appType || 'unknown',
            ...this.props.metadata
        }).then(() => {
            // Optional: could set state with a generated error ID returned from backend
        });

        // Also log to console for development
        console.error("Global Error Boundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    maxWidth: '600px',
                    margin: '0 auto',
                    marginTop: '10vh'
                }}>
                    <h1 style={{ color: '#e53e3e', marginBottom: '1rem' }}>Something went wrong</h1>
                    <p style={{ color: '#4a5568', marginBottom: '2rem' }}>
                        We're sorry, but the application encountered an unexpected error.
                        Our engineering team has been notified.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#3182ce',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500'
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
