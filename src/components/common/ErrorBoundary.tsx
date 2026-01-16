import React, { Component, ErrorInfo, ReactNode } from 'react';

// CRITICAL: Do NOT import any complex components here
// Error boundary must be pure and self-contained to prevent cascading failures

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Safe error logging that never throws
const safeLogError = (data: {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  pageRoute?: string;
  componentName?: string;
  metadata?: Record<string, unknown>;
}) => {
  try {
    // Dynamic import to prevent bundling issues
    import('@/services/errorLoggingService').then(({ logError }) => {
      logError(data).catch(() => {
        // Silently fail - we're in error recovery mode
      });
    }).catch(() => {
      // Module load failed - log to console only
      console.error('[ErrorBoundary] Failed to log error:', data.errorMessage);
    });
  } catch {
    // Absolutely never throw from error logging
    console.error('[ErrorBoundary] Critical error in logging:', data.errorMessage);
  }
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Safe async logging - never blocks or throws
    safeLogError({
      errorType: 'react_error_boundary',
      errorMessage: error.message,
      errorStack: error.stack,
      pageRoute: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      componentName: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      metadata: {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
    });
    
    // Call optional error handler
    try {
      this.props.onError?.(error, errorInfo);
    } catch {
      // Never let callback errors propagate
    }
  }

  // CRITICAL: Use hard navigation - never rely on React Router in error state
  handleRetry = () => {
    try {
      this.setState({ hasError: false, error: null, errorInfo: null });
    } catch {
      // If state update fails, force reload
      window.location.reload();
    }
  };

  // CRITICAL: Pure hard redirect - works even if React is broken
  handleGoHome = () => {
    try {
      window.location.href = '/';
    } catch {
      // Fallback for extreme edge cases
      window.location.replace('/');
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // CRITICAL: Pure static error UI with inline styles as fallback
      // No external dependencies that could fail
      return (
        <div 
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#fafafa',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div 
            style={{
              maxWidth: '400px',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e5e5e5',
            }}
          >
            {/* Error Icon - inline SVG for reliability */}
            <div 
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 20px',
                backgroundColor: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            
            <h1 
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px',
                margin: '0 0 8px 0',
              }}
            >
              Something went wrong
            </h1>
            
            <p 
              style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px',
                lineHeight: '1.5',
              }}
            >
              An unexpected error occurred. Please try again or go back to the home page.
            </p>

            {this.props.showDetails && this.state.error && (
              <details 
                style={{
                  textAlign: 'left',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '12px',
                  marginBottom: '20px',
                }}
              >
                <summary style={{ cursor: 'pointer', color: '#6b7280', fontWeight: '500' }}>
                  Error details
                </summary>
                <pre 
                  style={{
                    marginTop: '8px',
                    overflow: 'auto',
                    color: '#ef4444',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {/* Try Again Button */}
              <button
                onClick={this.handleRetry}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  pointerEvents: 'auto',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
                Try Again
              </button>
              
              {/* Go Home Button - uses anchor tag as ultimate fallback */}
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  this.handleGoHome();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  pointerEvents: 'auto',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Minimal inline error boundary for small sections
interface InlineErrorBoundaryState {
  hasError: boolean;
}

export class InlineErrorBoundary extends Component<{ children: ReactNode; fallbackMessage?: string }, InlineErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallbackMessage?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): InlineErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('InlineErrorBoundary caught:', error, errorInfo);
    
    // Safe async logging
    safeLogError({
      errorType: 'react_inline_error',
      errorMessage: error.message,
      errorStack: error.stack,
      pageRoute: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      componentName: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      metadata: {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          {this.props.fallbackMessage || 'Failed to load this section'}
        </div>
      );
    }
    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallbackMessage?: string
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <InlineErrorBoundary fallbackMessage={fallbackMessage}>
        <WrappedComponent {...props} />
      </InlineErrorBoundary>
    );
  };
}
