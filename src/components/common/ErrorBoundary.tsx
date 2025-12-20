import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logError } from '@/services/errorLoggingService';

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
    
    // Log error to database for monitoring
    logError({
      errorType: 'react_error_boundary',
      errorMessage: error.message,
      errorStack: error.stack,
      pageRoute: window.location.pathname,
      componentName: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      metadata: {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      },
    });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Something went wrong
                </h3>
                <p className="text-sm text-muted-foreground">
                  An unexpected error occurred. Please try again or go back to the home page.
                </p>
              </div>

              {this.props.showDetails && this.state.error && (
                <details className="text-left bg-muted/50 rounded-lg p-3 text-xs">
                  <summary className="cursor-pointer text-muted-foreground font-medium">
                    Error details
                  </summary>
                  <pre className="mt-2 overflow-auto text-destructive whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" size="sm" onClick={this.handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button size="sm" onClick={this.handleGoHome}>
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
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
    
    // Log error to database
    logError({
      errorType: 'react_inline_error',
      errorMessage: error.message,
      errorStack: error.stack,
      pageRoute: window.location.pathname,
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
