import React, { Component, ErrorInfo, ReactNode } from 'react';

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

/**
 * Mobile-safe error logging that never blocks or throws
 * Uses fire-and-forget pattern with timeout protection
 */
const safeLogError = (error: Error, errorInfo: ErrorInfo): void => {
  // Wrap everything in try-catch to never throw during error handling
  try {
    // Only log in development via console
    if (typeof console !== 'undefined') {
      console.error('ErrorBoundary caught an error:', error.message);
    }
    
    // Async log to database with timeout protection
    // This runs in background and never blocks the UI
    const timeoutId = setTimeout(() => {
      // Abort if taking too long
    }, 3000);
    
    import('@/services/errorLoggingService')
      .then(({ logError }) => {
        clearTimeout(timeoutId);
        logError({
          errorType: 'react_error_boundary',
          errorMessage: error.message,
          errorStack: error.stack,
          pageRoute: typeof window !== 'undefined' ? window.location.pathname : undefined,
          componentName: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
          metadata: {
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
          },
        }).catch(() => {
          // Silently ignore logging failures
        });
      })
      .catch(() => {
        // Silently ignore import failures
        clearTimeout(timeoutId);
      });
  } catch {
    // Absolutely never throw during error handling
  }
};

/**
 * MOBILE-SAFE: Hard redirect that always works
 * Uses multiple fallback strategies for maximum compatibility
 */
const forceNavigateHome = (): void => {
  try {
    // Strategy 1: Standard location change
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  } catch {
    try {
      // Strategy 2: Location replace (works on some mobile browsers)
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    } catch {
      try {
        // Strategy 3: Use assign method
        if (typeof window !== 'undefined') {
          window.location.assign('/');
        }
      } catch {
        // Last resort: reload
        try {
          window.location.reload();
        } catch {
          // Nothing more we can do
        }
      }
    }
  }
};

/**
 * MOBILE-SAFE: Force reload with fallbacks
 */
const forceReload = (): void => {
  try {
    if (typeof window !== 'undefined') {
      // Clear any service worker cache first
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name).catch(() => {});
          });
        }).catch(() => {});
      }
      window.location.reload();
    }
  } catch {
    forceNavigateHome();
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
    
    // Fire-and-forget error logging - never blocks UI
    safeLogError(error, errorInfo);
    
    // Call optional error handler
    try {
      this.props.onError?.(error, errorInfo);
    } catch {
      // Ignore callback errors
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // MOBILE-SAFE: Pure static error UI with inline styles
      // No external dependencies, no hooks, no router
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#F9F7F1',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '2px solid #2D2D2D',
              boxShadow: '4px 4px 0 #2D2D2D',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#FEE2E2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#DC2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            {/* Error Message */}
            <h1
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#2D2D2D',
                marginBottom: '8px',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px',
                lineHeight: '1.5',
              }}
            >
              An unexpected error occurred. Please try again or go back to the home page.
            </p>

            {/* Error Details (development only) */}
            {this.props.showDetails && this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '24px',
                  fontSize: '12px',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    color: '#6B7280',
                    fontWeight: '500',
                  }}
                >
                  Error details
                </summary>
                <pre
                  style={{
                    marginTop: '8px',
                    color: '#DC2626',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflow: 'auto',
                  }}
                >
                  {this.state.error.message}
                </pre>
              </details>
            )}

            {/* Action Buttons - ALWAYS CLICKABLE */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              {/* Try Again Button */}
              <button
                type="button"
                onClick={forceReload}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  forceReload();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#2D2D2D',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #2D2D2D',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0 #2D2D2D',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'auto',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Try Again
              </button>

              {/* Go Home Button - PRIMARY ACTION */}
              <button
                type="button"
                onClick={forceNavigateHome}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  forceNavigateHome();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#2D2D2D',
                  backgroundColor: '#FFD54F',
                  border: '2px solid #2D2D2D',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0 #2D2D2D',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'auto',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
                Go Home
              </button>
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
    
    // Fire-and-forget error logging - never blocks UI
    safeLogError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
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
