import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface ErrorFallbackProps {
  error: Error;
  onRetry?: () => void;
  onGoHome?: () => void;
}
export function ErrorFallback({ error, onRetry, onGoHome }: ErrorFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };
  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
          Something went wrong
        </h3>
        <p className="mt-2 text-sm text-gray-500 text-center">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <div className="mt-6 space-y-3">
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
          <Button onClick={handleGoHome} variant="secondary" className="w-full">
            Go Home
          </Button>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer font-medium">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {error?.stack || 'No stack trace available'}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}