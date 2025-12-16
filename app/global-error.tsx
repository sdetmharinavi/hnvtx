// app/global-error.tsx
'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an external service if needed
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-red-100 dark:border-red-900/30 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Critical System Error</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Something went wrong at the application level.
            <br />
            <span className="text-xs font-mono mt-2 block bg-gray-100 dark:bg-gray-900 p-2 rounded break-all">
              {error.message || 'Unknown error occurred'}
            </span>
          </p>

          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/30"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}