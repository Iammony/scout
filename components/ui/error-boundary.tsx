'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <Card className="w-full max-w-md p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We encountered an unexpected error. Please try refreshing the page.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm">
            <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
            <code className="text-red-600 dark:text-red-400 whitespace-pre-wrap">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </code>
          </details>
        )}
      </div>
      
      <div className="flex gap-3 justify-center">
        <Button
          onClick={resetError}
          className="bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 hover:from-web3-violet-500 hover:to-web3-purple-500 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.location.href = '/'}
          className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400"
        >
          Go Home
        </Button>
      </div>
    </Card>
  </div>
);

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error tracking services like Sentry here
      console.error('Production error logged:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const ErrorFallback = this.props.fallback || DefaultErrorFallback;
      
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

export default ErrorBoundary;