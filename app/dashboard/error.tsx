"use client"

// app/dashboard/error.tsx
'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/ui/Button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 rounded-full bg-red-50 p-4 dark:bg-red-900/20">
        <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
      </div>
      
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        Unable to load this section
      </h2>
      
      <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
        We encountered an error while loading this dashboard page. This might be a temporary connectivity issue.
      </p>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Full Reload
        </Button>
        
        <Button 
          variant="primary" 
          onClick={reset}
          leftIcon={<RefreshCw size={16} />}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}