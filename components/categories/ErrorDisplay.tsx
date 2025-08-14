import { Button } from "@/components/common/ui/Button";
import { Card } from "@/components/common/ui/Card";

interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <Card className="border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
      <p className="text-red-600 dark:text-red-400">
        Error loading data: {error.message}
      </p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="mt-2 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        Retry
      </Button>
    </Card>
  );
}